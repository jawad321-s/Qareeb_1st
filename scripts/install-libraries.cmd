@echo off
rem Installs the libraries of one package (mobile or admin) when they are
rem missing or package-lock.json changed since the last install, so a pull
rem that updates Expo never leaves old libraries behind.
setlocal
cd /d "%~dp0..\%~1"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed. Install the LTS version from https://nodejs.org and try again.
  exit /b 1
)
fc /b package-lock.json node_modules\.installed-lock.json >nul 2>&1
if not errorlevel 1 exit /b 0

echo Installing the libraries, the first time takes a few minutes...
call npm ci --no-audit --no-fund
if errorlevel 1 exit /b 1
copy /y package-lock.json node_modules\.installed-lock.json >nul
exit /b 0
