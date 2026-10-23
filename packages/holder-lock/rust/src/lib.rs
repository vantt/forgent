//! Holder-lock: kernel locks on open file descriptions behind one port that
//! hides the per-OS driver.
//!
//! The port (`acquire`, `release`, `run_borrowed`, `probe`, `holders`,
//! `guarantee`) lives in `port`, together with the two rules every driver
//! shares: a lock is acquired only when the domain its previous holder
//! declared is empty (`predecessor`), borrows drain their narrowed domain,
//! and release settles escaped description holders. The OS drivers sit in
//! `driver`; the helper roles a re-executed binary plays in `helper`; the single state-root resolution in `state_root`; the borrow
//! vectors in `borrow_vectors`; the two-process semantics probe in
//! `semantics`; the host's `fgos internal` routes in
//! `route`. Contracts, lock registry and shared vectors:
//! `packages/holder-lock/contracts/`.

#[cfg(windows)]
mod borrow_windows;
pub mod borrow_vectors;
pub mod driver;
pub mod helper;
pub mod origin;
pub mod port;
pub mod predecessor;
pub mod route;
pub mod semantics;
pub mod scope;
pub use scope::{LockScope, ScopeError};
pub mod state_root;
pub mod tombstone;

#[cfg(unix)]
pub use port::{lock_fd, release_description, LockFd, NodeLock};
#[cfg(target_os = "linux")]
pub use port::drain_borrowed_description;
pub use port::{
    validate, validate_quiescent, acquire, borrowed_check, guarantee, holders, probe, release, run_borrowed, run_borrowed_io, run_borrowed_io_watched, BorrowIo, BorrowIoOutcome, Termination, Acquire, BorrowError, BorrowOutcome, BorrowSpec, BorrowStdio, BorrowedCheck, BorrowedHandle, Guarantee, Handle, HeldReason, HelperExe,
    HoldersList, Level, Mode, NotBorrowerReason, Probe, Release, Resource, UnavailableReason, Wait, DEFAULT_KILL_WAIT_MS,
};
#[cfg(windows)]
pub use borrow_windows::{borrowed_check_job, LOCK_JOB_ENV};
#[doc(hidden)]
pub use port::acquire_with_trace;
pub use state_root::{lock_root, state_root, Source};
