#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$ROOT/scripts/lib.sh"
fyx_init
have pm2 || die "PM2 is not installed."
touch "$FYX_HOME/.stopped"
if pm2_has_process; then
  pm2 stop "$FYX_APP_NAME" >/dev/null
  pm2 save >/dev/null 2>&1 || true
  success "Fyxzpedia Ubot stopped."
else
  info "Fyxzpedia Ubot is not running."
fi
