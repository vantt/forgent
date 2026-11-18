use crate::record;
use crate::{git, Error, ErrorKind, Result};
use fgos_git::{acquire_checkout_custody, Oid, RestoreRequest};
use fgos_holder_lock::BorrowedHandle;
use serde_json::Value;
use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct ResyncRequest {
    pub repo_root: PathBuf,
    pub state_root: PathBuf,
    pub writer: String,
    pub worktree: PathBuf,
    /// The branch the checkout follows; the branch it has checked out when `None`.
    pub branch: Option<String>,
}

#[derive(Debug, PartialEq, Eq)]
pub struct Resynced {
    pub resynced: bool,
    pub reason: Option<&'static str>,
    pub from: Option<String>,
    pub to: Option<String>,
    pub reapplied: bool,
}

fn bytes(facts: &Value, key: &str) -> Vec<u8> {
    serde_json::from_value(facts[key].clone()).unwrap_or_default()
}

/// Repair a checkout whose branch was moved from outside: capture its staged content, reset it to the branch tip
/// and reapply the capture. Refuses when its last-synced commit is not an ancestor of the tip, when anything is
/// dirty beyond what is staged, or when an earlier run left a patch behind.
pub fn resync(request: &ResyncRequest) -> Result<Resynced> {
    let driver = git::driver(&request.state_root)?;
    let wt_repo = git::open(&driver, &request.worktree, &request.repo_root)?;
    let main_repo = git::open(&driver, &request.repo_root, &request.repo_root)?;
    let shown = request.worktree.display();
    let branch = match &request.branch {
        Some(branch) => branch.clone(),
        None => {
            let me = record::realpath_or_self(&request.worktree);
            git::worktrees(&driver, &wt_repo)?
                .into_iter()
                .find(|row| record::realpath_or_self(std::path::Path::new(&String::from_utf8_lossy(&row.path).into_owned())) == me)
                .and_then(|row| row.branch)
                .and_then(|b| b.as_str().strip_prefix("refs/heads/").map(str::to_owned))
                .ok_or_else(|| Error::invalid(format!("resync-worktree: \"{shown}\" has no branch checked out; pass --branch <name>")))?
        }
    };
    let head = driver
        .resolve_commit_ref(&wt_repo, "HEAD")
        .map_err(Error::git)?
        .ok_or_else(|| Error::invalid("unknown ref HEAD"))?;
    let facts = driver.checkout_facts(&wt_repo, &head).map_err(Error::git)?;
    let orphaned: Vec<String> = facts["orphanedPatches"]
        .as_array()
        .map(|a| {
            a.iter()
                .filter_map(|v| v.as_str().map(str::to_owned))
                .collect()
        })
        .unwrap_or_default();
    if !orphaned.is_empty() {
        let list = orphaned
            .iter()
            .map(|p| format!("\"{p}\""))
            .collect::<Vec<_>>()
            .join(", ");
        let (noun, pronoun) = if orphaned.len() == 1 {
            ("a patch", "it")
        } else {
            ("patches", "them")
        };
        return Err(Error::new(
            ErrorKind::Provision,
            format!("resync-worktree: refusing \"{shown}\" on \"{branch}\" — a prior resync-worktree run left {noun} behind at {list}, most likely from being interrupted between its own reset and reapply. Inspect {pronoun} by hand — the worktree may already be reset to the branch tip with this content never reapplied — then remove the file(s) before resyncing again."),
        ));
    }
    let last_synced = facts["lastSynced"].as_str().filter(|s| !s.is_empty()).map(str::to_owned).ok_or_else(|| {
        Error::new(
            ErrorKind::Provision,
            format!("resync-worktree: could not read \"{shown}\"'s own HEAD reflog to determine what commit it was last synced to. Inspect \"{shown}\" by hand."),
        )
    })?;
    let branch_tip = driver
        .resolve_commit_ref(&main_repo, &branch)
        .map_err(Error::git)?
        .ok_or_else(|| Error::invalid(format!("unknown ref {branch}")))?;
    if last_synced == branch_tip.as_str() {
        return Ok(Resynced {
            resynced: false,
            reason: Some("already-in-sync"),
            from: None,
            to: None,
            reapplied: false,
        });
    }
    let last = Oid::parse(&last_synced, main_repo.object_format())
        .map_err(|e| Error::invalid(format!("{e:?}")))?;
    if !driver
        .ancestry(&main_repo, &last, &branch_tip)
        .unwrap_or(false)
    {
        return Err(Error::new(
            ErrorKind::Provision,
            format!("resync-worktree: refusing \"{shown}\" on \"{branch}\" — its last-synced commit ({last_synced}) is not an ancestor of the branch's current tip ({}), so a reset would risk losing commits. Inspect \"{shown}\" and reconcile by hand.", branch_tip.as_str()),
        ));
    }
    // Stray dirt beyond what is staged is refused outright rather than guessed into a merge: only STAGED
    // content is what this repair carries forward. Porcelain column 2 is ' ' for a purely staged entry.
    let facts = driver.checkout_facts(&wt_repo, &last).map_err(Error::git)?;
    let stray: Vec<String> = bytes(&facts, "status")
        .split(|b| *b == 0)
        .filter(|line| !line.is_empty() && line.get(1) != Some(&b' '))
        .map(|line| String::from_utf8_lossy(line).into_owned())
        .collect();
    if !stray.is_empty() {
        return Err(Error::new(
            ErrorKind::Provision,
            format!(
                "resync-worktree: stray uncommitted changes beyond what's staged ({})",
                stray.join(", ")
            ),
        ));
    }
    let reapplied = !bytes(&facts, "stagedPatch").is_empty();
    let custody = acquire_checkout_custody(&wt_repo, &request.worktree).map_err(Error::git)?;
    let borrowed = BorrowedHandle::new(&custody).map_err(|e| {
        Error::new(
            ErrorKind::Io,
            format!("borrowing the custody lease failed: {e:?}"),
        )
    })?;
    let restore = RestoreRequest {
        expected_head: head.as_str().to_owned(),
        target: branch_tip.as_str().to_owned(),
        reason: "worktree resync".into(),
        reapply_local_delta: true,
        allowed_replacements: Vec::new(),
        checkout_baseline: Some(last_synced.clone()),
        discard_local_delta: false,
        require_clean_baseline: false,
        require_staged_only: true,
        confirmed_by: None,
    };
    driver
        .apply_restore(
            &wt_repo,
            vec![borrowed],
            &restore,
            &request.writer,
            &git::operation_id("worktree"),
            &fgos_git::wal::OsFileSystem,
        )
        .map_err(|e| {
            Error::new(
                ErrorKind::Provision,
                format!("resync-worktree: reapply refused: {}", e.cause),
            )
        })?;
    drop(custody);
    Ok(Resynced {
        resynced: true,
        reason: None,
        from: Some(last_synced),
        to: Some(branch_tip.as_str().to_owned()),
        reapplied,
    })
}
