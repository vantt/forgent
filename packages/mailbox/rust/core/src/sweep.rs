//! The lazy sweep (spec §5.2, §5.3): there is no daemon, so whichever
//! operation runs next applies every time rule, in the order listed in
//! [`MailboxState::sweep`].
use crate::counters::CounterReason;
use crate::envelope::{MessageState, RefusalReason};
use crate::ids::IdSource;
use crate::limits::Limits;
use crate::notices::{NoticeState, RefusedFacts};
use crate::state::MailboxState;
use crate::time::Timestamp;

impl MailboxState {
    /// Applies every time rule as of `now`. Bindings are never removed.
    pub fn sweep(&mut self, now: Timestamp, limits: &Limits, ids: &mut dyn IdSource) {
        let now = self.advance(now);
        self.expire_message_claims(now, limits, ids);
        self.drop_unfinished_notices(now, limits);
        self.expire_notices(now, limits);
        self.refuse_stale_records(now, limits, ids);
        self.retire_settled_messages(now, limits);
        self.forget_old_notice_marks(now, limits);
    }

    /// An in-flight message past its deadline returns to `recorded` (its
    /// offer was counted at the claim), or is refused once it has used
    /// every allowed offer.
    fn expire_message_claims(&mut self, now: Timestamp, limits: &Limits, ids: &mut dyn IdSource) {
        let mut refused = Vec::new();
        for header in &mut self.messages {
            if let MessageState::InFlight { deadline, .. } = header.state {
                if now > deadline {
                    header.changed_at = now;
                    if header.offers >= limits.max_offers {
                        header.state = MessageState::Refused {
                            reason: RefusalReason::OfferCap,
                            at: now,
                        };
                        refused.push(refused_facts(header, RefusalReason::OfferCap));
                    } else {
                        header.state = MessageState::Recorded;
                    }
                }
            }
        }
        self.settle_refusals(refused, now, limits, ids);
    }

    /// A claimed notice not finished by its deadline is removed; it is
    /// never offered again.
    fn drop_unfinished_notices(&mut self, now: Timestamp, limits: &Limits) {
        let (gone, kept) = std::mem::take(&mut self.notices).into_iter().partition(
            |n| matches!(n.state, NoticeState::InFlight { deadline, .. } if now > deadline),
        );
        self.notices = kept;
        for notice in gone {
            self.count(
                CounterReason::NoticeUndelivered,
                &notice.to,
                &notice.about_to,
                now,
                limits,
            );
        }
    }

    /// A notice that waited past the record TTL, or whose addressee's
    /// generation ended, is removed.
    fn expire_notices(&mut self, now: Timestamp, limits: &Limits) {
        let (gone, kept): (Vec<_>, Vec<_>) = std::mem::take(&mut self.notices)
            .into_iter()
            .partition(|n| {
                let current = self.bindings.get(&n.to).map(|b| b.generation);
                now.is_past(n.created_at, limits.record.ttl_sec) || current != Some(n.to_generation)
            });
        self.notices = kept;
        for notice in gone {
            self.count(
                CounterReason::NoticeExpired,
                &notice.to,
                &notice.about_to,
                now,
                limits,
            );
        }
    }

    /// A message still recorded after the record TTL is refused; mail of an
    /// older generation leaves this way too.
    fn refuse_stale_records(&mut self, now: Timestamp, limits: &Limits, ids: &mut dyn IdSource) {
        let mut refused = Vec::new();
        for header in &mut self.messages {
            if header.state == MessageState::Recorded
                && now.is_past(header.recorded_at, limits.record.ttl_sec)
            {
                header.state = MessageState::Refused {
                    reason: RefusalReason::RecordTtl,
                    at: now,
                };
                header.changed_at = now;
                refused.push(refused_facts(header, RefusalReason::RecordTtl));
            }
        }
        self.settle_refusals(refused, now, limits, ids);
    }

    /// An offered or refused message loses its body reference after the
    /// body retention, and its header after the longest window that may
    /// still read it; a body is never kept without its header.
    fn retire_settled_messages(&mut self, now: Timestamp, limits: &Limits) {
        let header_keep = limits
            .loop_guard
            .window_sec
            .max(limits.record.ttl_sec)
            .max(limits.record.body_retention_sec);
        let settled = |state: &MessageState| {
            matches!(
                state,
                MessageState::Offered { .. } | MessageState::Refused { .. }
            )
        };
        self.messages
            .retain(|h| !(settled(&h.state) && now.is_past(h.changed_at, header_keep)));
        for header in &mut self.messages {
            if settled(&header.state)
                && now.is_past(header.changed_at, limits.record.body_retention_sec)
            {
                header.body_kept = false;
            }
        }
    }

    /// A notice mark older than the notice window no longer suppresses.
    fn forget_old_notice_marks(&mut self, now: Timestamp, limits: &Limits) {
        self.notice_last
            .retain(|_, at| !now.is_past(*at, limits.notices.window_sec));
    }

    fn settle_refusals(
        &mut self,
        refused: Vec<RefusedFacts>,
        now: Timestamp,
        limits: &Limits,
        ids: &mut dyn IdSource,
    ) {
        for facts in refused {
            self.count(facts.reason.into(), &facts.from, &facts.to, now, limits);
            self.notify(facts, now, limits, ids);
        }
    }
}

fn refused_facts(header: &crate::envelope::Header, reason: RefusalReason) -> RefusedFacts {
    RefusedFacts {
        from: header.from.clone(),
        from_generation: header.from_generation,
        to: header.to.clone(),
        about: header.id.clone(),
        reason,
    }
}
