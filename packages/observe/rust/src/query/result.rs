use serde::{Serialize, Serializer};
use std::collections::BTreeMap;

use super::time::format_instant;

/// An aggregate value. An instant renders as RFC 3339; both compare as a number.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum AggValue {
    Number(f64),
    /// Unix milliseconds.
    Instant(i64),
}

impl AggValue {
    pub fn as_f64(self) -> f64 {
        match self {
            AggValue::Number(n) => n,
            AggValue::Instant(ms) => ms as f64,
        }
    }
}

impl Serialize for AggValue {
    fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        match *self {
            AggValue::Instant(ms) => s.serialize_str(&format_instant(ms)),
            AggValue::Number(n) if n.fract() == 0.0 && n.abs() < 9.0e15 => {
                s.serialize_i64(n as i64)
            }
            AggValue::Number(n) => s.serialize_f64(n),
        }
    }
}

/// One group. `aggs` holds `null` for an aggregate with no input, and for every aggregate when `insufficient`.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct ResultRow {
    pub group: BTreeMap<String, String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bucket: Option<String>,
    pub count: usize,
    pub insufficient: bool,
    pub aggs: BTreeMap<String, Option<AggValue>>,
}

/// How much of the matched input the grouping could use.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
pub struct Coverage {
    /// Records that passed every filter and join.
    pub matched: usize,
    /// For each grouped attr, the records that lacked it and so sit in no group.
    pub missing: BTreeMap<String, usize>,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize)]
pub struct QueryResult {
    pub rows: Vec<ResultRow>,
    pub coverage: Coverage,
    /// Records skipped because their `ts` or `endTs` is not a valid instant.
    pub skipped: usize,
    /// Why no answer exists: a needed kind is undeclared, has no source, or its source failed.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unmeasured: Option<String>,
}
