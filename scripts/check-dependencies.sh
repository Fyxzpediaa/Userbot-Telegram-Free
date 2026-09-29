#!/usr/bin/env bash
# Usage: check-dependencies.sh termux|node|npm|tools|pm2|all
ROOT="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
source "$ROOT/scripts/lib.sh"
fyx_init

pkg_install() { # pkg_install <termux packages...>
  have pkg || die "'pkg' not found - this does not look like Termux."
  pkg install -y "$@" || { warning "pkg install failed - refreshing package lists and retrying..."; pkg update -y && pkg install -y "$@"; }
}

check_termux() { require_termux; success "Termux detected ($PREFIX)"; }

check_node() {
  if have node && [ "$(node_major)" -ge "$FYX_MIN_NODE" ]; then success "Node.js $(node -v)"; return; fi
  if have node; then error "Node.js $(node -v) is too old (need >= v$FYX_MIN_NODE)."; else error "Node.js is not installed."; fi
  ask_yn "Install Node.js now?" Y || { echo "Installation cancelled."; exit 1; }
  pkg_install nodejs-lts || pkg_install nodejs
  have node && [ "$(node_major)" -ge "$FYX_MIN_NODE" ] || die "Node.js >= v$FYX_MIN_NODE is still unavailable."
  success "Node.js $(node -v) installed"
}

check_npm() {
  if have npm; then success "npm $(npm -v)"; return; fi
  error "npm is not installed."
  ask_yn "Install npm now?" Y || { echo "Installation cancelled."; exit 1; }
  pkg_install nodejs-lts || pkg_install nodejs
  have npm || die "npm is still unavailable."
  success "npm $(npm -v) installed"
}

check_tools() { # curl + tar are needed for GitHub releases; sha256sum for verification
  local missing=() t
  for t in curl tar sha256sum; do have "$t" || missing+=("$t"); done
  [ ${#missing[@]} -eq 0 ] && return
  warning "Missing tools: ${missing[*]}"
  ask_yn "Install them now?" Y || { echo "Installation cancelled."; exit 1; }
  pkg_install curl tar coreutils
}

case "${1:-all}" in
  termux) check_termux ;;
  node)   check_node ;;
  npm)    check_npm ;;
  tools)  check_tools ;;
  pm2)    bash "$ROOT/scripts/install-pm2.sh" ;;
  all)    check_termux; check_tools; check_node; check_npm; bash "$ROOT/scripts/install-pm2.sh" ;;
  *)      die "Unknown check '$1'" ;;
esac
