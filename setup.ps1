# Windows PowerShell Environment Setup for Real-Time PPE Detection
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "   Real-Time PPE Detection System - Windows Environment Setup" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$pythonExe = "C:\Users\vamsi\AppData\Local\Programs\Python\Python311\python.exe"
if (-not (Test-Path $pythonExe)) {
    $pythonExe = "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe"
}

if (-not (Test-Path $pythonExe)) {
    Write-Host "[!] Python 3.11 was not found in standard paths." -ForegroundColor Red
    Write-Host "Please install Python 3.11 from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

Write-Host "[✓] Python 3.11 located: $pythonExe" -ForegroundColor Green

# Add Python to current session PATH
$pythonDir = Split-Path $pythonExe
$scriptsDir = Join-Path $pythonDir "Scripts"
$env:Path = "$pythonDir;$scriptsDir;" + $env:Path

# Create virtual environment if needed
if (-not (Test-Path ".\venv\Scripts\python.exe")) {
    Write-Host "[*] Creating virtual environment (.venv)..." -ForegroundColor Cyan
    & $pythonExe -m venv venv
    Write-Host "[✓] Virtual environment created successfully." -ForegroundColor Green
} else {
    Write-Host "[*] Virtual environment 'venv' already exists." -ForegroundColor Gray
}

# Install dependencies into virtual environment
Write-Host "[*] Installing Python packages from requirements.txt..." -ForegroundColor Cyan
.\venv\Scripts\python.exe -m pip install --upgrade pip
.\venv\Scripts\python.exe -m pip install -r requirements.txt

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "[✓] Environment setup completed successfully!" -ForegroundColor Green
Write-Host "To start the detector:    .\run.ps1" -ForegroundColor Cyan
Write-Host "Or double-click index.html to view the web dashboard." -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Green
