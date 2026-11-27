//! The release rule: what `release run` does with a project's recipe (`release.*` config keys), in order, and nothing
//! about what the recipe runs. The recipe is project data: `reversible` (boolean, default false), `checks` (argv
//! lists), `apply`, `probe`, `rollback` (argv lists). An unset `apply` means the project declares no release.
//!
//! Every external call (the config read, the git and lock reads, the release record, running an argv, the owner
//! question and the report) is behind [`ReleasePorts`], so the proof drives fixtures; the run supervisor owns the
//! real adapters. An argv runs with no shell: the checks in a checkout of the trunk tip, every other step from the
//! project root.

use serde_json::{json, Map, Value};
use std::path::{Path, PathBuf};

/// A recipe as read from `release.*`.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct Recipe {
    pub reversible: bool,
    pub checks: Vec<Vec<String>>,
    pub apply: Option<Vec<String>>,
    pub probe: Option<Vec<String>>,
    pub rollback: Option<Vec<String>>,
}

fn argv_of(value: &Value, key: &str) -> Result<Vec<String>, String> {
    let list = value
        .as_array()
        .filter(|list| !list.is_empty())
        .ok_or_else(|| format!("release.{key} must be a non-empty list of words"))?;
    list.iter()
        .map(|word| {
            word.as_str()
                .filter(|word| !word.is_empty() && !word.contains('\0'))
                .map(String::from)
                .ok_or_else(|| format!("release.{key} holds a word that is not a plain string"))
        })
        .collect()
}

impl Recipe {
    /// Reads the `release` subtree. Null or an absent value is the empty recipe; a key outside the five, a wrong
    /// type, or `reversible` without a `rollback` is refused with the reason.
    pub fn from_value(value: &Value) -> Result<Recipe, String> {
        let empty = Map::new();
        let object = match value {
            Value::Null => &empty,
            Value::Object(object) => object,
            _ => return Err("release must be a mapping".into()),
        };
        let mut recipe = Recipe::default();
        for (key, value) in object {
            if value.is_null() {
                continue;
            }
            match key.as_str() {
                "reversible" => {
                    recipe.reversible = value
                        .as_bool()
                        .ok_or("release.reversible must be true or false")?
                }
                "checks" => {
                    let list = value.as_array().ok_or("release.checks must be a list")?;
                    for entry in list {
                        recipe.checks.push(argv_of(entry, "checks")?);
                    }
                }
                "apply" => recipe.apply = Some(argv_of(value, "apply")?),
                "probe" => recipe.probe = Some(argv_of(value, "probe")?),
                "rollback" => recipe.rollback = Some(argv_of(value, "rollback")?),
                other => return Err(format!("release.{other} is not a release key")),
            }
        }
        if recipe.reversible && recipe.rollback.is_none() {
            return Err("release.reversible is true but release.rollback is not set".into());
        }
        Ok(recipe)
    }
}

/// The `release` subtree inside the `data` of `fgos config show --path release --json` (`{path, present, value,
/// provenance, ...}`): in its `value`, the first object that holds a recipe key, with a leaf given as `{value: x}`
/// (a value with its provenance) reduced to `x`. `Null` when the answer holds no recipe key.
pub fn release_subtree(answer: &Value) -> Value {
    const KEYS: [&str; 5] = ["reversible", "checks", "apply", "probe", "rollback"];
    fn leaf(value: &Value) -> Value {
        match value {
            Value::Object(object) if object.contains_key("value") => leaf(&object["value"]),
            Value::Array(list) => Value::Array(list.iter().map(leaf).collect()),
            other => other.clone(),
        }
    }
    fn find(value: &Value) -> Option<Value> {
        match value {
            Value::Object(object) => {
                if KEYS.iter().any(|key| object.contains_key(*key)) {
                    let reduced: Map<String, Value> = object
                        .iter()
                        .filter(|(key, _)| KEYS.contains(&key.as_str()))
                        .map(|(key, value)| (key.clone(), leaf(value)))
                        .collect();
                    return Some(Value::Object(reduced));
                }
                object.values().find_map(find)
            }
            Value::Array(list) => list.iter().find_map(find),
            _ => None,
        }
    }
    find(answer.get("value").unwrap_or(answer)).unwrap_or(Value::Null)
}

