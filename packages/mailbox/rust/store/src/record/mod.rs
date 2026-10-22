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
#![deny(clippy::unwrap_used, clippy::expect_used, clippy::panic)]
pub mod bodies;
mod os_ids;
mod paths;
mod prune;
mod snapshot;
mod sys;

pub use fgos_holder_lock::Wait;
pub use os_ids::OsIds;
pub use paths::Paths;

use fgos_durable_file::sync_directory;
use fgos_holder_lock::{Acquire, LockScope, ScopeError};
use fgos_mailbox_core::{
    IdSource, Limits, MailboxState, MessageId, Refusal, SendOutcome, SendRequest,
    SnapshotVersionError, Timestamp,
};
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
    /// The core ran and the new snapshot differs from the one read.
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

impl RecordError {
    /// A stable code per reason.
    pub fn code(&self) -> &'static str {
        match self {
            Self::LockBusy { .. } => "lock-busy",
            Self::LockUnavailable { .. } => "lock-unavailable",
            Self::LockRegistry { .. } => "lock-registry",
            Self::SnapshotVersion(e) => e.code(),
            Self::SnapshotUnreadable { .. } => "snapshot-unreadable",
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
    /// Creates the record directories (mode 0700) when missing and syncs
    /// the parent of each one it created. `fgos_dir` must exist.
    pub fn open(fgos_dir: impl Into<PathBuf>) -> Result<Self, RecordError> {
        let paths = Paths::new(fgos_dir);
        for dir in paths.owned_dirs() {
            create_below(paths.fgos_dir(), &dir)?;
        }
        Ok(Self { paths })
    }

    pub fn paths(&self) -> &Paths {
        &self.paths
    }

    /// One hold: `mutate` runs on the installed state with a fresh id
    /// source, and the new state is installed only when it differs. `now`
    /// and `limits` are the ones `mutate` uses; a hold that writes also
    /// retires dead bindings by them (owner decision Q2).
    pub fn hold<R>(
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
    pub fn hold_observed<R>(
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
            |state, ids| (mutate(state, ids), None),
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
            |state, ids| {
                let req = SendRequest {
                    dead_keys: prune::dead_keys(state),
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
    fn run<'b, R>(
        &self,
        wait: Wait,
        now: Timestamp,
        limits: &Limits,
        mut observe: impl FnMut(Step) -> io::Result<()>,
        mutate: impl FnOnce(&mut MailboxState, &mut dyn IdSource) -> (R, Option<(MessageId, &'b str)>),
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
        let (old, mut state) = snapshot::read(&self.paths)?;
        before_commit(&mut observe, Step::Read)?;
        let kept_before = bodies::referenced(&state);
        let mut ids = OsIds::open().map_err(|_| RecordError::Ids)?;
        let (value, body) = mutate(&mut state, &mut ids);
        if ids.failed() {
            return Err(RecordError::Ids);
        }
        let mut new = snapshot::encode(&state)?;
        if new == old {
            return Ok(Held {
                value,
                wrote: false,
                warning: None,
                collected: Collected::default(),
            });
        }
        if !prune::prune(&mut state, now, limits).is_empty() {
            new = snapshot::encode(&state)?;
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

    /// The record directories must be real directories of this user, not
    /// symlinks: a worker that can write `runtime/` must not steer the
    /// record's reads, writes or deletions elsewhere. Returns their
    /// identities, which a deletion checks again on the descriptor it uses.
    fn check_dirs(&self) -> Result<TrustedDirs, RecordError> {
        let check = |dir: PathBuf| {
            let untrusted = |detail: String| RecordError::RecordDirUntrusted {
                path: dir.clone(),
                detail,
            };
            let meta = std::fs::symlink_metadata(&dir).map_err(|e| untrusted(e.to_string()))?;
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
            Ok(DirId {
                dev: meta.dev(),
                ino: meta.ino(),
            })
        };
        Ok(TrustedDirs {
            record: check(self.paths.record_dir())?,
            bodies: check(self.paths.bodies_dir())?,
        })
    }
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

/// Opens `path` without following a symlink and without blocking, and
/// refuses anything but a regular file before a byte is read.
fn open_regular(path: &Path) -> io::Result<File> {
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

/// Creates each missing directory from `base` down to `dir`, mode 0700,
/// and syncs the parent of each one it created.
fn create_below(base: &Path, dir: &Path) -> Result<(), RecordError> {
    let below = dir
        .strip_prefix(base)
        .map_err(|_| RecordError::io("create-dir")(io::Error::other("outside the fgos dir")))?;
    let mut parent = base.to_path_buf();
    for part in below.components() {
        let path = parent.join(part);
        match std::fs::DirBuilder::new().mode(0o700).create(&path) {
            Ok(()) => sync_directory(&parent).map_err(RecordError::io("create-dir-sync"))?,
            Err(e) if e.kind() == io::ErrorKind::AlreadyExists => {}
            Err(e) => return Err(RecordError::io("create-dir")(e)),
        }
        parent = path;
    }
    Ok(())
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
