//! The one construction of a store's authority: the Git driver under a state root, the repository of a
//! working directory, and the machine id that names this clone's refs. Adapters call it and map its
//! refusals to their own error shape; none of them builds a driver or reads the machine id itself.
use crate::errors::{Error, ErrorCode};
use fgos_git::{GitDriver, Inspect, OperationError, RepoHandle, ResolveRepo};
use std::path::Path;
use std::sync::Arc;

/// Why a store's authority could not be built.
#[derive(Debug)]
pub enum ResolveError {
    /// A detached child (a background seal or publish) was started for a state root that is gone: it
    /// never rebuilds a root its owner tore down, and its caller skips quietly.
    StateRootGone,
    /// The working directory is no repository.
    NoRepository,
    /// A Git operation refused; the driver's fields are kept whole.
    Git(OperationError),
    /// The machine id could not be read or is invalid.
    Machine(Error),
}

impl ResolveError {
    /// The closed code a caller reports: the Git operation's code, the result code of the Event Store, or
    /// `state-root-gone`.
    pub fn code(&self) -> String {
        match self {
            Self::StateRootGone => STATE_ROOT_GONE.into(),
            Self::NoRepository => ErrorCode::EventStoreNoRepository.to_string(),
            Self::Git(e) => serde_json::to_value(e.code)
                .ok()
                .and_then(|code| code.as_str().map(str::to_owned))
                .unwrap_or_else(|| format!("{:?}", e.code)),
            Self::Machine(e) => e.code.to_string(),
        }
    }
}

/// What a detached child fails with when the state root it was started for is gone.
pub const STATE_ROOT_GONE: &str = "state-root-gone";

/// The authority of one resolved clone.
pub struct Resolved {
    pub driver: Arc<GitDriver>,
    pub repo: Arc<RepoHandle>,
    pub machine: String,
}

/// The driver on `state_root` and the repository of `cwd` (`trusted_main` is the main checkout's root).
/// `detached` marks a background child: it never creates a state root that is gone.
pub fn resolve_repo(
    cwd: &Path,
    state_root: &Path,
    trusted_main: &Path,
    detached: bool,
) -> Result<(GitDriver, RepoHandle), ResolveError> {
    let driver = if detached {
        GitDriver::new_if_root_exists(state_root)
            .map_err(ResolveError::Git)?
            .ok_or(ResolveError::StateRootGone)?
    } else {
        GitDriver::new(state_root).map_err(ResolveError::Git)?
    };
    match driver
        .resolve_repo(cwd, trusted_main)
        .map_err(ResolveError::Git)?
    {
        ResolveRepo::Repository(repo) => Ok((driver, repo)),
        ResolveRepo::NotARepository => Err(ResolveError::NoRepository),
    }
}

/// `resolve_repo` plus the machine id: the clone's git-config override, else the one minted under the state root.
pub fn resolve(
    cwd: &Path,
    state_root: &Path,
    trusted_main: &Path,
    detached: bool,
) -> Result<Resolved, ResolveError> {
    let (driver, repo) = resolve_repo(cwd, state_root, trusted_main, detached)?;
    let config = driver.machine_id(&repo).map_err(ResolveError::Git)?;
    let config = config
        .as_ref()
        .map(|fact| {
            std::str::from_utf8(&fact.value).map_err(|e| {
                ResolveError::Machine(Error::new(ErrorCode::EventStoreMachineId, e.to_string()))
            })
        })
        .transpose()?;
    let machine =
        crate::identity::machine_id(config, state_root).map_err(ResolveError::Machine)?;
    Ok(Resolved {
        driver: Arc::new(driver),
        repo: Arc::new(repo),
        machine,
    })
}
