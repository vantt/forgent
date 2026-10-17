//! Shared by the gate tests that run on every OS: a real attempt directory, a
//! real envelope with a valid digest, a real gate process (no namespace, no
//! bwrap) and the supervisor's half of the GO handshake. On Windows the gate
//! is started the way the supervisor does it: suspended into the attempt's
//! named job through the containment driver, with a named pipe for GO.
#![allow(dead_code)]

use std::collections::BTreeMap;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::Child;
use std::thread::sleep;
use std::time::{Duration, Instant};

use fgos_run_supervisor::envelope;
use fgos_run_supervisor::go_channel::{read_frame, write_frame};
use serde_json::{json, Value};

pub mod supervisor;

pub trait Channel: Read + Write + Send {}
impl<T: Read + Write + Send> Channel for T {}

const EXE: &str = if cfg!(windows) { ".exe" } else { "" };

pub fn example(name: &str) -> PathBuf {
    let exe = std::env::current_exe().expect("current_exe");
    exe.parent().unwrap().parent().unwrap().join("examples").join(format!("{name}{EXE}"))
}

pub fn harness() -> PathBuf {
    example("gate_harness")
}

pub fn agent_exe() -> String {
    example("gate_agent").to_string_lossy().into_owned()
}

pub fn driver_name() -> &'static str {
    if cfg!(windows) {
        "windows-job"
    } else if cfg!(target_os = "macos") {
        "macos-tree"
    } else {
        "linux-pgroup"
    }
}

pub fn boot_id() -> String {
    fgos_process::facts::boot_id().unwrap_or_else(|| "no-boot-id".into())
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
    pub args: Vec<String>,
    pub ceiling: Option<(String, u64)>,
    pub grace_ms: u64,
}

impl Options {
    pub fn new(args: &[&str]) -> Self {
        Self { args: args.iter().map(|a| a.to_string()).collect(), ceiling: None, grace_ms: 10_000 }
    }
}

pub struct Attempt {
    pub dir: PathBuf,
    pub attempt_id: String,
    pub envelope: PathBuf,
    pub digest: String,
    pub stdout: PathBuf,
    pub stderr: PathBuf,
}

