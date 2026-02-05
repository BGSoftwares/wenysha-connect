# Push Wenyasha Connect to GitHub
# Requires: Git installed and on PATH
# Repo: https://github.com/BGSoftwares/wenysha-connect.git
# Run from project root: .\push-to-github.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git is not installed or not on PATH. Install from https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

$remote = "https://github.com/BGSoftwares/wenysha-connect.git"

# Initialize repo if needed
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor Cyan
    git init
}

# Add remote if not present
$hasOrigin = git remote 2>$null | Select-String -Pattern "^origin$"
if (-not $hasOrigin) {
    Write-Host "Adding remote origin..." -ForegroundColor Cyan
    git remote add origin $remote
} else {
    $url = (git remote get-url origin 2>$null)
    if ($url -ne $remote) {
        Write-Host "Setting origin URL to $remote" -ForegroundColor Cyan
        git remote set-url origin $remote
    }
}

# Ensure .env and venv are not staged
if (Test-Path "backend\.env") {
    git update-index --assume-unchanged backend\.env 2>$null
}
Write-Host "Staging files (backend/.env and backend/venv/ are in .gitignore)..." -ForegroundColor Cyan
git add .
$status = git status --short
if ($status -match "backend\\\.env|backend\\venv") {
    Write-Host "WARNING: backend\.env or backend\venv appears staged. Remove from staging:" -ForegroundColor Yellow
    git reset HEAD backend/.env backend/venv 2>$null
}

git status
Write-Host ""
$commitMsg = "Wenyasha Connect: React + Django backend, API integration, docs"
if ($args.Count -gt 0) { $commitMsg = $args -join " " }
git commit -m $commitMsg 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Nothing to commit, or commit failed. Try: git status" -ForegroundColor Yellow
}

Write-Host "Pushing to origin main..." -ForegroundColor Cyan
git branch -M main 2>$null
git push -u origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed. If repo already has content, try: git pull origin main --allow-unrelated-histories" -ForegroundColor Yellow
    Write-Host "Then resolve conflicts and run: git push -u origin main" -ForegroundColor Yellow
    exit 1
}
Write-Host "Done. Repo: $remote" -ForegroundColor Green
