//! Workspace initialization and runtime activation (`fgctl init`).
//!
//! Implements the acquire -> stage -> verify -> preflight -> publish -> tail pipeline
//! per `phase-12-fgctl-init-and-activation.md` and
//! `docs/architect/packaging-distribution/runtime-identity-and-activation.md` §3, §6, §14.

use crate::canonical::canonicalize_manifest_files;
use crate::lock::check_main_checkout_lock;
use crate::manifest::{read_manifest_from_dir, ReleaseManifest};
use crate::store::{now_millis, resolve_machine_release_store_root, stage_release, StageOutcome};
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
    let work_state_id = compute_work_state_id(&workspace_id);
    let repository_id = compute_repository_id(&workspace_id);

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

    // Determine target release digest and source
    let (target_digest, candidate_dir) = match (from_source, &tracked_pin) {
        (Some(src), _) => {
            // Stage from explicit source first (or no-op if already staged)
            let stage_outcome = stage_release(&store_root, src)?;
            let digest = match stage_outcome {
                StageOutcome::Staged { artifact_digest } => artifact_digest,
                StageOutcome::NoOp { artifact_digest } => artifact_digest,
            };
            let dir = store_root.join("releases").join(&digest);
            (digest, dir)
        }
        (None, Some(pin)) => {
            let digest = pin.project_runtime.artifact_digest.clone();
            let dir = store_root.join("releases").join(&digest);
            if !dir.exists() {
                return Err(InitError::Custom(format!(
                    "pinned release {} is not staged in release store and no --from source was provided",
                    digest
                )));
            }
            (digest, dir)
        }
        (None, None) => {
            return Err(InitError::Custom(
                "--from <source> is required when .fgos/distribution.json is absent".to_string(),
            ));
        }
    };

    // R9: Idempotent re-run check:
    // If activation.json exists and its artifactDigest == target_digest, skip re-staging/writing shims/activation.
    if activation_path.exists() {
        if let Ok(content) = std::fs::read_to_string(&activation_path) {
            if let Ok(current_activation) =
                serde_json::from_str::<WorkspaceActivationBinding>(&content)
            {
                if current_activation.artifact_digest == target_digest {
                    // Check lock even on idempotent re-run
                    check_main_checkout_lock(&workspace_root)?;

                    let shim_fgos = installation_dir.join("bin").join("fgos");
                    run_tail(
                        &workspace_root,
                        &shim_fgos,
                        &store_root,
                        &current_activation.activation_id,
                    )?;
                    return Ok(());
                }
            }
        }
    }

    // Read candidate manifest
    let manifest = read_manifest_from_dir(&candidate_dir).map_err(|e| {
        InitError::Custom(format!(
            "failed to read manifest from {}: {}",
            candidate_dir.display(),
            e
        ))
    })?;

    // R5: Read-only .fgos/main-checkout.lock check before publish
    check_main_checkout_lock(&workspace_root)?;

    // R6: Preflight before publish (no host-visible writes)
    preflight_candidate(&candidate_dir, &manifest)?;

    // Previous activation digest if present
    let previous_artifact_digest: Option<String> = if activation_path.exists() {
        std::fs::read_to_string(&activation_path)
            .ok()
            .and_then(|s| serde_json::from_str::<WorkspaceActivationBinding>(&s).ok())
            .map(|a| a.artifact_digest)
    } else {
        None
    };

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
        repository_root: workspace_root.to_string_lossy().to_string(),
        workspace_id: workspace_id.clone(),
        work_state_id: work_state_id.clone(),
        machine_release_store: store_root.to_string_lossy().to_string(),
    };
    let root_json_bytes = serde_json::to_vec_pretty(&root_binding)?;
    std::fs::write(installation_dir.join("root.json"), root_json_bytes)?;

    // Publish activation.json
    let node_path = resolve_node_path();
    let pin_snapshot = if let Some(ref pin) = tracked_pin {
        serde_json::to_value(pin).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({
            "schemaVersion": 1,
            "projectRuntime": {
                "policy": "exact-digest",
                "artifactDigest": target_digest,
                "releaseVersion": manifest.release_version,
                "channel": null,
                "allowPrerelease": false
            }
        })
    };

    let activation_binding = WorkspaceActivationBinding {
        schema_version: 1,
        repository_id,
        workspace_id,
        work_state_id,
        activation_id: activation_id.clone(),
        status: "ready".to_string(),
        artifact_digest: target_digest.clone(),
        release_path: candidate_dir.to_string_lossy().to_string(),
        previous_artifact_digest,
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

    // If tracked .fgos/distribution.json was absent, write it now (R3)
    if !distribution_path.exists() {
        let pin = TrackedDistributionPin {
            schema_version: 1,
            project_runtime: ProjectRuntimePin {
                policy: "exact-digest".to_string(),
                artifact_digest: target_digest.clone(),
                release_version: manifest.release_version.clone(),
                channel: None,
                allow_prerelease: false,
            },
        };
        let pin_bytes = serde_json::to_vec_pretty(&pin)?;
        std::fs::create_dir_all(workspace_root.join(".fgos"))?;
        std::fs::write(&distribution_path, pin_bytes)?;
    }

    // Write <store>/installs/<activationId>.json
    let installs_dir = store_root.join("installs");
    std::fs::create_dir_all(&installs_dir)?;
    let tx_record = InstallTransactionRecord {
        schema_version: 1,
        activation_id: activation_id.clone(),
        workspace_id: activation_binding.workspace_id.clone(),
        artifact_digest: target_digest,
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
    run_tail(&workspace_root, &shim_fgos, &store_root, &activation_id)?;

    Ok(())
}
