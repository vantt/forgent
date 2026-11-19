//! Ownership markers: the file that says which dispatch (or attempt) a private home belongs to, written before
//! any allocation side effect is exposed, and the owner-only directories those homes live in.

use super::agent_file::read_agent_file;
use super::error::CleanupError;
use super::resolve::{current_uid, resolve};
use fgos_durable_file::replace_durably_with_mode;
use serde_json::{json, Map, Value};
use std::fs;
use std::path::{Path, PathBuf};

pub const OWNERSHIP_MARKER_FILE: &str = ".fgos-confinement-owner.json";
pub const OWNERSHIP_CONTRACT: &str = "confinement-resource-ownership.v1";
pub const OWNERSHIP_CREATOR: &str = "fgos-confinement";
/// The marker of a home that belongs to one supervised attempt: its owner is that attempt, not a process.
pub const ATTEMPT_HOME_MARKER_CONTRACT: &str = "confinement-resource-ownership.v2";
/// The marker sits in a home the agent could write, so its read is bounded.
pub const MAX_HOME_MARKER_BYTES: u64 = 64 * 1024;
const ROOT_DIR_NAME: &str = "fgos-confinement";

pub(super) fn iso_now() -> String {
    fgos_host_runtime::civil_time::format_system_time_utc(std::time::SystemTime::now())
}

/// `JSON.stringify(value, null, 2)`.
pub(super) fn pretty(value: &Value) -> String {
    serde_json::to_string_pretty(value).expect("a JSON value always serialises")
}

/// Writes `bytes` to `file` whole and durably, owner-only (0600): a reader sees the old file or the new one.
pub(super) fn write_file_atomic(file: &Path, bytes: &[u8]) -> Result<(), CleanupError> {
    let dir = file.parent().unwrap_or_else(|| Path::new("."));
    let name = file
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| CleanupError::new(format!("no file name in {}", file.display())))?;
    replace_durably_with_mode(dir, name, bytes, 0o600)
        .map(|_| ())
        .map_err(|err| CleanupError::new(err.to_string()))
}

/// The temp root private homes live under. A private home holds a copy of an account login, so the root must
/// belong to the current user: when a directory of that name already exists but is owned by someone else (a shared
/// /tmp), a per-uid root is used instead of trusting or fighting over it.
pub fn resolve_confinement_temp_root(base: &Path) -> PathBuf {
    let shared = base.join(ROOT_DIR_NAME);
    let Some(uid) = current_uid() else {
        return shared;
    };
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        // lstat: a link another user left under the shared name is theirs, whatever it points at.
        if fs::symlink_metadata(&shared).is_ok_and(|m| m.uid() != uid) {
            return base.join(format!("{ROOT_DIR_NAME}-{uid}"));
        }
    }
    let _ = uid;
    shared
}

/// Creates `dir` and every missing level between `root` and it owner-only (0700). `mkdir` ignores a mode for a
/// parent that already exists and the umask masks the rest, so each level is chmod'ed explicitly. Levels above
/// `root` are never touched.
pub fn ensure_private_dir(dir: &Path, root: Option<&Path>) -> Result<PathBuf, CleanupError> {
    let target = resolve(dir);
    let top = resolve(root.unwrap_or(dir));
    let Ok(rel) = target.strip_prefix(&top) else {
        return Err(CleanupError::new(format!(
            "ensurePrivateDir: \"{}\" is not inside \"{}\".",
            target.display(),
            top.display()
        )));
    };
    let mut levels = vec![top.clone()];
    for part in rel.components() {
        let next = levels.last().expect("levels is never empty").join(part);
        levels.push(next);
    }
    make_private(&top, true)?;
    for level in &levels {
        if !level.exists() {
            make_private(level, false)?;
        }
        let owned = match (current_uid(), fs::metadata(level)) {
            (None, _) => true,
            #[cfg(unix)]
            (Some(uid), Ok(meta)) => std::os::unix::fs::MetadataExt::uid(&meta) == uid,
            _ => false,
        };
        if owned {
            chmod_private(level)?;
        }
    }
    Ok(target)
}

fn make_private(dir: &Path, recursive: bool) -> Result<(), CleanupError> {
    let mut builder = fs::DirBuilder::new();
    builder.recursive(recursive);
    #[cfg(unix)]
    std::os::unix::fs::DirBuilderExt::mode(&mut builder, 0o700);
    builder
        .create(dir)
        .map_err(|err| CleanupError::io(&err, "mkdir", dir))
}

