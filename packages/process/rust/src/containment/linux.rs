//! Linux drivers: `bwrap-pidns` (bwrap pid namespace, gate as pid 1, domain
//! `linux-gate`) and `linux-pgroup` (best-effort, domain `linux-pgroup`).

use std::collections::{BTreeSet, HashMap};
use std::fs::{self, File};
use std::io::{self, Read};
use std::os::fd::{AsRawFd, FromRawFd};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

use super::{ContainmentDomain, ContainmentDriver, ContainmentError, Guarantee, GuaranteeLevel, SelectEnv, SpawnSpec, Spawned, StartMode};
use crate::control::{self, Signal};
use crate::facts::{self, ProcTuple, Verdict};
use crate::{signal_settled, Domain, DomainState, FdSlot, KillOutcome, ProcId};

/// Where bwrap is looked for when nothing names it.
const BWRAP_LOCATIONS: [&str; 3] = ["/usr/bin/bwrap", "/bin/bwrap", "/usr/local/bin/bwrap"];
/// The longest wait for bwrap to report the gate's pid.
const INFO_TIMEOUT: Duration = Duration::from_secs(10);
const POLL: Duration = Duration::from_millis(10);
/// How long `kill_all` waits for the domain to be provably empty.
const EMPTY_WAIT: Duration = Duration::from_secs(5);

/// The driver for this machine: `bwrap-pidns` when bwrap can make a pid
/// namespace, else `linux-pgroup`.
pub(crate) fn select(env: &SelectEnv) -> Box<dyn ContainmentDriver> {
    if let Some(bwrap) = bwrap_path(env) {
        if pidns_usable(&bwrap) {
            return Box::new(BwrapPidns { bwrap });
        }
    }
    Box::new(LinuxPgroup)
}

fn bwrap_path(env: &SelectEnv) -> Option<PathBuf> {
    match &env.bwrap {
        Some(path) => (path.is_absolute() && path.is_file()).then(|| path.clone()),
        None => BWRAP_LOCATIONS.iter().map(PathBuf::from).find(|path| path.is_file()),
    }
}

/// Can `bwrap` make a user plus pid namespace here? Probed once per process
/// and path by running a real command in one.
fn pidns_usable(bwrap: &Path) -> bool {
    static PROBED: OnceLock<Mutex<HashMap<PathBuf, bool>>> = OnceLock::new();
    let cache = PROBED.get_or_init(|| Mutex::new(HashMap::new()));
    if let Some(known) = cache.lock().ok().and_then(|map| map.get(bwrap).copied()) {
        return known;
    }
    let usable = Command::new(bwrap)
        .args(["--unshare-user", "--unshare-pid", "--as-pid-1", "--dev-bind", "/", "/", "--proc", "/proc", "--", "/bin/true"])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .map(|status| status.success())
        .unwrap_or(false);
    if let Ok(mut map) = cache.lock() {
        map.insert(bwrap.to_path_buf(), usable);
    }
    usable
}

/// `bwrap-pidns`: the gate is pid 1 of a fresh pid namespace, so the domain is
/// empty exactly when the gate is dead.
pub struct BwrapPidns {
    bwrap: PathBuf,
}

impl BwrapPidns {
    /// The driver for the bwrap at `bwrap` (an absolute path), without probing.
    pub fn new(bwrap: PathBuf) -> Self {
        Self { bwrap }
    }

