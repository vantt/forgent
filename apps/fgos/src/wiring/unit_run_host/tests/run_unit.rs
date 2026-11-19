//! Whole unit runs through the composed host: engine `run_unit` over [`HostUnitRun`], the assignment runner over
//! [`super::super::execution::HostExecution`], a stub agent and a stub supervisor (no real agent seat). The stub
//! supervisor binds, runs the launch the envelope names and waits for the settlement, which the test commits under
//! the run control token the side file carries, as the settle step does. The seat runs confined (bwrap, from the
//! machine's backend registry), as every unit run seat does.
#![cfg(target_os = "linux")]

use std::path::{Path, PathBuf};
use std::sync::Mutex;

use fgos_execution::admission::{Admission, CaseAdmission, Recheck};
use fgos_run_supervisor::controller::launch::AttemptHost;
use serde_json::{json, Value};

use super::super::host::HostUnitRun;
use super::{git, repo, Scratch};

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
fn stub_bin(scratch: &Scratch) -> (PathBuf, PathBuf) {
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
fn runner(bin: &Path) -> Value {
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
    let result = fgos_execution_engine::unit_run::run::run_unit(&options, &host);
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
        "unitData": { "id": "u2", "objective": "add b", "capability": "execute", "writes": ["b"] },
        "cwd": tree, "runnerConfig": runner(&bin),
        "session": { "pathEnv": bin, "herdrPresent": false, "postureAtLaunch": true, "headless": true },
    });
    let result = fgos_execution_engine::unit_run::run::run_unit(&options, &host);
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
