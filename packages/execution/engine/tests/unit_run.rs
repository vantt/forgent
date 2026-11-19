//! The unit run replays the vectors recorded from the Node modules it ports
//! (`packages/execution/contracts/unit-run/`, recorded by `test/golden-recorders/unit-run.recorder.mjs`), proves the
//! admission peer against the contract's vectors (`contracts/admission-peer/`), and proves the decisions Node's
//! tests never pinned: a peer that dies or stalls fails the call closed, a recheck that is refused or unanswered
//! lets nothing commit, a stray unprefixed line is never read as a message.

use std::collections::VecDeque;
use std::io::{self, BufRead, BufReader, Read, Write};
use std::path::Path;
use std::sync::{Arc, Condvar, Mutex};
use std::thread;
use std::time::Duration;

use fgos_execution::admission::{Admission, CaseAdmission};
use fgos_execution_engine::unit_run::commit_subject::{subject_from, sync_subject};
use fgos_execution_engine::unit_run::consent::{recheck_write_consent, HeldAdmission};
use fgos_execution_engine::unit_run::partial_writes::{writes_since, WorktreeSnapshot};
use fgos_execution_engine::unit_run::peer::*;
use fgos_execution_engine::unit_run::run_unit_contract::{ErrorTag, RunUnitError};
use fgos_execution_engine::unit_run::sync::*;
use fgos_execution_engine::unit_run::verify::{
    answer_of_verify, classify, outcome_of_verify, run_verify, Ran, Verdict, Verified,
};
use serde_json::{json, Value};

fn load(dir: &str, name: &str) -> Value {
    let path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../contracts")
        .join(dir)
        .join(name);
    serde_json::from_str(
        &std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display())),
    )
    .unwrap()
}

fn vectors(name: &str) -> Value {
    load("unit-run", name)
}

// ---- recorded vectors -------------------------------------------------------------------------------------

#[test]
fn commit_subjects_match_what_node_made() {
    let v = vectors("commit-subject.json");
    for case in v["subjects"].as_array().unwrap() {
        let got = subject_from(
            case["summary"].as_str(),
            case["unitId"].as_str().unwrap(),
            case["objective"].as_str(),
        );
        assert_eq!(got, case["subject"].as_str().unwrap(), "{}", case["name"]);
    }
    for case in v["syncSubjects"].as_array().unwrap() {
        assert_eq!(
            sync_subject(case["ref"].as_str().unwrap()),
            case["subject"].as_str().unwrap()
        );
    }
}

#[test]
fn sync_decisions_match_what_node_made() {
    let v = vectors("sync.json");
    for case in v["effectiveWriteScope"].as_array().unwrap() {
        assert_eq!(
            json!(effective_write_scope(&case["unitRecord"])),
            case["scope"]
        );
    }
    for case in v["syncBrief"].as_array().unwrap() {
        assert_eq!(
            sync_brief(Some(&case["sync"]).filter(|s| !s.is_null())),
            case["brief"].as_str().unwrap()
        );
    }
    for case in v["syncSummary"].as_array().unwrap() {
        assert_eq!(
            sync_summary(Some(&case["sync"]).filter(|s| !s.is_null())).unwrap_or(Value::Null),
            case["summary"]
        );
    }
    for case in v["syncOnlyPass"].as_array().unwrap() {
        assert_eq!(sync_only_pass(&case["sync"]), case["result"]);
    }
    for case in v["syncOnlyNotOwed"].as_array().unwrap() {
        assert!(!owes_sync_only_pass(&case["unitRecord"]));
        assert_eq!(case["result"], Value::Null);
    }
}

fn verified_of(json: &Value) -> Verified {
    let infra = json["infrastructure"].as_str();
    Verified {
        verdict: match (json["verdict"].as_str(), infra) {
            (Some("pass"), _) => Verdict::Pass,
            (Some(_), _) => Verdict::Findings,
            (None, Some("timeout")) => Verdict::Infrastructure("timeout"),
            (None, _) => Verdict::Infrastructure("not-run"),
        },
        status: json["status"].as_i64().map(|s| s as i32),
        how: json["how"].as_str().unwrap().into(),
        tail: json["tail"].as_str().unwrap().into(),
        duration_ms: 1,
        output_digest: json["outputDigest"].as_str().unwrap().into(),
    }
}

#[test]
fn verify_answers_match_what_node_made() {
    let v = vectors("verify.json");
    for case in v["cases"].as_array().unwrap() {
        let verified = verified_of(&case["verified"]);
        assert_eq!(
            outcome_of_verify(&verified),
            case["outcome"].as_str().unwrap()
        );
        assert_eq!(
            answer_of_verify(
                &verified,
                v["subject"].as_str().unwrap(),
                v["command"].as_str().unwrap()
            ),
            case["answer"]
        );
    }
}

// ---- verify and partial writes (against their definitions) -------------------------------------------------

#[test]
fn a_verify_run_proves_a_verdict_only_when_the_check_ran_to_an_end() {
    let dir = std::env::temp_dir();
    let pass = run_verify("exit 0", &dir, Duration::from_secs(20));
    assert_eq!(pass.verdict, Verdict::Pass);
    assert!(pass.output_digest.starts_with("sha256:"));
    let findings = run_verify("echo found; exit 3", &dir, Duration::from_secs(20));
    assert_eq!(
        (findings.verdict.clone(), findings.status),
        (Verdict::Findings, Some(3))
    );
    assert_eq!(findings.tail, "found");
    let timeout = run_verify("sleep 30", &dir, Duration::from_millis(200));
    assert_eq!(timeout.verdict, Verdict::Infrastructure("timeout"));
    assert_eq!(timeout.how, "timed out after 200ms");
    assert_eq!(outcome_of_verify(&timeout), "execution-failure");
}

#[test]
fn a_verify_tail_keeps_the_last_twenty_lines() {
    let output: String = (1..=30).map(|i| format!("l{i}\n")).collect();
    let verified = classify(
        &Ran {
            passed: false,
            status: Some(1),
            timed_out: false,
            output,
        },
        Some(5),
        1,
    );
    assert_eq!(verified.tail.lines().count(), 20);
    assert!(verified.tail.starts_with("l11") && verified.tail.ends_with("l30"));
}

fn snapshot(head: &str, files: &[(&str, Option<&str>)]) -> WorktreeSnapshot {
    WorktreeSnapshot {
        head: Some(head.into()),
        files: files
            .iter()
            .map(|(p, t)| ((*p).to_string(), t.map(str::to_string)))
            .collect(),
    }
}

#[test]
fn writes_since_names_changed_paths_and_a_moved_head() {
    let before = snapshot("h1", &[("a", Some("1")), ("b", Some("2")), ("c", None)]);
    let same = writes_since(&before, &before);
    assert!(same.paths.is_empty() && !same.head_moved);
    let now = snapshot(
        "h2",
        &[("a", Some("1")), ("b", Some("3")), ("d", Some("4"))],
    );
    let since = writes_since(&before, &now);
    // b changed content; c is dirty in one snapshot only; d is new.
    assert_eq!(since.paths, ["b", "c", "d"]);
    assert!(since.head_moved);
}

// ---- the admission peer ------------------------------------------------------------------------------------

type Shared = Arc<(Mutex<(VecDeque<u8>, bool)>, Condvar)>;

struct PipeReader(Shared);
struct PipeWriter(Shared);

fn pipe() -> (PipeReader, PipeWriter) {
    let shared: Shared = Arc::new((Mutex::new((VecDeque::new(), false)), Condvar::new()));
    (PipeReader(shared.clone()), PipeWriter(shared))
}

impl Read for PipeReader {
    fn read(&mut self, out: &mut [u8]) -> io::Result<usize> {
        let (lock, cv) = &*self.0;
        let mut state = lock.lock().unwrap();
        while state.0.is_empty() && !state.1 {
            state = cv.wait(state).unwrap();
        }
        let n = out.len().min(state.0.len());
        for slot in out.iter_mut().take(n) {
            *slot = state.0.pop_front().unwrap();
        }
        Ok(n)
    }
}

impl Write for PipeWriter {
    fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
        let (lock, cv) = &*self.0;
        lock.lock().unwrap().0.extend(bytes);
        cv.notify_all();
        Ok(bytes.len())
    }
    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

impl Drop for PipeWriter {
    fn drop(&mut self) {
        let (lock, cv) = &*self.0;
        lock.lock().unwrap().1 = true;
        cv.notify_all();
    }
}

/// The peer's end: reads requests, writes answers.
struct Peer {
    requests: BufReader<PipeReader>,
    out: PipeWriter,
}

impl Peer {
    fn request(&mut self) -> Value {
        loop {
            let mut line = String::new();
            assert!(
                self.requests.read_line(&mut line).unwrap() > 0,
                "the client closed before asking"
            );
            if let Some(message) = parse_line(&line) {
                return message;
            }
        }
    }
    fn raw(&mut self, text: &str) {
        self.out.write_all(text.as_bytes()).unwrap();
    }
    fn send(&mut self, message: &Value) {
        self.raw(&frame_line(message));
    }
    fn answer(&mut self, request: &Value, result: Value) {
        self.send(&json!({ "protocol": PROTOCOL, "id": request["id"], "result": result }));
    }
}

fn with_peer(
    deadline: Duration,
    script: impl FnOnce(Peer) + Send + 'static,
) -> (PeerAdmission, thread::JoinHandle<()>) {
    let (client_in, peer_out) = pipe();
    let (peer_in, client_out) = pipe();
    let channel = PeerChannel::with_deadline(BufReader::new(client_in), client_out, deadline);
    let handle = thread::spawn(move || {
        script(Peer {
            requests: BufReader::new(peer_in),
            out: peer_out,
        })
    });
    (PeerAdmission::new(channel), handle)
}

const LONG: Duration = Duration::from_secs(20);

