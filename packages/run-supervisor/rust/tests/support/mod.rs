//! Shared by the gate tests: a real attempt directory, a real envelope with a
//! valid digest, and the supervisor's half of the GO handshake. Every gate runs
//! as pid 1 of a real bwrap namespace; with no usable bwrap the test prints a
//! named skip and ends.
#![allow(dead_code)]

pub mod supervisor;

use std::collections::BTreeMap;
use std::fs::{self, File};
use std::os::fd::OwnedFd;
use std::os::unix::fs::MetadataExt;
use std::os::unix::net::UnixStream;
use std::path::{Path, PathBuf};
use std::thread::sleep;
use std::time::{Duration, Instant};

use fgos_process::containment::{select, ContainmentDomain, ContainmentDriver, SelectEnv, SpawnSpec, Spawned, StartMode};
use fgos_process::facts::{self, ProcTuple};
use fgos_process::FdSlot;
use fgos_run_supervisor::envelope;
use fgos_run_supervisor::go_channel::{read_frame, write_frame};
use serde_json::{json, Value};

pub fn bwrap_driver(test: &str) -> Option<Box<dyn ContainmentDriver>> {
    let driver = select(&SelectEnv::default()).expect("select");
    if driver.name() == "bwrap-pidns" {
        return Some(driver);
    }
    eprintln!("skip: {test}: no-bwrap-pidns (driver {})", driver.name());
    None
}

pub fn harness() -> PathBuf {
    let exe = std::env::current_exe().expect("current_exe");
    exe.parent().unwrap().parent().unwrap().join("examples").join("gate_harness")
}

pub fn fixture(name: &str) -> String {
    format!("{}/tests/fixtures/{name}", env!("CARGO_MANIFEST_DIR"))
}

pub fn node() -> String {
    for dir in std::env::var("PATH").unwrap_or_default().split(':') {
        let candidate = Path::new(dir).join("node");
        if candidate.is_file() {
            return candidate.to_string_lossy().into_owned();
        }
    }
    panic!("node is not on PATH");
}

pub fn boottime_ns() -> u64 {
    let mut ts = libc::timespec { tv_sec: 0, tv_nsec: 0 };
    #[cfg(target_os = "linux")]
    let clock = libc::CLOCK_BOOTTIME;
    #[cfg(not(target_os = "linux"))]
    let clock = libc::CLOCK_MONOTONIC;
    // SAFETY: clock_gettime writes one timespec.
    unsafe { libc::clock_gettime(clock, &mut ts) };
    ts.tv_sec as u64 * 1_000_000_000 + ts.tv_nsec as u64
}

pub fn wait_for(path: &Path, limit: Duration) -> String {
    let start = Instant::now();
    loop {
        if let Ok(text) = fs::read_to_string(path) {
            if !text.trim().is_empty() {
                return text;
            }
        }
        assert!(start.elapsed() < limit, "{} never written", path.display());
        sleep(Duration::from_millis(10));
    }
}

pub struct Options {
    pub command: String,
    pub args: Vec<String>,
    pub stdin_brief: Option<String>,
    /// `(bootId, boottimeNs)`; `None` omits the hard ceiling.
    pub ceiling: Option<(String, u64)>,
    pub grace_ms: u64,
    pub side_env: BTreeMap<String, String>,
    /// `containment.preferred` of the envelope.
    pub preferred: String,
}

impl Options {
    pub fn new(command: &str, args: &[&str]) -> Self {
        Self {
            command: command.to_string(),
            args: args.iter().map(|a| a.to_string()).collect(),
            stdin_brief: None,
            ceiling: None,
            grace_ms: 10_000,
            side_env: BTreeMap::new(),
            preferred: "linux-gate".into(),
        }
    }
}

pub struct Attempt {
    pub dir: PathBuf,
    pub attempt_id: String,
    pub envelope: PathBuf,
    pub digest: String,
    pub outbox: PathBuf,
    pub stdout: PathBuf,
    pub stderr: PathBuf,
}

