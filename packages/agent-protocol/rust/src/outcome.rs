//! Named results the adapters speak, taken from the contract's `results` table.

use std::path::PathBuf;

/// What only a person can fix before the CLI can serve a round.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BlockedReason {
    TrustDialog,
    Login,
    UsageLimit,
}

impl BlockedReason {
    /// The contract's `blocked.reason` wording.
    pub fn as_str(self) -> &'static str {
        match self {
            BlockedReason::TrustDialog => "trust-dialog",
            BlockedReason::Login => "login",
            BlockedReason::UsageLimit => "usage-limit",
        }
    }
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

/// Whether new capture output counts for the idle timer.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Activity {
    /// Nothing new, or only whitespace.
    Quiet,
    /// Text grew, plain or a JSON event line.
    Output,
}

impl Activity {
    pub fn is_active(self) -> bool {
        self == Activity::Output
    }
}

/// The exit the supervisor's exit gate reported.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ExitInfo {
    pub code: Option<i32>,
}
