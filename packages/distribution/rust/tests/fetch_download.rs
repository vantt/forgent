//! Network-free coverage of the verified release download: a `file://`
//! asset base for the happy path and the refusals, and a loopback HTTP server
//! for the "latest release" redirect.

use fgos_distribution::fetch::{fetch_release, fetch_url, DownloadEndpoint, FetchError};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::path::{Path, PathBuf};

const TARGET: &str = "x86_64-unknown-linux-gnu";

fn fresh_dir(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join("fgos-work").join(format!(
        "fetch-download-{}-{}",
        name,
        std::process::id()
    ));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

fn sha256_hex(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

fn asset_name(tag: &str) -> String {
    format!("fgos-{tag}-{TARGET}.tar.gz")
}

/// Writes `<dir>/<asset>` and a SHA256SUMS whose entry is `sums_hash`
/// (or no entry at all when `None`).
fn write_release(dir: &Path, tag: &str, payload: &[u8], sums_hash: Option<String>) {
    let asset = asset_name(tag);
    std::fs::write(dir.join(&asset), payload).unwrap();
    let sums = match sums_hash {
        Some(h) => format!("{h}  {asset}\n"),
        None => format!("{}  some-other-asset.tar.gz\n", sha256_hex(b"other")),
    };
    std::fs::write(dir.join("SHA256SUMS"), sums).unwrap();
}

fn file_endpoint(dir: &Path) -> DownloadEndpoint {
    DownloadEndpoint {
        asset_base_url: Some(format!("file://{}", dir.display())),
        target: Some(TARGET.to_string()),
    }
}

#[test]
fn downloads_exact_tag_and_verifies_checksum() {
    let dir = fresh_dir("ok");
    let payload = b"release-bytes";
    write_release(&dir, "v1.2.3-rc.1", payload, Some(sha256_hex(payload)));

    let downloaded = fetch_release(&file_endpoint(&dir), Some("v1.2.3-rc.1")).unwrap();
    assert_eq!(std::fs::read(&downloaded.tarball).unwrap(), payload);
    assert!(downloaded.origin.contains("v1.2.3-rc.1"));

    let scratch = downloaded.tarball.parent().unwrap().to_path_buf();
    assert!(scratch.exists());
    drop(downloaded);
    assert!(!scratch.exists(), "scratch copy must be removed on drop");
    let _ = std::fs::remove_dir_all(&dir);
}

#[test]
fn checksum_mismatch_is_refused() {
    let dir = fresh_dir("mismatch");
    write_release(&dir, "v1", b"tampered", Some(sha256_hex(b"original")));

    let err = fetch_release(&file_endpoint(&dir), Some("v1")).unwrap_err();
    assert!(matches!(err, FetchError::ChecksumMismatch { .. }), "{err}");
    let _ = std::fs::remove_dir_all(&dir);
}

#[test]
fn missing_checksum_entry_is_refused() {
    let dir = fresh_dir("missing");
    write_release(&dir, "v1", b"payload", None);

    let err = fetch_release(&file_endpoint(&dir), Some("v1")).unwrap_err();
    assert!(matches!(err, FetchError::ChecksumMissing { .. }), "{err}");
    let _ = std::fs::remove_dir_all(&dir);
}

#[test]
fn missing_checksums_file_is_refused() {
    let dir = fresh_dir("nosums");
    write_release(&dir, "v1", b"payload", Some(sha256_hex(b"payload")));
    std::fs::remove_file(dir.join("SHA256SUMS")).unwrap();

    let err = fetch_release(&file_endpoint(&dir), Some("v1")).unwrap_err();
    assert!(matches!(err, FetchError::Download { .. }), "{err}");
    let _ = std::fs::remove_dir_all(&dir);
}

#[test]
fn unsupported_target_is_refused_before_any_download() {
    let endpoint = DownloadEndpoint {
        asset_base_url: Some("file:///nonexistent".to_string()),
        target: Some("aarch64-apple-darwin".to_string()),
    };
    let err = fetch_release(&endpoint, Some("v1")).unwrap_err();
    assert!(matches!(err, FetchError::UnsupportedTarget { .. }), "{err}");
}

#[test]
fn explicit_url_needs_a_sibling_checksum_entry() {
    let dir = fresh_dir("url");
    let payload = b"custom-build";
    std::fs::write(dir.join("custom.tar.gz"), payload).unwrap();
    std::fs::write(
        dir.join("SHA256SUMS"),
        format!("{}  custom.tar.gz\n", sha256_hex(payload)),
    )
    .unwrap();

    let url = format!("file://{}/custom.tar.gz", dir.display());
    let downloaded = fetch_url(&url).unwrap();
    assert_eq!(std::fs::read(&downloaded.tarball).unwrap(), payload);
    drop(downloaded);

    std::fs::write(
        dir.join("SHA256SUMS"),
        format!("{}  custom.tar.gz\n", sha256_hex(b"different")),
    )
    .unwrap();
    let err = fetch_url(&url).unwrap_err();
    assert!(matches!(err, FetchError::ChecksumMismatch { .. }), "{err}");
    let _ = std::fs::remove_dir_all(&dir);
}

/// Minimal loopback HTTP server: `routes` maps a request path to
/// (status line, extra headers, body).
fn serve(routes: HashMap<String, (&'static str, Vec<String>, Vec<u8>)>) -> String {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let addr = listener.local_addr().unwrap();
    std::thread::spawn(move || {
        for stream in listener.incoming() {
            let Ok(mut stream) = stream else { continue };
            let mut buf = [0u8; 4096];
            let n = stream.read(&mut buf).unwrap_or(0);
            let request = String::from_utf8_lossy(&buf[..n]).to_string();
            let path = request
                .lines()
                .next()
                .and_then(|l| l.split_whitespace().nth(1))
                .unwrap_or("/")
                .to_string();
            let (status, headers, body) = routes.get(&path).cloned().unwrap_or((
                "404 Not Found",
                vec![],
                b"not found".to_vec(),
            ));
            let mut head = format!(
                "HTTP/1.1 {status}\r\nContent-Length: {}\r\nConnection: close\r\n",
                body.len()
            );
            for h in headers {
                head.push_str(&h);
                head.push_str("\r\n");
            }
            head.push_str("\r\n");
            let _ = stream.write_all(head.as_bytes());
            let _ = stream.write_all(&body);
        }
    });
    format!("http://{addr}")
}

#[test]
fn latest_follows_the_release_redirect_and_downloads_that_tag() {
    let payload = b"latest-release".to_vec();
    let asset = asset_name("v9.9.9");
    let mut routes: HashMap<String, (&'static str, Vec<String>, Vec<u8>)> = HashMap::new();
    routes.insert(
        "/releases/latest".to_string(),
        (
            "302 Found",
            vec!["Location: /releases/tag/v9.9.9".to_string()],
            vec![],
        ),
    );
    routes.insert(
        "/releases/tag/v9.9.9".to_string(),
        ("200 OK", vec![], b"page".to_vec()),
    );
    routes.insert(format!("/{asset}"), ("200 OK", vec![], payload.clone()));
    routes.insert(
        "/SHA256SUMS".to_string(),
        (
            "200 OK",
            vec![],
            format!("{}  {asset}\n", sha256_hex(&payload)).into_bytes(),
        ),
    );
    let base = serve(routes);

    let endpoint = DownloadEndpoint {
        asset_base_url: Some(base),
        target: Some(TARGET.to_string()),
    };
    let downloaded = fetch_release(&endpoint, None).unwrap();
    assert_eq!(std::fs::read(&downloaded.tarball).unwrap(), payload);
    assert!(
        downloaded.origin.contains("v9.9.9"),
        "{}",
        downloaded.origin
    );
}

#[test]
fn latest_without_a_release_redirect_asks_for_an_explicit_version() {
    let mut routes: HashMap<String, (&'static str, Vec<String>, Vec<u8>)> = HashMap::new();
    routes.insert(
        "/releases/latest".to_string(),
        ("200 OK", vec![], b"no releases".to_vec()),
    );
    let base = serve(routes);

    let endpoint = DownloadEndpoint {
        asset_base_url: Some(base),
        target: Some(TARGET.to_string()),
    };
    let err = fetch_release(&endpoint, None).unwrap_err();
    assert!(matches!(err, FetchError::LatestUnresolved { .. }), "{err}");
    assert!(err.to_string().contains("FGCTL_VERSION"));
}
