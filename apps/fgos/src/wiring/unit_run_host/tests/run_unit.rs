//! Whole unit runs through the composed host: engine `run_unit` over [`HostUnitRun`], the assignment runner over
//! [`super::super::execution::HostExecution`], a stub agent and a stub supervisor (no real agent seat). The stub
//! supervisor binds, runs the launch the envelope names and waits for the settlement, which the test commits under
//! the run control token the side file carries, as the settle step does. The seat runs confined (bwrap, from the
//! machine's backend registry), as every unit run seat does.
//!
//! Each run happens in a child of this test binary whose HOME is a scratch directory: its state root and its global
//! config (with its own machine backend registry declaring this machine's bwrap) are the test's, never the person's
//! `~/.fgos`, and the controller's cancel state is the child's alone.
#![cfg(target_os = "linux")]

use std::path::{Path, PathBuf};
use std::sync::Mutex;

use fgos_execution::admission::{Admission, CaseAdmission, Recheck};
use fgos_run_supervisor::controller::launch::AttemptHost;
use serde_json::{json, Value};

use fgos_execution_engine::confinement::cleanup::resolve_confinement_temp_root;

use super::super::host::HostUnitRun;
use super::{git, repo, Scratch};

const CHILD: &str = "FGOS_UNIT_RUN_HOST_TEST_CHILD";

/// Runs `body`, the test `name` of `module` (its `module_path!()`), in a child of this test binary with a scratch HOME and nothing of this process's environment but
/// PATH, the locale and the user, and a Git identity of its own; with `bwrap`, the scratch global config registers this machine's bwrap. A machine
/// without a working bwrap skips a confined run (the repository's rule for bwrap-dependent proofs).
pub(super) fn hermetic(module: &str, name: &str, bwrap: bool, body: fn()) {
    if std::env::var_os(CHILD).is_some() {
        return body();
    }
    let path = std::env::var("PATH").unwrap_or_default();
    let scratch = Scratch::new("home");
    let confinement = Scratch::new("confinement");
    let home = scratch.0.join("home");
    std::fs::create_dir_all(home.join(".fgos")).unwrap();
    // The writer the runner commits a round's write as.
    std::fs::write(
        home.join(".gitconfig"),
        "[user]\n\tname = t\n\temail = t@t\n[commit]\n\tgpgsign = false\n",
    )
    .unwrap();
    if bwrap {
        use fgos_execution_engine::confinement::driver::bwrap::SmokeProbe;
        let smoke = SmokeProbe::new().check("bwrap", &path);
        if !smoke.passed {
            eprintln!("skipped: no working bwrap here ({})", smoke.message);
            return;
        }
        let executable = fgos_process::spawn::resolve_program("bwrap", &path, "", false)
            .expect("a working bwrap is on PATH");
        // The seats' private homes go under a root of this test's own, named by the backend's registry entry; it
        // goes with `confinement` when the test ends, whatever the outcome.
        let root = confinement.0.join("homes");
        std::fs::write(
            home.join(".fgos/confinement-backends.json"),
            json!({
                "contract": "confinement-backend-registry.v1",
                "confinementBackends": { "bwrap": { "type": "bwrap", "enabled": true, "executable": executable,
                    "tempRoot": root, "privateHomeRoot": root } },
            })
            .to_string(),
        )
        .unwrap();
    }
    let shared_root = resolve_confinement_temp_root(&std::env::temp_dir());
    let shared_before = dispatch_dirs(&shared_root);
    let test = format!(
        "{}::{name}",
        module.split_once("::").map_or(module, |(_, rest)| rest)
    );
    let mut child = std::process::Command::new(std::env::current_exe().unwrap());
    child
        .args(["--exact", &test, "--nocapture", "--test-threads", "1"])
        .env_clear()
        .env(CHILD, "1")
        .env("HOME", &home)
        .env("PATH", &path)
        .env("TMPDIR", std::env::temp_dir());
    for kept in ["USER", "LANG", "LC_ALL"] {
        if let Ok(value) = std::env::var(kept) {
            child.env(kept, value);
        }
    }
    let spawned = child
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .unwrap();
    let child_pid = spawned.id();
    let out = spawned.wait_with_output().unwrap();
    let (stdout, stderr) = (
        String::from_utf8_lossy(&out.stdout),
        String::from_utf8_lossy(&out.stderr),
    );
    assert!(
        out.status.success() && stdout.contains("1 passed"),
        "{test} in its own HOME:\n{stdout}\n{stderr}"
    );
    // No private home of this run landed under the machine's shared confinement root.
    // The child's run directories lie under its own scratch directories, named with its pid.
    let ours = format!("-{child_pid}-");
    for dir in dispatch_dirs(&shared_root).difference(&shared_before) {
        let record = std::fs::read_to_string(dir.join("attempt-home.json")).unwrap_or_default();
        assert!(
            !(record.contains("fgos-unit-run-host-") && record.contains(&ours)),
            "{} is this run's",
            dir.display()
        );
    }
    let injected = confinement.0.join("homes");
    if bwrap {
        assert!(
            !dispatch_dirs(&injected).is_empty(),
            "the seats' homes went to the injected root"
        );
    }
    drop(confinement);
    assert!(!injected.exists(), "the injected root goes with the test");
}

