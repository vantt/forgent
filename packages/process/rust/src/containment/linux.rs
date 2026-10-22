//! Linux drivers: `bwrap-pidns` (bwrap pid namespace, gate as pid 1, domain
//! `linux-gate`) and `linux-pgroup` (best-effort, domain `linux-pgroup`).

use std::collections::{BTreeSet, HashMap};
use std::fs::{self, File};
use std::io::{self, Read};
use std::os::fd::{AsRawFd, FromRawFd};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

use super::pgroup::{self, apply_stdio, wait_until, ListFn, Members, Unlistable, POLL};
use super::{ContainmentDomain, ContainmentDriver, ContainmentError, Guarantee, GuaranteeLevel, SelectEnv, SpawnSpec, Spawned, StartMode};
use crate::control::{self, Signal};
use crate::facts::{self, ProcTuple, Verdict};
use crate::platform::linux::read_stat;
use crate::{signal_settled, Domain, DomainState, FdSlot, KillOutcome, ProcId};

/// Where bwrap is looked for when nothing names it.
const BWRAP_LOCATIONS: [&str; 3] = ["/usr/bin/bwrap", "/bin/bwrap", "/usr/local/bin/bwrap"];
/// The longest wait for bwrap to report the gate's pid.
const INFO_TIMEOUT: Duration = Duration::from_secs(10);

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
                end_failed_spawn(&mut child);
                return Err(ContainmentError::NamespaceUnavailable(why));
            }
        };
        // --unshare-pid plus --as-pid-1 makes child-pid the namespace
        // init (not the waiting monitor). The monitor can reap it before
        // this read; a missing init proves the entire namespace has ended.
        let root = match tuple_of(ProcId(gate_pid)) {
            Some(root) => root,
            None if matches!(facts::observe(ProcId(gate_pid)), facts::Observed::Absent) => {
                let observer = facts::observer();
                // An explicit tombstone, never a usable process identity.
                // Its nonnumeric start time cannot match a Linux process,
                // including a later reuse of the reported pid.
                ProcTuple {
                    host: observer.host, boot_id: observer.boot_id,
                    pid_ns: observer.pid_ns, pid: ProcId(gate_pid),
                    start_time: super::EXITED_GATE.into(),
                }
            }
            None => {
                end_failed_spawn(&mut child);
                return Err(ContainmentError::SpawnFailed("gate identity unreadable".into()));
            }
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
        if gate.start_time == super::EXITED_GATE {
            return KillOutcome::Ok;
        }
        if grace_ms > 0 && signal_settled(&control::signal_by_identity(&gate, Signal::Term)) {
            wait_until(Duration::from_millis(grace_ms), || facts::judge_here(&gate.to_record()) == Verdict::Dead);
        }
        if !signal_settled(&control::signal_by_identity(&gate, Signal::Kill)) {
            return KillOutcome::Refused;
        }
        if wait_until(domain.empty_wait(), || facts::judge_here(&gate.to_record()) == Verdict::Dead) {
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

/// A spawn that failed after bwrap started: end the whole attempt, not just the
/// monitor. The gate is pid 1 of the namespace and a child of the monitor; in
/// `direct` mode it has no `--die-with-parent`, so killing only the monitor
/// would leave the gate and the agent running with no record of them. Killing
/// the namespace's init (every child of the monitor) takes the namespace down.
fn end_failed_spawn(monitor: &mut Child) {
    for _ in 0..50 {
        let Ok(children) = members(monitor.id(), true, None) else {
            break;
        };
        if children.tuples.is_empty() {
            break;
        }
        for tuple in &children.tuples {
            let _ = control::signal_by_identity(tuple, Signal::Kill);
        }
        std::thread::sleep(POLL);
    }
    let _ = monitor.kill();
    let _ = monitor.wait();
}

/// `linux-pgroup`: the gate leads its own session and process group, and the
/// supervisor is the subreaper (the gate sets it for itself). Best-effort: a descendant that calls `setsid`
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
            pgroup::remember_tree(members, &leader, &mut domain.seen);
        }
        pgroup_state(&leader, &domain.seen)
    }

    fn kill_all(&self, domain: &mut ContainmentDomain, grace_ms: u64) -> KillOutcome {
        let Some(Domain::LinuxPgroup(leader)) = domain.domain().cloned() else {
            return KillOutcome::Refused;
        };
        if grace_ms > 0 {
            // Snapshot first: a gate that ends on SIGTERM takes the tree links with it.
            // Without the snapshot the tree links would be lost before they were recorded.
            if pgroup::remember_tree(members, &leader, &mut domain.seen) {
                let _ = pgroup::signal_group(&leader, libc::SIGTERM);
            }
            wait_until(Duration::from_millis(grace_ms), || pgroup_state(&leader, &domain.seen) == DomainState::Empty);
        }
        let wait = domain.empty_wait();
        pgroup_kill(&leader, &mut domain.seen, wait)
    }

    fn guarantee(&self) -> Guarantee {
        Guarantee {
            driver: "linux-pgroup",
            level: GuaranteeLevel::BestEffort,
            escapes: vec![
                "setsid descendants leave the process group",
                "a group scan made after the leader died can meet a reused pgid",
                "daemons outside the domain",
            ],
        }
    }
}

