//! What `linux-pgroup` and `macos-tree` share: judge and end a process group
//! plus the descendant tree seen from its leader. Each driver supplies only
//! how members are listed ([`ListFn`]): `/proc` rows on Linux,
//! `proc_listpids` on macOS.

use std::fs::File;
use std::time::{Duration, Instant};

use super::{ContainmentError, GateChild, SpawnSpec};
use crate::control::{self, Signal};
use crate::facts::{self, ProcTuple, Verdict};
use crate::platform::as_pid_t;
use crate::mapped::{spawn_mapped, MappedLead, MappedSpawn, MappedStdio};
use crate::{signal_settled, DomainState, FdSlot, KillOutcome, ProcId};

pub(crate) const POLL: Duration = Duration::from_millis(10);

/// The processes a listing found, and how many it met but could not read: a
/// member that cannot be read is neither present nor gone.
pub(crate) struct Members {
    pub tuples: Vec<ProcTuple>,
    pub unreadable: usize,
}

/// The process table could not be listed at all.
pub(crate) struct Unlistable;

/// Live descendants of `root` by parent links (walked only when `walk_tree`:
/// a dead leader's pid may name anyone) and live processes of the group
/// `pgid`, `root` itself excluded.
pub(crate) type ListFn = fn(root: u32, walk_tree: bool, pgid: Option<u32>) -> Result<Members, Unlistable>;

/// Add the live descendants of the leader to what the domain has seen;
/// `false` when they could not be listed.
pub(crate) fn remember_tree(list: ListFn, leader: &ProcTuple, seen: &mut Vec<ProcTuple>) -> bool {
    let Ok(found) = list(leader.pid.0, true, None) else {
        return false;
    };
    for tuple in found.tuples {
        if !seen.contains(&tuple) {
            seen.push(tuple);
        }
    }
    found.unreadable == 0
}

/// The state of a process-group domain: the leader is dead, nobody is left in
/// its group, and no process seen in its tree is still alive. Anything that
/// cannot be judged or read keeps the answer from being `Empty`.
pub(crate) fn state(list: ListFn, leader: &ProcTuple, seen: &[ProcTuple]) -> DomainState {
    match facts::judge_here(&leader.to_record()) {
        Verdict::Alive => return DomainState::NotEmpty,
        Verdict::Unknown => return DomainState::Unknown,
        Verdict::Dead => {}
    }
    let mut unknown = match list(leader.pid.0, false, Some(leader.pid.0)) {
        Ok(found) if !found.tuples.is_empty() => return DomainState::NotEmpty,
        Ok(found) => found.unreadable > 0,
        Err(Unlistable) => true,
    };
    for tuple in seen.iter().filter(|tuple| *tuple != leader) {
        match facts::judge_here(&tuple.to_record()) {
            Verdict::Alive => return DomainState::NotEmpty,
            Verdict::Unknown => unknown = true,
            Verdict::Dead => {}
        }
    }
    if unknown {
        DomainState::Unknown
    } else {
        DomainState::Empty
    }
}

/// `killpg` while the leader is provably the group's leader, then kill by
/// identity everything seen in the tree or the group, until a pass finds none.
pub(crate) fn kill(list: ListFn, leader: &ProcTuple, seen: &mut Vec<ProcTuple>, empty_wait: Duration) -> KillOutcome {
    let mut refused = false;
    for _ in 0..10 {
        let leader_alive = facts::judge_here(&leader.to_record()) == Verdict::Alive;
        if leader_alive {
            refused |= !remember_tree(list, leader, seen);
            let _ = signal_group(leader, libc::SIGKILL);
        }
        let mut targets = match list(leader.pid.0, leader_alive, Some(leader.pid.0)) {
            Ok(found) => {
                refused |= found.unreadable > 0;
                found.tuples
            }
            Err(Unlistable) => {
                refused = true;
                Vec::new()
            }
        };
        targets.extend(seen.iter().filter(|tuple| *tuple != leader).cloned());
        if leader_alive {
            targets.push(leader.clone());
        }
        let mut live = false;
        for tuple in targets {
            match facts::judge_here(&tuple.to_record()) {
                Verdict::Alive => {}
                Verdict::Unknown => {
                    refused = true;
                    continue;
                }
                Verdict::Dead => continue,
            }
            live = true;
            if !seen.contains(&tuple) && tuple != *leader {
                seen.push(tuple.clone());
            }
            if !signal_settled(&control::signal_by_identity(&tuple, Signal::Kill)) {
                refused = true;
            }
        }
        if !live && state(list, leader, seen) == DomainState::Empty {
            return KillOutcome::Ok;
        }
        std::thread::sleep(POLL);
    }
    wait_until(empty_wait, || state(list, leader, seen) == DomainState::Empty);
    if !refused && state(list, leader, seen) == DomainState::Empty {
        KillOutcome::Ok
    } else {
        KillOutcome::Refused
    }
}

