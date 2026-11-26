//! The wake door and the supervisor verbs over fake ports, one behaviour per test.
use fgos_supervision::{
    keeper::{self, Action, Caps, Decision, History, Input, Need, Players, Raise, Snapshot},
    portfolio::{head_name, read_plan, supervisor_name, Plan},
    queue::{QueueError, RaisedEvent},
    supervisor::{self, Asker, Askers},
    wake::{
        stop_stuck, wake, Activity, Admission, Capacity, Clock, Drain, Holder, Identity, Portfolio,
        Ports, Project, ProjectInfo, Settings, StartSession, StopSession, StuckOutcome, Telemetry,
        Trigger, WakeLog, WakeOutcome, WakeSpan, WakeState,
    },
};
use std::cell::{Cell, RefCell};

const HANDLE: &str = "forgent";

#[derive(Default)]
struct Fake {
    project: Option<ProjectInfo>,
    holder: RefCell<Option<Holder>>,
    holder_roles: RefCell<Vec<String>>,
    unknown_roles: Vec<String>,
    identity_error: Option<String>,
    later_identity_error: Option<String>,
    portfolio_reads: Cell<usize>,
    plans_unreadable: bool,
    plan_unclassified: bool,
    mark_error: Cell<Option<&'static str>>,
    events: RefCell<Vec<RaisedEvent>>,
    handled: RefCell<Vec<(String, String)>>,
    plans: Vec<Plan>,
    capacity: Option<Capacity>,
    later_capacity: Option<Capacity>,
    capacity_reads: Cell<usize>,
    capacity_error: Option<String>,
    later_capacity_error: Option<String>,
    publication_attempts: Cell<usize>,
    admission_error: Option<String>,
    admitted: RefCell<Vec<(String, String)>>,
    published: RefCell<Vec<Plan>>,
    questions: Vec<String>,
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
            admission: self,
            questions: self,
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
        if self.unknown_roles.iter().any(|r| r == role) {
            return Holder::Unknown;
        }
        if self.live_roles.borrow().iter().any(|r| r == role) {
            return Holder::Live {
                project_id: "p1".into(),
            };
        }
        self.holder.borrow().clone().unwrap()
    }
    fn lead_roles(&self, _: &str) -> Result<Vec<String>, String> {
        let error = if self.capacity_reads.get() > 1 {
            self.later_identity_error
                .as_ref()
                .or(self.identity_error.as_ref())
        } else {
            self.identity_error.as_ref()
        };
        if let Some(code) = error {
            return Err(code.clone());
        }
        Ok(self
            .live_roles
            .borrow()
            .iter()
            .chain(&self.unknown_roles)
            .filter(|r| r.starts_with("head:lead-"))
            .cloned()
            .collect())
    }
}
impl supervisor::OpenQuestions for Fake {
    fn has_open(&self, reference: &str) -> bool {
        self.questions.iter().any(|r| r == reference)
    }
}
impl Admission for Fake {
    fn capacity(&self) -> Result<Capacity, String> {
        let reads = self.capacity_reads.get();
        self.capacity_reads.set(reads + 1);
        let error = if reads > 0 {
            self.later_capacity_error
                .as_ref()
                .or(self.capacity_error.as_ref())
        } else {
            self.capacity_error.as_ref()
        };
        if let Some(code) = error {
            return Err(code.clone());
        }
        let capacity = if reads > 0 {
            self.later_capacity.or(self.capacity)
        } else {
            self.capacity
        };
        Ok(capacity.unwrap_or(Capacity {
            max_leads: 4,
            free_lanes: 4,
        }))
    }
    fn admit(&self, plan: &Plan, role: &str) -> Result<(), String> {
        self.publication_attempts
            .set(self.publication_attempts.get() + 1);
        if let Some(code) = &self.admission_error {
            return Err(code.clone());
        }
        self.admitted
            .borrow_mut()
            .push((plan.dir.clone(), role.to_owned()));
        let mut published = plan.clone();
        published.status = "running".to_owned();
        published.lead = Some(role.to_owned());
        self.published.borrow_mut().push(published);
        Ok(())
    }
}
impl StartSession for Fake {
    fn start(&self, persona: &str, name: &str) -> Result<(), String> {
        if persona == "lead" {
            assert!(
                self.admitted
                    .borrow()
                    .iter()
                    .any(|(_, role)| role == &format!("head:lead-{name}")),
                "publish must precede start"
            );
        }
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
    fn read(&self) -> Result<(Vec<Plan>, Vec<String>), String> {
        self.portfolio_reads.set(self.portfolio_reads.get() + 1);
        if self.plans_unreadable {
            return Err("plans-unreadable".into());
        }
        let refused = if self.plan_unclassified {
            vec!["unclassified-ready".into()]
        } else {
            Vec::new()
        };
        Ok((self.plans.clone(), refused))
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
fn capacity_events_mixed_with_other_events_leave_judgement_to_the_supervisor() {
    let f = Fake::new().with_event("lane-freed").with_event("plan-done");
    assert_eq!(f.wake(), WakeOutcome::Started);
    assert_eq!(f.events.borrow().len(), 1);
    assert_eq!(f.events.borrow()[0].kind, "plan-done");
    assert_eq!(
        *f.handled.borrow(),
        vec![("0000000000000000".into(), "watcher".into())]
    );
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
    let view = supervisor::plans(&plans, &[], HANDLE, "p1", &holders, 4, &NoQuestions);
    assert_eq!((view.leads_live, view.max_leads), (1, 4));
    let live: Vec<_> = view.rows.iter().map(|r| r.lead_live).collect();
    assert_eq!(live, [Some(true), Some(false), Some(false), None]);
    assert!(view.rows.iter().all(|r| !r.lead_unnamed));
}

struct NoQuestions;
impl supervisor::OpenQuestions for NoQuestions {
    fn has_open(&self, _: &str) -> bool {
        false
    }
}

struct OpenRefs(&'static [&'static str]);
impl supervisor::OpenQuestions for OpenRefs {
    fn has_open(&self, reference: &str) -> bool {
        self.0.contains(&reference)
    }
}

fn two_phase_running(dir: &str, lead: &str, second: &str) -> Plan {
    let text = format!(
        "---\ntitle: {dir}\nstatus: running\npriority: P2\ncreated: 2026-11-01\nlead: {lead}\nfootprint:\n  - {dir}/\n---\n\n| ID | Title | DependsOn | Footprint | Wave | Status |\n|---|---|---|---|---|---|\n| 1 | t | - | `{dir}/` | 1 | done |\n| 2 | t | 1 | `{dir}/` | 2 | {second} |\n"
    );
    read_plan(dir, &text).unwrap()
}

fn live_here(_: &str) -> Holder {
    Holder::Live {
        project_id: "p1".into(),
    }
}

#[test]
fn a_live_lead_whose_every_open_phase_has_an_open_owner_question_holds_no_slot() {
    let plans = vec![
        two_phase_running("alpha", "lead:A", "todo"),
        two_phase_running("beta", "lead:B", "todo"),
    ];
    let asked = OpenRefs(&["plan:alpha#phase-02", "plan:beta"]);
    let view = supervisor::plans(&plans, &[], HANDLE, "p1", &live_here, 1, &asked);
    assert_eq!((view.leads_live, view.leads_waiting), (0, 2));
    assert_eq!(view.to_json()["leadsWaiting"], 2);

    let answered = OpenRefs(&["plan:alpha#phase-02"]);
    let view = supervisor::plans(&plans, &[], HANDLE, "p1", &live_here, 1, &answered);
    assert_eq!((view.leads_live, view.leads_waiting), (1, 1));

    let none = supervisor::plans(&plans, &[], HANDLE, "p1", &live_here, 1, &NoQuestions);
    assert_eq!((none.leads_live, none.leads_waiting), (2, 0));
}

#[test]
fn a_plan_with_a_not_done_phase_lacking_an_open_question_does_not_wait() {
    let plans = vec![running("alpha", Some("lead:A"))];
    let view = supervisor::plans(
        &plans,
        &[],
        HANDLE,
        "p1",
        &live_here,
        4,
        &OpenRefs(&["plan:alpha#phase-02"]),
    );
    assert_eq!((view.leads_live, view.leads_waiting), (1, 0));
}

#[test]
fn a_running_plan_naming_no_lead_is_held_and_never_a_restart_candidate() {
    let plans = vec![running("alpha", None)];
    let view = supervisor::plans(&plans, &[], HANDLE, "p1", &holders, 4, &NoQuestions);
    assert_eq!(view.rows[0].lead_live, None);
    assert!(view.rows[0].lead_unnamed && !view.rows[0].admissible);
    let json = view.to_json();
    assert_eq!(json["plans"][0]["leadUnnamed"], true);
    assert!(json["plans"][0].get("overlaps").is_none());
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
        // The same lane role leads a done plan and a working one: the session moved on, so it is not stopped.
        finished("done-d", "done", Some("lead:WORKING"), None),
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
fn one_wake_stops_the_idle_heads_of_landed_and_done_work_and_leaves_a_busy_one_and_a_lead_of_another_plan(
) {
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
    let spans = f.spans.borrow();
    assert!(spans.iter().all(|s| s.outcome != "stopped-finished"));
    let failed: Vec<_> = spans
        .iter()
        .filter(|s| s.outcome == "stop-failed")
        .map(|s| (s.subject.as_str(), s.error.as_str()))
        .collect();
    assert_eq!(
        failed,
        [
            (
                &*format!("head:planner-{}", head_name(HANDLE, "ds-1-topic")),
                "stop-refused"
            ),
            ("head:lead-alpha", "stop-refused"),
            ("lead:S1", "stop-refused"),
        ]
    );
}

#[test]
fn a_stopped_head_is_the_subject_of_its_span() {
    let (f, planner) = closing_fixture();
    f.wake();
    let subjects: Vec<_> = f
        .spans
        .borrow()
        .iter()
        .filter(|s| s.outcome == "stopped-finished")
        .map(|s| s.subject.clone())
        .collect();
    assert_eq!(
        subjects,
        [
            format!("head:planner-{planner}"),
            "head:lead-alpha".into(),
            "lead:S1".into()
        ]
    );
}

#[test]
fn a_short_lead_role_is_one_to_sixty_four_safe_characters() {
    use fgos_supervision::wake::is_short_lead_role;
    assert!(is_short_lead_role("lead:S1"));
    assert!(is_short_lead_role(&format!("lead:{}", "a".repeat(64))));
    assert!(!is_short_lead_role(&format!("lead:{}", "a".repeat(65))));
    assert!(!is_short_lead_role("lead:"));
    assert!(!is_short_lead_role("lead:a b"));
    assert!(!is_short_lead_role("lead:a;b"));
}

fn admission_fixture(max_leads: usize, free_lanes: usize) -> Fake {
    let mut f = Fake::new().with_event("plan-became-ready");
    f.capacity = Some(Capacity {
        max_leads,
        free_lanes,
    });
    // Reverse input order: the door, not the adapter, must order admissions.
    f.plans = vec![plan("beta", "ready"), plan("alpha", "ready")];
    f
}

fn decisions(f: &Fake) -> Vec<(String, String)> {
    f.spans
        .borrow()
        .iter()
        .filter(|s| s.subject.starts_with("plan:"))
        .map(|s| (s.subject.clone(), s.error.clone()))
        .collect()
}

// No existing proof exercises admission: it previously belonged to the LLM skill.
#[test]
fn ready_plans_are_published_then_started_in_order_under_the_cap_without_a_supervisor() {
    let f = admission_fixture(2, 2);
    assert_eq!(f.wake(), WakeOutcome::NothingAdmissible);
    assert_eq!(
        *f.started.borrow(),
        vec![
            ("lead".to_owned(), head_name(HANDLE, "alpha")),
            ("lead".to_owned(), head_name(HANDLE, "beta")),
        ]
    );
    assert_eq!(
        decisions(&f),
        vec![
            ("plan:alpha".into(), "admitted".into()),
            ("plan:beta".into(), "admitted".into()),
        ]
    );
    assert!(f.events.borrow().is_empty());
}

#[test]
fn a_ready_plan_over_the_live_lead_cap_is_held_with_a_reason() {
    let mut f = admission_fixture(1, 2);
    f.plans.push(running("working", Some("head:lead-working")));
    f.live_roles.borrow_mut().push("head:lead-working".into());
    assert_eq!(f.wake(), WakeOutcome::NothingAdmissible);
    assert!(f.admitted.borrow().is_empty());
    assert!(decisions(&f)
        .iter()
        .all(|(_, reason)| reason == "held-max-leads"));
}

#[test]
fn no_free_lane_holds_ready_plans_without_starting_the_supervisor() {
    let f = admission_fixture(2, 0);
    assert_eq!(f.wake(), WakeOutcome::NothingAdmissible);
    assert!(f.started.borrow().is_empty());
    assert!(decisions(&f)
        .iter()
        .all(|(_, reason)| reason == "held-no-lane"));
}

#[test]
fn admissions_reserve_a_lane_before_the_new_lead_can_take_its_worker_seat() {
    let f = admission_fixture(2, 1);
    f.wake();
    assert_eq!(f.admitted.borrow().len(), 1);
    assert_eq!(decisions(&f)[1].1, "held-no-lane");
}

#[test]
fn an_unknown_lead_identity_holds_a_slot_even_with_an_open_owner_question() {
    for named in [false, true] {
        let mut f = admission_fixture(1, 2);
        if named {
            f.plans.push(running("working", Some("head:lead-working")));
            f.questions.push("plan:working".into());
        }
        f.unknown_roles.push("head:lead-working".into());
        assert_eq!(f.wake(), WakeOutcome::NothingAdmissible);
        assert!(f.started.borrow().is_empty());
        assert!(f.admitted.borrow().is_empty());
    }
}

#[test]
fn admission_uses_identity_leads_not_only_the_ones_named_by_running_plans() {
    let f = admission_fixture(1, 2);
    f.live_roles.borrow_mut().push("head:lead-orphan".into());
    f.wake();
    assert!(f.started.borrow().is_empty());
    assert!(f.admitted.borrow().is_empty());
}

// The static cap cases cannot observe machine facts changing during a paths land.
#[test]
fn admission_rechecks_caps_and_lane_availability_after_each_publication() {
    for (max_leads, free_lanes) in [(1, 2), (2, 0)] {
        let mut f = admission_fixture(2, 2);
        f.later_capacity = Some(Capacity {
            max_leads,
            free_lanes,
        });
        assert_eq!(f.wake(), WakeOutcome::NothingAdmissible);
        assert_eq!(f.admitted.borrow().len(), 1);
        assert_eq!(f.started.borrow().len(), 1);
    }
}

#[test]
fn an_unreadable_identity_directory_refuses_admission_without_consuming_the_event() {
    let mut f = admission_fixture(2, 2);
    f.identity_error = Some("identity-unreadable".into());
    assert_eq!(f.wake(), WakeOutcome::Started);
    assert!(f.admitted.borrow().is_empty());
    assert_eq!(
        decisions(&f),
        vec![("plan:alpha".into(), "identity-unreadable".into())]
    );
    assert_eq!(f.events.borrow().len(), 1);
}

#[test]
fn admission_preserves_the_live_waiting_leads_slot_exemption() {
    let mut f = admission_fixture(1, 1);
    f.plans.push(running("working", Some("lead:WAITING")));
    f.live_roles.borrow_mut().push("lead:WAITING".into());
    f.questions.push("plan:working#phase-01".into());
    f.wake();
    assert_eq!(f.admitted.borrow().len(), 1);
    assert_eq!(decisions(&f)[0].1, "admitted");
    assert_eq!(f.started.borrow().len(), 1);
}

#[test]
fn a_failed_lead_start_keeps_its_published_admission_and_records_the_host_code() {
    let f = admission_fixture(1, 2);
    *f.start_error.borrow_mut() = Some("host-unavailable".into());
    f.wake();
    assert_eq!(f.admitted.borrow().len(), 1);
    let published = f.published.borrow();
    assert_eq!(published[0].status, "running");
    assert_eq!(
        published[0].lead,
        Some(format!("head:lead-{}", head_name(HANDLE, "alpha")))
    );
    assert_eq!(
        decisions(&f)[0],
        ("plan:alpha".into(), "start-failed:host-unavailable".into())
    );
    assert_eq!(
        f.events.borrow().len(),
        1,
        "failed admission still needs judgement"
    );
}

#[test]
fn a_failed_publication_never_starts_a_lead() {
    let mut f = admission_fixture(2, 2);
    f.admission_error = Some("land-gate-failed".into());
    f.wake();
    assert!(f.admitted.borrow().is_empty());
    assert!(f
        .started
        .borrow()
        .iter()
        .all(|(persona, _)| persona == "supervisor"));
    assert_eq!(
        decisions(&f),
        vec![(
            "plan:alpha".into(),
            "publish-failed:land-gate-failed".into()
        )]
    );
    assert_eq!(
        f.publication_attempts.get(),
        1,
        "lower-priority plans must wait"
    );
    assert_eq!(f.events.borrow().len(), 1);
}

#[test]
fn two_overlapping_ready_plans_are_both_admitted_in_one_wake() {
    let mut f = admission_fixture(2, 2);
    f.plans[0].footprint = f.plans[1].footprint.clone();
    assert_eq!(f.wake(), WakeOutcome::NothingAdmissible);
    assert_eq!(f.admitted.borrow().len(), 2);
    assert_eq!(
        decisions(&f),
        vec![
            ("plan:alpha".into(), "admitted".into()),
            ("plan:beta".into(), "admitted".into()),
        ]
    );
    assert_eq!(f.started.borrow().len(), 2);
}

#[test]
fn a_dependency_hold_is_recorded_and_never_needs_an_llm() {
    let mut f = admission_fixture(2, 2);
    for p in &mut f.plans {
        p.blocked_by.push("unfinished".into());
    }
    assert_eq!(f.wake(), WakeOutcome::NothingAdmissible);
    assert!(f.started.borrow().is_empty());
    assert!(decisions(&f)
        .iter()
        .all(|(_, reason)| reason == "held-blocked"));
}

#[test]
fn an_unclassifiable_ready_plan_keeps_the_event_for_judgement_without_blocking_readable_plans() {
    let mut f = admission_fixture(2, 2);
    f.plan_unclassified = true;
    assert_eq!(f.wake(), WakeOutcome::Started);
    assert_eq!(f.admitted.borrow().len(), 2);
    assert_eq!(f.events.borrow().len(), 1);
}

#[test]
fn a_ready_plan_with_an_invalid_footprint_goes_to_judgement() {
    let mut f = admission_fixture(2, 2);
    f.plans[0].footprint.clear();
    assert_eq!(f.wake(), WakeOutcome::Started);
    assert_eq!(decisions(&f)[1].1, "footprint-empty");
    assert_eq!(f.admitted.borrow().len(), 1);
}

#[test]
fn admission_fact_errors_preserve_judgement_events_even_after_a_lead_started() {
    // Static config/Identity tests cannot observe a refusal on a later admission iteration.
    struct BrokenKeeper<'a> {
        fake: &'a Fake,
        failure: &'static str,
        raised: RefCell<Vec<Decision>>,
    }
    impl Snapshot for BrokenKeeper<'_> {
        fn read(&self) -> Result<(Vec<Input>, Caps), String> {
            if self.failure == "source" {
                return Err("source-failed".into());
            }
            Ok((
                vec![Input {
                    record: serde_json::from_value(serde_json::json!({"item": "a", "step": "b"}))
                        .unwrap(),
                    item_closed: false,
                    actor: keeper::ActorState::Unknown,
                }],
                Caps {
                    starts: 0,
                    held: Default::default(),
                },
            ))
        }
    }
    impl History for BrokenKeeper<'_> {
        fn read(&self) -> Result<Vec<Decision>, String> {
            Ok(vec![])
        }
        fn record(&self, _: &Decision) -> Result<(), String> {
            Ok(())
        }
    }
    impl Players for BrokenKeeper<'_> {
        fn start(&self, _: &Decision, _: &Need) -> Result<(), String> {
            panic!("no player")
        }
        fn wake(&self, _: &Decision, _: &Need) -> Result<(), String> {
            panic!("no player")
        }
    }
    impl Raise for BrokenKeeper<'_> {
        fn raise(&self, decision: &Decision, _: i64) -> Result<(), String> {
            self.raised.borrow_mut().push(decision.clone());
            if decision.item != "keeper" || self.failure == "all-raises" {
                return Err("raise-failed".into());
            }
            let Action::Raise { event: kind, .. } = &decision.action else {
                panic!("not a raise")
            };
            self.fake
                .events
                .borrow_mut()
                .push(event("keeper-error", kind, &decision.item));
            Ok(())
        }
    }
    // Keeper source/raise failures must fall through too, even if reporting the failure fails.
    for failure in ["source", "raise", "all-raises"] {
        let f = admission_fixture(2, 2);
        let admission = f.ports();
        let broken = BrokenKeeper {
            fake: &f,
            failure,
            raised: RefCell::new(vec![]),
        };
        let ports = fgos_supervision::wake::ScheduledPorts {
            admission: &admission,
            keeper: keeper::Ports {
                snapshot: &broken,
                history: &broken,
                players: &broken,
                raise: &broken,
            },
        };
        assert_eq!(
            wake(
                &ports,
                &SETTINGS,
                Trigger {
                    trigger: "tick",
                    subject: "r1"
                }
            ),
            WakeOutcome::Started
        );
        assert_eq!(f.admitted.borrow().len(), 2);
        assert_eq!(f.started.borrow().last().unwrap().0, "supervisor");
        assert!(
            f.handled.borrow().is_empty(),
            "capacity event stays open for judgement"
        );
        let raised = broken.raised.borrow();
        let last = raised.last().unwrap();
        assert!(matches!(&last.action, Action::Raise { event, .. } if event == "needs-judgement"));
        assert_eq!(
            last.reason,
            if failure == "source" {
                "keeper-failed:source-failed"
            } else {
                "keeper-failed:raise-failed"
            }
        );
        assert_eq!(
            f.spans.borrow().last().unwrap().error,
            if failure == "source" {
                "source-failed"
            } else {
                "raise-failed"
            }
        );
    }
    for kind in [
        "plan-done",
        "question-answered",
        "lead-ended",
        "discussion-settled",
    ] {
        for after_start in [false, true] {
            for identity in [false, true] {
                let mut f = admission_fixture(2, 2).with_event(kind);
                let error = Some("facts-unreadable".into());
                match (identity, after_start) {
                    (false, false) => f.capacity_error = error,
                    (false, true) => f.later_capacity_error = error,
                    (true, false) => f.identity_error = error,
                    (true, true) => f.later_identity_error = error,
                }
                assert_eq!(f.wake(), WakeOutcome::Started);
                assert_eq!(f.admitted.borrow().len(), usize::from(after_start));
                assert_eq!(f.started.borrow().last().unwrap().0, "supervisor");
                let decisions = decisions(&f);
                assert_eq!(
                    decisions.last().unwrap(),
                    &(
                        format!("plan:{}", if after_start { "beta" } else { "alpha" }),
                        "facts-unreadable".into(),
                    )
                );
                assert_eq!(f.events.borrow().len(), 2);
            }
        }
    }
}

