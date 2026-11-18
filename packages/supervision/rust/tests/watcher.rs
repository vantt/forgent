//! The watcher tick over fake ports: one behaviour per test.
use fgos_supervision::{
    notify::{MailboxNotifier, Notifier, NotifyOutcome},
    queue::{QueueError, Raised, RaisedEvent},
    watcher::{
        event_id, tick, Action, Clock, Definitions, EventSink, Fetch, Mode, Outcome, Portfolio,
        Ports, QuestionsView, Row, Settings, Span, State, Telemetry, TickLock, TickState, Wake,
        WakeOutcome,
    },
};
use std::{any::Any, cell::RefCell, collections::BTreeMap};

const PACE: &str = "pace.json";
const DEF: &str = "def.json";

#[derive(Default)]
struct World {
    now: RefCell<i64>,
    rows: RefCell<Vec<Row>>,
    pace_rows: RefCell<Vec<Row>>,
    run_fails: RefCell<bool>,
    runs: RefCell<Vec<(Vec<String>, Option<i64>)>>,
    missing: RefCell<Vec<String>>,
    raised: RefCell<BTreeMap<String, RaisedEvent>>,
    wakes: RefCell<Vec<String>>,
    handled: RefCell<Vec<String>>,
    notified: RefCell<Vec<String>>,
    fetches: RefCell<u32>,
    refreshes: RefCell<u32>,
    refresh_fails: RefCell<bool>,
    state: RefCell<Option<State>>,
    busy: RefCell<bool>,
    spans: RefCell<Vec<Span>>,
    notifier_refuses: RefCell<bool>,
}

impl Clock for World {
    fn now(&self) -> i64 {
        *self.now.borrow()
    }
}
impl Fetch for World {
    fn fetch(&self) -> Result<(), String> {
        *self.fetches.borrow_mut() += 1;
        Ok(())
    }
}
impl Definitions for World {
    fn exists(&self, path: &str) -> bool {
        !self.missing.borrow().iter().any(|m| m == path)
    }
    fn run(&self, defs: &[String], since: Option<i64>) -> Result<Vec<Row>, String> {
        self.runs.borrow_mut().push((defs.to_vec(), since));
        if defs == [PACE.to_owned()] {
            return Ok(self.pace_rows.borrow().clone());
        }
        if *self.run_fails.borrow() {
            return Err("runner failed".into());
        }
        Ok(self.rows.borrow().clone())
    }
}
impl Wake for World {
    fn wake(&self, kind: &str, subject: &str) -> WakeOutcome {
        self.wakes.borrow_mut().push(format!("{kind} {subject}"));
        WakeOutcome::Woken
    }
}
impl Notifier for World {
    fn notify(&self, event: &RaisedEvent) -> NotifyOutcome {
        if *self.notifier_refuses.borrow() {
            return NotifyOutcome::Refused("no".into());
        }
        self.notified.borrow_mut().push(event.kind.clone());
        NotifyOutcome::Sent
    }
}
impl Portfolio for World {
    fn counts(&self) -> Result<(u64, u64), String> {
        Ok((2, 1))
    }
}
impl QuestionsView for World {
    fn refresh(&self) -> Result<(), String> {
        *self.refreshes.borrow_mut() += 1;
        if *self.refresh_fails.borrow() {
            Err("down".into())
        } else {
            Ok(())
        }
    }
}
impl TickState for World {
    fn load(&self) -> Result<State, String> {
        self.state.borrow().ok_or_else(|| "missing".to_owned())
    }
    fn save(&self, state: State) -> Result<(), String> {
        *self.state.borrow_mut() = Some(state);
        Ok(())
    }
}
impl Telemetry for World {
    fn emit(&self, span: &Span) {
        self.spans.borrow_mut().push(span.clone());
    }
}
impl TickLock for World {
    fn try_take(&self) -> Result<Option<Box<dyn Any>>, String> {
        Ok(if *self.busy.borrow() {
            None
        } else {
            Some(Box::new(()))
        })
    }
}
impl EventSink for World {
    fn raise(&self, event: RaisedEvent) -> Result<Raised, QueueError> {
        let mut all = self.raised.borrow_mut();
        if all.contains_key(&event.id) {
            return Ok(Raised::Duplicate);
        }
        all.insert(event.id.clone(), event);
        Ok(Raised::New)
    }
    fn unhandled(&self) -> Result<Vec<RaisedEvent>, QueueError> {
        let handled = self.handled.borrow();
        let mut open: Vec<RaisedEvent> = self
            .raised
            .borrow()
            .values()
            .filter(|e| !handled.contains(&e.id))
            .cloned()
            .collect();
        open.sort_by(|a, b| a.ts.cmp(&b.ts));
        Ok(open)
    }
}