#[test]
fn every_vector_of_the_contract_round_trips_through_the_adapter() {
    let contract = load("admission-peer", "admission-peer.v1.json");
    let list = contract["vectors"].as_array().unwrap().clone();
    let script_list = list.clone();
    let (port, peer) = with_peer(LONG, move |mut p| {
        for v in &script_list {
            let request = p.request();
            assert_eq!(request["protocol"], PROTOCOL, "{}", v["name"]);
            assert_eq!(request["op"], v["op"], "{}", v["name"]);
            assert_eq!(request["payload"], v["payload"], "{}", v["name"]);
            p.answer(&request, v["result"].clone());
        }
    });
    for v in &list {
        let payload = &v["payload"];
        let text = |key: &str| payload[key].as_str().unwrap_or("").to_string();
        match v["op"].as_str().unwrap() {
            OP_RESOLVE_BINDING => assert_eq!(
                port.resolve_binding(payload).unwrap(),
                v["result"],
                "{}",
                v["name"]
            ),
            OP_ADMIT => match port.admit(payload).unwrap() {
                Admission::Admitted {
                    reservation_id,
                    case_id,
                    seat_launch_ceiling,
                } => {
                    assert_eq!(json!(reservation_id), v["result"]["reservationId"]);
                    assert_eq!(json!(case_id), v["result"]["caseId"]);
                    assert_eq!(json!(seat_launch_ceiling), v["result"]["seatLaunchCeiling"]);
                }
                Admission::Refused(r) => {
                    assert_eq!(json!(r.code), v["result"]["refused"]["code"]);
                    assert_eq!(json!(r.condition), v["result"]["refused"]["condition"]);
                    assert_eq!(
                        r.violations.map(Value::Array),
                        v["result"]["refused"].get("violations").cloned()
                    );
                }
            },
            OP_RECHECK_EFFECT => {
                let paths: Vec<String> = payload["paths"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|p| p.as_str().unwrap().into())
                    .collect();
                let got = port
                    .recheck_effect(&text("reservationId"), &text("caseId"), &paths)
                    .unwrap();
                assert_eq!(
                    matches!(got, fgos_execution::admission::Recheck::Ok),
                    v["result"]["ok"] == true,
                    "{}",
                    v["name"]
                );
            }
            OP_SETTLE => port
                .settle(&text("reservationId"), &payload["settle"])
                .unwrap(),
            OP_ACTIVITY_UNIT_OF => {
                let got = port
                    .activity_unit_of(&text("mainRoot"), &text("caseId"), &text("activity"))
                    .unwrap();
                assert_eq!(got.unwrap_or(Value::Null), v["result"], "{}", v["name"]);
            }
            OP_CONFINED_WRITE_REFUSAL => {
                let got = port
                    .confined_write_refusal(&text("mainRoot"), payload["caseId"].as_str())
                    .unwrap();
                assert_eq!(
                    got.map_or(Value::Null, Value::String),
                    v["result"],
                    "{}",
                    v["name"]
                );
            }
            other => panic!("unknown op {other}"),
        }
    }
    peer.join().unwrap();
}

#[test]
fn both_events_are_acknowledged_by_the_peer() {
    let (port, peer) = with_peer(LONG, |mut p| {
        for _ in 0..2 {
            let request = p.request();
            assert_eq!(request["op"], OP_EVENT);
            p.answer(&request, json!({ "acknowledged": true }));
        }
        let request = p.request();
        p.answer(&request, json!({ "acknowledged": false }));
    });
    port.channel().unit_run_created("unit-run-1").unwrap();
    port.channel().case_admitted("case-1", "res-1").unwrap();
    assert!(matches!(
        port.channel().unit_run_created("unit-run-2"),
        Err(PeerError::Malformed(_))
    ));
    peer.join().unwrap();
}

#[test]
fn a_stray_unprefixed_line_is_never_read_as_a_message() {
    let (port, peer) = with_peer(LONG, |mut p| {
        let request = p.request();
        // Stray output that looks like an answer, then the real one.
        p.raw(&format!(
            "{}\n",
            json!({ "protocol": 1, "id": request["id"], "result": { "answer": "stray" } })
        ));
        p.raw("warning: something printed to stdout\n");
        p.answer(&request, json!({ "answer": "unbound" }));
    });
    assert_eq!(
        port.resolve_binding(&json!({ "worktree": "/w" })).unwrap()["answer"],
        "unbound"
    );
    peer.join().unwrap();
}

#[test]
fn a_binding_view_without_an_answer_reaches_the_caller_and_any_unrefused_recheck_is_consent() {
    let (port, peer) = with_peer(LONG, |mut p| {
        let ask = p.request();
        p.answer(&ask, json!({ "condition": "no view" }));
        let recheck = p.request();
        p.answer(&recheck, json!({}));
        let recheck = p.request();
        p.answer(&recheck, json!({ "refused": null }));
    });
    // The run refuses it by name (`binding-view-unavailable`): the port does not.
    assert_eq!(
        port.resolve_binding(&json!({ "worktree": "/w" })).unwrap(),
        json!({ "condition": "no view" })
    );
    assert_eq!(
        port.recheck_effect("res-1", "case-1", &[]).unwrap(),
        fgos_execution::admission::Recheck::Ok
    );
    assert_eq!(
        port.recheck_effect("res-1", "case-1", &[]).unwrap(),
        fgos_execution::admission::Recheck::Ok
    );
    peer.join().unwrap();
}

#[test]
fn a_peer_that_dies_mid_run_fails_the_call_closed() {
    let (port, peer) = with_peer(LONG, |mut p| {
        let _ = p.request();
        // Dropped without answering: the channel closes.
    });
    let error = port.recheck_effect("res-1", "case-1", &[]).unwrap_err();
    assert!(matches!(error, PeerError::Closed { .. }), "{error}");
    peer.join().unwrap();
}

#[test]
fn nothing_commits_when_the_recheck_is_refused_or_unanswered() {
    let committed = std::cell::Cell::new(0);
    let commit_unless_refused = |port: &PeerAdmission| -> Result<Option<String>, PeerError> {
        let held = HeldAdmission {
            port,
            case_id: "case-1",
            reservation_id: "res-1",
        };
        match recheck_write_consent(Some(&held), &["src/a.rs".to_string()])? {
            Some(refusal) => Ok(Some(refusal.reason)),
            None => {
                committed.set(committed.get() + 1);
                Ok(None)
            }
        }
    };
    // Refused: the peer says the reservation is no longer live.
    let (port, peer) = with_peer(LONG, |mut p| {
        let request = p.request();
        p.answer(
            &request,
            json!({ "refused": { "code": "reservation-not-live", "condition": "gone" } }),
        );
    });
    assert_eq!(
        commit_unless_refused(&port).unwrap().as_deref(),
        Some("reservation-not-live")
    );
    peer.join().unwrap();
    // Unanswered: the peer dies.
    let (port, peer) = with_peer(LONG, |mut p| {
        let _ = p.request();
    });
    assert!(commit_unless_refused(&port).is_err());
    peer.join().unwrap();
    assert_eq!(
        committed.get(),
        0,
        "a commit ran after consent was refused or could not be checked"
    );
    // Held: the commit runs.
    let (port, peer) = with_peer(LONG, |mut p| {
        let request = p.request();
        assert_eq!(request["payload"]["paths"], json!(["src/a.rs"]));
        p.answer(&request, json!({ "ok": true }));
    });
    assert_eq!(commit_unless_refused(&port).unwrap(), None);
    peer.join().unwrap();
    assert_eq!(committed.get(), 1);
    // No admission: nothing to ask.
    assert_eq!(
        recheck_write_consent::<PeerAdmission>(None, &[]).unwrap(),
        None
    );
}

#[test]
fn a_slow_peer_hits_the_deadline_and_its_late_answer_is_not_the_next_answer() {
    let (port, peer) = with_peer(Duration::from_millis(300), |mut p| {
        let slow = p.request();
        thread::sleep(Duration::from_millis(600));
        p.answer(&slow, json!({ "answer": "late" }));
        let next = p.request();
        p.answer(&next, json!({ "answer": "unbound" }));
    });
    assert!(matches!(
        port.resolve_binding(&json!({ "worktree": "/w" })),
        Err(PeerError::Deadline { .. })
    ));
    thread::sleep(Duration::from_millis(500));
    // The late answer of the first request is skipped by its id.
    assert_eq!(
        port.resolve_binding(&json!({ "worktree": "/w" })).unwrap()["answer"],
        "unbound"
    );
    peer.join().unwrap();
}

#[test]
fn a_peer_of_another_protocol_number_is_refused_by_name() {
    let (port, peer) = with_peer(LONG, |mut p| {
        let request = p.request();
        p.send(&json!({ "protocol": 2, "id": request["id"], "result": {} }));
    });
    let error = port.settle("res-1", &json!({})).unwrap_err();
    assert_eq!(error, PeerError::HostVersionMismatch { got: Some(2) });
    assert_eq!(error.code(), "host-version-mismatch");
    peer.join().unwrap();
}

#[test]
fn an_error_answer_of_the_peer_is_a_remote_error_not_a_refusal() {
    let (port, peer) = with_peer(LONG, |mut p| {
        let request = p.request();
        p.send(&json!({ "protocol": PROTOCOL, "id": request["id"], "error": { "code": "ledger-unreadable", "message": "the ledger cannot be read" } }));
    });
    let error = port.admit(&json!({})).unwrap_err();
    assert_eq!(
        error,
        PeerError::Remote {
            code: "ledger-unreadable".into(),
            message: "the ledger cannot be read".into()
        }
    );
    peer.join().unwrap();
}

#[test]
fn both_sides_writing_at_once_never_deadlock() {
    // The peer sends far more than a pipe buffer holds before it reads the request.
    let (port, peer) = with_peer(LONG, |mut p| {
        for _ in 0..2000 {
            p.raw(&format!("{}\n", "stray ".repeat(100)));
        }
        let request = p.request();
        p.answer(&request, json!({ "answer": "unbound" }));
    });
    assert_eq!(
        port.resolve_binding(&json!({ "worktree": "/w" })).unwrap()["answer"],
        "unbound"
    );
    peer.join().unwrap();
}

// ---- the run-unit result -----------------------------------------------------------------------------------

#[test]
fn every_error_vector_of_the_run_unit_contract_survives_the_round_trip() {
    let contract = load("unit-run", "run-unit.v1.json");
    for v in contract["vectors"].as_array().unwrap() {
        let wire = json!({ "contract": { "id": "run-unit-result", "version": 1 }, "ok": false, "error": v["error"] });
        let error = RunUnitError::from_json(&wire).unwrap_or_else(|| panic!("{}", v["name"]));
        assert_eq!(
            ErrorTag::parse(v["error"]["tag"].as_str().unwrap()),
            Some(error.tag)
        );
        assert_eq!(error.to_json(), wire, "{}", v["name"]);
    }
    let options = contract["request"]["options"].as_array().unwrap();
    assert_eq!(
        options.len(),
        fgos_execution_engine::unit_run::run_unit_contract::REQUEST_OPTIONS.len()
    );
}

// ---- the Git-backed commit and sync, over a real repository and a linked worktree ----------------------------

#[cfg(target_os = "linux")]
mod git_backed {
    use std::fs;
    use std::path::{Path, PathBuf};
    use std::process::Command;
    use std::sync::atomic::{AtomicU64, Ordering};

    use fgos_execution_engine::unit_run::git_port::*;
    use fgos_git::{GitDriver, RepoHandle, ResolveRepo};
    use fgos_holder_lock::{acquire, Acquire, Handle, Mode, Resource, Wait};
    use serde_json::{json, Value};

    static SERIAL: AtomicU64 = AtomicU64::new(0);

    fn git(root: &Path, args: &[&str]) -> String {
        let out = Command::new("git")
            .arg("-C")
            .arg(root)
            .args(args)
            .output()
            .unwrap();
        assert!(
            out.status.success(),
            "{args:?}: {}",
            String::from_utf8_lossy(&out.stderr)
        );
        String::from_utf8(out.stdout).unwrap().trim().into()
    }

