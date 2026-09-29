#!/usr/bin/env bash
# fyx logs [pm2 logs options]   e.g. fyx logs --lines 200
ROOT="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$ROOT/scripts/lib.sh"
set -u
if have pm2 && pm2_has_process; then
  if [ $# -eq 0 ]; then set -- --lines 50; fi
  exec pm2 logs "$FYX_APP_NAME" "$@"
fi
warning "PM2 process not found - showing the last saved log lines."
for f in out.log error.log; do
  [ -f "$FYX_LOG_DIR/$f" ] && { echo "== $f =="; tail -n 50 "$FYX_LOG_DIR/$f"; }
done
exit 0
