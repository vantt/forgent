//! The limits loader (spec §12, plan decision 4): the one production path
//! from configuration to the core's `Limits` and the hook's `HookLimits`.
//! The defaults are the limits contract embedded at build time; the
//! project's `.fgos/config.json` may override any of them in its `mailbox`
//! section, keyed by the contract's dotted names.
//!
//! A key the contract does not name is ignored and reported, as the Config
//! spec treats an unknown key. A value of the wrong type, or one the
//! limits' own types refuse, makes the whole section invalid and names the
//! key. A key whose reader is neither `core` nor `hook` (the live harness's)
//! is dropped before anything is deserialised. Range limits are not added:
//! a tracked config file has the trust of tracked code.
use crate::hook::HookLimits;
use crate::record::read_regular_capped;
use fgos_mailbox_core::Limits;
use serde_json::{Map, Value};
use std::collections::BTreeMap;
use std::path::Path;

const LIMITS_CONTRACT: &str = include_str!("../../../contracts/limits.v1.json");

/// The config section the mailbox reads.
const SECTION: &str = "mailbox";

/// The readers whose keys reach `Limits` and `HookLimits`.
const READERS: [&str; 2] = ["core", "hook"];

/// The loaded limits, and the `mailbox.*` keys of the project config that
/// the contract does not name (sorted), for the caller to report.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Loaded {
    pub limits: Limits,
    pub hook: HookLimits,
    pub ignored_keys: Vec<String>,
}

/// Why the limits could not be loaded; each names the offending key or
/// file.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LimitsError {
    /// The value at this key is not of its default's kind (an unsigned
    /// integer, or a list), or an object stands where a value belongs (or
    /// the reverse).
    WrongType(String),
    /// The limits' own types refused the value at this key.
    Rejected(String),
    /// The config file is not a readable regular JSON object within the
    /// read cap.
    Unreadable(String),
}

impl std::fmt::Display for LimitsError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::WrongType(key) => write!(f, "{key} has the wrong type"),
            Self::Rejected(key) => write!(f, "{key} has a value out of range"),
            Self::Unreadable(why) => write!(f, "the project config cannot be read: {why}"),
        }
    }
}

impl std::error::Error for LimitsError {}

/// The contract's keys a reader deserialises, with their defaults; the
/// harness's keys, which no section reads, apart.
struct Contract {
    defaults: BTreeMap<String, Value>,
    other_readers: Vec<String>,
}

fn contract() -> Result<Contract, LimitsError> {
    let doc: Value = serde_json::from_str(LIMITS_CONTRACT)
        .map_err(|e| LimitsError::Unreadable(format!("limits contract: {e}")))?;
    let mut defaults = BTreeMap::new();
    let mut other_readers = Vec::new();
    for entry in doc["keys"].as_array().into_iter().flatten() {
        let Some(key) = entry["key"].as_str() else {
            continue;
        };
        if READERS.iter().any(|r| entry["reader"] == *r) {
            defaults.insert(key.to_string(), entry["default"].clone());
        } else {
            other_readers.push(key.to_string());
        }
    }
    Ok(Contract {
        defaults,
        other_readers,
    })
}

/// The limits from the embedded contract, overlaid by `project_config`'s
/// `mailbox` section when given.
pub fn load(project_config: Option<&Value>) -> Result<Loaded, LimitsError> {
    let contract = contract()?;
    let mut values = contract.defaults.clone();
    let mut ignored_keys = Vec::new();
    let mut overridden = Vec::new();
    // An empty section (the one `fgos setup` registers) overrides nothing.
    if let Some(section) = project_config
        .and_then(|config| config.get(SECTION))
        .filter(|section| section.as_object().is_none_or(|map| !map.is_empty()))
    {
        let mut leaves = Vec::new();
        flatten(SECTION, section, &mut leaves);
        for (key, value) in leaves {
            if contract.other_readers.contains(&key) {
                continue;
            }
            // An object where the contract has a value.
            if let Some(owner) = contract
                .defaults
                .keys()
                .find(|k| key.starts_with(&format!("{k}.")))
            {
                return Err(LimitsError::WrongType(owner.clone()));
            }
            let is_prefix = contract
                .defaults
                .keys()
                .any(|k| k.starts_with(&format!("{key}.")));
            match (contract.defaults.contains_key(&key), is_prefix, value) {
                (true, _, value) if same_kind(&contract.defaults[&key], &value) => {
                    values.insert(key.clone(), value.clone());
                    overridden.push(key);
                }
                (true, _, _) | (false, true, _) => return Err(LimitsError::WrongType(key)),
                (false, false, _) => ignored_keys.push(key),
            }
        }
    }
    ignored_keys.sort();
    match parse(&values) {
        Ok((limits, hook)) => Ok(Loaded {
            limits,
            hook,
            ignored_keys,
        }),
        Err(()) => {
            // Name the key: the first override that alone is refused.
            let key = overridden
                .into_iter()
                .find(|key| {
                    let mut one = contract.defaults.clone();
                    one.insert(key.clone(), values[key].clone());
                    parse(&one).is_err()
                })
                .unwrap_or_else(|| SECTION.to_string());
            Err(LimitsError::Rejected(key))
        }
    }
}

/// Whether an override has the kind of its contract default: an unsigned
/// integer for a number, a list for a list (its items are checked when the
/// section is deserialised).
fn same_kind(default: &Value, value: &Value) -> bool {
    match default {
        Value::Array(_) => value.is_array(),
        _ => value.as_u64().is_some(),
    }
}

/// The leaves of `value` under the dotted `prefix`: a non-object (or an
/// empty object) is a leaf.
fn flatten(prefix: &str, value: &Value, out: &mut Vec<(String, Value)>) {
    match value {
        Value::Object(map) if !map.is_empty() => {
            for (name, child) in map {
                flatten(&format!("{prefix}.{name}"), child, out);
            }
        }
        other => out.push((prefix.to_string(), other.clone())),
    }
}

/// The nested section of the dotted `values`, deserialised.
fn parse(values: &BTreeMap<String, Value>) -> Result<(Limits, HookLimits), ()> {
    let mut section = Map::new();
    for (key, value) in values {
        let mut node = &mut section;
        let mut parts = key.split('.').skip(1).peekable();
        while let Some(part) = parts.next() {
            if parts.peek().is_none() {
                node.insert(part.to_string(), value.clone());
            } else {
                let next = node
                    .entry(part.to_string())
                    .or_insert_with(|| Value::Object(Map::new()));
                let Value::Object(map) = next else {
                    return Err(());
                };
                node = map;
            }
        }
    }
    let section = Value::Object(section);
    let limits = serde_json::from_value(section.clone()).map_err(|_| ())?;
    let hook = serde_json::from_value(section).map_err(|_| ())?;
    Ok((limits, hook))
}

/// `<fgos_dir>/config.json` as a JSON object, read without following a
/// symlink, as a regular file of at most `max_bytes`; `None` when it does
/// not exist.
pub fn read_project_config(fgos_dir: &Path, max_bytes: u64) -> Result<Option<Value>, LimitsError> {
    let path = fgos_dir.join("config.json");
    let bytes = match read_regular_capped(&path, max_bytes) {
        Ok(bytes) => bytes,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(e) => return Err(LimitsError::Unreadable(e.to_string())),
    };
    match serde_json::from_slice(&bytes) {
        Ok(value @ Value::Object(_)) => Ok(Some(value)),
        Ok(_) => Err(LimitsError::Unreadable("not a JSON object".to_string())),
        Err(e) => Err(LimitsError::Unreadable(e.to_string())),
    }
}
