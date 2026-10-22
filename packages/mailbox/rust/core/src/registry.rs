//! Registration of heads under the four-row table of spec §5.1.
//!
//! The core never interprets a process identity: `head` and `handle` are
//! opaque text the store writes, and the store's judgement of the stored head
//! arrives as plain input.
use crate::ids::{Cli, Generation, IdSource, ShortName, WriterKey};
use crate::limits::Limits;
use crate::names;
use crate::state::MailboxState;
use crate::time::Timestamp;
use serde::{Deserialize, Serialize};
use std::fmt;

/// The store's verdict on the stored head's process.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Liveness {
    Alive,
    Dead,
    Unknown,
}

/// The store's judgement of the stored binding against the registering head.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct StoredHead {
    /// The registering head's process identity equals the stored one.
    pub same_head: bool,
    pub liveness: Liveness,
}

/// One address: a head of a CLI process and its current generation.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Binding {
    pub key: WriterKey,
    pub name: ShortName,
    pub cli: Cli,
    pub generation: Generation,
    /// The head's process identity, opaque text written by the store.
    pub head: String,
    /// The head's native channel (socket, thread id), opaque text.
    pub handle: Option<String>,
    pub registered_at: Timestamp,
    /// When this head was registered or took the key over; a registration
    /// by the same head writes nothing.
    pub last_seen: Timestamp,
    /// The last drain of this generation that found mail pending (spec
    /// §6.4, §9 signal 9); a drain of an empty address does not write.
    pub last_drain_at: Option<Timestamp>,
    /// Consecutive Stop blocks of this generation that were written and
    /// finished; the hook owns the bound (spec §6.1, §12 `stopBlock.max`).
    pub stop_blocks: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterRequest {
    pub key: WriterKey,
    pub cli: Cli,
    /// The project folder name; reduced to the name alphabet by the core.
    pub project: String,
    /// The head's own two characters, when its CLI names it (Claude Code).
    pub own_suffix: Option<String>,
    pub head: String,
    pub handle: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Registered {
    Created {
        name: ShortName,
        generation: Generation,
    },
    Refreshed {
        name: ShortName,
        generation: Generation,
    },
    Replaced {
        name: ShortName,
        generation: Generation,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RegisterRefusal {
    /// The judgement does not fit the state: a judgement with no stored
    /// binding, or none with one. Nothing changed.
    JudgementMismatch,
    /// A different head while the stored one is alive.
    Conflict,
    /// A different head while the stored one is unknown; retry later.
    Deferred,
    /// No short name fits: an empty project or a header bound too small.
    NameDoesNotFit,
    /// The writer key is longer than `frame.maxHeaderChars`.
    KeyTooLong,
    /// The stored generation is the last one; only a corrupt or hand-edited
    /// snapshot gets here, and a takeover must never keep the old number.
    GenerationExhausted,
}

impl RegisterRefusal {
    pub const fn code(&self) -> &'static str {
        match self {
            Self::JudgementMismatch => "judgement-mismatch",
            Self::Conflict => "conflict",
            Self::Deferred => "deferred",
            Self::NameDoesNotFit => "name-does-not-fit",
            Self::KeyTooLong => "key-too-long",
            Self::GenerationExhausted => "generation-exhausted",
        }
    }
}

impl fmt::Display for RegisterRefusal {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.code())
    }
}

impl std::error::Error for RegisterRefusal {}