fn chmod_private(dir: &Path) -> Result<(), CleanupError> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(dir, fs::Permissions::from_mode(0o700))
            .map_err(|err| CleanupError::io(&err, "chmod", dir))?;
    }
    let _ = dir;
    Ok(())
}

fn require(value: Option<&str>, what: &str, function: &str) -> Result<String, CleanupError> {
    match value {
        Some(text) if !text.is_empty() => Ok(text.to_string()),
        _ => Err(CleanupError::new(format!(
            "{what} is required for {function}."
        ))),
    }
}

/// Writes the ownership marker inside an allocated directory; `pid` is the dispatcher that owns it.
pub fn write_ownership_marker(
    dir: &Path,
    dispatch_id: &str,
    resource: &str,
    pid: u32,
) -> Result<PathBuf, CleanupError> {
    let dispatch_id = require(Some(dispatch_id), "dispatchId", "writeOwnershipMarker")?;
    let marker = json!({
        "contract": OWNERSHIP_CONTRACT,
        "creator": OWNERSHIP_CREATOR,
        "dispatchId": dispatch_id,
        "resource": resource,
        "pid": pid,
        "createdAt": iso_now(),
    });
    let path = dir.join(OWNERSHIP_MARKER_FILE);
    fs::write(&path, pretty(&marker)).map_err(|err| CleanupError::io(&err, "open", &path))?;
    Ok(path)
}

/// Writes the ownership marker of a home that belongs to one supervised attempt. Only adopt's finalize-home step
/// removes such a home. Written atomically.
pub fn write_ownership_marker_v2(
    dir: &Path,
    attempt_id: Option<&str>,
    run_dir: Option<&str>,
    dispatch_id: Option<&str>,
    resource: &str,
) -> Result<PathBuf, CleanupError> {
    let attempt_id = require(attempt_id, "attemptId", "writeOwnershipMarkerV2")?;
    let run_dir = require(run_dir, "runDir", "writeOwnershipMarkerV2")?;
    let mut marker = Map::new();
    marker.insert("contract".into(), ATTEMPT_HOME_MARKER_CONTRACT.into());
    marker.insert("creator".into(), OWNERSHIP_CREATOR.into());
    marker.insert("attemptId".into(), attempt_id.into());
    marker.insert("runDir".into(), run_dir.into());
    if let Some(id) = dispatch_id.filter(|id| !id.is_empty()) {
        marker.insert("dispatchId".into(), id.into());
    }
    marker.insert("resource".into(), resource.into());
    marker.insert("createdAt".into(), iso_now().into());
    let path = dir.join(OWNERSHIP_MARKER_FILE);
    write_file_atomic(&path, pretty(&Value::Object(marker)).as_bytes())?;
    Ok(path)
}

/// The marker's text, read through the agent-file door.
pub(super) fn read_marker_text(dir: &Path) -> Result<String, CleanupError> {
    let bytes = read_agent_file(&dir.join(OWNERSHIP_MARKER_FILE), MAX_HOME_MARKER_BYTES)?;
    Ok(String::from_utf8_lossy(&bytes).into_owned())
}

fn marker_of(dir: &Path, contract: &str) -> Option<Value> {
    let parsed: Value = serde_json::from_str(&read_marker_text(dir).ok()?).ok()?;
    (parsed.get("contract").and_then(Value::as_str) == Some(contract)
        && parsed.get("creator").and_then(Value::as_str) == Some(OWNERSHIP_CREATOR))
    .then_some(parsed)
}

/// The marker of an attempt home (version 2), or `None` when the directory has none of ours.
pub fn read_attempt_ownership_marker(dir: &Path) -> Option<Value> {
    marker_of(dir, ATTEMPT_HOME_MARKER_CONTRACT)
}

/// The marker of a dispatch's resource (version 1), or `None` when absent, malformed or not ours.
pub fn read_ownership_marker(dir: &Path) -> Option<Value> {
    if !dir.join(OWNERSHIP_MARKER_FILE).exists() {
        return None;
    }
    marker_of(dir, OWNERSHIP_CONTRACT)
}

/// The per-dispatch parent exists only to hold its resources; once one is removed, leave no empty shell behind
/// (`rmdir` refuses a non-empty directory, so a sibling resource keeps it alive).
pub fn remove_empty_dispatch_parent(removed: &Path, dispatch_id: &str) {
    let Some(parent) = removed.parent() else {
        return;
    };
    if dispatch_id.is_empty() || parent.file_name().and_then(|n| n.to_str()) != Some(dispatch_id) {
        return;
    }
    let _ = fs::remove_dir(parent);
}
