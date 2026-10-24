//! `flock` driver for Linux and macOS: the lock belongs to the open file
//! description, is released when the last copy of it is closed, and is
//! never touched with `LOCK_UN`, except a probe description private to one
//! call (see `LockDriver::unlock_private`).

use std::collections::{HashMap, HashSet};
use std::ffi::CString;
use std::fs::File;
use std::io;
use std::os::fd::AsRawFd;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use fgos_process::facts::CreationMark;

use super::{Leftovers, LockDriver, TryLock};
use crate::port::{Guarantee, HoldersList, Level, Mode};

/// The `flock` driver.
pub struct FlockDriver;

const PLATFORM: &str = if cfg!(target_os = "linux") {
    "linux"
} else if cfg!(target_os = "macos") {
    "macos"
} else {
    "unix"
};

/// What the statfs of a lock directory says about its filesystem.
enum FsKind {
    Local,
    Network(String),
}

#[cfg(target_os = "linux")]
fn fs_kind(stat: &libc::statfs) -> FsKind {
    // f_type is a different integer type per architecture; the magic
    // numbers are 32-bit.
    let magic = (stat.f_type as u64 & 0xFFFF_FFFF) as u32;
    let name = match magic {
        0x6969 => "nfs",
        0x517B => "smb",
        0xFF53_4D42 => "cifs",
        0xFE53_4D42 => "smb2",
        0x0102_1997 => "9p",
        _ => return FsKind::Local,
    };
    FsKind::Network(name.to_string())
}

#[cfg(target_os = "macos")]
fn fs_kind(stat: &libc::statfs) -> FsKind {
    // SAFETY: f_fstypename is a NUL-terminated C string inside the struct.
    let name = unsafe { std::ffi::CStr::from_ptr(stat.f_fstypename.as_ptr()) }.to_string_lossy().into_owned();
    match name.as_str() {
        "nfs" | "smbfs" | "afpfs" | "webdav" | "cifs" => FsKind::Network(name),
        _ => FsKind::Local,
    }
}

#[cfg(not(any(target_os = "linux", target_os = "macos")))]
fn fs_kind(_stat: &libc::statfs) -> FsKind {
    FsKind::Local
}

fn statfs_path(path: &Path) -> io::Result<libc::statfs> {
    use std::os::unix::ffi::OsStrExt;
    let c = CString::new(path.as_os_str().as_bytes()).map_err(|_| io::Error::new(io::ErrorKind::InvalidInput, "path holds a NUL byte"))?;
    // SAFETY: statfs fills a zeroed struct from a valid C path.
    let mut out: libc::statfs = unsafe { std::mem::zeroed() };
    if unsafe { libc::statfs(c.as_ptr(), &mut out) } != 0 {
        return Err(io::Error::last_os_error());
    }
    Ok(out)
}

fn fstatfs_file(file: &File) -> io::Result<libc::statfs> {
    // SAFETY: fstatfs fills a zeroed struct from an open descriptor.
    let mut out: libc::statfs = unsafe { std::mem::zeroed() };
    if unsafe { libc::fstatfs(file.as_raw_fd(), &mut out) } != 0 {
        return Err(io::Error::last_os_error());
    }
    Ok(out)
}

fn guarantee_for(kind: FsKind) -> Guarantee {
    match kind {
        FsKind::Network(name) => Guarantee {
            driver: "flock",
            exclusion: Level::None,
            borrow: Level::None,
            holders: Level::None,
            platform: PLATFORM,
            notes: vec![format!("network filesystem ({name}): flock gives no kernel exclusion here; the lock is refused")],
        },
        FsKind::Local if cfg!(target_os = "linux") => Guarantee {
            driver: "flock",
            exclusion: Level::Kernel,
            borrow: Level::Kernel,
            holders: Level::Kernel,
            platform: PLATFORM,
            notes: Vec::new(),
        },
        FsKind::Local if cfg!(target_os = "macos") => Guarantee {
            driver: "flock",
            exclusion: Level::Kernel,
            borrow: Level::Kernel,
            holders: Level::Unsupported,
            platform: PLATFORM,
            notes: vec![
                "holders are not listable on macOS".to_string(),
                "containment of a borrowed child is best-effort: its process group is killed after it exits; a setsid escaper survives".to_string(),
            ],
        },
        FsKind::Local => Guarantee {
            driver: "flock",
            exclusion: Level::KernelUnmeasured,
            borrow: Level::KernelUnmeasured,
            holders: Level::Unsupported,
            platform: PLATFORM,
            notes: vec!["flock semantics not measured on this platform".to_string()],
        },
    }
}

