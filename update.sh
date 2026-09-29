#!/usr/bin/env bash
# Update from the private GitHub release.  Usage: update.sh [tag]      (also: fyx update)
ROOT="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
export FYX_INSTALLER_ROOT="$ROOT"
source "$ROOT/scripts/lib.sh"
source "$ROOT/scripts/deploy.sh"
fyx_init

main() {
  local want="${1:-latest}" repo pattern current latest was_online=0 b
  is_installed || die "Fyxzpedia Ubot is not installed."
  repo="$(gh_conf_get repo)"
  if [ -z "$repo" ]; then
    info "This installation uses a local package (no GitHub release configured)."
    info "To update: download the new installer zip, unzip it, run 'bash install.sh' and choose 'Update installation'."
    info "Your settings.js, Telegram session and database are always preserved."
    return 0
  fi
  pattern="$(gh_conf_get asset_pattern)"; pattern="${pattern:-fyxzpedia-ubot-*.tar.gz}"
  have curl || die "curl is required (pkg install curl)."

  echo "Checking latest release..."
  gh_prompt_token
  GH_ONLY_CHECK=1 gh_fetch_release "$repo" "$pattern" "$want"
  latest="$GH_RESULT_VERSION"; current="$(current_version)"
  echo "Current version : $current"
  echo "Latest version  : $latest"
  echo
  if [ "$want" = "latest" ] && [ "$current" != "unknown" ] && ! version_gt "$latest" "$current"; then
    success "Already up to date."; return 0
  fi
  echo "Update available."
  ask_yn "Install $latest now?" Y || { echo "Update cancelled."; return 0; }

  GH_ONLY_CHECK=0 gh_fetch_release "$repo" "$pattern" "$want"     # download + verify + extract

  echo "Backup configuration..."
  b="$(backup_settings)"; [ -n "$b" ] && success "Saved $(basename "$b")"
  if pm2_is_online; then was_online=1; pm2 stop "$FYX_APP_NAME" >/dev/null; fi

  echo "Install update..."
  deploy_bot "$GH_RESULT_DIR"
  printf '%s\n' "$GH_RESULT_VERSION" > "$FYX_VERSION_FILE"
  echo "Restore configuration..."
  link_bot_files
  success "settings.js, session and database preserved."

  if [ "$was_online" = 1 ]; then echo "Restart bot..."; bash "$ROOT/scripts/start-bot.sh"; fi
  success "Update completed."
}
main "$@"; exit $?
