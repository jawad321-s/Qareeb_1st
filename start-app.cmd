@echo off
rem Double-click to open the Qareeb mobile app: gets the latest version from
rem GitHub, installs the libraries when they changed, then starts Expo.
title Qareeb - App
cd /d "%~dp0"

rem The update may rewrite this file while it runs, so the steps sit in one
rem block that cmd parses before running any of them.
(
  call scripts\update.cmd
  if errorlevel 1 goto fail
  call scripts\install-libraries.cmd mobile
  if errorlevel 1 goto fail
  cd mobile
  echo.
  echo Scan the QR code with your phone. Press Ctrl+C to stop.
  echo.
  call npx expo start -c
  pause
  exit /b 0
)

:fail
echo.
echo Something went wrong. Take a screenshot of this window and send it.
pause
exit /b 1
