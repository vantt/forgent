//! The keeper's rules own these proofs; the wake boundary gets one sequencing/wiring proof.
use fgos_supervision::{
    keeper::{
        self, Action, ActorState, Caps, Decision, History, Input, Need, Players, Raise, Record,
        Snapshot,
    },
    portfolio::Plan,
    queue::{QueueError, RaisedEvent},
    supervisor::OpenQuestions,
    wake::{
        self, Activity, Admission, Capacity, Clock, Drain, Holder, Identity, Portfolio, Project,
        ProjectInfo, Settings, StartSession, StopSession, Telemetry, Trigger, WakeLog, WakeSpan,
        WakeState,
    },
};
use serde_json::{json, Value};
use std::{
    cell::{Cell, RefCell},
    collections::BTreeMap,
};

fn input(step: &str) -> Input {
    Input {
        record: serde_json::from_value(json!({
            "item": "case:a", "step": step,
            "needs": {"kind": "capability", "ref": "edit"}
        }))
        .unwrap(),
        item_closed: false,
        actor: ActorState::NotLive,
    }
}
fn caps(starts: usize) -> Caps {
    Caps {
        starts,
        held: BTreeMap::new(),
    }
}
fn decide(records: &[Input], past: &[Decision]) -> Vec<Decision> {
    keeper::decide(records, 100, past, &caps(10))
}
fn wait(until: Option<&str>) -> Input {
    let mut value =
        json!({"item": "case:a", "step": "wait", "waitingOn": {"kind": "person", "ref": "q-a"}});
    if let Some(until) = until {
        value["waitingOn"]["until"] = json!(until);
    }
    Input {
        record: serde_json::from_value(value).unwrap(),
        ..input("wait")
    }
}

#[test]
fn two_parallel_steps_of_one_item_start_independently_and_duplicate_projections_do_not() {
    // No prior keeper exists: this is the owning proof of the per-step key, not an item-level cap.
    let records = [input("colour"), input("sound"), input("colour")];
    let decisions = decide(&records, &[]);
    assert_eq!(
        decisions
            .iter()
            .map(|d| (d.step.as_str(), &d.action))
            .collect::<Vec<_>>(),
        [("colour", &Action::Start), ("sound", &Action::Start)]
    );
    assert!(decisions.iter().all(|d| d.reason == "actionable"));
}

#[test]
fn expiry_raises_once_across_three_ticks_from_history_and_never_clears_the_wait() {
    // History deduplicates unchanged open decisions, including effects, not only expiry alarms.
    let record = wait(Some("1970-01-01T00:01:39Z"));
    let original = record.record.clone();
    let mut missing = input("missing");
    missing.record.needs = None;
    let mut orphan = input("orphan");
    orphan.item_closed = true;
    let mut capped = input("capped");
    capped.record.needs.as_mut().unwrap().max_rounds = Some(0);
    let mut held = input("held");
    held.actor = ActorState::Unknown;
    let mut live = input("live");
    live.actor = ActorState::Live;
    let mut f = Fake {
        records: vec![record.clone(), missing, orphan, capped, held, live],
        ..Fake::default()
    };
    for tick in 100..103 {
        let decisions = wake::run_keeper(&f.ports(), tick).unwrap();
        if tick == 100 {
            assert_eq!(decisions.len(), 6);
            assert_eq!(
                decisions
                    .iter()
                    .map(|d| d.reason.as_str())
                    .collect::<Vec<_>>(),
                [
                    "until-expired",
                    "needs-missing",
                    "orphan-record",
                    "round-cap",
                    "identity-unknown",
                    "actor-live"
                ]
            );
            assert_eq!(
                decisions[0].action,
                Action::Raise {
                    event: "until-expired".into(),
                    id: "until:case:a:wait:1970-01-01T00:01:39Z".into()
                }
            );
        } else {
            assert!(decisions.is_empty());
        }
    }
    assert_eq!(f.past.borrow().len(), 6, "no repeated history appends");
    assert_eq!(f.events.borrow().len(), 4, "no repeated raises");
    assert_eq!(
        f.calls
            .borrow()
            .iter()
            .filter(|c| *c == "wake-player")
            .count(),
        1
    );
    assert_eq!(f.records[0].record, original);
    let changed = wait(Some("1970-01-01T00:01:40Z"));
    assert_eq!(
        decide(&[changed], &f.past.borrow()).len(),
        1,
        "a new deadline is a new alarm"
    );
    // A different latest decision re-arms an open hold/wake/judgement, but expiry stays once-only.
    let mut intervening = f.past.borrow()[4].clone();
    intervening.reason = "resource-held".into();
    f.past.borrow_mut().push(intervening);
    assert_eq!(
        wake::run_keeper(&f.ports(), 103).unwrap()[0].reason,
        "identity-unknown"
    );
    f.records[4].record.outcome = Some(keeper::Outcome::Done);
    assert!(wake::run_keeper(&f.ports(), 104).unwrap().is_empty());
}

