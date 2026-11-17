//! `fence`: stop whatever process holds a registry lock, so a lock a wedged holder keeps can be taken again.
//!
//! The lock is a kernel lock on an open file description; a holder that dies releases by dying. A fence never
//! takes the lock from a live holder: it lists the holders, signals them by identity (pid plus start time, so a
//! recycled pid is never hit; only through `fgos_process`), and then asks the kernel with a probe whether the lock
//! is free. Holders come from the platform listing; where it cannot list them, `attest_stopped` lets the caller
//! say the holders are already stopped, and the answer is then only a probe, never a signal.
//!
//! A hot mutex (`state`, `porting-events`) is held by the record file `<fgosDir>/locks/<name>.hot` instead: the
//! holder is the process the record names. A record whose holder is provably alive is signalled like any other
//! holder; one that does not parse, or whose holder cannot be judged here, needs `attest_stopped`. The record is
//! then removed under the reclaim lock (`hot_record::clear`).
//!
//! Nothing is signalled unless the caller confirmed (`confirmed`): without it the fence refuses and names the
//! holders it found.

use crate::hot_record::{self, Read};
use crate::scope;
use crate::state_root::lock_root;
use crate::{guarantee, holders, probe, HoldersList, Level, Probe, Resource};
use fgos_process::control::{self, Signal, SignalOutcome};
use fgos_process::facts::{judge_here, ProcTuple, Record, Verdict};
use serde_json::{json, Value};
use std::collections::BTreeMap;
use std::path::{Component, Path, PathBuf};
use std::time::{Duration, Instant};

/// How long holders get to end after SIGTERM.
pub const TERM_WAIT_MS: u64 = 5000;
/// How long the lock gets to read free after the last signal.
pub const KILL_WAIT_MS: u64 = 3000;
const POLL_MS: u64 = 50;

/// One fence call.
#[derive(Debug, Clone)]
pub struct FenceRequest {
    /// Registry lock name.
    pub name: String,
    /// The project's `.fgos`.
    pub fgos_dir: PathBuf,
    /// Values for the lock path's placeholders the verb cannot know (`--param k=v`).
    pub params: BTreeMap<String, String>,
    /// The caller said the holders may be signalled (`--yes`).
    pub confirmed: bool,
    /// The caller says the holders are already stopped (`--attest-stopped`).
    pub attest_stopped: bool,
}

/// What a fence did: `free`, `attested-free` or `fenced`.
#[derive(Debug, Clone, PartialEq)]
pub struct FenceResult {
    pub lock: String,
    pub path: String,
    pub status: &'static str,
    pub holders: Vec<Value>,
    pub terminated: Vec<u32>,
    pub killed: Vec<u32>,
}

impl FenceResult {
    /// The answer's data, in the order the CLI has always printed it.
    pub fn to_json(&self) -> Value {
        json!({
            "lock": self.lock,
            "path": self.path,
            "status": self.status,
            "holders": self.holders,
            "terminated": self.terminated,
            "killed": self.killed,
        })
    }
}

/// Why a fence did not run to the end.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FenceError {
    /// A named refusal; nothing was signalled unless the code says a signal was refused or the lock stayed held.
    /// `listing` names the holders a caller declined to confirm.
    Named {
        code: &'static str,
        message: String,
        listing: Option<String>,
    },
    /// A failure with no name: the system refused something the fence needs.
    Failed(String),
}

impl std::fmt::Display for FenceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Named { code, message, .. } => write!(f, "holder-lock ({code}): {message}"),
            Self::Failed(message) => f.write_str(message),
        }
    }
}

impl std::error::Error for FenceError {}

fn named(code: &'static str, message: String) -> FenceError {
    FenceError::Named {
        code,
        message,
        listing: None,
    }
}

fn quoted(text: &str) -> String {
    serde_json::to_string(text).unwrap_or_else(|_| format!("\"{text}\""))
}

/// `--param key=value` (each use) as a map; the value may itself hold `=`.
pub fn parse_params(items: &[String]) -> Result<BTreeMap<String, String>, FenceError> {
    let mut params = BTreeMap::new();
    for text in items {
        match text.find('=') {
            Some(at) if at > 0 => {
                params.insert(text[..at].to_owned(), text[at + 1..].to_owned());
            }
            _ => {
                return Err(named(
                    "lock-param-invalid",
                    format!("--param wants key=value, got {}", quoted(text)),
                ))
            }
        }
    }
    Ok(params)
}

/// A holder: the pid, the identity a signal is checked against, and the data printed for it.
#[derive(Debug, Clone)]
struct Holder {
    pid: u32,
    record: Record,
    json: Value,
}