    fn prefix(&self, spec: &SpawnSpec) -> Result<Vec<String>, ContainmentError> {
        let terminal = spec.mode == StartMode::Terminal;
        let Some(given) = &spec.bwrap_prefix else {
            let mut prefix = vec![self.bwrap.to_string_lossy().into_owned()];
            prefix.extend(["--unshare-pid", "--as-pid-1", "--dev-bind", "/", "/", "--proc", "/proc"].map(String::from));
            if terminal {
                prefix.push("--die-with-parent".to_string());
            }
            return Ok(prefix);
        };
        // The confinement's argv is attested by digest: check it, never edit it.
        if !given.first().is_some_and(|program| Path::new(program).is_absolute()) {
            return Err(ContainmentError::InvalidPrefix("bwrap-program-not-absolute"));
        }
        let has = |flag: &str| given.iter().any(|arg| arg == flag);
        if !has("--unshare-pid") {
            return Err(ContainmentError::InvalidPrefix("missing-unshare-pid"));
        }
        if !has("--as-pid-1") {
            return Err(ContainmentError::InvalidPrefix("missing-as-pid-1"));
        }
        if !given.windows(2).any(|pair| pair[0] == "--proc" && pair[1] == "/proc") {
            return Err(ContainmentError::InvalidPrefix("missing-proc-mount"));
        }
        if has("--info-fd") {
            return Err(ContainmentError::InvalidPrefix("info-fd-reserved"));
        }
        match (has("--die-with-parent"), terminal) {
            (true, false) => Err(ContainmentError::InvalidPrefix("die-with-parent-in-direct")),
            (false, true) => Err(ContainmentError::InvalidPrefix("die-with-parent-missing-in-terminal")),
            _ => Ok(given.clone()),
        }
    }
}

impl ContainmentDriver for BwrapPidns {
    fn name(&self) -> &'static str {
        "bwrap-pidns"
    }

    fn create(&self, attempt_id: &str) -> Result<ContainmentDomain, ContainmentError> {
        Ok(ContainmentDomain::new(attempt_id))
    }

    fn spawn_in(&self, domain: &mut ContainmentDomain, spec: SpawnSpec) -> Result<Spawned, ContainmentError> {
        let prefix = self.prefix(&spec)?;
        if spec.argv.is_empty() {
            return Err(ContainmentError::SpawnFailed("empty gate command".into()));
        }
        // bwrap reports the gate's host pid on this pipe once the namespace stands.
        let (read_end, write_end) = cloexec_pipe()?;
        let info_slot = spec.fd_map.iter().map(|(slot, _)| slot.0 + 1).max().unwrap_or(3).max(3);
        let mut cmd = Command::new(&prefix[0]);
        cmd.args(&prefix[1..]).arg("--info-fd").arg(info_slot.to_string()).arg("--").args(&spec.argv);
        let mut mapped: Vec<(FdSlot, &File)> = spec.fd_map.iter().map(|(slot, file)| (*slot, file)).collect();
        mapped.push((FdSlot(info_slot), &write_end));
        apply_stdio(&mut cmd, &spec);
        let mut child = control::spawn_with_fds(cmd, &mapped).map_err(|err| ContainmentError::SpawnFailed(err.to_string()))?;
        drop(write_end);

        let gate_pid = match read_child_pid(read_end) {
            Ok(pid) => pid,
            Err(why) => {
                let _ = child.kill();
                let _ = child.wait();
                return Err(ContainmentError::NamespaceUnavailable(why));
            }
        };
        let Some(root) = tuple_of(ProcId(gate_pid)) else {
            let _ = child.kill();
            let _ = child.wait();
            return Err(ContainmentError::SpawnFailed("gate left before its identity was read".into()));
        };
        domain.set_domain(Domain::LinuxGate(root.clone()));
        Ok(Spawned { child, root })
    }

    fn is_empty(&self, domain: &mut ContainmentDomain) -> DomainState {
        match domain.domain() {
            Some(record @ Domain::LinuxGate(_)) => crate::domain_is_empty(record),
            _ => DomainState::Unknown,
        }
    }

    fn kill_all(&self, domain: &mut ContainmentDomain, grace_ms: u64) -> KillOutcome {
        let Some(Domain::LinuxGate(gate)) = domain.domain().cloned() else {
            return KillOutcome::Refused;
        };
        if grace_ms > 0 && signal_settled(&control::signal_by_identity(&gate, Signal::Term)) {
            wait_until(Duration::from_millis(grace_ms), || facts::judge_here(&gate.to_record()) == Verdict::Dead);
        }
        if !signal_settled(&control::signal_by_identity(&gate, Signal::Kill)) {
            return KillOutcome::Refused;
        }
        if wait_until(EMPTY_WAIT, || facts::judge_here(&gate.to_record()) == Verdict::Dead) {
            KillOutcome::Ok
        } else {
            KillOutcome::Refused
        }
    }

    fn guarantee(&self) -> Guarantee {
        Guarantee {
            driver: "bwrap-pidns",
            level: GuaranteeLevel::Kernel,
            escapes: vec!["processes created by a daemon outside the namespace on the agent's request (herdr, systemd, docker)"],
        }
    }
}

