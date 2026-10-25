//! The answer of every door that can say no with a reason a caller can act on.

use crate::pins::PinState;
use crate::shared::MachineRef;
use serde::Serialize;

/// What is known of a session's liveness: `alive` when its head process is
/// proven running, `unknown` when nothing can prove it dead, `remote` for a
/// session of another machine, which is never claimed alive.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Liveness {
    Alive,
    Unknown,
    Remote,
}

/// Where a remote session comes from and how far to trust it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Remote {
    pub machine: MachineRef,
    /// When this clone last fetched the other machines' events; `None` when never.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fetched_at: Option<String>,
    /// The pin of the publishing machine's key: `seen` or `confirmed`.
    pub pin: PinState,
}

/// A session a refusal points at, as the caller can resolve it again.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Candidate {
    /// `<machine-id>/<local id>`.
    pub id: String,
    pub handle: String,
    pub liveness: Liveness,
    /// Set only for a session of another machine (flattened into the object).
    #[serde(flatten, skip_serializing_if = "Option::is_none")]
    pub remote: Option<Remote>,
}

/// The answer is a refusal, not a result: the CLI prints `detail` and exits
/// with [`Refusal::EXIT`].
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Refusal {
    pub reason: &'static str,
    pub detail: String,
    /// The sessions the caller may have meant (`not-found`), the sessions the
    /// name matches (`ambiguous`) or the sessions holding the role
    /// (`role-not-held`); empty for every other refusal.
    pub candidates: Vec<Candidate>,
}

impl Refusal {
    pub const EXIT: i32 = 65;
}
