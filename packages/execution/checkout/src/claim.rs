//! What a claim does to a checkout that is still standing: reattach to it, bring it to its branch's tip when that
//! loses nothing, and move a never-started branch onto its base.

use crate::context::Context;
use crate::orphan::checkout_path_for;
use crate::record::realpath_or_self;
use crate::{git, Error, Result};
use fgos_git::{Oid, RefName, RestoreRequest};
use std::path::{Path, PathBuf};

/// What `resync_claim_worktree` did.
#[derive(Debug, PartialEq, Eq)]
pub struct ClaimResynced {
    pub resynced: bool,
    pub from: Option<String>,
    pub to: Option<String>,
}

/// What `refresh_unstarted_branch` found and did.
#[derive(Debug, PartialEq, Eq)]
pub struct Refresh {
    pub target: String,
    pub ahead: u64,
    pub behind: u64,
    pub refreshed: bool,
    /// `already-current`, `own-commits` or `refresh-refused` when the branch did not move.
    pub reason: Option<&'static str>,
    pub from: Option<String>,
    pub to: Option<String>,
    pub detail: Option<String>,
}

/// The checkout of `branch` a claim may reattach to: registered, still on disk, and under `base_dir` (a checkout a
/// runner dispatch holds elsewhere has a live worker in it). Cleanliness is no condition: nothing is removed.
pub(crate) fn reattachable_checkout(
    ctx: &Context,
    branch: &str,
    base_dir: &Path,
) -> Option<PathBuf> {
    let driver = ctx.driver().ok()?;
    let main = ctx.main(&driver).ok()?;
    let registered = checkout_path_for(&driver, &main, branch).ok()??;
    if !registered.exists() || !base_dir.exists() {
        return None;
    }
    let base = realpath_or_self(base_dir);
    let relative = Path::new(&realpath_or_self(&registered))
        .strip_prefix(Path::new(&base))
        .ok()?
        .to_path_buf();
    if relative.as_os_str().is_empty() {
        return None;
    }
    Some(PathBuf::from(realpath_or_self(&registered)))
}

fn dirty_relative_to(
    driver: &fgos_git::GitDriver,
    checkout: &fgos_git::RepoHandle,
    last: &Oid,
) -> bool {
    match git::checkout_facts(driver, checkout, Some(last)) {
        Ok(facts) => {
            !git::fact_bytes(&facts, "delta").is_empty()
                || git::fact_bytes(&facts, "status")
                    .split(|b| *b == 0)
                    .any(|line| line.starts_with(b"??"))
        }
        Err(_) => true,
    }
}

/// Bring a reattached claim checkout to its branch's tip, only when its last-synced commit is an ancestor of the tip
/// and it has no uncommitted change relative to that commit. Refuses loudly otherwise; never resets blind.
pub fn resync_claim_worktree(
    ctx: &Context,
    worktree: &Path,
    branch: &str,
) -> Result<ClaimResynced> {
    let driver = ctx.driver()?;
    let main = ctx.main(&driver)?;
    let checkout = ctx.at(&driver, worktree)?;
    let shown = worktree.display().to_string();
    let detail = |e: Error| {
        e.detail("branch", branch)
            .detail("worktreePath", shown.clone())
    };
    let facts = git::checkout_facts(&driver, &checkout, None)?;
    let Some(last_text) = facts["lastSynced"]
        .as_str()
        .filter(|s| !s.is_empty())
        .map(str::to_owned)
    else {
        return Err(detail(Error::worktree(format!(
            "refusing to resync claim worktree \"{shown}\" on \"{branch}\" — could not read its own HEAD reflog to determine what commit it was last synced to. Inspect \"{shown}\" by hand before claiming \"{branch}\" again."
        ))));
    };
    let tip = git::resolve_commit(&driver, &main, branch)?;
    if last_text == tip.as_str() {
        return Ok(ClaimResynced {
            resynced: false,
            from: None,
            to: None,
        });
    }
    let last = Oid::parse(&last_text, main.object_format())
        .map_err(|e| Error::invalid(format!("{e:?}")))?;
    let ancestor = driver.ancestry(&main, &last, &tip).unwrap_or(false);
    let tip_text = tip.as_str().to_owned();
    if !ancestor {
        return Err(detail(Error::worktree(format!(
            "refusing to resync claim worktree \"{shown}\" on \"{branch}\" — its last-synced commit ({last_text}) is not an ancestor of the branch's current tip ({tip_text}), so a reset would risk losing commits. Inspect \"{shown}\" and reconcile by hand before claiming \"{branch}\" again."
        )))
        .detail("lastSynced", last_text.clone())
        .detail("branchTip", tip_text.clone()));
    }
    if dirty_relative_to(&driver, &checkout, &last) {
        return Err(detail(Error::worktree(format!(
            "refusing to resync claim worktree \"{shown}\" on \"{branch}\" — its last-synced commit ({last_text}) is behind the branch's current tip ({tip_text}, likely from a child merge landing since this worktree was last synced) and the tree has uncommitted changes. Commit or discard the work in \"{shown}\" before claiming \"{branch}\" again — never auto-reset over uncommitted work. Not sure whether this is real work or a stale artifact left over from the drift? See docs/knowledge/how-to-tell-a-stale-worktree-index-apart-from-real-uncommitt/tell-a-stale-worktree-index-apart-from-real-uncommitted-work.md for the diagnostic recipe."
        )))
        .detail("lastSynced", last_text.clone())
        .detail("branchTip", tip_text.clone()));
    }
    let head = git::resolve_commit(&driver, &checkout, "HEAD")?;
    let lease = git::custody(&checkout, worktree)?;
    driver
        .apply_restore(
            &checkout,
            vec![git::borrow(&lease)?],
            &RestoreRequest {
                expected_head: head.as_str().to_owned(),
                target: tip_text.clone(),
                reason: "worktree resync".into(),
                reapply_local_delta: false,
                allowed_replacements: Vec::new(),
                checkout_baseline: Some(last_text.clone()),
                discard_local_delta: false,
                require_clean_baseline: true,
                require_staged_only: false,
                confirmed_by: None,
            },
            &ctx.writer,
            &git::operation_id("worktree"),
            &fgos_git::wal::OsFileSystem,
        )
        .map_err(Error::git)?;
    Ok(ClaimResynced {
        resynced: true,
        from: Some(last_text),
        to: Some(tip_text),
    })
}

