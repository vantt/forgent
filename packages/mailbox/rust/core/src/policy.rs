//! The refusal policies checked at `send` (spec §5.3), in the fixed order of
//! plan decision 4; the first that fails wins. A refused message is never
//! recorded, but the attempt itself is counted first, so refused attempts
//! count toward the session budget and the lifetime cap.
use crate::counters::Account;
use crate::delivery::{Refusal, SendRequest};
use crate::envelope::{Header, Kind, MessageState};
use crate::ids::{Generation, ShortName, WriterKey};
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
}

/// What a send that passed every check records.
pub(crate) struct Admitted {
    pub to: WriterKey,
    pub to_name: ShortName,
    pub to_generation: Generation,
    /// Index of the derived parent in the header list.
    pub parent: Option<usize>,
    pub depth: u32,
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

    /// Runs checks 0-10 for an attempt already counted.
    pub(crate) fn admit(
        &self,
        req: &SendRequest<'_>,
        account: &Account,
        from_generation: Option<Generation>,
        now: Timestamp,
        limits: &Limits,
    ) -> Result<Admitted, Refusal> {
        check_sender_key(&req.from, limits)?;
        let recipient = self.resolve(&req.to)?;
        self.check_reply_hint(req, &recipient.key)?;
        check_size(req, limits)?;
        self.check_budget(account, limits)?;
        self.check_lifetime(&req.from, from_generation, limits)?;
        let parent = self.derived_parent(&recipient.key, &req.from);
        let depth = parent.map_or(0, |i| self.messages[i].depth.saturating_add(1));
        check_depth(depth, limits)?;
        self.check_loop(account, &recipient.key, now, limits)?;
        self.check_queue(&recipient.key, recipient.generation, limits)?;
        self.check_share(account, &recipient.key, recipient.generation, limits)?;
        Ok(Admitted {
            to: recipient.key.clone(),
            to_name: recipient.name.clone(),
            to_generation: recipient.generation,
            parent,
            depth,
        })
    }

    /// Check 3: a hint must name a message the recipient offered to the
    /// sender. Notices live in their own lane and never qualify.
    fn check_reply_hint(&self, req: &SendRequest<'_>, to: &WriterKey) -> Result<(), Refusal> {
        let Some(hint) = &req.reply_to else {
            return Ok(());
        };
        let offered = self.messages.iter().any(|h| {
            &h.id == hint
                && h.kind == Kind::Message
                && &h.from == to
                && h.to == req.from
                && matches!(h.state, MessageState::Offered { .. })
        });
        if offered {
            Ok(())
        } else {
            Err(Refusal::ReplyToNotOffered)
        }
    }

    /// Check 5: attempts inside the rolling window, this one included.
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

    /// Check 6: a registered sender's attempts over its generation's life.
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
    /// recently offered, unanswered message from `to` to `from`.
    fn derived_parent(&self, to: &WriterKey, from: &WriterKey) -> Option<usize> {
        self.messages
            .iter()
            .enumerate()
            .filter(|(_, h)| {
                h.kind == Kind::Message && &h.from == to && &h.to == from && !h.answered
            })
            .filter_map(|(i, h)| match h.state {
                MessageState::Offered { at } => Some((at, i)),
                _ => None,
            })
            .max()
            .map(|(_, i)| i)
    }

    /// Check 8: messages from this account to `to` inside the loop window.
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
            .filter(|h| {
                h.kind == Kind::Message && &h.to == to && !now.is_past(h.recorded_at, window)
            })
            .filter(|h| &self.account(&h.from) == account)
            .count();
        if recent >= limits.loop_guard.max_per_window as usize {
            return Err(Refusal::Loop {
                max_per_window: limits.loop_guard.max_per_window,
                window_sec: window,
            });
        }
        Ok(())
    }

    /// Check 9: pending mail to the recipient's current generation.
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

    /// Check 10: this account's share of that queue.
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
            .filter(|h| &self.account(&h.from) == account)
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

/// Check 4: the body's size in UTF-8 bytes.
fn check_size(req: &SendRequest<'_>, limits: &Limits) -> Result<(), Refusal> {
    if req.body.len() as u64 > limits.max_body_bytes {
        return Err(Refusal::TooLarge {
            max_bytes: limits.max_body_bytes,
        });
    }
    Ok(())
}

/// Check 7: the derived chain depth.
fn check_depth(depth: u32, limits: &Limits) -> Result<(), Refusal> {
    if depth > limits.chain.max_depth {
        return Err(Refusal::TooDeep {
            max_depth: limits.chain.max_depth,
        });
    }
    Ok(())
}
