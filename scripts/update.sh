#!/bin/bash
# Mac version of update.cmd: brings this copy to exactly the latest version on
# GitHub. The team changes the code only through GitHub, so local edits to
# project files are thrown away. Files git does not track (node_modules, an
# optional .env) stay.

# The checkout below may rewrite this very file while bash is reading it, so
# everything runs inside a function that bash reads whole before starting.
main() {
  local BRANCH=claude/qareeb-home-services-oxn9td
  cd "$(dirname "$0")/.." || return 1

  # On a Mac without the developer tools, `git` exists but only opens the
  # window that installs them.
  if ! git --version >/dev/null 2>&1; then
    echo "Git is not installed. If a window asks to install the developer tools, click Install, then run this again."
    return 1
  fi
  if ! git rev-parse --git-dir >/dev/null 2>&1; then
    echo "This folder was not downloaded with git clone. See docs/RUN_LOCAL.md."
    return 1
  fi

  echo "Getting the latest version from GitHub..."
  if ! git fetch origin "$BRANCH"; then
    echo "Could not reach GitHub, starting the version already on this computer."
    return 0
  fi
  git merge --abort >/dev/null 2>&1
  git rebase --abort >/dev/null 2>&1
  git reset -q --hard >/dev/null 2>&1
  if ! git checkout -q -f -B "$BRANCH" "origin/$BRANCH"; then
    echo "Could not switch to the latest version."
    return 1
  fi
  git --no-pager log -1 "--format=Version: %h  %s"
}
main "$@"; exit $?
