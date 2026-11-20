#!/bin/bash
# Mac: same as start-app.command, through an Expo tunnel. Use it when the
# phone stays on "Opening project..." (another Wi-Fi, or a network that keeps
# devices apart). The first run asks to install @expo/ngrok: answer Y.
# ngrok, not Expo's own tunnel: that one needs an Expo account with access to
# the project and allows one tunnel per account at a time, so a second
# computer (or a session not closed yet) failed with "409".
exec bash "$(dirname "$0")/start-app.command" --tunnel ngrok
