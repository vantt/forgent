//! The message header (spec §5.1 envelope, minus the body) and its states
//! (spec §5.2). The body lives apart from the snapshot; the core keeps only
//! its size and whether the store still holds it.
use crate::ids::{AttemptToken, Generation, MessageId, WriterKey};
use crate::time::Timestamp;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Kind {
    /// A recipient may reply.
    Message,
    /// Machine-made; never replied to, never counted by the loop guard,
    /// never wakes.
    Notice,
}

/// Why the sweep refused a message that was already recorded. Refusals at
/// `send` are answered to the sender and never stored (spec §5.3).
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum RefusalReason {
    /// Still recorded after the record TTL.
    RecordTtl,
    /// Not finished within the allowed number of offers.
    OfferCap,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case", deny_unknown_fields)]
pub enum MessageState {
    Recorded,
    InFlight {
        token: AttemptToken,
        deadline: Timestamp,
        generation: Generation,
    },
    Offered {
        at: Timestamp,
    },
    Refused {
        reason: RefusalReason,
        at: Timestamp,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Header {
    pub id: MessageId,
    /// Attribution, not authority (spec §5.1).
    pub from: WriterKey,
    /// `None` for a sender with no registered head (the runner, the CLI).
    pub from_generation: Option<Generation>,
    pub to: WriterKey,
    pub to_generation: Generation,
    /// The derived parent (spec §5.4); only this link feeds the guards.
    pub reply_to: Option<MessageId>,
    /// The caller's `--reply-to`, validated and kept for display only.
    pub reply_to_hint: Option<MessageId>,
    /// Chain depth, stored at append time so removing an ancestor never
    /// changes it.
    pub depth: u32,
    /// The sender's immutable permission to wake the recipient.
    pub wake: bool,
    /// Whether the wake takes effect; the nudge and the Stop drain read only
    /// this field.
    pub effective_wake: bool,
    pub body_bytes: u64,
    /// Whether the store still keeps the body.
    pub body_kept: bool,
    pub recorded_at: Timestamp,
    /// The time of the last state change.
    pub changed_at: Timestamp,
    pub offers: u32,
    /// Whether the recipient has replied to it (spec §5.4).
    pub answered: bool,
    pub state: MessageState,
}
