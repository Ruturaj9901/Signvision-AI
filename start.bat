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

echo [1/3] Launching FastAPI Backend Server in background window...
start "SignVision AI - Backend" cmd /c "%~dp0start_backend.bat"

:: Brief 2-second delay to allow FastAPI to bind port 8000
timeout /t 2 /nobreak >nul

echo.
echo [2/3] Launching React Frontend Server in background window...
start "SignVision AI - Frontend" cmd /c "%~dp0start_frontend.bat"

:: Brief delay before launching browser
timeout /t 3 /nobreak >nul

echo.
echo [3/3] Opening Web Browser to SignVision AI Dashboard...
start http://localhost:3000

echo.
echo ======================================================================
echo [SUCCESS] Both servers are now running!
echo   * Web Dashboard:  http://localhost:3000
echo   * FastAPI Server: http://127.0.0.1:8000
echo   * API Docs:       http://127.0.0.1:8000/docs
echo.
echo Leave this launcher window or press any key to close this console.
echo (The backend and frontend windows will remain active).
echo ======================================================================
pause
