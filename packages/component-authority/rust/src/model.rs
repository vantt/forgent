//! Loads every model file into typed rows that follow `contracts/model.v1.json`. A field the schema does not
//! name is refused, and so is a missing file.
//!
//! The model is YAML, read through `fgos-yaml-doc` under the `tool` profile: the shared door decides what the
//! text means, and the typed rows are decoded from its JSON view. This crate is the only reader of the model;
//! Node code asks `fgos authority model --json` instead of parsing a model file.

use fgos_yaml_doc::model::Profile;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

/// The model directory, relative to the repository root.
pub const MODEL_DIR: &str = "packages/component-authority/model";

#[derive(Debug, thiserror::Error)]
pub enum ModelError {
    #[error("model file missing: {0}")]
    Missing(PathBuf),
    #[error("model file unreadable: {path}: {reason}")]
    Unreadable { path: PathBuf, reason: String },
    #[error("model file invalid: {path}: {reason}")]
    Invalid { path: PathBuf, reason: String },
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Exception {
    pub path: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub layer: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tier: Option<i64>,
    pub reason: String,
}

/// One named exception to the tier downward rule, as `layers.yaml` `tierExceptions` carries it.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct TierException {
    pub path: String,
    pub tier: i64,
    pub reason: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Component {
    pub id: String,
    pub canonical: String,
    pub aliases: Vec<String>,
    pub meaning: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent: Option<String>,
    pub layer: String,
    pub tier: i64,
    pub paths: Vec<String>,
    #[serde(default)]
    pub exceptions: Vec<Exception>,
    pub owns: Vec<String>,
    #[serde(rename = "mustNotOwn")]
    pub must_not_own: Vec<String>,
    pub spec: String,
    pub source: Vec<String>,
    pub status: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct DecisionKind {
    pub id: String,
    pub canonical: String,
    pub aliases: Vec<String>,
    pub meaning: String,
    pub owner: String,
    pub narrative: String,
    #[serde(default, rename = "readFirst", skip_serializing_if = "Option::is_none")]
    pub read_first: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub facts: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(untagged)]
pub enum DoorPath {
    Plain(String),
    Reasoned(DoorPathReason),
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct DoorPathReason {
    pub path: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

/// One door row. A door has no id of its own: `slug` is its file name without `.yaml`.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Door {
    #[serde(skip_deserializing)]
    pub slug: String,
    pub job: String,
    pub kind: String,
    pub patterns: Vec<String>,
    pub allowed: Vec<DoorPath>,
    #[serde(default)]
    pub debt: Vec<DoorPath>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    #[serde(default, rename = "retiredBy", skip_serializing_if = "Option::is_none")]
    pub retired_by: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub owner: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Contract {
    pub id: String,
    pub canonical: String,
    pub aliases: Vec<String>,
    pub meaning: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    pub provider: String,
    pub consumers: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub guards: Option<serde_json::Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version: Option<serde_json::Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    pub evidence: Vec<String>,
    pub status: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Layers {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub contract: Option<String>,
    pub layers: Vec<String>,
    pub rules: Vec<String>,
    pub domains: Vec<String>,
    #[serde(rename = "tierNames")]
    pub tier_names: BTreeMap<String, String>,
    #[serde(default, rename = "tierExceptions")]
    pub tier_exceptions: Vec<TierException>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Model {
    pub layers: Layers,
    pub components: Vec<Component>,
    pub decision_kinds: Vec<DecisionKind>,
    pub contracts: Vec<Contract>,
    pub doors: Vec<Door>,
}

fn io_error(path: &Path, error: &std::io::Error) -> ModelError {
    if error.kind() == std::io::ErrorKind::NotFound {
        ModelError::Missing(path.to_path_buf())
    } else {
        ModelError::Unreadable {
            path: path.to_path_buf(),
            reason: error.to_string(),
        }
    }
}

/// Reads one model file: the YAML door decides what the text means (a comment is not part of the value), and
/// the typed row is decoded from the document's JSON view. A refusal keeps the file and the door's rule.
fn read<T: for<'de> Deserialize<'de>>(path: &Path) -> Result<T, ModelError> {
    let text = fs::read_to_string(path).map_err(|error| io_error(path, &error))?;
    let name = path
        .file_name()
        .map(|name| name.to_string_lossy().into_owned())
        .unwrap_or_default();
    let invalid = |reason: String| ModelError::Invalid {
        path: path.to_path_buf(),
        reason,
    };
    let value = fgos_yaml_doc::document::parse(text.as_bytes(), Profile::Tool, &name)
        .and_then(|document| document.to_json())
        .map_err(|refusal| invalid(refusal.to_string()))?;
    serde_json::from_value(value).map_err(|error| invalid(error.to_string()))
}

impl Model {
    /// Loads the model of the repository rooted at `root`.
    pub fn load(root: &Path) -> Result<Self, ModelError> {
        Self::load_dir(&root.join(MODEL_DIR))
    }

    /// Loads the model at `dir`, or answers `None` when `dir` is not a directory: a project that has no model
    /// has no authority to ask. A directory that exists but is missing a file is still refused.
    pub fn load_dir_if_present(dir: &Path) -> Result<Option<Self>, ModelError> {
        if !dir.is_dir() {
            return Ok(None);
        }
        Self::load_dir(dir).map(Some)
    }

    /// Loads a model from its directory: `layers.yaml`, `components.yaml`, `decision-kinds.yaml`,
    /// `contracts.yaml` and `doors/*.yaml`. Doors are ordered by file name.
    pub fn load_dir(dir: &Path) -> Result<Self, ModelError> {
        let layers = read(&dir.join("layers.yaml"))?;
        let components = read(&dir.join("components.yaml"))?;
        let decision_kinds = read(&dir.join("decision-kinds.yaml"))?;
        let contracts = read(&dir.join("contracts.yaml"))?;
        let doors_dir = dir.join("doors");
        let entries = fs::read_dir(&doors_dir).map_err(|error| io_error(&doors_dir, &error))?;
        let mut files: Vec<PathBuf> = entries
            .filter_map(Result::ok)
            .map(|entry| entry.path())
            .filter(|path| path.extension().is_some_and(|ext| ext == "yaml"))
            .collect();
        files.sort();
        let mut doors = Vec::with_capacity(files.len());
        for file in files {
            let mut door: Door = read(&file)?;
            door.slug = file
                .file_stem()
                .map(|stem| stem.to_string_lossy().into_owned())
                .unwrap_or_default();
            doors.push(door);
        }
        Ok(Self {
            layers,
            components,
            decision_kinds,
            contracts,
            doors,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn write(dir: &Path, name: &str, text: &str) {
        let path = dir.join(name);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, text).unwrap();
    }

    fn valid_model(dir: &Path) {
        write(
            dir,
            "layers.yaml",
            r#"layers:
  - kernel
rules: []
domains: []
tierNames:
  "0": leaf
tierExceptions:
  - path: src/a.mjs
    tier: 2
    reason: moves down later
"#,
        );
        write(
            dir,
            "components.yaml",
            r#"- id: a
  canonical: a
  aliases: []
  meaning: m
  layer: kernel
  tier: 0
  paths: []
  owns: []
  mustNotOwn: []
  spec: s
  source: []
  status: live
"#,
        );
        write(dir, "decision-kinds.yaml", "[]\n");
        write(dir, "contracts.yaml", "[]\n");
        write(
            dir,
            "doors/one.yaml",
            r#"job: j
kind: door
patterns: []
allowed:
  - x
"#,
        );
    }

    fn scratch(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("fgos-ca-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn a_valid_model_loads_with_door_slugs_from_file_names() {
        let dir = scratch("valid");
        valid_model(&dir);
        let model = Model::load_dir(&dir).unwrap();
        assert_eq!(model.components.len(), 1);
        let exception = &model.layers.tier_exceptions[0];
        assert_eq!(exception.path, "src/a.mjs");
        assert_eq!(exception.tier, 2);
        assert_eq!(exception.reason, "moves down later");
        assert_eq!(model.doors[0].slug, "one");
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn a_comment_in_a_model_file_is_ignored() {
        let dir = scratch("comment");
        valid_model(&dir);
        write(
            &dir,
            "doors/one.yaml",
            r#"# the door that proves a note does not change the row
job: j  # inline notes too
kind: door
patterns: []
allowed:
  # a note between items
  - x
"#,
        );
        let model = Model::load_dir(&dir).unwrap();
        assert_eq!(model.doors[0].job, "j");
        match &model.doors[0].allowed[0] {
            DoorPath::Plain(path) => assert_eq!(path, "x"),
            DoorPath::Reasoned(other) => panic!("unexpected reasoned path {other:?}"),
        }
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn an_unknown_field_is_refused() {
        let dir = scratch("unknown");
        valid_model(&dir);
        write(
            &dir,
            "doors/one.yaml",
            "job: j\nkind: door\npatterns: []\nallowed: []\nsurprise: 1\n",
        );
        let error = Model::load_dir(&dir).unwrap_err();
        assert!(matches!(error, ModelError::Invalid { .. }), "{error}");
        assert!(error.to_string().contains("surprise"), "{error}");
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn an_unknown_field_inside_a_tier_exception_is_refused() {
        let dir = scratch("tier-exception-unknown");
        valid_model(&dir);
        write(
            &dir,
            "layers.yaml",
            r#"layers:
  - kernel
rules: []
domains: []
tierNames:
  "0": leaf
tierExceptions:
  - path: src/a.mjs
    tier: 2
    reason: moves down later
    surprise: 1
"#,
        );
        let error = Model::load_dir(&dir).unwrap_err();
        assert!(matches!(error, ModelError::Invalid { .. }), "{error}");
        assert!(error.to_string().contains("surprise"), "{error}");
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn a_yaml_refusal_keeps_the_file_and_the_doors_rule() {
        let dir = scratch("yaml-refusal");
        valid_model(&dir);
        write(&dir, "contracts.yaml", "id: [unclosed\n");
        let error = Model::load_dir(&dir).unwrap_err();
        let ModelError::Invalid { path, reason } = &error else {
            panic!("{error}");
        };
        assert!(path.ends_with("contracts.yaml"), "{error}");
        assert!(reason.contains("syntax-error"), "{error}");
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn a_missing_file_is_refused() {
        let dir = scratch("missing");
        valid_model(&dir);
        fs::remove_file(dir.join("contracts.yaml")).unwrap();
        let error = Model::load_dir(&dir).unwrap_err();
        assert!(matches!(error, ModelError::Missing(_)), "{error}");
        let _ = fs::remove_dir_all(&dir);
    }
}
