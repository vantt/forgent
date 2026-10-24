//! Spawn with an explicit descriptor map, as one request the platform can
//! start without forking the caller.
//!
//! [`crate::control::spawn_with_fds`] maps descriptors from inside a
//! `Command`'s pre-exec hook, which forces a full `fork` of the caller: in a
//! large process (Node with its heap) that copy costs milliseconds per child.
//! [`spawn_mapped`] takes the whole request instead, so on Linux with glibc
//! it starts the child with `posix_spawn` (a `vfork`-style clone that shares
//! the caller's memory until exec) and applies the same map as file
//! actions: each slot and each given stdio file is a `dup2` of a
//! close-on-exec duplicate, every other descriptor that would survive exec
//! is closed, the child leads its own process group or session when asked,
//! and it gets an empty signal mask and default `SIGPIPE` (what `Command`
//! gives a child). Elsewhere it runs the `Command` path. A program that
//! cannot be executed is an error of the call. Every contained child (the
//! containment drivers' `spawn_in`) starts through this door.

use std::ffi::OsString;
use std::fs::File;
use std::io;
use std::path::PathBuf;
use std::process::ExitStatus;

use crate::FdSlot;

/// One standard stream of a mapped child.
#[derive(Debug, Clone, Copy)]
pub enum MappedStdio<'a> {
    /// The caller's own stream.
    Inherit,
    /// `/dev/null`.
    Null,
    /// A pipe; the parent end is returned on [`MappedChild`].
    Piped,
    /// A duplicate of a file the caller keeps.
    File(&'a File),
}

/// Which process group and session a mapped child is in.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MappedLead {
    /// The caller's.
    Caller,
    /// A new process group the child leads.
    Group,
    /// A new session (and its process group) the child leads.
    Session,
}

/// Everything about a child [`spawn_mapped`] starts.
#[derive(Debug, Clone)]
pub struct MappedSpawn<'a> {
    /// Program and arguments. A program without `/` is looked up in the
    /// child's `PATH` (from `env`, else the caller's).
    pub argv: Vec<OsString>,
    /// Variables set in the child, on top of the caller's environment unless
    /// `clear_env`.
    pub env: Vec<(OsString, OsString)>,
    /// Start from an empty environment.
    pub clear_env: bool,
    /// Working directory of the child.
    pub cwd: Option<PathBuf>,
    /// The process group and session of the child.
    pub lead: MappedLead,
    /// Standard input, output and error.
    pub stdio: [MappedStdio<'a>; 3],
}

/// A child started by [`spawn_mapped`]. Like `std::process::Child` it is not
/// reaped until [`MappedChild::wait`], so its pid stays reserved.
#[derive(Debug)]
pub struct MappedChild {
    inner: Inner,
    /// Parent end of a piped stdin.
    pub stdin: Option<File>,
    /// Parent end of a piped stdout.
    pub stdout: Option<File>,
    /// Parent end of a piped stderr.
    pub stderr: Option<File>,
}

#[derive(Debug)]
enum Inner {
    #[cfg_attr(all(target_os = "linux", target_env = "gnu"), allow(dead_code))]
    Std(std::process::Child),
    #[cfg_attr(not(all(target_os = "linux", target_env = "gnu")), allow(dead_code))]
    Spawned { pid: u32, status: Option<ExitStatus> },
}

impl MappedChild {
    /// The child's pid.
    pub fn id(&self) -> u32 {
        match &self.inner {
            Inner::Std(child) => child.id(),
            Inner::Spawned { pid, .. } => *pid,
        }
    }

    /// `SIGKILL` the child unless it was already reaped (its pid cannot have
    /// been reused before then).
    pub fn kill(&mut self) -> io::Result<()> {
        match &mut self.inner {
            Inner::Std(child) => child.kill(),
            Inner::Spawned { status: Some(_), .. } => Ok(()),
            Inner::Spawned { pid, status: None } => {
                // SAFETY: kill on our own unreaped child.
                if unsafe { libc::kill(*pid as libc::pid_t, libc::SIGKILL) } == 0 {
                    Ok(())
                } else {
                    Err(io::Error::last_os_error())
                }
            }
        }
    }

