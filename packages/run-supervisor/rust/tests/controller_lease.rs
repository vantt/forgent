//! The run control ledger (`controller::lease`) against the vectors recorded from the Node ledger
//! (`contracts/controller/lease.v1.json`), plus the reclaim of a holder this machine proves dead.

use fgos_run_supervisor::controller::lease::*;
use serde_json::{json, Value};
use std::path::{Path, PathBuf};

const VECTOR: &str = include_str!("../../contracts/controller/lease.v1.json");

fn scratch(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "fgos-controller-lease-{name}-{}",
        std::process::id()
    ));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

/// A holder record of a process that ran on this machine and is gone: the judge proves it dead.
fn dead_holder(id: &str) -> Value {
    let mut child = std::process::Command::new(std::env::current_exe().unwrap())
        .arg("--list")
        .stdout(std::process::Stdio::null())
        .spawn()
        .unwrap();
    let pid = child.id();
    let tuple = fgos_process::facts::identity_of_child(fgos_process::ProcId(pid))
        .expect("child identity while alive");
    child.wait().unwrap();
    let mut holder = tuple.to_record().to_json();
    holder["id"] = id.into();
    holder["processStartTime"] = tuple.start_time.as_str().into();
    holder
}

fn outcome_json(outcome: &AcquireOutcome, tokens: &mut Vec<(String, String)>, name: &str) -> Value {
    match outcome {
        AcquireOutcome::Acquired {
            control_epoch,
            control_token,
        } => {
            tokens.push((name.to_string(), control_token.clone()));
            json!({"status": "acquired", "controlEpoch": control_epoch, "controlToken": format!("<{name}>")})
        }
        AcquireOutcome::Held {
            control_epoch,
            holder,
        } => json!({"status": "held", "controlEpoch": control_epoch, "holder": holder}),
        AcquireOutcome::Stale { control_epoch } => {
            json!({"status": "stale", "controlEpoch": control_epoch})
        }
        AcquireOutcome::Settled { control_epoch } => {
            json!({"status": "settled", "controlEpoch": control_epoch})
        }
    }
}

fn token<'a>(tokens: &'a [(String, String)], name: &str) -> &'a str {
    &tokens.iter().find(|(n, _)| n == name).unwrap().1
}

#[test]
fn the_ledger_answers_every_recorded_step_as_the_node_ledger_did() {
    let vector: Value = serde_json::from_str(VECTOR).unwrap();
    let holders = &vector["holders"];
    let dead = dead_holder("dead");
    let run_dir = scratch("steps");
    let mut tokens: Vec<(String, String)> = Vec::new();
    let expected: Vec<(&str, &Value)> = vector["steps"]
        .as_array()
        .unwrap()
        .iter()
        .map(|s| (s["name"].as_str().unwrap(), &s["out"]))
        .collect();

    let acquire = |holder: &Value, now: u64, ttl: Option<u64>, fence: Option<Option<u64>>| {
        acquire_run_control(
            &run_dir,
            &AcquireOptions {
                holder: holder.clone(),
                purpose: Some("unit".into()),
                expected_control_epoch: fence,
                ttl_ms: ttl,
                now: Some(now),
            },
        )
        .unwrap()
    };
    let inspect_json = |state: RunControlState| {
        let mut out = json!({"held": state.held});
        if state.settled {
            out["settled"] = true.into();
        }
        if let Some(epoch) = state.control_epoch {
            out["controlEpoch"] = epoch.into();
        }
        if let Some(holder) = state.holder {
            out["holder"] = holder;
        }
        out
    };
    let release_json = |outcome: ReleaseOutcome| json!({"status": outcome.as_str()});
    let settle_json = |outcome: SettleOutcome| match outcome {
        SettleOutcome::Settled { control_epoch } => {
            json!({"status": "settled", "controlEpoch": control_epoch})
        }
        SettleOutcome::Superseded { control_epoch } => {
            json!({"status": "superseded", "controlEpoch": control_epoch})
        }
        SettleOutcome::AlreadySettled { control_epoch } => {
            json!({"status": "already-settled", "controlEpoch": control_epoch})
        }
    };

    let mut actual: Vec<(&str, Value)> = Vec::new();
    let out = acquire(&holders["A"], 1000, None, None);
    actual.push(("acquire-first", outcome_json(&out, &mut tokens, "t1")));
    actual.push((
        "acquire-while-held",
        outcome_json(&acquire(&holders["B"], 2000, None, None), &mut tokens, "x"),
    ));
    actual.push((
        "acquire-stale-fence",
        outcome_json(
            &acquire(&holders["B"], 2000, None, Some(Some(5))),
            &mut tokens,
            "x",
        ),
    ));
    actual.push((
        "acquire-fresh-heartbeat",
        outcome_json(
            &acquire(&holders["B"], 2000, Some(5000), None),
            &mut tokens,
            "x",
        ),
    ));
    actual.push((
        "inspect-held",
        inspect_json(inspect_run_control(&run_dir).unwrap()),
    ));
    actual.push((
        "is-current",
        json!(is_run_control_current(&run_dir, 1, token(&tokens, "t1")).unwrap()),
    ));
    actual.push((
        "release-unknown-generation",
        release_json(release_run_control(&run_dir, 9, "x", Some(3000)).unwrap()),
    ));
    actual.push((
        "release-token-mismatch",
        release_json(release_run_control(&run_dir, 1, "x", Some(3000)).unwrap()),
    ));
    actual.push((
        "release",
        release_json(release_run_control(&run_dir, 1, token(&tokens, "t1"), Some(3000)).unwrap()),
    ));
    actual.push((
        "release-again",
        release_json(release_run_control(&run_dir, 1, token(&tokens, "t1"), Some(3000)).unwrap()),
    ));
    actual.push((
        "inspect-released",
        inspect_json(inspect_run_control(&run_dir).unwrap()),
    ));
    actual.push((
        "acquire-after-release",
        outcome_json(&acquire(&dead, 4000, None, None), &mut tokens, "t2"),
    ));
    actual.push((
        "inspect-dead-holder",
        inspect_json(inspect_run_control(&run_dir).unwrap()),
    ));
    actual.push((
        "acquire-reclaim-dead",
        outcome_json(&acquire(&holders["B"], 5000, None, None), &mut tokens, "t3"),
    ));
    actual.push((
        "settle-superseded",
        settle_json(settle_run_control(&run_dir, 2, token(&tokens, "t2"), Some(6000)).unwrap()),
    ));
    actual.push((
        "settle",
        settle_json(settle_run_control(&run_dir, 3, token(&tokens, "t3"), Some(6000)).unwrap()),
    ));
    actual.push((
        "settle-again",
        settle_json(settle_run_control(&run_dir, 3, token(&tokens, "t3"), Some(6000)).unwrap()),
    ));
    actual.push((
        "inspect-settled",
        inspect_json(inspect_run_control(&run_dir).unwrap()),
    ));
    actual.push((
        "acquire-after-settled",
        outcome_json(&acquire(&holders["A"], 7000, None, None), &mut tokens, "x"),
    ));

    assert_eq!(actual.len(), expected.len());
    for ((name, got), (want_name, want)) in actual.iter().zip(expected) {
        assert_eq!(*name, want_name);
        assert_eq!(got, want, "step {name}");
    }

    // The files Rust published read back as the files Node published (token and dead holder normalised).
    let t1 = token(&tokens, "t1").to_string();
    let t3 = token(&tokens, "t3").to_string();
    for (rel, want) in vector["files"].as_object().unwrap() {
        if want["holder"]["dead"] == true {
            continue;
        }
        let mut got: Value =
            serde_json::from_str(&std::fs::read_to_string(run_dir.join(rel)).unwrap()).unwrap();
        let text = got["controlToken"].as_str().unwrap().to_string();
        got["controlToken"] = if text == t1 {
            "<t1>".into()
        } else if text == t3 {
            "<t3>".into()
        } else {
            text.into()
        };
        assert_eq!(&got, want, "file {rel}");
    }
}

