//! The runner config as the verbs and the engine read it: the one composition of what the config door hands over (the
//! `runner` section and where each value came from) into the checked runner config, or the refusal that names the
//! file and line at fault. Ported from `loadRunnerConfigForDir` and the helpers it calls (`dispatch/config.mjs`,
//! `dispatch/runner-config-error.mjs`).
//!
//! The reads are the caller's (the config door, which the addon wraps); everything here judges what was read, so it
//! touches no file. The rules that compare two fields are `runner_check`'s, called once, never copied.

// The refusal carries the positions Node's error carries; it is built once, on the cold path of a refused config.
#![allow(clippy::result_large_err)]

mod confinement;
mod origins;

pub use confinement::normalize_legacy_confinement;
pub use origins::{fgos_dir_from_root, resolve_origin_locations};

use crate::executor_model::ModelError;
use crate::js;
use crate::runner_check::{
    check_runner_config, common_dotted_parent, retired_pattern_key_at, RunnerCheckError,
};
use serde_json::{json, Map, Value};
use std::fmt;

/// What the config door answered for a project.
#[derive(Debug, Clone, PartialEq)]
pub enum DoorRead {
    /// The effective `runner` section, with the origins of the values the check attributes (a JSON object per origin:
    /// `path`, `layer`, `file`, `line`, `column`, ...).
    Read { runner: Value, origins: Vec<Value> },
    /// The door refused: its failure id, its message, and every refusal (`path`, `file`, `line`, `column`). The
    /// findings of the door's own config check (the same shape) are read by the caller when the door refused and
    /// listed first.
    Refused {
        code: String,
        message: String,
        refusals: Vec<Value>,
        check_findings: Vec<Value>,
    },
}

/// A checked runner config: the section, the origins it carries, and the advisory warnings the check produced
/// (text Node prints with `console.warn`).
#[derive(Debug, Clone, PartialEq)]
pub struct RunnerConfig {
    pub config: Value,
    pub origins: Vec<Value>,
    pub warnings: Vec<String>,
}

/// The refusal: the door's (a `RunnerConfigError` carrying the door's failure id, or `config-key-retired`), or the
/// loader's and the check's (Node's `RunnerConfigError`, or the class of the confinement rule that refused, with
/// the `path`, `paths` and `detail` it carries).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RunnerConfigError {
    Door(DoorRefusal),
    Config(RunnerCheckError),
}

/// A refusal of the config door as the runner words it: the door's failure id (or `config-key-retired`) and text.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DoorRefusal {
    pub code: String,
    pub message: String,
}

const RUNNER_CONFIG_ERROR: &str = "RunnerConfigError";

impl RunnerConfigError {
    pub fn message(&self) -> &str {
        match self {
            RunnerConfigError::Door(door) => &door.message,
            RunnerConfigError::Config(failure) => &failure.error.message,
        }
    }

    /// The refusal as the vectors state it: `{ name, category?, code?, message, path?, paths?, detail? }`.
    pub fn to_json(&self) -> Value {
        let mut out = Map::new();
        let failure = match self {
            RunnerConfigError::Door(door) => {
                out.insert("name".into(), json!(RUNNER_CONFIG_ERROR));
                out.insert("category".into(), json!("validation"));
                out.insert("code".into(), json!(door.code));
                out.insert("message".into(), json!(door.message));
                return Value::Object(out);
            }
            RunnerConfigError::Config(failure) => failure,
        };
        out.insert("name".into(), json!(failure.error.name));
        if failure.error.name == RUNNER_CONFIG_ERROR {
            out.insert("category".into(), json!("validation"));
        }
        if let Some(code) = failure.error.code {
            out.insert("code".into(), json!(code));
        }
        out.insert("message".into(), json!(failure.error.message));
        if let Some(path) = &failure.path {
            out.insert("path".into(), json!(path));
        }
        if let Some(paths) = paths_of(failure) {
            out.insert("paths".into(), json!(paths));
        }
        if let Some(detail) = &failure.detail {
            out.insert("detail".into(), json!(detail));
        }
        Value::Object(out)
    }
}

impl fmt::Display for RunnerConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.message())
    }
}

impl std::error::Error for RunnerConfigError {}

/// The paths a refusal points at: its `paths`, else its one `path`.
fn paths_of(failure: &RunnerCheckError) -> Option<Vec<String>> {
    if failure.paths.is_empty() {
        failure.path.clone().map(|path| vec![path])
    } else {
        Some(failure.paths.clone())
    }
}

/// Node's `deriveSubpath`: the common dotted parent of the paths, without the leading `runner.`.
fn subpath(paths: &[String]) -> Option<String> {
    let strip = |text: &str| text.strip_prefix("runner.").unwrap_or(text).to_string();
    let shown = match paths {
        [] => return None,
        [one] => strip(one),
        many => strip(&common_dotted_parent(
            &many.iter().map(String::as_str).collect::<Vec<_>>(),
        )),
    };
    (!shown.is_empty()).then_some(shown)
}

