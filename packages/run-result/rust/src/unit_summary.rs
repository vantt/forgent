//! Read the execution owner's unit summaries, never its attempts or workflow events.

use fgos_observe::{Observation, ObservationSource, SourceError, Subject, SubjectKind, UnitSummaryScan, Window};
use fgos_observe::time::{parse_timestamp_millis, ParsedWindow};
use serde_json::Value;
use std::fs::{self, File};
use std::io::Read;
use std::path::Path;

pub const MAX_UNIT_SUMMARY_BYTES: u64 = 1024 * 1024;
/// The only summary contract version this reader accepts; the Node writer owns the bump.
pub const UNIT_SUMMARY_VERSION: u64 = 2;

#[derive(Default)]
pub struct UnitSummarySource;

impl UnitSummarySource {
    pub fn new() -> Self {
        Self
    }
}

fn string(value: &Value) -> bool {
    value.as_str().is_some_and(|s| !s.trim().is_empty())
}

fn nullable_string(value: Option<&Value>) -> bool {
    value.is_some_and(|v| v.is_null() || string(v))
}

fn fallback(value: Option<&Value>) -> bool {
    value.is_some_and(|value| value.is_null()
        || (value.is_object()
            && string(&value["executor"])
            && string(&value["reason"])
            && ["invocation", "transport"].iter().all(|key| {
                value.get(*key).is_none_or(|field| field.is_null() || string(field))
            })))
}

fn attempt(value: &Value) -> bool {
    value.is_object()
        && string(&value["assignmentId"])
        && nullable_string(value.get("runId"))
        && ["executor", "provider", "persona", "model"]
            .iter().all(|key| nullable_string(value.get(*key)))
        && fallback(value.get("fallbackFrom"))
        && string(&value["outcome"])
}

fn stance(value: &Value) -> bool {
    match value["status"].as_str() {
        Some("missing") => true,
        Some("invalid") => string(&value["reason"]),
        Some("valid") => string(&value["choice"])
            && value.get("confidence").is_some_and(|confidence| {
                confidence.is_null()
                    || confidence.as_f64().is_some_and(|n| n.is_finite() && (0.0..=1.0).contains(&n))
            }),
        _ => false,
    }
}

fn valid_summary(value: &Value, directory_name: &str) -> bool {
    value["contract"]["id"] == "unit-summary"
        && value["contract"]["version"] == UNIT_SUMMARY_VERSION
        && value["unitRunId"] == directory_name
        && nullable_string(value.get("startedAt"))
        && nullable_string(value.get("pattern"))
        && nullable_string(value.get("capability"))
        && string(&value["outcome"])
        && value["inline"].is_boolean()
        && value.get("workflow").is_some_and(|link| link.is_null()
            || ["runId", "stepId", "unitId"].iter().all(|key| string(&link[*key])))
        && value["stanceOptions"].as_array().is_some_and(|options| options.iter().all(string))
        && value["seats"].as_array().is_some_and(|seats| seats.iter().all(|seat| {
            string(&seat["role"])
                && string(&seat["kind"])
                && seat["round"].as_u64().is_some_and(|round| round > 0)
                && attempt(&seat["final"])
                && stance(&seat["final"]["stance"])
                && seat["attempts"].as_array().is_some_and(|attempts| attempts.iter().all(attempt))
        }))
}

fn real_directory(path: &Path) -> bool {
    fs::symlink_metadata(path).is_ok_and(|metadata| metadata.file_type().is_dir())
}

