//! The wake door and the supervisor verbs over fake ports, one behaviour per test.
use fgos_supervision::{
    portfolio::{head_name, read_plan, supervisor_name, Plan},
    queue::{QueueError, RaisedEvent},
    supervisor::{self, Asker, Askers},
    wake::{
        stop_stuck, wake, Activity, Clock, Drain, Holder, Identity, Portfolio, Ports, Project,
        ProjectInfo, Settings, StartSession, StopSession, StuckOutcome, Telemetry, Trigger,
        WakeLog, WakeOutcome, WakeSpan, WakeState,
    },
};
use std::cell::{Cell, RefCell};

const HANDLE: &str = "forgent";

#[derive(Default)]
struct Fake {
    project: Option<ProjectInfo>,
    holder: RefCell<Option<Holder>>,
    holder_roles: RefCell<Vec<String>>,
    plans_unreadable: bool,
    mark_error: Cell<Option<&'static str>>,
    events: RefCell<Vec<RaisedEvent>>,
    handled: RefCell<Vec<(String, String)>>,
    plans: Vec<Plan>,
    started: RefCell<Vec<(String, String)>>,
    start_error: RefCell<Option<String>>,
    activity: Cell<Option<Activity>>,
    /// Roles that are live in this project whatever `holder` says; `activity_by_name` overrides `activity` per head name.
    live_roles: RefCell<Vec<String>>,
    activity_by_name: RefCell<Vec<(String, Activity)>>,
    stop_error: RefCell<Option<String>>,
    stopped: RefCell<Vec<(String, String)>>,
    state: Cell<WakeState>,
    now: Cell<i64>,
    spans: RefCell<Vec<WakeSpan>>,
}
impl Fake {
    fn new() -> Self {
        Fake {
            project: Some(ProjectInfo {
                id: "p1".into(),
                handle: HANDLE.into(),
            }),
            holder: RefCell::new(Some(Holder::NotLive)),
            now: Cell::new(1_000_000),
            ..Fake::default()
        }
    }
    fn with_event(self, kind: &str) -> Self {
        let n = self.events.borrow().len();
        self.events
            .borrow_mut()
            .push(event(&format!("{n:016x}"), kind, "x"));
        self
    }
    fn ports(&self) -> Ports<'_> {
        Ports {
            project: self,
            identity: self,
            start: self,
            stop: self,
            portfolio: self,
            queue: self,
            log: self,
            clock: self,
            telemetry: self,
        }
    }
    fn wake(&self) -> WakeOutcome {
        wake(
            &self.ports(),
            &SETTINGS,
            Trigger {
                trigger: "tick",
                subject: "r1",
            },
        )
    }
}
const SETTINGS: Settings = Settings {
    active_interval_sec: 60,
    idle_interval_sec: 600,
    overdue_factor: 3,
    wake_failure_limit: 3,
};
fn event(id: &str, kind: &str, subject: &str) -> RaisedEvent {
    RaisedEvent {
        id: id.into(),
        kind: kind.into(),
        subject: subject.into(),
        ts: "2026-11-19T00:00:00Z".into(),
        reason: String::new(),
        next_command: String::new(),
    }
}
impl Project for Fake {
    fn project(&self) -> Option<ProjectInfo> {
        self.project.clone()
    }
}
impl Identity for Fake {
    fn holder(&self, role: &str) -> Holder {
        self.holder_roles.borrow_mut().push(role.into());
        if self.live_roles.borrow().iter().any(|r| r == role) {
            return Holder::Live {
                project_id: "p1".into(),
            };
        }
        self.holder.borrow().clone().unwrap()
    }
}
impl StartSession for Fake {
    fn start(&self, persona: &str, name: &str) -> Result<(), String> {
        self.started
            .borrow_mut()
            .push((persona.into(), name.into()));
        self.start_error.borrow().clone().map_or(Ok(()), Err)
    }
}
impl StopSession for Fake {
    fn activity(&self, _persona: &str, name: &str) -> Activity {
        let by_name = self.activity_by_name.borrow();
        if let Some((_, a)) = by_name.iter().find(|(n, _)| n == name) {
            return *a;
        }
        self.activity.get().unwrap_or(Activity::Unknown)
    }
    fn stop(&self, persona: &str, name: &str) -> Result<(), String> {
        self.stopped
            .borrow_mut()
            .push((persona.into(), name.into()));
        self.stop_error.borrow().clone().map_or(Ok(()), Err)
    }
}
impl Portfolio for Fake {
    fn plans(&self) -> Result<Vec<Plan>, String> {
        if self.plans_unreadable {
            return Err("plans-unreadable".into());
        }
        Ok(self.plans.clone())
    }
    fn done_dirs(&self) -> Result<Vec<String>, String> {
        Ok(Vec::new())
    }
}
impl Drain for Fake {
    fn unhandled(&self) -> Result<Vec<RaisedEvent>, QueueError> {
        Ok(self.events.borrow().clone())
    }
    fn mark_handled(&self, ids: &[String], by: &str) -> Result<usize, QueueError> {
        if let Some(code) = self.mark_error.get() {
            return Err(QueueError {
                code,
                detail: String::new(),
            });
        }
        self.events.borrow_mut().retain(|e| !ids.contains(&e.id));
        for id in ids {
            self.handled.borrow_mut().push((id.clone(), by.into()));
        }
        Ok(ids.len())
    }
}
impl WakeLog for Fake {
    fn load(&self) -> WakeState {
        self.state.get()
    }
    fn save(&self, state: WakeState) -> Result<(), String> {
        self.state.set(state);
        Ok(())
    }
}
impl Clock for Fake {
    fn now(&self) -> i64 {
        self.now.get()
    }
}
impl Telemetry for Fake {
    fn emit(&self, span: &WakeSpan) {
        self.spans.borrow_mut().push(span.clone());
    }
}