/// The position `:line:column` of an origin or refusal that has a whole line, as Node's template prints it.
fn position(entry: &Value) -> String {
    origins::line_of(entry)
        .map(|line| format!(":{line}:{}", js::text(entry.get("column"))))
        .unwrap_or_default()
}

/// `runner.rigorToTier` is retired. Set in the global file it is refused here, naming that file (the shape check
/// names the project directory, which is not where the key is).
fn refuse_global_rigor_to_tier(origins: &[Value]) -> Result<(), RunnerCheckError> {
    let at = origins.iter().find(|o| {
        o.get("layer").and_then(Value::as_str) == Some("global")
            && o.get("path")
                .and_then(Value::as_str)
                .is_some_and(|p| p == "runner.rigorToTier" || p.starts_with("runner.rigorToTier."))
    });
    let Some(at) = at else {
        return Ok(());
    };
    let file = at
        .get("file")
        .and_then(Value::as_str)
        .unwrap_or("config.json");
    let file = format!("~/.fgos/{}", file.strip_prefix("global:").unwrap_or(file));
    Err(RunnerCheckError {
        error: ModelError::runner(format!(
            "{file}{} runner.rigorToTier no longer exists: rigor no longer chooses a tier; delete the key.",
            position(at)
        )),
        path: None,
        paths: Vec::new(),
        detail: None,
    })
}

/// A refusal of the config door, as the runner reads it: when it points at a retired `runner.patterns` key it says
/// what replaced the key, with the file and position of each (code `config-key-retired`; the config check's
/// findings first, then the refusals, one sentence per key and file); otherwise the door's own code and message.
pub fn door_refusal(
    code: &str,
    message: &str,
    refusals: &[Value],
    check_findings: &[Value],
) -> DoorRefusal {
    let mut messages: Vec<String> = Vec::new();
    let mut seen: Vec<String> = Vec::new();
    for entry in check_findings.iter().chain(refusals) {
        let Some(path) = entry
            .get("path")
            .and_then(Value::as_str)
            .filter(|p| !p.is_empty())
        else {
            continue;
        };
        let Some((key, instruction)) = retired_pattern_key_at(path) else {
            continue;
        };
        let file = entry.get("file").and_then(Value::as_str);
        let shown = match file {
            Some(f) if f.starts_with("global:") => format!("~/.fgos/{}", &f["global:".len()..]),
            other => other.unwrap_or("<file>").to_string(),
        };
        let dedupe = format!("{key}@{}", file.unwrap_or(""));
        if !seen.contains(&dedupe) {
            seen.push(dedupe);
            messages.push(format!(
                "{shown}{}: {key} was retired; {instruction}.",
                position(entry)
            ));
        }
    }
    if messages.is_empty() {
        DoorRefusal {
            code: code.to_string(),
            message: message.to_string(),
        }
    } else {
        DoorRefusal {
            code: "config-key-retired".into(),
            message: messages.join("\n"),
        }
    }
}

/// A refusal of the shape check, attributed to the file and line the values came from when the origins name them.
fn attribute(failure: RunnerCheckError, origins: &[Value], project_dir: &str) -> RunnerCheckError {
    if failure.error.name != RUNNER_CONFIG_ERROR {
        return failure;
    }
    let Some(paths) = paths_of(&failure) else {
        return failure;
    };
    let locations = resolve_origin_locations(origins, &paths, project_dir);
    if locations.is_empty() {
        return failure;
    }
    let shown = subpath(&paths)
        .map(|sub| format!(" {sub}"))
        .unwrap_or_default();
    let detail = failure
        .detail
        .clone()
        .unwrap_or_else(|| failure.error.message.clone());
    RunnerCheckError {
        error: ModelError {
            message: format!("runner config ({}{shown}) {detail}", locations.join(", ")),
            ..failure.error
        },
        paths: paths_of(&failure).unwrap_or_default(),
        ..failure
    }
}

/// The checked runner config of the project at `project_root` (an absolute path) from what the config door answered:
/// the retired-key refusal of a refused door, the global `rigorToTier` refusal, the semantic check with its
/// refusals attributed to their files, and the confinement of every executor brought to one policy shape.
pub fn load_runner_config(
    project_root: &str,
    door: DoorRead,
) -> Result<RunnerConfig, RunnerConfigError> {
    let (runner, origins) = match door {
        DoorRead::Read { runner, origins } => (runner, origins),
        DoorRead::Refused {
            code,
            message,
            refusals,
            check_findings,
        } => {
            return Err(RunnerConfigError::Door(door_refusal(
                &code,
                &message,
                &refusals,
                &check_findings,
            )))
        }
    };
    refuse_global_rigor_to_tier(&origins).map_err(RunnerConfigError::Config)?;
    let label = format!("{} runner", fgos_dir_from_root(project_root));
    let warnings = check_runner_config(&runner, &label)
        .map_err(|failure| RunnerConfigError::Config(attribute(failure, &origins, project_root)))?;
    let mut config = runner;
    confinement::normalize_config_confinement(&mut config);
    Ok(RunnerConfig {
        config,
        origins,
        warnings,
    })
}
