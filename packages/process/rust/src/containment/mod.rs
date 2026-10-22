//! Containment port: an OS-neutral process domain per attempt that can be
//! proven empty. Contract: `packages/process/contracts/containment.port.v1.json`.
//! L0: knows nothing about attempts beyond the id that names a domain.

use std::collections::BTreeMap;
use std::fmt;
use std::fs::File;
use std::io;
use std::path::PathBuf;
use std::process::Child;

use crate::facts::ProcTuple;
use crate::{Domain, DomainState, FdSlot, KillOutcome};

#[cfg(target_os = "linux")]
pub(crate) mod linux;
#[cfg(unix)]
mod pgroup;
#[cfg(target_os = "macos")]
pub(crate) mod macos;
#[cfg(windows)]
mod windows;

#[cfg(target_os = "linux")]
pub use linux::{environment_marked, BwrapPidns, LinuxPgroup};
#[cfg(not(target_os = "linux"))]
pub fn environment_marked(_name: &str, _value: &str) -> Vec<u32> {
    Vec::new()
}
#[cfg(target_os = "macos")]
pub use macos::MacosTree;
#[cfg(windows)]
pub use windows::WindowsJobDriver;

/// Environment marker of a watched run: unique per run, inherited by every
/// descendant of the child.
pub const WATCH_ENV: &str = "FGOS_BORROW_WATCH";

/// Unique token for a watched run, inherited by child descendants.
pub fn watch_token() -> String {
    format!(
        "{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_or(0, |d| d.as_nanos())
    )
}
/// How the attempt is started. `Direct` must outlive its supervisor; a
/// `Terminal` attempt dies with the process that spawned it. With bwrap
/// `--as-pid-1`, the gate must call `control::arm_parent_death_signal` before
/// its launch handshake rather than relying on bwrap to preserve the signal.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StartMode {
    Direct,
    Terminal,
}

/// What to start inside a domain.
pub struct SpawnSpec {
    /// The gate command: program and arguments.
    pub argv: Vec<String>,
    /// `bwrap-pidns` only: the confinement's bwrap argv up to (not including)
    /// `--info-fd`, program first. `None` builds the default prefix.
    pub bwrap_prefix: Option<Vec<String>>,
    /// Child slot -> parent file; every other descriptor from 3 up is closed.
    pub fd_map: Vec<(FdSlot, File)>,
    /// The exact environment of the child; nothing is inherited.
    pub env: BTreeMap<String, String>,
    pub cwd: PathBuf,
    /// `None` reads/writes `/dev/null`.
    pub stdin: Option<File>,
    pub stdout: Option<File>,
    pub stderr: Option<File>,
    pub mode: StartMode,
}

/// Reserved Linux gate tombstone: bwrap reported a namespace init which was
/// already reaped. It is never passed to process signalling.
pub(crate) const EXITED_GATE: &str = "exited-before-identity";

/// The root process of a domain, started by `spawn_in`.
pub struct Spawned {
    /// The process the supervisor waits on. For `bwrap-pidns` this is the
    /// bwrap monitor; the gate is `root`.
    pub child: Child,
    /// The gate as the host sees it; a reaped Linux namespace init has
    /// start_time `exited-before-identity` (an empty-domain tombstone).
    pub root: ProcTuple,
}

/// The bound on the wait for an empty domain when nobody set one.
pub const DEFAULT_EMPTY_WAIT: std::time::Duration = std::time::Duration::from_secs(5);

/// A domain being built for one attempt. `domain` is set by `spawn_in`.
#[derive(Debug)]
pub struct ContainmentDomain {
    attempt_id: String,
    domain: Option<Domain>,
    /// Processes of the domain a scan has seen, so a descendant that left the
    /// process tree is still counted while it lives (`linux-pgroup`).
    #[cfg_attr(windows, allow(dead_code))]
    pub(crate) seen: Vec<ProcTuple>,
    /// How long `kill_all` waits for the domain to be provably empty (the supervisor sets it from the
    /// envelope's `killWaitMs`).
    empty_wait: std::time::Duration,
    /// `windows-job`: the job the supervisor holds open for the attempt.
    #[cfg(windows)]
    pub(crate) job: Option<windows::JobHold>,
}

