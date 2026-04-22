@echo off
set "NODEJS_PATH=C:\Program Files\nodejs"
echo %PATH% | find /i "%NODEJS_PATH%" >nul 2>&1
if %ERRORLEVEL% NEQ 0 set "PATH=%NODEJS_PATH%;%PATH%"

echo ==========================================
echo  Catalog Processing Tool (Production)
echo  http://localhost:3001
echo ==========================================
echo.

cd /d "%~dp0server"
set NODE_ENV=production
node dist/index.js
