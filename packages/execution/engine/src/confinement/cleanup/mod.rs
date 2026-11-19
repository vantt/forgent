//! Confinement cleanup: the ownership markers a private home carries, the host record beside an attempt home, the
//! removal of a home or a whole dispatch directory, the judgement of what a dead dispatch left behind, and the
//! falsification probes that prove a sandbox holds.
//!
//! Twin of `src/runner/dispatch/confinement/cleanup.mjs` and `probes/harness.mjs`; the vectors under
//! `packages/execution/contracts/confinement-cleanup/` hold both to the same answers. Process stops go through the
//! engine's one home sweeper (`transport::worker_home`, over `fgos-process`); a login that must go back to its store
//! goes through [`CredentialWriteBack`], which the credentials module implements.
//!
//! Safety rule of the whole module: a directory is removed only when it carries a marker this module recognises as
//! its own, never one it could not read, never an attempt's home (adopt's finalize step owns that), and never while
//! the dispatcher that owns it still runs.

mod agent_file;
mod error;
mod homes;
mod host;
mod marker;
mod orphans;
pub mod probes;
mod record;
mod remove;
mod resolve;

pub use agent_file::{read_agent_file, refuse_symlink};
pub use error::CleanupError;
pub use homes::CleanupHomes;
pub use host::{CleanupHost, SystemHost};
pub use marker::{
    ensure_private_dir, read_attempt_ownership_marker, read_ownership_marker,
    remove_empty_dispatch_parent, resolve_confinement_temp_root, write_ownership_marker,
    write_ownership_marker_v2, ATTEMPT_HOME_MARKER_CONTRACT, MAX_HOME_MARKER_BYTES,
    OWNERSHIP_CONTRACT, OWNERSHIP_CREATOR, OWNERSHIP_MARKER_FILE,
};
pub use orphans::{
    canonical_root, default_temp_roots, judge_confinement_orphans, list_kept_credential_homes,
    remove_confinement_orphans, settle_held_credential_homes, CredentialWriteBack, KeptHome,
    Orphans, Removed, Settled, WriteBackOutcome,
};
pub use record::{
    count_credential_keep, read_attempt_home_record, remove_attempt_home,
    write_attempt_home_record, CREDENTIAL_HOME_HELD, CREDENTIAL_HOME_KEPT,
    CREDENTIAL_KEEP_MAX_ATTEMPTS, CREDENTIAL_KEEP_MIN_INTERVAL_MS,
};
pub use remove::{
    cleanup_confinement_resource, describe_attempt_home, keep_session_transcript,
    remove_confinement_dir, Cleaned, HomeEntry, Transcript,
};
