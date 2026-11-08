@echo off
setlocal enabledelayedexpansion

echo =====================================================================
echo    Real-time PPE Detection System - Windows Environment Setup
echo =====================================================================
echo.

:: Auto-detect Python 3.11 in User AppData if not in PATH
if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
    set "PATH=%LOCALAPPDATA%\Programs\Python\Python311;%LOCALAPPDATA%\Programs\Python\Python311\Scripts;%PATH%"
)
if exist "C:\Users\vamsi\AppData\Local\Programs\Python\Python311\python.exe" (
    set "PATH=C:\Users\vamsi\AppData\Local\Programs\Python\Python311;C:\Users\vamsi\AppData\Local\Programs\Python\Python311\Scripts;%PATH%"
)

:: Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [!] Python is not detected in your PATH.
    echo.
    echo Please install Python 3.10 or 3.11 from:
    echo    https://www.python.org/downloads/
    echo or via Windows Terminal / PowerShell:
    echo    winget install Python.Python.3.11
    echo.
    echo [!] Make sure to check "Add Python to PATH" during installation!
    echo.
    pause
    exit /b 1
)

echo [*] Python detected:
python --version
echo.

:: Create virtual environment if it does not exist
if not exist "venv" (
    echo [*] Creating virtual environment (.venv)...
    python -m venv venv
    if %ERRORLEVEL% neq 0 (
        echo [X] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo [*] Virtual environment created successfully.
) else (
    echo [*] Virtual environment already exists.
)

:: Activate virtual environment
call venv\Scripts\activate.bat

:: Upgrade pip
echo [*] Upgrading pip...
python -m pip install --upgrade pip

:: Install dependencies
echo [*] Installing dependencies from requirements.txt...
python -m pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo [X] Error installing dependencies.
    pause
    exit /b 1
)

:: Generate sample dataset
echo [*] Generating synthetic PPE dataset for testing...
python data\sample_generator.py --num_train 50 --num_val 15

echo.
echo =====================================================================
echo [*] Setup completed successfully!
echo [*] To start the real-time webcam detector:
echo       run.bat webcam
echo [*] Or to view the browser dashboard, double-click:
echo       index.html
echo =====================================================================
echo.
pause

