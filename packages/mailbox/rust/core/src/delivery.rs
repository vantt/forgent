//! Send, claim, emit, finish and the read-only inbox (spec §5.2).
use crate::counters::CounterReason;
use crate::envelope::{Header, Kind, MessageState, RefusalReason};
use crate::ids::{AttemptToken, Cli, Generation, IdSource, MessageId, ShortName, WriterKey};
use crate::limits::Limits;
use crate::names::{self, ResolveRefusal};
use crate::notices::{Notice, NoticeState};
use crate::state::MailboxState;
use crate::time::Timestamp;
use crate::wake::{WakeDrop, WakeParties};
use std::fmt;

/// The label of a notice's sender: the mailbox itself, which no head can
/// take, because every short name has the shape `<project>-<cli>-<suffix>`.
const SYSTEM_LABEL: &str = "mailbox";

/// The recipient label a refusal is counted under when the typed name did
/// not resolve; never the typed text, which is unbounded. `~` is outside
/// the writer-key alphabet, so no head's key can take it.
const UNRESOLVED: &str = "~unresolved";

/// How many characters of a sender's key its label shows: a display width
/// chosen with the label's shape, not a policy value.
const UNREGISTERED_LABEL_CHARS: usize = 8;

/// The start of the label of a sender with no head. The label holds no
/// `-`, while every short name holds at least two, so no head's name can
/// ever equal it.
const UNREGISTERED_LABEL: &str = "unregistered_";

/// A send. The body is borrowed: the core reads only its size, and the
/// store keeps it apart under the id `send` returns.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SendRequest<'a> {
    /// The caller's own identity; attribution only.
    pub from: WriterKey,
    /// A typed name, resolved by the core.
    pub to: String,
    pub body: &'a str,
    pub wake: bool,
    /// A hint only; the link is derived by the core (spec §5.4).
    pub reply_to: Option<MessageId>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SendOutcome {
    pub id: MessageId,
    pub to: ShortName,
    pub to_generation: Generation,
    pub depth: u32,
    pub reply_to: Option<MessageId>,
    pub effective_wake: bool,
    /// Why the sender's wake did not take effect, when it asked for one.
    pub wake_dropped: Option<WakeDrop>,
}

/// A refused send: answered to the sender, never recorded (spec §5.3).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Refusal {
    Group,
    UnknownName {
        candidates: Vec<ShortName>,
    },
    AmbiguousName {
        candidates: Vec<ShortName>,
    },
    /// The name resolves to the sender's own key.
    SelfSend,
    ReplyToNotOffered,
    TooLarge {
        max_bytes: u64,
    },
    SessionBudget {
        budget: u32,
        window_sec: u64,
    },
    LifetimeCap {
        cap: u32,
    },
    TooDeep {
        max_depth: u32,
    },
    Loop {
        max_per_window: u32,
        window_sec: u64,
    },
    QueueFull {
        cap: u32,
    },
    SenderShareFull {
        per_sender: u32,
    },
    /// The sender's key is longer than `frame.maxHeaderChars`.
    SenderKeyTooLong {
        max_chars: u32,
    },
}

impl Refusal {
    /// A stable code per reason.
    pub const fn code(&self) -> &'static str {
        self.reason().code()
    }

    /// The counter this refusal bumps.
    pub const fn reason(&self) -> CounterReason {
        match self {
            Self::Group => CounterReason::Group,
            Self::UnknownName { .. } => CounterReason::UnknownName,
            Self::AmbiguousName { .. } => CounterReason::AmbiguousName,
            Self::SelfSend => CounterReason::SelfSend,
            Self::ReplyToNotOffered => CounterReason::ReplyToNotOffered,
            Self::TooLarge { .. } => CounterReason::TooLarge,
            Self::SessionBudget { .. } => CounterReason::SessionBudget,
            Self::LifetimeCap { .. } => CounterReason::LifetimeCap,
            Self::TooDeep { .. } => CounterReason::TooDeep,
            Self::Loop { .. } => CounterReason::Loop,
            Self::QueueFull { .. } => CounterReason::QueueFull,
            Self::SenderShareFull { .. } => CounterReason::SenderShareFull,
            Self::SenderKeyTooLong { .. } => CounterReason::SenderKeyTooLong,
        }
    }
}

impl From<ResolveRefusal> for Refusal {
    fn from(refusal: ResolveRefusal) -> Self {
        match refusal {
            ResolveRefusal::Group => Self::Group,
            ResolveRefusal::Unknown { candidates } => Self::UnknownName { candidates },
            ResolveRefusal::Ambiguous { candidates } => Self::AmbiguousName { candidates },
        }
    }
}

impl fmt::Display for Refusal {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.code())
    }
}

impl std::error::Error for Refusal {}

