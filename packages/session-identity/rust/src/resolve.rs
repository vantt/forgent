//! The resolve rule. Pure apart from the [`ProcessTree`] port and one
//! read-only look at `<fgos_dir>/sessions.json`.

use crate::proc_tree::{os_process_tree, ProcessTree};
use serde::Serialize;
use std::path::Path;

/// Env variables tried in order; the first usable value wins.
pub const ENV_ORDER: [&str; 3] = [
    "FGOS_SESSION_ID",
    "CODEX_THREAD_ID",
    "CLAUDE_CODE_SESSION_ID",
];
/// Longest env id accepted, in characters.
pub const MAX_ID_LENGTH: usize = 200;
/// Registry file under the fgos dir that can confirm an env id.
pub const REGISTRY_FILE: &str = "sessions.json";
/// Upper bound on parent hops, so a corrupt or cyclic parent chain stops.
const MAX_WALK: usize = 4096;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Source {
    Registry,
    Env,
    Pid,
    Unresolved,
}

/// A session id string (`registry`/`env`) or a process id (`pid`/`unresolved`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(untagged)]
pub enum WriterId {
    Session(String),
    Pid(u32),
}

impl std::fmt::Display for WriterId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            WriterId::Session(id) => f.write_str(id),
            WriterId::Pid(pid) => write!(f, "{pid}"),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct WriterIdentity {
    pub id: WriterId,
    pub source: Source,
}

impl WriterIdentity {
    fn pid(pid: u32) -> Self {
        Self {
            id: WriterId::Pid(pid),
            source: Source::Pid,
        }
    }
    fn unresolved(pid: u32) -> Self {
        Self {
            id: WriterId::Pid(pid),
            source: Source::Unresolved,
        }
    }
}

fn usable(value: &str) -> Option<&str> {
    let trimmed = value.trim();
    let ok = !trimmed.is_empty()
        && trimmed.chars().count() <= MAX_ID_LENGTH
        && trimmed
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-'));
    ok.then_some(trimmed)
}

fn registry_confirms(fgos_dir: Option<&Path>, id: &str) -> bool {
    let Some(dir) = fgos_dir else { return false };
    let Ok(raw) = std::fs::read_to_string(dir.join(REGISTRY_FILE)) else {
        return false;
    };
    let Ok(serde_json::Value::Array(rows)) = serde_json::from_str::<serde_json::Value>(&raw) else {
        return false;
    };
    rows.iter()
        .any(|row| row.get("sessionId").and_then(|v| v.as_str()) == Some(id))
}

/// Step 1: the first usable env id, confirmed against the registry when one
/// is given. `None` means no usable env id.
pub fn env_identity(
    lookup: &dyn Fn(&str) -> Option<String>,
    fgos_dir: Option<&Path>,
) -> Option<WriterIdentity> {
    ENV_ORDER.iter().find_map(|key| {
        let value = lookup(key)?;
        let id = usable(&value)?.to_string();
        let source = if registry_confirms(fgos_dir, &id) {
            Source::Registry
        } else {
            Source::Env
        };
        Some(WriterIdentity {
            id: WriterId::Session(id),
            source,
        })
    })
}

/// Steps 2-4: the highest ancestor (the caller included) holding a
/// controlling tty; else the caller's session id; else the caller itself,
/// unresolved. No hop count decides the answer, so the depth of wrapper
/// layers between the caller and its terminal never changes it.
pub fn tree_identity(tree: &dyn ProcessTree, caller_pid: u32) -> WriterIdentity {
    let Some(first) = tree.stat(caller_pid) else {
        return WriterIdentity::unresolved(caller_pid);
    };
    let mut highest_tty = None;
    let mut pid = caller_pid;
    let mut stat = first;
    for _ in 0..MAX_WALK {
        if stat.tty_nr != 0 {
            highest_tty = Some(pid);
        }
        if pid == 1 || stat.ppid == 0 {
            break;
        }
        match tree.stat(stat.ppid) {
            Some(parent) => {
                pid = stat.ppid;
                stat = parent;
            }
            None => break,
        }
    }
    match highest_tty {
        Some(root) => WriterIdentity::pid(root),
        None if first.session > 0 => WriterIdentity::pid(first.session),
        None => WriterIdentity::unresolved(caller_pid),
    }
}

/// The whole rule for one caller.
pub fn resolve(
    lookup: &dyn Fn(&str) -> Option<String>,
    tree: &dyn ProcessTree,
    caller_pid: u32,
    fgos_dir: Option<&Path>,
) -> WriterIdentity {
    env_identity(lookup, fgos_dir).unwrap_or_else(|| tree_identity(tree, caller_pid))
}

/// The rule for the current process, as an in-process Rust caller (Observe)
/// sees itself: real env, real OS process tree, own pid.
pub fn resolve_current(fgos_dir: Option<&Path>) -> WriterIdentity {
    let tree = os_process_tree();
    resolve(
        &|key| std::env::var(key).ok(),
        tree.as_ref(),
        std::process::id(),
        fgos_dir,
    )
}
