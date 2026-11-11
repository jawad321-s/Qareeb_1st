@echo off
rem For the project owner: publishes the admin dashboard on Firebase Hosting,
rem at https://qareeb-b9a54.web.app, so it opens from any browser without
rem running anything. Run it again after a change to the dashboard. Needs
rem `npx firebase-tools login` once on this computer.
title Qareeb - Publish admin
cd /d "%~dp0"

rem The update may rewrite this file while it runs, so the steps sit in one
rem block that cmd parses before running any of them.
(
  call scripts\update.cmd
  if errorlevel 1 goto fail
  call scripts\install-libraries.cmd admin
  if errorlevel 1 goto fail
  cd admin
  call npm run build
  if errorlevel 1 goto fail
  call npx -y firebase-tools deploy --only hosting --project qareeb-b9a54
  if errorlevel 1 goto fail
  echo.
  echo Done. The dashboard is at https://qareeb-b9a54.web.app
  pause
  exit /b 0
)

:fail
echo.
echo Something went wrong. Take a screenshot of this window and send it.
pause
exit /b 1
