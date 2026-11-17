#!/bin/bash
# Mac: same as backup-setup.cmd. Turns on automatic backups of the database
# (Firestore) of the qareeb-b9a54 project: daily (kept 7 days) and weekly on
# Fridays (kept 14 weeks). Google keeps them. Running it again only shows the
# schedules and the backups. Needs `npx firebase-tools login` once.
cd "$(dirname "$0")/firebase" || exit 1
echo "Daily backup, kept 7 days..."
npx -y firebase-tools firestore:backups:schedules:create --recurrence DAILY --retention 7d --project qareeb-b9a54
echo; echo "Weekly backup on Fridays, kept 14 weeks..."
npx -y firebase-tools firestore:backups:schedules:create --recurrence WEEKLY --day-of-week FRIDAY --retention 98d --project qareeb-b9a54
echo; echo "(If a line above says the schedule already exists, that is fine: it was set up before.)"
echo; echo "Backup schedules now:"
if ! npx -y firebase-tools firestore:backups:schedules:list --project qareeb-b9a54; then
  echo; echo "Something went wrong. Take a screenshot of this window and send it."; read -r -p "Press Enter to close."; exit 1
fi
echo; echo "Backups taken so far (the first one appears within a day):"
npx -y firebase-tools firestore:backups:list --location eur3 --project qareeb-b9a54
echo; echo "Done. The database is backed up automatically."
read -r -p "Press Enter to close."; exit 0