/// Why the lock report (`fgos lock-status --json`, its `data`) holds the merge slot: a `merge-slot` row, or one of
/// its instances, whose status reads `held` or `unknown` (a slot whose holder cannot be judged is never taken as
/// free). `None` when the slot is free.
pub fn merge_slot_hold(report: &Value) -> Option<String> {
    fn status_inside(value: &Value) -> Option<&'static str> {
        match value {
            Value::Object(object) => match object.get("status").and_then(Value::as_str) {
                Some("held") => Some("held"),
                Some("unknown") => Some("unknown"),
                _ => object.values().find_map(status_inside),
            },
            Value::Array(list) => list.iter().find_map(status_inside),
            _ => None,
        }
    }
    fn walk(value: &Value) -> Option<&'static str> {
        match value {
            Value::Object(object) => {
                if object.get("name").and_then(Value::as_str) == Some("merge-slot") {
                    return status_inside(value);
                }
                object.values().find_map(walk)
            }
            Value::Array(list) => list.iter().find_map(walk),
            _ => None,
        }
    }
    walk(report).map(|status| match status {
        "held" => "a land holds the merge slot".to_string(),
        _ => "the merge slot status is unknown, so it counts as held".to_string(),
    })
}

/// The `data` of the one JSON envelope (`{contract, generated_at, data_hash, data}`) a host verb prints with
/// `--json`. The envelope is pretty-printed over many lines, so the whole stdout is one value, never a last line.
pub fn envelope_data(stdout: &str) -> Result<Value, String> {
    let envelope: Value = serde_json::from_str(stdout.trim())
        .map_err(|e| format!("the host printed no single JSON envelope: {e}"))?;
    match envelope {
        Value::Object(mut object) => object
            .remove("data")
            .ok_or_else(|| "the host envelope has no data".to_string()),
        _ => Err("the host envelope is not an object".to_string()),
    }
}

/// The external calls of a release run.
pub trait ReleasePorts {
    /// The `release` subtree of the effective config (`Null` when nothing is set).
    fn recipe(&self) -> Result<Value, String>;
    /// The trunk tip's commit.
    fn trunk_tip(&self) -> Result<String, String>;
    /// The trunk commit the last `released` outcome recorded (`None` when no release was ever recorded).
    fn released_commit(&self) -> Result<Option<String>, String>;
    /// Records the trunk commit a release put in place.
    fn record_released(&self, commit: &str) -> Result<(), String>;
    /// The step (`applying` or `probing`) the record shows as begun and never ended, if any.
    fn step(&self) -> Result<Option<String>, String>;
    /// Writes (`Some`) or clears (`None`) the step in the record.
    fn set_step(&self, step: Option<&str>) -> Result<(), String>;
    /// Why a land holds the merge slot (`Some`), or `None` when none does.
    fn land_in_progress(&self) -> Result<Option<String>, String>;
    /// Makes a clean, exact checkout of the commit `tip` outside the project root and returns its path. The checks
    /// run there. Made once per run, after the merge-slot look and before the first check.
    fn make_check_checkout(&self, tip: &str) -> Result<PathBuf, String>;
    /// Removes the checkout `make_check_checkout` made for `tip`. Called once the checks end, however they ended.
    fn remove_check_checkout(&self, path: &Path, tip: &str) -> Result<(), String>;
    /// Runs one argv (no shell) and returns its exit code: in `dir` when given (a check's checkout), else from the
    /// project root.
    fn run(&self, argv: &[String], dir: Option<&Path>) -> Result<i32, String>;
    /// Files the owner question carrying the exact apply argv; returns its id.
    fn ask_owner(&self, apply: &[String]) -> Result<String, String>;
    /// Writes one report line to the owner (information, not a choice).
    fn report(&self, line: &str);
    /// Writes one line to the run's log, for what cannot go through the owner's question store.
    fn log(&self, line: &str);
}

/// How a release run ended.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Outcome {
    /// The recipe names no `apply`: the project declares no release.
    NoRecipe,
    /// The trunk tip is the commit the last release recorded.
    NothingNew,
    LandInProgress {
        reason: String,
    },
    ChecksFailed {
        argv: Vec<String>,
        exit: i32,
    },
    /// The recipe is irreversible: the owner was asked, nothing was applied.
    Asked {
        question: String,
    },
    Released,
    /// `apply` or `probe` failed and `rollback` ran and passed (or `--rollback` ran it).
    RolledBack {
        reason: String,
    },
    /// A step could not be made: `code` names it.
    Failed {
        code: &'static str,
        detail: String,
    },
}