#[test]
fn waits_without_a_deadline_or_before_it_are_not_actionable_even_when_needs_is_present() {
    // Waiting and expiry are keeper rules; source-specific question answers belong to sources.
    for until in [
        None,
        Some("1970-01-01T00:01:40.001Z"),
        Some("1970-01-01T00:01:41Z"),
    ] {
        let mut record = wait(until);
        record.record.needs = input("a").record.needs;
        assert!(decide(&[record], &[]).is_empty());
    }
    assert_eq!(
        decide(&[wait(Some("1970-01-01T00:01:40Z"))], &[])[0].reason,
        "until-expired"
    );
}

#[test]
fn an_actionable_record_without_needs_requires_judgement() {
    // New rule: a domain must supply the need; the keeper never invents a player.
    let mut record = input("judge");
    record.record.needs = None;
    let decisions = decide(&[record], &[]);
    assert_eq!(decisions.len(), 1);
    assert_eq!(decisions[0].reason, "needs-missing");
    assert!(
        matches!(&decisions[0].action, Action::Raise { event, .. } if event == "needs-judgement")
    );
}

#[test]
fn round_caps_count_only_starts_of_the_same_item_and_step_including_failed_attempts() {
    // The domain sets the cap; the keeper owns the comparison with its durable start history.
    let mut record = input("edit");
    record.record.needs.as_mut().unwrap().max_rounds = Some(2);
    let start = decide(&[record.clone()], &[]).remove(0);
    let mut past = vec![start.clone()];
    let mut other_step = start.clone();
    other_step.step = "other".into();
    let mut other_item = start.clone();
    other_item.item = "case:b".into();
    let mut wake = start.clone();
    wake.action = Action::Wake;
    past.extend([other_step, other_item, wake]);
    assert_eq!(decide(&[record.clone()], &past)[0].action, Action::Start);
    past.push(start);
    let result = decide(&[record.clone()], &past);
    assert_eq!(result[0].reason, "round-cap");
    assert!(matches!(&result[0].action, Action::Raise { event, .. } if event == "needs-judgement"));
    record.record.needs.as_mut().unwrap().max_rounds = Some(0);
    assert_eq!(decide(&[record], &[])[0].reason, "round-cap");
}

#[test]
fn an_orphan_requires_judgement_without_closing_or_starting_it() {
    // Only the source can close the item or record; even an unexpired orphan wait is reported.
    let mut record = wait(Some("1970-01-01T00:10:00Z"));
    record.item_closed = true;
    let original = record.record.clone();
    let decisions = decide(std::slice::from_ref(&record), &[]);
    assert_eq!(decisions.len(), 1);
    assert_eq!(decisions[0].reason, "orphan-record");
    assert!(
        matches!(&decisions[0].action, Action::Raise { event, .. } if event == "needs-judgement")
    );
    assert_eq!(record.record, original);
    assert!(record.record.outcome.is_none());
}

#[test]
fn every_closed_outcome_suppresses_even_orphan_and_expiry_decisions() {
    // Outcomes, not a domain status vocabulary, are the keeper's closure boundary.
    for outcome in ["done", "withdrawn", "wontfix", "cancelled"] {
        let mut record = wait(Some("1970-01-01T00:00:00Z"));
        record.record.outcome = Some(serde_json::from_value(json!(outcome)).unwrap());
        record.item_closed = true;
        assert!(decide(&[record], &[]).is_empty());
    }
}