fn row(kind: &str, subject: &str, ts: &str) -> Row {
    Row {
        kind: kind.into(),
        reason: "why".into(),
        next_command: "do".into(),
        subject: Some(subject.into()),
        ts: Some(ts.into()),
        unmeasured: false,
    }
}

fn settings(default_action: Action) -> Settings {
    Settings {
        active_interval_sec: 60,
        idle_interval_sec: 600,
        lookback_sec: 300,
        definitions: vec![DEF.into()],
        pace_definition: PACE.into(),
        default_action,
        actions: BTreeMap::new(),
    }
}

fn run(
    w: &World,
    notifier: Option<&dyn Notifier>,
    s: &Settings,
) -> fgos_supervision::watcher::TickReport {
    let ports = Ports {
        fetch: w,
        definitions: w,
        wake: w,
        notifier: notifier.unwrap_or(w),
        portfolio: w,
        questions: w,
        clock: w,
        state: w,
        telemetry: w,
        lock: w,
        queue: w,
    };
    tick(&ports, s)
}

fn at(w: &World, now: i64) {
    *w.now.borrow_mut() = now;
}

#[test]
fn a_row_raises_once_and_a_second_tick_runs_no_second_action() {
    let w = World::default();
    at(&w, 1000);
    w.rows.borrow_mut().push(row("plan-ready", "p1", "t1"));
    let s = settings(Action::WakeSupervisor);
    let first = run(&w, None, &s);
    assert_eq!((first.raised, first.wakes), (1, 1));
    at(&w, 1700);
    let second = run(&w, None, &s);
    assert_eq!((second.raised, second.duplicate), (0, 1));
    assert_eq!(second.wakes, 1, "only the recovery wake, no second action");
    assert_eq!(w.wakes.borrow().len(), 2);
}

#[test]
fn an_unhandled_event_from_an_earlier_tick_gets_one_recovery_wake_with_the_oldest() {
    let w = World::default();
    at(&w, 1000);
    w.rows.borrow_mut().push(row("late", "p2", "t2"));
    let first = run(&w, None, &settings(Action::WakeSupervisor));
    assert_eq!((first.raised, first.wakes), (1, 1));
    // The wake did not mark the event handled; an older event arrives on tick 2.
    let s = settings(Action::None);
    w.rows.borrow_mut().push(row("old", "p1", "t1"));
    at(&w, 1700);
    let second = run(&w, None, &s);
    assert_eq!((second.raised, second.wakes), (1, 1));
    assert_eq!(
        *w.wakes.borrow(),
        vec!["late p2".to_owned(), "old p1".to_owned()]
    );
    w.handled.borrow_mut().extend(
        w.raised
            .borrow()
            .values()
            .map(|e| e.id.clone())
            .collect::<Vec<_>>(),
    );
    at(&w, 2400);
    assert_eq!(run(&w, None, &s).wakes, 0);
}

#[test]
fn the_same_projection_row_over_three_ticks_raises_one_event_and_one_action() {
    let w = World::default();
    w.rows.borrow_mut().push(row("plan-ready", "p1", "t1"));
    w.pace_rows.borrow_mut().push(row("active", "x", "t"));
    let s = settings(Action::Notify);
    for now in [1000, 1100, 1200] {
        at(&w, now);
        assert_eq!(run(&w, None, &s).mode, Mode::Active);
    }
    let def_runs = w
        .runs
        .borrow()
        .iter()
        .filter(|(d, _)| d == &[DEF.to_owned()])
        .count();
    assert_eq!(def_runs, 3);
    assert_eq!(w.raised.borrow().len(), 1);
    assert_eq!(w.notified.borrow().len(), 1);
}

#[test]
fn a_late_commit_inside_the_lookback_is_asked_for() {
    let w = World::default();
    *w.state.borrow_mut() = Some(State {
        last_tick: Some(1600),
        last_full_tick: Some(1000),
    });
    at(&w, 1700);
    w.rows.borrow_mut().push(row("plan-ready", "p1", "t-old"));
    run(&w, None, &settings(Action::None));
    let runs = w.runs.borrow();
    let (_, since) = runs.iter().find(|(d, _)| d == &[DEF.to_owned()]).unwrap();
    assert_eq!(*since, Some(1000 - 300));
    assert_eq!(w.raised.borrow().len(), 1);
}

