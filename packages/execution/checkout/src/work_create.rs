//! Stand up the checkout of one Work item (`fgw/<id>`), a claim's or a dispatch attempt's, or a disposable one at
//! a commit to verify a tree in. Each is provisioned like `create`, under the worktree-admin hold only while the
//! Git port registers it.

use crate::admin::{with_admin, DEFAULT_ADMIN_WAIT_MS};
use crate::claim::{
    reattachable_checkout, refresh_unstarted_branch, resync_claim_worktree, Refresh,
};
use crate::context::Context;
use crate::orphan::relocate_orphaned_checkout;
use crate::record::realpath_or_self;
use crate::work_remove::{remove_worktree, WorkRemove};
use crate::{git, provision, Error, ErrorKind, Result};
use fgos_git::{RefName, WorktreeCreate};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone)]
pub struct WorkCreate {
    pub ctx: Context,
    /// The Work item id; its branch is `fgw/<id>`.
    pub id: String,
    /// Where the checkout directory is allocated (`<tmp>/fgos-worktrees` when `None`).
    pub worktree_dir: Option<PathBuf>,
    /// Fork a new branch from this ref (ignored when the branch exists).
    pub base_ref: Option<String>,
    /// Fork a new branch from this commit instead of reading HEAD again (ignored with `base_ref`).
    pub start_sha: Option<String>,
    /// How long to wait for the worktree-admin lock ([`DEFAULT_ADMIN_WAIT_MS`] when `None`).
    pub wait_ms: Option<u64>,
}

#[derive(Debug)]
pub struct WorkCreated {
    pub path: PathBuf,
    pub branch: String,
    pub reused: bool,
    /// Only a claim that found the branch without a live checkout and was given a base ref.
    pub refresh: Option<Refresh>,
}

pub fn branch_name_for(id: &str) -> String {
    format!("fgw/{id}")
}

fn default_base_dir() -> PathBuf {
    std::env::temp_dir().join("fgos-worktrees")
}

/// A new empty directory `<base>/<prefix><random>`, the way `mkdtemp` makes one.
fn make_temp_dir(base: &Path, prefix: &str) -> Result<PathBuf> {
    fs::create_dir_all(base).map_err(|e| Error::io(format!("creating {}", base.display()), &e))?;
    for _ in 0..64 {
        let digest = Sha256::digest(git::operation_id("tmp").as_bytes());
        let suffix: String = digest.iter().take(3).map(|b| format!("{b:02x}")).collect();
        let candidate = base.join(format!("{prefix}{suffix}"));
        match fs::create_dir(&candidate) {
            Ok(()) => return Ok(candidate),
            Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(e) => return Err(Error::io(format!("creating {}", candidate.display()), &e)),
        }
    }
    Err(Error::new(
        ErrorKind::Io,
        format!("no free directory name under {}", base.display()),
    ))
}

/// Register the checkout at `path` (an empty placeholder the caller allocated) under the admin hold.
fn register(
    ctx: &Context,
    wait_ms: u64,
    path: &Path,
    branch: Option<&str>,
    base: Option<&str>,
) -> Result<()> {
    let driver = ctx.driver()?;
    let main = ctx.main(&driver)?;
    let base = driver
        .resolve_worktree_base(&main, base)
        .map_err(Error::git)?;
    let branch = branch
        .map(|name| {
            RefName::parse(&format!("refs/heads/{name}"))
                .map_err(|e| Error::invalid(format!("invalid branch: {e:?}")))
        })
        .transpose()?;
    with_admin(&main, wait_ms, |held| {
        // The native creation needs an absent destination: the caller's empty placeholder goes first.
        if fs::read_dir(path).is_ok_and(|mut d| d.next().is_none()) {
            let _ = fs::remove_dir(path);
        }
        driver
            .create_worktree(
                &main,
                held,
                &WorktreeCreate {
                    path: path.to_path_buf(),
                    branch,
                    base,
                    session_id: None,
                },
                &ctx.writer,
                &git::operation_id("worktree"),
            )
            .map(|_| ())
            .map_err(Error::git)
    })
}

