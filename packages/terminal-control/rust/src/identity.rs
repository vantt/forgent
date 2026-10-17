//! Identifying the root process a launch started in a pane.

use crate::driver::{ForegroundProcess, ProcessInfo};
use crate::port::ProcessIdentity;
use fgos_process::{facts, ProcId};
use std::path::Path;

/// The foreground process (other than the shell) whose argv is the launched
/// command: argv0 is the command or its basename, and the rest equals `args`.
/// Empty-string args are dropped on both sides because a multiplexer's process
/// report drops them.
pub fn match_launched<'a>(info: &'a ProcessInfo, command: &str, args: &[String]) -> Option<&'a ForegroundProcess> {
    let expected: Vec<&str> = args.iter().map(String::as_str).filter(|a| !a.is_empty()).collect();
    let base = Path::new(command).file_name().and_then(|n| n.to_str()).unwrap_or(command);
    info.foreground.iter().find(|p| {
        p.pid != info.shell_pid
            && p.argv.first().is_some_and(|a0| a0 == command || a0 == base)
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
