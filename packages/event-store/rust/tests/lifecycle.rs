#![cfg(target_os = "linux")]
//! Owning proof of the maintain policy of the lifecycle triggers: what a trigger seals, when a publish is due,
//! and that one failing step does not stop the next.
mod common;
use common::Repo;
use fgos_event_store::{
    append::{append, AppendRequest, EventInput, Positions},
    lifecycle::{maintain, sync_due, Outcome, Policy, Request, Timers},
    seal::oldest_unsealed_age_sec,
    sync::sync_status,
};
use serde_json::json;
use std::{fs, path::PathBuf, time::SystemTime};

struct World {
    repo: Repo,
    state: PathBuf,
    machine: String,
}
impl World {
    fn new() -> Self {
        let repo = Repo::new();
        let state = std::env::temp_dir().join(format!(
            "es-lifecycle-state-{}",
            repo.root.display().to_string().replace('/', "_")
        ));
        fs::create_dir_all(&state).unwrap();
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&state, fs::Permissions::from_mode(0o700)).unwrap();
        let (_, machine) = fgos_identity::machine::mint(&state, "lifecycle-host").unwrap();
        Self {
            repo,
            state,
            machine,
        }
    }
    /// One event whose timestamp is `age_sec` in the past.
    fn add_at(&self, age_sec: u64) {
        let now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        let ts = format!("{}.000Z", chrono_like(now - age_sec));
        append(
            &self.repo.layout,
            &self.repo.registry,
            AppendRequest {
                stream: &self.repo.stream,
                events: &[EventInput {
                    event_type: "work.add".into(),
                    schema_version: 1,
                    payload: json!({"id": age_sec}),
                    ts,
                }],
                cursor: &Positions::new(),
                writer: "writer-one",
                machine: &self.machine,
                held_ranks: &[60],
            },
        )
        .unwrap();
    }
    fn age(&self) -> u64 {
        oldest_unsealed_age_sec(&self.repo.layout, std::slice::from_ref(&self.repo.stream)).unwrap()
    }
    fn run(&self, timers: &Timers, policy: Policy) -> Outcome {
        maintain(&Request {
            cwd: &self.repo.root,
            trusted_main: &self.repo.root,
            state_root: &self.state,
            timers,
            policy,
            held_ranks: &[],
            hot_lock_depth: 0,
            now_sec: SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .unwrap()
                .as_secs_f64(),
        })
    }
}
impl Drop for World {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.state);
    }
}
/// `YYYY-MM-DDTHH:MM:SS` of an epoch second (UTC), without a date crate.
fn chrono_like(secs: u64) -> String {
    let (days, rem) = (secs / 86_400, secs % 86_400);
    let z = days as i64 + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = yoe + era * 400 + i64::from(month <= 2);
    format!(
        "{year:04}-{month:02}-{day:02}T{:02}:{:02}:{:02}",
        rem / 3600,
        rem % 3600 / 60,
        rem % 60
    )
}
fn timers(seal: u64, sync: u64) -> Timers {
    Timers {
        remote: "origin".into(),
        seal_interval_sec: seal,
        sync_interval_sec: sync,
    }
}
const TRIGGER: Policy = Policy {
    shutdown: false,
    end: false,
    dispatched: false,
};

#[test]
fn a_trigger_seals_only_streams_older_than_the_interval_and_shutdown_seals_all() {
    let w = World::new();
    w.add_at(60);
    assert_eq!(w.run(&timers(300, 0), TRIGGER), Outcome::default());
    assert!(
        w.age() >= 59,
        "an event younger than the interval stays open"
    );
    assert_eq!(
        w.run(
            &timers(300, 0),
            Policy {
                shutdown: true,
                ..TRIGGER
            }
        ),
        Outcome::default()
    );
    assert_eq!(w.age(), 0, "shutdown seals every open stream");
    w.add_at(3600);
    w.run(&timers(300, 0), TRIGGER);
    assert_eq!(
        w.age(),
        0,
        "an event older than the interval is sealed by the next trigger"
    );
}