/// Create (or reuse, when the branch exists) the checkout of work item `id`. An existing clean checkout of the
/// branch is moved to the new directory, never destroyed; a dirty one refuses. Returns the real path.
pub fn create_worktree(request: &WorkCreate) -> Result<WorkCreated> {
    let ctx = &request.ctx;
    let branch = branch_name_for(&request.id);
    let base_dir = request
        .worktree_dir
        .clone()
        .unwrap_or_else(default_base_dir);
    let path = make_temp_dir(&base_dir, &format!("{}-", request.id))?;
    let wait_ms = request.wait_ms.unwrap_or(DEFAULT_ADMIN_WAIT_MS);
    let driver = ctx.driver()?;
    let main = ctx.main(&driver)?;
    let reused = git::branch_exists(&driver, &main, &branch);
    let mut relocated = false;
    if reused {
        match relocate_orphaned_checkout(ctx, &branch, &path) {
            Ok(moved) => relocated = moved,
            Err(error) => {
                let _ = fs::remove_dir(&path);
                return Err(error);
            }
        }
    }
    if !relocated {
        let base = if reused {
            // The existing branch is checked out exactly as it stands.
            Some(
                git::resolve_commit(&driver, &main, &format!("refs/heads/{branch}"))?
                    .as_str()
                    .to_owned(),
            )
        } else {
            request
                .base_ref
                .clone()
                .or_else(|| request.start_sha.clone())
        };
        if let Err(error) = register(ctx, wait_ms, &path, Some(&branch), base.as_deref()) {
            let _ = fs::remove_dir(&path);
            if error.kind == ErrorKind::LockHeld {
                return Err(error);
            }
            let shown = path.display().to_string();
            return Err(Error::worktree(format!(
                "git worktree add failed for branch \"{branch}\": {}",
                error.message
            ))
            .detail("branch", branch.clone())
            .detail("worktreePath", shown));
        }
    }
    if let Err(error) = provision::provision(&path, &ctx.repo_root, &ctx.state_root, false) {
        // Registered by now: only a forced removal leaves no dangling administrative entry.
        let _ = remove_worktree(&WorkRemove {
            ctx: ctx.clone(),
            path: path.clone(),
            delivered_to: None,
            retain_to: None,
        });
        return Err(if error.worktree_path.is_some() {
            error
        } else {
            error.at(&path)
        });
    }
    Ok(WorkCreated {
        path: PathBuf::from(realpath_or_self(&path)),
        branch,
        reused,
        refresh: None,
    })
}

/// The creator of a runner dispatch attempt; pair it with `remove_dispatch_worktree`.
pub fn create_dispatch_worktree(request: &WorkCreate) -> Result<WorkCreated> {
    create_worktree(request)
}

/// The checkout of a claim, which outlives the call. A standing checkout under `worktree_dir` is reattached to and
/// resynced to the branch's tip when that loses nothing; a branch minted earlier and never started is first moved
/// onto `base_ref` (`refresh` says what happened).
pub fn create_claim_worktree(request: &WorkCreate) -> Result<WorkCreated> {
    let ctx = &request.ctx;
    let branch = branch_name_for(&request.id);
    let driver = ctx.driver()?;
    let main = ctx.main(&driver)?;
    if !git::branch_exists(&driver, &main, &branch) {
        return create_worktree(request);
    }
    let base_dir = request
        .worktree_dir
        .clone()
        .unwrap_or_else(default_base_dir);
    if let Some(existing) = reattachable_checkout(ctx, &branch, &base_dir) {
        resync_claim_worktree(ctx, &existing, &branch)?;
        return Ok(WorkCreated {
            path: existing,
            branch,
            reused: true,
            refresh: None,
        });
    }
    let refresh = request
        .base_ref
        .as_deref()
        .map(|base| refresh_unstarted_branch(ctx, &branch, base, None))
        .transpose()?;
    let mut created = create_worktree(request)?;
    created.refresh = refresh;
    Ok(created)
}

/// A disposable checkout detached at `commit`, provisioned like a Land candidate with its record marked disposable,
/// for verifying a tree no checkout holds. The caller removes it with `remove_worktree`. Its path is not resolved.
pub fn create_verify_checkout(ctx: &Context, commit: &str) -> Result<PathBuf> {
    let path = make_temp_dir(&default_base_dir(), "verify-")?;
    if let Err(error) = register(ctx, DEFAULT_ADMIN_WAIT_MS, &path, None, Some(commit)) {
        let _ = fs::remove_dir(&path);
        if error.kind == ErrorKind::LockHeld {
            return Err(error);
        }
        return Err(Error::worktree(format!(
            "git worktree add --detach failed at {commit}: {}",
            error.message
        ))
        .detail("worktreePath", path.display().to_string()));
    }
    if let Err(error) = provision::provision(&path, &ctx.repo_root, &ctx.state_root, true) {
        let _ = remove_worktree(&WorkRemove {
            ctx: ctx.clone(),
            path: path.clone(),
            delivered_to: None,
            retain_to: None,
        });
        return Err(if error.worktree_path.is_some() {
            error
        } else {
            error.at(&path)
        });
    }
    Ok(path)
}
