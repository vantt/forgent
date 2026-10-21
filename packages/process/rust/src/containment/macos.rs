//! macOS driver `macos-tree` (best-effort, domain `macos-tree`): the gate leads
//! its own session and process group, and the domain is the group plus the
//! descendant tree scanned from the gate. A descendant that calls `setsid` and
//! double-forks to launchd leaves both.

use std::fs::File;
use std::io;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

use super::{ContainmentDomain, ContainmentDriver, ContainmentError, Guarantee, GuaranteeLevel, SpawnSpec, Spawned};
use crate::control::{self, Signal};
use crate::facts::{self, ProcTuple, Verdict};
use crate::platform::as_pid_t;
use crate::{signal_settled, Domain, DomainState, FdSlot, KillOutcome, ProcId};

/// `proc_listpids` selector: processes of one process group.
const PROC_PGRP_ONLY: u32 = 2;
/// `proc_listpids` selector: children of one process.
const PROC_PPID_ONLY: u32 = 6;
/// A tree that left no process on the first look is scanned once more after
/// this long when a domain is judged from its record alone (adopt): a fork in
/// flight at the first look is visible by then. A constant because the driver
/// is best-effort.
const RESCAN: Duration = Duration::from_millis(500);
const POLL: Duration = Duration::from_millis(10);

/// `macos-tree`.
pub struct MacosTree;

impl ContainmentDriver for MacosTree {
    fn name(&self) -> &'static str {
        "macos-tree"
    }

    fn create(&self, attempt_id: &str) -> Result<ContainmentDomain, ContainmentError> {
        Ok(ContainmentDomain::new(attempt_id))
    }

    fn spawn_in(&self, domain: &mut ContainmentDomain, spec: SpawnSpec) -> Result<Spawned, ContainmentError> {
        use std::os::unix::process::CommandExt;
        let Some((program, args)) = spec.argv.split_first() else {
            return Err(ContainmentError::SpawnFailed("empty gate command".into()));
        };
        let mut cmd = Command::new(program);
        cmd.args(args);
        apply_stdio(&mut cmd, &spec);
        // SAFETY: setsid is async-signal-safe and touches no memory of the parent.
        unsafe {
            cmd.pre_exec(|| {
                if libc::setsid() < 0 {
                    return Err(io::Error::last_os_error());
                }
                Ok(())
            });
        }
        let mapped: Vec<(FdSlot, &File)> = spec.fd_map.iter().map(|(slot, file)| (*slot, file)).collect();
        let mut child = control::spawn_with_fds(cmd, &mapped).map_err(|err| ContainmentError::SpawnFailed(err.to_string()))?;
        let Some(root) = crate::platform::macos::child_identity(ProcId(child.id())) else {
            let _ = child.kill();
            let _ = child.wait();
            return Err(ContainmentError::SpawnFailed("gate left before its identity was read".into()));
        };
        domain.seen.push(root.clone());
        domain.set_domain(Domain::MacosTree(root.clone()));
        Ok(Spawned { child, root })
    }

    fn is_empty(&self, domain: &mut ContainmentDomain) -> DomainState {
        let Some(Domain::MacosTree(root)) = domain.domain().cloned() else {
            return DomainState::Unknown;
        };
        if facts::judge_here(&root.to_record()) == Verdict::Alive {
            remember_tree(&root, &mut domain.seen);
        }
        prune_dead(&root, &mut domain.seen);
        tree_state(&root, &domain.seen)
    }

    fn kill_all(&self, domain: &mut ContainmentDomain, grace_ms: u64) -> KillOutcome {
        let Some(Domain::MacosTree(root)) = domain.domain().cloned() else {
            return KillOutcome::Refused;
        };
        if grace_ms > 0 {
            // Snapshot first: a gate that ends on SIGTERM takes the tree links with it.
            remember_tree(&root, &mut domain.seen);
            let _ = signal_group(&root, libc::SIGTERM);
            wait_until(Duration::from_millis(grace_ms), || tree_state(&root, &domain.seen) == DomainState::Empty);
        }
        let wait = domain.empty_wait();
        tree_kill(&root, &mut domain.seen, wait)
    }

    fn guarantee(&self) -> Guarantee {
        Guarantee {
            driver: "macos-tree",
            level: GuaranteeLevel::BestEffort,
            escapes: vec![
                "setsid plus a double fork re-parents a descendant to launchd, out of the group and the tree",
                "a group or tree scan made after the root died can meet a reused pgid",
                "processes started by a launchd or XPC service on the agent's request",
            ],
        }
    }
}