#[test]
fn live_players_wake_without_a_start_slot_and_unknown_identity_never_means_free() {
    // Starts and wake delivery have distinct cap semantics, observed at this lowest layer.
    let mut live = input("live");
    live.actor = ActorState::Live;
    let mut unknown = input("unknown");
    unknown.actor = ActorState::Unknown;
    let records = [
        live,
        unknown,
        input("free"),
        input("over-budget"),
        input("resource"),
    ];
    let mut caps = caps(1);
    caps.held
        .insert(records[4].record.key(), "resource-held".into());
    let decisions = keeper::decide(&records, 100, &[], &caps);
    assert_eq!(
        decisions
            .iter()
            .map(|d| (&d.action, d.reason.as_str()))
            .collect::<Vec<_>>(),
        [
            (&Action::Wake, "actor-live"),
            (&Action::Hold, "identity-unknown"),
            (&Action::Start, "actionable"),
            (&Action::Hold, "start-cap"),
            (&Action::Hold, "resource-held")
        ]
    );
}

#[test]
fn record_contract_fixtures_parse_and_unknown_fields_are_refused_by_name() {
    // These shared contract fixtures exercise the Rust decoder, not a JSON Schema validator.
    let contract: Value =
        serde_json::from_str(include_str!("../../contracts/scheduling-record.v1.json")).unwrap();
    for value in contract["examples"].as_array().unwrap() {
        let record: Record = serde_json::from_value(value.clone()).unwrap();
        assert_eq!(serde_json::to_value(record).unwrap(), *value);
    }
    for value in contract["x-invalidExamples"].as_array().unwrap() {
        assert!(
            serde_json::from_value::<Record>(value.clone()).is_err(),
            "accepted {value}"
        );
    }
    for value in contract["x-invalidExamples"]
        .as_array()
        .unwrap()
        .iter()
        .take(3)
    {
        let error = serde_json::from_value::<Record>(value.clone())
            .unwrap_err()
            .to_string();
        assert!(error.contains("unknown field `surprise`"), "{error}");
    }
}

#[derive(Default)]
struct Fake {
    records: Vec<Input>,
    past: RefCell<Vec<Decision>>,
    events: RefCell<Vec<RaisedEvent>>,
    calls: RefCell<Vec<String>>,
    fail: Cell<Option<&'static str>>,
    admitted: Cell<bool>,
}
impl Fake {
    fn call(&self, name: &str) -> Result<(), String> {
        self.calls.borrow_mut().push(name.into());
        if self.fail.get() == Some(name) {
            Err(format!("{name}-failed"))
        } else {
            Ok(())
        }
    }
    fn ports(&self) -> keeper::Ports<'_> {
        keeper::Ports {
            snapshot: self,
            history: self,
            players: self,
            raise: self,
        }
    }
}
impl Snapshot for Fake {
    fn read(&self) -> Result<(Vec<Input>, Caps), String> {
        self.call("snapshot")?;
        Ok((self.records.clone(), caps(10)))
    }
}
impl History for Fake {
    fn read(&self) -> Result<Vec<Decision>, String> {
        self.call("history")?;
        Ok(self.past.borrow().clone())
    }
    fn record(&self, decision: &Decision) -> Result<(), String> {
        self.call("record")?;
        self.past.borrow_mut().push(decision.clone());
        Ok(())
    }
}
impl Players for Fake {
    fn start(&self, _: &Decision, need: &Need) -> Result<(), String> {
        assert_eq!(need.reference, "edit");
        self.call("start-player")
    }
    fn wake(&self, _: &Decision, need: &Need) -> Result<(), String> {
        assert_eq!(need.reference, "edit");
        self.call("wake-player")
    }
}
impl Raise for Fake {
    fn raise(&self, decision: &Decision, _: i64) -> Result<(), String> {
        self.call("raise")?;
        let Action::Raise { event, id } = &decision.action else {
            panic!("not a raise")
        };
        self.events.borrow_mut().push(RaisedEvent {
            id: id.clone(),
            kind: event.clone(),
            subject: decision.item.clone(),
            ts: String::new(),
            reason: decision.reason.clone(),
            next_command: String::new(),
        });
        Ok(())
    }
}

