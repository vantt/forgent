//! The hook kind (spec §6.1): what a checkpoint hook of a head CLI does with
//! the mailbox.
#![deny(clippy::unwrap_used, clippy::expect_used, clippy::panic)]
#[cfg(unix)]
pub mod breaker;
pub mod outcome_log;
mod drain;
mod limits;
#[cfg(unix)]
pub mod resolve;
#[cfg(unix)]
pub mod shell;

pub use drain::{
    begin, finish, render_reply, Begun, Claimed, FinishTicket, HeadFacts, HookCall, HookReply,
    PointerOnly, QuietReason,
};
pub(crate) use drain::{claim_inbox, InboxClaim};
pub use limits::{BreakerLimits, HookCallLimits, HookLimits, StopBlockLimits};

use fgos_mailbox_core::Cli;

/// The checkpoint a hook call reports, from the entry's `--event` option.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HookEvent {
    Stop,
    PostToolUse,
}

impl HookEvent {
    /// The entry's `--event stop|post-tool-use` value.
    pub fn from_flag(flag: &str) -> Option<Self> {
        match flag {
            "stop" => Some(Self::Stop),
            "post-tool-use" => Some(Self::PostToolUse),
            _ => None,
        }
    }
}

/// The CLI whose hook calls the entry. The entry is told which one; the
/// drain never guesses it from the payload.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Adapter {
    Claude,
    Codex,
    Agy,
}

impl Adapter {
    /// The word used in the short name (spec §5.1.1) and in the adapters
    /// contract.
    pub const fn word(self) -> &'static str {
        match self {
            Self::Claude => "claude",
            Self::Codex => "codex",
            Self::Agy => "agy",
        }
    }

    /// Whether this CLI's session id is also its native thread handle
    /// (Codex: the id `codex queue --thread` takes).
    pub const fn session_is_handle(self) -> bool {
        matches!(self, Self::Codex)
    }

    /// The core's CLI value of [`Adapter::word`].
    pub fn cli(self) -> Option<Cli> {
        Cli::new(self.word()).ok()
    }
}

/// The facts the drain reads from one hook payload.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Payload {
    pub event: HookEvent,
    /// The event may belong to a subagent, not the head: the drain then
    /// touches nothing.
    pub subordinate: bool,
    /// At a Stop, whether it is the first Stop of its turn; `None` at
    /// `PostToolUse` or when the payload does not say.
    pub first_stop: Option<bool>,
    /// The session the payload names (`session_id`), when the CLI names
    /// one; the drain stays quiet when it is not the caller's writer key.
    pub session: Option<String>,
}

/// Why a payload gives no facts.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Unparsed {
    /// Not a JSON object.
    Malformed,
    /// The payload is of another event than the entry was told.
    EventMismatch,
}
