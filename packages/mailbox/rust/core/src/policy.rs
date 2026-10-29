//! The refusal policies checked at `send` (spec §5.3), in the fixed order of
//! plan decision 4; the first that fails wins. A refused message is never
//! recorded, but the attempt itself is counted first, so refused attempts
//! count toward the session budget and the lifetime cap.
use crate::counters::Account;
use crate::delivery::{Recipient, Refusal, SendRequest};
use crate::envelope::{Header, MessageState};
use crate::ids::{Cli, Generation, IdSource, MessageId, ShortName, WriterKey};
use crate::limits::Limits;
use crate::state::MailboxState;
use crate::time::Timestamp;
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;

/// `<key>@<generation>` of a registered sender: one lifetime count, never
/// reset; a new generation is a new key.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(transparent)]
pub struct LifetimeKey(String);

impl LifetimeKey {
    pub(crate) fn new(key: &WriterKey, generation: Generation) -> Self {
        Self(format!("{}@{}", key.as_str(), generation.get()))
    }

    /// Whether this count belongs to `key`, in any generation if `None`.
    pub(crate) fn is_of(&self, key: &WriterKey, generation: Option<Generation>) -> bool {
        match generation {
            Some(generation) => *self == Self::new(key, generation),
            None => self.0.split('@').next() == Some(key.as_str()),
        }
    }
}

/// A message bound for a session on another machine.
pub struct RemoteSend<'a> {
    pub from: &'a WriterKey,
    pub body_bytes: u64,
    /// The wire's own body cap; the effective cap is the smaller of this and
    /// `mailbox.maxBodyBytes`.
    pub max_body_bytes: u64,
    /// The label counters use for the recipient, for example `name@machine`.
    pub to: &'a str,
}

/// What a send that passed every check records.
pub(crate) struct Admitted {
    pub to: WriterKey,
    pub to_name: ShortName,
    pub to_generation: Generation,
    pub to_cli: Cli,
    pub to_head: String,
    /// Index of the derived parent in the header list.
    pub parent: Option<usize>,
    pub depth: u32,
}

/// Whether `header` went from `to` to `from`'s current generation.
fn offered_to(
    header: &Header,
    to: &WriterKey,
    from: &WriterKey,
    from_generation: Option<Generation>,
) -> bool {
    &header.from == to && &header.to == from && Some(header.to_generation) == from_generation
}

fn pending(header: &Header) -> bool {
    matches!(
        header.state,
        MessageState::Recorded | MessageState::InFlight { .. }
    )
}

impl MailboxState {
    /// Counts the attempt toward the rolling budget and, for a registered
    /// sender, the lifetime cap. Runs before any check.
    pub(crate) fn count_attempt(
        &mut self,
        account: &Account,
        from: &WriterKey,
        from_generation: Option<Generation>,
        now: Timestamp,
        limits: &Limits,
    ) {
        let attempts = self.budget.entry(account.clone()).or_default();
        attempts.push_back(now);
        while attempts
            .front()
            .is_some_and(|at| now.is_past(*at, limits.human.fallback_window_sec))
        {
            attempts.pop_front();
        }
        while attempts.len() > limits.session.budget as usize + 1 {
            attempts.pop_front();
        }
        if let Some(generation) = from_generation {
            let count = self
                .lifetime
                .entry(LifetimeKey::new(from, generation))
                .or_insert(0);
            *count = count.saturating_add(1);
        }
    }

