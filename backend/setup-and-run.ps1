# Wenyasha Backend - Setup and Run
# Run this from the backend folder after installing Python 3.10+
# Usage: .\setup-and-run.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# 1. Create venv
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Cyan
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed. Try: py -m venv venv" -ForegroundColor Yellow
        exit 1
    }
}

# 2. Activate venv and install dependencies
Write-Host "Activating venv and installing requirements..." -ForegroundColor Cyan
& .\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 3. Copy .env (if missing) and load into current session
if (-not (Test-Path ".env")) {
    Copy-Item .env.example .env
    Write-Host "Created .env from .env.example - please edit with your MySQL and DJANGO_SECRET_KEY" -ForegroundColor Yellow
} else {
    Write-Host ".env already exists" -ForegroundColor Green
}
Get-Content .env -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$' -and $_.Trim() -notmatch '^\#') {
        $name = $matches[1].Trim(); $val = $matches[2].Trim().Trim('"').Trim("'")
        Set-Item -Path "Env:$name" -Value $val -ErrorAction SilentlyContinue
    }
}

# 4. Migrations
Write-Host "Running makemigrations..." -ForegroundColor Cyan
python manage.py makemigrations

Write-Host "Running migrate..." -ForegroundColor Cyan
python manage.py migrate

# 5. Superuser (non-interactive if env vars set)
$user = $env:DJANGO_SUPERUSER_USERNAME
$email = $env:DJANGO_SUPERUSER_EMAIL
$pass = $env:DJANGO_SUPERUSER_PASSWORD
if ($user -and $email -and $pass) {
    Write-Host "Creating superuser (from env)..." -ForegroundColor Cyan
    python manage.py createsuperuser --noinput 2>$null
} else {
    Write-Host "To create superuser, run: python manage.py createsuperuser" -ForegroundColor Yellow
    Write-Host "Or set DJANGO_SUPERUSER_USERNAME, DJANGO_SUPERUSER_EMAIL, DJANGO_SUPERUSER_PASSWORD and re-run" -ForegroundColor Yellow
}

# 6. Run server
Write-Host "Starting development server..." -ForegroundColor Cyan
python manage.py runserver
