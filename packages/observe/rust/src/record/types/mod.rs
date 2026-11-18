//! The v2 record envelope. It only grows by addition: unknown fields are ignored on read.

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

/// Envelope version. Changes only on a breaking change.
pub const RECORD_VERSION: u32 = 2;

/// Cap on `detail`, in bytes.
pub const DETAIL_MAX_BYTES: usize = 2048;

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct SubjectRef {
    pub kind: String,
    pub id: String,
}

/// An attr value: a dimension to filter and group by.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum AttrValue {
    Bool(bool),
    Int(i64),
    Str(String),
}

impl AttrValue {
    pub fn value_type(&self) -> ValueType {
        match self {
            AttrValue::Bool(_) => ValueType::Bool,
            AttrValue::Int(_) => ValueType::Int,
            AttrValue::Str(_) => ValueType::String,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ValueType {
    String,
    Bool,
    Int,
}

impl ValueType {
    pub fn as_str(self) -> &'static str {
        match self {
            ValueType::String => "string",
            ValueType::Bool => "bool",
            ValueType::Int => "int",
        }
    }
}

/// How a record is known.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Basis {
    Observed,
    Reported,
    Transcript,
    Owner,
    Derived,
}

#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct Origin {
    pub source: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub component: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub writer: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub host: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub release: Option<String>,
    #[serde(default, rename = "configRev", skip_serializing_if = "Option::is_none")]
    pub config_rev: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub project: Option<String>,
}

/// Which redaction rules were applied to `detail`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Redaction {
    pub rev: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Record {
    pub v: u32,
    pub id: String,
    pub kind: String,
    pub ts: String,
    #[serde(default, rename = "endTs", skip_serializing_if = "Option::is_none")]
    pub end_ts: Option<String>,
    pub subject: SubjectRef,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub refs: Vec<SubjectRef>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub attrs: BTreeMap<String, AttrValue>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    /// JSON numbers, so a whole count stays a whole count and a non-finite value cannot be represented.
    pub measures: BTreeMap<String, serde_json::Number>,
    pub basis: Basis,
    pub origin: Origin,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub redaction: Option<Redaction>,
}