impl Holder {
    fn of_tuple(tuple: &ProcTuple) -> Self {
        Self {
            pid: tuple.pid.0,
            record: tuple.to_record(),
            json: json!({
                "pid": tuple.pid.0,
                "startTime": tuple.start_time,
                "host": tuple.host,
                "bootId": tuple.boot_id,
                "pidNs": tuple.pid_ns,
            }),
        }
    }

    /// The holder a hot record names: the record is its own identity, printed whole.
    fn of_record(record: &Value) -> Self {
        let parsed = Record::from_json(record);
        Self {
            pid: parsed.pid.map_or(0, |pid| pid.0),
            record: parsed,
            json: record.clone(),
        }
    }

    fn alive(&self) -> bool {
        judge_here(&self.record) == Verdict::Alive
    }

    fn started(&self) -> String {
        match self.json.get("startTime") {
            Some(Value::String(text)) => text.clone(),
            Some(other) => other.to_string(),
            None => "undefined".to_owned(),
        }
    }
}

/// This process and its ancestors: the pids a fence must not signal (the parent is added where the platform
/// cannot walk the chain).
fn own_pid_chain() -> Vec<u32> {
    let mut chain = vec![std::process::id()];
    #[cfg(unix)]
    chain.push(std::os::unix::process::parent_id());
    chain.extend(control::self_chain());
    let mut seen = Vec::new();
    chain.retain(|pid| {
        let fresh = !seen.contains(pid);
        seen.push(*pid);
        fresh
    });
    chain
}

fn signal_name(signal: Signal) -> &'static str {
    match signal {
        Signal::Term => "term",
        Signal::Kill => "kill",
        Signal::Int => "int",
    }
}

fn outcome_name(outcome: SignalOutcome) -> &'static str {
    match outcome {
        SignalOutcome::Sent => "sent",
        SignalOutcome::NotFound => "not-found",
        SignalOutcome::IdentityMismatch => "identity-mismatch",
        SignalOutcome::IdentityUnknown => "identity-unknown",
        SignalOutcome::Denied => "denied",
        SignalOutcome::Unsupported => "unsupported",
        SignalOutcome::Failed(_) => "failed",
    }
}

/// The refusal of a signal. Holders signalled before it keep the signal they were sent, so the message names them.
fn signal_refused(refused: control::SignalRefused<Holder>) -> FenceError {
    let sent_note = |holders: &[Holder], signal: Signal| {
        if holders.is_empty() {
            String::new()
        } else {
            format!(
                "; already sent {}: pid {}",
                signal_name(signal),
                pids(holders)
            )
        }
    };
    let earlier = sent_note(&refused.already_sent, refused.signal)
        + &sent_note(&refused.already_asked, Signal::Term);
    named(
        "lock-fence-signal-refused",
        format!(
            "pid {} refused {}: {}{earlier}",
            refused.target.pid,
            signal_name(refused.signal),
            outcome_name(refused.outcome)
        ),
    )
}

struct Terminated {
    terminated: Vec<u32>,
    killed: Vec<u32>,
    left: Vec<Holder>,
}

/// SIGTERM, a wait, SIGKILL for what is left (at once for a holder that cannot be asked to stop), a wait.
/// `still_holding(list)` is the subset of `list` that still holds the lock.
fn terminate_holders(
    holders: &[Holder],
    still_holding: &dyn Fn(Vec<Holder>) -> Vec<Holder>,
) -> Result<Terminated, FenceError> {
    let ended = control::terminate_with_grace(
        holders,
        &|holder, signal| control::signal_record(&holder.record, signal),
        still_holding,
        Duration::from_millis(TERM_WAIT_MS),
        Duration::from_millis(KILL_WAIT_MS),
        Duration::from_millis(POLL_MS),
    )
    .map_err(signal_refused)?;
    Ok(Terminated {
        terminated: ended.asked.iter().map(|holder| holder.pid).collect(),
        killed: ended.killed.iter().map(|holder| holder.pid).collect(),
        left: ended.left,
    })
}

fn pids(holders: &[Holder]) -> String {
    holders
        .iter()
        .map(|holder| holder.pid.to_string())
        .collect::<Vec<_>>()
        .join(", ")
}

fn listing(name: &str, holders: &[Holder]) -> String {
    let lines: Vec<String> = holders
        .iter()
        .map(|holder| format!("  pid {} (started {})", holder.pid, holder.started()))
        .collect();
    format!("lock {name} is held by:\n{}\n", lines.join("\n"))
}

fn not_confirmed(name: &str, holders: &[Holder]) -> FenceError {
    let who = holders
        .iter()
        .map(|holder| format!("pid {}", holder.pid))
        .collect::<Vec<_>>()
        .join(", ");
    FenceError::Named {
        code: "lock-fence-not-confirmed",
        message: format!("{name} is held by {who}; nothing was signalled (confirm, or pass --yes)"),
        listing: Some(listing(name, holders)),
    }
}

