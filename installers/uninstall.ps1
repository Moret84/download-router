# Remove the Download Router native messaging host on Windows.
$ErrorActionPreference = "Stop"

$HostName = "download_router"
$InstallDir = Join-Path $env:APPDATA "download-router"
$RegPath = "HKCU:\SOFTWARE\Mozilla\NativeMessagingHosts\$HostName"

if (Test-Path $RegPath) {
  Remove-Item -Path $RegPath -Recurse -Force
}
if (Test-Path $InstallDir) {
  Remove-Item -Path $InstallDir -Recurse -Force
}

Write-Host "Removed the native host registry key and install directory."
