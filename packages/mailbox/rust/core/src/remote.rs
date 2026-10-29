//! Mail that came from another machine and was already verified by the host
//! (its signature, the signer's pinned machine, the age, the recipient's
//! published id): the core only decides whether this record takes it, under
//! the caps the same-machine mailbox has, applied to each verified sender on
//! its own (`remote.v1.json`, `perSenderCaps`). A taken message becomes a
//! header like any other, marked with its [`Origin`]; it never wakes, never
//! has a parent, and a refusal of it reaches its sender through the Event
//! Store, not as a local notice (the sender has no head here).
use crate::counters::remote_account;
use crate::counters::CounterReason;
use crate::delivery::Refusal;
use crate::envelope::{Header, MessageState, Origin};
use crate::frame;
use crate::ids::{IdSource, MessageId, WriterKey};
use crate::limits::Limits;
use crate::policy::{check_sender_key, LifetimeKey};
use crate::state::MailboxState;
use crate::time::Timestamp;
use std::collections::{BTreeMap, BTreeSet};

/// How long past the header horizon a taken message's id is remembered, so
/// a replay inside the acceptance window (the ingest's maximum age plus its
/// clock tolerance) is still recognised.
const SEEN_MARGIN_SEC: u64 = 3600;

/// One verified message from another machine.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RemoteMail<'a> {
    /// The signer's machine id.
    pub machine: &'a str,
    /// The message id its machine gave it.
    pub id: &'a str,
    /// The sender's session id on its own machine: the part of its full
    /// session id after `<machine>/`, which the host checked against `machine`.
    pub from: &'a WriterKey,
    /// The sender's Identity handle, for the frame; used only when it fits
    /// the frame's label rule.
    pub handle: Option<&'a str>,
    /// The key of the head of this record the mail is for.
    pub to: &'a WriterKey,
    pub body: &'a str,
    /// The wire's own body cap; the effective cap is the smaller of this and
    /// `mailbox.maxBodyBytes`.
    pub max_body_bytes: u64,
}

/// A message from another machine the host dropped before the core saw it:
/// the reason, and the signer machine it claimed (for the counters' party).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RemoteDrop<'a> {
    pub reason: CounterReason,
    pub machine: &'a str,
}

/// What a message from another machine came to, for its sender.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Settlement {
    /// The recipient's head was offered it.
    Offered,
    /// Refused after it was recorded (it expired, or was offered too often),
    /// with the refusal's code.
    Refused(&'static str),
}

/// A recorded message from another machine whose sender was not told yet.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Unsettled {
    pub id: MessageId,
    pub origin: Origin,
    pub settlement: Settlement,
}

/// What ingest did with one message.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Ingested {
    /// Recorded here under this local id.
    Recorded(MessageId),
    /// Already taken or refused before; nothing changed.
    Duplicate,
}

fn seen_key(machine: &str, id: &str) -> String {
    format!("{machine}\n{id}")
}

/// A handle fit for a frame header: the alphabet of Identity handles, at most
/// `frame.maxHeaderChars` characters.
fn usable_handle(handle: &str, limits: &Limits) -> bool {
    !handle.is_empty()
        && handle.chars().count() <= limits.frame.max_header_chars as usize
        && handle
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.' | '@' | ':'))
}

impl MailboxState {
    /// Whether the first ingest already took its baseline.
    pub fn remote_baselined(&self) -> bool {
        self.remote.baselined
    }

    /// The highest sequence taken from each store origin.
    pub fn remote_cursor(&self) -> &BTreeMap<String, u64> {
        &self.remote.cursor
    }

    /// Moves the ingest cursor forward to `cursor` (never back) and marks the
    /// baseline taken. Returns whether anything changed.
    pub fn advance_remote_cursor(&mut self, cursor: &BTreeMap<String, u64>) -> bool {
        let mut changed = !self.remote.baselined;
        self.remote.baselined = true;
        for (origin, seq) in cursor {
            let held = self.remote.cursor.entry(origin.clone()).or_insert(0);
            if seq > held {
                *held = *seq;
                changed = true;
            }
        }
        changed
    }

    /// Counts a message from another machine the host dropped.
    pub fn count_remote_drop(&mut self, drop: &RemoteDrop<'_>, now: Timestamp, limits: &Limits) {
        let now = self.advance(now);
        let from = format!("~{}", drop.machine);
        self.counters
            .bump(drop.reason, &from, "~remote", now, limits);
    }

