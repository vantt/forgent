//! The declaration file format shared by `observe-names.json` and every `observe-kinds` declaration.

use super::merge::RegistryError;
use super::AGGREGATIONS;
use crate::record::types::ValueType;
use serde::Deserialize;
use std::collections::{BTreeMap, BTreeSet};

/// The shared names Observe owns, embedded so an installed host needs no `packages/` tree.
pub const EMBEDDED_NAMES: &str = include_str!("../../../../contracts/observe-names.json");

const NAMES_CONTRACT: &str = "observe-names.v1";
const KINDS_CONTRACT: &str = "observe-kinds.v1";

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AttrDef {
    #[serde(rename = "type")]
    pub value_type: ValueType,
    /// Closed value set; string attrs only. Empty means open.
    #[serde(default)]
    pub values: BTreeSet<String>,
    #[serde(default)]
    pub aliases: BTreeSet<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MeasureDef {
    pub unit: String,
    /// Aggregations valid on this measure.
    pub aggs: BTreeSet<String>,
    #[serde(default)]
    pub aliases: BTreeSet<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct KindDef {
    /// Subject kinds a record of this kind may have.
    pub subjects: BTreeSet<String>,
    #[serde(default)]
    pub attrs: BTreeSet<String>,
    #[serde(default)]
    pub measures: BTreeSet<String>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(deny_unknown_fields)]
struct RawDeclaration {
    contract: String,
    #[serde(default)]
    #[allow(dead_code)]
    conventions: serde_json::Value,
    #[serde(default, rename = "subjectKinds")]
    subject_kinds: BTreeSet<String>,
    #[serde(default)]
    attrs: BTreeMap<String, AttrDef>,
    #[serde(default)]
    measures: BTreeMap<String, MeasureDef>,
    #[serde(default)]
    kinds: BTreeMap<String, KindDef>,
}

/// Where a declaration came from, named in every collision.
#[derive(Debug, Clone)]
pub struct DeclarationSource {
    pub origin: String,
    pub text: String,
}

#[derive(Debug, Clone)]
pub struct Declaration {
    pub origin: String,
    pub subject_kinds: BTreeSet<String>,
    pub attrs: BTreeMap<String, AttrDef>,
    pub measures: BTreeMap<String, MeasureDef>,
    pub kinds: BTreeMap<String, KindDef>,
}

impl Declaration {
    pub fn parse(origin: &str, text: &str) -> Result<Self, RegistryError> {
        let parse_err = |message: String| RegistryError::Parse {
            origin: origin.to_owned(),
            message,
        };
        let raw: RawDeclaration =
            serde_json::from_str(text).map_err(|e| parse_err(e.to_string()))?;
        if raw.contract != NAMES_CONTRACT && raw.contract != KINDS_CONTRACT {
            return Err(parse_err(format!(
                "unknown contract '{}'; expected '{NAMES_CONTRACT}' or '{KINDS_CONTRACT}'",
                raw.contract
            )));
        }
        for name in raw.kinds.keys() {
            if name.split('.').any(str::is_empty) {
                return Err(parse_err(format!(
                    "kind name '{name}' must be dot-separated non-empty segments"
                )));
            }
        }
        for (name, def) in &raw.attrs {
            if def.value_type != ValueType::String && !def.values.is_empty() {
                return Err(parse_err(format!(
                    "attr '{name}' is {} and cannot have a closed value set",
                    def.value_type.as_str()
                )));
            }
        }
        for (name, def) in &raw.measures {
            if def.aggs.is_empty() {
                return Err(parse_err(format!(
                    "measure '{name}' declares no aggregation"
                )));
            }
            if let Some(bad) = def
                .aggs
                .iter()
                .find(|a| !AGGREGATIONS.contains(&a.as_str()))
            {
                return Err(parse_err(format!(
                    "measure '{name}' declares unknown aggregation '{bad}'"
                )));
            }
        }
        Ok(Self {
            origin: origin.to_owned(),
            subject_kinds: raw.subject_kinds,
            attrs: raw.attrs,
            measures: raw.measures,
            kinds: raw.kinds,
        })
    }
}