fn self_refusal(name: &str, own: &[Holder]) -> FenceError {
    named(
        "lock-fence-self",
        format!(
            "{name} is held by this process or one of its parents (pid {}); not fenced",
            pids(own)
        ),
    )
}

/// Fence the holders of the lock `request.name` names.
pub fn fence(request: &FenceRequest) -> Result<FenceResult, FenceError> {
    let name = request.name.as_str();
    let row = scope::entry(name).map_err(|_| {
        named(
            "unknown-lock",
            format!("no lock named {} in the registry", quoted(name)),
        )
    })?;
    if row["kind"] == "hot-mutex" {
        return fence_hot(request);
    }
    let mut params = request.params.clone();
    params
        .entry("fgosDir".to_owned())
        .or_insert_with(|| request.fgos_dir.to_string_lossy().into_owned());
    if row["scope"] == "machine" {
        params
            .entry("lockRoot".to_owned())
            .or_insert_with(|| lock_root().to_string_lossy().into_owned());
    }
    let path = resolve_path(name, row, &params)?;
    let result = |status: &'static str, holders: Vec<Value>, terminated, killed| FenceResult {
        lock: name.to_owned(),
        path: path.to_string_lossy().into_owned(),
        status,
        holders,
        terminated,
        killed,
    };
    // A lock file that does not exist cannot be held; nothing is created to ask.
    if !path.exists() {
        return Ok(result("free", vec![], vec![], vec![]));
    }
    let resource = Resource::new(name, &path);
    let listed = match holders(&resource) {
        Ok(HoldersList::List(tuples)) => Ok(tuples),
        Ok(HoldersList::Unlistable(reason)) => Err(reason),
        Err(err) => Err(format!("cannot open {}: {err}", path.display())),
    };
    let tuples = match listed {
        Err(reason) => {
            if !request.attest_stopped {
                return Err(named(
                    "lock-fence-unlistable",
                    format!("{name}: holders cannot be listed here ({reason}); stop the holder yourself and re-run with --attest-stopped to have the lock checked"),
                ));
            }
            if !probe_free(name, &path)? {
                return Err(named(
                    "lock-fence-still-held",
                    format!("{name} is still held although the holder was attested stopped; it is not taken from a live holder"),
                ));
            }
            return Ok(result("attested-free", vec![], vec![], vec![]));
        }
        Ok(tuples) => tuples,
    };

    if tuples.is_empty() {
        if probe_free(name, &path)? {
            return Ok(result("free", vec![], vec![], vec![]));
        }
        return Err(named(
            "lock-fence-unlistable",
            format!("{name} is held, but no holder is visible to this user (another user's process?); nothing was signalled"),
        ));
    }

    // Each listed holder is a full process identity read by the listing itself, so a signal can only reach the
    // process that held the lock.
    let holders_now: Vec<Holder> = tuples.iter().map(Holder::of_tuple).collect();
    let own = own_pid_chain();
    let selves: Vec<Holder> = holders_now
        .iter()
        .filter(|holder| own.contains(&holder.pid))
        .cloned()
        .collect();
    if !selves.is_empty() {
        return Err(self_refusal(name, &selves));
    }
    if !request.confirmed {
        return Err(not_confirmed(name, &holders_now));
    }

    let still_holding = |list: Vec<Holder>| match holders(&resource) {
        Ok(HoldersList::List(now)) => list
            .into_iter()
            .filter(|holder| now.iter().any(|t| t.pid.0 == holder.pid) && holder.alive())
            .collect(),
        _ => list,
    };
    let ended = terminate_holders(&holders_now, &still_holding)?;

    // The kernel drops a killed holder's lock description a moment after the listing stops showing the holder,
    // so freedom is awaited within the same bounded kill wait rather than read once.
    let free = ended.left.is_empty() && wait_until_free(name, &path, KILL_WAIT_MS)?;
    if !free {
        let who = if ended.left.is_empty() {
            String::new()
        } else {
            format!(" (pid {})", pids(&ended.left))
        };
        return Err(named(
            "lock-fence-still-held",
            format!("{name} is still held after SIGTERM and SIGKILL{who}"),
        ));
    }
    Ok(result(
        "fenced",
        holders_now
            .iter()
            .map(|holder| holder.json.clone())
            .collect(),
        ended.terminated,
        ended.killed,
    ))
}

