//! The wake door admits ready plans within caps, then starts the project's supervisor only for
//! events that still need judgement. Unknown Identity never means free. Every call and each
//! admission decision records an `fgos.supervisor.wake` span.
use crate::{
    keeper::{self, Action, Decision, Raise},
    portfolio::{admission_hold, collisions, head_name, order, supervisor_name, Plan},
    queue::{Queue, QueueError, RaisedEvent},
    supervisor::{lead_counts, OpenQuestions},
};

/// The event kinds that only mean "capacity changed": they matter only when a plan can start.
pub const CAPACITY_KINDS: [&str; 2] = ["lane-freed", "plan-priority-changed"];

/// The queue as the wake door and the supervisor verbs see it; `Queue` is the real one.
pub trait Drain {
    fn unhandled(&self) -> Result<Vec<RaisedEvent>, QueueError>;
    fn mark_handled(&self, ids: &[String], by: &str) -> Result<usize, QueueError>;
}
impl Drain for Queue {
    fn unhandled(&self) -> Result<Vec<RaisedEvent>, QueueError> {
        Queue::unhandled(self)
    }
    fn mark_handled(&self, ids: &[String], by: &str) -> Result<usize, QueueError> {
        Queue::mark_handled(self, ids, by)
    }
}

/// This project's id and handle, as the identity crate's project read answers.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProjectInfo {
    pub id: String,
    pub handle: String,
}
pub trait Project {
    /// `None` when the project has no id.
    fn project(&self) -> Option<ProjectInfo>;
}

/// Who holds a role right now.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Holder {
    Live { project_id: String },
    NotLive,
    Unknown,
}
pub trait Identity {
    fn holder(&self, role: &str) -> Holder;
    /// All lead head roles in this project, including holders whose liveness is unknown.
    /// A directory that cannot be read refuses rather than reporting no leads.
    fn lead_roles(&self, project_id: &str) -> Result<Vec<String>, String>;
}

/// Starts a session. The adapter runs `<host> session start <persona> --name <name>` with the
/// environment a timer start needs. `Err` carries the host's code.
pub trait StartSession {
    fn start(&self, persona: &str, name: &str) -> Result<(), String>;
}

/// Whether a head is between turns. Anything the host cannot tell is `Unknown`, never `Idle`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Activity {
    Idle,
    /// Mid-turn, or waiting on a running request ticket.
    Busy,
    Unknown,
}

/// Stops a session. The adapter runs `<host> session stop supervisor --name <name>`, which writes
/// `retiredAt`; `activity` reads the head's agent status and its request tickets, never screen text.
pub trait StopSession {
    fn activity(&self, persona: &str, name: &str) -> Activity;
    /// `Err` carries the host's code.
    fn stop(&self, persona: &str, name: &str) -> Result<(), String>;
}

/// The plans the supervisor could start, over the portfolio reader.
pub trait Portfolio {
    /// One trunk snapshot: readable plans and refused ready-plan directories requiring judgement.
    fn read(&self) -> Result<(Vec<Plan>, Vec<String>), String>;
}

/// Admission's config and machine lane snapshot, read only through their owning doors.
#[derive(Debug, Clone, Copy)]
pub struct Capacity {
    pub max_leads: usize,
    pub free_lanes: usize,
}

pub trait Admission {
    fn capacity(&self) -> Result<Capacity, String>;
    /// Publish running status and the lead role through the existing paths land door. A stale
    /// plan or failed publication refuses; the wake never starts a lead before this succeeds.
    fn admit(&self, plan: &Plan, role: &str) -> Result<(), String>;
}

/// The last start attempt and the consecutive failures since the last success.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct WakeState {
    pub last_attempt: Option<i64>,
    pub failures: u32,
}
/// `.fgos/runtime/supervision/wake.json`, written atomically by the adapter.
pub trait WakeLog {
    /// Missing or unreadable reads as the default (no attempt yet).
    fn load(&self) -> WakeState;
    fn save(&self, state: WakeState) -> Result<(), String>;
}

