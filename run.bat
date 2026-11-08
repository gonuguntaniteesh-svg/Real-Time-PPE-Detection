@echo off
setlocal

echo =====================================================================
echo    Real-time PPE Detection Launcher (YOLOv8-nano)
echo =====================================================================
echo.

:: Auto-detect Python 3.11 in User AppData if not in PATH
if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
    set "PATH=%LOCALAPPDATA%\Programs\Python\Python311;%LOCALAPPDATA%\Programs\Python\Python311\Scripts;%PATH%"
)
if exist "C:\Users\vamsi\AppData\Local\Programs\Python\Python311\python.exe" (
    set "PATH=C:\Users\vamsi\AppData\Local\Programs\Python\Python311;C:\Users\vamsi\AppData\Local\Programs\Python\Python311\Scripts;%PATH%"
)

if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

if "%1"=="webcam" goto WEBCAM
if "%1"=="train" goto TRAIN
if "%1"=="eval" goto EVAL
if "%1"=="dashboard" goto DASHBOARD
if "%1"=="data" goto DATA
if "%1"=="test" goto TEST

echo Select an option:
echo   [1] Run Real-Time PPE Detector (Webcam)
echo   [2] Run Real-Time PPE Detector (Sample Video / Synthetic Feed)
echo   [3] Train / Fine-tune YOLOv8-nano with Transfer Learning
echo   [4] Evaluate Model Metrics (mAP, Precision, Recall)
echo   [5] Launch Interactive Web Dashboard
echo   [6] Generate Synthetic PPE Dataset
echo   [7] Run Core Concepts & Unit Tests
echo   [8] Exit
echo.
set /p choice="Enter choice [1-8]: "

if "%choice%"=="1" goto WEBCAM
if "%choice%"=="2" goto VIDEO
if "%choice%"=="3" goto TRAIN
if "%choice%"=="4" goto EVAL
if "%choice%"=="5" goto DASHBOARD
if "%choice%"=="6" goto DATA
if "%choice%"=="7" goto TEST
if "%choice%"=="8" exit /b 0

echo Invalid choice.
pause
exit /b 1

:WEBCAM
echo [*] Launching Real-time Webcam PPE Detection...
python inference\detector.py --source 0 --conf 0.45 --iou 0.50 --show_stats
pause
exit /b 0

:VIDEO
echo [*] Launching Synthetic Video PPE Detection...
python inference\detector.py --source demo --conf 0.40 --show_stats
pause
exit /b 0

:TRAIN
echo [*] Starting YOLOv8-nano Transfer Learning Fine-Tuning...
python training\train.py --config configs\train_config.yaml --data configs\ppe_data.yaml
pause
exit /b 0

:EVAL
echo [*] Evaluating Model Performance...
python training\evaluate.py --weights runs\ppe_train\weights\best.pt --data configs\ppe_data.yaml
pause
exit /b 0

:DASHBOARD
echo [*] Opening Interactive Web Dashboard in your default browser...
start "" index.html
exit /b 0

:DATA
echo [*] Generating Sample Dataset...
python data\sample_generator.py --num_train 100 --num_val 25
pause
exit /b 0

:TEST
echo [*] Running Core Concepts & Unit Tests...
python -m unittest discover -s tests
pause
exit /b 0

