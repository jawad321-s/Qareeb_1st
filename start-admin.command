#!/bin/bash
# Mac: double-click to open the Qareeb admin dashboard (same as
# start-admin.cmd). Gets the latest version from GitHub, installs the
# libraries when they changed, then serves it on http://localhost:3000 and
# opens the browser.

# The update may rewrite this file while it runs: bash reads the whole
# function before running any of it.
main() {
  cd "$(dirname "$0")" || return 1
  bash scripts/update.sh || return 1
  bash scripts/install-libraries.sh admin || return 1
  cd admin || return 1
  echo
  echo "The dashboard opens at http://localhost:3000 in a few seconds. Press Ctrl+C to stop."
  echo
  (sleep 10 && open http://localhost:3000) >/dev/null 2>&1 &
  npm run dev
}
if ! main "$@"; then echo; echo "Something went wrong. Take a screenshot of this window and send it."; read -r -p "Press Enter to close."; exit 1; fi; exit 0
