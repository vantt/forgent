//! Run supervisor: one process per attempt that owns the attempt after the
//! controller handed it over, the launch gate that is the process root of the
//! agent, the post-receipt step runner and the adopt door.
//!
//! Contracts: `packages/run-supervisor/contracts/`. The containment port the
//! supervisor uses lives in `fgos_process::containment`.

/// Envelope v3: reading, digest, side file.
#[cfg(feature = "supervise")]
pub mod envelope;

/// The `fgos internal gate` route: pid 1 of the attempt's process domain.
#[cfg(feature = "supervise")]
pub mod gate;

/// The `fgos internal supervise` route.
#[cfg(feature = "supervise")]
pub mod supervise;

/// Post-receipt steps and their receipts, shared by supervise and adopt.
#[cfg(feature = "supervise")]
pub mod steps;

/// The machine's worker lane pool: one held lock per running top-level worker seat.
#[cfg(feature = "supervise")]
pub mod lanes;

/// The `fgos internal adopt` route and its recovery matrix.
#[cfg(feature = "supervise")]
pub mod adopt;

/// Frames on the GO channel between supervisor and gate.
#[cfg(feature = "supervise")]
pub mod go_channel;

/// The GO channel on Windows: a named pipe.
#[cfg(windows)]
#[cfg(feature = "supervise")]
pub mod go_pipe;

/// One-time publication of a layout file by hard link.
#[cfg(feature = "supervise")]
pub mod publish;

/// Flags, exit codes and dispatch shared by the `fgos internal` routes of this crate.
#[cfg(feature = "supervise")]
pub mod route;

/// The `fgos internal attempt-step` route: hands a step to the Node payload.
#[cfg(feature = "supervise")]
pub mod attempt_step;

/// The client end of the head request socket, for a process inside a head's sandbox.
#[cfg(unix)]
#[cfg(feature = "supervise")]
pub mod head_client;

/// The head request socket of a session attempt: transport and enforcement for one granted verb.
#[cfg(unix)]
#[cfg(feature = "supervise")]
pub mod head_request;

/// The supervisor's door to terminal-control, and the `release-slot` step built on it.
#[cfg(feature = "supervise")]
pub mod terminal_slot;

/// The controller half of an attempt: what hands a run over to its supervisor. Its `lease` module (the run
/// control ledger) builds without the `supervise` feature; every other module needs it.
pub mod controller;
