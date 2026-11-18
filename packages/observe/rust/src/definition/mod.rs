//! Named query definitions: a `*.query.json` file kept where its owner uses it.
//!
//! A definition is `{name, requires?, query, params?, minSample?, row?}`. Observe knows none of the names it will
//! meet: the owner writes the query, the kinds it needs and the thresholds it takes, and `run_definition` answers it
//! through the one query engine. A required kind that is undeclared, or that no source serves, makes the answer
//! `unmeasured` with the reason; nothing has to be declared as a placeholder.

use crate::contract::RecordSource;
use crate::query::{run, Query, QueryContext, QueryResult};
use crate::record::registry::Registry;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

/// A definition file's name ends with this.
pub const DEFINITION_SUFFIX: &str = ".query.json";
/// A definition file is read up to this many bytes.
const MAX_DEFINITION_BYTES: u64 = 1024 * 1024;

#[derive(Debug, thiserror::Error)]
pub enum DefinitionError {
    #[error("cannot read definition {path}: {message}")]
    Read { path: String, message: String },
    #[error("invalid definition {path}: {message}")]
    Invalid { path: String, message: String },
    #[error("definition name '{name}' is defined twice ({first} and {second})")]
    Duplicate {
        name: String,
        first: String,
        second: String,
    },
}

/// Where a query parameter comes from: a config key the composition root resolves, or a literal.
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct ParamSource {
    #[serde(default, rename = "configKey", skip_serializing_if = "Option::is_none")]
    pub config_key: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub value: Option<f64>,
}

/// What a consumer turns one answer row into. Observe only carries it back to the caller.
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct RowTemplate {
    pub kind: String,
    pub reason: String,
    #[serde(rename = "nextCommand")]
    pub next_command: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Definition {
    pub name: String,
    /// Kinds that must be declared and served. A trailing `*` stands for every declared kind with that prefix.
    #[serde(default)]
    pub requires: Vec<String>,
    pub query: Query,
    #[serde(default)]
    pub params: BTreeMap<String, ParamSource>,
    #[serde(default, rename = "minSample", skip_serializing_if = "Option::is_none")]
    pub min_sample: Option<usize>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub row: Option<RowTemplate>,
}

impl Definition {
    pub fn parse(origin: &str, text: &str) -> Result<Self, DefinitionError> {
        let invalid = |message: String| DefinitionError::Invalid {
            path: origin.to_owned(),
            message,
        };
        let definition: Self = serde_json::from_str(text).map_err(|e| invalid(e.to_string()))?;
        if definition.name.trim().is_empty() {
            return Err(invalid("name is empty".to_owned()));
        }
        for (name, source) in &definition.params {
            if source.config_key.is_some() == source.value.is_some() {
                return Err(invalid(format!(
                    "param '{name}' needs exactly one of configKey and value"
                )));
            }
        }
        Ok(definition)
    }
}

/// The definitions in `paths`, in the order given: each path is one file, or every `*.query.json` directly inside a
/// directory, in name order. A symlink is never followed. Two definitions with one name, in one path or across
/// paths, are refused.
pub fn load(paths: &[&Path]) -> Result<Vec<Definition>, DefinitionError> {
    let mut loaded: Vec<(String, Definition)> = Vec::new();
    for path in paths {
        for file in definition_files(path)? {
            let origin = file.display().to_string();
            let len = fs::metadata(&file)
                .map_err(|e| read_error(&file, &e))?
                .len();
            if len > MAX_DEFINITION_BYTES {
                return Err(DefinitionError::Invalid {
                    path: origin,
                    message: format!("larger than {MAX_DEFINITION_BYTES} bytes"),
                });
            }
            let text = fs::read_to_string(&file).map_err(|e| read_error(&file, &e))?;
            let definition = Definition::parse(&origin, &text)?;
            if let Some((first, _)) = loaded.iter().find(|(_, d)| d.name == definition.name) {
                return Err(DefinitionError::Duplicate {
                    name: definition.name,
                    first: first.clone(),
                    second: origin,
                });
            }
            loaded.push((origin, definition));
        }
    }
    Ok(loaded.into_iter().map(|(_, d)| d).collect())
}

fn read_error(path: &Path, e: &std::io::Error) -> DefinitionError {
    DefinitionError::Read {
        path: path.display().to_string(),
        message: e.to_string(),
    }
}

/// The one file `path` names, or the regular `*.query.json` files directly inside the directory, in name order.
fn definition_files(path: &Path) -> Result<Vec<std::path::PathBuf>, DefinitionError> {
    let meta = fs::symlink_metadata(path).map_err(|e| read_error(path, &e))?;
    if meta.is_file() {
        return Ok(vec![path.to_path_buf()]);
    }
    if !meta.is_dir() {
        return Err(DefinitionError::Read {
            path: path.display().to_string(),
            message: "not a regular file or directory".to_owned(),
        });
    }
    let mut files = Vec::new();
    for entry in fs::read_dir(path).map_err(|e| read_error(path, &e))? {
        let entry = entry.map_err(|e| read_error(path, &e))?;
        let file = entry.path();
        let is_definition = file
            .file_name()
            .and_then(|n| n.to_str())
            .is_some_and(|n| n.ends_with(DEFINITION_SUFFIX));
        if is_definition && entry.file_type().is_ok_and(|t| t.is_file()) {
            files.push(file);
        }
    }
    files.sort();
    Ok(files)
}

/// Resolves the `configKey` of a parameter. Observe never reads config: the composition root supplies this.
pub trait ParamResolver {
    /// `Ok(None)` when no config layer sets the key; `Err` when the value cannot be read as a number.
    fn config_number(&self, key: &str) -> Result<Option<f64>, String>;
}

/// One definition's answer: the engine's result, plus the row template the owner wrote.
#[derive(Debug, Clone, Default, PartialEq, Serialize)]
pub struct DefinitionResult {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub row: Option<RowTemplate>,
    /// The query itself was refused (a bad name or operator); the other definitions still run.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(flatten)]
    pub result: QueryResult,
}

/// What a definition reads: the merged registry, the sources, the project root and the clock.
pub struct Environment<'a> {
    pub registry: &'a Registry,
    pub sources: &'a [&'a dyn RecordSource],
    pub root: &'a Path,
    pub now_millis: i64,
    pub resolver: &'a dyn ParamResolver,
}