impl ContainmentDomain {
    pub fn new(attempt_id: &str) -> Self {
        Self {
            attempt_id: attempt_id.to_string(),
            domain: None,
            seen: Vec::new(),
            empty_wait: DEFAULT_EMPTY_WAIT,
            #[cfg(windows)]
            job: None,
        }
    }

    pub fn set_empty_wait(&mut self, wait: std::time::Duration) {
        self.empty_wait = wait;
    }

    pub fn empty_wait(&self) -> std::time::Duration {
        self.empty_wait
    }

    pub fn attempt_id(&self) -> &str {
        &self.attempt_id
    }

    /// The domain id, complete once a process was started in it.
    pub fn domain(&self) -> Option<&Domain> {
        self.domain.as_ref()
    }

    pub(crate) fn set_domain(&mut self, domain: Domain) {
        self.domain = Some(domain);
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GuaranteeLevel {
    Kernel,
    BestEffort,
    Unsupported,
}

/// What a driver promises, and the routes around it that doctor reports.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Guarantee {
    pub driver: &'static str,
    pub level: GuaranteeLevel,
    pub escapes: Vec<&'static str>,
    pub selected_because: Option<String>,
}

/// Port errors. `name()` is the stable name the contract and the callers use.
#[derive(Debug)]
pub enum ContainmentError {
    UnsupportedPlatform,
    DriverUnavailable(String),
    /// The command could not be started or its identity could not be read.
    SpawnFailed(String),
    NamespaceUnavailable(String),
    /// The bwrap argv breaks a rule of the driver; the name says which.
    InvalidPrefix(&'static str),
    Io(io::Error),
}

impl ContainmentError {
    pub fn name(&self) -> &'static str {
        match self {
            Self::UnsupportedPlatform => "unsupported-platform",
            Self::DriverUnavailable(_) => "driver-unavailable",
            Self::SpawnFailed(_) => "spawn-failed",
            Self::NamespaceUnavailable(_) => "namespace-unavailable",
            Self::InvalidPrefix(_) => "invalid-bwrap-prefix",
            Self::Io(_) => "io",
        }
    }
}

impl fmt::Display for ContainmentError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::UnsupportedPlatform => write!(f, "unsupported-platform"),
            Self::DriverUnavailable(why) | Self::SpawnFailed(why) | Self::NamespaceUnavailable(why) => write!(f, "{}: {why}", self.name()),
            Self::InvalidPrefix(reason) => write!(f, "invalid-bwrap-prefix: {reason}"),
            Self::Io(err) => write!(f, "io: {err}"),
        }
    }
}

impl std::error::Error for ContainmentError {}

impl From<io::Error> for ContainmentError {
    fn from(err: io::Error) -> Self {
        Self::Io(err)
    }
}

/// Operations every containment driver provides.
pub trait ContainmentDriver: Send + Sync {
    /// The driver name: `bwrap-pidns`, `linux-pgroup`, ...
    fn name(&self) -> &'static str;
    /// A domain with no process yet.
    fn create(&self, attempt_id: &str) -> Result<ContainmentDomain, ContainmentError>;
    /// Start the gate inside the domain; the domain id is complete afterwards.
    fn spawn_in(&self, domain: &mut ContainmentDomain, spec: SpawnSpec) -> Result<Spawned, ContainmentError>;
    /// Whether the domain has no process left. `Unknown` is never empty.
    fn is_empty(&self, domain: &mut ContainmentDomain) -> DomainState;
    /// SIGTERM, then SIGKILL after `grace_ms` (0: SIGKILL at once), then wait
    /// for the domain to be empty.
    fn kill_all(&self, domain: &mut ContainmentDomain, grace_ms: u64) -> KillOutcome;
    fn guarantee(&self) -> Guarantee;
}

