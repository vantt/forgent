//! A real attempt for the supervisor tests: the controller's half of the
//! hand-over (envelope, attempt lock, cwd lease) and the supervisor started as
//! the controller starts it, with the lock descriptions at slots 3 and 4.
#![allow(dead_code)]

use std::collections::BTreeMap;
use std::fs::{self, File, OpenOptions};
use std::os::fd::AsRawFd;
use std::os::unix::fs::OpenOptionsExt;
use std::os::unix::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::thread::sleep;
use std::time::{Duration, Instant};

use fgos_process::control::spawn_with_fds;
use fgos_process::FdSlot;
use fgos_run_supervisor::envelope;
use serde_json::{json, Value};

use super::{boot_id, boottime_ns, fixture, node};

/// The binary that plays the host: `internal <route> ...`.
pub fn internal_harness() -> PathBuf {
    let exe = std::env::current_exe().expect("current_exe");
    exe.parent().unwrap().parent().unwrap().join("examples").join("internal_harness")
}

pub struct RunOpts {
    pub agent_args: Vec<String>,
    /// Soft deadline, milliseconds from now.
    pub soft_ms: Option<u64>,
    pub idle_ms: Option<u64>,
    pub steps: Vec<Value>,
    pub mutating: bool,
    /// Overrides `hostBin` (default: the harness).
    pub host_bin: Option<String>,
    pub preferred: String,
    pub grace_ms: u64,
    /// A hard ceiling that already passed: the gate never starts the agent.
    pub ceiling_past: bool,
    /// `launch.maxOutputBytes`: the budget of the two capture files together.
    pub max_output: Option<u64>,
}

impl RunOpts {
    /// A `noisy-agent.mjs` that works for `run_ms`.
    pub fn agent(run_ms: u64) -> Self {
        Self { agent_args: vec!["--run-ms".into(), run_ms.to_string()], soft_ms: None, idle_ms: None, steps: Vec::new(), mutating: false, host_bin: None, preferred: "linux-gate".into(), grace_ms: 3_000, ceiling_past: false, max_output: None }
    }
}

/// One `/bin/sh -c` step.
pub fn shell_step(dir: &Path, step_id: &str, script: &str, timeout_ms: u64) -> Value {
    json!({
        "stepId": step_id,
        "hostBin": "/bin/sh",
        "payloadRoot": "/",
        "argv": ["-c", script],
        "cwd": dir,
        "env": {"PATH": "/usr/local/bin:/usr/bin:/bin"},
        "stepTimeoutMs": timeout_ms,
    })
}

pub struct SupRun {
    pub dir: PathBuf,
    pub attempt_id: String,
    pub envelope: PathBuf,
    pub outbox: PathBuf,
    pub stdout: PathBuf,
    pub marker: PathBuf,
    pub grandchild_pid: PathBuf,
    lock: Option<File>,
    lease: Option<File>,
}

fn flock(file: &File, op: libc::c_int) -> bool {
    // SAFETY: flock on a descriptor this process owns.
    unsafe { libc::flock(file.as_raw_fd(), op) == 0 }
}

/// Whether a stranger can take the lock file shared right now.
pub fn lock_is_free(path: &Path) -> bool {
    let file = OpenOptions::new().read(true).write(true).open(path).expect("lock file");
    flock(&file, libc::LOCK_SH | libc::LOCK_NB)
}

/// Whether a stranger can take the lock file exclusively right now.
pub fn lock_is_free_ex(path: &Path) -> bool {
    let file = OpenOptions::new().read(true).write(true).open(path).expect("lock file");
    flock(&file, libc::LOCK_EX | libc::LOCK_NB)
}

impl SupRun {
    pub fn new(name: &str, opts: &RunOpts) -> Self {
        Self::new_with(name, opts, |_| {})
    }