    struct Fixture {
        temp: PathBuf,
        main: PathBuf,
        tree: PathBuf,
        driver: GitDriver,
        repo: RepoHandle,
        lease: Option<Handle>,
    }

    impl Fixture {
        fn new() -> Self {
            use std::os::unix::fs::{MetadataExt, PermissionsExt};
            let temp = std::env::temp_dir().join(format!(
                "fgos-p18-{}-{}",
                std::process::id(),
                SERIAL.fetch_add(1, Ordering::Relaxed)
            ));
            fs::create_dir(&temp).unwrap();
            fs::set_permissions(&temp, fs::Permissions::from_mode(0o700)).unwrap();
            let main = temp.join("repo");
            fs::create_dir(&main).unwrap();
            git(&main, &["init", "-q", "--initial-branch=trunk"]);
            git(&main, &["config", "user.name", "Fixture"]);
            git(&main, &["config", "user.email", "fixture@example.invalid"]);
            fs::write(main.join("a"), "base\n").unwrap();
            git(&main, &["add", "."]);
            git(&main, &["commit", "-qm", "base"]);
            let tree = temp.join("producer");
            git(
                &main,
                &["worktree", "add", "-qb", "producer", tree.to_str().unwrap()],
            );
            let fence = main.join(".fgos/locks/activation.lock");
            fs::create_dir_all(&fence).unwrap();
            fs::write(
                fence.join("TOMBSTONE"),
                r#"{"lock":"activation","by":"fgos git","at":"fixture"}"#,
            )
            .unwrap();
            let m = fs::metadata(&tree).unwrap();
            let birth = m
                .created()
                .unwrap()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos();
            let key = format!("dispatch-cwd--{}-{}-{}.lock", m.dev(), m.ino(), birth);
            let lease = match acquire(
                &Resource::new("dispatch-cwd", main.join(".fgos/locks").join(key)),
                Mode::Ex,
                Wait::Ms(100),
                5000,
            ) {
                Acquire::Acquired(h) => h,
                other => panic!("{other:?}"),
            };
            let driver = GitDriver::new(&temp).unwrap();
            let repo = match driver.resolve_repo(&tree, &main).unwrap() {
                ResolveRepo::Repository(r) => r,
                _ => panic!("not a repository"),
            };
            Self {
                temp,
                main,
                tree,
                driver,
                repo,
                lease: Some(lease),
            }
        }

        fn unit(&self) -> UnitGit<'_> {
            UnitGit {
                driver: &self.driver,
                repo: &self.repo,
                custody: self.lease.as_ref(),
                writer: "fixture",
            }
        }
    }

    impl Drop for Fixture {
        fn drop(&mut self) {
            drop(self.lease.take());
            let _ = fs::remove_dir_all(&self.temp);
        }
    }

    fn scope(paths: &[&str]) -> Vec<String> {
        paths.iter().map(|p| (*p).to_owned()).collect()
    }

    fn args<'a>(
        scope: &'a [String],
        baseline: Option<&'a fgos_git::CommitBaseline>,
        id: &'a str,
    ) -> CommitArgs<'a> {
        CommitArgs {
            unit_id: "u1",
            summary: Some("feat(x): add the thing\n\ndetails"),
            objective: None,
            scope,
            baseline,
            changed_files: Some(&[]),
            exclude_paths: &[],
            needs_writes: None,
            operation_id: id,
            resume: None,
        }
    }

    fn clear(f: &Fixture, scope: &[String]) -> fgos_git::CommitBaseline {
        match f.unit().preflight(scope, None).unwrap() {
            Preflight::Clear { baseline, .. } => baseline,
            Preflight::Foreign { .. } => panic!("foreign"),
        }
    }

    #[test]
    fn a_round_commits_only_the_declared_writes_and_leaves_the_rest() {
        let f = Fixture::new();
        let scope = scope(&["src/**"]);
        let baseline = clear(&f, &scope);
        fs::create_dir(f.tree.join("src")).unwrap();
        fs::write(f.tree.join("src/new.txt"), "in\n").unwrap();
        fs::write(f.tree.join("stray.txt"), "out\n").unwrap();
        let mut prepared = Vec::new();
        let out =
            f.unit()
                .commit_unit_work(&args(&scope, Some(&baseline), "op-commit-1"), &mut |p| {
                    prepared.push(p.clone());
                    Ok(())
                });
        assert_eq!(out["status"], "committed", "{out}");
        assert_eq!(out["subject"], "feat(x): add the thing");
        assert_eq!(out["files"], json!(["src/new.txt"]));
        assert_eq!(
            prepared.len(),
            1,
            "the operation is recorded before it runs"
        );
        assert_eq!(prepared[0].expected_paths, vec!["src/new.txt".to_string()]);
        assert!(
            f.tree.join("stray.txt").exists(),
            "a file outside the scope is left as it was"
        );
        assert_eq!(
            git(&f.tree, &["log", "-1", "--format=%s"]),
            "feat(x): add the thing"
        );
        assert!(f
            .unit()
            .commit_on_branch(out["sha"].as_str().unwrap())
            .unwrap());
    }

    #[test]
    fn a_round_that_changed_nothing_in_scope_is_no_changes() {
        let f = Fixture::new();
        let scope = scope(&["src/**"]);
        let baseline = clear(&f, &scope);
        let out = f
            .unit()
            .commit_unit_work(&args(&scope, Some(&baseline), "op-commit-2"), &mut |_| {
                Ok(())
            });
        assert_eq!(out["status"], "no-changes", "{out}");
    }

    #[test]
    fn a_commit_without_its_baseline_is_refused_by_name() {
        let f = Fixture::new();
        let scope = scope(&["src/**"]);
        let out = f
            .unit()
            .commit_unit_work(&args(&scope, None, "op-commit-3"), &mut |_| Ok(()));
        assert_eq!(out["status"], "failed");
        assert_eq!(out["reason"], "baseline-required");
    }

    #[test]
    fn staged_changes_the_run_did_not_make_refuse_the_preflight_and_the_commit() {
        let f = Fixture::new();
        fs::write(f.tree.join("other.txt"), "x\n").unwrap();
        git(&f.tree, &["add", "other.txt"]);
        let scope = scope(&["src/**"]);
        match f.unit().preflight(&scope, None).unwrap() {
            Preflight::Foreign { staged, merge_head } => {
                assert_eq!(staged, vec!["other.txt".to_string()]);
                assert!(merge_head.is_none());
            }
            Preflight::Clear { .. } => panic!("the foreign index must be named"),
        }
    }

    #[test]
    fn the_sync_merge_of_a_moved_base_commits_and_a_current_base_is_up_to_date() {
        let f = Fixture::new();
        let main_head = f.unit().resolve_sync_base("trunk").unwrap().unwrap();
        let first = f.unit().start_sync_merge("trunk", &main_head, "op-sync-1");
        assert_eq!(first["status"], "up-to-date", "{first}");

        fs::write(f.main.join("b"), "more\n").unwrap();
        git(&f.main, &["add", "b"]);
        git(&f.main, &["commit", "-qm", "more"]);
        let moved = f.unit().resolve_sync_base("trunk").unwrap().unwrap();
        assert_ne!(moved, main_head);
        let merged = f.unit().start_sync_merge("trunk", &moved, "op-sync-2");
        assert_eq!(merged["status"], "merged", "{merged}");
        assert_eq!(merged["commit"]["subject"], "chore(sync): merge trunk");
        assert!(f.tree.join("b").exists());
        assert!(f.unit().commit_on_branch(&moved).unwrap());
    }

    #[test]
    fn a_conflicting_sync_merge_stays_open_for_the_worker_and_finishes_when_resolved() {
        let f = Fixture::new();
        fs::write(f.tree.join("a"), "from the branch\n").unwrap();
        git(&f.tree, &["commit", "-qam", "branch edit"]);
        fs::write(f.main.join("a"), "from trunk\n").unwrap();
        git(&f.main, &["commit", "-qam", "trunk edit"]);
        let moved = f.unit().resolve_sync_base("trunk").unwrap().unwrap();
        let started = f.unit().start_sync_merge("trunk", &moved, "op-sync-3");
        assert_eq!(started["status"], "conflicted", "{started}");
        assert_eq!(started["conflicts"], json!(["a"]));
        let state = f.unit().sync_merge_state("op-sync-3").unwrap();
        assert_eq!(state["state"], "in-progress");

        fs::write(f.tree.join("a"), "resolved\n").unwrap();
        git(&f.tree, &["add", "a"]);
        let finished = f.unit().finish_sync_merge(&started);
        assert_eq!(finished["status"], "committed", "{finished}");
        assert_eq!(finished["subject"], "chore(sync): merge trunk");
        assert!(f.unit().commit_on_branch(&moved).unwrap());
    }

    #[test]
    fn a_merge_that_never_started_is_not_in_progress() {
        let f = Fixture::new();
        let err: Value = match f.unit().sync_merge_state("never-started") {
            Ok(v) => v,
            Err(e) => json!({ "state": "error", "cause": e.cause }),
        };
        assert_ne!(err["state"], "in-progress", "{err}");
    }
}

#[test]
fn a_worktree_that_does_not_exist_has_no_key_and_no_custody_holder() {
    use fgos_execution_engine::unit_run::custody::{custody_held, worktree_key};
    let here = std::env::temp_dir();
    assert!(worktree_key(&here).is_some());
    let gone = here.join("fgos-p18-no-such-worktree");
    assert!(worktree_key(&gone).is_none());
    assert!(!custody_held(&here.join("fgos-p18-no-fgos-dir"), &gone));
}

// ---- the run loop: the decisions recorded from run.mjs, unit-run-start.mjs and unit-run-history.mjs -----------

mod run_loop_vectors {
    use std::path::Path;

    use fgos_execution::admission::{Admission, CaseAdmission, Recheck};
    use fgos_execution_engine::accounts::rotation::Rotation;
    use fgos_execution_engine::unit_run::history::{outcome_of_run_result, read_unit_run_history};
    use fgos_execution_engine::unit_run::provider_limit::{answer_provider_limit, LimitAsk};
    use fgos_execution_engine::unit_run::record::{
        publish_unit_record, read_unit_record, record_bytes,
    };
    use fgos_execution_engine::unit_run::run::{
        failed_unit_facts, infrastructure_reason_of, refused_seats_of, scope_rule,
    };
    use fgos_execution_engine::unit_run::run_unit_contract::{ErrorTag, RunUnitError};
    use fgos_execution_engine::unit_run::start::*;
    use serde_json::{json, Value};

    fn v() -> Value {
        super::vectors("run-loop.json")
    }

