# Windows helper: point the daily backup at an off-server S3-style bucket (Backblaze B2, Wasabi, Cloudflare R2,
# DigitalOcean Spaces, AWS...) and test the login. Run from the project folder in PowerShell:
#   powershell -ExecutionPolicy Bypass -File scripts\setup-offsite-backup.ps1            set up (asks for the details)
#   powershell -ExecutionPolicy Bypass -File scripts\setup-offsite-backup.ps1 -TestOnly  just test the saved details
#   powershell -ExecutionPolicy Bypass -File scripts\setup-offsite-backup.ps1 -Clear     remove settings (production backups stop)
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
    $passLine = Read-EnvLines | Where-Object { $_ -match '^BACKUP_ENCRYPTION_PASSPHRASE=(.*)$' } | Select-Object -First 1
    $passphrase = if ($passLine -match '^BACKUP_ENCRYPTION_PASSPHRASE=(.*)$') { $Matches[1] } else { '' }
    $remoteLine = Read-EnvLines | Where-Object { $_ -match '^BACKUP_REMOTE=offsite:([^/]+)(?:/.*)?$' } | Select-Object -First 1
    $bucketName = if ($remoteLine -match '^BACKUP_REMOTE=offsite:([^/]+)(?:/.*)?$') { $Matches[1] } else { '' }
    if ($passphrase.Length -lt 32) {
        Write-Host 'BACKUP_ENCRYPTION_PASSPHRASE must be at least 32 characters. Set it in deploy.env and store it in a password manager.'
        return $false
    }
    if (-not $bucketName) {
        Write-Host 'BACKUP_REMOTE must point to the configured offsite bucket (offsite:<bucket>/...).'
        return $false
    }
    docker info *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nDocker Desktop is not running, so the destination could not be tested yet."
        Write-Host 'Start Docker Desktop, wait until it says "Engine running", then test with:'
        Write-Host '  powershell -ExecutionPolicy Bypass -File scripts\setup-offsite-backup.ps1 -TestOnly'
        return $false
    }
    Write-Host "`nTesting access to the configured bucket..."
    docker compose --env-file deploy.env build backup
    if ($LASTEXITCODE -ne 0) { Write-Host 'Could not build the backup image.'; return $false }
    docker compose --env-file deploy.env run --rm --entrypoint rclone backup lsd "offsite:$bucketName"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nThe destination did not accept the saved details. Check the endpoint, key ID and secret, then run this script again."
        return $false
    }
    Write-Host "`nLogin works."
    return $true
}

if ($Clear) {
    if (-not (Test-Path 'deploy.env')) { Write-Host 'No deploy.env, nothing to clear.'; exit 0 }
    Save-EnvLines ((Read-EnvLines | Where-Object { $_ -notmatch '^(RCLONE_CONFIG_OFFSITE_|BACKUP_REMOTE=)' }) + 'BACKUP_REMOTE=')
    Write-Host 'Off-server settings removed. Production Compose and preflight will refuse to start backups until a remote is configured again.'
    exit 0
}

if (-not (Test-Path 'deploy.env')) {
    Write-Host 'No deploy.env yet, creating one with fresh secrets first...'
    & (Join-Path $PSScriptRoot 'generate-secrets.ps1')
}

if ($TestOnly) { if (-not (Test-Destination)) { exit 1 }; exit 0 }

$currentPassphraseLine = Read-EnvLines | Where-Object { $_ -match '^BACKUP_ENCRYPTION_PASSPHRASE=(.*)$' } | Select-Object -First 1
$currentPassphrase = if ($currentPassphraseLine -match '^BACKUP_ENCRYPTION_PASSPHRASE=(.*)$') { $Matches[1] } else { '' }
if ($currentPassphrase.Length -lt 32) {
    Write-Host 'Set a random BACKUP_ENCRYPTION_PASSPHRASE of at least 32 characters in deploy.env and save it in a password manager before configuring off-site storage.'
    exit 1
}

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

Write-Host 'Backups will be encrypted. Keep BACKUP_ENCRYPTION_PASSPHRASE (in deploy.env) in a password manager: without it they cannot be opened.'

if (-not (Test-Destination)) { exit 1 }

Write-Host "`nNext, after the real MYSQL_* values are filled in deploy.env:"
Write-Host '  bash scripts/preflight.sh'
Write-Host '  docker compose --env-file deploy.env run --rm -e BACKUP_ONCE=1 backup'
Write-Host '  sh scripts/backup-status.sh           # requires a recent encrypted off-site backup'
Write-Host "  docker compose --env-file deploy.env run --rm --entrypoint rclone backup lsl offsite:$bucket/portal"
Write-Host 'Then follow the staging restore drill in docs\OPERATIONS.md.'
