//! Running a query: name checks, source reads, the filter pipeline, grouping, aggregates and group filters.

use super::aggregate::{
    compare, compute, cond_matches, field, newest, number, Item, RECORD_FIELDS,
};
use super::error::{invalid, QueryError};
use super::model::{Agg, Anchor, Cond, Having, LatestPer, Operand, Query, WindowOn};
use super::result::{AggValue, Coverage, QueryResult, ResultRow};
use super::time::{
    bucket_start, format_instant, parse_absolute, parse_duration_millis, parse_instant,
};
use crate::contract::{RecordSource, Window};
use crate::record::registry::Registry;
use crate::record::types::Record;
use std::collections::{BTreeMap, BTreeSet, HashMap, HashSet};
use std::path::Path;

/// Everything a query reads besides the query itself. The clock is an input, so a result never depends on when it
/// runs.
pub struct QueryContext<'a> {
    pub registry: &'a Registry,
    pub sources: &'a [&'a dyn RecordSource],
    pub root: &'a Path,
    pub now_millis: i64,
    /// Values for `Operand::Param`.
    pub params: BTreeMap<String, f64>,
}

/// Resolves a name written in a query to the canonical name the records carry.
struct Names<'a> {
    registry: &'a Registry,
    aliases: Vec<&'a str>,
}

impl Names<'_> {
    fn joined<'n>(&self, name: &'n str) -> Option<(&str, &'n str)> {
        self.aliases.iter().find_map(|alias| {
            name.strip_prefix(*alias)
                .and_then(|rest| rest.strip_prefix('.'))
                .map(|rest| (*alias, rest))
        })
    }

    fn resolve(&self, name: &str) -> Result<String, QueryError> {
        let unknown = || QueryError::UnknownField {
            name: name.to_owned(),
        };
        if RECORD_FIELDS.contains(&name) {
            return Ok(name.to_owned());
        }
        if let Some((alias, rest)) = self.joined(name) {
            if rest == "count" {
                return Ok(name.to_owned());
            }
            let canonical = self.registry.canonical_name(rest);
            return if self.registry.measure(canonical).is_some() {
                Ok(format!("{alias}.{canonical}"))
            } else {
                Err(unknown())
            };
        }
        let canonical = self.registry.canonical_name(name);
        if self.registry.attr(canonical).is_some() || self.registry.measure(canonical).is_some() {
            Ok(canonical.to_owned())
        } else {
            Err(unknown())
        }
    }

    /// The canonical measure of a measure aggregate, checked against the aggregations it declares.
    fn agg_measure(&self, agg: &Agg) -> Result<Option<String>, QueryError> {
        let Agg::Measure { func, measure } = agg else {
            return Ok(None);
        };
        let resolved = self.resolve(measure)?;
        let underlying = self
            .joined(&resolved)
            .map_or(resolved.as_str(), |(_, rest)| rest);
        if underlying != "count" {
            let def =
                self.registry
                    .measure(underlying)
                    .ok_or_else(|| QueryError::UnknownField {
                        name: measure.clone(),
                    })?;
            if !def.aggs.contains(func) {
                return Err(QueryError::AggNotValid {
                    measure: underlying.to_owned(),
                    agg: func.clone(),
                });
            }
        }
        Ok(Some(resolved))
    }

    /// Filters that run before any join, so a joined name would never be set there and is refused.
    fn conds<'c>(
        &self,
        what: &'static str,
        conds: &'c [Cond],
    ) -> Result<Vec<(&'c Cond, String)>, QueryError> {
        conds
            .iter()
            .map(|c| {
                let resolved = self.resolve(&c.field)?;
                if self.joined(&resolved).is_some() {
                    return Err(invalid(
                        what,
                        &c.field,
                        "a joined name is set only after where, where_latest and without run; use having",
                    ));
                }
                Ok((c, resolved))
            })
            .collect()
    }

    fn subject_kind(&self, what: &'static str, kind: &str) -> Result<(), QueryError> {
        if self.registry.has_subject_kind(kind) {
            Ok(())
        } else {
            Err(invalid(what, kind, "not a declared subject kind"))
        }
    }
}

