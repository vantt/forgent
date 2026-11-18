//! The watcher tick: a no-LLM function run by an OS timer. One tick fetches the trunk, runs the
//! detection definitions, records each raised event once and runs the configured action per row
//! kind. It decides, starts and stops nothing; the host wires the real ports.
use crate::{
    notify::{Notifier, NotifyOutcome},
    queue::{Queue, QueueError, Raised, RaisedEvent},
};
use sha2::{Digest, Sha256};
use std::{any::Any, collections::BTreeMap};

/// A detection row in the attention view's shape. `subject` and `ts` are optional here so a
/// malformed row is counted, not trusted; `ts` is the state-change instant.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Row {
    pub kind: String,
    pub reason: String,
    pub next_command: String,
    pub subject: Option<String>,
    pub ts: Option<String>,
    /// The definition could not measure this row.
    pub unmeasured: bool,
}

/// What a raised event triggers.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Action {
    WakeSupervisor,
    Notify,
    None,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WakeOutcome {
    Woken,
    Refused,
}

/// Epoch seconds of the last tick and of the last full one.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct State {
    pub last_tick: Option<i64>,
    pub last_full_tick: Option<i64>,
}

/// Fetch the trunk's remote-tracking ref.
pub trait Fetch {
    fn fetch(&self) -> Result<(), String>;
}
/// Run detection definitions; `since` is epoch seconds.
pub trait Definitions {
    fn exists(&self, path: &str) -> bool;
    fn run(&self, defs: &[String], since: Option<i64>) -> Result<Vec<Row>, String>;
}
pub trait Wake {
    fn wake(&self, kind: &str, subject: &str) -> WakeOutcome;
}
/// Ready and running plan counts, over the portfolio reader.
pub trait Portfolio {
    fn counts(&self) -> Result<(u64, u64), String>;
}
/// Refreshes the per-machine questions view once.
pub trait QuestionsView {
    fn refresh(&self) -> Result<(), String>;
}
pub trait Clock {
    fn now(&self) -> i64;
}
pub trait TickState {
    /// `Err` means missing or unreadable: the tick treats it as a first tick.
    fn load(&self) -> Result<State, String>;
    fn save(&self, state: State) -> Result<(), String>;
}
/// The event queue as the tick sees it; `Queue` is the real one.
pub trait EventSink {
    fn raise(&self, event: RaisedEvent) -> Result<Raised, QueueError>;
    fn unhandled(&self) -> Result<Vec<RaisedEvent>, QueueError>;
}
impl EventSink for Queue {
    fn raise(&self, event: RaisedEvent) -> Result<Raised, QueueError> {
        Queue::raise(self, event)
    }
    fn unhandled(&self) -> Result<Vec<RaisedEvent>, QueueError> {
        Queue::unhandled(self)
    }
}

/// The `fgos.watcher.tick` span: attrs and measures by their declared names.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Span {
    pub name: &'static str,
    pub attrs: Vec<(&'static str, &'static str)>,
    pub measures: Vec<(&'static str, u64)>,
}
pub trait Telemetry {
    fn emit(&self, span: &Span);
}
/// The `watcher` repo lock. `Ok(None)` is busy; the guard releases the lock when dropped.
pub trait TickLock {
    fn try_take(&self) -> Result<Option<Box<dyn Any>>, String>;
}

pub struct Ports<'a> {
    pub fetch: &'a dyn Fetch,
    pub definitions: &'a dyn Definitions,
    pub wake: &'a dyn Wake,
    pub notifier: &'a dyn Notifier,
    pub portfolio: &'a dyn Portfolio,
    pub questions: &'a dyn QuestionsView,
    pub clock: &'a dyn Clock,
    pub state: &'a dyn TickState,
    pub telemetry: &'a dyn Telemetry,
    pub lock: &'a dyn TickLock,
    pub queue: &'a dyn EventSink,
}

