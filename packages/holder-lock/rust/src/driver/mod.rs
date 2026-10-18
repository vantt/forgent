//! Per-OS drivers behind the port. A driver answers only OS questions (lock
//! one description, what the filesystem guarantees, who holds a file, what
//! is left after a borrowing child); the rules built on them live in `port`.

use std::fs::File;
use std::io;
use std::path::{Path, PathBuf};
use std::time::Duration;

use crate::port::{Guarantee, HoldersList, Mode};

#[cfg(unix)]
pub mod flock;
#[cfg(windows)]
pub mod windows;

/// One non-blocking lock attempt.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TryLock {
    /// The description holds the lock now.
    Locked,
    /// Another description holds a conflicting lock.
    WouldBlock,
}

/// Processes still holding a borrowed description after the kill wait.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Leftovers {
    /// How many were signaled.
    pub killed: u32,
    /// A description holder outside the borrowing domain was not signaled.
    pub foreign: bool,
    /// Pids (Linux) or the process group id (macOS) still there.
    pub pids: Vec<u32>,
}

/// The OS half of the lock port.
pub trait LockDriver: Sync {
    /// Whether this platform has a driver at all.
    fn supported(&self) -> bool;
    /// Why not, when [`LockDriver::supported`] is false.
    fn unsupported_detail(&self) -> &'static str;
    /// One non-blocking attempt to lock `file` in `mode`.
    fn try_lock(&self, file: &File, mode: Mode) -> io::Result<TryLock>;
    /// Guarantee for lock files in directory `dir` (the nearest existing
    /// ancestor is measured when `dir` does not exist yet).
    fn guarantee(&self, dir: &Path) -> Guarantee;
    /// Guarantee for the filesystem an open lock file lives on.
    fn file_guarantee(&self, file: &File) -> io::Result<Guarantee>;
    /// Path an open description was opened under.
    fn description_path(&self, file: &File) -> io::Result<PathBuf>;
    /// Who holds a lock on `file`.
    fn holders(&self, file: &File) -> HoldersList;
    /// Shape the borrowing child's request before spawn (own process group,
    /// so what it leaves behind can be ended).
    #[cfg(unix)]
    fn prepare_borrow(&self, request: &mut fgos_process::mapped::MappedSpawn);
    /// After the borrowing child `child_pid` exited: end whatever still
    /// holds `file`'s description apart from this process and wait up to
    /// `kill_wait` for it to be gone. `Ok(killed)` when nothing is left.
    /// `since`: a mark at which no process other than this one held the
    /// description (it was opened after it, or a drain that began there
    /// proved it), so a driver may read only processes created since.
    /// `None`: read every process.
    fn end_leftovers(&self, file: &File, child_pid: u32, kill_wait: Duration, since: Option<fgos_process::facts::CreationMark>) -> Result<u32, Leftovers>;
    /// Called by the port right before it closes or abandons a description
    /// that holds a lock. POSIX: nothing (a lock lives with the open file
    /// description, and a borrowed copy may still share it). Windows: an
    /// explicit unlock, safe because no other process can share the lock.
    fn before_close(&self, file: &File);
    /// Whether `file`, locked just now, is still the file at `path` (a lock
    /// file replaced between open and lock is retried by the port).
    fn same_file(&self, file: &File, path: &Path) -> bool;
}

/// The driver of the platform this binary runs on.
pub fn current() -> &'static dyn LockDriver {
    #[cfg(unix)]
    {
        &flock::FlockDriver
    }
    #[cfg(windows)]
    {
        &windows::LockFileExDriver
    }
}
