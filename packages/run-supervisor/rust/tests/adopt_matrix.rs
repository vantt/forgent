//! The recovery matrix of the adopt door, each row on a real attempt directory
//! with a real kernel lock, driven through the route as the host runs it.
#![cfg(target_os = "linux")]

mod support;

use std::fs;

use serde_json::json;
use support::adopt_fixture::{adopt, attempt, dead_tuple, hold_lock, live_process, lock_is_free};

const STEPS: [&str; 2] = ["settle-attempt", "finalize-home"];

#[test]
fn adopt_no_binding_and_no_receipt_is_abandoned_not_started_and_the_steps_run_once() {
    let a = attempt("matrix-unbound", &STEPS);
    let first = adopt(&a.dir, &[]);
    assert_eq!(first["state"], "adopted", "{first}");
    assert_eq!(first["outcome"], "abandoned-not-started");
    let receipt = a.json("receipt.json").unwrap();
    assert_eq!(receipt["outcome"], "abandoned-not-started");
    assert_eq!(receipt["synthesizedBy"], "adopt");
    assert!(receipt.get("gateExit").is_none());
    assert_eq!(a.json("closed.json").unwrap()["closedBy"], "adopt");
    assert!(!a.path("adopting.json").exists(), "the marker goes with the lock");
    assert!(lock_is_free(&a.dir));
    assert_eq!((a.runs_of("settle-attempt"), a.runs_of("finalize-home")), (1, 1));

    let again = adopt(&a.dir, &[]);
    assert_eq!(again["state"], "closed");
    assert_eq!((a.runs_of("settle-attempt"), a.runs_of("finalize-home")), (1, 1), "no step ran again");
}

#[test]
fn adopt_names_why_a_supervisor_never_bound() {
    let a = attempt("matrix-start-refused", &STEPS);
    let note = json!({"v": 1, "attemptId": a.attempt_id, "code": "lock-held", "why": "attempt: kernel-lock-held", "at": "2026-10-18T00:00:00.000Z"});
    fs::write(a.path("start-refused.json"), serde_json::to_vec(&note).unwrap()).unwrap();

    let probe = adopt(&a.dir, &["--probe-only"]);
    assert_eq!((probe["state"].as_str(), probe["reason"].as_str()), (Some("needs-adopt"), Some("start-refused:lock-held")), "{probe}");

    let adopted = adopt(&a.dir, &[]);
    assert_eq!(adopted["state"], "adopted", "{adopted}");
    assert_eq!(adopted["outcome"], "abandoned-not-started");
    assert_eq!(adopted["reason"], "start-refused:lock-held");
    assert_eq!(a.json("receipt.json").unwrap()["reason"], "start-refused:lock-held");
}

#[test]
fn adopt_ignores_a_start_refusal_of_another_attempt() {
    let a = attempt("matrix-start-refused-other", &STEPS);
    let note = json!({"v": 1, "attemptId": "att_someone_else", "code": "lock-held", "why": "x", "at": "2026-10-18T00:00:00.000Z"});
    fs::write(a.path("start-refused.json"), serde_json::to_vec(&note).unwrap()).unwrap();
    let adopted = adopt(&a.dir, &[]);
    assert_eq!(adopted["state"], "adopted", "{adopted}");
    assert!(adopted.get("reason").is_none(), "{adopted}");
}

#[test]
fn adopt_a_binding_without_gate_exit_is_gate_lost_and_records_the_outbox() {
    for (name, outbox) in [("matrix-lost-bare", false), ("matrix-lost-outbox", true)] {
        let a = attempt(name, &STEPS);
        a.bind(&dead_tuple());
        if outbox {
            a.outbox_result();
        }
        let line = adopt(&a.dir, &[]);
        assert_eq!(line["state"], "adopted", "{line}");
        assert_eq!(line["outcome"], "gate-lost");
        let receipt = a.json("receipt.json").unwrap();
        assert_eq!(receipt["outcome"], "gate-lost");
        assert_eq!(receipt["outboxPresent"], outbox);
        assert_eq!(receipt["synthesizedBy"], "adopt");
    }
}

