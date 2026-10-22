//! Process control: spawn with an explicit descriptor map, and signal a
//! process by identity rather than by bare pid.

use std::fs::File;
use std::io;
use std::process::{Child, Command};

use crate::facts::{Observer, ProcTuple};
use crate::{platform, FdSlot};

/// Arm SIGKILL on the calling thread's parent death (Linux gates only).
/// Call before starting children, then complete the launch handshake: a parent
/// outside our PID namespace is reported as zero, so getppid cannot detect its
/// death before registration. A visible parent change is refused immediately.
#[cfg(target_os = "linux")]
pub fn arm_parent_death_signal() -> io::Result<()> {
    // SAFETY: getppid has no preconditions; prctl takes a signal number.
    let parent = unsafe { libc::getppid() };
    if unsafe { libc::prctl(libc::PR_SET_PDEATHSIG, libc::SIGKILL, 0, 0, 0) } < 0 {
        return Err(io::Error::last_os_error());
    }
    if unsafe { libc::getppid() } != parent {
        return Err(io::Error::other("parent died while arming death signal"));
    }
    Ok(())
}

/// A descriptor that becomes readable when child `pid` exits (Linux pidfd).
/// `None` where the kernel has none; callers then poll in short steps.
#[cfg(unix)]
pub fn exit_descriptor(pid: u32) -> Option<std::os::fd::OwnedFd> {
    #[cfg(target_os = "linux")]
    {
        use std::os::fd::FromRawFd;
        // SAFETY: pidfd_open takes a pid and flags; the result is owned below.
        let fd = unsafe { libc::syscall(libc::SYS_pidfd_open, pid as libc::pid_t, 0 as libc::c_uint) };
        // SAFETY: a non-negative result is a new descriptor owned by nobody else.
        (fd >= 0).then(|| unsafe { std::os::fd::OwnedFd::from_raw_fd(fd as libc::c_int) })
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = pid;
        None
    }
}

/// The signals this crate sends.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Signal {
    /// `SIGTERM`: ask the process to end. Not available on Windows.
    Term,
    /// `SIGKILL` (Windows: `TerminateProcess`): end it now.
    Kill,
    /// `SIGINT`: interrupt it. Not available on Windows.
    Int,
}

/// What became of a [`signal_by_identity`] call. Only `Sent` means a signal
/// reached a process.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SignalOutcome {
    /// The signal reached the recorded process.
    Sent,
    /// No process has that pid in this observer's table.
    NotFound,
    /// A process has that pid but it is not the recorded one (a reused pid,
    /// a zombie, a reboot): nothing was sent.
    IdentityMismatch,
    /// The identity could not be checked (unreadable start time, another
    /// namespace): nothing was sent.
    IdentityUnknown,
    /// The OS refused (no permission).
    Denied,
    /// This platform cannot send that signal.
    Unsupported,
    /// Another OS error, as its raw code.
    Failed(i32),
}

/// Spawn `cmd` with exactly the descriptors in `fd_map` visible to the child,
/// each at its slot. Every other descriptor from 3 up that would survive the
/// exec (one open without close-on-exec, which `std::process::Command` would
/// hand down) is closed in the child. A mapped file loses the flag only for
/// the instant between fork and exec, inside the mapping itself.
///
/// The set of descriptors to close is read in the parent right before the
/// spawn; a descriptor another thread opens without close-on-exec during the
/// spawn itself is not covered, which is why every descriptor fgOS opens is
/// close-on-exec from the start.
///
/// A slot below 3 is refused; stdio stays under `Command`'s own `stdin`,
/// `stdout` and `stderr`. A program that cannot be executed is an error from
/// this call, never a child that died.
pub fn spawn_with_fds(cmd: Command, fd_map: &[(FdSlot, &File)]) -> io::Result<Child> {
    platform::current().spawn_with_fds(cmd, fd_map)
}

/// Send `sig` to the process `tuple` names, only if that exact process is
/// still the one under its pid (Linux: a pidfd pins the pid while the start
/// time is checked, so there is no reuse window; elsewhere the check runs
/// right before `kill` and the remaining window is documented).
pub fn signal_by_identity(tuple: &ProcTuple, sig: Signal) -> SignalOutcome {
    platform::current().signal_by_identity(tuple, sig)
}

