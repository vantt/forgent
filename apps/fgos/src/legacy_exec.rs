//! Legacy CLI adapter for `apps/fgos`.
//!
//! Owns `legacy-cli` route execution: resolves release path and manifest,
//! spawns Node with preserved arguments and environment, forwards signals,
//! enforces recursion guard, and records invocation lifecycle.

use fgos_host_runtime::invocation_service::LifecycleTracker;
use fgos_host_runtime::{InvocationLifecycleRecord, InvocationTerminalState, OperationId};
use serde::Deserialize;
use std::env;
use std::ffi::OsString;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::SystemTime;

pub const RECURSION_GUARD_VAR: &str = "FGOS_RUST_HOST_RECURSION_GUARD";

/// Manifest structure for resolving the legacy-node component.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct ReleaseManifest {
    pub schema_version: Option<u32>,
    pub root: Option<String>,
    pub entry: Option<String>,
    pub components: Option<ManifestComponents>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct ManifestComponents {
    pub legacy_node: Option<LegacyNodeComponent>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct LegacyNodeComponent {
    pub root: String,
    pub entry: String,
    pub digest: Option<String>,
}

/// Checks the recursion guard variable. Fails closed if already set.
pub fn check_recursion_guard() -> Result<(), String> {
    if env::var(RECURSION_GUARD_VAR).is_ok() {
        return Err(format!(
            "recursion guard triggered: {} is already set; refused to spawn child host recursively",
            RECURSION_GUARD_VAR
        ));
    }
    Ok(())
}

/// Resolves the payload entry path according to R4:
/// `join(activeReleasePath, components.legacyNode.root, components.legacyNode.entry)`
/// from `FGOS_ACTIVE_RELEASE_PATH` and `FGOS_ACTIVE_MANIFEST_PATH`.
pub fn resolve_payload_path() -> Result<PathBuf, String> {
    let active_release_path = if let Ok(p) = env::var("FGOS_ACTIVE_RELEASE_PATH") {
        PathBuf::from(p)
    } else {
        let exe = env::current_exe()
            .map_err(|e| format!("cannot determine current executable path: {}", e))?;
        let real_exe = fs::canonicalize(&exe).unwrap_or(exe);
        let candidate_dev = real_exe
            .parent()
            .and_then(|p| p.parent())
            .and_then(|p| p.parent())
            .map(|p| p.to_path_buf());
        let candidate_rel = real_exe
            .parent()
            .and_then(|p| p.parent())
            .map(|p| p.to_path_buf());

        if let Some(dev_root) = candidate_dev.as_ref().filter(|p| {
            p.join("target").join("dev-manifest.json").exists() || p.join("manifest.json").exists()
        }) {
            dev_root.clone()
        } else if let Some(rel_root) = candidate_rel
            .as_ref()
            .filter(|p| p.join("manifest.json").exists())
        {
            rel_root.clone()
        } else {
            return Err(
                "FGOS_ACTIVE_RELEASE_PATH environment variable is not set for legacy-cli route"
                    .to_string(),
            );
        }
    };

    let manifest_path = if let Ok(m) = env::var("FGOS_ACTIVE_MANIFEST_PATH") {
        PathBuf::from(m)
    } else {
        let default_manifest = Path::new(&active_release_path).join("manifest.json");
        if default_manifest.exists() {
            default_manifest
        } else {
            let dev_manifest = Path::new(&active_release_path)
                .join("target")
                .join("dev-manifest.json");
            if dev_manifest.exists() {
                dev_manifest
            } else {
                return Err(format!(
                    "manifest not found at '{}' or '{}'",
                    default_manifest.display(),
                    dev_manifest.display()
                ));
            }
        }
    };

    let manifest_bytes = fs::read(&manifest_path).map_err(|e| {
        format!(
            "failed to read manifest at '{}': {}",
            manifest_path.display(),
            e
        )
    })?;

    let manifest: ReleaseManifest = serde_json::from_slice(&manifest_bytes).map_err(|e| {
        format!(
            "failed to parse manifest at '{}': {}",
            manifest_path.display(),
            e
        )
    })?;

    let (root, entry) = if let Some(components) = manifest.components {
        if let Some(legacy_node) = components.legacy_node {
            (legacy_node.root, legacy_node.entry)
        } else if let (Some(r), Some(e)) = (manifest.root, manifest.entry) {
            (r, e)
        } else {
            return Err("manifest missing components.legacyNode and root/entry fields".to_string());
        }
    } else if let (Some(r), Some(e)) = (manifest.root, manifest.entry) {
        (r, e)
    } else {
        return Err("manifest missing components.legacyNode and root/entry fields".to_string());
    };

    let payload_path = Path::new(&active_release_path).join(root).join(entry);
    if !payload_path.exists() {
        return Err(format!(
            "resolved legacy payload path '{}' does not exist",
            payload_path.display()
        ));
    }

    Ok(payload_path)
}

#[cfg(unix)]
mod sys {
    extern "C" {
        pub fn kill(pid: i32, sig: i32) -> i32;
        pub fn signal(sig: i32, handler: usize) -> usize;
    }
}

static CHILD_PID: std::sync::atomic::AtomicI32 = std::sync::atomic::AtomicI32::new(0);

#[cfg(unix)]
extern "C" fn sig_handler(sig: i32) {
    let pid = CHILD_PID.load(std::sync::atomic::Ordering::SeqCst);
    if pid > 0 {
        unsafe {
            sys::kill(pid, sig);
        }
    }
}

/// Appends exactly one JSON-lines record to `FGOS_INVOCATION_RECORD_PATH` when set.
pub fn emit_invocation_record(record: &InvocationLifecycleRecord) {
    if let Ok(path) = env::var("FGOS_INVOCATION_RECORD_PATH") {
        if !path.is_empty() {
            if let Some(parent) = Path::new(&path).parent() {
                let _ = fs::create_dir_all(parent);
            }
            if let Ok(line) = serde_json::to_string(record) {
                use std::io::Write;
                if let Ok(mut file) = fs::OpenOptions::new().create(true).append(true).open(&path) {
                    let _ = writeln!(file, "{}", line);
                }
            }
        }
    }
}

/// Executes a legacy-cli selector by spawning Node with preserved arguments.
pub fn execute_legacy_cli(
    selector: &str,
    tracker: &LifecycleTracker,
    forward_args: &[OsString],
) -> ! {
    let started_at = SystemTime::now();

    let payload_path = match resolve_payload_path() {
        Ok(path) => path,
        Err(err) => {
            eprintln!("fgos: error: {}", err);
            let completed_at = SystemTime::now();
            let record = InvocationLifecycleRecord {
                invocation_id: format!(
                    "inv_{:x}",
                    started_at
                        .duration_since(SystemTime::UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_nanos()
                ),
                host_kind: "cli".to_string(),
                operation_id: OperationId::parse(format!("cli.legacy.{}", selector))
                    .unwrap_or_else(|_| OperationId::from_static("cli.legacy.passthrough")),
                provider_id: Some("legacy-node".to_string()),
                registry_fingerprint: None,
                request_contract: None,
                outcome_contract: None,
                trace_context: None,
                dispatched: false,
                terminal_state: InvocationTerminalState::AdmissionRefused,
                terminal_error: Some(err),
                diagnostics: Vec::new(),
                started_at,
                completed_at,
            };
            let final_record = tracker.write_terminal(record);
            emit_invocation_record(&final_record);
            std::process::exit(1);
        }
    };

    let mut cmd = Command::new("node");
    cmd.arg(&payload_path);
    cmd.args(forward_args);
    cmd.env(RECURSION_GUARD_VAR, "1");
    cmd.stdin(Stdio::inherit());
    cmd.stdout(Stdio::inherit());
    cmd.stderr(Stdio::inherit());

    let mut child = match cmd.spawn() {
        Ok(c) => c,
        Err(err) => {
            let completed_at = SystemTime::now();
            let record = InvocationLifecycleRecord {
                invocation_id: format!(
                    "inv_{:x}",
                    started_at
                        .duration_since(SystemTime::UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_nanos()
                ),
                host_kind: "cli".to_string(),
                operation_id: OperationId::parse(format!("cli.legacy.{}", selector))
                    .unwrap_or_else(|_| OperationId::from_static("cli.legacy.passthrough")),
                provider_id: Some("legacy-node".to_string()),
                registry_fingerprint: None,
                request_contract: None,
                outcome_contract: None,
                trace_context: None,
                dispatched: false,
                terminal_state: InvocationTerminalState::ProviderFailed,
                terminal_error: Some(format!("failed to spawn node: {}", err)),
                diagnostics: Vec::new(),
                started_at,
                completed_at,
            };
            let final_record = tracker.write_terminal(record);
            emit_invocation_record(&final_record);
            eprintln!("fgos: error: failed to spawn node: {}", err);
            std::process::exit(1);
        }
    };

    let child_id = child.id() as i32;
    CHILD_PID.store(child_id, std::sync::atomic::Ordering::SeqCst);

    #[cfg(unix)]
    unsafe {
        sys::signal(2, sig_handler as *const () as usize); // SIGINT
        sys::signal(15, sig_handler as *const () as usize); // SIGTERM
    }

    let status = match child.wait() {
        Ok(s) => s,
        Err(err) => {
            CHILD_PID.store(0, std::sync::atomic::Ordering::SeqCst);
            #[cfg(unix)]
            unsafe {
                sys::signal(2, 0);
                sys::signal(15, 0);
            }
            eprintln!("fgos: error: failed to wait for node child: {}", err);
            std::process::exit(1);
        }
    };

    CHILD_PID.store(0, std::sync::atomic::Ordering::SeqCst);
    #[cfg(unix)]
    unsafe {
        sys::signal(2, 0);
        sys::signal(15, 0);
    }

    let completed_at = SystemTime::now();

    #[cfg(unix)]
    use std::os::unix::process::ExitStatusExt;

    let exit_code = status.code();
    #[cfg(unix)]
    let term_signal = status.signal();
    #[cfg(not(unix))]
    let term_signal: Option<i32> = None;

    let (terminal_state, terminal_error) = match (exit_code, term_signal) {
        (Some(0), _) => (InvocationTerminalState::Succeeded, None),
        (Some(code), _) => (
            InvocationTerminalState::SemanticFailed,
            Some(format!("process exited with code {}", code)),
        ),
        (None, Some(sig)) => (
            InvocationTerminalState::SemanticFailed,
            Some(format!("process terminated by signal {}", sig)),
        ),
        _ => (
            InvocationTerminalState::CompletionUnknown,
            Some("process terminated with unknown status".to_string()),
        ),
    };

    let op_id_str = format!("cli.legacy.{}", selector);
    let operation_id = OperationId::parse(&op_id_str)
        .unwrap_or_else(|_| OperationId::from_static("cli.legacy.passthrough"));

    let invocation_id = format!(
        "inv_{:x}",
        started_at
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos()
    );

    let record = InvocationLifecycleRecord {
        invocation_id,
        host_kind: "cli".to_string(),
        operation_id,
        provider_id: Some("legacy-node".to_string()),
        registry_fingerprint: None,
        request_contract: None,
        outcome_contract: None,
        trace_context: None,
        dispatched: true,
        terminal_state,
        terminal_error,
        diagnostics: Vec::new(),
        started_at,
        completed_at,
    };

    let final_record = tracker.write_terminal(record);
    emit_invocation_record(&final_record);

    #[cfg(unix)]
    if let Some(sig) = term_signal {
        unsafe {
            sys::signal(sig, 0);
            sys::kill(std::process::id() as i32, sig);
        }
        std::process::exit(128 + sig);
    }

    if let Some(code) = exit_code {
        std::process::exit(code);
    }

    std::process::exit(1);
}
