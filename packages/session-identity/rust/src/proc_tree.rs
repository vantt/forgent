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
}

/// Parses one `/proc/<pid>/stat` line. The command name sits in parentheses
/// and may itself hold spaces or parentheses, so fields are counted from the
/// last `)`: state, ppid, pgrp, session, tty_nr.
pub fn parse_proc_stat(line: &str) -> Option<ProcStat> {
    let rest = &line[line.rfind(')')? + 1..];
    let fields: Vec<&str> = rest.split_whitespace().collect();
    Some(ProcStat {
        ppid: fields.get(1)?.parse().ok()?,
        session: fields.get(3)?.parse().ok()?,
        tty_nr: fields.get(4)?.parse().ok()?,
    })
}

/// Linux driver: reads `/proc/<pid>/stat`.
#[cfg(target_os = "linux")]
struct ProcFsTree;

#[cfg(target_os = "linux")]
impl ProcessTree for ProcFsTree {
    fn stat(&self, pid: u32) -> Option<ProcStat> {
        let line = std::fs::read_to_string(format!("/proc/{pid}/stat")).ok()?;
        parse_proc_stat(&line)
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
    return Box::new(ProcFsTree);
    #[cfg(all(unix, not(target_os = "linux")))]
    return Box::new(SessionOnlyTree);
    #[cfg(not(unix))]
    return Box::new(UnreadableTree);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_comm_with_spaces_and_parentheses() {
        let line = "4242 (weird) name (x)) S 100 4242 77 34816 4242 4194304 0 0";
        assert_eq!(
            parse_proc_stat(line),
            Some(ProcStat {
                ppid: 100,
                session: 77,
                tty_nr: 34816
            })
        );
    }

    #[test]
    fn rejects_truncated_lines() {
        assert_eq!(parse_proc_stat("12 (sh) S 1 12"), None);
        assert_eq!(parse_proc_stat("no parenthesis"), None);
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn reads_the_current_process() {
        let me = os_process_tree()
            .stat(std::process::id())
            .expect("own stat");
        assert!(me.ppid > 0);
    }
}