    fn corpus() -> std::path::PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("../contracts/corpus")
    }

    /// A value the recorder wrote as `"<absent>"` is a missing option.
    fn given(value: &Value) -> Option<&Value> {
        (value != "<absent>").then_some(value)
    }

    /// What a check returned or threw, in the recorder's shape.
    fn answer_of(result: Result<Value, RunUnitError>) -> Value {
        match result {
            Ok(value) => json!({ "ok": true, "value": value }),
            Err(e) => {
                let mut error = json!({ "name": e.tag.as_str(), "code": e.code, "phase": e.phase, "message": e.message });
                if let Some(refusal) = e.refusal {
                    error["refusal"] = refusal;
                }
                json!({ "ok": false, "error": error })
            }
        }
    }

    #[test]
    fn answers_to_a_provider_limit_match_what_node_made() {
        for case in v()["providerLimit"].as_array().unwrap() {
            let attempts = case["attempts"].as_array().unwrap();
            let rotation = case.get("rotation").map(|r| Rotation {
                pool: r["pool"].as_str().unwrap().into(),
                total: r["total"].as_u64().unwrap() as usize,
                healthy: r["healthy"].as_u64().unwrap() as usize,
            });
            let got = answer_provider_limit(&LimitAsk {
                result: &case["result"],
                bound: &case["bound"],
                attempts,
                attempt_no: case["attemptNo"].as_u64().unwrap() as usize,
                brief_not_delivered: case["briefNotDelivered"] == json!(true),
                rotation: rotation.as_ref(),
                changed: case.get("changed"),
            });
            assert_eq!(got, case["answer"], "{}", case["name"]);
        }
    }

    #[test]
    fn the_runner_config_snapshot_and_its_hash_match_what_node_made() {
        for case in v()["snapshot"].as_array().unwrap() {
            assert_eq!(
                snapshot_runner_config(&case["cfg"]),
                case["snapshot"],
                "{}",
                case["cfg"]
            );
        }
    }

    #[test]
    fn the_outcome_of_a_settled_run_result_matches_what_node_made() {
        for case in v()["outcomeOfRunResult"].as_array().unwrap() {
            assert_eq!(
                outcome_of_run_result(&case["runResult"]),
                case["outcome"].as_str().unwrap(),
                "{}",
                case["runResult"]
            );
        }
    }

    #[test]
    fn the_end_of_a_run_is_judged_as_node_judged_it() {
        let v = v();
        for case in v["scopeRule"].as_array().unwrap() {
            let r = scope_rule(
                &case["unitRecord"],
                case["outcome"].as_str().unwrap(),
                case["results"].as_array().unwrap(),
                Ok(vec![]),
            );
            let got = json!({ "outcome": r.outcome, "error": r.error, "outOfScope": r.out_of_scope, "outOfScopeOnBranch": r.out_of_scope_on_branch });
            assert_eq!(got, case["ruled"], "{case}");
        }
        for case in v["infrastructureReason"].as_array().unwrap() {
            let got = infrastructure_reason_of(
                case["started"]["value"] == json!(true),
                case["ruled"].get("error").is_some(),
                case["attempts"].as_array().unwrap(),
            );
            assert_eq!(got, case["reason"].as_str().unwrap(), "{case}");
        }
        for case in v["refusedSeats"].as_array().unwrap() {
            assert_eq!(
                json!(refused_seats_of(case["attempts"].as_array().unwrap())),
                case["seats"]
            );
        }
        for case in v["failedUnitFacts"].as_array().unwrap() {
            let scope = RunScope {
                unit_record: Some(case["scope"]["unitRecord"].clone()).filter(|r| !r.is_null()),
                ceiling_hit: case["scope"]["ceilingHit"] == json!(true),
                ..RunScope::default()
            };
            let held = HeldCase {
                case_id: "c".into(),
                reservation_id: "r".into(),
                unit_run_id: "u".into(),
                started: case["admission"]["started"] == json!(true),
                settled: false,
            };
            assert_eq!(failed_unit_facts(&scope, &held), case["facts"], "{case}");
        }
    }

    struct Binding(Value);

    impl CaseAdmission for Binding {
        type Error = std::io::Error;
        fn resolve_binding(&self, _: &Value) -> Result<Value, Self::Error> {
            Ok(self.0.clone())
        }
        fn admit(&self, _: &Value) -> Result<Admission, Self::Error> {
            unreachable!()
        }
        fn recheck_effect(&self, _: &str, _: &str, _: &[String]) -> Result<Recheck, Self::Error> {
            unreachable!()
        }
        fn settle(&self, _: &str, _: &Value) -> Result<(), Self::Error> {
            unreachable!()
        }
        fn activity_unit_of(
            &self,
            _: &str,
            _: &str,
            _: &str,
        ) -> Result<Option<Value>, Self::Error> {
            unreachable!()
        }
        fn confined_write_refusal(
            &self,
            _: &str,
            _: Option<&str>,
        ) -> Result<Option<String>, Self::Error> {
            unreachable!()
        }
    }

    #[test]
    fn the_option_checks_of_a_fresh_run_and_a_resume_refuse_as_node_refused() {
        let v = v();
        let s = &v["start"];
        for case in s["branchBases"].as_array().unwrap() {
            let got = checked_branch_base(given(&case["value"])).map(|b| b.unwrap_or(Value::Null));
            assert_eq!(answer_of(got), case["answer"], "{}", case["value"]);
        }
        for case in s["pinInputs"].as_array().unwrap() {
            assert_eq!(
                answer_of(checked_pin_inputs(given(&case["value"])).map(Value::from)),
                case["answer"],
                "{}",
                case["value"]
            );
        }
        for case in s["acceptedReports"].as_array().unwrap() {
            assert_eq!(
                answer_of(checked_accepted_reports(given(&case["value"])).map(Value::from)),
                case["answer"],
                "{}",
                case["value"]
            );
        }
        for case in s["seatSchemas"].as_array().unwrap() {
            let record = match given(&case["schema"]) {
                Some(schema) => json!({ "seatSchema": schema }),
                None => json!({}),
            };
            let got =
                assert_record_not_from_newer_release("unit-run-1", &record).map(|()| Value::Null);
            assert_eq!(answer_of(got), case["answer"], "{}", case["schema"]);
        }
        let pins = &s["collaborationPins"];
        let shipped = json!({ "solo": {}, "reviewed": {}, "panel": {}, "debate": {} });
        for case in pins["cases"].as_array().unwrap() {
            let registered = [
                Some(&shipped),
                pins.pointer("/snapshot/runner/patterns"),
                pins.pointer("/live/runner/patterns"),
            ];
            let got = assert_collaboration_pin_usable(
                "unit-run-1",
                given(&case["collaboration"]),
                &registered,
            )
            .map(|()| Value::Null);
            assert_eq!(answer_of(got), case["answer"], "{}", case["collaboration"]);
        }
        for case in s["requireFreeWorktree"].as_array().unwrap() {
            let got = require_free_worktree(&Binding(case["binding"].clone()), Path::new("/w"))
                .map(|()| Value::Null);
            let answer = answer_of(got);
            assert_eq!(answer, case["answer"], "{}", case["binding"]);
            if answer["ok"] == json!(false) {
                assert_eq!(
                    answer["error"]["name"],
                    ErrorTag::CaseAdmissionRefusedError.as_str()
                );
            }
        }
    }

    #[test]
    fn corpus_unit_records_read_back_and_publish_as_the_same_bytes_and_their_history_matches_node()
    {
        let temp = std::env::temp_dir().join(format!("fgos-p18-corpus-{}", std::process::id()));
        for case in v()["corpusHistory"].as_array().unwrap() {
            let sample = case["sample"].as_str().unwrap();
            let dir = corpus().join(sample);
            let file = dir.join("unit.json");
            let record = read_unit_record(sample, &file).unwrap();
            let bytes = std::fs::read(&file).unwrap();
            assert_eq!(
                record_bytes(&record),
                bytes,
                "{sample}: a record read back is written as the same bytes"
            );
            let out = temp.join(sample);
            publish_unit_record(&out, &record).unwrap();
            assert_eq!(
                std::fs::read(out.join("unit.json")).unwrap(),
                bytes,
                "{sample}: published through the durable door"
            );
            let history: Vec<Value> = read_unit_run_history(&dir)
                .unwrap()
                .into_iter()
                .map(|h| json!({ "seat": h["seat"], "round": h["round"], "outcome": h["outcome"] }))
                .collect();
            assert_eq!(json!(history), case["history"], "{sample}");
            // The record judges as the 6c reader judges it: one seat, the settled producer round.
            assert_eq!(record["seatSchema"], json!(KNOWN_SEAT_SCHEMA));
        }
        let _ = std::fs::remove_dir_all(&temp);
        assert!(
            matches!(read_unit_record("x", &corpus().join("README.md")), Err(e) if e.code.as_deref() == Some("unit-record-unreadable"))
        );
    }
}

// ---- the run loop end to end, over a real repository and a fake machine around it ------------------------------

#[cfg(target_os = "linux")]
mod run_loop {
    use std::fs;
    use std::path::{Path, PathBuf};
    use std::process::Command;
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::sync::Mutex;
    use std::time::Duration;

    use fgos_execution::admission::{Admission, CaseAdmission, Recheck, Refusal};
    use fgos_execution_engine::accounts::rotation::Rotation;
    use fgos_execution_engine::unit_run::host::*;
    use fgos_execution_engine::unit_run::run::run_unit;
    use fgos_execution_engine::unit_run::run_unit_contract::{ErrorTag, RunUnitError};
    use fgos_execution_engine::unit_run::verify::{Verdict, Verified};
    use fgos_git::{GitDriver, RepoHandle, ResolveRepo};
    use fgos_holder_lock::Handle;
    use serde_json::{json, Value};

    static SERIAL: AtomicU64 = AtomicU64::new(0);

    fn git(root: &Path, args: &[&str]) -> String {
        let out = Command::new("git")
            .arg("-C")
            .arg(root)
            .args(args)
            .output()
            .unwrap();
        assert!(
            out.status.success(),
            "{args:?}: {}",
            String::from_utf8_lossy(&out.stderr)
        );
        String::from_utf8(out.stdout).unwrap().trim().into()
    }

    /// A main checkout with a linked worktree the unit writes in.
    struct Repo {
        temp: PathBuf,
        main: PathBuf,
        tree: PathBuf,
    }

    impl Repo {
        fn new() -> Self {
            use std::os::unix::fs::PermissionsExt;
            let temp = std::env::temp_dir().join(format!(
                "fgos-p18-run-{}-{}",
                std::process::id(),
                SERIAL.fetch_add(1, Ordering::Relaxed)
            ));
            fs::create_dir(&temp).unwrap();
            fs::set_permissions(&temp, fs::Permissions::from_mode(0o700)).unwrap();
            let main = temp.join("repo");
            fs::create_dir(&main).unwrap();
            git(&main, &["init", "-q", "--initial-branch=trunk"]);
            git(&main, &["config", "user.name", "Fixture"]);
            git(&main, &["config", "user.email", "fixture@example.invalid"]);
            fs::write(main.join("a"), "base\n").unwrap();
            fs::write(main.join(".gitignore"), ".fgos/\n").unwrap();
            git(&main, &["add", "."]);
            git(&main, &["commit", "-qm", "base"]);
            let tree = temp.join("producer");
            git(
                &main,
                &["worktree", "add", "-qb", "producer", tree.to_str().unwrap()],
            );
            let fence = main.join(".fgos/locks/activation.lock");
            fs::create_dir_all(&fence).unwrap();
            fs::write(
                fence.join("TOMBSTONE"),
                r#"{"lock":"activation","by":"fgos git","at":"fixture"}"#,
            )
            .unwrap();
            Self { temp, main, tree }
        }

