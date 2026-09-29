#!/usr/bin/env bash
# First-time (interactive) Telegram login. PM2 cannot answer prompts, so this runs in the foreground.
ROOT="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$ROOT/scripts/lib.sh"
fyx_init

[ -f "$FYX_BOT_DIR/index.js" ] || die "Bot is not installed."
node "$ROOT/scripts/settings-tool.js" validate "$FYX_SETTINGS" --quiet || die "settings.js is invalid. Run: fyx settings"
[ -d "$FYX_BOT_DIR/node_modules" ] || die "Bot dependencies are missing. Run: bash install.sh (Repair)."
SESSION="$FYX_DATA_DIR/session.json"

if [ -s "$SESSION" ]; then
  success "A Telegram session already exists."
  ask_yn "Log in again (this replaces the saved session)?" N || exit 0
  mkdir -p "$FYX_BACKUP_DIR"; cp "$SESSION" "$FYX_BACKUP_DIR/session-$(date +%Y-%m-%d-%H%M%S).json"
  rm -f "$SESSION"
fi
if pm2_is_online; then info "Stopping the running bot for the login..."; pm2 stop "$FYX_APP_NAME" >/dev/null; fi

echo
info "Follow the prompts: phone number (+62...), login code, and 2FA password if you use one."
info "When you see '[SUCCESS] Userbot online', press CTRL+C to continue."
echo
( while [ ! -s "$SESSION" ]; do sleep 1; done; sleep 3
  printf '\n%s✓ Session saved. Press CTRL+C to finish the login step.%s\n' "$C_GREEN" "$C_RESET" ) 2>/dev/null >/dev/tty &
WATCHER=$!

cd "$FYX_BOT_DIR"
trap 'true' INT          # Ctrl+C stops node; this script must survive it
trap - ERR; set +e
node index.js; RC=$?
set -e; trap 'fyx_on_err $? $LINENO "$BASH_COMMAND"' ERR
trap 'echo; warning "Interrupted."; exit 130' INT
kill "$WATCHER" 2>/dev/null || true; wait "$WATCHER" 2>/dev/null || true

echo
if [ -s "$SESSION" ]; then chmod 600 "$SESSION" 2>/dev/null || true; success "Telegram login completed."
else error "Login was not completed (node exit code $RC). Run again: fyx login"; exit 1; fi
