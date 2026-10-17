//! Run supervisor: one process per attempt that owns the attempt after the
//! controller handed it over, the launch gate that is the process root of the
//! agent, the post-receipt step runner and the adopt door.
//!
//! Contracts: `packages/run-supervisor/contracts/`. The containment port the
//! supervisor uses lives in `fgos_process::containment`.

/// Envelope v3: reading, digest, side file.
pub mod envelope;

/// The `fgos internal gate` route: pid 1 of the attempt's process domain.
pub mod gate;

/// The `fgos internal supervise` route.
pub mod supervise;

/// Post-receipt steps and their receipts, shared by supervise and adopt.
pub mod steps;

/// The `fgos internal adopt` route and its recovery matrix.
pub mod adopt;

/// Frames on the GO channel between supervisor and gate.
pub mod go_channel;

/// One-time publication of a layout file by hard link.
pub mod publish;