/// Take ownership of a descriptor a parent mapped into `slot`. The first
/// thing this does is set close-on-exec on it, so a child of this process
/// never inherits it by accident; that is the receiver's half of the
/// description rule.
pub fn take_inherited(slot: FdSlot) -> io::Result<File> {
    #[cfg(unix)]
    {
        use std::os::fd::FromRawFd;
        let fd = slot.0 as libc::c_int;
        // SAFETY: fcntl only reads and sets flags on a descriptor number.
        let flags = unsafe { libc::fcntl(fd, libc::F_GETFD) };
        if flags < 0 {
            return Err(io::Error::last_os_error());
        }
        // SAFETY: as above.
        if unsafe { libc::fcntl(fd, libc::F_SETFD, flags | libc::FD_CLOEXEC) } < 0 {
            return Err(io::Error::last_os_error());
        }
        // SAFETY: the slot was handed to this process by its parent and is
        // owned by nothing else here.
        Ok(unsafe { File::from_raw_fd(fd) })
    }
    #[cfg(not(unix))]
    {
        let _ = slot;
        Err(io::Error::new(io::ErrorKind::Unsupported, "descriptor slots are not inherited on this platform"))
    }
}

/// The part of an identity check that needs no process table, run before any
/// pid is looked up: a tuple from another host or PID namespace is beyond
/// this observer's reach (`IdentityUnknown`, never `NotFound`), a tuple from
/// another boot names a process that cannot be running (`IdentityMismatch`).
/// `None` means the table decides.
pub(crate) fn out_of_scope(tuple: &ProcTuple, observer: &Observer) -> Option<SignalOutcome> {
    if tuple.host != observer.host || tuple.pid_ns != observer.pid_ns {
        return Some(SignalOutcome::IdentityUnknown);
    }
    if let (Some(recorded), Some(current)) = (&tuple.boot_id, &observer.boot_id) {
        if recorded != current {
            return Some(SignalOutcome::IdentityMismatch);
        }
    }
    None
}

#[cfg(unix)]
pub(crate) fn signo(sig: Signal) -> libc::c_int {
    match sig {
        Signal::Term => libc::SIGTERM,
        Signal::Kill => libc::SIGKILL,
        Signal::Int => libc::SIGINT,
    }
}

#[cfg(unix)]
pub(crate) fn errno_outcome(err: io::Error) -> SignalOutcome {
    match err.raw_os_error() {
        Some(libc::ESRCH) => SignalOutcome::NotFound,
        Some(libc::EPERM) => SignalOutcome::Denied,
        Some(libc::ENOSYS) => SignalOutcome::Unsupported,
        Some(code) => SignalOutcome::Failed(code),
        None => SignalOutcome::Failed(0),
    }
}

/// The unix spawn shared by the Linux and macOS drivers.
#[cfg(unix)]
pub(crate) fn unix_spawn_with_fds(mut cmd: Command, fd_map: &[(FdSlot, &File)]) -> io::Result<Child> {
    use std::os::fd::{AsRawFd, FromRawFd, OwnedFd};
    use std::os::unix::process::CommandExt;

    let mut slots: Vec<libc::c_int> = Vec::with_capacity(fd_map.len());
    for (slot, _) in fd_map {
        if slot.0 < 3 {
            return Err(io::Error::new(io::ErrorKind::InvalidInput, format!("slot {} is below 3; stdio is mapped through Command itself", slot.0)));
        }
        let Ok(slot) = libc::c_int::try_from(slot.0) else {
            return Err(io::Error::new(io::ErrorKind::InvalidInput, format!("slot {} is not a descriptor number", slot.0)));
        };
        if slots.contains(&slot) {
            return Err(io::Error::new(io::ErrorKind::InvalidInput, format!("slot {slot} is mapped twice")));
        }
        slots.push(slot);
    }
    let above_slots = slots.iter().max().map_or(3, |last| last + 1);

    // Each source gets a fresh close-on-exec duplicate numbered above every
    // slot, so dup2 in the child can never overwrite a source it still needs.
    let mut sources: Vec<OwnedFd> = Vec::with_capacity(fd_map.len());
    let mut plan: Vec<(libc::c_int, libc::c_int)> = Vec::with_capacity(fd_map.len());
    for ((_, file), slot) in fd_map.iter().zip(&slots) {
        // SAFETY: F_DUPFD_CLOEXEC duplicates an open descriptor we hold a
        // borrow of; the duplicate is owned below.
        let dup = unsafe { libc::fcntl(file.as_raw_fd(), libc::F_DUPFD_CLOEXEC, above_slots) };
        if dup < 0 {
            return Err(io::Error::last_os_error());
        }
        // SAFETY: `dup` is a descriptor this call just created.
        sources.push(unsafe { OwnedFd::from_raw_fd(dup) });
        plan.push((*slot, dup));
    }

    // `Command` opens the pipe it reports an exec failure through at the
    // lowest free numbers, inside `spawn`. A slot that is free here could
    // become that pipe, and the child's dup2 would then overwrite it. Every
    // free slot is therefore held by a close-on-exec placeholder until the
    // spawn is over; dup2 in the child replaces the placeholder.
    let mut placeholders: Vec<OwnedFd> = Vec::new();
    for ((_, file), slot) in fd_map.iter().zip(&slots) {
        // SAFETY: fcntl only reads the flags of a descriptor number.
        if unsafe { libc::fcntl(*slot, libc::F_GETFD) } >= 0 {
            continue;
        }
        // SAFETY: F_DUPFD_CLOEXEC duplicates an open descriptor we hold a
        // borrow of onto the lowest free number at or above `slot`.
        let fd = unsafe { libc::fcntl(file.as_raw_fd(), libc::F_DUPFD_CLOEXEC, *slot) };
        if fd < 0 {
            return Err(io::Error::last_os_error());
        }
        // SAFETY: `fd` is a descriptor this call just created.
        placeholders.push(unsafe { OwnedFd::from_raw_fd(fd) });
    }

    // What the child must close: every descriptor that would survive exec on
    // its own, except the slots dup2 is about to fill. Listed here, in the
    // parent, so the child only closes numbers it was handed. Descriptors
    // with close-on-exec are left to exec: among them is the pipe `Command`
    // reports an exec failure through, which is what keeps a missing
    // program an error of this call.
    let leaks: Vec<libc::c_int> = inheritable_fds().into_iter().filter(|fd| !slots.contains(fd)).collect();

    // SAFETY: the closure only calls async-signal-safe functions (dup2,
    // close) on plain integers it owns.
    unsafe {
        cmd.pre_exec(move || {
            for (slot, src) in &plan {
                if libc::dup2(*src, *slot) < 0 {
                    return Err(io::Error::last_os_error());
                }
            }
            for fd in &leaks {
                libc::close(*fd);
            }
            Ok(())
        });
    }
    let child = cmd.spawn();
    drop(placeholders);
    drop(sources);
    child
}

