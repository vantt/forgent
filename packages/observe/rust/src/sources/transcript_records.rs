//! `ClaudeTranscriptsSource` as a `RecordSource`: per-session usage by model and hour, and the last activity of each
//! session from its transcript or its status-line sidecar.

use super::claude_transcripts::{ClaudeTranscriptsSource, Message};
use crate::contract::{RecordSource, SourceError, Window};
use crate::record::registry::EmbeddedDeclaration;
use crate::record::types::{AttrValue, Basis, Origin, Record, SubjectRef, RECORD_VERSION};
use crate::time::ParsedWindow;
use fgos_host_runtime::civil_time::{
    format_unix_millis_rfc3339, parse_date_midnight_millis, parse_rfc3339_millis,
};
use serde_json::Value;
use std::collections::BTreeMap;
use std::path::Path;

pub const USAGE_KIND: &str = "fgos.session.usage";
pub const ACTIVITY_KIND: &str = "fgos.session.activity";
/// The declaration of both kinds, for the composition root's embedded list.
pub const TRANSCRIPT_DECLARATION: EmbeddedDeclaration = EmbeddedDeclaration {
    label: "fgos-observe-transcripts",
    json: include_str!("../../transcript-kinds.json"),
};
const SOURCE_ID: &str = "claude-transcripts";
const SIDECAR_FILE: &str = "context-sidecar.jsonl";
/// A status-line sidecar is a few lines per refresh; a file past this is not read.
const SIDECAR_MAX_BYTES: u64 = 64 * 1024 * 1024;
const MODEL_ATTR: &str = "gen_ai.request.model";
const SOURCE_ATTR: &str = "fgos.session.activity.source";
const UNKNOWN_SESSION: &str = "unknown";

fn session_subject(id: &str) -> SubjectRef {
    SubjectRef {
        kind: "session".to_owned(),
        id: if id.is_empty() { UNKNOWN_SESSION } else { id }.to_owned(),
    }
}

fn origin() -> Origin {
    Origin {
        source: SOURCE_ID.to_owned(),
        component: Some("observe".to_owned()),
        ..Origin::default()
    }
}

const HOUR_MILLIS: i64 = 3_600_000;

/// The UTC hour an instant falls in, as `YYYY-MM-DDTHH`, whatever offset the transcript text carried.
fn hour_key(ms: i64) -> Option<String> {
    let floor = ms.div_euclid(HOUR_MILLIS) * HOUR_MILLIS;
    format_unix_millis_rfc3339(floor, 0).map(|t| t[..13].to_owned())
}

/// The window widened to whole UTC hours, so every hour bucket a window touches is read whole.
fn hour_widened(w: &Window) -> Result<Window, String> {
    let bound = |value: &Option<String>| -> Result<Option<i64>, String> {
        value
            .as_deref()
            .map(|t| {
                let parsed = if t.len() == 10 {
                    parse_date_midnight_millis(t)
                } else {
                    parse_rfc3339_millis(t)
                };
                parsed.ok_or_else(|| format!("invalid window timestamp: {t}"))
            })
            .transpose()
    };
    let since = bound(&w.since)?.map(|ms| ms.div_euclid(HOUR_MILLIS) * HOUR_MILLIS);
    let until =
        bound(&w.until)?.map(|ms| ms.div_euclid(HOUR_MILLIS) * HOUR_MILLIS + HOUR_MILLIS - 1);
    let text = |ms: i64| format_unix_millis_rfc3339(ms, 0);
    Ok(Window {
        since: since.and_then(text),
        until: until.and_then(text),
    })
}

/// Sidecar `ts`: epoch milliseconds, an RFC 3339 string or a calendar date.
fn sidecar_millis(record: &Value) -> Option<i64> {
    match record.get("ts")? {
        Value::Number(n) => n.as_i64().or_else(|| n.as_f64().map(|f| f as i64)),
        Value::String(t) => parse_rfc3339_millis(t).or_else(|| parse_date_midnight_millis(t)),
        _ => None,
    }
}

/// Last activity per session found in every project sidecar, windowed.
fn sidecar_activity(root: &Path, window: &ParsedWindow) -> BTreeMap<String, i64> {
    let mut last = BTreeMap::new();
    let base = root.join(".fgos/runtime/session-rotation");
    let Ok(lineages) = std::fs::read_dir(&base) else {
        return last;
    };
    for lineage in lineages.flatten() {
        let path = lineage.path().join(SIDECAR_FILE);
        let Ok(meta) = std::fs::symlink_metadata(&path) else {
            continue;
        };
        if !meta.is_file() || meta.len() > SIDECAR_MAX_BYTES {
            continue;
        }
        let Ok(text) = std::fs::read_to_string(&path) else {
            continue;
        };
        for line in text.lines() {
            let Ok(record) = serde_json::from_str::<Value>(line) else {
                continue;
            };
            let (Some(sid), Some(ms)) = (
                record.get("session_id").and_then(Value::as_str),
                sidecar_millis(&record),
            ) else {
                continue;
            };
            if window.contains(ms) {
                let slot = last.entry(sid.to_owned()).or_insert(ms);
                *slot = (*slot).max(ms);
            }
        }
    }
    last
}

