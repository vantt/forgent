//! Source selection and verified download for `fgctl init` and `fgctl upgrade`.
//!
//! `fgctl init` and `fgctl upgrade` can take a release from a local path, from
//! a URL, or from a GitHub release asset. Anything that crosses the network
//! goes through the system `curl` (same flags, timeouts and
//! `FGCTL_ASSET_BASE_URL` override as `install.sh`) and is verified against the
//! release's `SHA256SUMS` before a single byte of it is handed to staging. A
//! missing entry or a mismatch is a refusal, never a warning.

use sha2::{Digest, Sha256};
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

/// Where release assets live when `FGCTL_ASSET_BASE_URL` is not set.
pub const DEFAULT_RELEASE_REPO_URL: &str = "https://github.com/vantt/forgent";

/// Targets a release asset is published for (mirrors `install.sh` and
/// `install.ps1`). Adding a platform is one row here and one in
/// [`host_target`], plus a matrix row in the release workflow.
pub const SUPPORTED_TARGETS: &[&str] = &["x86_64-unknown-linux-gnu", "x86_64-pc-windows-msvc"];

/// The release target triple for a host OS/architecture pair (the values of
/// `std::env::consts::OS` and `ARCH`), or `None` when no release is published
/// for it.
pub fn host_target(os: &str, arch: &str) -> Option<&'static str> {
    match (os, arch) {
        ("linux", "x86_64") => Some("x86_64-unknown-linux-gnu"),
        ("windows", "x86_64") => Some("x86_64-pc-windows-msvc"),
        _ => None,
    }
}

/// Where `curl` discards a response body (`-o`): `NUL` on Windows, where
/// `/dev/null` does not exist.
fn null_device() -> &'static str {
    if cfg!(windows) {
        "NUL"
    } else {
        "/dev/null"
    }
}

/// Same bounds as `install.sh`: a server that connects but never finishes
/// cannot hang `fgctl init` and TLS below 1.2 is refused. [`check_transport`]
/// limits the first URL before curl runs and the URL curl ended at afterwards;
/// [`redirect_protocols`] decides where a redirect may lead.
const CURL_ARGS: [&str; 8] = [
    "-fsSL",
    "--connect-timeout",
    "15",
    "--max-time",
    "120",
    "--proto",
    "=https,http,file",
    "--tlsv1.2",
];

/// Byte caps per download, as in `install.sh`: the fgOS release tarball is
/// about 17 MiB, so the asset cap leaves generous headroom and still stops a
/// server that streams without end.
pub const MAX_ASSET_BYTES: u64 = 128 * 1024 * 1024;
pub const MAX_CHECKSUMS_BYTES: u64 = 1024 * 1024;

const CHECKSUMS_FILE: &str = "SHA256SUMS";

#[derive(Debug, thiserror::Error)]
pub enum FetchError {
    #[error("target '{target}' is not supported. Supported targets: {supported}. There is no prebuilt fgctl for it; build from source: git clone https://github.com/vantt/forgent && cargo build --release -p fgctl")]
    UnsupportedTarget { target: String, supported: String },
    #[error("curl is required to download a release but was not found on PATH; install curl or pass a local --from path")]
    CurlMissing,
    #[error("download of {url} failed ({detail})")]
    Download { url: String, detail: String },
    #[error("invalid release tag '{0}': only letters, digits, '.', '_', '+' and '-' are allowed")]
    InvalidTag(String),
    #[error("could not resolve the latest release from {url}: {detail}; set FGCTL_VERSION=<tag> (pre-releases are never \"latest\")")]
    LatestUnresolved { url: String, detail: String },
    #[error("invalid source URL '{0}': expected http://, https:// or file:// ending in a .tar.gz file name, with no query or fragment")]
    InvalidUrl(String),
    #[error("refusing {0}: only https:// and file:// URLs are allowed, and http:// only for a loopback host (127.0.0.0/8, ::1, localhost)")]
    InsecureUrl(String),
    #[error("{url} is larger than the {limit} byte limit; refusing it")]
    TooLarge { url: String, limit: u64 },
    #[error("no checksum entry found for {asset} in SHA256SUMS; refusing to use it")]
    ChecksumMissing { asset: String },
    #[error("SHA256SUMS lists {asset} more than once; refusing to choose between the entries")]
    ChecksumAmbiguous { asset: String },
    #[error("checksum verification failed for {asset}: SHA256SUMS says {expected}, downloaded file is {actual}")]
    ChecksumMismatch {
        asset: String,
        expected: String,
        actual: String,
    },
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
}

