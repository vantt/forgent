//! Owning proof of the release rule: the order of its steps against a fixture host, with every external call a port.

use std::cell::RefCell;
use std::path::{Path, PathBuf};

use fgos_session_host::release::{
    envelope_data, merge_slot_hold, release_subtree, run, run_checks_in, run_rollback, CheckPorts,
    Outcome, Recipe, ReleasePorts,
};
use serde_json::{json, Value};

const TIP: &str = "1bcb5a428aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const CHECKOUT: &str = "/work/release-check";

struct Fixture {
    recipe: Value,
    /// The trunk commit the last release recorded.
    released: RefCell<Option<String>>,
    /// The step the record shows as begun and never ended.
    step: RefCell<Option<String>>,
    /// Every step written, in order (`None` is a clear).
    steps_written: RefCell<Vec<Option<String>>>,
    /// The reason the merge slot reads held, on every look.
    land: Option<&'static str>,
    /// How many looks at the merge slot read free before it reads held.
    free_looks: usize,
    looks: RefCell<usize>,
    /// Argv lines that exit non-zero.
    failing: Vec<&'static str>,
    /// Argv lines that cannot be started at all.
    unrunnable: Vec<&'static str>,
    /// The owner question cannot be filed.
    ask_fails: bool,
    ran: RefCell<Vec<String>>,
    asked: RefCell<Vec<String>>,
    reports: RefCell<Vec<String>>,
    logs: RefCell<Vec<String>>,
    /// Every merge-slot look, checkout made or removed and argv run, in order, with the directory it ran in.
    events: RefCell<Vec<String>>,
    /// The check checkout cannot be made.
    make_fails: bool,
    /// The check checkout cannot be removed.
    remove_fails: bool,
}

impl Fixture {
    fn with(recipe: Value) -> Fixture {
        Fixture {
            recipe,
            released: RefCell::default(),
            step: RefCell::default(),
            steps_written: RefCell::default(),
            land: None,
            free_looks: 0,
            looks: RefCell::default(),
            failing: vec![],
            unrunnable: vec![],
            ask_fails: false,
            ran: RefCell::default(),
            asked: RefCell::default(),
            reports: RefCell::default(),
            logs: RefCell::default(),
            events: RefCell::default(),
            make_fails: false,
            remove_fails: false,
        }
    }
}

impl ReleasePorts for Fixture {
    fn recipe(&self) -> Result<Value, String> {
        Ok(self.recipe.clone())
    }
    fn trunk_tip(&self) -> Result<String, String> {
        Ok(format!("{TIP}\n"))
    }
    fn released_commit(&self) -> Result<Option<String>, String> {
        Ok(self.released.borrow().clone())
    }
    fn record_released(&self, commit: &str) -> Result<(), String> {
        *self.released.borrow_mut() = Some(commit.to_string());
        Ok(())
    }
    fn step(&self) -> Result<Option<String>, String> {
        Ok(self.step.borrow().clone())
    }
    fn set_step(&self, step: Option<&str>) -> Result<(), String> {
        *self.step.borrow_mut() = step.map(String::from);
        self.steps_written.borrow_mut().push(step.map(String::from));
        Ok(())
    }
    fn land_in_progress(&self) -> Result<Option<String>, String> {
        let look = *self.looks.borrow();
        *self.looks.borrow_mut() += 1;
        self.events.borrow_mut().push("look".into());
        Ok(if look < self.free_looks {
            None
        } else {
            self.land.map(String::from)
        })
    }
    fn make_check_checkout(&self, tip: &str) -> Result<PathBuf, String> {
        self.events.borrow_mut().push(format!("make {tip}"));
        if self.make_fails {
            return Err("no room for a checkout".into());
        }
        Ok(PathBuf::from(CHECKOUT))
    }
    fn remove_check_checkout(&self, path: &Path, tip: &str) -> Result<(), String> {
        self.events
            .borrow_mut()
            .push(format!("remove {} {tip}", path.display()));
        if self.remove_fails {
            return Err("worktree-dirty-preserved".into());
        }
        Ok(())
    }
    fn run(&self, argv: &[String], dir: Option<&Path>) -> Result<i32, String> {
        let line = argv.join(" ");
        self.events.borrow_mut().push(format!(
            "run {line} in {}",
            dir.map_or("root".to_string(), |dir| dir.display().to_string())
        ));
        self.ran.borrow_mut().push(line.clone());
        if self.unrunnable.contains(&line.as_str()) {
            return Err("no such program".into());
        }
        Ok(i32::from(self.failing.contains(&line.as_str())))
    }
    fn ask_owner(&self, apply: &[String]) -> Result<String, String> {
        self.asked.borrow_mut().push(apply.join(" "));
        if self.ask_fails {
            Err("route-refused: no route".into())
        } else {
            Ok("q-1".into())
        }
    }
    fn report(&self, line: &str) {
        self.reports.borrow_mut().push(line.to_string());
    }
    fn log(&self, line: &str) {
        self.logs.borrow_mut().push(line.to_string());
    }
}

