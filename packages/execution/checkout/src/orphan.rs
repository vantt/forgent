//! A branch's checkout that no session owns any more: take it back, or move it to where a new checkout is due.
//! Neither ever discards uncommitted work.

use crate::context::Context;
use crate::record::realpath_or_self;
use crate::work_remove::{remove_worktree, WorkRemove};
use crate::{git, Error, Result};
use fgos_git::{GitDriver, RepoHandle};
use std::fs;
use std::path::{Path, PathBuf};

/// What `reclaim_orphaned_checkout` did.
#[derive(Debug, PartialEq, Eq)]
pub struct Reclaimed {
    pub reclaimed: bool,
    pub path: Option<PathBuf>,
}

/// The registered checkout of `refs/heads/<branch>` among `rows`, resolved through the filesystem.
fn checkout_in(rows: &[fgos_git::WorktreeFact], branch: &str) -> Option<PathBuf> {
    let want = format!("refs/heads/{branch}");
    rows.iter()
        .find(|row| row.branch.as_ref().is_some_and(|b| b.as_str() == want))
        .map(|row| {
            PathBuf::from(realpath_or_self(Path::new(
                &String::from_utf8_lossy(&row.path).into_owned(),
            )))
        })
}

/// The registered checkout of `refs/heads/<branch>`, resolved through the filesystem.
pub(crate) fn checkout_path_for(
    driver: &GitDriver,
    repo: &RepoHandle,
    branch: &str,
) -> Result<Option<PathBuf>> {
    Ok(checkout_in(&git::worktrees(driver, repo)?, branch))
}

fn uncommitted(branch: &str, orphan: &Path) -> Error {
    Error::worktree(format!(
        "refusing to reclaim checkout of \"{branch}\" at \"{p}\" — it has uncommitted changes, so it is not a genuine crash-orphan (a real one is clean, its commit already landed) and may be a live checkout still in use. Commit or discard the work there, or remove the worktree yourself, before retrying.",
        p = orphan.display()
    ))
    .detail("branch", branch)
    .detail("orphanPath", orphan.display().to_string())
}

fn prune_failed(branch: &str, orphan: &Path, cause: &str) -> Error {
    Error::worktree(format!(
        "pruning stale worktree registration for \"{branch}\" (path already gone: \"{p}\") failed: {cause}",
        p = orphan.display()
    ))
    .detail("branch", branch)
    .detail("orphanPath", orphan.display().to_string())
}

fn prune_missing(
    ctx: &Context,
    driver: &GitDriver,
    main: &RepoHandle,
    orphan: &Path,
) -> std::result::Result<(), String> {
    driver
        .prune_missing_worktree(
            main,
            vec![],
            orphan,
            &ctx.writer,
            &git::operation_id("worktree"),
        )
        .map_err(|e| e.cause)
}

fn listing(
    driver: &GitDriver,
    main: &RepoHandle,
    branch: &str,
) -> Result<Vec<fgos_git::WorktreeFact>> {
    git::worktrees(driver, main).map_err(|e| {
        Error::worktree(format!(
            "listing worktrees failed while reclaiming \"{branch}\": {}",
            e.message
        ))
        .detail("branch", branch)
    })
}

