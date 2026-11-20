@echo off
rem Same as start-app.cmd, through a tunnel: use it when the phone stays on
rem "Opening project..." (another Wi-Fi, or a network that keeps devices
rem apart). The first run asks to install @expo/ngrok: answer Y.
rem ngrok, not Expo's own tunnel: that one needs an Expo account with access
rem to the project and allows one tunnel per account at a time, so a second
rem computer (or a session not closed yet) failed with "409".
(
  set QAREEB_TUNNEL=1
  call "%~dp0start-app.cmd" --tunnel ngrok
  exit /b
)
