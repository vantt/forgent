//! The registering head against the stored one (spec §5.1): the mailbox
//! compares no pid or start time itself. Judging a stored head that is not
//! the registering one reads the operating system's process table through
//! process facts. The binding keeps the head's
//! process record as opaque text, and liveness comes from the process-facts
//! judge.
use fgos_mailbox_core::{Binding, Liveness, StoredHead};
use fgos_process::facts::{judge_here, Record, Verdict};

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
    serde_json::from_str(&stored.head)
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

/// The hook entry's ancestry as process facts read it at one moment. The
/// entry reads it (the store reads no process table itself); the head
/// finder and the caller check only judge it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ancestry {
    /// The entry's parent process.
    pub parent: Record,
    /// The command name of the parent (`/proc/<pid>/comm` on Linux).
    pub parent_comm: String,
    /// The parent's parent, when it could be read.
    pub grandparent: Option<Record>,
}

/// Where the head CLI sits above its hook entry, as the CLI's hook runner
/// was measured to start it (plans/reports/research-261022-1751-mailbox-v4-hook-process-probe.md).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Topology {
    /// The head starts the entry itself: the entry's parent is the head,
    /// and is not a shell (Codex 0.161.0).
    Direct,
    /// The head starts the entry through one shell that does not exec it:
    /// the parent is `sh`, `dash`, `bash` or `zsh` and its parent is the
    /// head (Claude Code 2.1.308).
    OneShellHop,
}

/// The shells a one-hop head may run its hook command through.
const HOP_SHELLS: [&str; 4] = ["sh", "dash", "bash", "zsh"];

impl Topology {
    /// The record at this topology's head position of `ancestry`; `None`
    /// when the ancestry does not have this shape.
    pub fn head_of(self, ancestry: &Ancestry) -> Option<&Record> {
        let shell = HOP_SHELLS.contains(&ancestry.parent_comm.as_str());
        match self {
            Self::Direct => (!shell).then_some(&ancestry.parent),
            Self::OneShellHop => ancestry.grandparent.as_ref().filter(|_| shell),
        }
    }
}

/// The caller check (spec §6.1): the record at the topology's head
/// position of an ancestry read just before the drain is the head the
/// finder found, both complete. A topology and pid-reuse guard, not a
/// guard against processes of the same user: a tool process the head
/// starts directly also has the head as its parent.
pub fn caller_is_head(ancestry: &Ancestry, topology: Topology, head: &Record) -> bool {
    topology
        .head_of(ancestry)
        .is_some_and(|at| same_complete_head(head, at))
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
}