    /// Like [`SupRun::new`], with `patch` applied to the envelope before its digest is taken.
    pub fn new_with(name: &str, opts: &RunOpts, patch: impl FnOnce(&mut Value)) -> Self {
        let dir = std::env::temp_dir().join(format!("fgos-sup-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join("protected")).unwrap();
        let attempt_id = format!("att-sup-{name}");
        let (outbox, stdout, stderr) = (dir.join("outbox"), dir.join("capture-stdout.log"), dir.join("capture-stderr.log"));
        let (marker, grandchild_pid) = (dir.join("agent.marker"), dir.join("grandchild.pid"));
        let side_file = dir.join("protected/attempt-secrets.json");
        fs::write(&side_file, json!({"v": 1, "attemptId": attempt_id, "env": {}, "controlEpoch": 1, "controlToken": "t"}).to_string()).unwrap();

        let mut args = vec![fixture("noisy-agent.mjs"), "--outbox".into(), outbox.to_string_lossy().into(), "--marker".into(), marker.to_string_lossy().into(), "--grandchild-pidfile".into(), grandchild_pid.to_string_lossy().into()];
        args.extend(opts.agent_args.clone());
        let soft = opts.soft_ms.map(|ms| boottime_ns() + ms * 1_000_000);
        let host_bin = opts.host_bin.clone().unwrap_or_else(|| internal_harness().to_string_lossy().into_owned());
        let mut value = json!({
            "v": 3,
            "attemptId": attempt_id,
            "unitRunId": "unit-1",
            "runDir": dir,
            "mode": "direct",
            "protocolId": 1,
            "hostBin": host_bin,
            "payloadRoot": "/",
            "cwd": dir,
            "mutation": if opts.mutating { "mutating" } else { "read-only" },
            "launch": {
                "command": node(),
                "args": args,
                "env": {"PATH": "/usr/local/bin:/usr/bin:/bin", "HOME": dir},
                "stdinPolicy": "null",
                "briefPath": null,
                "outboxDir": outbox,
                "capture": {"stdout": stdout, "stderr": stderr},
                "maxOutputBytes": opts.max_output,
            },
            "containment": {"preferred": opts.preferred},
            "deadlines": {
                "softAt": {"bootId": boot_id(), "boottimeNs": soft},
                "idleMs": opts.idle_ms,
                "hardCeiling": {"bootId": boot_id(), "boottimeNs": if opts.ceiling_past { boottime_ns() - 1_000_000_000 } else { boottime_ns() + 600_000_000_000u64 }},
                "gateKillGraceMs": opts.grace_ms,
            },
            "agentProtocol": {"cli": "claude", "mode": "direct"},
            "steps": opts.steps,
            "sideFile": side_file,
        });
        if opts.mutating { value["cwdLeaseFile"] = json!(dir.join("cwd.lease")); }
        patch(&mut value);
        let digest = envelope::digest(&value).unwrap();
        value["digest"] = Value::String(digest);
        let path = dir.join("envelope.json");
        fs::write(&path, serde_json::to_vec(&value).unwrap()).unwrap();

        let open = |name: &str| {
            let file = OpenOptions::new().read(true).write(true).create(true).truncate(false).mode(0o600).open(dir.join(name)).unwrap();
            assert!(flock(&file, libc::LOCK_EX | libc::LOCK_NB), "controller takes {name}");
            file
        };
        let lock = Some(open("attempt.lock"));
        let lease = opts.mutating.then(|| open("cwd.lease"));
        Self { dir, attempt_id, envelope: path, outbox, stdout, marker, grandchild_pid, lock, lease }
    }

    /// Start the supervisor with the descriptions at slots 3 and 4, then let go
    /// of the controller's copies: the supervisor (and its gate) now carry them.
    pub fn start(&mut self) -> Child {
        self.start_with_env(&[])
    }

    /// [`SupRun::start`] with environment variables the supervisor needs (it starts with nothing else).
    pub fn start_with_env(&mut self, env: &[(String, String)]) -> Child {
        let mut cmd = Command::new(internal_harness());
        let log = OpenOptions::new().create(true).append(true).open(self.dir.join("supervisor.log")).unwrap();
        cmd.args(["internal", "supervise", "--protocol", "1", "--envelope"]).arg(&self.envelope).env_clear().envs(env.iter().map(|(k, v)| (k, v))).stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::from(log));
        // SAFETY: setsid is async-signal-safe; the supervisor leads its own session like a detached one.
        unsafe {
            cmd.pre_exec(|| if libc::setsid() < 0 { Err(std::io::Error::last_os_error()) } else { Ok(()) });
        }
        let mut map: Vec<(FdSlot, &File)> = vec![(FdSlot(3), self.lock.as_ref().unwrap())];
        if let Some(lease) = &self.lease {
            map.push((FdSlot(4), lease));
        }
        let child = spawn_with_fds(cmd, &map).expect("supervisor starts");
        self.lock = None;
        self.lease = None;
        child
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
}

/// Wait for the supervisor to exit; its stdout JSON line and exit code.
pub fn finish(child: Child, limit: Duration) -> (i32, Value) {
    let start = Instant::now();
    let mut child = child;
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

pub fn env_of(pairs: &[(&str, &str)]) -> BTreeMap<String, String> {
    pairs.iter().map(|(k, v)| (k.to_string(), v.to_string())).collect()
}
