//! The attempt directories not yet closed, and one judgement of each. The judgement itself is
//! `crate::adopt::adopt_one`, called in process: this module lists and calls, never decides.
//! (Node: `listOpenAttemptDirs`, `adoptScan` of `src/run-supervisor/client.mjs`.)

use crate::adopt::{adopt_one, AdoptArgs, Target, Verdict};
use fgos_holder_lock::DEFAULT_KILL_WAIT_MS;
use std::fs;
use std::path::{Path, PathBuf};

/// Attempt directories (`runs/<name>` under `assignments_root`) with no `closed.json`, sorted.
pub fn list_open_attempt_dirs(assignments_root: &Path) -> Vec<PathBuf> {
    let mut found = Vec::new();
    walk(assignments_root, &mut found);
    found.sort();
    found
}

fn walk(dir: &Path, found: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        // `fs::metadata` follows links like Node's `Dirent.isDirectory` does not; only real directories count.
        if !entry.file_type().is_ok_and(|t| t.is_dir()) {
            continue;
        }
        let child = entry.path();
        if entry.file_name() != "runs" {
            walk(&child, found);
            continue;
        }
        let Ok(attempts) = fs::read_dir(&child) else {
            continue;
        };
        for attempt in attempts.flatten() {
            if !attempt.file_type().is_ok_and(|t| t.is_dir()) {
                continue;
            }
            let attempt_dir = attempt.path();
            if !attempt_dir.join("closed.json").exists() {
                found.push(attempt_dir);
            }
        }
    }
}

/// Judge (and adopt unless `probe_only`) every attempt directory that is not closed: one verdict per
/// directory, in listing order. No directory, no verdicts.
pub fn adopt_scan(
    assignments_root: &Path,
    probe_only: bool,
    kill_wait_ms: Option<u64>,
) -> Vec<(PathBuf, Verdict)> {
    let args = AdoptArgs {
        target: Target::Scan,
        probe_only,
        kill_wait_ms: kill_wait_ms.unwrap_or(DEFAULT_KILL_WAIT_MS),
    };
    list_open_attempt_dirs(assignments_root)
        .into_iter()
        .map(|dir| {
            let verdict = adopt_one(&dir, &args);
            (dir, verdict)
        })
        .collect()
}
