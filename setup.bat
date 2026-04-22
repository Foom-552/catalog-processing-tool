@echo off
echo ==========================================
echo  Catalog Processing Tool - Setup Script
echo ==========================================
echo.

:: Add Node.js to PATH if not already present
set "NODEJS_PATH=C:\Program Files\nodejs"
echo %PATH% | find /i "%NODEJS_PATH%" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    set "PATH=%NODEJS_PATH%;%PATH%"
)

:: Check for Node.js
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please download and install Node.js from: https://nodejs.org/
    echo Recommended version: 20.x LTS or higher
    echo.
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo npm version:
npm --version
echo.

:: Install all workspace dependencies from root
echo [1/1] Installing all dependencies (workspaces)...
npm install
if %ERRORLEVEL% NEQ 0 ( echo [ERROR] Install failed. & pause & exit /b 1 )

:: Copy .env if not exists
if not exist server\.env (
    copy .env.example server\.env >nul
    echo Created server\.env from .env.example
)

echo.
echo ==========================================
echo  Setup complete!
echo.
echo  To start in development mode, run:
echo    start-dev.bat
echo.
echo  Server: http://localhost:3001
echo  Client: http://localhost:5173
echo ==========================================
pause
