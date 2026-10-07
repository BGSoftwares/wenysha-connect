# Reconnect and resync the Able God College project with GitHub
# One-click script: run from project root
# Repo: https://github.com/BGSoftwares/wenyasha-connect.git
# Branch: main

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$githubRemote = "https://github.com/BGSoftwares/wenyasha-connect.git"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git is not installed or not on PATH. Install from https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

Write-Host "Reconnecting to GitHub and resyncing main..." -ForegroundColor Cyan

# Ensure we are on main
$currentBranch = git branch --show-current 2>$null
if ($currentBranch -ne "main") {
    Write-Host "Switching to main branch..." -ForegroundColor Yellow
    git checkout main
}

# Ensure origin points to GitHub
$originUrl = git remote get-url origin 2>$null
if ($originUrl -ne $githubRemote) {
    Write-Host "Setting origin to GitHub remote..." -ForegroundColor Cyan
    if ($originUrl) {
        git remote set-url origin $githubRemote
    } else {
        git remote add origin $githubRemote
    }
} else {
    Write-Host "Origin already points to GitHub." -ForegroundColor Green
}

# Fetch latest from GitHub
Write-Host "Fetching latest state from GitHub..." -ForegroundColor Cyan
git fetch origin main

# Merge GitHub main into local main if it exists on remote
$remoteMain = git rev-parse --verify origin/main 2>$null
if ($remoteMain) {
    Write-Host "Merging origin/main into local main..." -ForegroundColor Cyan
    git merge origin/main --no-edit
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Merge conflicts detected. Resolve them manually, then run this script again." -ForegroundColor Red
        exit 1
    }
}

# Push local main to GitHub
Write-Host "Pushing main to GitHub..." -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed. Check your GitHub credentials/permissions and try again." -ForegroundColor Red
    exit 1
}

# Verify
$localMain = git rev-parse --verify main
$githubMain = git rev-parse --verify origin/main
if ($localMain -eq $githubMain) {
    Write-Host "Success! Local main and GitHub origin/main are in sync at $localMain." -ForegroundColor Green
} else {
    Write-Host "Warning: Local and GitHub refs differ after push." -ForegroundColor Yellow
}

Write-Host "Done. GitHub repo: $githubRemote" -ForegroundColor Green
