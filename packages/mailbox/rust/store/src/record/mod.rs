//! The record adapter (spec §6.4): the mailbox's state on disk under one
//! `.fgos` directory. Every mutation is one hold: take the holder-lock
//! registry's `mailbox` mutex, read the snapshot, change it in memory with
//! the core, install the new snapshot with `durable-file`, release.
//!
//! Commit point: the rename of the new snapshot. A [`RecordError`] is only
//! returned for a failure before it, and then the installed snapshot is as
//! it was. A failure at or after it is reported in [`Held::warning`] with
//! `wrote: true`, because the new snapshot is live and a caller that retried
//! would apply its change twice.
//!
//! Only a holder of the lock writes `record/`: that invariant is what lets
//! the record delete every file there that no snapshot names.
//!
//! It runs inside the hook, which must never panic.
//!
//! Only this module takes the `mailbox` lock. The holder-lock registry row
//! uses a `<fgosDir>` template that Node's facade could fill, so this is a
//! rule of use, not a refusal: no Node code takes `mailbox`.
#![deny(clippy::unwrap_used, clippy::expect_used, clippy::panic)]
pub mod bodies;
mod os_ids;
mod paths;
mod prune;
mod snapshot;
mod sys;

pub use fgos_holder_lock::Wait;
pub use os_ids::OsIds;
use paths::Creator;
pub use paths::Paths;
pub use snapshot::{snapshot_read_cap, snapshot_write_cap};

use fgos_durable_file::sync_directory;
use fgos_holder_lock::{Acquire, LockScope, ScopeError};
use fgos_mailbox_core::{
    Claim, Finished, IdSource, Limits, MailboxState, MessageId, Refusal, RegisterRefusal,
    Registered, SendOutcome, SendRequest, SnapshotVersionError, Timestamp, WriterKey,
};
use std::collections::BTreeSet;
use std::fmt;
use std::fs::{File, OpenOptions};
use std::io::{self, Read};
use std::os::unix::fs::{DirBuilderExt, MetadataExt, OpenOptionsExt};
use std::path::{Path, PathBuf};

/// The boundaries of one hold, in order. An observer passed to
/// [`Record::hold_observed`] is called at each one that the hold reaches.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Step {
    /// The lock is held; nothing was read.
    Locked,
    /// The snapshot was read and parsed.
    Read,
    /// The core ran and reported a change; the new snapshot is encoded.
    Mutated,
    /// A send's body is installed and its directory synced.
    BodyInstalled,
    /// The new snapshot's temporary file is written.
    Written,
    /// The temporary file is synced.
    Synced,
    /// The new snapshot is renamed into place: the commit point.
    Renamed,
    /// The record directory is synced.
    DirectorySynced,
    /// Bodies no longer referenced are deleted.
    Collected,
}

/// Something that went wrong after the commit point; the change is live.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Warning {
    pub step: Step,
    pub detail: String,
}

/// Whether a hold's change altered the state, from the core's own answer,
/// so the hold writes exactly when the core says so and never encodes the
/// state just to compare it. A closure that runs several core operations
/// returns a [`Reported`] built from their answers.
pub trait ReportsChange {
    fn changed(&self) -> bool;
}

/// A closure's value with the change its core operations reported.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Reported<T> {
    pub value: T,
    pub changed: bool,
}

impl<T> Reported<T> {
    /// A value whose operations changed the state.
    pub fn changing(value: T) -> Self {
        Self {
            value,
            changed: true,
        }
    }

    /// A value whose operations changed nothing.
    pub fn unchanged(value: T) -> Self {
        Self {
            value,
            changed: false,
        }
    }
}

impl<T> ReportsChange for Reported<T> {
    fn changed(&self) -> bool {
        self.changed
    }
}

impl ReportsChange for Claim {
    fn changed(&self) -> bool {
        self.changed
    }
}

impl ReportsChange for Finished {
    fn changed(&self) -> bool {
        self.changed
    }
}

/// A new binding or a takeover changes the state; the same head again
/// does not.
impl ReportsChange for Registered {
    fn changed(&self) -> bool {
        !matches!(self, Registered::Refreshed { .. })
    }
}

/// Every refused registration returns before any change.
impl ReportsChange for Result<Registered, RegisterRefusal> {
    fn changed(&self) -> bool {
        self.as_ref().is_ok_and(ReportsChange::changed)
    }
}

/// A send always changes the state: the attempt is counted, refused or not.
impl ReportsChange for Result<SendOutcome, Refusal> {
    fn changed(&self) -> bool {
        true
    }
}

