//! Read-only answers about a seat's session: where a seat's session folder is while its run settles, and which
//! head a launch environment names. Both are reads (a run directory, an environment map); the engine's settle and
//! finalize steps and its session launch compose them, and the Node session host asks them through the addon.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use serde_json::{json, Map, Value};

use crate::js::truthy;

/// Where finalize-home keeps a seat's session, relative to the run directory.
pub const TRANSCRIPT_DIR: &str = "protected/session";

/// Where a seat's kept session is, relative to the run directory, or `None` when none was kept.
pub fn transcript_path_of(run_dir: &Path) -> Option<&'static str> {
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

/// The head the session is, as its launch environment names it (`FGOS_HEAD_PERSONA`, `FGOS_HEAD_NAME`,
/// `FGOS_HEAD_GEN`): `{ persona, name, gen }`, plus `projectRoot` when `FGOS_HEAD_PROJECT_ROOT` is an absolute
/// path (the project the head was started in, which is not its cwd in a linked worktree), for the envelope's `session`, whose supervisor records it in the
/// session's Identity entry, or an empty map when the environment does not name all three (a generation is a
/// whole number of at least 1).
pub fn head_of(env: &BTreeMap<String, String>) -> Map<String, Value> {
    let gen = env
        .get("FGOS_HEAD_GEN")
        .and_then(|g| g.trim().parse::<f64>().ok());
    let persona = env.get("FGOS_HEAD_PERSONA").filter(|v| !v.is_empty());
    let name = env.get("FGOS_HEAD_NAME").filter(|v| !v.is_empty());
    match (persona, name, gen) {
        (Some(persona), Some(name), Some(gen)) if gen.fract() == 0.0 && gen >= 1.0 => {
            let mut out = Map::new();
            out.insert("persona".into(), json!(persona));
            out.insert("name".into(), json!(name));
            out.insert("gen".into(), json!(gen as u64));
            if let Some(root) = env
                .get("FGOS_HEAD_PROJECT_ROOT")
                .filter(|v| Path::new(v.as_str()).is_absolute())
            {
                out.insert("projectRoot".into(), json!(root));
            }
            out
        }
        _ => Map::new(),
    }
}

fn get<'a>(value: &'a Value, key: &str) -> Option<&'a Value> {
    value.as_object()?.get(key)
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
