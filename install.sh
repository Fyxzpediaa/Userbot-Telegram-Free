#!/usr/bin/env bash
# Fyxzpedia Ubot - Auto Installer for Termux.   Usage: bash install.sh
ROOT="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
export FYX_INSTALLER_ROOT="$ROOT"
source "$ROOT/scripts/lib.sh"
source "$ROOT/scripts/deploy.sh"
fyx_init

TOTAL=7
SOURCE_MODE=""
BOT_VERSION=""

choose_source() {
  if [ -f "$FYX_RELEASE_CONF" ]; then SOURCE_MODE="github"; return; fi
  local def="local" pick=""
  [ -f "$ROOT/bot/index.js" ] || def="github"
  [ "$(installer_conf_get default_mode)" = "github" ] && def="github"
  if [ "${FYX_NONINTERACTIVE:-0}" != "1" ]; then
    echo "Where should the bot source come from?"
    echo "  1) Local package   (bot/ folder inside this installer)"
    echo "  2) Private GitHub release (uses YOUR own access token)"
    read -r -p "Choose [1-2] (default $([ "$def" = local ] && echo 1 || echo 2)): " pick || pick=""
    case "$pick" in 1) def="local" ;; 2) def="github" ;; esac
  fi
  SOURCE_MODE="$def"
}

deploy_from_source() {
  case "$SOURCE_MODE" in
    local)
      [ -f "$ROOT/bot/index.js" ] || die "bot/ has no bot source (index.js). Put the bot files in bot/ or use the GitHub release mode."
      deploy_bot "$ROOT/bot"
      BOT_VERSION="$(bot_pkg_version "$FYX_BOT_DIR")"
      ;;
    github)
      local repo pattern
      repo="$(gh_conf_get repo)"; [ -n "$repo" ] || repo="$(installer_conf_get github.repo)"
      pattern="$(gh_conf_get asset_pattern)"; [ -n "$pattern" ] || pattern="$(installer_conf_get github.asset_pattern)"
      pattern="${pattern:-fyxzpedia-ubot-*.tar.gz}"
      prompt_value repo "GitHub repository (owner/repo)" "$repo" 1 '^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$' "Format: owner/repo"
      gh_prompt_token
      gh_fetch_release "$repo" "$pattern" latest
      deploy_bot "$GH_RESULT_DIR"
      BOT_VERSION="$GH_RESULT_VERSION"
      gh_conf_save "$repo" "$pattern"      # repo + pattern only - never the token
      unset GH_TOKEN
      ;;
  esac
  printf '%s\n' "${BOT_VERSION:-unknown}" > "$FYX_VERSION_FILE"
  success "Bot ${BOT_VERSION:-} installed in $FYX_BOT_DIR"
}

ensure_settings() {
  if [ -f "$FYX_SETTINGS" ] && node "$ROOT/scripts/settings-tool.js" validate "$FYX_SETTINGS" --quiet; then
    node "$ROOT/scripts/settings-tool.js" validate "$FYX_SETTINGS" || true
    success "Existing settings.js kept."
  elif [ -f "$FYX_SETTINGS" ]; then
    warning "Existing settings.js is invalid - let's reconfigure it."
    bash "$ROOT/scripts/create-settings.sh" --reconfigure
  else
    bash "$ROOT/scripts/create-settings.sh"
  fi
}

login_and_start() {
  if [ ! -s "$FYX_DATA_DIR/session.json" ]; then
    echo "The first Telegram login is interactive and must happen before the bot can run in the background."
    if ask_yn "Log in to Telegram now?" Y; then bash "$ROOT/scripts/login.sh"
    else info "Skipped. Run 'fyx login' later, then 'fyx start'."; return 0; fi
  fi
  bash "$ROOT/scripts/start-bot.sh"
  if ask_yn "Enable autostart after phone reboot (requires the Termux:Boot app)?" N; then bash "$ROOT/boot.sh" enable; fi
}