/// Where a drain runs. `Step` stands for every checkpoint that drains all
/// pending mail (after a tool call, a typed prompt, `inbox --claim`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Checkpoint {
    Stop,
    Step,
}

/// One claimed item: a message or a notice, never both.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ClaimedItem {
    pub id: MessageId,
    /// The offer count including this one, printed in the frame; always 1
    /// for a notice, which is offered once.
    pub attempt: u32,
    pub what: ClaimedWhat,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ClaimedWhat {
    Mail(MailFrom),
    Notice(NoticeFacts),
}

/// Who sent a claimed message.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MailFrom {
    /// The sender's short name, or `unregistered_…` for a sender with no
    /// head, so a peer is never labelled as a head it is not.
    pub label: String,
    pub cli: Option<Cli>,
    pub has_head: bool,
}

impl ClaimedItem {
    pub fn kind(&self) -> Kind {
        match self.what {
            ClaimedWhat::Mail(_) => Kind::Message,
            ClaimedWhat::Notice(_) => Kind::Notice,
        }
    }
}

/// What a claimed notice reports.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NoticeFacts {
    pub reason: RefusalReason,
    /// The refused message.
    pub about: MessageId,
    /// The label of the refused message's recipient.
    pub about_to: String,
}

/// What one claim took. `token` is `None` when nothing was claimed.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Claim {
    pub token: Option<AttemptToken>,
    pub items: Vec<ClaimedItem>,
    /// Whether the claim changed the state, so the store must write it:
    /// true whenever mail was pending (the drain swept and stamped
    /// `last_drain_at`), even if nothing was taken.
    pub changed: bool,
}

impl Claim {
    fn empty(changed: bool) -> Self {
        Self {
            token: None,
            items: Vec::new(),
            changed,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Finished {
    pub offered: Vec<MessageId>,
    /// Still in flight with this token but claimed or finished by a
    /// generation that is no longer current; left unchanged.
    pub ignored: Vec<MessageId>,
}

/// One pending message as `inbox` shows it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MessageView {
    pub id: MessageId,
    pub kind: Kind,
    pub from_label: String,
    pub recorded_at: Timestamp,
    pub offers: u32,
    pub in_flight: bool,
}

/// The token, deadline and generation one claim puts on what it takes.
struct Hold<'a> {
    token: &'a AttemptToken,
    deadline: Timestamp,
    generation: Generation,
}

/// Whether a notice is taken by a claim at this checkpoint: never at
/// `Stop`, which wakes the head only for mail.
fn notice_eligible(
    notice: &Notice,
    to: &WriterKey,
    generation: Generation,
    checkpoint: Checkpoint,
) -> bool {
    checkpoint == Checkpoint::Step
        && notice.state == NoticeState::Recorded
        && &notice.to == to
        && notice.to_generation == generation
}

/// Whether a header is taken by a claim at this checkpoint: everything
/// pending at `Step`, only effective wakes at `Stop`. The sender's `wake`
/// is never read here.
fn eligible(
    header: &Header,
    to: &WriterKey,
    generation: Generation,
    checkpoint: Checkpoint,
) -> bool {
    header.state == MessageState::Recorded
        && &header.to == to
        && header.to_generation == generation
        && (checkpoint == Checkpoint::Step || header.effective_wake)
}

impl MailboxState {
    fn current_generation(&self, key: &WriterKey) -> Option<Generation> {
        self.binding(key).map(|b| b.generation)
    }

    /// The label a frame shows for `from`.
    pub(crate) fn sender_label(&self, from: &WriterKey) -> String {
        match self.binding(from) {
            Some(binding) => binding.name.as_str().to_string(),
            None => {
                let part: String = from
                    .as_str()
                    .chars()
                    .take(UNREGISTERED_LABEL_CHARS)
                    .map(|c| {
                        if c != '-' && names::in_name_alphabet(c) {
                            c
                        } else {
                            '_'
                        }
                    })
                    .collect();
                format!("{UNREGISTERED_LABEL}{part}")
            }
        }
    }