fn plan(dir: &str, status: &str) -> Plan {
    let text = format!(
        "---\ntitle: {dir}\nstatus: {status}\npriority: P2\ncreated: 2026-11-01\nfootprint:\n  - {dir}/\n---\n\n| ID | Title | DependsOn | Footprint | Wave | Status |\n|---|---|---|---|---|---|\n| 1 | t | - | `{dir}/` | 1 | todo |\n"
    );
    read_plan(dir, &text).unwrap()
}

#[test]
fn no_unhandled_event_starts_nothing() {
    let f = Fake::new();
    assert_eq!(f.wake(), WakeOutcome::NothingUnhandled);
    assert!(f.started.borrow().is_empty());
}

#[test]
fn capacity_events_with_nothing_admissible_are_handled_by_the_watcher() {
    let f = Fake::new()
        .with_event("lane-freed")
        .with_event("plan-priority-changed");
    assert_eq!(f.wake(), WakeOutcome::NothingAdmissible);
    assert!(f.started.borrow().is_empty());
    assert!(f.events.borrow().is_empty());
    assert!(f.handled.borrow().iter().all(|(_, by)| by == "watcher"));
}

#[test]
fn an_unreadable_portfolio_is_never_read_as_nothing_admissible() {
    let mut f = Fake::new().with_event("lane-freed");
    f.plans_unreadable = true;
    assert_eq!(f.wake(), WakeOutcome::Started);
    assert_eq!(f.events.borrow().len(), 1);
    assert!(f.handled.borrow().is_empty());
}

#[test]
fn capacity_events_mixed_with_other_events_start_and_are_not_marked_handled() {
    let f = Fake::new().with_event("lane-freed").with_event("plan-done");
    assert_eq!(f.wake(), WakeOutcome::Started);
    assert_eq!(f.events.borrow().len(), 2);
    assert!(f.handled.borrow().is_empty());
}

#[test]
fn a_failed_close_keeps_the_ports_refusal_code() {
    let f = Fake::new().with_event("lane-freed");
    f.mark_error.set(Some("event-unknown"));
    assert_eq!(f.wake(), WakeOutcome::StartFailed("event-unknown".into()));
    assert!(f.started.borrow().is_empty());
}

