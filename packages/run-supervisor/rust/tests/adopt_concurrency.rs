//! Two adopters on one attempt: the kernel lock orders them, the second one
//! sees `being-adopted` or `closed`, and a step runs exactly once.
#![cfg(target_os = "linux")]

mod support;

use std::fs;
use std::time::Duration;

use serde_json::json;
use support::adopt_fixture::{adopt_finish, adopt_spawn, attempt, Fixture};
use support::supervisor::{shell_step, wait_until};

/// A fixture whose only step takes `ms` so a second adopter can arrive meanwhile.
fn slow_attempt(name: &str, ms: u64) -> Fixture {
    let a = attempt(name, &[]);
    let script = format!("echo x >> {}/ran-settle-attempt; sleep {}", a.dir.display(), ms as f64 / 1000.0);
    let mut envelope = a.json("envelope.json").unwrap();
    envelope["steps"] = json!([shell_step(&a.dir, "settle-attempt", &script, 20_000)]);
    envelope.as_object_mut().unwrap().remove("digest");
    let digest = fgos_run_supervisor::envelope::digest(&envelope).unwrap();
    envelope["digest"] = json!(digest);
    fs::write(a.path("envelope.json"), envelope.to_string()).unwrap();
    a
}

#[test]
fn adopt_second_adopter_sees_being_adopted_while_the_first_runs_the_steps() {
    let a = slow_attempt("conc-marker", 1_500);
    let dir = a.dir.to_str().unwrap();
    let first = adopt_spawn(&["--run-dir", dir]);
    wait_until(Duration::from_secs(10), "the first adopter's marker", || a.path("adopting.json").exists());
    let marker = a.json("adopting.json").unwrap();
    assert_eq!(marker["attemptId"], a.attempt_id.as_str());

    let second = adopt_spawn(&["--run-dir", dir]);
    let (code, lines) = adopt_finish(second);
    assert_eq!((code, lines[0]["state"].as_str()), (0, Some("being-adopted")), "{lines:?}");
    let probe = adopt_spawn(&["--run-dir", dir, "--probe-only"]);
    assert_eq!(adopt_finish(probe).1[0]["state"], "being-adopted");

    let (code, lines) = adopt_finish(first);
    assert_eq!((code, lines[0]["state"].as_str()), (0, Some("adopted")), "{lines:?}");
    assert_eq!(a.runs_of("settle-attempt"), 1);
    let late = adopt_finish(adopt_spawn(&["--run-dir", dir])).1;
    assert_eq!(late[0]["state"], "closed");
}

#[test]
fn adopt_racing_adopters_leave_exactly_one_winner_and_one_run_of_each_step() {
    for round in 0..3 {
        let a = slow_attempt(&format!("conc-race-{round}"), 300);
        let dir = a.dir.to_str().unwrap();
        let racers: Vec<_> = (0..4).map(|_| adopt_spawn(&["--run-dir", dir])).collect();
        let states: Vec<String> = racers.into_iter().map(|c| adopt_finish(c).1[0]["state"].as_str().unwrap().to_string()).collect();
        assert_eq!(states.iter().filter(|s| *s == "adopted").count(), 1, "round {round}: {states:?}");
        assert!(states.iter().all(|s| ["adopted", "being-adopted", "running", "closed"].contains(&s.as_str())), "round {round}: {states:?}");
        assert_eq!(a.runs_of("settle-attempt"), 1, "round {round}");
        assert!(a.path("closed.json").exists());
    }
}
