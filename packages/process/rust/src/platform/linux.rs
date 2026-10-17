//! Linux driver: `/proc` for facts, pidfd for signalling.

use std::collections::BTreeMap;
use std::fs::{self, File};
use std::io;
use std::path::{Path, PathBuf};
use std::process::{Child, Command};

use super::{as_pid_t, unix_hostname, ProcessPlatform};
use crate::control::{self, Signal, SignalOutcome};
use crate::facts::{self, Holders, Observed, PidNs, ProcTuple, ProcView, Scan, ScanFilter, UnreadableCause, Verdict};
use crate::{FdSlot, ProcId};

/// The inode number of the initial PID namespace, fixed by the kernel
/// (`PROC_PID_INIT_INO`), so "am I in the initial namespace" is one compare.
const INIT_PID_NS: &str = "pid:[4026531836]";

/// The Linux driver: facts from `/proc`, signals through a pidfd.
pub struct Linux;

impl ProcessPlatform for Linux {
    fn host(&self) -> String {
        unix_hostname()
    }

    fn boot_id(&self) -> Option<String> {
        fs::read_to_string("/proc/sys/kernel/random/boot_id")
            .ok()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
    }

    fn pid_ns(&self) -> PidNs {
        match fs::read_link("/proc/self/ns/pid") {
            Ok(link) => {
                let id = link.to_string_lossy().into_owned();
                let is_initial = id == INIT_PID_NS;
                PidNs { id, is_initial }
            }
            Err(_) => PidNs { id: "unknown".to_string(), is_initial: false },
        }
    }

    fn observe(&self, pid: ProcId) -> Observed {
        let Some(raw) = as_pid_t(pid) else {
            return Observed::Absent;
        };
        match fs::read_to_string(format!("/proc/{}/stat", pid.0)) {
            Ok(stat) => match facts::parse_proc_stat(&stat) {
                Some(('Z', _)) | Some(('X', _)) => Observed::Zombie,
                Some((_, start_time)) => Observed::Live { start_time },
                None => Observed::Unreadable(UnreadableCause::DriverMissing),
            },
            Err(err) => match err.kind() {
                // A pid hidden by `hidepid` reads as missing too; signal 0
                // tells a hidden process (EPERM) from no process (ESRCH).
                io::ErrorKind::NotFound if !pid_exists(raw) => Observed::Absent,
                io::ErrorKind::NotFound | io::ErrorKind::PermissionDenied => Observed::Unreadable(UnreadableCause::Permission),
                _ => Observed::Unreadable(UnreadableCause::DriverMissing),
            },
        }
    }

    fn lock_holders(&self, dev: u64, ino: u64) -> Holders {
        let mut holders = Vec::new();
        for pid in proc_pids() {
            // Another user's descriptors cannot be read without privilege,
            // and a process that exits mid-read is not a holder: both read
            // as "does not hold".
            if holds_lock_on(pid, dev, ino).unwrap_or(false) {
                if let Some(tuple) = self.identity_of(pid) {
                    holders.push(tuple);
                }
            }
        }
        Holders::List(holders)
    }

    fn scan(&self, filter: &ScanFilter) -> Scan {
        let own = ProcId(std::process::id());
        let (host, boot_id, pid_ns) = (self.host(), self.boot_id(), self.pid_ns().id);
        let mut views = Vec::new();
        for pid in proc_pids() {
            if pid == own && !filter.include_self {
                continue;
            }
            let mut unreadable = Vec::new();
            let tuple = match self.observe(pid) {
                Observed::Live { start_time } => Some(ProcTuple { host: host.clone(), boot_id: boot_id.clone(), pid_ns: pid_ns.clone(), pid, start_time }),
                // Exited, or gone while the scan ran: nothing is running there.
                Observed::Zombie | Observed::Absent => continue,
                // A process this observer may not look at is still a process:
                // it stays in the list, named by what could not be read.
                Observed::Unreadable(cause) => {
                    unreadable.push(format!("stat: {cause:?}"));
                    None
                }
            };
            views.push(view_of(pid, tuple, filter, unreadable));
        }
        Scan::Views(views)
    }

    fn spawn_with_fds(&self, cmd: Command, fd_map: &[(FdSlot, &File)]) -> io::Result<Child> {
        control::unix_spawn_with_fds(cmd, fd_map)
    }

