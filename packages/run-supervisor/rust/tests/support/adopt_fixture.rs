//! A real attempt directory in whatever state a dead supervisor can leave it,
//! and the adopt route run as the host runs it (`internal adopt ...`).
#![allow(dead_code)]

use std::fs::{self, File, OpenOptions};
use std::os::fd::AsRawFd;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};

use fgos_holder_lock::predecessor;
use fgos_process::facts::{self, ProcTuple};
use fgos_process::{Domain, ProcId};
use fgos_run_supervisor::envelope;
use serde_json::{json, Value};

use super::supervisor::{internal_harness, shell_step};

pub struct Fixture {
    pub dir: PathBuf,
    pub attempt_id: String,
}

/// `<root>/<name>/`, empty. `steps`: ids of fixture steps; each appends one line to `ran-<id>`.
pub fn attempt_in(root: &Path, name: &str, steps: &[&str]) -> Fixture {
    let dir = root.join(name);
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    let attempt_id = format!("att-adopt-{name}");
    let step_values: Vec<Value> = steps.iter().map(|id| shell_step(&dir, id, &format!("echo x >> {}/ran-{id}", dir.display()), 10_000)).collect();
    let mut value = json!({
        "v": 3,
        "attemptId": attempt_id,
        "unitRunId": "unit-1",
        "runDir": dir,
        "mode": "direct",
        "protocolId": 1,
        "hostBin": internal_harness(),
        "payloadRoot": "/",
        "cwd": dir,
        "mutation": "read-only",
        "launch": {
            "command": "/bin/true",
            "args": [],
            "env": {},
            "stdinPolicy": "null",
            "briefPath": null,
            "outboxDir": dir.join("outbox"),
            "capture": {"stdout": dir.join("capture-stdout.log"), "stderr": dir.join("capture-stderr.log")},
        },
        "containment": {"preferred": "linux-gate"},
        "deadlines": {"softAt": null, "idleMs": null, "hardCeiling": null, "gateKillGraceMs": 1000},
        "agentProtocol": {"cli": "claude", "mode": "direct"},
        "steps": step_values,
    });
    let digest = envelope::digest(&value).unwrap();
    value["digest"] = Value::String(digest);
    fs::write(dir.join("envelope.json"), serde_json::to_vec(&value).unwrap()).unwrap();
    fs::write(dir.join("attempt.lock"), "").unwrap();
    Fixture { dir, attempt_id }
}

pub fn attempt(name: &str, steps: &[&str]) -> Fixture {
    attempt_in(&std::env::temp_dir().join(format!("fgos-adopt-{}", std::process::id())), name, steps)
}

impl Fixture {
    pub fn path(&self, name: &str) -> PathBuf {
        self.dir.join(name)
    }

    pub fn json(&self, name: &str) -> Option<Value> {
        serde_json::from_str(&fs::read_to_string(self.dir.join(name)).ok()?).ok()
    }

    /// How many times the fixture step ran.
    pub fn runs_of(&self, step: &str) -> usize {
        fs::read_to_string(self.dir.join(format!("ran-{step}"))).map_or(0, |t| t.lines().count())
    }

    /// `supervisor-binding.json` naming `tuple` as the gate and the domain.
    pub fn bind(&self, tuple: &ProcTuple) {
        self.bind_domain(&predecessor::domain_json(&Domain::LinuxGate(tuple.clone())));
    }

    /// The binding for any domain record (`{domainKind, domainId}`).
    pub fn bind_domain(&self, record: &Value) {
        let binding = json!({
            "v": 1, "attemptId": self.attempt_id, "envelopeDigest": "sha256:0",
            "supervisor": record["domainId"], "gate": record["domainId"],
            "domain": {"kind": record["domainKind"], "id": record["domainId"]},
            "guarantee": {"containment": "kernel", "lock": "kernel"},
            "boundAt": "2026-10-18T00:00:00.000Z",
        });
        fs::write(self.path("supervisor-binding.json"), binding.to_string()).unwrap();
    }

    /// The record a supervisor declared into the lock before it died.
    pub fn declare(&self, tuple: &ProcTuple) {
        predecessor::declare(&predecessor::record_path(&self.path("attempt.lock")), &Domain::LinuxGate(tuple.clone())).unwrap();
    }

    /// The same, for a record written as the contract spells it.
    pub fn declare_record(&self, record: &Value) {
        let mut record = record.clone();
        record["v"] = json!(1);
        fs::write(predecessor::record_path(&self.path("attempt.lock")), record.to_string()).unwrap();
    }

