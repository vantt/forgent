//! What every lifecycle operation of Work's checkouts shares: the main checkout, the state root and the writer.

use crate::{git, Result};
use fgos_git::{GitDriver, RepoHandle};
use std::path::{Path, PathBuf};

/// The repository an operation acts on. `repo_root` is the trusted main checkout.
#[derive(Debug, Clone)]
pub struct Context {
    pub repo_root: PathBuf,
    pub state_root: PathBuf,
    /// The identity the Git port records as the writer.
    pub writer: String,
}

impl Context {
    pub(crate) fn driver(&self) -> Result<GitDriver> {
        git::driver(&self.state_root)
    }
    /// The main checkout's handle: administration always uses it, so removing or moving a checkout cannot
    /// invalidate the driver's own gitdir.
    pub(crate) fn main(&self, driver: &GitDriver) -> Result<RepoHandle> {
        git::open(driver, &self.repo_root, &self.repo_root)
    }
    pub(crate) fn at(&self, driver: &GitDriver, checkout: &Path) -> Result<RepoHandle> {
        git::open(driver, checkout, &self.repo_root)
    }
}
