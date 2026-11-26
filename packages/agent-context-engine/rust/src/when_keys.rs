//! The registry of `when:` keys (`contracts/when-keys.v2.json`) and the check of a unit's `when:` against it. ACE owns
//! the keys; the values of a live key come from the caller through [`ValueSource`], and ACE never owns that data.

use std::sync::OnceLock;

use serde_json::Value;

use crate::refusal::{Refusal, RefusalCode};
use crate::rule::When;

const REGISTRY: &str = include_str!("../../contracts/when-keys.v2.json");

/// Where the allowed values of a key come from.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum KeySource {
    /// A fixed list the registry holds.
    Static(Vec<String>),
    /// Live data named by a sentence; the caller supplies the values.
    Live(String),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WhenKey {
    pub key: String,
    pub value_type: String,
    pub source: KeySource,
    pub description: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WhenKeys {
    /// The version a compiled set records and a reader checks.
    pub version: u32,
    pub keys: Vec<WhenKey>,
}

impl WhenKeys {
    pub fn get(&self, key: &str) -> Option<&WhenKey> {
        self.keys.iter().find(|k| k.key == key)
    }
}

/// The live values of a `when:` key. `None` means the caller has no list for the key, and its values go unchecked.
pub trait ValueSource {
    fn values(&self, key: &str) -> Option<Vec<String>>;
}

/// A source with no live data: only the static keys are checked.
pub struct NoLiveValues;

impl ValueSource for NoLiveValues {
    fn values(&self, _key: &str) -> Option<Vec<String>> {
        None
    }
}

fn text(v: &Value, field: &str) -> String {
    v.get(field)
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string()
}

fn parse(raw: &str) -> WhenKeys {
    let doc: Value = serde_json::from_str(raw).expect("when-keys.v2.json is valid JSON");
    let version = doc
        .get("version")
        .and_then(Value::as_u64)
        .and_then(|v| u32::try_from(v).ok())
        .expect("when-keys.v2.json carries a version");
    let keys = doc
        .get("keys")
        .and_then(Value::as_array)
        .expect("when-keys.v2.json lists keys")
        .iter()
        .map(|k| {
            let source = k.get("valueSource").expect("a key names its value source");
            let source = match source.get("type").and_then(Value::as_str) {
                Some("static") => KeySource::Static(
                    source
                        .get("values")
                        .and_then(Value::as_array)
                        .expect("a static source lists values")
                        .iter()
                        .filter_map(|v| v.as_str().map(str::to_string))
                        .collect(),
                ),
                _ => KeySource::Live(text(source, "source")),
            };
            WhenKey {
                key: text(k, "key"),
                value_type: text(k, "valueType"),
                source,
                description: text(k, "description"),
            }
        })
        .collect();
    WhenKeys { version, keys }
}

/// The registry this build carries, read once.
pub fn registry() -> &'static WhenKeys {
    static KEYS: OnceLock<WhenKeys> = OnceLock::new();
    KEYS.get_or_init(|| parse(REGISTRY))
}

/// Checks the `when:` of rule `id`: every key is in the registry and every value is allowed by the key's source.
pub fn check_when(id: &str, when: &When, live: &dyn ValueSource) -> Result<(), Refusal> {
    let keys = registry();
    for (key, values) in when {
        let Some(entry) = keys.get(key) else {
            return Err(Refusal::new(
                RefusalCode::WhenKeyUnknown,
                format!("when key \"{key}\" is not in the registry"),
            )
            .with_ids([id]));
        };
        if values.is_empty() {
            return Err(Refusal::new(
                RefusalCode::WhenValueInvalid,
                format!("when.{key} lists no value; leave the key out to mean always"),
            )
            .with_ids([id]));
        }
        let allowed = match &entry.source {
            KeySource::Static(list) => Some(list.clone()),
            KeySource::Live(_) => live.values(key),
        };
        let Some(allowed) = allowed else { continue };
        if let Some(bad) = values.iter().find(|v| !allowed.contains(v)) {
            return Err(Refusal::new(
                RefusalCode::WhenValueInvalid,
                format!("when.{key} value \"{bad}\" is not allowed by the key's value source"),
            )
            .with_ids([id]));
        }
    }
    Ok(())
}