pub trait Clock {
    fn now(&self) -> i64;
}

/// The `fgos.supervisor.wake` span: `trigger` and `outcome` attrs on the trigger's `event` subject (a queue event or row id).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WakeSpan {
    pub name: &'static str,
    pub subject: String,
    pub trigger: String,
    pub outcome: &'static str,
    /// The refusal code, or admission's reason code (including `start-failed:<host code>`).
    /// Admission reuses this string attribute so the span stays inside its registered vocabulary.
    pub error: String,
}
pub trait Telemetry {
    fn emit(&self, span: &WakeSpan);
}

pub struct Ports<'a> {
    pub project: &'a dyn Project,
    pub identity: &'a dyn Identity,
    pub start: &'a dyn StartSession,
    pub stop: &'a dyn StopSession,
    pub portfolio: &'a dyn Portfolio,
    pub admission: &'a dyn Admission,
    pub questions: &'a dyn OpenQuestions,
    pub queue: &'a dyn Drain,
    pub log: &'a dyn WakeLog,
    pub clock: &'a dyn Clock,
    pub telemetry: &'a dyn Telemetry,
}

/// The wake door's composition seam. Existing callers supply admission ports alone; the source
/// adapters supply `ScheduledPorts` to run the keeper through the same door, after admission.
pub trait WakeContext {
    fn admission_ports(&self) -> &Ports<'_>;
    fn keeper_ports(&self) -> Option<&crate::keeper::Ports<'_>> {
        None
    }
}
impl WakeContext for Ports<'_> {
    fn admission_ports(&self) -> &Ports<'_> {
        self
    }
}

pub struct ScheduledPorts<'a> {
    pub admission: &'a Ports<'a>,
    pub keeper: crate::keeper::Ports<'a>,
}
impl WakeContext for ScheduledPorts<'_> {
    fn admission_ports(&self) -> &Ports<'_> {
        self.admission
    }
    fn keeper_ports(&self) -> Option<&crate::keeper::Ports<'_>> {
        Some(&self.keeper)
    }
}

impl Raise for Queue {
    fn raise(&self, decision: &Decision, now: i64) -> Result<(), String> {
        let Action::Raise { event, id } = &decision.action else {
            return Err("keeper-not-a-raise".into());
        };
        let seconds = u64::try_from(now).map_err(|_| "keeper-invalid-now")?;
        Queue::raise(
            self,
            RaisedEvent {
                // Keep domain IDs containing ':' distinct even when their logical display keys match.
                id: crate::watcher::event_id(
                    "keeper",
                    &serde_json::to_string(&(&decision.item, &decision.step))
                        .map_err(|e| e.to_string())?,
                    id,
                ),
                kind: event.clone(),
                subject: format!("{}:{}", decision.item, decision.step),
                ts: fgos_identity::text::iso_utc(seconds, 0),
                reason: decision.reason.clone(),
                next_command: String::new(),
            },
        )
        .map(|_| ())
        .map_err(|e| format!("{}: {}", e.code, e.detail))
    }
}

/// Execute the pure keeper's decisions through the wake door's ports. Any unreadable history,
/// failed raise, failed journal write or failed player effect refuses rather than guessing
/// capacity or losing an alarm.
pub fn run_keeper(ports: &keeper::Ports, now: i64) -> Result<Vec<Decision>, String> {
    let (records, caps) = ports.snapshot.read()?;
    let past = ports.history.read()?;
    let decisions = keeper::decide(&records, now, &past, &caps);
    for d in &decisions {
        if matches!(d.action, Action::Raise { .. }) {
            ports.raise.raise(d, now)?;
            ports.history.record(d)?;
        } else {
            ports.history.record(d)?;
            if matches!(d.action, Action::Start | Action::Wake) {
                let need = records
                    .iter()
                    .find(|r| {
                        r.record.outcome.is_none()
                            && r.record.item == d.item
                            && r.record.step == d.step
                    })
                    .and_then(|r| r.record.needs.as_ref())
                    .ok_or("keeper-needs-missing")?;
                match d.action {
                    Action::Start => ports.players.start(d, need)?,
                    Action::Wake => ports.players.wake(d, need)?,
                    _ => unreachable!(),
                }
            }
        }
    }
    Ok(decisions)
}