#[test]
fn failures_refuse_before_effects_and_failed_raises_retry_but_failed_starts_consume_a_round() {
    // This owns execution failure ordering; the composed wake gets only one wiring proof.
    for failure in ["snapshot", "history", "record"] {
        let f = Fake {
            records: vec![input("a")],
            ..Fake::default()
        };
        f.fail.set(Some(failure));
        assert_eq!(
            wake::run_keeper(&f.ports(), 100),
            Err(format!("{failure}-failed"))
        );
        assert!(!f.calls.borrow().iter().any(|c| c == "start-player"));
    }
    let f = Fake {
        records: vec![wait(Some("1970-01-01T00:00:00Z"))],
        ..Fake::default()
    };
    f.fail.set(Some("raise"));
    assert_eq!(
        wake::run_keeper(&f.ports(), 100),
        Err("raise-failed".into())
    );
    assert!(f.past.borrow().is_empty());
    f.fail.set(None);
    wake::run_keeper(&f.ports(), 101).unwrap();
    assert!(wake::run_keeper(&f.ports(), 102).unwrap().is_empty());
    assert_eq!(f.events.borrow().len(), 1);
    let mut r = input("a");
    r.record.needs.as_mut().unwrap().max_rounds = Some(1);
    let f = Fake {
        records: vec![r],
        ..Fake::default()
    };
    f.fail.set(Some("start-player"));
    assert_eq!(
        wake::run_keeper(&f.ports(), 100),
        Err("start-player-failed".into())
    );
    f.fail.set(None);
    assert_eq!(
        wake::run_keeper(&f.ports(), 101).unwrap()[0].reason,
        "round-cap"
    );
}

impl Project for Fake {
    fn project(&self) -> Option<ProjectInfo> {
        Some(ProjectInfo {
            id: "p".into(),
            handle: "project".into(),
        })
    }
}
impl Identity for Fake {
    fn holder(&self, _: &str) -> Holder {
        Holder::NotLive
    }
    fn lead_roles(&self, _: &str) -> Result<Vec<String>, String> {
        Ok(vec![])
    }
}
impl StartSession for Fake {
    fn start(&self, persona: &str, _: &str) -> Result<(), String> {
        self.call(&format!("start-{persona}"))
    }
}
impl StopSession for Fake {
    fn activity(&self, _: &str, _: &str) -> Activity {
        Activity::Unknown
    }
    fn stop(&self, _: &str, _: &str) -> Result<(), String> {
        panic!("no finished heads")
    }
}
impl Portfolio for Fake {
    fn read(&self) -> Result<(Vec<Plan>, Vec<String>), String> {
        Ok((
            vec![Plan {
                dir: "plan-a".into(),
                title: "A".into(),
                status: "ready".into(),
                priority: "P1".into(),
                created: "2026-11-26".into(),
                blocked_by: vec![],
                footprint: vec!["src/a".into()],
                source: vec![],
                lead: None,
                phases: vec![],
            }],
            vec![],
        ))
    }
}
impl Admission for Fake {
    fn capacity(&self) -> Result<Capacity, String> {
        Ok(Capacity {
            max_leads: 2,
            free_lanes: 2,
        })
    }
    fn admit(&self, _: &Plan, _: &str) -> Result<(), String> {
        self.admitted.set(true);
        self.call("admit")
    }
}
impl OpenQuestions for Fake {
    fn has_open(&self, _: &str) -> bool {
        false
    }
}
impl Drain for Fake {
    fn unhandled(&self) -> Result<Vec<RaisedEvent>, QueueError> {
        Ok(self.events.borrow().clone())
    }
    fn mark_handled(&self, _: &[String], _: &str) -> Result<usize, QueueError> {
        Ok(0)
    }
}
impl WakeLog for Fake {
    fn load(&self) -> WakeState {
        WakeState::default()
    }
    fn save(&self, _: WakeState) -> Result<(), String> {
        Ok(())
    }
}
impl Clock for Fake {
    fn now(&self) -> i64 {
        100
    }
}
impl Telemetry for Fake {
    fn emit(&self, _: &WakeSpan) {}
}

