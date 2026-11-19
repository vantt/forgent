//! The machine's lane pool: a top-level worker seat takes one lane before its agent starts and frees it with its
//! supervisor; a session, an envelope without `lanes` and an unarmed pool take none.
#![cfg(target_os = "linux")]

mod support;

use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use fgos_holder_lock::{acquire, Acquire, Handle, Mode, Resource, Wait};
use fgos_process::control::{signal_by_identity, Signal};
use fgos_process::facts;
use fgos_process::ProcId;
use fgos_run_supervisor::lanes::{self, Lane, TakeError};
use serde_json::{json, Value};
use support::supervisor::*;
use support::*;

/// A state root of its own; the supervisor and this test both resolve the lane directory under it.
fn state_root(name: &str) -> PathBuf {
    let root = std::env::temp_dir().join(format!("fgos-lanes-{name}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&root);
    std::fs::create_dir_all(&root).unwrap();
    root
}

fn lock_root(root: &Path) -> PathBuf {
    root.join("locks")
}

fn env_of_root(root: &Path) -> Vec<(String, String)> {
    vec![(
        "FGOS_STATE_ROOT".into(),
        root.to_string_lossy().into_owned(),
    )]
}

/// Hold seat `k` the way a seat of the pool is held.
fn hold(root: &Path, k: u64) -> Handle {
    let dir = lock_root(root).join("lane");
    std::fs::create_dir_all(&dir).unwrap();
    match acquire(
        &Resource::new("lane", dir.join(format!("{k}.lock"))),
        Mode::Ex,
        Wait::Try,
        0,
    ) {
        Acquire::Acquired(handle) => handle,
        other => panic!("seat {k} not taken: {other:?}"),
    }
}

fn with_lanes(ceiling: Value, wait_ms: u64) -> impl FnOnce(&mut Value) {
    move |envelope| envelope["lanes"] = json!({"ceiling": ceiling, "waitMs": wait_ms})
}

#[test]
fn a_full_pool_ends_a_top_level_attempt_not_started_after_it_waited() {
    let root = state_root("full");
    let (_a, _b) = (hold(&root, 0), hold(&root, 1));
    let mut run = SupRun::new_with("lane-full", &RunOpts::agent(500), with_lanes(json!(2), 400));
    let started = Instant::now();
    let child = run.start_with_env(&env_of_root(&root));
    let (code, line) = finish(child, Duration::from_secs(30));
    assert_eq!(code, 0, "{line} {}", run.log());
    assert!(
        started.elapsed() >= Duration::from_millis(400),
        "it waited the whole wait"
    );
    assert_eq!(line["outcome"], "abandoned-not-started", "{line}");
    let refusal = run.json("start-refused.json").expect("start-refused.json");
    assert_eq!(refusal["code"], "lane-pool-full");
    assert_eq!(refusal["why"], "2 seats are held on this machine");
    assert!(
        !run.path("agent-binding.json").exists(),
        "no agent was started"
    );
}

#[test]
fn a_seat_freed_during_the_wait_lets_the_attempt_start_and_hold_it_until_it_ends() {
    let Some(_driver) = bwrap_driver("lane-freed") else {
        return;
    };
    let root = state_root("freed");
    let seat = hold(&root, 0);
    let mut run = SupRun::new_with(
        "lane-freed",
        &RunOpts::agent(1_500),
        with_lanes(json!(1), 20_000),
    );
    let child = run.start_with_env(&env_of_root(&root));
    std::thread::sleep(Duration::from_millis(400));
    assert!(
        !run.path("agent-binding.json").exists(),
        "still waiting for a lane"
    );
    drop(seat);
    wait_until(Duration::from_secs(30), "the agent to start", || {
        run.path("agent-binding.json").exists()
    });
    assert_eq!(
        lanes::snapshot(&lock_root(&root), 1).live,
        1,
        "the attempt holds the freed seat"
    );
    let (code, line) = finish(child, Duration::from_secs(60));
    assert_eq!(code, 0, "{line} {}", run.log());
    assert_ne!(line["outcome"], "abandoned-not-started", "{line}");
    assert_eq!(
        lanes::snapshot(&lock_root(&root), 1).live,
        0,
        "the lane went with the supervisor"
    );
}

#[test]
fn an_envelope_without_lanes_starts_with_every_seat_held() {
    let Some(_driver) = bwrap_driver("lane-none") else {
        return;
    };
    let root = state_root("none");
    let _seats = [hold(&root, 0), hold(&root, 1)];
    let mut run = SupRun::new("lane-none", &RunOpts::agent(300));
    let child = run.start_with_env(&env_of_root(&root));
    let (code, line) = finish(child, Duration::from_secs(60));
    assert_eq!(code, 0, "{line} {}", run.log());
    assert_ne!(line["outcome"], "abandoned-not-started", "{line}");
    assert!(!run.path("start-refused.json").exists());
}

#[test]
fn a_session_envelope_names_no_lane_even_when_it_carries_the_field() {
    let session = json!({"session": {"role": "head:planner-probe", "verbs": []}, "lanes": {"ceiling": 1, "waitMs": 0}});
    assert_eq!(lanes::config_of(&session), None);
    let top = json!({"lanes": {"ceiling": 1, "waitMs": 250}});
    assert_eq!(
        lanes::config_of(&top),
        Some(lanes::LaneConfig {
            ceiling: Some(1),
            wait_ms: 250
        })
    );
    assert_eq!(lanes::config_of(&json!({})), None);
}

#[test]
fn a_supervisor_killed_with_sigkill_frees_its_lane() {
    let Some(_driver) = bwrap_driver("lane-kill") else {
        return;
    };
    let root = state_root("kill");
    let mut run = SupRun::new_with("lane-kill", &RunOpts::agent(3_000), with_lanes(json!(1), 0));
    let supervisor = run.start_with_env(&env_of_root(&root));
    let tuple = facts::identity_of(ProcId(supervisor.id())).expect("supervisor identity");
    wait_until(Duration::from_secs(30), "the agent binding", || {
        run.path("agent-binding.json").exists()
    });
    assert_eq!(lanes::snapshot(&lock_root(&root), 1).live, 1);
    signal_by_identity(&tuple, Signal::Kill);
    let mut supervisor = supervisor;
    let _ = supervisor.wait();
    assert_eq!(
        lanes::snapshot(&lock_root(&root), 1).live,
        0,
        "neither the gate nor the agent inherited the lane"
    );
    wait_until(
        Duration::from_secs(30),
        "the gate to end the attempt",
        || run.path("gate-exit.json").exists(),
    );
}

#[test]
fn lowering_the_ceiling_keeps_the_live_seats_above_it_counted() {
    let root = state_root("lowered");
    let lock_root = lock_root(&root);
    let taken: Vec<Lane> = (0..3)
        .map(|_| lanes::take(&lock_root, Some(3), 0).unwrap())
        .collect();
    assert_eq!(
        lanes::take(&lock_root, Some(3), 0).unwrap_err(),
        TakeError::PoolFull(lanes::LanePoolFull { ceiling: 3 })
    );
    let lowered = lanes::snapshot(&lock_root, 1);
    assert_eq!((lowered.ceiling, lowered.live, lowered.free), (1, 3, 0));
    assert_eq!(
        lowered.seats.iter().map(|s| s.k).collect::<Vec<_>>(),
        vec![0, 1, 2]
    );
    let raised = lanes::snapshot(&lock_root, 5);
    assert_eq!((raised.live, raised.free), (3, 2));
    drop(taken);
    assert_eq!(lanes::snapshot(&lock_root, 3).live, 0);
}

#[test]
fn a_null_ceiling_takes_no_lock_and_touches_no_file() {
    let root = state_root("null");
    let lane = lanes::take(&lock_root(&root), None, 5_000).unwrap();
    assert!(matches!(lane, Lane::None));
    assert!(!lock_root(&root).join("lane").exists());
    let envelope = json!({"lanes": {"ceiling": null, "waitMs": 5000}});
    assert!(matches!(
        lanes::take_for(&lock_root(&root), &envelope).unwrap(),
        Lane::None
    ));
    assert!(!lock_root(&root).join("lane").exists());
}

#[test]
fn an_adopted_worker_holds_a_lane_and_a_full_pool_reports_lane_pool_over() {
    let root = state_root("adopt");
    let lock_root = lock_root(&root);
    let envelope = json!({"lanes": {"ceiling": 1, "waitMs": 0}});
    let (lane, note) = lanes::adopt(&lock_root, Some(&envelope));
    assert!(matches!(lane, Lane::Held { k: 0, .. }));
    assert_eq!(note, None);
    assert_eq!(
        lanes::snapshot(&lock_root, 1).live,
        1,
        "the adopted worker is counted"
    );
    let (over, note) = lanes::adopt(&lock_root, Some(&envelope));
    assert!(matches!(over, Lane::None));
    assert_eq!(note, Some("lane-pool-over"));
    assert_eq!(
        lanes::snapshot(&lock_root, 1).live,
        1,
        "nothing was taken from the holder"
    );
    drop(lane);
    // An envelope without the field takes nothing.
    let (none, note) = lanes::adopt(&lock_root, Some(&json!({})));
    assert!(matches!(none, Lane::None) && note.is_none());
}

/// Rewrites the fixture's envelope with a lane pool of `ceiling` seats, digest kept valid.
fn name_lane_pool(a: &support::adopt_fixture::Fixture, ceiling: u64) {
    let mut envelope = a.json("envelope.json").expect("envelope.json");
    envelope["lanes"] = json!({"ceiling": ceiling, "waitMs": 0});
    envelope["digest"] = Value::Null;
    envelope["digest"] = json!(fgos_run_supervisor::envelope::digest(&envelope).unwrap());
    std::fs::write(a.path("envelope.json"), envelope.to_string()).unwrap();
}

fn adopt_with_state_root(root: &Path, dir: &Path) -> Value {
    let child = std::process::Command::new(internal_harness())
        .args(["internal", "adopt", "--protocol", "1", "--run-dir"])
        .arg(dir)
        .env_clear()
        .env("FGOS_STATE_ROOT", root)
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::piped())
        .spawn()
        .unwrap();
    let (code, mut lines) = support::adopt_fixture::adopt_finish(child);
    assert_eq!(code, 0, "{lines:?}");
    lines.remove(0)
}

#[test]
fn the_adopt_door_takes_a_lane_for_a_live_worker_and_a_full_pool_reports_lane_pool_over() {
    use support::adopt_fixture::{attempt, dead_tuple, live_process};
    let root = state_root("adopt-door");
    let seat = hold(&root, 0);
    let a = attempt("lane-adopt-door", &["settle-attempt"]);
    let (mut agent, tuple) = live_process();
    a.bind(&dead_tuple());
    a.best_effort_agent(&tuple);
    a.gate_exit("agent");
    name_lane_pool(&a, 1);
    let line = adopt_with_state_root(&root, &a.dir);
    assert_eq!(line["lane"], "lane-pool-over", "{line}");
    let _ = agent.wait();
    drop(seat);

    // With a free seat the adopter takes it and reports nothing.
    let free_root = state_root("adopt-door-free");
    let b = attempt("lane-adopt-door-free", &["settle-attempt"]);
    let (mut agent, tuple) = live_process();
    b.bind(&dead_tuple());
    b.best_effort_agent(&tuple);
    b.gate_exit("agent");
    name_lane_pool(&b, 1);
    let line = adopt_with_state_root(&free_root, &b.dir);
    assert!(line.get("lane").is_none(), "{line}");
    let _ = agent.wait();
    assert_eq!(lanes::snapshot(&lock_root(&free_root), 1).live, 0);
}

#[test]
fn the_adopt_door_takes_no_lane_for_a_worker_the_lock_admission_ended_and_a_full_pool_does_not_refuse_it(
) {
    use support::adopt_fixture::{attempt, dead_tuple, live_process};
    let root = state_root("adopt-door-orphan");
    let seat = hold(&root, 0);
    let a = attempt("lane-adopt-door-orphan", &["settle-attempt"]);
    // A dead gate left its domain behind: the recorded process still lives until the lock's admission ends it.
    let (mut orphan, tuple) = live_process();
    a.bind_domain(
        &dead_tuple(),
        &fgos_holder_lock::predecessor::domain_json(&fgos_process::Domain::LinuxGate(
            tuple.clone(),
        )),
    );
    a.declare(&tuple);
    a.gate_exit("agent");
    name_lane_pool(&a, 1);
    let line = adopt_with_state_root(&root, &a.dir);
    assert_eq!(line["state"], "adopted", "{line}");
    assert!(
        line.get("lane").is_none(),
        "a worker the admission ended takes no lane, so a full pool reports nothing: {line}"
    );
    assert!(
        !orphan.wait().unwrap().success(),
        "the admission ended the domain"
    );
    drop(seat);
}

#[test]
fn a_seat_gives_back_the_lane_wait_it_did_not_spend() {
    let armed = json!({"lanes": {"ceiling": 4, "waitMs": 900_000}});
    let ms = Duration::from_millis;
    assert_eq!(
        lanes::unused_wait(&armed, ms(0)),
        ms(900_000),
        "a free lane at once keeps the bare budget"
    );
    assert_eq!(
        lanes::unused_wait(&armed, ms(30_000)),
        ms(870_000),
        "a waited lane keeps the time waited"
    );
    assert_eq!(lanes::unused_wait(&armed, ms(950_000)), ms(0));
    let unarmed = json!({"lanes": {"ceiling": null, "waitMs": 900_000}});
    assert_eq!(
        lanes::unused_wait(&unarmed, ms(0)),
        ms(0),
        "an unarmed pool added no wait"
    );
    assert_eq!(
        lanes::unused_wait(&json!({}), ms(0)),
        ms(0),
        "no lanes field added no wait"
    );
    let session = json!({"session": {"id": "s"}, "lanes": {"ceiling": 4, "waitMs": 900_000}});
    assert_eq!(
        lanes::unused_wait(&session, ms(0)),
        ms(0),
        "a session takes no lane"
    );
}
