//! The run, unit and verify kinds on the record contract, projected from the unit summaries Execution stored.
//!
//! Facts are copied, never recomputed: the summary already holds each attempt's provider, model, account, duration
//! and usage, and the unit's outcome, plan key and verify record. A fact the summary does not carry produces no
//! attr, so the query engine counts the gap in `coverage` instead of reading a made-up value.
//!
//! Spans: the summary stores no per-attempt start or end, so every `fgos.run.attempt` spans its unit, from the
//! unit's start to its settlement. `fgos.seats` on `fgos.unit.settled` counts seat entries, one per seat and round.
//!
//! One usage fact, two views: `fgos.run.attempt` (units only, one record per dispatched seat attempt) and
//! `fgos.run.settled` (every settled run, units or not, from its `result.json`) both carry the usage the run
//! result reported. Query one of the two kinds for tokens, never the sum of both.

pub(crate) mod usage;

use crate::unit_summary::scan_unit_summaries;
use fgos_host_runtime::civil_time::{format_unix_millis_rfc3339, parse_rfc3339_millis};
use fgos_observe::record::registry::EmbeddedDeclaration;
use fgos_observe::record::types::{AttrValue, Basis, Origin, Record, SubjectRef, RECORD_VERSION};
use fgos_observe::{RecordSource, SourceError, Window};
use serde_json::{Number, Value};
use std::collections::BTreeMap;
use std::path::Path;

pub const ATTEMPT_KIND: &str = "fgos.run.attempt";
pub const UNIT_KIND: &str = "fgos.unit.settled";
pub const VERIFY_KIND: &str = "fgos.unit.verify";

/// The declaration of the three kinds, for the composition root's embedded list.
pub const RUN_DECLARATION: EmbeddedDeclaration = EmbeddedDeclaration {
    label: "fgos-run-result",
    json: include_str!("../../observe-kinds.json"),
};

const SOURCE_ID: &str = "run-projection";

#[derive(Debug, Default, Clone, Copy)]
pub struct RunProjectionSource;

impl RunProjectionSource {
    pub fn new() -> Self {
        Self
    }
}

impl RecordSource for RunProjectionSource {
    fn source_id(&self) -> &'static str {
        SOURCE_ID
    }

    fn kinds(&self) -> &[&str] {
        &[ATTEMPT_KIND, UNIT_KIND, VERIFY_KIND]
    }

    /// A unit is read when it settled inside the window. A span starts earlier than it settles, so the upper bound
    /// is left to the engine: a unit that started inside the window and settled after it is still returned.
    fn records(&self, root: &Path, w: &Window) -> Result<Vec<Record>, SourceError> {
        let widened = Window {
            since: w.since.clone(),
            until: None,
        };
        let scan = scan_unit_summaries(root, &widened)?;
        // The machine a record was projected on: the supervisor reads it to know whose lane was freed.
        let host = Some(fgos_process::facts::host());
        Ok(scan
            .summaries
            .into_iter()
            .flat_map(|s| project_summary(&Value::Object(s.body), host.as_deref()))
            .collect())
    }
}

fn text(value: &Value) -> Option<&str> {
    value.as_str().filter(|s| !s.trim().is_empty())
}

fn put_str(attrs: &mut BTreeMap<String, AttrValue>, name: &str, value: &Value) {
    if let Some(s) = text(value) {
        attrs.insert(name.to_owned(), AttrValue::Str(s.to_owned()));
    }
}

fn origin(host: Option<&str>) -> Origin {
    Origin {
        source: SOURCE_ID.to_owned(),
        component: Some("run-result".to_owned()),
        host: host.map(str::to_owned),
        ..Origin::default()
    }
}

fn refs(unit_run_id: &str, summary: &Value, with_unit: bool) -> Vec<SubjectRef> {
    let mut refs = Vec::new();
    if with_unit {
        refs.push(SubjectRef {
            kind: "unit".to_owned(),
            id: unit_run_id.to_owned(),
        });
    }
    if let Some(dir) = text(&summary["plan"]["dir"]) {
        refs.push(SubjectRef {
            kind: "plan".to_owned(),
            id: dir.to_owned(),
        });
        if let Some(phase) = text(&summary["plan"]["phase"]) {
            refs.push(SubjectRef {
                kind: "phase".to_owned(),
                id: phase.to_owned(),
            });
        }
    }
    refs
}

