@echo off
rem Installs the libraries of one package (mobile or admin) when they are
rem missing, package-lock.json changed since the last install, or the
rem libraries on disk no longer match it (a library added or removed by hand,
rem e.g. `npm install something`), so the app always runs on exactly the
rem project's libraries.
setlocal
cd /d "%~dp0..\%~1"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed. Install the LTS version from https://nodejs.org and try again.
  exit /b 1
)
fc /b package-lock.json node_modules\.installed-lock.json >nul 2>&1
if errorlevel 1 goto install
rem npm keeps a record of what is installed in node_modules\.package-lock.json;
rem any npm install or uninstall since our last install changes it.
fc /b node_modules\.package-lock.json node_modules\.installed-npm-lock.json >nul 2>&1
if errorlevel 1 goto install
exit /b 0

:install
echo Installing the libraries, the first time takes a few minutes...
call npm ci --no-audit --no-fund
if errorlevel 1 exit /b 1
copy /y package-lock.json node_modules\.installed-lock.json >nul
copy /y node_modules\.package-lock.json node_modules\.installed-npm-lock.json >nul
exit /b 0
