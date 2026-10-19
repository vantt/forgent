//! Linux driver: `/proc` for facts, pidfd for signalling.

use std::collections::BTreeMap;
use std::fs::{self, File};
use std::io;
use std::path::PathBuf;
use std::process::{Child, Command};

use super::{as_pid_t, unix_hostname, ProcessPlatform};
use crate::control::{self, Signal, SignalOutcome};
use crate::facts::{self, CreationMark, Holders, Observed, PidNs, ProcTuple, ProcView, Relation, Scan, ScanFilter, UnreadableCause, Verdict};
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

    fn lock_holders_among(&self, dev: u64, ino: u64, pids: &[ProcId]) -> Holders {
        let mut holders = Vec::new();
        for pid in pids {
            if holds_lock_on(*pid, dev, ino).unwrap_or(false) {
                if let Some(tuple) = self.identity_of(*pid) {
                    holders.push(tuple);
                }
            }
        }
        Holders::List(holders)
    }

    fn relations(&self) -> Option<Vec<Relation>> {
        let proc_dir = File::open("/proc").ok()?;
        let pids = proc_pids();
        if pids.is_empty() {
            return None;
        }
        let mut buf = [0u8; 4096];
        Some(pids.into_iter().filter_map(|pid| read_relation(&proc_dir, pid, &mut buf)).collect())
    }

    fn last_pid(&self) -> Option<u32> {
        fs::read_to_string("/proc/sys/kernel/ns_last_pid").ok()?.trim().parse().ok()
    }

    fn created_since(&self, mark: &CreationMark) -> Option<Vec<Relation>> {
        let floor = mark.last_pid?;
        let pid_max: u64 = fs::read_to_string("/proc/sys/kernel/pid_max").ok()?.trim().parse().ok()?;
        let window = std::time::Duration::from_secs_f64(pid_max as f64 / facts::ALLOCATION_RATE_BOUND as f64);
        if mark.at.elapsed() >= window {
            return None;
        }
        // /proc must list this pid namespace, the one ns_last_pid reads.
        proc_self_pid().ok()?;
        let proc_dir = File::open("/proc").ok()?;
        let mut buf = [0u8; 4096];
        let last = self.last_pid()?;
        let span = if last >= floor { u64::from(last - floor) } else { pid_max.saturating_sub(u64::from(floor)) + u64::from(last) };
        if span <= 4096 {
            // Few allocations since the mark: probe each pid allocated after
            // it, up to the cursor, instead of listing every process. Thread
            // ids share the pid space; only thread-group leaders are kept.
            let mut out = Vec::new();
            let mut pid = floor;
            while pid != last {
                pid = if u64::from(pid) + 1 >= pid_max { 1 } else { pid + 1 };
                if let Some((relation, leader)) = read_relation_and_leader(&proc_dir, ProcId(pid), &mut buf) {
                    if leader {
                        out.push(relation);
                    }
                }
            }
            return Some(out);
        }
        // List first, then read the cursor again: a pid listed here was
        // allocated no later than that read.
        let pids = proc_pids();
        let last = self.last_pid()?;
        let after = |pid: u32| if last >= floor { pid > floor && pid <= last } else { pid > floor || pid <= last };
        Some(
            pids.into_iter()
                .filter(|pid| after(pid.0))
                .filter_map(|pid| read_relation(&proc_dir, pid, &mut buf))
                .collect(),
        )
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

/// One `/proc/<pid>/stat` read relative to an open `/proc`: one open, one
/// read, one close (this runs for many processes after every borrow).
fn read_relation(proc_dir: &File, pid: ProcId, buf: &mut [u8; 4096]) -> Option<Relation> {
    read_relation_and_leader(proc_dir, pid, buf).map(|(relation, _)| relation)
}

/// [`read_relation`], and whether `pid` names a thread-group leader: a
/// thread created with `CLONE_THREAD` has exit signal -1 (stat field 38),
/// which no process has.
fn read_relation_and_leader(proc_dir: &File, pid: ProcId, buf: &mut [u8; 4096]) -> Option<(Relation, bool)> {
    use std::io::Read;
    use std::os::fd::{AsRawFd, FromRawFd};
    let name = std::ffi::CString::new(format!("{}/stat", pid.0)).ok()?;
    // SAFETY: openat on a directory descriptor the caller owns and a
    // NUL-terminated relative name; the result is owned by a File.
    let fd = unsafe { libc::openat(proc_dir.as_raw_fd(), name.as_ptr(), libc::O_RDONLY | libc::O_CLOEXEC) };
    if fd < 0 {
        return None;
    }
    // SAFETY: fd was just opened and is owned by nobody else.
    let mut file = unsafe { File::from_raw_fd(fd) };
    let n = file.read(buf).ok()?;
    let line = if n < buf.len() {
        String::from_utf8_lossy(&buf[..n]).into_owned()
    } else {
        // A stat line never fills the buffer; read it whole if it did.
        let mut rest = buf.to_vec();
        file.read_to_end(&mut rest).ok()?;
        String::from_utf8_lossy(&rest).into_owned()
    };
    let relation = facts::parse_relation(pid, &line)?;
    let exit_signal = facts::proc_stat_fields(&line)?.nth(35)?;
    Some((relation, exit_signal != "-1"))
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
    locked_fds(dev, ino, Some(&[pid])).map(|fds| !fds.is_empty())
}

/// The kernel's lock identity, in the PID namespace of this proc mount.
/// The full `major:minor:inode` token also appears in fdinfo `lock:` lines.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LockEntry {
    /// Kernel lock class (FLOCK, POSIX, OFDLCK).
    pub kind: String,
    /// Kernel locker stamp; OFD locks can carry -1.
    pub pid: i64,
    /// Exact superblock major:minor:inode, independent of stat's device.
    pub token: String,
}