fn reversible() -> Value {
    json!({
        "reversible": true,
        "checks": [["check", "one"], ["check", "two"]],
        "apply": ["fixture-fgctl", "upgrade"],
        "probe": ["probe"],
        "rollback": ["fixture-fgctl", "repair"]
    })
}

#[test]
fn a_recipe_without_apply_answers_no_recipe_and_runs_nothing() {
    for recipe in [Value::Null, json!({}), json!({"checks": [["x"]]})] {
        let fixture = Fixture::with(recipe);
        assert_eq!(run(&fixture), Outcome::NoRecipe);
        assert!(fixture.ran.borrow().is_empty());
    }
}

#[test]
fn a_trunk_tip_equal_to_the_recorded_release_is_nothing_new_and_no_record_counts_as_new() {
    let fixture = Fixture::with(reversible());
    *fixture.released.borrow_mut() = Some(TIP.to_string());
    assert_eq!(run(&fixture), Outcome::NothingNew);
    assert!(fixture.ran.borrow().is_empty());
    assert!(fixture.reports.borrow().is_empty());

    // A record naming another commit is a trunk that moved on.
    let fixture = Fixture::with(reversible());
    *fixture.released.borrow_mut() = Some("0000000".to_string());
    assert_eq!(run(&fixture), Outcome::Released);

    // No record at all: the trunk is new.
    assert_eq!(run(&Fixture::with(reversible())), Outcome::Released);
}

#[test]
fn a_released_outcome_records_the_trunk_commit_it_put_in_place() {
    let fixture = Fixture::with(reversible());
    assert_eq!(run(&fixture), Outcome::Released);
    assert_eq!(fixture.released.borrow().as_deref(), Some(TIP));
    // The same trunk is then nothing new.
    assert_eq!(run(&fixture), Outcome::NothingNew);

    // A rolled-back release records nothing.
    let mut fixture = Fixture::with(reversible());
    fixture.failing = vec!["probe"];
    assert!(matches!(run(&fixture), Outcome::RolledBack { .. }));
    assert_eq!(*fixture.released.borrow(), None);
}

#[test]
fn a_land_holding_the_merge_slot_refuses_the_release_and_reports_it() {
    let mut fixture = Fixture::with(reversible());
    fixture.land = Some("a land holds the merge slot");
    assert_eq!(
        run(&fixture),
        Outcome::LandInProgress {
            reason: "a land holds the merge slot".into()
        }
    );
    assert!(fixture.ran.borrow().is_empty());
    assert_eq!(fixture.reports.borrow().len(), 1);
    assert!(fixture.reports.borrow()[0].contains("merge slot"));
}

#[test]
fn a_land_that_takes_the_slot_during_the_checks_stops_the_release_before_apply() {
    let mut fixture = Fixture::with(reversible());
    fixture.land = Some("a land holds the merge slot");
    fixture.free_looks = 1;
    assert_eq!(run(&fixture).code(), "land-in-progress");
    assert_eq!(*fixture.ran.borrow(), ["check one", "check two"]);
    assert!(fixture.steps_written.borrow().is_empty());
}

