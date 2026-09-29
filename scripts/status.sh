#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$ROOT/scripts/lib.sh"
set -u
banner "FYXZPEDIA UBOT STATUS"
if ! is_installed; then warning "Not installed. Run: bash install.sh"; exit 1; fi
echo "Manager version : $FYX_MANAGER_VERSION"
echo "Bot version     : $(current_version)"
echo "Install dir     : $FYX_HOME"
if [ -f "$FYX_SETTINGS" ] && node "$ROOT/scripts/settings-tool.js" validate "$FYX_SETTINGS" --quiet 2>/dev/null; then echo "settings.js     : valid"
elif [ -f "$FYX_SETTINGS" ]; then echo "settings.js     : INVALID (run: fyx settings)"; else echo "settings.js     : missing"; fi
if [ -s "$FYX_DATA_DIR/session.json" ]; then echo "Telegram login  : session saved"; else echo "Telegram login  : not logged in (run: fyx login)"; fi
if have pm2; then echo "PM2 process     : $(pm2 jlist 2>/dev/null | node "$ROOT/scripts/pm2-tool.js" info "$FYX_APP_NAME")"; else echo "PM2 process     : PM2 not installed"; fi
if [ -f "$HOME/.termux/boot/fyxzpedia-ubot" ]; then echo "Boot autostart  : enabled (needs the Termux:Boot app)"; else echo "Boot autostart  : disabled (enable: bash $FYX_MANAGER_DIR/boot.sh)"; fi
