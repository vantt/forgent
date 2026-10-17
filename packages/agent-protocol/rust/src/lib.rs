//! Agent protocol: one pure state machine per CLI x launch mode that names
//! what the agent did (`ready`, `blocked`, `completed`, `needs-human`, ...).
//! It never builds argv, picks a model, changes a timeout or decides a retry.
//! Contract: `packages/agent-protocol/contracts/agent-protocol.v1.json`.

/// Adapters for the `direct` (headless) launch mode.
pub mod direct;
pub mod outcome;
pub mod port;

pub use outcome::{Activity, BlockedReason, ExitInfo, Outcome, StdinPolicy};
pub use port::{AgentIo, IoError, SendInput};
