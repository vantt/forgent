//! `flock` driver for Linux and macOS: the lock belongs to the open file
//! description, is released when the last copy of it is closed, and is
//! never touched with `LOCK_UN`.

use std::collections::HashSet;
use std::ffi::CString;
use std::fs::File;
use std::io;
use std::os::fd::AsRawFd;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{Duration, Instant};

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

    fn same_file(&self, file: &File, path: &Path) -> bool {
        use std::os::unix::fs::MetadataExt;
        match (fgos_process::facts::file_key(file), std::fs::metadata(path)) {
            (Ok(key), Ok(meta)) => key == (meta.dev(), meta.ino()),
            _ => false,
        }
    }

    fn prepare_borrow(&self, cmd: &mut Command) {
        // macOS cannot list holders, so what a borrowing child leaves behind
        // is found through its own process group instead.
        if cfg!(target_os = "macos") {
            use std::os::unix::process::CommandExt;
            cmd.process_group(0);
        }
    }

    fn end_leftovers(&self, file: &File, child_pid: u32, kill_wait: Duration) -> Result<u32, Leftovers> {
        if cfg!(target_os = "linux") {
            end_listed_holders(file, kill_wait)
        } else {
            end_process_group(child_pid, kill_wait)
        }
    }
}

/// Linux: every other process listed as holding the description is a
/// leftover; kill each by identity and wait until the list holds only this
/// process.
fn end_listed_holders(file: &File, kill_wait: Duration) -> Result<u32, Leftovers> {
    use fgos_process::control::{signal_by_identity, Signal, SignalOutcome};
    use fgos_process::facts::{file_key, lock_holders, Holders};
    let Ok((dev, ino)) = file_key(file) else {
        return Err(Leftovers { killed: 0, pids: Vec::new() });
    };
    use fgos_process::facts::{judge_here, Verdict};
    let me = std::process::id();
    let deadline = Instant::now() + kill_wait;
    let mut signaled: HashSet<(u32, String)> = HashSet::new();
    let mut killed = 0u32;
    loop {
        // A full holder scan reads every process's fdinfo; it runs once per
        // round, and the killed processes are then watched by identity until
        // they are gone, before the next scan confirms nothing is left (a
        // leftover may have forked before it died).
        let others: Vec<_> = match lock_holders(dev, ino) {
            Holders::List(list) => list.into_iter().filter(|t| t.pid.0 != me).collect(),
            // Linux always lists; an answer it cannot give is never "none left".
            Holders::Unlistable => return Err(Leftovers { killed, pids: Vec::new() }),
        };
        if others.is_empty() {
            return Ok(killed);
        }
        for tuple in &others {
            if signaled.insert((tuple.pid.0, tuple.start_time.clone())) && signal_by_identity(tuple, Signal::Kill) == SignalOutcome::Sent {
                killed += 1;
            }
        }
        loop {
            let alive: Vec<u32> = others.iter().filter(|t| judge_here(&t.to_record()) != Verdict::Dead).map(|t| t.pid.0).collect();
            if alive.is_empty() {
                break;
            }
            if Instant::now() >= deadline {
                return Err(Leftovers { killed, pids: alive });
            }
            std::thread::sleep(Duration::from_millis(1));
        }
        if Instant::now() >= deadline {
            // The killed ones are gone; one last scan decides.
            return match lock_holders(dev, ino) {
                Holders::List(list) => {
                    let left: Vec<u32> = list.into_iter().filter(|t| t.pid.0 != me).map(|t| t.pid.0).collect();
                    if left.is_empty() {
                        Ok(killed)
                    } else {
                        Err(Leftovers { killed, pids: left })
                    }
                }
                Holders::Unlistable => Err(Leftovers { killed, pids: Vec::new() }),
            };
        }
    }
}

/// macOS: the borrowing child ran in its own process group; kill the group
/// and wait until no member but the unreaped child itself is left (the
/// caller reaps it afterwards, so the group id cannot be reused meanwhile).
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
            return Err(Leftovers { killed, pids: left });
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

/// Pids in process group `pgid` (scanned from /proc where there is no
/// group listing call).
#[cfg(not(target_os = "macos"))]
fn group_members(pgid: libc::pid_t) -> Vec<u32> {
    let Ok(entries) = std::fs::read_dir("/proc") else {
        return Vec::new();
    };
    entries
        .flatten()
        .filter_map(|e| e.file_name().to_str()?.parse::<u32>().ok())
        .filter(|pid| {
            std::fs::read_to_string(format!("/proc/{pid}/stat"))
                .ok()
                .and_then(|stat| stat[stat.rfind(')')? + 1..].split_whitespace().nth(2)?.parse::<libc::pid_t>().ok())
                == Some(pgid)
        })
        .collect()
}
