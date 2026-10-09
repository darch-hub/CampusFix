# Reusable CampusFix Android APK build (Windows, no admin required).
# Prerequisites (one-time, user-local under %LOCALAPPDATA%\CampusFixAndroid):
#   jdk\jdk-17.0.20.1+1          - Microsoft OpenJDK 17 (official zip)
#   android-sdk\                  - Android cmdline-tools + platform-tools,
#                                  platforms;android-34, build-tools;34.0.0
#   campusfix-release.keystore    - release signing key (BACK IT UP - updates
#                                  to an installed app require the same key)
#   signing.env                   - BUBBLEWRAP_KEYSTORE_PASSWORD=... and
#                                  BUBBLEWRAP_KEY_PASSWORD=... (never commit)
#   twa\twa-manifest.json         - Bubblewrap TWA manifest (package com.campusfix.app)
# Usage: powershell -ExecutionPolicy Bypass -File scripts\build-android-apk.ps1
$ErrorActionPreference = "Stop"

$base = Join-Path $env:LOCALAPPDATA "CampusFixAndroid"
$twaDir = Join-Path $base "twa"
$outDir = Join-Path (Split-Path $PSScriptRoot -Parent) "dist-android"

foreach ($p in @(
    "$base\jdk\jdk-17.0.20.1+1\bin\java.exe",
    "$base\android-sdk\platform-tools\adb.exe",
    "$base\android-sdk\build-tools\34.0.0\apksigner.bat",
    "$base\campusfix-release.keystore",
    "$base\signing.env",
    "$twaDir\twa-manifest.json")) {
  if (-not (Test-Path $p)) { throw "Missing prerequisite: $p" }
}

$env:JAVA_HOME = "$base\jdk\jdk-17.0.20.1+1"
$env:ANDROID_HOME = "$base\android-sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
foreach ($l in Get-Content "$base\signing.env") {
  $k, $v = $l -split '=', 2
  if ($k -and $v) { Set-Item "env:$k" $v }
}
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Push-Location $twaDir
try {
  $cli = "$env:APPDATA\npm\node_modules\@bubblewrap\cli\bin\bubblewrap.js"
  & node $cli update --skipVersionUpgrade
  & node $cli build
  $apk = Get-ChildItem "$twaDir\app-release-signed.apk" | Select-Object -First 1
  if (-not $apk) { throw "Build finished but app-release-signed.apk not found in $twaDir" }
  $dest = Join-Path $outDir "CampusFix-v1.0.0-release.apk"
  Copy-Item $apk.FullName $dest -Force
  echo "APK: $dest"
  (Get-FileHash $dest -Algorithm SHA256).Hash
} finally {
  Pop-Location
}
