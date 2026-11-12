//! Workspace initialization and runtime activation (`fgctl init`).
//!
//! Implements the acquire -> stage -> verify -> preflight -> publish -> tail pipeline
//! per `phase-12-fgctl-init-and-activation.md` and
//! `docs/platform/packaging-distribution/contracts/activation-binding.md#init-pipeline-and-root-binding`.

use crate::canonical::canonicalize_manifest_files;
use crate::lock::check_main_checkout_lock;
use crate::manifest::{read_manifest_from_dir, ReleaseManifest};
use crate::shim::{check_workspace_shims, tail_shim_path, write_workspace_shims};
use crate::store::{
    list_releases, now_millis, quarantine_dir_path, release_dir_path,
    resolve_machine_release_store_root, stage_release, ReleaseStatusEntry, StageOutcome,
};
use crate::verify::{recompute_artifact_digest, verify_legacy_node, verify_release_files};
use crate::workspace::{
    compute_repository_id, compute_work_state_id, compute_workspace_id, resolve_workspace_root,
};
use fgos_host_runtime::civil_time::format_system_time_utc;
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::Path;
use std::process::Command;
use std::time::SystemTime;

/// Frozen schema version for tracked distribution pins.
pub const DISTRIBUTION_PIN_SCHEMA_VERSION_V1: u32 = 1;

/// Frozen schema version for workspace activation bindings.
pub const ACTIVATION_BINDING_SCHEMA_VERSION_V1: u32 = 1;

/// Frozen schema version for workspace root topology bindings.
pub const WORKSPACE_ROOT_BINDING_SCHEMA_VERSION_V1: u32 = 1;

/// Frozen schema version for install transaction records.
pub const INSTALL_TRANSACTION_SCHEMA_VERSION_V1: u32 = 1;

/// Tracked project runtime pin policy (`.fgos/distribution.json`).
///
/// Matches `contracts/distribution-pin.md`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TrackedDistributionPin {
    pub schema_version: u32,
    pub project_runtime: ProjectRuntimePin,
}

/// Canonical alias for `TrackedDistributionPin`.
pub type DistributionPin = TrackedDistributionPin;

/// Runtime policy specification inside a `TrackedDistributionPin`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ProjectRuntimePin {
    pub policy: String,
    pub artifact_digest: String,
    #[serde(default)]
    pub release_version: Option<String>,
    #[serde(default)]
    pub channel: Option<String>,
    #[serde(default)]
    pub allow_prerelease: bool,
}

/// Workspace root binding record snapshot (`.fgos/installation/root.json`).
///
/// Binds repository root, workspace identity, work-state identity, and machine release store.
/// Matches `contracts/repository-runtime-layout.md`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceRootBinding {
    pub schema_version: u32,
    pub repository_root: String,
    pub workspace_id: String,
    pub work_state_id: String,
    pub machine_release_store: String,
}

/// Canonical alias for `WorkspaceRootBinding`.
pub type TopologyRootBinding = WorkspaceRootBinding;

/// Tool identity that performed runtime activation.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ActivatedByInfo {
    pub tool: String,
    pub version: String,
}

/// Workspace activation binding (`.fgos/installation/activation.json`).
///
/// Selects and verifies the active fgOS runtime for this workspace.
/// Matches `contracts/activation-binding.md`.
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
    #[serde(default)]
    pub previous_artifact_digest: Option<String>,
    pub shim_version: String,
    pub resolved_dependencies: serde_json::Value,
    pub pin_snapshot: serde_json::Value,
    /// Why `fgctl init --override-pin <reason>` activated a release other than
    /// the one `pinSnapshot` names. Absent on every other activation.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pin_override_reason: Option<String>,
    pub activated_at: String,
    pub activated_by: ActivatedByInfo,
}

/// Canonical alias for `WorkspaceActivationBinding`.
pub type ActivationBinding = WorkspaceActivationBinding;

/// State transition entry in an install transaction history.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TransactionHistoryEntry {
    pub status: String,
    pub timestamp: String,
}