impl ReportsChange for crate::hook::Begun {
    fn changed(&self) -> bool {
        self.state_changed()
    }
}

/// The result of a hold that reached its end or its commit point.
#[derive(Debug)]
pub struct Held<R> {
    /// What the closure returned.
    pub value: R,
    /// Whether a new snapshot was installed.
    pub wrote: bool,
    pub warning: Option<Warning>,
    /// What the deletions after the install did.
    pub collected: Collected,
}

/// Body files and temporaries the hold deleted after its install. A failed
/// deletion is not an error: the next send's sweep tries again.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct Collected {
    pub deleted: u32,
    pub failed: u32,
}

/// Why a hold changed nothing.
#[derive(Debug)]
pub enum RecordError {
    /// Another process held the lock past the wait.
    LockBusy {
        waited_ms: Option<u64>,
    },
    /// The lock cannot be taken on this system.
    LockUnavailable {
        detail: String,
    },
    /// The registry row could not be resolved, or the lock directory could
    /// not be created (holder-lock reports both the same way).
    LockRegistry {
        detail: String,
    },
    /// The snapshot is of another version; it is neither used nor
    /// overwritten.
    SnapshotVersion(SnapshotVersionError),
    /// The snapshot is larger than the read cap derived from the limits
    /// contract (`snapshot_read_cap`); someone other than the record wrote
    /// it. It is not parsed and never overwritten.
    SnapshotTooLarge {
        bytes: u64,
        cap: u64,
    },
    /// A send would take the snapshot past the write cap
    /// (`snapshot_write_cap`): the mailbox is full and nothing was written.
    /// Drains, finishes and registrations still write.
    RecordFull {
        bytes: u64,
        cap: u64,
    },
    /// The snapshot is not a readable regular file of this shape; it is
    /// never overwritten, because that would reset caps that are never
    /// reset.
    SnapshotUnreadable {
        detail: String,
    },
    /// The random device failed.
    Ids,
    /// A body file of this id exists already; bodies are never overwritten.
    BodyExists {
        id: MessageId,
    },
    /// A record directory is not a real directory of this user.
    RecordDirUntrusted {
        path: PathBuf,
        detail: String,
    },
    /// The hold's observer stopped it.
    Observer {
        step: Step,
        detail: String,
    },
    Io {
        at: &'static str,
        source: io::Error,
    },
}

/// The code of lock contention: a wait outcome, never a fault.
pub const LOCK_BUSY: &str = "lock-busy";

impl RecordError {
    /// A stable code per reason.
    pub fn code(&self) -> &'static str {
        match self {
            Self::LockBusy { .. } => LOCK_BUSY,
            Self::LockUnavailable { .. } => "lock-unavailable",
            Self::LockRegistry { .. } => "lock-registry",
            Self::SnapshotVersion(e) => e.code(),
            Self::SnapshotUnreadable { .. } => "snapshot-unreadable",
            Self::SnapshotTooLarge { .. } => "snapshot-too-large",
            Self::RecordFull { .. } => "record-full",
            Self::Ids => "ids-unavailable",
            Self::BodyExists { .. } => "body-exists",
            Self::RecordDirUntrusted { .. } => "record-dir-untrusted",
            Self::Observer { .. } => "observer",
            Self::Io { .. } => "io",
        }
    }

    fn from_scope(error: ScopeError) -> Self {
        match error {
            ScopeError::Acquire(acquire) => match *acquire {
                Acquire::Held { .. } => Self::LockBusy { waited_ms: None },
                Acquire::Timeout { waited_ms } => Self::LockBusy {
                    waited_ms: Some(waited_ms),
                },
                Acquire::Unavailable { reason, detail } => Self::LockUnavailable {
                    detail: format!("{}: {detail}", reason.as_str()),
                },
                // Never returned as an error; dropping it releases the lock.
                Acquire::Acquired(_) => Self::LockUnavailable {
                    detail: "an acquired lock was reported as an error".to_string(),
                },
            },
            other => Self::LockRegistry {
                detail: other.to_string(),
            },
        }
    }

    fn io(at: &'static str) -> impl FnOnce(io::Error) -> Self {
        move |source| Self::Io { at, source }
    }
}

