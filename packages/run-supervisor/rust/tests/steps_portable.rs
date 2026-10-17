//! The step runner on every OS: a step that hangs is killed, a step gets the
//! environment the envelope names and nothing else.

mod portable;

use std::fs;
use std::time::{Duration, Instant};

use fgos_run_supervisor::steps::{run_steps, StepsOutcome};
use portable::supervisor::step;
use portable::{pid_in, wait_dead};
use serde_json::{json, Value};

fn attempt(name: &str) -> (std::path::PathBuf, Value) {
    let dir = std::env::temp_dir().join(format!("fgos-steps-portable-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    (dir, json!({"attemptId": format!("att-{name}"), "steps": []}))
}

#[test]
fn a_step_that_hangs_is_killed_at_its_timeout_and_leaves_no_receipt() {
    let (dir, mut envelope) = attempt("hang");
    let pidfile = dir.join("step.pid").to_string_lossy().into_owned();
    envelope["steps"] = json!([step(&dir, "settle-attempt", &["step-sleep", &pidfile], 1_500)]);
    let started = Instant::now();
    let outcome = run_steps(&envelope, &dir);
    assert!(matches!(&outcome, StepsOutcome::Failed { step_id, reason } if step_id == "settle-attempt" && reason.contains("stepTimeoutMs")), "{outcome:?}");
    assert!(started.elapsed() < Duration::from_secs(20));
    assert!(!dir.join("steps").join("settle-attempt.json").exists());
    assert!(wait_dead(pid_in(&dir.join("step.pid")), Duration::from_secs(10)), "the hung step is gone");
}

#[test]
fn a_step_gets_exactly_the_environment_the_envelope_names() {
    std::env::set_var("FGOS_STEP_LEAK_CHECK", "leaked");
    let (dir, mut envelope) = attempt("env");
    let out = dir.join("env.txt").to_string_lossy().into_owned();
    let mut spec = step(&dir, "settle-attempt", &["step-env", &out], 20_000);
    spec["env"] = json!({"FGOS_STEP_ONLY": "yes", "SystemRoot": std::env::var("SystemRoot").unwrap_or_default()});
    envelope["steps"] = json!([spec]);
    assert!(matches!(run_steps(&envelope, &dir), StepsOutcome::Done(_)));
    let names = fs::read_to_string(dir.join("env.txt")).unwrap();
    assert!(names.lines().any(|n| n == "FGOS_STEP_ONLY"), "{names}");
    assert!(!names.lines().any(|n| n == "FGOS_STEP_LEAK_CHECK"), "the caller's environment leaked: {names}");
}

#[test]
fn a_step_with_a_receipt_is_not_run_again() {
    let (dir, mut envelope) = attempt("skip");
    let ran = dir.join("ran").to_string_lossy().into_owned();
    envelope["steps"] = json!([step(&dir, "settle-attempt", &["step-write", &ran, "x"], 20_000)]);
    assert!(matches!(run_steps(&envelope, &dir), StepsOutcome::Done(_)));
    assert!(matches!(run_steps(&envelope, &dir), StepsOutcome::Done(_)));
    assert_eq!(fs::read_to_string(dir.join("ran")).unwrap().lines().count(), 1);
}
