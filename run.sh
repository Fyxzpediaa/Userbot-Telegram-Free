#!/usr/bin/env bash
# Start the bot (never creates a duplicate PM2 process).
exec bash "$(dirname "$(readlink -f "$0")")/scripts/start-bot.sh" "$@"