/// Records of one settled summary: an attempt record per dispatched attempt, one unit record, and the verify record
/// when the summary stored one.
pub fn project_summary(summary: &Value, host: Option<&str>) -> Vec<Record> {
    let Some(unit_run_id) = text(&summary["unitRunId"]) else {
        return Vec::new();
    };
    let Some(settled_at) = text(&summary["settledAt"]) else {
        return Vec::new();
    };
    let Some(settled_ms) = parse_rfc3339_millis(settled_at) else {
        return Vec::new();
    };
    // The unit's own span: creation to settlement. A unit without a creation time starts where it ended.
    let started_at = text(&summary["startedAt"])
        .filter(|s| parse_rfc3339_millis(s).is_some_and(|ms| ms <= settled_ms))
        .unwrap_or(settled_at);

    let mut records = Vec::new();
    let seats = summary["seats"].as_array().map_or(&[][..], Vec::as_slice);
    let mut dispatched = 0u64;
    for seat in seats {
        let seat_id = text(&seat["seat"])
            .or_else(|| text(&seat["role"]))
            .unwrap_or_default();
        let round = seat["round"].as_u64().unwrap_or(1);
        let attempts = seat["attempts"].as_array().map_or(&[][..], Vec::as_slice);
        for (index, attempt) in attempts.iter().enumerate() {
            let Some(run_id) = text(&attempt["runId"]) else {
                continue; // The seat never got a run: a seat, not a dispatch attempt.
            };
            dispatched += 1;
            records.push(attempt_record(
                unit_run_id,
                summary,
                (started_at, settled_at),
                (seat, seat_id, round, index),
                (attempt, run_id),
                host,
            ));
        }
    }

    let mut attrs = BTreeMap::new();
    if let Some(workflow) = text(&summary["workflow"]["runId"]) {
        attrs.insert(
            "fgos.workflow".to_owned(),
            AttrValue::Str(workflow.to_owned()),
        );
    }
    put_str(&mut attrs, "fgos.pattern", &summary["pattern"]);
    put_str(&mut attrs, "fgos.outcome", &summary["outcome"]);
    if let Some(infrastructure) = summary["infrastructure"].as_bool() {
        attrs.insert(
            "fgos.infrastructure".to_owned(),
            AttrValue::Bool(infrastructure),
        );
    }
    let measures = BTreeMap::from([
        ("fgos.attempts".to_owned(), Number::from(dispatched)),
        ("fgos.seats".to_owned(), Number::from(seats.len() as u64)),
    ]);
    records.push(Record {
        v: RECORD_VERSION,
        id: format!("unit-settled:{unit_run_id}"),
        kind: UNIT_KIND.to_owned(),
        ts: started_at.to_owned(),
        end_ts: Some(settled_at.to_owned()),
        subject: SubjectRef {
            kind: "unit".to_owned(),
            id: unit_run_id.to_owned(),
        },
        refs: refs(unit_run_id, summary, false),
        attrs,
        measures,
        basis: Basis::Derived,
        origin: origin(host),
        detail: None,
        redaction: None,
    });

    if let Some(record) = verify_record(unit_run_id, summary, settled_ms, settled_at, host) {
        records.push(record);
    }
    records
}

fn attempt_record(
    unit_run_id: &str,
    summary: &Value,
    (started_at, settled_at): (&str, &str),
    (seat, seat_id, round, index): (&Value, &str, u64, usize),
    (attempt, run_id): (&Value, &str),
    host: Option<&str>,
) -> Record {
    let mut attrs = BTreeMap::new();
    put_str(&mut attrs, "gen_ai.provider.name", &attempt["provider"]);
    put_str(&mut attrs, "gen_ai.request.model", &attempt["model"]);
    put_str(&mut attrs, "fgos.account.id", &attempt["accountId"]);
    put_str(&mut attrs, "fgos.executor.id", &attempt["executor"]);
    put_str(&mut attrs, "fgos.persona", &attempt["persona"]);
    put_str(&mut attrs, "fgos.outcome", &attempt["outcome"]);
    if !seat_id.is_empty() {
        attrs.insert(
            "fgos.seat.id".to_owned(),
            AttrValue::Str(seat_id.to_owned()),
        );
    }
    put_str(&mut attrs, "fgos.seat.role", &seat["role"]);
    attrs.insert(
        "fgos.fallback".to_owned(),
        AttrValue::Bool(attempt["fallbackFrom"].is_object()),
    );
    let mut measures = BTreeMap::new();
    if let Some(ms) = attempt["durationMs"].as_u64() {
        measures.insert("fgos.duration".to_owned(), Number::from(ms));
    }
    usage::project(&attempt["usage"], &mut attrs, &mut measures);
    Record {
        v: RECORD_VERSION,
        id: format!("run-attempt:{unit_run_id}:{seat_id}:{round}:{index}"),
        kind: ATTEMPT_KIND.to_owned(),
        ts: started_at.to_owned(),
        end_ts: Some(settled_at.to_owned()),
        subject: SubjectRef {
            kind: "run".to_owned(),
            id: run_id.to_owned(),
        },
        refs: refs(unit_run_id, summary, true),
        attrs,
        measures,
        basis: Basis::Derived,
        origin: origin(host),
        detail: None,
        redaction: None,
    }
}

/// The verify command's own span, ending where the unit settled. A verify that did not run keeps its recorded
/// reason out of the attrs and is told apart by the outcome `not-run`.
fn verify_record(
    unit_run_id: &str,
    summary: &Value,
    settled_ms: i64,
    settled_at: &str,
    host: Option<&str>,
) -> Option<Record> {
    let verify = summary.get("verify").filter(|v| v.is_object())?;
    let mut attrs = BTreeMap::new();
    let mut measures = BTreeMap::new();
    let mut ts = settled_at.to_owned();
    match verify["ran"].as_bool()? {
        true => {
            put_str(&mut attrs, "fgos.verify.outcome", &verify["outcome"]);
            put_str(&mut attrs, "fgos.verify.how", &verify["how"]);
            if let Some(ms) = verify["durationMs"].as_u64() {
                measures.insert("fgos.duration".to_owned(), Number::from(ms));
                let start = settled_ms.saturating_sub(i64::try_from(ms).unwrap_or(i64::MAX));
                ts = format_unix_millis_rfc3339(start, 0).unwrap_or(ts);
            }
        }
        false => {
            attrs.insert(
                "fgos.verify.outcome".to_owned(),
                AttrValue::Str("not-run".to_owned()),
            );
        }
    }
    Some(Record {
        v: RECORD_VERSION,
        id: format!("unit-verify:{unit_run_id}"),
        kind: VERIFY_KIND.to_owned(),
        ts,
        end_ts: Some(settled_at.to_owned()),
        subject: SubjectRef {
            kind: "unit".to_owned(),
            id: unit_run_id.to_owned(),
        },
        refs: refs(unit_run_id, summary, false),
        attrs,
        measures,
        basis: Basis::Derived,
        origin: origin(host),
        detail: None,
        redaction: None,
    })
}
