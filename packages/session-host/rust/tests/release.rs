//! Owning proof of the release rule: the order of its steps against a fixture host, with every external call a port.

use std::cell::RefCell;

use fgos_session_host::release::{
    envelope_data, merge_slot_hold, release_subtree, run, run_rollback, same_commit, Newness,
    Outcome, Recipe, ReleasePorts,
};
use serde_json::{json, Value};

struct Fixture {
    recipe: Value,
    newness: Newness,
    /// The reason the merge slot reads held, on every look.
    land: Option<&'static str>,
    /// How many looks at the merge slot read free before it reads held.
    free_looks: usize,
    looks: RefCell<usize>,
    /// Argv lines that exit non-zero.
    failing: Vec<&'static str>,
    ran: RefCell<Vec<String>>,
    asked: RefCell<Vec<String>>,
    reports: RefCell<Vec<String>>,
}

impl Fixture {
    fn with(recipe: Value) -> Fixture {
        Fixture {
            recipe,
            newness: Newness::Landed,
            land: None,
            free_looks: 0,
            looks: RefCell::default(),
            failing: vec![],
            ran: RefCell::default(),
            asked: RefCell::default(),
            reports: RefCell::default(),
        }
    }
}

impl ReleasePorts for Fixture {
    fn recipe(&self) -> Result<Value, String> {
        Ok(self.recipe.clone())
    }
    fn newness(&self) -> Result<Newness, String> {
        Ok(self.newness.clone())
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
        Ok("q-1".into())
    }
    fn report(&self, line: &str) {
        self.reports.borrow_mut().push(line.to_string());
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
fn a_release_is_refused_when_nothing_new_landed_or_a_land_holds_the_merge_slot() {
    let mut fixture = Fixture::with(reversible());
    fixture.newness = Newness::NothingNew;
    assert_eq!(run(&fixture), Outcome::NothingNew);
    let mut fixture = Fixture::with(reversible());
    fixture.land = Some("a land holds the merge slot");
    assert_eq!(
        run(&fixture),
        Outcome::LandInProgress {
            reason: "a land holds the merge slot".into()
        }
    );
    assert!(fixture.ran.borrow().is_empty());
}

#[test]
fn a_land_that_takes_the_slot_during_the_checks_stops_the_release_before_apply() {
    let mut fixture = Fixture::with(reversible());
    fixture.land = Some("a land holds the merge slot");
    fixture.free_looks = 1;
    assert_eq!(run(&fixture).code(), "land-in-progress");
    assert_eq!(*fixture.ran.borrow(), ["check one", "check two"]);
}

#[test]
fn an_unknown_active_commit_is_said_in_the_outcome_and_never_reads_as_nothing_new() {
    let mut fixture = Fixture::with(reversible());
    fixture.newness = Newness::Unknown("no gitCommit".into());
    let Outcome::Released { note: Some(note) } = run(&fixture) else {
        panic!("a release that went ahead names the unknown commit");
    };
    assert!(note.contains("no gitCommit"), "{note}");
    assert!(fixture.reports.borrow()[0].contains("no gitCommit"));
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
    fixture.failing = vec!["fixture-fgctl repair"];
    assert_eq!(run_rollback(&fixture).code(), "rollback-failed");
    assert_eq!(fixture.reports.borrow().len(), 1);

    // Nothing changed: no report.
    let mut fixture = Fixture::with(reversible());
    fixture.newness = Newness::NothingNew;
    run(&fixture);
    assert!(fixture.reports.borrow().is_empty());
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
            question: "q-1".into(),
            note: None
        }
    );
    assert_eq!(*fixture.asked.borrow(), ["fixture-fgctl upgrade"]);
    assert_eq!(*fixture.ran.borrow(), ["check one", "check two"]);
}

#[test]
fn a_passing_probe_releases_and_a_failing_probe_runs_the_rollback() {
    let fixture = Fixture::with(reversible());
    assert_eq!(run(&fixture), Outcome::Released { note: None });
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
fn a_failing_rollback_is_named_and_the_rollback_path_runs_only_the_rollback() {
    let mut fixture = Fixture::with(reversible());
    fixture.failing = vec!["probe", "fixture-fgctl repair"];
    assert_eq!(run(&fixture).code(), "rollback-failed");

    let fixture = Fixture::with(reversible());
    assert!(matches!(run_rollback(&fixture), Outcome::RolledBack { .. }));
    assert_eq!(*fixture.ran.borrow(), ["fixture-fgctl repair"]);
    assert_eq!(run_rollback(&Fixture::with(Value::Null)), Outcome::NoRecipe);
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
fn the_recipe_and_the_merge_slot_are_read_out_of_the_hosts_answers() {
    let answer = json!({"data": {"value": {
        "reversible": {"value": true, "file": "x"},
        "apply": {"value": ["a", "b"]},
        "rollback": ["r"]
    }}});
    let recipe = Recipe::from_value(&release_subtree(&answer)).unwrap();
    assert!(recipe.reversible);
    assert_eq!(recipe.apply, Some(vec!["a".into(), "b".into()]));
    assert_eq!(release_subtree(&json!({"data": {}})), Value::Null);

    let free = json!({"locks": [{"name": "merge-slot", "instances": [{"status": "free"}]},
        {"name": "main-checkout", "status": "held"}]});
    let held = json!({"locks": [{"name": "merge-slot", "instances": [{"status": "held"}]}]});
    let unknown = json!({"locks": [{"name": "merge-slot", "instances": [{"status": "unknown"}]}]});
    assert_eq!(merge_slot_hold(&free), None);
    assert!(merge_slot_hold(&held).unwrap().contains("holds"));
    assert!(merge_slot_hold(&unknown).unwrap().contains("unknown"));
}

#[test]
fn a_pretty_printed_envelope_is_one_value_and_a_one_line_scrap_is_not_an_answer() {
    let pretty = "{\n  \"contract\": \"fgos.v1\",\n  \"generated_at\": \"2026-11-25T00:00:00Z\",\n  \"data_hash\": \"abc\",\n  \"data\": {\n    \"gitCommit\": \"1bcb5a4\"\n  }\n}\n";
    assert_eq!(
        envelope_data(pretty).unwrap(),
        json!({"gitCommit": "1bcb5a4"})
    );
    assert!(envelope_data("  \"data\": {}\n}\n").is_err());
    assert!(envelope_data("{\"contract\": \"fgos.v1\"}").is_err());
}

#[test]
fn a_short_commit_names_the_tip_by_prefix() {
    assert!(same_commit(
        "1bcb5a4",
        "1bcb5a428aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    ));
    assert!(!same_commit(
        "1bcb5a4",
        "2bcb5a428aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    ));
    assert!(!same_commit("", ""));
}