impl LockDriver for FlockDriver {
    fn supported(&self) -> bool {
        true
    }

    fn unsupported_detail(&self) -> &'static str {
        ""
    }

    fn try_lock(&self, file: &File, mode: Mode) -> io::Result<TryLock> {
        let op = match mode {
            Mode::Ex => libc::LOCK_EX,
            Mode::Sh => libc::LOCK_SH,
        } | libc::LOCK_NB;
        loop {
            // SAFETY: flock on a descriptor this File owns.
            if unsafe { libc::flock(file.as_raw_fd(), op) } == 0 {
                return Ok(TryLock::Locked);
            }
            let err = io::Error::last_os_error();
            match err.raw_os_error() {
                Some(libc::EINTR) => continue,
                Some(code) if code == libc::EWOULDBLOCK || code == libc::EAGAIN => return Ok(TryLock::WouldBlock),
                _ => return Err(err),
            }
        }
    }

    fn guarantee(&self, dir: &Path) -> Guarantee {
        let mut probe = dir.to_path_buf();
        loop {
            match statfs_path(&probe) {
                Ok(stat) => return guarantee_for(fs_kind(&stat)),
                Err(_) => match probe.parent() {
                    Some(parent) if parent != probe => probe = parent.to_path_buf(),
                    _ => return guarantee_for(FsKind::Local),
                },
            }
        }
    }

    fn file_guarantee(&self, file: &File) -> io::Result<Guarantee> {
        Ok(guarantee_for(fs_kind(&fstatfs_file(file)?)))
    }

    fn description_path(&self, file: &File) -> io::Result<PathBuf> {
        #[cfg(target_os = "linux")]
        {
            std::fs::read_link(format!("/proc/self/fd/{}", file.as_raw_fd()))
        }
        #[cfg(target_os = "macos")]
        {
            use std::os::unix::ffi::OsStrExt;
            let mut buf = vec![0u8; libc::PATH_MAX as usize];
            // SAFETY: F_GETPATH writes at most PATH_MAX bytes into buf.
            if unsafe { libc::fcntl(file.as_raw_fd(), libc::F_GETPATH, buf.as_mut_ptr()) } < 0 {
                return Err(io::Error::last_os_error());
            }
            let len = buf.iter().position(|b| *b == 0).unwrap_or(buf.len());
            Ok(PathBuf::from(std::ffi::OsStr::from_bytes(&buf[..len])))
        }
        #[cfg(not(any(target_os = "linux", target_os = "macos")))]
        {
            let _ = file;
            Err(io::Error::new(io::ErrorKind::Unsupported, "description path is not readable on this platform"))
        }
    }

    fn holders(&self, file: &File) -> HoldersList {
        match fgos_process::facts::file_key(file) {
            Ok((dev, ino)) => match fgos_process::facts::lock_holders(dev, ino) {
                fgos_process::facts::Holders::List(list) => HoldersList::List(list),
                fgos_process::facts::Holders::Unlistable => HoldersList::Unlistable(format!("holders are not listable on {PLATFORM}")),
            },
            Err(err) => HoldersList::Unlistable(format!("lock file key unreadable: {err}")),
        }
    }

    fn before_close(&self, _file: &File) {}

    fn unlock_private(&self, file: &File) {
        // SAFETY: flock on a descriptor this File owns. Failure is ignored:
        // the close that follows releases the lock anyway.
        unsafe { libc::flock(file.as_raw_fd(), libc::LOCK_UN) };
    }

    fn same_file(&self, file: &File, path: &Path) -> bool {
        use std::os::unix::fs::MetadataExt;
        match (fgos_process::facts::file_key(file), std::fs::metadata(path)) {
            (Ok(key), Ok(meta)) => key == (meta.dev(), meta.ino()),
            _ => false,
        }
    }

    fn prepare_borrow(&self, request: &mut fgos_process::mapped::MappedSpawn) {
        // The child leads its own group; the unreaped leader pins this group id.
        request.lead = fgos_process::mapped::MappedLead::Group;
    }

    fn end_leftovers(&self, file: &File, child_pid: u32, kill_wait: Duration, since: Option<CreationMark>, protected_roots: &[u32]) -> Result<u32, Leftovers> {
        #[cfg(target_os = "linux")]
        {
            end_listed_holders(file, child_pid, kill_wait, since, protected_roots)
        }
        #[cfg(not(target_os = "linux"))]
        {
            let _ = (file, since, protected_roots);
            end_process_group(child_pid, kill_wait)
        }
    }
}