/// The directory `Attempt::new(name, ..)` uses, for options built before it.
pub fn attempt_dir(name: &str) -> PathBuf {
    std::env::temp_dir().join(format!("fgos-gate-attempt-{name}-{}", std::process::id()))
}

impl Attempt {
    pub fn new(name: &str, options: &Options) -> Self {
        let dir = attempt_dir(name);
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join("protected")).unwrap();
        let attempt_id = format!("att-{name}");
        let outbox = dir.join("outbox");
        let (stdout, stderr) = (dir.join("capture-stdout.log"), dir.join("capture-stderr.log"));
        let side_file = dir.join("protected/attempt-secrets.json");
        fs::write(&side_file, json!({"v": 1, "attemptId": attempt_id, "env": options.side_env, "controlEpoch": 1, "controlToken": "t"}).to_string()).unwrap();
        let ceiling = options.ceiling.clone().map(|(boot, ns)| json!({"bootId": boot, "boottimeNs": ns})).unwrap_or(Value::Null);
        let mut envelope_value = json!({
            "v": 3,
            "attemptId": attempt_id,
            "unitRunId": "unit-1",
            "runDir": dir,
            "mode": "direct",
            "protocolId": 1,
            "hostBin": "/bin/true",
            "payloadRoot": "/",
            "cwd": dir,
            "mutation": "read-only",
            "launch": {
                "command": options.command,
                "args": options.args,
                "env": {"PATH": "/usr/local/bin:/usr/bin:/bin", "HOME": dir},
                "stdinPolicy": if options.stdin_brief.is_some() { "brief-file" } else { "null" },
                "briefPath": options.stdin_brief,
                "outboxDir": outbox,
                "capture": {"stdout": stdout, "stderr": stderr},
            },
            "containment": {"preferred": options.preferred},
            "deadlines": {
                "softAt": {"bootId": "x", "boottimeNs": null},
                "idleMs": null,
                "hardCeiling": ceiling,
                "gateKillGraceMs": options.grace_ms,
            },
            "agentProtocol": {"cli": "claude", "mode": "direct"},
            "steps": [],
            "sideFile": side_file,
        });
        let digest = envelope::digest(&envelope_value).unwrap();
        envelope_value["digest"] = Value::String(digest.clone());
        let path = dir.join("envelope.json");
        fs::write(&path, serde_json::to_vec(&envelope_value).unwrap()).unwrap();
        Self { dir, attempt_id, envelope: path, digest, outbox, stdout, stderr }
    }

    pub fn stop_requested(&self, cause: &str) {
        let body = json!({"v": 1, "attemptId": self.attempt_id, "cause": cause, "at": "2026-10-18T00:00:00.000Z"});
        fs::write(self.dir.join("stop-requested.json"), body.to_string()).unwrap();
    }

    pub fn gate_exit(&self) -> Option<Value> {
        serde_json::from_str(&fs::read_to_string(self.dir.join("gate-exit.json")).ok()?).ok()
    }
}

pub struct Gate {
    pub spawned: Spawned,
    pub go: UnixStream,
    pub domain: ContainmentDomain,
}

/// Start the gate under bwrap with the lock file at slot 3 and the GO channel
/// at slot 5, as the supervisor does.
pub fn start_gate(driver: &dyn ContainmentDriver, attempt: &Attempt, lock: Option<&File>) -> Gate {
    let (mine, theirs) = UnixStream::pair().unwrap();
    let mut domain = driver.create(&attempt.attempt_id).unwrap();
    let mut argv: Vec<String> = [harness().to_string_lossy().into_owned(), "--protocol".into(), "1".into(), "--envelope".into(), attempt.envelope.to_string_lossy().into_owned(), "--go-fd".into(), "5".into()].into();
    let mut fd_map = vec![(FdSlot(5), File::from(OwnedFd::from(theirs)))];
    if let Some(lock) = lock {
        argv.extend(["--lock-fds".to_string(), "3".to_string()]);
        fd_map.push((FdSlot(3), lock.try_clone().unwrap()));
    }
    let spec = SpawnSpec {
        argv,
        bwrap_prefix: None,
        fd_map,
        env: BTreeMap::from([("PATH".to_string(), "/usr/bin:/bin".to_string())]),
        cwd: attempt.dir.clone(),
        stdin: None,
        stdout: None,
        stderr: None,
        mode: StartMode::Direct,
    };
    let spawned = driver.spawn_in(&mut domain, spec).expect("spawn gate");
    Gate { spawned, go: mine, domain }
}

