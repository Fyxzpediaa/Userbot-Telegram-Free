#!/usr/bin/env bash
# OPTIONAL, run by the distributor BEFORE zipping (needs network for npx). Not used by the installer itself.
# Output goes to ./bot-obfuscated - inspect and test it, then replace bot/ with it.
# Obfuscation only raises the effort of reverse engineering; it is NOT protection. Keep real secrets/logic server-side.
set -Eeuo pipefail
ROOT="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
OUT="$ROOT/bot-obfuscated"
[ -f "$ROOT/bot/index.js" ] || { echo "ERROR: bot/index.js not found." >&2; exit 1; }
command -v npx >/dev/null || { echo "ERROR: npx (Node.js) is required." >&2; exit 1; }
rm -rf "$OUT"; cp -a "$ROOT/bot" "$OUT"
# settings.js is never shipped inside bot/ and must stay plain text (the bot edits menuImage in it with a regex).
npx --yes javascript-obfuscator "$OUT" --output "$OUT" --compact true --string-array true \
  --string-array-threshold 0.75 --self-defending false --exclude "node_modules"
fail=0
while IFS= read -r f; do node --check "$f" || { echo "Syntax error after obfuscation: $f" >&2; fail=1; }; done < <(find "$OUT" -name '*.js' -not -path '*/node_modules/*')
[ "$fail" = 0 ] || { echo "ERROR: obfuscated output is broken - do NOT ship it." >&2; exit 1; }
echo "Done: $OUT  (test it before replacing bot/)"
