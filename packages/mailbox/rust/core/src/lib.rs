//! Mailbox core: the policy logic of the agent mailbox, with no file, no
//! clock, no process and no CLI (docs/platform/agent-mailbox/spec.md §4).
//!
//! Purity rule (spec §4 rule 3): the core takes the current time and an id
//! source as parameters and performs no I/O. Cargo holds rule 1 (the only
//! dependency is serde). The crate-local `clippy.toml` narrows rule 3 to a
//! list of forbidden entry points; review still owns the rule.
//!
//! Authority: the spec above for behaviour, and
//! `packages/mailbox/contracts/limits.v1.json` for every number.
#![forbid(unsafe_code)]
#![deny(clippy::print_stdout, clippy::print_stderr)]

mod delivery;
mod envelope;
mod ids;
mod limits;
mod names;
mod registry;
mod state;
mod sweep;
mod time;

pub use delivery::{
    Checkpoint, Claim, ClaimedItem, Finished, MessageView, Refusal, SendOutcome, SendRequest,
};
pub use envelope::{Header, Kind, MessageState, RefusalReason};
pub use ids::{
    AttemptToken, Cli, Generation, IdSource, InvalidValue, MessageId, ShortName, WriterKey,
};
pub use limits::{
    ChainLimits, CounterLimits, FrameLimits, HumanLimits, Limits, LoopLimits, NoticeLimits,
    QueueLimits, RecordLimits, SessionLimits, WakeLimits,
};
pub use names::ResolveRefusal;
pub use registry::{Binding, Liveness, RegisterRefusal, RegisterRequest, Registered, StoredHead};
pub use state::MailboxState;
pub use time::Timestamp;
