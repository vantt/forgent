//! A real attempt for the supervisor tests that run on every OS: the
//! controller's half of the hand-over (envelope, and on Unix the attempt lock
//! as an inherited description) and the supervisor started the way the host
//! starts it. The agent and the steps are `examples/gate_agent`: a plain
//! executable, no shell and no Node.
#![allow(dead_code)]

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::thread::sleep;
use std::time::{Duration, Instant};

use fgos_holder_lock::{probe, Probe, Resource};
use fgos_run_supervisor::envelope;
use fgos_run_supervisor::gate::boottime_ns;
use serde_json::{json, Value};

use super::{agent_exe, boot_id, driver_name, example};

pub fn internal_harness() -> PathBuf {
    example("internal_harness")
}

pub fn base_env() -> BTreeMap<String, String> {
    ["PATH", "SystemRoot"].iter().filter_map(|k| std::env::var(k).ok().map(|v| (k.to_string(), v))).collect()
}

pub struct Opts {
    pub agent_args: Vec<String>,
    /// Soft deadline, milliseconds from now.
    pub soft_ms: Option<u64>,
    pub steps: Vec<Value>,
    pub host_bin: Option<String>,
    pub grace_ms: u64,
    /// A mutating attempt: it also holds the dispatch-cwd lease.
    pub mutating: bool,
}

impl Opts {
    pub fn agent(args: &[&str]) -> Self {
        Self { agent_args: args.iter().map(|a| a.to_string()).collect(), soft_ms: None, steps: Vec::new(), host_bin: None, grace_ms: 3_000, mutating: false }
    }
}

/// One post-receipt step run by the agent binary.
pub fn step(dir: &Path, step_id: &str, args: &[&str], timeout_ms: u64) -> Value {
    json!({
        "stepId": step_id,
        "hostBin": agent_exe(),
        "payloadRoot": dir,
        "argv": args,
        "cwd": dir,
        "env": base_env(),
        "stepTimeoutMs": timeout_ms,
    })
}

/// The run directory of the test `name`: known before the run exists, so the
/// agent's and the steps' arguments can name files in it.
pub fn dir_of(name: &str) -> PathBuf {
    std::env::temp_dir().join(format!("fgos-sup-portable-{name}-{}", std::process::id()))
}

/// A path in the run directory of `name`, as the text an argument carries.
pub fn arg_path(name: &str, file: &str) -> String {
    dir_of(name).join(file).to_string_lossy().into_owned()
}

pub struct Run {
    pub dir: PathBuf,
    pub attempt_id: String,
    pub envelope: PathBuf,
    pub lock_path: PathBuf,
    pub lease_path: PathBuf,
    #[cfg(unix)]
    lock: Option<fs::File>,
    #[cfg(unix)]
    lease: Option<fs::File>,
}

impl Run {
    pub fn new(name: &str, opts: &Opts) -> Self {
        let dir = dir_of(name);
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join("protected")).unwrap();
        let attempt_id = format!("att-sup-{name}");
        let (stdout, stderr) = (dir.join("capture-stdout.log"), dir.join("capture-stderr.log"));
        let side_file = dir.join("protected").join("attempt-secrets.json");
        fs::write(&side_file, json!({"v": 1, "attemptId": attempt_id, "env": {}, "controlEpoch": 1, "controlToken": "t"}).to_string()).unwrap();
        let soft = opts.soft_ms.map(|ms| boottime_ns() + ms * 1_000_000);
        let host_bin = opts.host_bin.clone().unwrap_or_else(|| internal_harness().to_string_lossy().into_owned());
        let lease_path = dir.join("cwd.lease");
        let mut value = json!({
            "v": 3,
            "attemptId": attempt_id,
            "createdAt": {"bootId": boot_id(), "boottimeNs": boottime_ns()},
            "unitRunId": "unit-1",
            "runDir": dir,
            "mode": "direct",
            "protocolId": 1,
            "hostBin": host_bin,
            "payloadRoot": dir,
            "cwd": dir,
            "mutation": if opts.mutating { "mutating" } else { "read-only" },
            "launch": {
                "command": agent_exe(),
                "args": opts.agent_args,
                "env": base_env(),
                "stdinPolicy": "null",
                "briefPath": null,
                "outboxDir": dir.join("outbox"),
                "capture": {"stdout": stdout, "stderr": stderr},
            },
            "containment": {"preferred": driver_name()},
            "deadlines": {
                "softAt": {"bootId": boot_id(), "boottimeNs": soft},
                "idleMs": null,
                "hardCeiling": {"bootId": boot_id(), "boottimeNs": boottime_ns() + 600_000_000_000u64},
                "gateKillGraceMs": opts.grace_ms,
            },
            "agentProtocol": {"cli": "claude", "mode": "direct"},
            "steps": opts.steps,
            "sideFile": side_file,
        });
        if opts.mutating && cfg!(windows) {
            value["cwdLeaseFile"] = json!(lease_path);
        }
        let digest = envelope::digest(&value).unwrap();
        value["digest"] = Value::String(digest);
        let path = dir.join("envelope.json");
        fs::write(&path, serde_json::to_vec(&value).unwrap()).unwrap();
        let lock_path = dir.join("attempt.lock");