    /// Records a message for the recipient's current generation, or refuses
    /// it. A refused send adds no header.
    pub fn send(
        &mut self,
        req: SendRequest<'_>,
        now: Timestamp,
        limits: &Limits,
        ids: &mut dyn IdSource,
    ) -> Result<SendOutcome, Refusal> {
        self.sweep(now, limits, ids);
        let now = self.last_now;
        let account = self.account(&req.from);
        let from_generation = self.current_generation(&req.from);
        self.count_attempt(&account, &req.from, from_generation, now, limits);
        let admitted = match self.admit(&req, &account, from_generation, now, limits) {
            Ok(admitted) => admitted,
            Err(refusal) => {
                let to = match self.resolve(&req.to) {
                    Ok(recipient) => self.account(&recipient.key).as_str().to_string(),
                    Err(_) => UNRESOLVED.to_string(),
                };
                self.counters
                    .bump(refusal.reason(), account.as_str(), &to, now, limits);
                return Err(refusal);
            }
        };
        let parent = admitted
            .parent
            .and_then(|i| self.messages.get_mut(i))
            .map(|parent| {
                parent.answered = true;
                parent.id.clone()
            });
        let to_account = self.account(&admitted.to);
        let (effective_wake, wake_dropped) = self.effective_wake(
            &WakeParties {
                account: &account,
                to_account: &to_account,
                from: &req.from,
                from_generation,
                to: &admitted.to,
            },
            req.wake,
            now,
            limits,
        );
        let header = Header {
            id: MessageId::mint(ids),
            from_generation,
            from: req.from,
            to: admitted.to,
            to_generation: admitted.to_generation,
            reply_to: parent,
            reply_to_hint: req.reply_to,
            depth: admitted.depth,
            wake: req.wake,
            effective_wake,
            body_bytes: req.body.len() as u64,
            body_kept: true,
            recorded_at: now,
            changed_at: now,
            offers: 0,
            answered: false,
            state: MessageState::Recorded,
        };
        let outcome = SendOutcome {
            id: header.id.clone(),
            to: admitted.to_name,
            to_generation: header.to_generation,
            depth: header.depth,
            reply_to: header.reply_to.clone(),
            effective_wake,
            wake_dropped,
        };
        self.messages.push(header);
        Ok(outcome)
    }

    /// Claims every eligible message to `key`, oldest first, under one
    /// attempt token. A claim by a generation that is not current takes
    /// nothing and changes nothing.
    pub fn claim(
        &mut self,
        key: &WriterKey,
        generation: Generation,
        checkpoint: Checkpoint,
        now: Timestamp,
        limits: &Limits,
        ids: &mut dyn IdSource,
    ) -> Claim {
        if self.current_generation(key) != Some(generation) || !self.has_pending(key, generation) {
            return Claim::empty(false);
        }
        self.sweep(now, limits, ids);
        let now = self.last_now;
        if let Some(binding) = self.bindings.get_mut(key) {
            binding.last_drain_at = Some(now);
        }
        let any_mail = self
            .messages
            .iter()
            .any(|h| eligible(h, key, generation, checkpoint));
        let any_notice = self
            .notices
            .iter()
            .any(|n| notice_eligible(n, key, generation, checkpoint));
        if !any_mail && !any_notice {
            return Claim::empty(true);
        }
        let token = AttemptToken::mint(ids);
        let deadline = now.plus_secs(limits.in_flight_ttl_sec);
        let hold = Hold {
            token: &token,
            deadline,
            generation,
        };
        let mut items = self.take_messages(key, checkpoint, &hold, now);
        items.extend(self.take_notices(key, checkpoint, &hold));
        Claim {
            token: Some(token),
            items,
            changed: true,
        }
    }

    /// Moves the eligible mail to in-flight under `hold`, oldest first.
    fn take_messages(
        &mut self,
        key: &WriterKey,
        checkpoint: Checkpoint,
        hold: &Hold<'_>,
        now: Timestamp,
    ) -> Vec<ClaimedItem> {
        let mut taken = Vec::new();
        for header in &mut self.messages {
            if eligible(header, key, hold.generation, checkpoint) {
                header.offers += 1;
                header.changed_at = now;
                header.state = MessageState::InFlight {
                    token: hold.token.clone(),
                    deadline: hold.deadline,
                    generation: hold.generation,
                };
                taken.push((header.id.clone(), header.from.clone(), header.offers));
            }
        }
        taken
            .into_iter()
            .map(|(id, from, attempt)| {
                let sender = self.binding(&from);
                ClaimedItem {
                    id,
                    attempt,
                    what: ClaimedWhat::Mail(MailFrom {
                        label: self.sender_label(&from),
                        cli: sender.map(|b| b.cli.clone()),
                        has_head: sender.is_some(),
                    }),
                }
            })
            .collect()
    }

    /// Moves the eligible notices to in-flight under `hold`, oldest first.
    /// A notice is offered once, so its attempt is always the first.
    fn take_notices(
        &mut self,
        key: &WriterKey,
        checkpoint: Checkpoint,
        hold: &Hold<'_>,
    ) -> Vec<ClaimedItem> {
        let mut taken = Vec::new();
        for notice in &mut self.notices {
            if notice_eligible(notice, key, hold.generation, checkpoint) {
                notice.state = NoticeState::InFlight {
                    token: hold.token.clone(),
                    deadline: hold.deadline,
                    generation: hold.generation,
                };
                taken.push((
                    notice.id.clone(),
                    notice.reason,
                    notice.about.clone(),
                    notice.about_to.clone(),
                ));
            }
        }
        taken
            .into_iter()
            .map(|(id, reason, about, about_to)| ClaimedItem {
                id,
                attempt: 1,
                what: ClaimedWhat::Notice(NoticeFacts {
                    reason,
                    about,
                    about_to: self.sender_label(&about_to),
                }),
            })
            .collect()
    }