impl Outcome {
    pub fn code(&self) -> &'static str {
        match self {
            Outcome::NoRecipe => "no-recipe",
            Outcome::NothingNew => "nothing-new",
            Outcome::LandInProgress { .. } => "land-in-progress",
            Outcome::ChecksFailed { .. } => "checks-failed",
            Outcome::Asked { .. } => "asked",
            Outcome::Released => "released",
            Outcome::RolledBack { .. } => "rolled-back",
            Outcome::Failed { code, .. } => code,
        }
    }

    /// `asked` and `released` are answers; every other outcome is a refusal.
    pub fn is_answer(&self) -> bool {
        matches!(self, Outcome::Asked { .. } | Outcome::Released)
    }

    /// The one line the owner is told when this outcome ends a run. A run that changed or refused nothing (no
    /// recipe, nothing new) is silent, an `asked` run's question is its own report, and an `ask-failed` run has no
    /// question route to report through (it goes to the log).
    pub fn report_line(&self) -> Option<String> {
        match self {
            Outcome::NoRecipe | Outcome::NothingNew | Outcome::Asked { .. } => None,
            Outcome::Failed {
                code: "ask-failed", ..
            } => None,
            Outcome::Released => Some("release applied".to_string()),
            Outcome::LandInProgress { reason } => Some(format!("release not started: {reason}")),
            Outcome::RolledBack { reason } => Some(format!("release rolled back: {reason}")),
            Outcome::ChecksFailed { argv, exit } => Some(format!(
                "release refused: check `{}` exited {exit}",
                line_of(argv)
            )),
            Outcome::Failed { code, detail } => Some(format!("release failed ({code}): {detail}")),
        }
    }

    pub fn to_value(&self) -> Value {
        let mut out = json!({ "outcome": self.code() });
        match self {
            Outcome::ChecksFailed { argv, exit } => {
                out["argv"] = json!(argv);
                out["exit"] = json!(exit);
            }
            Outcome::LandInProgress { reason } => out["reason"] = json!(reason),
            Outcome::Asked { question } => out["question"] = json!(question),
            Outcome::RolledBack { reason } => out["reason"] = json!(reason),
            Outcome::Failed { detail, .. } => out["detail"] = json!(detail),
            _ => {}
        }
        out
    }
}

fn failed(code: &'static str, why: String) -> Outcome {
    Outcome::Failed { code, detail: why }
}

fn line_of(argv: &[String]) -> String {
    argv.join(" ")
}

/// The release steps, in order: no recipe, nothing new (the trunk tip is the commit the last release recorded; with
/// no record the trunk counts as new), land in progress, each check, the irreversible stop (the owner is asked with
/// the exact apply argv), land in progress again, apply, probe, rollback on a failure. The step in progress is
/// recorded before apply and probe and cleared on every terminal outcome of this run; a `released` outcome records
/// the trunk commit it put in place. The owner gets one report line for every outcome that changed or refused
/// something.
pub fn run(ports: &dyn ReleasePorts) -> Outcome {
    let mut marked = false;
    let outcome = steps(ports, &mut marked);
    finish(ports, outcome, marked)
}

fn finish(ports: &dyn ReleasePorts, outcome: Outcome, clear_step: bool) -> Outcome {
    let cleared = if clear_step {
        ports.set_step(None)
    } else {
        Ok(())
    };
    let outcome = match cleared {
        Err(why) => failed(
            "state-unwritable",
            format!(
                "{}; the in-flight step was not cleared: {why}",
                outcome.code()
            ),
        ),
        Ok(()) => outcome,
    };
    match &outcome {
        Outcome::Failed {
            code: "ask-failed",
            detail,
        } => ports.log(&format!(
            "release ask-failed: the owner question was not filed, so nothing waits for the owner: {detail}"
        )),
        _ => {
            if let Some(line) = outcome.report_line() {
                ports.report(&line);
            }
        }
    }
    outcome
}

fn land_check(ports: &dyn ReleasePorts) -> Result<(), Outcome> {
    match ports.land_in_progress() {
        Ok(Some(reason)) => Err(Outcome::LandInProgress { reason }),
        Ok(None) => Ok(()),
        Err(why) => Err(failed("lock-unreadable", why)),
    }
}

fn mark(ports: &dyn ReleasePorts, marked: &mut bool, step: &str) -> Result<(), Outcome> {
    *marked = true;
    ports.set_step(Some(step)).map_err(|why| {
        failed(
            "state-unwritable",
            format!("the {step} step was not recorded: {why}"),
        )
    })
}

/// Runs every check in a checkout of `tip` made for them and removed after them. `Some` is the outcome that ends the
/// run (nothing is made when there are no checks). A removal that fails is reported and logged; the outcome stands.
fn run_checks(ports: &dyn ReleasePorts, checks: &[Vec<String>], tip: &str) -> Option<Outcome> {
    if checks.is_empty() {
        return None;
    }
    let checkout = match ports.make_check_checkout(tip) {
        Ok(path) => path,
        Err(why) => return Some(failed("check-checkout-failed", why)),
    };
    let mut ended = None;
    for check in checks {
        match ports.run(check, Some(&checkout)) {
            Ok(0) => {}
            Ok(exit) => {
                ended = Some(Outcome::ChecksFailed {
                    argv: check.clone(),
                    exit,
                });
                break;
            }
            Err(why) => {
                ended = Some(failed(
                    "check-not-run",
                    format!("{}: {why}", line_of(check)),
                ));
                break;
            }
        }
    }
    if let Err(why) = ports.remove_check_checkout(&checkout, tip) {
        let line = format!(
            "the release check checkout at {} was not removed: {why}",
            checkout.display()
        );
        ports.report(&line);
        ports.log(&line);
    }
    ended
}

