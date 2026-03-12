@echo off
setlocal enabledelayedexpansion
title DayStack Setup

echo.
echo  DayStack - Smart Daily Task Manager
echo  =====================================
echo.

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Node.js not found. Install from https://nodejs.org
  echo         or run: winget install OpenJS.NodeJS.LTS
  pause & exit /b 1
)

:: Clear broken electron-builder cache (fixes symlink errors on Windows)
echo [0/4] Clearing electron-builder cache...
set "CACHE_DIR=%LOCALAPPDATA%\electron-builder\Cache\winCodeSign"
if exist "%CACHE_DIR%" (
  rmdir /s /q "%CACHE_DIR%" 2>nul
  echo       Cleared.
) else (
  echo       Nothing to clear.
)

echo.
echo [1/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 ( echo [ERROR] npm install failed & pause & exit /b 1 )

echo.
echo [2/4] Building the React app...
call npm run build
if %errorlevel% neq 0 ( echo [ERROR] Build failed & pause & exit /b 1 )

echo.
echo [3/4] Building desktop app...
call npm run electron:build
if %errorlevel% neq 0 ( echo [ERROR] Electron build failed & pause & exit /b 1 )

echo.
echo [4/4] Done!
echo.
echo  Your app is in: dist-electron\win-unpacked\DayStack.exe
echo.
echo  TO ADD TO STARTUP:
echo    1. Press Win+R, type shell:startup, press Enter
echo    2. Copy a shortcut of DayStack.exe into that folder
echo.
pause
