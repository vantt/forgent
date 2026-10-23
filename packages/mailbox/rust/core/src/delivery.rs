//! Send, claim, emit, finish and the read-only inbox (spec §5.2).
use crate::counters::CounterReason;
use crate::envelope::{Header, Kind, MessageState, RefusalReason};
use crate::frame;
use crate::ids::{AttemptToken, Cli, Generation, IdSource, MessageId, ShortName, WriterKey};
use crate::limits::Limits;
use crate::names::{self, ResolveRefusal};
use crate::notices::{Notice, NoticeState};
use crate::registry::Liveness;
use crate::state::MailboxState;
use crate::time::Timestamp;
use crate::wake::{WakeDrop, WakeParties};
use std::collections::BTreeSet;
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
    /// Keys whose head the store judged `Dead`: name resolution skips them
    /// (owner decision Q2, option B). Empty when the store judged none.
    pub dead_keys: BTreeSet<WriterKey>,
    /// The CLIs whose `Stop` hook takes mail (the adapters contract's
    /// `channels.stop.deliver`). A recipient of any other CLI has no channel
    /// a wake could use: its wake takes no effect and spends no allowance.
    pub stop_drains: BTreeSet<Cli>,
    /// Set when `to` was an alias (an Identity handle, full id or role) the
    /// caller could not turn into a head of this record: check 2 refuses
    /// with it in place of name resolution. `None` for a mailbox name, or an
    /// alias that resolved, whose key is then `to`.
    pub alias_refusal: Option<AliasRefusal>,
}

/// A session an alias refusal points at, as Identity names it: plain data,
/// shown to the sender.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AliasCandidate {
    /// `<machine-id>/<local id>`.
    pub id: String,
    pub handle: String,
    pub liveness: Liveness,
}

/// Why an alias names no head of this record.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AliasRefusal {
    /// No session, or none this record can deliver to; the candidates are
    /// this record's heads only.
    Unknown {
        candidates: Vec<AliasCandidate>,
        /// The alias names a live session that is not a head of this
        /// record, so the answer says it has no address here.
        no_address_here: bool,
    },
    /// Several sessions, each a head of this record.
    Ambiguous { candidates: Vec<AliasCandidate> },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SendOutcome {
    pub id: MessageId,
    pub to: ShortName,
    pub to_generation: Generation,
    /// The recipient's CLI and head process text, as its binding holds
    /// them: what a store needs to read the recipient's CLI version.
    pub to_cli: Cli,
    pub to_head: String,
    pub depth: u32,
    pub reply_to: Option<MessageId>,
    pub effective_wake: bool,
    /// Why the sender's wake did not take effect, when it asked for one.
    pub wake_dropped: Option<WakeDrop>,
    /// Whether the recipient's CLI takes mail when its turn ends; when not,
    /// it sees mail only at its next tool call.
    pub to_stop_drains: bool,
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
    /// An alias that names no head of this record, or several.
    Alias(AliasRefusal),
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
            Self::Alias(AliasRefusal::Unknown { .. }) => CounterReason::UnknownName,
            Self::Alias(AliasRefusal::Ambiguous { .. }) => CounterReason::AmbiguousName,
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
/// pending mail (after a typed prompt, `inbox --claim`). `BoundedStep(n)`
/// is a step whose channel shows at most `n` bytes inline (a CLI's
/// `PostToolUse` context): it takes pending items in order while their
/// worst-case frames fit, skips an item too large alone, and keeps room
/// for the pointer line that names the skipped ones. `Stop` takes only
/// effective wakes and is never bounded.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Checkpoint {
    Stop,
    Step,
    BoundedStep(u64),
}

impl Checkpoint {
    /// Whether this checkpoint takes every pending item, not only the
    /// effective wakes: both kinds of step.
    pub const fn takes_all_pending(self) -> bool {
        matches!(self, Self::Step | Self::BoundedStep(_))
    }

    pub const fn is_stop(self) -> bool {
        matches!(self, Self::Stop)
    }

    /// The bytes the claimed frames may take: the bound less the pointer
    /// line and the blank line before it; `None` when unbounded.
    fn budget(self) -> Option<usize> {
        match self {
            Self::BoundedStep(bound) => Some(
                usize::try_from(bound)
                    .unwrap_or(usize::MAX)
                    .saturating_sub(frame::pointer_reserve()),
            ),
            Self::Stop | Self::Step => None,
        }
    }
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
    /// The sender's writer key, from which the store derives its handle.
    pub key: WriterKey,
    /// The sender's Identity handle, derived by the store at render and
    /// never stored (the core leaves it `None`): it is a function of the
    /// key, the CLI and the machine handle, so a stored copy would go stale.
    pub handle: Option<String>,
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
    /// Eligible items a bounded step left recorded because each one's
    /// worst-case frame alone exceeds the step's budget; always 0 at an
    /// unbounded checkpoint.
    pub too_large: u32,
}

impl Claim {
    fn empty(changed: bool, too_large: u32) -> Self {
        Self {
            token: None,
            items: Vec::new(),
            changed,
            too_large,
        }
    }
}