/// The per-dispatch directories under a confinement root.
fn dispatch_dirs(root: &Path) -> std::collections::BTreeSet<PathBuf> {
    std::fs::read_dir(root)
        .into_iter()
        .flatten()
        .flatten()
        .map(|entry| entry.path())
        .filter(|path| path.is_dir())
        .collect()
}

/// The admission port of a standalone run: the worktree is free, the effect still holds, every settle kept.
#[derive(Default)]
struct FreePort {
    settles: Mutex<Vec<Value>>,
}

#[derive(Debug)]
struct Never;
impl std::fmt::Display for Never {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("never")
    }
}
impl std::error::Error for Never {}

impl CaseAdmission for FreePort {
    type Error = Never;
    fn resolve_binding(&self, _: &Value) -> Result<Value, Never> {
        Ok(json!({ "answer": "unbound" }))
    }
    fn admit(&self, _: &Value) -> Result<Admission, Never> {
        Ok(Admission::Admitted {
            reservation_id: "r1".into(),
            case_id: "c1".into(),
            seat_launch_ceiling: None,
        })
    }
    fn recheck_effect(&self, _: &str, _: &str, _: &[String]) -> Result<Recheck, Never> {
        Ok(Recheck::Ok)
    }
    fn settle(&self, _: &str, settle: &Value) -> Result<(), Never> {
        self.settles.lock().unwrap().push(settle.clone());
        Ok(())
    }
    fn activity_unit_of(&self, _: &str, _: &str, _: &str) -> Result<Option<Value>, Never> {
        Ok(None)
    }
    fn confined_write_refusal(&self, _: &str, _: Option<&str>) -> Result<Option<String>, Never> {
        Ok(None)
    }
}

/// The stub agent marks `agent-ran` in its run directory and, when the scratch `write-me` names a file, writes it in
/// its cwd.
pub(super) fn stub_bin(scratch: &Scratch) -> (PathBuf, PathBuf) {
    use std::os::unix::fs::PermissionsExt;
    let bin = scratch.0.join("bin");
    std::fs::create_dir_all(&bin).unwrap();
    let agent = bin.join("stub-agent");
    std::fs::write(
        &agent,
        "#!/bin/sh\nprintf 'ran' > \"$OUTBOX/agent-ran\"\nif [ -f \"$WORK_DIR/../write-me\" ]; then printf 'new\\n' > \"$WORK_DIR/$(cat \"$WORK_DIR/../write-me\")\"; fi\n",
    )
    .unwrap();
    let host = bin.join("host.py");
    std::fs::write(
        &host,
        "#!/usr/bin/env python3\nimport fcntl, json, os, subprocess, sys, time\nenvelope = json.load(open(sys.argv[4]))\nrun = envelope['runDir']\nfor fd in (3, 4):\n    try:\n        fcntl.fcntl(fd, fcntl.F_SETFD, fcntl.FD_CLOEXEC)\n    except OSError:\n        pass\nopen(os.path.join(run, 'supervisor-binding.json'), 'w').close()\nlaunch = envelope['launch']\nenv = dict(os.environ, OUTBOX=os.path.join(run, 'worker-output', 'outbox'), WORK_DIR=envelope['cwd'])\njson.dump(envelope, open(os.path.join(run, '..', 'seen-envelope.json'), 'w'))\nsubprocess.call([launch['command']] + launch['args'], cwd=envelope['cwd'], env=env)\nfor _ in range(600):\n    if os.path.exists(os.path.join(run, 'result.json')):\n        break\n    time.sleep(0.05)\nopen(os.path.join(run, 'closed.json'), 'w').write('{}')\n",
    )
    .unwrap();
    for script in [&agent, &host] {
        std::fs::set_permissions(script, std::fs::Permissions::from_mode(0o755)).unwrap();
    }
    (bin, host)
}

