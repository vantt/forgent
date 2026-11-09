//! The notices lane (spec §5.3): machine-made notes to the sender of a
//! message the sweep refused, or whose requested acknowledgement is overdue. A notice goes only to the generation that
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

/// Why a notice was made: a refusal the sweep decided, or an acknowledgement
/// the sender asked for that did not come in time.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum NoticeReason {
    RecordTtl,
    OfferCap,
    /// The deadline passed and the recipient was never offered the message.
    AckNotOffered,
    /// The recipient was offered the message and did not acknowledge it in time.
    AckOverdue,
    /// An earlier reminder to the same recipient also went unanswered: the
    /// sender asks its user instead of sending again.
    AckOverdueAgain,
}

impl NoticeReason {
    pub const fn code(self) -> &'static str {
        match self {
            Self::RecordTtl => "record-ttl",
            Self::OfferCap => "offer-cap",
            Self::AckNotOffered => "ack-not-offered",
            Self::AckOverdue => "ack-overdue",
            Self::AckOverdueAgain => "ack-overdue-again",
        }
    }

    /// The refusal this notice reports, for the notices that report one.
    pub(crate) const fn refusal(self) -> Option<RefusalReason> {
        match self {
            Self::RecordTtl => Some(RefusalReason::RecordTtl),
            Self::OfferCap => Some(RefusalReason::OfferCap),
            Self::AckNotOffered | Self::AckOverdue | Self::AckOverdueAgain => None,
        }
    }
}

impl From<RefusalReason> for NoticeReason {
    fn from(reason: RefusalReason) -> Self {
        match reason {
            RefusalReason::RecordTtl => Self::RecordTtl,
            RefusalReason::OfferCap => Self::OfferCap,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Notice {
    pub id: MessageId,
    /// The sender of the message the notice is about.
    pub to: WriterKey,
    /// The generation that sent that message.
    pub to_generation: Generation,
    pub reason: NoticeReason,
    /// The message the notice is about.
    pub about: MessageId,
    /// The recipient of that message.
    pub about_to: WriterKey,
    pub created_at: Timestamp,
    pub state: NoticeState,
}

/// `<to>|<reason>`: when this sender last got a notice of this reason.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(transparent)]
pub struct NoticeMark(String);

impl NoticeMark {
    pub(crate) fn is_of(&self, key: &WriterKey) -> bool {
        self.0.split('|').next() == Some(key.as_str())
    }

    fn new(to: &WriterKey, reason: NoticeReason) -> Self {
        Self(format!("{}|{}", to.as_str(), reason.code()))
    }
}

/// The facts of a message that a notice is about.
pub(crate) struct NoticeAbout {
    pub from: WriterKey,
    pub from_generation: Option<Generation>,
    pub to: WriterKey,
    pub about: MessageId,
    pub reason: NoticeReason,
}

impl MailboxState {
    /// Every notice, oldest first.
    pub fn notices(&self) -> impl Iterator<Item = &Notice> {
        self.notices.iter()
    }

    /// Creates the notice about a message, unless its sender cannot receive
    /// it or got one of the same reason inside the window.
    pub(crate) fn notify(
        &mut self,
        refused: NoticeAbout,
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
