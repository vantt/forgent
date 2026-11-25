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

/// Whether the lock report (`fgos lock-status --json`) shows a merge slot held: a `merge-slot` row, or one of its
/// instances, whose status reads `held`.
pub fn merge_slot_held(report: &Value) -> bool {
    fn held_inside(value: &Value) -> bool {
        match value {
            Value::Object(object) => {
                object.get("status").and_then(Value::as_str) == Some("held")
                    || object.values().any(held_inside)
            }
            Value::Array(list) => list.iter().any(held_inside),
            _ => false,
        }
    }
    fn walk(value: &Value) -> bool {
        match value {
            Value::Object(object) => {
                if object.get("name").and_then(Value::as_str) == Some("merge-slot") {
                    return held_inside(value);
                }
                object.values().any(walk)
            }
            Value::Array(list) => list.iter().any(walk),
            _ => false,
        }
    }
    walk(report)
}

/// The external calls of a release run.
pub trait ReleasePorts {
    /// The `release` subtree of the effective config (`Null` when nothing is set).
    fn recipe(&self) -> Result<Value, String>;
    /// Whether the trunk tip has nothing landed since the active release.
    fn nothing_new(&self) -> Result<bool, String>;
    /// Whether a land holds the merge slot.
    fn land_in_progress(&self) -> Result<bool, String>;
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
    LandInProgress,
    ChecksFailed {
        argv: Vec<String>,
        exit: i32,
    },
    /// The recipe is irreversible: the owner was asked, nothing was applied.
    Asked {
        question: String,
    },
    Released,
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
            Outcome::LandInProgress => "land-in-progress",
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

    pub fn to_value(&self) -> Value {
        let mut out = json!({ "outcome": self.code() });
        match self {
            Outcome::ChecksFailed { argv, exit } => {
                out["argv"] = json!(argv);
                out["exit"] = json!(exit);
            }
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

/// The release steps, in order: no recipe, nothing new, land in progress, each check, the irreversible stop (the
/// owner is asked with the exact apply argv), apply, probe, rollback on a failure; one report line at the end.
pub fn run(ports: &dyn ReleasePorts) -> Outcome {
    let recipe = match ports.recipe().and_then(|value| Recipe::from_value(&value)) {
        Ok(recipe) => recipe,
        Err(why) => return failed("recipe-invalid", why),
    };
    let Some(apply) = recipe.apply.clone() else {
        return Outcome::NoRecipe;
    };
    match ports.nothing_new() {
        Ok(true) => return Outcome::NothingNew,
        Ok(false) => {}
        Err(why) => return failed("trunk-unreadable", why),
    }
    match ports.land_in_progress() {
        Ok(true) => return Outcome::LandInProgress,
        Ok(false) => {}
        Err(why) => return failed("lock-unreadable", why),
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
            Ok(question) => Outcome::Asked { question },
            Err(why) => failed("ask-failed", why),
        };
    }
    let rollback = recipe.rollback.clone().unwrap_or_default();
    let undo = |reason: String| -> Outcome {
        match ports.run(&rollback) {
            Ok(0) => {
                ports.report(&format!("release rolled back: {reason}"));
                Outcome::RolledBack { reason }
            }
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
    ports.report("release applied");
    Outcome::Released
}

/// The rollback path alone (the secretary's, when the supervisor does not come back after a release): runs the
/// recipe's `rollback` and reports it.
pub fn run_rollback(ports: &dyn ReleasePorts) -> Outcome {
    let recipe = match ports.recipe().and_then(|value| Recipe::from_value(&value)) {
        Ok(recipe) => recipe,
        Err(why) => return failed("recipe-invalid", why),
    };
    let Some(rollback) = recipe.rollback else {
        return Outcome::NoRecipe;
    };
    match ports.run(&rollback) {
        Ok(0) => {
            ports.report("release rolled back on request");
            Outcome::RolledBack {
                reason: "rollback requested".into(),
            }
        }
        Ok(exit) => failed("rollback-failed", format!("rollback exited {exit}")),
        Err(why) => failed("rollback-failed", why),
    }
}
