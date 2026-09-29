#!/usr/bin/env bash
# Fyxzpedia Ubot manager - shared helpers. Source this file, do not execute it.

FYX_MANAGER_VERSION="1.0.0"
FYX_APP_NAME="fyxzpedia-ubot"
FYX_HOME="${FYX_HOME:-$HOME/.fyxzpedia}"
FYX_BOT_DIR="$FYX_HOME/bot"
FYX_CONFIG_DIR="$FYX_HOME/config"
FYX_SETTINGS="$FYX_CONFIG_DIR/settings.js"
FYX_RELEASE_CONF="$FYX_CONFIG_DIR/release.conf"
FYX_DATA_DIR="$FYX_HOME/data"          # session.json + dbbot.json live here (survive updates)
FYX_LOG_DIR="$FYX_HOME/logs"
FYX_BACKUP_DIR="$FYX_HOME/backups"
FYX_RELEASE_DIR="$FYX_HOME/releases"
FYX_VERSION_FILE="$FYX_HOME/version"
FYX_MANAGER_DIR="$FYX_HOME/manager"
FYX_MIN_NODE=18

# Files the bot reads/writes relative to its working directory.
# Real files live outside bot/, bot/ only holds symlinks -> updates never touch them.
FYX_LINKED_FILES=("settings.js:$FYX_SETTINGS" "session.json:$FYX_DATA_DIR/session.json" "dbbot.json:$FYX_DATA_DIR/dbbot.json")

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  C_RED=$'\033[31m'; C_GREEN=$'\033[32m'; C_YELLOW=$'\033[33m'; C_CYAN=$'\033[36m'; C_BOLD=$'\033[1m'; C_RESET=$'\033[0m'
else
  C_RED=""; C_GREEN=""; C_YELLOW=""; C_CYAN=""; C_BOLD=""; C_RESET=""
fi

