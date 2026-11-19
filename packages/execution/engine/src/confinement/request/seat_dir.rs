//! Where a seat's session is while its run settles.

use std::path::{Path, PathBuf};

use serde_json::Value;

use super::js::{get, truthy};

/// Where finalize-home keeps a seat's session, relative to the run directory.
pub(crate) const TRANSCRIPT_DIR: &str = "protected/session";

/// Where a seat's kept session is, relative to the run directory, or `None` when none was kept.
pub(crate) fn transcript_path_of(run_dir: &Path) -> Option<&'static str> {
    let kept = std::fs::read_dir(run_dir.join(TRANSCRIPT_DIR))
        .ok()?
        .next()
        .is_some();
    kept.then_some(TRANSCRIPT_DIR)
}

/// The folder a seat's session is in while its run settles: the copy finalize-home kept in the run directory, else
/// the session folder of the launch's private home (settle runs before finalize-home removes it). `None` when the
/// launch declared no session folder.
pub fn seat_session_dir(run_dir: &Path, launch_command_id: Option<&str>) -> Option<PathBuf> {
    if let Some(kept) = transcript_path_of(run_dir) {
        return Some(run_dir.join(kept));
    }
    let id = launch_command_id.filter(|id| !id.is_empty())?;
    let file = run_dir
        .join("protected")
        .join("confinement-finalization")
        .join(format!("{id}.json"));
    let descriptor: Value = serde_json::from_str(&std::fs::read_to_string(file).ok()?).ok()?;
    let resources = get(&descriptor, "resources")?.as_array()?;
    let home = resources.iter().find(|res| {
        get(res, "resourceId").and_then(Value::as_str) == Some("private-home")
            && is_text(get(res, "sessionDir"))
            && home_path(res).is_some()
    })?;
    let session = get(home, "sessionDir").and_then(Value::as_str)?;
    Some(Path::new(home_path(home)?).join(session))
}

/// `typeof sessionDir === 'string'`: any string, however blank.
fn is_text(value: Option<&Value>) -> bool {
    matches!(value, Some(Value::String(_)))
}

/// `res.pathRef || res.path`, when it is a string.
fn home_path(res: &Value) -> Option<&str> {
    let by_ref = get(res, "pathRef").filter(|v| truthy(Some(v)));
    let chosen = by_ref.or_else(|| get(res, "path"));
    chosen.and_then(Value::as_str)
}
