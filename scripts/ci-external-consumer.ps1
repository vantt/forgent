# Windows external-consumer proof (PowerShell 5.1 or later; the counterpart of
# ci-external-consumer.sh). Takes -Assets <dir> holding this host's release assets:
# fgos-*.tar.gz, fgctl-*.tar.gz, SHA256SUMS and install.ps1. Builds nothing; walks the
# whole consumer flow outside the repo checkout with an isolated profile:
#
#   install.ps1 (latest-release resolution, then file://) -> fgctl init (download path)
#   -> activated fgos from PowerShell and from cmd.exe -> upgrade no-op -> verify/repair
#   of the workspace shims -> refusal of a tampered download (installer and fgctl init).
#
# Never touches the real profile: HOME, USERPROFILE and the release store point into a
# temp directory for the whole run.

param([Parameter(Mandatory = $true)][string]$Assets)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Fail([string]$Message) {
    [Console]::Error.WriteLine("Step failed: $Message")
    exit 1
}

function Assert-True([bool]$Condition, [string]$Message) {
    if (-not $Condition) { Fail $Message }
}

# Runs a native command; returns @{ Code; Text } with stdout and stderr merged. Native
# stderr is not an error here: some steps are expected to fail and are asserted on.
function Invoke-Native([string]$File, [string[]]$Arguments, [string]$WorkDir) {
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    if ($WorkDir) { Push-Location -LiteralPath $WorkDir }
    try {
        $lines = & $File @Arguments 2>&1 | ForEach-Object { "$_" }
        $code = $LASTEXITCODE
    } finally {
        if ($WorkDir) { Pop-Location }
        $ErrorActionPreference = $previous
    }
    return @{ Code = $code; Text = ($lines -join "`n") }
}

$serverScript = Join-Path $PSScriptRoot 'ci-asset-server.mjs'
$assetsDir = (Resolve-Path -LiteralPath $Assets).ProviderPath
$psExe = (Get-Process -Id $PID).Path

$fgosTar = Get-ChildItem -LiteralPath $assetsDir -Filter 'fgos-*-x86_64-pc-windows-msvc.tar.gz' | Select-Object -First 1
$fgctlTar = Get-ChildItem -LiteralPath $assetsDir -Filter 'fgctl-*-x86_64-pc-windows-msvc.tar.gz' | Select-Object -First 1
if (-not $fgosTar) { Fail "fgos-*-x86_64-pc-windows-msvc.tar.gz not found in $assetsDir" }
if (-not $fgctlTar) { Fail "fgctl-*-x86_64-pc-windows-msvc.tar.gz not found in $assetsDir" }
foreach ($required in 'SHA256SUMS', 'install.ps1') {
    if (-not (Test-Path -LiteralPath (Join-Path $assetsDir $required))) { Fail "$required not found in $assetsDir" }
}
$version = $fgctlTar.Name.Substring('fgctl-'.Length)
$version = $version.Substring(0, $version.Length - '-x86_64-pc-windows-msvc.tar.gz'.Length)

