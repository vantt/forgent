//! The release rule: what `release run` does with a project's recipe (`release.*` config keys), in order, and nothing
//! about what the recipe runs. The recipe is project data: `reversible` (boolean, default false), `checks` (argv
//! lists), `apply`, `probe`, `rollback` (argv lists). An unset `apply` means the project declares no release.
//!
//! Every external call (the config read, the git and lock reads, running an argv, the owner question and the report)
//! is behind [`ReleasePorts`], so the proof drives fixtures; the run supervisor owns the real adapters. An argv runs
//! with no shell, from the project root.

use serde_json::{json, Map, Value};

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

/// The `release` subtree inside the JSON `fgos config show --path release --json` prints: the first object that holds
/// a recipe key, with a leaf given as `{value: x}` (a value with its provenance) reduced to `x`. `Null` when the
/// answer holds no recipe key.
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
    find(answer).unwrap_or(Value::Null)
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

/// Whether the active release's `gitCommit` (`fgos version --json`, a short hash) names the trunk tip (a full or
/// short hash): the shorter hash is a prefix of the longer. Under seven characters nothing is compared.
pub fn same_commit(active: &str, tip: &str) -> bool {
    let (active, tip) = (active.trim(), tip.trim());
    active.len() >= 7 && tip.len() >= 7 && (tip.starts_with(active) || active.starts_with(tip))
}

/// The trunk tip against the active release.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Newness {
    /// The active release was built from the trunk tip.
    NothingNew,
    /// The trunk tip is past the active release.
    Landed,
    /// The active release's commit is not known (the reason), so the tip cannot be compared.
    Unknown(String),
}

/// The external calls of a release run.
pub trait ReleasePorts {
    /// The `release` subtree of the effective config (`Null` when nothing is set).
    fn recipe(&self) -> Result<Value, String>;
    /// What the trunk tip holds against the active release.
    fn newness(&self) -> Result<Newness, String>;
    /// Why a land holds the merge slot (`Some`), or `None` when none does.
    fn land_in_progress(&self) -> Result<Option<String>, String>;
    /// Runs one argv (no shell, project root) and returns its exit code.
    fn run(&self, argv: &[String]) -> Result<i32, String>;
    /// Files the owner question carrying the exact apply argv; returns its id.
    fn ask_owner(&self, apply: &[String]) -> Result<String, String>;
    /// Writes one report line to the owner (information, not a choice).
    fn report(&self, line: &str);
}