impl fmt::Display for RecordError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.code())?;
        match self {
            Self::LockBusy {
                waited_ms: Some(ms),
            } => write!(f, ": waited {ms} ms"),
            Self::LockBusy { waited_ms: None } | Self::Ids => Ok(()),
            Self::LockUnavailable { detail }
            | Self::LockRegistry { detail }
            | Self::SnapshotUnreadable { detail } => write!(f, ": {detail}"),
            Self::SnapshotVersion(e) => write!(f, ": {e}"),
            Self::SnapshotTooLarge { bytes, cap } | Self::RecordFull { bytes, cap } => {
                write!(f, ": {bytes} bytes, cap {cap}")
            }
            Self::BodyExists { id } => write!(f, ": {id}"),
            Self::RecordDirUntrusted { path, detail } => {
                write!(f, ": {}: {detail}", path.display())
            }
            Self::Observer { step, detail } => write!(f, ": at {step:?}: {detail}"),
            Self::Io { at, source } => write!(f, ": {at}: {source}"),
        }
    }
}

impl std::error::Error for RecordError {}

/// The mailbox's record under one `.fgos` directory.
#[derive(Debug, Clone)]
pub struct Record {
    paths: Paths,
}

impl Record {
    /// Walks the directory chain from `fgos_dir` down to `bodies/`: checks
    /// each directory that exists before creating anything below it, and
    /// creates each missing one with mode 0700, syncing its parent.
    /// `fgos_dir` must exist.
    pub fn open(fgos_dir: impl Into<PathBuf>) -> Result<Self, RecordError> {
        let paths = Paths::new(fgos_dir);
        for (index, (dir, creator)) in paths.chain().into_iter().enumerate() {
            match std::fs::symlink_metadata(&dir) {
                Err(e) if e.kind() == io::ErrorKind::NotFound && index > 0 => {
                    std::fs::DirBuilder::new()
                        .mode(0o700)
                        .create(&dir)
                        .map_err(RecordError::io("create-dir"))?;
                    if let Some(parent) = dir.parent() {
                        sync_directory(parent).map_err(RecordError::io("create-dir-sync"))?;
                    }
                }
                _ => {}
            }
            check_dir(&dir, creator)?;
        }
        Ok(Self { paths })
    }

    pub fn paths(&self) -> &Paths {
        &self.paths
    }

    /// One hold: `mutate` runs on the installed state with a fresh id
    /// source, and the new state is installed only when `mutate`'s result
    /// reports a change (the core's own answer, [`ReportsChange`]); an
    /// unchanged hold neither encodes nor writes. `now` and `limits` are
    /// the ones `mutate` uses; a hold that writes also retires dead
    /// bindings by them (owner decision Q2).
    pub fn hold<R: ReportsChange>(
        &self,
        wait: Wait,
        now: Timestamp,
        limits: &Limits,
        mutate: impl FnOnce(&mut MailboxState, &mut dyn IdSource) -> R,
    ) -> Result<Held<R>, RecordError> {
        self.hold_observed(wait, now, limits, |_| Ok(()), mutate)
    }

    /// [`Record::hold`] with `observe` called at each [`Step`] reached. An
    /// observer error stops the hold there, exactly as a failure of that
    /// step would: an error before [`Step::Renamed`], a warning from it on.
    pub fn hold_observed<R: ReportsChange>(
        &self,
        wait: Wait,
        now: Timestamp,
        limits: &Limits,
        observe: impl FnMut(Step) -> io::Result<()>,
        mutate: impl FnOnce(&mut MailboxState, &mut dyn IdSource) -> R,
    ) -> Result<Held<R>, RecordError> {
        self.run(
            wait,
            now,
            limits,
            observe,
            |state, ids, _| (mutate(state, ids), None),
            Sweep::No,
        )
    }

    /// One hold that sends: the core decides; an accepted message's body is
    /// installed before the snapshot that names it; a refusal is saved too,
    /// because it changed the budget and the counters (spec §5.3). The
    /// request's `dead_keys` is the store's own judgement, made in the hold:
    /// whatever the caller put there is replaced.
    pub fn send(
        &self,
        req: SendRequest<'_>,
        wait: Wait,
        now: Timestamp,
        limits: &Limits,
    ) -> Result<Held<Result<SendOutcome, Refusal>>, RecordError> {
        self.send_observed(req, wait, now, limits, |_| Ok(()))
    }

    /// [`Record::send`] with an observer, as [`Record::hold_observed`].
    pub fn send_observed(
        &self,
        req: SendRequest<'_>,
        wait: Wait,
        now: Timestamp,
        limits: &Limits,
        observe: impl FnMut(Step) -> io::Result<()>,
    ) -> Result<Held<Result<SendOutcome, Refusal>>, RecordError> {
        let body = req.body;
        self.run(
            wait,
            now,
            limits,
            observe,
            |state, ids, dead| {
                let req = SendRequest {
                    dead_keys: dead.cloned().unwrap_or_default(),
                    ..req
                };
                let sent = state.send(req, now, limits, ids);
                let install = sent.as_ref().ok().map(|outcome| (outcome.id.clone(), body));
                (sent, install)
            },
            Sweep::Yes,
        )
    }