    /// Wait for the child to exit and reap it.
    pub fn wait(&mut self) -> io::Result<ExitStatus> {
        match &mut self.inner {
            Inner::Std(child) => child.wait(),
            Inner::Spawned { pid, status } => reap(*pid, status, 0).map(|s| s.expect("a blocking waitpid returns a status")),
        }
    }

    /// The exit status if the child has exited (reaping it), else `None`.
    pub fn try_wait(&mut self) -> io::Result<Option<ExitStatus>> {
        match &mut self.inner {
            Inner::Std(child) => child.try_wait(),
            Inner::Spawned { pid, status } => reap(*pid, status, libc::WNOHANG),
        }
    }
}

/// `waitpid` once (retrying on `EINTR`) unless already reaped; `None` only
/// under `WNOHANG` while the child runs.
fn reap(pid: u32, status: &mut Option<ExitStatus>, flags: libc::c_int) -> io::Result<Option<ExitStatus>> {
    use std::os::unix::process::ExitStatusExt;
    if status.is_some() {
        return Ok(*status);
    }
    let mut raw = 0;
    loop {
        // SAFETY: waitpid on our own child into a local.
        match unsafe { libc::waitpid(pid as libc::pid_t, &mut raw, flags) } {
            0 => return Ok(None),
            done if done > 0 => {
                *status = Some(ExitStatus::from_raw(raw));
                return Ok(*status);
            }
            _ => {
                let err = io::Error::last_os_error();
                if err.raw_os_error() != Some(libc::EINTR) {
                    return Err(err);
                }
            }
        }
    }
}

/// Start `request` with `fd_map` (see the module note). A slot below 3 is
/// refused, as for `spawn_with_fds`.
pub fn spawn_mapped(request: &MappedSpawn, fd_map: &[(FdSlot, &File)]) -> io::Result<MappedChild> {
    if request.argv.is_empty() {
        return Err(io::Error::new(io::ErrorKind::InvalidInput, "argv is empty"));
    }
    #[cfg(all(target_os = "linux", target_env = "gnu"))]
    {
        posix::spawn(request, fd_map)
    }
    #[cfg(not(all(target_os = "linux", target_env = "gnu")))]
    {
        with_command(request, fd_map)
    }
}

/// The `Command` path: the same request through `spawn_with_fds`.
#[cfg_attr(all(target_os = "linux", target_env = "gnu"), allow(dead_code))]
fn with_command(request: &MappedSpawn, fd_map: &[(FdSlot, &File)]) -> io::Result<MappedChild> {
    use std::process::{Command, Stdio};
    let mut cmd = Command::new(&request.argv[0]);
    cmd.args(&request.argv[1..]);
    if request.clear_env {
        cmd.env_clear();
    }
    cmd.envs(request.env.iter().map(|(k, v)| (k, v)));
    if let Some(cwd) = &request.cwd {
        cmd.current_dir(cwd);
    }
    use std::os::unix::process::CommandExt;
    match request.lead {
        MappedLead::Caller => {}
        MappedLead::Group => _ = cmd.process_group(0),
        // SAFETY: setsid is async-signal-safe and touches no memory of the parent.
        MappedLead::Session => unsafe {
            cmd.pre_exec(|| if libc::setsid() < 0 { Err(io::Error::last_os_error()) } else { Ok(()) });
        },
    }
    let stdio = |s: MappedStdio| -> io::Result<Stdio> {
        Ok(match s {
            MappedStdio::Inherit => Stdio::inherit(),
            MappedStdio::Null => Stdio::null(),
            MappedStdio::Piped => Stdio::piped(),
            MappedStdio::File(file) => Stdio::from(file.try_clone()?),
        })
    };
    cmd.stdin(stdio(request.stdio[0])?).stdout(stdio(request.stdio[1])?).stderr(stdio(request.stdio[2])?);
    let mut child = crate::control::spawn_with_fds(cmd, fd_map)?;
    let stdin = child.stdin.take().map(owned_file);
    let stdout = child.stdout.take().map(owned_file);
    let stderr = child.stderr.take().map(owned_file);
    Ok(MappedChild { inner: Inner::Std(child), stdin, stdout, stderr })
}

