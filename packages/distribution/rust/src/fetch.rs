//! Source selection and verified download for `fgctl init`.
//!
//! `fgctl init` can take its release from a local path, from a URL, or from a
//! GitHub release asset. Anything that crosses the network goes through the
//! system `curl` (same flags, timeouts and `FGCTL_ASSET_BASE_URL` override as
//! `install.sh`) and is verified against the release's `SHA256SUMS` before a
//! single byte of it is handed to staging. A missing entry or a mismatch is a
//! refusal, never a warning.

use sha2::{Digest, Sha256};
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

/// Where release assets live when `FGCTL_ASSET_BASE_URL` is not set.
pub const DEFAULT_RELEASE_REPO_URL: &str = "https://github.com/vantt/forgent";

/// Targets a release asset is published for (mirrors `install.sh`).
pub const SUPPORTED_TARGETS: &[&str] = &["x86_64-unknown-linux-gnu"];

/// Same bounds as `install.sh`'s `CURL_TIMEOUT_ARGS`: a server that connects
/// but never finishes cannot hang `fgctl init`.
const CURL_ARGS: [&str; 5] = ["-fsSL", "--connect-timeout", "15", "--max-time", "120"];

const CHECKSUMS_FILE: &str = "SHA256SUMS";

#[derive(Debug, thiserror::Error)]
pub enum FetchError {
    #[error("target '{target}' is not supported. Supported targets: {supported}")]
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
    #[error("no checksum entry found for {asset} in SHA256SUMS; refusing to use it")]
    ChecksumMissing { asset: String },
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
    let target = match override_target.map(str::trim).filter(|t| !t.is_empty()) {
        Some(t) => t.to_string(),
        None => match (std::env::consts::OS, std::env::consts::ARCH) {
            ("linux", "x86_64") => "x86_64-unknown-linux-gnu".to_string(),
            (os, arch) => format!("{os}-{arch}"),
        },
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

fn run_curl(extra: &[&str], url: &str) -> Result<Vec<u8>, FetchError> {
    let output = Command::new("curl")
        .args(CURL_ARGS)
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
        Ok(output.stdout)
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

fn curl_to_file(url: &str, dest: &Path) -> Result<(), FetchError> {
    let dest_str = dest.to_string_lossy();
    run_curl(&["-o", dest_str.as_ref()], url).map(|_| ())
}

/// Resolves the tag of the latest (non-pre-release) release by following
/// `<base>/releases/latest` and reading the final URL, as `install.sh` does.
fn resolve_latest_tag(endpoint: &DownloadEndpoint) -> Result<String, FetchError> {
    let base = match non_empty(&endpoint.asset_base_url) {
        Some(b) => b.trim_end_matches('/').to_string(),
        None => DEFAULT_RELEASE_REPO_URL.to_string(),
    };
    let latest_url = format!("{base}/releases/latest");
    let out = run_curl(&["-o", "/dev/null", "-w", "%{url_effective}"], &latest_url)?;
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
/// ignored), never a substring.
fn find_checksum(sums: &str, asset: &str) -> Option<String> {
    for line in sums.lines() {
        let mut fields = line.split_whitespace();
        let (Some(hash), Some(name)) = (fields.next(), fields.next()) else {
            continue;
        };
        if name.strip_prefix('*').unwrap_or(name) == asset {
            let valid = hash.len() == 64 && hash.chars().all(|c| c.is_ascii_hexdigit());
            return valid.then(|| hash.to_ascii_lowercase());
        }
    }
    None
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

    curl_to_file(&format!("{base}/{asset}"), &tarball)?;
    curl_to_file(&format!("{base}/{CHECKSUMS_FILE}"), &sums_path)?;

    let sums = std::fs::read_to_string(&sums_path)?;
    let expected = find_checksum(&sums, asset).ok_or_else(|| FetchError::ChecksumMissing {
        asset: asset.to_string(),
    })?;
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
    fn checksum_lookup_is_exact_and_ignores_binary_marker() {
        let h1 = "a".repeat(64);
        let h2 = "b".repeat(64);
        let sums = format!("{h1}  fgos-v1-t.tar.gz.sig\n{h2} *fgos-v1-t.tar.gz\n");
        assert_eq!(find_checksum(&sums, "fgos-v1-t.tar.gz"), Some(h2));
        assert_eq!(find_checksum(&sums, "fgos-v1.tar.gz"), None);
        assert_eq!(
            find_checksum("short  fgos-v1-t.tar.gz\n", "fgos-v1-t.tar.gz"),
            None
        );
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