    fn signal_by_identity(&self, tuple: &ProcTuple, sig: Signal) -> SignalOutcome {
        let observer = self.observer();
        if let Some(outcome) = control::out_of_scope(tuple, &observer) {
            return outcome;
        }
        let Some(raw) = as_pid_t(tuple.pid) else {
            return SignalOutcome::NotFound;
        };
        // SAFETY: pidfd_open takes a pid and flags; the descriptor is closed below.
        let pidfd = unsafe { libc::syscall(libc::SYS_pidfd_open, raw, 0 as libc::c_uint) };
        if pidfd < 0 {
            let err = io::Error::last_os_error();
            return match err.raw_os_error() {
                // A kernel without pidfd, or a seccomp filter that refuses it:
                // check and kill, with the reuse window that implies.
                Some(libc::ENOSYS) | Some(libc::EPERM) => control::unix_signal_after_check(self, tuple, sig),
                _ => control::errno_outcome(err),
            };
        }
        let pidfd = pidfd as libc::c_int;
        // The pidfd pins the pid: whatever the start time says now is still
        // true when the signal is sent (a process reaped meanwhile gives
        // ESRCH from pidfd_send_signal, never a signal to a newcomer).
        let outcome = match facts::judge(&tuple.to_record(), &observer, &facts::PlatformTable(self)) {
            Verdict::Alive => {
                // SAFETY: pidfd_send_signal takes the pidfd, a signal, an optional siginfo and flags.
                let rc = unsafe {
                    libc::syscall(libc::SYS_pidfd_send_signal, pidfd, control::signo(sig), std::ptr::null::<libc::siginfo_t>(), 0 as libc::c_uint)
                };
                if rc == 0 {
                    SignalOutcome::Sent
                } else {
                    control::errno_outcome(io::Error::last_os_error())
                }
            }
            Verdict::Dead => SignalOutcome::IdentityMismatch,
            Verdict::Unknown => SignalOutcome::IdentityUnknown,
        };
        // SAFETY: closing the descriptor opened above.
        unsafe {
            libc::close(pidfd);
        }
        outcome
    }
}

/// Signal 0: does any process (even one `/proc` hides from us) own `pid`?
fn pid_exists(pid: libc::pid_t) -> bool {
    // SAFETY: kill with signal 0 only checks for existence and permission.
    if unsafe { libc::kill(pid, 0) } == 0 {
        return true;
    }
    io::Error::last_os_error().raw_os_error() == Some(libc::EPERM)
}

/// Every numeric entry of `/proc`, in directory order.
fn proc_pids() -> Vec<ProcId> {
    let Ok(entries) = fs::read_dir("/proc") else {
        return Vec::new();
    };
    entries
        .filter_map(|entry| entry.ok())
        .filter_map(|entry| entry.file_name().to_str().and_then(|name| name.parse::<u32>().ok()))
        .map(ProcId)
        .collect()
}

/// Does `pid` hold an open description with a kernel lock on `(dev, ino)`?
/// Each `lock:` line under `/proc/<pid>/fdinfo/<fd>` names the inode; the
/// descriptor itself is then stat'ed, so the device compares as the file's
/// own `st_dev` (the lock line prints the superblock device, which differs
/// on btrfs subvolumes and overlay mounts).
fn holds_lock_on(pid: ProcId, dev: u64, ino: u64) -> io::Result<bool> {
    use std::os::unix::fs::MetadataExt;
    // One stat per descriptor finds the ones open on the file; only those
    // have their fdinfo read for a lock line (a full read of every fdinfo
    // costs several times more on a busy host).
    let proc_dir = Path::new("/proc").join(pid.0.to_string());
    for entry in fs::read_dir(proc_dir.join("fd"))? {
        let entry = entry?;
        match fs::metadata(entry.path()) {
            Ok(meta) if meta.dev() == dev && meta.ino() == ino => {}
            _ => continue,
        }
        let info = match fs::read_to_string(proc_dir.join("fdinfo").join(entry.file_name())) {
            Ok(info) => info,
            Err(err) if err.kind() == io::ErrorKind::NotFound => continue,
            Err(err) => return Err(err),
        };
        if fdinfo_lock_inodes(&info).any(|locked| locked == ino) {
            return Ok(true);
        }
    }
    Ok(false)
}