/// The stub executor, named by its path so the machine finds it whatever PATH the test process has.
pub(super) fn runner(bin: &Path) -> Value {
    json!({
        "executors": { "stub": { "kind": "agent", "providerModel": "stub", "allowCrossProvider": true, "invocations": [
            { "id": "stub-cli", "via": "cli", "adapter": "cli-spawn", "command": bin.join("stub-agent"), "args": ["{prompt}"],
              "confinement": { "backend": "bwrap" } }
        ] } },
        "modelPolicies": { "stub": { "standard": "stub-model" } },
        "tierFallback": { "standard": ["stub"] },
        "defaults": { "tier": "standard" },
        "timeoutMs": 60000,
    })
}

/// Commits the settled answer of every attempt whose agent ran, under the token its side file carries.
fn settle_when_ran(
    assignments: PathBuf,
    changed: Vec<String>,
) -> std::thread::JoinHandle<Vec<PathBuf>> {
    std::thread::spawn(move || {
        let mut settled = Vec::new();
        for _ in 0..600 {
            let runs: Vec<PathBuf> = walk(&assignments)
                .into_iter()
                .filter(|p| {
                    p.join("worker-output/outbox/agent-ran").exists()
                        && !p.join("result.json").exists()
                })
                .collect();
            if let Some(run_dir) = runs.into_iter().next() {
                let envelope: Value = serde_json::from_str(
                    &std::fs::read_to_string(run_dir.join("envelope.json")).unwrap(),
                )
                .unwrap();
                let side: Value = serde_json::from_str(
                    &std::fs::read_to_string(envelope["sideFile"].as_str().unwrap()).unwrap(),
                )
                .unwrap();
                let run_json: Value = serde_json::from_str(
                    &std::fs::read_to_string(run_dir.join("run.json")).unwrap(),
                )
                .unwrap();
                let run_id = run_json["runId"].as_str().unwrap().to_string();
                let mutating = !changed.is_empty();
                let record = fgos_execution_engine::run_result::normalize_run_result_v3(
                    &json!({
                        "runId": run_id, "assignmentId": envelope["assignmentId"], "executorId": "stub",
                        "policy": { "executorId": "stub" }, "settledAt": "2026-11-19T00:00:01.000Z",
                        "role": "producer", "operation": "op", "isReadOnlyOperation": !mutating,
                        "runtime": { "exitCode": 0, "stdoutLog": "stdout.log", "stderrLog": "stderr.log" },
                        "agentClaim": { "contract": { "id": "agent-result-claim", "version": 2 }, "status": "done", "summary": "feat(x): add b" },
                        "evidence": { "operationMutability": if mutating { "mutating" } else { "read-only" },
                            "changedFiles": changed, "attribution": [], "artifacts": [], "tests": [] },
                    }),
                    "2026-11-19T00:00:01.000Z",
                );
                fgos_execution_engine::settlement::commit_run_settlement(
                    &run_dir,
                    &run_id,
                    side["controlEpoch"].as_u64().unwrap(),
                    side["controlToken"].as_str().unwrap(),
                    &record,
                )
                .unwrap();
                settled.push(run_dir);
                return settled;
            }
            std::thread::sleep(std::time::Duration::from_millis(50));
        }
        settled
    })
}

fn walk(dir: &Path) -> Vec<PathBuf> {
    let mut out = Vec::new();
    for entry in std::fs::read_dir(dir).into_iter().flatten().flatten() {
        let path = entry.path();
        if path.is_dir() {
            if path.parent().and_then(Path::file_name) == Some(std::ffi::OsStr::new("runs")) {
                out.push(path.clone());
            }
            out.extend(walk(&path));
        }
    }
    out
}

fn host_of(port: Option<FreePort>, bin: &Path, host: &Path) -> HostUnitRun<FreePort> {
    HostUnitRun::new(
        port,
        json!({ "pathEnv": bin, "herdrPresent": false, "postureAtLaunch": true, "headless": true }),
        AttemptHost {
            host_bin: host.to_string_lossy().into(),
            payload_root: env!("CARGO_MANIFEST_DIR").replace("/apps/fgos", ""),
        },
    )
}

#[test]
fn a_read_only_unit_runs_end_to_end_through_the_composed_host() {
    hermetic(
        module_path!(),
        "a_read_only_unit_runs_end_to_end_through_the_composed_host",
        true,
        read_only_run,
    );
}

fn read_only_run() {
    let scratch = Scratch::new("e2e-ro");
    let (main, tree) = repo(&scratch);
    let (bin, host_bin) = stub_bin(&scratch);
    let host = host_of(None, &bin, &host_bin);
    let settle = settle_when_ran(main.join(".fgos/assignments"), Vec::new());
    let options = json!({
        "unitData": { "id": "u1", "objective": "look around", "capability": "execute", "writes": [] },
        "cwd": tree, "runnerConfig": runner(&bin),
        "session": { "pathEnv": bin, "herdrPresent": false, "postureAtLaunch": true, "headless": true },
    });
    let result = host.run_unit(&options);
    let settled = settle.join().unwrap();
    let result = result.unwrap_or_else(|e| panic!("{e:?}"));
    assert_eq!(result["outcome"], "pass", "{result}");
    assert_eq!(settled.len(), 1);
    let unit_run_id = result["unitRunId"].as_str().unwrap();
    assert!(main
        .join(".fgos/assignments")
        .join(unit_run_id)
        .join("unit.json")
        .exists());
}

