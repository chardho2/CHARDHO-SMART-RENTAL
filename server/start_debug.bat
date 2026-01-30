@echo off
cd /d c:\Users\MUZZU\OneDrive\Desktop\chardhogo\server
echo Starting server...
node server.js
echo.
echo Server stopped. Exit code: %ERRORLEVEL%
pause
