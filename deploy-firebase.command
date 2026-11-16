#!/bin/bash
# Mac: for the project owner, same as deploy-firebase.cmd. Publishes the Cloud
# Functions and the Firestore rules to the qareeb-b9a54 project. Needs
# `npx firebase-tools login` once on this computer.

# The update may rewrite this file while it runs: bash reads the whole
# function before running any of it.
main() {
  cd "$(dirname "$0")" || return 1
  bash scripts/update.sh || return 1
  cd firebase/functions || return 1
  echo; echo "Installing the Cloud Functions libraries..."
  npm ci --no-audit --no-fund || return 1
  cd .. || return 1
  echo; echo "Publishing. If it asks a question, press Enter."
  npx -y firebase-tools deploy --only functions,firestore:rules --project qareeb-b9a54 || return 1
  echo
  echo "Done. The Cloud Functions and the Firestore rules are published."
}
if ! main "$@"; then echo; echo "Something went wrong. Take a screenshot of this window and send it."; read -r -p "Press Enter to close."; exit 1; fi
read -r -p "Press Enter to close."; exit 0