/// Inode numbers named by the `lock:` lines of one fdinfo text. A line reads
/// `lock:\t1: FLOCK  ADVISORY  WRITE 12345 00:2f:98765 0 EOF`; the
/// `major:minor:inode` token is the one with two colons.
fn fdinfo_lock_inodes(info: &str) -> impl Iterator<Item = u64> + '_ {
    info.lines()
        .filter(|line| line.starts_with("lock:"))
        .filter_map(|line| line.split_whitespace().find(|token| token.matches(':').count() == 2 && !token.ends_with(':')))
        .filter_map(|token| token.rsplit(':').next().and_then(|ino| ino.parse::<u64>().ok()))
}

/// The scan view of one process. Each read that fails is named in
/// `unreadable` with the OS error (another user's process gives
/// `permission denied`; a kernel thread has no exe).
fn view_of(pid: ProcId, tuple: Option<ProcTuple>, filter: &ScanFilter, mut unreadable: Vec<String>) -> ProcView {
    let base = PathBuf::from(format!("/proc/{}", pid.0));
    let mut note = |field: &str, err: io::Error| unreadable.push(format!("{field}: {err}"));

    let exe = fs::read_link(base.join("exe")).map_err(|err| note("exe", err)).ok();
    let cwd = fs::read_link(base.join("cwd")).map_err(|err| note("cwd", err)).ok();
    let cmdline = fs::read(base.join("cmdline"))
        .map(|bytes| split_nul(&bytes))
        .map_err(|err| note("cmdline", err))
        .ok();
    let mut env_subset = BTreeMap::new();
    if !filter.env_keys.is_empty() {
        match fs::read(base.join("environ")) {
            Ok(bytes) => {
                for entry in split_nul(&bytes) {
                    if let Some((key, value)) = entry.split_once('=') {
                        if filter.env_keys.iter().any(|wanted| wanted == key) {
                            env_subset.insert(key.to_string(), value.to_string());
                        }
                    }
                }
            }
            Err(err) => note("environ", err),
        }
    }
    ProcView { pid, tuple, exe, cmdline, cwd, env_subset, unreadable }
}

fn split_nul(bytes: &[u8]) -> Vec<String> {
    bytes
        .split(|b| *b == 0)
        .filter(|part| !part.is_empty())
        .map(|part| String::from_utf8_lossy(part).into_owned())
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lock_lines_name_their_inode_and_other_lines_are_ignored() {
        let info = "pos:\t0\nflags:\t02100002\nmnt_id:\t29\nino:\t98765\nlock:\t1: FLOCK  ADVISORY  WRITE 12345 00:2f:98765 0 EOF\nlock:\t2: POSIX  ADVISORY  READ 12345 08:01:4 0 EOF\n";
        assert_eq!(fdinfo_lock_inodes(info).collect::<Vec<_>>(), vec![98765, 4]);
        assert_eq!(fdinfo_lock_inodes("pos:\t0\n").count(), 0);
    }

    #[test]
    fn observes_this_process_as_live_with_a_start_time() {
        match Linux.observe(ProcId(std::process::id())) {
            Observed::Live { start_time } => assert!(start_time.parse::<u64>().is_ok()),
            other => panic!("expected live, got {other:?}"),
        }
    }

    #[test]
    fn a_pid_beyond_the_table_is_absent() {
        let pid_max: u32 = fs::read_to_string("/proc/sys/kernel/pid_max").unwrap().trim().parse().unwrap();
        assert_eq!(Linux.observe(ProcId(pid_max + 1)), Observed::Absent);
        assert_eq!(Linux.observe(ProcId(u32::MAX)), Observed::Absent, "a pid that does not fit pid_t names nothing");
        assert_eq!(Linux.observe(ProcId(0)), Observed::Absent, "pid 0 is a process group to kill(2), never a process");
    }

    #[test]
    fn the_initial_namespace_is_recognised_by_its_fixed_inode() {
        let ns = Linux.pid_ns();
        assert!(ns.id.starts_with("pid:[") || ns.id == "unknown");
        assert_eq!(ns.is_initial, ns.id == INIT_PID_NS);
    }
}
