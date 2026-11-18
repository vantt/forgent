//! The query model. Every part has a plain-text form so the CLI and a definition file use the same words.

use super::error::{invalid, QueryError};
use serde::{Deserialize, Serialize};
use std::fmt;
use std::str::FromStr;

/// A time bucket in UTC. `hour` and `day` start on the hour and at midnight; `week` starts on Monday 00:00 UTC
/// (ISO weeks). A group's `bucket` is the start instant of its bucket.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Bucket {
    Hour,
    Day,
    Week,
}

/// Which instant `since` and `until` compare: the start `ts`, or the end (`endTs`, falling back to `ts`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum WindowOn {
    #[default]
    Ts,
    End,
}

/// `ref <kind>:<id>`: a record matches when its subject or one of its refs is this.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(try_from = "String", into = "String")]
pub struct RefSel {
    pub kind: String,
    pub id: String,
}

impl FromStr for RefSel {
    type Err = QueryError;
    fn from_str(s: &str) -> Result<Self, QueryError> {
        match s.split_once(':') {
            Some((kind, id)) if !kind.is_empty() && !id.is_empty() => Ok(Self {
                kind: kind.to_owned(),
                id: id.to_owned(),
            }),
            _ => Err(invalid("ref", s, "expected <kind>:<id>")),
        }
    }
}

impl fmt::Display for RefSel {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}:{}", self.kind, self.id)
    }
}

impl From<RefSel> for String {
    fn from(r: RefSel) -> String {
        r.to_string()
    }
}

impl TryFrom<String> for RefSel {
    type Error = QueryError;
    fn try_from(s: String) -> Result<Self, QueryError> {
        s.parse()
    }
}

/// `latest-per`: keep the newest record per subject, or per the ref of one kind.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(try_from = "String", into = "String")]
pub enum LatestPer {
    Subject,
    Ref(String),
}

impl FromStr for LatestPer {
    type Err = QueryError;
    fn from_str(s: &str) -> Result<Self, QueryError> {
        match s {
            "subject" => Ok(Self::Subject),
            _ => match s.strip_prefix("ref:") {
                Some(kind) if !kind.is_empty() => Ok(Self::Ref(kind.to_owned())),
                _ => Err(invalid("latest-per", s, "expected subject or ref:<kind>")),
            },
        }
    }
}

impl fmt::Display for LatestPer {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            LatestPer::Subject => f.write_str("subject"),
            LatestPer::Ref(kind) => write!(f, "ref:{kind}"),
        }
    }
}

impl From<LatestPer> for String {
    fn from(l: LatestPer) -> String {
        l.to_string()
    }
}

impl TryFrom<String> for LatestPer {
    type Error = QueryError;
    fn try_from(s: String) -> Result<Self, QueryError> {
        s.parse()
    }
}

/// An aggregate: `count`, `sum|avg|min|max|p50|p90:<measure>`, `max:ts` (the newest start), `min:ts` (the earliest
/// start), `max:end` (the latest end, `endTs` falling back to `ts`), `age:ts` (seconds since the newest record) or
/// `span` (seconds from the earliest start to the latest end). `max:ts`, `min:ts` and `max:end` are instants and
/// render as RFC 3339.
///
/// `p50` and `p90` are nearest-rank percentiles: the value at rank `ceil(p × n)` of the group's sorted values, so the
/// result is always one of the inputs. A record without the measure is left out; a group with no value gives `null`.
/// `sum` over a joined measure (`<alias>.m`, `<alias>.count`) counts each joined record once per group, however
/// many records of the group it joined; the other functions read the per-record joined sums.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(try_from = "String", into = "String")]
pub enum Agg {
    Count,
    Measure { func: String, measure: String },
    MaxTs,
    MinTs,
    MaxEnd,
    AgeTs,
    Span,
}