/// Install transaction record (`<store>/installs/<activationId>.json`).
///
/// Audits staging, verification, preparation, and publish lifecycle in the release store.
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
    #[error("activation-lock-held: workspace activation is already in progress ({0})")]
    ActivationLockHeld(&'static str),
    #[error("lock-driver-unavailable: {lock}: {note}")]
    LockDriverUnavailable { lock: &'static str, note: String },
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
    #[error("not ready: the checks listed above need you")]
    NotReady,
    #[error("the committed pin is unreadable: .fgos/distribution.json; restore it from version control, or run `fgctl upgrade` to write a new pin")]
    PinUnreadable,
    #[error("{0}")]
    Fetch(#[from] crate::fetch::FetchError),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("{0}")]
    Custom(String),
    #[error("lock-kernel-semantics-failed: {0}")]
    LockKernelSemanticsFailed(String),
    #[error("lock-borrow-vectors-failed: {0}")]
    LockBorrowVectorsFailed(String),
}

/// Holds the workspace activation lock: a kernel lock on
/// `<workspace>/.fgos/locks/activation-v2.lock` taken through `fgos-holder-lock`.
///
/// One attempt, never a wait. The lock lives on an open file description, so
/// a killed holder frees it at once and there is nothing to reclaim; `Drop`
/// closes the description and never unlocks explicitly.
pub struct ActivationLockGuard {
    _handle: fgos_holder_lock::Handle,
    legacy: Option<fgos_holder_lock::Handle>,
}

impl ActivationLockGuard {
    pub fn acquire(workspace_root: &Path) -> Result<Self, InitError> {
        let lock_path = activation_lock_path(workspace_root);
        if let Some(parent) = lock_path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let resource = fgos_holder_lock::Resource::new("activation", lock_path);
        match fgos_holder_lock::acquire(
            &resource,
            fgos_holder_lock::Mode::Ex,
            fgos_holder_lock::Wait::Try,
            fgos_holder_lock::DEFAULT_KILL_WAIT_MS,
        ) {
            fgos_holder_lock::Acquire::Acquired(handle) => {
                let old = workspace_root.join(".fgos/locks/activation.lock");
                let legacy =
                    if fgos_holder_lock::tombstone::is_tombstone(&old, "activation", "fgos git") {
                        None
                    } else {
                        match fgos_holder_lock::acquire(
                            &fgos_holder_lock::Resource::new("activation", &old),
                            fgos_holder_lock::Mode::Ex,
                            fgos_holder_lock::Wait::Try,
                            fgos_holder_lock::DEFAULT_KILL_WAIT_MS,
                        ) {
                            fgos_holder_lock::Acquire::Acquired(legacy) => Some(legacy),
                            fgos_holder_lock::Acquire::Held { reason, .. } => {
                                return Err(InitError::ActivationLockHeld(reason.as_str()))
                            }
                            other => {
                                return Err(InitError::Custom(format!(
                                    "git-fence-missing: {other:?}"
                                )))
                            }
                        }
                    };
                Ok(Self {
                    _handle: handle,
                    legacy,
                })
            }
            fgos_holder_lock::Acquire::Held { reason, .. } => {
                Err(InitError::ActivationLockHeld(reason.as_str()))
            }
            // A single try never times out; treat it as held if a driver ever reports it.
            fgos_holder_lock::Acquire::Timeout { .. } => Err(InitError::ActivationLockHeld(
                fgos_holder_lock::HeldReason::KernelLockHeld.as_str(),
            )),
            fgos_holder_lock::Acquire::Unavailable { reason, detail } => {
                Err(InitError::LockDriverUnavailable {
                    lock: "activation",
                    note: format!("{}: {detail}", reason.as_str()),
                })
            }
        }
    }
}

impl ActivationLockGuard {
    pub(crate) fn fence_legacy(&self, workspace: &Path) -> Result<(), InitError> {
        if let Some(legacy) = &self.legacy {
            fgos_holder_lock::tombstone::replace_held_file(
                legacy,
                "activation",
                "fgos git",
                &format_iso8601_utc(SystemTime::now()),
            )?;
        }
        if !fgos_holder_lock::tombstone::is_tombstone(
            &workspace.join(".fgos/locks/activation.lock"),
            "activation",
            "fgos git",
        ) {
            return Err(InitError::Custom("git-fence-missing".into()));
        }
        Ok(())
    }
}

/// `<workspace>/.fgos/locks/activation-v2.lock`, the one path of the activation lock.
pub fn activation_lock_path(workspace_root: &Path) -> std::path::PathBuf {
    workspace_root
        .join(".fgos")
        .join("locks")
        .join("activation-v2.lock")
}

/// Cleans up any stale `activation.json.tmp.*` files left from a previous killed run (Reviewer L8).
///
/// Must only be called after acquiring `activation-v2.lock`.
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
    format_system_time_utc(time)
}

/// Resolves path to `node` executable on PATH.
pub fn resolve_node_path() -> String {
    if let Ok(path_var) = std::env::var("PATH") {
        for dir in std::env::split_paths(&path_var) {
            for name in ["node", "node.exe"] {
                let candidate = dir.join(name);
                if candidate.is_file() {
                    return candidate.to_string_lossy().to_string();
                }
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

/// The release-relative path the workspace shim execs after activation
/// (`SHIM_FGOS_BODY`: `exec "$release_path/bin/fgos"`). Preflight pins the
/// manifest's declared `entries.fgos` to this exact path so the identity the
/// manifest commits to and the bytes the shim will run can never diverge.
const SHIM_FGOS_ENTRY: &str = "bin/fgos";

/// Preflight checks before publish (R6).
///
/// Entirely static: preflight NEVER executes candidate release code. A
/// candidate has no writer authority before its activation binding is
/// published, and the only boundary this crate can actually enforce on an
/// arbitrary `bin/fgos` is not running it -- an env-var "bootstrap context"
/// is a request the candidate may ignore, not a confinement, and no host
/// (Rust or Node) ever honored one. Everything the old runtime smoke could
/// prove about identity (the candidate reports the expected
/// `artifactDigest`) is already provable from the digest-verified tree
/// here; whether the activated host actually enters Rust and reports that
/// digest is proven post-publish, through the shim, with writer authority
/// already granted (`test/rust-host/fgctl-init.test.mjs`).
///
/// The only child process preflight spawns is the trusted host dependency
/// `node --version` (`check_node_requirement`), never anything under
/// `candidate_dir`.
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
    let files = verify_release_files(candidate_dir, manifest)
        .map_err(|e| InitError::Preflight(format!("verify release files failed: {}", e)))?;
    verify_legacy_node(candidate_dir, manifest, files)
        .map_err(|e| InitError::Preflight(format!("verify legacy node failed: {}", e)))?;

    // 3. Confirm requires.node
    if let Some(req) = &manifest.requires.node {
        check_node_requirement(req).map_err(InitError::Preflight)?;
    }

    // 4. Host entry identity: the entry the shim will exec must be the one
    //    the manifest declares, must be covered by a digest-verified
    //    `files[]` row (so its bytes are part of `artifactDigest`, checked
    //    in step 2), and must be a regular executable file on disk.
    verify_candidate_host_entry(candidate_dir, manifest)?;

    Ok(())
}

/// Static identity check for the candidate's host entry (`bin/fgos`).
///
/// Refuses, without executing anything, a candidate whose declared
/// `entries.fgos` is not the shim's exec path, whose host entry bytes are not
/// part of the manifest's digest-covered `files[]`, or whose on-disk entry is
/// missing, a symlink, or not executable.
fn verify_candidate_host_entry(
    candidate_dir: &Path,
    manifest: &ReleaseManifest,
) -> Result<(), InitError> {
    if manifest.entries.fgos != SHIM_FGOS_ENTRY {
        return Err(InitError::Preflight(format!(
            "candidate manifest entries.fgos declares {:?}; the workspace shim execs {:?}",
            manifest.entries.fgos, SHIM_FGOS_ENTRY
        )));
    }

    let covered = manifest
        .files
        .iter()
        .any(|f| f.path == SHIM_FGOS_ENTRY && f.kind == "file");
    if !covered {
        return Err(InitError::Preflight(format!(
            "candidate {} is not covered by a digest-verified manifest files[] entry",
            SHIM_FGOS_ENTRY
        )));
    }

    let fgos_bin = candidate_dir.join("bin").join("fgos");
    let meta = match std::fs::symlink_metadata(&fgos_bin) {
        Ok(m) => m,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            return Err(InitError::Preflight(format!(
                "candidate bin/fgos not found at {}",
                fgos_bin.display()
            )));
        }
        Err(e) => return Err(InitError::Io(e)),
    };
    if meta.file_type().is_symlink() || !meta.file_type().is_file() {
        return Err(InitError::Preflight(format!(
            "candidate bin/fgos at {} is not a regular file",
            fgos_bin.display()
        )));
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if meta.permissions().mode() & 0o111 == 0 {
            return Err(InitError::Preflight(format!(
                "candidate bin/fgos at {} is not executable",
                fgos_bin.display()
            )));
        }
    }

    Ok(())
}

/// Atomically publishes `activation.json` via .tmp.<activationId> + rename (R7).
pub fn publish_activation_file(
    activation_path: &Path,
    binding: &WorkspaceActivationBinding,
) -> std::io::Result<()> {
    if let Some(parent) = activation_path.parent() {
        std::fs::create_dir_all(parent)?;
    }

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

impl InitError {
    /// The process exit status for this error: `precondition` (2) when the
    /// release is activated but `fgos doctor` still lists checks that need the
    /// user, 1 for every other failure.
    pub fn exit_status(&self) -> i32 {
        match self {
            InitError::NotReady => fgos_host_runtime::exit_codes::precondition(),
            InitError::PinUnreadable => fgos_host_runtime::exit_codes::validation(),
            _ => 1,
        }
    }
}

/// Whether the release the tail runs for was just activated or was already
/// the active one (the closing block says which).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TailOutcome {
    Activated,
    AlreadyCurrent,
}

/// What the closing block says about the active release.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ReadyFacts {
    pub tag: Option<String>,
    pub digest12: String,
    pub already_current: bool,
    /// How the user types `fgos`: bare, or the launcher's absolute path when
    /// its directory is not on PATH.
    pub run_command: String,
    /// Lines the init step asked the user to see (`legacyConfigNote`, `legacyConfigWarning`, `workStoreNote`).
    pub notes: Vec<String>,
}

/// The closing block of init, upgrade and repair, and whether it reports a
/// ready workspace.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ClosingBlock {
    pub text: String,
    pub ready: bool,
}

/// First twelve characters of a digest, without its `sha256:` prefix.
pub fn short_digest(digest: &str) -> String {
    digest
        .strip_prefix("sha256:")
        .unwrap_or(digest)
        .chars()
        .take(12)
        .collect()
}

/// The command a user types to run `fgos`: bare when the directory holding
/// the launcher (beside `fgctl`) is on PATH, its absolute path otherwise.
pub fn run_command(launcher_dir: Option<&Path>, path_var: Option<&std::ffi::OsStr>) -> String {
    let name = if cfg!(windows) { "fgos.cmd" } else { "fgos" };
    let Some(dir) = launcher_dir else {
        return "fgos".to_string();
    };
    let same = |a: &Path, b: &Path| {
        a == b || matches!((a.canonicalize(), b.canonicalize()), (Ok(x), Ok(y)) if x == y)
    };
    let on_path = path_var.is_some_and(|v| std::env::split_paths(v).any(|p| same(&p, dir)));
    if on_path {
        return "fgos".to_string();
    }
    let full = dir.join(name).display().to_string();
    if full.contains(char::is_whitespace) {
        format!("\"{full}\"")
    } else {
        full
    }
}

/// The lines `fgos init` put in its own result for the person running the upgrade; its stdout is
/// otherwise dropped on success. Output that is not an init result gives none.
pub fn init_notes(init_stdout: &[u8]) -> Vec<String> {
    let Ok(value) = serde_json::from_slice::<serde_json::Value>(init_stdout) else {
        return Vec::new();
    };
    let data = value.get("data").unwrap_or(&value);
    ["legacyConfigNote", "legacyConfigWarning", "workStoreNote"]
        .iter()
        .filter_map(|key| data.get(*key).and_then(|v| v.as_str()))
        .map(str::to_string)
        .collect()
}

/// Builds the closing block from `fgos doctor --json` output: `Ready` plus one
/// runnable next step when `ok`, otherwise a numbered list of the failing
/// checks, each with its fix command (or its message when only a person can
/// fix it). Output that is not a doctor result is an error, never a guess.
pub fn closing_block(doctor_stdout: &str, facts: &ReadyFacts) -> Result<ClosingBlock, String> {
    let not_doctor =
        |why: &str| format!("fgos doctor --json did not return a doctor result ({why})");
    let value: serde_json::Value =
        serde_json::from_str(doctor_stdout).map_err(|e| not_doctor(&e.to_string()))?;
    let data = value.get("data").unwrap_or(&value);
    let ok = data
        .get("ok")
        .and_then(|v| v.as_bool())
        .ok_or_else(|| not_doctor("no boolean `ok`"))?;
    let tag = facts
        .tag
        .as_deref()
        .map(|t| format!("fgOS {t}"))
        .unwrap_or_else(|| "fgOS".to_string());
    let notes: String = facts.notes.iter().map(|n| format!("Note: {n}\n")).collect();
    if ok {
        let first = if facts.already_current {
            format!("Ready: already up to date at {} ({tag})", facts.digest12)
        } else {
            format!("Ready: {tag} active ({})", facts.digest12)
        };
        return Ok(ClosingBlock {
            text: format!(
                "{first}\n{notes}Next: {} run \"<prompt>\"\n",
                facts.run_command
            ),
            ready: true,
        });
    }
    let checks = data
        .get("checks")
        .and_then(|v| v.as_array())
        .ok_or_else(|| not_doctor("no `checks` list"))?;
    let lines: Vec<String> = checks
        .iter()
        .filter(|c| c.get("status").and_then(|s| s.as_str()) == Some("fail"))
        .map(|c| {
            let id = c.get("id").and_then(|v| v.as_str()).unwrap_or("?");
            let what = c
                .get("fix")
                .and_then(|v| v.as_str())
                .or_else(|| c.get("message").and_then(|v| v.as_str()))
                .unwrap_or("see fgos doctor");
            format!("{id}: {}", what.lines().next().unwrap_or(what))
        })
        .collect();
    if lines.is_empty() {
        return Err(not_doctor("`ok` is false but no check fails"));
    }
    let head = if lines.len() == 1 {
        "1 check needs you:".to_string()
    } else {
        format!("{} checks need you:", lines.len())
    };
    let mut text = format!("{head}\n");
    for (i, line) in lines.iter().enumerate() {
        text.push_str(&format!("  {}. {line}\n", i + 1));
    }
    text.push_str(&notes);
    Ok(ClosingBlock { text, ready: false })
}

/// Facts for the Ready line, read from what activation just wrote.
fn ready_facts(
    workspace_root: &Path,
    store_root: &Path,
    outcome: TailOutcome,
) -> Result<ReadyFacts, InitError> {
    let fgos_dir = workspace_root.join(".fgos");
    let activation: WorkspaceActivationBinding = serde_json::from_str(&std::fs::read_to_string(
        fgos_dir.join("installation").join("activation.json"),
    )?)?;
    let pin_tag = read_tracked_pin(&fgos_dir.join("distribution.json"))
        .present()
        .filter(|p| p.project_runtime.artifact_digest == activation.artifact_digest)
        .and_then(|p| p.project_runtime.release_version);
    let tag = match pin_tag {
        Some(t) => Some(t),
        None => read_manifest_from_dir(&release_dir_path(store_root, &activation.artifact_digest))
            .ok()
            .and_then(|m| m.release_version),
    };
    let launcher_dir = std::env::current_exe()
        .ok()
        .and_then(|exe| exe.parent().map(Path::to_path_buf));
    Ok(ReadyFacts {
        tag: tag.map(|t| normalize_pin_tag(&t)),
        digest12: short_digest(&activation.artifact_digest),
        already_current: outcome == TailOutcome::AlreadyCurrent,
        run_command: run_command(launcher_dir.as_deref(), std::env::var_os("PATH").as_deref()),
        notes: Vec::new(),
    })
}

/// Runs one tail step through the workspace launcher and returns its stdout.
/// A step that cannot start or exits non-zero marks the transaction degraded,
/// shows what it printed on stderr and fails with its exit code.
fn run_tail_step(
    workspace_root: &Path,
    shim_path: &Path,
    tx_path: &Path,
    args: &[&str],
) -> Result<Vec<u8>, InitError> {
    let cmd_name = args.join(" ");
    // A Windows host runs the `.cmd` form: no `sh` is assumed there.
    let launcher = tail_shim_path(shim_path, cfg!(windows));
    let output = match Command::new(launcher)
        .args(args)
        .current_dir(workspace_root)
        .output()
    {
        Ok(o) => o,
        Err(e) => {
            mark_transaction_status(tx_path, "ready-degraded")?;
            eprintln!("Error executing shim tail '{}': {}", cmd_name, e);
            return Err(InitError::TailFailed {
                cmd: cmd_name,
                status: 1,
            });
        }
    };
    if !output.status.success() {
        mark_transaction_status(tx_path, "ready-degraded")?;
        let mut err = std::io::stderr();
        let _ = err.write_all(&output.stdout);
        let _ = err.write_all(&output.stderr);
        return Err(InitError::TailFailed {
            cmd: cmd_name,
            status: output.status.code().unwrap_or(1),
        });
    }
    Ok(output.stdout)
}

/// Whether a `fgos doctor --json` result needs no repair: `ok`, and no row
/// that is not passing still names a fix (`doctor --fix` would have work to
/// do). Anything that is not a doctor result is not clean.
fn doctor_is_clean(doctor_stdout: &str) -> bool {
    let Ok(value) = serde_json::from_str::<serde_json::Value>(doctor_stdout) else {
        return false;
    };
    let data = value.get("data").unwrap_or(&value);
    if data.get("ok").and_then(|v| v.as_bool()) != Some(true) {
        return false;
    }
    let has_pending_fix = |row: &serde_json::Value| {
        matches!(
            row.get("status").and_then(|s| s.as_str()),
            Some("warn" | "fail")
        ) && row.get("fix").is_some_and(|f| !f.is_null())
    };
    !data
        .get("checks")
        .and_then(|v| v.as_array())
        .is_some_and(|rows| rows.iter().any(has_pending_fix))
}

/// What a no-op run prints instead of the closing block's first line.
fn noop_block(facts: &ReadyFacts) -> String {
    let tag = facts
        .tag
        .as_deref()
        .map(|t| format!("fgOS {t}"))
        .unwrap_or_else(|| "fgOS".to_string());
    let notes: String = facts.notes.iter().map(|n| format!("Note: {n}\n")).collect();
    format!(
        "nothing to do: {tag} already active, doctor ok\n{notes}Next: {} run \"<prompt>\"\n",
        facts.run_command
    )
}

/// Runs the post-activation tail: `fgos init` (idempotent: it settles an
/// interrupted Git operation, detects agent CLIs, migrates a legacy config and
/// creates the machine id, lock directories and header files), then
/// `doctor --json`. A clean result ends the run on the closing block built from
/// it; otherwise `doctor --fix` runs and a second `doctor --json` becomes the
/// closing block (R8). Plumbing output is shown on stderr only when a step
/// fails. A doctor result that is not ok ends the command with
/// [`InitError::NotReady`]. Re-running the release that is already active with
/// nothing left to repair says `nothing to do`.
pub fn run_tail(
    workspace_root: &Path,
    shim_path: &Path,
    store_root: &Path,
    activation_id: &str,
    outcome: TailOutcome,
) -> Result<(), InitError> {
    let tx_path = store_root
        .join("installs")
        .join(format!("{}.json", activation_id));

    let init = run_tail_step(workspace_root, shim_path, &tx_path, &["init"])?;
    let mut doctor = run_tail_step(workspace_root, shim_path, &tx_path, &["doctor", "--json"])?;
    let clean = doctor_is_clean(&String::from_utf8_lossy(&doctor));
    if !clean {
        run_tail_step(workspace_root, shim_path, &tx_path, &["doctor", "--fix"])?;
        doctor = run_tail_step(workspace_root, shim_path, &tx_path, &["doctor", "--json"])?;
    }

    let mut facts = ready_facts(workspace_root, store_root, outcome).inspect_err(|_| {
        let _ = mark_transaction_status(&tx_path, "ready-degraded");
    })?;
    facts.notes = init_notes(&init);
    if clean && outcome == TailOutcome::AlreadyCurrent {
        print!("{}", noop_block(&facts));
        let _ = std::io::stdout().flush();
        mark_transaction_status(&tx_path, "complete")?;
        return Ok(());
    }
    let block = closing_block(&String::from_utf8_lossy(&doctor), &facts).map_err(|why| {
        let _ = mark_transaction_status(&tx_path, "ready-degraded");
        InitError::Custom(why)
    })?;
    print!("{}", block.text);
    let _ = std::io::stdout().flush();
    if !block.ready {
        mark_transaction_status(&tx_path, "ready-degraded")?;
        return Err(InitError::NotReady);
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

/// True only when `releases/<digest>/` genuinely exists on disk. A binding
/// can claim `status: "ready"` for a digest whose release directory is
/// already gone -- a process SIGKILLed by `fgctl verify` between moving the
/// release to quarantine/ and publishing `status: "quarantined"` leaves
/// exactly this "falsely ready" state behind, and status alone cannot tell
/// the difference from a genuinely healthy binding.
fn is_release_staged(store_root: &Path, digest: &str) -> bool {
    release_dir_path(store_root, digest).exists()
}

/// What `.fgos/distribution.json` holds: no file, a file that is not a pin, or a pin.
pub enum PinFile {
    Absent,
    Unreadable,
    Present(TrackedDistributionPin),
}

impl PinFile {
    /// The pin when there is a readable one.
    fn present(self) -> Option<TrackedDistributionPin> {
        match self {
            PinFile::Present(pin) => Some(pin),
            _ => None,
        }
    }

    /// The pin to resolve against: a file that exists but is not a pin
    /// stops the caller instead of reading as "no pin".
    fn require_readable(self) -> Result<Option<TrackedDistributionPin>, InitError> {
        match self {
            PinFile::Unreadable => Err(InitError::PinUnreadable),
            other => Ok(other.present()),
        }
    }
}

const PIN_FILE_RELATIVE: &str = ".fgos/distribution.json";

/// The one reader of the committed `.fgos/distribution.json` pin.
fn read_tracked_pin(distribution_path: &Path) -> PinFile {
    if !distribution_path.exists() {
        return PinFile::Absent;
    }
    match std::fs::read_to_string(distribution_path)
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
    {
        Some(pin) => PinFile::Present(pin),
        None => PinFile::Unreadable,
    }
}

/// The release tag already on record for `digest`: the committed pin's when
/// the pin names that release, else the current activation's pin snapshot
/// when it does. A repair re-publishes a release that was activated before, so
/// it keeps that tag; a release neither names has no tag that can be fetched
/// again, and the pin it gets is digest-only.
fn recorded_release_tag(
    pin: PinFile,
    activation: &WorkspaceActivationBinding,
    digest: &str,
) -> Option<String> {
    let from_pin = pin
        .present()
        .filter(|p| p.project_runtime.artifact_digest == digest)
        .and_then(|p| p.project_runtime.release_version);
    from_pin.or_else(|| {
        let runtime = activation.pin_snapshot.get("projectRuntime")?;
        (runtime.get("artifactDigest")?.as_str()? == digest)
            .then(|| runtime.get("releaseVersion")?.as_str().map(str::to_string))
            .flatten()
    })
}

/// The release `fgctl init --override-pin` may activate: one that differs
/// from the tracked pin and is already staged in the machine store
/// (`releases/<digest>/`; a quarantined release has been moved out of it).
/// The override never stages, so whatever it activates was digest-checked by
/// `fgctl stage` or an earlier init, and is checked again by preflight.
fn staged_pin_override_candidate(
    store_root: &Path,
    pin: Option<&TrackedDistributionPin>,
    digest: &str,
) -> Result<std::path::PathBuf, InitError> {
    let Some(pin) = pin else {
        return Err(InitError::Custom(
            "pin-override-without-pin: .fgos/distribution.json holds no pin to override; run fgctl init --from <source> without --override-pin".to_string(),
        ));
    };
    if pin.project_runtime.artifact_digest == digest {
        return Err(InitError::Custom(format!(
            "pin-override-unneeded: --from resolves to the pinned release {digest}; run fgctl init without --override-pin"
        )));
    }
    if !is_release_staged(store_root, digest) {
        return Err(InitError::Custom(format!(
            "pin-override-unstaged: release {digest} is not staged on this machine; --override-pin activates only a staged release (fgctl stage --from <path> first)"
        )));
    }
    Ok(release_dir_path(store_root, digest))
}

/// Release tags are `v`-prefixed; a pin may hold a bare semantic version (for
/// example one copied from a release manifest), which names the same release.
fn normalize_pin_tag(tag: &str) -> String {
    if tag.starts_with(|c: char| c.is_ascii_digit()) {
        format!("v{tag}")
    } else {
        tag.to_string()
    }
}

/// Executes `fgctl init`, choosing the release source by precedence
/// (`--from` flag > `FGCTL_FROM` > `FGCTL_VERSION` > the project's pin > the
/// latest GitHub release) and downloading it first when it is a URL or a
/// release asset. The download is checksum-verified before it reaches
/// [`init_workspace`], and its scratch copy is removed when init returns.
///
/// `pin_override_reason` is `fgctl init --override-pin <reason>`: recovery of
/// a workspace whose tracked pin names a release this machine cannot activate.
/// It takes only a local `--from` (or `FGCTL_FROM`) whose release is already
/// staged in the machine store, runs every check a plain init runs, records
/// the reason in the activation and never writes `.fgos/distribution.json`.
pub fn init_workspace_resolving(
    start_dir: &Path,
    inputs: &crate::fetch::SourceInputs,
    endpoint: &crate::fetch::DownloadEndpoint,
    pin_override_reason: Option<&str>,
) -> Result<(), InitError> {
    use crate::fetch::{choose_source, fetch_release, fetch_url, SourceChoice};

    if let Some(reason) = pin_override_reason {
        let reason = reason.trim();
        if reason.is_empty() {
            return Err(InitError::Custom(
                "pin-override-reason-empty: --override-pin needs a reason, recorded in the activation".to_string(),
            ));
        }
        // An override never downloads: it activates a release this machine
        // already staged, named by a local path.
        return match choose_source(inputs, true) {
            SourceChoice::Local(path) => {
                init_workspace_tagged(start_dir, Some(&path), None, Some(reason))
            }
            _ => Err(InitError::Custom(
                "pin-override-needs-from: --override-pin needs --from <path> (or FGCTL_FROM) naming a release staged on this machine".to_string(),
            )),
        };
    }

    // Refuse outside a repository checkout before any network traffic.
    let workspace_root = resolve_workspace_root(start_dir)?;
    let pin = read_tracked_pin(&workspace_root.join(".fgos").join("distribution.json"))
        .require_readable()?;

    match choose_source(inputs, pin.is_some()) {
        SourceChoice::Pinned => {
            // A pin that records its release tag can be re-acquired on a machine
            // that has not staged it. A digest-only pin cannot (a digest names no
            // download), so it keeps the original behavior.
            let missing_tag = pin.as_ref().and_then(|p| {
                let runtime = &p.project_runtime;
                let staged = is_release_staged(
                    &resolve_machine_release_store_root(),
                    &runtime.artifact_digest,
                );
                runtime.release_version.clone().filter(|_| !staged)
            });
            match missing_tag {
                Some(tag) => {
                    eprintln!("pinned release {tag} is not staged on this machine; downloading it");
                    let downloaded = fetch_release(endpoint, Some(&normalize_pin_tag(&tag)))
                        .map_err(|e| {
                            InitError::Custom(format!(
                                "pinned release {tag} could not be downloaded: {e}; pass FGCTL_VERSION=<tag> or FGCTL_FROM=<path | URL> to choose the release yourself"
                            ))
                        })?;
                    eprintln!("downloaded and verified {}", downloaded.origin);
                    // The pin's digest is checked against what was fetched.
                    init_workspace_tagged(
                        start_dir,
                        Some(&downloaded.tarball),
                        downloaded.tag.as_deref(),
                        None,
                    )
                }
                None => init_workspace(start_dir, None),
            }
        }
        SourceChoice::Local(path) => init_workspace(start_dir, Some(&path)),
        SourceChoice::Url(url) => {
            eprintln!("downloading {url}");
            let downloaded = fetch_url(&url)?;
            init_workspace(start_dir, Some(&downloaded.tarball))
        }
        SourceChoice::Release(version) => {
            let which = version.as_deref().unwrap_or("latest release");
            eprintln!("no local release given; downloading {which}");
            let downloaded = fetch_release(endpoint, version.as_deref())?;
            eprintln!("downloaded and verified {}", downloaded.origin);
            init_workspace_tagged(
                start_dir,
                Some(&downloaded.tarball),
                downloaded.tag.as_deref(),
                None,
            )
        }
    }
}

/// Executes `fgctl init [--from <source>]` for the current or specified workspace.
pub fn init_workspace(start_dir: &Path, from_source: Option<&Path>) -> Result<(), InitError> {
    init_workspace_tagged(start_dir, from_source, None, None)
}

/// [`init_workspace`] plus the release tag the source was downloaded as. A new
/// pin records that tag (`projectRuntime.releaseVersion`) so a teammate with an
/// empty machine store can download the same release.
fn init_workspace_tagged(
    start_dir: &Path,
    from_source: Option<&Path>,
    release_tag: Option<&str>,
    pin_override_reason: Option<&str>,
) -> Result<(), InitError> {
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
    let tracked_pin = read_tracked_pin(&distribution_path).require_readable()?;

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
        // `--override-pin`: no staging and no idempotent shortcut here; the
        // verification and the under-lock re-run check below apply as usual.
        (pin, from) if pin_override_reason.is_some() => {
            let from_src = from.ok_or_else(|| {
                InitError::Custom(
                    "pin-override-needs-from: --override-pin needs --from <path>".to_string(),
                )
            })?;
            let from_digest = resolve_source_manifest_digest(from_src)?;
            let dir = staged_pin_override_candidate(&store_root, pin.as_ref(), &from_digest)?;
            (from_digest, dir)
        }
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
            // A quarantined activation must never idempotent-skip: the release
            // directory it points at has already been moved away by `fgctl
            // verify`, so the ready-looking digest match is the exact "every
            // reader must treat quarantined as missing" case section 11
            // requires -- fall through and let this --from door genuinely
            // re-stage/re-verify/re-publish the digest instead.
            if let Some(ref current) = current_activation {
                if &current.artifact_digest == pin_digest
                    && current.status != "quarantined"
                    && is_release_staged(&store_root, &current.artifact_digest)
                {
                    check_main_checkout_lock(&workspace_root)?;
                    let _activation_lock = ActivationLockGuard::acquire(&workspace_root)?;
                    let active_manifest = read_manifest_from_dir(&release_dir_path(
                        &store_root,
                        &current.artifact_digest,
                    ))
                    .map_err(|e| InitError::Custom(e.to_string()))?;
                    crate::git_gate::admit(
                        &workspace_root,
                        &store_root,
                        &active_manifest,
                        &_activation_lock,
                    )?;
                    cleanup_stale_activation_tmp_files(&installation_dir);

                    let shim_fgos = installation_dir.join("bin").join("fgos");
                    run_tail(
                        &workspace_root,
                        &shim_fgos,
                        &store_root,
                        &current.activation_id,
                        TailOutcome::AlreadyCurrent,
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

            let dir = release_dir_path(&store_root, &staged_digest);
            (staged_digest, dir)
        }
        (Some(pin), None) => {
            let pin_digest = &pin.project_runtime.artifact_digest;

            // R9: Idempotent re-run check (Reviewer M2). See the quarantine
            // note on the pin+--from arm above -- same exclusion applies.
            if let Some(ref current) = current_activation {
                if &current.artifact_digest == pin_digest
                    && current.status != "quarantined"
                    && is_release_staged(&store_root, &current.artifact_digest)
                {
                    check_main_checkout_lock(&workspace_root)?;
                    let _activation_lock = ActivationLockGuard::acquire(&workspace_root)?;
                    let active_manifest = read_manifest_from_dir(&release_dir_path(
                        &store_root,
                        &current.artifact_digest,
                    ))
                    .map_err(|e| InitError::Custom(e.to_string()))?;
                    crate::git_gate::admit(
                        &workspace_root,
                        &store_root,
                        &active_manifest,
                        &_activation_lock,
                    )?;
                    cleanup_stale_activation_tmp_files(&installation_dir);

                    let shim_fgos = installation_dir.join("bin").join("fgos");
                    run_tail(
                        &workspace_root,
                        &shim_fgos,
                        &store_root,
                        &current.activation_id,
                        TailOutcome::AlreadyCurrent,
                    )?;
                    return Ok(());
                }
            }

            let dir = release_dir_path(&store_root, pin_digest);
            if !dir.exists() {
                let quarantine_note = current_activation
                    .as_ref()
                    .filter(|c| c.status == "quarantined" && &c.artifact_digest == pin_digest)
                    .map(|_| " (this workspace's active release was quarantined by `fgctl verify`; provide --from to reacquire it)")
                    .unwrap_or("");
                return Err(InitError::Custom(format!(
                    "pinned release {} is not staged in release store and no --from source was provided{}\n\
                     A digest names no download, so choose the release yourself:\n\
                     \x20\x20fgctl init --from <release>   (a release directory or tarball with the pinned digest)\n\
                     \x20\x20FGCTL_VERSION=<tag> fgctl init   (the tag whose digest is the pinned one)\n\
                     \x20\x20fgctl init --override-pin <reason> --from <staged release>   (run a release already staged here instead of the pin)",
                    pin_digest, quarantine_note
                )));
            }

            (pin_digest.clone(), dir)
        }
        (None, Some(from_src)) => {
            // Check if from_src matches current activation for idempotent re-run
            // (quarantined excluded -- see the pin+--from arm's own note above):
            let from_digest = resolve_source_manifest_digest(from_src)?;
            if let Some(ref current) = current_activation {
                if current.artifact_digest == from_digest
                    && current.status != "quarantined"
                    && is_release_staged(&store_root, &current.artifact_digest)
                {
                    check_main_checkout_lock(&workspace_root)?;
                    let _activation_lock = ActivationLockGuard::acquire(&workspace_root)?;
                    let active_manifest = read_manifest_from_dir(&release_dir_path(
                        &store_root,
                        &current.artifact_digest,
                    ))
                    .map_err(|e| InitError::Custom(e.to_string()))?;
                    crate::git_gate::admit(
                        &workspace_root,
                        &store_root,
                        &active_manifest,
                        &_activation_lock,
                    )?;
                    cleanup_stale_activation_tmp_files(&installation_dir);

                    let shim_fgos = installation_dir.join("bin").join("fgos");
                    run_tail(
                        &workspace_root,
                        &shim_fgos,
                        &store_root,
                        &current.activation_id,
                        TailOutcome::AlreadyCurrent,
                    )?;
                    return Ok(());
                }
            }

            let stage_outcome = stage_release(&store_root, from_src)?;
            let staged_digest = match stage_outcome {
                StageOutcome::Staged { artifact_digest } => artifact_digest,
                StageOutcome::NoOp { artifact_digest } => artifact_digest,
            };
            let dir = release_dir_path(&store_root, &staged_digest);
            (staged_digest, dir)
        }
        (None, None) => {
            return Err(InitError::Custom(
                "a release source is required when .fgos/distribution.json is absent (--from, FGCTL_FROM or FGCTL_VERSION)".to_string(),
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

    if let (Some(reason), Some(pin)) = (pin_override_reason, tracked_pin.as_ref()) {
        eprintln!(
            "pin overridden: .fgos/distribution.json pins {}; activating staged release {} (reason: {reason}); the pin file is not changed",
            pin.project_runtime.artifact_digest, target_digest
        );
    }

    // Acquire workspace activation lock before ANY workspace-visible write (Item 1)
    let _activation_lock = ActivationLockGuard::acquire(&workspace_root)?;

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
        if current.artifact_digest == target_digest
            && current.status != "quarantined"
            && is_release_staged(&store_root, &current.artifact_digest)
        {
            crate::git_gate::admit(&workspace_root, &store_root, &manifest, &_activation_lock)?;
            let shim_fgos = installation_dir.join("bin").join("fgos");
            run_tail(
                &workspace_root,
                &shim_fgos,
                &store_root,
                &current.activation_id,
                TailOutcome::AlreadyCurrent,
            )?;
            return Ok(());
        }
    }

    // Previous activation digest if present. Mirrors upgrade_workspace's own
    // rule (Reviewer M2): a quarantined current activation's own digest
    // names a release directory `fgctl verify` has already moved away, so
    // recording it as previousArtifactDigest would give a later `fgctl
    // repair` a rollback target that no longer exists. Chain past it to
    // whatever it itself pointed at instead.
    let previous_artifact_digest: Option<String> = match current_activation_under_lock {
        Some(ref current) if current.status == "quarantined" => {
            current.previous_artifact_digest.clone()
        }
        Some(current) => Some(current.artifact_digest),
        None => None,
    };

    publish_and_tail(PublishArgs {
        workspace_root: &workspace_root,
        store_root: &store_root,
        candidate_dir: &candidate_dir,
        manifest: &manifest,
        previous_artifact_digest,
        tracked_pin: tracked_pin.as_ref(),
        update_pin: false,
        release_tag,
        pin_override_reason,
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
    /// Release tag the candidate was downloaded as; recorded in a newly written
    /// pin in preference to the manifest's own version.
    pub release_tag: Option<&'a str>,
    /// Recorded in the activation when `fgctl init --override-pin` chose a
    /// release other than the tracked pin's.
    pub pin_override_reason: Option<&'a str>,
    pub _lock: &'a ActivationLockGuard,
}

/// What the holder-lock gate found when it let an activation through.
#[derive(Debug, Clone, PartialEq)]
pub enum HolderLockGate {
    /// Guarantee, two-process probe and borrow vectors all green.
    Passed { elapsed_ms: f64 },
}

/// The holder-lock gate every activation passes right before it publishes:
/// the driver's guarantee plus a two-process probe for `<workspace>/.fgos/locks`
/// and `lock_root`, then the borrow vectors with `git`. All of it runs in this
/// process through the crate fgctl links; nothing under the candidate release
/// runs. A red result refuses the activation; there is no switch to skip it.
pub fn holder_lock_gate(
    workspace_root: &Path,
    lock_root: &Path,
    git: &Path,
    helper: &fgos_holder_lock::HelperExe,
) -> Result<HolderLockGate, InitError> {
    use fgos_holder_lock::borrow_vectors::{self, RunError};
    let started = std::time::Instant::now();
    if !fgos_holder_lock::driver::current().supported() {
        return Err(InitError::LockKernelSemanticsFailed(format!(
            "no holder-lock driver on {}",
            std::env::consts::OS
        )));
    }
    let workspace_locks = workspace_root.join(".fgos").join("locks");
    for dir in [workspace_locks.as_path(), lock_root] {
        let guarantee = fgos_holder_lock::guarantee(dir);
        if !guarantee.usable() {
            return Err(InitError::LockKernelSemanticsFailed(format!(
                "{}: driver {} gives exclusion {} ({})",
                dir.display(),
                guarantee.driver,
                guarantee.exclusion.as_str(),
                guarantee.notes.join("; ")
            )));
        }
        fgos_holder_lock::semantics::two_process_probe(dir, helper).map_err(|detail| {
            InitError::LockKernelSemanticsFailed(format!("{}: {detail}", dir.display()))
        })?;
    }
    let report = borrow_vectors::run(git, helper, &[], false).map_err(|err| {
        InitError::LockBorrowVectorsFailed(match err {
            RunError::Unavailable(detail) | RunError::Usage(detail) => detail,
        })
    })?;
    if !report.pass() {
        let mut red: Vec<String> = report
            .vectors
            .iter()
            .filter(|v| !v.pass)
            .map(|v| format!("{}: {}", v.name, v.detail))
            .collect();
        if !report.sibling.0 {
            red.push(format!("sibling: {}", report.sibling.1));
        }
        return Err(InitError::LockBorrowVectorsFailed(format!(
            "{} ({})",
            red.join("; "),
            report.git_version
        )));
    }
    Ok(HolderLockGate::Passed {
        elapsed_ms: started.elapsed().as_secs_f64() * 1000.0,
    })
}

/// Holder-lock gate, preflight, capsule creation, atomic activation publishing, and post-activation tail.
pub fn publish_and_tail(args: PublishArgs<'_>) -> Result<(), InitError> {
    // Before the capsule is written, so a refusal leaves no capsule behind
    // (only the two lock directories the gate probed).
    let helper = fgos_holder_lock::HelperExe::current().map_err(|err| {
        InitError::LockKernelSemanticsFailed(format!("the running executable is unknown: {err}"))
    })?;
    holder_lock_gate(
        args.workspace_root,
        &args.store_root.join("locks"),
        Path::new("git"),
        &helper,
    )?;

    crate::git_gate::admit(
        args.workspace_root,
        args.store_root,
        args.manifest,
        args._lock,
    )?;

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

    // The sh pair (Linux, macOS, Git Bash) and the .cmd pair (PowerShell, cmd.exe).
    let shim_fgos = bin_dir.join("fgos");
    write_workspace_shims(&bin_dir)?;

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
        let snap_version = args
            .release_tag
            .map(str::to_string)
            .or_else(|| args.manifest.release_version.clone());
        serde_json::json!({
            "schemaVersion": 1,
            "projectRuntime": {
                "policy": "exact-digest",
                "artifactDigest": args.manifest.artifact_digest,
                "releaseVersion": snap_version,
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
        pin_override_reason: args.pin_override_reason.map(str::to_string),
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
                // Only a downloaded release has a tag that can be fetched again;
                // a local build's own manifest version is not a download name.
                release_version: args.release_tag.map(str::to_string),
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
        TailOutcome::Activated,
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

/// Executes `fgctl upgrade`, choosing the release candidate by precedence
/// (`--from` flag > `FGCTL_FROM` > `FGCTL_VERSION` > the latest GitHub release)
/// and downloading it first when it is a URL or a release asset. The download is
/// checksum-verified before it reaches [`upgrade_workspace`], and its scratch
/// copy is removed when upgrade returns.
pub fn upgrade_workspace_resolving(
    start_dir: &Path,
    inputs: &crate::fetch::SourceInputs,
    endpoint: &crate::fetch::DownloadEndpoint,
) -> Result<(), InitError> {
    use crate::fetch::{choose_source, fetch_release, fetch_url, SourceChoice};

    // Refuse outside a repository checkout or when no runtime is active before
    // any network traffic.
    let workspace_root = resolve_workspace_root(start_dir)?;
    let activation_path = workspace_root
        .join(".fgos")
        .join("installation")
        .join("activation.json");
    if !activation_path.exists() {
        return Err(InitError::Custom(
            "no active runtime found in workspace -- run 'fgctl init' first".to_string(),
        ));
    }

    // Upgrade moves the workspace to a new candidate rather than re-satisfying
    // the current pin, so `has_pin` is false: no explicit source means the
    // latest GitHub release.
    match choose_source(inputs, false) {
        SourceChoice::Local(path) => upgrade_workspace(start_dir, &path),
        SourceChoice::Url(url) => {
            eprintln!("downloading {url}");
            let downloaded = fetch_url(&url)?;
            upgrade_workspace(start_dir, &downloaded.tarball)
        }
        SourceChoice::Release(version) => {
            let which = version.as_deref().unwrap_or("latest release");
            eprintln!("no local release given; downloading {which}");
            let downloaded = fetch_release(endpoint, version.as_deref())?;
            eprintln!("downloaded and verified {}", downloaded.origin);
            upgrade_workspace_tagged(start_dir, &downloaded.tarball, downloaded.tag.as_deref())
        }
        SourceChoice::Pinned => unreachable!("choose_source(_, false) never returns Pinned"),
    }
}

/// Upgrades workspace to a new release candidate (--from <source>).
pub fn upgrade_workspace(start_dir: &Path, from_source: &Path) -> Result<(), InitError> {
    upgrade_workspace_tagged(start_dir, from_source, None)
}

/// [`upgrade_workspace`] plus the release tag the candidate was downloaded as.
/// The updated `.fgos/distribution.json` pin records that tag
/// (`projectRuntime.releaseVersion`) so a teammate with an empty machine store
/// can download the upgraded release via plain `fgctl init`.
fn upgrade_workspace_tagged(
    start_dir: &Path,
    from_source: &Path,
    release_tag: Option<&str>,
) -> Result<(), InitError> {
    let workspace_root = resolve_workspace_root(start_dir)?;
    let workspace_id = compute_workspace_id(&workspace_root);
    let work_state_id = compute_work_state_id(&workspace_id);

    let store_root = resolve_machine_release_store_root();
    let installation_dir = workspace_root.join(".fgos").join("installation");
    let activation_path = installation_dir.join("activation.json");
    let distribution_path = workspace_root.join(".fgos").join("distribution.json");

    if !activation_path.exists() {
        return Err(InitError::Custom(
            "no active runtime found in workspace -- run 'fgctl init' first".to_string(),
        ));
    }

    let current_activation: WorkspaceActivationBinding = {
        let content = std::fs::read_to_string(&activation_path)?;
        serde_json::from_str(&content)?
    };

    // Idempotent re-run (mirrors Phase 12's init_workspace): an upgrade to the
    // digest that's already active is a no-op, not a fresh activationId with
    // a self-referential previousArtifactDigest -- excluded when quarantined
    // for the same reason init_workspace excludes it (the release directory
    // has already been moved away, so the "already active" read is stale).
    let from_digest_peek = resolve_source_manifest_digest(from_source)?;
    if from_digest_peek == current_activation.artifact_digest
        && current_activation.status != "quarantined"
        && is_release_staged(&store_root, &current_activation.artifact_digest)
    {
        check_main_checkout_lock(&workspace_root)?;
        let _activation_lock = ActivationLockGuard::acquire(&workspace_root)?;
        let active_manifest = read_manifest_from_dir(&release_dir_path(
            &store_root,
            &current_activation.artifact_digest,
        ))
        .map_err(|e| InitError::Custom(e.to_string()))?;
        crate::git_gate::admit(
            &workspace_root,
            &store_root,
            &active_manifest,
            &_activation_lock,
        )?;
        cleanup_stale_activation_tmp_files(&installation_dir);
        if let Some(tag) = release_tag {
            let pin = TrackedDistributionPin {
                schema_version: 1,
                project_runtime: ProjectRuntimePin {
                    policy: "exact-digest".to_string(),
                    artifact_digest: current_activation.artifact_digest.clone(),
                    release_version: Some(tag.to_string()),
                    channel: None,
                    allow_prerelease: false,
                },
            };
            let pin_bytes = serde_json::to_vec_pretty(&pin)?;
            std::fs::create_dir_all(workspace_root.join(".fgos"))?;
            std::fs::write(&distribution_path, pin_bytes)?;
        }
        let shim_fgos = installation_dir.join("bin").join("fgos");
        run_tail(
            &workspace_root,
            &shim_fgos,
            &store_root,
            &current_activation.activation_id,
            TailOutcome::AlreadyCurrent,
        )?;
        return Ok(());
    }

    // Stage candidate release from --from source
    let stage_outcome = stage_release(&store_root, from_source)?;
    let staged_digest = match stage_outcome {
        StageOutcome::Staged { artifact_digest } => artifact_digest,
        StageOutcome::NoOp { artifact_digest } => artifact_digest,
    };

    let candidate_dir = release_dir_path(&store_root, &staged_digest);
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
    let lock = ActivationLockGuard::acquire(&workspace_root)?;
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

    // Reviewer L1: the pre-lock idempotent fast-path above is only a best-
    // effort optimization; re-check authoritatively once the lock is held
    // (mirrors init_workspace's own two-phase pattern) so two concurrent
    // same-digest upgrades can't both mint a fresh activationId.
    if let Some(ref current) = current_activation_under_lock {
        if current.artifact_digest == staged_digest
            && current.status != "quarantined"
            && is_release_staged(&store_root, &current.artifact_digest)
        {
            if let Some(tag) = release_tag {
                let pin = TrackedDistributionPin {
                    schema_version: 1,
                    project_runtime: ProjectRuntimePin {
                        policy: "exact-digest".to_string(),
                        artifact_digest: current.artifact_digest.clone(),
                        release_version: Some(tag.to_string()),
                        channel: None,
                        allow_prerelease: false,
                    },
                };
                let pin_bytes = serde_json::to_vec_pretty(&pin)?;
                std::fs::create_dir_all(workspace_root.join(".fgos"))?;
                std::fs::write(&distribution_path, pin_bytes)?;
            }
            crate::git_gate::admit(&workspace_root, &store_root, &manifest, &lock)?;
            let shim_fgos = installation_dir.join("bin").join("fgos");
            run_tail(
                &workspace_root,
                &shim_fgos,
                &store_root,
                &current.activation_id,
                TailOutcome::AlreadyCurrent,
            )?;
            return Ok(());
        }
    }

    // Reviewer M2: if the activation being upgraded away from is itself
    // quarantined, its own artifactDigest names a release directory that
    // `fgctl verify` has already moved to quarantine/ -- recording it as the
    // new previousArtifactDigest would make a later `fgctl repair` rollback
    // target a release that no longer exists under releases/. Chain past it
    // to whatever it itself pointed at (or null) instead.
    let effective_current = current_activation_under_lock.unwrap_or(current_activation);
    let previous_artifact_digest = if effective_current.status == "quarantined" {
        effective_current.previous_artifact_digest
    } else {
        Some(effective_current.artifact_digest)
    };

    publish_and_tail(PublishArgs {
        workspace_root: &workspace_root,
        store_root: &store_root,
        candidate_dir: &candidate_dir,
        manifest: &manifest,
        previous_artifact_digest,
        tracked_pin: None,
        update_pin: true,
        release_tag,
        pin_override_reason: None,
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

    let is_self_verify = current_activation.previous_artifact_digest.is_none();
    let (target_digest, candidate_dir) =
        if let Some(ref prev_digest) = current_activation.previous_artifact_digest {
            let dir = release_dir_path(&store_root, prev_digest);
            if !dir.exists() {
                return Err(InitError::Custom(format!(
                    "cannot repair: previous release {} not found in release store",
                    prev_digest
                )));
            }
            (prev_digest.clone(), dir)
        } else {
            let active_digest = &current_activation.artifact_digest;
            let dir = release_dir_path(&store_root, active_digest);
            if !dir.exists() {
                return Err(InitError::Custom(format!(
                    "cannot repair: active release {} not found in release store",
                    active_digest
                )));
            }
            (active_digest.clone(), dir)
        };

    // Re-verifying the currently active release (no previousArtifactDigest to
    // roll back to) is the same drift check `fgctl verify` performs -- a
    // failure here means the active payload is corrupted/tampered, and per
    // the drift-quarantine rule that must quarantine it too, not just refuse
    // and leave a known-bad release sitting under releases/<digest>/.
    let verify_result: Result<ReleaseManifest, String> = (|| {
        recompute_artifact_digest(&candidate_dir.join("manifest.json"))
            .map_err(|e| format!("artifact digest verification failed: {}", e))?;
        let manifest = read_manifest_from_dir(&candidate_dir).map_err(|e| {
            format!(
                "failed to read manifest from {}: {}",
                candidate_dir.display(),
                e
            )
        })?;
        canonicalize_manifest_files(&manifest)
            .map_err(|e| format!("canonicalize manifest failed: {}", e))?;
        let files = verify_release_files(&candidate_dir, &manifest)
            .map_err(|e| format!("verify release files failed: {}", e))?;
        verify_legacy_node(&candidate_dir, &manifest, files)
            .map_err(|e| format!("verify candidate legacy node failed: {}", e))?;
        if manifest.artifact_digest != target_digest {
            return Err(format!(
                "staged release manifest digest mismatch: {} declares {}, expected {}",
                candidate_dir.display(),
                manifest.artifact_digest,
                target_digest
            ));
        }
        Ok(manifest)
    })();

    let manifest = match verify_result {
        Ok(m) => m,
        Err(err_msg) if is_self_verify => {
            let timestamp = now_millis();
            let quarantine_dir = quarantine_dir_path(&store_root, &target_digest, timestamp);
            std::fs::create_dir_all(store_root.join("quarantine"))?;
            if candidate_dir.exists() {
                let _ = std::fs::rename(&candidate_dir, &quarantine_dir);
            }
            // Mirror verify_workspace's own fix for the identical race: the
            // `current_activation` snapshot above was read before this
            // release was moved and before the lock was held, so a
            // concurrent `fgctl upgrade` may have already published a
            // DIFFERENT activation by now. Re-read fresh under the lock and
            // only publish the quarantine status if it still names the
            // digest being quarantined -- otherwise a newer, unrelated
            // activation would be silently overwritten.
            let _lock = ActivationLockGuard::acquire(&workspace_root)?;
            cleanup_stale_activation_tmp_files(&installation_dir);
            let activation_under_lock: Option<WorkspaceActivationBinding> =
                std::fs::read_to_string(&activation_path)
                    .ok()
                    .and_then(|s| serde_json::from_str::<WorkspaceActivationBinding>(&s).ok());
            match activation_under_lock {
                Some(mut fresh) if fresh.artifact_digest == target_digest => {
                    fresh.status = "quarantined".to_string();
                    publish_activation_file(&activation_path, &fresh)?;
                }
                _ => {
                    // The active binding moved on before this quarantine
                    // could publish -- the offending release is still
                    // safely quarantined above, but the now-current
                    // activation must not be touched.
                }
            }
            return Err(InitError::Custom(format!(
                "active release {} failed repair verification and was quarantined at {}: {}",
                target_digest,
                quarantine_dir.display(),
                err_msg
            )));
        }
        Err(err_msg) => return Err(InitError::Custom(err_msg)),
    };

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
    let lock = ActivationLockGuard::acquire(&workspace_root)?;
    cleanup_stale_activation_tmp_files(&installation_dir);

    let release_tag = recorded_release_tag(
        read_tracked_pin(&workspace_root.join(PIN_FILE_RELATIVE)),
        &current_activation,
        &target_digest,
    );

    publish_and_tail(PublishArgs {
        workspace_root: &workspace_root,
        store_root: &store_root,
        candidate_dir: &candidate_dir,
        manifest: &manifest,
        previous_artifact_digest: None,
        tracked_pin: None,
        update_pin: true,
        release_tag: release_tag.as_deref(),
        pin_override_reason: None,
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

    let current_activation: WorkspaceActivationBinding = {
        let content = std::fs::read_to_string(&activation_path)?;
        serde_json::from_str(&content)?
    };

    let active_digest = current_activation.artifact_digest.clone();
    let release_dir = release_dir_path(&store_root, &active_digest);

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
        let files = verify_release_files(&release_dir, &manifest)
            .map_err(|e| format!("file digest mismatch: {}", e))?;
        verify_legacy_node(&release_dir, &manifest, files)
            .map_err(|e| format!("legacy node verification failed: {}", e))?;
        Ok(())
    })();

    match verify_result {
        Ok(()) => {
            // The release is intact; the launchers beside activation.json are
            // not part of it, so a missing or edited one is reported (fix:
            // `fgctl repair`) without quarantining a good release.
            check_workspace_shims(&installation_dir.join("bin"), cfg!(windows))
                .map_err(InitError::Custom)?;
            println!("verified {}", short_digest(&active_digest));
            if let Some(note) = workspace_pin_note(&workspace_root, &current_activation) {
                println!("{note}");
            }
            Ok(())
        }
        Err(err_msg) => {
            // Mismatch: move release directory to quarantine/<digest>-<timestamp>/
            let timestamp = now_millis();
            let quarantine_dir = quarantine_dir_path(&store_root, &active_digest, timestamp);
            std::fs::create_dir_all(store_root.join("quarantine"))?;
            if release_dir.exists() {
                let _ = std::fs::rename(&release_dir, &quarantine_dir);
            }

            // Acquire the activation lock before touching activation.json, then
            // re-read it fresh: the `current_activation` snapshot above was
            // taken before this release was moved and before the lock was
            // held, so a concurrent `fgctl upgrade` may have already
            // published a DIFFERENT activation in the meantime. Publishing
            // the stale in-memory record here would silently overwrite that
            // newer, unrelated activation with a quarantine record for a
            // digest it no longer even points at.
            let _lock = ActivationLockGuard::acquire(&workspace_root)?;
            cleanup_stale_activation_tmp_files(&installation_dir);
            let activation_under_lock: Option<WorkspaceActivationBinding> =
                std::fs::read_to_string(&activation_path)
                    .ok()
                    .and_then(|s| serde_json::from_str::<WorkspaceActivationBinding>(&s).ok());

            match activation_under_lock {
                Some(mut fresh) if fresh.artifact_digest == active_digest => {
                    fresh.status = "quarantined".to_string();
                    publish_activation_file(&activation_path, &fresh)?;
                }
                _ => {
                    // The active binding moved on before this quarantine could
                    // publish -- the offending release is still safely
                    // quarantined above, but the now-current activation
                    // (pointing at a different, presumably good, release)
                    // must not be touched.
                }
            }

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
    /// The one line about the committed pin, set only when it is unreadable or
    /// names a different release than the active one.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pin_note: Option<String>,
    pub releases: Vec<ReleaseStatusEntry>,
}

/// The active release differs from the one the committed pin names.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PinDrift {
    pub active_digest: String,
    pub pin_digest: String,
    /// Why `fgctl init --override-pin` chose the active release; none when nobody said.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub override_reason: Option<String>,
}

impl std::fmt::Display for PinDrift {
    /// The one line `fgctl status`, `fgctl verify` and `fgos doctor` all print.
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "active {} != pin {} (override: {})",
            short_digest(&self.active_digest),
            short_digest(&self.pin_digest),
            self.override_reason.as_deref().unwrap_or("none")
        )
    }
}

/// Compares the activation with the committed pin. `None` when there is no
/// pin or both name the same release.
pub fn pin_drift(
    activation: &WorkspaceActivationBinding,
    pin: Option<&TrackedDistributionPin>,
) -> Option<PinDrift> {
    let pin_digest = &pin?.project_runtime.artifact_digest;
    if *pin_digest == activation.artifact_digest {
        return None;
    }
    Some(PinDrift {
        active_digest: activation.artifact_digest.clone(),
        pin_digest: pin_digest.clone(),
        override_reason: activation.pin_override_reason.clone(),
    })
}

/// The line `fgctl status`, `fgctl verify` and `fgos doctor` print about the
/// pin: the drift, or that the pin file cannot be read. `None` when there is
/// nothing to say.
pub fn pin_note(activation: &WorkspaceActivationBinding, pin: &PinFile) -> Option<String> {
    match pin {
        PinFile::Absent => None,
        PinFile::Unreadable => Some(format!(
            "the committed pin is unreadable: {PIN_FILE_RELATIVE}"
        )),
        PinFile::Present(pin) => pin_drift(activation, Some(pin)).map(|d| d.to_string()),
    }
}

fn workspace_pin_note(
    workspace_root: &Path,
    activation: &WorkspaceActivationBinding,
) -> Option<String> {
    pin_note(
        activation,
        &read_tracked_pin(&workspace_root.join(".fgos").join("distribution.json")),
    )
}

/// The one line `fgctl status` ends with: the active release, or what to run.
pub fn status_result_line(status: Option<&FgctlWorkspaceStatus>) -> String {
    match status {
        None => "no active release in this workspace; run fgctl init".to_string(),
        Some(ws) if ws.quarantined => format!(
            "active release {} is quarantined; run fgctl repair",
            short_digest(&ws.active_artifact_digest)
        ),
        Some(ws) => format!("active {}", short_digest(&ws.active_artifact_digest)),
    }
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

    let pin_note = workspace_pin_note(&workspace_root, &activation);

    Some(FgctlWorkspaceStatus {
        active_artifact_digest: activation.artifact_digest,
        previous_artifact_digest: activation.previous_artifact_digest,
        quarantined: activation.status == "quarantined",
        pin_note,
        releases,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::store::release_dir_name;
    use crate::verify::to_canonical_json;
    use sha2::{Digest, Sha256};
    use std::path::PathBuf;

    fn sha256_of(bytes: &[u8]) -> String {
        format!("sha256:{:x}", Sha256::digest(bytes))
    }

    fn fresh_temp_root(name: &str) -> PathBuf {
        let dir_name = format!("fgos_test_preflight_{}_{}", name, std::process::id());
        let root = std::env::temp_dir().join(dir_name);
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(&root).unwrap();
        root
    }

    /// Recursive, sorted listing of every path under `root` -- the "nothing
    /// was written anywhere" witness the hostile-candidate test compares
    /// before and after preflight.
    #[cfg(unix)]
    fn snapshot_tree(root: &Path) -> Vec<PathBuf> {
        let mut out = Vec::new();
        let mut stack = vec![root.to_path_buf()];
        while let Some(dir) = stack.pop() {
            for entry in std::fs::read_dir(&dir).unwrap() {
                let path = entry.unwrap().path();
                if path.is_dir() {
                    stack.push(path.clone());
                }
                out.push(path);
            }
        }
        out.sort();
        out
    }

    /// Writes a minimal, fully digest-consistent candidate release tree at
    /// `root` whose host entry `bin/fgos` is `host_entry_body`, lets `mutate`
    /// adjust the manifest before its `artifactDigest` is sealed, and returns
    /// the manifest as the crate's own trusted reader parses it.
    fn write_candidate(
        root: &Path,
        host_entry_body: &str,
        mutate: impl FnOnce(&mut serde_json::Value),
    ) -> ReleaseManifest {
        std::fs::create_dir_all(root.join("bin")).unwrap();
        std::fs::create_dir_all(root.join("libexec").join("legacy-node").join("bin")).unwrap();

        let fgos_bin = root.join("bin").join("fgos");
        std::fs::write(&fgos_bin, host_entry_body).unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&fgos_bin, std::fs::Permissions::from_mode(0o755)).unwrap();
        }

        let legacy_body: &[u8] = b"console.log('legacy');\n";
        let legacy_entry = root
            .join("libexec")
            .join("legacy-node")
            .join("bin")
            .join("fgos.mjs");
        std::fs::write(&legacy_entry, legacy_body).unwrap();

        let mut manifest = serde_json::json!({
            "schemaVersion": 1,
            "entries": { "fgos": "bin/fgos" },
            "components": {
                "legacyNode": {
                    "root": "libexec/legacy-node",
                    "entry": "bin/fgos.mjs",
                    "digest": sha256_of(legacy_body)
                }
            },
            "requires": {},
            "target": { "os": "linux", "arch": "x64" },
            "files": [
                {
                    "path": "bin/fgos",
                    "kind": "file",
                    "digest": sha256_of(host_entry_body.as_bytes()),
                    "mode": "755",
                    "class": "immutable-entry"
                },
                {
                    "path": "libexec/legacy-node/bin/fgos.mjs",
                    "kind": "file",
                    "digest": sha256_of(legacy_body),
                    "mode": "644",
                    "class": "immutable-runtime"
                }
            ]
        });
        mutate(&mut manifest);

        let digest = sha256_of(to_canonical_json(&manifest).as_bytes());
        manifest["artifactDigest"] = serde_json::Value::String(digest);
        std::fs::write(
            root.join("manifest.json"),
            serde_json::to_vec_pretty(&manifest).unwrap(),
        )
        .unwrap();

        read_manifest_from_dir(root).unwrap()
    }

    /// A hostile candidate that is well-formed in every static respect and
    /// whose `bin/fgos` would happily "succeed" a runtime smoke -- it prints a
    /// plausible `version --runtime-json` envelope echoing whatever digest it
    /// is told -- while writing a host-visible file outside the release
    /// tree. Preflight must accept it (it IS a valid release tree) and must
    /// never run it: the only enforceable no-write boundary is not executing
    /// candidate code before publish.
    #[cfg(unix)]
    #[test]
    fn preflight_never_executes_a_hostile_but_well_formed_candidate() {
        let root = fresh_temp_root("hostile");
        let candidate = root.join("candidate");
        let host_visible = root.join("host-visible");
        let sentinel = host_visible.join("AGENTS.md");

        let script = format!(
            "#!/bin/sh\nmkdir -p {hv}\nprintf pwned > {sentinel}\n\
             printf '{{\"contract\":\"fgos.v1\",\"data\":{{\"host\":\"rust\",\"artifactDigest\":\"%s\"}}}}\\n' \
             \"${{FGOS_CANDIDATE_ARTIFACT_DIGEST:-none}}\"\nexit 0\n",
            hv = host_visible.display(),
            sentinel = sentinel.display(),
        );
        let manifest = write_candidate(&candidate, &script, |_| {});

        // Control: the script really does write the sentinel when run, so a
        // missing sentinel below proves preflight never ran it -- not that
        // the script is broken.
        let control = Command::new(candidate.join("bin").join("fgos"))
            .args(["version", "--runtime-json"])
            .output()
            .unwrap();
        assert!(control.status.success());
        assert_eq!(std::fs::read_to_string(&sentinel).unwrap(), "pwned");
        std::fs::remove_dir_all(&host_visible).unwrap();

        let before = snapshot_tree(&root);
        preflight_candidate(&candidate, &manifest).expect("well-formed candidate must pass");
        let after = snapshot_tree(&root);

        assert!(
            !sentinel.exists(),
            "preflight executed candidate bin/fgos: sentinel {} was written",
            sentinel.display()
        );
        assert_eq!(
            before,
            after,
            "preflight must not write anywhere under {}",
            root.display()
        );

        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn preflight_refuses_host_entry_not_covered_by_manifest_files() {
        let root = fresh_temp_root("uncovered");
        let candidate = root.join("candidate");
        let manifest = write_candidate(&candidate, "#!/bin/sh\nexit 0\n", |m| {
            let files = m["files"].as_array_mut().unwrap();
            files.retain(|f| f["path"] != "bin/fgos");
        });

        let err = preflight_candidate(&candidate, &manifest).unwrap_err();
        let msg = err.to_string();
        assert!(matches!(err, InitError::Preflight(_)), "{msg}");
        assert!(
            msg.contains("not covered by a digest-verified manifest files[] entry"),
            "{msg}"
        );

        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn preflight_refuses_entries_fgos_that_is_not_the_shim_exec_path() {
        let root = fresh_temp_root("entry_mismatch");
        let candidate = root.join("candidate");
        let manifest = write_candidate(&candidate, "#!/bin/sh\nexit 0\n", |m| {
            m["entries"]["fgos"] = serde_json::Value::String("target/release/fgos".to_string());
        });

        let err = preflight_candidate(&candidate, &manifest).unwrap_err();
        let msg = err.to_string();
        assert!(matches!(err, InitError::Preflight(_)), "{msg}");
        assert!(msg.contains("entries.fgos"), "{msg}");
        assert!(msg.contains("bin/fgos"), "{msg}");

        let _ = std::fs::remove_dir_all(&root);
    }

    #[cfg(unix)]
    #[test]
    fn preflight_refuses_non_executable_host_entry() {
        use std::os::unix::fs::PermissionsExt;
        let root = fresh_temp_root("noexec");
        let candidate = root.join("candidate");
        let manifest = write_candidate(&candidate, "#!/bin/sh\nexit 0\n", |_| {});
        std::fs::set_permissions(
            candidate.join("bin").join("fgos"),
            std::fs::Permissions::from_mode(0o644),
        )
        .unwrap();

        let err = preflight_candidate(&candidate, &manifest).unwrap_err();
        let msg = err.to_string();
        assert!(matches!(err, InitError::Preflight(_)), "{msg}");
        assert!(msg.contains("not executable"), "{msg}");

        let _ = std::fs::remove_dir_all(&root);
    }

    fn pin_for(digest: &str) -> TrackedDistributionPin {
        TrackedDistributionPin {
            schema_version: DISTRIBUTION_PIN_SCHEMA_VERSION_V1,
            project_runtime: ProjectRuntimePin {
                policy: "exact-digest".to_string(),
                artifact_digest: digest.to_string(),
                release_version: None,
                channel: None,
                allow_prerelease: false,
            },
        }
    }

    const PINNED: &str = "sha256:1111111111111111111111111111111111111111111111111111111111111111";
    const OTHER: &str = "sha256:2222222222222222222222222222222222222222222222222222222222222222";

    fn activation_snapshotting(digest: &str, tag: Option<&str>) -> WorkspaceActivationBinding {
        serde_json::from_value(serde_json::json!({
            "schemaVersion": 1,
            "repositoryId": "r",
            "workspaceId": "w",
            "workStateId": "s",
            "activationId": "a",
            "status": "ready",
            "artifactDigest": digest,
            "releasePath": "/store/release",
            "shimVersion": "1",
            "resolvedDependencies": {},
            "pinSnapshot": { "projectRuntime": { "artifactDigest": digest, "releaseVersion": tag } },
            "activatedAt": "2026-11-12T00:00:00Z",
            "activatedBy": { "tool": "fgctl", "version": "0" },
        }))
        .unwrap()
    }

    #[test]
    fn a_repaired_release_keeps_the_tag_the_pin_or_the_activation_already_names() {
        let tagged_pin = || {
            let mut pin = pin_for(PINNED);
            pin.project_runtime.release_version = Some("v1.2.0".to_string());
            PinFile::Present(pin)
        };
        let untagged = activation_snapshotting(PINNED, None);
        let tagged = activation_snapshotting(PINNED, Some("v1.1.0"));

        let tag = |pin, activation: &WorkspaceActivationBinding, digest| {
            recorded_release_tag(pin, activation, digest)
        };
        assert_eq!(
            tag(tagged_pin(), &untagged, PINNED).as_deref(),
            Some("v1.2.0")
        );
        assert_eq!(
            tag(PinFile::Absent, &tagged, PINNED).as_deref(),
            Some("v1.1.0")
        );
        assert_eq!(
            tag(PinFile::Unreadable, &tagged, PINNED).as_deref(),
            Some("v1.1.0")
        );
        assert_eq!(
            tag(tagged_pin(), &tagged, OTHER),
            None,
            "a release neither names has no tag"
        );
        assert_eq!(tag(PinFile::Absent, &untagged, PINNED), None);
    }

    #[test]
    fn pin_override_selects_a_staged_release_that_differs_from_the_pin() {
        let store = fresh_temp_root("pin_override_staged");
        let staged = store.join("releases").join(release_dir_name(OTHER));
        std::fs::create_dir_all(&staged).unwrap();

        let dir = staged_pin_override_candidate(&store, Some(&pin_for(PINNED)), OTHER).unwrap();
        assert_eq!(dir, release_dir_path(&store, OTHER));

        let _ = std::fs::remove_dir_all(&store);
    }

    #[test]
    fn pin_override_refuses_a_release_that_is_not_staged_on_this_machine() {
        // A quarantined release has been moved out of releases/, so it is
        // refused here the same way as one that was never staged.
        let store = fresh_temp_root("pin_override_unstaged");
        std::fs::create_dir_all(store.join("quarantine").join(release_dir_name(OTHER))).unwrap();

        let err = staged_pin_override_candidate(&store, Some(&pin_for(PINNED)), OTHER).unwrap_err();
        let msg = err.to_string();
        assert!(msg.starts_with("pin-override-unstaged:"), "{msg}");
        assert!(msg.contains(OTHER), "{msg}");
        assert!(msg.contains("fgctl stage --from"), "{msg}");
        assert!(
            !store.join("releases").exists(),
            "the override never stages a release"
        );

        let _ = std::fs::remove_dir_all(&store);
    }

    #[test]
    fn pin_override_refuses_when_there_is_no_pin_or_the_release_is_the_pinned_one() {
        let store = fresh_temp_root("pin_override_nothing_to_override");
        std::fs::create_dir_all(store.join("releases").join(release_dir_name(PINNED))).unwrap();

        let err = staged_pin_override_candidate(&store, None, PINNED).unwrap_err();
        assert!(
            err.to_string().starts_with("pin-override-without-pin:"),
            "{err}"
        );
        let err =
            staged_pin_override_candidate(&store, Some(&pin_for(PINNED)), PINNED).unwrap_err();
        assert!(
            err.to_string().starts_with("pin-override-unneeded:"),
            "{err}"
        );

        let _ = std::fs::remove_dir_all(&store);
    }

    #[test]
    fn pin_override_needs_a_reason_and_a_local_source_before_touching_anything() {
        // A start directory that does not exist: each refusal comes before the
        // workspace, the pin or the network is read.
        let nowhere = std::env::temp_dir().join(format!(
            "fgos_test_pin_override_nowhere_{}",
            std::process::id()
        ));
        let endpoint = crate::fetch::DownloadEndpoint::default();
        let local = crate::fetch::SourceInputs {
            from_flag: Some("/some/staged/release".to_string()),
            env_from: None,
            env_version: None,
        };

        let err = init_workspace_resolving(&nowhere, &local, &endpoint, Some("  ")).unwrap_err();
        assert!(
            err.to_string().starts_with("pin-override-reason-empty:"),
            "{err}"
        );

        for inputs in [
            crate::fetch::SourceInputs {
                from_flag: None,
                env_from: None,
                env_version: Some("v1.2.3".to_string()),
            },
            crate::fetch::SourceInputs {
                from_flag: Some("https://example.invalid/fgos.tar.gz".to_string()),
                env_from: None,
                env_version: None,
            },
            crate::fetch::SourceInputs {
                from_flag: None,
                env_from: None,
                env_version: None,
            },
        ] {
            let err = init_workspace_resolving(&nowhere, &inputs, &endpoint, Some("recovery"))
                .unwrap_err();
            assert!(
                err.to_string().starts_with("pin-override-needs-from:"),
                "{err}"
            );
        }
        assert!(!nowhere.exists());
    }

    #[test]
    fn pin_tags_without_a_leading_v_name_the_v_prefixed_release() {
        assert_eq!(normalize_pin_tag("0.2.0"), "v0.2.0");
        assert_eq!(normalize_pin_tag("v0.2.0-rc.1"), "v0.2.0-rc.1");
        assert_eq!(normalize_pin_tag("nightly"), "nightly");
    }

    /// A git that drops the `-c gc.auto=0` and `-c maintenance.auto=false`
    /// switches before it runs the real git, so a borrowed git can start a
    /// background gc. An environment fixture:
    /// the gate code is the same as in production.
    #[cfg(unix)]
    fn git_that_ignores_gc_switch(dir: &Path) -> PathBuf {
        use std::os::unix::fs::PermissionsExt;
        let real = Command::new("sh")
            .args(["-c", "command -v git"])
            .output()
            .unwrap();
        let real = String::from_utf8(real.stdout).unwrap().trim().to_string();
        assert!(!real.is_empty(), "git must be on PATH");
        let wrapper = dir.join("git");
        let script = format!(
            "#!/bin/sh\n\
             n=$#\n\
             while [ $n -gt 0 ]; do\n\
             a=$1; shift; n=$((n-1))\n\
             if [ \"$a\" = -c ] && {{ [ \"$1\" = gc.auto=0 ] || [ \"$1\" = maintenance.auto=false ]; }}; then shift; n=$((n-1)); continue; fi\n\
             set -- \"$@\" \"$a\"\n\
             done\n\
             exec '{real}' \"$@\"\n"
        );
        std::fs::write(&wrapper, script).unwrap();
        std::fs::set_permissions(&wrapper, std::fs::Permissions::from_mode(0o755)).unwrap();
        wrapper
    }

    /// The gate tests take locks and spawn processes: a fork on a parallel
    /// test thread copies every open description until its exec, so a probe
    /// right after a release could see a copy as a holder. One at a time.
    #[cfg(unix)]
    static GATE_TESTS: std::sync::Mutex<()> = std::sync::Mutex::new(());

    /// The gate's running time is part of activation, with a target under one
    /// second. Linux meets it. A shared macOS runner measured 1193 ms (CI run
    /// 39030755100), so macOS gets a bound with headroom over that measurement
    /// and the spec records a target per platform.
    #[cfg(target_os = "macos")]
    const GATE_BOUND_MS: f64 = 3000.0;
    #[cfg(all(unix, not(target_os = "macos")))]
    const GATE_BOUND_MS: f64 = 1000.0;

    #[cfg(unix)]
    #[test]
    fn holder_lock_gate_passes_on_a_local_mount_with_the_real_git() {
        let _serial = GATE_TESTS.lock().unwrap_or_else(|e| e.into_inner());
        let root = fresh_temp_root("holder_lock_gate_pass");
        let helper = fgos_holder_lock::HelperExe::current().unwrap();
        let HolderLockGate::Passed { elapsed_ms } = holder_lock_gate(
            &root.join("ws"),
            &root.join("state").join("locks"),
            Path::new("git"),
            &helper,
        )
        .unwrap();
        assert!(elapsed_ms < GATE_BOUND_MS, "gate took {elapsed_ms} ms");
        assert!(root.join("ws/.fgos/locks").is_dir());
        assert!(root.join("state/locks").is_dir());
        let _ = std::fs::remove_dir_all(&root);
    }

    #[cfg(unix)]
    #[test]
    fn holder_lock_gate_drains_a_borrowed_git_background_gc() {
        let _serial = GATE_TESTS.lock().unwrap_or_else(|e| e.into_inner());
        let root = fresh_temp_root("holder_lock_gate_gc_drained");
        let bin = root.join("bin");
        std::fs::create_dir_all(&bin).unwrap();
        let git = git_that_ignores_gc_switch(&bin);
        let helper = fgos_holder_lock::HelperExe::current().unwrap();
        let HolderLockGate::Passed { .. } = holder_lock_gate(
            &root.join("ws"),
            &root.join("state").join("locks"),
            &git,
            &helper,
        )
        .unwrap();
        // Keep a second real GC vector's lock inode for an independent holder
        // check after the borrowed command and holder have both drained.
        let report = fgos_holder_lock::borrow_vectors::run(
            &git,
            &helper,
            &["gc-auto-loose-objects".into()],
            true,
        )
        .unwrap();
        assert!(report.pass(), "{report:?}");
        let kept = report.kept.unwrap();
        let resource = fgos_holder_lock::Resource::new(
            "borrow-vectors",
            kept.join("gc-auto-loose-objects.lock"),
        );
        assert_eq!(
            fgos_holder_lock::probe(&resource).unwrap(),
            fgos_holder_lock::Probe::Free
        );
        if cfg!(target_os = "linux") {
            assert_eq!(
                fgos_holder_lock::holders(&resource).unwrap(),
                fgos_holder_lock::HoldersList::List(vec![])
            );
            // The auto-GC's cwd is the kept vector repository, including
            // after daemonisation. No live descendant may remain there.
            for entry in std::fs::read_dir("/proc").unwrap().flatten() {
                if let Ok(cwd) = std::fs::read_link(entry.path().join("cwd")) {
                    assert!(
                        !cwd.starts_with(&kept),
                        "GC/vector process remains: {}",
                        entry.path().display()
                    );
                }
            }
        }
        let _ = std::fs::remove_dir_all(kept);
        let _ = std::fs::remove_dir_all(&root);
    }

    fn facts(already_current: bool) -> ReadyFacts {
        ReadyFacts {
            tag: Some("v1.2.0".to_string()),
            digest12: "0123456789ab".to_string(),
            already_current,
            run_command: "fgos".to_string(),
            notes: Vec::new(),
        }
    }

    fn doctor_json(ok: bool, checks: &[(&str, &str, Option<&str>)]) -> String {
        let rows: Vec<serde_json::Value> = checks
            .iter()
            .map(|(id, status, fix)| {
                serde_json::json!({
                    "id": id,
                    "status": status,
                    "message": format!("{id} says no"),
                    "fix": fix,
                })
            })
            .collect();
        serde_json::json!({ "contract": "fgos.v1", "data": { "ok": ok, "next": [], "checks": rows } })
            .to_string()
    }

    #[test]
    fn closing_block_of_an_ok_doctor_says_ready_and_names_the_next_step() {
        let json = doctor_json(true, &[("a", "ok", None), ("b", "warn", None)]);
        let block = closing_block(&json, &facts(false)).unwrap();
        assert!(block.ready);
        assert_eq!(
            block.text,
            "Ready: fgOS v1.2.0 active (0123456789ab)\nNext: fgos run \"<prompt>\"\n"
        );
    }

    #[test]
    fn the_work_store_note_of_a_platform_without_an_event_store_reaches_every_closing_block() {
        let init = serde_json::json!({
            "data": { "workStore": "unsupported-platform", "workStoreNote": "Work is not available on this platform yet", "dir": "x" }
        })
        .to_string();
        let notes = init_notes(init.as_bytes());
        assert_eq!(
            notes,
            vec!["Work is not available on this platform yet".to_string()]
        );
        let mut f = facts(false);
        f.notes = notes;
        let ready = closing_block(&doctor_json(true, &[]), &f).unwrap();
        assert!(
            ready
                .text
                .contains("Note: Work is not available on this platform yet"),
            "{}",
            ready.text
        );
        let not_ready = closing_block(&doctor_json(false, &[("a", "fail", None)]), &f).unwrap();
        assert!(
            not_ready
                .text
                .contains("Note: Work is not available on this platform yet"),
            "{}",
            not_ready.text
        );
    }

    #[test]
    fn init_notes_come_from_the_init_result_and_the_closing_block_prints_them() {
        let init = serde_json::json!({
            "contract": "fgos.v1",
            "data": {
                "legacyConfigNote": "~/.fgos/config.json moved; projects on an older release refuse until `fgctl upgrade`",
                "legacyConfigWarning": "legacy config not moved: config-write-confined",
                "dir": "x"
            }
        })
        .to_string();
        let notes = init_notes(init.as_bytes());
        assert_eq!(notes.len(), 2);
        assert!(init_notes(b"not json").is_empty());
        assert!(init_notes(br#"{"data":{"dir":"x"}}"#).is_empty());

        let mut f = facts(false);
        f.notes = notes;
        let ready = closing_block(&doctor_json(true, &[]), &f).unwrap();
        assert_eq!(
            ready.text,
            "Ready: fgOS v1.2.0 active (0123456789ab)\nNote: ~/.fgos/config.json moved; projects on an older release refuse until `fgctl upgrade`\nNote: legacy config not moved: config-write-confined\nNext: fgos run \"<prompt>\"\n"
        );
        let failing =
            closing_block(&doctor_json(false, &[("a", "fail", Some("fgos x"))]), &f).unwrap();
        assert!(!failing.ready);
        assert!(failing
            .text
            .ends_with("Note: legacy config not moved: config-write-confined\n"));
    }

    #[test]
    fn closing_block_of_an_already_current_release_says_so() {
        let json = doctor_json(true, &[]);
        let block = closing_block(&json, &facts(true)).unwrap();
        assert!(block.ready);
        assert!(block
            .text
            .starts_with("Ready: already up to date at 0123456789ab (fgOS v1.2.0)\n"));
    }

    #[test]
    fn closing_block_without_a_tag_leaves_the_tag_out() {
        let mut f = facts(false);
        f.tag = None;
        let block = closing_block(&doctor_json(true, &[]), &f).unwrap();
        assert!(block
            .text
            .starts_with("Ready: fgOS active (0123456789ab)\n"));
    }

    #[test]
    fn closing_block_of_a_failing_doctor_numbers_each_failing_check_with_its_fix() {
        let json = doctor_json(
            false,
            &[
                ("fine", "ok", None),
                (
                    "agent-cli-missing",
                    "fail",
                    Some("install claude, codex or gemini"),
                ),
                ("trust-store-readable", "fail", None),
                ("slow", "warn", Some("ignored")),
            ],
        );
        let block = closing_block(&json, &facts(false)).unwrap();
        assert!(!block.ready);
        assert_eq!(
            block.text,
            "2 checks need you:\n  1. agent-cli-missing: install claude, codex or gemini\n  2. trust-store-readable: trust-store-readable says no\n"
        );
    }

    #[test]
    fn closing_block_of_one_failing_check_uses_the_singular() {
        let json = doctor_json(false, &[("x", "fail", Some("fgos doctor --fix"))]);
        let block = closing_block(&json, &facts(false)).unwrap();
        assert!(block.text.starts_with("1 check needs you:\n"));
    }

    #[test]
    fn closing_block_refuses_output_that_is_not_a_doctor_result() {
        for bad in [
            "",
            "not json",
            "{}",
            "{\"data\":{\"ok\":false,\"checks\":[]}}",
        ] {
            let err = closing_block(bad, &facts(false)).unwrap_err();
            assert!(err.contains("doctor"), "{bad:?} -> {err}");
        }
    }

    #[test]
    fn doctor_is_clean_only_when_ok_and_no_unpassed_row_names_a_fix() {
        let clean = doctor_json(
            true,
            &[
                ("a", "ok", None),
                ("b", "warn", None),
                ("c", "skip", Some("fgos doctor --fix")),
            ],
        );
        assert!(doctor_is_clean(&clean));
        let warn_with_fix = doctor_json(true, &[("a", "warn", Some("fgos doctor --fix"))]);
        assert!(!doctor_is_clean(&warn_with_fix));
        assert!(!doctor_is_clean(&doctor_json(
            false,
            &[("a", "fail", Some("x"))]
        )));
        assert!(!doctor_is_clean("not json"));
    }

    #[test]
    fn noop_block_says_nothing_to_do_and_names_the_next_step() {
        assert_eq!(
            noop_block(&facts(true)),
            "nothing to do: fgOS v1.2.0 already active, doctor ok\nNext: fgos run \"<prompt>\"\n"
        );
        let mut f = facts(true);
        f.tag = None;
        assert!(noop_block(&f).starts_with("nothing to do: fgOS already active"));
    }

    #[test]
    fn run_command_is_bare_when_the_launcher_dir_is_on_path_and_absolute_otherwise() {
        // The launcher file name is platform-specific (`fgos.cmd` on Windows), so the
        // expected absolute form is built with the same platform path join.
        let launcher = if cfg!(windows) { "fgos.cmd" } else { "fgos" };
        let absolute = |dir: &Path| dir.join(launcher).display().to_string();
        let dir = Path::new("/opt/fgos/bin");
        let on_path = std::env::join_paths(["/usr/bin", "/opt/fgos/bin"]).unwrap();
        let off_path = std::env::join_paths(["/usr/bin"]).unwrap();
        assert_eq!(run_command(Some(dir), Some(&on_path)), "fgos");
        assert_eq!(run_command(Some(dir), Some(&off_path)), absolute(dir));
        assert_eq!(run_command(Some(dir), None), absolute(dir));
        assert_eq!(run_command(None, Some(&off_path)), "fgos");
        let spaced = Path::new("/opt/my fgos/bin");
        assert_eq!(
            run_command(Some(spaced), None),
            format!("\"{}\"", absolute(spaced))
        );
    }

    #[test]
    fn short_digest_drops_the_algorithm_prefix_and_keeps_twelve_characters() {
        assert_eq!(short_digest("sha256:0123456789abcdef0123"), "0123456789ab");
        assert_eq!(short_digest("0123"), "0123");
    }

    #[test]
    fn status_result_line_names_the_active_release_or_the_next_command() {
        let ws = |quarantined| FgctlWorkspaceStatus {
            active_artifact_digest: "sha256:0123456789abcdef".to_string(),
            previous_artifact_digest: None,
            quarantined,
            pin_note: None,
            releases: vec![],
        };
        assert_eq!(status_result_line(Some(&ws(false))), "active 0123456789ab");
        assert!(status_result_line(Some(&ws(true))).contains("run fgctl repair"));
        assert!(status_result_line(None).contains("run fgctl init"));
    }

    #[test]
    fn not_ready_exits_with_the_tables_precondition_code_and_other_errors_with_one() {
        assert_eq!(InitError::NotReady.exit_status(), 2);
        assert_eq!(InitError::Custom("x".to_string()).exit_status(), 1);
    }
}