/// Linux: only the borrow group and descendants may be killed. Foreign
/// direct pre-exec children of the owner are waited; escaped holders are killed.
#[cfg(target_os = "linux")]
fn end_listed_holders(file: &File, child_pid: u32, kill_wait: Duration, since: Option<CreationMark>, protected_roots: &[u32]) -> Result<u32, Leftovers> {
    drain_description(file, Some(child_pid), std::process::id(), kill_wait, Reach::of(since)?, protected_roots)
}

/// Non-spawning admission: no borrowing domain means nobody may be killed.
#[cfg(target_os = "linux")]
pub(crate) fn wait_unborrowed(file: &File, kill_wait: Duration, since: Option<CreationMark>) -> Result<(), Leftovers> {
    drain_description(file, None, std::process::id(), kill_wait, Reach::of(since)?, &[]).map(|_| ())
}

/// Which processes a drain reads descriptor tables of.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum Reach {
    /// Lagged per-spawn floor, assuming fork inheritance and ordinary PID
    /// allocation. Descriptor transfer to existing processes is covered by
    /// the release-time kernel lock-table settle. Reads processes
    /// found in pid allocation order while the mark is young enough
    /// (`fgos_process::facts::created_since`), otherwise by start time over
    /// every process. The borrowed child, its group and its descendants were
    /// all created after the mark too.
    Since(CreationMark),
}

impl Reach {
    fn of(since: Option<CreationMark>) -> Result<Self, Leftovers> {
        // Missing reach facts refuse instead of reintroducing a host scan
        // on admission or every borrow. Release still settles the description.
        since.map(Reach::Since).ok_or(Leftovers { killed: 0, pids: Vec::new(), foreign: false })
    }
}

/// One pass over the process table: parent, group and start of each pid.
struct Tree(HashMap<u32, (u32, u32, u64)>);

impl Tree {
    fn read() -> Option<Self> {
        fgos_process::facts::relations().map(Self::of)
    }
    fn of(relations: Vec<fgos_process::facts::Relation>) -> Self {
        Self(relations.into_iter().map(|r| (r.pid.0, (r.parent, r.group, r.start_ticks))).collect())
    }
    /// Parent and group, from the pass or (for a pid it did not see) read now.
    fn parent_and_group(&self, pid: u32) -> Option<(u32, u32)> {
        match self.0.get(&pid) {
            Some((parent, group, _)) => Some((*parent, *group)),
            None => parent_and_group(pid),
        }
    }
    fn in_borrow_domain(&self, pid: u32, root: u32) -> bool {
        in_domain(pid, root, |pid| self.parent_and_group(pid))
    }
}

/// Shared pinned signalling and bounded poll loop for borrow and release.
#[derive(Default)]
struct Cleanup {
    signaled: HashSet<(u32, String)>,
    killed: u32,
}

impl Cleanup {
    fn signal(&mut self, pid: u32) -> bool {
        let Some(tuple) = fgos_process::facts::identity_of(fgos_process::ProcId(pid)) else { return false; };
        self.signal_identity(&tuple);
        true
    }

    fn signal_identity(&mut self, tuple: &fgos_process::facts::ProcTuple) {
        use fgos_process::control::{signal_by_identity, Signal, SignalOutcome};
        if self.signaled.insert((tuple.pid.0, tuple.start_time.clone()))
            && signal_by_identity(tuple, Signal::Kill) == SignalOutcome::Sent
        { self.killed += 1; }
    }
}

fn cleanup_loop(kill_wait: Duration, mut pass: impl FnMut(&mut Cleanup, Instant) -> Result<bool, Leftovers>) -> Result<u32, Leftovers> {
    let deadline = Instant::now() + kill_wait;
    let mut cleanup = Cleanup::default();
    loop {
        if pass(&mut cleanup, deadline)? { return Ok(cleanup.killed); }
        std::thread::sleep(Duration::from_millis(1));
    }
}

