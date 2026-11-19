//! Evidence of work done outside the workspace a dispatch handed its worker.
//!
//! A round settles when the worker writes its own result file; that says the worker did something and nothing
//! about where. This compares the main checkout's dirty paths before and after. It is evidence, not proof: the
//! checkout is a live working tree other sessions write to while a round is in flight, so what it sees is a
//! warning on the result, never a refusal. Nothing is watched when the worker was given the repo root itself.

use std::collections::BTreeSet;
use std::path::{Component, Path, PathBuf};

use serde_json::{json, Value};

use crate::settlement::SettlementGit;

/// `path.resolve`: absolute against `base`, `.` and `..` folded away lexically.
fn resolve(base: &Path, path: &Path) -> PathBuf {
    let joined = if path.is_absolute() {
        path.to_path_buf()
    } else {
        base.join(path)
    };
    let mut out = PathBuf::new();
    for part in joined.components() {
        match part {
            Component::ParentDir => {
                out.pop();
            }
            Component::CurDir => {}
            other => out.push(other.as_os_str()),
        }
    }
    out
}

/// One watch: the paths dirty before the round, and the repository and workspace it compares.
pub struct StrayWatch<'a> {
    git: &'a dyn SettlementGit,
    repo_root: PathBuf,
    cwd: PathBuf,
    watching: bool,
    before: BTreeSet<String>,
    before_order: Vec<String>,
}

/// Watch for work done outside the workspace the dispatch handed the worker. `known_before` is handed over from
/// the process that took the first snapshot (a supervised attempt is settled by another process than the one that
/// launched it).
pub fn watch_writes_outside_workspace<'a>(
    git: &'a dyn SettlementGit,
    repo_root: &Path,
    cwd: &Path,
    known_before: Option<&[String]>,
) -> StrayWatch<'a> {
    let here = std::env::current_dir().unwrap_or_default();
    let watching = !repo_root.as_os_str().is_empty()
        && !cwd.as_os_str().is_empty()
        && resolve(&here, cwd) != resolve(&here, repo_root);
    let mut watch = StrayWatch {
        git,
        repo_root: repo_root.to_path_buf(),
        cwd: cwd.to_path_buf(),
        watching,
        before: BTreeSet::new(),
        before_order: Vec::new(),
    };
    let before = match known_before {
        Some(list) => list.to_vec(),
        None => watch.outside_only(),
    };
    watch.before = before.iter().cloned().collect();
    watch.before_order = before;
    watch
}

impl StrayWatch<'_> {
    /// Everything at or under the workspace is the worker's to write; only what lies outside it is stray. The
    /// workspace usually lives inside the repo root, so the root's own status names the workspace directory itself.
    fn inside_workspace(&self, rel_path: &str) -> bool {
        let here = std::env::current_dir().unwrap_or_default();
        let cwd = resolve(&here, &self.cwd);
        let target = resolve(&resolve(&here, &self.repo_root), Path::new(rel_path));
        target.starts_with(&cwd)
    }

    fn outside_only(&self) -> Vec<String> {
        if !self.watching {
            return Vec::new();
        }
        self.git
            .status_files(&self.repo_root)
            .into_iter()
            .filter(|entry| !self.inside_workspace(entry))
            .collect()
    }

    pub fn watching(&self) -> bool {
        self.watching
    }

    /// The paths that were already dirty, for a later process to compare against.
    pub fn before(&self) -> &[String] {
        &self.before_order
    }

    /// Paths outside the workspace that are dirty now and were not before.
    pub fn stray_paths(&self) -> Vec<String> {
        self.outside_only()
            .into_iter()
            .filter(|entry| !self.before.contains(entry))
            .collect()
    }
}

/// The warning a round carries when paths outside its workspace became dirty while it ran, or `None` when none
/// did. Correlated evidence only: it names what appeared and where, and says nothing about who wrote it. Also
/// printed to stderr so a caller reading only the process output sees it.
pub fn stray_write_warning(repo_root: &Path, stray_paths: &[String]) -> Option<Value> {
    if stray_paths.is_empty() {
        return None;
    }
    eprintln!(
        "fgos: warning: paths outside the worker's workspace became dirty in {} during the round (another session may have written them): {}",
        repo_root.display(),
        stray_paths.join(", ")
    );
    Some(json!({
        "code": "stray-write-correlated",
        "level": "correlated",
        "basis": ["pre-post-git-snapshot"],
        "repoRoot": repo_root.to_string_lossy(),
        "paths": stray_paths,
    }))
}