fn steps(ports: &dyn ReleasePorts, marked: &mut bool) -> Outcome {
    let recipe = match ports.recipe().and_then(|value| Recipe::from_value(&value)) {
        Ok(recipe) => recipe,
        Err(why) => return failed("recipe-invalid", why),
    };
    let Some(apply) = recipe.apply.clone() else {
        return Outcome::NoRecipe;
    };
    let tip = match ports.trunk_tip() {
        Ok(tip) => tip.trim().to_string(),
        Err(why) => return failed("trunk-unreadable", why),
    };
    match ports.released_commit() {
        Ok(Some(released)) if released.trim() == tip => return Outcome::NothingNew,
        Ok(_) => {}
        Err(why) => return failed("state-unreadable", why),
    }
    if let Err(outcome) = land_check(ports) {
        return outcome;
    }
    if let Some(outcome) = run_checks(ports, &recipe.checks, &tip) {
        return outcome;
    }
    if !recipe.reversible {
        return match ports.ask_owner(&apply) {
            Ok(question) => Outcome::Asked { question },
            Err(why) => failed("ask-failed", why),
        };
    }
    // A land may have taken the slot while the checks ran: nothing is applied under it.
    if let Err(outcome) = land_check(ports) {
        return outcome;
    }
    let rollback = recipe.rollback.clone().unwrap_or_default();
    let undo = |reason: String| -> Outcome {
        match ports.run(&rollback, None) {
            Ok(0) => Outcome::RolledBack { reason },
            Ok(exit) => failed(
                "rollback-failed",
                format!("{reason}; rollback exited {exit}"),
            ),
            Err(why) => failed("rollback-failed", format!("{reason}; rollback: {why}")),
        }
    };
    if let Err(outcome) = mark(ports, marked, "applying") {
        return outcome;
    }
    match ports.run(&apply, None) {
        Ok(0) => {}
        Ok(exit) => return undo(format!("apply exited {exit}")),
        Err(why) => return undo(format!("apply did not run: {why}")),
    }
    if let Some(probe) = &recipe.probe {
        if let Err(outcome) = mark(ports, marked, "probing") {
            return outcome;
        }
        match ports.run(probe, None) {
            Ok(0) => {}
            Ok(exit) => return undo(format!("probe exited {exit}")),
            Err(why) => return undo(format!("probe did not run: {why}")),
        }
    }
    match ports.record_released(&tip) {
        Ok(()) => Outcome::Released,
        Err(why) => failed(
            "state-unwritable",
            format!("the release was applied but its commit was not recorded: {why}"),
        ),
    }
}

/// The rollback path alone (the secretary's, when the supervisor does not come back after a release): runs the
/// recipe's `rollback` and reports it, whatever it ends in. It refuses `no-release-in-flight` unless the record
/// shows a step that never ended; the caller holds the release lock, so the run that wrote it is dead. Once the
/// rollback has run, its outcome, whatever it is, retires that step.
pub fn run_rollback(ports: &dyn ReleasePorts) -> Outcome {
    let mut ran = false;
    let outcome = rollback_steps(ports, &mut ran);
    finish(ports, outcome, ran)
}

fn rollback_steps(ports: &dyn ReleasePorts, ran: &mut bool) -> Outcome {
    let recipe = match ports.recipe().and_then(|value| Recipe::from_value(&value)) {
        Ok(recipe) => recipe,
        Err(why) => return failed("recipe-invalid", why),
    };
    match ports.step() {
        Ok(Some(_)) => {}
        Ok(None) => {
            return failed(
                "no-release-in-flight",
                "no release step is recorded as begun and unended".into(),
            )
        }
        Err(why) => return failed("state-unreadable", why),
    }
    let Some(rollback) = recipe.rollback else {
        return Outcome::NoRecipe;
    };
    *ran = true;
    match ports.run(&rollback, None) {
        Ok(0) => Outcome::RolledBack {
            reason: "rollback requested".into(),
        },
        Ok(exit) => failed("rollback-failed", format!("rollback exited {exit}")),
        Err(why) => failed("rollback-failed", why),
    }
}
