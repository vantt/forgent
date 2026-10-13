# fgctl installer for Windows (PowerShell 5.1 or later; no Git Bash, no WSL, no admin).
#
#   irm https://github.com/vantt/forgent/releases/latest/download/install.ps1 | iex
#
# Same contract as install.sh: downloads fgctl-<tag>-<target>.tar.gz and SHA256SUMS,
# refuses unless the tarball's own SHA256SUMS entry matches, and installs fgctl.exe.
# Nothing is added to PATH; the script prints how.
#
# Environment (same names and meaning as install.sh):
#   FGCTL_VERSION         release tag to install (default: the latest NON-prerelease;
#                         a pre-release such as v0.2.0-rc.2 needs this set)
#   FGCTL_INSTALL_DIR     where fgctl.exe goes (default: %LOCALAPPDATA%\fgos\bin)
#   FGCTL_ASSET_BASE_URL  where release assets live (default: the GitHub release);
#                         http://, https:// or file://
#   FGCTL_TARGET          release target (default: detected; only x86_64-pc-windows-msvc)
#   FGCTL_ALLOW_ROOT=1    allow running from an elevated (Administrator) session

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Install-Fgctl {
    $supportedTargets = @('x86_64-pc-windows-msvc')
    $onWindows = ($env:OS -eq 'Windows_NT')

    # Never install into an administrator's profile by accident.
    if ($onWindows -and $env:FGCTL_ALLOW_ROOT -ne '1') {
        $principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
        if ($principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
            throw 'running from an elevated (Administrator) session is not permitted by default. Set FGCTL_ALLOW_ROOT=1 to allow.'
        }
    }

    # An older Windows PowerShell negotiates TLS 1.0/1.1 by default, which GitHub refuses.
    try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch { }

    # Target detection and override.
    if ($env:FGCTL_TARGET) {
        $target = $env:FGCTL_TARGET
    } else {
        $arch = $env:PROCESSOR_ARCHITEW6432
        if (-not $arch) { $arch = $env:PROCESSOR_ARCHITECTURE }
        if ($onWindows -and $arch -eq 'AMD64') {
            $target = 'x86_64-pc-windows-msvc'
        } else {
            $target = "$([string]$env:OS)-$arch"
        }
    }
    if ($supportedTargets -notcontains $target) {
        throw "target '$target' is not supported. Supported targets: $($supportedTargets -join ', ')"
    }

    $baseOverride = $env:FGCTL_ASSET_BASE_URL
    if ($baseOverride) { $baseOverride = $baseOverride.TrimEnd('/') }

    function Get-Asset([string]$Url, [string]$Dest) {
        if ($Url -like 'file://*') {
            Copy-Item -LiteralPath ([Uri]$Url).LocalPath -Destination $Dest -Force
        } else {
            Invoke-WebRequest -Uri $Url -OutFile $Dest -UseBasicParsing -TimeoutSec 120 | Out-Null
        }
    }

    # Version resolution: the latest release is the one /releases/latest redirects to.
    if ($env:FGCTL_VERSION) {
        $version = $env:FGCTL_VERSION
    } else {
        if ($baseOverride -like 'file://*') {
            throw 'cannot resolve the latest release from a file:// base URL; set FGCTL_VERSION=<tag>'
        }
        if ($baseOverride) { $latestUrl = "$baseOverride/releases/latest" } else { $latestUrl = 'https://github.com/vantt/forgent/releases/latest' }
        try {
            $resp = Invoke-WebRequest -Uri $latestUrl -Method Head -UseBasicParsing -TimeoutSec 120 -MaximumRedirection 10
        } catch {
            throw "failed to resolve latest version from ${latestUrl}: $($_.Exception.Message) (pre-releases are never `"latest`"; set FGCTL_VERSION=<tag>)"
        }
        $final = $null
        if ($resp.BaseResponse.ResponseUri) {
            $final = $resp.BaseResponse.ResponseUri.AbsoluteUri
        } elseif ($resp.BaseResponse.RequestMessage) {
            $final = $resp.BaseResponse.RequestMessage.RequestUri.AbsoluteUri
        }
        if (-not $final) { throw "failed to resolve latest version from $latestUrl" }
        $final = ($final -split '[?#]')[0].TrimEnd('/')
        $version = $final.Substring($final.LastIndexOf('/') + 1)
        if (-not $version -or $version -eq 'latest') {
            throw "failed to resolve latest version from $latestUrl; set FGCTL_VERSION=<tag>"
        }
    }
    if ($version -notmatch '^[A-Za-z0-9._+-]+$') {
        throw "invalid release tag '$version': only letters, digits, '.', '_', '+' and '-' are allowed"
    }

    $tarball = "fgctl-$version-$target.tar.gz"
    if ($baseOverride) { $assetBase = $baseOverride } else { $assetBase = "https://github.com/vantt/forgent/releases/download/$version" }

    $tmp = Join-Path ([IO.Path]::GetTempPath()) ("fgctl-install-" + [Guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $tmp | Out-Null
    $tempBin = $null
    try {
        $tarballPath = Join-Path $tmp $tarball
        $sumsPath = Join-Path $tmp 'SHA256SUMS'
        try { Get-Asset "$assetBase/$tarball" $tarballPath } catch { throw "failed to download $tarball from ${assetBase}/${tarball}: $($_.Exception.Message)" }
        try { Get-Asset "$assetBase/SHA256SUMS" $sumsPath } catch { throw "failed to download SHA256SUMS from ${assetBase}/SHA256SUMS: $($_.Exception.Message)" }

        # Checksum verification against the tarball's own line in SHA256SUMS: the file
        # name field must match exactly (a leading binary-mode '*' is ignored), never a
        # substring, so a sibling entry cannot be selected.
        $expected = $null
        foreach ($line in [IO.File]::ReadAllLines($sumsPath)) {
            $fields = $line.Trim() -split '\s+'
            if ($fields.Count -lt 2) { continue }
            $name = $fields[1]
            if ($name.StartsWith('*')) { $name = $name.Substring(1) }
            if ($name -ceq $tarball) { $expected = $fields[0]; break }
        }
        if (-not $expected) { throw "no checksum entry found for $tarball in SHA256SUMS" }
        if ($expected -notmatch '^[0-9A-Fa-f]{64}$') { throw "invalid checksum entry for $tarball in SHA256SUMS" }
        $actual = (Get-FileHash -LiteralPath $tarballPath -Algorithm SHA256).Hash
        if ($actual -ine $expected) { throw "checksum verification failed for $tarball" }

        # Extract with the tar that ships in Windows 10 and later (bsdtar). System32 first:
        # a GNU tar earlier on PATH (Git for Windows) mistakes 'C:' for a remote host.
        $extractDir = Join-Path $tmp 'extracted'
        New-Item -ItemType Directory -Path $extractDir | Out-Null
        $tarExe = $null
        if ($env:SystemRoot) {
            $candidate = Join-Path $env:SystemRoot 'System32\tar.exe'
            if (Test-Path -LiteralPath $candidate) { $tarExe = $candidate }
        }
        if (-not $tarExe) {
            $found = Get-Command tar -ErrorAction SilentlyContinue
            if ($found) { $tarExe = $found.Source }
        }
        if (-not $tarExe) { throw 'tar is required to unpack the release but was not found (it ships with Windows 10 and later)' }
        & $tarExe -xzf $tarballPath -C $extractDir
        if ($LASTEXITCODE -ne 0) { throw "failed to extract $tarball" }

        # A symlink entry would install its target's bytes instead of the binary the
        # checksum covered; refuse one explicitly.
        $exeName = 'fgctl.exe'
        $top = Join-Path $extractDir $exeName
        $fgctlBin = $null
        if (Test-Path -LiteralPath $top -PathType Leaf) {
            $fgctlBin = Get-Item -LiteralPath $top -Force
        } else {
            $fgctlBin = Get-ChildItem -LiteralPath $extractDir -Recurse -File -Force -Filter $exeName | Select-Object -First 1
        }
        if (-not $fgctlBin) { throw "fgctl binary not found in $tarball" }
        if ($fgctlBin.Attributes -band [IO.FileAttributes]::ReparsePoint) {
            throw "fgctl binary is a symlink, which is refused, in $tarball"
        }

        if ($env:FGCTL_INSTALL_DIR) {
            $installDir = $env:FGCTL_INSTALL_DIR
        } elseif ($env:LOCALAPPDATA) {
            $installDir = Join-Path $env:LOCALAPPDATA 'fgos\bin'
        } else {
            $installDir = Join-Path $HOME '.local/bin'
        }
        New-Item -ItemType Directory -Path $installDir -Force | Out-Null
        $installDir = (Resolve-Path -LiteralPath $installDir).ProviderPath

        $tempBin = Join-Path $installDir ".fgctl.$PID.tmp"
        Copy-Item -LiteralPath $fgctlBin.FullName -Destination $tempBin -Force
        $finalBin = Join-Path $installDir $exeName
        try {
            Move-Item -LiteralPath $tempBin -Destination $finalBin -Force
        } catch {
            throw "could not replace $finalBin (is fgctl running? close it and retry): $($_.Exception.Message)"
        }
        $tempBin = $null

        # PATH advisory. Nothing is changed on the user's behalf.
        $installClean = $installDir.TrimEnd('\', '/')
        $onPath = $false
        foreach ($entry in ($env:PATH -split [IO.Path]::PathSeparator)) {
            if ($entry -and ($entry.TrimEnd('\', '/') -ieq $installClean)) { $onPath = $true; break }
        }
        if (-not $onPath) {
            Write-Host ''
            Write-Host "Notice: $installClean is not in your PATH."
            Write-Host 'Use it in this session only:'
            Write-Host "  `$env:Path = `"$installClean;`$env:Path`""
            Write-Host 'Or add it for your user account (new terminals pick it up):'
            Write-Host "  [Environment]::SetEnvironmentVariable('Path', `"$installClean;`" + [Environment]::GetEnvironmentVariable('Path', 'User'), 'User')"
        }

        Write-Host ''
        Write-Host "Installed fgctl successfully to $finalBin"
        Write-Host 'Next step:'
        Write-Host '  fgctl init'
    } finally {
        if ($tempBin -and (Test-Path -LiteralPath $tempBin)) { Remove-Item -LiteralPath $tempBin -Force -ErrorAction SilentlyContinue }
        Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
    }
}

try {
    Install-Fgctl
} catch {
    [Console]::Error.WriteLine("Error: $($_.Exception.Message)")
    # Run as a file, the exit code reports the failure. Piped into iex there is no file;
    # `exit` would close the user's terminal, so only the error is shown.
    if ($PSCommandPath) { exit 1 } else { $global:LASTEXITCODE = 1 }
}
