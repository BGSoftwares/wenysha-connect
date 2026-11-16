# Windows version of generate-secrets.sh: creates deploy.env from deploy.env.example with fresh random secrets.
# Run from the project folder in PowerShell:   powershell -ExecutionPolicy Bypass -File scripts\generate-secrets.ps1
# An existing deploy.env is kept as deploy.env.old. The file is written as plain UTF-8 with Unix line endings,
# which is what Docker needs (PowerShell's own ">>" writes UTF-16, which Docker cannot read).
$ErrorActionPreference = 'Stop'
if (-not (Test-Path 'deploy.env.example')) { throw 'Run this from the folder that holds deploy.env.example.' }

$utf8 = New-Object System.Text.UTF8Encoding($false)
$alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()

function New-RandomText([int]$Length) {
    $result = New-Object System.Text.StringBuilder
    $buffer = New-Object byte[] 1
    while ($result.Length -lt $Length) {
        $rng.GetBytes($buffer)
        if ($buffer[0] -lt 248) { [void]$result.Append($alphabet[$buffer[0] % 62]) }   # 248 = 4 x 62: no bias
    }
    $result.ToString()
}
function New-FernetKey {
    $bytes = New-Object byte[] 32
    $rng.GetBytes($bytes)
    [Convert]::ToBase64String($bytes).Replace('+', '-').Replace('/', '_')
}

if (Test-Path 'deploy.env') {
    Copy-Item 'deploy.env' 'deploy.env.old' -Force
    Write-Host 'Kept the previous file as deploy.env.old'
}

$values = @{
    DJANGO_SECRET_KEY            = New-RandomText 64
    REDIS_PASSWORD               = New-RandomText 32
    MFA_ENCRYPTION_KEY           = New-FernetKey
    BACKUP_ENCRYPTION_PASSPHRASE = New-RandomText 40
}
$lines = [System.IO.File]::ReadAllText((Resolve-Path 'deploy.env.example')) -split "`r?`n"
$lines = $lines | ForEach-Object {
    $line = $_
    foreach ($key in $values.Keys) { if ($line -match "^$key=") { $line = "$key=$($values[$key])" } }
    $line
}
[System.IO.File]::WriteAllText((Join-Path (Get-Location) 'deploy.env'), (($lines -join "`n").TrimEnd() + "`n"), $utf8)

Write-Host 'Wrote deploy.env. Still edit DOMAIN, TLS_CERT_DIR and the MYSQL_* values (notepad deploy.env).'
Write-Host 'IMPORTANT: copy BACKUP_ENCRYPTION_PASSPHRASE into a password manager now. Without it, encrypted backups cannot be opened.'