fn read_summary(path: &Path) -> Result<Value, &'static str> {
    let metadata = fs::symlink_metadata(path).map_err(|err| {
        if err.kind() == std::io::ErrorKind::NotFound { "missing" } else { "unreadable" }
    })?;
    if metadata.file_type().is_symlink() {
        return Err("symlink");
    }
    if !metadata.file_type().is_file() {
        return Err("nonregular");
    }
    if metadata.len() > MAX_UNIT_SUMMARY_BYTES {
        return Err("oversized");
    }
    let file = File::open(path).map_err(|_| "unreadable")?;
    let mut bytes = Vec::with_capacity(metadata.len() as usize);
    file.take(MAX_UNIT_SUMMARY_BYTES + 1).read_to_end(&mut bytes).map_err(|_| "unreadable")?;
    if bytes.len() as u64 > MAX_UNIT_SUMMARY_BYTES {
        return Err("oversized");
    }
    serde_json::from_slice(&bytes).map_err(|_| "invalid-json")
}

impl ObservationSource for UnitSummarySource {
    fn source_id(&self) -> &'static str {
        "unit-summary"
    }

    fn observations(&self, root: &Path, window: &Window) -> Result<Vec<Observation>, SourceError> {
        Ok(scan_unit_summaries(root, window)?.observations)
    }
}

/// Scan direct real unit directories once, without inferring whether missing units are active.
/// Each directory is either observed, missing, unusable, or valid but outside the window.
pub fn scan_unit_summaries(root: &Path, window: &Window) -> Result<UnitSummaryScan, SourceError> {
    let parsed_window = ParsedWindow::parse(window).map_err(|message| SourceError::ReadFailed {
        source_id: "unit-summary", message,
    })?;
    let mut scan = UnitSummaryScan::default();
    let state = root.join(".fgos");
    let assignments = state.join("assignments");
    if !real_directory(&state) || !real_directory(&assignments) {
        return Ok(scan);
    }
    // No recursion into roles, attempts, protected data, outboxes, or planted trees.
    let mut entries = fs::read_dir(&assignments)
        .map_err(|err| SourceError::Io("unit-summary", err))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|err| SourceError::Io("unit-summary", err))?;
    entries.sort_by_cached_key(|entry| entry.file_name());
    for entry in entries {
        let name = entry.file_name();
        let Some(name) = name.to_str().filter(|name| name.starts_with("unit-run-") && name.len() > 9) else {
            continue;
        };
        if !entry.file_type().map_err(|err| SourceError::Io("unit-summary", err))?.is_dir() {
            continue;
        }
        scan.summary_dirs_seen += 1;
        let result = read_summary(&entry.path().join("unit-summary.json")).and_then(|value| {
            // An older or newer writer is not corruption: name it so a regeneration can be told apart.
            // The version is checked first because an older contract may not carry the fields this
            // version requires, such as a settlement timestamp.
            if value["contract"]["id"] == "unit-summary"
                && value["contract"]["version"].as_u64().is_some_and(|version| version != UNIT_SUMMARY_VERSION) {
                return Err("unsupported-version");
            }
            let ts = value["settledAt"].as_str().filter(|ts| !ts.trim().is_empty())
                .ok_or("missing-timestamp")?;
            let timestamp = parse_timestamp_millis(ts).ok_or("invalid-timestamp")?;
            if !valid_summary(&value, name) {
                return Err("invalid-contract");
            }
            Ok((value, timestamp))
        });
        let (value, timestamp) = match result {
            Ok(summary) => summary,
            Err("missing") => {
                scan.summaries_missing += 1;
                continue;
            }
            Err(reason) => {
                scan.summaries_unusable += 1;
                *scan.summaries_skipped_by_reason.entry(reason).or_default() += 1;
                continue;
            }
        };
        if !parsed_window.contains(timestamp) {
            scan.summaries_outside_window += 1;
            continue;
        }
        scan.observations.push(Observation {
            ts: value["settledAt"].as_str().expect("validated timestamp").to_owned(),
            subject: Subject { kind: SubjectKind::Run, id: format!("unit-run:{name}") },
            kind: "unit.settled".to_owned(),
            attrs: match value { Value::Object(attrs) => attrs, _ => unreachable!() },
            source: "unit-summary",
        });
    }
    scan.observations.sort_by_cached_key(|observation| {
        parse_timestamp_millis(&observation.ts).expect("validated timestamp")
    });
    Ok(scan)
}
