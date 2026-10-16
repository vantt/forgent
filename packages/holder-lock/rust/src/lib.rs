//! Holder-lock: kernel locks on open file descriptions behind one port that
//! hides the per-OS driver.
//!
//! The port (`acquire`, `release`, `run_borrowed`, `probe`, `holders`,
//! `guarantee`) lives in `port`; the OS drivers behind it in `driver`; the
//! single state-root resolution in `state_root`. Contracts, lock registry and
//! shared vectors: `packages/holder-lock/contracts/`.

/// The OS-neutral lock port and its result types.
pub mod port {}

/// Per-OS drivers behind the port.
pub mod driver {}

/// The one resolution of the fgOS state root and lock root.
pub mod state_root {}