        #[cfg(unix)]
        let take = |path: &Path| {
            use std::os::fd::AsRawFd;
            use std::os::unix::fs::OpenOptionsExt;
            let file = fs::OpenOptions::new().read(true).write(true).create(true).truncate(false).mode(0o600).open(path).unwrap();
            // SAFETY: flock on a descriptor this process owns.
            assert_eq!(unsafe { libc::flock(file.as_raw_fd(), libc::LOCK_EX | libc::LOCK_NB) }, 0, "controller takes {}", path.display());
            file
        };
        #[cfg(unix)]
        let lock = Some(take(&lock_path));
        #[cfg(unix)]
        let lease = opts.mutating.then(|| take(&lease_path));
        Self {
            dir,
            attempt_id,
            envelope: path,
            lock_path,
            lease_path,
            #[cfg(unix)]
            lock,
            #[cfg(unix)]
            lease,
        }
    }

    /// Start the supervisor. Unix: the lock description at slot 3, then the
    /// controller lets go of its copy. Windows: the supervisor takes the lock itself.
    pub fn start(&mut self) -> Child {
        let log = fs::OpenOptions::new().create(true).append(true).open(self.dir.join("supervisor.log")).unwrap();
        let mut cmd = Command::new(internal_harness());
        cmd.args(["internal", "supervise", "--protocol", "1", "--envelope"]).arg(&self.envelope).env_clear().stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::from(log));
        #[cfg(unix)]
        {
            use std::os::unix::process::CommandExt;

            use fgos_process::control::spawn_with_fds;
            use fgos_process::FdSlot;
            // SAFETY: setsid is async-signal-safe; the supervisor leads its own session like a detached one.
            unsafe {
                cmd.pre_exec(|| if libc::setsid() < 0 { Err(std::io::Error::last_os_error()) } else { Ok(()) });
            }
            let mut map = vec![(FdSlot(3), self.lock.as_ref().unwrap())];
            if let Some(lease) = &self.lease {
                map.push((FdSlot(4), lease));
            }
            let child = spawn_with_fds(cmd, &map).expect("supervisor starts");
            self.lock = None;
            self.lease = None;
            child
        }
        #[cfg(windows)]
        {
            if let Ok(root) = std::env::var("SystemRoot") {
                cmd.env("SystemRoot", root);
            }
            cmd.spawn().expect("supervisor starts")
        }
    }

    pub fn path(&self, name: &str) -> PathBuf {
        self.dir.join(name)
    }

    pub fn json(&self, name: &str) -> Option<Value> {
        serde_json::from_str(&fs::read_to_string(self.dir.join(name)).ok()?).ok()
    }

    pub fn log(&self) -> String {
        fs::read_to_string(self.dir.join("supervisor.log")).unwrap_or_default()
    }

    /// Whether a stranger can take the attempt lock now.
    pub fn lock_is_free(&self) -> bool {
        matches!(probe(&Resource::new("attempt", &self.lock_path)), Ok(Probe::Free))
    }

    /// Whether a stranger can take the cwd lease now.
    pub fn lease_is_free(&self) -> bool {
        matches!(probe(&Resource::new("dispatch-cwd", &self.lease_path)), Ok(Probe::Free))
    }

    /// `internal adopt` on this run's directory, as the host runs it: the one JSON line.
    pub fn adopt(&self, extra: &[&str]) -> Value {
        let out = Command::new(internal_harness())
            .args(["internal", "adopt", "--protocol", "1", "--run-dir"])
            .arg(&self.dir)
            .args(extra)
            .env_clear()
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit())
            .output()
            .unwrap();
        assert_eq!(out.status.code(), Some(0), "adopt exits 0");
        String::from_utf8_lossy(&out.stdout).lines().filter_map(|l| serde_json::from_str::<Value>(l).ok()).last().expect("one adopt line")
    }
}

/// Wait for the supervisor to exit; its stdout JSON line and exit code.
pub fn finish(mut child: Child, limit: Duration) -> (i32, Value) {
    let start = Instant::now();
    loop {
        if child.try_wait().unwrap().is_some() {
            break;
        }
        assert!(start.elapsed() < limit, "supervisor did not exit within {limit:?}");
        sleep(Duration::from_millis(20));
    }
    let out = child.wait_with_output().unwrap();
    let line = String::from_utf8_lossy(&out.stdout).lines().last().and_then(|l| serde_json::from_str::<Value>(l).ok()).unwrap_or(Value::Null);
    (out.status.code().unwrap_or(-1), line)
}

pub fn wait_until(limit: Duration, what: &str, mut cond: impl FnMut() -> bool) {
    let start = Instant::now();
    while !cond() {
        assert!(start.elapsed() < limit, "timed out waiting for {what}");
        sleep(Duration::from_millis(10));
    }
}