#[derive(Debug, Clone)]
pub struct Settings {
    pub active_interval_sec: i64,
    pub idle_interval_sec: i64,
    pub lookback_sec: i64,
    /// Detection definition files or directories.
    pub definitions: Vec<String>,
    /// The pace definition: any row means "active".
    pub pace_definition: String,
    pub default_action: Action,
    pub actions: BTreeMap<String, Action>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Mode {
    Active,
    Idle,
}
impl Mode {
    pub fn as_str(self) -> &'static str {
        match self {
            Mode::Active => "active",
            Mode::Idle => "idle",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Outcome {
    Noop,
    WokeSupervisor,
    Notified,
    Error,
    SkippedBusy,
}
impl Outcome {
    pub fn as_str(self) -> &'static str {
        match self {
            Outcome::Noop => "noop",
            Outcome::WokeSupervisor => "woke-supervisor",
            Outcome::Notified => "notified",
            Outcome::Error => "error",
            Outcome::SkippedBusy => "skipped-busy",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TickReport {
    pub mode: Mode,
    pub outcome: Outcome,
    pub interval: i64,
    pub raised: u64,
    pub duplicate: u64,
    pub wakes: u64,
    pub notifies: u64,
    pub errors: u64,
    pub unmeasured: u64,
}

/// Event id: the first 16 hex characters of sha256 of `kind|subject|ts`.
pub fn event_id(kind: &str, subject: &str, ts: &str) -> String {
    let digest = Sha256::digest(format!("{kind}|{subject}|{ts}"));
    digest.iter().take(8).map(|b| format!("{b:02x}")).collect()
}

/// One tick. Never panics on a port failure; failures are counted in the report.
pub fn tick(ports: &Ports, settings: &Settings) -> TickReport {
    let mut r = TickReport {
        mode: Mode::Active,
        outcome: Outcome::Noop,
        interval: settings.active_interval_sec,
        raised: 0,
        duplicate: 0,
        wakes: 0,
        notifies: 0,
        errors: 0,
        unmeasured: 0,
    };
    let _guard = match ports.lock.try_take() {
        Ok(Some(guard)) => guard,
        Ok(None) => {
            r.outcome = Outcome::SkippedBusy;
            emit(ports, &r, (0, 0));
            return r;
        }
        Err(_) => {
            r.outcome = Outcome::Error;
            r.errors += 1;
            emit(ports, &r, (0, 0));
            return r;
        }
    };
    let now = ports.clock.now();
    let state = ports.state.load().unwrap_or_default();
    if ports.questions.refresh().is_err() {
        r.errors += 1;
    }
    let counts = ports.portfolio.counts().unwrap_or_else(|_| {
        r.errors += 1;
        (0, 0)
    });

    // Pace: a row from the pace definition, or an elapsed idle interval, makes this a full tick.
    let pace_active = match ports
        .definitions
        .run(std::slice::from_ref(&settings.pace_definition), None)
    {
        Ok(rows) => !rows.is_empty(),
        Err(_) => {
            r.errors += 1;
            true
        }
    };
    let idle_due = state
        .last_full_tick
        .is_none_or(|t| now - t >= settings.idle_interval_sec);
    if !pace_active && !idle_due {
        r.mode = Mode::Idle;
        r.interval = settings.idle_interval_sec;
        r.outcome = if r.errors > 0 {
            Outcome::Error
        } else {
            Outcome::Noop
        };
        save_state(
            ports,
            &mut r,
            State {
                last_tick: Some(now),
                ..state
            },
        );
        emit(ports, &r, counts);
        return r;
    }

    if ports.fetch.fetch().is_err() {
        r.errors += 1;
    }
    let mut defs = Vec::new();
    for path in &settings.definitions {
        if ports.definitions.exists(path) {
            defs.push(path.clone());
        } else {
            r.unmeasured += 1;
        }
    }
    let since = state.last_tick.unwrap_or(now) - settings.lookback_sec;
    let rows = match ports.definitions.run(&defs, Some(since)) {
        Ok(rows) => rows,
        Err(_) => {
            r.errors += 1;
            r.outcome = Outcome::Error;
            emit(ports, &r, counts);
            return r;
        }
    };

    for row in rows {
        if row.unmeasured {
            r.unmeasured += 1;
            continue;
        }
        let (Some(subject), Some(ts)) = (row.subject.clone(), row.ts.clone()) else {
            r.errors += 1;
            continue;
        };
        let event = RaisedEvent {
            id: event_id(&row.kind, &subject, &ts),
            kind: row.kind.clone(),
            subject,
            ts,
            reason: row.reason.clone(),
            next_command: row.next_command.clone(),
        };
        match ports.queue.raise(event.clone()) {
            Ok(Raised::New) => {
                r.raised += 1;
                run_action(ports, settings, &event, &mut r);
            }
            Ok(Raised::Duplicate) => r.duplicate += 1,
            Err(_) => r.errors += 1,
        }
    }

    if r.wakes == 0 {
        match ports.queue.unhandled() {
            Ok(open) => {
                if let Some(oldest) = open.first() {
                    wake(ports, &oldest.kind, &oldest.subject, &mut r);
                }
            }
            Err(_) => r.errors += 1,
        }
    }

    r.outcome = if r.wakes > 0 {
        Outcome::WokeSupervisor
    } else if r.notifies > 0 {
        Outcome::Notified
    } else if r.errors > 0 {
        Outcome::Error
    } else {
        Outcome::Noop
    };
    save_state(
        ports,
        &mut r,
        State {
            last_tick: Some(now),
            last_full_tick: Some(now),
        },
    );
    emit(ports, &r, counts);
    r
}

fn run_action(ports: &Ports, settings: &Settings, event: &RaisedEvent, r: &mut TickReport) {
    let action = settings
        .actions
        .get(&event.kind)
        .copied()
        .unwrap_or(settings.default_action);
    match action {
        Action::WakeSupervisor => wake(ports, &event.kind, &event.subject, r),
        Action::Notify => match ports.notifier.notify(event) {
            NotifyOutcome::Sent => r.notifies += 1,
            NotifyOutcome::Refused(_) | NotifyOutcome::Unavailable => r.errors += 1,
        },
        Action::None => {}
    }
}

fn wake(ports: &Ports, kind: &str, subject: &str, r: &mut TickReport) {
    r.wakes += 1;
    if ports.wake.wake(kind, subject) == WakeOutcome::Refused {
        r.errors += 1;
    }
}

fn save_state(ports: &Ports, r: &mut TickReport, state: State) {
    if ports.state.save(state).is_err() {
        r.errors += 1;
    }
}

fn emit(ports: &Ports, r: &TickReport, (ready, running): (u64, u64)) {
    ports.telemetry.emit(&Span {
        name: "fgos.watcher.tick",
        attrs: vec![
            ("fgos.watcher.mode", r.mode.as_str()),
            ("fgos.watcher.outcome", r.outcome.as_str()),
        ],
        measures: vec![
            ("fgos.watcher.interval", r.interval.max(0) as u64),
            ("fgos.plans.ready", ready),
            ("fgos.plans.running", running),
            ("fgos.watcher.raised", r.raised),
            ("fgos.watcher.duplicate", r.duplicate),
            ("fgos.watcher.wakes", r.wakes),
            ("fgos.watcher.notifies", r.notifies),
            ("fgos.watcher.errors", r.errors),
            ("fgos.watcher.unmeasured", r.unmeasured),
        ],
    });
}
