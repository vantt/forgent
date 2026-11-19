//! The wake door: the one place that decides whether to start the project's supervisor. It starts
//! a head only when none is live, leaves a live one alone, and never reads unknown identity as
//! not-live. Every call records one `fgos.supervisor.wake` span.
use crate::{
    portfolio::{admissible, supervisor_name, Plan},
    queue::{Queue, QueueError, RaisedEvent},
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
}

/// Starts a session. The adapter runs `<host> session start supervisor --name <name>` with the
/// environment a timer start needs. `Err` carries the host's code.
pub trait StartSession {
    fn start(&self, persona: &str, name: &str) -> Result<(), String>;
}

/// The plans the supervisor could start, over the portfolio reader.
pub trait Portfolio {
    fn plans(&self) -> Result<Vec<Plan>, String>;
    fn done_dirs(&self) -> Result<Vec<String>, String>;
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
}
pub trait Telemetry {
    fn emit(&self, span: &WakeSpan);
}

pub struct Ports<'a> {
    pub project: &'a dyn Project,
    pub identity: &'a dyn Identity,
    pub start: &'a dyn StartSession,
    pub portfolio: &'a dyn Portfolio,
    pub queue: &'a dyn Drain,
    pub log: &'a dyn WakeLog,
    pub clock: &'a dyn Clock,
    pub telemetry: &'a dyn Telemetry,
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

/// Start the supervisor if there is work for it and none is live.
pub fn wake(ports: &Ports, settings: &Settings, trigger: Trigger) -> WakeOutcome {
    let outcome = decide(ports, settings);
    ports.telemetry.emit(&WakeSpan {
        name: "fgos.supervisor.wake",
        subject: trigger.subject.to_owned(),
        trigger: trigger.trigger.to_owned(),
        outcome: outcome.as_str(),
    });
    outcome
}

fn decide(ports: &Ports, s: &Settings) -> WakeOutcome {
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
    if unhandled
        .iter()
        .all(|e| CAPACITY_KINDS.contains(&e.kind.as_str()))
        && nothing_admissible(ports)
    {
        let ids: Vec<String> = unhandled.iter().map(|e| e.id.clone()).collect();
        // A failed close only means the next tick looks again.
        if let Err(e) = ports.queue.mark_handled(&ids, "watcher") {
            return WakeOutcome::StartFailed(e.code.to_owned());
        }
        return WakeOutcome::NothingAdmissible;
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

fn nothing_admissible(ports: &Ports) -> bool {
    match (ports.portfolio.plans(), ports.portfolio.done_dirs()) {
        (Ok(plans), Ok(done)) => admissible(&plans, &done).is_empty(),
        // An unreadable portfolio is never read as "nothing to do".
        _ => false,
    }
}
