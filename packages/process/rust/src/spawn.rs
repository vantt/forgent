//! Run one program to completion with a bounded wait, and find a program on a search path: the process
//! door's spawn and lookup.
//!
//! The caller names the whole environment (nothing is inherited). The child leads a group of its own (a
//! process group on Unix, a kill-on-close Job Object on Windows), so a timeout ends its descendants too,
//! and a descendant that outlives the child is ended when the child is. Output is captured, never inherited,
//! and collected with a short grace: a process outside the group that keeps a pipe open can delay the call
//! by that grace, never hold it. This is the one site that starts a bounded child through
//! `std::process::Command`, which also runs Windows batch files (`.cmd`); [`resolve_program`] is the one
//! PATH and PATHEXT lookup of the crate.

use std::ffi::OsStr;
use std::io::{self, Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Output, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};

const POLL: Duration = Duration::from_millis(10);
/// How long the captured pipes are waited for once the child and its group are gone.
const PIPE_GRACE: Duration = Duration::from_secs(1);
/// The extensions Windows tries when `PATHEXT` is unset or empty.
pub const DEFAULT_PATHEXT: &str = ".EXE;.CMD;.BAT";

/// How a bounded run ended.
#[derive(Debug)]
pub enum Outcome {
    /// The child ended on its own; a non-zero exit is in `Output::status`, not an error.
    Exited(Output),
    /// The child outlived the timeout and its group was killed and reaped; what it had written is kept.
    TimedOut { stdout: Vec<u8>, stderr: Vec<u8> },
}

/// A pipe read on its own thread into a buffer the caller can take whenever it stops waiting.
struct Reader {
    buffer: Arc<Mutex<Vec<u8>>>,
    handle: thread::JoinHandle<()>,
}

impl Reader {
    fn start<R: Read + Send + 'static>(pipe: Option<R>) -> Self {
        let buffer = Arc::new(Mutex::new(Vec::new()));
        let sink = Arc::clone(&buffer);
        let handle = thread::spawn(move || {
            let Some(mut pipe) = pipe else { return };
            let mut chunk = [0u8; 8192];
            while let Ok(n) = pipe.read(&mut chunk) {
                if n == 0 {
                    break;
                }
                if let Ok(mut bytes) = sink.lock() {
                    bytes.extend_from_slice(&chunk[..n]);
                }
            }
        });
        Self { buffer, handle }
    }

    /// What was read so far, after waiting up to `grace` for the pipe to close.
    fn take(self, grace: Duration) -> Vec<u8> {
        let until = Instant::now() + grace;
        while !self.handle.is_finished() && Instant::now() < until {
            thread::sleep(POLL);
        }
        self.buffer.lock().map(|b| b.clone()).unwrap_or_default()
    }
}

/// The group the child leads: ended as a whole, while the child is still reserved (not reaped) on Unix.
struct Group {
    #[cfg(unix)]
    pid: libc::pid_t,
    #[cfg(windows)]
    job: crate::platform::windows_job::Job,
}

impl Group {
    /// Ends every process of the group.
    fn kill(&self) {
        #[cfg(unix)]
        // SAFETY: the child is not reaped yet, so its pid still names its own group and no other.
        unsafe {
            libc::killpg(self.pid, libc::SIGKILL);
        }
        #[cfg(windows)]
        let _ = self.job.terminate();
    }
}

/// Whether the child has ended, without reaping it: on Unix the pid stays reserved until `wait`, so a
/// group kill after the exit can only reach this child's own group.
fn exit_observed(child: &mut Child) -> io::Result<bool> {
    #[cfg(unix)]
    {
        let pid = child.id() as libc::pid_t;
        // SAFETY: an all-zero siginfo_t is valid; waitid fills it only when a child changed state.
        let mut info: libc::siginfo_t = unsafe { std::mem::zeroed() };
        // SAFETY: waitid with a valid out pointer, on a child of this process.
        let rc = unsafe {
            libc::waitid(
                libc::P_PID,
                pid as libc::id_t,
                &mut info,
                libc::WEXITED | libc::WNOHANG | libc::WNOWAIT,
            )
        };
        if rc < 0 {
            return Err(io::Error::last_os_error());
        }
        #[cfg(target_os = "linux")]
        // SAFETY: si_pid is valid after a successful waitid.
        let who = unsafe { info.si_pid() };
        #[cfg(not(target_os = "linux"))]
        let who = info.si_pid;
        Ok(who != 0)
    }
    #[cfg(not(unix))]
    {
        Ok(child.try_wait()?.is_some())
    }
}