    /// Admits a message that leaves this machine: counts the attempt, then
    /// checks the sender key, the body against the wire's own cap (at most
    /// `mailbox.maxBodyBytes`), the rolling budget and the lifetime cap, in
    /// the order of a local send. The message is not recorded here (its
    /// header lives on the receiving machine); a refusal bumps the counters
    /// under the label `req.to`. The attempt is counted before the caller
    /// writes the event, so a crash in between can only over-count the
    /// sender, never let a cap be passed.
    pub fn admit_remote(
        &mut self,
        req: &RemoteSend<'_>,
        now: Timestamp,
        limits: &Limits,
        ids: &mut dyn IdSource,
    ) -> Result<MessageId, Refusal> {
        self.sweep(now, limits, ids);
        let now = self.last_now;
        let account = self.account(req.from);
        let from_generation = self.binding(req.from).map(|b| b.generation);
        self.count_attempt(&account, req.from, from_generation, now, limits);
        let max_bytes = req.max_body_bytes.min(limits.max_body_bytes);
        let verdict = if req.body_bytes > max_bytes {
            Err(Refusal::TooLarge { max_bytes })
        } else {
            check_sender_key(req.from, limits)
                .and_then(|()| self.check_budget(&account, limits))
                .and_then(|()| self.check_lifetime(req.from, from_generation, limits))
        };
        match verdict {
            Ok(()) => Ok(MessageId::mint(ids)),
            Err(refusal) => {
                self.counters
                    .bump(refusal.reason(), account.as_str(), req.to, now, limits);
                Err(refusal)
            }
        }
    }

    /// Runs checks 0-11 for an attempt already counted.
    pub(crate) fn admit(
        &self,
        req: &SendRequest<'_>,
        account: &Account,
        from_generation: Option<Generation>,
        now: Timestamp,
        limits: &Limits,
    ) -> Result<Admitted, Refusal> {
        check_sender_key(&req.from, limits)?;
        let recipient = match &req.to {
            Recipient::Name(query) => self.resolve_skipping(query, &req.dead_keys)?,
            Recipient::Key(key) => self.resolve_key(key, &req.dead_keys)?,
            Recipient::Refused(refusal) => return Err(Refusal::Alias(refusal.clone())),
        };
        check_not_self(&req.from, &recipient.key)?;
        self.check_reply_hint(req, from_generation, &recipient.key)?;
        check_size(req, limits)?;
        self.check_budget(account, limits)?;
        self.check_lifetime(&req.from, from_generation, limits)?;
        let parent = self.derived_parent(&recipient.key, &req.from, from_generation, now, limits);
        let depth = parent
            .and_then(|i| self.messages.get(i))
            .map_or(0, |h| h.depth.saturating_add(1));
        check_depth(depth, limits)?;
        self.check_loop(account, &recipient.key, now, limits)?;
        self.check_queue(&recipient.key, recipient.generation, limits)?;
        self.check_share(account, &recipient.key, recipient.generation, limits)?;
        Ok(Admitted {
            to: recipient.key.clone(),
            to_name: recipient.name.clone(),
            to_generation: recipient.generation,
            to_cli: recipient.cli.clone(),
            to_head: recipient.head.clone(),
            parent,
            depth,
        })
    }

    /// Check 4: a hint must name a message the recipient offered to the
    /// sender's current generation. Notices live in their own lane and are
    /// never searched; a sender with no head was offered nothing.
    fn check_reply_hint(
        &self,
        req: &SendRequest<'_>,
        from_generation: Option<Generation>,
        to: &WriterKey,
    ) -> Result<(), Refusal> {
        let Some(hint) = &req.reply_to else {
            return Ok(());
        };
        let offered = self.messages.iter().any(|h| {
            &h.id == hint
                && offered_to(h, to, &req.from, from_generation)
                && matches!(h.state, MessageState::Offered { .. })
        });
        if offered {
            Ok(())
        } else {
            Err(Refusal::ReplyToNotOffered)
        }
    }

    /// Check 6: attempts inside the rolling window, this one included.
    fn check_budget(&self, account: &Account, limits: &Limits) -> Result<(), Refusal> {
        let attempts = self.budget.get(account).map_or(0, VecDeque::len);
        if attempts > limits.session.budget as usize {
            return Err(Refusal::SessionBudget {
                budget: limits.session.budget,
                window_sec: limits.human.fallback_window_sec,
            });
        }
        Ok(())
    }

    /// Check 7: a registered sender's attempts over its generation's life.
    /// A sender with no head is exempt (owner question Q3, provisional).
    fn check_lifetime(
        &self,
        from: &WriterKey,
        from_generation: Option<Generation>,
        limits: &Limits,
    ) -> Result<(), Refusal> {
        let Some(generation) = from_generation else {
            return Ok(());
        };
        let attempts = self
            .lifetime
            .get(&LifetimeKey::new(from, generation))
            .copied()
            .unwrap_or(0);
        if attempts > limits.session.lifetime_cap {
            return Err(Refusal::LifetimeCap {
                cap: limits.session.lifetime_cap,
            });
        }
        Ok(())
    }

