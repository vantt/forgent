//! The registering head against the stored one (spec §5.1): the mailbox
//! compares no pid or start time itself. Judging a stored head that is not
//! the registering one reads the operating system's process table through
//! process facts. The binding keeps the head's
//! process record as opaque text, and liveness comes from the process-facts
//! judge.
use crate::adapters::AdapterFacts;
use fgos_mailbox_core::{Binding, Liveness, StoredHead};
use fgos_process::facts::{judge_here, Record, Relation, Verdict};
use std::path::{Path, PathBuf};

/// Whether `record` names a process at all: a pid and a start time. A
/// default or partial record never stands for a head.
pub fn is_complete(record: &Record) -> bool {
    record.pid.is_some() && record.start_time.is_some()
}

/// The text a binding keeps as its head; the only writer of `Binding.head`.
pub fn head_text(record: &Record) -> String {
    record.to_json().to_string()
}

/// The store's judgement of `stored` against the registering head. An
/// unreadable or incomplete stored head is never the same head, and the
/// judge reads it as `Unknown`, so nothing is guessed.
pub fn judge_stored(stored: &Binding, registering: &Record) -> StoredHead {
    let stored_record = stored_record(stored);
    let same_head = same_complete_head(&stored_record, registering);
    let liveness = if same_head {
        // The registering record is the running head itself.
        Liveness::Alive
    } else {
        liveness_of(&stored_record)
    };
    StoredHead {
        same_head,
        liveness,
    }
}

/// The store's one judgement of a stored head's liveness, used at
/// registration (through [`judge_stored`]), when pruning and when a send
/// resolves names. An unreadable head is `Unknown`, never `Dead`.
pub fn stored_liveness(stored: &Binding) -> Liveness {
    liveness_of(&stored_record(stored))
}

fn stored_record(stored: &Binding) -> Record {
    record_of_head_text(&stored.head)
}

/// The process record a binding's head text holds (the inverse of
/// [`head_text`]); an unreadable text is an empty record.
pub(crate) fn record_of_head_text(text: &str) -> Record {
    serde_json::from_str(text)
        .map(|value| Record::from_json(&value))
        .unwrap_or_default()
}

fn liveness_of(record: &Record) -> Liveness {
    match judge_here(record) {
        Verdict::Alive => Liveness::Alive,
        Verdict::Dead => Liveness::Dead,
        Verdict::Unknown => Liveness::Unknown,
    }
}

/// Whether two records name the same process: both complete and equal as
/// a binding keeps them, so a field the text form drops (an empty or
/// unknown boot id) cannot make a head differ from itself. The one
/// same-head comparison of the store.
fn same_complete_head(kept: &Record, live: &Record) -> bool {
    let live = Record::from_json(&live.to_json());
    let kept = Record::from_json(&kept.to_json());
    is_complete(&live) && is_complete(&kept) && kept == live
}

/// The hook entry's ancestry as process facts read it at one moment
/// ([`crate::ancestry::ancestry_of`] reads it); the head finders and the
/// caller check only judge it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ancestry {
    /// The entry's parent process.
    pub parent: Record,
    /// The parent's place in the process tree, kept whole.
    pub parent_relation: Relation,
    /// The executable the parent runs (`/proc/<pid>/exe`).
    pub parent_exe: Option<PathBuf>,
    /// The path the parent was invoked as (`argv[0]`).
    pub parent_argv0: Option<String>,
    /// The parent's kernel command name (`/proc/<pid>/comm`), which a process
    /// may set for itself: pi runs the `node` executable and names itself `pi`.
    pub parent_comm: Option<String>,
    /// The parent's parent, when it could be read.
    pub grandparent: Option<Record>,
}

/// Where the head CLI sits above its hook entry, as the adapters contract
/// records it per CLI (`hookFacts.<cli>.hookTopology`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Topology {
    /// The head starts the entry itself: the entry's parent is the head,
    /// running one of the CLI's head executables.
    Direct,
    /// The head starts the entry through one shell that does not exec it:
    /// the parent is the CLI's hook shell, and its parent is the head.
    OneShellHop,
}

/// The record at the head position of `ancestry` for a CLI with `facts`,
/// or why there is none:
///
/// - `Direct`: the parent, when its executable's file name is one of
///   `facts.head_executables` and, where the contract names a `headComm`,
///   its command name is that name (otherwise `WrongExecutable`: a
///   subreaper, a pane process or another program on the same executable,
///   such as any Node process for pi, never stands for a head);
/// - `OneShellHop`: the grandparent, when the parent runs the resolved
///   `facts.hook_shell` and was invoked as exactly that path (otherwise
///   `WrongTopology`: a tool's login shell is refused unless it is
///   literally what the CLI invokes for hooks).
pub fn head_position<'a>(
    ancestry: &'a Ancestry,
    facts: &AdapterFacts,
) -> Result<&'a Record, NoHead> {
    match facts.topology {
        Topology::Direct => {
            let name = ancestry
                .parent_exe
                .as_deref()
                .and_then(Path::file_name)
                .and_then(|name| name.to_str());
            let comm_holds = facts
                .head_comm
                .as_deref()
                .is_none_or(|want| ancestry.parent_comm.as_deref() == Some(want));
            if comm_holds
                && name.is_some_and(|name| facts.head_executables.iter().any(|e| e == name))
            {
                Ok(&ancestry.parent)
            } else {
                Err(NoHead::WrongExecutable)
            }
        }
        Topology::OneShellHop => {
            let shell = facts.hook_shell.as_deref().ok_or(NoHead::WrongTopology)?;
            let invoked = ancestry.parent_argv0.as_deref().map(Path::new) == Some(shell);
            let runs = ancestry.parent_exe.is_some()
                && std::fs::canonicalize(shell).ok() == ancestry.parent_exe;
            if invoked && runs {
                ancestry.grandparent.as_ref().ok_or(NoHead::WrongTopology)
            } else {
                Err(NoHead::WrongTopology)
            }
        }
    }
}

/// The caller check (spec §6.1): the record at the head position of an
/// ancestry read just before the drain is the head the finder found, both
/// complete. A topology and pid-reuse guard, not a guard against
/// processes of the same user: a tool process the head starts directly
/// also has the head as its parent.
pub fn caller_is_head(ancestry: &Ancestry, facts: &AdapterFacts, head: &Record) -> bool {
    head_position(ancestry, facts).is_ok_and(|at| same_complete_head(head, at))
}

/// Why a head finder found no head. A CLI without a session file uses
/// only the variants that apply to it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NoHead {
    /// The head position holds a process with no session file.
    NoSessionFile,
    /// The session file is not a readable regular JSON object within
    /// `hook.maxReadBytes` (a symlink, a FIFO, a directory, too large,
    /// not JSON).
    Unreadable,
    /// The session file belongs to another session than the writer key.
    OtherSession,
    /// The session file names another pid than the head position's.
    OtherProcess,
    /// The file's `procStart` is not the head process's start time: the
    /// pid was reused after the file was written.
    StartTimeMismatch,
    /// The ancestry does not have the topology's shape, or its head
    /// position names no process.
    WrongTopology,
    /// The process at a direct head position runs none of the CLI's head
    /// executables.
    WrongExecutable,
    /// The payload names no usable session, so no writer key.
    NoWriter,
    /// The entry's own environment names another session than the
    /// payload: a tool process piping someone's payload.
    WriterMismatch,
}
