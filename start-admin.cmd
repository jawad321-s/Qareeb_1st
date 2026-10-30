@echo off
rem Double-click to open the Qareeb admin dashboard: gets the latest version
rem from GitHub, installs the libraries when they changed, then serves it on
rem http://localhost:3000 and opens the browser.
title Qareeb - Admin
cd /d "%~dp0"

rem The update may rewrite this file while it runs, so the steps sit in one
rem block that cmd parses before running any of them.
(
  call scripts\update.cmd
  if errorlevel 1 goto fail
  call scripts\install-libraries.cmd admin
  if errorlevel 1 goto fail
  cd admin
  echo.
  echo The dashboard opens at http://localhost:3000 in a few seconds. Press Ctrl+C to stop.
  echo.
  start "" cmd /c "timeout /t 10 /nobreak >nul & start http://localhost:3000"
  call npm run dev
  pause
  exit /b 0
)

:fail
echo.
echo Something went wrong. Take a screenshot of this window and send it.
pause
exit /b 1