impl Attempt {
    pub fn new(name: &str, options: &Options) -> Self {
        let dir = std::env::temp_dir().join(format!("fgos-gate-portable-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join("protected")).unwrap();
        let attempt_id = format!("att-{name}");
        let (stdout, stderr) = (dir.join("capture-stdout.log"), dir.join("capture-stderr.log"));
        let side_file = dir.join("protected").join("attempt-secrets.json");
        fs::write(&side_file, json!({"v": 1, "attemptId": attempt_id, "env": {}, "controlEpoch": 1, "controlToken": "t"}).to_string()).unwrap();
        let ceiling = options.ceiling.clone().map(|(boot, ns)| json!({"bootId": boot, "boottimeNs": ns})).unwrap_or(Value::Null);
        let mut env = BTreeMap::new();
        for key in ["PATH", "SystemRoot"] {
            if let Ok(value) = std::env::var(key) {
                env.insert(key.to_string(), value);
            }
        }
        let mut envelope_value = json!({
            "v": 3,
            "attemptId": attempt_id,
            "unitRunId": "unit-1",
            "runDir": dir,
            "mode": "direct",
            "protocolId": 1,
            "hostBin": "host",
            "payloadRoot": dir,
            "cwd": dir,
            "mutation": "read-only",
            "launch": {
                "command": agent_exe(),
                "args": options.args,
                "env": env,
                "stdinPolicy": "null",
                "briefPath": null,
                "outboxDir": dir.join("outbox"),
                "capture": {"stdout": stdout, "stderr": stderr},
            },
            "containment": {"preferred": driver_name()},
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
        Self { dir, attempt_id, envelope: path, digest, stdout, stderr }
    }

    pub fn stop_requested(&self, cause: &str) {
        let body = json!({"v": 1, "attemptId": self.attempt_id, "cause": cause, "at": "2026-10-18T00:00:00.000Z"});
        fs::write(self.dir.join("stop-requested.json"), body.to_string()).unwrap();
    }

    pub fn gate_exit(&self) -> Option<Value> {
        serde_json::from_str(&fs::read_to_string(self.dir.join("gate-exit.json")).ok()?).ok()
    }

    pub fn gate_log(&self) -> String {
        fs::read_to_string(self.dir.join("gate-stdout.log")).unwrap_or_default() + &fs::read_to_string(self.dir.join("gate-stderr.log")).unwrap_or_default()
    }
}

pub struct Gate {
    pub child: Child,
    pub go: Box<dyn Channel>,
    /// Keeps the attempt's job (Windows) open for the life of the gate.
    _domain: Option<Box<dyn std::any::Any>>,
}

#[cfg(unix)]
pub fn start_gate(attempt: &Attempt) -> Gate {
    use std::os::fd::OwnedFd;
    use std::os::unix::net::UnixStream;
    use std::process::{Command, Stdio};

    use fgos_process::control::spawn_with_fds;
    use fgos_process::FdSlot;

    let (mine, theirs) = UnixStream::pair().unwrap();
    let theirs = File::from(OwnedFd::from(theirs));
    let mut cmd = Command::new(harness());
    cmd.args(["--protocol", "1", "--envelope"]).arg(&attempt.envelope).args(["--go-fd", "5"]).current_dir(&attempt.dir);
    cmd.stdin(Stdio::null()).stdout(File::create(attempt.dir.join("gate-stdout.log")).unwrap()).stderr(File::create(attempt.dir.join("gate-stderr.log")).unwrap());
    let child = spawn_with_fds(cmd, &[(FdSlot(5), &theirs)]).expect("spawn gate");
    Gate { child, go: Box::new(mine), _domain: None }
}

#[cfg(windows)]
pub fn start_gate(attempt: &Attempt) -> Gate {
    use fgos_process::containment::{select, ContainmentDomain, SelectEnv, SpawnSpec, StartMode, WindowsJobDriver};
    use fgos_run_supervisor::go_pipe;

    let driver = select(&SelectEnv::default()).expect("select");
    assert_eq!(driver.name(), "windows-job");
    let mut domain: ContainmentDomain = driver.create(&attempt.attempt_id).expect("create job");
    let job = WindowsJobDriver::job_name(&domain).unwrap().to_string();
    let pipe = format!(r"\\.\pipe\fgos-gate-go-{}-{}", attempt.attempt_id, std::process::id());
    let server = go_pipe::listen(&pipe).expect("listen");
    let argv: Vec<String> = [harness().to_string_lossy().into_owned(), "--protocol".into(), "1".into(), "--envelope".into(), attempt.envelope.to_string_lossy().into_owned(), "--go-socket".into(), pipe, "--job-name".into(), job].into();
    let env: BTreeMap<String, String> = ["PATH", "SystemRoot"].iter().filter_map(|k| std::env::var(k).ok().map(|v| (k.to_string(), v))).collect();
    let spec = SpawnSpec {
        argv,
        bwrap_prefix: None,
        fd_map: vec![],
        env,
        cwd: attempt.dir.clone(),
        stdin: None,
        stdout: Some(File::create(attempt.dir.join("gate-stdout.log")).unwrap()),
        stderr: Some(File::create(attempt.dir.join("gate-stderr.log")).unwrap()),
        mode: StartMode::Direct,
    };
    let spawned = driver.spawn_in(&mut domain, spec).expect("spawn gate");
    // The gate connects on its own; a gate that fails first never does, so the accept is bounded.
    let (tx, rx) = std::sync::mpsc::channel();
    std::thread::spawn(move || {
        let _ = tx.send(server.accept());
    });
    let go = rx.recv_timeout(Duration::from_secs(30)).expect("the gate never connected to the GO pipe").expect("accept");
    Gate { child: spawned.child, go: Box::new(go), _domain: Some(Box::new(domain)) }
}

/// Ask the gate to stop the way the supervisor does: the file first, then, where
/// the platform has one, the signal.
pub fn request_stop(gate: &Gate, attempt: &Attempt, cause: &str) {
    attempt.stop_requested(cause);
    #[cfg(unix)]
    // SAFETY: SIGTERM to the gate process this test started.
    unsafe {
        libc::kill(gate.child.id() as libc::pid_t, libc::SIGTERM);
    }
    #[cfg(windows)]
    let _ = gate;
}

pub fn read_hello(gate: &mut Gate) -> Value {
    let hello = read_frame(&mut gate.go).expect("HELLO");
    assert_eq!(hello["type"], "HELLO");
    hello
}

pub fn send_go(gate: &mut Gate, attempt_id: &str, digest: &str) {
    write_frame(&mut gate.go, &json!({"type": "GO", "attemptId": attempt_id, "envelopeDigest": digest, "gateHostTuple": null})).unwrap();
}

/// HELLO, correct GO, then the AGENT frame.
pub fn start_agent(gate: &mut Gate, attempt: &Attempt) -> Value {
    read_hello(gate);
    send_go(gate, &attempt.attempt_id, &attempt.digest);
    let agent = read_frame(&mut gate.go).expect("AGENT");
    assert_eq!(agent["type"], "AGENT");
    agent
}

/// The exit code of the gate, waiting at most `limit`.
pub fn wait_exit(gate: &mut Gate, attempt: &Attempt, limit: Duration) -> i32 {
    let start = Instant::now();
    loop {
        if let Some(status) = gate.child.try_wait().unwrap() {
            return status.code().unwrap_or(-1);
        }
        assert!(start.elapsed() < limit, "gate did not exit; its output:\n{}", attempt.gate_log());
        sleep(Duration::from_millis(10));
    }
}

#[cfg(unix)]
pub fn alive(pid: u32) -> bool {
    #[cfg(target_os = "linux")]
    {
        match fs::read_to_string(format!("/proc/{pid}/stat")) {
            Ok(stat) => stat.rfind(')').and_then(|i| stat[i + 1..].trim_start().chars().next()).is_some_and(|s| s != 'Z' && s != 'X'),
            Err(_) => false,
        }
    }
    #[cfg(not(target_os = "linux"))]
    {
        // SAFETY: signal 0 only probes the pid.
        unsafe { libc::kill(pid as libc::pid_t, 0) == 0 }
    }
}

#[cfg(windows)]
pub fn alive(pid: u32) -> bool {
    use windows_sys::Win32::Foundation::CloseHandle;
    use windows_sys::Win32::System::Threading::{GetExitCodeProcess, OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION};
    const STILL_ACTIVE: u32 = 259;
    // SAFETY: a query-only handle to a pid, closed before returning.
    unsafe {
        let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
        if handle.is_null() {
            return false;
        }
        let mut code = 0u32;
        let ok = GetExitCodeProcess(handle, &mut code);
        CloseHandle(handle);
        ok != 0 && code == STILL_ACTIVE
    }
}

/// Wait until `pid` is gone; an orphan is reaped by another process, so it may take a moment.
pub fn wait_dead(pid: u32, limit: Duration) -> bool {
    let start = Instant::now();
    while alive(pid) {
        if start.elapsed() >= limit {
            return false;
        }
        sleep(Duration::from_millis(20));
    }
    true
}

pub fn pid_in(path: &Path) -> u32 {
    wait_for(path, Duration::from_secs(10)).trim().parse().expect("pid")
}