#[test]
fn a_live_holder_of_this_project_is_never_started() {
    let f = Fake::new().with_event("plan-done");
    *f.holder.borrow_mut() = Some(Holder::Live {
        project_id: "p1".into(),
    });
    assert_eq!(f.wake(), WakeOutcome::AlreadyLive);
    assert!(f.started.borrow().is_empty());
}

#[test]
fn a_live_holder_of_another_project_is_refused() {
    let f = Fake::new().with_event("plan-done");
    *f.holder.borrow_mut() = Some(Holder::Live {
        project_id: "p2".into(),
    });
    assert_eq!(f.wake(), WakeOutcome::RoleHeldOtherProject);
    assert!(f.started.borrow().is_empty());
}

#[test]
fn an_unknown_holder_is_not_read_as_not_live() {
    let f = Fake::new().with_event("plan-done");
    *f.holder.borrow_mut() = Some(Holder::Unknown);
    assert_eq!(f.wake(), WakeOutcome::IdentityUnknown);
    assert!(f.started.borrow().is_empty());
}

#[test]
fn no_project_id_refuses() {
    let mut f = Fake::new().with_event("plan-done");
    f.project = None;
    assert_eq!(f.wake(), WakeOutcome::ProjectIdMissing);
}

#[test]
fn not_live_starts_once_and_a_second_wake_in_the_grace_is_starting() {
    let f = Fake::new().with_event("plan-done");
    assert_eq!(f.wake(), WakeOutcome::Started);
    assert_eq!(
        *f.started.borrow(),
        vec![("supervisor".to_owned(), supervisor_name(HANDLE))]
    );
    assert_eq!(
        *f.holder_roles.borrow(),
        vec![format!("head:supervisor-{}", supervisor_name(HANDLE))]
    );
    f.now.set(f.now.get() + 60);
    assert_eq!(f.wake(), WakeOutcome::Starting);
    assert_eq!(f.started.borrow().len(), 1);
}

#[test]
fn failures_up_to_the_limit_then_backoff_until_the_idle_interval() {
    let f = Fake::new().with_event("plan-done");
    *f.start_error.borrow_mut() = Some("start-refused".into());
    for _ in 0..3 {
        assert_eq!(f.wake(), WakeOutcome::StartFailed("start-refused".into()));
        f.now.set(f.now.get() + 200);
    }
    assert_eq!(f.wake(), WakeOutcome::Backoff);
    assert_eq!(f.started.borrow().len(), 3);
    f.now.set(f.now.get() + 600);
    assert_eq!(f.wake(), WakeOutcome::StartFailed("start-refused".into()));
}

#[test]
fn every_wake_emits_one_span_with_trigger_and_outcome() {
    let f = Fake::new();
    f.wake();
    let spans = f.spans.borrow();
    assert_eq!(spans.len(), 1);
    assert_eq!(spans[0].name, "fgos.supervisor.wake");
    assert_eq!(spans[0].trigger, "tick");
    assert_eq!(spans[0].subject, "r1");
    assert_eq!(spans[0].outcome, "nothing-unhandled");
}

#[test]
fn done_refuses_while_an_event_is_unhandled_and_passes_after_handled() {
    let f = Fake::new().with_event("plan-done");
    let err = supervisor::done(&f).unwrap_err();
    assert_eq!(err.code, "events-unhandled");
    assert!(err.detail.starts_with('1'));
    supervisor::handled(&f, &["0000000000000000".to_owned()], "supervisor").unwrap();
    assert!(supervisor::done(&f).is_ok());
}

fn running(dir: &str, lead: Option<&str>) -> Plan {
    let key = lead.map(|l| format!("lead: {l}\n")).unwrap_or_default();
    let text = format!(
        "---\ntitle: {dir}\nstatus: running\npriority: P2\ncreated: 2026-11-01\n{key}footprint:\n  - {dir}/\n---\n\n| ID | Title | DependsOn | Footprint | Wave | Status |\n|---|---|---|---|---|---|\n| 1 | t | - | `{dir}/` | 1 | todo |\n"
    );
    read_plan(dir, &text).unwrap()
}

