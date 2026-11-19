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
use fgos_execution_engine::unit_run::verify::{answer_of_verify, classify, outcome_of_verify, run_verify, Ran, Verdict, Verified};
use serde_json::{json, Value};

fn load(dir: &str, name: &str) -> Value {
    let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("../contracts").join(dir).join(name);
    serde_json::from_str(&std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display()))).unwrap()
}

fn vectors(name: &str) -> Value {
    load("unit-run", name)
}

// ---- recorded vectors -------------------------------------------------------------------------------------

#[test]
fn commit_subjects_match_what_node_made() {
    let v = vectors("commit-subject.json");
    for case in v["subjects"].as_array().unwrap() {
        let got = subject_from(case["summary"].as_str(), case["unitId"].as_str().unwrap(), case["objective"].as_str());
        assert_eq!(got, case["subject"].as_str().unwrap(), "{}", case["name"]);
    }
    for case in v["syncSubjects"].as_array().unwrap() {
        assert_eq!(sync_subject(case["ref"].as_str().unwrap()), case["subject"].as_str().unwrap());
    }
}

#[test]
fn sync_decisions_match_what_node_made() {
    let v = vectors("sync.json");
    for case in v["effectiveWriteScope"].as_array().unwrap() {
        assert_eq!(json!(effective_write_scope(&case["unitRecord"])), case["scope"]);
    }
    for case in v["syncBrief"].as_array().unwrap() {
        assert_eq!(sync_brief(Some(&case["sync"]).filter(|s| !s.is_null())), case["brief"].as_str().unwrap());
    }
    for case in v["syncSummary"].as_array().unwrap() {
        assert_eq!(sync_summary(Some(&case["sync"]).filter(|s| !s.is_null())).unwrap_or(Value::Null), case["summary"]);
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
        assert_eq!(outcome_of_verify(&verified), case["outcome"].as_str().unwrap());
        assert_eq!(answer_of_verify(&verified, v["subject"].as_str().unwrap(), v["command"].as_str().unwrap()), case["answer"]);
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
    assert_eq!((findings.verdict.clone(), findings.status), (Verdict::Findings, Some(3)));
    assert_eq!(findings.tail, "found");
    let timeout = run_verify("sleep 30", &dir, Duration::from_millis(200));
    assert_eq!(timeout.verdict, Verdict::Infrastructure("timeout"));
    assert_eq!(timeout.how, "timed out after 200ms");
    assert_eq!(outcome_of_verify(&timeout), "execution-failure");
}

#[test]
fn a_verify_tail_keeps_the_last_twenty_lines() {
    let output: String = (1..=30).map(|i| format!("l{i}\n")).collect();
    let verified = classify(&Ran { passed: false, status: Some(1), timed_out: false, output }, Some(5), 1);
    assert_eq!(verified.tail.lines().count(), 20);
    assert!(verified.tail.starts_with("l11") && verified.tail.ends_with("l30"));
}

fn snapshot(head: &str, files: &[(&str, Option<&str>)]) -> WorktreeSnapshot {
    WorktreeSnapshot {
        head: Some(head.into()),
        files: files.iter().map(|(p, t)| ((*p).to_string(), t.map(str::to_string))).collect(),
    }
}

#[test]
fn writes_since_names_changed_paths_and_a_moved_head() {
    let before = snapshot("h1", &[("a", Some("1")), ("b", Some("2")), ("c", None)]);
    let same = writes_since(&before, &before);
    assert!(same.paths.is_empty() && !same.head_moved);
    let now = snapshot("h2", &[("a", Some("1")), ("b", Some("3")), ("d", Some("4"))]);
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
            assert!(self.requests.read_line(&mut line).unwrap() > 0, "the client closed before asking");
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

fn with_peer(deadline: Duration, script: impl FnOnce(Peer) + Send + 'static) -> (PeerAdmission, thread::JoinHandle<()>) {
    let (client_in, peer_out) = pipe();
    let (peer_in, client_out) = pipe();
    let channel = PeerChannel::with_deadline(BufReader::new(client_in), client_out, deadline);
    let handle = thread::spawn(move || script(Peer { requests: BufReader::new(peer_in), out: peer_out }));
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
            OP_RESOLVE_BINDING => assert_eq!(port.resolve_binding(payload).unwrap(), v["result"], "{}", v["name"]),
            OP_ADMIT => match port.admit(payload).unwrap() {
                Admission::Admitted { reservation_id, case_id, seat_launch_ceiling } => {
                    assert_eq!(json!(reservation_id), v["result"]["reservationId"]);
                    assert_eq!(json!(case_id), v["result"]["caseId"]);
                    assert_eq!(json!(seat_launch_ceiling), v["result"]["seatLaunchCeiling"]);
                }
                Admission::Refused(r) => {
                    assert_eq!(json!(r.code), v["result"]["refused"]["code"]);
                    assert_eq!(json!(r.condition), v["result"]["refused"]["condition"]);
                    assert_eq!(r.violations.map(Value::Array), v["result"]["refused"].get("violations").cloned());
                }
            },
            OP_RECHECK_EFFECT => {
                let paths: Vec<String> = payload["paths"].as_array().unwrap().iter().map(|p| p.as_str().unwrap().into()).collect();
                let got = port.recheck_effect(&text("reservationId"), &text("caseId"), &paths).unwrap();
                assert_eq!(matches!(got, fgos_execution::admission::Recheck::Ok), v["result"]["ok"] == true, "{}", v["name"]);
            }
            OP_SETTLE => port.settle(&text("reservationId"), &payload["settle"]).unwrap(),
            OP_ACTIVITY_UNIT_OF => {
                let got = port.activity_unit_of(&text("mainRoot"), &text("caseId"), &text("activity")).unwrap();
                assert_eq!(got.unwrap_or(Value::Null), v["result"], "{}", v["name"]);
            }
            OP_CONFINED_WRITE_REFUSAL => {
                let got = port.confined_write_refusal(&text("mainRoot"), payload["caseId"].as_str()).unwrap();
                assert_eq!(got.map_or(Value::Null, Value::String), v["result"], "{}", v["name"]);
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
    assert!(matches!(port.channel().unit_run_created("unit-run-2"), Err(PeerError::Malformed(_))));
    peer.join().unwrap();
}

#[test]
fn a_stray_unprefixed_line_is_never_read_as_a_message() {
    let (port, peer) = with_peer(LONG, |mut p| {
        let request = p.request();
        // Stray output that looks like an answer, then the real one.
        p.raw(&format!("{}\n", json!({ "protocol": 1, "id": request["id"], "result": { "answer": "stray" } })));
        p.raw("warning: something printed to stdout\n");
        p.answer(&request, json!({ "answer": "unbound" }));
    });
    assert_eq!(port.resolve_binding(&json!({ "worktree": "/w" })).unwrap()["answer"], "unbound");
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
        let held = HeldAdmission { port, case_id: "case-1", reservation_id: "res-1" };
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
        p.answer(&request, json!({ "refused": { "code": "reservation-not-live", "condition": "gone" } }));
    });
    assert_eq!(commit_unless_refused(&port).unwrap().as_deref(), Some("reservation-not-live"));
    peer.join().unwrap();
    // Unanswered: the peer dies.
    let (port, peer) = with_peer(LONG, |mut p| {
        let _ = p.request();
    });
    assert!(commit_unless_refused(&port).is_err());
    peer.join().unwrap();
    assert_eq!(committed.get(), 0, "a commit ran after consent was refused or could not be checked");
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
    assert_eq!(recheck_write_consent::<PeerAdmission>(None, &[]).unwrap(), None);
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
    assert!(matches!(port.resolve_binding(&json!({ "worktree": "/w" })), Err(PeerError::Deadline { .. })));
    thread::sleep(Duration::from_millis(500));
    // The late answer of the first request is skipped by its id.
    assert_eq!(port.resolve_binding(&json!({ "worktree": "/w" })).unwrap()["answer"], "unbound");
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
    assert_eq!(error, PeerError::Remote { code: "ledger-unreadable".into(), message: "the ledger cannot be read".into() });
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
    assert_eq!(port.resolve_binding(&json!({ "worktree": "/w" })).unwrap()["answer"], "unbound");
    peer.join().unwrap();
}

// ---- the run-unit result -----------------------------------------------------------------------------------

#[test]
fn every_error_vector_of_the_run_unit_contract_survives_the_round_trip() {
    let contract = load("unit-run", "run-unit.v1.json");
    for v in contract["vectors"].as_array().unwrap() {
        let wire = json!({ "contract": { "id": "run-unit-result", "version": 1 }, "ok": false, "error": v["error"] });
        let error = RunUnitError::from_json(&wire).unwrap_or_else(|| panic!("{}", v["name"]));
        assert_eq!(ErrorTag::parse(v["error"]["tag"].as_str().unwrap()), Some(error.tag));
        assert_eq!(error.to_json(), wire, "{}", v["name"]);
    }
    let options = contract["request"]["options"].as_array().unwrap();
    assert_eq!(options.len(), fgos_execution_engine::unit_run::run_unit_contract::REQUEST_OPTIONS.len());
}
