//! Read the execution owner's unit summaries, never its attempts or workflow events.

use fgos_observe::{Observation, ObservationSource, SourceError, Subject, SubjectKind, Window};
use fgos_observe::time::{parse_timestamp_millis, ParsedWindow};
use serde_json::Value;
use std::fs::{self, File};
use std::io::Read;
use std::path::Path;

pub const MAX_UNIT_SUMMARY_BYTES: u64 = 1024 * 1024;

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
        && value["contract"]["version"] == 1
        && value["unitRunId"] == directory_name
        && string(&value["settledAt"])
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
                && seat["round"].as_u64().is_some_and(|round| round > 0)
                && attempt(&seat["final"])
                && stance(&seat["final"]["stance"])
                && seat["attempts"].as_array().is_some_and(|attempts| attempts.iter().all(attempt))
        }))
}

fn real_directory(path: &Path) -> bool {
    fs::symlink_metadata(path).is_ok_and(|metadata| metadata.file_type().is_dir())
}

fn read_summary(path: &Path) -> Option<Value> {
    let metadata = fs::symlink_metadata(path).ok()?;
    if !metadata.file_type().is_file() || metadata.len() > MAX_UNIT_SUMMARY_BYTES {
        return None;
    }
    let file = File::open(path).ok()?;
    let mut bytes = Vec::with_capacity(metadata.len() as usize);
    file.take(MAX_UNIT_SUMMARY_BYTES + 1).read_to_end(&mut bytes).ok()?;
    if bytes.len() as u64 > MAX_UNIT_SUMMARY_BYTES {
        return None;
    }
    serde_json::from_slice(&bytes).ok()
}

impl ObservationSource for UnitSummarySource {
    fn source_id(&self) -> &'static str {
        "unit-summary"
    }

    fn observations(&self, root: &Path, window: &Window) -> Result<Vec<Observation>, SourceError> {
        let parsed_window = ParsedWindow::parse(window).map_err(|message| SourceError::ReadFailed {
            source_id: "unit-summary", message,
        })?;
        let state = root.join(".fgos");
        let assignments = state.join("assignments");
        if !real_directory(&state) || !real_directory(&assignments) {
            return Ok(Vec::new());
        }
        // Unit directories are direct children. No recursion into roles, runs,
        // protected data, outboxes, or a worker-planted unit tree.
        let mut entries = fs::read_dir(&assignments)
            .map_err(|err| SourceError::Io("unit-summary", err))?
            .filter_map(Result::ok).collect::<Vec<_>>();
        entries.sort_by_cached_key(|entry| entry.file_name());
        let mut observations = Vec::new();
        for entry in entries {
            let name = entry.file_name();
            let Some(name) = name.to_str().filter(|name| name.starts_with("unit-run-") && name.len() > 9) else {
                continue;
            };
            if !entry.file_type().is_ok_and(|kind| kind.is_dir()) {
                continue;
            }
            let Some(value) = read_summary(&entry.path().join("unit-summary.json")) else {
                continue;
            };
            if !valid_summary(&value, name) {
                continue;
            }
            let ts = value["settledAt"].as_str().expect("validated timestamp");
            let Some(timestamp) = parse_timestamp_millis(ts) else { continue; };
            if !parsed_window.contains(timestamp) {
                continue;
            }
            observations.push(Observation {
                ts: ts.to_owned(),
                subject: Subject { kind: SubjectKind::Run, id: format!("unit-run:{name}") },
                kind: "unit.settled".to_owned(),
                attrs: match value { Value::Object(attrs) => attrs, _ => unreachable!() },
                source: "unit-summary",
            });
        }
        observations.sort_by_cached_key(|observation| {
            parse_timestamp_millis(&observation.ts).expect("validated timestamp")
        });
        Ok(observations)
    }
}
