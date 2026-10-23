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

mod counters;
mod delivery;
mod envelope;
mod forget;
mod frame;
mod ids;
mod limits;
mod names;
mod notices;
mod policy;
mod registry;
mod report;
mod state;
mod sweep;
mod time;
mod wake;

pub use counters::{Account, BoundedCounters, CounterReason, Party, PartyKey, UNREGISTERED};
pub use delivery::{
    AliasCandidate, AliasRefusal, Checkpoint, Claim, ClaimedItem, ClaimedWhat, Finished, MailFrom,
    MessageView, NoticeFacts, Refusal, SendOutcome, SendRequest,
};
pub use envelope::{Header, Kind, MessageState, RefusalReason};
pub use frame::{
    frame_sections, pointer_reserve, render, too_large_pointer, worst_case_len, FRAME_SEPARATOR,
};
pub use ids::{
    AttemptToken, Cli, Generation, IdSource, InvalidValue, MessageId, ShortName, WriterKey,
};
pub use limits::{
    ChainLimits, CounterLimits, FrameLimits, HumanLimits, Limits, LoopLimits, NoticeLimits,
    QueueLimits, RecordLimits, SessionLimits, WakeLimits,
};
pub use names::ResolveRefusal;
pub use notices::{Notice, NoticeMark, NoticeState};
pub use policy::LifetimeKey;
pub use registry::{Binding, Liveness, RegisterRefusal, RegisterRequest, Registered, StoredHead};
pub use report::{
    delivery_report, inbox_text, list_text, record_error_text, record_unavailable_text,
    refusal_text, role_holder_text, ListRow, VersionClause,
};
pub use state::{MailboxState, SnapshotVersion, SnapshotVersionError, SNAPSHOT_SCHEMA_VERSION};
pub use time::Timestamp;
pub use wake::{Exchange, ExchangeKey, WakeDrop, WakeLifetimeKey};