fn fence_hot(request: &FenceRequest) -> Result<FenceResult, FenceError> {
    let name = request.name.as_str();
    let failed = |err: hot_record::HotRecordError| FenceError::Failed(format!("hot-record: {err}"));
    let record_path = hot_record::paths(&request.fgos_dir, name)
        .map_err(failed)?
        .record;
    let result = |status: &'static str, holders: Vec<Value>, terminated, killed| FenceResult {
        lock: name.to_owned(),
        path: record_path.to_string_lossy().into_owned(),
        status,
        holders,
        terminated,
        killed,
    };
    let seen = hot_record::read_record(&record_path).map_err(failed)?;
    let (record, token) = match &seen {
        Read::Missing => return Ok(result("free", vec![], vec![], vec![])),
        Read::Retry { code } => {
            return Err(named(
                "lock-fence-unlistable",
                format!("{name}: the record at {} is open by another process (sharing violation, {code}); stop that process, then run fgos lock fence {name} again", record_path.display()),
            ))
        }
        Read::Ok { record, token } => (Some(record), token),
        Read::Unreadable { token } => (None, token),
    };

    let verdict = record.map(|record| judge_here(&Record::from_json(record)));
    let (mut holders_now, mut terminated, mut killed) = (Vec::new(), Vec::new(), Vec::new());
    if let (Some(record), Some(Verdict::Alive)) = (record, verdict) {
        // The record is its own tuple: no second read of the process, so a holder that vanished since the judge
        // yields not-found or identity-mismatch from the signal and is never confused with another process.
        let holder = Holder::of_record(record);
        if own_pid_chain().contains(&holder.pid) {
            return Err(self_refusal(name, &[holder]));
        }
        holders_now = vec![holder];
        if !request.confirmed {
            return Err(not_confirmed(name, &holders_now));
        }
        let ended = terminate_holders(&holders_now, &|list| {
            list.into_iter().filter(Holder::alive).collect()
        })?;
        if !ended.left.is_empty() {
            return Err(named(
                "lock-fence-still-held",
                format!(
                    "{name} is still held after SIGTERM and SIGKILL (pid {})",
                    pids(&ended.left)
                ),
            ));
        }
        terminated = ended.terminated;
        killed = ended.killed;
    } else if verdict != Some(Verdict::Dead) && !request.attest_stopped {
        let why = if verdict.is_none() {
            "its record does not parse"
        } else {
            "its holder cannot be judged here"
        };
        return Err(named(
            "lock-fence-unlistable",
            format!("{name}: {why}; stop the holder yourself and re-run with --attest-stopped to remove the record ({})", record_path.display()),
        ));
    }
    if !hot_record::clear(&request.fgos_dir, name, token).map_err(failed)? {
        return Err(named(
            "lock-fence-still-held",
            format!(
                "{name}: the record at {} changed while it was being cleared; nothing was removed",
                record_path.display()
            ),
        ));
    }
    // A dead holder's record is labelled `attested-free` whether or not the caller attested, as the verb has
    // always printed it (the fence tests pin it).
    let status = if holders_now.is_empty() {
        "attested-free"
    } else {
        "fenced"
    };
    Ok(result(
        status,
        holders_now
            .iter()
            .map(|holder| holder.json.clone())
            .collect(),
        terminated,
        killed,
    ))
}

/// Whether the kernel reads the lock free, from a fresh description. A directory whose filesystem gives no
/// exclusion, or a platform without a driver, is a named refusal, never an answer.
fn probe_free(name: &str, path: &Path) -> Result<bool, FenceError> {
    let dir = path.parent().unwrap_or(Path::new("."));
    let guarantee = guarantee(dir);
    let reason = match guarantee.exclusion {
        Level::None => Some(format!(
            "{}: the {} driver gives no exclusion on this filesystem ({})",
            dir.display(),
            guarantee.driver,
            guarantee.notes.join("; ")
        )),
        Level::Unsupported => Some(format!(
            "{}: no holder-lock driver on {} ({})",
            dir.display(),
            guarantee.platform,
            guarantee.notes.join("; ")
        )),
        _ => None,
    };
    if let Some(detail) = reason {
        return Err(named("lock-driver-unavailable", detail));
    }
    match probe(&Resource::new(name, path)) {
        Ok(Probe::Free) => Ok(true),
        Ok(Probe::Held) => Ok(false),
        Err(err) if err.kind() == std::io::ErrorKind::Unsupported => {
            Err(named("lock-driver-unavailable", format!("{name}: {err}")))
        }
        Err(err) => Err(FenceError::Failed(format!(
            "holder-lock-io: probe {}: {err}",
            path.display()
        ))),
    }
}

fn wait_until_free(name: &str, path: &Path, ms: u64) -> Result<bool, FenceError> {
    let deadline = Instant::now() + Duration::from_millis(ms);
    loop {
        if probe_free(name, path)? {
            return Ok(true);
        }
        if Instant::now() >= deadline {
            return Ok(false);
        }
        std::thread::sleep(Duration::from_millis(POLL_MS));
    }
}

