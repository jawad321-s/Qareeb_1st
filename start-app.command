#!/bin/bash
# Mac: double-click to open the Qareeb mobile app (same as start-app.cmd).
# Gets the latest version from GitHub, installs the libraries when they
# changed, then starts Expo. Extra arguments go to Expo (start-app-tunnel
# passes --tunnel).

# The update may rewrite this file while it runs: bash reads the whole
# function before running any of it.
main() {
  cd "$(dirname "$0")" || return 1
  bash scripts/update.sh || return 1
  bash scripts/install-libraries.sh mobile || return 1
  cd mobile || return 1
  echo
  echo "Scan the QR code with your phone. Press Ctrl+C to stop."
  echo
  npx expo start -c "$@"
}
if ! main "$@"; then echo; echo "Something went wrong. Take a screenshot of this window and send it."; read -r -p "Press Enter to close."; exit 1; fi; exit 0
