//! One executor, one tiny read-only seat, then a report of where its CLI wrote the session in the attempt home,
//! whether finalize-home kept it, and where the kept copy is. Read-only: it changes no config and repairs nothing,
//! it names the `runner.yaml` line to change when the declared folder is wrong. It never reads session content:
//! names, counts and sizes only, because a session can hold secrets.
//!
//! The seat itself runs through the execution door the caller owns (Accounts never depends on the layer above);
//! this module is the part that reads what the run left behind and judges it.

use std::path::Path;

use serde_json::{json, Value};

use fgos_execution::executor_model::credential_store_of;

pub const SESSION_PROBE_PROMPT: &str =
    "Session probe: there is no task. Reply with the single word OK.";

/// The categories a probe ends in; only `kept` is success.
pub const SESSION_PROBE_CATEGORIES: [&str; 7] = [
    "kept",
    "run-failed",
    "no-private-home",
    "dir-undeclared",
    "dir-mismatch",
    "no-session-written",
    "copy-failed",
];

/// The invocation a probe runs: the one named by `invocation_id`, else the first confined `cli` invocation of the
/// executor in declaration order (a private home exists only under confinement), else the first `cli` one.
pub fn session_probe_invocation<'a>(
    cfg: &'a Value,
    executor_id: &str,
    invocation_id: Option<&str>,
) -> Result<&'a Value, String> {
    let executor = cfg
        .get("executors")
        .and_then(|e| e.get(executor_id))
        .filter(|e| e.is_object() && e.get("kind").and_then(Value::as_str) != Some("tool"));
    let Some(executor) = executor else {
        return Err(format!(
            "no agent executor \"{executor_id}\" in the runner config"
        ));
    };
    let invocations: Vec<&Value> = executor
        .get("invocations")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter(|inv| inv.get("via").and_then(Value::as_str) == Some("cli"))
        .collect();
    let id_of = |inv: &&Value| {
        inv.get("id")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string()
    };
    let chosen = match invocation_id {
        Some(wanted) => invocations.iter().find(|inv| id_of(inv) == wanted).copied(),
        None => invocations
            .iter()
            .find(|inv| {
                inv.get("confinement")
                    .filter(|c| !c.is_null())
                    .or_else(|| executor.get("confinement"))
                    .and_then(|c| c.get("backend"))
                    .is_some_and(|b| !b.is_null() && *b != json!(""))
            })
            .or(invocations.first())
            .copied(),
    };
    chosen.ok_or_else(|| match invocation_id {
        Some(wanted) => format!(
            "executor \"{executor_id}\" has no cli invocation \"{wanted}\" (has: {})",
            if invocations.is_empty() {
                "none".to_string()
            } else {
                invocations.iter().map(id_of).collect::<Vec<_>>().join(", ")
            }
        ),
        None => format!("executor \"{executor_id}\" has no cli invocation to probe"),
    })
}

fn tree_size(dir: &Path) -> (u64, u64) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return (0, 0);
    };
    let (mut files, mut bytes) = (0, 0);
    for entry in entries.flatten() {
        let Ok(kind) = entry.file_type() else {
            continue;
        };
        if kind.is_dir() {
            let (f, b) = tree_size(&entry.path());
            files += f;
            bytes += b;
        } else if kind.is_file() {
            files += 1;
            bytes += std::fs::symlink_metadata(entry.path()).map_or(0, |m| m.len());
        }
    }
    (files, bytes)
}

/// What the probe says from what the run left in its run directory: the finalize-home step record read against
/// the invocation's declaration. Pure over the files.
#[derive(Debug, Clone, PartialEq)]
pub struct SessionKeep {
    pub declared_session_dir: Option<String>,
    pub observed_session_paths: Vec<Value>,
    pub transcript_path: Option<String>,
    pub files: u64,
    pub bytes: u64,
    pub warnings: Vec<Value>,
    pub fix: Option<String>,
    pub has_home: bool,
}

pub fn describe_session_keep(
    run_dir: Option<&Path>,
    invocation: &Value,
    executor_id: &str,
) -> SessionKeep {
    let step: Option<Value> = run_dir
        .and_then(|d| std::fs::read_to_string(d.join("steps").join("finalize-home.json")).ok())
        .and_then(|t| serde_json::from_str(&t).ok());
    let detail = step
        .as_ref()
        .and_then(|s| s.get("detail"))
        .filter(|d| !d.is_null());
    let store = credential_store_of(invocation);
    let declared = store
        .and_then(|s| s.get("sessionDir"))
        .and_then(Value::as_str)
        .map(String::from);
    let login_files: Vec<&str> = store
        .and_then(|s| s.get("files"))
        .and_then(Value::as_array)
        .map(|l| l.iter().filter_map(Value::as_str).collect())
        .unwrap_or_default();
    let observed: Vec<Value> = detail
        .and_then(|d| d.get("homeLayout"))
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter(|entry| {
            let path = entry.get("path").and_then(Value::as_str).unwrap_or_default();
            !login_files.contains(&path) && !login_files.iter().any(|f| f.starts_with(&format!("{path}/")))
        })
        .map(|entry| json!({ "path": entry["path"], "kind": entry["kind"], "files": entry["files"], "bytes": entry["bytes"] }))
        .collect();
    let transcript = detail
        .and_then(|d| d.get("transcriptPath"))
        .and_then(Value::as_str)
        .filter(|p| !p.is_empty())
        .zip(run_dir)
        .map(|(p, d)| d.join(p));
    let (files, bytes) = transcript.as_deref().map_or((0, 0), tree_size);
    let warnings: Vec<Value> = detail
        .and_then(|d| d.get("warnings"))
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|w| json!({ "code": w["code"], "message": w["message"] }))
        .collect();
    let suggested = observed.iter().find(|entry| {
        entry["kind"] == "dir"
            && entry["path"]
                .as_str()
                .is_some_and(|p| p.to_lowercase().contains("session"))
            && entry["files"].as_f64().is_some_and(|f| f > 0.0)
    });
    let fix = suggested.and_then(|s| s["path"].as_str()).filter(|path| Some(*path) != declared.as_deref()).map(|path| {
        format!(
            "set sessionDir: {path} on executors.{executor_id}.invocations[{}].credentialStore in core/config-standard/runner.yaml",
            invocation.get("id").and_then(Value::as_str).unwrap_or("undefined")
        )
    });
    SessionKeep {
        declared_session_dir: declared,
        observed_session_paths: observed,
        transcript_path: transcript.map(|p| p.to_string_lossy().into_owned()),
        files,
        bytes,
        warnings,
        fix,
        has_home: detail
            .and_then(|d| d.get("homes"))
            .and_then(Value::as_f64)
            .is_some_and(|h| h > 0.0),
    }
}

/// A seat that failed on the provider's side can still have written and kept its session; what the probe judges is
/// the session, so a kept copy wins over the seat's own outcome.
pub fn session_category(ran_ok: bool, keep: &SessionKeep) -> &'static str {
    if keep.transcript_path.is_some() {
        return "kept";
    }
    if !ran_ok {
        return "run-failed";
    }
    if !keep.has_home {
        return "no-private-home";
    }
    if keep
        .warnings
        .iter()
        .any(|w| w["code"] == "session-copy-failed")
    {
        return "copy-failed";
    }
    if keep.declared_session_dir.is_none() {
        return "dir-undeclared";
    }
    if keep.fix.is_some() {
        "dir-mismatch"
    } else {
        "no-session-written"
    }
}
