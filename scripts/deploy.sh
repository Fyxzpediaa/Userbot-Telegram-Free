#!/usr/bin/env bash
# Deployment helpers: manager install, bot deploy (with rollback), private GitHub release download.
# Source after lib.sh. Requires fyx_init to have been called.

version_gt() { [ "$1" != "$2" ] && [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | tail -1)" = "$1" ]; }

# ---- manager ---------------------------------------------------------------
install_manager() { # copy installer scripts to ~/.fyxzpedia/manager and register `fyx`
  local root="$1"
  if [ "$root" != "$FYX_MANAGER_DIR" ]; then
    rm -rf "$FYX_MANAGER_DIR.new"
    mkdir -p "$FYX_MANAGER_DIR.new"
    (cd "$root" && tar --exclude=./bot --exclude=./.git --exclude='*.zip' -cf - .) | tar -xf - -C "$FYX_MANAGER_DIR.new"
    rm -rf "$FYX_MANAGER_DIR"
    mv "$FYX_MANAGER_DIR.new" "$FYX_MANAGER_DIR"
  fi
  chmod +x "$FYX_MANAGER_DIR"/*.sh "$FYX_MANAGER_DIR"/scripts/*.sh "$FYX_MANAGER_DIR"/bin/fyx "$FYX_MANAGER_DIR"/tools/*.sh 2>/dev/null || true
  mkdir -p "${PREFIX:?PREFIX not set}/bin"
  ln -sfn "$FYX_MANAGER_DIR/bin/fyx" "$PREFIX/bin/fyx"
}

# ---- bot -------------------------------------------------------------------
npm_install_bot() { # npm_install_bot <dir>
  info "Installing bot dependencies (can take several minutes on Termux)..."
  (cd "$1" && { npm install --omit=dev --no-audit --no-fund --loglevel=error || { warning "npm install failed, retrying once..."; npm install --omit=dev --no-audit --no-fund --loglevel=error; }; })
}

prune_old() { # prune_old <glob-dir> <pattern> <keep>
  local d="$1" pat="$2" keep="$3"
  # shellcheck disable=SC2012
  { ls -1t "$d"/$pat 2>/dev/null || true; } | tail -n +"$((keep + 1))" | while IFS= read -r f; do rm -rf "$f"; done
}

# deploy_bot <src_dir> : atomically replaces ~/.fyxzpedia/bot, keeps settings/session/db (symlinked), rolls back on failure
deploy_bot() {
  local src="$1" stage old ts oldver
  [ -f "$src/index.js" ] && [ -f "$src/package.json" ] || die "Package is not a valid bot (index.js / package.json missing)."
  ensure_dirs
  ts="$(date +%Y-%m-%d-%H%M%S)"
  stage="$FYX_HOME/.stage-$$"; old="$FYX_HOME/.old-$$"
  FYX_CLEANUP_PATHS+=("$stage" "$old")
  rm -rf "$stage" "$old"; mkdir -p "$stage"
  (cd "$src" && tar --exclude=./node_modules --exclude=./settings.js --exclude=./session.json --exclude=./dbbot.json \
      --exclude='*.bak' --exclude=./.gitkeep -cf - .) | tar -xf - -C "$stage"

  if [ -d "$FYX_BOT_DIR" ]; then
    oldver="$(current_version)"
    (cd "$FYX_BOT_DIR" && tar --exclude=./node_modules --exclude=./settings.js --exclude=./session.json --exclude=./dbbot.json \
        -czf "$FYX_BACKUP_DIR/bot-$oldver-$ts.tar.gz" .) || warning "Could not back up the previous bot source."
    mv "$FYX_BOT_DIR" "$old"
  fi
  mv "$stage" "$FYX_BOT_DIR"

  rollback() {
    error "Deployment failed - restoring the previous bot."
    rm -rf "$FYX_BOT_DIR"
    if [ -d "$old" ]; then mv "$old" "$FYX_BOT_DIR"; fi
    return 1
  }

  if [ -d "$old/node_modules" ] && cmp -s "$old/package.json" "$FYX_BOT_DIR/package.json"; then
    mv "$old/node_modules" "$FYX_BOT_DIR/node_modules"
    success "Dependencies unchanged - reusing node_modules"
  else
    npm_install_bot "$FYX_BOT_DIR" || { rollback; die "npm install failed. Nothing was changed."; }
  fi
  link_bot_files
  rm -rf "$old"
  prune_old "$FYX_BACKUP_DIR" 'bot-*.tar.gz' 3
  prune_old "$FYX_BACKUP_DIR" 'settings-*.js' 15
}

# ---- private GitHub release ------------------------------------------------
GH_API="${FYX_GH_API:-https://api.github.com}"   # override only for GitHub Enterprise / testing
gh_conf_get() { [ -f "$FYX_RELEASE_CONF" ] && sed -n "s/^$1=//p" "$FYX_RELEASE_CONF" | head -1 || true; }
gh_conf_save() { # gh_conf_save repo pattern   (no token, ever)
  printf 'repo=%s\nasset_pattern=%s\n' "$1" "$2" > "$FYX_RELEASE_CONF"; chmod 600 "$FYX_RELEASE_CONF"
}
installer_conf_get() { # installer_conf_get <path.in.json> from optional config/config.json shipped by the distributor
  local f="${FYX_INSTALLER_ROOT:-}/config/config.json"
  [ -f "$f" ] || return 0
  node -p 'try{let v=require(process.argv[1]);for(const k of process.argv[2].split("."))v=v[k];v==null?"":String(v)}catch(e){""}' "$f" "$1" 2>/dev/null || true
}

gh_prompt_token() {
  if [ -n "${GH_TOKEN:-}" ]; then info "Using GH_TOKEN from the environment."; export GH_TOKEN; return; fi
  echo "A GitHub Personal Access Token with read access to the repo (Contents: read) is required."
  echo "It is used only for this run: it is not saved anywhere and is cleared afterwards."
  local t
  prompt_secret t "GitHub Personal Access Token" "" 1 '^[A-Za-z0-9_]{20,255}$' "Paste the token exactly (letters, digits, underscores)."
  GH_TOKEN="$t"; export GH_TOKEN; unset t
}

# Token goes to curl through stdin config -> not visible in `ps`, not in shell history, not in files.
gh_curl() { printf 'header = "Authorization: Bearer %s"\n' "$GH_TOKEN" | curl -K - --fail --silent --show-error --location \
    --retry 2 --connect-timeout 20 -H "X-GitHub-Api-Version: 2022-11-28" "$@"; }

# gh_fetch_release <repo> <pattern> <tag|latest>  -> sets GH_RESULT_DIR (extracted source) and GH_RESULT_VERSION
gh_fetch_release() {
  local repo="$1" pattern="$2" want="${3:-latest}" work json url line tag aid aname sid sname pkg sumf expected actual top
  [[ "$repo" =~ ^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$ ]] || die "Invalid repository '$repo' (expected owner/repo)."
  work="$(mktemp -d "$FYX_RELEASE_DIR/.dl-XXXXXX")"; FYX_CLEANUP_PATHS+=("$work")
  json="$work/release.json"
  if [ "$want" = "latest" ]; then url="$GH_API/repos/$repo/releases/latest"
  else url="$GH_API/repos/$repo/releases/tags/$want"; fi
  info "Checking release on GitHub..."
  gh_curl -H "Accept: application/vnd.github+json" -o "$json" "$url" \
    || die "Could not read the release. Check the repository name, your token permissions and your connection."
  line="$(node "$FYX_INSTALLER_ROOT/scripts/release-tool.js" parse "$json" "$pattern")" || die "No matching package asset ('$pattern') in the release."
  IFS=$'\t' read -r tag aid aname sid sname <<<"$line"
  GH_RESULT_VERSION="${tag#v}"
  [[ "$GH_RESULT_VERSION" =~ ^[0-9A-Za-z._-]+$ ]] || die "Unexpected release tag."
  info "Release: $tag  (asset: $aname)"
  if [ "${GH_ONLY_CHECK:-0}" = "1" ]; then return 0; fi

  pkg="$work/$aname"
  info "Downloading package..."
  gh_curl -H "Accept: application/octet-stream" -o "$pkg" "$GH_API/repos/$repo/releases/assets/$aid" \
    || die "Download failed."

  info "Verifying package..."
  if [ -n "$sid" ]; then
    sumf="$work/checksum.txt"
    gh_curl -H "Accept: application/octet-stream" -o "$sumf" "$GH_API/repos/$repo/releases/assets/$sid" || die "Could not download the checksum file."
    expected="$(awk -v n="$aname" '{f=$2; sub(/^\*/,"",f)} f==n {print tolower($1); exit}' "$sumf")"
    [ -n "$expected" ] || expected="$(grep -Eo '[A-Fa-f0-9]{64}' "$sumf" | head -1 | tr 'A-F' 'a-f' || true)"
    actual="$(sha256sum "$pkg" | awk '{print tolower($1)}')"
    if [ -z "$expected" ] || [ "$expected" != "$actual" ]; then
      error "Package verification failed."
      error "The downloaded package will not be installed."
      exit 1
    fi
    success "SHA256 checksum OK"
  else
    warning "This release publishes no SHA256 checksum - the package cannot be verified."
    ask_yn "Install it anyway?" N || { error "The unverified package will not be installed."; exit 1; }
  fi

  # Reject absolute paths / path traversal before extracting anything.
  if tar -tzf "$pkg" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then die "Package contains unsafe paths - aborting."; fi
  mkdir -p "$work/x"
  tar -xzf "$pkg" -C "$work/x" || die "Could not extract the package."
  mkdir -p "$FYX_RELEASE_DIR"
  cp -f "$pkg" "$FYX_RELEASE_DIR/$aname"; chmod 600 "$FYX_RELEASE_DIR/$aname"
  prune_old "$FYX_RELEASE_DIR" '*.tar.gz' 3

  if [ -f "$work/x/index.js" ]; then GH_RESULT_DIR="$work/x"
  else
    top="$(find "$work/x" -mindepth 1 -maxdepth 1 -type d | head -1)"
    [ -n "$top" ] && [ -f "$top/index.js" ] || die "The package does not contain a bot (index.js not found)."
    GH_RESULT_DIR="$top"
  fi
}
