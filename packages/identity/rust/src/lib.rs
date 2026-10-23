//! Identity (local session writer id): the single authority for "who is the writer of the
//! calling process, and how far can that id be trusted".
//!
//! The rule lives in [`resolve`]; the OS is reached only through the
//! [`ProcessTree`] port, so the rule is tested against fake process tables
//! and the real `/proc` adapter stays a thin driver. Contract and shared
//! vectors: `packages/identity/contracts/`.

pub mod attempt;
#[cfg(feature = "directory")]
pub mod current;
#[cfg(feature = "directory")]
pub mod directory;
pub mod errors;
pub mod launcher;
pub mod machine;
pub mod mint;
#[cfg(feature = "directory")]
pub mod pins;
pub mod proc_tree;
#[cfg(feature = "directory")]
pub mod project;
#[cfg(feature = "provider")]
pub mod provider;
#[cfg(feature = "directory")]
pub mod refusal;
pub mod resolve;
pub mod session;
#[cfg(feature = "directory")]
pub mod signing;
pub mod text;

pub use attempt::{mint_attempt_writer_id, InvalidAttemptId, ATTEMPT_PREFIX, MAX_ATTEMPT_ID_LENGTH};
pub use launcher::{scrub_and_set, EmptyWriterId};
pub use errors::Error;
pub use mint::{random, Kind, RandomKind, SequenceKind, KIND_NAMES, RANDOM_CHARS};
pub use proc_tree::{os_process_tree, ProcStat, ProcessTree};
#[cfg(feature = "directory")]
pub use mint::{claim_counter, claim_sequence, release_sequence, Claim, MAX_CLAIM_ATTEMPTS};
#[cfg(feature = "directory")]
pub use current::{current_session, machine_info, session_for, session_info, set_alias, CurrentSession, MachineInfo, SessionInfo};
#[cfg(feature = "directory")]
pub use pins::{Pin, Recorded};
#[cfg(feature = "directory")]
pub use signing::{sign, verify, Signature, Verified};
#[cfg(feature = "directory")]
pub use project::{project_info, project_init, ProjectInfo, ProjectMinted};
#[cfg(feature = "provider")]
#[cfg(feature = "directory")]
pub use refusal::{Candidate, Liveness, Refusal};
#[cfg(feature = "provider")]
pub use provider::{
    IdentityProvider, IdentityRequest, ProjectAction, SessionAction, Verb, writer_answer,
    AVAILABLE_SUBCOMMANDS, IDENTITY_DESCRIPTOR, IDENTITY_OPERATION_ID, IDENTITY_READ_DESCRIPTOR,
    IDENTITY_READ_OPERATION_ID, IDENTITY_WRITE_DESCRIPTOR, IDENTITY_WRITE_OPERATION_ID,
};
pub use resolve::{
    env_identity, resolve, resolve_current, terminal_head, tree_identity, Source, WriterId, WriterIdentity, WriterKey,
    ENV_ORDER, MAX_ID_LENGTH, REGISTRY_FILE,
};
