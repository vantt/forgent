//! Process-tree port and its OS drivers. The rule asks only for a process's
//! parent, session and controlling tty; it never names a terminal program.

/// What the rule needs to know about one process.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ProcStat {
    pub ppid: u32,
    pub session: u32,
    /// Controlling terminal device number; 0 means none.
    pub tty_nr: i64,
}

/// Port to the OS process table. `None` means the process cannot be read
/// (gone, hidden, or the platform has no way to ask).
pub trait ProcessTree {
    fn stat(&self, pid: u32) -> Option<ProcStat>;
    /// The kernel's short command name of `pid` (Linux `comm`); `None` when
    /// unreadable or the platform has no such read.
    fn comm(&self, _pid: u32) -> Option<String> {
        None
    }
}

/// Linux driver: one `/proc/<pid>/stat` read through `fgos-process`, the
/// crate that owns the parser.
#[cfg(target_os = "linux")]
struct FactsTree;

#[cfg(target_os = "linux")]
impl ProcessTree for FactsTree {
    fn stat(&self, pid: u32) -> Option<ProcStat> {
        let relation = fgos_process::facts::relation_of(fgos_process::ProcId(pid))?;
        Some(ProcStat {
            ppid: relation.parent,
            session: relation.session,
            tty_nr: relation.tty_nr,
        })
    }

    fn comm(&self, pid: u32) -> Option<String> {
        fgos_process::facts::command_name_of(fgos_process::ProcId(pid))
    }
}

/// Other unix driver: no portable way to walk parents or read the tty, so
/// only the session is known and the rule falls to the session step.
#[cfg(all(unix, not(target_os = "linux")))]
struct SessionOnlyTree;

#[cfg(all(unix, not(target_os = "linux")))]
impl ProcessTree for SessionOnlyTree {
    fn stat(&self, pid: u32) -> Option<ProcStat> {
        // SAFETY: getsid only reads the kernel's process table.
        let sid = unsafe { libc::getsid(pid as libc::pid_t) };
        (sid > 0).then_some(ProcStat {
            ppid: 0,
            session: sid as u32,
            tty_nr: 0,
        })
    }
}

/// Windows driver: nothing is readable, so the caller stays unresolved.
#[cfg(not(unix))]
struct UnreadableTree;

#[cfg(not(unix))]
impl ProcessTree for UnreadableTree {
    fn stat(&self, _pid: u32) -> Option<ProcStat> {
        None
    }
}

/// The driver for the platform this binary runs on.
pub fn os_process_tree() -> Box<dyn ProcessTree> {
    #[cfg(target_os = "linux")]
    return Box::new(FactsTree);
    #[cfg(all(unix, not(target_os = "linux")))]
    return Box::new(SessionOnlyTree);
    #[cfg(not(unix))]
    return Box::new(UnreadableTree);
}