#[test]
fn a_missing_state_raises_rows_in_the_window_once_and_the_next_tick_nothing_new() {
    let w = World::default();
    at(&w, 5000);
    w.rows.borrow_mut().push(row("plan-ready", "p1", "t1"));
    let s = settings(Action::None);
    let first = run(&w, None, &s);
    assert_eq!(first.raised, 1);
    let runs = w
        .runs
        .borrow()
        .iter()
        .find(|(d, _)| d == &[DEF.to_owned()])
        .cloned()
        .unwrap();
    assert_eq!(runs.1, Some(5000 - 300));
    drop(runs);
    w.pace_rows.borrow_mut().push(row("active", "x", "t"));
    at(&w, 5060);
    let second = run(&w, None, &s);
    assert_eq!((second.raised, second.duplicate), (0, 1));
    let def_runs = w
        .runs
        .borrow()
        .iter()
        .filter(|(d, _)| d == &[DEF.to_owned()])
        .count();
    assert_eq!(def_runs, 2);
}

#[test]
fn the_action_table_routes_by_kind_and_a_null_notify_to_counts_an_error() {
    let w = World::default();
    at(&w, 1000);
    for (k, s) in [("a", "1"), ("b", "2"), ("c", "3")] {
        w.rows.borrow_mut().push(row(k, s, "t"));
    }
    let mut s = settings(Action::None);
    s.actions.insert("a".into(), Action::WakeSupervisor);
    s.actions.insert("b".into(), Action::Notify);
    let report = run(&w, None, &s);
    assert_eq!(*w.wakes.borrow(), vec!["a 1".to_owned()]);
    assert_eq!(*w.notified.borrow(), vec!["b".to_owned()]);
    assert_eq!(
        (report.raised, report.wakes, report.notifies, report.errors),
        (3, 1, 1, 0)
    );

    let w = World::default();
    at(&w, 1000);
    w.rows.borrow_mut().push(row("b", "2", "t"));
    let unset = MailboxNotifier::new("fgos-not-a-real-host", None);
    let report = run(&w, Some(&unset), &s);
    assert_eq!((report.notifies, report.errors), (0, 1));
}

#[test]
fn an_idle_tick_runs_no_definition_and_an_active_one_fetches_and_runs_them() {
    let w = World::default();
    *w.state.borrow_mut() = Some(State {
        last_tick: Some(1000),
        last_full_tick: Some(1000),
    });
    at(&w, 1100);
    let idle = run(&w, None, &settings(Action::None));
    assert_eq!((idle.mode, idle.outcome), (Mode::Idle, Outcome::Noop));
    assert_eq!(*w.fetches.borrow(), 0);
    assert!(w.runs.borrow().iter().all(|(d, _)| d == &[PACE.to_owned()]));

    w.pace_rows.borrow_mut().push(row("active", "x", "t"));
    at(&w, 1160);
    let active = run(&w, None, &settings(Action::None));
    assert_eq!(active.mode, Mode::Active);
    assert_eq!(*w.fetches.borrow(), 1);
    assert!(w.runs.borrow().iter().any(|(d, _)| d == &[DEF.to_owned()]));
}

#[test]
fn every_tick_holding_the_lock_refreshes_questions_once_and_a_busy_one_does_not() {
    let w = World::default();
    *w.state.borrow_mut() = Some(State {
        last_tick: Some(1000),
        last_full_tick: Some(1000),
    });
    at(&w, 1100);
    run(&w, None, &settings(Action::None)); // idle
    assert_eq!(*w.refreshes.borrow(), 1);
    at(&w, 2000);
    *w.refresh_fails.borrow_mut() = true;
    let full = run(&w, None, &settings(Action::None));
    assert_eq!(*w.refreshes.borrow(), 2);
    assert_eq!(full.errors, 1);
    assert_eq!(
        *w.fetches.borrow(),
        1,
        "a refresh failure does not stop the tick"
    );
    *w.busy.borrow_mut() = true;
    run(&w, None, &settings(Action::None));
    assert_eq!(*w.refreshes.borrow(), 2);
}