/// Where `fgctl init` takes its release from, after precedence is applied.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SourceChoice {
    /// A local tarball or release directory.
    Local(PathBuf),
    /// A `.tar.gz` URL (with a sibling `SHA256SUMS`).
    Url(String),
    /// A GitHub release asset; `None` means the latest release.
    Release(Option<String>),
    /// No explicit source: the project's committed pin decides.
    Pinned,
}

/// The raw inputs that decide a [`SourceChoice`]. Empty strings count as unset.
#[derive(Debug, Clone, Default)]
pub struct SourceInputs {
    /// `--from <path | URL>`
    pub from_flag: Option<String>,
    /// `FGCTL_FROM=<path | URL>`
    pub env_from: Option<String>,
    /// `FGCTL_VERSION=<tag>`
    pub env_version: Option<String>,
}

impl SourceInputs {
    /// Reads `FGCTL_FROM` and `FGCTL_VERSION` from the process environment.
    pub fn from_env(from_flag: Option<String>) -> Self {
        SourceInputs {
            from_flag,
            env_from: std::env::var("FGCTL_FROM").ok(),
            env_version: std::env::var("FGCTL_VERSION").ok(),
        }
    }
}

/// Where release downloads go. `None` fields fall back to the defaults.
#[derive(Debug, Clone, Default)]
pub struct DownloadEndpoint {
    /// `FGCTL_ASSET_BASE_URL`
    pub asset_base_url: Option<String>,
    /// `FGCTL_TARGET`
    pub target: Option<String>,
}

impl DownloadEndpoint {
    /// Reads `FGCTL_ASSET_BASE_URL` and `FGCTL_TARGET` from the process environment.
    pub fn from_env() -> Self {
        DownloadEndpoint {
            asset_base_url: std::env::var("FGCTL_ASSET_BASE_URL").ok(),
            target: std::env::var("FGCTL_TARGET").ok(),
        }
    }
}

fn non_empty(value: &Option<String>) -> Option<&str> {
    value.as_deref().map(str::trim).filter(|s| !s.is_empty())
}

/// https:// and file:// always; http:// only for a loopback host. There is no
/// escape hatch: a mirror on plain http would let anyone on the path replace
/// the archive and its `SHA256SUMS` together.
fn check_transport(url: &str) -> Result<(), FetchError> {
    let refused = || FetchError::InsecureUrl(url.to_string());
    if url
        .chars()
        .any(|c| c == '\\' || c.is_whitespace() || c.is_control())
    {
        return Err(refused());
    }
    if url.starts_with("https://") || url.starts_with("file://") {
        return Ok(());
    }
    let rest = url.strip_prefix("http://").ok_or_else(refused)?;
    let authority = rest.split(['/', '?', '#']).next().unwrap_or("");
    let host_port = authority.rsplit('@').next().unwrap_or("");
    if is_loopback_host_port(host_port) {
        Ok(())
    } else {
        Err(refused())
    }
}

/// `host[:port]` where the host is `localhost`, `[::1]` or an address in
/// 127.0.0.0/8 (Rust's parser refuses octal-looking octets).
fn is_loopback_host_port(host_port: &str) -> bool {
    let (host, port, bracketed) = match host_port.strip_prefix('[') {
        Some(rest) => {
            let Some((inner, after)) = rest.split_once(']') else {
                return false;
            };
            match after {
                "" => (inner, None, true),
                _ => match after.strip_prefix(':') {
                    Some(port) => (inner, Some(port), true),
                    None => return false,
                },
            }
        }
        None => match host_port.split_once(':') {
            Some((host, port)) => (host, Some(port), false),
            None => (host_port, None, false),
        },
    };
    if port.is_some_and(|p| !p.chars().all(|c| c.is_ascii_digit())) {
        return false;
    }
    if bracketed {
        return host
            .parse::<std::net::Ipv6Addr>()
            .is_ok_and(|ip| ip.is_loopback());
    }
    host == "localhost"
        || host
            .parse::<std::net::Ipv4Addr>()
            .is_ok_and(|ip| ip.is_loopback())
}