#[cfg_attr(all(target_os = "linux", target_env = "gnu"), allow(dead_code))]
fn owned_file(pipe: impl Into<std::os::fd::OwnedFd>) -> File {
    File::from(pipe.into())
}

#[cfg(all(target_os = "linux", target_env = "gnu"))]
mod posix {
    use super::*;
    use std::ffi::CString;
    use std::os::fd::{AsRawFd, FromRawFd, OwnedFd};
    use std::os::unix::ffi::{OsStrExt, OsStringExt};

    struct Actions(libc::posix_spawn_file_actions_t);
    impl Drop for Actions {
        fn drop(&mut self) {
            // SAFETY: initialised in `spawn` before any Actions is built.
            unsafe { libc::posix_spawn_file_actions_destroy(&mut self.0) };
        }
    }
    struct Attr(libc::posix_spawnattr_t);
    impl Drop for Attr {
        fn drop(&mut self) {
            // SAFETY: initialised in `spawn` before any Attr is built.
            unsafe { libc::posix_spawnattr_destroy(&mut self.0) };
        }
    }

    fn check(rc: libc::c_int) -> io::Result<()> {
        if rc == 0 {
            Ok(())
        } else {
            Err(io::Error::from_raw_os_error(rc))
        }
    }

    fn cstring(bytes: Vec<u8>) -> io::Result<CString> {
        CString::new(bytes).map_err(|_| io::Error::new(io::ErrorKind::InvalidInput, "argument holds a NUL byte"))
    }

    fn pipe() -> io::Result<(OwnedFd, OwnedFd)> {
        let mut fds = [0; 2];
        // SAFETY: pipe2 fills two descriptors owned below.
        if unsafe { libc::pipe2(fds.as_mut_ptr(), libc::O_CLOEXEC) } != 0 {
            return Err(io::Error::last_os_error());
        }
        // SAFETY: both were just created by pipe2.
        Ok(unsafe { (OwnedFd::from_raw_fd(fds[0]), OwnedFd::from_raw_fd(fds[1])) })
    }

    /// The child's program path: `argv[0]` itself when it holds `/`, else the
    /// first executable match in the child's `PATH`.
    fn program(request: &MappedSpawn) -> io::Result<CString> {
        let name = &request.argv[0];
        if name.as_bytes().contains(&b'/') {
            return cstring(name.clone().into_vec());
        }
        let path = request
            .env
            .iter()
            .rev()
            .find(|(k, _)| k == "PATH")
            .map(|(_, v)| v.clone())
            .or_else(|| if request.clear_env { None } else { std::env::var_os("PATH") })
            .unwrap_or_else(|| OsString::from("/usr/bin:/bin"));
        let cwd = match &request.cwd {
            Some(p) if p.is_absolute() => p.clone(),
            other => {
                let here = std::env::current_dir()?;
                other.as_ref().map_or(here.clone(), |p| here.join(p))
            }
        };
        let mut denied = false;
        for dir in std::env::split_paths(&path) {
            let candidate = cwd.join(dir).join(name);
            if !candidate.is_file() { continue; }
            let Ok(c) = cstring(candidate.into_os_string().into_vec()) else { continue };
            // SAFETY: access only reads a NUL-terminated path.
            if unsafe { libc::access(c.as_ptr(), libc::X_OK) } == 0 {
                return Ok(c);
            }
            denied |= io::Error::last_os_error().raw_os_error() == Some(libc::EACCES);
        }
        if denied { return Err(io::Error::from_raw_os_error(libc::EACCES)); }
        Err(io::Error::new(io::ErrorKind::NotFound, format!("program not found: {}", name.to_string_lossy())))
    }