/// A direct child can be an adopted borrower rather than an unrelated
/// pre-exec fork. Only an explicitly mapped, non-CLOEXEC locked descriptor
/// proves that distinction; unreadable facts keep the child protected.
#[cfg(target_os = "linux")]
fn has_borrowed_copy(dev: u64, ino: u64, pid: u32) -> bool {
    use fgos_process::{facts::locked_fds, ProcId};
    locked_fds(dev, ino, Some(&[ProcId(pid)])).is_ok_and(|fds| fds.iter().any(|fd| {
        if fd.lock.kind != "FLOCK" { return false; }
        let Ok(info) = std::fs::read_to_string(format!("/proc/{pid}/fdinfo/{}", fd.fd.0)) else { return false; };
        info.lines().find_map(|line| line.strip_prefix("flags:")
            .and_then(|flags| u32::from_str_radix(flags.trim(), 8).ok()))
            .is_some_and(|flags| flags & libc::O_CLOEXEC as u32 == 0)
    }))
}

/// Without the Linux fd tables nothing proves a direct child is an adopted borrower. At every call
/// `true` means "kill or release it", so `false` is the answer that keeps the child protected.
#[cfg(not(target_os = "linux"))]
fn has_borrowed_copy(_dev: u64, _ino: u64, _pid: u32) -> bool {
    false
}

/// Close first; the kernel's locker stamp distinguishes our escaped copies
/// from a later acquirer's fresh description, without taking a probe lock.
#[cfg(target_os = "linux")]
pub(crate) fn settle_release(file: File, kill_wait: Duration) -> crate::port::Release {
    use fgos_process::facts::{file_key, locked_fds, own_lock_token, proc_self_pid};
    use crate::port::Release;
    let key = file_key(&file);
    let token = own_lock_token(&file);
    let me = proc_self_pid().map(|pid| pid.0);
    // open(/proc/self/fd/N), unlike dup(N), creates an independent description.
    // Keep it unlocked until after close. This pins even an unlinked inode so
    // a replaced resource path cannot redirect the shared probe elsewhere.
    let mut probe = File::open(format!("/proc/self/fd/{}", file.as_raw_fd())).and_then(|probe| {
        if key.as_ref().is_ok_and(|key| file_key(&probe).is_ok_and(|actual| actual == *key)) {
            Ok(probe)
        } else { Err(io::Error::other("release probe inode mismatch")) }
    }).ok();
    drop(file);
    let result = cleanup_loop(kill_wait, |cleanup, deadline| {
        let stuck = |pids| Leftovers { killed: cleanup.killed, pids, foreign: false };
        let (Ok((dev, ino)), Ok(me)) = (&key, &me) else { return Err(stuck(Vec::new())); };
        // A granted Sh probe on the independent description proves the old Ex
        // description gone (Ex and Sh from different descriptions conflict), so
        // the cold lock-table read is needed only once the probe is refused.
        if let Some(file) = &probe {
            if matches!(FlockDriver.try_lock(file, Mode::Sh), Ok(TryLock::Locked)) {
                // The probe description is private to this call, so it
                // may be unlocked; a child forked from another thread
                // before the close would otherwise keep its Sh lock.
                FlockDriver.unlock_private(file);
                drop(probe.take());
                return Ok(true);
            }
        }
        let mine = locked_fds(*dev, *ino, Some(&[fgos_process::ProcId(*me)])).map_err(|_| stuck(Vec::new()))?;
        // Any live own lock on this inode proves the old EX description gone.
        // Return before the scan: kcmp need not be available to spare its copies.
        if mine.iter().any(|fd| fd.lock.kind == "FLOCK") { return Ok(true); }
        let holders = locked_fds(*dev, *ino, None).map_err(|_| stuck(Vec::new()))?;
        let mut candidates = HashMap::new();
        for holder in holders {
            // Positive proof of a later acquirer, including when its record
            // fell outside the lock-table prefix: EX exclusivity proves our
            // old description gone. Never signal that acquirer.
            if holder.lock.kind == "FLOCK" && holder.lock.pid != i64::from(*me)
                && token.as_ref().is_ok_and(|token| holder.lock.token == *token)
            { return Ok(true); }
            if holder.pid.0 == *me || holder.lock.kind != "FLOCK" || holder.lock.pid != i64::from(*me) { continue; }
            if let Ok(token) = &token {
                if holder.lock.token != *token { continue; }
            }
            candidates.insert(holder.pid.0, holder.identity);
        }
        let mut pids = candidates.keys().copied().collect::<Vec<_>>();
        pids.sort_unstable();
        // An empty scan alone cannot prove release across an in-flight fork.
        // Re-probe/re-scan until the shared probe or a positive later-owner
        // record proves release, or the bounded wait reports Stuck.
        for &pid in &pids {
            // A same-process reacquirer can appear during the full scan.
            // Its EX lock proves our old description gone; spare its copies.
            if locked_fds(*dev, *ino, Some(&[fgos_process::ProcId(*me)])).is_ok_and(|mine| mine.iter().any(|fd| fd.lock.kind == "FLOCK")) {
                return Ok(true);
            }
            // Unknown parent/flags are not authority to kill. Adopted
            // borrowers are direct children too; their explicit mapping lacks
            // CLOEXEC, unlike unrelated pre-exec copies.
            if parent_and_group(pid).is_some_and(|(parent, _)| parent != *me || has_borrowed_copy(*dev, *ino, pid)) {
                cleanup.signal_identity(&candidates[&pid]);
            }
        }
        if Instant::now() >= deadline { return Err(Leftovers { killed: cleanup.killed, pids, foreign: false }); }
        Ok(false)
    });
    match result {
        Ok(killed) => Release::Released { killed },
        Err(left) => Release::Stuck { killed: left.killed, pids: left.pids },
    }
}

