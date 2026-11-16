# Windows helper: point the daily backup at an off-server S3-style bucket (Backblaze B2, Wasabi, Cloudflare R2,
# DigitalOcean Spaces, AWS...) and test the login. Run from the project folder in PowerShell:
#   powershell -ExecutionPolicy Bypass -File scripts\setup-offsite-backup.ps1
$ErrorActionPreference = 'Stop'
if (-not (Test-Path 'deploy.env')) {
    Write-Host 'No deploy.env yet, creating one with fresh secrets first...'
    & (Join-Path $PSScriptRoot 'generate-secrets.ps1')
}
$utf8 = New-Object System.Text.UTF8Encoding($false)

$provider = Read-Host 'Provider (Other / Cloudflare / Wasabi / AWS / DigitalOcean)'
$endpoint = Read-Host 'Endpoint URL (e.g. https://s3.eu-central-003.backblazeb2.com)'
$bucket   = Read-Host 'Bucket name'
$keyId    = Read-Host 'Access key ID'
$secure   = Read-Host 'Secret access key (hidden)' -AsSecureString
$secret   = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))

Copy-Item 'deploy.env' 'deploy.env.bak' -Force
$lines = [System.IO.File]::ReadAllText((Resolve-Path 'deploy.env')) -split "`r?`n" |
    Where-Object { $_ -notmatch '^(RCLONE_CONFIG_OFFSITE_|BACKUP_REMOTE=)' -and $_ -ne '' }
$lines += @(
    "BACKUP_REMOTE=offsite:$bucket/portal",
    'RCLONE_CONFIG_OFFSITE_TYPE=s3',
    "RCLONE_CONFIG_OFFSITE_PROVIDER=$provider",
    "RCLONE_CONFIG_OFFSITE_ENDPOINT=$endpoint",
    "RCLONE_CONFIG_OFFSITE_ACCESS_KEY_ID=$keyId",
    "RCLONE_CONFIG_OFFSITE_SECRET_ACCESS_KEY=$secret"
)
$secret = $null
[System.IO.File]::WriteAllText((Join-Path (Get-Location) 'deploy.env'), (($lines -join "`n") + "`n"), $utf8)

if (-not ($lines | Where-Object { $_ -match '^BACKUP_ENCRYPTION_PASSPHRASE=.+' })) {
    Write-Host 'WARNING: BACKUP_ENCRYPTION_PASSPHRASE is empty, so backups will NOT be encrypted. Run scripts\generate-secrets.ps1 or set it by hand.'
} else {
    Write-Host 'Backups will be encrypted. Keep BACKUP_ENCRYPTION_PASSPHRASE (in deploy.env) in a password manager: without it they cannot be opened.'
}

Write-Host "`nTesting the login to the destination (should list your buckets)..."
docker compose --env-file deploy.env build backup
docker compose --env-file deploy.env run --rm --entrypoint rclone backup lsd offsite:
if ($LASTEXITCODE -ne 0) { Write-Host 'The destination did not accept these details. Run this script again with the correct values.'; exit 1 }
Write-Host "`nLogin works. Next, with the real MYSQL_* values filled in deploy.env:"
Write-Host '  docker compose --env-file deploy.env run --rm -e BACKUP_ONCE=1 backup'
Write-Host "  docker compose --env-file deploy.env run --rm --entrypoint rclone backup lsl offsite:$bucket/portal"
Write-Host '  Get-Content backups\LAST_STATUS      # starts with "ok" when the last backup worked'