/// How a release run ended.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Outcome {
    /// The recipe names no `apply`: the project declares no release.
    NoRecipe,
    NothingNew,
    LandInProgress {
        reason: String,
    },
    ChecksFailed {
        argv: Vec<String>,
        exit: i32,
    },
    /// The recipe is irreversible: the owner was asked, nothing was applied. `note` is set when the active
    /// release's commit was not known, so the trunk was treated as new.
    Asked {
        question: String,
        note: Option<String>,
    },
    Released {
        note: Option<String>,
    },
    /// `apply` or `probe` failed and `rollback` ran and passed.
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
            Outcome::Released { .. } => "released",
            Outcome::RolledBack { .. } => "rolled-back",
            Outcome::Failed { code, .. } => code,
        }
    }

    /// `asked` and `released` are answers; every other outcome is a refusal.
    pub fn is_answer(&self) -> bool {
        matches!(self, Outcome::Asked { .. } | Outcome::Released { .. })
    }

    /// The one line the owner is told when this outcome ends a run. A run that changed or refused nothing (no
    /// recipe, nothing new, a land in progress) is silent, and an `asked` run's question is its own report.
    pub fn report_line(&self) -> Option<String> {
        match self {
            Outcome::NoRecipe
            | Outcome::NothingNew
            | Outcome::LandInProgress { .. }
            | Outcome::Asked { .. } => None,
            Outcome::Released { note } => Some(match note {
                Some(note) => format!("release applied ({note})"),
                None => "release applied".to_string(),
            }),
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
            Outcome::Asked { question, note } => {
                out["question"] = json!(question);
                if let Some(note) = note {
                    out["note"] = json!(note);
                }
            }
            Outcome::Released { note: Some(note) } => out["note"] = json!(note),
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

/// The release steps, in order: no recipe, nothing new, land in progress, each check, the irreversible stop (the
/// owner is asked with the exact apply argv), land in progress again, apply, probe, rollback on a failure. The
/// owner gets one report line for every outcome that changed or refused something.
pub fn run(ports: &dyn ReleasePorts) -> Outcome {
    let outcome = steps(ports);
    if let Some(line) = outcome.report_line() {
        ports.report(&line);
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

fn steps(ports: &dyn ReleasePorts) -> Outcome {
    let recipe = match ports.recipe().and_then(|value| Recipe::from_value(&value)) {
        Ok(recipe) => recipe,
        Err(why) => return failed("recipe-invalid", why),
    };
    let Some(apply) = recipe.apply.clone() else {
        return Outcome::NoRecipe;
    };
    let note = match ports.newness() {
        Ok(Newness::NothingNew) => return Outcome::NothingNew,
        Ok(Newness::Landed) => None,
        Ok(Newness::Unknown(why)) => Some(format!(
            "the active release's commit is not known ({why}), so the trunk was treated as new"
        )),
        Err(why) => return failed("trunk-unreadable", why),
    };
    if let Err(outcome) = land_check(ports) {
        return outcome;
    }
    for check in &recipe.checks {
        match ports.run(check) {
            Ok(0) => {}
            Ok(exit) => {
                return Outcome::ChecksFailed {
                    argv: check.clone(),
                    exit,
                }
            }
            Err(why) => return failed("check-not-run", format!("{}: {why}", line_of(check))),
        }
    }
    if !recipe.reversible {
        return match ports.ask_owner(&apply) {
            Ok(question) => Outcome::Asked { question, note },
            Err(why) => failed("ask-failed", why),
        };
    }
    // A land may have taken the slot while the checks ran: nothing is applied under it.
    if let Err(outcome) = land_check(ports) {
        return outcome;
    }
    let rollback = recipe.rollback.clone().unwrap_or_default();
    let undo = |reason: String| -> Outcome {
        match ports.run(&rollback) {
            Ok(0) => Outcome::RolledBack { reason },
            Ok(exit) => failed(
                "rollback-failed",
                format!("{reason}; rollback exited {exit}"),
            ),
            Err(why) => failed("rollback-failed", format!("{reason}; rollback: {why}")),
        }
    };
    match ports.run(&apply) {
        Ok(0) => {}
        Ok(exit) => return undo(format!("apply exited {exit}")),
        Err(why) => return undo(format!("apply did not run: {why}")),
    }
    if let Some(probe) = &recipe.probe {
        match ports.run(probe) {
            Ok(0) => {}
            Ok(exit) => return undo(format!("probe exited {exit}")),
            Err(why) => return undo(format!("probe did not run: {why}")),
        }
    }
    Outcome::Released { note }
}

/// The rollback path alone (the secretary's, when the supervisor does not come back after a release): runs the
/// recipe's `rollback` and reports it, whatever it ends in.
pub fn run_rollback(ports: &dyn ReleasePorts) -> Outcome {
    let outcome = rollback_steps(ports);
    if let Some(line) = outcome.report_line() {
        ports.report(&line);
    }
    outcome
}

fn rollback_steps(ports: &dyn ReleasePorts) -> Outcome {
    let recipe = match ports.recipe().and_then(|value| Recipe::from_value(&value)) {
        Ok(recipe) => recipe,
        Err(why) => return failed("recipe-invalid", why),
    };
    let Some(rollback) = recipe.rollback else {
        return Outcome::NoRecipe;
    };
    match ports.run(&rollback) {
        Ok(0) => Outcome::RolledBack {
            reason: "rollback requested".into(),
        },
        Ok(exit) => failed("rollback-failed", format!("rollback exited {exit}")),
        Err(why) => failed("rollback-failed", why),
    }
}