/// One record per session, model and UTC hour. The messages cover whole hours (see `hour_widened`), so a
/// bucket's sums do not depend on the window that read it; a bucket is returned whole when any of its
/// messages is in the window. Its id is hour-based, its `ts` is its latest message.
fn usage_records(messages: &[Message]) -> Vec<Record> {
    let mut groups: BTreeMap<(String, String, String), ([u64; 4], i64)> = BTreeMap::new();
    for m in messages {
        let Some(hour) = hour_key(m.ms) else { continue };
        let (sums, latest) = groups
            .entry((m.session_id.clone(), m.model.clone(), hour))
            .or_insert(([0; 4], m.ms));
        sums[0] += m.input_tokens;
        sums[1] += m.output_tokens;
        sums[2] += m.cache_read;
        sums[3] += m.cache_creation;
        *latest = (*latest).max(m.ms);
    }
    groups
        .into_iter()
        .filter_map(|((session, model, hour), (sums, latest))| {
            let ts = format_unix_millis_rfc3339(latest, 0)?;
            let measures = [
                "gen_ai.usage.input_tokens",
                "gen_ai.usage.output_tokens",
                "gen_ai.usage.cache_read.input_tokens",
                "gen_ai.usage.cache_creation.input_tokens",
            ]
            .into_iter()
            .zip(sums)
            .map(|(name, n)| (name.to_owned(), n.into()))
            .collect();
            Some(Record {
                v: RECORD_VERSION,
                id: format!("session-usage:{session}:{model}:{hour}"),
                kind: USAGE_KIND.to_owned(),
                ts,
                end_ts: None,
                subject: session_subject(&session),
                refs: Vec::new(),
                attrs: BTreeMap::from([(MODEL_ATTR.to_owned(), AttrValue::Str(model))]),
                measures,
                basis: Basis::Transcript,
                origin: origin(),
                detail: None,
                redaction: None,
            })
        })
        .collect()
}

fn activity_records(
    transcript: &BTreeMap<String, i64>,
    sidecar: &BTreeMap<String, i64>,
) -> Vec<Record> {
    // Per session: the newest instant and which source gave it; a sidecar wins a tie.
    let mut last: BTreeMap<String, (i64, &'static str)> = transcript
        .iter()
        .map(|(session, &ms)| (session.clone(), (ms, "transcript")))
        .collect();
    for (session, &ms) in sidecar {
        let slot = last.entry(session.clone()).or_insert((ms, "sidecar"));
        if ms >= slot.0 {
            *slot = (ms, "sidecar");
        }
    }
    last.into_iter()
        .filter_map(|(session, (ms, from))| {
            let ts = format_unix_millis_rfc3339(ms, 0)?;
            Some(Record {
                v: RECORD_VERSION,
                id: format!("session-activity:{session}:{ts}"),
                kind: ACTIVITY_KIND.to_owned(),
                ts,
                end_ts: None,
                subject: session_subject(&session),
                refs: Vec::new(),
                attrs: BTreeMap::from([(SOURCE_ATTR.to_owned(), AttrValue::Str(from.to_owned()))]),
                measures: BTreeMap::new(),
                basis: if from == "sidecar" {
                    Basis::Reported
                } else {
                    Basis::Transcript
                },
                origin: origin(),
                detail: None,
                redaction: None,
            })
        })
        .collect()
}

impl RecordSource for ClaudeTranscriptsSource {
    fn source_id(&self) -> &'static str {
        SOURCE_ID
    }

    fn kinds(&self) -> &'static [&'static str] {
        &[USAGE_KIND, ACTIVITY_KIND]
    }

    fn records(&self, root: &Path, w: &Window) -> Result<Vec<Record>, SourceError> {
        let window = ParsedWindow::parse(w).map_err(|message| SourceError::ReadFailed {
            source_id: SOURCE_ID,
            message,
        })?;
        let widened = hour_widened(w).map_err(|message| SourceError::ReadFailed {
            source_id: SOURCE_ID,
            message,
        })?;
        let mut activity = BTreeMap::new();
        let messages = self.scan_with_activity(root, &widened, Some((&mut activity, window)))?;
        let mut records = usage_records(&messages);
        records.extend(activity_records(
            &activity,
            &sidecar_activity(root, &window),
        ));
        Ok(records)
    }
}