pub fn is_url(value: &str) -> bool {
    ["http://", "https://", "file://"]
        .iter()
        .any(|scheme| value.starts_with(scheme))
}

/// Precedence: `--from` flag > `FGCTL_FROM` > `FGCTL_VERSION` > the project's
/// committed pin > the latest release. An explicit choice always wins over the
/// pin (a pin then only validates what was fetched); `has_pin` only decides
/// what "nothing explicit" means.
pub fn choose_source(inputs: &SourceInputs, has_pin: bool) -> SourceChoice {
    let explicit_from = non_empty(&inputs.from_flag).or_else(|| non_empty(&inputs.env_from));
    if let Some(from) = explicit_from {
        return if is_url(from) {
            SourceChoice::Url(from.to_string())
        } else {
            SourceChoice::Local(PathBuf::from(from))
        };
    }
    if let Some(version) = non_empty(&inputs.env_version) {
        return SourceChoice::Release(Some(version.to_string()));
    }
    if has_pin {
        SourceChoice::Pinned
    } else {
        SourceChoice::Release(None)
    }
}

/// Resolves the release target triple the same way `install.sh` does.
pub fn detect_target(override_target: Option<&str>) -> Result<String, FetchError> {
    detect_target_for(
        override_target,
        std::env::consts::OS,
        std::env::consts::ARCH,
    )
}

/// [`detect_target`] for an explicit host, so every platform's answer can be
/// tested from any machine.
pub fn detect_target_for(
    override_target: Option<&str>,
    os: &str,
    arch: &str,
) -> Result<String, FetchError> {
    let target = match override_target.map(str::trim).filter(|t| !t.is_empty()) {
        Some(t) => t.to_string(),
        None => host_target(os, arch)
            .map(str::to_string)
            .unwrap_or_else(|| format!("{os}-{arch}")),
    };
    if SUPPORTED_TARGETS.contains(&target.as_str()) {
        Ok(target)
    } else {
        Err(FetchError::UnsupportedTarget {
            target,
            supported: SUPPORTED_TARGETS.join(", "),
        })
    }
}

fn is_safe_token(value: &str) -> bool {
    !value.is_empty()
        && value
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '+' | '-'))
}

fn validate_tag(tag: &str) -> Result<(), FetchError> {
    if is_safe_token(tag) {
        Ok(())
    } else {
        Err(FetchError::InvalidTag(tag.to_string()))
    }
}

/// A scratch directory removed when dropped.
#[derive(Debug)]
struct ScratchDir(PathBuf);

impl ScratchDir {
    fn create() -> std::io::Result<Self> {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        let dir = std::env::temp_dir().join("fgos-work").join(format!(
            "fgctl-fetch-{}-{}",
            std::process::id(),
            nanos
        ));
        std::fs::create_dir_all(&dir)?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&dir, std::fs::Permissions::from_mode(0o700))?;
        }
        Ok(ScratchDir(dir))
    }
}

impl Drop for ScratchDir {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}

/// A downloaded, checksum-verified tarball. The file lives in a scratch
/// directory that is removed when this value is dropped.
#[derive(Debug)]
pub struct Downloaded {
    pub tarball: PathBuf,
    /// Human-readable origin for progress output.
    pub origin: String,
    /// The release tag this was downloaded as (`None` for a bare URL).
    pub tag: Option<String>,
    _scratch: ScratchDir,
}

/// A redirect from an https or file URL may only lead to https; one from a
/// loopback http URL (a local mirror) may also stay on http, which
/// [`check_transport`] then holds to loopback.
fn redirect_protocols(url: &str) -> &'static str {
    if url.starts_with("http://") {
        "=https,http"
    } else {
        "=https"
    }
}

