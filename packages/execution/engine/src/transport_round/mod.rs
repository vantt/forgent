//! Transport round: the herdr round, session attempt, runtime inspection and attention view over the transport base.
//!
//! The upper half of the dispatch transport, importing `transport` and adding nothing there. The controller
//! half of an attempt (locks, envelope, supervisor start) is `fgos_run_supervisor::controller`; the Session Host
//! and Terminal Control are their own crates. Anything the assignment runner or run history owns (an attempt's
//! lease and handover, the outcome table) reaches this module through an injected port, so those modules can
//! land after it.

pub mod attention;
pub mod executor_command;
pub mod inspection;
pub mod round;
pub mod session_attempt;
