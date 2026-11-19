//! The host record of an attempt home: `<tempRoot>/<dispatchId>/attempt-home.json`, in the owner-only dispatch
//! directory, a machine-private root no sandbox sees. It names the attempt, where its finalization descriptor is
//! (`runDir`, `launchCommandId`) and how often staging the renewed login failed. Where a login goes is read from
//! that descriptor only, never from the home.

use super::error::CleanupError;
use super::marker::{pretty, remove_empty_dispatch_parent, write_file_atomic};
use super::resolve::current_uid;
use serde_json::{json, Map, Value};
use std::fs;
use std::path::{Path, PathBuf};

/// Removal attempts a home with an unstaged renewed login gets before it is held for the owner.
pub const CREDENTIAL_KEEP_MAX_ATTEMPTS: u64 = 5;
pub const CREDENTIAL_HOME_KEPT: &str = "credential-home-kept";
pub const CREDENTIAL_HOME_HELD: &str = "credential-home-held";
/// Two failed attempts closer together than this count as one: a transient fault must not use up the budget.
pub const CREDENTIAL_KEEP_MIN_INTERVAL_MS: i64 = 15 * 60 * 1000;

const RECORD_FILE: &str = "attempt-home.json";
const RECORD_CONTRACT: &str = "confinement-attempt-home-record.v2";
const MAX_RECORD_BYTES: u64 = 64 * 1024;

fn record_path(home: &Path) -> PathBuf {
    home.parent()
        .unwrap_or_else(|| Path::new("."))
        .join(RECORD_FILE)
}

/// Writes the host record of an attempt home (whole, atomically, 0600). `fields` is `{attemptId, runDir,
/// dispatchId, launchCommandId, credentialKept?}`. Returns its path.
pub fn write_attempt_home_record(home: &Path, fields: &Value) -> Result<PathBuf, CleanupError> {
    let file = record_path(home);
    let get = |key: &str| fields.get(key).cloned().unwrap_or(Value::Null);
    let mut record = Map::new();
    record.insert("contract".into(), RECORD_CONTRACT.into());
    for key in ["attemptId", "runDir", "dispatchId", "launchCommandId"] {
        // JSON.stringify leaves a missing (undefined) value out and keeps a null.
        if let Some(value) = fields.get(key) {
            record.insert(key.into(), value.clone());
        }
    }
    record.insert("home".into(), home.to_string_lossy().as_ref().into());
    if let Some(kept) = fields
        .get("credentialKept")
        .filter(|v| !v.is_null() && v != &&json!(false))
    {
        record.insert("credentialKept".into(), kept.clone());
    }
    let _ = get;
    write_file_atomic(
        &file,
        format!("{}\n", pretty(&Value::Object(record))).as_bytes(),
    )?;
    Ok(file)
}

/// The record's bytes, only from a regular file of this user with one link, opened without following a link.
fn read_record_bytes(file: &Path) -> Option<String> {
    let (mut handle, meta) = super::agent_file::open_agent_file(file).ok()?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        let uid = current_uid().unwrap_or(meta.uid());
        if meta.uid() != uid || meta.nlink() != 1 {
            return None;
        }
    }
    if meta.len() > MAX_RECORD_BYTES {
        return None;
    }
    let mut text = String::new();
    std::io::Read::read_to_string(&mut handle, &mut text).ok()?;
    Some(text)
}

/// The host record of `home`, or `None` when there is none of this contract for exactly that home, it is not a
/// plain file of this user, or (with `attempt_id` / `run_dir`) it is another attempt's.
pub fn read_attempt_home_record(
    home: &Path,
    attempt_id: Option<&str>,
    run_dir: Option<&str>,
) -> Option<Value> {
    let record: Value = serde_json::from_str(&read_record_bytes(&record_path(home))?).ok()?;
    let text = |key: &str| record.get(key).and_then(Value::as_str);
    let dispatch_dir = home.parent()?.file_name()?.to_str()?;
    if text("contract") != Some(RECORD_CONTRACT)
        || text("home") != home.to_str()
        || text("dispatchId") != Some(dispatch_dir)
    {
        return None;
    }
    let run = text("runDir")?;
    if !Path::new(run).is_absolute() {
        return None;
    }
    let launch = text("launchCommandId")?;
    if launch.is_empty()
        || !launch
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '.' || c == '-')
    {
        return None;
    }
    if attempt_id.is_some_and(|id| text("attemptId") != Some(id))
        || run_dir.is_some_and(|dir| run != dir)
    {
        return None;
    }
    Some(record)
}

/// Counts one failed removal of a home whose renewed login could not be staged, in its host record (written from
/// `fields` when the home has none yet). An attempt close after the last counted one is not counted again, so a
/// transient fault cannot use up the budget. Returns the number of counted attempts.
pub fn count_credential_keep(home: &Path, fields: &Value, now_ms: i64) -> u64 {
    let attempt = fields.get("attemptId").and_then(Value::as_str);
    let run_dir = fields.get("runDir").and_then(Value::as_str);
    let record = read_attempt_home_record(home, attempt, run_dir).unwrap_or_else(|| fields.clone());
    let kept = record.get("credentialKept");
    let last = kept
        .and_then(|k| k.get("lastCountedAt"))
        .and_then(Value::as_f64);
    let spaced =
        last.is_none_or(|at| (now_ms as f64) - at >= CREDENTIAL_KEEP_MIN_INTERVAL_MS as f64);
    let attempts = kept
        .and_then(|k| k.get("attempts"))
        .and_then(Value::as_u64)
        .unwrap_or(0)
        + u64::from(spaced);
    if spaced {
        let since = kept
            .and_then(|k| k.get("since"))
            .cloned()
            .unwrap_or_else(|| {
                fgos_host_runtime::civil_time::format_unix_millis_rfc3339(now_ms, 0)
                    .unwrap_or_default()
                    .into()
            });
        let mut next = fields.clone();
        next["credentialKept"] =
            json!({ "attempts": attempts, "since": since, "lastCountedAt": now_ms });
        // The home is kept either way; the next removal counts again.
        let _ = write_attempt_home_record(home, &next);
    }
    attempts
}

/// Removes an attempt home, its host record and the dispatch directory once nothing else is in it.
pub fn remove_attempt_home(home: &Path, dispatch_id: &str) -> Result<(), CleanupError> {
    remove_tree(home)?;
    let record = record_path(home);
    match fs::remove_file(&record) {
        Ok(()) => {}
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => {}
        Err(err) => return Err(CleanupError::io(&err, "unlink", &record)),
    }
    remove_empty_dispatch_parent(home, dispatch_id);
    Ok(())
}

/// `rm -rf`: a missing path is not an error, a link is removed and never followed.
pub(super) fn remove_tree(path: &Path) -> Result<(), CleanupError> {
    let meta = match fs::symlink_metadata(path) {
        Ok(meta) => meta,
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => return Ok(()),
        Err(err) => return Err(CleanupError::io(&err, "lstat", path)),
    };
    let removed = if meta.is_dir() {
        fs::remove_dir_all(path)
    } else {
        fs::remove_file(path)
    };
    removed.map_err(|err| CleanupError::io(&err, "rm", path))
}