    /// Takes one verified message from another machine, or refuses it. A
    /// refused message is remembered like a taken one, so it is never judged
    /// twice; a refusal bumps the counters. `dead` holds the heads the store
    /// judged dead, as for a send.
    pub fn ingest_remote(
        &mut self,
        mail: &RemoteMail<'_>,
        dead: &BTreeSet<WriterKey>,
        now: Timestamp,
        limits: &Limits,
        ids: &mut dyn IdSource,
    ) -> Result<Ingested, Refusal> {
        self.sweep(now, limits, ids);
        let now = self.last_now;
        let seen = seen_key(mail.machine, mail.id);
        if self.remote.seen.contains_key(&seen) {
            return Ok(Ingested::Duplicate);
        }
        self.remote.seen.insert(seen, now);
        let account = remote_account(mail.machine, mail.from);
        self.count_attempt_for(
            &account,
            Some(LifetimeKey::remote(mail.machine, mail.from)),
            now,
            limits,
        );
        let max_bytes = mail.max_body_bytes.min(limits.max_body_bytes);
        let recorded = (|| {
            check_sender_key(mail.from, limits)?;
            if mail.body.len() as u64 > max_bytes {
                return Err(Refusal::TooLarge { max_bytes });
            }
            self.check_budget(&account, limits)?;
            self.check_lifetime_key(&LifetimeKey::remote(mail.machine, mail.from), limits)?;
            let recipient = self.resolve_key(mail.to, dead)?;
            let (to, generation) = (recipient.key.clone(), recipient.generation);
            self.check_loop(&account, &to, now, limits)?;
            self.check_queue(&to, generation, limits)?;
            self.check_share(&account, &to, generation, limits)?;
            Ok((to, generation))
        })();
        let (to, to_generation) = match recorded {
            Ok(found) => found,
            Err(refusal) => {
                let to = self.account(mail.to);
                self.counters
                    .bump(refusal.reason(), account.as_str(), to.as_str(), now, limits);
                return Err(refusal);
            }
        };
        let id = MessageId::mint(ids);
        self.messages.push(Header {
            id: id.clone(),
            from: mail.from.clone(),
            from_generation: None,
            to,
            to_generation,
            reply_to: None,
            reply_to_hint: None,
            depth: 0,
            wake: false,
            effective_wake: false,
            body_bytes: mail.body.len() as u64,
            body_rendered_bytes: Some(frame::rendered_body_len(mail.body)),
            body_kept: true,
            recorded_at: now,
            changed_at: now,
            offers: 0,
            answered: false,
            state: MessageState::Recorded,
            origin: Some(Origin {
                machine: mail.machine.to_string(),
                id: mail.id.to_string(),
                handle: mail
                    .handle
                    .filter(|h| usable_handle(h, limits))
                    .map(str::to_string),
                settled: false,
            }),
        });
        Ok(Ingested::Recorded(id))
    }

    /// The messages from other machines that were offered or refused since
    /// their sender was last told, oldest first.
    pub fn unsettled_remote(&self) -> Vec<Unsettled> {
        self.messages
            .iter()
            .filter_map(|header| {
                let origin = header.origin.as_ref().filter(|origin| !origin.settled)?;
                let settlement = match &header.state {
                    MessageState::Offered { .. } => Settlement::Offered,
                    MessageState::Refused { reason, .. } => {
                        Settlement::Refused(CounterReason::from(*reason).code())
                    }
                    _ => return None,
                };
                Some(Unsettled {
                    id: header.id.clone(),
                    origin: origin.clone(),
                    settlement,
                })
            })
            .collect()
    }

    /// Keeps a refusal of a message that never became a header until its
    /// sender is told; the oldest are dropped past the counters' key bound.
    pub fn queue_remote_refusal(&mut self, id: &str, code: &str, limits: &Limits) {
        self.remote.refusals.push(crate::state::RemoteRefusal {
            id: id.to_string(),
            code: code.to_string(),
        });
        let cap = limits.counters.max_keys as usize;
        if self.remote.refusals.len() > cap {
            let excess = self.remote.refusals.len() - cap;
            self.remote.refusals.drain(..excess);
        }
    }

    /// The refusals whose senders were not told yet, oldest first.
    pub fn pending_remote_refusals(&self) -> &[crate::state::RemoteRefusal] {
        &self.remote.refusals
    }

    /// Forgets the refusals of the messages `ids`, whose senders were told.
    /// Returns whether anything changed.
    pub fn clear_remote_refusals(&mut self, ids: &[String]) -> bool {
        let before = self.remote.refusals.len();
        self.remote.refusals.retain(|r| !ids.contains(&r.id));
        self.remote.refusals.len() != before
    }

    /// Marks the sender of each of `ids` as told. Returns whether anything changed.
    pub fn mark_remote_settled(&mut self, ids: &[MessageId]) -> bool {
        let mut changed = false;
        for header in &mut self.messages {
            if let Some(origin) = header.origin.as_mut() {
                if !origin.settled && ids.contains(&header.id) {
                    origin.settled = true;
                    changed = true;
                }
            }
        }
        changed
    }

    /// Forgets the ids of taken messages past the ingest horizon, and the
    /// oldest ones past the counters' key bound.
    pub(crate) fn forget_old_remote(&mut self, now: Timestamp, limits: &Limits) {
        let horizon = limits.header_horizon_sec().saturating_add(SEEN_MARGIN_SEC);
        self.remote.seen.retain(|_, at| !now.is_past(*at, horizon));
        let cap = limits.counters.max_keys as usize;
        while self.remote.seen.len() > cap {
            let oldest = self
                .remote
                .seen
                .iter()
                .min_by_key(|(_, at)| **at)
                .map(|(key, _)| key.clone());
            match oldest {
                Some(key) => self.remote.seen.remove(&key),
                None => break,
            };
        }
    }
}