/// The registry row's path with every placeholder filled; a placeholder with no value is an error, never a
/// guessed path.
fn resolve_path(
    name: &str,
    row: &Value,
    params: &BTreeMap<String, String>,
) -> Result<PathBuf, FenceError> {
    let Some(template) = row["v3Path"].as_str() else {
        return Err(named(
            "lock-not-node-owned",
            format!(
                "lock {name} has no v3 path for Node (owner {})",
                row["owner"].as_str().unwrap_or("undefined")
            ),
        ));
    };
    let mut filled = String::new();
    let mut rest = template;
    while let Some(open) = rest.find('<') {
        let Some(close) = rest[open..].find('>').map(|n| open + n) else {
            break;
        };
        let key = &rest[open + 1..close];
        if key.is_empty() || key.contains('<') {
            filled.push_str(&rest[..=open]);
            rest = &rest[open + 1..];
            continue;
        }
        let value = if key == "cwdDevIno" {
            params.get("cwd").and_then(|cwd| cwd_dev_ino(cwd))
        } else {
            params.get(key).filter(|value| !value.is_empty()).cloned()
        };
        let Some(value) = value else {
            return Err(named(
                "lock-path-param-missing",
                format!("lock {name} needs {key} to resolve {template}"),
            ));
        };
        filled.push_str(&rest[..open]);
        filled.push_str(&value);
        rest = &rest[close + 1..];
    }
    filled.push_str(rest);
    Ok(normalise(Path::new(&filled)))
}

/// The path with `.`, `..` and repeated separators folded away, without touching the disk.
fn normalise(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for part in path.components() {
        match part {
            Component::CurDir => {}
            Component::ParentDir => {
                if !out.pop() {
                    out.push("..");
                }
            }
            other => out.push(other.as_os_str()),
        }
    }
    out
}

/// `<dev>-<ino>-<birthtimeNs>` of the directory `cwd` names after realpath: one key for every spelling of the
/// same directory. A directory that does not exist has no key.
#[cfg(unix)]
fn cwd_dev_ino(cwd: &str) -> Option<String> {
    use std::os::unix::fs::MetadataExt;
    if cwd.is_empty() {
        return None;
    }
    let meta = std::fs::metadata(std::fs::canonicalize(cwd).ok()?).ok()?;
    let birth = meta
        .created()
        .ok()
        .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|elapsed| elapsed.as_nanos())
        .unwrap_or_else(|| {
            u128::try_from(meta.ctime()).unwrap_or(0) * 1_000_000_000
                + u128::try_from(meta.ctime_nsec()).unwrap_or(0)
        });
    Some(format!("{}-{}-{birth}", meta.dev(), meta.ino()))
}