/// Pids `proc_listpids` returns for `selector` and `info`.
fn list_pids(selector: u32, info: u32) -> Vec<u32> {
    // SAFETY: a null buffer asks for the size in bytes the answer needs.
    let need = unsafe { libc::proc_listpids(selector, info, std::ptr::null_mut(), 0) };
    if need <= 0 {
        return Vec::new();
    }
    // Slack for processes created between the size query and the read.
    let mut slots = need as usize / std::mem::size_of::<libc::pid_t>() + 64;
    for _ in 0..4 {
        let mut buf = vec![0 as libc::pid_t; slots];
        let size = (buf.len() * std::mem::size_of::<libc::pid_t>()) as libc::c_int;
        // SAFETY: proc_listpids writes at most `size` bytes into `buf`.
        let got = unsafe { libc::proc_listpids(selector, info, buf.as_mut_ptr() as *mut libc::c_void, size) };
        if got <= 0 {
            return Vec::new();
        }
        let count = got as usize / std::mem::size_of::<libc::pid_t>();
        if count < slots {
            return buf[..count].iter().filter(|pid| **pid > 0).map(|pid| *pid as u32).collect();
        }
        slots *= 2;
    }
    Vec::new()
}

/// The live (non-zombie) process under `pid`, with its identity.
fn live_tuple(pid: u32) -> Option<ProcTuple> {
    crate::platform::current().identity_of(ProcId(pid))
}

/// Every live descendant of `root` by parent links and every live process in
/// the group `pgid`, `root` itself excluded. The tree is walked only while
/// `root` is still the recorded leader: a dead leader's pid may name anyone.
fn members(root: u32, walk_tree: bool, pgid: Option<u32>) -> Vec<ProcTuple> {
    let mut pids: Vec<u32> = Vec::new();
    if walk_tree {
        let mut frontier = vec![root];
        while let Some(parent) = frontier.pop() {
            for child in list_pids(PROC_PPID_ONLY, parent) {
                if child != root && !pids.contains(&child) {
                    pids.push(child);
                    frontier.push(child);
                }
            }
        }
    }
    if let Some(group) = pgid {
        for pid in list_pids(PROC_PGRP_ONLY, group) {
            if pid != root && !pids.contains(&pid) {
                pids.push(pid);
            }
        }
    }
    pids.into_iter().filter_map(live_tuple).collect()
}

/// Add the live descendants of the leader to what the domain has seen.
fn remember_tree(root: &ProcTuple, seen: &mut Vec<ProcTuple>) {
    for tuple in members(root.pid.0, true, None) {
        if !seen.contains(&tuple) {
            seen.push(tuple);
        }
    }
}

/// The state of a `macos-tree` domain: the root is dead, nobody is left in its
/// group, and no process seen in its tree is still alive.
pub(crate) fn tree_state(root: &ProcTuple, seen: &[ProcTuple]) -> DomainState {
    match facts::judge_here(&root.to_record()) {
        Verdict::Alive => return DomainState::NotEmpty,
        Verdict::Unknown => return DomainState::Unknown,
        Verdict::Dead => {}
    }
    if !members(root.pid.0, false, Some(root.pid.0)).is_empty() {
        return DomainState::NotEmpty;
    }
    if seen.iter().any(|tuple| tuple != root && facts::judge_here(&tuple.to_record()) == Verdict::Alive) {
        return DomainState::NotEmpty;
    }
    DomainState::Empty
}

/// Forget what has died: a dead process cannot return, and every poll judges
/// each tuple that is kept.
fn prune_dead(root: &ProcTuple, seen: &mut Vec<ProcTuple>) {
    seen.retain(|tuple| tuple == root || facts::judge_here(&tuple.to_record()) != Verdict::Dead);
}