fn tuple_from(pid: u32, stat: &facts::Stat) -> ProcTuple {
    let observer = facts::observer();
    ProcTuple { host: observer.host, boot_id: observer.boot_id, pid_ns: observer.pid_ns, pid: ProcId(pid), start_time: stat.start_ticks.to_string() }
}

/// The identity of `pid`, a zombie included: a gate that already ended still
/// has the start time its record needs.
fn tuple_of(pid: ProcId) -> Option<ProcTuple> {
    read_stat(pid.0).ok().map(|stat| tuple_from(pid.0, &stat))
}

/// Whether the kernel knows no process with this pid.
fn pid_unknown(pid: u32) -> bool {
    // SAFETY: signal 0 only checks that the pid exists; nothing is sent.
    unsafe { libc::kill(pid as libc::pid_t, 0) != 0 && io::Error::last_os_error().raw_os_error() == Some(libc::ESRCH) }
}

/// Every live descendant of `root` by parent links, and every live process in
/// the group `pgid` (when `pgid` is given). The tree is walked only while
/// `root` is still the recorded leader: a dead leader's pid may name anyone.
/// A process that vanishes mid-listing is gone; one whose `stat` cannot be
/// read is counted, never dropped.
fn members(root: u32, walk_tree: bool, pgid: Option<u32>) -> Result<Members, Unlistable> {
    members_with(root, walk_tree, pgid, read_stat, pid_unknown)
}

fn members_with(
    root: u32,
    walk_tree: bool,
    pgid: Option<u32>,
    read_stat_fn: impl Fn(u32) -> io::Result<facts::Stat>,
    pid_unknown: impl Fn(u32) -> bool,
) -> Result<Members, Unlistable> {
    let mut unreadable = 0;
    let mut rows = Vec::new();
    for entry in fs::read_dir("/proc").map_err(|_| Unlistable)? {
        let Ok(entry) = entry else {
            unreadable += 1;
            continue;
        };
        let Some(pid) = entry.file_name().to_str().and_then(|name| name.parse::<u32>().ok()) else {
            continue;
        };
        match read_stat_fn(pid) {
            Ok(stat) if !stat.is_gone() => rows.push((pid, stat)),
            Ok(_) => {}
            // A process that exits while its `stat` is read answers ESRCH, or
            // a truncated row; either is gone once the kernel no longer knows
            // the pid. A reused pid stays unreadable, never gone.
            Err(err) if err.kind() == io::ErrorKind::NotFound || err.raw_os_error() == Some(libc::ESRCH) => {}
            Err(err) if err.kind() == io::ErrorKind::InvalidData && pid_unknown(pid) => {}
            Err(_) => unreadable += 1,
        }
    }
    let mut tree: BTreeSet<u32> = BTreeSet::new();
    let mut frontier = if walk_tree { vec![root] } else { Vec::new() };
    while let Some(parent) = frontier.pop() {
        for (pid, _) in rows.iter().filter(|(_, stat)| stat.parent == parent) {
            if tree.insert(*pid) {
                frontier.push(*pid);
            }
        }
    }
    let tuples = rows
        .iter()
        .filter(|(pid, stat)| *pid != root && (tree.contains(pid) || pgid.is_some_and(|pg| stat.group == pg)))
        .map(|(pid, stat)| tuple_from(*pid, stat))
        .collect();
    Ok(Members { tuples, unreadable })
}

/// Pids of live processes of this user whose environment carries
/// `name=value`. A descendant inherits its ancestor's environment, so a marker
/// planted in a child's environment still names its descendants after they
/// left the process group, the session or the tree (`setsid`, double fork,
/// reparenting to init), which no group or parent scan can see. Best-effort:
/// a descendant that clears its own environment is not found, and other users'
/// processes are unreadable.
pub fn environment_marked(name: &str, value: &str) -> Vec<u32> {
    let wanted = format!("{name}={value}");
    let Ok(entries) = fs::read_dir("/proc") else {
        return Vec::new();
    };
    let me = std::process::id();
    entries
        .filter_map(|entry| entry.ok())
        .filter_map(|entry| entry.file_name().to_str().and_then(|n| n.parse::<u32>().ok()))
        .filter(|pid| *pid != me)
        .filter(|pid| read_stat(*pid).is_ok_and(|stat| !stat.is_gone()))
        .filter(|pid| {
            fs::read(format!("/proc/{pid}/environ")).is_ok_and(|bytes| bytes.split(|b| *b == 0).any(|entry| entry == wanted.as_bytes()))
        })
        .collect()
}