/// `linux-pgroup`: the gate leads its own session and process group, and the
/// supervisor is the subreaper. Best-effort: a descendant that calls `setsid`
/// and double-forks leaves both the group and the scanned tree.
pub struct LinuxPgroup;

impl ContainmentDriver for LinuxPgroup {
    fn name(&self) -> &'static str {
        "linux-pgroup"
    }

    fn create(&self, attempt_id: &str) -> Result<ContainmentDomain, ContainmentError> {
        Ok(ContainmentDomain::new(attempt_id))
    }

    fn spawn_in(&self, domain: &mut ContainmentDomain, spec: SpawnSpec) -> Result<Spawned, ContainmentError> {
        use std::os::unix::process::CommandExt;
        let Some((program, args)) = spec.argv.split_first() else {
            return Err(ContainmentError::SpawnFailed("empty gate command".into()));
        };
        become_subreaper()?;
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
        let Some(root) = tuple_of(ProcId(child.id())) else {
            let _ = child.kill();
            let _ = child.wait();
            return Err(ContainmentError::SpawnFailed("gate left before its identity was read".into()));
        };
        domain.seen.push(root.clone());
        domain.set_domain(Domain::LinuxPgroup(root.clone()));
        Ok(Spawned { child, root })
    }

    fn is_empty(&self, domain: &mut ContainmentDomain) -> DomainState {
        let Some(Domain::LinuxPgroup(leader)) = domain.domain().cloned() else {
            return DomainState::Unknown;
        };
        if facts::judge_here(&leader.to_record()) == Verdict::Alive {
            remember_tree(&leader, &mut domain.seen);
        }
        pgroup_state(&leader, &domain.seen)
    }

    fn kill_all(&self, domain: &mut ContainmentDomain, grace_ms: u64) -> KillOutcome {
        let Some(Domain::LinuxPgroup(leader)) = domain.domain().cloned() else {
            return KillOutcome::Refused;
        };
        if grace_ms > 0 {
            // Snapshot first: a gate that ends on SIGTERM takes the tree links with it.
            remember_tree(&leader, &mut domain.seen);
            let _ = signal_group(&leader, libc::SIGTERM);
            wait_until(Duration::from_millis(grace_ms), || pgroup_state(&leader, &domain.seen) == DomainState::Empty);
        }
        pgroup_kill(&leader, &mut domain.seen)
    }

    fn guarantee(&self) -> Guarantee {
        Guarantee {
            driver: "linux-pgroup",
            level: GuaranteeLevel::BestEffort,
            escapes: vec!["setsid descendants leave the process group", "daemons outside the domain"],
        }
    }
}

/// One row of `/proc/<pid>/stat`.
struct StatRow {
    pid: u32,
    state: char,
    ppid: u32,
    pgrp: u32,
    start_time: String,
}

fn read_stat(pid: u32) -> Option<StatRow> {
    let line = fs::read_to_string(format!("/proc/{pid}/stat")).ok()?;
    let rest = &line[line.rfind(')')? + 1..];
    let fields: Vec<&str> = rest.split_whitespace().collect();
    Some(StatRow {
        pid,
        state: fields.first()?.chars().next()?,
        ppid: fields.get(1)?.parse().ok()?,
        pgrp: fields.get(2)?.parse().ok()?,
        start_time: (*fields.get(19)?).to_string(),
    })
}