info()    { printf '%s[i]%s %s\n' "$C_CYAN" "$C_RESET" "$*"; }
success() { printf '%s✓%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
warning() { printf '%s[!]%s %s\n' "$C_YELLOW" "$C_RESET" "$*" >&2; }
error()   { printf '%sERROR:%s %s\n' "$C_RED" "$C_RESET" "$*" >&2; }
die()     { error "$*"; exit 1; }
step()    { printf '\n%s[%s/%s]%s %s...\n' "$C_BOLD" "$1" "$2" "$C_RESET" "$3"; }

_rep() { local s="" i; for ((i = 0; i < $2; i++)); do s+="$1"; done; printf '%s' "$s"; }
banner() {
  local t="$1" w=38 pad l r
  pad=$((w - ${#t})); [ "$pad" -lt 0 ] && pad=0
  l=$((pad / 2)); r=$((pad - l))
  printf '%s╔%s╗\n║%*s%s%*s║\n╚%s╝%s\n' "$C_BOLD" "$(_rep '═' $w)" "$l" '' "$t" "$r" '' "$(_rep '═' $w)" "$C_RESET"
}

# ---- error handling -------------------------------------------------------
FYX_CLEANUP_PATHS=()
fyx_cleanup() {
  unset GH_TOKEN 2>/dev/null || true
  local p
  for p in "${FYX_CLEANUP_PATHS[@]:-}"; do
    if [ -n "$p" ]; then rm -rf "$p" 2>/dev/null || true; fi
  done
}
fyx_on_err() { # $1=exit code $2=line $3=failed command; failures of child scripts already printed their own message
  case "$3" in bash\ *|exec\ bash*) return 0 ;; esac
  error "Unexpected failure (exit $1) in $(basename "$0") at line $2."
}
fyx_init() {
  set -Eeuo pipefail
  trap 'fyx_on_err $? $LINENO "$BASH_COMMAND"' ERR
  trap fyx_cleanup EXIT
  trap 'echo; warning "Interrupted."; exit 130' INT TERM
  umask 077
}

# ---- interaction ----------------------------------------------------------
# FYX_NONINTERACTIVE=1 makes every yes/no question take its default answer (tests/automation).
ask_yn() { # ask_yn "Question" Y|N
  local q="$1" def="${2:-Y}" hint ans=""
  if [ "$def" = "Y" ]; then hint="[Y/n]"; else hint="[y/N]"; fi
  if [ "${FYX_NONINTERACTIVE:-0}" != "1" ]; then read -r -p "$q $hint " ans || ans=""; fi
  ans="${ans:-$def}"
  case "$ans" in [Yy]*) return 0 ;; *) return 1 ;; esac
}

# prompt_value VAR "Label" "default" required(0|1) "regex" "hint"
prompt_value() {
  local __var="$1" label="$2" def="${3:-}" req="${4:-0}" re="${5:-}" hint="${6:-}" ans
  while true; do
    if [ -n "$def" ]; then
      read -r -p "$label [$def]: " ans || die "Input closed."
      ans="${ans:-$def}"
    else
      read -r -p "$label: " ans || die "Input closed."
    fi
    if [ -z "$ans" ]; then
      if [ "$req" = "1" ]; then warning "This field is required."; continue; fi
      printf -v "$__var" '%s' ""; return 0
    fi
    if [ -n "$re" ] && ! [[ "$ans" =~ $re ]]; then warning "Invalid value. ${hint}"; continue; fi
    printf -v "$__var" '%s' "$ans"; return 0
  done
}

# prompt_secret VAR "Label" "current_value" required(0|1) "regex" "hint"   (input is not echoed)
prompt_secret() {
  local __var="$1" label="$2" cur="${3:-}" req="${4:-0}" re="${5:-}" hint="${6:-}" ans shown=""
  [ -n "$cur" ] && shown=" [Enter = keep current]"
  while true; do
    read -rsp "$label$shown: " ans || die "Input closed."
    echo
    ans="${ans:-$cur}"
    if [ -z "$ans" ]; then
      if [ "$req" = "1" ]; then warning "This field is required."; continue; fi
      printf -v "$__var" '%s' ""; return 0
    fi
    if [ -n "$re" ] && ! [[ "$ans" =~ $re ]]; then warning "Invalid format. ${hint}"; continue; fi
    printf -v "$__var" '%s' "$ans"; return 0
  done
}

# ---- environment ----------------------------------------------------------
# Real Termux has PREFIX=/data/data/com.termux/files/usr. FYX_ALLOW_NON_TERMUX=1 exists only for tests.
is_termux() {
  [ -n "${PREFIX:-}" ] && [ -d "$PREFIX" ] && { [[ "$PREFIX" == *com.termux* ]] || [ "${FYX_ALLOW_NON_TERMUX:-0}" = "1" ]; }
}
require_termux() {
  if ! is_termux; then
    error "This installer is designed for Termux."
    error "Installation aborted."
    exit 1
  fi
}
have() { command -v "$1" >/dev/null 2>&1; }
node_major() { node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0; }
manager_root() { cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/.." && pwd; }

is_installed() { [ -f "$FYX_VERSION_FILE" ] || [ -f "$FYX_BOT_DIR/index.js" ]; }
current_version() { if [ -f "$FYX_VERSION_FILE" ]; then cat "$FYX_VERSION_FILE"; else echo "unknown"; fi; }
bot_pkg_version() { # bot_pkg_version <dir>
  node -p 'try{require(process.argv[1]+"/package.json").version||""}catch(e){""}' "$1" 2>/dev/null || true
}

ensure_dirs() {
  mkdir -p "$FYX_HOME" "$FYX_CONFIG_DIR" "$FYX_DATA_DIR" "$FYX_LOG_DIR" "$FYX_BACKUP_DIR" "$FYX_RELEASE_DIR"
  chmod 700 "$FYX_HOME" "$FYX_CONFIG_DIR" "$FYX_DATA_DIR" "$FYX_BACKUP_DIR" 2>/dev/null || true
}

link_bot_files() { # (re)create symlinks bot/<file> -> persistent location
  local pair name target
  for pair in "${FYX_LINKED_FILES[@]}"; do
    name="${pair%%:*}"; target="${pair#*:}"
    if [ -e "$FYX_BOT_DIR/$name" ] && [ ! -L "$FYX_BOT_DIR/$name" ]; then
      # A real file inside a package must never override user data.
      if [ ! -e "$target" ]; then mv "$FYX_BOT_DIR/$name" "$target"; else rm -f "$FYX_BOT_DIR/$name"; fi
    fi
    ln -sfn "$target" "$FYX_BOT_DIR/$name"
  done
}

# ---- PM2 ------------------------------------------------------------------
_pm2_query() { # _pm2_query has|online
  have pm2 || return 1
  pm2 jlist 2>/dev/null | node "$(dirname "${BASH_SOURCE[0]}")/pm2-tool.js" "$1" "$FYX_APP_NAME"
}
pm2_has_process() { _pm2_query has; }
pm2_is_online()   { _pm2_query online; }

# ---- settings backup ------------------------------------------------------
backup_settings() { # prints the backup path (nothing if there is no settings.js yet)
  [ -f "$FYX_SETTINGS" ] || return 0
  mkdir -p "$FYX_BACKUP_DIR"
  local ts f
  ts="$(date +%Y-%m-%d-%H%M%S)"; f="$FYX_BACKUP_DIR/settings-$ts.js"
  cp "$FYX_SETTINGS" "$f"; chmod 600 "$f"
  if [ -f "$FYX_VERSION_FILE" ]; then cp "$FYX_VERSION_FILE" "$FYX_BACKUP_DIR/version-$ts"; fi
  printf '%s\n' "$f"
}
