//! Process facts and process control: the single authority for "is this
//! process tuple alive, dead or unknown" and for signalling a process by
//! identity.
//!
//! `facts` judges a normalized `{host, bootId, pidNs, pid, startTime}` tuple;
//! `control` signals by identity without a pid-reuse window. Judge vectors:
//! `packages/process/contracts/process-facts.judge.v1.json`.
//!
//! Every OS-specific call lives behind [`ProcessPlatform`]; the public types
//! carry no raw descriptor or `pid_t`, only [`ProcId`] and [`FdSlot`].

pub mod containment;
pub mod control;
pub mod facts;
pub mod platform;

pub use platform::ProcessPlatform;

use facts::{ProcTuple, Verdict};

/// A process id as the OS numbers it. Never a raw `pid_t`: the drivers cast
/// at the boundary.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct ProcId(pub u32);

impl std::fmt::Display for ProcId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// A file-descriptor slot in a child process. Slot 3 is the first one after
/// stdin, stdout and stderr; a mapping never targets a slot below 3.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct FdSlot(pub u32);

/// The process domain a lock holder created while it held the lock, as the
/// predecessor record names it (`packages/holder-lock/contracts/predecessor.v1.json`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Domain {
    /// The gate process of an attempt on Linux; the domain is empty exactly
    /// when the gate is dead (the kernel kills and reaps the whole PID
    /// namespace before its init becomes a zombie).
    LinuxGate(ProcTuple),
    /// A named Windows Job Object. No driver yet: always `Unknown` / `Refused`.
    WindowsJob(String),
    /// The root of a macOS process tree. No driver yet: always `Unknown` / `Refused`.
    MacosTree(ProcTuple),
}

/// Whether a domain still has processes in it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DomainState {
    /// No process of the domain is left.
    Empty,
    /// At least one process of the domain is still there.
    NotEmpty,
    /// The platform cannot answer for this domain kind; the caller must not
    /// treat this as empty.
    Unknown,
}

/// Result of asking the platform to end every process of a domain.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum KillOutcome {
    /// The domain's processes were signalled, or were already gone.
    Ok,
    /// The platform could not or would not end them (no driver, no
    /// permission, identity not provable).
    Refused,
}

/// Is `domain` empty, as the current platform sees it? Only `linux-gate` on
/// Linux has a real answer today.
pub fn domain_is_empty(domain: &Domain) -> DomainState {
    match domain {
        Domain::LinuxGate(gate) if cfg!(target_os = "linux") => match facts::judge_here(&gate.to_record()) {
            Verdict::Dead => DomainState::Empty,
            Verdict::Alive => DomainState::NotEmpty,
            Verdict::Unknown => DomainState::Unknown,
        },
        Domain::LinuxGate(_) | Domain::WindowsJob(_) | Domain::MacosTree(_) => DomainState::Unknown,
    }
}

/// End every process of `domain` at once. For `linux-gate` this is SIGKILL
/// sent to the gate by identity; a gate that is already gone counts as done.
pub fn domain_kill_all(domain: &Domain) -> KillOutcome {
    match domain {
        Domain::LinuxGate(gate) if cfg!(target_os = "linux") => {
            match control::signal_by_identity(gate, control::Signal::Kill) {
                control::SignalOutcome::Sent
                | control::SignalOutcome::NotFound
                | control::SignalOutcome::IdentityMismatch => KillOutcome::Ok,
                control::SignalOutcome::IdentityUnknown
                | control::SignalOutcome::Denied
                | control::SignalOutcome::Unsupported
                | control::SignalOutcome::Failed(_) => KillOutcome::Refused,
            }
        }
        Domain::LinuxGate(_) | Domain::WindowsJob(_) | Domain::MacosTree(_) => KillOutcome::Refused,
    }
}
