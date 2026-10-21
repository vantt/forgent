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
    pub last_seen: Timestamp,
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
}

impl RegisterRefusal {
    pub const fn code(&self) -> &'static str {
        match self {
            Self::JudgementMismatch => "judgement-mismatch",
            Self::Conflict => "conflict",
            Self::Deferred => "deferred",
            Self::NameDoesNotFit => "name-does-not-fit",
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
    pub fn register(
        &mut self,
        req: RegisterRequest,
        judged: Option<StoredHead>,
        now: Timestamp,
        limits: &Limits,
        ids: &mut dyn IdSource,
    ) -> Result<Registered, RegisterRefusal> {
        if self.bindings.contains_key(&req.key) != judged.is_some() {
            return Err(RegisterRefusal::JudgementMismatch);
        }
        let now = self.advance(now);
        let Some(judged) = judged else {
            return self.create(req, now, limits, ids);
        };
        let binding = self
            .bindings
            .get_mut(&req.key)
            .ok_or(RegisterRefusal::JudgementMismatch)?;
        if judged.same_head {
            binding.last_seen = now;
            return Ok(Registered::Refreshed {
                name: binding.name.clone(),
                generation: binding.generation,
            });
        }
        match judged.liveness {
            Liveness::Alive => Err(RegisterRefusal::Conflict),
            Liveness::Unknown => Err(RegisterRefusal::Deferred),
            Liveness::Dead => {
                binding.generation = binding.generation.next();
                binding.head = req.head;
                binding.handle = req.handle;
                binding.registered_at = now;
                binding.last_seen = now;
                Ok(Registered::Replaced {
                    name: binding.name.clone(),
                    generation: binding.generation,
                })
            }
        }
    }

    fn create(
        &mut self,
        req: RegisterRequest,
        now: Timestamp,
        limits: &Limits,
        ids: &mut dyn IdSource,
    ) -> Result<Registered, RegisterRefusal> {
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
            generation: Generation::FIRST,
            head: req.head,
            handle: req.handle,
            registered_at: now,
            last_seen: now,
        };
        self.bindings.insert(req.key, binding);
        Ok(Registered::Created {
            name,
            generation: Generation::FIRST,
        })
    }
}