/// Runs `program args` with exactly the environment `env` (a full replacement, nothing inherited), in `cwd`
/// (the caller's when `None`), with `input` on stdin (a null stdin when `None`), stdout and stderr captured.
///
/// A program that cannot be started returns the OS error (`NotFound` for a missing one). The child and
/// every descendant in its group are gone when this returns, on every path.
pub fn run_bounded<I, S>(
    program: impl AsRef<OsStr>,
    args: I,
    env: &[(String, String)],
    cwd: Option<&Path>,
    input: Option<&[u8]>,
    timeout: Duration,
) -> io::Result<Outcome>
where
    I: IntoIterator<Item = S>,
    S: AsRef<OsStr>,
{
    let mut command = Command::new(program);
    command
        .args(args)
        .env_clear()
        .envs(env.iter().map(|(k, v)| (k, v)))
        .stdin(if input.is_some() {
            Stdio::piped()
        } else {
            Stdio::null()
        })
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    if let Some(cwd) = cwd {
        command.current_dir(cwd);
    }
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        command.process_group(0);
    }
    #[cfg(windows)]
    let job = {
        use crate::platform::windows_job::{create_kill_job, job_name};
        use std::os::windows::process::CommandExt;
        command.creation_flags(windows_sys::Win32::System::Threading::CREATE_SUSPENDED);
        create_kill_job(&job_name("bounded-run", "child"))?
    };
    let mut child = command.spawn()?;
    #[cfg(windows)]
    if let Err(error) = crate::platform::windows_job::assign_and_resume(&job, &child) {
        // On failure `assign_and_resume` ends the suspended child itself.
        let _ = child.wait();
        return Err(error);
    }
    let group = Group {
        #[cfg(unix)]
        pid: child.id() as libc::pid_t,
        #[cfg(windows)]
        job,
    };
    let writer = input.map(|bytes| {
        let (stdin, bytes) = (child.stdin.take(), bytes.to_vec());
        thread::spawn(move || {
            if let Some(mut stdin) = stdin {
                // A child that exits without reading closes the pipe: not an error of the run.
                let _ = stdin.write_all(&bytes);
            }
        })
    });
    let stdout = Reader::start(child.stdout.take());
    let stderr = Reader::start(child.stderr.take());
    let deadline = Instant::now() + timeout;
    let timed_out = loop {
        match exit_observed(&mut child) {
            Ok(true) => break false,
            Ok(false) if Instant::now() >= deadline => break true,
            Ok(false) => thread::sleep(POLL),
            Err(error) => {
                group.kill();
                let _ = child.wait();
                return Err(error);
            }
        }
    };
    // The child has ended or is out of time; its descendants must not outlive the call either.
    group.kill();
    let status = child.wait()?;
    if let Some(writer) = writer {
        if writer.is_finished() {
            let _ = writer.join();
        }
    }
    let (stdout, stderr) = (stdout.take(PIPE_GRACE), stderr.take(PIPE_GRACE));
    Ok(if timed_out {
        Outcome::TimedOut { stdout, stderr }
    } else {
        Outcome::Exited(Output {
            status,
            stdout,
            stderr,
        })
    })
}

