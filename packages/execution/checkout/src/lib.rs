//! One door that makes, provisions, removes and resyncs a linked checkout.
//!
//! Git owns the worktree registration (`fgos-git`): this crate calls it, and everything after it is Execution's:
//! dependency install, the project's `worktreeSetup.commands`, the ignored skill directories the main checkout
//! holds, and the provisioning record that lets `remove` take back exactly those bytes. No Git lock is held while
//! a setup command runs. The crate knows no unit, run or Work item.

mod create;
mod error;
mod git;
mod provision;
pub mod record;
mod remove;
mod resync;

pub use create::{create, CreateRequest, Created, Provision};
pub use error::{Error, ErrorKind};
pub use provision::{provision, provision_dependencies, provision_skill_roots, run_setup_commands};
pub use remove::{remove, RemoveRequest, Removed};
pub use resync::{resync, ResyncRequest, Resynced};

/// The result of every operation of this crate.
pub type Result<T> = std::result::Result<T, Error>;
