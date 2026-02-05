# Verify Backend Setup
Write-Host "Verifying Wenyasha Backend Setup..." -ForegroundColor Cyan

# Check Python
try {
    $pyVersion = python --version 2>&1
    Write-Host "Python: Found ($pyVersion)" -ForegroundColor Green
} catch {
    Write-Host "Python: NOT FOUND (ensure it is in PATH)" -ForegroundColor Red
}

# Check MySQL
try {
    $mysqlVersion = mysql --version 2>&1
    Write-Host "MySQL: Found ($mysqlVersion)" -ForegroundColor Green
} catch {
    Write-Host "MySQL: NOT FOUND (ensure it is in PATH)" -ForegroundColor Yellow
}

# Check .env
if (Test-Path "backend\.env") {
    Write-Host ".env: Found" -ForegroundColor Green
} else {
    Write-Host ".env: MISSING (run setup-and-run.ps1)" -ForegroundColor Red
}

# Check venv
if (Test-Path "backend\venv") {
    Write-Host "venv: Found" -ForegroundColor Green
} else {
    Write-Host "venv: MISSING" -ForegroundColor Yellow
}

Write-Host "`nTo run the backend:"
Write-Host "cd backend"
Write-Host ".\setup-and-run.ps1"