fn holders(role: &str) -> Holder {
    match role {
        "lead:S1" => Holder::Live {
            project_id: "p1".into(),
        },
        "lead:OTHER" => Holder::Live {
            project_id: "p2".into(),
        },
        _ => Holder::NotLive,
    }
}

#[test]
fn a_running_plan_reads_its_named_leads_liveness_in_this_project() {
    let plans = vec![
        running("alpha", Some("lead:S1")),
        running("beta", Some("lead:GONE")),
        running("gamma", Some("lead:OTHER")),
        plan("delta", "ready"),
    ];
    let view = supervisor::plans(&plans, &[], HANDLE, "p1", &holders, 4);
    assert_eq!((view.leads_live, view.max_leads), (1, 4));
    let live: Vec<_> = view.rows.iter().map(|r| r.lead_live).collect();
    assert_eq!(live, [Some(true), Some(false), Some(false), None]);
    assert!(view.rows.iter().all(|r| !r.lead_unnamed));
}

#[test]
fn a_running_plan_naming_no_lead_is_held_and_never_a_restart_candidate() {
    let plans = vec![running("alpha", None)];
    let view = supervisor::plans(&plans, &[], HANDLE, "p1", &holders, 4);
    assert_eq!(view.rows[0].lead_live, None);
    assert!(view.rows[0].lead_unnamed && !view.rows[0].admissible);
    assert_eq!(view.to_json()["plans"][0]["leadUnnamed"], true);
}

#[test]
fn a_plan_reads_its_lead_role_from_frontmatter() {
    assert_eq!(
        running("alpha", Some("lead:S1")).lead.as_deref(),
        Some("lead:S1")
    );
    assert_eq!(plan("beta", "ready").lead, None);
}

struct Roles;
impl Askers for Roles {
    fn asker(&self, id: &str) -> Option<Asker> {
        (id == "q1").then(|| Asker {
            role: "head:fgos-placeholder-forgent-p12".into(),
            persona: "fgos-placeholder".into(),
        })
    }
}

#[test]
fn successor_of_an_answered_event_is_the_askers_persona_name_and_question() {
    let s = supervisor::successor(
        &Roles,
        &event("0000000000000001", "question-answered", "q1"),
    )
    .unwrap();
    assert_eq!(
        (s.persona.as_str(), s.name.as_str(), s.for_question.as_str()),
        ("fgos-placeholder", "forgent-p12", "q1")
    );
    assert!(supervisor::successor(&Roles, &event("0000000000000002", "plan-done", "q1")).is_none());
}

fn stuck(f: &Fake) -> StuckOutcome {
    stop_stuck(
        &f.ports(),
        Trigger {
            trigger: "supervisor-stuck",
            subject: "r1",
        },
    )
}

fn live_with(activity: Activity) -> Fake {
    let f = Fake::new();
    *f.holder.borrow_mut() = Some(Holder::Live {
        project_id: "p1".into(),
    });
    f.activity.set(Some(activity));
    f
}

#[test]
fn an_idle_live_supervisor_is_stopped_and_the_wake_span_says_stopped_stuck() {
    let f = live_with(Activity::Idle);
    assert_eq!(stuck(&f), StuckOutcome::Stopped);
    assert_eq!(
        *f.stopped.borrow(),
        vec![("supervisor".to_owned(), supervisor_name(HANDLE))]
    );
    assert_eq!(f.spans.borrow()[0].outcome, "stopped-stuck");
}

#[test]
fn a_busy_or_unknown_supervisor_is_never_stopped() {
    for activity in [Activity::Busy, Activity::Unknown] {
        let f = live_with(activity);
        assert_eq!(stuck(&f), StuckOutcome::Kept);
        assert!(f.stopped.borrow().is_empty() && f.spans.borrow().is_empty());
    }
}

