//! Send, claim, emit, finish and the read-only inbox (spec §5.2).
use crate::envelope::{Header, Kind, MessageState};
use crate::ids::{AttemptToken, Cli, Generation, IdSource, MessageId, ShortName, WriterKey};
use crate::limits::Limits;
use crate::names::{self, ResolveRefusal};
use crate::state::MailboxState;
use crate::time::Timestamp;
use std::fmt;

/// How many characters of a sender's key label a sender with no head.
const UNREGISTERED_LABEL_CHARS: usize = 8;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SendRequest {
    /// The caller's own identity; attribution only.
    pub from: WriterKey,
    /// A typed name, resolved by the core.
    pub to: String,
    pub body: String,
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
}

/// A refused send: answered to the sender, never recorded (spec §5.3).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Refusal {
    Group,
    UnknownName { candidates: Vec<ShortName> },
    AmbiguousName { candidates: Vec<ShortName> },
}

impl Refusal {
    /// A stable code per reason.
    pub const fn code(&self) -> &'static str {
        match self {
            Self::Group => "group",
            Self::UnknownName { .. } => "unknown-name",
            Self::AmbiguousName { .. } => "ambiguous-name",
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ClaimedItem {
    pub id: MessageId,
    pub kind: Kind,
    /// The sender's short name, or `unregistered-…` for a sender with no
    /// head, so a peer is never labelled as a head it is not.
    pub from_label: String,
    pub from_cli: Option<Cli>,
    pub sender_has_head: bool,
    /// The offer count including this one, printed in the frame.
    pub attempt: u32,
}

/// What one claim took. `token` is `None` when nothing was claimed.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Claim {
    pub token: Option<AttemptToken>,
    pub items: Vec<ClaimedItem>,
}

impl Claim {
    fn empty() -> Self {
        Self {
            token: None,
            items: Vec::new(),
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

/// Whether a header is taken by a claim at this checkpoint.
fn eligible(
    header: &Header,
    to: &WriterKey,
    generation: Generation,
    _checkpoint: Checkpoint,
) -> bool {
    header.state == MessageState::Recorded && &header.to == to && header.to_generation == generation
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
                    .map(|c| if names::in_name_alphabet(c) { c } else { '-' })
                    .collect();
                format!("unregistered-{part}")
            }
        }
    }

    /// Records a message for the recipient's current generation, or refuses
    /// it. A refused send adds no header.
    pub fn send(
        &mut self,
        req: SendRequest,
        now: Timestamp,
        limits: &Limits,
        ids: &mut dyn IdSource,
    ) -> Result<SendOutcome, Refusal> {
        self.sweep(now, limits);
        let now = self.last_now;
        let recipient = self.resolve(&req.to)?;
        let (to, to_name, to_generation) = (
            recipient.key.clone(),
            recipient.name.clone(),
            recipient.generation,
        );
        let header = Header {
            id: MessageId::mint(ids),
            kind: Kind::Message,
            from_generation: self.current_generation(&req.from),
            from: req.from,
            to,
            to_generation,
            reply_to: None,
            depth: 0,
            wake: req.wake,
            effective_wake: req.wake,
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
            to: to_name,
            to_generation,
            depth: header.depth,
            reply_to: header.reply_to.clone(),
            effective_wake: header.effective_wake,
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
        if self.current_generation(key) != Some(generation) {
            return Claim::empty();
        }
        self.sweep(now, limits);
        let now = self.last_now;
        if !self
            .messages
            .iter()
            .any(|h| eligible(h, key, generation, checkpoint))
        {
            return Claim::empty();
        }
        let token = AttemptToken::mint(ids);
        let deadline = now.plus_secs(limits.in_flight_ttl_sec);
        let mut taken = Vec::new();
        for header in &mut self.messages {
            if eligible(header, key, generation, checkpoint) {
                header.offers += 1;
                header.changed_at = now;
                header.state = MessageState::InFlight {
                    token: token.clone(),
                    deadline,
                    generation,
                };
                taken.push((
                    header.id.clone(),
                    header.kind,
                    header.from.clone(),
                    header.offers,
                ));
            }
        }
        let items = taken
            .into_iter()
            .map(|(id, kind, from, attempt)| {
                let sender = self.binding(&from);
                ClaimedItem {
                    id,
                    kind,
                    from_label: self.sender_label(&from),
                    from_cli: sender.map(|b| b.cli.clone()),
                    sender_has_head: sender.is_some(),
                    attempt,
                }
            })
            .collect();
        Claim {
            token: Some(token),
            items,
        }
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
        let mut finished = Finished {
            offered: Vec::new(),
            ignored: Vec::new(),
        };
        let held: Vec<usize> = self
            .messages
            .iter()
            .enumerate()
            .filter(|(_, h)| {
                &h.to == key
                    && matches!(&h.state, MessageState::InFlight { token: t, .. } if t == token)
            })
            .map(|(i, _)| i)
            .collect();
        if held.is_empty() {
            return finished;
        }
        let now = self.advance(now);
        for index in held {
            let header = &mut self.messages[index];
            let claimed_by = match &header.state {
                MessageState::InFlight { generation, .. } => *generation,
                _ => continue,
            };
            if current == Some(generation) && claimed_by == generation {
                header.state = MessageState::Offered { at: now };
                header.changed_at = now;
                finished.offered.push(header.id.clone());
            } else {
                finished.ignored.push(header.id.clone());
            }
        }
        finished
    }

    /// Pending mail (recorded or in flight) to the current generation of
    /// `key`, oldest first. Read-only.
    pub fn inbox(&self, key: &WriterKey) -> Vec<MessageView> {
        let Some(generation) = self.current_generation(key) else {
            return Vec::new();
        };
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
                kind: h.kind,
                from_label: self.sender_label(&h.from),
                recorded_at: h.recorded_at,
                offers: h.offers,
                in_flight: matches!(h.state, MessageState::InFlight { .. }),
            })
            .collect()
    }
}
