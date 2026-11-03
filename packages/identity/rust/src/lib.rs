//! Identity (local session writer id): the single authority for "who is the writer of the
//! calling process, and how far can that id be trusted".
//!
//! The rule lives in [`resolve`]; the OS is reached only through the
//! [`ProcessTree`] port, so the rule is tested against fake process tables
//! and the real `/proc` adapter stays a thin driver. Contract and shared
//! vectors: `packages/identity/contracts/`.

pub mod attempt;
pub mod cli_dirs;
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
pub mod shared;
#[cfg(feature = "directory")]
pub mod signing;
pub mod text;

pub use attempt::{
    is_attempt_writer_id, mint_attempt_writer_id, InvalidAttemptId, ATTEMPT_PREFIX,
    MAX_ATTEMPT_ID_LENGTH,
};
#[cfg(feature = "directory")]
pub use current::{
    current_session, machine_info, session_for, session_info, set_alias, CurrentSession,
    MachineInfo, SessionInfo,
};
pub use errors::Error;
pub use launcher::{scrub_and_set, EmptyWriterId};
#[cfg(feature = "directory")]
pub use mint::{claim_counter, claim_sequence, release_sequence, Claim, MAX_CLAIM_ATTEMPTS};
pub use mint::{random, Kind, RandomKind, SequenceKind, KIND_NAMES, RANDOM_CHARS};
#[cfg(feature = "directory")]
pub use pins::{Pin, PinState, Recorded};
pub use proc_tree::{os_process_tree, ProcStat, ProcessTree};
#[cfg(feature = "directory")]
pub use project::{project_info, project_init, ProjectInfo, ProjectMinted};
#[cfg(feature = "provider")]
pub use provider::{
    writer_answer, IdentityProvider, IdentityRequest, PinsAction, ProjectAction, SessionAction,
    Verb, AVAILABLE_SUBCOMMANDS, IDENTITY_DESCRIPTOR, IDENTITY_OPERATION_ID,
    IDENTITY_READ_DESCRIPTOR, IDENTITY_READ_OPERATION_ID, IDENTITY_WRITE_DESCRIPTOR,
    IDENTITY_WRITE_OPERATION_ID,
};
#[cfg(feature = "provider")]
#[cfg(feature = "directory")]
pub use refusal::{Candidate, Liveness, Refusal};
pub use resolve::{
    env_identity, pi_family_cli, resolve, resolve_current, terminal_head, tree_identity, HeadRef,
    Source, WriterId, WriterIdentity, WriterKey, ENV_ORDER, MAX_ID_LENGTH, PI_SESSION_VAR,
    REGISTRY_FILE,
};
#[cfg(feature = "directory")]
pub use shared::{EntryLog, LogDoor, MachineRef, RawEvent, SharedView};
#[cfg(feature = "directory")]
pub use signing::{sign, verify, Signature, Verified};
