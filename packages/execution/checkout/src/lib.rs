//! One door that makes, provisions, removes and resyncs a linked checkout.
//!
//! Git owns the worktree registration (`fgos-git`): this crate calls it, and everything after it is Execution's:
//! dependency install, the project's `worktreeSetup.commands`, the ignored skill directories the main checkout
//! holds, and the provisioning record that lets `remove` take back exactly those bytes. No Git lock is held while
//! a setup command runs. The crate knows no unit, run or Work item.

mod admin;
mod claim;
mod context;
mod create;
mod error;
mod git;
mod leftovers;
mod orphan;
mod provision;
pub mod record;
mod remove;
mod resync;
mod work_create;
mod work_remove;

pub use admin::DEFAULT_ADMIN_WAIT_MS;
pub use claim::{refresh_unstarted_branch, resync_claim_worktree, ClaimResynced, Refresh};
pub use context::Context;
pub use create::{create, CreateRequest, Created, Provision};
pub use error::{Error, ErrorKind};
pub use leftovers::{list_leftovers, Leftover};
pub use orphan::{reclaim_orphaned_checkout, Reclaimed};
pub use provision::{provision, provision_dependencies, provision_skill_roots, run_setup_commands};
pub use remove::{remove, RemoveRequest, Removed};
pub use resync::{resync, ResyncRequest, Resynced};
pub use work_create::{
    branch_name_for, create_claim_worktree, create_dispatch_worktree, create_verify_checkout,
    create_worktree, WorkCreate, WorkCreated,
};
pub use work_remove::{remove_dispatch_worktree, remove_worktree, Retained, WorkRemove};

/// The result of every operation of this crate.
pub type Result<T> = std::result::Result<T, Error>;