pub(crate) fn drain_description(
    file: &File,
    child_pid: Option<u32>,
    owner: u32,
    kill_wait: Duration,
    reach: Reach,
    protected_roots: &[u32],
) -> Result<u32, Leftovers> {
    use fgos_process::facts::{file_key, lock_holders, lock_holders_among, Holders};
    use fgos_process::ProcId;
    let Ok((dev, ino)) = file_key(file) else {
        return Err(Leftovers {
            killed: 0,
            pids: Vec::new(),
            foreign: false,
        });
    };
    let me = std::process::id();
    cleanup_loop(kill_wait, |cleanup, deadline| {
        // The processes that may hold a copy, with their parent and group:
        // all of them, or only those created since the reach's mark.
        let (tree, candidates) = match reach {
            Reach::Since(mark) => match fgos_process::facts::created_since(&mark) {
                Some(created) => {
                    let tree = Tree::of(created);
                    let mut pids: Vec<ProcId> = tree.0.keys().map(|pid| ProcId(*pid)).collect();
                    pids.push(ProcId(me));
                    (Some(tree), Some(pids))
                }
                None => {
                    let tree = Tree::read();
                    let pids = tree.as_ref().map(|tree| {
                        let mut pids: Vec<ProcId> = tree
                            .0
                            .iter()
                            .filter(|(pid, (_, _, start))| **pid == me || *start >= mark.ticks)
                            .map(|(pid, _)| ProcId(*pid))
                            .collect();
                        if !pids.contains(&ProcId(me)) {
                            pids.push(ProcId(me));
                        }
                        pids
                    });
                    (tree, pids)
                }
            },
        };
        let listed = match candidates {
            Some(pids) => lock_holders_among(dev, ino, &pids),
            None => lock_holders(dev, ino),
        };
        let holders = match listed {
            Holders::List(list) if list.iter().any(|t| t.pid.0 == me) => list
                .into_iter()
                .filter(|t| t.pid.0 != me && t.pid.0 != owner)
                .collect::<Vec<_>>(),
            // Absence of our known locked description is not proof of an
            // empty holder set (Publication admission also requires self).
            Holders::List(_) | Holders::Unlistable => {
                return Err(Leftovers {
                    killed: cleanup.killed,
                    pids: Vec::new(),
                    foreign: false,
                })
            }
        };
        let had_holders = !holders.is_empty();
        let mut foreign = Vec::new();
        let mut domain = Vec::new();
        if let Some(root) = child_pid {
            match &tree {
                Some(tree) => domain.extend(tree.0.keys().copied().filter(|pid| tree.in_borrow_domain(*pid, root))),
                None => {
                    if let Ok(entries) = std::fs::read_dir("/proc") {
                        domain.extend(
                            entries
                                .flatten()
                                .filter_map(|e| e.file_name().to_str()?.parse::<u32>().ok())
                                .filter(|pid| in_borrow_domain(*pid, root)),
                        );
                    }
                }
            }
        }
        for tuple in holders {
            let pid = tuple.pid.0;
            if protected_roots.iter().any(|root| in_borrow_domain(pid, *root)) {
                foreign.push(pid);
            } else if child_pid.is_some_and(|root| in_borrow_domain(pid, root))
                || (child_pid.is_some()
                    && parent_and_group(pid).is_some_and(|(parent, _)| parent != owner || has_borrowed_copy(dev, ino, pid)))
            {
                // Each acquire owns a fresh CLOEXEC description. An outside
                // holder other than an owner's CLOEXEC pre-exec child can
                // only be an escaped borrower, including adopted direct children.
                domain.push(pid);
            } else {
                foreign.push(pid);
            }
        }
        domain.sort_unstable();
        domain.dedup();
        let mut live = Vec::new();
        for pid in domain.into_iter().filter(|pid| Some(*pid) != child_pid) {
            // Re-check membership immediately before pinning and signalling.
            if !protected_roots.iter().any(|root| in_borrow_domain(pid, *root)) && (child_pid.is_some_and(|root| in_borrow_domain(pid, root))
                || (child_pid.is_some() && parent_and_group(pid).is_some_and(|(parent, _)| parent != owner || has_borrowed_copy(dev, ino, pid))))
                && cleanup.signal(pid)
            { live.push(pid); }
        }

        if live.is_empty() && !foreign.is_empty() && Instant::now() >= deadline {
            return Err(Leftovers {
                killed: cleanup.killed,
                pids: foreign,
                foreign: true,
            });
        }
        if live.is_empty() && foreign.is_empty() && !had_holders {
            return Ok(true);
        }
        if Instant::now() >= deadline {
            return Err(Leftovers {
                killed: cleanup.killed,
                pids: live,
                foreign: false,
            });
        }
        Ok(false)
    })
}