#[test]
fn every_outcome_that_changed_or_refused_something_reports_to_the_owner() {
    let mut fixture = Fixture::with(reversible());
    fixture.failing = vec!["check one"];
    assert_eq!(run(&fixture).code(), "checks-failed");
    assert_eq!(fixture.reports.borrow().len(), 1);

    let mut fixture = Fixture::with(reversible());
    fixture.failing = vec!["probe", "fixture-fgctl repair"];
    assert_eq!(run(&fixture).code(), "rollback-failed");
    assert_eq!(fixture.reports.borrow().len(), 1);

    let mut fixture = Fixture::with(reversible());
    *fixture.step.borrow_mut() = Some("applying".into());
    fixture.failing = vec!["fixture-fgctl repair"];
    assert_eq!(run_rollback(&fixture).code(), "rollback-failed");
    assert_eq!(fixture.reports.borrow().len(), 1);

    // Nothing changed: no report.
    let fixture = Fixture::with(reversible());
    *fixture.released.borrow_mut() = Some(TIP.to_string());
    run(&fixture);
    assert!(fixture.reports.borrow().is_empty());
}

#[test]
fn a_question_that_cannot_be_filed_goes_to_the_log_not_to_the_question_route() {
    let mut recipe = reversible();
    recipe["reversible"] = json!(false);
    let mut fixture = Fixture::with(recipe);
    fixture.ask_fails = true;
    assert_eq!(run(&fixture).code(), "ask-failed");
    assert!(fixture.reports.borrow().is_empty());
    let logs = fixture.logs.borrow();
    assert_eq!(logs.len(), 1);
    assert!(logs[0].contains("ask-failed") && logs[0].contains("no route"));
}

#[test]
fn the_first_failing_check_refuses_the_release_before_anything_is_applied() {
    let mut fixture = Fixture::with(reversible());
    fixture.failing = vec!["check two"];
    assert_eq!(
        run(&fixture),
        Outcome::ChecksFailed {
            argv: vec!["check".into(), "two".into()],
            exit: 1
        }
    );
    assert_eq!(*fixture.ran.borrow(), ["check one", "check two"]);
}

