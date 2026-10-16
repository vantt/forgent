//! Holder-lock: kernel locks on open file descriptions behind one port that
//! hides the per-OS driver.
//!
//! The port (`acquire`, `release`, `run_borrowed`, `probe`, `holders`,
//! `guarantee`) lives in `port`, together with the two rules every driver
//! shares: a lock is acquired only when the domain its previous holder
//! declared is empty (`predecessor`), and a borrowing holder returns only
//! once nothing but itself holds the description. The OS drivers sit in
//! `driver`; the single state-root resolution in `state_root`; the borrow
//! vectors in `borrow_vectors`; the host's `fgos internal` routes in
//! `route`. Contracts, lock registry and shared vectors:
//! `packages/holder-lock/contracts/`.

pub mod borrow_vectors;
pub mod driver;
pub mod port;
pub mod predecessor;
pub mod route;
pub mod state_root;

pub use port::{
    acquire, borrowed_check, guarantee, holders, probe, release, run_borrowed, Acquire, BorrowError, BorrowOutcome, BorrowSpec, BorrowStdio, BorrowedCheck, Guarantee, Handle, HeldReason, HoldersList,
    Level, Mode, NotBorrowerReason, Probe, Resource, UnavailableReason, Wait, DEFAULT_KILL_WAIT_MS,
};
pub use state_root::{lock_root, state_root, Source};