        fn head_subject(&self) -> String {
            git(&self.tree, &["log", "-1", "--format=%s"])
        }
    }

    impl Drop for Repo {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.temp);
        }
    }

    /// A port answered in process: binding, admission and recheck as given; every settle kept.
    struct Port {
        binding: Value,
        admit: Admission,
        recheck: Recheck,
        settles: Mutex<Vec<Value>>,
    }

    impl Port {
        fn free() -> Self {
            Port {
                binding: json!({ "answer": "unbound" }),
                admit: Admission::Refused(refusal("unused")),
                recheck: Recheck::Ok,
                settles: Mutex::default(),
            }
        }
    }

    fn refusal(code: &str) -> Refusal {
        Refusal {
            code: code.into(),
            condition: format!("{code} says no"),
            violations: None,
            answer: None,
        }
    }

    impl CaseAdmission for Port {
        type Error = std::io::Error;
        fn resolve_binding(&self, _: &Value) -> Result<Value, Self::Error> {
            Ok(self.binding.clone())
        }
        fn admit(&self, _: &Value) -> Result<Admission, Self::Error> {
            Ok(self.admit.clone())
        }
        fn recheck_effect(&self, _: &str, _: &str, _: &[String]) -> Result<Recheck, Self::Error> {
            Ok(self.recheck.clone())
        }
        fn settle(&self, _: &str, settle: &Value) -> Result<(), Self::Error> {
            self.settles.lock().unwrap().push(settle.clone());
            Ok(())
        }
        fn activity_unit_of(
            &self,
            _: &str,
            _: &str,
            _: &str,
        ) -> Result<Option<Value>, Self::Error> {
            Ok(None)
        }
        fn confined_write_refusal(
            &self,
            _: &str,
            _: Option<&str>,
        ) -> Result<Option<String>, Self::Error> {
            Ok(None)
        }
    }

    struct NoControl;
    impl UnitControl for NoControl {
        fn release(&mut self) -> Result<(), String> {
            Ok(())
        }
    }

    type Agent = dyn Fn(&SeatDispatch<'_>) -> Value + Send + Sync;

    /// The machine around the run: a repository, a port, an effective loop and the agent each seat stands for.
    struct Host<'a, A: CaseAdmission> {
        repo: &'a Repo,
        port: Option<A>,
        effective: Value,
        cfg: Value,
        agent: Box<Agent>,
        dispatched: Mutex<Vec<String>>,
        created: Mutex<Vec<String>>,
    }

    fn passed(changed: &[&str]) -> Value {
        json!({
            "runId": "run-1",
            "classification": { "outcome": { "category": "ok", "reason": "completed" } },
            "agentClaim": { "summary": "feat(x): add b" },
            "evidence": { "changedFiles": changed },
        })
    }

    impl<'a, A: CaseAdmission> Host<'a, A> {
        fn new(repo: &'a Repo, port: Option<A>, effective: Value, agent: Box<Agent>) -> Self {
            let cfg = json!({
                "capabilities": { "code:implement": { "verify": "true", "rigor": "standard", "minCheckers": [] }, "code:review": {} },
                "loops": { "reviewed": { "checkersByRigor": { "standard": ["reviewer"], "high": ["reviewer", "red-team"] } } },
                "llmAccounts": { "secret": "never recorded" },
            });
            Host {
                repo,
                port,
                effective,
                cfg,
                agent,
                dispatched: Mutex::default(),
                created: Mutex::default(),
            }
        }

        fn options(&self, unit: Value) -> Value {
            json!({ "unitData": unit, "cwd": self.repo.tree, "repoRoot": self.repo.main })
        }
    }

    impl<A: CaseAdmission> UnitRunHost for Host<'_, A> {
        type Admission = A;
        fn admission(&self) -> Option<&A> {
            self.port.as_ref()
        }
        fn on_unit_run_created(&self, id: &str) {
            self.created.lock().unwrap().push(id.into());
        }
        fn on_case_admitted(&self, _: &str, _: &str) {}
        fn git_roots(&self, _: &Path, _: bool) -> Result<GitRoots, String> {
            Ok(GitRoots {
                worktree_root: self.repo.tree.clone(),
                main_checkout_root: self.repo.main.clone(),
                is_linked_worktree: true,
                not_a_repository: false,
            })
        }
        fn fgos_dir(&self, main: &Path) -> PathBuf {
            main.join(".fgos")
        }
        fn sweep_attempts(&self, _: &Path) {}
        fn load_runner_config(&self, _: &Path) -> Result<Value, RunUnitError> {
            Ok(self.cfg.clone())
        }
        fn herdr_present(&self) -> bool {
            false
        }
        fn git_writer(&self) -> String {
            "fixture".into()
        }
        fn created_by(&self) -> String {
            "tester".into()
        }
        fn shipped_catalog(&self) -> Value {
            json!({ "patterns": { "solo": {}, "reviewed": {} } })
        }
        fn git(&self, worktree: &Path, main: &Path) -> Result<(GitDriver, RepoHandle), String> {
            let driver = GitDriver::new(&self.repo.temp).map_err(|e| e.cause)?;
            match driver.resolve_repo(worktree, main).map_err(|e| e.cause)? {
                ResolveRepo::Repository(repo) => Ok((driver, repo)),
                _ => Err("not a repository".into()),
            }
        }
        fn read_unit_source(&self, options: &Value) -> Result<Value, RunUnitError> {
            Ok(options["unitData"].clone())
        }
        fn check_unit_file(&self, _: &Value) -> Result<(), RunUnitError> {
            Ok(())
        }
        fn validate_unit(&self, raw: &Value) -> Result<Value, RunUnitError> {
            Ok(raw.clone())
        }
        fn existing_plan_ref(&self, _: Option<&Value>, _: &Path) -> Result<(), RunUnitError> {
            Ok(())
        }
        fn resolve_collaboration(&self, _: &Value) -> Result<Value, RunUnitError> {
            let name = self.effective["loop"].clone();
            Ok(
                json!({ "pin": { "pattern": { "name": name, "layer": "shipped" }, "effective": self.effective }, "seats": [], "launchBound": 3, "entry": { "loop": name } }),
            )
        }
        fn declared_operation_fields(
            &self,
            _: &Value,
            _: Option<&Path>,
        ) -> Result<Value, RunUnitError> {
            Ok(json!({}))
        }
        fn is_main_checkout(&self, worktree: &Path) -> bool {
            worktree == self.repo.main
        }
        fn assert_run_timeout(&self, _: &Value) -> Result<(), RunUnitError> {
            Ok(())
        }
        fn door_choices(
            &self,
            _: &Value,
            runner: &Value,
            _: &Value,
            _: &Value,
        ) -> Result<(), RunUnitError> {
            assert!(
                runner.get("llmAccounts").is_some(),
                "the inventory is read live for the bind"
            );
            Ok(())
        }
        fn persona_pin(
            &self,
            _: &str,
            _: &Path,
            _: Option<&Value>,
        ) -> Result<Option<Value>, RunUnitError> {
            Ok(None)
        }
        fn resolve_inputs(&self, _: &Value, _: &Path, _: &Value) -> Result<Value, RunUnitError> {
            Ok(json!({ "refs": [], "inputMap": [] }))
        }
        fn expand_generated(&self, writes: &Value, _: &Value) -> Value {
            writes.clone()
        }
        fn acquire_unit_control(
            &self,
            _: &Path,
            _: &str,
        ) -> Result<Box<dyn UnitControl>, ControlHeld> {
            Ok(Box::new(NoControl))
        }
        fn is_seat_record(&self, _: &Value) -> bool {
            true
        }
        fn collaboration_of_record(&self, _: &Value) -> Result<(Value, Value), RunUnitError> {
            unreachable!("every record here carries its pin")
        }
        fn adopt_state(&self, _: &Path) -> String {
            "closed".into()
        }
        fn current_attempt(&self, _: &Path, _: &str) -> Result<Option<AttemptRef>, RunUnitError> {
            Ok(None)
        }
        fn pinned_accounts_usable(
            &self,
            _: &[Value],
            _: &Value,
            _: &str,
        ) -> Result<(), RunUnitError> {
            Ok(())
        }
        fn bind(
            &self,
            ask: &Value,
            _: &Value,
            _: &Value,
            _: &Value,
            _: &Value,
        ) -> Result<Value, RunUnitError> {
            Ok(
                json!({ "executor": format!("exec-{}", ask["seat"].as_str().unwrap()), "invocation": "cli", "transport": "process" }),
            )
        }
        fn runner_config_for_binding(&self, runner: &Value, _: &Value) -> Value {
            runner.clone()
        }
        fn dispatch_seat(&self, seat: &SeatDispatch<'_>) -> Result<Value, RunUnitError> {
            self.dispatched
                .lock()
                .unwrap()
                .push(seat.assignment_id.to_string());
            let answer = (self.agent)(seat);
            // A scripted failure of the dispatch itself, after a delay: `{ "fail": <class>, "afterMs": n }`.
            if let Some(class) = answer.get("fail").and_then(Value::as_str) {
                std::thread::sleep(Duration::from_millis(
                    answer["afterMs"].as_u64().unwrap_or(0),
                ));
                return Err(RunUnitError::other(class, format!("{class} failed")));
            }
            Ok(answer)
        }
        fn account_rotation(&self, _: &Value, _: &str) -> Option<Rotation> {
            None
        }
        fn audit_lease_receipt(&self, _: Option<&Value>, _: &str) -> Option<String> {
            None
        }
        fn drop_assignment_record(&self, _: &str) {}
        fn admission_generations(&self, _: &Path) -> Result<Vec<Value>, RunUnitError> {
            Ok(Vec::new())
        }
        fn report_digest(&self, _: &Value, _: &Path) -> Value {
            Value::Null
        }
        fn verify(
            &self,
            command: &str,
            _: &Path,
            _: Option<u64>,
            custody: Option<&Handle>,
        ) -> Verified {
            assert!(
                custody.is_some(),
                "a writing unit's verify runs under its custody"
            );
            Verified {
                verdict: Verdict::Pass,
                status: Some(0),
                how: format!("{command} exited 0"),
                tail: String::new(),
                duration_ms: 1,
                output_digest: "sha256:00".into(),
            }
        }
        fn publish_unit_summary(&self, _: &Path) -> Result<(), String> {
            Ok(())
        }
    }

    fn record_of(repo: &Repo, result: &Value) -> Value {
        let id = result["unitRunId"].as_str().unwrap();
        serde_json::from_slice(
            &fs::read(
                repo.main
                    .join(".fgos/assignments")
                    .join(id)
                    .join("unit.json"),
            )
            .unwrap(),
        )
        .unwrap()
    }

    fn reading_unit() -> Value {
        json!({ "id": "u1", "objective": "look around", "capability": "code:review", "writes": [], "inputs": [] })
    }

    fn writing_unit() -> Value {
        json!({ "id": "u1", "objective": "add b", "capability": "code:implement", "writes": ["b.txt"], "inputs": [] })
    }

    /// The agent of a writing seat: the producer writes `b.txt` (and a stray file outside the scope), checkers read.
    fn producer_writes(seat: &SeatDispatch<'_>) -> Value {
        if seat.read_only {
            return passed(&[]);
        }
        let tree = PathBuf::from(seat.unit_record["worktree"].as_str().unwrap());
        fs::write(tree.join("b.txt"), "b\n").unwrap();
        fs::write(tree.join("stray.txt"), "s\n").unwrap();
        passed(&["b.txt", "stray.txt"])
    }

    fn producer_writes_only_b(seat: &SeatDispatch<'_>) -> Value {
        let tree = PathBuf::from(seat.unit_record["worktree"].as_str().unwrap());
        fs::write(tree.join("b.txt"), "b\n").unwrap();
        passed(&["b.txt"])
    }

    #[test]
    fn a_solo_read_only_run_passes_and_settles_its_record() {
        let repo = Repo::new();
        let host: Host<'_, Port> = Host::new(
            &repo,
            None,
            json!({ "loop": "solo", "params": {} }),
            Box::new(|_| passed(&[])),
        );
        let result = run_unit(&host.options(reading_unit()), &host).unwrap();
        assert_eq!(result["outcome"], "pass", "{result:#}");
        assert_eq!(result["results"][0]["seat"], "producer");
        assert_eq!(result["started"], json!({ "value": true, "reason": null }));
        assert_eq!(result["settled"], json!({ "unit": true, "case": null }));
        assert_eq!(
            *host.created.lock().unwrap(),
            vec![result["unitRunId"].as_str().unwrap().to_string()]
        );
        let record = record_of(&repo, &result);
        assert_eq!(record["execution"], json!({ "status": "settled" }));
        assert_eq!(record["settlement"]["outcome"], "pass");
        assert!(
            record["configSnapshot"]["runner"]
                .get("llmAccounts")
                .is_none(),
            "the account inventory is never recorded"
        );
        let attempt = &record["bindings"]["producer/1"][0];
        assert_eq!(attempt["outcome"], "pass");
        assert!(attempt["dispatchRetryId"]
            .as_str()
            .unwrap()
            .starts_with(&format!(
                "{}/producer/1~",
                result["unitRunId"].as_str().unwrap()
            )));
        assert!(
            attempt.get("nativeBaseline").is_none(),
            "a read-only seat takes no baseline"
        );
        // The record is written as Node writes it: pretty JSON and a newline.
        let bytes = fs::read(
            repo.main
                .join(".fgos/assignments")
                .join(result["unitRunId"].as_str().unwrap())
                .join("unit.json"),
        )
        .unwrap();
        assert_eq!(
            bytes,
            fgos_execution_engine::unit_run::record::record_bytes(&record)
        );
    }

    #[test]
    fn a_reviewed_run_with_writes_commits_only_the_declared_writes() {
        let repo = Repo::new();
        let effective = json!({ "loop": "reviewed", "params": { "maxRounds": 3 } });
        let host = Host::new(
            &repo,
            Some(Port::free()),
            effective,
            Box::new(producer_writes),
        );
        let result = run_unit(&host.options(writing_unit()), &host).unwrap();
        assert_eq!(
            result["outcome"], "findings",
            "a stray write outside the scope is never a pass: {result:#}"
        );
        let producer = &result["results"][0];
        assert_eq!(producer["commit"]["status"], "committed", "{producer:#}");
        assert_eq!(producer["commit"]["files"], json!(["b.txt"]));
        assert_eq!(result["outOfScope"], json!(["stray.txt"]));
        assert_eq!(repo.head_subject(), "feat(x): add b");
        assert_eq!(
            git(&repo.tree, &["status", "--porcelain"]),
            "?? stray.txt",
            "the stray file is reported, never committed"
        );
        assert_eq!(
            *host.dispatched.lock().unwrap(),
            vec![
                format!("{}/producer/1", result["unitRunId"].as_str().unwrap()),
                format!("{}/reviewer/1", result["unitRunId"].as_str().unwrap()),
            ]
        );
        let record = record_of(&repo, &result);
        assert_eq!(
            record["bindings"]["producer/1"][0]["commitOperation"]["state"],
            "settled"
        );
        assert!(record["bindings"]["producer/1"][0]["nativeBaseline"]["head"].is_string());
        assert_eq!(record["settlement"]["verify"]["ran"], json!(true));
        assert_eq!(record["gitWriter"], "fixture");
        assert_eq!(
            host.port.as_ref().unwrap().settles.lock().unwrap().len(),
            0,
            "a standalone run holds no reservation"
        );
    }

    #[test]
    fn the_checkers_of_one_round_run_at_the_same_time_and_answer_in_order() {
        use std::sync::{Arc, Condvar};
        let repo = Repo::new();
        // Each checker waits until the other one has started: run one after the other, neither would see two.
        let met: Arc<(Mutex<usize>, Condvar)> = Arc::default();
        let seen = met.clone();
        let agent = move |seat: &SeatDispatch<'_>| -> Value {
            if !seat.read_only {
                return producer_writes_only_b(seat);
            }
            let (count, cv) = &*seen;
            let mut n = count.lock().unwrap();
            *n += 1;
            cv.notify_all();
            let (n, _) = cv
                .wait_timeout_while(n, Duration::from_secs(10), |n| *n < 2)
                .unwrap();
            assert!(*n >= 2, "seat {} ran alone", seat.assignment_id);
            assert_eq!(
                seat.batch_size,
                Some(2),
                "a seat of a group of two is told its group"
            );
            passed(&[])
        };
        let mut host = Host::new(
            &repo,
            Some(Port::free()),
            json!({ "loop": "reviewed", "params": { "maxRounds": 1 } }),
            Box::new(agent),
        );
        host.cfg["capabilities"]["code:implement"]["rigor"] = json!("high");
        let result = run_unit(&host.options(writing_unit()), &host).unwrap();
        assert_eq!(result["outcome"], "pass", "{result:#}");
        let seats: Vec<&str> = result["results"]
            .as_array()
            .unwrap()
            .iter()
            .map(|r| r["seat"].as_str().unwrap())
            .collect();
        assert_eq!(
            seats,
            ["producer", "reviewer", "red-team", "verify"],
            "answers come back in command order"
        );
        assert_eq!(*met.0.lock().unwrap(), 2);
    }

    #[test]
    fn a_round_that_no_longer_fits_under_the_ceiling_does_not_start_and_the_run_says_so() {
        let repo = Repo::new();
        let port = Port {
            admit: Admission::Admitted {
                reservation_id: "res-1".into(),
                case_id: "case-1".into(),
                seat_launch_ceiling: Some(3),
            },
            ..Port::free()
        };
        let agent = |seat: &SeatDispatch<'_>| -> Value {
            if !seat.read_only {
                return producer_writes_only_b(seat);
            }
            json!({
                "runId": "run-2",
                "classification": { "outcome": { "category": "verdict", "reason": "findings" }, "assessment": { "verdict": "findings" } },
                "agentClaim": { "summary": "found one" },
            })
        };
        let host = Host::new(
            &repo,
            Some(port),
            json!({ "loop": "reviewed", "params": { "maxRounds": 3 } }),
            Box::new(agent),
        );
        let mut options = host.options(writing_unit());
        options["caseRef"] = json!({ "caseId": "case-1", "activity": "build" });
        let result = run_unit(&options, &host).unwrap();
        // Round 1 spent 2 of 3 launches; round 2 needs 2, so it never starts.
        assert_eq!(result["outcome"], "findings", "{result:#}");
        assert_eq!(result["rounds"], 1);
        assert_eq!(
            result["launches"],
            json!({ "ceiling": 3, "used": 2, "ceilingHit": true })
        );
        assert_eq!(host.dispatched.lock().unwrap().len(), 2);
        let settles = host.port.as_ref().unwrap().settles.lock().unwrap();
        assert_eq!(settles[0]["frameExhausted"], json!(true));
    }

    #[test]
    fn the_commit_operation_is_recorded_before_the_commit_so_a_resume_recovers_it_and_never_reruns_the_seat(
    ) {
        use std::os::unix::fs::PermissionsExt;
        let repo = Repo::new();
        // The commit's own hook copies unit.json as it stands while the commit runs: the record a controller that
        // died at that moment leaves behind.
        let snapshot = repo.temp.join("unit-at-commit.json");
        let hook = repo.main.join(".git/hooks/pre-commit");
        fs::write(
            &hook,
            format!(
                "#!/bin/sh\nfor f in {}/.fgos/assignments/*/unit.json; do cp \"$f\" {}; done\n",
                repo.main.display(),
                snapshot.display()
            ),
        )
        .unwrap();
        fs::set_permissions(&hook, fs::Permissions::from_mode(0o755)).unwrap();
        let host = Host::new(
            &repo,
            Some(Port::free()),
            json!({ "loop": "solo", "params": {} }),
            Box::new(producer_writes_only_b),
        );
        let first = run_unit(&host.options(writing_unit()), &host).unwrap();
        let commit = &first["results"][0]["commit"];
        assert_eq!(commit["status"], "committed", "{first:#}");
        let at_commit: Value =
            serde_json::from_slice(&fs::read(&snapshot).expect("the hook ran during the commit"))
                .unwrap();
        let operation = &at_commit["bindings"]["producer/1"][0]["commitOperation"];
        assert_eq!(
            operation["state"], "pending",
            "persisted before the commit ran: {at_commit:#}"
        );
        assert_eq!(
            operation["nativeRequest"]["operationId"],
            commit["operationId"]
        );

        // The controller dies right there: the record on disk is the one the hook saw. The resume recovers that
        // operation by its id, and never dispatches the seat again on top of the committed work.
        let id = first["unitRunId"].as_str().unwrap();
        let unit_json = repo
            .main
            .join(".fgos/assignments")
            .join(id)
            .join("unit.json");
        fs::write(&unit_json, fs::read(&snapshot).unwrap()).unwrap();
        fs::remove_file(&hook).unwrap();
        let head = git(&repo.tree, &["rev-parse", "HEAD"]);
        let mut options = host.options(writing_unit());
        options.as_object_mut().unwrap().remove("unitData");
        options["resumeUnitRunId"] = json!(id);
        let resumed = run_unit(&options, &host).unwrap();
        assert_eq!(
            host.dispatched.lock().unwrap().len(),
            1,
            "the seat ran once, before the death only"
        );
        assert_eq!(resumed["outcome"], "pass", "{resumed:#}");
        assert_eq!(
            git(&repo.tree, &["rev-parse", "HEAD"]),
            head,
            "no second commit"
        );
        let record = record_of(&repo, &resumed);
        assert_eq!(
            record["bindings"]["producer/1"][0]["commitOperation"]["state"],
            "settled"
        );
        assert!(
            resumed["results"][0].get("runResult").is_none(),
            "no settled round on disk: no runResult"
        );
    }

    #[test]
    fn a_batch_throws_the_failure_that_came_first_in_time_not_first_in_order() {
        let repo = Repo::new();
        let agent = |seat: &SeatDispatch<'_>| -> Value {
            if !seat.read_only {
                return producer_writes_only_b(seat);
            }
            // The reviewer is first in command order but fails last.
            if seat.assignment_id.contains("/reviewer/") {
                json!({ "fail": "reviewer-late", "afterMs": 400 })
            } else {
                json!({ "fail": "red-team-early", "afterMs": 10 })
            }
        };
        let mut host = Host::new(
            &repo,
            Some(Port::free()),
            json!({ "loop": "reviewed", "params": { "maxRounds": 1 } }),
            Box::new(agent),
        );
        host.cfg["capabilities"]["code:implement"]["rigor"] = json!("high");
        let error = run_unit(&host.options(writing_unit()), &host).unwrap_err();
        assert_eq!(error.error_class, "red-team-early", "{error:?}");
        assert_eq!(
            host.dispatched.lock().unwrap().len(),
            3,
            "every seat of the batch ran to its end"
        );
    }

    #[test]
    fn a_refused_admission_is_a_case_admission_refused_error_and_no_unit_run_exists() {
        let repo = Repo::new();
        let port = Port {
            admit: Admission::Refused(refusal("case-admission-busy")),
            ..Port::free()
        };
        let host = Host::new(
            &repo,
            Some(port),
            json!({ "loop": "solo", "params": {} }),
            Box::new(|_| unreachable!("no seat runs")),
        );
        let mut options = host.options(reading_unit());
        options["caseRef"] = json!({ "caseId": "case-1", "activity": "build" });
        let error = run_unit(&options, &host).unwrap_err();
        assert_eq!(error.tag, ErrorTag::CaseAdmissionRefusedError);
        assert_eq!(error.code.as_deref(), Some("case-admission-busy"));
        assert_eq!(
            error.refusal,
            Some(
                json!({ "code": "case-admission-busy", "condition": "case-admission-busy says no" })
            )
        );
        assert_eq!(
            RunUnitError::from_json(&error.to_json()).unwrap(),
            error,
            "the tag crosses the run-unit result"
        );
        assert!(host.created.lock().unwrap().is_empty());
        assert!(!repo.main.join(".fgos/assignments").exists());
    }

    #[test]
    fn a_standalone_writing_run_needs_the_port_and_a_free_worktree() {
        let repo = Repo::new();
        let host: Host<'_, Port> = Host::new(
            &repo,
            None,
            json!({ "loop": "solo", "params": {} }),
            Box::new(|_| unreachable!()),
        );
        let error = run_unit(&host.options(writing_unit()), &host).unwrap_err();
        assert_eq!(
            (error.tag, error.code.as_deref()),
            (
                ErrorTag::RunnerConfigError,
                Some("case-admission-port-missing")
            )
        );
        let bound = Port {
            binding: json!({ "answer": "bound", "record": { "caseId": "case-9" } }),
            ..Port::free()
        };
        let host = Host::new(
            &repo,
            Some(bound),
            json!({ "loop": "solo", "params": {} }),
            Box::new(|_| unreachable!()),
        );
        let error = run_unit(&host.options(writing_unit()), &host).unwrap_err();
        assert_eq!(error.tag, ErrorTag::CaseAdmissionRefusedError);
        assert!(
            error
                .message
                .ends_with("is not free for a run that names no case: bound (case case-9)"),
            "{}",
            error.message
        );
    }

    #[test]
    fn a_refused_recheck_commits_nothing_and_settles_the_reservation() {
        let repo = Repo::new();
        let before = git(&repo.tree, &["rev-parse", "HEAD"]);
        let port = Port {
            admit: Admission::Admitted {
                reservation_id: "res-1".into(),
                case_id: "case-1".into(),
                seat_launch_ceiling: Some(4),
            },
            recheck: Recheck::Refused {
                code: "consent-withdrawn".into(),
                condition: "the case moved on".into(),
            },
            ..Port::free()
        };
        let host = Host::new(
            &repo,
            Some(port),
            json!({ "loop": "solo", "params": {} }),
            Box::new(producer_writes),
        );
        let mut options = host.options(writing_unit());
        options["caseRef"] = json!({ "caseId": "case-1", "activity": "build" });
        let result = run_unit(&options, &host).unwrap();
        assert_eq!(result["outcome"], "policy-refusal", "{result:#}");
        assert_eq!(
            result["results"][0]["refused"],
            json!({ "reason": "consent-withdrawn", "detail": "the case moved on" })
        );
        assert_eq!(
            git(&repo.tree, &["rev-parse", "HEAD"]),
            before,
            "nothing was committed"
        );
        let settles = host.port.as_ref().unwrap().settles.lock().unwrap();
        assert_eq!(settles.len(), 1, "the reservation is settled once");
        assert_eq!(settles[0]["outcome"], "policy-refusal");
        assert_eq!(
            settles[0]["launches"],
            json!({ "ceiling": 4, "used": 1, "ceilingHit": false })
        );
        assert_eq!(result["settled"]["case"], json!(true));
        assert_eq!(
            record_of(&repo, &result)["workflow"],
            json!({ "caseId": "case-1", "activity": "build", "reservationId": "res-1" })
        );
    }

    #[test]
    fn a_peer_that_dies_mid_run_fails_the_run_closed_and_nothing_is_committed() {
        let repo = Repo::new();
        let before = git(&repo.tree, &["rev-parse", "HEAD"]);
        let (port, peer) = super::with_peer(Duration::from_secs(20), |mut p| {
            // A stray unprefixed line on the channel is never read as a message.
            p.raw("npm notice: not a frame\n");
            let admit = p.request();
            assert_eq!(admit["op"], "admit");
            assert_eq!(admit["payload"]["writes"], json!(["b.txt"]));
            p.answer(
                &admit,
                json!({ "admitted": true, "reservationId": "res-1", "caseId": "case-1" }),
            );
            let recheck = p.request();
            assert_eq!(recheck["op"], "recheckEffect");
            assert_eq!(recheck["payload"]["paths"], json!(["b.txt", "stray.txt"]));
            // Dies here: the recheck is never answered.
        });
        let host = Host::new(
            &repo,
            Some(port),
            json!({ "loop": "solo", "params": {} }),
            Box::new(producer_writes),
        );
        let mut options = host.options(writing_unit());
        options["caseRef"] = json!({ "caseId": "case-1", "activity": "build" });
        let error = run_unit(&options, &host).unwrap_err();
        assert_eq!(
            (error.tag, error.error_class.as_str()),
            (ErrorTag::Error, "case-admission-port-failed"),
            "{error:?}"
        );
        assert_eq!(
            git(&repo.tree, &["rev-parse", "HEAD"]),
            before,
            "nothing was committed"
        );
        let unit_run = host.created.lock().unwrap()[0].clone();
        let record: Value = serde_json::from_slice(
            &fs::read(
                repo.main
                    .join(".fgos/assignments")
                    .join(&unit_run)
                    .join("unit.json"),
            )
            .unwrap(),
        )
        .unwrap();
        assert_eq!(record["settlement"]["outcome"], "execution-failure");
        assert_eq!(record["settlement"]["infrastructureReason"], "run-error");
        assert!(record["bindings"]["producer/1"][0].get("commit").is_none());
        peer.join().unwrap();
    }
}