#[test]
fn a_runner_failure_leaves_last_tick_unchanged_and_the_next_tick_raises_the_event() {
    let w = World::default();
    let before = State {
        last_tick: Some(1000),
        last_full_tick: Some(1000),
    };
    *w.state.borrow_mut() = Some(before);
    at(&w, 2000);
    w.rows.borrow_mut().push(row("plan-ready", "p1", "t1"));
    *w.run_fails.borrow_mut() = true;
    let failed = run(&w, None, &settings(Action::None));
    assert_eq!(failed.outcome, Outcome::Error);
    assert_eq!(*w.state.borrow(), Some(before));
    *w.run_fails.borrow_mut() = false;
    at(&w, 2060);
    assert_eq!(run(&w, None, &settings(Action::None)).raised, 1);
}

#[test]
fn a_busy_lock_skips_without_running_anything() {
    let w = World::default();
    *w.busy.borrow_mut() = true;
    let report = run(&w, None, &settings(Action::WakeSupervisor));
    assert_eq!(report.outcome, Outcome::SkippedBusy);
    assert!(w.runs.borrow().is_empty());
    assert_eq!(*w.fetches.borrow(), 0);
}

#[test]
fn a_notifier_refusal_is_counted_and_the_other_rows_still_run() {
    let w = World::default();
    at(&w, 1000);
    *w.notifier_refuses.borrow_mut() = true;
    w.rows.borrow_mut().push(row("a", "1", "t"));
    w.rows.borrow_mut().push(row("b", "2", "t"));
    let report = run(&w, None, &settings(Action::Notify));
    assert_eq!((report.raised, report.errors), (2, 2));
}

#[test]
fn malformed_unmeasured_and_missing_definition_rows_are_counted_not_raised() {
    let w = World::default();
    at(&w, 1000);
    let mut no_ts = row("a", "1", "t");
    no_ts.ts = None;
    let mut unmeasured = row("b", "2", "t");
    unmeasured.unmeasured = true;
    w.rows.borrow_mut().extend([no_ts, unmeasured]);
    w.missing.borrow_mut().push("absent.json".into());
    let mut s = settings(Action::None);
    s.definitions.push("absent.json".into());
    let report = run(&w, None, &s);
    assert_eq!((report.raised, report.errors, report.unmeasured), (0, 1, 2));
    assert_eq!(w.runs.borrow().last().unwrap().0, vec![DEF.to_owned()]);
}

#[test]
fn the_event_id_is_sixteen_hex_characters_of_kind_subject_ts() {
    let id = event_id("k", "s", "t");
    assert_eq!(id.len(), 16);
    assert!(id.bytes().all(|c| c.is_ascii_hexdigit()));
    assert_eq!(id, event_id("k", "s", "t"));
    assert_ne!(id, event_id("k", "s", "t2"));
}

#[test]
fn the_span_carries_exactly_the_declared_attr_and_measure_names() {
    let w = World::default();
    at(&w, 1000);
    run(&w, None, &settings(Action::None));
    let kinds: serde_json::Value =
        serde_json::from_str(include_str!("../observe-kinds.json")).unwrap();
    let decl = &kinds["kinds"]["fgos.watcher.tick"];
    let names = |key: &str| -> Vec<String> {
        decl[key]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_str().unwrap().to_owned())
            .collect()
    };
    let spans = w.spans.borrow();
    let span = spans.last().unwrap();
    assert_eq!(span.name, "fgos.watcher.tick");
    let attrs: Vec<String> = span.attrs.iter().map(|(k, _)| (*k).to_owned()).collect();
    let measures: Vec<String> = span.measures.iter().map(|(k, _)| (*k).to_owned()).collect();
    assert_eq!(attrs, names("attrs"));
    assert_eq!(measures, names("measures"));
}

#[test]
fn an_edge_between_an_idle_tick_and_the_next_full_tick_is_raised_with_no_lookback() {
    let w = World::default();
    *w.state.borrow_mut() = Some(State {
        last_tick: Some(1000),
        last_full_tick: Some(1000),
    });
    let mut s = settings(Action::None);
    s.lookback_sec = 0;
    at(&w, 1100);
    assert_eq!(run(&w, None, &s).mode, Mode::Idle);
    w.rows
        .borrow_mut()
        .push(row("plan-ready", "p1", "t-between"));
    at(&w, 1700);
    let full = run(&w, None, &s);
    assert_eq!((full.mode, full.raised), (Mode::Active, 1));
    let runs = w.runs.borrow();
    let (_, since) = runs.iter().find(|(d, _)| d == &[DEF.to_owned()]).unwrap();
    assert_eq!(*since, Some(1000));
}
