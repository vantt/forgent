//! Bounded refusal and notice counters (spec §5.3, §9 signal 2), in two
//! tiers: per-reason totals that are never evicted, and per-party entries
//! bounded by `counters.maxKeys`, least recently bumped evicted first.
use crate::envelope::RefusalReason;
use crate::ids::WriterKey;
use crate::limits::Limits;
use crate::state::MailboxState;
use crate::time::Timestamp;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

/// The accounting identity shared by every sender with no registered head
/// (the runner, the `fgos` CLI), so a rotating `from` cannot grow a map.
/// `~` is outside the writer-key alphabet, so no head's key can take it.
pub const UNREGISTERED: &str = "~unregistered";

/// Who a sender is for every per-sender policy and counter: its key when
/// it names a binding, otherwise the shared `unregistered`. A `String`
/// newtype so it can key a snapshot map.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(transparent)]
pub struct Account(String);

impl Account {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// One variant per refusal and notice reason.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum CounterReason {
    SenderKeyTooLong,
    Group,
    UnknownName,
    AmbiguousName,
    SelfSend,
    ReplyToNotOffered,
    TooLarge,
    SessionBudget,
    LifetimeCap,
    TooDeep,
    Loop,
    QueueFull,
    SenderShareFull,
    RecordTtl,
    OfferCap,
    /// The sender of a refused message has no head or a newer generation.
    NoticeUndeliverable,
    /// A notice of the same reason reached this sender inside the window.
    NoticeSuppressed,
    /// The notices lane overflowed and lost its oldest notice.
    NoticeDropped,
    /// A claimed notice was not finished by its deadline.
    NoticeUndelivered,
    /// A notice waited past the record TTL or its generation ended.
    NoticeExpired,
}

impl CounterReason {
    pub const fn code(self) -> &'static str {
        match self {
            Self::SenderKeyTooLong => "sender-key-too-long",
            Self::Group => "group",
            Self::UnknownName => "unknown-name",
            Self::AmbiguousName => "ambiguous-name",
            Self::SelfSend => "self",
            Self::ReplyToNotOffered => "reply-to-not-offered",
            Self::TooLarge => "too-large",
            Self::SessionBudget => "session-budget",
            Self::LifetimeCap => "lifetime-cap",
            Self::TooDeep => "too-deep",
            Self::Loop => "loop",
            Self::QueueFull => "queue-full",
            Self::SenderShareFull => "sender-share-full",
            Self::RecordTtl => "record-ttl",
            Self::OfferCap => "offer-cap",
            Self::NoticeUndeliverable => "notice-undeliverable",
            Self::NoticeSuppressed => "notice-suppressed",
            Self::NoticeDropped => "notice-dropped",
            Self::NoticeUndelivered => "notice-undelivered",
            Self::NoticeExpired => "notice-expired",
        }
    }
}

impl From<RefusalReason> for CounterReason {
    fn from(reason: RefusalReason) -> Self {
        match reason {
            RefusalReason::RecordTtl => Self::RecordTtl,
            RefusalReason::OfferCap => Self::OfferCap,
        }
    }
}

/// `<reason>|<from>|<to>`, one canonical string so the snapshot's map keys
/// stay strings.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(transparent)]
pub struct PartyKey(String);

impl PartyKey {
    fn new(reason: CounterReason, from: &str, to: &str) -> Self {
        Self(format!("{}|{from}|{to}", reason.code()))
    }

    /// Whether `account` is this entry's sender or recipient.
    fn involves(&self, account: &str) -> bool {
        self.0.split('|').skip(1).any(|party| party == account)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Party {
    pub count: u64,
    pub last_at: Timestamp,
    /// The bump number of the last bump; orders eviction when times tie.
    last_bump: u64,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BoundedCounters {
    totals: BTreeMap<CounterReason, u64>,
    by_party: BTreeMap<PartyKey, Party>,
    bumps: u64,
}

impl BoundedCounters {
    pub fn new() -> Self {
        Self::default()
    }

    /// Counts one event of `reason` between the accounting identities
    /// `from` and `to`.
    pub fn bump(
        &mut self,
        reason: CounterReason,
        from: &str,
        to: &str,
        now: Timestamp,
        limits: &Limits,
    ) {
        *self.totals.entry(reason).or_insert(0) += 1;
        self.bumps += 1;
        let party = self
            .by_party
            .entry(PartyKey::new(reason, from, to))
            .or_insert(Party {
                count: 0,
                last_at: now,
                last_bump: 0,
            });
        party.count += 1;
        party.last_at = now;
        party.last_bump = self.bumps;
        while self.by_party.len() > limits.counters.max_keys as usize {
            let oldest = self
                .by_party
                .iter()
                .min_by_key(|(_, p)| p.last_bump)
                .map(|(k, _)| k.clone());
            match oldest {
                Some(key) => self.by_party.remove(&key),
                None => break,
            };
        }
    }

    /// Every reason counted so far with its total, in reason order.
    pub fn totals(&self) -> impl Iterator<Item = (CounterReason, u64)> + '_ {
        self.totals.iter().map(|(reason, count)| (*reason, *count))
    }

    pub fn total(&self, reason: CounterReason) -> u64 {
        self.totals.get(&reason).copied().unwrap_or(0)
    }

    pub fn party(&self, reason: CounterReason, from: &str, to: &str) -> Option<&Party> {
        self.by_party.get(&PartyKey::new(reason, from, to))
    }

    pub fn party_count(&self) -> usize {
        self.by_party.len()
    }

    /// Removes every per-party entry naming `account`; totals stay.
    pub(crate) fn forget(&mut self, account: &str) {
        self.by_party.retain(|key, _| !key.involves(account));
    }
}

impl MailboxState {
    pub fn counters(&self) -> &BoundedCounters {
        &self.counters
    }

    /// The accounting identity of `key`: its own key when it names a
    /// binding, otherwise the shared `unregistered`.
    pub(crate) fn account(&self, key: &WriterKey) -> Account {
        if self.bindings.contains_key(key) {
            Account(key.as_str().to_string())
        } else {
            Account(UNREGISTERED.to_string())
        }
    }

    /// Whether `key`'s accounting identity is `account`, without building
    /// one.
    pub(crate) fn is_account(&self, key: &WriterKey, account: &Account) -> bool {
        if self.bindings.contains_key(key) {
            account.0 == key.as_str()
        } else {
            account.0 == UNREGISTERED
        }
    }

    pub(crate) fn count(
        &mut self,
        reason: CounterReason,
        from: &WriterKey,
        to: &WriterKey,
        now: Timestamp,
        limits: &Limits,
    ) {
        let (from, to) = (self.account(from), self.account(to));
        self.counters
            .bump(reason, from.as_str(), to.as_str(), now, limits);
    }
}