fn unmeasured(def: &Definition, reason: String) -> DefinitionResult {
    DefinitionResult {
        name: def.name.clone(),
        row: def.row.clone(),
        error: None,
        result: QueryResult {
            unmeasured: Some(reason),
            ..QueryResult::default()
        },
    }
}

/// The first reason a required kind cannot be measured, if any.
fn missing_requirement(
    requires: &[String],
    registry: &Registry,
    sources: &[&dyn RecordSource],
) -> Option<String> {
    for required in requires {
        let kinds: Vec<&str> = match required.strip_suffix('*') {
            Some(prefix) => registry
                .kind_names()
                .filter(|k| k.starts_with(prefix))
                .collect(),
            None => registry
                .kind(required)
                .map(|_| required.as_str())
                .into_iter()
                .collect(),
        };
        if kinds.is_empty() {
            return Some(format!("kind-undeclared: {required}"));
        }
        if let Some(kind) = kinds
            .iter()
            .find(|k| !sources.iter().any(|s| s.kinds().contains(k)))
        {
            return Some(format!("no-source: {kind}"));
        }
    }
    None
}

pub fn run_definition(def: &Definition, env: &Environment<'_>) -> DefinitionResult {
    if let Some(reason) = missing_requirement(&def.requires, env.registry, env.sources) {
        return unmeasured(def, reason);
    }
    let mut params = BTreeMap::new();
    for (name, source) in &def.params {
        let value = match (&source.config_key, source.value) {
            (_, Some(value)) => value,
            (Some(key), None) => match env.resolver.config_number(key) {
                Ok(Some(value)) => value,
                Ok(None) => return unmeasured(def, format!("config-unset: {key}")),
                Err(message) => {
                    return unmeasured(def, format!("config-unreadable: {key}: {message}"))
                }
            },
            (None, None) => return unmeasured(def, format!("param-empty: {name}")),
        };
        params.insert(name.clone(), value);
    }
    let mut query = def.query.clone();
    if let Some(min_sample) = def.min_sample {
        query.min_sample = min_sample;
    }
    let ctx = QueryContext {
        registry: env.registry,
        sources: env.sources,
        root: env.root,
        now_millis: env.now_millis,
        params,
    };
    match run(&query, &ctx) {
        Ok(result) => DefinitionResult {
            name: def.name.clone(),
            row: def.row.clone(),
            error: None,
            result,
        },
        Err(e) => DefinitionResult {
            name: def.name.clone(),
            row: def.row.clone(),
            error: Some(e.to_string()),
            result: QueryResult::default(),
        },
    }
}

/// Sets the run's window on every definition: a given bound replaces the definition's own, an absent one leaves it.
pub fn window(defs: &mut [Definition], since: Option<&str>, until: Option<&str>) {
    for def in defs {
        if let Some(since) = since {
            def.query.since = Some(since.to_owned());
        }
        if let Some(until) = until {
            def.query.until = Some(until.to_owned());
        }
    }
}

/// Every definition's answer, in the order given.
pub fn run_definitions(defs: &[Definition], env: &Environment<'_>) -> Vec<DefinitionResult> {
    defs.iter().map(|d| run_definition(d, env)).collect()
}
