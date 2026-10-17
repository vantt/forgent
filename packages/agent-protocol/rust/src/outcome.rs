//! Named results the adapters speak, taken from the contract's `results` table.

use std::path::PathBuf;

/// What only a person can fix before the CLI can serve a round.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BlockedReason {
    TrustDialog,
    Login,
    UsageLimit,
}

/// How a `direct` run ended, named for the supervisor.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Outcome {
    /// The agent finished and `outbox/result-<N>.json` exists.
    Completed {
        result_path: PathBuf,
    },
    /// The agent asked something only a person can answer.
    NeedsHuman,
    Blocked(BlockedReason),
    /// The agent process exited without a result file.
    Exited {
        code: Option<i32>,
    },
}

/// What the supervisor wires to the agent's stdin at spawn.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StdinPolicy {
    /// Closed device: a CLI that probes piped stdin must not block on an open pipe.
    NullDevice,
    /// The brief file is attached as stdin.
    BriefFile,
}

/// Whether new capture output counts for the idle timer.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Activity {
    /// Nothing new, or only whitespace.
    Quiet,
    /// Plain text grew.
    Output,
    /// A JSON event line arrived (CLIs that stream events).
    Event,
}

impl Activity {
    pub fn is_active(self) -> bool {
        !matches!(self, Activity::Quiet)
    }
}

/// The exit the supervisor's exit gate reported.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ExitInfo {
    pub code: Option<i32>,
}
