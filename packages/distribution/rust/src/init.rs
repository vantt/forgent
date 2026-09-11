//! Workspace initialization and runtime activation (`fgctl init`).
//!
//! Implements the acquire -> stage -> verify -> preflight -> publish -> tail pipeline
//! per `phase-12-fgctl-init-and-activation.md` and
//! `docs/architect/packaging-distribution/runtime-identity-and-activation.md` §3, §6, §14.

use crate::canonical::canonicalize_manifest_files;
use crate::lock::check_main_checkout_lock;
use crate::manifest::{read_manifest_from_dir, ReleaseManifest};
use crate::store::{
    list_releases, now_millis, resolve_machine_release_store_root, stage_release,
    ReleaseStatusEntry, StageOutcome,
};
use crate::verify::{recompute_artifact_digest, verify_release_files};
use crate::workspace::{
    compute_repository_id, compute_work_state_id, compute_workspace_id, resolve_workspace_root,
};
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::Path;
use std::process::Command;
use std::time::SystemTime;

const SHIM_FGOS_BODY: &str = r#"#!/bin/sh
# fgOS workspace stable shim -- written by fgctl. Do not hand-edit; run
# `fgctl repair` to regenerate it.
set -eu
self_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
activation="$self_dir/../activation.json"
[ -f "$activation" ] || { echo "fgos: no active runtime -- run fgctl init" >&2; exit 3; }
status=$(sed -n 's/^[[:space:]]*"status"[[:space:]]*:[[:space:]]*"\(.*\)"[,]*$/\1/p' "$activation" | head -n1)
[ "$status" = "ready" ] || { echo "fgos: active runtime is not ready ($status) -- run fgctl repair" >&2; exit 3; }
release_path=$(sed -n 's/^[[:space:]]*"releasePath"[[:space:]]*:[[:space:]]*"\(.*\)"[,]*$/\1/p' "$activation" | head -n1)
[ -n "$release_path" ] || { echo "fgos: activation.json missing releasePath -- run fgctl repair" >&2; exit 3; }
entry="$release_path/bin/fgos"
[ -x "$entry" ] || { echo "fgos: active release entry not found: $entry -- run fgctl repair" >&2; exit 3; }
exec "$entry" "$@"
"#;

