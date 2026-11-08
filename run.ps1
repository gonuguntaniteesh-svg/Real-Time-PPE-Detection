# Windows PowerShell Runner for Real-Time PPE Detection (YOLOv8-nano)
param (
    [string]$Mode = ""
)

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "   Real-Time PPE Detection Launcher (YOLOv8-nano)" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Determine python executable
$pythonExe = "python"
if (Test-Path ".\venv\Scripts\python.exe") {
    $pythonExe = ".\venv\Scripts\python.exe"
} elseif (Test-Path "C:\Users\vamsi\AppData\Local\Programs\Python\Python311\python.exe") {
    $pythonExe = "C:\Users\vamsi\AppData\Local\Programs\Python\Python311\python.exe"
} elseif (Test-Path "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe") {
    $pythonExe = "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe"
}

if (-not $Mode) {
    Write-Host "Select an option:" -ForegroundColor Yellow
    Write-Host "  [1] Run Real-Time PPE Detector (Webcam)"
    Write-Host "  [2] Run Real-Time PPE Detector (Sample Video / Simulated Stream)"
    Write-Host "  [3] Train / Fine-tune YOLOv8-nano with Transfer Learning"
    Write-Host "  [4] Evaluate Model Metrics (mAP, Precision, Recall)"
    Write-Host "  [5] Launch Interactive Web Dashboard (index.html)"
    Write-Host "  [6] Generate Synthetic PPE Dataset"
    Write-Host "  [7] Run Core Concepts & Unit Tests"
    Write-Host "  [8] Exit"
    Write-Host ""
    $choice = Read-Host "Enter choice [1-8]"
} else {
    $choice = $Mode
}

switch ($choice) {
    "1" {
        Write-Host "[*] Launching Real-time Webcam PPE Detection..." -ForegroundColor Cyan
        & $pythonExe inference\detector.py --source 0 --conf 0.45 --iou 0.50 --show_stats
    }
    "2" {
        Write-Host "[*] Launching Synthetic Video PPE Detection..." -ForegroundColor Cyan
        & $pythonExe inference\detector.py --source demo --conf 0.40 --show_stats
    }
    "3" {
        Write-Host "[*] Starting YOLOv8-nano Transfer Learning Fine-Tuning..." -ForegroundColor Cyan
        & $pythonExe training\train.py --config configs\train_config.yaml --data configs\ppe_data.yaml
    }
    "4" {
        Write-Host "[*] Evaluating Model Performance..." -ForegroundColor Cyan
        & $pythonExe training\evaluate.py --weights runs\ppe_train\weights\best.pt --data configs\ppe_data.yaml
    }
    "5" {
        Write-Host "[*] Opening Interactive Web Dashboard in your default browser..." -ForegroundColor Green
        Start-Process "index.html"
    }
    "6" {
        Write-Host "[*] Generating Sample Dataset..." -ForegroundColor Cyan
        & $pythonExe data\sample_generator.py --num_train 100 --num_val 25
    }
    "7" {
        Write-Host "[*] Running Core Concepts & Unit Tests..." -ForegroundColor Cyan
        & $pythonExe -m unittest discover -s tests
    }
    "8" {
        exit
    }
    Default {
        Write-Host "Invalid choice." -ForegroundColor Red
    }
}

