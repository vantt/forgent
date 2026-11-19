//! Did a seat of a writing unit change the worktree before it stopped?
//!
//! A seat that hit a provider limit half way may already have written, renamed or deleted files. Before every
//! attempt of a writing unit the runner records what the worktree looks like (HEAD and the content of every path
//! git sees as changed), and after a provider limit it compares: any difference means the seat is not run again by
//! itself. Capturing is the Git door's (`GitDriver::snapshot_writes`); this module translates and compares.

use std::collections::BTreeMap;

use fgos_git::{PathFingerprint, WritesSnapshot};

/// What a worktree looked like: HEAD, and per changed path a token of its content (`None`: the path is gone).
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct WorktreeSnapshot {
    pub head: Option<String>,
    pub files: BTreeMap<String, Option<String>>,
}

/// The paths whose content differs between two snapshots, and whether HEAD moved.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WritesSince {
    pub paths: Vec<String>,
    pub head_moved: bool,
}

fn token(fingerprint: &PathFingerprint) -> Option<String> {
    Some(match fingerprint {
        PathFingerprint::Missing => return None,
        PathFingerprint::File { sha256, .. } => sha256.clone(),
        PathFingerprint::Link { target } => format!("link:{}", String::from_utf8_lossy(target)),
        PathFingerprint::Type { mode } => format!("type:{mode}"),
        PathFingerprint::Unreadable { size, mtime } => format!("unreadable:{size}:{mtime}"),
    })
}

/// The snapshot a Git capture stands for; the run store (`.fgos`) is never part of it.
pub fn worktree_snapshot(captured: &WritesSnapshot) -> Result<WorktreeSnapshot, std::string::FromUtf8Error> {
    let mut files = BTreeMap::new();
    for entry in &captured.files {
        let path = String::from_utf8(entry.path.clone())?;
        if path == ".fgos" || path.starts_with(".fgos/") {
            continue;
        }
        files.insert(path, token(&entry.fingerprint));
    }
    Ok(WorktreeSnapshot { head: captured.head.as_ref().map(|h| h.as_str().to_string()), files })
}

/// A path dirty in only one snapshot changed even when its content reads the same (a file put back, or one that
/// became clean again by a commit the worker made).
pub fn writes_since(before: &WorktreeSnapshot, now: &WorktreeSnapshot) -> WritesSince {
    let mut all: Vec<&String> = before.files.keys().chain(now.files.keys()).collect();
    all.sort();
    all.dedup();
    let paths = all
        .into_iter()
        .filter(|p| {
            before.files.get(*p).cloned().flatten() != now.files.get(*p).cloned().flatten()
                || before.files.contains_key(*p) != now.files.contains_key(*p)
        })
        .cloned()
        .collect();
    WritesSince { paths, head_moved: before.head != now.head }
}