    /// The parent of a send from `from` to `to` (spec §5.4): the most
    /// recently offered, unanswered message from `to` to `from`'s current
    /// generation, offered no longer than `loop.windowSec` ago. A new
    /// process of the sender inherits no chain, and an old offer starts a
    /// new topic instead of extending a capped chain.
    fn derived_parent(
        &self,
        to: &WriterKey,
        from: &WriterKey,
        from_generation: Option<Generation>,
        now: Timestamp,
        limits: &Limits,
    ) -> Option<usize> {
        self.messages
            .iter()
            .enumerate()
            .filter(|(_, h)| offered_to(h, to, from, from_generation) && !h.answered)
            .filter_map(|(i, h)| match h.state {
                MessageState::Offered { at } if !now.is_past(at, limits.loop_guard.window_sec) => {
                    Some((at, i))
                }
                _ => None,
            })
            .max()
            .map(|(_, i)| i)
    }

    /// Check 9: messages from this account to `to` inside the loop window.
    fn check_loop(
        &self,
        account: &Account,
        to: &WriterKey,
        now: Timestamp,
        limits: &Limits,
    ) -> Result<(), Refusal> {
        let window = limits.loop_guard.window_sec;
        let recent = self
            .messages
            .iter()
            .filter(|h| &h.to == to && !now.is_past(h.recorded_at, window))
            .filter(|h| self.is_account(&h.from, account))
            .count();
        if recent >= limits.loop_guard.max_per_window as usize {
            return Err(Refusal::Loop {
                max_per_window: limits.loop_guard.max_per_window,
                window_sec: window,
            });
        }
        Ok(())
    }

    /// Check 10: pending mail to the recipient's current generation.
    fn check_queue(
        &self,
        to: &WriterKey,
        generation: Generation,
        limits: &Limits,
    ) -> Result<(), Refusal> {
        let queued = self
            .messages
            .iter()
            .filter(|h| &h.to == to && h.to_generation == generation && pending(h))
            .count();
        if queued >= limits.queue.cap as usize {
            return Err(Refusal::QueueFull {
                cap: limits.queue.cap,
            });
        }
        Ok(())
    }

    /// Check 11: this account's share of that queue.
    fn check_share(
        &self,
        account: &Account,
        to: &WriterKey,
        generation: Generation,
        limits: &Limits,
    ) -> Result<(), Refusal> {
        let held = self
            .messages
            .iter()
            .filter(|h| &h.to == to && h.to_generation == generation && pending(h))
            .filter(|h| self.is_account(&h.from, account))
            .count();
        if held >= limits.queue.per_sender as usize {
            return Err(Refusal::SenderShareFull {
                per_sender: limits.queue.per_sender,
            });
        }
        Ok(())
    }
}

/// Check 0: the sender's key fits the header bound, so no unbounded text
/// reaches a header or the snapshot.
fn check_sender_key(from: &WriterKey, limits: &Limits) -> Result<(), Refusal> {
    let max_chars = limits.frame.max_header_chars;
    if from.as_str().chars().count() > max_chars as usize {
        return Err(Refusal::SenderKeyTooLong { max_chars });
    }
    Ok(())
}

/// Check 3: a head does not mail itself.
fn check_not_self(from: &WriterKey, to: &WriterKey) -> Result<(), Refusal> {
    if from == to {
        return Err(Refusal::SelfSend);
    }
    Ok(())
}

/// Check 5: the body's size in UTF-8 bytes.
fn check_size(req: &SendRequest<'_>, limits: &Limits) -> Result<(), Refusal> {
    if req.body.len() as u64 > limits.max_body_bytes {
        return Err(Refusal::TooLarge {
            max_bytes: limits.max_body_bytes,
        });
    }
    Ok(())
}

/// Check 8: the derived chain depth.
fn check_depth(depth: u32, limits: &Limits) -> Result<(), Refusal> {
    if depth > limits.chain.max_depth {
        return Err(Refusal::TooDeep {
            max_depth: limits.chain.max_depth,
        });
    }
    Ok(())
}
