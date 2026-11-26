//! The watcher tick over fake ports: one behaviour per test.
use fgos_supervision::{
    notify::{MailboxNotifier, Notifier, NotifyOutcome},
    queue::{QueueError, Raised, RaisedEvent},
    watcher::{
        event_id, tick, Action, Clock, Definitions, EventSink, Fetch, Mode, Outcome, Portfolio,
        Ports, QuestionsView, ReviewSettlement, Row, Settings, Span, State, StopOutcome, Telemetry,
        TickLock, TickState, Wake, WakeOutcome,
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
    /// What the supervisor looks like to the stop door: `None` is no live supervisor.
    supervisor_idle: RefCell<Option<bool>>,
    stops: RefCell<u32>,
    reviews: RefCell<u32>,
    review_fails: RefCell<bool>,
    review_settled: RefCell<bool>,
    reviews_done: RefCell<Vec<String>>,
    /// The start instants the review port was given, in order.
    review_starts: RefCell<Vec<i64>>,
    /// The review answer ended without a usable result: the next read says `Failed`.
    review_failed: RefCell<bool>,
    /// How many `done` calls fail before one succeeds.
    review_done_failures: RefCell<u32>,
}

/// The in-flight bound the fake review port reports, in seconds.
const REVIEW_BOUND: i64 = 600;

impl fgos_supervision::watcher::Review for World {
    fn start(&self, started_at: i64) -> Result<(), String> {
        *self.reviews.borrow_mut() += 1;
        self.review_starts.borrow_mut().push(started_at);
        if *self.review_fails.borrow() {
            Err("failed Unit".into())
        } else {
            Ok(())
        }
    }
    fn settled(&self, _started_at: i64, expired: bool) -> Result<ReviewSettlement, String> {
        if *self.review_settled.borrow() {
            // A settled answer stays readable until done is recorded.
            Ok(ReviewSettlement::Settled("unit-review-1".into()))
        } else if std::mem::take(&mut *self.review_failed.borrow_mut()) || expired {
            Ok(ReviewSettlement::Failed)
        } else {
            Ok(ReviewSettlement::Running)
        }
    }
    fn done(&self, _started_at: i64, id: &str) -> Result<(), String> {
        if *self.review_done_failures.borrow() > 0 {
            *self.review_done_failures.borrow_mut() -= 1;
            return Err("record write failed".into());
        }
        *self.review_settled.borrow_mut() = false;
        self.reviews_done.borrow_mut().push(id.into());
        Ok(())
    }
    fn in_flight_bound_sec(&self) -> i64 {
        REVIEW_BOUND
    }
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
    fn stop_stuck(&self, _subject: &str) -> StopOutcome {
        let idle = *self.supervisor_idle.borrow();
        match idle {
            Some(true) => {
                *self.stops.borrow_mut() += 1;
                *self.supervisor_idle.borrow_mut() = None;
                StopOutcome::Stopped
            }
            _ => StopOutcome::Kept,
        }
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
    fn review_handled(&self, id: &str) -> Result<(), QueueError> {
        self.handled.borrow_mut().push(id.into());
        Ok(())
    }
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
        review: w,
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
        review_started: None,
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
fn an_ended_lead_over_an_empty_queue_records_one_lead_ended_event_and_the_next_tick_nothing_new() {
    let w = World::default();
    at(&w, 1000);
    w.rows.borrow_mut().push(row(
        "lead-ended",
        "head:lead-ops",
        "2026-11-18T02:30:00.000Z",
    ));
    let s = settings(Action::None);
    assert!(w.raised.borrow().is_empty());
    let first = run(&w, None, &s);
    assert_eq!((first.raised, first.duplicate), (1, 0));
    assert_eq!(w.raised.borrow().len(), 1);
    assert!(w.raised.borrow().values().all(|e| e.kind == "lead-ended"));
    // An open event keeps the supervisor busy, so the next tick runs the definitions again.
    w.pace_rows.borrow_mut().push(row("active", "x", "t"));
    at(&w, 1060);
    let second = run(&w, None, &s);
    assert_eq!((second.raised, second.duplicate), (0, 1));
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
fn three_new_wake_events_in_one_tick_make_one_wake_with_the_oldest() {
    let w = World::default();
    at(&w, 1000);
    for (k, s, t) in [("b", "2", "t2"), ("a", "1", "t1"), ("c", "3", "t3")] {
        w.rows.borrow_mut().push(row(k, s, t));
    }
    let report = run(&w, None, &settings(Action::WakeSupervisor));
    assert_eq!(*w.wakes.borrow(), vec!["a 1".to_owned()]);
    assert_eq!((report.raised, report.wakes), (3, 1));
}

#[test]
fn new_wake_events_with_older_unhandled_ones_still_make_one_wake() {
    let w = World::default();
    at(&w, 1000);
    w.rows.borrow_mut().push(row("old", "p0", "t0"));
    run(&w, None, &settings(Action::None));
    let before = w.wakes.borrow().len();
    w.rows.borrow_mut().push(row("n1", "p1", "t1"));
    w.rows.borrow_mut().push(row("n2", "p2", "t2"));
    at(&w, 1700);
    let report = run(&w, None, &settings(Action::WakeSupervisor));
    assert_eq!(w.wakes.borrow().len() - before, 1);
    assert_eq!((report.raised, report.wakes), (2, 1));
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
        review_started: None,
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
        review_started: None,
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
        review_started: None,
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
    assert_eq!(
        report.problems,
        vec!["definition a answered a row with no ts; the row was dropped".to_owned()],
        "a dropped row is named, with the definition and the missing field"
    );
    let spans = w.spans.borrow();
    let problem = spans
        .last()
        .unwrap()
        .attrs
        .iter()
        .find(|(k, _)| *k == "fgos.watcher.problem");
    assert_eq!(problem.unwrap().1, report.problems.join("; "));
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
        review_started: None,
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

// Existing action proofs cover wakes and notifications, not the review's settle/retry watermark.
#[test]
fn review_starts_at_once_second_tick_in_flight_starts_nothing_and_done_is_recorded_after_settle() {
    let w = World::default();
    w.rows
        .borrow_mut()
        .push(row("review-due", "periodic-review", "epoch"));
    w.pace_rows.borrow_mut().push(row("active", "x", "t"));
    let mut s = settings(Action::WakeSupervisor);
    s.actions.insert("review-due".into(), Action::StartReview);

    // 1. First tick: start returns at once, in-flight marker is set.
    at(&w, 1000);
    let first = run(&w, None, &s);
    assert_eq!((first.raised, first.errors, first.wakes), (1, 0, 0));
    assert_eq!(*w.reviews.borrow(), 1);
    assert!(w.reviews_done.borrow().is_empty());
    assert!(w.handled.borrow().is_empty());

    // 2. Second tick while in flight (younger than bound): starts nothing.
    at(&w, 1060);
    let in_flight = run(&w, None, &s);
    assert_eq!(
        (in_flight.duplicate, in_flight.errors, in_flight.wakes),
        (1, 0, 0)
    );
    assert_eq!(*w.reviews.borrow(), 1, "in flight review starts nothing");
    assert!(w.reviews_done.borrow().is_empty());

    // 3. Unit settles: third tick records done and closes trigger.
    *w.review_settled.borrow_mut() = true;
    at(&w, 1120);
    let settled = run(&w, None, &s);
    assert_eq!(
        (settled.duplicate, settled.errors, settled.wakes),
        (1, 0, 0)
    );
    assert_eq!(*w.reviews.borrow(), 1);
    assert_eq!(*w.reviews_done.borrow(), ["unit-review-1"]);
    assert_eq!(w.handled.borrow().len(), 1);

    // 4. Later tick once quiet: starts nothing.
    w.rows.borrow_mut().clear();
    at(&w, 1180);
    assert_eq!(run(&w, None, &s).wakes, 0);
    assert_eq!(*w.reviews.borrow(), 1);
}

#[test]
fn a_failing_or_stale_review_retries_after_the_in_flight_bound() {
    let w = World::default();
    w.rows
        .borrow_mut()
        .push(row("review-due", "periodic-review", "epoch"));
    w.pace_rows.borrow_mut().push(row("active", "x", "t"));
    let mut s = settings(Action::WakeSupervisor);
    s.actions.insert("review-due".into(), Action::StartReview);

    at(&w, 1000);
    run(&w, None, &s);
    assert_eq!(*w.reviews.borrow(), 1);

    // Still within idle interval bound (600s in test settings): starts nothing
    at(&w, 1500);
    run(&w, None, &s);
    assert_eq!(*w.reviews.borrow(), 1);

    // Past the bound (1000 + 600 = 1600): retries!
    at(&w, 1601);
    let retried = run(&w, None, &s);
    assert_eq!((retried.duplicate, retried.errors), (1, 0));
    assert_eq!(*w.reviews.borrow(), 2);
}

#[test]
fn a_failed_start_counts_an_error_and_retries_next_tick() {
    let w = World::default();
    w.rows
        .borrow_mut()
        .push(row("review-due", "periodic-review", "epoch"));
    w.pace_rows.borrow_mut().push(row("active", "x", "t"));
    let mut s = settings(Action::WakeSupervisor);
    s.actions.insert("review-due".into(), Action::StartReview);

    *w.review_fails.borrow_mut() = true;
    at(&w, 1000);
    let failed = run(&w, None, &s);
    assert_eq!((failed.raised, failed.errors, failed.wakes), (1, 1, 0));
    assert_eq!(*w.reviews.borrow(), 1);

    *w.review_fails.borrow_mut() = false;
    at(&w, 1060);
    let ok = run(&w, None, &s);
    assert_eq!((ok.duplicate, ok.errors, ok.wakes), (1, 0, 0));
    assert_eq!(*w.reviews.borrow(), 2);
}

fn review_due_world() -> (World, Settings) {
    let w = World::default();
    w.rows
        .borrow_mut()
        .push(row("review-due", "periodic-review", "epoch"));
    w.pace_rows.borrow_mut().push(row("active", "x", "t"));
    let mut s = settings(Action::WakeSupervisor);
    s.actions.insert("review-due".into(), Action::StartReview);
    (w, s)
}

#[test]
fn a_review_that_ended_without_a_usable_answer_clears_the_marker_and_starts_afresh() {
    let (w, s) = review_due_world();
    at(&w, 1000);
    run(&w, None, &s);
    assert_eq!(
        *w.review_starts.borrow(),
        [1000],
        "the start names its instant"
    );

    // The run crashed with no answer, inside the bound: the next tick starts a new one.
    *w.review_failed.borrow_mut() = true;
    at(&w, 1060);
    let afresh = run(&w, None, &s);
    assert_eq!(afresh.errors, 0);
    assert_eq!(*w.review_starts.borrow(), [1000, 1060]);
    assert!(w.reviews_done.borrow().is_empty());
}

#[test]
fn a_failed_done_keeps_the_review_settled_and_is_retried_on_the_next_tick() {
    let (w, s) = review_due_world();
    at(&w, 1000);
    run(&w, None, &s);

    *w.review_settled.borrow_mut() = true;
    *w.review_done_failures.borrow_mut() = 1;
    at(&w, 1060);
    let failed = run(&w, None, &s);
    assert_eq!(failed.errors, 1);
    assert!(failed.problems.iter().any(|p| p.starts_with("review-done")));
    assert!(w.reviews_done.borrow().is_empty());
    assert!(w.handled.borrow().is_empty(), "the trigger stays open");

    at(&w, 1120);
    let retried = run(&w, None, &s);
    assert_eq!(retried.errors, 0);
    assert_eq!(*w.reviews_done.borrow(), ["unit-review-1"]);
    assert_eq!(
        *w.reviews.borrow(),
        1,
        "no second start while retrying done"
    );
}

fn stuck_world() -> (World, Settings) {
    let w = World::default();
    at(&w, 1000);
    w.rows
        .borrow_mut()
        .push(row("supervisor-stuck", "supervisor", "t1"));
    (w, settings(Action::WakeSupervisor))
}

#[test]
fn a_stuck_row_stops_an_idle_supervisor_and_leaves_the_wake_to_the_next_tick() {
    let (w, mut s) = stuck_world();
    s.actions.insert("supervisor-stuck".into(), Action::Notify);
    *w.supervisor_idle.borrow_mut() = Some(true);
    let r = run(&w, None, &s);
    assert_eq!((*w.stops.borrow(), r.wakes), (1, 0));
    assert_eq!(*w.notified.borrow(), ["supervisor-stuck"]);
}

#[test]
fn a_stuck_row_leaves_a_busy_supervisor_running_and_asks_again_once_it_is_idle() {
    let (w, mut s) = stuck_world();
    s.actions.insert("supervisor-stuck".into(), Action::Notify);
    *w.supervisor_idle.borrow_mut() = Some(false);
    let busy = run(&w, None, &s);
    assert_eq!((*w.stops.borrow(), busy.notifies), (0, 1));
    at(&w, 1700);
    *w.supervisor_idle.borrow_mut() = Some(true);
    let idle = run(&w, None, &s);
    assert_eq!((*w.stops.borrow(), idle.duplicate), (1, 1));
}

#[test]
fn after_a_stuck_stop_the_next_tick_wakes_a_fresh_supervisor_for_the_waiting_event() {
    let (w, mut s) = stuck_world();
    s.actions.insert("supervisor-stuck".into(), Action::Notify);
    w.raised.borrow_mut().insert(
        "e2".into(),
        RaisedEvent {
            id: "e2".into(),
            kind: "plan-ready".into(),
            subject: "p2".into(),
            ts: "t0".into(),
            reason: String::new(),
            next_command: String::new(),
        },
    );
    *w.supervisor_idle.borrow_mut() = Some(true);
    run(&w, None, &s);
    assert!(w.wakes.borrow().is_empty());
    w.rows.borrow_mut().clear();
    at(&w, 1700);
    let next = run(&w, None, &s);
    assert_eq!(next.wakes, 1);
    assert_eq!(w.wakes.borrow().len(), 1);
}