    /// Finishes a claim after its frame was emitted. Each message still in
    /// flight with this token becomes `offered` only when `generation` is
    /// both the address's current one and the claim's; otherwise it is
    /// listed as ignored and left unchanged.
    pub fn finish(
        &mut self,
        key: &WriterKey,
        generation: Generation,
        token: &AttemptToken,
        now: Timestamp,
    ) -> Finished {
        let current = self.current_generation(key);
        // Offered only when the finishing generation is both the address's
        // current one and the one that claimed.
        let accepts =
            |claimed_by: Generation| current == Some(generation) && claimed_by == generation;
        let mut finished = Finished {
            offered: Vec::new(),
            ignored: Vec::new(),
        };
        let at = self.last_now.max(now);
        let mut touched = false;
        for header in &mut self.messages {
            let MessageState::InFlight {
                token: held,
                generation: claimed_by,
                ..
            } = &header.state
            else {
                continue;
            };
            if &header.to != key || held != token {
                continue;
            }
            touched = true;
            if accepts(*claimed_by) {
                header.state = MessageState::Offered { at };
                header.changed_at = at;
                finished.offered.push(header.id.clone());
            } else {
                finished.ignored.push(header.id.clone());
            }
        }
        let mut kept = Vec::with_capacity(self.notices.len());
        for notice in std::mem::take(&mut self.notices) {
            match &notice.state {
                NoticeState::InFlight {
                    token: held,
                    generation: claimed_by,
                    ..
                } if &notice.to == key && held == token => {
                    touched = true;
                    if accepts(*claimed_by) {
                        finished.offered.push(notice.id.clone());
                        continue;
                    }
                    finished.ignored.push(notice.id.clone());
                }
                _ => {}
            }
            kept.push(notice);
        }
        self.notices = kept;
        if touched {
            self.last_now = at;
        }
        finished
    }

    /// Records how a Stop of `key`'s generation `generation` ended: `blocked`
    /// adds one to the count of consecutive Stop blocks (saturating), a pass
    /// returns it to zero. The hook calls it with `true` only after the
    /// block was written and finished. A key with no binding, or a
    /// generation that is not the current one, changes nothing. Returns
    /// whether the count changed.
    pub fn note_stop(&mut self, key: &WriterKey, generation: Generation, blocked: bool) -> bool {
        let Some(binding) = self.bindings.get_mut(key) else {
            return false;
        };
        if binding.generation != generation {
            return false;
        }
        let count = if blocked {
            binding.stop_blocks.saturating_add(1)
        } else {
            0
        };
        let changed = count != binding.stop_blocks;
        binding.stop_blocks = count;
        changed
    }

    /// Pending mail (recorded or in flight) to the current generation of
    /// `key`, oldest first, then its pending notices: what a step claim
    /// (`inbox --claim`) would take or is holding. Read-only.
    pub fn inbox(&self, key: &WriterKey) -> Vec<MessageView> {
        let Some(generation) = self.current_generation(key) else {
            return Vec::new();
        };
        let notices = self
            .notices
            .iter()
            .filter(|n| &n.to == key && n.to_generation == generation)
            .map(|n| {
                let in_flight = matches!(n.state, NoticeState::InFlight { .. });
                MessageView {
                    id: n.id.clone(),
                    kind: Kind::Notice,
                    from_label: SYSTEM_LABEL.to_string(),
                    recorded_at: n.created_at,
                    offers: u32::from(in_flight),
                    in_flight,
                }
            });
        self.messages
            .iter()
            .filter(|h| &h.to == key && h.to_generation == generation)
            .filter(|h| {
                matches!(
                    h.state,
                    MessageState::Recorded | MessageState::InFlight { .. }
                )
            })
            .map(|h| MessageView {
                id: h.id.clone(),
                kind: Kind::Message,
                from_label: self.sender_label(&h.from),
                recorded_at: h.recorded_at,
                offers: h.offers,
                in_flight: matches!(h.state, MessageState::InFlight { .. }),
            })
            .chain(notices)
            .collect()
    }

    /// Whether `key` has mail or notices pending for `generation`: the only
    /// case in which a drain sweeps and stamps `last_drain_at`, so a drain
    /// of an empty address writes nothing.
    fn has_pending(&self, key: &WriterKey, generation: Generation) -> bool {
        let mail = self.messages.iter().any(|h| {
            &h.to == key
                && h.to_generation == generation
                && matches!(
                    h.state,
                    MessageState::Recorded | MessageState::InFlight { .. }
                )
        });
        mail || self
            .notices
            .iter()
            .any(|n| &n.to == key && n.to_generation == generation)
    }
}
