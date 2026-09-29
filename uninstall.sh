#!/usr/bin/env bash
# Remove Fyxzpedia Ubot.  (also: fyx uninstall)
ROOT="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
source "$ROOT/scripts/lib.sh"
fyx_init

# Everything lives in main(): bash parses it fully before running, so it is safe
# even though this script may delete itself (when run from ~/.fyxzpedia/manager).
main() {
  is_installed || [ -d "$FYX_HOME" ] || { info "Nothing to uninstall."; return 0; }
  echo "This will remove Fyxzpedia Ubot."
  ask_yn "Continue?" N || { echo "Cancelled."; return 0; }
  local purge=0
  ask_yn "Remove configuration too?" N && purge=1

  if have pm2; then
    if pm2_has_process; then
      pm2 stop "$FYX_APP_NAME" >/dev/null 2>&1 || true
      pm2 delete "$FYX_APP_NAME" >/dev/null 2>&1 || true
      pm2 save >/dev/null 2>&1 || true
      success "PM2 process stopped and deleted."
    fi
  fi
  rm -f "$HOME/.termux/boot/fyxzpedia-ubot"
  if [ -n "${PREFIX:-}" ] && [ -L "$PREFIX/bin/fyx" ]; then rm -f "$PREFIX/bin/fyx"; fi

  if [ "$purge" = 1 ]; then
    rm -rf "$FYX_HOME"
    success "Bot and configuration removed."
  else
    rm -rf "$FYX_BOT_DIR" "$FYX_RELEASE_DIR" "$FYX_LOG_DIR" "$FYX_VERSION_FILE" "$FYX_HOME/.stopped" "$FYX_MANAGER_DIR"
    success "Bot removed."
    echo "Configuration preserved ($FYX_HOME: config/, data/, backups/)."
  fi
}
main "$@"; exit $?
