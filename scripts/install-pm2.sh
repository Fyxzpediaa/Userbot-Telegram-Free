#!/usr/bin/env bash
# Ensure PM2 is installed (npm -g).
ROOT="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$ROOT/scripts/lib.sh"
fyx_init

if have pm2 && pm2 --version >/dev/null 2>&1; then
  success "PM2 found ($(pm2 --version 2>/dev/null | tail -1))"
  exit 0
fi
warning "PM2 is not installed."
ask_yn "Install PM2 now (npm install -g pm2)?" Y || { echo "Installation cancelled."; exit 1; }
info "Installing PM2 - this can take a few minutes on Termux..."
npm install -g pm2 --no-audit --no-fund --loglevel=error || die "Failed to install PM2. Check your connection and run: npm install -g pm2"
have pm2 || die "PM2 was installed but is not in PATH. Restart Termux and try again."
success "PM2 installed ($(pm2 --version 2>/dev/null | tail -1))"
