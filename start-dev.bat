@echo off
:: Add Node.js to PATH if needed
set "NODEJS_PATH=C:\Program Files\nodejs"
echo %PATH% | find /i "%NODEJS_PATH%" >nul 2>&1
if %ERRORLEVEL% NEQ 0 set "PATH=%NODEJS_PATH%;%PATH%"

echo Starting Catalog Processing Tool...
echo Server: http://localhost:3001
echo Client: http://localhost:5173
echo.
echo Press Ctrl+C in either window to stop.
echo.

start "Catalog Server" cmd /k "set PATH=%NODEJS_PATH%;%PATH% && set NODE_ENV=development && cd /d %~dp0server && npx ts-node-dev --respawn --transpile-only src/index.ts"
timeout /t 2 /nobreak >nul
start "Catalog Client" cmd /k "set PATH=%NODEJS_PATH%;%PATH% && cd /d %~dp0client && npx vite"

echo Both servers started in separate windows.
pause
