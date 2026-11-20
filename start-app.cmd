@echo off
rem Double-click to open the Qareeb mobile app: gets the latest version from
rem GitHub, installs the libraries when they changed, then starts Expo.
rem Extra arguments go to Expo (start-app-tunnel.cmd passes --tunnel).
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
  rem Not tied to any Expo account: whoever runs this, on any computer, and
  rem any phone (whatever Expo account it is signed in to, or none) opens
  rem the project. Without it, a computer signed in to an Expo account that
  rem isn't a member of the project's organization can't serve it.
  rem Not with the tunnel (start-app-tunnel): it needs Expo online, so
  rem "offline" would leave it off and fall back to the Wi-Fi address.
  set EXPO_OFFLINE=
  if not defined QAREEB_TUNNEL set EXPO_OFFLINE=1
  call npx expo start -c %*
  pause
  exit /b 0
)

:fail
echo.
echo Something went wrong. Take a screenshot of this window and send it.
pause
exit /b 1
