//! Loads every model file into typed rows that follow `contracts/model.v1.json`. A field the schema does not
//! name is refused, and so is a missing file.

use serde::Deserialize;
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

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Exception {
    pub path: String,
    #[serde(default)]
    pub layer: Option<String>,
    #[serde(default)]
    pub tier: Option<i64>,
    pub reason: String,
}

/// One named exception to the tier downward rule, as `layers.json` `tierExceptions` carries it.
#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TierException {
    pub path: String,
    pub tier: i64,
    pub reason: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Component {
    pub id: String,
    pub canonical: String,
    pub aliases: Vec<String>,
    pub meaning: String,
    #[serde(default)]
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
    #[serde(default)]
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DecisionKind {
    pub id: String,
    pub canonical: String,
    pub aliases: Vec<String>,
    pub meaning: String,
    pub owner: String,
    pub narrative: String,
    #[serde(default, rename = "readFirst")]
    pub read_first: Option<String>,
    #[serde(default)]
    pub facts: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
pub enum DoorPath {
    Plain(String),
    Reasoned(DoorPathReason),
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DoorPathReason {
    pub path: String,
    #[serde(default)]
    pub reason: Option<String>,
}

/// One door row. A door has no id of its own: `slug` is its file name without `.json`.
#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Door {
    #[serde(skip)]
    pub slug: String,
    pub job: String,
    pub kind: String,
    pub patterns: Vec<String>,
    pub allowed: Vec<DoorPath>,
    #[serde(default)]
    pub debt: Vec<DoorPath>,
    #[serde(default)]
    pub reason: Option<String>,
    #[serde(default, rename = "retiredBy")]
    pub retired_by: Option<String>,
    #[serde(default)]
    pub owner: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Contract {
    pub id: String,
    pub canonical: String,
    pub aliases: Vec<String>,
    pub meaning: String,
    #[serde(default)]
    pub reason: Option<String>,
    pub provider: String,
    pub consumers: Vec<String>,
    #[serde(default)]
    pub guards: Option<serde_json::Value>,
    #[serde(default)]
    pub version: Option<serde_json::Value>,
    #[serde(default)]
    pub path: Option<String>,
    pub evidence: Vec<String>,
    pub status: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Layers {
    #[serde(default)]
    pub contract: Option<String>,
    pub layers: Vec<String>,
    pub rules: Vec<String>,
    pub domains: Vec<String>,
    #[serde(rename = "tierNames")]
    pub tier_names: BTreeMap<String, String>,
    #[serde(default, rename = "tierExceptions")]
    pub tier_exceptions: Vec<TierException>,
}

#[derive(Debug, Clone)]
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

fn read<T: for<'de> Deserialize<'de>>(path: &Path) -> Result<T, ModelError> {
    let text = fs::read_to_string(path).map_err(|error| io_error(path, &error))?;
    serde_json::from_str(&text).map_err(|error| ModelError::Invalid {
        path: path.to_path_buf(),
        reason: error.to_string(),
    })
}

impl Model {
    /// Loads the model of the repository rooted at `root`.
    pub fn load(root: &Path) -> Result<Self, ModelError> {
        Self::load_dir(&root.join(MODEL_DIR))
    }

    /// Loads a model from its directory: `layers.json`, `components.json`, `decision-kinds.json`,
    /// `contracts.json` and `doors/*.json`. Doors are ordered by file name.
    pub fn load_dir(dir: &Path) -> Result<Self, ModelError> {
        let layers = read(&dir.join("layers.json"))?;
        let components = read(&dir.join("components.json"))?;
        let decision_kinds = read(&dir.join("decision-kinds.json"))?;
        let contracts = read(&dir.join("contracts.json"))?;
        let doors_dir = dir.join("doors");
        let entries = fs::read_dir(&doors_dir).map_err(|error| io_error(&doors_dir, &error))?;
        let mut files: Vec<PathBuf> = entries
            .filter_map(Result::ok)
            .map(|entry| entry.path())
            .filter(|path| path.extension().is_some_and(|ext| ext == "json"))
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
            "layers.json",
            r#"{"layers":["kernel"],"rules":[],"domains":[],"tierNames":{"0":"leaf"},"tierExceptions":[{"path":"src/a.mjs","tier":2,"reason":"moves down later"}]}"#,
        );
        write(
            dir,
            "components.json",
            r#"[{"id":"a","canonical":"a","aliases":[],"meaning":"m","layer":"kernel","tier":0,"paths":[],"owns":[],"mustNotOwn":[],"spec":"s","source":[],"status":"live"}]"#,
        );
        write(dir, "decision-kinds.json", "[]");
        write(dir, "contracts.json", "[]");
        write(
            dir,
            "doors/one.json",
            r#"{"job":"j","kind":"door","patterns":[],"allowed":["x"]}"#,
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
    fn an_unknown_field_is_refused() {
        let dir = scratch("unknown");
        valid_model(&dir);
        write(
            &dir,
            "doors/one.json",
            r#"{"job":"j","kind":"door","patterns":[],"allowed":[],"surprise":1}"#,
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
            "layers.json",
            r#"{"layers":["kernel"],"rules":[],"domains":[],"tierNames":{"0":"leaf"},"tierExceptions":[{"path":"src/a.mjs","tier":2,"reason":"moves down later","surprise":1}]}"#,
        );
        let error = Model::load_dir(&dir).unwrap_err();
        assert!(matches!(error, ModelError::Invalid { .. }), "{error}");
        assert!(error.to_string().contains("surprise"), "{error}");
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn a_missing_file_is_refused() {
        let dir = scratch("missing");
        valid_model(&dir);
        fs::remove_file(dir.join("contracts.json")).unwrap();
        let error = Model::load_dir(&dir).unwrap_err();
        assert!(matches!(error, ModelError::Missing(_)), "{error}");
        let _ = fs::remove_dir_all(&dir);
    }
}