#[test]
fn a_holder_judged_dead_is_reclaimed_and_a_live_one_never_is() {
    let run_dir = scratch("reclaim");
    let live = build_run_control_holder("live");
    assert!(live["pid"].as_u64().is_some() && live["processStartTime"].is_string());
    let first = acquire_run_control(
        &run_dir,
        &AcquireOptions {
            holder: live.clone(),
            purpose: Some("unit".into()),
            ..Default::default()
        },
    )
    .unwrap();
    assert!(matches!(
        first,
        AcquireOutcome::Acquired {
            control_epoch: 1,
            ..
        }
    ));
    let again = acquire_run_control(
        &run_dir,
        &AcquireOptions {
            holder: live,
            purpose: Some("unit".into()),
            ttl_ms: Some(0),
            now: Some(u64::MAX / 4),
            ..Default::default()
        },
    )
    .unwrap();
    assert!(
        matches!(
            again,
            AcquireOutcome::Held {
                control_epoch: 1,
                ..
            }
        ),
        "a stale heartbeat never reclaims a live pid: {again:?}"
    );
    let run_dir = scratch("reclaim-dead");
    let _ = acquire_run_control(
        &run_dir,
        &AcquireOptions {
            holder: dead_holder("gone"),
            ..Default::default()
        },
    )
    .unwrap();
    let state = inspect_run_control(&run_dir).unwrap();
    assert!(!state.held);
    let taken = acquire_run_control(
        &run_dir,
        &AcquireOptions {
            holder: build_run_control_holder("next"),
            ..Default::default()
        },
    )
    .unwrap();
    assert!(matches!(
        taken,
        AcquireOutcome::Acquired {
            control_epoch: 2,
            ..
        }
    ));
}

#[test]
fn two_contenders_for_one_epoch_publish_exactly_one_record() {
    let run_dir = scratch("race");
    let dir = control_dirs(&run_dir).generations_dir;
    let published: Vec<bool> = std::thread::scope(|scope| {
        let handles: Vec<_> = (0..8)
            .map(|_| {
                let dir = dir.clone();
                scope.spawn(move || {
                    matches!(
                        publish_next_generation(&dir, |current, _| if current.is_some() {
                            Decision::Stop(())
                        } else {
                            Decision::Record(json!({"n": 1}))
                        })
                        .unwrap(),
                        Published::Published { .. }
                    )
                })
            })
            .collect();
        handles.into_iter().map(|h| h.join().unwrap()).collect()
    });
    assert_eq!(published.iter().filter(|p| **p).count(), 1);
    assert_eq!(list_generations(Path::new(&dir)).unwrap().len(), 1);
}
