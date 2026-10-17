//! Identifying the root process a launch started in a pane.

use crate::driver::{ForegroundProcess, ProcessInfo};
use crate::port::{ExpectedProcess, ProcessIdentity};
use fgos_process::{facts, ProcId};
use std::path::Path;

/// The foreground process whose argv is the launched
/// command: a shell that `exec`ed the command has the shell's own pid, so the
/// pid is not excluded; argv0 is the command or its basename, and the rest equals `args`.
/// Empty-string args are dropped on both sides because a multiplexer's process
/// report drops them.
pub fn match_launched<'a>(info: &'a ProcessInfo, command: &str, args: &[String]) -> Option<&'a ForegroundProcess> {
    let expected: Vec<&str> = args.iter().map(String::as_str).filter(|a| !a.is_empty()).collect();
    let base = Path::new(command).file_name().and_then(|n| n.to_str()).unwrap_or(command);
    info.foreground.iter().find(|p| {
        p.argv.first().is_some_and(|a0| a0 == command || a0 == base)
            && p.argv[1..].iter().map(String::as_str).eq(expected.iter().copied())
    })
}

/// The foreground process a launcher is expected to become: not the pane's
/// shell, argv0 is the expected argv0, command or its basename, and the rest
/// equals `args` (empty strings dropped on both sides).
pub fn match_expected<'a>(info: &'a ProcessInfo, expect: &ExpectedProcess) -> Option<&'a ForegroundProcess> {
    let expected: Vec<&str> = expect.args.iter().map(String::as_str).filter(|a| !a.is_empty()).collect();
    let base = Path::new(&expect.command).file_name().and_then(|n| n.to_str()).unwrap_or(&expect.command);
    info.foreground.iter().find(|p| {
        p.pid != info.shell_pid
            && p.argv.first().is_some_and(|a0| *a0 == expect.argv0 || *a0 == expect.command || a0 == base)
            && p.argv[1..].iter().map(String::as_str).eq(expected.iter().copied())
    })
}

/// The first foreground process that is not the pane's shell.
pub fn first_non_shell(info: &ProcessInfo) -> Option<&ForegroundProcess> {
    info.foreground.iter().find(|p| p.pid != info.shell_pid)
}

/// A pane whose shell is the only thing in the foreground.
pub fn is_bare_shell(info: &ProcessInfo) -> bool {
    first_non_shell(info).is_none()
}

/// Full identity of `pid` as the OS reports it; `None` when it already exited.
pub fn identity_of(pid: u32, pgid: u32) -> Option<ProcessIdentity> {
    let tuple = facts::identity_of(ProcId(pid))?;
    Some(ProcessIdentity {
        pid,
        start_time: tuple.start_time,
        boot_id: tuple.boot_id.unwrap_or_default(),
        pgid,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn info(shell: u32, procs: &[(u32, &[&str])]) -> ProcessInfo {
        ProcessInfo {
            shell_pid: shell,
            foreground_pgid: shell,
            foreground: procs.iter().map(|(pid, argv)| ForegroundProcess { pid: *pid, argv: argv.iter().map(|a| a.to_string()).collect() }).collect(),
        }
    }

    fn expect(argv0: &str, command: &str, args: &[&str]) -> ExpectedProcess {
        ExpectedProcess { argv0: argv0.into(), command: command.into(), args: args.iter().map(|a| a.to_string()).collect() }
    }

    #[test]
    fn expected_process_matches_the_exec_renamed_launcher_target() {
        let seen = info(10, &[(10, &["zsh"]), (20, &["claude", "--model", "x"])]);
        assert_eq!(match_expected(&seen, &expect("claude", "/usr/bin/claude", &["--model", "x", ""])).map(|p| p.pid), Some(20));
        assert!(match_expected(&seen, &expect("claude", "/usr/bin/claude", &["--other"])).is_none());
        assert!(match_expected(&seen, &expect("codex", "/usr/bin/codex", &["--model", "x"])).is_none());
    }

    #[test]
    fn the_shell_itself_never_matches_an_expected_process() {
        let seen = info(10, &[(10, &["claude"])]);
        assert!(match_expected(&seen, &expect("claude", "claude", &[])).is_none());
    }
}
