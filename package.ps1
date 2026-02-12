$ErrorActionPreference = "Stop"

# 設定
$TargetDir = "."
$TmpDir = Join-Path $TargetDir "package_tmp"
$OutputDir = Join-Path $TargetDir "package"

# バージョン取得
function Get-Version {
    $manifestPath = $null
    if (Test-Path (Join-Path $TargetDir "manifest.json")) {
        $manifestPath = Join-Path $TargetDir "manifest.json"
    } elseif (Test-Path (Join-Path $TargetDir "manifest_firefox.json")) {
        $manifestPath = Join-Path $TargetDir "manifest_firefox.json"
    } else {
        return "0_0_0"
    }

    $json = Get-Content $manifestPath -Raw | ConvertFrom-Json
    if (-not $json.version) { return "0_0_0" }
    return ($json.version.ToString() -replace '\.', '_')
}

$Version = Get-Version
Write-Host "version: $Version"

$ZipFirefox = "CSLT_Firefox_${Version}.zip"
$ZipChrome  = "CSLT_Chromium_${Version}.zip"

# 初期化
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
Remove-Item -Recurse -Force -ErrorAction Ignore $TmpDir
New-Item -ItemType Directory -Force -Path $TmpDir | Out-Null

# フォルダ除外
$ExcludeDirs = @(
    ".git",
    "package_tmp",
    "package",
    "node_modules"
)

# ファイル除外
$ExcludeFiles = @(
    ".gitignore",
    "README.md",
    ".DS_Store",
    "*.sh",
    "*.ps1"
)

function Invoke-RoboCopy {
    param(
        [Parameter(Mandatory=$true)][string]$Source,
        [Parameter(Mandatory=$true)][string]$Dest,
        [string[]]$XD,
        [string[]]$XF
    )

    $args = @(
        $Source, $Dest,
        "/E", "/R:0", "/W:0",
        "/NFL", "/NDL", "/NJH", "/NJS"
    )

    if ($XD -and $XD.Count -gt 0) { $args += "/XD"; $args += $XD }
    if ($XF -and $XF.Count -gt 0) { $args += "/XF"; $args += $XF }

    $null = & robocopy @args

    if ($LASTEXITCODE -ge 8) {
        throw "robocopy に失敗しました $LASTEXITCODE"
    }
}

# Firefox 用 ZIP 作成
Invoke-RoboCopy -Source $TargetDir -Dest $TmpDir -XD $ExcludeDirs -XF $ExcludeFiles

$ffManifest = Join-Path $TmpDir "manifest_firefox.json"
$mainManifest = Join-Path $TmpDir "manifest.json"
if (Test-Path $ffManifest) {
    Move-Item $ffManifest $mainManifest -Force
}

$ffZipPath = Join-Path $OutputDir $ZipFirefox
if (Test-Path $ffZipPath) { Remove-Item -Force $ffZipPath }
Compress-Archive -Path (Join-Path $TmpDir "*") -DestinationPath $ffZipPath -Force

Remove-Item -Recurse -Force $TmpDir
New-Item -ItemType Directory -Force -Path $TmpDir | Out-Null

# Chrome 用 ZIP 作成
Invoke-RoboCopy -Source $TargetDir -Dest $TmpDir -XD $ExcludeDirs -XF ($ExcludeFiles + @("manifest_firefox.json"))

$chZipPath = Join-Path $OutputDir $ZipChrome
if (Test-Path $chZipPath) { Remove-Item -Force $chZipPath }
Compress-Archive -Path (Join-Path $TmpDir "*") -DestinationPath $chZipPath -Force

Remove-Item -Recurse -Force $TmpDir

Write-Host "ZIP圧縮が完了しました:"
Write-Host " - Firefox版: $ffZipPath"
Write-Host " - Chrome版:  $chZipPath"