/// The file `name` names on the search path `path_env`, or `None`.
///
/// `path_env` is split on `;` when `windows` and on `:` otherwise; an empty entry is skipped. A name holding
/// a path separator is taken as the path itself. On Windows only the extensions of `pathext` are tried
/// (`DEFAULT_PATHEXT` when it is empty), never the bare name: npm installs an extensionless `sh` script
/// beside `claude.cmd` that CreateProcess cannot run. Elsewhere the file must be executable. The answer is the
/// first hit in search order. Pure over its inputs apart from reading the file system, so it runs the same
/// on any host.
pub fn resolve_program(
    name: &str,
    path_env: &str,
    pathext: &str,
    windows: bool,
) -> Option<PathBuf> {
    if name.is_empty() {
        return None;
    }
    let pathext = if pathext.trim().is_empty() {
        DEFAULT_PATHEXT
    } else {
        pathext
    };
    let extensions: Vec<&str> = if windows {
        pathext.split(';').filter(|ext| !ext.is_empty()).collect()
    } else {
        vec![""]
    };
    let usable = |candidate: &Path| candidate.is_file() && (windows || is_executable(candidate));
    let first_in = |base: &dyn Fn(&str) -> PathBuf| {
        extensions
            .iter()
            .map(|ext| base(ext))
            .find(|candidate| usable(candidate))
    };
    if name.contains('/') || (windows && name.contains(['\\', ':'])) {
        return first_in(&|ext| PathBuf::from(format!("{name}{ext}")));
    }
    let separator = if windows { ';' } else { ':' };
    path_env
        .split(separator)
        .map(|dir| if windows { dir.trim_matches('"') } else { dir })
        .filter(|dir| !dir.is_empty())
        .find_map(|dir| first_in(&|ext| Path::new(dir).join(format!("{name}{ext}"))))
}

#[cfg(unix)]
fn is_executable(path: &Path) -> bool {
    use std::os::unix::fs::PermissionsExt;
    path.metadata()
        .map(|meta| meta.permissions().mode() & 0o111 != 0)
        .unwrap_or(false)
}

#[cfg(not(unix))]
fn is_executable(path: &Path) -> bool {
    path.is_file()
}

#[cfg(test)]
mod test_scratch {
    use std::path::{Path, PathBuf};

    /// A directory that is removed when it goes out of scope.
    pub struct Scratch(PathBuf);

    impl std::ops::Deref for Scratch {
        type Target = Path;
        fn deref(&self) -> &Path {
            &self.0
        }
    }

    impl Drop for Scratch {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    /// A fresh, empty directory: `create_dir` fails on an existing one, and the next name is tried.
    pub fn scratch(label: &str) -> Scratch {
        use std::sync::atomic::{AtomicU32, Ordering};
        static NEXT: AtomicU32 = AtomicU32::new(0);
        loop {
            let dir = std::env::temp_dir().join(format!(
                "fgos-resolve-{label}-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::Relaxed)
            ));
            match std::fs::create_dir(&dir) {
                Ok(()) => return Scratch(dir),
                Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => continue,
                Err(e) => panic!("scratch directory: {e}"),
            }
        }
    }
}

#[cfg(test)]
mod resolve_tests {
    use super::test_scratch::scratch;
    use super::*;

    #[cfg(unix)]
    fn make_executable(path: &Path, executable: bool) {
        use std::os::unix::fs::PermissionsExt;
        std::fs::write(path, "#!/bin/sh\n").unwrap();
        let mode = if executable { 0o755 } else { 0o644 };
        std::fs::set_permissions(path, std::fs::Permissions::from_mode(mode)).unwrap();
    }

    #[cfg(unix)]
    #[test]
    fn the_first_executable_in_search_order_wins_and_a_plain_file_is_skipped() {
        let (a, b) = (scratch("a"), scratch("b"));
        make_executable(&a.join("tool"), false);
        make_executable(&b.join("tool"), true);
        let path = format!("{}::{}", a.display(), b.display());
        assert_eq!(
            resolve_program("tool", &path, "", false),
            Some(b.join("tool"))
        );
        assert_eq!(resolve_program("absent", &path, "", false), None);
    }

