//! Holder-lock: kernel locks on open file descriptions behind one port that
//! hides the per-OS driver.
//!
//! The port (`acquire`, `release`, `run_borrowed`, `probe`, `holders`,
//! `guarantee`) lives in `port`, together with the two rules every driver
//! shares: a lock is acquired only when the domain its previous holder
//! declared is empty (`predecessor`), and a borrowing holder returns only
//! once nothing but itself holds the description. The OS drivers sit in
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
pub mod port;
pub mod predecessor;
pub mod route;
pub mod semantics;
pub mod state_root;

pub use port::{
    validate, validate_quiescent, acquire, borrowed_check, guarantee, holders, probe, release, run_borrowed, run_borrowed_io, BorrowIo, BorrowIoOutcome, Acquire, BorrowError, BorrowOutcome, BorrowSpec, BorrowStdio, BorrowedCheck, Guarantee, Handle, HeldReason, HelperExe,
    HoldersList, Level, Mode, NotBorrowerReason, Probe, Resource, UnavailableReason, Wait, DEFAULT_KILL_WAIT_MS,
};
#[cfg(windows)]
pub use borrow_windows::{borrowed_check_job, LOCK_JOB_ENV};
#[doc(hidden)]
pub use port::acquire_with_trace;
pub use state_root::{lock_root, state_root, Source};