fn parse_lock(line: &str) -> Option<LockEntry> {
    let mut fields = line.split_whitespace();
    fields.next()?; // ordinal
    let kind = fields.next()?;
    if kind == "->" { return None; } // blocked request, not a held lock
    fields.next()?; // advisory/mandatory
    fields.next()?; // read/write
    let pid = fields.next()?.parse().ok()?;
    let token = fields.next()?;
    if token.split(':').count() != 3 { return None; }
    Some(LockEntry { kind: kind.into(), pid, token: token.into() })
}

fn fdinfo_locks(info: &str) -> impl Iterator<Item = LockEntry> + '_ {
    info.lines().filter_map(|line| parse_lock(line.strip_prefix("lock:")?))
}

/// Read the kernel lock table to EOF on one open seq_file. Short reads are
/// page boundaries, not EOF. This is not atomic: presence is evidence, while
/// absence still requires the caller's shared-lock probe before clearance.
pub fn lock_table_entries() -> io::Result<Vec<LockEntry>> {
    use std::io::Read;
    let mut text = String::new();
    File::open("/proc/locks")?.read_to_string(&mut text)?;
    Ok(text.lines().filter_map(parse_lock).collect())
}

/// This process as named by this proc mount. Reject a mount from an ancestor
/// PID namespace: its numbers cannot safely be passed to pidfd/kcmp syscalls.
pub fn proc_self_pid() -> io::Result<ProcId> {
    let pid = fs::read_link("/proc/self")?.to_string_lossy().parse().map_err(io::Error::other)?;
    if pid != std::process::id() {
        return Err(io::Error::other("proc mount belongs to a different PID namespace"));
    }
    Ok(ProcId(pid))
}

/// The exact FLOCK token on this open description.
pub fn own_lock_token(file: &File) -> io::Result<String> {
    use std::os::fd::AsRawFd;
    let info = fs::read_to_string(format!("/proc/self/fdinfo/{}", file.as_raw_fd()))?;
    let token = fdinfo_locks(&info).find(|entry| entry.kind == "FLOCK").map(|entry| entry.token);
    token.ok_or_else(|| io::Error::other("description has no FLOCK record"))
}

/// A descriptor carrying a kernel lock, including its locker stamp.
#[derive(Debug)]
pub struct LockedFd {
    /// Process holding the descriptor.
    pub pid: ProcId,
    /// Descriptor slot in that process.
    pub fd: FdSlot,
    /// Holder identity read before its descriptor table (pins signal intent).
    pub identity: ProcTuple,
    /// Kernel lock identity.
    pub lock: LockEntry,
}

