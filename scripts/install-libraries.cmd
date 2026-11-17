@echo off
rem Installs the libraries of one package (mobile or admin) when they are
rem missing, package-lock.json changed since the last install, or the
rem libraries on disk no longer match it (a library added or removed by hand,
rem e.g. `npm install something`), so the app always runs on exactly the
rem project's libraries. The argument is the folder: mobile, admin or
rem firebase\functions.
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
rem npm can end with a negative code on Windows (e.g. -4048 when a file is
rem locked), which "if errorlevel 1" misses, so test for anything but 0.
if %errorlevel% equ 0 goto installed

rem Usually a library file is still open: the app (Expo) running in another
rem window, or the antivirus scanning it. Once that window is closed it works.
echo.
echo ============================================================
echo  A library file is in use, so it could not be replaced.
echo  Close EVERY other window that is running the app (Expo),
echo  then press any key here to try again.
echo ============================================================
pause
call npm ci --no-audit --no-fund
if %errorlevel% equ 0 goto installed
echo.
echo The libraries could not be installed.
echo Close every window running the app and VS Code, or restart the computer, then run this again.
exit /b 1

:installed
copy /y package-lock.json node_modules\.installed-lock.json >nul
copy /y node_modules\.package-lock.json node_modules\.installed-npm-lock.json >nul
exit /b 0