const SHIM_FGOS_RUNNER_BODY: &str = r#"#!/bin/sh
# fgOS workspace stable shim -- written by fgctl. Do not hand-edit; run
# `fgctl repair` to regenerate it.
set -eu
self_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
activation="$self_dir/../activation.json"
[ -f "$activation" ] || { echo "fgos: no active runtime -- run fgctl init" >&2; exit 3; }
status=$(sed -n 's/^[[:space:]]*"status"[[:space:]]*:[[:space:]]*"\(.*\)"[,]*$/\1/p' "$activation" | head -n1)
[ "$status" = "ready" ] || { echo "fgos: active runtime is not ready ($status) -- run fgctl repair" >&2; exit 3; }
release_path=$(sed -n 's/^[[:space:]]*"releasePath"[[:space:]]*:[[:space:]]*"\(.*\)"[,]*$/\1/p' "$activation" | head -n1)
[ -n "$release_path" ] || { echo "fgos: activation.json missing releasePath -- run fgctl repair" >&2; exit 3; }
entry="$release_path/bin/fgos-runner"
[ -x "$entry" ] || { echo "fgos: active release entry not found: $entry -- run fgctl repair" >&2; exit 3; }
exec "$entry" "$@"
"#;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TrackedDistributionPin {
    pub schema_version: u32,
    pub project_runtime: ProjectRuntimePin,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ProjectRuntimePin {
    pub policy: String,
    pub artifact_digest: String,
    pub release_version: Option<String>,
    pub channel: Option<String>,
    pub allow_prerelease: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceRootBinding {
    pub schema_version: u32,
    pub repository_root: String,
    pub workspace_id: String,
    pub work_state_id: String,
    pub machine_release_store: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ActivatedByInfo {
    pub tool: String,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceActivationBinding {
    pub schema_version: u32,
    pub repository_id: String,
    pub workspace_id: String,
    pub work_state_id: String,
    pub activation_id: String,
    pub status: String,
    pub artifact_digest: String,
    pub release_path: String,
    pub previous_artifact_digest: Option<String>,
    pub shim_version: String,
    pub resolved_dependencies: serde_json::Value,
    pub pin_snapshot: serde_json::Value,
    pub activated_at: String,
    pub activated_by: ActivatedByInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TransactionHistoryEntry {
    pub status: String,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct InstallTransactionRecord {
    pub schema_version: u32,
    pub activation_id: String,
    pub workspace_id: String,
    pub artifact_digest: String,
    pub status: String,
    pub history: Vec<TransactionHistoryEntry>,
    pub updated_at: String,
}

#[derive(Debug, thiserror::Error)]
pub enum InitError {
    #[error("activation-lock-held: workspace activation is already in progress")]
    ActivationLockHeld,
    #[error("{0}")]
    Workspace(#[from] crate::workspace::WorkspaceError),
    #[error("{0}")]
    Lock(#[from] crate::lock::MainCheckoutLockError),
    #[error("stage failed: {0}")]
    Stage(#[from] crate::store::StageError),
    #[error("preflight failed: {0}")]
    Preflight(String),
    #[error("tail command '{cmd}' failed with status {status}")]
    TailFailed { cmd: String, status: i32 },
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("{0}")]
    Custom(String),
}

/// RAII lock guard for `.fgos/installation/activation.lock` create-exclusive file.
///
/// Matches Phase 11's `install.lock` pattern in `store.rs`:
/// - `OpenOptions::new().write(true).create_new(true)`
/// - Immediate refusal on EEXIST (never a blocking retry)
/// - RAII guard removes the file on drop
pub struct ActivationLockGuard {
    lock_path: std::path::PathBuf,
}

impl ActivationLockGuard {
    pub fn acquire(installation_dir: &Path) -> Result<Self, InitError> {
        let lock_path = installation_dir.join("activation.lock");
        if let Some(parent) = lock_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let content = format!(
            r#"{{"pid": {}, "ts": {}}}"#,
            std::process::id(),
            now_millis() as u64
        );

        match Self::try_create(&lock_path, &content) {
            Ok(()) => return Ok(Self { lock_path }),
            Err(err) if err.kind() == std::io::ErrorKind::AlreadyExists => {}
            Err(err) => return Err(InitError::Io(err)),
        }

        // A SIGKILL between acquire and Drop leaves this file behind forever
        // otherwise -- reclaim it the same way lock.rs judges the main
        // checkout lock stale (dead pid OR past DEFAULT_TTL_MS), one retry
        // only, never a blocking loop.
        let raw = match std::fs::read_to_string(&lock_path) {
            Ok(r) => r,
            Err(err) if err.kind() == std::io::ErrorKind::NotFound => {
                // Vanished between our failed create and this read -- the
                // holder that just released it may already have been
                // replaced by a fresh one. Try once more rather than assume
                // we now own an empty path.
                return match Self::try_create(&lock_path, &content) {
                    Ok(()) => Ok(Self { lock_path }),
                    Err(_) => Err(InitError::ActivationLockHeld),
                };
            }
            Err(err) => return Err(InitError::Io(err)),
        };

        if Self::is_stale_content(&raw) {
            // Re-read right before unlinking (mirrors
            // src/runner/main-checkout-lock.mjs's own reclaim guard,
            // `tryAcquireOnce`'s stale branch): the liveness/TTL check above
            // is the slow window. If the content changed since `raw` was
            // read, a fresh holder took this path in between and must not
            // be unlinked out from under itself.
            let current = std::fs::read_to_string(&lock_path).unwrap_or_default();
            if current == raw {
                let _ = std::fs::remove_file(&lock_path);
                match Self::try_create(&lock_path, &content) {
                    Ok(()) => return Ok(Self { lock_path }),
                    Err(err) if err.kind() == std::io::ErrorKind::AlreadyExists => {
                        return Err(InitError::ActivationLockHeld);
                    }
                    Err(err) => return Err(InitError::Io(err)),
                }
            }
        }

        Err(InitError::ActivationLockHeld)
    }

    /// Creates `lock_path` atomically with `content` already fully written --
    /// never a window where the file exists but is empty or partial.
    /// Mirrors `src/runner/main-checkout-lock.mjs`'s own `writeAtomicCreate`:
    /// write the complete content to a uniquely-named temp file first, then
    /// `hard_link` it onto `lock_path` (atomic, fails `AlreadyExists` on
    /// collision exactly like `open(.., O_EXCL)` would), then remove the
    /// temp file. A plain `create_new` + separate `write_all` would leave
    /// exactly the empty-file window a concurrent reader's staleness check
    /// could observe and wrongly reclaim a genuinely live lock.
    fn try_create(lock_path: &Path, content: &str) -> std::io::Result<()> {
        let tmp_path =
            lock_path.with_extension(format!("tmp-{}-{}", std::process::id(), now_millis()));
        std::fs::write(&tmp_path, content)?;
        let result = std::fs::hard_link(&tmp_path, lock_path);
        let _ = std::fs::remove_file(&tmp_path);
        result
    }

    /// A lock this crate itself owns and can safely reclaim once its holder
    /// is provably gone -- unlike `check_main_checkout_lock`'s read-only
    /// "ambiguous means refuse" rule for a lock file this crate never
    /// writes, an unparseable `activation.lock` here can only be leftover
    /// wreckage from a killed writer, so it is treated as stale too.
    fn is_stale_content(raw: &str) -> bool {
        let record = match crate::lock::parse_lock_content(raw) {
            Some(r) => r,
            None => return true,
        };
        match record.identity {
            crate::lock::LockHolderIdentity::Numeric(pid) => {
                let now = now_millis() as u64;
                let within_ttl = now.saturating_sub(record.ts) <= crate::lock::DEFAULT_TTL_MS;
                let pid_live = i32::try_from(pid)
                    .ok()
                    .map(crate::lock::is_pid_alive)
                    .unwrap_or(false);
                !(pid_live && within_ttl)
            }
            // activation.lock's own writer (this function) only ever records
            // a numeric pid; a string identity here would be foreign content
            // this crate never wrote and is never reclaimed, deliberately
            // more conservative than the reference module's TTL-only rule
            // for a string holder since this path is unreachable in practice.
            crate::lock::LockHolderIdentity::String(_) => false,
        }
    }
}

impl Drop for ActivationLockGuard {
    fn drop(&mut self) {
        let _ = std::fs::remove_file(&self.lock_path);
    }
}

/// Cleans up any stale `activation.json.tmp.*` files left from a previous killed run (Reviewer L8).
///
/// Must only be called after acquiring `activation.lock`.
pub fn cleanup_stale_activation_tmp_files(installation_dir: &Path) {
    if let Ok(entries) = std::fs::read_dir(installation_dir) {
        for entry in entries.flatten() {
            if entry
                .file_name()
                .to_string_lossy()
                .starts_with("activation.json.tmp.")
            {
                let _ = std::fs::remove_file(entry.path());
            }
        }
    }
}

#[derive(Deserialize)]
struct DigestOnly {
    #[serde(rename = "artifactDigest")]
    artifact_digest: String,
}

/// Reads or peeks candidate release manifest `artifactDigest` from a source path (directory or .tar.gz).
pub fn resolve_source_manifest_digest(from_path: &Path) -> Result<String, InitError> {
    if !from_path.exists() {
        return Err(InitError::Stage(crate::store::StageError::SourceNotFound(
            from_path.to_path_buf(),
        )));
    }
    if from_path.is_dir() {
        let manifest_path = from_path.join("manifest.json");
        if !manifest_path.is_file() {
            return Err(InitError::Custom(format!(
                "manifest.json not found in {}",
                from_path.display()
            )));
        }
        let content = std::fs::read_to_string(&manifest_path)?;
        let parsed: DigestOnly = serde_json::from_str(&content).map_err(|e| {
            InitError::Custom(format!(
                "failed to parse manifest from {}: {}",
                manifest_path.display(),
                e
            ))
        })?;
        Ok(parsed.artifact_digest)
    } else {
        let file = std::fs::File::open(from_path)?;
        let decoder = flate2::read::GzDecoder::new(file);
        let mut archive = tar::Archive::new(decoder);
        let entries = archive
            .entries()
            .map_err(|e| InitError::Custom(format!("failed to read archive entries: {}", e)))?;
        for entry_res in entries {
            let mut entry =
                entry_res.map_err(|e| InitError::Custom(format!("archive entry error: {}", e)))?;
            let p = entry
                .path()
                .map_err(|e| InitError::Custom(format!("archive path error: {}", e)))?;
            let p_str = p.to_string_lossy().replace('\\', "/");
            let norm = p_str.strip_prefix("./").unwrap_or(&p_str);
            if norm == "manifest.json"
                || (norm.ends_with("/manifest.json") && norm.matches('/').count() == 1)
            {
                let parsed: DigestOnly = serde_json::from_reader(&mut entry).map_err(|e| {
                    InitError::Custom(format!("failed to parse manifest from archive: {}", e))
                })?;
                return Ok(parsed.artifact_digest);
            }
        }
        Err(InitError::Custom(format!(
            "manifest.json not found in archive {}",
            from_path.display()
        )))
    }
}

/// Formats a SystemTime into ISO 8601 UTC string (YYYY-MM-DDTHH:mm:ss.sssZ).
pub fn format_iso8601_utc(time: SystemTime) -> String {
    let dur = time
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default();
    let total_secs = dur.as_secs();
    let millis = dur.subsec_millis();

    let sec = (total_secs % 60) as u32;
    let min = ((total_secs / 60) % 60) as u32;
    let hour = ((total_secs / 3600) % 24) as u32;

    let z = (total_secs / 86400) as i64 + 719468;
    let era = (if z >= 0 { z } else { z - 146096 }) / 146097;
    let doe = (z - era * 146097) as u32;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };

    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}.{:03}Z",
        y, m, d, hour, min, sec, millis
    )
}

/// Resolves path to `node` executable on PATH.
pub fn resolve_node_path() -> String {
    if let Ok(path_var) = std::env::var("PATH") {
        for dir in std::env::split_paths(&path_var) {
            let candidate = dir.join("node");
            if candidate.is_file() {
                return candidate.to_string_lossy().to_string();
            }
        }
    }
    "node".to_string()
}

/// Checks if current `node --version` satisfies the manifest's requires.node specification.
pub fn check_node_requirement(req: &str) -> Result<String, String> {
    let output = Command::new("node")
        .arg("--version")
        .output()
        .map_err(|e| format!("runtime-dependency-missing: failed to run node: {}", e))?;

    if !output.status.success() {
        return Err("runtime-dependency-missing: node --version failed".to_string());
    }

    let version_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let version_core = version_str.strip_prefix('v').unwrap_or(&version_str);
    let parts: Vec<&str> = version_core.split('.').collect();
    let major: u32 = parts
        .first()
        .and_then(|s| s.parse().ok())
        .ok_or_else(|| format!("failed to parse node major version from {}", version_str))?;

    let trimmed_req = req.trim();
    if let Some(rest) = trimmed_req.strip_prefix(">=") {
        let req_ver = rest.trim();
        let req_major: u32 = req_ver
            .split('.')
            .next()
            .and_then(|s| s.parse().ok())
            .ok_or_else(|| format!("failed to parse required node major version from {}", req))?;
        if major < req_major {
            return Err(format!(
                "runtime-dependency-missing: node version {} does not satisfy requirement {}",
                version_str, req
            ));
        }
    }

    Ok(version_str)
}

/// Preflight checks before publish (R6).
/// No host-visible writes permitted.
pub fn preflight_candidate(
    candidate_dir: &Path,
    manifest: &ReleaseManifest,
) -> Result<(), InitError> {
    // 1. Recompute artifact digest
    let manifest_path = candidate_dir.join("manifest.json");
    recompute_artifact_digest(&manifest_path)
        .map_err(|e| InitError::Preflight(format!("artifact digest verification failed: {}", e)))?;

    // 2. Canonicalize & verify files
    canonicalize_manifest_files(manifest)
        .map_err(|e| InitError::Preflight(format!("canonicalize manifest failed: {}", e)))?;
    verify_release_files(candidate_dir, manifest)
        .map_err(|e| InitError::Preflight(format!("verify release files failed: {}", e)))?;

    // 3. Confirm requires.node
    if let Some(req) = &manifest.requires.node {
        check_node_requirement(req).map_err(InitError::Preflight)?;
    }

    // 4. Confirm bin/fgos present and executable
    let fgos_bin = candidate_dir.join("bin").join("fgos");
    if !fgos_bin.is_file() {
        return Err(InitError::Preflight(format!(
            "candidate bin/fgos not found at {}",
            fgos_bin.display()
        )));
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let perms = std::fs::metadata(&fgos_bin)?.permissions();
        if perms.mode() & 0o111 == 0 {
            return Err(InitError::Preflight(format!(
                "candidate bin/fgos at {} is not executable",
                fgos_bin.display()
            )));
        }
    }

    // 5. Run <candidate>/bin/fgos version --runtime-json with restricted bootstrap context
    let mut cmd = Command::new(&fgos_bin);
    cmd.args(["version", "--runtime-json"])
        .env("FGOS_BOOTSTRAP_CANDIDATE", "1")
        .env("FGOS_CANDIDATE_ARTIFACT_DIGEST", &manifest.artifact_digest)
        .env("FGOS_CANDIDATE_RELEASE_PATH", candidate_dir)
        .current_dir(candidate_dir);

    let output = cmd
        .output()
        .map_err(|e| InitError::Preflight(format!("failed to run candidate preflight: {}", e)))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(InitError::Preflight(format!(
            "candidate version --runtime-json exited with {}: {}",
            output.status, stderr
        )));
    }

    Ok(())
}

/// Atomically publishes `activation.json` via .tmp.<activationId> + rename (R7).
pub fn publish_activation_file(
    activation_path: &Path,
    binding: &WorkspaceActivationBinding,
) -> std::io::Result<()> {
    let tmp_path = activation_path
        .parent()
        .unwrap()
        .join(format!("activation.json.tmp.{}", binding.activation_id));

    let json_bytes = serde_json::to_vec_pretty(binding).map_err(std::io::Error::other)?;

    {
        let mut file = std::fs::OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .open(&tmp_path)?;
        file.write_all(&json_bytes)?;
        file.sync_all()?;
    }

    std::fs::rename(&tmp_path, activation_path)?;

    if let Some(parent) = activation_path.parent() {
        if let Ok(dir) = std::fs::File::open(parent) {
            let _ = dir.sync_all();
        }
    }

    Ok(())
}

/// Runs the post-activation tail: `init`, `doctor --fix`, `doctor` (R8).
pub fn run_tail(
    workspace_root: &Path,
    shim_path: &Path,
    store_root: &Path,
    activation_id: &str,
) -> Result<(), InitError> {
    let commands = [vec!["init"], vec!["doctor", "--fix"], vec!["doctor"]];

    let tx_path = store_root
        .join("installs")
        .join(format!("{}.json", activation_id));

    for cmd_args in commands {
        let cmd_name = cmd_args.join(" ");
        let mut cmd = Command::new(shim_path);
        cmd.args(&cmd_args).current_dir(workspace_root);

        let output = match cmd.output() {
            Ok(o) => o,
            Err(e) => {
                mark_transaction_status(&tx_path, "ready-degraded")?;
                eprintln!("Error executing shim tail '{}': {}", cmd_name, e);
                return Err(InitError::TailFailed {
                    cmd: cmd_name,
                    status: 1,
                });
            }
        };

        if !output.status.success() {
            mark_transaction_status(&tx_path, "ready-degraded")?;
            let _ = std::io::stdout().write_all(&output.stdout);
            let _ = std::io::stderr().write_all(&output.stderr);
            let code = output.status.code().unwrap_or(1);
            return Err(InitError::TailFailed {
                cmd: cmd_name,
                status: code,
            });
        }
    }

    mark_transaction_status(&tx_path, "complete")?;
    Ok(())
}

fn mark_transaction_status(tx_path: &Path, status: &str) -> std::io::Result<()> {
    if !tx_path.exists() {
        return Ok(());
    }
    let content = std::fs::read_to_string(tx_path)?;
    if let Ok(mut record) = serde_json::from_str::<InstallTransactionRecord>(&content) {
        let now_str = format_iso8601_utc(SystemTime::now());
        record.status = status.to_string();
        record.updated_at = now_str.clone();
        record.history.push(TransactionHistoryEntry {
            status: status.to_string(),
            timestamp: now_str,
        });
        let bytes = serde_json::to_vec_pretty(&record).map_err(std::io::Error::other)?;
        std::fs::write(tx_path, bytes)?;
    }
    Ok(())
}

/// Executes `fgctl init [--from <source>]` for the current or specified workspace.
pub fn init_workspace(start_dir: &Path, from_source: Option<&Path>) -> Result<(), InitError> {
    // R1: Resolve workspace root via git-common-dir parent; refuse outside git repo.
    let workspace_root = resolve_workspace_root(start_dir)?;

    // R2: Compute workspaceId and workStateId.
    let workspace_id = compute_workspace_id(&workspace_root);
    let _work_state_id = compute_work_state_id(&workspace_id);
    let _repository_id = compute_repository_id(&workspace_id);

    let store_root = resolve_machine_release_store_root();
    let installation_dir = workspace_root.join(".fgos").join("installation");
    let activation_path = installation_dir.join("activation.json");
    let distribution_path = workspace_root.join(".fgos").join("distribution.json");

    // Read tracked .fgos/distribution.json if present (R3).
    let tracked_pin: Option<TrackedDistributionPin> = if distribution_path.exists() {
        let content = std::fs::read_to_string(&distribution_path)?;
        serde_json::from_str(&content).ok()
    } else {
        None
    };

    // Read current activation.json if present (R9 / Reviewer M2).
    let current_activation: Option<WorkspaceActivationBinding> = if activation_path.exists() {
        std::fs::read_to_string(&activation_path)
            .ok()
            .and_then(|s| serde_json::from_str::<WorkspaceActivationBinding>(&s).ok())
    } else {
        None
    };

    // Determine target release digest and candidate directory (Items 2, 3, 5).
    let (target_digest, candidate_dir) = match (&tracked_pin, from_source) {
        (Some(pin), Some(from_src)) => {
            let pin_digest = &pin.project_runtime.artifact_digest;

            // Reconcile --from with pin before staging (Item 2):
            let from_digest = resolve_source_manifest_digest(from_src)?;
            if &from_digest != pin_digest {
                return Err(InitError::Custom(format!(
                    "pin-mismatch: workspace is pinned to {}, --from resolved to {}",
                    pin_digest, from_digest
                )));
            }

            // R9: Idempotent re-run check BEFORE stage_release (Reviewer M2).
            if let Some(ref current) = current_activation {
                if &current.artifact_digest == pin_digest {
                    check_main_checkout_lock(&workspace_root)?;
                    let _activation_lock = ActivationLockGuard::acquire(&installation_dir)?;
                    cleanup_stale_activation_tmp_files(&installation_dir);

                    let shim_fgos = installation_dir.join("bin").join("fgos");
                    run_tail(
                        &workspace_root,
                        &shim_fgos,
                        &store_root,
                        &current.activation_id,
                    )?;
                    return Ok(());
                }
            }

            // Stage candidate release from --from source
            let stage_outcome = stage_release(&store_root, from_src)?;
            let staged_digest = match stage_outcome {
                StageOutcome::Staged { artifact_digest } => artifact_digest,
                StageOutcome::NoOp { artifact_digest } => artifact_digest,
            };

            if &staged_digest != pin_digest {
                return Err(InitError::Custom(format!(
                    "pin-mismatch: workspace is pinned to {}, --from resolved to {}",
                    pin_digest, staged_digest
                )));
            }

            let dir = store_root.join("releases").join(&staged_digest);
            (staged_digest, dir)
        }
        (Some(pin), None) => {
            let pin_digest = &pin.project_runtime.artifact_digest;

            // R9: Idempotent re-run check (Reviewer M2).
            if let Some(ref current) = current_activation {
                if &current.artifact_digest == pin_digest {
                    check_main_checkout_lock(&workspace_root)?;
                    let _activation_lock = ActivationLockGuard::acquire(&installation_dir)?;
                    cleanup_stale_activation_tmp_files(&installation_dir);

                    let shim_fgos = installation_dir.join("bin").join("fgos");
                    run_tail(
                        &workspace_root,
                        &shim_fgos,
                        &store_root,
                        &current.activation_id,
                    )?;
                    return Ok(());
                }
            }

            let dir = store_root.join("releases").join(pin_digest);
            if !dir.exists() {
                return Err(InitError::Custom(format!(
                    "pinned release {} is not staged in release store and no --from source was provided",
                    pin_digest
                )));
            }

            (pin_digest.clone(), dir)
        }
        (None, Some(from_src)) => {
            // Check if from_src matches current activation for idempotent re-run:
            let from_digest = resolve_source_manifest_digest(from_src)?;
            if let Some(ref current) = current_activation {
                if current.artifact_digest == from_digest {
                    check_main_checkout_lock(&workspace_root)?;
                    let _activation_lock = ActivationLockGuard::acquire(&installation_dir)?;
                    cleanup_stale_activation_tmp_files(&installation_dir);

                    let shim_fgos = installation_dir.join("bin").join("fgos");
                    run_tail(
                        &workspace_root,
                        &shim_fgos,
                        &store_root,
                        &current.activation_id,
                    )?;
                    return Ok(());
                }
            }

            let stage_outcome = stage_release(&store_root, from_src)?;
            let staged_digest = match stage_outcome {
                StageOutcome::Staged { artifact_digest } => artifact_digest,
                StageOutcome::NoOp { artifact_digest } => artifact_digest,
            };
            let dir = store_root.join("releases").join(&staged_digest);
            (staged_digest, dir)
        }
        (None, None) => {
            return Err(InitError::Custom(
                "--from <source> is required when .fgos/distribution.json is absent".to_string(),
            ));
        }
    };

    // Read candidate manifest
    let manifest = read_manifest_from_dir(&candidate_dir).map_err(|e| {
        InitError::Custom(format!(
            "failed to read manifest from {}: {}",
            candidate_dir.display(),
            e
        ))
    })?;

    // Reviewer L7 (Item 5): assert the candidate's own manifest.json
    // artifactDigest equals the resolved target digest on every arm (pin-only,
    // pin+matching --from's StageOutcome::NoOp, and no-pin --from's NoOp all
    // trust releases/<digest> by directory name alone otherwise) -- a
    // tampered or corrupted release-store entry must be refused here, not
    // just on the pin-only path.
    if manifest.artifact_digest != target_digest {
        return Err(InitError::Custom(format!(
            "staged release manifest digest mismatch: {} declares {}, expected {}",
            candidate_dir.display(),
            manifest.artifact_digest,
            target_digest
        )));
    }

    // R5: Read-only .fgos/main-checkout.lock check before publish
    check_main_checkout_lock(&workspace_root)?;

    // R6: Preflight before publish (no host-visible writes)
    preflight_candidate(&candidate_dir, &manifest)?;

    // Acquire workspace activation lock before ANY workspace-visible write (Item 1)
    let _activation_lock = ActivationLockGuard::acquire(&installation_dir)?;

    // Clean up stale activation.json.tmp.* files left from previous killed runs (Item 6)
    cleanup_stale_activation_tmp_files(&installation_dir);

    // Re-read activation.json now that the activation lock is held (Reviewer
    // Item 1 TOCTOU): the `current_activation` captured before staging/lock
    // acquisition can be stale by the time this process reaches publish -- a
    // slower initializer that started before a faster concurrent one
    // finished would otherwise republish with a wrong `previousArtifactDigest`
    // and skip the idempotent short-circuit entirely. This second read is
    // authoritative; the earlier one was only ever a fast-path optimization
    // to avoid wasted staging work in the common uncontended case.
    let current_activation_under_lock: Option<WorkspaceActivationBinding> =
        if activation_path.exists() {
            std::fs::read_to_string(&activation_path)
                .ok()
                .and_then(|s| serde_json::from_str::<WorkspaceActivationBinding>(&s).ok())
        } else {
            None
        };

    if let Some(ref current) = current_activation_under_lock {
        if current.artifact_digest == target_digest {
            let shim_fgos = installation_dir.join("bin").join("fgos");
            run_tail(
                &workspace_root,
                &shim_fgos,
                &store_root,
                &current.activation_id,
            )?;
            return Ok(());
        }
    }

    // Previous activation digest if present
    let previous_artifact_digest: Option<String> =
        current_activation_under_lock.map(|a| a.artifact_digest);

    publish_and_tail(PublishArgs {
        workspace_root: &workspace_root,
        store_root: &store_root,
        candidate_dir: &candidate_dir,
        manifest: &manifest,
        previous_artifact_digest,
        tracked_pin: tracked_pin.as_ref(),
        update_pin: false,
        _lock: &_activation_lock,
    })
}

/// Arguments for `publish_and_tail`.
pub struct PublishArgs<'a> {
    pub workspace_root: &'a Path,
    pub store_root: &'a Path,
    pub candidate_dir: &'a Path,
    pub manifest: &'a ReleaseManifest,
    pub previous_artifact_digest: Option<String>,
    pub tracked_pin: Option<&'a TrackedDistributionPin>,
    pub update_pin: bool,
    pub _lock: &'a ActivationLockGuard,
}

/// Preflight, capsule creation, atomic activation publishing, and post-activation tail.
pub fn publish_and_tail(args: PublishArgs<'_>) -> Result<(), InitError> {
    let workspace_id = compute_workspace_id(args.workspace_root);
    let work_state_id = compute_work_state_id(&workspace_id);
    let repository_id = compute_repository_id(&workspace_id);

    let installation_dir = args.workspace_root.join(".fgos").join("installation");
    let activation_path = installation_dir.join("activation.json");
    let distribution_path = args.workspace_root.join(".fgos").join("distribution.json");

    let activation_id = format!("act_{:016x}", now_millis());
    let now_str = format_iso8601_utc(SystemTime::now());

    // R7: Write capsule at <workspace root>/.fgos/installation/
    let bin_dir = installation_dir.join("bin");
    std::fs::create_dir_all(&bin_dir)?;
    std::fs::create_dir_all(installation_dir.join("projections"))?;

    let shim_fgos = bin_dir.join("fgos");
    let shim_runner = bin_dir.join("fgos-runner");

    std::fs::write(&shim_fgos, SHIM_FGOS_BODY)?;
    std::fs::write(&shim_runner, SHIM_FGOS_RUNNER_BODY)?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(&shim_fgos, std::fs::Permissions::from_mode(0o755));
        let _ = std::fs::set_permissions(&shim_runner, std::fs::Permissions::from_mode(0o755));
    }

    // Write root.json
    let root_binding = WorkspaceRootBinding {
        schema_version: 1,
        repository_root: args.workspace_root.to_string_lossy().to_string(),
        workspace_id: workspace_id.clone(),
        work_state_id: work_state_id.clone(),
        machine_release_store: args.store_root.to_string_lossy().to_string(),
    };
    let root_json_bytes = serde_json::to_vec_pretty(&root_binding)?;
    std::fs::write(installation_dir.join("root.json"), root_json_bytes)?;

    // Publish activation.json
    let node_path = resolve_node_path();
    let pin_snapshot = if let Some(pin) = args.tracked_pin {
        serde_json::to_value(pin).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({
            "schemaVersion": 1,
            "projectRuntime": {
                "policy": "exact-digest",
                "artifactDigest": args.manifest.artifact_digest,
                "releaseVersion": args.manifest.release_version,
                "channel": null,
                "allowPrerelease": false
            }
        })
    };

    let activation_binding = WorkspaceActivationBinding {
        schema_version: 1,
        repository_id,
        workspace_id: workspace_id.clone(),
        work_state_id,
        activation_id: activation_id.clone(),
        status: "ready".to_string(),
        artifact_digest: args.manifest.artifact_digest.clone(),
        release_path: args.candidate_dir.to_string_lossy().to_string(),
        previous_artifact_digest: args.previous_artifact_digest,
        shim_version: "1".to_string(),
        resolved_dependencies: serde_json::json!({ "node": node_path }),
        pin_snapshot,
        activated_at: now_str.clone(),
        activated_by: ActivatedByInfo {
            tool: "fgctl".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
        },
    };

    publish_activation_file(&activation_path, &activation_binding)?;

    // If tracked .fgos/distribution.json was absent or update requested, write it now
    if args.update_pin || !distribution_path.exists() {
        let pin = TrackedDistributionPin {
            schema_version: 1,
            project_runtime: ProjectRuntimePin {
                policy: "exact-digest".to_string(),
                artifact_digest: args.manifest.artifact_digest.clone(),
                release_version: args.manifest.release_version.clone(),
                channel: None,
                allow_prerelease: false,
            },
        };
        let pin_bytes = serde_json::to_vec_pretty(&pin)?;
        std::fs::create_dir_all(args.workspace_root.join(".fgos"))?;
        std::fs::write(&distribution_path, pin_bytes)?;
    }

    // Write <store>/installs/<activationId>.json
    let installs_dir = args.store_root.join("installs");
    std::fs::create_dir_all(&installs_dir)?;
    let tx_record = InstallTransactionRecord {
        schema_version: 1,
        activation_id: activation_id.clone(),
        workspace_id,
        artifact_digest: args.manifest.artifact_digest.clone(),
        status: "ready-published".to_string(),
        history: vec![
            TransactionHistoryEntry {
                status: "staging".to_string(),
                timestamp: now_str.clone(),
            },
            TransactionHistoryEntry {
                status: "verified".to_string(),
                timestamp: now_str.clone(),
            },
            TransactionHistoryEntry {
                status: "preparing".to_string(),
                timestamp: now_str.clone(),
            },
            TransactionHistoryEntry {
                status: "ready-published".to_string(),
                timestamp: now_str,
            },
        ],
        updated_at: format_iso8601_utc(SystemTime::now()),
    };
    let tx_bytes = serde_json::to_vec_pretty(&tx_record)?;
    std::fs::write(
        installs_dir.join(format!("{}.json", activation_id)),
        tx_bytes,
    )?;

    // R8: Run the tail through the just-written shim
    run_tail(
        args.workspace_root,
        &shim_fgos,
        args.store_root,
        &activation_id,
    )?;

    Ok(())
}

/// Reads currentStateSchema from <workHistoryRoot>/schema.json (defaults to "1" if missing)
/// and verifies candidate manifest compatibility:
/// - manifest.state_schemas.read contains currentStateSchema (else `state-schema-incompatible`)
/// - manifest.state_schemas.write contains currentStateSchema (else `state-schema-write-incompatible`)
pub fn check_state_schema_compatibility(
    work_history_root: &Path,
    manifest: &ReleaseManifest,
) -> Result<String, InitError> {
    let schema_path = work_history_root.join("schema.json");
    let current_schema = if schema_path.exists() {
        let content = std::fs::read_to_string(&schema_path)?;
        let val: serde_json::Value = serde_json::from_str(&content)?;
        if let Some(s) = val.get("currentStateSchema").and_then(|v| v.as_str()) {
            s.to_string()
        } else if let Some(n) = val.get("currentStateSchema").and_then(|v| v.as_i64()) {
            n.to_string()
        } else if let Some(u) = val.get("currentStateSchema").and_then(|v| v.as_u64()) {
            u.to_string()
        } else {
            "1".to_string()
        }
    } else {
        "1".to_string()
    };

    let (read_schemas, write_schemas) = match &manifest.state_schemas {
        Some(s) => (s.read.as_slice(), s.write.as_slice()),
        None => {
            let empty: &[String] = &[];
            (empty, empty)
        }
    };

    if !read_schemas.iter().any(|s| s == &current_schema) {
        return Err(InitError::Custom(format!(
            "state-schema-incompatible: candidate release cannot read workspace state schema '{}'",
            current_schema
        )));
    }

    if !write_schemas.iter().any(|s| s == &current_schema) {
        return Err(InitError::Custom(format!(
            "state-schema-write-incompatible: candidate release cannot write workspace state schema '{}'",
            current_schema
        )));
    }

    Ok(current_schema)
}

/// Upgrades workspace to a new release candidate (--from <source>).
pub fn upgrade_workspace(start_dir: &Path, from_source: &Path) -> Result<(), InitError> {
    let workspace_root = resolve_workspace_root(start_dir)?;
    let workspace_id = compute_workspace_id(&workspace_root);
    let work_state_id = compute_work_state_id(&workspace_id);

    let store_root = resolve_machine_release_store_root();
    let installation_dir = workspace_root.join(".fgos").join("installation");
    let activation_path = installation_dir.join("activation.json");

    if !activation_path.exists() {
        return Err(InitError::Custom(
            "no active runtime found in workspace -- run 'fgctl init' first".to_string(),
        ));
    }

    let current_activation: WorkspaceActivationBinding = {
        let content = std::fs::read_to_string(&activation_path)?;
        serde_json::from_str(&content)?
    };

    // Stage candidate release from --from source
    let stage_outcome = stage_release(&store_root, from_source)?;
    let staged_digest = match stage_outcome {
        StageOutcome::Staged { artifact_digest } => artifact_digest,
        StageOutcome::NoOp { artifact_digest } => artifact_digest,
    };

    let candidate_dir = store_root.join("releases").join(&staged_digest);
    let manifest = read_manifest_from_dir(&candidate_dir).map_err(|e| {
        InitError::Custom(format!(
            "failed to read manifest from {}: {}",
            candidate_dir.display(),
            e
        ))
    })?;

    if manifest.artifact_digest != staged_digest {
        return Err(InitError::Custom(format!(
            "staged release manifest digest mismatch: {} declares {}, expected {}",
            candidate_dir.display(),
            manifest.artifact_digest,
            staged_digest
        )));
    }

    // Check main checkout lock before publish
    check_main_checkout_lock(&workspace_root)?;

    // R1: State-schema check before publish
    let work_history_root = workspace_root
        .join(".fgos")
        .join("local")
        .join("work-state")
        .join(&work_state_id);
    check_state_schema_compatibility(&work_history_root, &manifest)?;

    // Preflight candidate before publish
    preflight_candidate(&candidate_dir, &manifest)?;

    // Acquire lock and clean stale tmps
    let lock = ActivationLockGuard::acquire(&installation_dir)?;
    cleanup_stale_activation_tmp_files(&installation_dir);

    // Re-read current activation under lock to ensure previousArtifactDigest is fresh
    let current_activation_under_lock: Option<WorkspaceActivationBinding> =
        if activation_path.exists() {
            std::fs::read_to_string(&activation_path)
                .ok()
                .and_then(|s| serde_json::from_str::<WorkspaceActivationBinding>(&s).ok())
        } else {
            None
        };

    let previous_artifact_digest = current_activation_under_lock
        .map(|a| a.artifact_digest)
        .or(Some(current_activation.artifact_digest));

    publish_and_tail(PublishArgs {
        workspace_root: &workspace_root,
        store_root: &store_root,
        candidate_dir: &candidate_dir,
        manifest: &manifest,
        previous_artifact_digest,
        tracked_pin: None,
        update_pin: true,
        _lock: &lock,
    })
}

/// Repairs workspace activation: rolls back if previousArtifactDigest is set,
/// or re-verifies and re-publishes the same digest if previousArtifactDigest is null.
pub fn repair_workspace(start_dir: &Path) -> Result<(), InitError> {
    let workspace_root = resolve_workspace_root(start_dir)?;
    let workspace_id = compute_workspace_id(&workspace_root);
    let work_state_id = compute_work_state_id(&workspace_id);

    let store_root = resolve_machine_release_store_root();
    let installation_dir = workspace_root.join(".fgos").join("installation");
    let activation_path = installation_dir.join("activation.json");

    if !activation_path.exists() {
        return Err(InitError::Custom(
            "no active runtime found in workspace -- run 'fgctl init' first".to_string(),
        ));
    }

    let current_activation: WorkspaceActivationBinding = {
        let content = std::fs::read_to_string(&activation_path)?;
        serde_json::from_str(&content)?
    };

    let (target_digest, candidate_dir) =
        if let Some(ref prev_digest) = current_activation.previous_artifact_digest {
            let dir = store_root.join("releases").join(prev_digest);
            if !dir.exists() {
                return Err(InitError::Custom(format!(
                    "cannot repair: previous release {} not found in release store",
                    prev_digest
                )));
            }
            (prev_digest.clone(), dir)
        } else {
            let active_digest = &current_activation.artifact_digest;
            let dir = store_root.join("releases").join(active_digest);
            if !dir.exists() {
                return Err(InitError::Custom(format!(
                    "cannot repair: active release {} not found in release store",
                    active_digest
                )));
            }
            (active_digest.clone(), dir)
        };

    let manifest_path = candidate_dir.join("manifest.json");
    recompute_artifact_digest(&manifest_path)
        .map_err(|e| InitError::Custom(format!("artifact digest verification failed: {}", e)))?;
    let manifest = read_manifest_from_dir(&candidate_dir).map_err(|e| {
        InitError::Custom(format!(
            "failed to read manifest from {}: {}",
            candidate_dir.display(),
            e
        ))
    })?;
    canonicalize_manifest_files(&manifest)
        .map_err(|e| InitError::Custom(format!("canonicalize manifest failed: {}", e)))?;
    verify_release_files(&candidate_dir, &manifest)
        .map_err(|e| InitError::Custom(format!("verify release files failed: {}", e)))?;

    if manifest.artifact_digest != target_digest {
        return Err(InitError::Custom(format!(
            "staged release manifest digest mismatch: {} declares {}, expected {}",
            candidate_dir.display(),
            manifest.artifact_digest,
            target_digest
        )));
    }

    // Check main checkout lock before publish
    check_main_checkout_lock(&workspace_root)?;

    // R1 & R3: State-schema check before publish
    let work_history_root = workspace_root
        .join(".fgos")
        .join("local")
        .join("work-state")
        .join(&work_state_id);
    check_state_schema_compatibility(&work_history_root, &manifest)?;

    // Preflight candidate before publish
    preflight_candidate(&candidate_dir, &manifest)?;

    // Acquire lock and clean stale tmps
    let lock = ActivationLockGuard::acquire(&installation_dir)?;
    cleanup_stale_activation_tmp_files(&installation_dir);

    publish_and_tail(PublishArgs {
        workspace_root: &workspace_root,
        store_root: &store_root,
        candidate_dir: &candidate_dir,
        manifest: &manifest,
        previous_artifact_digest: None,
        tracked_pin: None,
        update_pin: true,
        _lock: &lock,
    })
}

/// Verifies active release files against manifest and quarantines on any drift.
pub fn verify_workspace(start_dir: &Path) -> Result<(), InitError> {
    let workspace_root = resolve_workspace_root(start_dir)?;
    let store_root = resolve_machine_release_store_root();
    let installation_dir = workspace_root.join(".fgos").join("installation");
    let activation_path = installation_dir.join("activation.json");

    if !activation_path.exists() {
        return Err(InitError::Custom(
            "no active runtime found in workspace -- run 'fgctl init' first".to_string(),
        ));
    }

    let mut current_activation: WorkspaceActivationBinding = {
        let content = std::fs::read_to_string(&activation_path)?;
        serde_json::from_str(&content)?
    };

    let active_digest = current_activation.artifact_digest.clone();
    let release_dir = store_root.join("releases").join(&active_digest);

    let verify_result = (|| -> Result<(), String> {
        if !release_dir.exists() {
            return Err(format!(
                "release directory does not exist: {}",
                release_dir.display()
            ));
        }
        let manifest_path = release_dir.join("manifest.json");
        recompute_artifact_digest(&manifest_path)
            .map_err(|e| format!("artifact digest mismatch: {}", e))?;
        let manifest = read_manifest_from_dir(&release_dir)
            .map_err(|e| format!("manifest read error: {}", e))?;
        canonicalize_manifest_files(&manifest)
            .map_err(|e| format!("canonicalize manifest failed: {}", e))?;
        verify_release_files(&release_dir, &manifest)
            .map_err(|e| format!("file digest mismatch: {}", e))?;
        Ok(())
    })();

    match verify_result {
        Ok(()) => {
            println!("verified active release {}", active_digest);
            Ok(())
        }
        Err(err_msg) => {
            // Mismatch: move release directory to quarantine/<digest>-<timestamp>/
            let timestamp = now_millis();
            let quarantine_dir = store_root
                .join("quarantine")
                .join(format!("{}-{}", active_digest, timestamp));
            std::fs::create_dir_all(store_root.join("quarantine"))?;
            if release_dir.exists() {
                let _ = std::fs::rename(&release_dir, &quarantine_dir);
            }

            // Set activation.json.status to "quarantined" IN PLACE (targeted field update)
            let _lock = ActivationLockGuard::acquire(&installation_dir)?;
            cleanup_stale_activation_tmp_files(&installation_dir);
            current_activation.status = "quarantined".to_string();
            publish_activation_file(&activation_path, &current_activation)?;

            Err(InitError::Custom(format!(
                "active release {} verification failed and was quarantined at {}: {}",
                active_digest,
                quarantine_dir.display(),
                err_msg
            )))
        }
    }
}

/// Workspace status representation for `fgctl status` (R5).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct FgctlWorkspaceStatus {
    pub active_artifact_digest: String,
    pub previous_artifact_digest: Option<String>,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub quarantined: bool,
    pub releases: Vec<ReleaseStatusEntry>,
}

/// Resolves active workspace status alongside the machine release store releases.
pub fn get_workspace_status(start_dir: &Path, store_root: &Path) -> Option<FgctlWorkspaceStatus> {
    let workspace_root = resolve_workspace_root(start_dir).ok()?;
    let installation_dir = workspace_root.join(".fgos").join("installation");
    let activation_path = installation_dir.join("activation.json");
    if !activation_path.exists() {
        return None;
    }
    let content = std::fs::read_to_string(&activation_path).ok()?;
    let activation: WorkspaceActivationBinding = serde_json::from_str(&content).ok()?;
    let releases = list_releases(store_root).unwrap_or_default();

    Some(FgctlWorkspaceStatus {
        active_artifact_digest: activation.artifact_digest,
        previous_artifact_digest: activation.previous_artifact_digest,
        quarantined: activation.status == "quarantined",
        releases,
    })
}
