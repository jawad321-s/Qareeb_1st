@echo off
rem For the project owner: turns on automatic backups of the database
rem (Firestore) of the qareeb-b9a54 project. Run it once: a backup every day,
rem kept 7 days, and one every Friday, kept 14 weeks. Google keeps the backups
rem (nothing is stored on this computer). Running it again only shows the
rem schedules and the backups taken so far. Needs `npx firebase-tools login`
rem once on this computer. How to restore: docs\FIREBASE_SETUP.md.
title Qareeb - Database backups
cd /d "%~dp0firebase"

echo Daily backup, kept 7 days...
call npx -y firebase-tools firestore:backups:schedules:create --recurrence DAILY --retention 7d --project qareeb-b9a54
echo.
echo Weekly backup on Fridays, kept 14 weeks...
call npx -y firebase-tools firestore:backups:schedules:create --recurrence WEEKLY --day-of-week FRIDAY --retention 98d --project qareeb-b9a54
echo.
echo (If a line above says the schedule already exists, that is fine: it was set up before.)
echo.
echo Backup schedules now:
call npx -y firebase-tools firestore:backups:schedules:list --project qareeb-b9a54
if %errorlevel% neq 0 goto fail
echo.
echo Backups taken so far (the first one appears within a day):
call npx -y firebase-tools firestore:backups:list --location eur3 --project qareeb-b9a54
echo.
echo Done. The database is backed up automatically.
pause
exit /b 0

:fail
echo.
echo Something went wrong. Take a screenshot of this window and send it.
pause
exit /b 1