    /// The body of `id`, read without the lock: only a regular file, not
    /// followed through a symlink, never waited on, of exactly
    /// `expected_bytes` (its header's size, read in the same hold that
    /// claimed it) and at most `mailbox.maxBodyBytes`, valid UTF-8.
    /// Anything else is `None`, which the frame shows as a missing body.
    pub fn body(&self, id: &MessageId, expected_bytes: u64, limits: &Limits) -> Option<String> {
        if expected_bytes > limits.max_body_bytes {
            return None;
        }
        self.check_dirs().ok()?;
        let file = open_regular(&self.paths.body(id)?).ok()?;
        let mut bytes = Vec::new();
        file.take(expected_bytes.saturating_add(1))
            .read_to_end(&mut bytes)
            .ok()?;
        if bytes.len() as u64 != expected_bytes {
            return None;
        }
        String::from_utf8(bytes).ok()
    }

    /// The one write path of every hold. `mutate` returns its value and,
    /// for an accepted send, the body to install before the snapshot.
    fn run<'b, R: ReportsChange>(
        &self,
        wait: Wait,
        now: Timestamp,
        limits: &Limits,
        mut observe: impl FnMut(Step) -> io::Result<()>,
        mutate: impl FnOnce(
            &mut MailboxState,
            &mut dyn IdSource,
            Option<&BTreeSet<WriterKey>>,
        ) -> (R, Option<(MessageId, &'b str)>),
        sweep: Sweep,
    ) -> Result<Held<R>, RecordError> {
        let params = self
            .paths
            .lock_params()
            .ok_or_else(|| RecordError::LockRegistry {
                detail: format!("{} is not UTF-8", self.paths.fgos_dir().display()),
            })?;
        let mut scope = LockScope::seeded(Vec::new()).map_err(RecordError::from_scope)?;
        scope
            .acquire(Paths::lock_name(), &params, wait)
            .map_err(RecordError::from_scope)?;
        before_commit(&mut observe, Step::Locked)?;
        let dirs = self.check_dirs()?;
        let mut state = snapshot::read(&self.paths, snapshot_read_cap(limits))?;
        before_commit(&mut observe, Step::Read)?;
        let kept_before = bodies::referenced(&state);
        let mut ids = OsIds::open().map_err(|_| RecordError::Ids)?;
        // A send judges every stored head once, before the core runs: its
        // name resolution and its prune both use this judgement.
        let dead = (sweep == Sweep::Yes).then(|| prune::dead_keys(&state));
        let (value, body) = mutate(&mut state, &mut ids, dead.as_ref());
        if ids.failed() {
            return Err(RecordError::Ids);
        }
        if !value.changed() {
            return Ok(Held {
                value,
                wrote: false,
                warning: None,
                collected: Collected::default(),
            });
        }
        prune::prune(&mut state, now, limits, dead.as_ref());
        let new = snapshot::encode(&state)?;
        // Only a send adds a header, so only a send is refused for size;
        // every other hold writes, and the read cap leaves room for what it
        // can add.
        let write_cap = snapshot_write_cap(limits);
        if sweep == Sweep::Yes && new.len() as u64 > write_cap {
            return Err(RecordError::RecordFull {
                bytes: new.len() as u64,
                cap: write_cap,
            });
        }
        before_commit(&mut observe, Step::Mutated)?;
        if let Some((id, text)) = body {
            bodies::install(&self.paths, &id, text.as_bytes())?;
            before_commit(&mut observe, Step::BodyInstalled)?;
        }
        let mut warning = snapshot::install(&self.paths, &new, &mut observe)?;
        let mut collected = Collected::default();
        if warning.is_none() {
            let kept_after = bodies::referenced(&state);
            let dropped = kept_before.difference(&kept_after).cloned().collect();
            warning = bodies::collect(
                &self.paths,
                &dirs,
                &dropped,
                sweep,
                &kept_after,
                &mut collected,
            )
            .err()
            .map(|detail| Warning {
                step: Step::Collected,
                detail,
            })
            .or_else(|| after_commit(&mut observe, Step::Collected));
        }
        Ok(Held {
            value,
            wrote: true,
            warning,
            collected,
        })
    }

    /// Every directory of the chain, from the `.fgos` directory down, is
    /// checked before the hold reads or writes anything: a worker that can
    /// write `runtime/` must not steer the record's reads, writes or
    /// deletions elsewhere. Returns the identities of `record/` and
    /// `bodies/`, which a deletion checks again on the descriptor it uses.
    /// The record still writes through paths; descriptor-relative I/O for
    /// every step is item `tsk-1lx`.
    fn check_dirs(&self) -> Result<TrustedDirs, RecordError> {
        let mut ids = Vec::with_capacity(2);
        for (dir, creator) in self.paths.chain() {
            let id = check_dir(&dir, creator)?;
            if dir == self.paths.record_dir() || dir == self.paths.bodies_dir() {
                ids.push(id);
            }
        }
        match ids[..] {
            [record, bodies] => Ok(TrustedDirs { record, bodies }),
            _ => Err(RecordError::RecordDirUntrusted {
                path: self.paths.record_dir(),
                detail: "the directory chain lacks record/ or bodies/".to_string(),
            }),
        }
    }
}

/// One directory of the chain: a real directory, not a symlink, owned by
/// this user, with the mode its creator gives it. The record's own
/// directories carry no group or other bits; `.fgos` and `runtime/`, made
/// by others with the user's umask, must not be world-writable.
fn check_dir(dir: &Path, creator: Creator) -> Result<DirId, RecordError> {
    let untrusted = |detail: String| RecordError::RecordDirUntrusted {
        path: dir.to_path_buf(),
        detail,
    };
    let meta = std::fs::symlink_metadata(dir).map_err(|e| untrusted(e.to_string()))?;
    if !meta.file_type().is_dir() {
        return Err(untrusted("not a directory".to_string()));
    }
    if meta.uid() != sys::current_uid() {
        return Err(untrusted(format!(
            "owned by uid {}, not {}",
            meta.uid(),
            sys::current_uid()
        )));
    }
    let forbidden = match creator {
        Creator::Record => 0o077,
        Creator::Others => 0o002,
    };
    if meta.mode() & forbidden != 0 {
        return Err(untrusted(format!(
            "mode {:o} has bits {forbidden:o} set",
            meta.mode() & 0o7777
        )));
    }
    Ok(DirId {
        dev: meta.dev(),
        ino: meta.ino(),
    })
}

/// Whether a writing hold also lists the record directories for files no
/// snapshot names. Only a send does, so the hook path never lists.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Sweep {
    No,
    Yes,
}

