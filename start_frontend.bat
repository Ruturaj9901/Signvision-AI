@echo off
title SignVision AI - Web Application
color 0A

echo ======================================================================
echo           SignVision AI - Move. Express. Connect.
echo           Browser-Native AI Movement Recognition
echo ======================================================================
echo.

cd /d "%~dp0frontend"

:: Check for npm
set NPM_CMD=npm
where npm.cmd >nul 2>nul
if %errorlevel% equ 0 (
    set NPM_CMD=npm.cmd
)

:: Verify dependencies installed
if not exist "node_modules\" (
    echo [INFO] Installing required dependencies (first-time setup)...
    call %NPM_CMD% install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install npm dependencies. Please verify Node.js is installed.
        pause
        exit /b 1
    )
)

echo.
echo [1/2] Launching SignVision AI Web Server on http://localhost:3000/Signvision-AI/ ...
echo [INFO] 100%% In-Browser AI Engine (Zero Backend Required)
echo ======================================================================
echo.

call %NPM_CMD% run dev -- --host 127.0.0.1 --port 3000
pause
