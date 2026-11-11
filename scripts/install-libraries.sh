#!/bin/bash
# Mac version of install-libraries.cmd: installs the libraries of one package
# (mobile or admin) when they are missing, package-lock.json changed since the
# last install, or the libraries on disk no longer match it (a library added
# or removed by hand, e.g. `npm install something`).
cd "$(dirname "$0")/../$1" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install the LTS version from https://nodejs.org and try again."
  exit 1
fi
# npm keeps a record of what is installed in node_modules/.package-lock.json;
# any npm install or uninstall since our last install changes it.
cmp -s package-lock.json node_modules/.installed-lock.json &&
  cmp -s node_modules/.package-lock.json node_modules/.installed-npm-lock.json && exit 0

echo "Installing the libraries, the first time takes a few minutes..."
npm ci --no-audit --no-fund || exit 1
cp package-lock.json node_modules/.installed-lock.json
cp node_modules/.package-lock.json node_modules/.installed-npm-lock.json