/// The wake settings, from `watcher.*` config.
#[derive(Debug, Clone, Copy)]
pub struct Settings {
    pub active_interval_sec: i64,
    pub idle_interval_sec: i64,
    pub overdue_factor: i64,
    pub wake_failure_limit: u32,
}

/// What a call to `wake` decided: the vocabulary of `observe-kinds.json` `fgos.supervisor.outcome`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WakeOutcome {
    Started,
    AlreadyLive,
    Starting,
    NothingUnhandled,
    NothingAdmissible,
    IdentityUnknown,
    RoleHeldOtherProject,
    ProjectIdMissing,
    /// The refusal code of the port that failed: the host's start, or the queue or wake log that
    /// blocked a start. The outcome vocabulary has no value for a failed queue read or close.
    StartFailed(String),
    Backoff,
}

/// What `stop_stuck` decided about a supervisor that left events unhandled.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StuckOutcome {
    /// The idle live supervisor was stopped; the next tick starts a fresh one.
    Stopped,
    /// Live but busy or unknown: left alone, the notification already went out.
    Kept,
    /// No live supervisor of this project: nothing to stop.
    NotLive,
    /// The host's refusal code.
    Failed(String),
}
impl WakeOutcome {
    pub fn as_str(&self) -> &'static str {
        match self {
            WakeOutcome::Started => "started",
            WakeOutcome::AlreadyLive => "already-live",
            WakeOutcome::Starting => "starting",
            WakeOutcome::NothingUnhandled => "nothing-unhandled",
            WakeOutcome::NothingAdmissible => "nothing-admissible",
            WakeOutcome::IdentityUnknown => "identity-unknown",
            WakeOutcome::RoleHeldOtherProject => "role-held-other-project",
            WakeOutcome::ProjectIdMissing => "project-id-missing",
            WakeOutcome::StartFailed(_) => "start-failed",
            WakeOutcome::Backoff => "backoff",
        }
    }
}

/// The role the project's supervisor head holds.
pub fn supervisor_role(handle: &str) -> String {
    format!("head:supervisor-{}", supervisor_name(handle))
}

/// What `wake` was asked about: the watcher's trigger and the row it came from.
#[derive(Debug, Clone, Copy)]
pub struct Trigger<'a> {
    pub trigger: &'a str,
    pub subject: &'a str,
}

/// Stop this project's supervisor when it is live and idle yet its queue is not shrinking.
/// A busy or unknown head is never stopped: an in-progress land must finish.
pub fn stop_stuck(ports: &Ports, trigger: Trigger) -> StuckOutcome {
    let Some(project) = ports.project.project() else {
        return StuckOutcome::NotLive;
    };
    match ports.identity.holder(&supervisor_role(&project.handle)) {
        Holder::Live { project_id } if project_id == project.id => {}
        _ => return StuckOutcome::NotLive,
    }
    let name = supervisor_name(&project.handle);
    if ports.stop.activity("supervisor", &name) != Activity::Idle {
        return StuckOutcome::Kept;
    }
    if let Err(code) = ports.stop.stop("supervisor", &name) {
        return StuckOutcome::Failed(code);
    }
    ports.telemetry.emit(&WakeSpan {
        name: "fgos.supervisor.wake",
        subject: trigger.subject.to_owned(),
        trigger: trigger.trigger.to_owned(),
        outcome: "stopped-stuck",
        error: String::new(),
    });
    StuckOutcome::Stopped
}

