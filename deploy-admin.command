#!/bin/bash
# Mac: for the project owner, same as deploy-admin.cmd. Publishes the admin
# dashboard on Firebase Hosting, at https://qareeb-b9a54.web.app. Needs
# `npx firebase-tools login` once on this computer.

# The update may rewrite this file while it runs: bash reads the whole
# function before running any of it.
main() {
  cd "$(dirname "$0")" || return 1
  bash scripts/update.sh || return 1
  bash scripts/install-libraries.sh admin || return 1
  cd admin || return 1
  npm run build || return 1
  npx -y firebase-tools deploy --only hosting --project qareeb-b9a54 || return 1
  echo
  echo "Done. The dashboard is at https://qareeb-b9a54.web.app"
}
if ! main "$@"; then echo; echo "Something went wrong. Take a screenshot of this window and send it."; read -r -p "Press Enter to close."; exit 1; fi; exit 0
