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

pub use origins::{fgos_dir_from_root, resolve_origin_locations};

use crate::runner_check::{check_runner_config, retired_pattern_key_at, RunnerCheckError};
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

/// The refusal: Node's `RunnerConfigError` (or the class of the confinement rule that refused), with the optional
/// `code`, `phase`, `path`, `paths` and `detail` it carries.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RunnerConfigError {
    pub name: String,
    pub code: Option<String>,
    pub phase: Option<String>,
    pub message: String,
    pub path: Option<String>,
    pub paths: Option<Vec<String>>,
    pub detail: Option<String>,
}

const RUNNER_CONFIG_ERROR: &str = "RunnerConfigError";

impl RunnerConfigError {
    fn plain(message: String, code: Option<&str>) -> Self {
        RunnerConfigError {
            name: RUNNER_CONFIG_ERROR.into(),
            code: code.map(str::to_string),
            phase: None,
            message,
            path: None,
            paths: None,
            detail: None,
        }
    }

    fn of_check(failure: RunnerCheckError) -> Self {
        RunnerConfigError {
            name: failure.error.name.to_string(),
            code: failure.error.code.map(str::to_string),
            phase: None,
            message: failure.error.message,
            paths: if failure.paths.is_empty() {
                failure.path.clone().map(|path| vec![path])
            } else {
                Some(failure.paths)
            },
            path: failure.path,
            detail: failure.detail,
        }
    }

    /// Node's `deriveSubpath`: the common dotted parent of the paths, without the leading `runner.`.
    fn subpath(&self) -> Option<String> {
        let paths: Vec<&String> = match (&self.paths, &self.path) {
            (Some(paths), _) if !paths.is_empty() => paths.iter().collect(),
            (_, Some(path)) => vec![path],
            _ => return None,
        };
        let strip = |text: &str| text.strip_prefix("runner.").unwrap_or(text).to_string();
        let shown = if paths.len() == 1 {
            strip(paths[0])
        } else {
            strip(&common_dotted_parent(&paths))
        };
        (!shown.is_empty()).then_some(shown)
    }

    /// The refusal as the vectors state it: `{ name, category?, code?, phase?, message, path?, paths?, detail? }`.
    pub fn to_json(&self) -> Value {
        let mut out = Map::new();
        out.insert("name".into(), json!(self.name));
        if self.name == RUNNER_CONFIG_ERROR {
            out.insert("category".into(), json!("validation"));
        }
        for (key, value) in [("code", &self.code), ("phase", &self.phase)] {
            if let Some(value) = value {
                out.insert(key.into(), json!(value));
            }
        }
        out.insert("message".into(), json!(self.message));
        if let Some(path) = &self.path {
            out.insert("path".into(), json!(path));
        }
        if let Some(paths) = &self.paths {
            out.insert("paths".into(), json!(paths));
        }
        if let Some(detail) = &self.detail {
            out.insert("detail".into(), json!(detail));
        }
        Value::Object(out)
    }
}

impl fmt::Display for RunnerConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for RunnerConfigError {}

/// The dotted segments the paths share from the start (`commonDottedParent`).
fn common_dotted_parent(paths: &[&String]) -> String {
    let split: Vec<Vec<&str>> = paths.iter().map(|p| p.split('.').collect()).collect();
    let Some(first) = split.first() else {
        return String::new();
    };
    let mut common: Vec<&str> = Vec::new();
    for (i, segment) in first.iter().enumerate() {
        if split.iter().all(|p| p.get(i) == Some(segment)) {
            common.push(segment);
        } else {
            break;
        }
    }
    common.join(".")
}

/// `runner.rigorToTier` is retired. Set in the global file it is refused here, naming that file (the shape check
/// names the project directory, which is not where the key is).
fn refuse_global_rigor_to_tier(origins: &[Value]) -> Result<(), RunnerConfigError> {
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
    let position = origins::line_of(at)
        .map(|line| format!(":{line}:{}", origins::print_member(at, "column")))
        .unwrap_or_default();
    Err(RunnerConfigError::plain(
        format!("{file}{position} runner.rigorToTier no longer exists: rigor no longer chooses a tier; delete the key."),
        None,
    ))
}

/// A refusal of the door that points at a retired key says what replaced it, with the file and position of each.
fn retired_key_refusal(
    code: &str,
    message: &str,
    refusals: &[Value],
    check_findings: &[Value],
) -> RunnerConfigError {
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
        let position = origins::line_of(entry)
            .map(|line| format!(":{line}:{}", origins::print_member(entry, "column")))
            .unwrap_or_default();
        let dedupe = format!("{key}@{}", file.unwrap_or(""));
        if !seen.contains(&dedupe) {
            seen.push(dedupe);
            messages.push(format!(
                "{shown}{position}: {key} was retired; {instruction}."
            ));
        }
    }
    if messages.is_empty() {
        RunnerConfigError::plain(message.to_string(), Some(code))
    } else {
        RunnerConfigError::plain(messages.join("\n"), Some("config-key-retired"))
    }
}

/// A refusal of the shape check, attributed to the file and line the values came from when the origins name them.
fn attribute(
    error: &RunnerConfigError,
    origins: &[Value],
    project_dir: &str,
) -> Option<RunnerConfigError> {
    if error.name != RUNNER_CONFIG_ERROR {
        return None;
    }
    let paths: Vec<String> = match (&error.paths, &error.path) {
        (Some(paths), _) if !paths.is_empty() => paths.clone(),
        (_, Some(path)) => vec![path.clone()],
        _ => return None,
    };
    let locations = resolve_origin_locations(origins, &paths, project_dir);
    if locations.is_empty() {
        return None;
    }
    let subpath = error
        .subpath()
        .map(|sub| format!(" {sub}"))
        .unwrap_or_default();
    let detail = error.detail.as_deref().unwrap_or(&error.message);
    Some(RunnerConfigError {
        name: error.name.clone(),
        code: error.code.clone(),
        phase: error.phase.clone(),
        message: format!("runner config ({}{subpath}) {detail}", locations.join(", ")),
        path: error.path.clone(),
        paths: error.paths.clone(),
        detail: error.detail.clone(),
    })
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
            return Err(retired_key_refusal(
                &code,
                &message,
                &refusals,
                &check_findings,
            ))
        }
    };
    refuse_global_rigor_to_tier(&origins)?;
    let label = format!("{} runner", fgos_dir_from_root(project_root));
    let warnings = check_runner_config(&runner, &label).map_err(|failure| {
        let error = RunnerConfigError::of_check(failure);
        attribute(&error, &origins, project_root).unwrap_or(error)
    })?;
    let mut config = runner;
    confinement::normalize_config_confinement(&mut config);
    Ok(RunnerConfig {
        config,
        origins,
        warnings,
    })
}