/// [`tree_state`] from the record alone, as adopt asks it: an empty answer is
/// confirmed by a second scan after [`RESCAN`].
pub(crate) fn tree_state_adopt(root: &ProcTuple) -> DomainState {
    let first = tree_state(root, &[]);
    if first != DomainState::Empty {
        return first;
    }
    std::thread::sleep(RESCAN);
    tree_state(root, &[])
}

/// `killpg` while the root is provably the group's leader, then kill by
/// identity everything seen in the tree or the group, until a pass finds none.
pub(crate) fn tree_kill(root: &ProcTuple, seen: &mut Vec<ProcTuple>, empty_wait: Duration) -> KillOutcome {
    let mut refused = false;
    for _ in 0..10 {
        let root_alive = facts::judge_here(&root.to_record()) == Verdict::Alive;
        if root_alive {
            remember_tree(root, seen);
            let _ = signal_group(root, libc::SIGKILL);
        }
        let mut targets = members(root.pid.0, root_alive, Some(root.pid.0));
        targets.extend(seen.iter().filter(|tuple| *tuple != root).cloned());
        if root_alive {
            targets.push(root.clone());
        }
        let mut live = false;
        for tuple in targets {
            if facts::judge_here(&tuple.to_record()) != Verdict::Alive {
                continue;
            }
            live = true;
            if !seen.contains(&tuple) && tuple != *root {
                seen.push(tuple.clone());
            }
            if !signal_settled(&control::signal_by_identity(&tuple, Signal::Kill)) {
                refused = true;
            }
        }
        if !live && tree_state(root, seen) == DomainState::Empty {
            return KillOutcome::Ok;
        }
        std::thread::sleep(POLL);
    }
    wait_until(empty_wait, || tree_state(root, seen) == DomainState::Empty);
    if !refused && tree_state(root, seen) == DomainState::Empty {
        KillOutcome::Ok
    } else {
        KillOutcome::Refused
    }
}

/// `killpg`, only while the root is the process that was recorded.
fn signal_group(root: &ProcTuple, sig: libc::c_int) -> bool {
    if facts::judge_here(&root.to_record()) != Verdict::Alive {
        return false;
    }
    let Some(pgid) = as_pid_t(root.pid) else {
        return false;
    };
    // SAFETY: killpg with the pgid of a leader just judged alive.
    unsafe { libc::killpg(pgid, sig) == 0 }
}

fn wait_until(limit: Duration, mut done: impl FnMut() -> bool) -> bool {
    let start = Instant::now();
    loop {
        if done() {
            return true;
        }
        if start.elapsed() >= limit {
            return false;
        }
        std::thread::sleep(POLL);
    }
}

fn apply_stdio(cmd: &mut Command, spec: &SpawnSpec) {
    let pick = |file: &Option<File>| file.as_ref().and_then(|f| f.try_clone().ok()).map_or_else(Stdio::null, Stdio::from);
    cmd.env_clear().envs(&spec.env).current_dir(&spec.cwd);
    cmd.stdin(pick(&spec.stdin)).stdout(pick(&spec.stdout)).stderr(pick(&spec.stderr));
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A dead root and a member of the tree that this observer cannot judge (another host's record) is not
    /// an empty domain: nothing proves that member is gone.
    #[test]
    fn tree_state_reports_unknown_when_a_seen_member_cannot_be_judged() {
        let mut child = Command::new("/usr/bin/true").spawn().unwrap();
        let observer = facts::observer();
        let root = ProcTuple { host: observer.host, boot_id: observer.boot_id, pid_ns: observer.pid_ns, pid: ProcId(child.id()), start_time: "0".into() };
        child.wait().unwrap();
        let foreign = ProcTuple { host: "other-host".into(), ..root.clone() };
        assert_eq!(facts::judge_here(&root.to_record()), Verdict::Dead, "the root fixture is gone");
        assert_eq!(facts::judge_here(&foreign.to_record()), Verdict::Unknown, "the fixture member must be one this observer cannot judge");
        assert_eq!(tree_state(&root, &[foreign]), DomainState::Unknown);
    }
}
