//! The whole metadata snapshot of one project's mailbox (spec §6.4, minus
//! bodies). The store (V2) persists it as is; the core never sees a file.
//!
//! Snapshot rule: every field round-trips through `serde_json` from an owned
//! `String`. Collections are `BTreeMap`, `Vec` or `VecDeque`; every map key
//! is a `String` newtype or a unit-only serde enum (which `serde_json` writes
//! as a string); every enum is a serde enum and no field borrows.
//!
//! Versioning: the core owns the snapshot's shape, so it owns its version.
//! Every snapshot struct denies unknown fields, so an older core can never
//! read a newer snapshot and silently drop what it does not know (and so
//! reset a cap that is never reset). The store reads [`SnapshotVersion`]
//! first and calls [`SnapshotVersion::check`] before it reads the state.
use crate::counters::{Account, BoundedCounters};
use crate::envelope::Header;
use crate::ids::{MessageId, WriterKey};
use crate::notices::{Notice, NoticeMark};
use crate::policy::LifetimeKey;
use crate::registry::Binding;
use crate::time::Timestamp;
use crate::wake::{Exchange, ExchangeKey, WakeLifetimeKey};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, VecDeque};

/// The version of the snapshot shape this core reads and writes.
pub const SNAPSHOT_SCHEMA_VERSION: u32 = 1;

/// The version field alone, read before the whole snapshot.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct SnapshotVersion {
    pub schema_version: u32,
}

/// Why a stored snapshot cannot be used by this core.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SnapshotVersionError {
    /// Written by a newer core: the store must neither use nor overwrite it.
    Newer { found: u32, supported: u32 },
    /// Written by an older core; no migration exists yet.
    UnsupportedOlder { found: u32, supported: u32 },
}

impl SnapshotVersionError {
    pub const fn code(&self) -> &'static str {
        match self {
            Self::Newer { .. } => "snapshot-newer",
            Self::UnsupportedOlder { .. } => "snapshot-unsupported-older",
        }
    }
}

impl std::fmt::Display for SnapshotVersionError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let (found, supported) = match self {
            Self::Newer { found, supported } | Self::UnsupportedOlder { found, supported } => {
                (found, supported)
            }
        };
        write!(f, "{}: found {found}, supported {supported}", self.code())
    }
}

impl std::error::Error for SnapshotVersionError {}

impl SnapshotVersion {
    /// Accepts only the current version.
    pub const fn check(&self) -> Result<(), SnapshotVersionError> {
        let found = self.schema_version;
        let supported = SNAPSHOT_SCHEMA_VERSION;
        if found > supported {
            Err(SnapshotVersionError::Newer { found, supported })
        } else if found < supported {
            Err(SnapshotVersionError::UnsupportedOlder { found, supported })
        } else {
            Ok(())
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MailboxState {
    /// Always [`SNAPSHOT_SCHEMA_VERSION`] for a state this core made.
    schema_version: u32,
    /// The latest time any operation has seen. A wall clock that steps back
    /// is read as this time, so no window shrinks and no deadline grows.
    pub(crate) last_now: Timestamp,
    pub(crate) bindings: BTreeMap<WriterKey, Binding>,
    /// Message headers in the order they were recorded.
    pub(crate) messages: Vec<Header>,
    /// The notices lane, oldest first.
    pub(crate) notices: Vec<Notice>,
    /// When each sender last got a notice of each reason; kept apart from
    /// the lane so delivering a notice does not lift the window.
    pub(crate) notice_last: BTreeMap<NoticeMark, Timestamp>,
    pub(crate) counters: BoundedCounters,
    /// Send attempts per account inside the rolling window, at most
    /// `session.budget + 1` each.
    pub(crate) budget: BTreeMap<Account, VecDeque<Timestamp>>,
    /// Send attempts per registered sender generation; never reset.
    pub(crate) lifetime: BTreeMap<LifetimeKey, u32>,
    /// One exchange per pair of accounting identities.
    pub(crate) exchanges: BTreeMap<ExchangeKey, Exchange>,
    /// Effective wakes per registered sender generation and recipient.
    pub(crate) wake_lifetime: BTreeMap<WakeLifetimeKey, u32>,
}

impl Default for MailboxState {
    fn default() -> Self {
        Self {
            schema_version: SNAPSHOT_SCHEMA_VERSION,
            last_now: Timestamp::default(),
            bindings: BTreeMap::new(),
            messages: Vec::new(),
            notices: Vec::new(),
            notice_last: BTreeMap::new(),
            counters: BoundedCounters::default(),
            budget: BTreeMap::new(),
            lifetime: BTreeMap::new(),
            exchanges: BTreeMap::new(),
            wake_lifetime: BTreeMap::new(),
        }
    }
}

impl MailboxState {
    pub fn new() -> Self {
        Self::default()
    }

    /// The stored binding of `key`, which the store judges before `register`.
    pub fn binding(&self, key: &WriterKey) -> Option<&Binding> {
        self.bindings.get(key)
    }

    /// Every binding, ordered by key.
    pub fn bindings(&self) -> impl Iterator<Item = &Binding> {
        self.bindings.values()
    }

    /// Every message header, in the order they were recorded.
    pub fn messages(&self) -> impl Iterator<Item = &Header> {
        self.messages.iter()
    }

    pub fn message(&self, id: &MessageId) -> Option<&Header> {
        self.messages.iter().find(|h| &h.id == id)
    }

    pub fn last_now(&self) -> Timestamp {
        self.last_now
    }

    /// Moves the high-water mark forward and returns the time to use.
    pub(crate) fn advance(&mut self, now: Timestamp) -> Timestamp {
        self.last_now = self.last_now.max(now);
        self.last_now
    }
}