/// One eligible item a claim may take: an index into the messages or the
/// notices.
#[derive(Debug, Clone, Copy)]
enum Pick {
    Message(usize),
    Notice(usize),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Finished {
    pub offered: Vec<MessageId>,
    /// Still in flight with this token but claimed or finished by a
    /// generation that is no longer current; left unchanged.
    pub ignored: Vec<MessageId>,
    /// Whether the finish changed the state, so the store must write it:
    /// true when any item carried this token.
    pub changed: bool,
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
    checkpoint.takes_all_pending()
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
        && (checkpoint.takes_all_pending() || header.effective_wake)
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
                let to = match self.resolve_skipping(&req.to, &req.dead_keys) {
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
        let to_stop_drains = req.stop_drains.contains(&admitted.to_cli);
        let (effective_wake, wake_dropped) = self.effective_wake(
            &WakeParties {
                account: &account,
                to_account: &to_account,
                from: &req.from,
                from_generation,
                to: &admitted.to,
                to_stop_drains,
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
            to_cli: admitted.to_cli,
            to_head: admitted.to_head,
            depth: header.depth,
            reply_to: header.reply_to.clone(),
            effective_wake,
            wake_dropped,
            to_stop_drains,
        };
        self.messages.push(header);
        Ok(outcome)
    }

    /// Claims the eligible messages to `key`, oldest first, then its
    /// eligible notices, under one attempt token. A bounded step takes only
    /// what fits its budget (see [`Checkpoint`]); what it skips stays
    /// recorded, unchanged. A claim by a generation that is not current
    /// takes nothing and changes nothing.
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
            return Claim::empty(false, 0);
        }
        self.sweep(now, limits, ids);
        let now = self.last_now;
        if let Some(binding) = self.bindings.get_mut(key) {
            binding.last_drain_at = Some(now);
        }
        let (picks, too_large) = self.select(key, generation, checkpoint, limits);
        if picks.is_empty() {
            return Claim::empty(true, too_large);
        }
        let token = AttemptToken::mint(ids);
        let deadline = now.plus_secs(limits.in_flight_ttl_sec);
        let hold = Hold {
            token: &token,
            deadline,
            generation,
        };
        let items = picks
            .into_iter()
            .map(|pick| match pick {
                Pick::Message(i) => self.take_message(i, &hold, now),
                Pick::Notice(i) => self.take_notice(i, &hold),
            })
            .collect();
        Claim {
            token: Some(token),
            items,
            changed: true,
            too_large,
        }
    }

    /// The items a claim takes, in frame order (messages oldest first, then
    /// notices), and how many a bounded step skipped as too large alone.
    /// A bounded step stops at the first item that fits alone but not
    /// beside those already taken.
    fn select(
        &self,
        key: &WriterKey,
        generation: Generation,
        checkpoint: Checkpoint,
        limits: &Limits,
    ) -> (Vec<Pick>, u32) {
        let eligible = self
            .messages
            .iter()
            .enumerate()
            .filter(|(_, h)| eligible(h, key, generation, checkpoint))
            .map(|(i, _)| Pick::Message(i))
            .chain(
                self.notices
                    .iter()
                    .enumerate()
                    .filter(|(_, n)| notice_eligible(n, key, generation, checkpoint))
                    .map(|(i, _)| Pick::Notice(i)),
            );
        let Some(budget) = checkpoint.budget() else {
            return (eligible.collect(), 0);
        };
        let mut picks = Vec::new();
        let mut too_large = 0u32;
        let mut used = 0usize;
        for pick in eligible {
            let size = self.worst_case_of(pick, limits);
            if size > budget {
                too_large = too_large.saturating_add(1);
                continue;
            }
            let joined = if picks.is_empty() {
                size
            } else {
                size.saturating_add(frame::FRAME_SEPARATOR.len())
            };
            if used.saturating_add(joined) > budget {
                break;
            }
            used += joined;
            picks.push(pick);
        }
        (picks, too_large)
    }

    /// The largest frame `pick` can render to, as it would be claimed now.
    fn worst_case_of(&self, pick: Pick, limits: &Limits) -> usize {
        match pick {
            Pick::Message(i) => {
                let header = &self.messages[i];
                let item = self.mail_item(header, header.offers.saturating_add(1));
                frame::worst_case_len(&item, header.body_bytes, limits)
            }
            Pick::Notice(i) => {
                frame::worst_case_len(&self.notice_item(&self.notices[i]), 0, limits)
            }
        }
    }

    /// The claimed item of a message at offer `attempt`.
    fn mail_item(&self, header: &Header, attempt: u32) -> ClaimedItem {
        let sender = self.binding(&header.from);
        ClaimedItem {
            id: header.id.clone(),
            attempt,
            what: ClaimedWhat::Mail(MailFrom {
                label: self.sender_label(&header.from),
                cli: sender.map(|b| b.cli.clone()),
                has_head: sender.is_some(),
                key: header.from.clone(),
                handle: None,
            }),
        }
    }

    /// The claimed item of a notice; a notice is offered once, so its
    /// attempt is always the first.
    fn notice_item(&self, notice: &Notice) -> ClaimedItem {
        ClaimedItem {
            id: notice.id.clone(),
            attempt: 1,
            what: ClaimedWhat::Notice(NoticeFacts {
                reason: notice.reason,
                about: notice.about.clone(),
                about_to: self.sender_label(&notice.about_to),
            }),
        }
    }

    /// Moves one eligible message to in-flight under `hold`.
    fn take_message(&mut self, i: usize, hold: &Hold<'_>, now: Timestamp) -> ClaimedItem {
        let header = &mut self.messages[i];
        header.offers += 1;
        header.changed_at = now;
        header.state = MessageState::InFlight {
            token: hold.token.clone(),
            deadline: hold.deadline,
            generation: hold.generation,
        };
        let attempt = header.offers;
        self.mail_item(&self.messages[i], attempt)
    }

    /// Moves one eligible notice to in-flight under `hold`.
    fn take_notice(&mut self, i: usize, hold: &Hold<'_>) -> ClaimedItem {
        let notice = &mut self.notices[i];
        notice.state = NoticeState::InFlight {
            token: hold.token.clone(),
            deadline: hold.deadline,
            generation: hold.generation,
        };
        self.notice_item(&self.notices[i])
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
            changed: false,
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
        finished.changed = touched;
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
