//! A record under query, field lookup, filter tests and aggregate arithmetic.

use super::model::{Agg, Cmp, Cond, Op};
use super::result::AggValue;
use crate::record::types::{AttrValue, Record};
use serde_json::Value;
use std::collections::BTreeMap;

/// A record with its parsed instants and, per join alias, the records that join matched.
pub(super) struct Item<'a> {
    pub rec: &'a Record,
    pub ts: i64,
    pub end: i64,
    pub links: BTreeMap<String, Vec<&'a Record>>,
}

impl Item<'_> {
    /// Does the record, or a ref of it, carry `kind:id`?
    pub fn has_ref(&self, kind: &str, id: &str) -> bool {
        (self.rec.subject.kind == kind && self.rec.subject.id == id)
            || self.rec.refs.iter().any(|r| r.kind == kind && r.id == id)
    }

    /// Every id the record carries for `kind`: its subject first when the subject is of that kind, then its refs.
    pub fn ref_ids<'s>(&'s self, kind: &'s str) -> impl Iterator<Item = &'s str> + 's {
        std::iter::once(&self.rec.subject)
            .chain(self.rec.refs.iter())
            .filter(move |r| r.kind == kind)
            .map(|r| r.id.as_str())
    }
}

pub(super) enum Val {
    Str(String),
    Num(f64),
    Bool(bool),
}

impl Val {
    pub fn render(&self) -> String {
        match self {
            Val::Str(s) => s.clone(),
            Val::Bool(b) => b.to_string(),
            Val::Num(n) if n.fract() == 0.0 && n.abs() < 9.0e15 => (*n as i64).to_string(),
            Val::Num(n) => n.to_string(),
        }
    }
}

pub(super) const RECORD_FIELDS: &[&str] = &[
    "subject.kind",
    "subject.id",
    "basis",
    "origin.source",
    "origin.component",
    "origin.writer",
    "origin.host",
    "origin.release",
    "origin.project",
];

/// The value of `name` (already canonical) on the item.
pub(super) fn field(item: &Item, name: &str) -> Option<Val> {
    let r = item.rec;
    let opt = |v: &Option<String>| v.clone().map(Val::Str);
    match name {
        "subject.kind" => return Some(Val::Str(r.subject.kind.clone())),
        "subject.id" => return Some(Val::Str(r.subject.id.clone())),
        "basis" => {
            return serde_json::to_value(r.basis)
                .ok()
                .and_then(|v| v.as_str().map(|s| Val::Str(s.to_owned())))
        }
        "origin.source" => return Some(Val::Str(r.origin.source.clone())),
        "origin.component" => return opt(&r.origin.component),
        "origin.writer" => return opt(&r.origin.writer),
        "origin.host" => return opt(&r.origin.host),
        "origin.release" => return opt(&r.origin.release),
        "origin.project" => return opt(&r.origin.project),
        _ => {}
    }
    if let Some(value) = r.attrs.get(name) {
        return Some(match value {
            AttrValue::Bool(b) => Val::Bool(*b),
            AttrValue::Int(i) => Val::Num(*i as f64),
            AttrValue::Str(s) => Val::Str(s.clone()),
        });
    }
    number(item, name).map(Val::Num)
}

/// The join alias and the joined measure (or `count`) a name like `join.m` reads, when one of the item's joins owns it.
fn joined_name<'n>(item: &Item, name: &'n str) -> Option<(&'n str, &'n str)> {
    item.links.keys().find_map(|alias| {
        let rest = name.strip_prefix(alias.as_str())?.strip_prefix('.')?;
        Some((&name[..alias.len()], rest))
    })
}

/// `count` of the linked records, or the sum of `measure` over those that carry it (`None` when none does).
fn linked_value<'r>(recs: impl Iterator<Item = &'r Record>, measure: &str) -> Option<f64> {
    if measure == "count" {
        return Some(recs.count() as f64);
    }
    recs.filter_map(|r| r.measures.get(measure).and_then(serde_json::Number::as_f64))
        .fold(None, |acc, v| Some(acc.unwrap_or(0.0) + v))
}

/// A measure of the record, or a joined measure: the sum over the records its join matched.
pub(super) fn number(item: &Item, name: &str) -> Option<f64> {
    if let Some(v) = item
        .rec
        .measures
        .get(name)
        .and_then(serde_json::Number::as_f64)
    {
        return Some(v);
    }
    let (alias, measure) = joined_name(item, name)?;
    linked_value(item.links[alias].iter().copied(), measure)
}

