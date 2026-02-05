@echo off
echo Starting Wenyasha Backend (SQLite Mode)...
echo.
set PY="C:\Users\user\AppData\Local\Programs\Python\Python311\python.exe"
set USE_SQLITE=True
set DJANGO_SETTINGS_MODULE=config.settings

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

echo Running Migrations (SQLite)...
backend\venv\Scripts\python backend\manage.py migrate
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Migrations failed.
    pause
    exit /b
)

echo Starting Server...
backend\venv\Scripts\python backend\manage.py runserver
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Server failed.
    pause
)