/// The discussion directory a plan's `source` entry names (`plans/discussions/<dir>/...`).
fn discussion_dir(source: &str) -> Option<&str> {
    let mut parts = source.split('/');
    parts.by_ref().find(|p| *p == "discussions")?;
    parts.next().filter(|d| !d.is_empty())
}

/// The persona and name a finished lead is stopped under: a `head:lead-<name>` role is the head
/// `lead` `<name>`; a short `lead:<LANE>` role has no head name, so the role itself is the name
/// (the host's `session stop` resolves it through Identity).
fn lead_target(role: &str) -> Option<(&str, &str)> {
    match role.strip_prefix("head:lead-") {
        Some(name) if !name.is_empty() => Some(("lead", name)),
        _ if is_short_lead_role(role) => Some(("lead", role)),
        _ => None,
    }
}

/// A hand-started lead's short role: `lead:` and 1-64 of `[A-Za-z0-9_-]`. The host's `session stop` accepts the same
/// pattern (`SHORT_LEAD_ROLE` in `src/session-host/head-stop.mjs`).
pub fn is_short_lead_role(role: &str) -> bool {
    role.strip_prefix("lead:").is_some_and(|lane| {
        (1..=64).contains(&lane.len())
            && lane
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b == b'_' || b == b'-')
    })
}

/// Stop the planners and leads whose work is finished: the planner of a discussion whose plan has
/// landed (`draft` or `ready`), and the lead of a `done` plan. Only a live head of this project
/// that is `Idle` is stopped; `Busy`, `Unknown` and a failed stop leave it for the next wake. Never
/// blocks the start decision.
fn close_finished(ports: &Ports, trigger: Trigger, plans: &[Plan], done: &[String]) {
    let Some(project) = ports.project.project() else {
        return;
    };
    let is_done = |plan: &Plan| plan.status == "done" || done.contains(&plan.dir);
    // A lane session that moved on to another plan keeps its role: a role that leads any plan not yet done is not finished.
    let still_leading: Vec<&String> = plans
        .iter()
        .filter(|p| !is_done(p))
        .filter_map(|p| p.lead.as_ref())
        .collect();
    let mut targets: Vec<(String, String, String)> = Vec::new();
    for plan in plans {
        if is_done(plan) {
            if let Some(role) = plan.lead.as_ref().filter(|r| !still_leading.contains(r)) {
                if let Some((persona, name)) = lead_target(role) {
                    targets.push((role.clone(), persona.to_owned(), name.to_owned()));
                }
            }
        }
        if plan.status == "draft" || plan.status == "ready" {
            for dir in plan.source.iter().filter_map(|s| discussion_dir(s)) {
                let name = head_name(&project.handle, dir);
                targets.push((format!("head:planner-{name}"), "planner".to_owned(), name));
            }
        }
    }
    let mut seen: Vec<String> = Vec::new();
    for (role, persona, name) in targets {
        if seen.contains(&role) {
            continue;
        }
        seen.push(role.clone());
        match ports.identity.holder(&role) {
            Holder::Live { project_id } if project_id == project.id => {}
            _ => continue,
        }
        if ports.stop.activity(&persona, &name) != Activity::Idle {
            continue;
        }
        // The span names the stopped head, not the trigger row; a refusal is recorded with its code.
        let (outcome, error) = match ports.stop.stop(&persona, &name) {
            Ok(()) => ("stopped-finished", String::new()),
            Err(code) => ("stop-failed", code),
        };
        ports.telemetry.emit(&WakeSpan {
            name: "fgos.supervisor.wake",
            subject: role,
            trigger: trigger.trigger.to_owned(),
            outcome,
            error,
        });
    }
}

