#!/bin/bash
# Mac version of install-libraries.cmd: installs the libraries of one package
# (mobile or admin) when they are missing or package-lock.json changed since
# the last install, so a pull that updates Expo never leaves old libraries.
cd "$(dirname "$0")/../$1" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install the LTS version from https://nodejs.org and try again."
  exit 1
fi
cmp -s package-lock.json node_modules/.installed-lock.json && exit 0

echo "Installing the libraries, the first time takes a few minutes..."
npm ci --no-audit --no-fund || exit 1
cp package-lock.json node_modules/.installed-lock.json