fn check_operand(names: &Names, ctx: &QueryContext, operand: &Operand) -> Result<(), QueryError> {
    match operand {
        Operand::Const(_) => Ok(()),
        Operand::Param(name) if ctx.params.contains_key(name) => Ok(()),
        Operand::Param(name) => Err(QueryError::MissingParam { name: name.clone() }),
        Operand::Agg { agg, .. } => names.agg_measure(agg).map(|_| ()),
        Operand::Latest { measure, .. } => names.resolve(measure).map(|_| ()),
    }
}

fn operand_value(
    names: &Names,
    ctx: &QueryContext,
    operand: &Operand,
    items: &[Item],
) -> Option<f64> {
    match operand {
        Operand::Const(c) => Some(*c),
        Operand::Param(name) => ctx.params.get(name).copied(),
        Operand::Agg { agg, k } => {
            let measure = names.agg_measure(agg).ok().flatten();
            compute(agg, measure.as_deref(), items, ctx.now_millis).map(|v| v.as_f64() * k)
        }
        Operand::Latest { measure, k } => {
            let name = names.resolve(measure).ok()?;
            newest(items).and_then(|i| number(i, &name)).map(|v| v * k)
        }
    }
}

fn passes_having(names: &Names, ctx: &QueryContext, having: &[Having], items: &[Item]) -> bool {
    having.iter().all(|h| {
        match (
            operand_value(names, ctx, &h.lhs, items),
            operand_value(names, ctx, &h.rhs, items),
        ) {
            (Some(a), Some(b)) => compare(a, h.op, b),
            _ => false,
        }
    })
}

fn unmeasured(reason: String) -> QueryResult {
    QueryResult {
        unmeasured: Some(reason),
        ..QueryResult::default()
    }
}