#[cfg(not(unix))]
fn cwd_dev_ino(_cwd: &str) -> Option<String> {
    None
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;
    use crate::{acquire, Acquire, Mode, Wait, DEFAULT_KILL_WAIT_MS};
    use std::process::{Child, Command, Stdio};

    const HOLD_PATH: &str = "FENCE_TEST_HOLD_PATH";
    const HOLD_IGNORE_TERM: &str = "FENCE_TEST_IGNORE_TERM";
    const HOLD_READY: &str = "FENCE_TEST_READY";

    /// Not a test of its own: the body of the child process the cases below start. It takes the lock the
    /// environment names, says so through a file and holds until killed. Without the variable it does nothing.
    #[test]
    fn holder_child_body() {
        let Ok(path) = std::env::var(HOLD_PATH) else {
            return;
        };
        if std::env::var(HOLD_IGNORE_TERM).is_ok() {
            // SAFETY: SIG_IGN installs no handler code.
            unsafe { libc::signal(libc::SIGTERM, libc::SIG_IGN) };
        }
        let resource = Resource::new("main-checkout", &path);
        let Acquire::Acquired(_handle) =
            acquire(&resource, Mode::Ex, Wait::Ms(0), DEFAULT_KILL_WAIT_MS)
        else {
            std::process::exit(3);
        };
        std::fs::write(std::env::var(HOLD_READY).unwrap(), "held").unwrap();
        loop {
            std::thread::sleep(Duration::from_secs(1));
        }
    }

    struct Fixture {
        dir: PathBuf,
    }

    impl Fixture {
        fn new(label: &str) -> Self {
            let dir = std::env::temp_dir().join(format!(
                "fence-{label}-{}-{}",
                std::process::id(),
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_nanos()
            ));
            std::fs::create_dir_all(dir.join("locks")).unwrap();
            Self { dir }
        }

        fn lock_path(&self) -> PathBuf {
            self.dir.join("locks/main-checkout.lock")
        }

        fn request(&self, name: &str) -> FenceRequest {
            FenceRequest {
                name: name.to_owned(),
                fgos_dir: self.dir.clone(),
                params: BTreeMap::new(),
                confirmed: false,
                attest_stopped: false,
            }
        }

        /// A child process holding `main-checkout` under this fixture; the caller reaps it.
        #[allow(clippy::zombie_processes)]
        fn hold(&self, ignore_term: bool) -> Child {
            let ready = self.dir.join("ready");
            let mut command = Command::new(std::env::current_exe().unwrap());
            command
                .args(["--exact", "fence::tests::holder_child_body", "--nocapture"])
                .env(HOLD_PATH, self.lock_path())
                .env(HOLD_READY, &ready)
                .stdout(Stdio::null())
                .stderr(Stdio::null());
            if ignore_term {
                command.env(HOLD_IGNORE_TERM, "1");
            }
            let child = command.spawn().unwrap();
            for _ in 0..400 {
                if ready.exists() {
                    return child;
                }
                std::thread::sleep(Duration::from_millis(25));
            }
            panic!("the holder child never took the lock");
        }
    }

    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.dir);
        }
    }

    fn alive(child: &mut Child) -> bool {
        child.try_wait().unwrap().is_none()
    }

    fn code(err: FenceError) -> &'static str {
        match err {
            FenceError::Named { code, .. } => code,
            FenceError::Failed(message) => panic!("unnamed failure: {message}"),
        }
    }

    fn hot_record_of(child: &Child) -> String {
        let tuple = fgos_process::facts::identity_of(fgos_process::ProcId(child.id()))
            .expect("a running child has an identity");
        json!({
            "v": 1,
            "pid": tuple.pid.0,
            "startTime": tuple.start_time,
            "bootId": tuple.boot_id,
            "pidNs": tuple.pid_ns,
        })
        .to_string()
    }

    fn sleeper() -> Child {
        Command::new("sleep")
            .arg("60")
            .stdout(Stdio::null())
            .spawn()
            .unwrap()
    }

    #[test]
    fn params_are_key_value_pairs_that_may_carry_an_equals_sign() {
        let items = ["provider=codex", "account=a=b"].map(String::from);
        let parsed = parse_params(&items).unwrap();
        assert_eq!(parsed["provider"], "codex");
        assert_eq!(parsed["account"], "a=b");
        assert!(parse_params(&[]).unwrap().is_empty());
        for bad in ["nokey", "=x", "true"] {
            let err = parse_params(&[bad.to_owned()]).unwrap_err();
            assert_eq!(
                err.to_string(),
                format!("holder-lock (lock-param-invalid): --param wants key=value, got \"{bad}\"")
            );
        }
    }

    #[test]
    fn a_lock_the_registry_does_not_name_is_refused_by_name() {
        let fixture = Fixture::new("unknown");
        let err = fence(&fixture.request("no-such-lock")).unwrap_err();
        assert_eq!(
            err.to_string(),
            "holder-lock (unknown-lock): no lock named \"no-such-lock\" in the registry"
        );
    }

    #[test]
    fn a_lock_with_no_file_or_no_holder_is_free_and_nothing_is_created_or_signalled() {
        let fixture = Fixture::new("free");
        let absent = fence(&fixture.request("main-checkout")).unwrap();
        assert_eq!(absent.status, "free");
        assert!(
            !fixture.lock_path().exists(),
            "a lock file is never created to ask"
        );
        std::fs::write(fixture.lock_path(), "").unwrap();
        let unheld = fence(&fixture.request("main-checkout")).unwrap();
        assert_eq!(
            unheld.to_json(),
            json!({
                "lock": "main-checkout",
                "path": fixture.lock_path().to_string_lossy(),
                "status": "free",
                "holders": [],
                "terminated": [],
                "killed": [],
            })
        );
    }

    #[test]
    fn a_path_the_registry_needs_a_value_for_is_never_guessed() {
        let fixture = Fixture::new("params");
        for (name, key) in [("merge-slot", "ref"), ("event-seal", "eventOpenRoot")] {
            let err = fence(&fixture.request(name)).unwrap_err();
            assert_eq!(
                err.to_string(),
                format!(
                    "holder-lock (lock-path-param-missing): lock {name} needs {key} to resolve {}",
                    scope::entry(name).unwrap()["v3Path"].as_str().unwrap()
                )
            );
        }
        let mut request = fixture.request("merge-slot");
        request.params.insert("ref".into(), "main".into());
        let free = fence(&request).unwrap();
        assert_eq!(
            free.path,
            fixture
                .dir
                .join("locks/merge-slot--main.lock")
                .to_string_lossy()
        );
        let mut request = fixture.request("merge-slot");
        request.params.insert("ref".into(), String::new());
        assert_eq!(
            code(fence(&request).unwrap_err()),
            "lock-path-param-missing"
        );
    }

    #[test]
    fn a_dispatch_cwd_lock_is_keyed_by_the_directory_the_cwd_param_names() {
        let fixture = Fixture::new("cwd");
        let mut request = fixture.request("dispatch-cwd");
        request
            .params
            .insert("cwd".into(), fixture.dir.to_string_lossy().into_owned());
        let result = fence(&request).unwrap();
        let key = cwd_dev_ino(&fixture.dir.to_string_lossy()).unwrap();
        assert!(result
            .path
            .ends_with(&format!("locks/dispatch-cwd--{key}.lock")));
        request
            .params
            .insert("cwd".into(), "/no/such/directory".into());
        assert_eq!(
            code(fence(&request).unwrap_err()),
            "lock-path-param-missing"
        );
    }

    #[test]
    fn a_held_lock_is_listed_and_left_alone_without_confirmation() {
        let fixture = Fixture::new("unconfirmed");
        let mut holder = fixture.hold(false);
        let err = fence(&fixture.request("main-checkout")).unwrap_err();
        let FenceError::Named {
            code,
            message,
            listing,
        } = &err
        else {
            panic!("{err}");
        };
        assert_eq!(*code, "lock-fence-not-confirmed");
        assert_eq!(
            message,
            &format!(
                "main-checkout is held by pid {}; nothing was signalled (confirm, or pass --yes)",
                holder.id()
            )
        );
        let listing = listing.as_deref().unwrap();
        assert!(
            listing.starts_with("lock main-checkout is held by:\n  pid ")
                && listing.contains(&format!("pid {} (started ", holder.id())),
            "{listing}"
        );
        assert!(
            alive(&mut holder),
            "an unconfirmed fence leaves the holder alone"
        );
        holder.kill().unwrap();
        holder.wait().unwrap();
    }

    #[test]
    fn a_confirmed_fence_ends_the_holder_with_sigterm_and_frees_the_lock() {
        let fixture = Fixture::new("term");
        let mut holder = fixture.hold(false);
        let mut request = fixture.request("main-checkout");
        request.confirmed = true;
        let result = fence(&request).unwrap();
        assert_eq!(result.status, "fenced");
        assert_eq!(result.terminated, vec![holder.id()]);
        assert!(result.killed.is_empty());
        assert_eq!(result.holders[0]["pid"], holder.id());
        holder.wait().unwrap();
        assert!(probe_free("main-checkout", &fixture.lock_path()).unwrap());
        assert_eq!(fence(&request).unwrap().status, "free");
    }

    #[test]
    fn a_holder_that_ignores_sigterm_is_killed_after_the_term_wait() {
        let fixture = Fixture::new("kill");
        let mut holder = fixture.hold(true);
        let mut request = fixture.request("main-checkout");
        request.confirmed = true;
        let started = Instant::now();
        let result = fence(&request).unwrap();
        assert_eq!(result.terminated, vec![holder.id()]);
        assert_eq!(result.killed, vec![holder.id()], "SIGKILL ended it");
        assert!(started.elapsed() >= Duration::from_millis(TERM_WAIT_MS));
        holder.wait().unwrap();
        assert!(probe_free("main-checkout", &fixture.lock_path()).unwrap());
    }

    #[test]
    fn a_lock_held_by_this_process_is_never_fenced() {
        let fixture = Fixture::new("self");
        let resource = Resource::new("main-checkout", fixture.lock_path());
        let Acquire::Acquired(handle) =
            acquire(&resource, Mode::Ex, Wait::Ms(0), DEFAULT_KILL_WAIT_MS)
        else {
            panic!("the lock is free");
        };
        let mut request = fixture.request("main-checkout");
        request.confirmed = true;
        let err = fence(&request).unwrap_err();
        assert_eq!(
            err.to_string(),
            format!(
                "holder-lock (lock-fence-self): main-checkout is held by this process or one of its parents (pid {}); not fenced",
                std::process::id()
            )
        );
        crate::release(handle);
    }

    #[test]
    fn a_holder_that_is_already_gone_is_not_waited_on_and_nothing_is_sent() {
        let mut child = sleeper();
        let holder = Holder::of_tuple(
            &fgos_process::facts::identity_of(fgos_process::ProcId(child.id())).unwrap(),
        );
        child.kill().unwrap();
        child.wait().unwrap();
        let started = Instant::now();
        let ended = terminate_holders(&[holder], &|list| {
            list.into_iter().filter(Holder::alive).collect()
        })
        .unwrap();
        assert!(started.elapsed() < Duration::from_secs(1));
        assert!(ended.terminated.is_empty() && ended.killed.is_empty() && ended.left.is_empty());
    }

    #[test]
    fn a_refused_signal_names_the_holders_already_signalled() {
        let mut child = sleeper();
        let first = Holder::of_tuple(
            &fgos_process::facts::identity_of(fgos_process::ProcId(child.id())).unwrap(),
        );
        // A holder from another PID namespace cannot be signalled from here: its identity cannot be checked.
        let mut foreign = first.clone();
        foreign.pid += 1;
        foreign.record.pid_ns = Some("pid:[1]".into());
        foreign.record.pid = Some(fgos_process::ProcId(foreign.pid));
        let err = terminate_holders(&[first.clone(), foreign.clone()], &|list| list)
            .err()
            .expect("the foreign holder refuses the signal");
        assert_eq!(
            err.to_string(),
            format!(
                "holder-lock (lock-fence-signal-refused): pid {} refused term: identity-unknown; already sent term: pid {}",
                foreign.pid, first.pid
            )
        );
        child.wait().unwrap();
    }

    #[test]
    fn a_hot_record_that_is_absent_is_free() {
        let fixture = Fixture::new("hot-free");
        let result = fence(&fixture.request("state")).unwrap();
        assert_eq!(result.status, "free");
        assert_eq!(
            result.path,
            fixture.dir.join("locks/state.hot").to_string_lossy()
        );
    }

    #[test]
    fn a_hot_record_that_does_not_parse_needs_the_attestation_and_is_then_removed() {
        let fixture = Fixture::new("hot-torn");
        let record = fixture.dir.join("locks/state.hot");
        std::fs::write(&record, "{\"v\":1,\"pid\":").unwrap();
        let err = fence(&fixture.request("state")).unwrap_err();
        assert_eq!(code(err.clone()), "lock-fence-unlistable");
        assert!(err.to_string().contains("its record does not parse"));
        assert!(err.to_string().contains("--attest-stopped"));
        assert!(
            record.exists(),
            "nothing is removed without the attestation"
        );
        let mut request = fixture.request("state");
        request.attest_stopped = true;
        assert_eq!(fence(&request).unwrap().status, "attested-free");
        assert!(!record.exists());
    }

    #[test]
    fn a_hot_record_whose_holder_is_dead_is_cleared_without_a_signal() {
        let fixture = Fixture::new("hot-dead");
        let record = fixture.dir.join("locks/state.hot");
        let mut child = sleeper();
        let text = hot_record_of(&child);
        child.kill().unwrap();
        child.wait().unwrap();
        std::fs::write(&record, text).unwrap();
        let started = Instant::now();
        let result = fence(&fixture.request("state")).unwrap();
        assert!(started.elapsed() < Duration::from_secs(1));
        assert_eq!(result.status, "attested-free");
        assert!(result.holders.is_empty() && result.terminated.is_empty());
        assert!(!record.exists());
    }

    #[test]
    fn a_hot_record_whose_holder_is_alive_is_ended_only_once_confirmed() {
        let fixture = Fixture::new("hot-alive");
        let record = fixture.dir.join("locks/state.hot");
        let mut child = sleeper();
        let text = hot_record_of(&child);
        std::fs::write(&record, &text).unwrap();
        let err = fence(&fixture.request("state")).unwrap_err();
        assert_eq!(code(err), "lock-fence-not-confirmed");
        assert!(alive(&mut child) && record.exists());
        let mut request = fixture.request("state");
        request.confirmed = true;
        let result = fence(&request).unwrap();
        assert_eq!(result.status, "fenced");
        assert_eq!(result.terminated, vec![child.id()]);
        assert_eq!(result.holders[0]["pid"], child.id());
        assert_eq!(result.holders[0]["v"], 1, "the whole record is printed");
        child.wait().unwrap();
        assert!(!record.exists());
        assert_eq!(fence(&request).unwrap().status, "free");
    }

    #[test]
    fn a_hot_record_naming_this_process_is_never_fenced() {
        let fixture = Fixture::new("hot-self");
        let tuple =
            fgos_process::facts::identity_of(fgos_process::ProcId(std::process::id())).unwrap();
        std::fs::write(
            fixture.dir.join("locks/state.hot"),
            json!({"v": 1, "pid": tuple.pid.0, "startTime": tuple.start_time, "bootId": tuple.boot_id, "pidNs": tuple.pid_ns}).to_string(),
        )
        .unwrap();
        let mut request = fixture.request("state");
        request.confirmed = true;
        assert_eq!(code(fence(&request).unwrap_err()), "lock-fence-self");
    }

    #[test]
    fn a_hot_record_whose_holder_cannot_be_judged_here_needs_the_attestation() {
        let fixture = Fixture::new("hot-unjudged");
        let record = fixture.dir.join("locks/state.hot");
        std::fs::write(
            &record,
            json!({"v": 1, "pid": 4_000_000, "startTime": "1", "bootId": "elsewhere", "pidNs": "pid:[1]", "host": "other-host"})
                .to_string(),
        )
        .unwrap();
        let err = fence(&fixture.request("state")).unwrap_err();
        assert!(
            err.to_string().contains("its holder cannot be judged here"),
            "{err}"
        );
        assert!(record.exists());
    }
}
