//! The `release-slot` builtin step: close the pane for a clean attempt whose earlier steps all have
//! receipts, keep it for a person otherwise, and leave no receipt when terminal-control cannot prove
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
        fs::write(self.dir.join("receipt.json"), json!({"v": 1, "outcome": outcome, "outboxPresent": outbox_present}).to_string()).unwrap();
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
    for outcome in ["timeout", "cancelled", "gate-lost", "carrier-lost", "abandoned-not-started", "abandoned-before-brief"] {
        let case = case(&format!("rs-{outcome}"), "true");
        case.receipt(outcome, true);
        assert_eq!(case.run(), StepsOutcome::Done(vec!["settle-attempt".into(), "release-slot".into()]), "{outcome}");
        assert_eq!(case.release_detail().unwrap()["disposition"], "retain", "{outcome}");
        assert!(case.herdr.calls_starting("pane close").is_empty(), "{outcome}: the pane stays");
    }
}

#[test]
fn an_earlier_step_without_a_receipt_keeps_the_pane_and_its_failure_is_the_one_reported() {
    let case = case("rs-step-failed", "exit 3");
    case.receipt("exited", true);
    assert_eq!(case.run(), StepsOutcome::Failed { step_id: "settle-attempt".into(), reason: "step exited 3".into() });
    assert!(!case.dir.join("steps/settle-attempt.json").exists());
    assert_eq!(case.release_detail().unwrap()["disposition"], "retain");
    assert!(case.herdr.calls_starting("pane close").is_empty());
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
