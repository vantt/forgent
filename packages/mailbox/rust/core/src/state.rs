//! The whole metadata snapshot of one project's mailbox (spec §6.4, minus
//! bodies). The store (V2) persists it as is; the core never sees a file.
//!
//! Snapshot rule: every field round-trips through `serde_json` from an owned
//! `String`. Collections are `BTreeMap` or `Vec`, every map key is a `String`
//! newtype, every enum is a serde enum and no field borrows.
use crate::counters::BoundedCounters;
use crate::envelope::Header;
use crate::ids::{MessageId, WriterKey};
use crate::notices::{Notice, NoticeMark};
use crate::registry::Binding;
use crate::time::Timestamp;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct MailboxState {
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
