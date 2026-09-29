#!/usr/bin/env bash
# Termux autostart helper.  Usage: boot.sh [enable|disable|status]
# Requires the separate "Termux:Boot" app (install it from the same source as Termux and open it once).
# Termux has no systemd; Termux:Boot runs scripts from ~/.termux/boot/ after the phone boots.
ROOT="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
source "$ROOT/scripts/lib.sh"
fyx_init
BOOT_DIR="$HOME/.termux/boot"; BOOT_FILE="$BOOT_DIR/fyxzpedia-ubot"
case "${1:-enable}" in
  enable)
    require_termux
    mkdir -p "$BOOT_DIR" "$FYX_LOG_DIR"
    cat > "$BOOT_FILE" <<SCRIPT
#!$PREFIX/bin/bash
export PATH="$PREFIX/bin:\$PATH"
command -v termux-wake-lock >/dev/null 2>&1 && termux-wake-lock
"$FYX_MANAGER_DIR/bin/fyx" start --boot >> "$FYX_LOG_DIR/boot.log" 2>&1
SCRIPT
    chmod 700 "$BOOT_FILE"
    success "Boot script written: $BOOT_FILE"
    warning "It only runs if the Termux:Boot app is installed and has been opened at least once."
    warning "Also set Termux battery usage to 'Unrestricted' - Android may still stop the process."
    ;;
  disable) rm -f "$BOOT_FILE"; success "Boot autostart disabled." ;;
  status)  if [ -f "$BOOT_FILE" ]; then echo "enabled ($BOOT_FILE)"; else echo "disabled"; fi ;;
  *) die "Usage: boot.sh [enable|disable|status]" ;;
esac
