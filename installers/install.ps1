# Install the Download Router native messaging host on Windows.
# Usage: powershell -ExecutionPolicy Bypass -File install.ps1 [path-to-host-binary]
$ErrorActionPreference = "Stop"

$HostName = "download_router"
$ExtensionId = "download-router@bosscorp.fr"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BinSrc = if ($args.Count -ge 1) { $args[0] } else { Join-Path $ScriptDir "download-router-host.exe" }
if (-not (Test-Path $BinSrc)) {
  throw "Native host binary not found: $BinSrc"
}

$InstallDir = Join-Path $env:APPDATA "download-router"
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

$BinDest = Join-Path $InstallDir "download-router-host.exe"
Copy-Item -Force $BinSrc $BinDest

$Config = Join-Path $InstallDir "config.json"
if (-not (Test-Path $Config)) {
  '{ "allowedRoots": ["~"] }' | Set-Content -Encoding UTF8 $Config
}

$Manifest = Join-Path $InstallDir "$HostName.json"
[ordered]@{
  name               = $HostName
  description        = "Download Router native messaging host"
  path               = $BinDest
  type               = "stdio"
  allowed_extensions = @($ExtensionId)
} | ConvertTo-Json | Set-Content -Encoding UTF8 $Manifest

$RegPath = "HKCU:\SOFTWARE\Mozilla\NativeMessagingHosts\$HostName"
New-Item -Path $RegPath -Force | Out-Null
Set-ItemProperty -Path $RegPath -Name "(Default)" -Value $Manifest

Write-Host "Installed native host:"
Write-Host "  binary:   $BinDest"
Write-Host "  manifest: $Manifest"