pub fn send_go(gate: &mut Gate, attempt_id: &str, digest: &str) {
    let hello = read_frame(&mut gate.go).expect("HELLO");
    assert_eq!(hello["type"], "HELLO");
    let tuple = gate.spawned.root.to_record().to_json();
    write_frame(&mut gate.go, &json!({"type": "GO", "attemptId": attempt_id, "envelopeDigest": digest, "gateHostTuple": tuple})).unwrap();
}

/// HELLO, correct GO, then the AGENT frame.
pub fn start_agent(gate: &mut Gate, attempt: &Attempt) -> Value {
    send_go(gate, &attempt.attempt_id, &attempt.digest);
    let agent = read_frame(&mut gate.go).expect("AGENT");
    assert_eq!(agent["type"], "AGENT");
    agent
}

/// Wait for the bwrap monitor (the process the supervisor waits on) to exit.
pub fn wait_exit(spawned: &mut Spawned, limit: Duration) -> i32 {
    let start = Instant::now();
    loop {
        if let Some(status) = spawned.child.try_wait().unwrap() {
            use std::os::unix::process::ExitStatusExt;
            return status.code().unwrap_or_else(|| 128 + status.signal().unwrap_or(0));
        }
        assert!(start.elapsed() < limit, "gate did not exit");
        sleep(Duration::from_millis(10));
    }
}

pub fn pid_ns_of(pid: u32) -> Option<String> {
    fs::read_link(format!("/proc/{pid}/ns/pid")).ok().map(|p| p.to_string_lossy().into_owned())
}

/// `(pid, state)` of every process in the gate's PID namespace, the gate included.
pub fn namespace_members(gate: &ProcTuple) -> Vec<(u32, char)> {
    let Some(ns) = pid_ns_of(gate.pid.0) else { return Vec::new() };
    let mut members = Vec::new();
    for entry in fs::read_dir("/proc").unwrap().flatten() {
        let Some(pid) = entry.file_name().to_str().and_then(|n| n.parse::<u32>().ok()) else { continue };
        if pid_ns_of(pid).as_deref() != Some(ns.as_str()) {
            continue;
        }
        let Ok(stat) = fs::read_to_string(format!("/proc/{pid}/stat")) else { continue };
        let Some(state) = stat.rfind(')').and_then(|i| stat[i + 1..].trim_start().chars().next()) else { continue };
        members.push((pid, state));
    }
    members
}

pub fn alive(pid: u32) -> bool {
    match fs::read_to_string(format!("/proc/{pid}/stat")) {
        Ok(stat) => stat.rfind(')').and_then(|i| stat[i + 1..].trim_start().chars().next()).is_some_and(|s| s != 'Z' && s != 'X'),
        Err(_) => false,
    }
}

pub fn boot_id() -> String {
    facts::boot_id().expect("boot id")
}

/// Does `pid` hold a descriptor on the file `key` names?
pub fn holds_file(pid: u32, key: (u64, u64)) -> bool {
    let Ok(entries) = fs::read_dir(format!("/proc/{pid}/fd")) else { return false };
    entries.flatten().any(|entry| fs::metadata(entry.path()).map(|m| (m.dev(), m.ino())).ok() == Some(key))
}