/// Locked descriptors on a stat identity; `None` scans every visible process.
pub fn locked_fds(dev: u64, ino: u64, pids: Option<&[ProcId]>) -> io::Result<Vec<LockedFd>> {
    use std::os::unix::fs::MetadataExt;
    let scanning_all = pids.is_none();
    let all;
    let pids = match pids {
        Some(pids) => pids,
        None => { all = proc_pids(); &all }
    };
    let mut out = Vec::new();
    for &pid in pids {
        let Some(identity) = Linux.identity_of(pid) else { continue; };
        let base = PathBuf::from(format!("/proc/{pid}"));
        let entries = match fs::read_dir(base.join("fd")) {
            Ok(entries) => entries,
            Err(e) if e.kind() == io::ErrorKind::NotFound || (scanning_all && e.kind() == io::ErrorKind::PermissionDenied) => continue,
            Err(e) => return Err(e),
        };
        for entry in entries {
            let entry = entry?;
            let Some(fd) = entry.file_name().to_str().and_then(|s| s.parse().ok()) else { continue; };
            let Ok(meta) = fs::metadata(entry.path()) else { continue; };
            if (meta.dev(), meta.ino()) != (dev, ino) { continue; }
            let info = match fs::read_to_string(base.join("fdinfo").join(entry.file_name())) {
                Ok(info) => info,
                Err(e) if e.kind() == io::ErrorKind::NotFound => continue,
                Err(e) => return Err(e),
            };
            for lock in fdinfo_locks(&info) {
                out.push(LockedFd { pid, fd: FdSlot(fd), identity: identity.clone(), lock });
            }
        }
    }
    Ok(out)
}

/// Compare open descriptions without keeping a duplicate alive.
pub fn kcmp_same_file(pid_a: ProcId, fd_a: FdSlot, pid_b: ProcId, fd_b: FdSlot) -> io::Result<bool> {
    // SAFETY: KCMP_FILE (0) compares descriptor identities and changes nothing.
    let result = unsafe { libc::syscall(libc::SYS_kcmp, pid_a.0, pid_b.0, 0, fd_a.0 as libc::c_ulong, fd_b.0 as libc::c_ulong) };
    if result < 0 { Err(io::Error::last_os_error()) } else { Ok(result == 0) }
}

