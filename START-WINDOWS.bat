@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Please install Node.js 20 or newer, then run this file again.
 echo For a design-only preview, open website\index.html.
 pause
 exit /b 1
)
echo Starting LOHAA. Open http://127.0.0.1:3000 in your browser.
echo Keep this window open while using the website.
node server\server.mjs
pause
