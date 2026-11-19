//! What a stored probe result is valid for: the policy, the driver version, the backend config, the platform and
//! the machine-private roots it was proven against. A change to any of them makes the result stale.

use super::sandbox::run;
use crate::confinement::driver::bwrap::BWRAP_DRIVER_VERSION;
use crate::confinement::policy::MACHINE_PRIVATE_ROOTS;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};

pub const PROOF_PROFILE: &str = "local-bwrap-v1";

fn sha256_hex(text: &str) -> String {
    Sha256::digest(text.as_bytes())
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect()
}

/// `<platform>:<kernel release>:<arch>:<bwrap version>`, the names Node's `os` module reports.
pub fn platform_payload(platform: &str, release: &str, arch: &str, bwrap_version: &str) -> String {
    format!("{platform}:{release}:{arch}:{bwrap_version}")
}

fn node_platform() -> &'static str {
    match std::env::consts::OS {
        "macos" => "darwin",
        "windows" => "win32",
        other => other,
    }
}

fn node_arch() -> &'static str {
    match std::env::consts::ARCH {
        "x86_64" => "x64",
        "aarch64" => "arm64",
        "x86" => "ia32",
        other => other,
    }
}

fn kernel_release() -> String {
    #[cfg(unix)]
    {
        // SAFETY: uname fills the zeroed struct it is given and keeps no pointer to it.
        let mut name: libc::utsname = unsafe { std::mem::zeroed() };
        if unsafe { libc::uname(&mut name) } == 0 {
            // SAFETY: on success `release` is a NUL-terminated C string inside `name`.
            return unsafe { std::ffi::CStr::from_ptr(name.release.as_ptr()) }
                .to_string_lossy()
                .into_owned();
        }
    }
    String::new()
}

/// The digest of this machine's platform and the version `bwrap_executable` reports (`unknown` when it cannot
/// say).
pub fn compute_platform_digest(bwrap_executable: &str) -> String {
    let ran = run(bwrap_executable, &["--version".to_string()]);
    let version = if ran.status == Some(0) {
        ran.stdout.trim().to_string()
    } else {
        "unknown".to_string()
    };
    sha256_hex(&platform_payload(
        node_platform(),
        &kernel_release(),
        node_arch(),
        &version,
    ))
}

/// What [`compute_probe_fingerprint`] takes; `Default` is the Node defaults.
#[derive(Debug, Clone)]
pub struct FingerprintInput {
    pub policy: String,
    pub driver_version: String,
    pub backend_config: Value,
    pub bwrap_executable: String,
    pub blind: bool,
}

impl Default for FingerprintInput {
    fn default() -> Self {
        Self {
            policy: "host-write-denied".into(),
            driver_version: BWRAP_DRIVER_VERSION.into(),
            backend_config: json!({}),
            bwrap_executable: "/usr/bin/bwrap".into(),
            blind: false,
        }
    }
}

pub fn compute_probe_fingerprint(input: &FingerprintInput) -> Value {
    let compact =
        |value: &Value| serde_json::to_string(value).expect("a JSON value always serialises");
    let mut fingerprint = json!({
        "contract": "confinement-probe-fingerprint.v1",
        "policyDigest": sha256_hex(&compact(&Value::String(input.policy.clone()))),
        "driverVersion": input.driver_version,
        "backendConfigDigest": sha256_hex(&compact(&input.backend_config)),
        "platformDigest": compute_platform_digest(&input.bwrap_executable),
        "proofProfile": PROOF_PROFILE,
        "machinePrivate": sha256_hex(&compact(&json!(MACHINE_PRIVATE_ROOTS))),
    });
    if input.blind {
        fingerprint["blind"] = Value::Bool(true);
    }
    fingerprint
}
