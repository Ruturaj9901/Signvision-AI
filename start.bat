@echo off
title SignVision AI Launcher
color 0E

echo ======================================================================
echo    ==============================================================
echo             SignVision AI - Move. Express. Connect.
echo    AI Human Movement Recognition & Assistive Emoji Communication
echo    ==============================================================
echo ======================================================================
echo.

cd /d "%~dp0"

:: 1. Check npm
set NPM_CMD=npm
where npm.cmd >nul 2>nul
if %errorlevel% equ 0 (
    set NPM_CMD=npm.cmd
) else (
    where npm >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Node.js and npm are required to run locally.
        echo Please install Node.js from https://nodejs.org or open the online GitHub Pages URL:
        echo https://ruturaj9901.github.io/Signvision-AI/
        pause
        exit /b 1
    )
)

:: 2. Check and install frontend dependencies if needed
if not exist "frontend\node_modules\" (
    echo [1/3] First-time setup: Installing frontend dependencies...
    cd frontend
    call %NPM_CMD% install
    cd ..
) else (
    echo [1/3] Dependencies verified.
)

:: 3. Optional: check for Python to run backend if desired
set START_BACKEND=0
where python >nul 2>nul
if %errorlevel% equ 0 (
    if exist "backend\main.py" (
        set START_BACKEND=1
    )
)

if %START_BACKEND% equ 1 (
    echo [2/3] Launching optional local FastAPI backend on port 8000...
    start "SignVision AI - Backend" cmd /c "%~dp0start_backend.bat"
    timeout /t 2 /nobreak >nul
) else (
    echo [2/3] Running in Standalone In-Browser AI Mode (No backend required!)...
)

:: 4. Start frontend server in background window
start "SignVision AI - Web" cmd /c "%~dp0start_frontend.bat"

:: 5. Open browser
echo [3/3] Opening Web Browser to SignVision AI...
timeout /t 3 /nobreak >nul
start http://localhost:3000/Signvision-AI/

echo.
echo ======================================================================
echo [SUCCESS] SignVision AI is running!
echo   * Local URL:       http://localhost:3000/Signvision-AI/
echo   * GitHub Pages:    https://ruturaj9901.github.io/Signvision-AI/
echo.
echo You can close this launcher window at any time.
echo ======================================================================
pause