/// What driver selection may look at.
#[derive(Debug, Clone, Default)]
pub struct SelectEnv {
    /// Absolute path of `bwrap` from the envelope or the confinement config;
    /// `None` looks in the standard system locations.
    pub bwrap: Option<PathBuf>,
}

/// The best driver this machine can run: Linux tries `bwrap-pidns`
/// (a probe run once per process and path), then `linux-pgroup`; Windows runs
/// `windows-job`; macOS runs `macos-tree`.
pub fn select(env: &SelectEnv) -> Result<Box<dyn ContainmentDriver>, ContainmentError> {
    select_platform(env)
}

#[cfg(target_os = "linux")]
fn select_platform(env: &SelectEnv) -> Result<Box<dyn ContainmentDriver>, ContainmentError> {
    Ok(linux::select(env))
}

#[cfg(target_os = "macos")]
fn select_platform(_env: &SelectEnv) -> Result<Box<dyn ContainmentDriver>, ContainmentError> {
    Ok(Box::new(MacosTree))
}

#[cfg(windows)]
fn select_platform(_env: &SelectEnv) -> Result<Box<dyn ContainmentDriver>, ContainmentError> {
    Ok(Box::new(WindowsJobDriver))
}

#[cfg(not(any(target_os = "linux", target_os = "macos", windows)))]
fn select_platform(_env: &SelectEnv) -> Result<Box<dyn ContainmentDriver>, ContainmentError> {
    Err(ContainmentError::UnsupportedPlatform)
}

/// `linux-pgroup` domain judged from its record alone.
pub(crate) fn pgroup_state(leader: &ProcTuple) -> DomainState {
    #[cfg(target_os = "linux")]
    return linux::pgroup_state(leader, &[]);
    #[cfg(not(target_os = "linux"))]
    {
        let _ = leader;
        DomainState::Unknown
    }
}

/// Wait, within the default empty wait, until `gate` is judged dead.
pub(crate) fn wait_dead(gate: &ProcTuple) {
    #[cfg(target_os = "linux")]
    pgroup::wait_until(DEFAULT_EMPTY_WAIT, || crate::facts::judge_here(&gate.to_record()) == crate::facts::Verdict::Dead);
    #[cfg(not(target_os = "linux"))]
    let _ = gate;
}

/// End a `linux-pgroup` domain judged from its record alone.
pub(crate) fn pgroup_kill(leader: &ProcTuple, within: std::time::Duration) -> KillOutcome {
    #[cfg(target_os = "linux")]
    return linux::pgroup_kill(leader, &mut Vec::new(), within);
    #[cfg(not(target_os = "linux"))]
    {
        let _ = (leader, within);
        KillOutcome::Refused
    }
}

/// `macos-tree` domain judged from its record alone, with the adopt rescan.
pub(crate) fn tree_state(root: &ProcTuple) -> DomainState {
    #[cfg(target_os = "macos")]
    return macos::tree_state_adopt(root);
    #[cfg(not(target_os = "macos"))]
    {
        let _ = root;
        DomainState::Unknown
    }
}

/// End a `macos-tree` domain judged from its record alone.
pub(crate) fn tree_kill(root: &ProcTuple, within: std::time::Duration) -> KillOutcome {
    #[cfg(target_os = "macos")]
    return macos::tree_kill(root, &mut Vec::new(), within);
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (root, within);
        KillOutcome::Refused
    }
}

#[cfg(test)]
mod empty_wait_tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn a_domain_waits_five_seconds_for_emptiness_until_told_otherwise() {
        let mut domain = ContainmentDomain::new("att-wait");
        assert_eq!(domain.empty_wait(), DEFAULT_EMPTY_WAIT);
        domain.set_empty_wait(Duration::from_millis(1_234));
        assert_eq!(domain.empty_wait(), Duration::from_millis(1_234));
    }
}
