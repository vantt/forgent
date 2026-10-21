//! The notices lane (spec §5.3): machine-made notes to the sender of a
//! message the sweep refused. A notice goes only to the generation that
//! sent the message, never wakes, is never replied to, never counts toward
//! the loop guard and is never offered twice.
use crate::counters::CounterReason;
use crate::envelope::RefusalReason;
use crate::ids::{AttemptToken, Generation, IdSource, MessageId, WriterKey};
use crate::limits::Limits;
use crate::state::MailboxState;
use crate::time::Timestamp;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case", deny_unknown_fields)]
pub enum NoticeState {
    Recorded,
    InFlight {
        token: AttemptToken,
        deadline: Timestamp,
        generation: Generation,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Notice {
    pub id: MessageId,
    /// The sender of the refused message.
    pub to: WriterKey,
    /// The generation that sent the refused message.
    pub to_generation: Generation,
    pub reason: RefusalReason,
    /// The refused message.
    pub about: MessageId,
    /// The recipient of the refused message.
    pub about_to: WriterKey,
    pub created_at: Timestamp,
    pub state: NoticeState,
}

/// `<to>|<reason>`: when this sender last got a notice of this reason.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(transparent)]
pub struct NoticeMark(String);

impl NoticeMark {
    fn new(to: &WriterKey, reason: RefusalReason) -> Self {
        Self(format!(
            "{}|{}",
            to.as_str(),
            CounterReason::from(reason).code()
        ))
    }
}

/// The facts of a refused message that a notice is about.
pub(crate) struct RefusedFacts {
    pub from: WriterKey,
    pub from_generation: Option<Generation>,
    pub to: WriterKey,
    pub about: MessageId,
    pub reason: RefusalReason,
}

impl MailboxState {
    /// Every notice, oldest first.
    pub fn notices(&self) -> impl Iterator<Item = &Notice> {
        self.notices.iter()
    }

    /// Creates the notice for a refused message, unless its sender cannot
    /// receive it or got one of the same reason inside the window.
    pub(crate) fn notify(
        &mut self,
        refused: RefusedFacts,
        now: Timestamp,
        limits: &Limits,
        ids: &mut dyn IdSource,
    ) {
        let current = self.binding(&refused.from).map(|b| b.generation);
        let generation = match refused.from_generation {
            Some(generation) if Some(generation) == current => generation,
            _ => {
                self.count(
                    CounterReason::NoticeUndeliverable,
                    &refused.from,
                    &refused.to,
                    now,
                    limits,
                );
                return;
            }
        };
        let mark = NoticeMark::new(&refused.from, refused.reason);
        if let Some(last) = self.notice_last.get(&mark) {
            if !now.is_past(*last, limits.notices.window_sec) {
                self.count(
                    CounterReason::NoticeSuppressed,
                    &refused.from,
                    &refused.to,
                    now,
                    limits,
                );
                return;
            }
        }
        self.notice_last.insert(mark, now);
        self.notices.push(Notice {
            id: MessageId::mint(ids),
            to: refused.from.clone(),
            to_generation: generation,
            reason: refused.reason,
            about: refused.about,
            about_to: refused.to.clone(),
            created_at: now,
            state: NoticeState::Recorded,
        });
        let held = self.notices.iter().filter(|n| n.to == refused.from).count();
        if held > limits.notices.cap as usize {
            // The oldest notice still waiting; an in-flight one was already
            // emitted and is never evicted. When only in-flight notices are
            // older, that is the new notice itself.
            let waiting = |n: &Notice| n.to == refused.from && n.state == NoticeState::Recorded;
            if let Some(oldest) = self.notices.iter().position(waiting) {
                self.notices.remove(oldest);
                self.count(
                    CounterReason::NoticeDropped,
                    &refused.from,
                    &refused.to,
                    now,
                    limits,
                );
            }
        }
    }
}