/// Start the supervisor if there is work for it and none is live.
pub fn wake(context: &impl WakeContext, settings: &Settings, trigger: Trigger) -> WakeOutcome {
    let ports = context.admission_ports();
    let needs_judgement = match ports.portfolio.read() {
        Ok((plans, refused)) => {
            let done: Vec<String> = plans
                .iter()
                .filter(|p| p.status == "done")
                .map(|p| p.dir.clone())
                .collect();
            close_finished(ports, trigger, &plans, &done);
            admit_ready(ports, trigger, plans, &done, !refused.is_empty())
        }
        Err(_) => true,
    };
    let keeper_result = context
        .keeper_ports()
        .map(|keeper| run_keeper(keeper, ports.clock.now()))
        .transpose();
    let keeper_error = keeper_result.err();
    if let (Some(code), Some(keeper)) = (&keeper_error, context.keeper_ports()) {
        let failure = Decision {
            item: "keeper".into(),
            step: trigger.subject.into(),
            action: Action::Raise {
                event: "needs-judgement".into(),
                id: format!("keeper-failed:{}:{code}", trigger.subject),
            },
            reason: format!("keeper-failed:{code}"),
        };
        let already_recorded = keeper.history.read().is_ok_and(|past| {
            past.iter()
                .rev()
                .find(|d| d.item == failure.item && d.step == failure.step)
                == Some(&failure)
        });
        // Even a broken raise/history port must not bypass judgement of the existing queue.
        if !already_recorded && keeper.raise.raise(&failure, ports.clock.now()).is_ok() {
            let _ = keeper.history.record(&failure);
        }
    }
    let outcome = decide(ports, settings, needs_judgement || keeper_error.is_some());
    ports.telemetry.emit(&WakeSpan {
        name: "fgos.supervisor.wake",
        subject: trigger.subject.to_owned(),
        trigger: trigger.trigger.to_owned(),
        outcome: outcome.as_str(),
        error: match &outcome {
            WakeOutcome::StartFailed(code) => code.clone(),
            _ => keeper_error.unwrap_or_default(),
        },
    });
    outcome
}

/// Admit in portfolio order before considering an LLM wake. Holds are final capacity decisions;
/// an unreadable or unclassifiable plan and a failed side effect leave the event for judgement.
fn admit_ready(
    ports: &Ports,
    trigger: Trigger,
    mut plans: Vec<Plan>,
    done: &[String],
    mut judgement: bool,
) -> bool {
    let Some(project) = ports.project.project() else {
        return false;
    };
    order(&mut plans);
    let mut reserved_roles = Vec::new();
    let mut reserved_lanes = 0;
    for i in 0..plans.len() {
        if plans[i].status != "ready" {
            continue;
        }
        let name = head_name(&project.handle, &plans[i].dir);
        let role = format!("head:lead-{name}");
        // Publication can wait on the land door. Re-read machine facts before every admission,
        // retaining this wake's reservations until the newly started heads acquire Identity roles.
        let facts = ports.admission.capacity().and_then(|capacity| {
            ports
                .identity
                .lead_roles(&project.id)
                .map(|roles| (capacity, roles))
        });
        let (capacity, roles) = match facts {
            Ok(facts) => facts,
            Err(code) => {
                ports.telemetry.emit(&WakeSpan {
                    name: "fgos.supervisor.wake",
                    subject: format!("plan:{}", plans[i].dir),
                    trigger: trigger.trigger.to_owned(),
                    outcome: "nothing-admissible",
                    error: code,
                });
                judgement = true;
                break;
            }
        };
        let (leads, _) = lead_counts(
            &plans,
            &roles,
            &project.id,
            &|role| {
                if reserved_roles.iter().any(|r| r == role) {
                    Holder::Unknown
                } else {
                    ports.identity.holder(role)
                }
            },
            ports.questions,
        );
        let mut outcome = "nothing-admissible";
        let mut publication_failed = false;
        let reason = if let Some(reason) = admission_hold(&plans[i], &plans, done) {
            if reason != "held-blocked" && reason != "held-footprint-overlap" {
                judgement = true;
            }
            reason.to_owned()
        } else if leads >= capacity.max_leads {
            "held-max-leads".to_owned()
        } else if capacity.free_lanes <= reserved_lanes {
            "held-no-lane".to_owned()
        } else if collisions(&plans, &project.handle)
            .iter()
            .any(|(a, b)| a == &plans[i].dir || b == &plans[i].dir)
            || ports.identity.holder(&role) != Holder::NotLive
        {
            judgement = true;
            "lead-role-unavailable".to_owned()
        } else {
            match ports.admission.admit(&plans[i], &role) {
                Err(code) => {
                    judgement = true;
                    publication_failed = true;
                    format!("publish-failed:{code}")
                }
                Ok(()) => {
                    // Reserve the footprint and both budgets even if the host refuses the start.
                    plans[i].status = "running".to_owned();
                    plans[i].lead = Some(role.clone());
                    reserved_roles.push(role);
                    reserved_lanes += 1;
                    match ports.start.start("lead", &name) {
                        Ok(()) => {
                            outcome = "started";
                            "admitted".to_owned()
                        }
                        Err(code) => {
                            judgement = true;
                            outcome = "start-failed";
                            format!("start-failed:{code}")
                        }
                    }
                }
            }
        };
        ports.telemetry.emit(&WakeSpan {
            name: "fgos.supervisor.wake",
            subject: format!("plan:{}", plans[i].dir),
            trigger: trigger.trigger.to_owned(),
            outcome,
            error: reason,
        });
        if publication_failed {
            break;
        }
    }
    judgement
}

