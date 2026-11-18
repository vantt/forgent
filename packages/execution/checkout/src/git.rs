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

/// A commit named by `name` in `repo`; an unknown or unreadable name is an invalid request.
pub(crate) fn resolve_commit(
    driver: &GitDriver,
    repo: &RepoHandle,
    name: &str,
) -> Result<fgos_git::Oid> {
    let shown = repo.trusted_main_root().display().to_string();
    match driver.resolve_commit_ref(repo, name) {
        Ok(Some(oid)) => Ok(oid),
        Ok(None) => Err(Error::invalid(format!(
            "reading ref {name} failed in \"{shown}\": unknown ref {name}"
        ))),
        Err(e) => Err(Error::invalid(format!(
            "reading ref {name} failed in \"{shown}\": {}",
            e.cause
        ))),
    }
}

/// Whether `refs/heads/<branch>` is a direct ref.
pub(crate) fn branch_exists(driver: &GitDriver, repo: &RepoHandle, branch: &str) -> bool {
    matches!(
        driver.resolve_literal_ref(repo, &format!("refs/heads/{branch}")),
        Ok(Some(_))
    )
}

/// The checkout facts of `repo` (a handle opened at the checkout) against `revision`, `HEAD` when `None`.
pub(crate) fn checkout_facts(
    driver: &GitDriver,
    repo: &RepoHandle,
    revision: Option<&fgos_git::Oid>,
) -> Result<serde_json::Value> {
    let head;
    let revision = match revision {
        Some(r) => r,
        None => {
            head = resolve_commit(driver, repo, "HEAD")?;
            &head
        }
    };
    driver.checkout_facts(repo, revision).map_err(Error::git)
}

/// A byte field of the checkout facts (`status`, `delta`, `stagedPatch`).
pub(crate) fn fact_bytes(facts: &serde_json::Value, key: &str) -> Vec<u8> {
    serde_json::from_value(facts[key].clone()).unwrap_or_default()
}

/// Any uncommitted change but the `.fgos` one; an unreadable status counts as dirty.
pub(crate) fn is_checkout_dirty(driver: &GitDriver, checkout: &RepoHandle) -> bool {
    checkout_facts(driver, checkout, None).map_or(true, |f| !fact_bytes(&f, "status").is_empty())
}

/// The custody lease of one checkout, never waited for. A lease another process holds is `ErrorKind::LockHeld`
/// worded as the lock-held refusal Node raised for it.
pub(crate) fn custody(repo: &RepoHandle, checkout: &Path) -> Result<fgos_holder_lock::Handle> {
    fgos_git::acquire_checkout_custody(repo, checkout).map_err(|e| {
        if e.cause.contains("checkout-custody-busy") {
            let mut held = Error::new(
                crate::ErrorKind::LockHeld,
                "holder-lock (lock-held): worktree custody is held",
            );
            held.details.insert("lock".into(), "dispatch-cwd".into());
            held
        } else {
            Error::git(e)
        }
    })
}

pub(crate) fn borrow(
    handle: &fgos_holder_lock::Handle,
) -> Result<fgos_holder_lock::BorrowedHandle<'_>> {
    fgos_holder_lock::BorrowedHandle::new(handle).map_err(|e| {
        Error::new(
            crate::ErrorKind::Io,
            format!("borrowing the custody lease failed: {e:?}"),
        )
    })
}