#[test]
fn one_portfolio_snapshot_serves_finished_head_closure_and_admission() {
    // Admission-only tests do not prove that closure shares the same trunk snapshot.
    let mut f = admission_fixture(3, 2);
    let mut done = running("finished", Some("head:lead-finished"));
    done.status = "done".into();
    f.plans.push(done);
    f.live_roles.borrow_mut().push("head:lead-finished".into());
    f.activity.set(Some(Activity::Idle));
    assert_eq!(f.wake(), WakeOutcome::NothingAdmissible);
    assert_eq!(f.portfolio_reads.get(), 1);
    assert_eq!(
        f.stopped.borrow().as_slice(),
        &[("lead".into(), "finished".into())]
    );
    assert_eq!(f.admitted.borrow().len(), 2);
}

#[test]
fn unreadable_admission_config_refuses_instead_of_falling_back_to_a_cap() {
    let mut f = admission_fixture(2, 2);
    f.capacity_error = Some("config-invalid:supervisor.maxLeads".into());
    assert_eq!(f.wake(), WakeOutcome::Started);
    assert!(f.admitted.borrow().is_empty());
    assert_eq!(
        f.spans.borrow()[0].error,
        "config-invalid:supervisor.maxLeads"
    );
    assert_eq!(f.events.borrow().len(), 1);
}
