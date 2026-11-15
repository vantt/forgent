//! Run one program to completion with a bounded wait, and find a program on a search path: the process
//! door's spawn and lookup.
//!
//! The caller names the whole environment (nothing is inherited), and a child that outlives `timeout` is
//! killed and reaped, so a hung service manager can never hold a verb. Output is captured, never inherited.
//! This is the one site that starts a bounded child through `std::process::Command`, which also runs
//! Windows batch files (`.cmd`); `resolve_program` is the one PATH and PATHEXT lookup.

use std::ffi::OsStr;
use std::io::{self, Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Output, Stdio};
use std::thread;
use std::time::{Duration, Instant};

const POLL: Duration = Duration::from_millis(10);

/// How a bounded run ended.
#[derive(Debug)]
pub enum Outcome {
    /// The child ended on its own; a non-zero exit is in `Output::status`, not an error.
    Exited(Output),
    /// The child outlived the timeout and was killed and reaped; what it had written is kept.
    TimedOut { stdout: Vec<u8>, stderr: Vec<u8> },
}

/// Runs `program args` with exactly the environment `env` (a full replacement, nothing inherited), in `cwd`
/// (the caller's when `None`), with `input` on stdin (a null stdin when `None`), stdout and stderr captured.
///
/// A program that cannot be started returns the OS error (`NotFound` for a missing one).
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
    let mut child = command.spawn()?;
    let writer = input.map(|bytes| {
        let (stdin, bytes) = (child.stdin.take(), bytes.to_vec());
        thread::spawn(move || {
            if let Some(mut stdin) = stdin {
                // A child that exits without reading closes the pipe: not an error of the run.
                let _ = stdin.write_all(&bytes);
            }
        })
    });
    let stdout = drain(child.stdout.take());
    let stderr = drain(child.stderr.take());
    let deadline = Instant::now() + timeout;
    let status = loop {
        if let Some(status) = child.try_wait()? {
            break status;
        }
        if Instant::now() >= deadline {
            stop(&mut child);
            // A grandchild may still hold the pipes, so the readers are not waited for past a short grace.
            return Ok(Outcome::TimedOut {
                stdout: collect(stdout),
                stderr: collect(stderr),
            });
        }
        thread::sleep(POLL);
    };
    if let Some(writer) = writer {
        let _ = writer.join();
    }
    Ok(Outcome::Exited(Output {
        status,
        stdout: stdout.join().unwrap_or_default(),
        stderr: stderr.join().unwrap_or_default(),
    }))
}

fn stop(child: &mut Child) {
    let _ = child.kill();
    let _ = child.wait();
}

type Reader = thread::JoinHandle<Vec<u8>>;

fn drain<R: Read + Send + 'static>(pipe: Option<R>) -> Reader {
    thread::spawn(move || {
        let mut bytes = Vec::new();
        if let Some(mut pipe) = pipe {
            let _ = pipe.read_to_end(&mut bytes);
        }
        bytes
    })
}

/// The bytes a reader has when its pipe closed within a short grace; empty when a grandchild keeps it open.
fn collect(reader: Reader) -> Vec<u8> {
    let until = Instant::now() + Duration::from_millis(200);
    while !reader.is_finished() && Instant::now() < until {
        thread::sleep(POLL);
    }
    if reader.is_finished() {
        reader.join().unwrap_or_default()
    } else {
        Vec::new()
    }
}

/// The file `name` names on the search path `path_env`, or `None`.
///
/// `path_env` is split on `;` when `windows` and on `:` otherwise; an empty entry is skipped. A name holding
/// a path separator is taken as the path itself. On Windows each extension of `pathext` (`.EXE;.CMD;.BAT`)
/// is tried after the bare name; elsewhere the file must be executable. The answer is the first hit in
/// search order. Pure over its inputs apart from reading the file system, so it runs the same on any host.
pub fn resolve_program(
    name: &str,
    path_env: &str,
    pathext: &str,
    windows: bool,
) -> Option<PathBuf> {
    if name.is_empty() {
        return None;
    }
    let extensions: Vec<&str> = if windows {
        std::iter::once("")
            .chain(pathext.split(';').filter(|ext| !ext.is_empty()))
            .collect()
    } else {
        vec![""]
    };
    let usable = |candidate: &Path| candidate.is_file() && (windows || is_executable(candidate));
    let hit = |dir: &Path| {
        extensions
            .iter()
            .map(|ext| dir.join(format!("{name}{ext}")))
            .find(|candidate| usable(candidate))
    };
    if name.contains('/') || (windows && name.contains('\\')) {
        return extensions
            .iter()
            .map(|ext| PathBuf::from(format!("{name}{ext}")))
            .find(|candidate| usable(candidate));
    }
    let separator = if windows { ';' } else { ':' };
    path_env
        .split(separator)
        .filter(|dir| !dir.is_empty())
        .find_map(|dir| hit(Path::new(dir)))
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
mod resolve_tests {
    use super::*;

    fn scratch(label: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("fgos-resolve-{label}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

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
        let _ = (std::fs::remove_dir_all(a), std::fs::remove_dir_all(b));
    }

    #[test]
    fn windows_tries_the_bare_name_then_each_extension_in_order_with_semicolons() {
        let dir = scratch("win");
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
        assert_eq!(resolve_program("claude", &path, "", true), None);
        let _ = std::fs::remove_dir_all(dir);
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
        let dir = std::env::temp_dir().join(format!("fgos-spawn-cmd-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
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
        let _ = std::fs::remove_dir_all(dir);
    }
}
