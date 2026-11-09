//! Acknowledgement requests (`send --need-ack`): the sender's watch on a
//! flagged message. Acknowledged is the recipient having replied: the reply
//! (derived, or naming the message with `--reply-to`) marks the watch.
//!
//! Two stages, one reply-by. A recipient session sees mail only when it next
//! runs a tool, so a deadline counted from the send alone would blame a
//! recipient that was never offered the message. The watch is therefore due
//! at `sent + reply-by`; when the message was not offered by then the sender
//! is told so (`ack-not-offered`). Once it is offered, the watch restarts at
//! `offered + reply-by`, and a message still unacknowledged then is reported
//! as offered but not acknowledged (`ack-overdue`). When an earlier watch
//! from the same sender to the same recipient already fired, the notice asks
//! the sender to ask its user instead (`ack-overdue-again`).
use crate::envelope::MessageState;
use crate::ids::{Generation, IdSource, MessageId, WriterKey};
use crate::limits::Limits;
use crate::notices::{NoticeAbout, NoticeReason};
use crate::state::MailboxState;
use crate::time::Timestamp;
use serde::{Deserialize, Serialize};

/// How far a watch got.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum AckStage {
    /// Nothing fired yet.
    Waiting,
    /// The sender was told the message was not offered in time; the watch
    /// waits for the offer and then restarts.
    NotOffered,
    /// The sender was told the offered message is not acknowledged: final.
    Overdue,
}

/// The sender's watch on one flagged message.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AckWatch {
    /// The flagged message.
    pub id: MessageId,
    pub from: WriterKey,
    /// The sender generation that is told; `None` for a sender with no head.
    pub from_generation: Option<Generation>,
    /// The recipient's key.
    pub to: WriterKey,
    /// The recipient's machine when it is not this one; such a watch is
    /// judged only by the sync that fetched the events it depends on.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub to_machine: Option<String>,
    pub reply_by_sec: u64,
    /// When the watch next turns overdue: `sent + reply-by`, then
    /// `offered + reply-by` once the message is offered.
    pub due: Timestamp,
    /// When the recipient was first offered the message.
    pub offered_at: Option<Timestamp>,
    pub stage: AckStage,
    /// Whether the recipient replied, even after the deadline.
    pub acked: bool,
    /// The time of the last change of this watch.
    pub changed_at: Timestamp,
}

impl AckWatch {
    fn finished(&self) -> bool {
        self.acked || self.stage == AckStage::Overdue
    }

    /// Whether the sweep owes the sender a notice now. The first deadline
    /// fires once while the message is unoffered; the restarted one fires once.
    fn firing(&self, now: Timestamp) -> bool {
        !self.finished()
            && self.to_machine.is_none()
            && now > self.due
            && (self.offered_at.is_some() || self.stage == AckStage::Waiting)
    }
}

impl MailboxState {
    /// Every acknowledgement watch, oldest first.
    pub fn ack_watches(&self) -> impl Iterator<Item = &AckWatch> {
        self.ack_watch.iter()
    }

    /// Starts watching the flagged message `id` sent at `now`.
    pub(crate) fn watch_ack(&mut self, watch: AckWatch, limits: &Limits) {
        self.ack_watch.push(watch);
        while self.ack_watch.len() > limits.counters.max_keys as usize {
            let victim = self
                .ack_watch
                .iter()
                .position(AckWatch::finished)
                .unwrap_or(0);
            self.ack_watch.remove(victim);
        }
    }

    /// Marks the watch on `id` (a message to `machine`, `None` for this
    /// machine) acknowledged, also after its deadline. Returns whether
    /// anything changed.
    pub fn mark_acked(&mut self, id: &MessageId, machine: Option<&str>) -> bool {
        let at = self.last_now;
        let Some(watch) = self
            .ack_watch
            .iter_mut()
            .find(|w| &w.id == id && w.to_machine.as_deref() == machine)
        else {
            return false;
        };
        if watch.acked {
            return false;
        }
        watch.acked = true;
        watch.changed_at = at;
        true
    }

    /// Records that the recipient of `id` was first offered it at `at`: the
    /// watch restarts and is due `reply-by` after that.
    pub(crate) fn mark_ack_offered(
        &mut self,
        id: &MessageId,
        machine: Option<&str>,
        at: Timestamp,
    ) {
        if let Some(watch) = self
            .ack_watch
            .iter_mut()
            .find(|w| &w.id == id && w.to_machine.as_deref() == machine)
        {
            if watch.offered_at.is_none() {
                watch.offered_at = Some(at);
                watch.due = at.plus_secs(watch.reply_by_sec);
                watch.changed_at = at;
            }
        }
    }

    /// Whether some watch of this machine's mail is due for a notice, or
    /// retiring, as of `now`.
    pub(crate) fn ack_rule_due(&self, now: Timestamp, limits: &Limits) -> bool {
        self.ack_watch
            .iter()
            .any(|w| w.firing(now) || self.ack_watch_retires(w, now, limits))
    }

    /// Tells senders of flagged mail whose acknowledgement is overdue.
    pub(crate) fn judge_ack_watches(
        &mut self,
        now: Timestamp,
        limits: &Limits,
        ids: &mut dyn IdSource,
    ) {
        for i in 0..self.ack_watch.len() {
            if !self.ack_watch[i].firing(now) {
                continue;
            }
            let (from, from_generation, to, id) = {
                let w = &self.ack_watch[i];
                (
                    w.from.clone(),
                    w.from_generation,
                    w.to.clone(),
                    w.id.clone(),
                )
            };
            let offered = self.ack_watch[i].offered_at.is_some();
            let earlier = self.ack_watch.iter().enumerate().any(|(j, w)| {
                j != i && w.from == from && w.to == to && w.stage != AckStage::Waiting
            });
            let reason = match (earlier, offered) {
                (true, _) => NoticeReason::AckOverdueAgain,
                (false, true) => NoticeReason::AckOverdue,
                (false, false) => NoticeReason::AckNotOffered,
            };
            let watch = &mut self.ack_watch[i];
            watch.stage = if offered {
                AckStage::Overdue
            } else {
                AckStage::NotOffered
            };
            watch.changed_at = now;
            self.notify(
                NoticeAbout {
                    from,
                    from_generation,
                    to,
                    about: id,
                    reason,
                },
                now,
                limits,
                ids,
            );
        }
    }

    /// Whether `watch` is no longer needed: finished and past the header
    /// horizon (kept that long so a later watch to the same recipient can
    /// tell an earlier one fired), or still open but its message is gone or
    /// refused, which its own notice already told the sender.
    fn ack_watch_retires(&self, watch: &AckWatch, now: Timestamp, limits: &Limits) -> bool {
        if watch.finished() {
            return now.is_past(watch.changed_at, limits.header_horizon_sec());
        }
        watch.to_machine.is_none()
            && !matches!(
                self.message(&watch.id).map(|h| &h.state),
                Some(
                    MessageState::Recorded
                        | MessageState::InFlight { .. }
                        | MessageState::Offered { .. }
                )
            )
    }

    /// Drops the watches [`MailboxState::ack_watch_retires`] names.
    pub(crate) fn retire_ack_watches(&mut self, now: Timestamp, limits: &Limits) {
        let retiring: Vec<bool> = self
            .ack_watch
            .iter()
            .map(|w| self.ack_watch_retires(w, now, limits))
            .collect();
        let mut flags = retiring.into_iter();
        self.ack_watch.retain(|_| !flags.next().unwrap_or(false));
    }
}