#[cfg(target_os = "linux")]
#[test]
fn the_queue_adapter_encodes_logical_ids_stably_without_colliding_domain_keys() {
    // Queue boundary proof: use the real raise door, including deduplication after handling.
    use fgos_event_store::layout::Layout;
    use fgos_supervision::queue::Queue;
    use std::{fs, os::unix::fs::PermissionsExt, process::Command};
    let root = std::env::temp_dir().join(format!("keeper-queue-{}", std::process::id()));
    fs::create_dir(&root).unwrap();
    fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
    struct Fixture(std::path::PathBuf);
    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }
    let fixture = Fixture(root);
    let output = Command::new("git")
        .args(["init", "-q"])
        .arg(&fixture.0)
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let layout = Layout::from_common_dir(Some(&fixture.0.join(".git"))).unwrap();
    let fence = fixture.0.join(".fgos/locks/activation.lock");
    fs::create_dir_all(&fence).unwrap();
    fs::write(
        fence.join("TOMBSTONE"),
        "{\"at\":\"fixture\",\"v\":1,\"lock\":\"activation\",\"by\":\"fgos git\"}\n",
    )
    .unwrap();
    fs::create_dir_all(layout.root.join("locks")).unwrap();
    for path in [layout.common_dir.join("fgos"), layout.root.join("locks")] {
        fs::set_permissions(path, fs::Permissions::from_mode(0o700)).unwrap();
    }
    let queue = Queue::open(&layout, "keeper-test", "keeper-test").unwrap();
    let mut decision = Decision {
        item: "a:b".into(),
        step: "c".into(),
        reason: "until-expired".into(),
        action: Action::Raise {
            event: "until-expired".into(),
            id: "until:a:b:c:1970-01-01T00:00:00Z".into(),
        },
    };
    Raise::raise(&queue, &decision, 100).unwrap();
    let events = queue.unhandled().unwrap();
    assert_eq!(events.len(), 1);
    assert!(fgos_supervision::queue::valid_id(&events[0].id));
    assert_eq!(events[0].kind, "until-expired");
    assert_eq!(events[0].reason, "until-expired");
    queue.mark_handled(&[events[0].id.clone()], "test").unwrap();
    Raise::raise(&queue, &decision, 101).unwrap();
    assert!(queue.unhandled().unwrap().is_empty());
    decision.item = "a".into();
    decision.step = "b:c".into();
    Raise::raise(&queue, &decision, 102).unwrap();
    assert_eq!(queue.unhandled().unwrap().len(), 1);
    assert_ne!(queue.unhandled().unwrap()[0].id, events[0].id);
}

#[test]
fn the_wake_door_admits_then_runs_keeper_ports_and_only_then_considers_supervisor_judgement() {
    // One boundary proof: rules above own individual scheduling cases; here verify the composition.
    let start = input("start");
    let mut closed = start.clone();
    closed.record.outcome = Some(keeper::Outcome::Done);
    closed.record.needs = None;
    let mut duplicate = start.clone();
    duplicate.record.needs.as_mut().unwrap().reference = "wrong-player".into();
    let mut live = input("live");
    live.actor = ActorState::Live;
    let mut judge = input("judge");
    judge.record.needs = None;
    let f = Fake {
        records: vec![closed, start, duplicate, live, judge],
        ..Fake::default()
    };
    let admission = wake::Ports {
        project: &f,
        identity: &f,
        start: &f,
        stop: &f,
        portfolio: &f,
        admission: &f,
        questions: &f,
        queue: &f,
        log: &f,
        clock: &f,
        telemetry: &f,
    };
    let settings = Settings {
        active_interval_sec: 60,
        idle_interval_sec: 900,
        overdue_factor: 3,
        wake_failure_limit: 3,
    };
    let ports = wake::ScheduledPorts {
        admission: &admission,
        keeper: f.ports(),
    };
    assert_eq!(
        wake::wake(
            &ports,
            &settings,
            Trigger {
                trigger: "tick",
                subject: "row"
            }
        ),
        wake::WakeOutcome::Started
    );
    assert!(f.admitted.get());
    assert_eq!(
        *f.calls.borrow(),
        [
            "admit",
            "start-lead",
            "snapshot",
            "history",
            "record",
            "start-player",
            "record",
            "wake-player",
            "raise",
            "record",
            "start-supervisor"
        ]
    );
    let registry: Value =
        serde_json::from_str(include_str!("../../contracts/event-streams.v1.json")).unwrap();
    for d in f.past.borrow().iter() {
        assert!(registry["types"]
            .as_array()
            .unwrap()
            .iter()
            .any(|r| r["type"] == d.event_type()));
        assert_eq!(
            serde_json::from_value::<Decision>(serde_json::to_value(d).unwrap()).unwrap(),
            *d
        );
    }
}
