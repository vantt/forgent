//! One clone's Event Store, opened the way every writer linked into the host
//! opens it: the Git driver on the state root, the repository of the working
//! directory, the store layout of its common directory, this machine's id and
//! the shipped consumer registry. Identity's shared directory and the
//! mailbox's cross-machine path both start here.

use fgos_event_store::{identity::machine_id, layout::Layout, registry::Registry};
use fgos_git::{GitDriver, Inspect, RepoHandle, ResolveRepo};
use std::path::Path;

/// Why the store of a clone could not be opened: a fixed word and the cause.
#[derive(Debug)]
pub struct OpenFault {
    pub reason: &'static str,
    pub detail: String,
}

fn fault(error: &dyn std::fmt::Debug) -> OpenFault {
    OpenFault { reason: "event-store-unavailable", detail: format!("{error:?}") }
}

pub struct EventStoreClone {
    pub driver: GitDriver,
    pub repo: RepoHandle,
    pub layout: Layout,
    pub registry: Registry,
    pub machine: String,
}

/// The store of the clone `dir` is in, or `None` when `dir` is in no repository
/// or its project never migrated its events: migration commits the
/// `.fgos/events` fence, the store itself is minted by the first append, so a
/// clone of a migrated project that never appended still opens, and that first
/// append creates its store.
pub fn open(dir: &Path) -> Result<Option<EventStoreClone>, OpenFault> {
    let (state, _) = fgos_holder_lock::state_root();
    let driver = GitDriver::new(&state).map_err(|e| fault(&e))?;
    let repo = match driver.resolve_repo(dir, dir).map_err(|e| fault(&e))? {
        ResolveRepo::Repository(repo) => repo,
        ResolveRepo::NotARepository => return Ok(None),
    };
    let layout = Layout::from_common_dir(Some(repo.common_dir())).map_err(|e| fault(&e))?;
    let migrated = std::fs::symlink_metadata(repo.trusted_main_root().join(".fgos/events")).is_ok_and(|m| m.is_file());
    if !migrated && std::fs::symlink_metadata(layout.store()).is_err() {
        return Ok(None);
    }
    let configured = driver.machine_id(&repo).map_err(|e| fault(&e))?;
    let configured = configured.as_ref().map(|fact| std::str::from_utf8(&fact.value)).transpose().map_err(|e| fault(&e))?;
    let machine = machine_id(configured, &state).map_err(|e| fault(&e))?;
    let registry = Registry::shipped().map_err(|e| fault(&e))?;
    Ok(Some(EventStoreClone { driver, repo, layout, registry, machine }))
}
