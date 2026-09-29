#!/usr/bin/env bash
# Interactive creation / reconfiguration of ~/.fyxzpedia/config/settings.js
# Usage: create-settings.sh [--reconfigure]
ROOT="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
# shellcheck source=lib.sh
source "$ROOT/scripts/lib.sh"
fyx_init

MODE="create"; [ "${1:-}" = "--reconfigure" ] && MODE="reconfigure"
TEMPLATE="$ROOT/config/settings.template.js"
TOOL="$ROOT/scripts/settings-tool.js"
[ -f "$TEMPLATE" ] || die "Template not found: $TEMPLATE"
have node || die "Node.js is required."
ensure_dirs

if [ -f "$FYX_SETTINGS" ] && [ "$MODE" = "create" ]; then
  info "settings.js already exists - keeping it (use 'fyx settings' to change it)."
  exit 0
fi

# Current values become the defaults (Enter keeps them). Order = ALL_KEYS in settings-tool.js
cur=()
if [ -f "$FYX_SETTINGS" ]; then mapfile -d '' -t cur < <(node "$TOOL" read "$FYX_SETTINGS" || true); fi
c() { printf '%s' "${cur[$1]:-}"; }

DEF_NAME="$(c 0)"; DEF_NAME="${DEF_NAME:-SimpleUserBot}"
DEF_MENU="$(c 6)"; DEF_MENU="${DEF_MENU:-https://files.catbox.moe/1zwf01.jpg}"
DEF_GW="$(c 8)";   DEF_GW="${DEF_GW:-https://fyxzpedia.com/api}"
DEF_VER="$(c 13)"

echo
banner "BOT CONFIGURATION"
echo "Press Enter to accept the value in [brackets]. Secret input is hidden."
echo

prompt_value S_name "Bot Name" "$DEF_NAME" 1
prompt_value S_id_owner "Owner Telegram ID (numeric, see @userinfobot)" "$(c 3)" 1 '^[0-9]{5,15}$' "Digits only."
prompt_value S_api_id "API ID (my.telegram.org)" "$(c 1)" 1 '^[0-9]{3,12}$' "Digits only."
prompt_secret S_api_hash "API Hash" "$(c 2)" 1 '^[0-9a-fA-F]{32}$' "Expected 32 hex characters."
prompt_secret S_bot_token "Bot Token (@BotFather, optional - button menu)" "$(c 4)" 0 '^[0-9]{6,12}:[A-Za-z0-9_-]{30,}$' "Expected 123456:ABC..."
if [ -n "$S_bot_token" ]; then
  prompt_value S_botUsername "Bot Username without @" "$(c 5)" 1 '^@?[A-Za-z][A-Za-z0-9_]{3,31}$' "5-32 chars, letters/digits/_"
  S_botUsername="${S_botUsername#@}"
else
  S_botUsername=""
fi
prompt_value S_menuImage "Menu image URL" "$DEF_MENU" 0 '^https?://' "Must start with http(s)://"
prompt_value S_fyxzgatewayBaseUrl "Server API URL (payment gateway)" "$DEF_GW" 0 '^https?://' "Must start with http(s)://"
prompt_secret S_fyxzgatewayApiKey "Server API Key (optional)" "$(c 7)" 0
prompt_value S_qrisImage "QRIS image URL (optional)" "$(c 9)" 0 '^https?://' "Must start with http(s)://"
prompt_value S_pay_dana "DANA number" "${cur[10]:--}" 0
prompt_value S_pay_gopay "GoPay number" "${cur[11]:--}" 0
prompt_value S_pay_ovo "OVO number" "${cur[12]:--}" 0

BOT_VER="$(bot_pkg_version "$FYX_BOT_DIR")"
[ -z "$BOT_VER" ] && BOT_VER="$(bot_pkg_version "$ROOT/bot")"
S_version="${BOT_VER:-${DEF_VER:-2.0.0}}"

NEW="$FYX_CONFIG_DIR/.settings.new.js"
FYX_CLEANUP_PATHS+=("$NEW")

# Secrets travel only via the environment of this one command - never via argv.
(
  export FYX_S_name="$S_name" FYX_S_api_id="$S_api_id" FYX_S_api_hash="$S_api_hash" FYX_S_id_owner="$S_id_owner" \
    FYX_S_bot_token="$S_bot_token" FYX_S_botUsername="$S_botUsername" FYX_S_menuImage="$S_menuImage" \
    FYX_S_fyxzgatewayApiKey="$S_fyxzgatewayApiKey" FYX_S_fyxzgatewayBaseUrl="$S_fyxzgatewayBaseUrl" \
    FYX_S_qrisImage="$S_qrisImage" FYX_S_payment_dana="$S_pay_dana" FYX_S_payment_gopay="$S_pay_gopay" \
    FYX_S_payment_ovo="$S_pay_ovo" FYX_S_version="$S_version"
  node "$TOOL" render "$TEMPLATE" "$NEW"
)
unset S_api_hash S_bot_token S_fyxzgatewayApiKey

echo
if ! node --check "$NEW" 2>/dev/null || ! node "$TOOL" validate "$NEW"; then
  error "settings.js is invalid."
  error "Installation aborted."
  [ -f "$FYX_SETTINGS" ] && info "Your previous settings.js was left untouched."
  exit 1
fi

if [ -f "$FYX_SETTINGS" ]; then b="$(backup_settings)"; info "Previous settings backed up: $(basename "$b")"; fi
chmod 600 "$NEW"
mv -f "$NEW" "$FYX_SETTINGS"
success "settings.js written to $FYX_SETTINGS"
