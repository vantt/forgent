//! The `release-slot` builtin step: close a dead worker with captured output after settlement,
//! keep uncertain attempts for a person, and leave no receipt when terminal-control cannot prove
//! it may act (so adopt tries again). Runs in-process over the fake herdr; the process environment is
//! the supervisor's, so the tests take turns.
#![cfg(target_os = "linux")]

mod support;

use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

use fgos_run_supervisor::steps::{run_steps, StepsOutcome};
use serde_json::{json, Value};
use support::herdr::FakeHerdr;
use support::supervisor::shell_step;

static ENV: Mutex<()> = Mutex::new(());

struct Case {
    herdr: FakeHerdr,
    dir: PathBuf,
    envelope: Value,
}

fn case(name: &str, settle: &str) -> Case {
    let herdr = FakeHerdr::new(name);
    let dir = std::env::temp_dir().join(format!("fgos-release-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    let key = format!("att-{name}");
    herdr.allocate(&key);
    let envelope = json!({
        "attemptId": key,
        "slot": {"key": key, "groupKey": "g"},
        "steps": [
            shell_step(&dir, "settle-attempt", settle, 10_000),
            {"stepId": "release-slot", "builtin": true, "disposition": {"onSuccess": "close", "onFailure": "retain"}},
        ],
    });
    Case { herdr, dir, envelope }
}

impl Case {
    fn receipt(&self, outcome: &str, outbox_present: bool) {
        fs::write(self.dir.join("receipt.json"), json!({"v": 1, "outcome": outcome, "outboxPresent": outbox_present, "gateExit": {"stoppedBy": match outcome { "exited" => "agent", "cancelled" => "cancel", "timeout" => "soft-deadline", "output-limit" => "output-limit", _ => "unknown" }}, "captureDigests": {"stdout": format!("sha256:{}", "0".repeat(64)), "stderr": format!("sha256:{}", "0".repeat(64))}}).to_string()).unwrap();
    }

    /// `run_steps` with the supervisor's environment pointing at this fake.
    fn run(&self) -> StepsOutcome {
        let _turn = ENV.lock().unwrap_or_else(|e| e.into_inner());
        for (key, value) in self.herdr.env() {
            std::env::set_var(key, value);
        }
        run_steps(&self.envelope, &self.dir)
    }

    fn release_detail(&self) -> Option<Value> {
        let receipt: Value = serde_json::from_str(&fs::read_to_string(self.dir.join("steps/release-slot.json")).ok()?).ok()?;
        Some(receipt["detail"].clone())
    }
}

#[test]
fn a_clean_attempt_closes_the_pane_once_and_a_second_pass_does_nothing() {
    let case = case("rs-clean", "true");
    case.receipt("exited", true);
    assert_eq!(case.run(), StepsOutcome::Done(vec!["settle-attempt".into(), "release-slot".into()]));
    assert_eq!(case.release_detail().unwrap()["disposition"], "close");
    assert_eq!(case.herdr.calls_starting("pane close"), vec!["pane close fk:p1".to_string()]);
    assert!(case.herdr.calls_starting("tab close").is_empty());

    assert_eq!(case.run(), StepsOutcome::Done(vec!["settle-attempt".into(), "release-slot".into()]));
    assert_eq!(case.herdr.calls_starting("pane close").len(), 1, "a step with a receipt does not run again");
}

#[test]
fn a_failed_attempt_keeps_the_pane() {
    for outcome in ["gate-lost", "carrier-lost", "abandoned-not-started", "abandoned-before-brief"] {
        let case = case(&format!("rs-{outcome}"), "true");
        case.receipt(outcome, true);
        assert_eq!(case.run(), StepsOutcome::Done(vec!["settle-attempt".into(), "release-slot".into()]), "{outcome}");
        assert_eq!(case.release_detail().unwrap()["disposition"], "retain", "{outcome}");
        assert!(case.herdr.calls_starting("pane close").is_empty(), "{outcome}: the pane stays");
    }
}

#[test]
fn a_pending_settlement_leaves_the_slot_undecided_until_it_completes() {
    // The settlement step fails until its host is back (a payload-missing exit), as a pruned host does.
    let case = case("rs-step-pending", "test -f host-back || exit 66");
    case.receipt("cancelled", false);
    assert_eq!(case.run(), StepsOutcome::Failed { step_id: "settle-attempt".into(), reason: "step exited 66".into() });
    assert!(!case.dir.join("steps/settle-attempt.json").exists());
    assert!(case.release_detail().is_none(), "no final retain while settlement is pending");
    assert!(case.herdr.calls_starting("pane close").is_empty());

    // The next pass (resume or adopt) completes settlement and decides with the full facts.
    fs::write(case.dir.join("host-back"), "").unwrap();
    assert_eq!(case.run(), StepsOutcome::Done(vec!["settle-attempt".into(), "release-slot".into()]));
    assert_eq!(case.release_detail().unwrap()["disposition"], "close");
    assert_eq!(case.herdr.calls_starting("pane close").len(), 1);
}

#[test]
fn terminal_control_that_cannot_prove_it_may_close_leaves_the_step_open_for_adopt() {
    let mut case = case("rs-unknown", "true");
    case.receipt("exited", true);
    // herdr is gone: the incarnation cannot be proven, so nothing may be closed.
    case.herdr.stop_server();
    let outcome = case.run();
    assert!(matches!(&outcome, StepsOutcome::Retry { step_id, .. } if step_id == "release-slot"), "{outcome:?}");
    assert!(case.release_detail().is_none(), "no receipt: adopt asks again");
    assert!(case.dir.join("steps/settle-attempt.json").exists(), "the earlier step kept its receipt");
    assert!(case.herdr.calls_starting("pane close").is_empty());
}

#[test]
fn a_step_that_asks_for_a_retry_leaves_the_slot_undecided() {
    let case = case("rs-retry", "echo '{\"result\":\"retry\",\"reason\":\"later\"}'; exit 75");
    case.receipt("exited", true);
    let outcome = case.run();
    assert!(matches!(&outcome, StepsOutcome::Retry { step_id, .. } if step_id == "settle-attempt"), "{outcome:?}");
    assert!(case.release_detail().is_none(), "the slot waits for the retried step");
    assert!(case.herdr.calls_starting("pane close").is_empty());
}

#[test]
fn a_cancellation_not_stopped_by_cancel_retains() {
    for stopped_by in ["agent", "orphan", "soft-deadline", "unknown"] {
        let case = case(&format!("rs-cancel-by-{stopped_by}"), "true");
        case.receipt("cancelled", false);
        let mut receipt: Value = serde_json::from_str(&fs::read_to_string(case.dir.join("receipt.json")).unwrap()).unwrap();
        receipt["gateExit"]["stoppedBy"] = json!(stopped_by);
        fs::write(case.dir.join("receipt.json"), receipt.to_string()).unwrap();
        assert!(matches!(case.run(), StepsOutcome::Done(_)));
        assert_eq!(case.release_detail().unwrap()["disposition"], "retain", "{stopped_by}");
        assert!(case.herdr.calls_starting("pane close").is_empty(), "{stopped_by}");
    }
}

#[test]
fn a_dead_worker_with_captured_output_closes_without_an_outbox_result() {
    for outcome in ["exited", "cancelled", "timeout", "output-limit"] {
        let case = case(&format!("rs-captured-{outcome}"), "true");
        case.receipt(outcome, false);
        let mut receipt: Value = serde_json::from_str(&fs::read_to_string(case.dir.join("receipt.json")).unwrap()).unwrap();
        receipt["reason"] = json!("terminal:needs-human");
        receipt["gateExit"]["exitCode"] = json!(1);
        receipt["gateExit"]["signal"] = json!("SIGTERM");
        fs::write(case.dir.join("receipt.json"), receipt.to_string()).unwrap();
        assert!(matches!(case.run(), StepsOutcome::Done(_)));
        assert_eq!(case.release_detail().unwrap()["disposition"], "close", "{outcome}");
        assert_eq!(case.herdr.calls_starting("pane close").len(), 1, "{outcome}");
    }
}

#[test]
fn missing_capture_or_gate_exit_or_inconsistent_outcome_retains() {
    for (name, field, value) in [
        ("stdout", "captureDigests", json!({"stdout": null, "stderr": format!("sha256:{}", "0".repeat(64))})),
        ("stderr", "captureDigests", json!({"stdout": format!("sha256:{}", "0".repeat(64)), "stderr": null})),
        ("malformed", "captureDigests", json!({"stdout": "sha256:bad", "stderr": "sha256:bad"})),
        ("gate", "gateExit", Value::Null),
        ("inconsistent", "gateExit", json!({"stoppedBy": "orphan", "cause": "orphan-ceiling"})),
        ("unknown", "outcome", json!("future-outcome")),
    ] {
        let case = case(&format!("rs-missing-{name}"), "true");
        case.receipt("exited", true);
        let mut receipt: Value = serde_json::from_str(&fs::read_to_string(case.dir.join("receipt.json")).unwrap()).unwrap();
        receipt[field] = value;
        fs::write(case.dir.join("receipt.json"), receipt.to_string()).unwrap();
        assert!(matches!(case.run(), StepsOutcome::Done(_)));
        assert_eq!(case.release_detail().unwrap()["disposition"], "retain", "{name}");
        assert!(case.herdr.calls_starting("pane close").is_empty());
    }
}

#[test]
fn recognized_deadlines_and_adopted_results_close() {
    for stopped_by in ["idle", "hard-ceiling", "orphan"] {
        let case = case(&format!("rs-ended-{stopped_by}"), "true");
        case.receipt(if stopped_by == "orphan" { "exited" } else { "timeout" }, true);
        let mut receipt: Value = serde_json::from_str(&fs::read_to_string(case.dir.join("receipt.json")).unwrap()).unwrap();
        receipt["gateExit"] = json!({"stoppedBy": stopped_by, "cause": "orphan-result"});
        fs::write(case.dir.join("receipt.json"), receipt.to_string()).unwrap();
        assert!(matches!(case.run(), StepsOutcome::Done(_)));
        assert_eq!(case.release_detail().unwrap()["disposition"], "close", "{stopped_by}");
    }
}
