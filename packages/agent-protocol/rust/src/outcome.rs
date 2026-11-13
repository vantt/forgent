//! Named results the adapters speak, taken from the contract's `results` table.

use std::path::PathBuf;

/// What stops the CLI from serving a round: something only a person can fix, or a provider that
/// refused the round (a used-up quota, or an API error such as a 404 for the model).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BlockedReason {
    TrustDialog,
    Login,
    UsageLimit,
    ProviderError,
}

impl BlockedReason {
    /// The contract's `blocked.reason` wording.
    pub fn as_str(self) -> &'static str {
        match self {
            BlockedReason::TrustDialog => "trust-dialog",
            BlockedReason::Login => "login",
            BlockedReason::UsageLimit => "usage-limit",
            BlockedReason::ProviderError => "provider-error",
        }
    }
}

/// What the provider itself said when it refused a round, as far as the CLI's last words show it.
/// Every field is optional; a signal with none set is never built (`provider_signal` gives `None`).
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct ProviderSignal {
    /// HTTP status, 100-599.
    pub status: Option<u16>,
    /// The error body's own status word, `[A-Z_]{1,64}` (`RESOURCE_EXHAUSTED`).
    pub status_word: Option<String>,
    /// How long the provider asked the client to wait, in milliseconds.
    pub requested_wait_ms: Option<u64>,
    /// The CLI's own reset phrase, at most `RESET_HINT_MAX` characters.
    pub reset_hint: Option<String>,
}

/// Longest reset phrase a signal keeps.
pub const RESET_HINT_MAX: usize = 80;

impl ProviderSignal {
    pub fn is_empty(&self) -> bool {
        *self == ProviderSignal::default()
    }

    /// The wire form: camelCase keys, a field that was not found left out.
    pub fn to_json(&self) -> serde_json::Value {
        let mut map = serde_json::Map::new();
        if let Some(status) = self.status {
            map.insert("status".into(), status.into());
        }
        if let Some(word) = &self.status_word {
            map.insert("statusWord".into(), word.clone().into());
        }
        if let Some(wait) = self.requested_wait_ms {
            map.insert("requestedWaitMs".into(), wait.into());
        }
        if let Some(hint) = &self.reset_hint {
            map.insert("resetHint".into(), hint.clone().into());
        }
        serde_json::Value::Object(map)
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

impl Outcome {
    /// The receipt's `reason` for a direct run the provider stopped; `None` for any other end.
    pub fn receipt_reason(&self) -> Option<String> {
        match self {
            Outcome::Blocked(reason) => Some(format!("direct:blocked:{}", reason.as_str())),
            Outcome::Completed { .. } | Outcome::NeedsHuman | Outcome::Exited { .. } => None,
        }
    }
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
