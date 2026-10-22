//! The OS-neutral port every fact and control call goes through, and the
//! driver for the platform this binary runs on.

use std::fs::File;
use std::io;
use std::process::{Child, Command};

use crate::control::{Signal, SignalOutcome};
use crate::facts::{CreationMark, Holders, Observed, Observer, PidNs, ProcTuple, ProcView, Relation, Scan, ScanFilter};
use crate::{FdSlot, ProcId};

#[cfg(target_os = "linux")]
pub mod linux;
#[cfg(target_os = "macos")]
pub mod macos;
#[cfg(windows)]
pub mod windows;
pub mod windows_job;
#[cfg(windows)]
pub mod windows_spawn;

/// Facts and control as one OS gives them. A driver answers only what has a
/// clear meaning on its OS and says `Unlistable` / `Unsupported` otherwise.
pub trait ProcessPlatform: Send + Sync {
    /// The host name.
    fn host(&self) -> String;
    /// Boot id of the running kernel; `None` where the OS has none.
    fn boot_id(&self) -> Option<String>;
    /// The PID namespace of this process.
    fn pid_ns(&self) -> PidNs;
    /// One look at `pid` in the process table.
    fn observe(&self, pid: ProcId) -> Observed;
    /// Every process holding a kernel lock on the file `(dev, ino)`.
    fn lock_holders(&self, dev: u64, ino: u64) -> Holders;
    /// The holders of a kernel lock on `(dev, ino)` among `pids` only, read
    /// the same way as [`ProcessPlatform::lock_holders`]. `Unlistable` where
    /// the OS cannot list holders.
    fn lock_holders_among(&self, _dev: u64, _ino: u64, _pids: &[ProcId]) -> Holders {
        Holders::Unlistable
    }
    /// Parent, process group and start time of every visible process, from
    /// one pass over the process table; `None` where the OS has no such pass.
    fn relations(&self) -> Option<Vec<Relation>> {
        None
    }
    /// Parent, group and start time of `pid` alone, from one stat read; `None`
    /// where the OS has no such read or the process is gone.
    fn relation_of(&self, _pid: ProcId) -> Option<Relation> {
        None
    }
    /// The last pid allocated in this process's pid namespace.
    fn last_pid(&self) -> Option<u32> {
        None
    }
    /// See [`crate::facts::created_since`].
    fn created_since(&self, _mark: &CreationMark) -> Option<Vec<Relation>> {
        None
    }
    /// Every live process with the facts `filter` asks for.
    fn scan(&self, filter: &ScanFilter) -> Scan;
    /// The scan view of `pid` alone; `None` where the OS has no scan or nothing runs there.
    fn view_of(&self, _pid: ProcId, _filter: &ScanFilter) -> Option<ProcView> {
        None
    }
    /// Spawn with an explicit descriptor map; see [`crate::control::spawn_with_fds`].
    fn spawn_with_fds(&self, cmd: Command, fd_map: &[(FdSlot, &File)]) -> io::Result<Child>;
    /// Signal by identity; see [`crate::control::signal_by_identity`].
    fn signal_by_identity(&self, tuple: &ProcTuple, sig: Signal) -> SignalOutcome;

    /// The observer facts of this process.
    fn observer(&self) -> Observer {
        let pid_ns = self.pid_ns();
        Observer { host: self.host(), boot_id: self.boot_id(), pid_ns: pid_ns.id, in_init_pid_ns: pid_ns.is_initial }
    }

    /// The full identity of a live `pid`; `None` when it is absent, a zombie
    /// or unreadable.
    fn identity_of(&self, pid: ProcId) -> Option<ProcTuple> {
        match self.observe(pid) {
            Observed::Live { start_time } => Some(ProcTuple { host: self.host(), boot_id: self.boot_id(), pid_ns: self.pid_ns().id, pid, start_time }),
            _ => None,
        }
    }
}

#[cfg(target_os = "linux")]
static CURRENT: linux::Linux = linux::Linux;
#[cfg(target_os = "macos")]
static CURRENT: macos::Macos = macos::Macos;
#[cfg(windows)]
static CURRENT: windows::Windows = windows::Windows;

/// The driver for the platform this binary runs on.
pub fn current() -> &'static dyn ProcessPlatform {
    &CURRENT
}

/// The `pid_t` a [`ProcId`] names, or `None` when it names no process at
/// all: pid 0 is "my own process group" to `kill`, and a number that does
/// not fit `pid_t` would wrap negative, which `kill` reads as a group too.
/// Every unix driver casts through here and nowhere else.
#[cfg(unix)]
pub(crate) fn as_pid_t(pid: ProcId) -> Option<libc::pid_t> {
    if pid.0 == 0 {
        return None;
    }
    libc::pid_t::try_from(pid.0).ok()
}

/// The host name through `gethostname`, shared by the unix drivers.
#[cfg(unix)]
pub(crate) fn unix_hostname() -> String {
    let mut buf = [0u8; 256];
    // SAFETY: gethostname writes at most `len` bytes into the buffer.
    let rc = unsafe { libc::gethostname(buf.as_mut_ptr() as *mut libc::c_char, buf.len()) };
    if rc != 0 {
        return "unknown-host".to_string();
    }
    let end = buf.iter().position(|b| *b == 0).unwrap_or(buf.len());
    String::from_utf8_lossy(&buf[..end]).into_owned()
}