    #[test]
    fn windows_tries_only_the_pathext_extensions_in_order_with_semicolons_and_never_the_bare_name()
    {
        let dir = scratch("win");
        // npm installs an extensionless sh script beside the .cmd shim: CreateProcess cannot run it.
        std::fs::write(dir.join("claude"), "#!/bin/sh\n").unwrap();
        std::fs::write(dir.join("claude.CMD"), "").unwrap();
        std::fs::write(dir.join("claude.BAT"), "").unwrap();
        let path = format!("{};{}", dir.display(), "/nowhere");
        assert_eq!(
            resolve_program("claude", &path, ".EXE;.CMD;.BAT", true),
            Some(dir.join("claude.CMD"))
        );
        assert_eq!(
            resolve_program("claude", &path, ".BAT;.CMD", true),
            Some(dir.join("claude.BAT"))
        );
        // An unset PATHEXT is the default list.
        assert_eq!(
            resolve_program("claude", &path, "", true),
            Some(dir.join("claude.CMD"))
        );
        std::fs::remove_file(dir.join("claude.CMD")).unwrap();
        std::fs::remove_file(dir.join("claude.BAT")).unwrap();
        assert_eq!(
            resolve_program("claude", &path, ".EXE;.CMD;.BAT", true),
            None
        );
    }

    #[test]
    fn a_windows_name_with_a_directory_part_takes_the_extensions_too_and_quoted_entries_are_unquoted(
    ) {
        let dir = scratch("windir");
        std::fs::write(dir.join("tool.EXE"), "").unwrap();
        let direct = format!("{}/tool", dir.display());
        assert_eq!(
            resolve_program(&direct, "", ".EXE", true),
            Some(PathBuf::from(format!("{direct}.EXE")))
        );
        let quoted = format!("\"{}\"", dir.display());
        assert_eq!(
            resolve_program("tool", &quoted, ".EXE", true),
            Some(dir.join("tool.EXE"))
        );
    }

    #[test]
    fn an_empty_name_or_path_finds_nothing() {
        assert_eq!(resolve_program("", "/usr/bin", "", false), None);
        assert_eq!(resolve_program("sh", "", "", false), None);
    }
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;

    fn sh(script: &str, env: &[(String, String)], timeout: Duration) -> io::Result<Outcome> {
        run_bounded("/bin/sh", ["-c", script], env, None, None, timeout)
    }

    fn exited(outcome: io::Result<Outcome>) -> Output {
        match outcome.unwrap() {
            Outcome::Exited(out) => out,
            Outcome::TimedOut { .. } => panic!("timed out"),
        }
    }

    #[test]
    fn captures_stdout_stderr_and_a_failing_status() {
        let out = exited(sh(
            "echo out; echo err >&2; exit 3",
            &[],
            Duration::from_secs(5),
        ));
        assert_eq!(out.stdout, b"out\n");
        assert_eq!(out.stderr, b"err\n");
        assert_eq!(out.status.code(), Some(3));
    }

    #[test]
    fn the_child_sees_only_the_environment_it_was_given() {
        std::env::set_var("FGOS_SPAWN_TEST_LEAK", "leaked");
        let env = [("ONLY".to_string(), "mine".to_string())];
        let out = exited(sh(
            "echo \"${ONLY}-${FGOS_SPAWN_TEST_LEAK:-none}-${HOME:-nohome}\"",
            &env,
            Duration::from_secs(5),
        ));
        assert_eq!(String::from_utf8_lossy(&out.stdout), "mine-none-nohome\n");
    }

    #[test]
    fn a_child_past_the_timeout_is_killed_and_reported_as_timed_out() {
        let started = Instant::now();
        let outcome = sh("echo before; sleep 30", &[], Duration::from_millis(300)).unwrap();
        assert!(matches!(outcome, Outcome::TimedOut { .. }));
        assert!(started.elapsed() < Duration::from_secs(10));
    }

