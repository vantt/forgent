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
#[cfg(unix)]
pub mod mapped;
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
    /// The leader of a process group on Linux without a usable pid namespace;
    /// best-effort, judged by the `linux-pgroup` containment driver. The pgid
    /// is the leader's pid.
    LinuxPgroup(ProcTuple),
    /// A named kill-on-close Windows Job Object plus the process tuples that
    /// bound the holder's process tree; judged by the Windows driver
    /// ([`platform::windows_job`]), `Unknown` / `Refused` on other platforms.
    WindowsJob(WindowsJob),
    /// The root of a macOS process tree, a session and process-group leader;
    /// best-effort, judged by the `macos-tree` containment driver, `Unknown` /
    /// `Refused` on other platforms.
    MacosTree(ProcTuple),
}

/// The record of a `windows-job` domain
/// (`packages/holder-lock/contracts/predecessor.v1.json`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WindowsJob {
    /// The job's name, `Local\fgos-borrow-<lock>-<pid>-<creation>-<counter>`.
    pub job: String,
    /// The Windows session of the holder; a contender in another session never
    /// judges the domain empty.
    pub session_id: u32,
    /// FILETIME at declare: a process created earlier is not part of the domain.
    pub declared_at: u64,
    /// The locking process (`startTime` is its creation FILETIME, decimal).
    pub holder: ProcTuple,
    /// The second job owner, once it has acked; it is never a member.
    pub keeper: Option<ProcTuple>,
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

/// A domain being waited on. One value serves one wait: on Windows it keeps
/// the handles of every member it has seen, so each poll re-reads the sources
/// but never forgets a process.
pub struct DomainWatch {
    inner: Watch,
}

enum Watch {
    /// `linux-gate` or `linux-pgroup` here, or a kind this platform has no driver for.
    Direct(Domain),
    #[cfg(windows)]
    Job(platform::windows_job::ContenderView),
}

/// Start watching `domain` with the current platform's driver.
pub fn domain_watch(domain: &Domain) -> DomainWatch {
    #[cfg(windows)]
    if let Domain::WindowsJob(record) = domain {
        return DomainWatch { inner: Watch::Job(platform::windows_job::ContenderView::new(record)) };
    }
    DomainWatch { inner: Watch::Direct(domain.clone()) }
}

/// The job view of the named Windows job, for the release rule and the keeper.
#[cfg(windows)]
pub use platform::windows_job::{job_view, NamedBy};

/// What a watch saw while it judged a domain: whether the job could be opened
/// and, per pid, which sources named it. Empty off Windows.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct WatchTrace {
    /// The job opened by name (not the fallback over the tree).
    pub job_opened: bool,
    /// `(pid, listed, scanned, in tree)` for every pid any poll named.
    pub named: Vec<(u32, bool, bool, bool)>,
}

/// Is the signal outcome one that leaves nothing to end: sent, or the process
/// was already gone or is no longer the recorded one.
pub(crate) fn signal_settled(outcome: &control::SignalOutcome) -> bool {
    matches!(outcome, control::SignalOutcome::Sent | control::SignalOutcome::NotFound | control::SignalOutcome::IdentityMismatch)
}

impl DomainWatch {
    /// Is the domain empty, as the current platform sees it? Only `linux-gate` and `linux-pgroup`
    /// on Linux, `windows-job` on Windows and `macos-tree` on macOS have a real answer.
    pub fn is_empty(&mut self) -> DomainState {
        match &mut self.inner {
            #[cfg(windows)]
            Watch::Job(view) => view.is_empty(),
            Watch::Direct(Domain::LinuxGate(gate)) if cfg!(target_os = "linux") && gate.start_time == containment::EXITED_GATE => DomainState::Empty,
            Watch::Direct(Domain::LinuxGate(gate)) if cfg!(target_os = "linux") => match facts::judge_here(&gate.to_record()) {
                Verdict::Dead => DomainState::Empty,
                Verdict::Alive => DomainState::NotEmpty,
                Verdict::Unknown => DomainState::Unknown,
            },
            Watch::Direct(Domain::LinuxPgroup(leader)) => containment::pgroup_state(leader),
            Watch::Direct(Domain::MacosTree(root)) => containment::tree_state(root),
            Watch::Direct(_) => DomainState::Unknown,
        }
    }

    /// End every process of the domain at once. For `linux-gate` this is
    /// SIGKILL sent to the gate by identity, then a bounded wait while the
    /// kernel tears the namespace down, as the other drivers wait for empty;
    /// a gate that is already gone counts as done.
    pub fn kill_all(&mut self) -> KillOutcome {
        match &mut self.inner {
            #[cfg(windows)]
            Watch::Job(view) => view.kill_all(),
            Watch::Direct(Domain::LinuxGate(gate)) if cfg!(target_os = "linux") && gate.start_time == containment::EXITED_GATE => KillOutcome::Ok,
            Watch::Direct(Domain::LinuxGate(gate)) if cfg!(target_os = "linux") => {
                if signal_settled(&control::signal_by_identity(gate, control::Signal::Kill)) {
                    containment::wait_dead(gate);
                    KillOutcome::Ok
                } else {
                    KillOutcome::Refused
                }
            }
            Watch::Direct(Domain::LinuxPgroup(leader)) => containment::pgroup_kill(leader),
            Watch::Direct(Domain::MacosTree(root)) => containment::tree_kill(root),
            Watch::Direct(_) => KillOutcome::Refused,
        }
    }

    /// What this watch saw so far (see [`WatchTrace`]).
    pub fn trace(&self) -> WatchTrace {
        match &self.inner {
            #[cfg(windows)]
            Watch::Job(view) => WatchTrace { job_opened: view.job_opened(), named: view.trace().into_iter().map(|(pid, by)| (pid, by.list, by.scan, by.tree)).collect() },
            Watch::Direct(_) => WatchTrace::default(),
        }
    }

    /// Why the last answer was "not empty" when it is a refusal to judge, not a
    /// live process: `predecessor-other-session`.
    pub fn reason(&self) -> Option<&'static str> {
        match &self.inner {
            #[cfg(windows)]
            Watch::Job(view) => view.reason(),
            Watch::Direct(_) => None,
        }
    }
}

/// One-shot [`DomainWatch::is_empty`]. A wait that polls more than once uses
/// [`domain_watch`], so a Windows watch keeps its member handles.
pub fn domain_is_empty(domain: &Domain) -> DomainState {
    domain_watch(domain).is_empty()
}

/// One-shot [`DomainWatch::kill_all`].
pub fn domain_kill_all(domain: &Domain) -> KillOutcome {
    domain_watch(domain).kill_all()
}