/// Owns the directory every step runs in. No other test observes the directory an argv ran in or the checkout's
/// life, so none proves where the checks run: in a checkout of the tip made after the merge-slot look and removed
/// right after the last check that ran, while apply, probe and rollback run from the project root.
#[test]
fn the_checks_run_in_a_checkout_of_the_tip_made_before_them_and_removed_after_them_and_nothing_else_does(
) {
    let make = format!("make {TIP}");
    let remove = format!("remove {CHECKOUT} {TIP}");

    // Every check passes: made after the first look, removed before the second look and the apply.
    let fixture = Fixture::with(reversible());
    assert_eq!(run(&fixture), Outcome::Released);
    assert_eq!(
        *fixture.events.borrow(),
        [
            "look".to_string(),
            make.clone(),
            format!("run check one in {CHECKOUT}"),
            format!("run check two in {CHECKOUT}"),
            remove.clone(),
            "look".to_string(),
            "run fixture-fgctl upgrade in root".to_string(),
            "run probe in root".to_string(),
        ]
    );

    // The first failing check ends the checks; the checkout is still removed.
    let mut fixture = Fixture::with(reversible());
    fixture.failing = vec!["check one"];
    assert_eq!(run(&fixture).code(), "checks-failed");
    assert_eq!(
        *fixture.events.borrow(),
        [
            "look".to_string(),
            make.clone(),
            format!("run check one in {CHECKOUT}"),
            remove.clone(),
        ]
    );

    // A check that cannot be started ends as not run; the checkout is still removed and nothing later runs.
    let mut fixture = Fixture::with(reversible());
    fixture.unrunnable = vec!["check one"];
    assert_eq!(run(&fixture).code(), "check-not-run");
    assert_eq!(
        *fixture.events.borrow(),
        [
            "look".to_string(),
            make.clone(),
            format!("run check one in {CHECKOUT}"),
            remove.clone(),
        ]
    );
    assert!(fixture.steps_written.borrow().is_empty());

    // A rollback after a failed probe runs from the root too.
    let mut fixture = Fixture::with(reversible());
    fixture.failing = vec!["probe"];
    run(&fixture);
    assert_eq!(
        fixture.events.borrow().last().map(String::as_str),
        Some("run fixture-fgctl repair in root")
    );
    let mut fixture = Fixture::with(reversible());
    *fixture.step.borrow_mut() = Some("applying".into());
    run_rollback(&fixture);
    assert_eq!(
        *fixture.events.borrow(),
        ["run fixture-fgctl repair in root"]
    );

    // No checks: no checkout.
    let mut recipe = reversible();
    recipe["checks"] = json!([]);
    let fixture = Fixture::with(recipe);
    assert_eq!(run(&fixture), Outcome::Released);
    assert!(fixture
        .events
        .borrow()
        .iter()
        .all(|event| !event.starts_with("make") && !event.starts_with("remove")));

    // A checkout that cannot be made refuses the release with nothing run.
    let mut fixture = Fixture::with(reversible());
    fixture.make_fails = true;
    let outcome = run(&fixture);
    assert_eq!(outcome.code(), "check-checkout-failed");
    assert!(!outcome.is_answer());
    assert!(fixture.ran.borrow().is_empty());
    assert_eq!(*fixture.events.borrow(), ["look".to_string(), make]);
    assert_eq!(fixture.reports.borrow().len(), 1);
    assert!(fixture.reports.borrow()[0].contains("no room for a checkout"));

    // A checkout that cannot be removed is reported and logged; the outcome stands.
    let mut fixture = Fixture::with(reversible());
    fixture.remove_fails = true;
    assert_eq!(run(&fixture), Outcome::Released);
    let expected = format!(
        "the release check checkout at {CHECKOUT} was not removed: worktree-dirty-preserved"
    );
    assert!(fixture.reports.borrow().contains(&expected));
    assert_eq!(*fixture.logs.borrow(), [expected]);
    let mut fixture = Fixture::with(reversible());
    fixture.remove_fails = true;
    fixture.failing = vec!["check two"];
    assert_eq!(run(&fixture).code(), "checks-failed");
    assert_eq!(fixture.reports.borrow().len(), 2);
}

#[test]
fn an_irreversible_recipe_files_a_question_with_the_apply_argv_and_applies_nothing() {
    let mut recipe = reversible();
    recipe["reversible"] = json!(false);
    let fixture = Fixture::with(recipe);
    assert_eq!(
        run(&fixture),
        Outcome::Asked {
            question: "q-1".into()
        }
    );
    assert_eq!(*fixture.asked.borrow(), ["fixture-fgctl upgrade"]);
    assert_eq!(*fixture.ran.borrow(), ["check one", "check two"]);
    assert_eq!(*fixture.released.borrow(), None);
}

#[test]
fn a_passing_probe_releases_and_a_failing_probe_runs_the_rollback() {
    let fixture = Fixture::with(reversible());
    assert_eq!(run(&fixture), Outcome::Released);
    assert_eq!(
        *fixture.ran.borrow(),
        ["check one", "check two", "fixture-fgctl upgrade", "probe"]
    );
    assert_eq!(fixture.reports.borrow().len(), 1);

    let mut fixture = Fixture::with(reversible());
    fixture.failing = vec!["probe"];
    assert!(matches!(run(&fixture), Outcome::RolledBack { .. }));
    assert_eq!(
        fixture.ran.borrow().last().map(String::as_str),
        Some("fixture-fgctl repair")
    );
    assert_eq!(fixture.reports.borrow().len(), 1);

    let mut fixture = Fixture::with(reversible());
    fixture.failing = vec!["fixture-fgctl upgrade"];
    assert!(matches!(run(&fixture), Outcome::RolledBack { .. }));
}

