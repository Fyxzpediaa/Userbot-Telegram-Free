#!/usr/bin/env bash
# fyx settings
ROOT="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$ROOT/scripts/lib.sh"
fyx_init
TOOL="$ROOT/scripts/settings-tool.js"

validate() { node "$TOOL" validate "$FYX_SETTINGS"; }
offer_restart() { if pm2_is_online; then ask_yn "Restart the bot to apply the changes?" Y && bash "$ROOT/scripts/restart-bot.sh" || true; fi; }

edit_settings() {
  [ -f "$FYX_SETTINGS" ] || { warning "settings.js does not exist yet - use Reconfigure."; return 0; }
  local ed=""
  if have nano; then ed=nano
  elif ask_yn "nano is not installed. Install it now (pkg install nano -y)?" Y; then pkg install nano -y && ed=nano
  elif have vi; then ed=vi; fi
  [ -n "$ed" ] || { warning "No editor available."; return 0; }
  local snap; snap="$(backup_settings)"
  "$ed" "$FYX_SETTINGS" || true
  if validate; then success "settings.js is valid."; offer_restart
  else
    error "settings.js is invalid."
    if ask_yn "Restore the version from before your edit?" Y; then cp "$snap" "$FYX_SETTINGS"; success "Restored $(basename "$snap")"; fi
  fi
}

restore_settings() {
  local files=() f i=1 pick
  mapfile -t files < <(ls -1t "$FYX_BACKUP_DIR"/settings-*.js 2>/dev/null || true)
  [ ${#files[@]} -gt 0 ] || { warning "No backups found."; return 0; }
  echo "Available backups (newest first):"
  for f in "${files[@]}"; do printf '  %2d) %s\n' "$i" "$(basename "$f")"; i=$((i + 1)); done
  read -r -p "Restore which one? [1-${#files[@]}, Enter = cancel]: " pick || pick=""
  [ -n "$pick" ] || return 0
  [[ "$pick" =~ ^[0-9]+$ ]] && [ "$pick" -ge 1 ] && [ "$pick" -le ${#files[@]} ] || { warning "Invalid choice."; return 0; }
  local sel="${files[$((pick - 1))]}" snap=""
  snap="$(backup_settings)"
  if node "$TOOL" validate "$sel" --quiet; then
    cp "$sel" "$FYX_SETTINGS"; chmod 600 "$FYX_SETTINGS"; success "Restored $(basename "$sel")"; offer_restart
  else
    error "That backup is not a valid settings.js - nothing was changed."
  fi
}

while true; do
  echo; banner "FYXZPEDIA SETTINGS"
  cat <<MENU
  1. Edit settings
  2. Reconfigure
  3. Validate settings
  4. Backup settings
  5. Restore settings
  6. Exit
MENU
  read -r -p "Choose [1-6]: " ch || exit 0
  case "$ch" in
    1) edit_settings ;;
    2) bash "$ROOT/scripts/create-settings.sh" --reconfigure && offer_restart ;;
    3) [ -f "$FYX_SETTINGS" ] && { validate && success "Settings are valid." || true; } || warning "settings.js does not exist." ;;
    4) b="$(backup_settings)"; if [ -n "$b" ]; then success "Backup saved: $b"; else warning "Nothing to back up."; fi ;;
    5) restore_settings ;;
    6|q|Q) exit 0 ;;
    *) warning "Please choose 1-6." ;;
  esac
done