/// Runs curl against `url` after the scheme gate and returns the URL curl
/// ended at (`-w %{url_effective}` on stdout), which is checked the same way so
/// a redirect cannot reach plain http. `max_bytes` caps the body curl is
/// willing to read; the caller still checks what landed on disk.
fn run_curl(extra: &[&str], url: &str, max_bytes: Option<u64>) -> Result<Vec<u8>, FetchError> {
    check_transport(url)?;
    let mut command = Command::new("curl");
    command
        .args(CURL_ARGS)
        .args(["--proto-redir", redirect_protocols(url)])
        .args(["-w", "%{url_effective}"]);
    if let Some(max) = max_bytes {
        command.arg("--max-filesize").arg(max.to_string());
    }
    let output = command
        .args(extra)
        .arg("--url")
        .arg(url)
        .output()
        .map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                FetchError::CurlMissing
            } else {
                FetchError::Io(e)
            }
        })?;
    if output.status.success() {
        let effective = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !effective.is_empty() {
            check_transport(&effective)?;
        }
        Ok(output.stdout)
    } else if let (Some(63), Some(limit)) = (output.status.code(), max_bytes) {
        Err(FetchError::TooLarge {
            url: url.to_string(),
            limit,
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        let detail = match output.status.code() {
            Some(code) if stderr.is_empty() => format!("curl exit {code}"),
            Some(code) => format!("curl exit {code}: {stderr}"),
            None => "curl terminated by signal".to_string(),
        };
        Err(FetchError::Download {
            url: url.to_string(),
            detail,
        })
    }
}

fn curl_to_file(url: &str, dest: &Path, max_bytes: u64) -> Result<(), FetchError> {
    let dest_str = dest.to_string_lossy();
    run_curl(&["-o", dest_str.as_ref()], url, Some(max_bytes))?;
    ensure_within_cap(dest, max_bytes, url)
}

/// curl enforces the cap only when the server announces a length (and not for
/// every scheme), so what actually landed on disk is measured too.
fn ensure_within_cap(path: &Path, limit: u64, url: &str) -> Result<(), FetchError> {
    if std::fs::metadata(path)?.len() > limit {
        return Err(FetchError::TooLarge {
            url: url.to_string(),
            limit,
        });
    }
    Ok(())
}

/// Resolves the tag of the latest (non-pre-release) release by following
/// `<base>/releases/latest` and reading the final URL, as `install.sh` does.
fn resolve_latest_tag(endpoint: &DownloadEndpoint) -> Result<String, FetchError> {
    let base = match non_empty(&endpoint.asset_base_url) {
        Some(b) => b.trim_end_matches('/').to_string(),
        None => DEFAULT_RELEASE_REPO_URL.to_string(),
    };
    let latest_url = format!("{base}/releases/latest");
    let out = run_curl(&["-o", null_device()], &latest_url, None)?;
    let effective = String::from_utf8_lossy(&out).to_string();
    let effective = effective.split(['?', '#']).next().unwrap_or("");
    let tag = effective
        .trim_end_matches('/')
        .rsplit('/')
        .next()
        .unwrap_or("");
    if tag.is_empty() || tag == "latest" {
        return Err(FetchError::LatestUnresolved {
            url: latest_url,
            detail: format!("no release redirect (ended at '{}')", effective),
        });
    }
    validate_tag(tag)?;
    Ok(tag.to_string())
}

/// Finds `asset` in a `sha256sum`-style file and returns its lowercase hex hash.
/// The file-name field must match exactly (a leading binary-mode `*` is
/// ignored), never a substring, and exactly one line may name the asset.
fn find_checksum(sums: &str, asset: &str) -> Result<String, FetchError> {
    let mut hashes = sums.lines().filter_map(|line| {
        let mut fields = line.split_whitespace();
        let (hash, name) = (fields.next()?, fields.next()?);
        (name.strip_prefix('*').unwrap_or(name) == asset).then_some(hash)
    });
    let missing = || FetchError::ChecksumMissing {
        asset: asset.to_string(),
    };
    let hash = hashes.next().ok_or_else(missing)?;
    if hashes.next().is_some() {
        return Err(FetchError::ChecksumAmbiguous {
            asset: asset.to_string(),
        });
    }
    let valid = hash.len() == 64 && hash.chars().all(|c| c.is_ascii_hexdigit());
    valid.then(|| hash.to_ascii_lowercase()).ok_or_else(missing)
}

fn sha256_hex(path: &Path) -> std::io::Result<String> {
    let mut file = std::fs::File::open(path)?;
    let mut hasher = Sha256::new();
    let mut buf = [0u8; 64 * 1024];
    loop {
        let n = file.read(&mut buf)?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

/// Downloads `<base>/<asset>` and `<base>/SHA256SUMS` into a scratch dir and
/// refuses unless the asset's own entry in SHA256SUMS matches.
fn download_verified(base: &str, asset: &str, origin: String) -> Result<Downloaded, FetchError> {
    let scratch = ScratchDir::create()?;
    let base = base.trim_end_matches('/');
    let tarball = scratch.0.join(asset);
    let sums_path = scratch.0.join(CHECKSUMS_FILE);

    curl_to_file(&format!("{base}/{asset}"), &tarball, MAX_ASSET_BYTES)?;
    curl_to_file(
        &format!("{base}/{CHECKSUMS_FILE}"),
        &sums_path,
        MAX_CHECKSUMS_BYTES,
    )?;

    let sums = std::fs::read_to_string(&sums_path)?;
    let expected = find_checksum(&sums, asset)?;
    let actual = sha256_hex(&tarball)?;
    if expected != actual {
        return Err(FetchError::ChecksumMismatch {
            asset: asset.to_string(),
            expected,
            actual,
        });
    }
    Ok(Downloaded {
        tarball,
        origin,
        tag: None,
        _scratch: scratch,
    })
}

/// Downloads the release asset `fgos-<tag>-<target>.tar.gz`. `version: None`
/// means the latest release.
pub fn fetch_release(
    endpoint: &DownloadEndpoint,
    version: Option<&str>,
) -> Result<Downloaded, FetchError> {
    let target = detect_target(endpoint.target.as_deref())?;
    let tag = match version {
        Some(v) => {
            validate_tag(v)?;
            v.to_string()
        }
        None => resolve_latest_tag(endpoint)?,
    };
    let asset = format!("fgos-{tag}-{target}.tar.gz");
    let base = match non_empty(&endpoint.asset_base_url) {
        Some(b) => b.trim_end_matches('/').to_string(),
        None => format!("{DEFAULT_RELEASE_REPO_URL}/releases/download/{tag}"),
    };
    let origin = format!("{asset} ({tag}) from {base}");
    let mut downloaded = download_verified(&base, &asset, origin)?;
    downloaded.tag = Some(tag);
    Ok(downloaded)
}

/// Downloads a `.tar.gz` from an explicit URL. Its `SHA256SUMS` must sit next
/// to it (same directory, same URL scheme); there is no unverified URL path.
pub fn fetch_url(url: &str) -> Result<Downloaded, FetchError> {
    if !is_url(url) || url.contains('?') || url.contains('#') {
        return Err(FetchError::InvalidUrl(url.to_string()));
    }
    let after_scheme = url.split_once("://").map(|(_, rest)| rest).unwrap_or("");
    let (base, asset) = match url.rsplit_once('/') {
        Some(parts) if after_scheme.contains('/') => parts,
        _ => return Err(FetchError::InvalidUrl(url.to_string())),
    };
    if !is_safe_token(asset) || !asset.ends_with(".tar.gz") {
        return Err(FetchError::InvalidUrl(url.to_string()));
    }
    download_verified(base, asset, url.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn inputs(flag: Option<&str>, from: Option<&str>, version: Option<&str>) -> SourceInputs {
        SourceInputs {
            from_flag: flag.map(String::from),
            env_from: from.map(String::from),
            env_version: version.map(String::from),
        }
    }

    #[test]
    fn precedence_flag_over_env_over_version_over_pin_over_latest() {
        let all = inputs(Some("./flag.tgz"), Some("./env.tgz"), Some("v1"));
        assert_eq!(
            choose_source(&all, true),
            SourceChoice::Local("./flag.tgz".into())
        );

        let no_flag = inputs(None, Some("./env.tgz"), Some("v1"));
        assert_eq!(
            choose_source(&no_flag, true),
            SourceChoice::Local("./env.tgz".into())
        );

        let version_only = inputs(None, None, Some("v1"));
        assert_eq!(
            choose_source(&version_only, true),
            SourceChoice::Release(Some("v1".into()))
        );

        let none = inputs(None, None, None);
        assert_eq!(choose_source(&none, true), SourceChoice::Pinned);
        assert_eq!(choose_source(&none, false), SourceChoice::Release(None));
    }

    #[test]
    fn empty_values_count_as_unset() {
        let blank = inputs(Some(""), Some("  "), Some(""));
        assert_eq!(choose_source(&blank, false), SourceChoice::Release(None));
        assert_eq!(choose_source(&blank, true), SourceChoice::Pinned);
    }

    #[test]
    fn urls_and_paths_are_told_apart() {
        for url in [
            "https://x/a.tar.gz",
            "http://localhost:1/a.tar.gz",
            "file:///tmp/a.tar.gz",
        ] {
            assert_eq!(
                choose_source(&inputs(Some(url), None, None), false),
                SourceChoice::Url(url.to_string())
            );
        }
        assert_eq!(
            choose_source(&inputs(None, Some("/abs/dir"), None), false),
            SourceChoice::Local("/abs/dir".into())
        );
    }

    #[test]
    fn target_detection_honours_override_and_rejects_unsupported() {
        assert_eq!(
            detect_target(Some("x86_64-unknown-linux-gnu")).unwrap(),
            "x86_64-unknown-linux-gnu"
        );
        let err = detect_target(Some("aarch64-apple-darwin")).unwrap_err();
        assert!(err.to_string().contains("not supported"), "{err}");
    }

    #[test]
    fn host_detection_covers_every_published_target_and_nothing_else() {
        assert_eq!(
            detect_target_for(None, "linux", "x86_64").unwrap(),
            "x86_64-unknown-linux-gnu"
        );
        assert_eq!(
            detect_target_for(None, "windows", "x86_64").unwrap(),
            "x86_64-pc-windows-msvc"
        );
        for (os, arch) in [
            ("macos", "aarch64"),
            ("linux", "aarch64"),
            ("windows", "aarch64"),
        ] {
            let err = detect_target_for(None, os, arch).unwrap_err();
            assert!(err.to_string().contains(&format!("{os}-{arch}")), "{err}");
        }
        // An explicit override wins over the host, for either supported target.
        assert_eq!(
            detect_target_for(Some("x86_64-pc-windows-msvc"), "linux", "x86_64").unwrap(),
            "x86_64-pc-windows-msvc"
        );
        // Every supported target is selected by some host.
        for target in SUPPORTED_TARGETS {
            assert!(
                [("linux", "x86_64"), ("windows", "x86_64")]
                    .iter()
                    .any(|(os, arch)| host_target(os, arch) == Some(*target)),
                "{target} has no host that selects it"
            );
        }
    }

    #[test]
    fn windows_release_asset_names_follow_the_shared_pattern() {
        let target = detect_target_for(None, "windows", "x86_64").unwrap();
        assert_eq!(
            format!("fgos-v0.2.0-rc.2-{target}.tar.gz"),
            "fgos-v0.2.0-rc.2-x86_64-pc-windows-msvc.tar.gz"
        );
    }

    #[test]
    fn checksum_lookup_is_exact_and_ignores_binary_marker() {
        let h1 = "a".repeat(64);
        let h2 = "b".repeat(64);
        let sums = format!("{h1}  fgos-v1-t.tar.gz.sig\n{h2} *fgos-v1-t.tar.gz\n");
        assert_eq!(find_checksum(&sums, "fgos-v1-t.tar.gz").unwrap(), h2);
        assert!(matches!(
            find_checksum(&sums, "fgos-v1.tar.gz"),
            Err(FetchError::ChecksumMissing { .. })
        ));
        assert!(matches!(
            find_checksum("short  fgos-v1-t.tar.gz\n", "fgos-v1-t.tar.gz"),
            Err(FetchError::ChecksumMissing { .. })
        ));
    }

    #[test]
    fn checksum_lookup_needs_exactly_one_entry_for_the_asset() {
        let h1 = "a".repeat(64);
        let h2 = "b".repeat(64);
        let twice = format!("{h1}  fgos-v1-t.tar.gz\n{h2} *fgos-v1-t.tar.gz\n");
        assert!(matches!(
            find_checksum(&twice, "fgos-v1-t.tar.gz"),
            Err(FetchError::ChecksumAmbiguous { .. })
        ));
        // The same line twice is still two entries: the file is malformed, not the asset.
        let same_twice = format!("{h1}  fgos-v1-t.tar.gz\n{h1}  fgos-v1-t.tar.gz\n");
        assert!(matches!(
            find_checksum(&same_twice, "fgos-v1-t.tar.gz"),
            Err(FetchError::ChecksumAmbiguous { .. })
        ));
    }

    #[test]
    fn downloads_use_https_or_file_and_http_only_for_loopback() {
        for url in [
            "https://github.com/vantt/forgent/releases/latest",
            "file:///tmp/fgos/a.tar.gz",
            "http://127.0.0.1/a.tar.gz",
            "http://127.8.9.10:8080/a.tar.gz",
            "http://localhost/a.tar.gz",
            "http://[::1]/a.tar.gz",
            "http://[::1]:8123/a.tar.gz",
            "http://user:pw@127.0.0.1:80/a.tar.gz",
        ] {
            assert!(check_transport(url).is_ok(), "{url} must be allowed");
        }
        for url in [
            "http://example.com/a.tar.gz",
            "http://192.0.2.1/a.tar.gz",
            "http://127.0.0.1.evil.example/a.tar.gz",
            "http://127.0.0.1@evil.example/a.tar.gz",
            "http://localhost.evil.example/a.tar.gz",
            "http://127.0.0/a.tar.gz",
            "http://[::2]/a.tar.gz",
            "http://127.0.0.1:port/a.tar.gz",
            "http://evil.example\\@127.0.0.1/a.tar.gz",
            "http://127.0.0.1 .evil.example/a.tar.gz",
            "ftp://127.0.0.1/a.tar.gz",
            "HTTP://example.com/a.tar.gz",
            "/local/a.tar.gz",
        ] {
            assert!(
                matches!(check_transport(url), Err(FetchError::InsecureUrl(_))),
                "{url} must be refused"
            );
        }
    }

    #[test]
    fn a_redirect_may_leave_plain_http_only_from_a_loopback_mirror() {
        assert_eq!(redirect_protocols("https://github.com/x"), "=https");
        assert_eq!(redirect_protocols("file:///tmp/x"), "=https");
        assert_eq!(redirect_protocols("http://127.0.0.1:1/x"), "=https,http");
    }

    #[test]
    fn a_file_over_its_cap_is_refused_and_one_at_the_cap_is_kept() {
        let dir = std::env::temp_dir()
            .join("fgos-work")
            .join(format!("fetch-cap-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let file = dir.join("asset");
        std::fs::write(&file, vec![0u8; 10]).unwrap();
        assert!(ensure_within_cap(&file, 10, "https://x/asset").is_ok());
        assert!(matches!(
            ensure_within_cap(&file, 9, "https://x/asset"),
            Err(FetchError::TooLarge { limit: 9, .. })
        ));
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn unsupported_target_points_at_the_source_build() {
        let err = detect_target(Some("aarch64-apple-darwin")).unwrap_err();
        assert!(err.to_string().contains("cargo build --release"), "{err}");
    }

    #[test]
    fn tags_and_urls_with_path_tricks_are_refused() {
        assert!(validate_tag("v0.2.0-rc.1").is_ok());
        assert!(validate_tag("../evil").is_err());
        assert!(validate_tag("").is_err());
        assert!(matches!(
            fetch_url("https://x/a.tar.gz?sig=1"),
            Err(FetchError::InvalidUrl(_))
        ));
        assert!(matches!(
            fetch_url("https://x/a.zip"),
            Err(FetchError::InvalidUrl(_))
        ));
        assert!(matches!(
            fetch_url("/local/a.tar.gz"),
            Err(FetchError::InvalidUrl(_))
        ));
    }
}
