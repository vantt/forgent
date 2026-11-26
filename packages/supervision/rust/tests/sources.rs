//! Owning proofs of source projection and source-specific need facts, not the keeper's rules.
use fgos_supervision::{
    keeper::{self, *},
    portfolio,
    sources::*,
    wake,
};
use serde_json::json;
use std::cell::{Cell, RefCell};

struct Facts {
    answered: Cell<bool>,
    held: Cell<bool>,
    live: Cell<ActorState>,
    until: Option<String>,
    capacity_probes: Cell<usize>,
    fail_ref: Option<String>,
}
impl Default for Facts {
    fn default() -> Self {
        Self {
            answered: Cell::new(false),
            held: Cell::new(false),
            live: Cell::new(ActorState::NotLive),
            until: None,
            capacity_probes: Cell::new(0),
            fail_ref: None,
        }
    }
}
impl Heads for Facts {
    fn state(&self, _: &str) -> ActorState {
        self.live.get()
    }
    fn sleep_until(&self, _: &str) -> Option<String> {
        self.until.clone()
    }
}
impl Resolver for Facts {
    fn actor(&self, _: &Record) -> ActorState {
        self.live.get()
    }
    fn answered(&self, question: &str) -> bool {
        question == "q-answer" && self.answered.get()
    }
    fn start_hold(&self, record: &Record) -> Result<Option<String>, String> {
        self.capacity_probes.set(self.capacity_probes.get() + 1);
        if record
            .needs
            .as_ref()
            .is_some_and(|n| Some(&n.reference) == self.fail_ref.as_ref())
        {
            return Err("referee-unavailable".into());
        }
        Ok(self.held.get().then(|| "resource-held".into()))
    }
}
fn case_source() -> WorkflowCases {
    serde_json::from_value(json!({"records": [
        {"item": "case-one", "step": "left", "needs": {"kind": "capability", "ref": "review", "maxRounds": 4}},
        {"item": "case-one", "step": "right", "needs": {"kind": "capability", "ref": "advise", "maxRounds": 4}}
    ], "closedItems": ["case-closed"]})).unwrap()
}
fn plan(status: &str) -> portfolio::Plan {
    portfolio::read_plan("plan-one", &format!("---\ntitle: Test\npriority: P1\nstatus: {status}\nlead: head:lead-project-plan\n---\n| id | title | depends-on | footprint | wave | status |\n|---|---|---|---|---|---|\n| 1 | Build | - | src/x | 1 | ready |\n")).unwrap()
}

#[test]
fn running_plans_project_one_lead_ready_plans_stay_with_admission_and_ended_plans_close() {
    let plans = [plan("running"), plan("ready")];
    let facts = Facts::default();
    let source = Plans {
        plans: &plans,
        heads: &facts,
    };
    let records = source.records().unwrap();
    assert_eq!(records.len(), 1);
    assert_eq!(records[0].step, "lead");
    assert_eq!(records[0].needs.as_ref().unwrap().kind, NeedKind::Role);
    assert_eq!(
        records[0].needs.as_ref().unwrap().reference,
        "head:lead-project-plan"
    );
    assert!(!source.closed("plan-one"));
    for status in ["done", "withdrawn"] {
        let plans = [plan(status)];
        let ended = Plans {
            plans: &plans,
            heads: &facts,
        };
        assert!(ended.records().unwrap().is_empty());
        assert!(ended.closed("plan-one"));
    }
    let mut unnamed = plan("running");
    unnamed.lead = None;
    let plans = [unnamed];
    let source = Plans {
        plans: &plans,
        heads: &facts,
    };
    // Admission already refuses unnamed leads; this source must not invent a role for them.
    assert!(source.records().unwrap()[0].needs.is_none());
}

#[test]
fn sleep_comes_only_from_a_dead_leads_head_record_and_bad_or_missing_wake_times_stay_actionable() {
    let plans = [plan("running")];
    for until in [
        None,
        Some("bad"),
        Some("2026-02-30T00:00:00Z"),
        Some("2026-12-01T09:00:00Z"),
    ] {
        let facts = Facts {
            until: until.map(str::to_owned),
            ..Facts::default()
        };
        let source = Plans {
            plans: &plans,
            heads: &facts,
        };
        let records = source.records().unwrap();
        assert_eq!(
            records[0]
                .waiting_on
                .as_ref()
                .and_then(|w| w.until.as_deref()),
            until.filter(|s| s.starts_with("2026-12"))
        );
        facts.live.set(ActorState::Live);
        assert!(source.records().unwrap()[0].waiting_on.is_none());
        facts.live.set(ActorState::Unknown);
        assert!(source.records().unwrap()[0].waiting_on.is_none());
    }
}

