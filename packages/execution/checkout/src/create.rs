use crate::{git, provision, Error, Result};
use fgos_git::{RefName, WorktreeCreate, WorktreeHandle};
use fgos_holder_lock::BorrowedHandle;
use std::path::PathBuf;

/// Whether a new checkout is provisioned.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Provision {
    /// Dependency install, skill roots, the project's setup commands, then the record.
    Full,
    /// The checkout only: no install, no setup command, no record, nothing placed.
    None,
}

#[derive(Debug, Clone)]
pub struct CreateRequest {
    /// The caller's directory: where the repository is resolved from.
    pub cwd: PathBuf,
    /// The trusted main checkout.
    pub repo_root: PathBuf,
    pub state_root: PathBuf,
    /// The identity the Git port records as the writer.
    pub writer: String,
    /// Where the checkout goes; absolute.
    pub path: PathBuf,
    /// The branch to create; `None` makes a detached checkout.
    pub branch: Option<String>,
    /// Literal base (`HEAD` when `None`).
    pub base: Option<String>,
    pub provision: Provision,
    /// A checkout made only to run a check in (see `provision`).
    pub disposable: bool,
}

#[derive(Debug)]
pub struct Created {
    pub handle: WorktreeHandle,
    pub provisioned: bool,
}

/// Make the checkout, then provision it unless asked not to. The Git port returns and releases its holds before
/// any setup command runs. A provisioning failure leaves the created checkout in place: the error names its path.
pub fn create(request: &CreateRequest) -> Result<Created> {
    let driver = git::driver(&request.state_root)?;
    let repo = git::open(&driver, &request.cwd, &request.repo_root)?;
    let base = driver
        .resolve_worktree_base(&repo, request.base.as_deref())
        .map_err(Error::git)?;
    let branch = request
        .branch
        .as_deref()
        .map(|name| {
            RefName::parse(&format!("refs/heads/{name}"))
                .map_err(|e| Error::invalid(format!("invalid branch: {e:?}")))
        })
        .transpose()?;
    let handle = {
        let admin = git::lock_worktree_admin(&request.repo_root)?;
        let held = admin
            .handle("worktree-admin")
            .ok_or_else(|| Error::invalid("the worktree-admin hold is missing"))?;
        let borrowed = BorrowedHandle::new(held).map_err(|e| {
            Error::invalid(format!("borrowing the worktree-admin hold failed: {e:?}"))
        })?;
        driver
            .create_worktree(
                &repo,
                vec![borrowed],
                &WorktreeCreate {
                    path: request.path.clone(),
                    branch,
                    base,
                    session_id: None,
                },
                &request.writer,
                &git::operation_id("worktree"),
            )
            .map_err(Error::git)?
    };
    let provisioned = request.provision == Provision::Full;
    if provisioned {
        provision::provision(
            &handle.path,
            &request.repo_root,
            &request.state_root,
            request.disposable,
        )
        .map_err(|e| {
            if e.worktree_path.is_some() {
                e
            } else {
                e.at(&handle.path)
            }
        })?;
    }
    Ok(Created {
        handle,
        provisioned,
    })
}