    #[test]
    fn input_reaches_stdin_and_the_cwd_is_honoured() {
        let dir = std::env::temp_dir();
        let out = exited(run_bounded(
            "/bin/sh",
            ["-c", "cat; pwd"],
            &[],
            Some(&dir),
            Some(b"hello\n"),
            Duration::from_secs(5),
        ));
        let text = String::from_utf8_lossy(&out.stdout).into_owned();
        assert!(text.starts_with("hello\n"), "{text}");
        let printed = text.lines().last().unwrap();
        assert_eq!(
            std::fs::canonicalize(printed).unwrap(),
            std::fs::canonicalize(&dir).unwrap()
        );
    }

    /// Whether `pid` is still a live process (a zombie awaiting its reaper counts as gone).
    fn is_alive(pid: libc::pid_t) -> bool {
        // SAFETY: signal 0 only checks that the process exists.
        let exists = unsafe { libc::kill(pid, 0) } == 0;
        exists
            && std::fs::read_to_string(format!("/proc/{pid}/stat"))
                .map(|stat| {
                    !stat
                        .rsplit(')')
                        .next()
                        .unwrap_or("")
                        .trim_start()
                        .starts_with('Z')
                })
                .unwrap_or(true)
    }

    fn gone_soon(pid: libc::pid_t) -> bool {
        let until = Instant::now() + Duration::from_secs(3);
        while Instant::now() < until {
            if !is_alive(pid) {
                return true;
            }
            thread::sleep(Duration::from_millis(20));
        }
        false
    }

    fn pid_written_by(script_dir: &Path) -> libc::pid_t {
        std::fs::read_to_string(script_dir.join("grandchild.pid"))
            .unwrap()
            .trim()
            .parse()
            .unwrap()
    }

    #[test]
    fn a_grandchild_that_outlives_the_timeout_is_killed_with_the_group() {
        let dir = super::test_scratch::scratch("grand");
        let script = format!(
            "sleep 60 & echo $! > '{}/grandchild.pid'; wait",
            dir.display()
        );
        let outcome = sh(&script, &[], Duration::from_millis(500)).unwrap();
        assert!(matches!(outcome, Outcome::TimedOut { .. }));
        assert!(
            gone_soon(pid_written_by(&dir)),
            "the grandchild outlived the call"
        );
    }

    #[test]
    fn a_grandchild_holding_the_pipe_after_the_child_exits_neither_delays_the_call_nor_outlives_it()
    {
        let dir = super::test_scratch::scratch("pipe");
        let script = format!(
            "sleep 60 & echo $! > '{}/grandchild.pid'; echo hi",
            dir.display()
        );
        let started = Instant::now();
        let out = exited(sh(&script, &[], Duration::from_secs(10)));
        assert!(
            started.elapsed() < Duration::from_secs(5),
            "{:?}",
            started.elapsed()
        );
        assert_eq!(out.stdout, b"hi\n");
        assert!(
            gone_soon(pid_written_by(&dir)),
            "the grandchild outlived the call"
        );
    }

    #[test]
    fn a_program_that_does_not_exist_is_the_os_error() {
        let err = run_bounded(
            "/nonexistent/fgos-spawn-test-program",
            std::iter::empty::<&str>(),
            &[],
            None,
            None,
            Duration::from_secs(1),
        )
        .unwrap_err();
        assert_eq!(err.kind(), io::ErrorKind::NotFound);
    }
}

#[cfg(all(test, windows))]
mod windows_tests {
    use super::*;

    #[test]
    fn a_batch_file_runs_through_the_same_door() {
        let dir = super::test_scratch::scratch("spawn-cmd");
        let script = dir.join("probe.cmd");
        std::fs::write(&script, "@echo off\r\necho batch-ok\r\n").unwrap();
        let env = [(
            "SystemRoot".to_string(),
            std::env::var("SystemRoot").unwrap_or_default(),
        )];
        let outcome = run_bounded(
            &script,
            std::iter::empty::<&str>(),
            &env,
            None,
            None,
            Duration::from_secs(10),
        )
        .unwrap();
        match outcome {
            Outcome::Exited(out) => {
                assert!(String::from_utf8_lossy(&out.stdout).contains("batch-ok"))
            }
            Outcome::TimedOut { .. } => panic!("timed out"),
        }
    }
}