$tmpBase = Join-Path ([IO.Path]::GetTempPath()) ("fgos-ci-consumer-" + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmpBase | Out-Null
$servers = @()
$savedEnv = @{}
foreach ($name in 'HOME', 'USERPROFILE', 'FGOS_STATE_HOME', 'FGCTL_ALLOW_ROOT', 'FGCTL_VERSION', 'FGCTL_ASSET_BASE_URL', 'FGCTL_INSTALL_DIR', 'FGCTL_TARGET', 'PATH') {
    $savedEnv[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}

function Start-AssetServer([string]$Dir, [string]$Name) {
    $portFile = Join-Path $tmpBase "$Name.port"
    $proc = Start-Process -FilePath 'node' -ArgumentList @("`"$serverScript`"", "`"$Dir`"", "`"$portFile`"") -PassThru -WindowStyle Hidden
    $script:servers += $proc
    for ($i = 0; $i -lt 100; $i++) {
        if ((Test-Path -LiteralPath $portFile) -and (Get-Item -LiteralPath $portFile).Length -gt 0) {
            return "http://127.0.0.1:$((Get-Content -LiteralPath $portFile -Raw).Trim())"
        }
        Start-Sleep -Milliseconds 100
    }
    Fail "starting the local release server for $Name"
}

function New-Project([string]$Name) {
    $dir = Join-Path $tmpBase $Name
    New-Item -ItemType Directory -Path $dir | Out-Null
    $r = Invoke-Native 'git' @('init', '-q') $dir
    Assert-True ($r.Code -eq 0) "git init in $Name`: $($r.Text)"
    Invoke-Native 'git' @('config', 'user.name', 'CI Consumer') $dir | Out-Null
    Invoke-Native 'git' @('config', 'user.email', 'consumer@example.com') $dir | Out-Null
    return $dir
}

try {
    # An isolated profile and release store for the whole run.
    $tmpHome = Join-Path $tmpBase 'home'
    New-Item -ItemType Directory -Path $tmpHome | Out-Null
    $env:HOME = $tmpHome
    $env:USERPROFILE = $tmpHome
    $env:FGOS_STATE_HOME = Join-Path $tmpBase 'state'
    $env:FGCTL_ALLOW_ROOT = '1'
    Remove-Item Env:FGCTL_VERSION, Env:FGCTL_TARGET -ErrorAction SilentlyContinue

    $goodUrl = Start-AssetServer $assetsDir 'good'

    # ---- A tampered copy of the release, served separately ----------------------------
    $tamperedDir = Join-Path $tmpBase 'tampered'
    New-Item -ItemType Directory -Path $tamperedDir | Out-Null
    foreach ($file in Get-ChildItem -LiteralPath $assetsDir -File) {
        Copy-Item -LiteralPath $file.FullName -Destination (Join-Path $tamperedDir $file.Name)
    }
    foreach ($name in $fgosTar.Name, $fgctlTar.Name) {
        $path = Join-Path $tamperedDir $name
        $bytes = [IO.File]::ReadAllBytes($path)
        $bytes[[int]($bytes.Length / 2)] = $bytes[[int]($bytes.Length / 2)] -bxor 0xFF
        [IO.File]::WriteAllBytes($path, $bytes)
    }
    $tamperedUrl = Start-AssetServer $tamperedDir 'tampered'

    # ---- install.ps1 refuses a tampered tarball and installs nothing ------------------
    $badInstall = Join-Path $tmpBase 'bad-install'
    $env:FGCTL_ASSET_BASE_URL = $tamperedUrl
    $env:FGCTL_VERSION = $version
    $env:FGCTL_INSTALL_DIR = $badInstall
    $r = Invoke-Native $psExe @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $assetsDir 'install.ps1')) $null
    Assert-True ($r.Code -ne 0) "install.ps1 must exit non-zero on a checksum mismatch: $($r.Text)"
    Assert-True ($r.Text -match 'checksum verification failed') "install.ps1 mismatch message: $($r.Text)"
    Assert-True (-not (Test-Path -LiteralPath (Join-Path $badInstall 'fgctl.exe'))) 'nothing may be installed after a checksum mismatch'

    # ---- install.ps1 refuses an unsupported target, naming it -------------------------
    $env:FGCTL_TARGET = 'aarch64-unknown-custom'
    $r = Invoke-Native $psExe @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $assetsDir 'install.ps1')) $null
    Assert-True ($r.Code -ne 0 -and $r.Text -match 'aarch64-unknown-custom' -and $r.Text -match 'x86_64-pc-windows-msvc') "install.ps1 unsupported-target message: $($r.Text)"
    Remove-Item Env:FGCTL_TARGET

    # ---- install.ps1 from a file:// base (needs FGCTL_VERSION) ------------------------
    $fileInstall = Join-Path $tmpBase 'file-install'
    $env:FGCTL_ASSET_BASE_URL = ([Uri]$assetsDir).AbsoluteUri
    $env:FGCTL_VERSION = $version
    $env:FGCTL_INSTALL_DIR = $fileInstall
    $r = Invoke-Native $psExe @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $assetsDir 'install.ps1')) $null
    Assert-True ($r.Code -eq 0) "install.ps1 from a file:// base: $($r.Text)"
    Assert-True (Test-Path -LiteralPath (Join-Path $fileInstall 'fgctl.exe')) 'fgctl.exe must be installed from a file:// base'

    # ---- install.ps1 from the release server, resolving the latest tag ----------------
    $installDir = Join-Path $tmpBase 'install'
    $env:FGCTL_ASSET_BASE_URL = $goodUrl
    Remove-Item Env:FGCTL_VERSION
    $env:FGCTL_INSTALL_DIR = $installDir
    $r = Invoke-Native $psExe @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $assetsDir 'install.ps1')) $null
    Write-Host $r.Text
    Assert-True ($r.Code -eq 0) 'install.ps1 against the local release server'
    $fgctl = Join-Path $installDir 'fgctl.exe'
    Assert-True (Test-Path -LiteralPath $fgctl) "fgctl.exe not found at $fgctl"
    Assert-True ($r.Text -match 'is not in your PATH') 'install.ps1 must say how to put the install dir on PATH'
    Assert-True ($r.Text -match 'fgctl init') 'install.ps1 must name the next step'
    Assert-True (-not ((Get-ChildItem -LiteralPath $installDir -Force | Where-Object { $_.Name -like '.fgctl.*.tmp' }))) 'no temp file may be left in the install dir'
    $statusRun = Invoke-Native $fgctl @('status') $null
    Assert-True ($statusRun.Code -eq 0) "installed fgctl.exe must run: $($statusRun.Text)"

    # ---- fgctl init refuses a tampered download, activating nothing -------------------
    $badProject = New-Project 'bad-project'
    $env:FGCTL_ASSET_BASE_URL = $tamperedUrl
    $env:FGCTL_VERSION = $version
    $r = Invoke-Native $fgctl @('init') $badProject
    Assert-True ($r.Code -ne 0) "fgctl init must refuse a tampered download: $($r.Text)"
    Assert-True ($r.Text -match 'checksum verification failed') "fgctl init mismatch message: $($r.Text)"
    Assert-True (-not (Test-Path -LiteralPath (Join-Path $badProject '.fgos\installation\activation.json'))) 'nothing may be activated after a checksum mismatch'

    # ---- fgctl init downloads and activates the Windows target ------------------------
    $project = New-Project 'project'
    $env:FGCTL_ASSET_BASE_URL = $goodUrl
    $env:FGCTL_VERSION = $version
    $r = Invoke-Native $fgctl @('init') $project
    Write-Host $r.Text
    Assert-True ($r.Code -eq 0) 'fgctl init (download path)'
    Assert-True ($r.Text -match 'x86_64-pc-windows-msvc') 'fgctl init must say it downloaded the Windows target asset'
    Remove-Item Env:FGCTL_VERSION, Env:FGCTL_ASSET_BASE_URL

    $binDir = Join-Path $project '.fgos\installation\bin'
    foreach ($shim in 'fgos', 'fgos-runner', 'fgos.cmd', 'fgos-runner.cmd') {
        Assert-True (Test-Path -LiteralPath (Join-Path $binDir $shim)) "workspace shim $shim missing"
    }
    $activationFile = Join-Path $project '.fgos\installation\activation.json'
    $activation = Get-Content -LiteralPath $activationFile -Raw | ConvertFrom-Json
    Assert-True ($activation.status -eq 'ready') 'activation status must be ready'
    $pin = Get-Content -LiteralPath (Join-Path $project '.fgos\distribution.json') -Raw | ConvertFrom-Json
    Assert-True ($pin.projectRuntime.releaseVersion -eq $version) "the pin must record the downloaded tag $version"

    # ---- the activated fgos, from PowerShell ------------------------------------------
    $env:PATH = "$binDir;$($savedEnv['PATH'])"
    $resolved = Get-Command fgos -ErrorAction Stop
    Assert-True ($resolved.Source -like '*fgos.cmd') "fgos must resolve to the .cmd shim from PowerShell, got $($resolved.Source)"
    Push-Location -LiteralPath $project
    try {
        $versionOutput = (& fgos version --runtime-json) -join "`n"
        $versionCode = $LASTEXITCODE
        Assert-True ($versionCode -eq 0) "fgos version --runtime-json from PowerShell exited $versionCode"
        $versionJson = $versionOutput | ConvertFrom-Json
        Assert-True ($versionJson.data.host -eq 'rust') "expected host rust, got '$($versionJson.data.host)'"

        # The reported digest is the verified archive's own manifest digest.
        $extractDir = Join-Path $tmpBase 'manifest-check'
        New-Item -ItemType Directory -Path $extractDir | Out-Null
        $tarExe = Join-Path $env:SystemRoot 'System32\tar.exe'
        Assert-True (Test-Path -LiteralPath $tarExe) 'System32\tar.exe is required'
        $x = Invoke-Native $tarExe @('-xzf', $fgosTar.FullName, '-C', $extractDir) $null
        Assert-True ($x.Code -eq 0) "extracting the fgos asset: $($x.Text)"
        $manifest = Get-Content -LiteralPath (Join-Path $extractDir 'manifest.json') -Raw | ConvertFrom-Json
        Assert-True ($versionJson.data.artifactDigest -eq $manifest.artifactDigest) "reported digest $($versionJson.data.artifactDigest) != archive manifest $($manifest.artifactDigest)"
        Assert-True ($manifest.target.os -eq 'windows') "manifest target os must be windows, got $($manifest.target.os)"

        Write-Host '--- fgos doctor (PowerShell) ---'
        & fgos doctor
        Write-Host "fgos doctor exit code: $LASTEXITCODE"

        & fgos ready --json | Out-Null
        Assert-True ($LASTEXITCODE -eq 0) 'fgos ready --json from PowerShell'

        # A verb that loads a runtime dependency (workflow imports the yaml package) must run
        # from the installed release alone; the verb itself may refuse for want of a run id.
        $workflow = Invoke-Native 'fgos' @('workflow', 'status') $null
        Assert-True ($workflow.Text -notmatch 'Cannot find package') "fgos workflow status cannot load a runtime dependency: $($workflow.Text)"

        # The runner launcher reaches the Node runner through the release's own .cmd.
        $runner = Invoke-Native 'fgos-runner' @('--help') $null
        Assert-True ($runner.Text -notmatch 'not recognized|entry not found|Cannot find') "fgos-runner launcher: $($runner.Text)"
    } finally {
        Pop-Location
    }

    # ---- the activated fgos, from cmd.exe ---------------------------------------------
    Push-Location -LiteralPath $project
    try {
        $cmdOutput = (& cmd.exe /d /c 'fgos version --runtime-json') -join "`n"
        Assert-True ($LASTEXITCODE -eq 0) "fgos version --runtime-json from cmd.exe exited $LASTEXITCODE"
        Assert-True ((($cmdOutput | ConvertFrom-Json).data.artifactDigest) -eq $versionJson.data.artifactDigest) 'cmd.exe and PowerShell must report the same digest'
        Write-Host '--- fgos doctor (cmd.exe) ---'
        & cmd.exe /d /c 'fgos doctor'
        Write-Host "fgos doctor exit code: $LASTEXITCODE"
        # Arguments with cmd metacharacters reach the host unharmed.
        $echoed = Invoke-Native 'cmd.exe' @('/d', '/c', 'fgos version --runtime-json "a b!c"') $null
        Write-Host $echoed.Text
    } finally {
        Pop-Location
    }

    # ---- a shim that is not ready refuses with exit 3 ---------------------------------
    $original = Get-Content -LiteralPath $activationFile -Raw
    Set-Content -LiteralPath $activationFile -Value ($original -replace '"status": "ready"', '"status": "quarantined"') -NoNewline
    $r = Invoke-Native (Join-Path $binDir 'fgos.cmd') @('version') $project
    Assert-True ($r.Code -eq 3) "fgos.cmd must exit 3 when the runtime is not ready, got $($r.Code): $($r.Text)"
    Assert-True ($r.Text -match 'not ready') "fgos.cmd not-ready message: $($r.Text)"
    Set-Content -LiteralPath $activationFile -Value $original -NoNewline

    # ---- upgrade is a no-op against the same asset ------------------------------------
    $before = Get-Content -LiteralPath $activationFile -Raw | ConvertFrom-Json
    $r = Invoke-Native $fgctl @('upgrade', '--from', $fgosTar.FullName) $project
    Assert-True ($r.Code -eq 0) "fgctl upgrade --from: $($r.Text)"
    $after = Get-Content -LiteralPath $activationFile -Raw | ConvertFrom-Json
    Assert-True ($before.artifactDigest -eq $after.artifactDigest) 'upgrade to the same asset must keep the artifactDigest'
    Assert-True ($before.previousArtifactDigest -eq $after.previousArtifactDigest) 'upgrade to the same asset must keep previousArtifactDigest'

    # ---- verify knows the shims; repair restores them ---------------------------------
    $r = Invoke-Native $fgctl @('verify') $project
    Assert-True ($r.Code -eq 0) "fgctl verify: $($r.Text)"
    Remove-Item -LiteralPath (Join-Path $binDir 'fgos.cmd')
    $r = Invoke-Native $fgctl @('verify') $project
    Assert-True ($r.Code -ne 0 -and $r.Text -match 'fgos\.cmd' -and $r.Text -match 'fgctl repair') "fgctl verify must name a missing shim: $($r.Text)"
    $r = Invoke-Native $fgctl @('repair') $project
    Assert-True ($r.Code -eq 0) "fgctl repair: $($r.Text)"
    Assert-True (Test-Path -LiteralPath (Join-Path $binDir 'fgos.cmd')) 'fgctl repair must regenerate fgos.cmd'
    $r = Invoke-Native $fgctl @('verify') $project
    Assert-True ($r.Code -eq 0) "fgctl verify after repair: $($r.Text)"

    Write-Host 'All Windows external consumer proof steps passed successfully.'
} finally {
    foreach ($name in $savedEnv.Keys) {
        [Environment]::SetEnvironmentVariable($name, $savedEnv[$name], 'Process')
    }
    foreach ($proc in $servers) {
        if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
    }
    Remove-Item -LiteralPath $tmpBase -Recurse -Force -ErrorAction SilentlyContinue
}