#[test]
fn a_publish_is_due_only_at_an_end_trigger_of_a_worker_that_is_not_dispatched() {
    let w = World::new();
    w.add_at(1);
    let t = timers(300, 300);
    assert!(
        !w.run(&t, TRIGGER).sync_due,
        "a start trigger never publishes"
    );
    assert!(
        !w.run(
            &t,
            Policy {
                shutdown: true,
                ..TRIGGER
            }
        )
        .sync_due,
        "a shutdown never publishes"
    );
    assert!(
        !w.run(
            &t,
            Policy {
                end: true,
                dispatched: true,
                ..TRIGGER
            }
        )
        .sync_due,
        "a dispatched worker never publishes"
    );
    assert!(
        w.run(
            &t,
            Policy {
                end: true,
                ..TRIGGER
            }
        )
        .sync_due,
        "an end trigger with no attempt yet publishes"
    );
    assert!(
        !w.run(
            &timers(300, 0),
            Policy {
                end: true,
                ..TRIGGER
            }
        )
        .sync_due,
        "interval 0 turns publishing off"
    );
}

#[test]
fn the_publish_decision_follows_the_last_attempt_the_remote_and_the_interval() {
    let t = timers(300, 300);
    let now = 10_000.0;
    assert!(sync_due(&t, None, now), "no attempt yet");
    assert!(
        sync_due(&t, Some((9_000, "origin")), now),
        "an attempt older than the interval"
    );
    assert!(
        sync_due(&t, Some((9_000, "origin")), 9_300.0),
        "an attempt exactly one interval old"
    );
    assert!(
        !sync_due(&t, Some((9_900, "origin")), now),
        "an attempt inside the interval"
    );
    assert!(
        sync_due(&t, Some((9_900, "other")), now),
        "the last attempt went to another remote"
    );
    assert!(!sync_due(&timers(300, 0), None, now), "interval 0");
    assert!(
        !sync_due(&timers(300, 0), Some((1, "other")), now),
        "interval 0 beats another remote"
    );
}

#[test]
fn a_store_that_cannot_be_opened_is_a_code_and_never_a_publish() {
    let w = World::new();
    let outside = std::env::temp_dir().join(format!("es-lifecycle-none-{}", std::process::id()));
    fs::create_dir_all(&outside).unwrap();
    let outcome = maintain(&Request {
        cwd: &outside,
        trusted_main: &outside,
        state_root: &w.state,
        timers: &timers(300, 300),
        policy: Policy {
            end: true,
            ..TRIGGER
        },
        held_ranks: &[],
        hot_lock_depth: 0,
        now_sec: 0.0,
    });
    fs::remove_dir_all(&outside).unwrap();
    assert_eq!(
        outcome,
        Outcome {
            error: Some("event-store-no-repository".into()),
            sync_due: false
        }
    );
}

#[test]
fn a_trigger_inside_a_hot_lock_is_refused_by_code() {
    let w = World::new();
    let outcome = maintain(&Request {
        cwd: &w.repo.root,
        trusted_main: &w.repo.root,
        state_root: &w.state,
        timers: &timers(300, 300),
        policy: TRIGGER,
        held_ranks: &[],
        hot_lock_depth: 1,
        now_sec: 0.0,
    });
    assert_eq!(
        outcome.error.as_deref(),
        Some("event-store-seal-under-state")
    );
}

#[test]
fn a_failing_seal_does_not_stop_the_publish_decision() {
    let w = World::new();
    w.add_at(3600);
    let active = w.repo.layout.stream(&w.repo.stream).active();
    fs::write(&active, "not an envelope\n").unwrap();
    let outcome = w.run(
        &timers(300, 300),
        Policy {
            end: true,
            ..TRIGGER
        },
    );
    assert_eq!(outcome.error.as_deref(), Some("event-store-integrity"));
    assert!(outcome.sync_due, "the step after the failed seal still ran");
    assert!(
        sync_status(&w.repo.layout).unwrap().time == 0,
        "the trigger itself never publishes"
    );
}

#[test]
fn a_trigger_never_looks_at_the_remote_so_a_bad_remote_reaches_the_publish_child() {
    let w = World::new();
    let git = |args: &[&str]| {
        let out = std::process::Command::new("git")
            .arg("-C")
            .arg(&w.repo.root)
            .args(args)
            .output()
            .unwrap();
        assert!(out.status.success());
    };
    git(&["remote", "add", "origin", "/nonexistent/remote.git"]);
    let outcome = w.run(
        &timers(300, 300),
        Policy {
            end: true,
            ..TRIGGER
        },
    );
    assert_eq!(
        outcome,
        Outcome {
            error: None,
            sync_due: true
        },
        "the trigger reads only the sync record and the open streams, never a ref or the remote"
    );
}