impl FromStr for Agg {
    type Err = QueryError;
    fn from_str(s: &str) -> Result<Self, QueryError> {
        match s {
            "count" => return Ok(Self::Count),
            "span" => return Ok(Self::Span),
            "max:ts" => return Ok(Self::MaxTs),
            "min:ts" => return Ok(Self::MinTs),
            "max:end" => return Ok(Self::MaxEnd),
            "age:ts" => return Ok(Self::AgeTs),
            _ => {}
        }
        match s.split_once(':') {
            Some((func @ ("sum" | "avg" | "min" | "max" | "p50" | "p90"), measure))
                if !measure.is_empty() =>
            {
                Ok(Self::Measure {
                    func: func.to_owned(),
                    measure: measure.to_owned(),
                })
            }
            _ => Err(invalid(
                "agg",
                s,
                "expected count, span, max:ts, min:ts, max:end, age:ts or sum|avg|min|max|p50|p90:<measure>",
            )),
        }
    }
}

impl TryFrom<String> for Agg {
    type Error = QueryError;
    fn try_from(s: String) -> Result<Self, QueryError> {
        s.parse()
    }
}

impl From<Agg> for String {
    fn from(a: Agg) -> String {
        a.to_string()
    }
}

impl fmt::Display for Agg {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Agg::Count => f.write_str("count"),
            Agg::Span => f.write_str("span"),
            Agg::MaxTs => f.write_str("max:ts"),
            Agg::MinTs => f.write_str("min:ts"),
            Agg::MaxEnd => f.write_str("max:end"),
            Agg::AgeTs => f.write_str("age:ts"),
            Agg::Measure { func, measure } => write!(f, "{func}:{measure}"),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Op {
    Eq,
    Ne,
    In,
    Exists,
    Lt,
    Gt,
    Prefix,
}

/// A record filter. `field` is an attr, a measure, a joined measure, or a record field: `subject.kind`, `subject.id`,
/// `basis`, `origin.source|component|writer|host|release|project`.
///
/// `ne` also matches a record that lacks the field; `eq`, `in`, `lt`, `gt` and `prefix` do not. `in` takes an array;
/// `exists` takes `true` (default) or `false`; `prefix` takes a string and matches a string field that starts with it
/// (a non-string field never matches).
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Cond {
    pub field: String,
    pub op: Op,
    #[serde(default)]
    pub value: Option<serde_json::Value>,
}

/// One entry of a condition list (`where`, `where_latest`, `without.where`): a condition, or `{"any": [[...], ...]}`,
/// which holds when every entry of at least one branch holds. A branch is itself a condition list, so `any` nests.
/// An `any` with no branch, or a branch with no entry, is refused when the query runs.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(untagged)]
pub enum Filter {
    Cond(Cond),
    Any { any: Vec<Vec<Filter>> },
}

impl From<Cond> for Filter {
    fn from(c: Cond) -> Self {
        Filter::Cond(c)
    }
}

impl<'de> Deserialize<'de> for Filter {
    /// An object whose only key is `any` is a group; any other object is read as a condition, so a malformed
    /// condition reports its own field error instead of an untagged mismatch.
    fn deserialize<D: serde::Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        use serde::de::Error;
        let value = serde_json::Value::deserialize(d)?;
        match value.as_object() {
            Some(map) if map.contains_key("any") => {
                if map.len() != 1 {
                    return Err(D::Error::custom("an any group takes no key but any"));
                }
                serde_json::from_value(map["any"].clone())
                    .map(|any| Filter::Any { any })
                    .map_err(D::Error::custom)
            }
            _ => serde_json::from_value(value)
                .map(Filter::Cond)
                .map_err(D::Error::custom),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Cmp {
    Lt,
    Le,
    Gt,
    Ge,
    Eq,
    Ne,
}

/// The factor `k` of an operand: a number, or `{"param": "<name>"}` filled by the caller like `Operand::Param`.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(untagged)]
pub enum Factor {
    Number(f64),
    Param { param: String },
}

impl<'de> Deserialize<'de> for Factor {
    fn deserialize<D: serde::Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        use serde::de::Error;
        #[derive(Deserialize)]
        #[serde(deny_unknown_fields)]
        struct ParamRef {
            param: String,
        }
        let value = serde_json::Value::deserialize(d)?;
        if let Some(n) = value.as_f64() {
            return Ok(Factor::Number(n));
        }
        serde_json::from_value::<ParamRef>(value)
            .map(|p| Factor::Param { param: p.param })
            .map_err(|e| {
                D::Error::custom(format!("k is a number or {{\"param\": \"<name>\"}}: {e}"))
            })
    }
}

fn one() -> Factor {
    Factor::Number(1.0)
}

/// One side of a group filter. `Agg` and `Latest` take a factor `k`, so `k × another aggregate or measure` is one
/// operand. `Latest` reads a measure off the newest record of the group.
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Operand {
    Const(f64),
    /// Filled by the caller.
    Param(String),
    Agg {
        agg: Agg,
        #[serde(default = "one")]
        k: Factor,
    },
    Latest {
        measure: String,
        #[serde(default = "one")]
        k: Factor,
    },
}

/// A group filter: the group stays when `lhs op rhs` holds. An operand with no value (no input) fails the test.
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Having {
    pub lhs: Operand,
    pub op: Cmp,
    pub rhs: Operand,
}

fn join_alias() -> String {
    "join".to_owned()
}

/// Pulls measures of records of `kind` that share a `ref <on>:<id>` with the record. A joined measure `m` is the sum
/// over the matched records, readable as `<alias>.m` (default `join.m`); `<alias>.count` is how many matched.
///
/// On both sides, the ids of kind `on` are the refs of that kind plus the subject when the subject is of kind `on`;
/// a subject of another kind never stands in for a ref. Joined names exist only after the join, so `where`,
/// `where_latest` and `without.where` refuse them; filter on them with `having` or group by them.
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Join {
    pub kind: Vec<String>,
    pub on: String,
    #[serde(default = "join_alias", rename = "as")]
    pub alias: String,
    /// Count only joined records inside the record's own span (`ts` to `endTs`).
    #[serde(default)]
    pub within_span: bool,
}

/// What `within` is measured from.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Anchor {
    /// The look-back window ends now.
    #[default]
    Now,
    /// The window runs from `within` before the record's `ts` to its end.
    Record,
    /// The window runs from just after the record's `ts` to `now`, capped at `within` after `ts`: a matching record
    /// that follows drops it.
    After,
}

/// An anti-join: drop a record when a record of `kind` matches `where`, shares `ref <on>:<id>` (when `on` is set),
/// and falls inside the `within` window.
///
/// With `latest`, only the newest record of `kind` (sharing the ref, when `on` is set) from `within` before the
/// record's `ts` up to that `ts` is looked at, and the record is dropped when that one matches `where`. It reads the
/// state in force at the record, so it takes `anchor: record` only; `now` and `after` are refused. The latest window is
/// `[ts - within, ts]`, both ends included, so it holds the record itself when the record is of a `kind` here.
/// Records at the same instant are ordered by id: the one with the largest id is the newest.
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Without {
    pub kind: Vec<String>,
    #[serde(default, rename = "where")]
    pub where_: Vec<Filter>,
    #[serde(default)]
    pub on: Option<String>,
    pub within: String,
    #[serde(default)]
    pub anchor: Anchor,
    #[serde(default)]
    pub latest: bool,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields, default)]
pub struct Query {
    pub kind: Vec<String>,
    #[serde(rename = "where")]
    pub where_: Vec<Filter>,
    pub where_latest: Vec<Filter>,
    #[serde(rename = "ref")]
    pub refs: Vec<RefSel>,
    pub since: Option<String>,
    pub until: Option<String>,
    pub window_on: WindowOn,
    /// Attrs or record fields to group by, or `ref:<kind>` to group by the id of the record's ref of that kind.
    pub by: Vec<String>,
    pub bucket: Option<Bucket>,
    pub latest_per: Option<LatestPer>,
    pub agg: Vec<Agg>,
    pub having: Vec<Having>,
    pub join: Vec<Join>,
    pub without: Vec<Without>,
    /// A group with fewer records is reported `insufficient`: it carries no aggregate values and `having` is not
    /// evaluated for it, so it never counts as passing a group filter. Callers must not read it as a match.
    pub min_sample: usize,
}