#[test]
fn no_live_supervisor_of_this_project_means_nothing_to_stop() {
    let f = live_with(Activity::Idle);
    *f.holder.borrow_mut() = Some(Holder::NotLive);
    assert_eq!(stuck(&f), StuckOutcome::NotLive);
    *f.holder.borrow_mut() = Some(Holder::Live {
        project_id: "other".into(),
    });
    assert_eq!(stuck(&f), StuckOutcome::NotLive);
    assert!(f.stopped.borrow().is_empty());
}

#[test]
fn a_refused_stop_reports_the_hosts_code_and_records_no_span() {
    let f = live_with(Activity::Idle);
    *f.stop_error.borrow_mut() = Some("stop-refused".into());
    assert_eq!(stuck(&f), StuckOutcome::Failed("stop-refused".into()));
    assert!(f.spans.borrow().is_empty());
}

fn finished(dir: &str, status: &str, lead: Option<&str>, source: Option<&str>) -> Plan {
    let lead = lead.map(|l| format!("lead: {l}\n")).unwrap_or_default();
    let source = source
        .map(|s| format!("source:\n  - {s}\n"))
        .unwrap_or_default();
    let text = format!(
        "---\ntitle: {dir}\nstatus: {status}\npriority: P2\ncreated: 2026-11-01\n{lead}{source}footprint:\n  - {dir}/\n---\n\n| ID | Title | DependsOn | Footprint | Wave | Status |\n|---|---|---|---|---|---|\n| 1 | t | - | `{dir}/` | 1 | todo |\n"
    );
    read_plan(dir, &text).unwrap()
}

/// A project whose planner and leads below are all live; the lead named `busy` is mid-turn.
fn closing_fixture() -> (Fake, String) {
    let planner = head_name(HANDLE, "ds-1-topic");
    let mut f = Fake::new();
    f.plans = vec![
        finished(
            "drafted",
            "draft",
            None,
            Some("plans/discussions/ds-1-topic/DISCUSSION.md"),
        ),
        finished("done-a", "done", Some("head:lead-alpha"), None),
        finished("done-b", "done", Some("lead:S1"), None),
        finished("done-c", "done", Some("head:lead-busy"), None),
        finished("working", "running", Some("lead:WORKING"), None),
    ];
    *f.live_roles.borrow_mut() = vec![
        format!("head:planner-{planner}"),
        "head:lead-alpha".into(),
        "lead:S1".into(),
        "head:lead-busy".into(),
        "lead:WORKING".into(),
    ];
    f.activity_by_name
        .borrow_mut()
        .push(("busy".to_owned(), Activity::Busy));
    f.activity.set(Some(Activity::Idle));
    (f, planner)
}

#[test]
fn one_wake_stops_the_idle_heads_of_landed_and_done_work_and_leaves_a_busy_one() {
    let (f, planner) = closing_fixture();
    assert_eq!(f.wake(), WakeOutcome::NothingUnhandled);
    assert_eq!(
        *f.stopped.borrow(),
        vec![
            ("planner".to_owned(), planner),
            ("lead".to_owned(), "alpha".to_owned()),
            ("lead".to_owned(), "lead:S1".to_owned()),
        ]
    );
    let outcomes: Vec<_> = f.spans.borrow().iter().map(|s| s.outcome).collect();
    assert_eq!(
        outcomes,
        [
            "stopped-finished",
            "stopped-finished",
            "stopped-finished",
            "nothing-unhandled"
        ]
    );
}

#[test]
fn a_head_of_finished_work_whose_activity_is_unknown_is_left_alone() {
    let (f, _) = closing_fixture();
    f.activity.set(Some(Activity::Unknown));
    f.wake();
    assert!(f.stopped.borrow().is_empty());
}

#[test]
fn a_failed_close_never_blocks_the_start_decision() {
    let (f, _) = closing_fixture();
    let f = f.with_event("plan-done");
    *f.stop_error.borrow_mut() = Some("stop-refused".into());
    assert_eq!(f.wake(), WakeOutcome::Started);
    assert!(f.spans.borrow().iter().all(|s| s.outcome != "stopped-finished"));
}
