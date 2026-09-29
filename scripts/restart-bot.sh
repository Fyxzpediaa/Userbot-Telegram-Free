#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$ROOT/scripts/lib.sh"
fyx_init
have pm2 || die "PM2 is not installed."
if pm2_has_process; then
  echo "Restarting Fyxzpedia Ubot..."
  pm2 restart "$FYX_APP_NAME" --update-env >/dev/null
  rm -f "$FYX_HOME/.stopped"
  pm2 save >/dev/null 2>&1 || true
  sleep "${FYX_START_WAIT:-3}"
  if pm2_is_online; then success "Bot restarted."; else die "Bot is not online after restart. Check: fyx logs"; fi
else
  exec bash "$ROOT/scripts/start-bot.sh"
fi
