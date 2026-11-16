@echo off
rem For the project owner: publishes the Cloud Functions and the Firestore
rem rules (the firebase folder) to the qareeb-b9a54 project. Run it whenever an
rem update says the functions or the rules changed. Needs
rem `npx firebase-tools login` once on this computer.
title Qareeb - Publish functions and rules
cd /d "%~dp0"

rem The update may rewrite this file while it runs, so the steps sit in one
rem block that cmd parses before running any of them.
(
  call scripts\update.cmd
  if errorlevel 1 goto fail
  cd firebase\functions
  echo.
  echo Installing the Cloud Functions libraries...
  call npm ci --no-audit --no-fund
  if errorlevel 1 goto fail
  cd ..
  echo.
  echo Publishing. If it asks a question, press Enter.
  call npx -y firebase-tools deploy --only functions,firestore:rules --project qareeb-b9a54
  if errorlevel 1 goto fail
  echo.
  echo Done. The Cloud Functions and the Firestore rules are published.
  pause
  exit /b 0
)

:fail
echo.
echo Something went wrong. Take a screenshot of this window and send it.
pause
exit /b 1
