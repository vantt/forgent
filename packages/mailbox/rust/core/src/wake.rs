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
    /// The recipient's CLI takes no mail when its turn ends, so no channel
    /// can wake it; no allowance was spent.
    NoChannel,
}

/// `<a>|<b>`: the two accounting identities of an exchange, sorted.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(transparent)]
pub struct ExchangeKey(String);

impl ExchangeKey {
    /// Whether `account` is one of the exchange's two parties.
    pub(crate) fn involves(&self, account: &str) -> bool {
        self.0.split('|').any(|party| party == account)
    }

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
    /// Whether this count belongs to `key` as its sender, in `generation`
    /// or in any if `None`. A count toward `key` belongs to its sender.
    pub(crate) fn is_from(&self, key: &WriterKey, generation: Option<Generation>) -> bool {
        let Some((sender, _)) = self.0.split_once('|') else {
            return false;
        };
        let (from, from_generation) = sender.split_once('@').unwrap_or((sender, ""));
        from == key.as_str() && generation.is_none_or(|g| from_generation == g.get().to_string())
    }

    fn new(from: &WriterKey, generation: Generation, to: &WriterKey) -> Self {
        Self(format!(
            "{}@{}|{}",
            from.as_str(),
            generation.get(),
            to.as_str()
        ))
    }

    /// `~<machine>/<session>|<to>`: effective wakes of one verified sender on
    /// another machine to one recipient. The leading `~` is the remote
    /// account prefix, which no local key has, so no local head's records
    /// ever match it.
    fn remote(machine: &str, from: &WriterKey, to: &WriterKey) -> Self {
        Self(format!("~{machine}/{}|{}", from.as_str(), to.as_str()))
    }
}

/// Who sent a message, as far as its wake budget goes.
pub(crate) enum WakeSender<'a> {
    /// A head of this record; `generation` is `None` for the shared sender
    /// with no head, which no lifetime cap brakes (owner decision Q3).
    Head {
        from: &'a WriterKey,
        generation: Option<Generation>,
    },
    /// A verified session on another machine. It has no generation here, and
    /// it is never exempt: its own cap is `wake.remoteLifetimeCap`.
    Remote {
        machine: &'a str,
        from: &'a WriterKey,
    },
}

/// The parties of one recorded message, as the wake rules see them.
pub(crate) struct WakeParties<'a> {
    pub account: &'a Account,
    pub to_account: &'a Account,
    pub sender: WakeSender<'a>,
    pub to: &'a WriterKey,
    /// Whether the recipient's CLI has a channel a wake can use: it takes
    /// mail at its `Stop`, or its idle head can be nudged.
    pub to_wake_channel: bool,
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
        // Checked before any allowance: the exchange quota is per pair, so
        // spending it toward a recipient with no wake channel would drop the
        // other side's real wakes.
        if !parties.to_wake_channel {
            return (false, Some(WakeDrop::NoChannel));
        }
        if exchange.wakes_spent >= limits.wake.max_per_exchange {
            return (false, Some(WakeDrop::ExchangeQuota));
        }
        let lifetime = match parties.sender {
            WakeSender::Head {
                from,
                generation: Some(generation),
            } => Some((
                WakeLifetimeKey::new(from, generation, parties.to),
                limits.wake.lifetime_cap,
            )),
            // A sender with no head has no generation and is exempt (owner
            // decision Q3).
            WakeSender::Head { generation: None, .. } => None,
            WakeSender::Remote { machine, from } => Some((
                WakeLifetimeKey::remote(machine, from, parties.to),
                limits.wake.remote_lifetime_cap,
            )),
        };
        if let Some((key, cap)) = &lifetime {
            if self.wake_lifetime.get(key).copied().unwrap_or(0) >= *cap {
                return (false, Some(WakeDrop::LifetimeCap));
            }
        }
        if let Some(exchange) = self
            .exchanges
            .get_mut(&ExchangeKey::new(parties.account, parties.to_account))
        {
            exchange.wakes_spent += 1;
        }
        if let Some((key, _)) = lifetime {
            let count = self.wake_lifetime.entry(key).or_insert(0);
            *count = count.saturating_add(1);
        }
        (true, None)
    }
}