/// `kill(-pgid, sig)`, only while the leader is the process that was recorded.
pub(crate) fn signal_group(leader: &ProcTuple, sig: libc::c_int) -> bool {
    if facts::judge_here(&leader.to_record()) != Verdict::Alive {
        return false;
    }
    let Some(pgid) = as_pid_t(leader.pid) else {
        return false;
    };
    // SAFETY: killpg with the pgid of a leader just judged alive.
    unsafe { libc::killpg(pgid, sig) == 0 }
}

pub(crate) fn wait_until(limit: Duration, mut done: impl FnMut() -> bool) -> bool {
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

/// The gate's start request: `argv` (program first), the spec's exact
/// environment, directory and stdio (`/dev/null` where none is given).
pub(crate) fn gate_request<'a>(argv: Vec<String>, spec: &'a SpawnSpec, lead: MappedLead) -> MappedSpawn<'a> {
    let stdio = |file: &'a Option<File>| file.as_ref().map_or(MappedStdio::Null, MappedStdio::File);
    MappedSpawn {
        argv: argv.into_iter().map(Into::into).collect(),
        env: spec.env.iter().map(|(k, v)| (k.into(), v.into())).collect(),
        clear_env: true,
        cwd: Some(spec.cwd.clone()),
        lead,
        stdio: [stdio(&spec.stdin), stdio(&spec.stdout), stdio(&spec.stderr)],
    }
}

/// Start the gate as the leader of its own session and process group with
/// the spec's descriptor map, and read its identity with `identity`.
pub(crate) fn spawn_leader(spec: &SpawnSpec, identity: impl Fn(ProcId) -> Option<ProcTuple>) -> Result<(GateChild, ProcTuple), ContainmentError> {
    if spec.argv.is_empty() {
        return Err(ContainmentError::SpawnFailed("empty gate command".into()));
    }
    let map: Vec<(FdSlot, &File)> = spec.fd_map.iter().map(|(slot, file)| (*slot, file)).collect();
    let mut child = spawn_mapped(&gate_request(spec.argv.clone(), spec, MappedLead::Session), &map).map_err(|err| ContainmentError::SpawnFailed(err.to_string()))?;
    let Some(root) = identity(ProcId(child.id())) else {
        let _ = child.kill();
        let _ = child.wait();
        return Err(ContainmentError::SpawnFailed("gate left before its identity was read".into()));
    };
    Ok((child, root))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::process::Command;

    /// A leader that is gone (its pid was reaped and its start time never matched).
    fn dead_leader() -> ProcTuple {
        let mut child = Command::new("true").spawn().unwrap();
        let observer = facts::observer();
        let leader = ProcTuple { host: observer.host, boot_id: observer.boot_id, pid_ns: observer.pid_ns, pid: ProcId(child.id()), start_time: "0".into() };
        child.wait().unwrap();
        assert_eq!(facts::judge_here(&leader.to_record()), Verdict::Dead);
        leader
    }

    #[test]
    fn a_candidate_that_cannot_be_read_makes_the_domain_unknown_not_empty() {
        let leader = dead_leader();
        let unreadable: ListFn = |_, _, _| Ok(Members { tuples: Vec::new(), unreadable: 1 });
        let unlistable: ListFn = |_, _, _| Err(Unlistable);
        let clean: ListFn = |_, _, _| Ok(Members { tuples: Vec::new(), unreadable: 0 });
        assert_eq!(state(unreadable, &leader, &[]), DomainState::Unknown);
        assert_eq!(state(unlistable, &leader, &[]), DomainState::Unknown);
        assert_eq!(state(clean, &leader, &[]), DomainState::Empty);
    }

    #[test]
    fn a_kill_that_could_not_read_every_candidate_is_refused() {
        let leader = dead_leader();
        let unreadable: ListFn = |_, _, _| Ok(Members { tuples: Vec::new(), unreadable: 1 });
        assert_eq!(kill(unreadable, &leader, &mut Vec::new(), Duration::from_millis(20)), KillOutcome::Refused);
    }
}
