#!/bin/bash
# Mac: same as start-app.command, through an Expo tunnel. Use it when the
# phone stays on "Opening project..." (another Wi-Fi, or a network that keeps
# devices apart). The first run asks to install @expo/ngrok: answer Y.
exec bash "$(dirname "$0")/start-app.command" --tunnel