struct Runtime {
    records: Vec<Input>,
    caps: Caps,
    decisions: RefCell<Vec<Decision>>,
    commands: RefCell<Vec<Vec<String>>>,
    starts: RefCell<std::collections::BTreeMap<Key, u64>>,
    now: Cell<u64>,
}
impl Snapshot for Runtime {
    fn read(&self) -> Result<(Vec<Input>, Caps), String> {
        let mut records = self.records.clone();
        for input in &mut records {
            if input.actor == ActorState::NotLive
                && input
                    .record
                    .needs
                    .as_ref()
                    .is_some_and(|n| n.kind == NeedKind::Capability)
            {
                input.actor = capability_actor(
                    &input.record,
                    self.starts.borrow().get(&input.record.key()).copied(),
                    self.now.get(),
                    180,
                );
            }
        }
        Ok((records, self.caps.clone()))
    }
}
impl History for Runtime {
    fn read(&self) -> Result<Vec<Decision>, String> {
        Ok(self.decisions.borrow().clone())
    }
    fn record(&self, d: &Decision) -> Result<(), String> {
        self.decisions.borrow_mut().push(d.clone());
        if d.action == Action::Start {
            self.starts
                .borrow_mut()
                .insert((d.item.clone(), d.step.clone()), self.now.get());
        }
        Ok(())
    }
}
impl Players for Runtime {
    fn start(&self, d: &Decision, _: &Need) -> Result<(), String> {
        self.commands.borrow_mut().push(vec![
            "run".into(),
            "--case".into(),
            d.item.clone(),
            "--activity".into(),
            d.step.clone(),
        ]);
        Ok(())
    }
    fn wake(&self, _: &Decision, _: &Need) -> Result<(), String> {
        panic!("no live player in this source fixture")
    }
}
impl Raise for Runtime {
    fn raise(&self, _: &Decision, _: i64) -> Result<(), String> {
        panic!("all source records have needs")
    }
}
fn execute(collected: Collected) -> Runtime {
    let rt = Runtime {
        records: collected.inputs,
        caps: collected.caps,
        decisions: RefCell::new(collected.unavailable),
        commands: RefCell::new(vec![]),
        starts: RefCell::new(Default::default()),
        now: Cell::new(100),
    };
    wake::run_keeper(
        &keeper::Ports {
            snapshot: &rt,
            history: &rt,
            players: &rt,
            raise: &rt,
        },
        100,
    )
    .unwrap();
    rt
}
#[test]
fn one_unavailable_source_does_not_block_parallel_spawns_and_a_second_wake_waits_for_registration()
{
    let cases = case_source();
    let facts = Facts::default();
    let sources: Vec<(&str, Result<&dyn Source, SourceError>)> = vec![
        ("plans", Err(SourceError("read-failed".into()))),
        ("workflow-cases", Ok(&cases)),
    ];
    let rt = execute(collect_records(&sources, &facts, 2).unwrap());
    assert_eq!(rt.decisions.borrow()[0].reason, "source-unavailable");
    assert_eq!(
        *rt.commands.borrow(),
        [
            vec!["run", "--case", "case-one", "--activity", "left"],
            vec!["run", "--case", "case-one", "--activity", "right"]
        ]
    );
    assert!(cases.closed("case-closed"));
    // The fake run door records spawns only: both activities started without waiting for completion.
    // No reservation is visible yet; the recorded starts protect the next wake inside the window.
    rt.now.set(101);
    wake::run_keeper(
        &keeper::Ports {
            snapshot: &rt,
            history: &rt,
            players: &rt,
            raise: &rt,
        },
        101,
    )
    .unwrap();
    assert_eq!(rt.commands.borrow().len(), 2);
    assert!(rt
        .decisions
        .borrow()
        .iter()
        .rev()
        .take(2)
        .all(|d| d.reason == "identity-unknown"));
}
#[test]
fn a_person_wait_becomes_actionable_only_after_the_questions_door_says_answered() {
    let mut cases = case_source();
    cases.records.truncate(1);
    cases.records[0].waiting_on = Some(WaitingOn {
        kind: WaitKind::Person,
        reference: "q-answer".into(),
        until: None,
    });
    let facts = Facts::default();
    assert!(
        execute(collect_records(&[("workflow-cases", Ok(&cases))], &facts, 1).unwrap())
            .commands
            .borrow()
            .is_empty()
    );
    facts.answered.set(true);
    assert_eq!(
        execute(collect_records(&[("workflow-cases", Ok(&cases))], &facts, 1).unwrap())
            .commands
            .borrow()
            .len(),
        1
    );
}
#[test]
fn held_resources_keep_the_record_waiting_and_just_started_unknown_players_are_not_started_again() {
    let mut cases = case_source();
    cases.records.push(cases.records[0].clone());
    let facts = Facts::default();
    facts.held.set(true);
    let rt = execute(collect_records(&[("workflow-cases", Ok(&cases))], &facts, 2).unwrap());
    assert!(rt.commands.borrow().is_empty());
    assert!(rt
        .decisions
        .borrow()
        .iter()
        .all(|d| d.action == Action::Hold && d.reason == "resource-held"));
    // Duplicate source rows do not probe/claim another slot, and pending players probe none.
    assert_eq!(facts.capacity_probes.get(), 2);
    facts.live.set(ActorState::Unknown);
    facts.held.set(false);
    let rt = execute(collect_records(&[("workflow-cases", Ok(&cases))], &facts, 2).unwrap());
    assert!(rt.commands.borrow().is_empty());
    assert_eq!(facts.capacity_probes.get(), 2);
    cases.closed_items.push("case-one".into());
    facts.live.set(ActorState::NotLive);
    let collected = collect_records(&[("workflow-cases", Ok(&cases))], &facts, 2).unwrap();
    assert!(collected.inputs.iter().all(|input| input.item_closed));
    assert_eq!(
        facts.capacity_probes.get(),
        2,
        "orphan records claim no capacity"
    );
}
#[test]
fn a_failed_start_check_holds_only_its_record_and_the_plan_source_still_runs() {
    let cases = case_source();
    let plans = [plan("running")];
    let facts = Facts {
        fail_ref: Some("review".into()),
        ..Facts::default()
    };
    let plans = Plans {
        plans: &plans,
        heads: &facts,
    };
    let collected = collect_records(
        &[("workflow-cases", Ok(&cases)), ("plans", Ok(&plans))],
        &facts,
        3,
    )
    .unwrap();
    assert_eq!(collected.inputs.len(), 3);
    assert_eq!(
        collected
            .caps
            .held
            .get(&("case-one".into(), "left".into()))
            .map(String::as_str),
        Some("start-check-unavailable")
    );
    let rt = execute(collected);
    assert_eq!(rt.commands.borrow().len(), 2);
    assert!(rt.commands.borrow().iter().any(|c| c[2] == "plan-one"));
}