pub fn run(query: &Query, ctx: &QueryContext) -> Result<QueryResult, QueryError> {
    if query.kind.is_empty() {
        return Err(QueryError::NoKind);
    }
    let names = Names {
        registry: ctx.registry,
        aliases: query.join.iter().map(|j| j.alias.as_str()).collect(),
    };

    // Resolve and check every name before reading anything.
    let where_ = names.conds("where", &query.where_)?;
    let where_latest = names.conds("where_latest", &query.where_latest)?;
    let mut withouts = Vec::new();
    for w in &query.without {
        let within = parse_duration_millis(&w.within)?;
        if let Some(on) = &w.on {
            names.subject_kind("without on", on)?;
        }
        let back_from_now = ctx
            .now_millis
            .checked_sub(within)
            .ok_or_else(|| invalid("within", &w.within, "reaches before the earliest instant"))?;
        withouts.push((
            w,
            names.conds("without where", &w.where_)?,
            within,
            back_from_now,
        ));
    }
    for r in &query.refs {
        names.subject_kind("ref", &r.kind)?;
    }
    for j in &query.join {
        names.subject_kind("join on", &j.on)?;
    }
    let mut by = Vec::new();
    for entry in &query.by {
        match entry.strip_prefix("ref:") {
            Some(kind) => {
                names.subject_kind("by", kind)?;
                by.push(entry.clone());
            }
            None => by.push(names.resolve(entry)?),
        }
    }
    if let Some(LatestPer::Ref(kind)) = &query.latest_per {
        names.subject_kind("latest-per", kind)?;
    }
    let mut agg_measures = Vec::new();
    for agg in &query.agg {
        agg_measures.push(names.agg_measure(agg)?);
    }
    for h in &query.having {
        check_operand(&names, ctx, &h.lhs)?;
        check_operand(&names, ctx, &h.rhs)?;
    }
    let since = query
        .since
        .as_deref()
        .map(|s| parse_instant(s, ctx.now_millis))
        .transpose()?;
    let until = query
        .until
        .as_deref()
        .map(|s| parse_instant(s, ctx.now_millis))
        .transpose()?;
    if matches!((since, until), (Some(a), Some(b)) if a > b) {
        return Err(invalid(
            "window",
            "since/until",
            "since must not be after until",
        ));
    }

    // Every kind the query reads must be declared and served.
    let mut needed: BTreeSet<&str> = query.kind.iter().map(String::as_str).collect();
    needed.extend(
        query
            .join
            .iter()
            .flat_map(|j| j.kind.iter().map(String::as_str)),
    );
    needed.extend(
        query
            .without
            .iter()
            .flat_map(|w| w.kind.iter().map(String::as_str)),
    );
    for kind in &needed {
        if ctx.registry.kind(kind).is_none() {
            return Ok(unmeasured(format!("kind-undeclared: {kind}")));
        }
        if !ctx.sources.iter().any(|s| s.kinds().contains(kind)) {
            return Ok(unmeasured(format!("no-source: {kind}")));
        }
    }

    // Read the sources that serve a needed kind. A window can narrow the read only when nothing looks outside it.
    let narrow =
        query.join.is_empty() && query.without.is_empty() && query.window_on == WindowOn::Ts;
    let window = if narrow {
        Window {
            since: since.map(format_instant),
            until: until.map(format_instant),
        }
    } else {
        Window::default()
    };
    let mut records: Vec<Record> = Vec::new();
    for source in ctx.sources {
        if !source.kinds().iter().any(|k| needed.contains(k)) {
            continue;
        }
        match source.records(ctx.root, &window) {
            Ok(found) => records.extend(found),
            Err(e) => {
                return Ok(unmeasured(format!(
                    "source-failed: {}: {e}",
                    source.source_id()
                )))
            }
        }
    }
    let mut seen = HashSet::new();
    records.retain(|r| needed.contains(r.kind.as_str()) && seen.insert(r.id.clone()));

    let mut skipped = 0;
    let mut parsed: Vec<Option<(i64, i64)>> = Vec::with_capacity(records.len());
    for r in &records {
        let ts = parse_absolute(&r.ts).ok();
        let end = match &r.end_ts {
            Some(e) => parse_absolute(e).ok(),
            None => ts,
        };
        let pair = ts.zip(end);
        if pair.is_none() {
            skipped += 1;
        }
        parsed.push(pair);
    }
    let items_of = |kinds: &BTreeSet<&str>| -> Vec<Item> {
        records
            .iter()
            .zip(&parsed)
            .filter_map(|(rec, p)| {
                let (ts, end) = (*p)?;
                kinds.contains(rec.kind.as_str()).then(|| Item {
                    rec,
                    ts,
                    end,
                    links: BTreeMap::new(),
                })
            })
            .collect()
    };

    // Filters, newest per key, filters on that newest record.
    let primary_kinds: BTreeSet<&str> = query.kind.iter().map(String::as_str).collect();
    let on_instant = |i: &Item| match query.window_on {
        WindowOn::Ts => i.ts,
        WindowOn::End => i.end,
    };
    let mut primary: Vec<Item> = items_of(&primary_kinds)
        .into_iter()
        .filter(|i| query.refs.iter().all(|r| i.has_ref(&r.kind, &r.id)))
        .filter(|i| {
            since.is_none_or(|s| on_instant(i) >= s) && until.is_none_or(|u| on_instant(i) <= u)
        })
        .filter(|i| where_.iter().all(|(c, f)| cond_matches(i, c, f)))
        .collect();
    if let Some(key) = &query.latest_per {
        let mut latest: HashMap<(String, String), Item> = HashMap::new();
        for item in primary {
            let key = match key {
                LatestPer::Subject => {
                    Some((item.rec.subject.kind.clone(), item.rec.subject.id.clone()))
                }
                LatestPer::Ref(kind) => item
                    .ref_ids(kind)
                    .next()
                    .map(|id| (kind.clone(), id.to_owned())),
            };
            let Some(key) = key else { continue };
            match latest.get(&key) {
                Some(held) if (held.ts, &held.rec.id) >= (item.ts, &item.rec.id) => {}
                _ => {
                    latest.insert(key, item);
                }
            }
        }
        primary = latest.into_values().collect();
    }
    primary.retain(|i| where_latest.iter().all(|(c, f)| cond_matches(i, c, f)));

    // Joins add measures of records that share a ref.
    for join in &query.join {
        let kinds: BTreeSet<&str> = join.kind.iter().map(String::as_str).collect();
        let pool = items_of(&kinds);
        let mut by_ref: HashMap<&str, Vec<usize>> = HashMap::new();
        for (idx, item) in pool.iter().enumerate() {
            for id in item.ref_ids(&join.on) {
                by_ref.entry(id).or_default().push(idx);
            }
        }
        for item in &mut primary {
            let matched: BTreeSet<usize> = item
                .ref_ids(&join.on)
                .flat_map(|id| by_ref.get(id).into_iter().flatten().copied())
                .filter(|&idx| {
                    !join.within_span || (pool[idx].ts >= item.ts && pool[idx].ts <= item.end)
                })
                .collect();
            item.links.insert(
                join.alias.clone(),
                matched.into_iter().map(|idx| pool[idx].rec).collect(),
            );
        }
    }

    // Anti-joins drop a record that has a matching record in the window. With `on`, the pool is indexed by ref id.
    for (w, conds, within, back_from_now) in &withouts {
        let kinds: BTreeSet<&str> = w.kind.iter().map(String::as_str).collect();
        let pool: Vec<Item> = items_of(&kinds)
            .into_iter()
            .filter(|r| conds.iter().all(|(c, f)| cond_matches(r, c, f)))
            .collect();
        let mut by_ref: HashMap<&str, Vec<i64>> = HashMap::new();
        if let Some(on) = &w.on {
            for r in &pool {
                for id in r.ref_ids(on) {
                    by_ref.entry(id).or_default().push(r.ts);
                }
            }
        }
        let mut kept = Vec::with_capacity(primary.len());
        for p in primary {
            let (lo, hi) = match w.anchor {
                Anchor::Now => (*back_from_now, ctx.now_millis),
                Anchor::Record => (
                    p.ts.checked_sub(*within).ok_or_else(|| {
                        invalid("within", &w.within, "reaches before the earliest instant")
                    })?,
                    p.end,
                ),
            };
            let inside = |ts: &i64| (lo..=hi).contains(ts);
            let found = match &w.on {
                Some(on) => p.ref_ids(on).any(|id| {
                    by_ref
                        .get(id)
                        .is_some_and(|stamps| stamps.iter().any(inside))
                }),
                None => pool.iter().any(|r| inside(&r.ts)),
            };
            if !found {
                kept.push(p);
            }
        }
        primary = kept;
    }

    // Group.
    let mut coverage = Coverage {
        matched: primary.len(),
        ..Coverage::default()
    };
    let mut groups: BTreeMap<(Option<i64>, Vec<String>), Vec<Item>> = BTreeMap::new();
    'records: for item in primary {
        let mut values = Vec::with_capacity(by.len());
        for entry in &by {
            let value = match entry.strip_prefix("ref:") {
                Some(kind) => item.ref_ids(kind).next().map(str::to_owned),
                None => field(&item, entry).map(|v| v.render()),
            };
            match value {
                Some(v) => values.push(v),
                None => {
                    *coverage.missing.entry(entry.clone()).or_default() += 1;
                    continue 'records;
                }
            }
        }
        let bucket = query.bucket.map(|b| bucket_start(item.ts, b));
        groups.entry((bucket, values)).or_default().push(item);
    }
    if groups.is_empty() && by.is_empty() && query.bucket.is_none() {
        groups.insert((None, Vec::new()), Vec::new());
    }

    let mut rows = Vec::new();
    for ((bucket, values), items) in groups {
        // An insufficient group is reported as such; `having` is not evaluated for it.
        let insufficient = query.min_sample > 0 && items.len() < query.min_sample;
        if !insufficient && !passes_having(&names, ctx, &query.having, &items) {
            continue;
        }
        let aggs = query
            .agg
            .iter()
            .zip(&agg_measures)
            .map(|(agg, measure)| {
                let value: Option<AggValue> = if insufficient {
                    None
                } else {
                    compute(agg, measure.as_deref(), &items, ctx.now_millis)
                };
                (agg.to_string(), value)
            })
            .collect();
        rows.push(ResultRow {
            group: query.by.iter().cloned().zip(values).collect(),
            bucket: bucket.map(format_instant),
            count: items.len(),
            insufficient,
            aggs,
        });
    }
    Ok(QueryResult {
        rows,
        coverage,
        skipped,
        unmeasured: None,
    })
}
