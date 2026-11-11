@echo off
rem Same as start-app.cmd, through an Expo tunnel: use it when the phone stays
rem on "Opening project..." (another Wi-Fi, or a network that keeps devices
rem apart). The first run asks to install @expo/ngrok: answer Y.
(
  call "%~dp0start-app.cmd" --tunnel
  exit /b
)