    pub(super) fn spawn(request: &MappedSpawn, fd_map: &[(FdSlot, &File)]) -> io::Result<MappedChild> {
        let mut slots: Vec<libc::c_int> = Vec::with_capacity(fd_map.len());
        for (slot, _) in fd_map {
            let slot = libc::c_int::try_from(slot.0)
                .ok()
                .filter(|s| *s >= 3)
                .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, format!("slot {} is below 3 or not a descriptor number", slot.0)))?;
            if slots.contains(&slot) {
                return Err(io::Error::new(io::ErrorKind::InvalidInput, format!("slot {slot} is mapped twice")));
            }
            slots.push(slot);
        }
        let above = slots.iter().max().map_or(3, |last| last + 1);
        // Close-on-exec duplicates numbered above every slot and stdio, so no
        // dup2 in the child overwrites a source it still needs.
        let duplicate = |file: &File| -> io::Result<OwnedFd> {
            // SAFETY: F_DUPFD_CLOEXEC duplicates a descriptor we borrow.
            let dup = unsafe { libc::fcntl(file.as_raw_fd(), libc::F_DUPFD_CLOEXEC, above) };
            if dup < 0 {
                return Err(io::Error::last_os_error());
            }
            // SAFETY: just created.
            Ok(unsafe { OwnedFd::from_raw_fd(dup) })
        };
        let sources: Vec<OwnedFd> = fd_map.iter().map(|(_, file)| duplicate(file)).collect::<io::Result<_>>()?;
        let program = program(request)?;
        let argv: Vec<CString> = request.argv.iter().map(|a| cstring(a.clone().into_vec())).collect::<io::Result<_>>()?;
        let mut env: Vec<(OsString, OsString)> = if request.clear_env { Vec::new() } else { std::env::vars_os().collect() };
        for (k, v) in &request.env {
            env.retain(|(have, _)| have != k);
            env.push((k.clone(), v.clone()));
        }
        let envp: Vec<CString> = env
            .into_iter()
            .map(|(k, v)| {
                let mut kv = k.into_vec();
                kv.push(b'=');
                kv.extend(v.into_vec());
                cstring(kv)
            })
            .collect::<io::Result<_>>()?;
        let mut argv_ptrs: Vec<*mut libc::c_char> = argv.iter().map(|a| a.as_ptr() as *mut _).collect();
        argv_ptrs.push(std::ptr::null_mut());
        let mut envp_ptrs: Vec<*mut libc::c_char> = envp.iter().map(|e| e.as_ptr() as *mut _).collect();
        envp_ptrs.push(std::ptr::null_mut());

        // SAFETY: zeroed storage initialised by the libc init calls below.
        let mut actions = Actions(unsafe { std::mem::zeroed() });
        check(unsafe { libc::posix_spawn_file_actions_init(&mut actions.0) })?;
        let mut attr = Attr(unsafe { std::mem::zeroed() });
        check(unsafe { libc::posix_spawnattr_init(&mut attr.0) })?;

        // Standard streams: pipes keep their parent ends here.
        let dev_null = CString::new("/dev/null").expect("literal");
        let mut parent_ends: [Option<OwnedFd>; 3] = [None, None, None];
        let mut child_ends: Vec<OwnedFd> = Vec::new();
        for (target, stdio) in request.stdio.iter().enumerate() {
            let target = target as libc::c_int;
            match stdio {
                MappedStdio::Inherit => {}
                MappedStdio::Null => {
                    let flags = if target == 0 { libc::O_RDONLY } else { libc::O_WRONLY };
                    // SAFETY: the actions object is initialised; the path is NUL-terminated.
                    check(unsafe { libc::posix_spawn_file_actions_addopen(&mut actions.0, target, dev_null.as_ptr(), flags, 0) })?;
                }
                MappedStdio::Piped => {
                    let (read, write) = pipe()?;
                    let (parent, child) = if target == 0 { (write, read) } else { (read, write) };
                    // SAFETY: both descriptors are open for the call's duration.
                    check(unsafe { libc::posix_spawn_file_actions_adddup2(&mut actions.0, child.as_raw_fd(), target) })?;
                    parent_ends[target as usize] = Some(parent);
                    child_ends.push(child);
                }
                MappedStdio::File(file) => {
                    let child = duplicate(file)?;
                    // SAFETY: the duplicate stays open until posix_spawn returns.
                    check(unsafe { libc::posix_spawn_file_actions_adddup2(&mut actions.0, child.as_raw_fd(), target) })?;
                    child_ends.push(child);
                }
            }
        }
        for (slot, source) in slots.iter().zip(&sources) {
            // dup2 onto the slot clears close-on-exec on the child's copy only.
            // SAFETY: the source stays open until posix_spawn returns.
            check(unsafe { libc::posix_spawn_file_actions_adddup2(&mut actions.0, source.as_raw_fd(), *slot) })?;
        }
        // Everything else that would survive exec is closed in the child.
        for fd in crate::control::inheritable_fds().into_iter().filter(|fd| !slots.contains(fd)) {
            // SAFETY: closing a number in the child only.
            check(unsafe { libc::posix_spawn_file_actions_addclose(&mut actions.0, fd) })?;
        }
        if let Some(cwd) = &request.cwd {
            let cwd = cstring(cwd.clone().into_os_string().into_vec())?;
            // SAFETY: NUL-terminated path; glibc copies it.
            check(unsafe { libc::posix_spawn_file_actions_addchdir_np(&mut actions.0, cwd.as_ptr()) })?;
        }
        let mut flags = libc::POSIX_SPAWN_SETSIGMASK | libc::POSIX_SPAWN_SETSIGDEF;
        match request.lead {
            MappedLead::Caller => {}
            MappedLead::Group => {
                flags |= libc::POSIX_SPAWN_SETPGROUP;
                // SAFETY: attr is initialised.
                check(unsafe { libc::posix_spawnattr_setpgroup(&mut attr.0, 0) })?;
            }
            // glibc 2.26 and later; setsid also makes the child its group's leader.
            MappedLead::Session => flags |= libc::c_int::from(libc::POSIX_SPAWN_SETSID),
        }
        // SAFETY: signal sets are plain values filled by libc.
        unsafe {
            let mut empty: libc::sigset_t = std::mem::zeroed();
            libc::sigemptyset(&mut empty);
            check(libc::posix_spawnattr_setsigmask(&mut attr.0, &empty))?;
            let mut default: libc::sigset_t = std::mem::zeroed();
            libc::sigemptyset(&mut default);
            libc::sigaddset(&mut default, libc::SIGPIPE);
            check(libc::posix_spawnattr_setsigdefault(&mut attr.0, &default))?;
            check(libc::posix_spawnattr_setflags(&mut attr.0, flags as libc::c_short))?;
        }
        let mut pid: libc::pid_t = 0;
        // SAFETY: every pointer stays valid until posix_spawn returns.
        let rc = unsafe { libc::posix_spawn(&mut pid, program.as_ptr(), &actions.0, &attr.0, argv_ptrs.as_ptr(), envp_ptrs.as_ptr()) };
        if rc == libc::ENOEXEC {
            let shell = cstring(b"/bin/sh".to_vec())?;
            let mut shell_argv = vec![shell.as_ptr() as *mut _, program.as_ptr() as *mut _];
            shell_argv.extend_from_slice(&argv_ptrs[1..]);
            // SAFETY: same owned actions/environment, with shell argv alive.
            check(unsafe { libc::posix_spawn(&mut pid, shell.as_ptr(), &actions.0, &attr.0, shell_argv.as_ptr(), envp_ptrs.as_ptr()) })?;
        } else {
            check(rc)?;
        }
        drop(child_ends);
        drop(sources);
        let [stdin, stdout, stderr] = parent_ends;
        Ok(MappedChild {
            inner: Inner::Spawned { pid: pid as u32, status: None },
            stdin: stdin.map(File::from),
            stdout: stdout.map(File::from),
            stderr: stderr.map(File::from),
        })
    }
}