#[test]
fn the_step_in_progress_is_recorded_before_apply_and_probe_and_cleared_on_every_terminal_outcome() {
    let fixture = Fixture::with(reversible());
    run(&fixture);
    assert_eq!(
        *fixture.steps_written.borrow(),
        [Some("applying".into()), Some("probing".into()), None]
    );
    assert_eq!(*fixture.step.borrow(), None);

    let mut fixture = Fixture::with(reversible());
    fixture.failing = vec!["probe", "fixture-fgctl repair"];
    assert_eq!(run(&fixture).code(), "rollback-failed");
    assert_eq!(*fixture.step.borrow(), None);

    // A run that never reached apply leaves another run's step alone.
    let mut fixture = Fixture::with(reversible());
    *fixture.step.borrow_mut() = Some("applying".into());
    fixture.failing = vec!["check one"];
    run(&fixture);
    assert_eq!(*fixture.step.borrow(), Some("applying".into()));
}

#[test]
fn the_rollback_path_refuses_without_a_step_in_flight_and_otherwise_runs_only_the_rollback() {
    let fixture = Fixture::with(reversible());
    assert_eq!(run_rollback(&fixture).code(), "no-release-in-flight");
    assert!(fixture.ran.borrow().is_empty());

    for step in ["applying", "probing"] {
        let fixture = Fixture::with(reversible());
        *fixture.step.borrow_mut() = Some(step.into());
        assert!(matches!(run_rollback(&fixture), Outcome::RolledBack { .. }));
        assert_eq!(*fixture.ran.borrow(), ["fixture-fgctl repair"]);
        assert_eq!(*fixture.step.borrow(), None);
    }

    let fixture = Fixture::with(Value::Null);
    *fixture.step.borrow_mut() = Some("applying".into());
    assert_eq!(run_rollback(&fixture), Outcome::NoRecipe);
}

#[test]
fn a_malformed_recipe_is_refused_by_name() {
    for recipe in [
        json!({"apply": "upgrade"}),
        json!({"reversible": true, "apply": ["a"]}),
        json!({"apply": ["a"], "shell": "x"}),
        json!({"checks": [[]]}),
    ] {
        assert_eq!(run(&Fixture::with(recipe)).code(), "recipe-invalid");
    }
    assert!(Recipe::from_value(&json!({"reversible": false, "apply": ["a"]})).is_ok());
}

#[test]
fn the_recipe_and_the_merge_slot_are_read_out_of_the_hosts_real_data_shapes() {
    // `config show --path release --json`: data {path, present, value, provenance, ...}.
    let set = json!({"path": "release", "present": true, "provenance": {"layer": "project"},
    "value": {
        "reversible": {"value": true, "file": "x"},
        "apply": {"value": ["a", "b"]},
        "rollback": ["r"]
    }});
    let recipe = Recipe::from_value(&release_subtree(&set)).unwrap();
    assert!(recipe.reversible);
    assert_eq!(recipe.apply, Some(vec!["a".into(), "b".into()]));
    let unset = json!({"path": "release", "present": false, "value": null, "provenance": null});
    assert_eq!(release_subtree(&unset), Value::Null);
    assert_eq!(
        run(&Fixture::with(release_subtree(&unset))),
        Outcome::NoRecipe
    );

    // `lock-status --json`: rows {name, status, instances: [{status}]}.
    let free = json!({"locks": [{"name": "merge-slot", "status": "free", "instances": [{"status": "free"}]},
        {"name": "main-checkout", "status": "held", "instances": [{"status": "held"}]}]});
    let held = json!({"locks": [{"name": "merge-slot", "status": "held", "instances": [{"status": "held"}]}]});
    let unknown = json!({"locks": [{"name": "merge-slot", "status": "unknown", "instances": [{"status": "unknown"}]}]});
    assert_eq!(merge_slot_hold(&free), None);
    assert!(merge_slot_hold(&held).unwrap().contains("holds"));
    assert!(merge_slot_hold(&unknown).unwrap().contains("unknown"));
}

#[test]
fn a_pretty_printed_envelope_is_one_value_and_a_one_line_scrap_is_not_an_answer() {
    let pretty = "{\n  \"contract\": \"fgos.v1\",\n  \"generated_at\": \"2026-11-25T00:00:00Z\",\n  \"data_hash\": \"abc\",\n  \"data\": {\n    \"path\": \"release\"\n  }\n}\n";
    assert_eq!(envelope_data(pretty).unwrap(), json!({"path": "release"}));
    assert!(envelope_data("  \"data\": {}\n}\n").is_err());
    assert!(envelope_data("{\"contract\": \"fgos.v1\"}").is_err());
}

