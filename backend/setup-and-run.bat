@echo off
REM Wenyasha Backend - Setup and Run (Windows CMD)
REM Run from backend folder after installing Python 3.10+
REM Usage: setup-and-run.bat

cd /d "%~dp0"

echo Creating virtual environment...
if not exist "venv" (
    python -m venv venv
    if errorlevel 1 (
        echo Try: py -m venv venv
        exit /b 1
    )
)

echo Activating venv and installing requirements...
call venv\Scripts\activate.bat
pip install -r requirements.txt

if not exist ".env" (
    copy .env.example .env
    echo Created .env - please edit with your MySQL and DJANGO_SECRET_KEY
)

echo Running makemigrations...
python manage.py makemigrations

echo Running migrate...
python manage.py migrate

echo.
echo To create superuser run: python manage.py createsuperuser
echo Optional: set DJANGO_SUPERUSER_USERNAME, DJANGO_SUPERUSER_EMAIL, DJANGO_SUPERUSER_PASSWORD for non-interactive create
echo.

echo Starting development server...
python manage.py runserver
