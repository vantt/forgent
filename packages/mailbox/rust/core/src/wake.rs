//! The effective wake (spec §5.1 row `wake`, §5.3 wake quota and wake
//! lifetime cap): computed once at `send`, in the same state change that
//! records the message, so a later nudge failure never gives an allowance
//! back. A dropped wake never refuses the message.
use crate::counters::Account;
use crate::ids::{Generation, WriterKey};
use crate::limits::Limits;
use crate::state::MailboxState;
use crate::time::Timestamp;
use serde::{Deserialize, Serialize};

/// Why a send's wake did not take effect; the delivery report says so.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum WakeDrop {
    /// This exchange already spent its wake allowance.
    ExchangeQuota,
    /// The sender generation reached its wake lifetime cap to this recipient.
    LifetimeCap,
}

/// `<a>|<b>`: the two accounting identities of an exchange, sorted.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(transparent)]
pub struct ExchangeKey(String);

impl ExchangeKey {
    fn new(one: &Account, other: &Account) -> Self {
        let (a, b) = if one <= other {
            (one, other)
        } else {
            (other, one)
        };
        Self(format!("{}|{}", a.as_str(), b.as_str()))
    }
}

/// Messages between one pair while the gap between two consecutive
/// messages stays below `wake.exchangeGapSec`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Exchange {
    pub last_at: Timestamp,
    pub wakes_spent: u32,
}

/// `<from>@<generation>|<to>`: effective wakes of one sender generation to
/// one recipient; never reset, a new generation is a new key.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(transparent)]
pub struct WakeLifetimeKey(String);

impl WakeLifetimeKey {
    fn new(from: &WriterKey, generation: Generation, to: &WriterKey) -> Self {
        Self(format!(
            "{}@{}|{}",
            from.as_str(),
            generation.get(),
            to.as_str()
        ))
    }
}

/// The parties of one recorded message, as the wake rules see them.
pub(crate) struct WakeParties<'a> {
    pub account: &'a Account,
    pub to_account: &'a Account,
    pub from: &'a WriterKey,
    pub from_generation: Option<Generation>,
    pub to: &'a WriterKey,
}

impl MailboxState {
    /// Records a message in its exchange and decides whether its wake takes
    /// effect: `(effective, why dropped)`.
    pub(crate) fn effective_wake(
        &mut self,
        parties: &WakeParties<'_>,
        wake: bool,
        now: Timestamp,
        limits: &Limits,
    ) -> (bool, Option<WakeDrop>) {
        let gap = limits.wake.exchange_gap_sec;
        let exchange = self
            .exchanges
            .entry(ExchangeKey::new(parties.account, parties.to_account))
            .or_insert(Exchange {
                last_at: now,
                wakes_spent: 0,
            });
        if now >= exchange.last_at.plus_secs(gap) {
            exchange.wakes_spent = 0;
        }
        exchange.last_at = now;
        if !wake {
            return (false, None);
        }
        if exchange.wakes_spent >= limits.wake.max_per_exchange {
            return (false, Some(WakeDrop::ExchangeQuota));
        }
        // A sender with no head has no generation and is exempt (owner
        // decision Q3).
        let lifetime = parties
            .from_generation
            .map(|generation| WakeLifetimeKey::new(parties.from, generation, parties.to));
        if let Some(key) = &lifetime {
            if self.wake_lifetime.get(key).copied().unwrap_or(0) >= limits.wake.lifetime_cap {
                return (false, Some(WakeDrop::LifetimeCap));
            }
        }
        if let Some(exchange) = self
            .exchanges
            .get_mut(&ExchangeKey::new(parties.account, parties.to_account))
        {
            exchange.wakes_spent += 1;
        }
        if let Some(key) = lifetime {
            let count = self.wake_lifetime.entry(key).or_insert(0);
            *count = count.saturating_add(1);
        }
        (true, None)
    }
}