struct CheckFixture {
    recipe: Value,
    /// Argv lines that exit non-zero.
    failing: Vec<&'static str>,
    /// Argv lines that cannot be started at all.
    unrunnable: Vec<&'static str>,
    /// Every argv run, with the directory it ran in: the only call besides the recipe read this port set has.
    ran: RefCell<Vec<(String, PathBuf)>>,
}

impl CheckFixture {
    fn with(recipe: Value) -> CheckFixture {
        CheckFixture {
            recipe,
            failing: vec![],
            unrunnable: vec![],
            ran: RefCell::default(),
        }
    }
}

impl CheckPorts for CheckFixture {
    fn recipe(&self) -> Result<Value, String> {
        Ok(self.recipe.clone())
    }
    fn run(&self, argv: &[String], dir: &Path) -> Result<i32, String> {
        let line = argv.join(" ");
        self.ran
            .borrow_mut()
            .push((line.clone(), dir.to_path_buf()));
        if self.unrunnable.contains(&line.as_str()) {
            return Err("no such program".into());
        }
        Ok(i32::from(self.failing.contains(&line.as_str())))
    }
}

#[test]
fn a_checks_only_run_is_green_when_every_check_exits_zero_and_runs_them_in_the_worktree() {
    let fixture = CheckFixture::with(reversible());
    let report = run_checks_in(&fixture, Path::new("/work/lead-wt")).unwrap();
    assert!(report.green);
    assert_eq!(report.note, None);
    assert_eq!(
        *fixture.ran.borrow(),
        [
            ("check one".to_string(), PathBuf::from("/work/lead-wt")),
            ("check two".to_string(), PathBuf::from("/work/lead-wt")),
        ]
    );
    assert_eq!(
        report.to_value()["checks"],
        json!([{"argv": ["check", "one"], "exit": 0}, {"argv": ["check", "two"], "exit": 0}])
    );
}

#[test]
fn a_checks_only_run_is_red_and_still_reports_every_check_when_one_fails_or_cannot_run() {
    let mut fixture = CheckFixture::with(reversible());
    fixture.failing = vec!["check one"];
    let report = run_checks_in(&fixture, Path::new("/work/wt")).unwrap();
    assert!(!report.green);
    assert_eq!(fixture.ran.borrow().len(), 2);
    assert_eq!(report.checks[0].exit, Some(1));
    assert_eq!(report.checks[1].exit, Some(0));

    let mut fixture = CheckFixture::with(reversible());
    fixture.unrunnable = vec!["check two"];
    let report = run_checks_in(&fixture, Path::new("/work/wt")).unwrap();
    assert!(!report.green);
    assert_eq!(report.checks[1].exit, None);
    assert_eq!(report.checks[1].error.as_deref(), Some("no such program"));
}

#[test]
fn a_checks_only_run_with_no_checks_is_green_with_a_note_and_runs_nothing() {
    for recipe in [Value::Null, json!({}), json!({"apply": ["x"]})] {
        let fixture = CheckFixture::with(recipe);
        let report = run_checks_in(&fixture, Path::new("/work/wt")).unwrap();
        assert!(report.green);
        assert!(report.checks.is_empty());
        assert!(report.note.unwrap().contains("no checks"));
        assert!(fixture.ran.borrow().is_empty());
    }
}

#[test]
fn a_checks_only_run_never_touches_apply_probe_or_rollback_and_refuses_an_invalid_recipe() {
    // The port set has no apply, probe, rollback, merge-slot, checkout or record call; the recipe's other steps
    // are never run.
    let fixture = CheckFixture::with(reversible());
    run_checks_in(&fixture, Path::new("/work/wt")).unwrap();
    assert!(fixture
        .ran
        .borrow()
        .iter()
        .all(|(line, _)| line.starts_with("check ")));

    let invalid = CheckFixture::with(json!({"reversible": true}));
    let why = run_checks_in(&invalid, Path::new("/work/wt")).unwrap_err();
    assert!(why.starts_with("recipe-invalid"));
}