    pub fn gate_exit(&self, stopped_by: &str) {
        let exit = json!({"v": 1, "attemptId": self.attempt_id, "exitCode": 0, "signal": null, "stoppedBy": stopped_by, "cause": null, "exitedAt": "2026-10-18T00:00:00.000Z"});
        fs::write(self.path("gate-exit.json"), exit.to_string()).unwrap();
    }

    pub fn outbox_result(&self) {
        fs::create_dir_all(self.path("outbox")).unwrap();
        fs::write(self.path("outbox/result-1.json"), "{}").unwrap();
    }

    /// Every file in the directory with its bytes, to prove a call changed nothing.
    pub fn snapshot(&self) -> Vec<(String, Vec<u8>)> {
        let mut files: Vec<(String, Vec<u8>)> = walk(&self.dir).into_iter().map(|p| (p.strip_prefix(&self.dir).unwrap().to_string_lossy().into_owned(), fs::read(&p).unwrap_or_default())).collect();
        files.sort();
        files
    }
}

fn walk(dir: &Path) -> Vec<PathBuf> {
    let mut out = Vec::new();
    for entry in fs::read_dir(dir).into_iter().flatten().flatten() {
        let path = entry.path();
        if path.is_dir() {
            out.extend(walk(&path));
        } else {
            out.push(path);
        }
    }
    out
}

/// A tuple that names no live process: a child that was started and reaped.
pub fn dead_tuple() -> ProcTuple {
    let mut child = Command::new("sleep").arg("60").spawn().unwrap();
    let tuple = facts::identity_of(ProcId(child.id())).expect("identity of a live child");
    child.kill().unwrap();
    child.wait().unwrap();
    tuple
}

/// A live `sleep` and its tuple.
pub fn live_process() -> (Child, ProcTuple) {
    let child = Command::new("sleep").arg("60").spawn().unwrap();
    let tuple = facts::identity_of(ProcId(child.id())).expect("identity of a live child");
    (child, tuple)
}

/// A kernel lock held by this test on `<dir>/attempt.lock`: stands in for a running supervisor.
pub fn hold_lock(dir: &Path) -> File {
    let file = OpenOptions::new().read(true).write(true).create(true).truncate(false).open(dir.join("attempt.lock")).unwrap();
    // SAFETY: flock on a descriptor this function owns.
    assert_eq!(unsafe { libc::flock(file.as_raw_fd(), libc::LOCK_EX | libc::LOCK_NB) }, 0, "test takes the attempt lock");
    file
}

/// Whether a stranger could take the lock shared right now.
pub fn lock_is_free(dir: &Path) -> bool {
    let file = OpenOptions::new().read(true).write(true).open(dir.join("attempt.lock")).unwrap();
    // SAFETY: flock on a descriptor this function owns.
    unsafe { libc::flock(file.as_raw_fd(), libc::LOCK_SH | libc::LOCK_NB) == 0 }
}

/// `internal adopt --protocol 1 <args>` with `stdin` as given; one parsed line per stdout line.
pub fn adopt_with(args: &[&str], stdin: &str) -> (i32, Vec<Value>) {
    let mut child = adopt_spawn(args);
    {
        use std::io::Write;
        child.stdin.take().unwrap().write_all(stdin.as_bytes()).unwrap();
    }
    adopt_finish(child)
}

pub fn adopt(dir: &Path, extra: &[&str]) -> Value {
    let mut args = vec!["--run-dir", dir.to_str().unwrap()];
    args.extend_from_slice(extra);
    let (code, mut lines) = adopt_with(&args, "");
    assert_eq!(code, 0, "adopt exits 0: {lines:?}");
    assert_eq!(lines.len(), 1, "one line per run dir: {lines:?}");
    lines.remove(0)
}

pub fn adopt_spawn(args: &[&str]) -> Child {
    Command::new(internal_harness()).args(["internal", "adopt", "--protocol", "1"]).args(args).env_clear().stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::inherit()).spawn().unwrap()
}

pub fn adopt_finish(child: Child) -> (i32, Vec<Value>) {
    let out = child.wait_with_output().unwrap();
    let lines = String::from_utf8_lossy(&out.stdout).lines().filter_map(|l| serde_json::from_str(l).ok()).collect();
    (out.status.code().unwrap_or(-1), lines)
}
