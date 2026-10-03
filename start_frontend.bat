@echo off
title SignVision AI - React Frontend Dev Server
color 0A

echo ======================================================================
echo           SignVision AI - React Frontend Server
echo           Move. Express. Connect.
echo ======================================================================
echo.

cd /d "%~dp0frontend"

:: Check npm
set NPM_CMD=npm
where npm.cmd >nul 2>nul
if %errorlevel% equ 0 (
    set NPM_CMD=npm.cmd
)

echo [1/2] Launching Vite Development Server on http://localhost:3000 ...
echo [INFO] Proxies API calls directly to FastAPI Backend on port 8000
echo ======================================================================
echo.

call %NPM_CMD% run dev -- --host 127.0.0.1 --port 3000

pause
