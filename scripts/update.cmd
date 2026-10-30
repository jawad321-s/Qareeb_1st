@echo off
rem Brings this copy to exactly the latest version on GitHub. The team changes
rem the code only through GitHub, so local edits to project files are thrown
rem away. Files git does not track (node_modules, an optional .env) stay.
setlocal
set BRANCH=claude/qareeb-home-services-oxn9td
cd /d "%~dp0.."

where git >nul 2>&1
if errorlevel 1 (
  echo Git is not installed. Install it from https://git-scm.com and try again.
  exit /b 1
)
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
  echo This folder was not downloaded with git clone. See docs\RUN_LOCAL.md.
  exit /b 1
)

echo Getting the latest version from GitHub...
git fetch origin %BRANCH%
if errorlevel 1 (
  echo Could not reach GitHub, starting the version already on this computer.
  exit /b 0
)
git merge --abort >nul 2>&1
git rebase --abort >nul 2>&1
rem cmd reads a running script from disk line by line, and the checkout may
rem rewrite this file: the rest sits in one block so it is parsed beforehand.
(
  git reset -q --hard >nul 2>&1
  git checkout -f -B %BRANCH% origin/%BRANCH% >nul
  if errorlevel 1 (
    echo Could not switch to the latest version.
    exit /b 1
  )
  git --no-pager log -1 "--format=Version: %%h  %%s"
  exit /b 0
)
