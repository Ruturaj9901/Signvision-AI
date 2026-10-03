@echo off
title SignVision AI - FastAPI Backend Server
color 0B

echo ======================================================================
echo           SignVision AI - Move. Express. Connect.
echo           FastAPI REST API & AI Inference Server
echo ======================================================================
echo.

cd /d "%~dp0"

:: Check for python in PATH or local appdata
set PYTHON_CMD=python
where python >nul 2>nul
if %errorlevel% neq 0 (
    if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
        set "PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
    ) else if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
        set "PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    ) else (
        echo [ERROR] Python not found! Please ensure Python 3.10+ is installed.
        pause
        exit /b 1
    )
)

echo [1/3] Using Python: %PYTHON_CMD%
"%PYTHON_CMD%" --version

echo.
echo [2/3] Checking SQLite Database and Model Weights...
"%PYTHON_CMD%" -c "from backend.database import init_db; init_db(); print('Database verified.')"

echo.
echo [3/3] Starting FastAPI Server on http://127.0.0.1:8000 ...
echo [INFO] Interactive Swagger Documentation: http://127.0.0.1:8000/docs
echo ======================================================================
echo.

"%PYTHON_CMD%" -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

pause
