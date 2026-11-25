//! Owning proof of the release rule: the order of its steps against a fixture host, with every external call a port.

use std::cell::RefCell;

use fgos_session_host::release::{
    envelope_data, merge_slot_hold, release_subtree, run, run_rollback, Outcome, Recipe,
    ReleasePorts,
};
use serde_json::{json, Value};

const TIP: &str = "1bcb5a428aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

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
    /// The owner question cannot be filed.
    ask_fails: bool,
    ran: RefCell<Vec<String>>,
    asked: RefCell<Vec<String>>,
    reports: RefCell<Vec<String>>,
    logs: RefCell<Vec<String>>,
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
            ask_fails: false,
            ran: RefCell::default(),
            asked: RefCell::default(),
            reports: RefCell::default(),
            logs: RefCell::default(),
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
        Ok(if look < self.free_looks {
            None
        } else {
            self.land.map(String::from)
        })
    }
    fn run(&self, argv: &[String]) -> Result<i32, String> {
        let line = argv.join(" ");
        self.ran.borrow_mut().push(line.clone());
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