#[test]
fn adopt_a_gate_exit_without_receipt_becomes_the_receipt() {
    for (stopped_by, outcome) in [("agent", "exited"), ("idle", "timeout"), ("hard-ceiling", "timeout"), ("cancel", "cancelled")] {
        let a = attempt(&format!("matrix-exit-{stopped_by}"), &STEPS);
        a.bind(&dead_tuple());
        a.gate_exit(stopped_by);
        a.outbox_result();
        let line = adopt(&a.dir, &[]);
        assert_eq!(line["outcome"], outcome, "{line}");
        let receipt = a.json("receipt.json").unwrap();
        assert_eq!(receipt["gateExit"]["stoppedBy"], stopped_by);
        assert_eq!(receipt["outboxPresent"], true, "the outbox is recorded whatever stopped the gate");
        assert_eq!(receipt["synthesizedBy"], "adopt");
    }
}

#[test]
fn adopt_a_receipt_that_exists_stands_and_only_the_missing_steps_run() {
    let a = attempt("matrix-receipt", &STEPS);
    a.bind(&dead_tuple());
    let receipt = json!({"v": 1, "attemptId": a.attempt_id, "outcome": "exited", "captureDigests": {"stdout": null, "stderr": null}, "outboxPresent": true, "synthesizedBy": "supervisor", "publishedAt": "2026-10-18T00:00:00.000Z"});
    fs::write(a.path("receipt.json"), receipt.to_string()).unwrap();
    fs::create_dir_all(a.path("steps")).unwrap();
    fs::write(a.path("steps/settle-attempt.json"), "{}").unwrap();
    let line = adopt(&a.dir, &[]);
    assert_eq!(line["state"], "adopted");
    assert_eq!(line["outcome"], "exited");
    assert_eq!(a.json("receipt.json").unwrap()["synthesizedBy"], "supervisor", "the receipt was not rewritten");
    assert_eq!((a.runs_of("settle-attempt"), a.runs_of("finalize-home")), (0, 1));
}

#[test]
fn adopt_a_step_that_asks_for_a_retry_leaves_the_attempt_open_for_the_next_adopter() {
    let a = attempt("matrix-retry", &[]);
    // Rewrite the envelope with a step that retries until a flag file exists.
    let flag = a.path("go-ahead");
    let script = format!("if [ -e {0} ]; then echo x >> {1}/ran-settle-attempt; else echo '{{\"result\":\"retry\",\"reason\":\"not-yet\"}}'; exit 75; fi", flag.display(), a.dir.display());
    let mut envelope: serde_json::Value = a.json("envelope.json").unwrap();
    envelope["steps"] = json!([support::supervisor::shell_step(&a.dir, "settle-attempt", &script, 10_000)]);
    envelope.as_object_mut().unwrap().remove("digest");
    let digest = fgos_run_supervisor::envelope::digest(&envelope).unwrap();
    envelope["digest"] = json!(digest);
    fs::write(a.path("envelope.json"), envelope.to_string()).unwrap();

    let first = adopt(&a.dir, &[]);
    assert_eq!(first["state"], "open", "{first}");
    assert_eq!(first["pendingStep"], "settle-attempt");
    assert_eq!(first["reason"], "not-yet");
    assert!(!a.path("closed.json").exists() && a.path("receipt.json").exists());
    assert!(lock_is_free(&a.dir) && !a.path("adopting.json").exists());

    fs::write(&flag, "").unwrap();
    let second = adopt(&a.dir, &[]);
    assert_eq!(second["state"], "adopted", "{second}");
    assert_eq!(a.runs_of("settle-attempt"), 1);
}

#[test]
fn adopt_a_held_lock_is_running_and_an_adopting_marker_makes_it_being_adopted() {
    let a = attempt("matrix-held", &STEPS);
    let _lock = hold_lock(&a.dir);
    let before = a.snapshot();
    assert_eq!(adopt(&a.dir, &[])["state"], "running");
    assert_eq!(adopt(&a.dir, &["--probe-only"])["state"], "running");
    fs::write(a.path("adopting.json"), "{}").unwrap();
    let before_marker = a.snapshot();
    assert_eq!(adopt(&a.dir, &[])["state"], "being-adopted");
    assert_eq!(a.snapshot(), before_marker, "nothing changed");
    fs::remove_file(a.path("adopting.json")).unwrap();
    assert_eq!(a.snapshot(), before);
    assert_eq!((a.runs_of("settle-attempt"), a.runs_of("finalize-home")), (0, 0));
}