/// The state of a `linux-pgroup` domain; see [`pgroup::state`].
pub(crate) fn pgroup_state(leader: &ProcTuple, seen: &[ProcTuple]) -> DomainState {
    pgroup::state(members as ListFn, leader, seen)
}

/// Ends a `linux-pgroup` domain; see [`pgroup::kill`].
pub(crate) fn pgroup_kill(leader: &ProcTuple, seen: &mut Vec<ProcTuple>, empty_wait: Duration) -> KillOutcome {
    pgroup::kill(members as ListFn, leader, seen, empty_wait)
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
    fn unreaped_fast_child_keeps_its_identity() {
        let mut child = Command::new("/bin/true").spawn().unwrap();
        assert!(wait_until(Duration::from_secs(5), || matches!(facts::observe(ProcId(child.id())), facts::Observed::Zombie)));
        let tuple = tuple_of(ProcId(child.id())).expect("zombie identity");
        assert!(tuple.start_time.parse::<u64>().is_ok());
        assert_eq!(facts::judge_here(&tuple.to_record()), Verdict::Dead);
        assert!(child.wait().unwrap().success());
    }

    #[test]
    fn reaped_gate_tombstone_stays_empty_even_if_pid_is_live_again() {
        let mut root = tuple_of(ProcId(std::process::id())).unwrap();
        root.start_time = super::super::EXITED_GATE.into();
        let mut domain = ContainmentDomain::new("exited");
        domain.set_domain(Domain::LinuxGate(root));
        let driver = BwrapPidns::new("/usr/bin/bwrap".into());
        assert_eq!(driver.is_empty(&mut domain), DomainState::Empty);
        assert_eq!(driver.kill_all(&mut domain, 100), KillOutcome::Ok);
        assert_eq!(crate::domain_kill_all(domain.domain().unwrap()), KillOutcome::Ok);
    }

    #[test]
    fn environment_marker_finds_a_live_carrier_and_not_its_dead_or_unmarked_neighbours() {
        let value = format!("marker-{}", std::process::id());
        let mut carrier = Command::new("/bin/sleep").arg("30").env("FGOS_TEST_MARK", &value).spawn().unwrap();
        let mut bystander = Command::new("/bin/sleep").arg("30").env("FGOS_TEST_MARK", "other").spawn().unwrap();
        assert!(wait_until(Duration::from_secs(5), || environment_marked("FGOS_TEST_MARK", &value) == vec![carrier.id()]));
        carrier.kill().unwrap();
        carrier.wait().unwrap();
        assert!(environment_marked("FGOS_TEST_MARK", &value).is_empty());
        bystander.kill().unwrap();
        bystander.wait().unwrap();
    }

    /// A dead leader and a member of the tree that this observer cannot judge (another host's record) is
    /// not an empty domain: nothing proves that member is gone.
    #[test]
    fn pgroup_state_reports_unknown_when_a_seen_member_cannot_be_judged() {
        let mut child = Command::new("/bin/true").spawn().unwrap();
        assert!(wait_until(Duration::from_secs(5), || matches!(facts::observe(ProcId(child.id())), facts::Observed::Zombie)));
        let leader = tuple_of(ProcId(child.id())).expect("zombie identity");
        child.wait().unwrap();
        let foreign = ProcTuple { host: "other-host".into(), ..leader.clone() };
        assert_eq!(facts::judge_here(&foreign.to_record()), Verdict::Unknown, "the fixture member must be one this observer cannot judge");
        assert_eq!(pgroup_state(&leader, &[foreign]), DomainState::Unknown);
    }

    #[test]
    fn bwrap_report_names_the_gate_pid() {
        assert_eq!(parse_child_pid(br#"{"child-pid": 4242}"#), Some(4242));
        assert_eq!(parse_child_pid(br#"{"child-pid": 42"#), None);
        assert_eq!(parse_child_pid(br#"{"other": 1}"#), None);
    }

    #[test]
    fn members_treats_stat_esrch_error_as_vanished_process() {
        let esrch = members_with(1, false, None, |_| Err(io::Error::from_raw_os_error(libc::ESRCH)), |_| false).ok().expect("proc listing");
        assert_eq!(esrch.unreadable, 0, "ESRCH: the process vanished mid-read");
        let me = std::process::id();
        let cut = |pid: u32| if pid == me { Err(io::Error::from(io::ErrorKind::InvalidData)) } else { read_stat(pid) };
        let gone = members_with(1, false, None, cut, |pid| pid == me).ok().expect("proc listing");
        assert_eq!(gone.unreadable, 0, "a cut row of a pid the kernel no longer knows is gone");
        let live = members_with(1, false, None, cut, |_| false).ok().expect("proc listing");
        assert_eq!(live.unreadable, 1, "a cut row of a live pid stays unreadable");
    }
}