/// Every process in the table that is not a zombie.
fn live_rows() -> Vec<StatRow> {
    let Ok(entries) = fs::read_dir("/proc") else {
        return Vec::new();
    };
    entries
        .filter_map(|entry| entry.ok())
        .filter_map(|entry| entry.file_name().to_str().and_then(|name| name.parse::<u32>().ok()))
        .filter_map(read_stat)
        .filter(|row| row.state != 'Z' && row.state != 'X')
        .collect()
}

/// The identity of `pid`, a zombie included: a gate that already ended still
/// has the start time its record needs.
fn tuple_of(pid: ProcId) -> Option<ProcTuple> {
    let row = read_stat(pid.0)?;
    let observer = facts::observer();
    Some(ProcTuple { host: observer.host, boot_id: observer.boot_id, pid_ns: observer.pid_ns, pid, start_time: row.start_time })
}

fn tuple_of_row(row: &StatRow) -> Option<ProcTuple> {
    tuple_of(ProcId(row.pid)).filter(|tuple| tuple.start_time == row.start_time)
}

/// Every live descendant of `root` by parent links, and every live process in
/// the group `pgid` (when `pgid` is given). The tree is walked only while
/// `root` is still the recorded leader: a dead leader's pid may name anyone.
fn members(root: u32, walk_tree: bool, pgid: Option<u32>) -> Vec<StatRow> {
    let rows = live_rows();
    let mut tree: BTreeSet<u32> = BTreeSet::new();
    let mut frontier = if walk_tree { vec![root] } else { Vec::new() };
    while let Some(parent) = frontier.pop() {
        for row in rows.iter().filter(|row| row.ppid == parent) {
            if tree.insert(row.pid) {
                frontier.push(row.pid);
            }
        }
    }
    rows.into_iter()
        .filter(|row| row.pid != root && (tree.contains(&row.pid) || pgid.is_some_and(|pg| row.pgrp == pg)))
        .collect()
}

/// Add the live descendants of the leader to what the domain has seen.
fn remember_tree(leader: &ProcTuple, seen: &mut Vec<ProcTuple>) {
    for row in members(leader.pid.0, true, None) {
        if let Some(tuple) = tuple_of_row(&row) {
            if !seen.contains(&tuple) {
                seen.push(tuple);
            }
        }
    }
}

/// The state of a `linux-pgroup` domain: the leader is dead, nobody is left in
/// its group, and no process seen in its tree is still alive.
pub(crate) fn pgroup_state(leader: &ProcTuple, seen: &[ProcTuple]) -> DomainState {
    match facts::judge_here(&leader.to_record()) {
        Verdict::Alive => return DomainState::NotEmpty,
        Verdict::Unknown => return DomainState::Unknown,
        Verdict::Dead => {}
    }
    if !members(leader.pid.0, false, Some(leader.pid.0)).is_empty() {
        return DomainState::NotEmpty;
    }
    if seen.iter().any(|tuple| tuple != leader && facts::judge_here(&tuple.to_record()) == Verdict::Alive) {
        return DomainState::NotEmpty;
    }
    DomainState::Empty
}

/// `killpg` while the leader is provably the group's leader, then kill by
/// identity everything seen in the tree or the group, until a pass finds none.
pub(crate) fn pgroup_kill(leader: &ProcTuple, seen: &mut Vec<ProcTuple>) -> KillOutcome {
    let mut refused = false;
    for _ in 0..10 {
        let leader_alive = facts::judge_here(&leader.to_record()) == Verdict::Alive;
        if leader_alive {
            remember_tree(leader, seen);
            let _ = signal_group(leader, libc::SIGKILL);
        }
        let mut targets: Vec<ProcTuple> = members(leader.pid.0, leader_alive, Some(leader.pid.0)).iter().filter_map(tuple_of_row).collect();
        targets.extend(seen.iter().filter(|tuple| *tuple != leader).cloned());
        if leader_alive {
            targets.push(leader.clone());
        }
        let mut live = false;
        for tuple in targets {
            if facts::judge_here(&tuple.to_record()) != Verdict::Alive {
                continue;
            }
            live = true;
            if !seen.contains(&tuple) && tuple != *leader {
                seen.push(tuple.clone());
            }
            if !signal_settled(&control::signal_by_identity(&tuple, Signal::Kill)) {
                refused = true;
            }
        }
        if !live && pgroup_state(leader, seen) == DomainState::Empty {
            return KillOutcome::Ok;
        }
        std::thread::sleep(POLL);
    }
    wait_until(EMPTY_WAIT, || pgroup_state(leader, seen) == DomainState::Empty);
    if !refused && pgroup_state(leader, seen) == DomainState::Empty {
        KillOutcome::Ok
    } else {
        KillOutcome::Refused
    }
}

