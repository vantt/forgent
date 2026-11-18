//! The few Git port calls every operation of the crate shares: opening a repository, paging a listing, and the
//! worktree-admin hold.

use crate::{Error, Result};
use fgos_git::{
    GitDriver, Ignored, InspectCursor, RepoHandle, ResolveRepo, StatusEntry, Submodules, Untracked,
    WorktreeFact,
};
use std::path::Path;

const PAGE: usize = 4096;

pub(crate) fn driver(state_root: &Path) -> Result<GitDriver> {
    GitDriver::new(state_root).map_err(Error::git)
}

pub(crate) fn open(driver: &GitDriver, path: &Path, trusted_main: &Path) -> Result<RepoHandle> {
    match driver
        .resolve_repo(path, trusted_main)
        .map_err(Error::git)?
    {
        ResolveRepo::Repository(repo) => Ok(repo),
        _ => Err(Error::invalid(format!(
            "not a git repository: {}",
            path.display()
        ))),
    }
}

/// Every status entry of `repo`, untracked and ignored paths included, page after page.
pub(crate) fn status_entries(driver: &GitDriver, repo: &RepoHandle) -> Result<Vec<StatusEntry>> {
    let mut entries = Vec::new();
    let mut cursor: Option<InspectCursor> = None;
    loop {
        let page = driver
            .status(
                repo,
                Untracked::Normal,
                Submodules::Configured,
                Ignored::Listed,
                cursor,
                PAGE,
            )
            .map_err(Error::git)?;
        entries.extend(page.entries);
        match page.next_cursor {
            Some(next) => cursor = Some(next),
            None => return Ok(entries),
        }
    }
}

pub(crate) fn worktrees(driver: &GitDriver, repo: &RepoHandle) -> Result<Vec<WorktreeFact>> {
    let mut rows = Vec::new();
    let mut cursor: Option<InspectCursor> = None;
    loop {
        let page = driver
            .list_worktrees(repo, cursor, PAGE)
            .map_err(Error::git)?;
        rows.extend(page.entries);
        match page.next_cursor {
            Some(next) => cursor = Some(next),
            None => return Ok(rows),
        }
    }
}

/// A unique operation id the Git port accepts (letters, digits, `-`, `_`; at most 80).
pub(crate) fn operation_id(prefix: &str) -> String {
    use sha2::{Digest, Sha256};
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::time::{SystemTime, UNIX_EPOCH};
    static NEXT: AtomicU64 = AtomicU64::new(0);
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| d.as_nanos());
    let seed = format!(
        "{}:{nanos}:{}",
        std::process::id(),
        NEXT.fetch_add(1, Ordering::Relaxed)
    );
    let digest: String = Sha256::digest(seed.as_bytes())
        .iter()
        .take(16)
        .map(|b| format!("{b:02x}"))
        .collect();
    format!("{prefix}-{digest}")
}
