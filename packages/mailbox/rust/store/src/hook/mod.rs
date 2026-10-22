//! The hook kind (spec §6.1): what a checkpoint hook of a head CLI does with
//! the mailbox.
mod limits;

pub use limits::{HookLimits, StopBlockLimits};
