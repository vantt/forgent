//! Session Identity: the single authority for "who is the writer of the
//! calling process, and how far can that id be trusted".
//!
//! The rule lives in [`resolve`]; the OS is reached only through the
//! [`ProcessTree`] port, so the rule is tested against fake process tables
//! and the real `/proc` adapter stays a thin driver. Contract and shared
//! vectors: `packages/session-identity/contracts/`.

pub mod proc_tree;
pub mod provider;
pub mod resolve;

pub use proc_tree::{os_process_tree, ProcStat, ProcessTree};
pub use provider::{IdentityProvider, IdentityRequest, IDENTITY_DESCRIPTOR, IDENTITY_OPERATION_ID};
pub use resolve::{
    env_identity, resolve, resolve_current, tree_identity, Source, WriterId, WriterIdentity,
    ENV_ORDER, MAX_ID_LENGTH, REGISTRY_FILE,
};