/// Move `branch` onto `target_ref`'s tip, but only when it has no commit of its own (its tip is an ancestor of the
/// target's). A probe that fails counts as "has its own commits". With `checkout` the move runs in that checkout
/// under its custody lease; git refusing it is `refresh-refused`, never a failed claim.
pub fn refresh_unstarted_branch(
    ctx: &Context,
    branch: &str,
    target_ref: &str,
    checkout: Option<&Path>,
) -> Result<Refresh> {
    let driver = ctx.driver()?;
    let main = ctx.main(&driver)?;
    let branch_tip = git::resolve_commit(&driver, &main, branch)?;
    let target_tip = git::resolve_commit(&driver, &main, target_ref)?;
    let (mut ahead, mut behind) = (0, 0);
    if let Ok(cmp) = driver.compare_commits(&main, &target_tip, &branch_tip) {
        behind = cmp["left"].as_u64().unwrap_or(0);
        ahead = cmp["right"].as_u64().unwrap_or(0);
    }
    let stay = |reason, detail| Refresh {
        target: target_ref.to_owned(),
        ahead,
        behind,
        refreshed: false,
        reason: Some(reason),
        from: None,
        to: None,
        detail,
    };
    if branch_tip == target_tip {
        return Ok(stay("already-current", None));
    }
    if !driver
        .ancestry(&main, &branch_tip, &target_tip)
        .unwrap_or(false)
    {
        return Ok(stay("own-commits", None));
    }
    let name = RefName::parse(&format!("refs/heads/{branch}"))
        .map_err(|e| Error::invalid(format!("{e:?}")))?;
    let moved = (|| -> std::result::Result<(), String> {
        let id = git::operation_id("worktree");
        match checkout {
            Some(path) => {
                let repo = ctx.at(&driver, path).map_err(|e| e.message)?;
                let lease =
                    git::custody(&repo, path).map_err(|_| "worktree custody held".to_owned())?;
                let borrowed = git::borrow(&lease).map_err(|e| e.message)?;
                driver
                    .fast_forward_checked_out(
                        &repo,
                        vec![borrowed],
                        &name,
                        &branch_tip,
                        &target_tip,
                        &ctx.writer,
                        &id,
                    )
                    .map(|_| ())
                    .map_err(|e| e.cause)
            }
            None => driver
                .advance_ref(
                    &main,
                    vec![],
                    &name,
                    &branch_tip,
                    &target_tip,
                    &ctx.writer,
                    &id,
                )
                .map(|_| ())
                .map_err(|e| e.cause),
        }
    })();
    Ok(match moved {
        Err(cause) => stay("refresh-refused", Some(cause)),
        Ok(()) => Refresh {
            target: target_ref.to_owned(),
            ahead,
            behind,
            refreshed: true,
            reason: None,
            from: Some(branch_tip.as_str().to_owned()),
            to: Some(target_tip.as_str().to_owned()),
            detail: None,
        },
    })
}