/// Read-only local Linux domain facts; no process-control policy lives here.
fn parent_and_group(pid: u32) -> Option<(u32, u32)> {
    let stat = std::fs::read_to_string(format!("/proc/{pid}/stat")).ok()?;
    let relation = fgos_process::facts::parse_relation(fgos_process::ProcId(pid), &stat)?;
    Some((relation.parent, relation.group))
}

fn in_borrow_domain(pid: u32, root: u32) -> bool {
    in_domain(pid, root, parent_and_group)
}

fn in_domain(mut pid: u32, root: u32, relation: impl Fn(u32) -> Option<(u32, u32)>) -> bool {
    let mut seen = HashSet::new();
    while pid > 1 && seen.insert(pid) {
        if pid == root {
            return true;
        }
        let Some((parent, group)) = relation(pid) else { return false };
        if group == root {
            return true;
        }
        pid = parent;
    }
    false
}

/// macOS: the borrowing child ran in its own process group; kill the group
/// and wait until no member but the unreaped child itself is left (the
/// caller reaps it afterwards, so the group id cannot be reused meanwhile).
#[cfg(not(target_os = "linux"))]
fn end_process_group(child_pid: u32, kill_wait: Duration) -> Result<u32, Leftovers> {
    let pgid = child_pid as libc::pid_t;
    // SAFETY: killpg only targets the child's own group; the unreaped child
    // keeps the group id from being reused.
    let killed = if unsafe { libc::killpg(pgid, libc::SIGKILL) } == 0 { 1 } else { 0 };
    let deadline = Instant::now() + kill_wait;
    loop {
        let left: Vec<u32> = group_members(pgid).into_iter().filter(|pid| *pid != child_pid).collect();
        if left.is_empty() {
            return Ok(killed);
        }
        if Instant::now() >= deadline {
            return Err(Leftovers { killed, pids: left, foreign: false });
        }
        std::thread::sleep(Duration::from_millis(1));
    }
}

/// Pids in process group `pgid`.
#[cfg(target_os = "macos")]
fn group_members(pgid: libc::pid_t) -> Vec<u32> {
    // `PROC_PGRP_ONLY` from <libproc.h>; the libc crate does not export it.
    const PROC_PGRP_ONLY: u32 = 2;
    let mut pids = vec![0 as libc::pid_t; 256];
    loop {
        let bytes = (pids.len() * std::mem::size_of::<libc::pid_t>()) as libc::c_int;
        // SAFETY: proc_listpids writes at most `bytes` bytes into the buffer.
        let n = unsafe { libc::proc_listpids(PROC_PGRP_ONLY, pgid as u32, pids.as_mut_ptr().cast(), bytes) };
        if n <= 0 {
            return Vec::new();
        }
        let count = n as usize / std::mem::size_of::<libc::pid_t>();
        if count < pids.len() {
            return pids[..count].iter().filter(|p| **p > 0).map(|p| *p as u32).collect();
        }
        pids.resize(pids.len() * 2, 0);
    }
}
