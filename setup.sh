#!/usr/bin/env bash
# Environment-only setup (no bot): checks/installs Termux packages, Node.js, npm and PM2.
ROOT="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
exec bash "$ROOT/scripts/check-dependencies.sh" all