// ---- whole runUnit calls recorded from Node, replayed through run_unit -------------------------------------------

mod run_unit_runs {
    use std::fs;
    use std::path::{Path, PathBuf};
    use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};
    use std::sync::Mutex;

    use fgos_execution::admission::{Admission, CaseAdmission, Recheck, Refusal};
    use fgos_execution_engine::accounts::rotation::Rotation;
    use fgos_execution_engine::unit_run::host::*;
    use fgos_execution_engine::unit_run::run::run_unit;
    use fgos_execution_engine::unit_run::run_unit_contract::{ErrorTag, RunUnitError};
    use fgos_execution_engine::unit_run::verify::Verified;
    use fgos_git::{GitDriver, RepoHandle};
    use fgos_holder_lock::Handle;
    use serde_json::{json, Map, Value};

    static SERIAL: AtomicU64 = AtomicU64::new(0);

    /// The port Node's run was given: its answers as recorded, every call kept as `{ op, args }`.
    struct Port {
        answers: Value,
        calls: Mutex<Vec<Value>>,
    }

    impl CaseAdmission for Port {
        type Error = std::io::Error;
        fn resolve_binding(&self, ask: &Value) -> Result<Value, Self::Error> {
            self.calls
                .lock()
                .unwrap()
                .push(json!({ "op": "resolveBinding", "args": [ask] }));
            Ok(self
                .answers
                .get("binding")
                .cloned()
                .unwrap_or(json!({ "answer": "unbound" })))
        }
        fn admit(&self, proposal: &Value) -> Result<Admission, Self::Error> {
            self.calls
                .lock()
                .unwrap()
                .push(json!({ "op": "admit", "args": [proposal] }));
            let a = &self.answers["admit"];
            Ok(match a.get("refused") {
                Some(r) => Admission::Refused(Refusal {
                    code: r["code"].as_str().unwrap().into(),
                    condition: r["condition"].as_str().unwrap().into(),
                    violations: None,
                    answer: Some(r.clone()),
                }),
                None => Admission::Admitted {
                    reservation_id: a["reservationId"].as_str().unwrap().into(),
                    case_id: a["caseId"].as_str().unwrap().into(),
                    seat_launch_ceiling: a["seatLaunchCeiling"].as_u64(),
                },
            })
        }
        fn recheck_effect(
            &self,
            reservation: &str,
            case: &str,
            paths: &[String],
        ) -> Result<Recheck, Self::Error> {
            self.calls.lock().unwrap().push(json!({ "op": "recheckEffect", "args": [reservation, { "caseId": case, "paths": paths }] }));
            Ok(Recheck::Ok)
        }
        fn settle(&self, reservation: &str, settle: &Value) -> Result<(), Self::Error> {
            self.calls
                .lock()
                .unwrap()
                .push(json!({ "op": "settle", "args": [reservation, settle] }));
            Ok(())
        }
        fn activity_unit_of(
            &self,
            _: &str,
            _: &str,
            _: &str,
        ) -> Result<Option<Value>, Self::Error> {
            Ok(None)
        }
        fn confined_write_refusal(
            &self,
            _: &str,
            _: Option<&str>,
        ) -> Result<Option<String>, Self::Error> {
            Ok(None)
        }
    }

    struct NoControl;
    impl UnitControl for NoControl {
        fn release(&mut self) -> Result<(), String> {
            Ok(())
        }
    }

    /// The machine around a replayed run: what Node's own doors answered for this case.
    struct Replay {
        root: PathBuf,
        host: Value,
        port: Option<Port>,
        binds: AtomicUsize,
    }

    fn error_of(error: &Value) -> RunUnitError {
        let tag = ErrorTag::parse(error["name"].as_str().unwrap()).unwrap_or(ErrorTag::Error);
        let mut e = RunUnitError::config(
            error["message"].as_str().unwrap(),
            error["code"].as_str(),
            error["phase"].as_str(),
        );
        e.tag = tag;
        e
    }

    impl UnitRunHost for Replay {
        type Admission = Port;
        fn admission(&self) -> Option<&Port> {
            self.port.as_ref()
        }
        fn on_unit_run_created(&self, _: &str) {}
        fn on_case_admitted(&self, _: &str, _: &str) {}
        fn git_roots(&self, _: &Path, _: bool) -> Result<GitRoots, String> {
            Ok(GitRoots {
                worktree_root: self.root.join("tree"),
                main_checkout_root: self.root.join("repo"),
                is_linked_worktree: true,
                not_a_repository: false,
            })
        }
        fn fgos_dir(&self, main: &Path) -> PathBuf {
            main.join(".fgos")
        }
        fn sweep_attempts(&self, _: &Path) {}
        fn load_runner_config(&self, _: &Path) -> Result<Value, RunUnitError> {
            match self.host.get("configError").filter(|e| !e.is_null()) {
                Some(error) => Err(error_of(error)),
                None => Ok(json!({})),
            }
        }
        fn herdr_present(&self) -> bool {
            false
        }
        fn git_writer(&self) -> String {
            "replay".into()
        }
        fn created_by(&self) -> String {
            "replay".into()
        }
        fn shipped_catalog(&self) -> Value {
            json!({})
        }
        fn git(&self, _: &Path, _: &Path) -> Result<(GitDriver, RepoHandle), String> {
            Err("a replayed run never reaches git".into())
        }
        fn read_unit_source(&self, options: &Value) -> Result<Value, RunUnitError> {
            Ok(options["unitData"].clone())
        }
        fn check_unit_file(&self, _: &Value) -> Result<(), RunUnitError> {
            Ok(())
        }
        fn validate_unit(&self, _: &Value) -> Result<Value, RunUnitError> {
            Ok(self.host["unit"].clone())
        }
        fn existing_plan_ref(&self, _: Option<&Value>, _: &Path) -> Result<(), RunUnitError> {
            Ok(())
        }
        fn resolve_collaboration(&self, _: &Value) -> Result<Value, RunUnitError> {
            Ok(self.host["collaboration"].clone())
        }
        fn declared_operation_fields(
            &self,
            _: &Value,
            _: Option<&Path>,
        ) -> Result<Value, RunUnitError> {
            unreachable!()
        }
        fn is_main_checkout(&self, worktree: &Path) -> bool {
            worktree == self.root.join("repo")
        }
        fn assert_run_timeout(&self, _: &Value) -> Result<(), RunUnitError> {
            Ok(())
        }
        fn door_choices(
            &self,
            _: &Value,
            _: &Value,
            _: &Value,
            _: &Value,
        ) -> Result<(), RunUnitError> {
            Ok(())
        }
        fn persona_pin(
            &self,
            _: &str,
            _: &Path,
            _: Option<&Value>,
        ) -> Result<Option<Value>, RunUnitError> {
            Ok(None)
        }
        fn resolve_inputs(&self, _: &Value, _: &Path, _: &Value) -> Result<Value, RunUnitError> {
            Ok(json!({ "refs": [], "inputMap": [] }))
        }
        fn expand_generated(&self, writes: &Value, _: &Value) -> Value {
            writes.clone()
        }
        fn acquire_unit_control(
            &self,
            _: &Path,
            _: &str,
        ) -> Result<Box<dyn UnitControl>, ControlHeld> {
            Ok(Box::new(NoControl))
        }
        fn is_seat_record(&self, _: &Value) -> bool {
            true
        }
        fn collaboration_of_record(&self, _: &Value) -> Result<(Value, Value), RunUnitError> {
            unreachable!()
        }
        fn adopt_state(&self, _: &Path) -> String {
            "closed".into()
        }
        fn current_attempt(&self, _: &Path, _: &str) -> Result<Option<AttemptRef>, RunUnitError> {
            Ok(None)
        }
        fn pinned_accounts_usable(
            &self,
            _: &[Value],
            _: &Value,
            _: &str,
        ) -> Result<(), RunUnitError> {
            Ok(())
        }
        fn bind(
            &self,
            _: &Value,
            _: &Value,
            _: &Value,
            _: &Value,
            _: &Value,
        ) -> Result<Value, RunUnitError> {
            let at = self.binds.fetch_add(1, Ordering::Relaxed);
            Ok(self.host["bind"][at].clone())
        }
        fn runner_config_for_binding(&self, runner: &Value, _: &Value) -> Value {
            runner.clone()
        }
        fn dispatch_seat(&self, _: &SeatDispatch<'_>) -> Result<Value, RunUnitError> {
            unreachable!("every recorded run stops before a dispatch")
        }
        fn account_rotation(&self, _: &Value, _: &str) -> Option<Rotation> {
            None
        }
        fn audit_lease_receipt(&self, _: Option<&Value>, _: &str) -> Option<String> {
            None
        }
        fn drop_assignment_record(&self, _: &str) {}
        fn admission_generations(&self, _: &Path) -> Result<Vec<Value>, RunUnitError> {
            Ok(Vec::new())
        }
        fn report_digest(&self, _: &Value, _: &Path) -> Value {
            Value::Null
        }
        fn verify(&self, _: &str, _: &Path, _: Option<u64>, _: Option<&Handle>) -> Verified {
            unreachable!()
        }
        fn publish_unit_summary(&self, _: &Path) -> Result<(), String> {
            Ok(())
        }
    }

    fn is_time(s: &str) -> bool {
        let b = s.as_bytes();
        b.len() >= 20
            && b[4] == b'-'
            && b[10] == b'T'
            && s.ends_with('Z')
            && b[..4].iter().all(u8::is_ascii_digit)
    }

    /// The recorder's placeholders, written the same way on this side.
    fn normalize(value: &Value, root: &str, unit_run_id: Option<&str>, key: Option<&str>) -> Value {
        match value {
            Value::String(s) if key == Some("createdBy") => {
                let _ = s;
                json!("<USER>")
            }
            Value::String(s) if is_time(s) => json!("<TIME>"),
            Value::String(s) => {
                let mut out = s.replace(root, "<ROOT>");
                if let Some(id) = unit_run_id {
                    out = out.replace(id, "<UNIT_RUN_ID>");
                }
                json!(out)
            }
            Value::Array(a) => Value::Array(
                a.iter()
                    .map(|v| normalize(v, root, unit_run_id, None))
                    .collect(),
            ),
            Value::Object(o) => Value::Object(
                o.iter()
                    .map(|(k, v)| (k.clone(), normalize(v, root, unit_run_id, Some(k))))
                    .collect(),
            ),
            other => other.clone(),
        }
    }

    fn placeholders(value: &Value, root: &str) -> Value {
        match value {
            Value::String(s) => json!(s.replace("<ROOT>", root)),
            Value::Array(a) => Value::Array(a.iter().map(|v| placeholders(v, root)).collect()),
            Value::Object(o) => Value::Object(
                o.iter()
                    .map(|(k, v)| (k.clone(), placeholders(v, root)))
                    .collect(),
            ),
            other => other.clone(),
        }
    }

    /// A run-unit error in the recorder's shape.
    fn recorded_error(e: &RunUnitError) -> Value {
        let mut fields: Map<String, Value> = e.fields.clone();
        let name = fields
            .shift_remove("name")
            .and_then(|n| n.as_str().map(str::to_string))
            .unwrap_or_else(|| e.tag.as_str().into());
        let mut out =
            json!({ "name": name, "code": e.code, "phase": e.phase, "message": e.message });
        if let Some(r) = &e.refusal {
            out["refusal"] = r.clone();
        }
        if !fields.is_empty() {
            out["fields"] = Value::Object(fields);
        }
        out
    }

    #[test]
    fn whole_runs_recorded_from_node_replay_to_the_same_result_record_and_port_calls() {
        let v = super::vectors("run-unit-runs.json");
        for case in v["runs"].as_array().unwrap() {
            let name = case["name"].as_str().unwrap();
            let root = std::env::temp_dir().join(format!(
                "fgos-p18-replay-{}-{}",
                std::process::id(),
                SERIAL.fetch_add(1, Ordering::Relaxed)
            ));
            fs::create_dir_all(root.join("repo")).unwrap();
            fs::create_dir_all(root.join("tree")).unwrap();
            let root_text = root.display().to_string();
            let mut options = placeholders(&case["options"], &root_text);
            let port_answers = options.as_object_mut().unwrap().shift_remove("port");
            let host = Replay {
                root: root.clone(),
                host: case["host"].clone(),
                port: port_answers.map(|answers| Port {
                    answers,
                    calls: Mutex::default(),
                }),
                binds: AtomicUsize::new(0),
            };
            let outcome = run_unit(&options, &host);
            let unit_run_id = outcome
                .as_ref()
                .ok()
                .and_then(|r| r["unitRunId"].as_str().map(str::to_string))
                .or_else(|| {
                    host.port.as_ref().and_then(|p| {
                        p.calls
                            .lock()
                            .unwrap()
                            .iter()
                            .find(|c| c["op"] == "admit")
                            .and_then(|c| c["args"][0]["unitRunId"].as_str().map(str::to_string))
                    })
                });
            let got = match &outcome {
                Ok(result) => json!({ "ok": result }),
                Err(e) => json!({ "error": recorded_error(e) }),
            };
            let id = unit_run_id.as_deref();
            // Compared as text: the order of keys is part of what Node wrote.
            let text = |v: &Value| serde_json::to_string_pretty(v).unwrap();
            assert_eq!(
                text(&normalize(&got, &root_text, id, None)),
                text(&case["outcome"]),
                "{name}: outcome"
            );
            let record = id
                .map(|id| {
                    root.join("repo/.fgos/assignments")
                        .join(id)
                        .join("unit.json")
                })
                .filter(|f| f.exists())
                .map(|f| serde_json::from_slice::<Value>(&fs::read(f).unwrap()).unwrap())
                .unwrap_or(Value::Null);
            assert_eq!(
                text(&normalize(&record, &root_text, id, None)),
                text(&case["record"]),
                "{name}: unit.json"
            );
            let calls = host
                .port
                .as_ref()
                .map(|p| json!(*p.calls.lock().unwrap()))
                .unwrap_or(json!([]));
            assert_eq!(
                text(&normalize(&calls, &root_text, id, None)),
                text(&case["calls"]),
                "{name}: port calls"
            );
            let _ = fs::remove_dir_all(&root);
        }
    }
}
