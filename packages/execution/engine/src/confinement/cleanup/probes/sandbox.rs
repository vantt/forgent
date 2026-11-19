//! One door into the sandbox for every probe: a bounded run with the caller's environment, and the plain bwrap
//! prefix every probe starts from.

use fgos_process::spawn::{run_bounded, run_bounded_command, Outcome};
use std::path::Path;
use std::time::Duration;

const PROBE_TIMEOUT: Duration = Duration::from_secs(30);

/// The status and streams of one sandbox run; `status` is `None` when the run was killed or did not start.
#[derive(Debug, Clone, Default)]
pub struct Ran {
    pub status: Option<i32>,
    pub stdout: String,
    pub stderr: String,
}

impl Ran {
    pub fn why(&self) -> String {
        if !self.stderr.is_empty() {
            self.stderr.clone()
        } else {
            self.stdout.clone()
        }
    }
}

fn inherited_env() -> Vec<(String, String)> {
    std::env::vars().collect()
}

fn of(outcome: std::io::Result<Outcome>) -> Ran {
    match outcome {
        Ok(Outcome::Exited(out)) => Ran {
            status: out.status.code(),
            stdout: String::from_utf8_lossy(&out.stdout).into_owned(),
            stderr: String::from_utf8_lossy(&out.stderr).into_owned(),
        },
        Ok(Outcome::TimedOut { stdout, stderr }) => Ran {
            status: None,
            stdout: String::from_utf8_lossy(&stdout).into_owned(),
            stderr: format!("timed out: {}", String::from_utf8_lossy(&stderr)),
        },
        Err(err) => Ran {
            status: None,
            stdout: String::new(),
            stderr: err.to_string(),
        },
    }
}

/// Runs `program args` with this process's environment.
pub fn run(program: &str, args: &[String]) -> Ran {
    of(run_bounded(
        program,
        args,
        &inherited_env(),
        None,
        None,
        PROBE_TIMEOUT,
    ))
}

/// Runs `program args` with this process's environment and the open file `fd` also open as descriptor 9.
#[cfg(unix)]
pub fn run_with_fd9(program: &str, args: &[String], fd: std::os::fd::RawFd) -> Ran {
    use std::os::unix::process::CommandExt;
    let mut command = std::process::Command::new(program);
    command.args(args).env_clear().envs(inherited_env());
    // SAFETY: dup2 is async-signal-safe and touches no memory; it runs between fork and exec.
    unsafe {
        command.pre_exec(move || {
            if libc::dup2(fd, 9) < 0 {
                return Err(std::io::Error::last_os_error());
            }
            Ok(())
        });
    }
    of(run_bounded_command(command, None, PROBE_TIMEOUT, |_| ()))
}

/// The prefix every probe starts from: the host read-only, a fresh /dev, /proc and /tmp.
pub fn base_args() -> Vec<String> {
    [
        "--ro-bind",
        "/",
        "/",
        "--dev",
        "/dev",
        "--proc",
        "/proc",
        "--tmpfs",
        "/tmp",
    ]
    .map(String::from)
    .to_vec()
}

pub fn bind(flag: &str, dir: &Path) -> [String; 3] {
    let dir = dir.to_string_lossy().into_owned();
    [flag.to_string(), dir.clone(), dir]
}

/// `bwrap <args> -- sh -c <script> sh <extra...>`.
pub fn in_sandbox(bwrap: &str, mut args: Vec<String>, script: &str, extra: &[&str]) -> Ran {
    args.extend([
        "--".into(),
        "sh".into(),
        "-c".into(),
        script.to_string(),
        "sh".into(),
    ]);
    args.extend(extra.iter().map(|s| s.to_string()));
    run(bwrap, &args)
}

/// A shell function every in-sandbox script defines: `code <command...>` prints `ok` or the errno name the command's
/// failure message names, the way a Node `err.code` would.
pub const CODE_FN: &str = "code() { e=$(\"$@\" 2>&1 >/dev/null); r=$?; if [ $r -eq 0 ]; then echo ok; else case \"$e\" in *'No such file'*) echo ENOENT;; *'Read-only'*) echo EROFS;; *'Permission denied'*) echo EACCES;; *) echo \"E$r\";; esac; fi; }; ";

/// `key=value` lines to a map.
pub fn parse_lines(text: &str) -> std::collections::HashMap<String, String> {
    text.lines()
        .filter_map(|line| line.split_once('='))
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect()
}