/// `sum` of a joined measure over a group: each joined record counts once, however many items of the group it joined.
fn joined_group_sum(items: &[Item], name: &str) -> Option<Option<f64>> {
    let (alias, measure) = joined_name(items.first()?, name)?;
    let distinct: BTreeMap<&str, &Record> = items
        .iter()
        .flat_map(|i| i.links.get(alias).into_iter().flatten())
        .map(|r| (r.id.as_str(), *r))
        .collect();
    Some(linked_value(distinct.into_values(), measure))
}

fn equals(val: &Val, wanted: &Value) -> bool {
    match (val, wanted) {
        (Val::Str(a), Value::String(b)) => a == b,
        (Val::Num(a), Value::Number(b)) => b.as_f64().is_some_and(|b| (a - b).abs() < f64::EPSILON),
        (Val::Bool(a), Value::Bool(b)) => a == b,
        _ => false,
    }
}

pub(super) fn cond_matches(item: &Item, cond: &Cond, field_name: &str) -> bool {
    let val = field(item, field_name);
    let wanted = cond.value.as_ref();
    match cond.op {
        Op::Exists => val.is_some() == wanted.and_then(Value::as_bool).unwrap_or(true),
        Op::Eq => matches!((&val, wanted), (Some(v), Some(w)) if equals(v, w)),
        Op::Ne => match (&val, wanted) {
            (Some(v), Some(w)) => !equals(v, w),
            _ => true,
        },
        Op::In => match (&val, wanted.and_then(Value::as_array)) {
            (Some(v), Some(list)) => list.iter().any(|w| equals(v, w)),
            _ => false,
        },
        Op::Prefix => matches!(
            (&val, wanted.and_then(Value::as_str)),
            (Some(Val::Str(v)), Some(p)) if v.starts_with(p)
        ),
        Op::Lt | Op::Gt => match (val, wanted.and_then(Value::as_f64)) {
            (Some(Val::Num(a)), Some(b)) => {
                if cond.op == Op::Lt {
                    a < b
                } else {
                    a > b
                }
            }
            _ => false,
        },
    }
}

pub(super) fn compare(a: f64, op: Cmp, b: f64) -> bool {
    match op {
        Cmp::Lt => a < b,
        Cmp::Le => a <= b,
        Cmp::Gt => a > b,
        Cmp::Ge => a >= b,
        Cmp::Eq => (a - b).abs() < f64::EPSILON,
        Cmp::Ne => (a - b).abs() >= f64::EPSILON,
    }
}

/// The newest item: latest `ts`, ties broken by the greater `id` so the choice never depends on read order.
pub(super) fn newest<'a, 'b>(items: &'b [Item<'a>]) -> Option<&'b Item<'a>> {
    items
        .iter()
        .max_by(|a, b| a.ts.cmp(&b.ts).then_with(|| a.rec.id.cmp(&b.rec.id)))
}

/// Nearest-rank percentile of a sorted, non-empty slice.
fn percentile(sorted: &[f64], p: f64) -> f64 {
    let rank = (p * sorted.len() as f64).ceil().max(1.0) as usize;
    sorted[rank.min(sorted.len()) - 1]
}

/// Compute an aggregate over a group. `measure` is the already-canonical measure name for `Agg::Measure`.
pub(super) fn compute(
    agg: &Agg,
    measure: Option<&str>,
    items: &[Item],
    now: i64,
) -> Option<AggValue> {
    match agg {
        Agg::Count => Some(AggValue::Number(items.len() as f64)),
        Agg::MaxTs => newest(items).map(|i| AggValue::Instant(i.ts)),
        Agg::MinTs => items.iter().map(|i| i.ts).min().map(AggValue::Instant),
        Agg::MaxEnd => items.iter().map(|i| i.end).max().map(AggValue::Instant),
        Agg::AgeTs => newest(items).map(|i| AggValue::Number((now - i.ts) as f64 / 1000.0)),
        Agg::Span => {
            let start = items.iter().map(|i| i.ts).min()?;
            let end = items.iter().map(|i| i.end).max()?;
            Some(AggValue::Number((end - start) as f64 / 1000.0))
        }
        Agg::Measure { func, .. } => {
            let name = measure?;
            if func == "sum" {
                if let Some(total) = joined_group_sum(items, name) {
                    return total.map(AggValue::Number);
                }
            }
            let mut values: Vec<f64> = items.iter().filter_map(|i| number(i, name)).collect();
            if values.is_empty() {
                return None;
            }
            values.sort_by(f64::total_cmp);
            let n = match func.as_str() {
                "sum" => values.iter().sum(),
                "avg" => values.iter().sum::<f64>() / values.len() as f64,
                "min" => values[0],
                "max" => values[values.len() - 1],
                "p50" => percentile(&values, 0.5),
                "p90" => percentile(&values, 0.9),
                _ => return None,
            };
            Some(AggValue::Number(n))
        }
    }
}
