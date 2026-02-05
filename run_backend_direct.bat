@echo off
echo Starting Wenyasha Backend (Direct Mode)...
echo.
set PY="C:\Users\user\AppData\Local\Programs\Python\Python311\python.exe"

if not exist "%PY%" (
    echo [ERROR] Python not found at %PY%
    pause
    exit /b
)

echo Creating/Verifying Virtual Environment...
"%PY%" -m venv backend\venv

echo Installing Dependencies...
backend\venv\Scripts\pip install -r backend\requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Pip install failed.
    pause
    exit /b
)

echo Running Migrations...
backend\venv\Scripts\python backend\manage.py migrate
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Migrations failed (check db config).
)

echo Starting Server...
backend\venv\Scripts\python backend\manage.py runserver
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Server failed.
    pause
)