impl MailboxState {
    /// Registers a head (spec §5.1). The store reads `binding(&req.key)`,
    /// judges it, and passes the judgement as `judged`.
    ///
    /// Only a creation or a takeover writes: the same head again, and every
    /// refusal, return before the sweep and leave the state as it was, so a
    /// hook of a registered head with no mail writes nothing.
    pub fn register(
        &mut self,
        req: RegisterRequest,
        judged: Option<StoredHead>,
        now: Timestamp,
        limits: &Limits,
        ids: &mut dyn IdSource,
    ) -> Result<Registered, RegisterRefusal> {
        if req.key.as_str().chars().count() > limits.frame.max_header_chars as usize {
            return Err(RegisterRefusal::KeyTooLong);
        }
        let takeover = match (self.bindings.get(&req.key), judged) {
            // A new key whose head already holds another key's binding: the
            // head started a new session inside the same process (spec §5.1,
            // one binding per head), so the new key takes that binding over.
            (None, None) => match self.bindings.values().find(|b| b.head == req.head) {
                None => Takeover::Create,
                Some(held) => Takeover::FromKey {
                    old_key: held.key.clone(),
                    generation: held
                        .generation
                        .next()
                        .ok_or(RegisterRefusal::GenerationExhausted)?,
                },
            },
            (Some(binding), Some(judged)) => {
                if judged.same_head {
                    return Ok(Registered::Refreshed {
                        name: binding.name.clone(),
                        generation: binding.generation,
                    });
                }
                match judged.liveness {
                    Liveness::Alive => return Err(RegisterRefusal::Conflict),
                    Liveness::Unknown => return Err(RegisterRefusal::Deferred),
                    Liveness::Dead => Takeover::Replace(
                        binding
                            .generation
                            .next()
                            .ok_or(RegisterRefusal::GenerationExhausted)?,
                    ),
                }
            }
            _ => return Err(RegisterRefusal::JudgementMismatch),
        };
        self.sweep(now, limits, ids);
        let now = self.last_now;
        let generation = match takeover {
            Takeover::Create => {
                let (name, generation) = self.create(req, Generation::FIRST, now, limits, ids)?;
                return Ok(Registered::Created { name, generation });
            }
            Takeover::FromKey {
                old_key,
                generation,
            } => {
                let (name, generation) = self.create(req, generation, now, limits, ids)?;
                if let Some(old) = self.bindings.remove(&old_key) {
                    self.drop_generation_records(&old_key, old.generation);
                }
                return Ok(Registered::Replaced { name, generation });
            }
            Takeover::Replace(generation) => generation,
        };
        // The sweep never removes a binding, so the judged one is still here.
        let binding = self
            .bindings
            .get_mut(&req.key)
            .ok_or(RegisterRefusal::JudgementMismatch)?;
        let old = binding.generation;
        binding.generation = generation;
        binding.last_drain_at = None;
        binding.stop_blocks = 0;
        binding.head = req.head;
        binding.handle = req.handle;
        binding.registered_at = now;
        binding.last_seen = now;
        let replaced = Registered::Replaced {
            name: binding.name.clone(),
            generation,
        };
        self.drop_generation_records(&req.key, old);
        Ok(replaced)
    }

    /// Adds the binding of a key that has none, at `generation`.
    fn create(
        &mut self,
        req: RegisterRequest,
        generation: Generation,
        now: Timestamp,
        limits: &Limits,
        ids: &mut dyn IdSource,
    ) -> Result<(ShortName, Generation), RegisterRefusal> {
        let name = names::allocate(
            self,
            &req.project,
            &req.cli,
            req.own_suffix.as_deref(),
            limits,
            ids,
        )
        .ok_or(RegisterRefusal::NameDoesNotFit)?;
        let binding = Binding {
            key: req.key.clone(),
            name: name.clone(),
            cli: req.cli,
            generation,
            head: req.head,
            handle: req.handle,
            registered_at: now,
            last_seen: now,
            last_drain_at: None,
            stop_blocks: 0,
        };
        self.bindings.insert(req.key, binding);
        Ok((name, generation))
    }
}

/// What a registration that writes does with the bindings.
enum Takeover {
    Create,
    /// The registering head holds `old_key`'s binding: the new key takes it
    /// over at `generation`.
    FromKey {
        old_key: WriterKey,
        generation: Generation,
    },
    /// The key's own stored head is dead.
    Replace(Generation),
}