/// A directory's identity when the hold checked it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct DirId {
    dev: u64,
    ino: u64,
}

#[derive(Debug, Clone, Copy)]
struct TrustedDirs {
    record: DirId,
    bodies: DirId,
}

/// The directory a file written without the mailbox lock lives in
/// (`runtime/mailbox/`) under `paths`, after the chain from `.fgos` down to
/// it passed the same trust check a hold applies; `None` when it did not or
/// does not exist. Creates nothing.
pub(crate) fn trusted_mailbox_dir(paths: &Paths) -> Option<PathBuf> {
    let mailbox = paths.mailbox_dir();
    for (dir, creator) in paths.chain() {
        check_dir(&dir, creator).ok()?;
        if dir == mailbox {
            return Some(mailbox);
        }
    }
    None
}

/// Opens `path` without following a symlink and without blocking, and
/// refuses anything but a regular file before a byte is read.
pub(crate) fn open_regular(path: &Path) -> io::Result<File> {
    let file = OpenOptions::new()
        .read(true)
        .custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK)
        .open(path)?;
    if !file.metadata()?.file_type().is_file() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "not a regular file",
        ));
    }
    Ok(file)
}

/// The bytes of the regular file at `path`, opened as [`open_regular`]
/// does, refused with `InvalidData` when it holds more than `cap` bytes.
pub(crate) fn read_regular_capped(path: &Path, cap: u64) -> io::Result<Vec<u8>> {
    let file = open_regular(path)?;
    let mut bytes = Vec::new();
    file.take(cap.saturating_add(1)).read_to_end(&mut bytes)?;
    if bytes.len() as u64 > cap {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "larger than its read cap",
        ));
    }
    Ok(bytes)
}

/// Calls the observer at a step before the commit point.
fn before_commit(
    observe: &mut impl FnMut(Step) -> io::Result<()>,
    step: Step,
) -> Result<(), RecordError> {
    observe(step).map_err(|e| RecordError::Observer {
        step,
        detail: e.to_string(),
    })
}

/// Calls the observer at a step after the commit point.
fn after_commit(observe: &mut impl FnMut(Step) -> io::Result<()>, step: Step) -> Option<Warning> {
    observe(step).err().map(|e| Warning {
        step,
        detail: e.to_string(),
    })
}