/// Open descriptors from 3 up that lack close-on-exec: what a plain exec
/// would hand to a child. Read from `/dev/fd` (Linux and macOS both list the
/// calling process's descriptors there); when that cannot be read, every
/// number up to the open-file limit is probed instead.
#[cfg(unix)]
pub(crate) fn inheritable_fds() -> Vec<libc::c_int> {
    let listed: Vec<libc::c_int> = match std::fs::read_dir("/dev/fd") {
        Ok(entries) => entries
            .filter_map(|entry| entry.ok())
            .filter_map(|entry| entry.file_name().to_str().and_then(|name| name.parse::<libc::c_int>().ok()))
            .filter(|fd| *fd >= 3)
            .collect(),
        Err(_) => {
            // SAFETY: sysconf reads a limit.
            let open_max = unsafe { libc::sysconf(libc::_SC_OPEN_MAX) };
            let open_max = if open_max <= 0 || open_max > 65_536 { 65_536 } else { open_max as libc::c_int };
            (3..open_max).collect()
        }
    };
    // The listing's own directory descriptor was among `listed` and is
    // closed by now; this second look drops it and anything else closed
    // since, so a number `Command` reuses for its own pipe is never closed
    // in the child by mistake.
    listed
        .into_iter()
        .filter(|fd| {
            // SAFETY: fcntl only reads the flags of a descriptor number.
            let flags = unsafe { libc::fcntl(*fd, libc::F_GETFD) };
            flags >= 0 && (flags & libc::FD_CLOEXEC) == 0
        })
        .collect()
}

/// Check the identity, then `kill`. Shared by macOS and by Linux kernels
/// without pidfd. The pid can be reused between the check and the kill;
/// that window is the price of a platform without pidfd.
#[cfg(unix)]
pub(crate) fn unix_signal_after_check(platform: &dyn platform::ProcessPlatform, tuple: &ProcTuple, sig: Signal) -> SignalOutcome {
    use crate::facts::{judge, Observed, PlatformTable, Verdict};
    let observer = platform.observer();
    if let Some(outcome) = out_of_scope(tuple, &observer) {
        return outcome;
    }
    let Some(raw) = crate::platform::as_pid_t(tuple.pid) else {
        return SignalOutcome::NotFound;
    };
    if platform.observe(tuple.pid) == Observed::Absent {
        return SignalOutcome::NotFound;
    }
    match judge(&tuple.to_record(), &observer, &PlatformTable(platform)) {
        Verdict::Alive => {}
        Verdict::Dead => return SignalOutcome::IdentityMismatch,
        Verdict::Unknown => return SignalOutcome::IdentityUnknown,
    }
    // SAFETY: kill takes a pid and a signal number.
    if unsafe { libc::kill(raw, signo(sig)) } == 0 {
        SignalOutcome::Sent
    } else {
        errno_outcome(io::Error::last_os_error())
    }
}
