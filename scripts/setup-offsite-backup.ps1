# Windows helper: point the daily backup at an off-server S3-style bucket (Backblaze B2, Wasabi, Cloudflare R2,
# DigitalOcean Spaces, AWS...) and test the login. Run from the project folder in PowerShell:
#   powershell -ExecutionPolicy Bypass -File scripts\setup-offsite-backup.ps1            set up (asks for the details)
#   powershell -ExecutionPolicy Bypass -File scripts\setup-offsite-backup.ps1 -TestOnly  just test the saved details
#   powershell -ExecutionPolicy Bypass -File scripts\setup-offsite-backup.ps1 -Clear     remove the off-server settings
param([switch]$TestOnly, [switch]$Clear)
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Read-Required([string]$Prompt, [string]$Default = '') {
    while ($true) {
        $label = if ($Default) { "$Prompt [$Default]" } else { $Prompt }
        $answer = (Read-Host $label).Trim()
        if (-not $answer) { $answer = $Default }
        if ($answer) { return $answer }
        Write-Host '  This cannot be empty. Type a value and press Enter (Ctrl+C to stop).'
    }
}
function Save-EnvLines($lines) {
    [System.IO.File]::WriteAllText((Join-Path (Get-Location) 'deploy.env'), (($lines -join "`n") + "`n"), $utf8)
}
function Read-EnvLines { [System.IO.File]::ReadAllText((Resolve-Path 'deploy.env')) -split "`r?`n" | Where-Object { $_ -ne '' } }

function Test-Destination {
    docker info *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nDocker Desktop is not running, so the destination could not be tested yet."
        Write-Host 'Start Docker Desktop, wait until it says "Engine running", then test with:'
        Write-Host '  powershell -ExecutionPolicy Bypass -File scripts\setup-offsite-backup.ps1 -TestOnly'
        return
    }
    Write-Host "`nTesting the login to the destination (should list your buckets)..."
    docker compose --env-file deploy.env build backup
    docker compose --env-file deploy.env run --rm --entrypoint rclone backup lsd offsite:
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nThe destination did not accept the saved details. Check the endpoint, key ID and secret, then run this script again."
        exit 1
    }
    Write-Host "`nLogin works."
}

if ($Clear) {
    if (-not (Test-Path 'deploy.env')) { Write-Host 'No deploy.env, nothing to clear.'; exit 0 }
    Save-EnvLines ((Read-EnvLines | Where-Object { $_ -notmatch '^(RCLONE_CONFIG_OFFSITE_|BACKUP_REMOTE=)' }) + 'BACKUP_REMOTE=')
    Write-Host 'Off-server settings removed. Backups will stay on this machine only.'
    exit 0
}

if (-not (Test-Path 'deploy.env')) {
    Write-Host 'No deploy.env yet, creating one with fresh secrets first...'
    & (Join-Path $PSScriptRoot 'generate-secrets.ps1')
}

if ($TestOnly) { Test-Destination; exit 0 }

Write-Host 'You need an account with an S3-compatible storage service and a bucket (for example Backblaze B2, Wasabi or Cloudflare R2).'
Write-Host 'Have the endpoint URL, bucket name and an access key ready. If you do not have these yet, press Ctrl+C and come back later.'
Write-Host ''
$provider = Read-Required 'Provider (Other / Cloudflare / Wasabi / AWS / DigitalOcean)' 'Other'
$endpoint = Read-Required 'Endpoint URL (e.g. https://s3.eu-central-003.backblazeb2.com)'
$bucket   = Read-Required 'Bucket name'
$keyId    = Read-Required 'Access key ID'
do {
    $secure = Read-Host 'Secret access key (hidden)' -AsSecureString
    $secret = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
    if (-not $secret) { Write-Host '  This cannot be empty.' }
} while (-not $secret)
if ($endpoint -notmatch '^https?://') { $endpoint = "https://$endpoint" }

Copy-Item 'deploy.env' 'deploy.env.bak' -Force
$lines = @(Read-EnvLines | Where-Object { $_ -notmatch '^(RCLONE_CONFIG_OFFSITE_|BACKUP_REMOTE=)' })
$lines += @(
    "BACKUP_REMOTE=offsite:$bucket/portal",
    'RCLONE_CONFIG_OFFSITE_TYPE=s3',
    "RCLONE_CONFIG_OFFSITE_PROVIDER=$provider",
    "RCLONE_CONFIG_OFFSITE_ENDPOINT=$endpoint",
    "RCLONE_CONFIG_OFFSITE_ACCESS_KEY_ID=$keyId",
    "RCLONE_CONFIG_OFFSITE_SECRET_ACCESS_KEY=$secret"
)
$secret = $null
Save-EnvLines $lines
Write-Host "`nSaved to deploy.env (previous copy: deploy.env.bak)."

if (-not ($lines | Where-Object { $_ -match '^BACKUP_ENCRYPTION_PASSPHRASE=.+' })) {
    Write-Host 'WARNING: BACKUP_ENCRYPTION_PASSPHRASE is empty, so backups will NOT be encrypted. Run scripts\generate-secrets.ps1 or set it by hand.'
} else {
    Write-Host 'Backups will be encrypted. Keep BACKUP_ENCRYPTION_PASSPHRASE (in deploy.env) in a password manager: without it they cannot be opened.'
}

Test-Destination

Write-Host "`nNext, with the real MYSQL_* values filled in deploy.env and Docker running:"
Write-Host '  docker compose --env-file deploy.env run --rm -e BACKUP_ONCE=1 backup'
Write-Host "  docker compose --env-file deploy.env run --rm --entrypoint rclone backup lsl offsite:$bucket/portal"
Write-Host '  Get-Content backups\LAST_STATUS      # starts with "ok" when the last backup worked'