#[test]
fn a_writing_unit_runs_under_its_custody_and_commits_its_declared_write() {
    hermetic(
        module_path!(),
        "a_writing_unit_runs_under_its_custody_and_commits_its_declared_write",
        true,
        writing_run,
    );
}

fn writing_run() {
    let scratch = Scratch::new("e2e-rw");
    let (main, tree) = repo(&scratch);
    let fence = main.join(".fgos/locks/activation.lock");
    std::fs::create_dir_all(&fence).unwrap();
    std::fs::write(
        fence.join("TOMBSTONE"),
        r#"{"lock":"activation","by":"fgos git","at":"fixture"}"#,
    )
    .unwrap();
    std::fs::write(main.join(".gitignore"), ".fgos/\n").unwrap();
    git(&main, &["add", ".gitignore"]);
    git(&main, &["commit", "-qm", "ignore"]);
    git(&tree, &["merge", "-q", "trunk"]);
    let (bin, host_bin) = stub_bin(&scratch);
    let port = FreePort::default();
    let host = host_of(Some(port), &bin, &host_bin);
    std::fs::write(scratch.0.join("write-me"), "b").unwrap();
    let settle = settle_when_ran(main.join(".fgos/assignments"), vec!["b".into()]);
    let options = json!({
        // The verify borrows the run's custody, which went to the supervisor lent: it runs only because the launch
        // recorded the supervisor on the lent handle.
        "unitData": { "id": "u2", "objective": "add b", "capability": "execute", "writes": ["b"], "verify": "test -f b" },
        "cwd": tree, "runnerConfig": runner(&bin),
        "session": { "pathEnv": bin, "herdrPresent": false, "postureAtLaunch": true, "headless": true },
    });
    let result = host.run_unit(&options);
    let _ = settle.join().unwrap();
    let result = result.unwrap_or_else(|e| panic!("{e:?}"));
    assert_eq!(result["outcome"], "pass", "{result}");
    assert_eq!(std::fs::read_to_string(tree.join("b")).unwrap(), "new\n");
    // The round's write is committed on the worktree's branch, and the run's custody of the worktree is let go.
    let out = std::process::Command::new("git")
        .args([
            "-C",
            tree.to_str().unwrap(),
            "log",
            "-1",
            "--format=%s",
            "--name-only",
        ])
        .output()
        .unwrap();
    let log = String::from_utf8_lossy(&out.stdout);
    assert!(log.lines().any(|l| l == "b"), "{log}");
    let lease = fgos_run_supervisor::controller::cwd_lock::acquire_dispatch_cwd_lock(
        &main.join(".fgos"),
        &tree,
    );
    assert!(lease.is_ok(), "custody released after the run: {lease:?}");
    // A standalone run is admitted into no case: nothing is settled with the port.
    assert!(host
        .admission
        .as_ref()
        .unwrap()
        .settles
        .lock()
        .unwrap()
        .is_empty());
}

#[test]
fn a_cancelled_controller_starts_no_unit_run() {
    hermetic(
        module_path!(),
        "a_cancelled_controller_starts_no_unit_run",
        false,
        cancelled_run,
    );
}

/// After the first signal no new run starts: the host's cancel port reads the controller's cancel request, and the
/// run is refused before it makes a unit directory.
fn cancelled_run() {
    use fgos_run_supervisor::controller::cancel::{cancel_flow, CancelFlow};
    let scratch = Scratch::new("cancel");
    let (main, tree) = repo(&scratch);
    let (bin, host_bin) = stub_bin(&scratch);
    let host = host_of(None, &bin, &host_bin);
    let mut said = Vec::new();
    cancel_flow(
        "SIGINT",
        CancelFlow {
            cancel_wait_ms: 0,
            exit: &mut |_| {},
            stderr: &mut said,
        },
    );
    let options = json!({
        "unitData": { "id": "u3", "objective": "look around", "capability": "execute", "writes": [] },
        "cwd": tree, "runnerConfig": runner(&bin),
        "session": { "pathEnv": bin, "herdrPresent": false, "postureAtLaunch": true, "headless": true },
    });
    let error = host
        .run_unit(&options)
        .expect_err("a cancelled controller runs nothing");
    assert_eq!(error.error_class, "run-cancelled");
    assert!(!main.join(".fgos/assignments").exists());
}