#[test]
fn a_capability_is_live_with_a_reservation_unknown_during_start_and_absent_after_the_window() {
    let mut record = case_source().records.remove(0);
    assert_eq!(
        capability_actor(&record, None, 100, 180),
        ActorState::NotLive
    );
    assert_eq!(
        capability_actor(&record, Some(100), 279, 180),
        ActorState::Unknown
    );
    assert_eq!(
        capability_actor(&record, Some(100), 280, 180),
        ActorState::NotLive
    );
    record.waiting_on = Some(WaitingOn {
        kind: WaitKind::Actor,
        reference: "unit-one".into(),
        until: None,
    });
    assert_eq!(capability_actor(&record, None, 1000, 180), ActorState::Live);
}

#[test]
fn an_outage_reports_once_then_recovery_rearms_reporting_for_a_later_outage() {
    let names = vec!["workflow-cases".into(), "plans".into()];
    let failure = Decision {
        item: "workflow-cases".into(),
        step: "source".into(),
        action: Action::Hold,
        reason: "source-unavailable".into(),
    };
    let unavailable = vec![failure.clone()];
    let mut past = source_status_decisions(&names, &unavailable, &[]);
    assert_eq!(past, unavailable);
    assert!(source_status_decisions(&names, &unavailable, &past).is_empty());
    let recovery = source_status_decisions(&names, &[], &past);
    assert_eq!(recovery.len(), 1);
    assert_eq!(recovery[0].reason, "source-recovered");
    past.extend(recovery);
    assert!(source_status_decisions(&names, &[], &past).is_empty());
    assert_eq!(
        source_status_decisions(&names, &unavailable, &past),
        vec![failure]
    );
}

#[test]
fn the_host_source_codec_refuses_unknown_fields_malformed_caps_and_invalid_waits() {
    for record in [
        json!({"item":"c","step":"a","extra":true}),
        json!({"item":"c","step":"a","needs":{"kind":"capability","ref":"x","maxRounds":-1}}),
        json!({"item":"c","step":"a","waitingOn":{"kind":"person","ref":""}}),
    ] {
        assert!(serde_json::from_value::<WorkflowCases>(
            json!({"records":[record],"closedItems":[]})
        )
        .is_err());
    }
}