finish() {
  echo
  banner "INSTALLATION COMPLETE"
  echo "  fyx status     check the bot"
  echo "  fyx logs       watch logs"
  echo "  fyx settings   change configuration"
  echo "  fyx help       all commands"
  command -v fyx >/dev/null 2>&1 || warning "'fyx' is not in PATH yet - open a new Termux session."
}

fresh_install() {
  step 1 $TOTAL "Checking Termux";  bash "$ROOT/scripts/check-dependencies.sh" termux; bash "$ROOT/scripts/check-dependencies.sh" tools
  step 2 $TOTAL "Checking Node.js"; bash "$ROOT/scripts/check-dependencies.sh" node
  step 3 $TOTAL "Checking npm";     bash "$ROOT/scripts/check-dependencies.sh" npm
  step 4 $TOTAL "Checking PM2";     bash "$ROOT/scripts/install-pm2.sh"
  step 5 $TOTAL "Preparing bot"
  ensure_dirs; install_manager "$ROOT"; success "Command 'fyx' registered"
  choose_source; deploy_from_source
  step 6 $TOTAL "Creating settings.js"; ensure_settings
  step 7 $TOTAL "Starting bot";         login_and_start
  finish
}

repair_install() {
  step 1 3 "Checking environment"
  bash "$ROOT/scripts/check-dependencies.sh" all
  step 2 3 "Repairing files"
  ensure_dirs; install_manager "$ROOT"
  if [ -f "$FYX_BOT_DIR/index.js" ] && [ -d "$FYX_BOT_DIR/node_modules" ]; then
    link_bot_files; success "Bot files are intact."
  else
    warning "Bot files or dependencies are missing - reinstalling them."
    if [ -f "$FYX_RELEASE_CONF" ]; then SOURCE_MODE="github"; else SOURCE_MODE="local"; fi
    deploy_from_source
  fi
  step 3 3 "Checking configuration"
  ensure_settings
  if ! pm2_is_online && [ -s "$FYX_DATA_DIR/session.json" ] && [ ! -f "$FYX_HOME/.stopped" ]; then bash "$ROOT/scripts/start-bot.sh"; fi
  success "Repair finished."
}

update_install() {
  if [ -f "$FYX_RELEASE_CONF" ]; then exec bash "$FYX_MANAGER_DIR/update.sh"; fi
  [ -f "$ROOT/bot/index.js" ] || die "This installer contains no bot/ source. Use a newer installer package."
  info "Updating from the local package (settings, session and database are preserved)..."
  local was_online=0
  b="$(backup_settings)"; [ -n "$b" ] && info "Settings backed up: $(basename "$b")"
  if pm2_is_online; then was_online=1; pm2 stop "$FYX_APP_NAME" >/dev/null; fi
  install_manager "$ROOT"
  SOURCE_MODE="local"; deploy_from_source
  if [ "$was_online" = 1 ]; then bash "$ROOT/scripts/start-bot.sh"; fi
  success "Update completed."
}

main() {
  echo; banner "FYXZPEDIA UBOT INSTALLER"
  require_termux
  if is_installed; then
    echo
    warning "Existing installation detected (version $(current_version))."
    local act="${FYX_INSTALL_ACTION:-}"
    if [ -z "$act" ]; then
      cat <<MENU
  1. Repair installation
  2. Update installation
  3. Reconfigure
  4. Cancel
MENU
      read -r -p "Choose [1-4]: " act || act=4
    fi
    case "$act" in
      1|repair)      repair_install ;;
      2|update)      update_install ;;
      3|reconfigure) bash "$ROOT/scripts/create-settings.sh" --reconfigure
                     pm2_is_online && ask_yn "Restart the bot to apply the changes?" Y && bash "$ROOT/scripts/restart-bot.sh" || true ;;
      *)             echo "Installation cancelled."; exit 0 ;;
    esac
    exit 0
  fi
  fresh_install
}
main "$@"; exit $?