/// Remove a stray checkout of `branch` right before the branch itself goes. Refuses the main checkout itself, the
/// calling session's own checkout (`caller_cwd` is it or inside it) and any checkout with uncommitted changes.
pub fn reclaim_orphaned_checkout(
    ctx: &Context,
    branch: &str,
    caller_cwd: &Path,
) -> Result<Reclaimed> {
    let driver = ctx.driver()?;
    let main = ctx.main(&driver)?;
    let rows = listing(&driver, &main, branch)?;
    let Some(orphan) = checkout_in(&rows, branch) else {
        return Ok(Reclaimed {
            reclaimed: false,
            path: None,
        });
    };
    let orphan_text = orphan.display().to_string();
    if realpath_or_self(&orphan) == realpath_or_self(&ctx.repo_root) {
        return Err(Error::worktree(format!(
            "refusing to reclaim checkout of \"{branch}\" at \"{orphan_text}\" — it resolves to repoRoot itself, so reclaiming it would force-remove the main checkout's own working tree. This is never a genuine crash-orphan; check how \"{branch}\" ended up checked out at repoRoot before retrying."
        ))
        .detail("branch", branch)
        .detail("orphanPath", orphan_text));
    }
    let resolved_orphan = realpath_or_self(&orphan);
    let resolved_cwd = realpath_or_self(caller_cwd);
    if resolved_orphan == resolved_cwd
        || resolved_cwd.starts_with(&format!("{resolved_orphan}{}", std::path::MAIN_SEPARATOR))
    {
        return Err(Error::worktree(format!(
            "refusing to reclaim checkout of \"{branch}\" at \"{orphan_text}\" — it is the calling session's own live checkout (cwd \"{cwd}\"), so it is not a genuine crash-orphan (a real one belongs to no live session) and force-removing it would destroy the session's own working directory mid-operation. Finish or exit that session's work there before retrying.",
            cwd = caller_cwd.display()
        ))
        .detail("branch", branch)
        .detail("orphanPath", orphan_text));
    }
    if orphan.exists() {
        let checkout = ctx.at(&driver, &orphan);
        if checkout.map_or(true, |repo| git::is_checkout_dirty(&driver, &repo)) {
            return Err(uncommitted(branch, &orphan));
        }
        remove_worktree(&WorkRemove {
            ctx: ctx.clone(),
            path: orphan.clone(),
            delivered_to: None,
            retain_to: None,
        })
        .map_err(|e| {
            Error::worktree(format!(
                "reclaiming orphaned checkout of \"{branch}\" at \"{orphan_text}\" failed: {}",
                e.message
            ))
            .detail("branch", branch)
            .detail("orphanPath", orphan_text.clone())
        })?;
    } else {
        prune_missing(ctx, &driver, &main, &orphan)
            .map_err(|cause| prune_failed(branch, &orphan, &cause))?;
    }
    Ok(Reclaimed {
        reclaimed: true,
        path: Some(PathBuf::from(realpath_or_self(&orphan))),
    })
}

/// Move `branch`'s clean checkout onto `target` (an absent path) instead of destroying it first; a failed move
/// leaves the old checkout where it was. `false` when there was nothing to move.
pub(crate) fn relocate_orphaned_checkout(
    ctx: &Context,
    branch: &str,
    target: &Path,
) -> Result<bool> {
    let driver = ctx.driver()?;
    let main = ctx.main(&driver)?;
    let rows = listing(&driver, &main, branch)?;
    let Some(orphan) = checkout_in(&rows, branch) else {
        return Ok(false);
    };
    if !orphan.exists() {
        prune_missing(ctx, &driver, &main, &orphan)
            .map_err(|cause| prune_failed(branch, &orphan, &cause))?;
        return Ok(false);
    }
    let checkout = ctx.at(&driver, &orphan);
    let Ok(checkout) = checkout else {
        return Err(uncommitted(branch, &orphan));
    };
    if git::is_checkout_dirty(&driver, &checkout) {
        return Err(uncommitted(branch, &orphan));
    }
    let orphan_text = orphan.display().to_string();
    let target_text = target.display().to_string();
    // `git worktree move` nests the source under an existing directory, so the caller's empty placeholder goes.
    fs::remove_dir(target).map_err(|e| {
        Error::worktree(format!(
            "preparing relocation target \"{target_text}\" for \"{branch}\" failed: {e}"
        ))
        .detail("branch", branch)
        .detail("orphanPath", orphan_text.clone())
        .detail("targetPath", target_text.clone())
    })?;
    let moved = (|| -> Result<()> {
        let tip = git::resolve_commit(&driver, &checkout, "HEAD")?;
        let lease = git::custody(&checkout, &orphan)?;
        let borrowed = git::borrow(&lease)?;
        driver
            .relocate_worktree(
                &main,
                vec![borrowed],
                &orphan,
                target,
                &tip,
                &ctx.writer,
                &git::operation_id("worktree"),
            )
            .map_err(Error::git)?;
        Ok(())
    })();
    moved.map_err(|e| {
        Error::worktree(format!(
            "relocating checkout of \"{branch}\" from \"{orphan_text}\" to \"{target_text}\" failed: {}",
            e.message
        ))
        .detail("branch", branch)
        .detail("orphanPath", orphan_text.clone())
        .detail("targetPath", target_text.clone())
    })?;
    Ok(true)
}