fn decide(ports: &Ports, s: &Settings, needs_judgement: bool) -> WakeOutcome {
    let Some(project) = ports.project.project() else {
        return WakeOutcome::ProjectIdMissing;
    };
    let unhandled = match ports.queue.unhandled() {
        Ok(events) => events,
        Err(e) => return WakeOutcome::StartFailed(e.code.to_owned()),
    };
    if unhandled.is_empty() {
        return WakeOutcome::NothingUnhandled;
    }
    if !needs_judgement {
        let ids: Vec<String> = unhandled
            .iter()
            .filter(|e| CAPACITY_KINDS.contains(&e.kind.as_str()) || e.kind == "plan-became-ready")
            .map(|e| e.id.clone())
            .collect();
        if !ids.is_empty() {
            // A failed close only means the next tick looks again.
            if let Err(e) = ports.queue.mark_handled(&ids, "watcher") {
                return WakeOutcome::StartFailed(e.code.to_owned());
            }
            if ids.len() == unhandled.len() {
                return WakeOutcome::NothingAdmissible;
            }
        }
    }
    match ports.identity.holder(&supervisor_role(&project.handle)) {
        Holder::Live { project_id } if project_id == project.id => return WakeOutcome::AlreadyLive,
        Holder::Live { .. } => return WakeOutcome::RoleHeldOtherProject,
        Holder::Unknown => return WakeOutcome::IdentityUnknown,
        Holder::NotLive => {}
    }
    let now = ports.clock.now();
    let state = ports.log.load();
    if let Some(last) = state.last_attempt {
        if now - last < s.active_interval_sec * s.overdue_factor {
            return WakeOutcome::Starting;
        }
        if state.failures >= s.wake_failure_limit && now - last < s.idle_interval_sec {
            return WakeOutcome::Backoff;
        }
    }
    let failed = |failures: u32| WakeState {
        last_attempt: Some(now),
        failures,
    };
    // The attempt is recorded before the start so a slow start is not doubled.
    if ports.log.save(failed(state.failures)).is_err() {
        return WakeOutcome::StartFailed("wake-log-unwritable".to_owned());
    }
    match ports
        .start
        .start("supervisor", &supervisor_name(&project.handle))
    {
        Ok(()) => {
            let _ = ports.log.save(WakeState {
                last_attempt: Some(now),
                failures: 0,
            });
            WakeOutcome::Started
        }
        Err(code) => {
            let _ = ports.log.save(failed(state.failures + 1));
            WakeOutcome::StartFailed(code)
        }
    }
}