#[test]
fn adopt_a_run_dir_without_the_v3_layout_is_legacy_and_nothing_changes() {
    let none = attempt("matrix-legacy-nolock", &STEPS);
    fs::remove_file(none.path("attempt.lock")).unwrap();
    let before = none.snapshot();
    assert_eq!(adopt(&none.dir, &[])["state"], "legacy-run");
    assert_eq!(none.snapshot(), before);

    let old = attempt("matrix-legacy-v2", &STEPS);
    let mut envelope = old.json("envelope.json").unwrap();
    envelope["v"] = json!(2);
    fs::write(old.path("envelope.json"), envelope.to_string()).unwrap();
    let before = old.snapshot();
    assert_eq!(adopt(&old.dir, &[])["state"], "legacy-run");
    assert_eq!(old.snapshot(), before);
}

#[test]
fn adopt_probe_only_reports_without_writing_or_running_anything() {
    let a = attempt("matrix-probe", &STEPS);
    a.bind(&dead_tuple());
    a.gate_exit("agent");
    let before = a.snapshot();
    let line = adopt(&a.dir, &["--probe-only"]);
    assert_eq!(line["state"], "needs-adopt", "{line}");
    assert_eq!(a.snapshot(), before);

    let (mut child, tuple) = live_process();
    a.bind(&tuple);
    let before = a.snapshot();
    let line = adopt(&a.dir, &["--probe-only"]);
    assert_eq!((line["state"].as_str(), line["reason"].as_str()), (Some("running"), Some("domain-not-empty")));
    assert_eq!(a.snapshot(), before);
    child.kill().unwrap();
    child.wait().unwrap();
}

#[test]
fn adopt_a_domain_that_a_dead_gate_left_behind_is_ended_before_the_attempt_goes_on() {
    let a = attempt("matrix-domain", &STEPS);
    let (mut child, tuple) = live_process();
    a.bind(&tuple);
    a.declare(&tuple);
    a.gate_exit("agent");
    let line = adopt(&a.dir, &[]);
    assert_eq!(line["state"], "adopted", "{line}");
    let status = child.wait().unwrap();
    assert!(!status.success(), "the remaining process of the domain was ended");
    assert!(!a.path("attempt.lock.predecessor.json").exists(), "the record was cleared by the rule");
    assert_eq!(a.runs_of("settle-attempt"), 1);
}

#[test]
fn adopt_a_domain_that_cannot_be_judged_stays_held_and_nothing_else_happens() {
    let a = attempt("matrix-held-domain", &STEPS);
    // A Windows job on Linux: no driver can say it is empty or end it, so it must not count as empty.
    let (mut child, me) = live_process();
    let record = json!({
        "domainKind": "windows-job",
        "domainId": {
            "job": "Local\\fgos-test-job",
            "sessionId": "1",
            "declaredAt": "1",
            "holder": {"host": me.host, "pid": me.pid.0, "startTime": me.start_time},
            "keeper": null,
        },
    });
    a.bind_domain(&record);
    a.declare_record(&record);
    let line = adopt(&a.dir, &["--kill-wait-ms", "100"]);
    assert_eq!((line["state"].as_str(), line["reason"].as_str()), (Some("held"), Some("predecessor-domain-not-empty")), "{line}");
    assert!(!a.path("receipt.json").exists() && !a.path("adopting.json").exists());
    assert_eq!(a.runs_of("settle-attempt"), 0);
    assert!(lock_is_free(&a.dir), "the lock was given back");
    child.kill().unwrap();
    child.wait().unwrap();
}

#[test]
fn adopt_a_declared_domain_without_a_binding_is_not_called_empty() {
    let a = attempt("matrix-declared-only", &STEPS);
    let (mut child, tuple) = live_process();
    a.declare(&tuple);
    let line = adopt(&a.dir, &["--probe-only"]);
    assert_eq!((line["state"].as_str(), line["reason"].as_str()), (Some("running"), Some("domain-not-empty")), "{line}");
    child.kill().unwrap();
    child.wait().unwrap();
}