/// The scan view of one process. Each read that fails is named in
/// `unreadable` with the OS error (another user's process gives
/// `permission denied`; a kernel thread has no exe).
fn view_of(pid: ProcId, tuple: Option<ProcTuple>, filter: &ScanFilter, mut unreadable: Vec<String>) -> ProcView {
    let base = PathBuf::from(format!("/proc/{}", pid.0));
    let mut note = |field: &str, err: io::Error| unreadable.push(format!("{field}: {err}"));

    let effective_uid = fs::read_to_string(base.join("status"))
        .map_err(|err| note("uid", err)).ok()
        .and_then(|status| status.lines().find(|line| line.starts_with("Uid:"))
            .and_then(|line| line.split_whitespace().nth(2))
            .and_then(|uid| uid.parse().ok()));
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
    ProcView { effective_uid, pid, tuple, exe, cmdline, cwd, env_subset, unreadable }
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
        assert_eq!(fdinfo_locks(info).map(|entry| entry.token.rsplit(':').next().unwrap().parse::<u64>().unwrap()).collect::<Vec<_>>(), vec![98765, 4]);
        assert_eq!(fdinfo_locks("pos:\t0\n").count(), 0);
    }

    #[test]
    fn table_parser_keeps_full_identity_and_ignores_blocked_requests() {
        assert_eq!(parse_lock("9: FLOCK ADVISORY WRITE 42 08:01:123 0 EOF"),
            Some(LockEntry { kind: "FLOCK".into(), pid: 42, token: "08:01:123".into() }));
        assert!(parse_lock("9: -> FLOCK ADVISORY WRITE 43 08:01:123 0 EOF").is_none());
        assert!(parse_lock("9: FLOCK ADVISORY WRITE").is_none());
        let entries = fdinfo_locks("lock: 1: FLOCK ADVISORY WRITE 42 00:2f:98765 0 EOF").collect::<Vec<_>>();
        assert_eq!(entries[0].pid, 42);
        assert_eq!(entries[0].token, "00:2f:98765");
    }

    #[test]
    fn a_large_userspace_buffer_does_not_make_proc_locks_a_complete_snapshot() {
        use std::io::Read;
        use std::os::fd::AsRawFd;
        let dir = std::env::temp_dir().join(format!("fgos-process-table-pages-{}", std::process::id()));
        fs::create_dir(&dir).unwrap();
        let file = File::create(dir.join("ranges")).unwrap();
        // Use nonadjacent POSIX ranges so even 64 KiB-page kernels need
        // multiple seq_file pages, without depending on the fd limit.
        // SAFETY: sysconf reads the host page size; fcntl reads a live flock.
        let page = unsafe { libc::sysconf(libc::_SC_PAGESIZE) };
        assert!(page > 0);
        let count = page as usize / 32 + 128;
        for n in 0..count {
            let mut lock: libc::flock = unsafe { std::mem::zeroed() };
            lock.l_type = libc::F_WRLCK as _;
            lock.l_whence = libc::SEEK_SET as _;
            lock.l_start = (n * 2) as _;
            lock.l_len = 1;
            assert_eq!(unsafe { libc::fcntl(file.as_raw_fd(), libc::F_SETLK, &lock) }, 0);
        }
        let mut table = File::open("/proc/locks").unwrap();
        let mut bytes = vec![0; 1024 * 1024];
        let first = table.read(&mut bytes).unwrap();
        let second = table.read(&mut bytes).unwrap();
        assert!(first < bytes.len(), "kernel read filled userspace buffer");
        assert!(second > 0, "expected more than one seq_file page of real locks");
        eprintln!("proc/locks: {count} real range locks, 1 MiB request, first {first} bytes, next {second} bytes");
        let ino = {
            use std::os::unix::fs::MetadataExt;
            file.metadata().unwrap().ino().to_string()
        };
        // Other tests (and host processes) can change the seq_file between
        // pages. Wait for one complete observation of our stable ranges;
        // the old single-page reader can never satisfy this assertion.
        let deadline = std::time::Instant::now() + std::time::Duration::from_secs(5);
        loop {
            let entries = lock_table_entries().unwrap();
            let seen = entries.iter().filter(|entry| entry.kind == "POSIX"
                && entry.pid == i64::from(std::process::id())
                && entry.token.rsplit(':').next() == Some(ino.as_str())).count();
            if seen == count { break; }
            assert!(std::time::Instant::now() < deadline,
                "expected {count} held ranges across seq_file pages, saw {seen}");
            std::thread::sleep(std::time::Duration::from_millis(10));
        }
        drop(file);
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn kernel_table_and_fdinfo_agree_on_the_locker_stamp() {
        use std::os::fd::AsRawFd;
        let path = std::env::temp_dir().join(format!("fgos-process-table-{}", std::process::id()));
        let file = File::create(&path).unwrap();
        // SAFETY: lock a live test-owned file.
        assert_eq!(unsafe { libc::flock(file.as_raw_fd(), libc::LOCK_EX | libc::LOCK_NB) }, 0);
        let token = own_lock_token(&file).unwrap();
        let me = proc_self_pid().unwrap();
        assert!(lock_table_entries().unwrap().iter().any(|entry| entry.kind == "FLOCK" && entry.pid == i64::from(me.0) && entry.token == token));
        let dup = file.try_clone().unwrap();
        let independent = File::open(&path).unwrap();
        match kcmp_same_file(me, FdSlot(file.as_raw_fd() as u32), me, FdSlot(dup.as_raw_fd() as u32)) {
            Ok(same) => {
                assert!(same);
                assert!(!kcmp_same_file(me, FdSlot(file.as_raw_fd() as u32), me, FdSlot(independent.as_raw_fd() as u32)).unwrap());
            }
            Err(e) if matches!(e.raw_os_error(), Some(libc::EPERM | libc::ENOSYS)) => eprintln!("skip: kcmp unavailable: {e}"),
            Err(e) => panic!("kcmp: {e}"),
        }
        drop((file, dup, independent));
        fs::remove_file(path).unwrap();
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
    fn threads_are_not_listed_as_processes_created_since_a_mark() {
        let mark = facts::creation_mark().unwrap();
        let worker = std::thread::spawn(|| std::thread::sleep(std::time::Duration::from_millis(200)));
        let mut child = std::process::Command::new("sleep").arg("1").spawn().unwrap();
        let created = Linux.created_since(&mark).expect("young mark");
        let pids: Vec<u32> = created.iter().map(|r| r.pid.0).collect();
        child.kill().unwrap();
        child.wait().unwrap();
        worker.join().unwrap();
        assert!(pids.contains(&child.id()), "the child is listed: {pids:?}");
        assert!(!pids.contains(&std::process::id()), "this process predates the mark");
        let own_tasks: Vec<u32> = fs::read_dir("/proc/self/task").unwrap().flatten().filter_map(|e| e.file_name().to_str()?.parse().ok()).collect();
        assert!(own_tasks.iter().all(|tid| !pids.contains(tid)), "no thread id of this process is listed");
    }

    #[test]
    fn the_initial_namespace_is_recognised_by_its_fixed_inode() {
        let ns = Linux.pid_ns();
        assert!(ns.id.starts_with("pid:[") || ns.id == "unknown");
        assert_eq!(ns.is_initial, ns.id == INIT_PID_NS);
    }
}
