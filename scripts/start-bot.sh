#!/usr/bin/env bash
# Start the bot under PM2 without ever creating a duplicate process.  Usage: start-bot.sh [--boot]
ROOT="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$ROOT/scripts/lib.sh"
fyx_init

BOOT=0; [ "${1:-}" = "--boot" ] && BOOT=1
STOPPED_MARK="$FYX_HOME/.stopped"
# After an explicit `fyx stop`, do not resurrect the bot at phone boot.
if [ "$BOOT" = "1" ] && [ -f "$STOPPED_MARK" ]; then info "Bot was stopped manually - not auto-starting."; exit 0; fi

is_installed && [ -f "$FYX_BOT_DIR/index.js" ] || die "Fyxzpedia Ubot is not installed. Run: bash install.sh"
have pm2 || die "PM2 is not installed. Run: bash $FYX_MANAGER_DIR/scripts/install-pm2.sh"
[ -f "$FYX_SETTINGS" ] || die "settings.js not found. Run: fyx settings"
node "$ROOT/scripts/settings-tool.js" validate "$FYX_SETTINGS" --quiet || { error "settings.js is invalid - the bot will not be started."; error "Fix it with: fyx settings"; exit 1; }
[ -d "$FYX_BOT_DIR/node_modules" ] || die "Bot dependencies are missing. Run: bash install.sh (Repair)."
if [ ! -s "$FYX_DATA_DIR/session.json" ]; then
  error "No Telegram session yet. The first login is interactive and cannot run under PM2."
  error "Run once:  fyx login"
  exit 1
fi

if pm2_is_online; then
  echo "Fyxzpedia Ubot is already running."
  rm -f "$STOPPED_MARK"
  exit 0
fi

echo "Starting Fyxzpedia Ubot..."
have termux-wake-lock && termux-wake-lock || true
# A registered-but-stopped entry is replaced so cwd/log paths are always current (no duplicates).
if pm2_has_process; then pm2 delete "$FYX_APP_NAME" >/dev/null 2>&1 || true; fi
mkdir -p "$FYX_LOG_DIR"
pm2 start "$FYX_BOT_DIR/index.js" --name "$FYX_APP_NAME" --cwd "$FYX_BOT_DIR" \
  --output "$FYX_LOG_DIR/out.log" --error "$FYX_LOG_DIR/error.log" --time --restart-delay 5000 >/dev/null
pm2 save >/dev/null 2>&1 || true
rm -f "$STOPPED_MARK"

sleep "${FYX_START_WAIT:-4}"
if pm2_is_online; then success "Bot started successfully."
else
  error "The bot did not stay online. Recent errors:"
  tail -n 15 "$FYX_LOG_DIR/error.log" 2>/dev/null || true
  error "See more with: fyx logs"
  exit 1
fi