/// `kill(-pgid, sig)`, only while the leader is the process that was recorded.
fn signal_group(leader: &ProcTuple, sig: libc::c_int) -> bool {
    if facts::judge_here(&leader.to_record()) != Verdict::Alive {
        return false;
    }
    let Ok(pgid) = libc::pid_t::try_from(leader.pid.0) else {
        return false;
    };
    // SAFETY: killpg with the pgid of a leader just judged alive.
    unsafe { libc::killpg(pgid, sig) == 0 }
}

fn become_subreaper() -> Result<(), ContainmentError> {
    // SAFETY: prctl with PR_SET_CHILD_SUBREAPER takes one integer argument.
    if unsafe { libc::prctl(libc::PR_SET_CHILD_SUBREAPER, 1 as libc::c_ulong, 0, 0, 0) } != 0 {
        return Err(ContainmentError::Io(io::Error::last_os_error()));
    }
    Ok(())
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

fn cloexec_pipe() -> io::Result<(File, File)> {
    let mut fds = [0 as libc::c_int; 2];
    // SAFETY: pipe2 fills two descriptors on success.
    if unsafe { libc::pipe2(fds.as_mut_ptr(), libc::O_CLOEXEC) } != 0 {
        return Err(io::Error::last_os_error());
    }
    // SAFETY: both descriptors were just created and are owned here.
    Ok(unsafe { (File::from_raw_fd(fds[0]), File::from_raw_fd(fds[1])) })
}

/// Read bwrap's `--info-fd` report until it parses: `{"child-pid": N}`.
fn read_child_pid(mut read_end: File) -> Result<u32, String> {
    let start = Instant::now();
    let mut text = Vec::new();
    loop {
        let left = INFO_TIMEOUT.saturating_sub(start.elapsed());
        if left.is_zero() {
            return Err("bwrap reported no gate pid in time".into());
        }
        let mut pfd = libc::pollfd { fd: read_end.as_raw_fd(), events: libc::POLLIN, revents: 0 };
        // SAFETY: poll on one valid pollfd.
        let ready = unsafe { libc::poll(&mut pfd, 1, left.as_millis().min(i32::MAX as u128) as libc::c_int) };
        if ready < 0 && io::Error::last_os_error().kind() != io::ErrorKind::Interrupted {
            return Err(io::Error::last_os_error().to_string());
        }
        if ready <= 0 {
            continue;
        }
        let mut chunk = [0u8; 256];
        let read = read_end.read(&mut chunk).map_err(|err| err.to_string())?;
        text.extend_from_slice(&chunk[..read]);
        if let Some(pid) = parse_child_pid(&text) {
            return Ok(pid);
        }
        if read == 0 {
            return Err("bwrap ended without reporting a gate pid (user namespaces unavailable?)".into());
        }
    }
}

fn parse_child_pid(text: &[u8]) -> Option<u32> {
    let value: serde_json::Value = serde_json::from_slice(text).ok()?;
    u32::try_from(value.get("child-pid")?.as_u64()?).ok().filter(|pid| *pid > 0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bwrap_report_names_the_gate_pid() {
        assert_eq!(parse_child_pid(br#"{"child-pid": 4242}"#), Some(4242));
        assert_eq!(parse_child_pid(br#"{"child-pid": 42"#), None);
        assert_eq!(parse_child_pid(br#"{"other": 1}"#), None);
    }
}
