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
//! It runs inside the hook, which must never panic.
#![deny(clippy::unwrap_used, clippy::expect_used, clippy::panic)]
mod os_ids;
mod paths;
mod snapshot;
mod sys;

pub use fgos_holder_lock::Wait;
pub use os_ids::OsIds;
pub use paths::Paths;

use fgos_durable_file::sync_directory;
use fgos_holder_lock::{Acquire, LockScope, ScopeError};
use fgos_mailbox_core::{IdSource, MailboxState, SnapshotVersionError};
use std::fmt;
use std::io;
use std::os::unix::fs::{DirBuilderExt, MetadataExt};
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
    /// source, and the new state is installed only when it differs.
    pub fn hold<R>(
        &self,
        wait: Wait,
        mutate: impl FnOnce(&mut MailboxState, &mut dyn IdSource) -> R,
    ) -> Result<Held<R>, RecordError> {
        self.hold_observed(wait, |_| Ok(()), mutate)
    }

    /// [`Record::hold`] with `observe` called at each [`Step`] reached. An
    /// observer error stops the hold there, exactly as a failure of that
    /// step would: an error before [`Step::Renamed`], a warning from it on.
    pub fn hold_observed<R>(
        &self,
        wait: Wait,
        mut observe: impl FnMut(Step) -> io::Result<()>,
        mutate: impl FnOnce(&mut MailboxState, &mut dyn IdSource) -> R,
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
        self.check_dirs()?;
        let (old, mut state) = snapshot::read(&self.paths)?;
        before_commit(&mut observe, Step::Read)?;
        let mut ids = OsIds::open().map_err(|_| RecordError::Ids)?;
        let value = mutate(&mut state, &mut ids);
        if ids.failed() {
            return Err(RecordError::Ids);
        }
        let new = snapshot::encode(&state)?;
        if new == old {
            return Ok(Held {
                value,
                wrote: false,
                warning: None,
            });
        }
        before_commit(&mut observe, Step::Mutated)?;
        let mut warning = snapshot::install(&self.paths, &new, &mut observe)?;
        if warning.is_none() {
            warning = after_commit(&mut observe, Step::Collected);
        }
        Ok(Held {
            value,
            wrote: true,
            warning,
        })
    }

    /// The record directories must be real directories of this user, not
    /// symlinks: a worker that can write `runtime/` must not steer the
    /// record's reads, writes or deletions elsewhere.
    fn check_dirs(&self) -> Result<(), RecordError> {
        for dir in [self.paths.record_dir(), self.paths.bodies_dir()] {
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
        }
        Ok(())
    }
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
