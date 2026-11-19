//! `dispatch.gateKillGraceMs` and `dispatch.cancelWaitMs`: the effective value through `fgos-config`
//! (project over global over standard), with the layer that set it. The `dispatch` section schema owns the
//! type, the minimum and the standard value of both; this module only reads. Port of `gate-kill-grace.mjs`.

use fgos_config::detect::NoDetectors;
use fgos_config::machine::{context, global_dir, project_snapshot, snapshot, HOME_VAR};
use fgos_config::session::session_class;
use fgos_config::snapshot::{SessionClass, Snapshot, SnapshotError};
use fgos_config::Segment;
use serde_json::Value;
use std::path::Path;

pub const GATE_KILL_GRACE_KEY: &str = "dispatch.gateKillGraceMs";
pub const CANCEL_WAIT_KEY: &str = "dispatch.cancelWaitMs";

/// A `dispatch` key's value and the layer that set it (`project`, `global` or `standard`).
#[derive(Debug, Clone, PartialEq)]
pub struct Setting {
    pub value: u64,
    pub source: String,
}

/// The config door refused the files, or the key has no value.
#[derive(Debug)]
pub struct ConfigReadError(pub String);

impl std::fmt::Display for ConfigReadError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::error::Error for ConfigReadError {}

fn refused(error: SnapshotError) -> ConfigReadError {
    ConfigReadError(match error {
        SnapshotError::Refused(list) => list
            .iter()
            .map(|r| r.to_string())
            .collect::<Vec<_>>()
            .join("; "),
        SnapshotError::Io(io) => io.to_string(),
    })
}

/// The effective config of the machine alone (`project_root` absent) or of one project. `global_dir`
/// replaces `~/.fgos`; with none the home of the environment names it.
pub fn read_dispatch_config(
    project_root: Option<&Path>,
    global_config_path: Option<&Path>,
) -> Result<Snapshot, ConfigReadError> {
    let lookup = |name: &str| std::env::var(name).ok();
    let global = match global_config_path {
        Some(file) => file.parent().map(Path::to_path_buf),
        None => global_dir(lookup),
    }
    .ok_or_else(|| ConfigReadError(format!("{HOME_VAR} is not set")))?;
    match project_root {
        Some(root) if global_config_path.is_none() => {
            project_snapshot(root, lookup).map_err(refused)
        }
        Some(root) => {
            let request = fgos_config::snapshot::SnapshotRequest {
                project_root: root.into(),
                trusted_root: root.into(),
                global_dir: global,
                class: session_class(lookup),
            };
            let ctx = context(&NoDetectors).map_err(|r| ConfigReadError(r.to_string()))?;
            fgos_config::snapshot::snapshot(&ctx, &request).map_err(refused)
        }
        None => {
            let ctx = context(&NoDetectors).map_err(|r| ConfigReadError(r.to_string()))?;
            snapshot(&ctx, &global, SessionClass::Unconfined).map_err(refused)
        }
    }
}

fn setting(snapshot: &Snapshot, key: &str) -> Result<Setting, ConfigReadError> {
    let missing = || {
        ConfigReadError(format!(
            "the config door returned no value for dispatch.{key}"
        ))
    };
    let layer = snapshot
        .origins
        .iter()
        .find(|origin| matches!(origin.path.as_slice(), [Segment::Key(a), Segment::Key(b)] if a == "dispatch" && b == key))
        .map(|origin| origin.provenance.layer)
        .ok_or_else(missing)?;
    let value = snapshot
        .value
        .get("dispatch")
        .and_then(|d| d.get(key))
        .and_then(Value::as_u64)
        .ok_or_else(missing)?;
    Ok(Setting {
        value,
        source: layer.to_string(),
    })
}

/// The grace and where it came from.
pub fn resolve_gate_kill_grace(snapshot: &Snapshot) -> Result<Setting, ConfigReadError> {
    setting(snapshot, "gateKillGraceMs")
}

/// The cancel wait and where it came from.
pub fn resolve_cancel_wait(snapshot: &Snapshot) -> Result<Setting, ConfigReadError> {
    setting(snapshot, "cancelWaitMs")
}

/// The grace for the project at `project_root`.
pub fn read_gate_kill_grace_ms(project_root: Option<&Path>) -> Result<u64, ConfigReadError> {
    Ok(resolve_gate_kill_grace(&read_dispatch_config(project_root, None)?)?.value)
}

/// `dispatch.cancelWaitMs` of the project at `project_root`.
pub fn read_cancel_wait_ms(project_root: Option<&Path>) -> Result<u64, ConfigReadError> {
    Ok(resolve_cancel_wait(&read_dispatch_config(project_root, None)?)?.value)
}
