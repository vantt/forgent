//! Friction management for Observe (Lane B - Phase F5).

use crate::contract::{LegacyFrictionRecord, LegacyFrictionSource, Subject, SubjectKind};
use crate::shard::{read_all_json, shard_path};
use crate::store_lock::{acquire_store_lock, format_iso_now};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::{HashMap, HashSet};
use std::fs::OpenOptions;
use std::io::Write;
use std::path::Path;

pub const PUBLISHED_LAYERS: &[&str] = &[
    "verification",
    "state",
    "environment",
    "docs",
    "spec",
    "context",
    "task",
    "task-spec",
    "executor",
    "attestation",
];

pub const PUBLISHED_DISPOSITIONS: &[&str] = &["advisory", "blocked", "parked", "halted"];

pub const VALID_REASONS: &[&str] = &["answer", "done", "wontfix", "clarify-pass", "migrated"];

pub const VALID_DOC_TYPES: &[&str] = &["tutorial", "how-to", "reference", "explanation"];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CallerInfo {
    pub pid: u32,
    #[serde(rename = "sessionId", skip_serializing_if = "Option::is_none")]
    pub session_id: Option<String>,
}

pub fn current_caller() -> CallerInfo {
    let pid = std::env::var("FGOS_CALLER_PID")
        .ok()
        .and_then(|p| p.parse::<u32>().ok())
        .unwrap_or_else(std::process::id);
    let session_id = std::env::var("FGOS_SESSION_ID")
        .ok()
        .filter(|s| !s.trim().is_empty());
    CallerInfo { pid, session_id }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrictionInput {
    pub subject: Subject,
    pub layer: String,
    #[serde(rename = "errorClass")]
    pub error_class: String,
    pub disposition: String,
    pub detail: String,
    pub producer: String,
    pub attempts: Option<u32>,
    #[serde(rename = "docType")]
    pub doc_type: Option<String>,
}

pub fn validate_record_input(input: &FrictionInput) -> Result<(), String> {
    if input.subject.id.trim().is_empty() {
        return Err("subject id must not be empty".to_string());
    }
    if !PUBLISHED_LAYERS.contains(&input.layer.as_str()) {
        return Err(format!(
            "invalid layer \"{}\". Published layers: {}",
            input.layer,
            PUBLISHED_LAYERS.join(", ")
        ));
    }
    if !PUBLISHED_DISPOSITIONS.contains(&input.disposition.as_str()) {
        return Err(format!(
            "invalid disposition \"{}\". Allowed dispositions: {}",
            input.disposition,
            PUBLISHED_DISPOSITIONS.join(", ")
        ));
    }
    if input.error_class.trim().is_empty() {
        return Err("errorClass must not be empty".to_string());
    }
    if input.producer.trim().is_empty() {
        return Err("producer must not be empty".to_string());
    }
    if let Some(dt) = &input.doc_type {
        if !VALID_DOC_TYPES.contains(&dt.as_str()) {
            return Err(format!(
                "invalid docType \"{}\". Allowed docTypes: {}",
                dt,
                VALID_DOC_TYPES.join(", ")
            ));
        }
    }
    Ok(())
}

pub fn validate_resolve_input(reason: &str, by: &str) -> Result<(), String> {
    if !VALID_REASONS.contains(&reason) {
        return Err(format!(
            "invalid resolve reason \"{}\". Allowed reasons: {}",
            reason,
            VALID_REASONS.join(", ")
        ));
    }
    if by.trim().is_empty() {
        return Err("by must not be empty".to_string());
    }
    Ok(())
}

/// Appends a raw string line to the given file path using O_APPEND and fsync.
fn append_line(path: &Path, line: &str) -> Result<(), std::io::Error> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)?;
    writeln!(file, "{}", line)?;
    file.sync_all()?;
    Ok(())
}

/// Runs lazy migration under store lock.
/// Reads existing records in `.fgos/observe/friction/*.jsonl` to gather already migrated `(src, seq)` pairs.
/// Reads unmigrated legacy frictions from `legacy_sources`.
/// Appends them to `<root>/.fgos/observe/friction/<writerId>.jsonl` atomically via `.tmp`.
pub fn run_lazy_migration(
    root: &Path,
    legacy_sources: &[Box<dyn LegacyFrictionSource>],
) -> Result<usize, String> {
    if legacy_sources.is_empty() {
        return Ok(0);
    }

    let existing_records = read_all_json(root, "friction").unwrap_or_default();
    let mut already_migrated: HashSet<(String, u64)> = HashSet::new();

    for rec in &existing_records {
        if let Some(legacy) = rec.get("legacy") {
            if let (Some(src), Some(seq)) = (
                legacy.get("src").and_then(|s| s.as_str()),
                legacy.get("seq").and_then(|s| s.as_u64()),
            ) {
                already_migrated.insert((src.to_string(), seq));
            }
        }
    }

    let mut to_migrate: Vec<LegacyFrictionRecord> = Vec::new();
    for source in legacy_sources {
        match source.read_legacy_frictions(root, None) {
            Ok(records) => {
                for r in records {
                    if !already_migrated.contains(&(r.src.clone(), r.seq)) {
                        to_migrate.push(r);
                    }
                }
            }
            Err(e) => {
                eprintln!("fgos: warning: legacy friction source failed: {:?}", e);
            }
        }
    }

    if to_migrate.is_empty() {
        return Ok(0);
    }

    let dest_path = shard_path(root, "friction").map_err(|e| e.to_string())?;
    let tmp_path = dest_path.with_extension("jsonl.tmp");

    let count = to_migrate.len();
    let mut resolved_count = 0;
    let caller = current_caller();

    // Write batch to .tmp
    {
        let mut tmp_file = OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(&tmp_path)
            .map_err(|e| e.to_string())?;

        for r in &to_migrate {
            let rec_val = json!({
                "v": 1,
                "type": "friction-recorded",
                "ts": r.ts,
                "subject": {
                    "kind": "work",
                    "id": r.subject_id
                },
                "layer": r.layer,
                "errorClass": r.error_class,
                "disposition": r.disposition,
                "detail": r.detail,
                "attempts": r.attempts,
                "docType": r.doc_type,
                "producer": r.producer,
                "caller": caller,
                "legacy": {
                    "src": r.src,
                    "seq": r.seq
                }
            });
            writeln!(tmp_file, "{}", serde_json::to_string(&rec_val).unwrap())
                .map_err(|e| e.to_string())?;

            if r.resolved {
                resolved_count += 1;
                let (reason, resolve_ts) = match r.resolve_reason.as_deref() {
                    Some(s) if s.contains('@') => {
                        let (kind, ts) = s.split_once('@').unwrap();
                        (kind.to_string(), ts.to_string())
                    }
                    Some(s) => (s.to_string(), format!("{}~", r.ts)),
                    None => ("migrated".to_string(), format!("{}~", r.ts)),
                };

                let res_val = json!({
                    "v": 1,
                    "type": "friction-resolved",
                    "ts": resolve_ts,
                    "subject": {
                        "kind": "work",
                        "id": r.subject_id
                    },
                    "reason": reason,
                    "by": "work",
                    "caller": caller,
                    "legacy": {
                        "src": r.src,
                        "seq": r.seq
                    }
                });
                writeln!(tmp_file, "{}", serde_json::to_string(&res_val).unwrap())
                    .map_err(|e| e.to_string())?;
            }
        }

        let migration_val = json!({
            "v": 1,
            "type": "migration",
            "from": "work.friction",
            "count": count,
            "resolved": resolved_count,
            "ts": format_iso_now()
        });
        writeln!(
            tmp_file,
            "{}",
            serde_json::to_string(&migration_val).unwrap()
        )
        .map_err(|e| e.to_string())?;

        tmp_file.sync_all().map_err(|e| e.to_string())?;
    }

    // Append tmp contents to dest_path
    let tmp_bytes = std::fs::read(&tmp_path).map_err(|e| e.to_string())?;
    {
        let mut dest_file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&dest_path)
            .map_err(|e| e.to_string())?;
        dest_file.write_all(&tmp_bytes).map_err(|e| e.to_string())?;
        dest_file.sync_all().map_err(|e| e.to_string())?;
    }

    let _ = std::fs::remove_file(&tmp_path);
    Ok(count)
}

/// Records a new friction event.
pub fn record(
    root: &Path,
    input: FrictionInput,
    legacy_sources: &[Box<dyn LegacyFrictionSource>],
) -> Result<Value, String> {
    validate_record_input(&input)?;

    let _guard = acquire_store_lock(root).map_err(|e| format!("store lock error: {}", e))?;
    let _ = run_lazy_migration(root, legacy_sources);

    let ts = format_iso_now();
    let caller = current_caller();

    let record_val = json!({
        "v": 1,
        "type": "friction-recorded",
        "ts": ts,
        "subject": {
            "kind": match input.subject.kind {
                SubjectKind::Run => "run",
                SubjectKind::Session => "session",
                SubjectKind::Executor => "executor",
                SubjectKind::Case => "case",
                SubjectKind::Work => "work",
            },
            "id": input.subject.id
        },
        "layer": input.layer,
        "errorClass": input.error_class,
        "disposition": input.disposition,
        "detail": input.detail,
        "attempts": input.attempts,
        "docType": input.doc_type,
        "producer": input.producer,
        "caller": caller
    });

    let shard = shard_path(root, "friction").map_err(|e| e.to_string())?;
    let line = serde_json::to_string(&record_val).map_err(|e| e.to_string())?;
    append_line(&shard, &line).map_err(|e| e.to_string())?;

    Ok(json!({
        "ok": true,
        "ts": ts,
        "subject": input.subject.to_string_repr()
    }))
}

/// Resolves an existing friction event for a subject.
pub fn resolve(
    root: &Path,
    subject: Subject,
    reason: &str,
    by: &str,
    legacy_sources: &[Box<dyn LegacyFrictionSource>],
) -> Result<Value, String> {
    validate_resolve_input(reason, by)?;

    let _guard = acquire_store_lock(root).map_err(|e| format!("store lock error: {}", e))?;
    let _ = run_lazy_migration(root, legacy_sources);

    let ts = format_iso_now();
    let caller = current_caller();

    let resolved_val = json!({
        "v": 1,
        "type": "friction-resolved",
        "ts": ts,
        "subject": {
            "kind": match subject.kind {
                SubjectKind::Run => "run",
                SubjectKind::Session => "session",
                SubjectKind::Executor => "executor",
                SubjectKind::Case => "case",
                SubjectKind::Work => "work",
            },
            "id": subject.id
        },
        "reason": reason,
        "by": by,
        "caller": caller
    });

    let shard = shard_path(root, "friction").map_err(|e| e.to_string())?;
    let line = serde_json::to_string(&resolved_val).map_err(|e| e.to_string())?;
    append_line(&shard, &line).map_err(|e| e.to_string())?;

    Ok(json!({
        "ok": true,
        "ts": ts,
        "subject": subject.to_string_repr(),
        "reason": reason,
        "by": by
    }))
}

/// Lists friction events with optional filters.
pub fn list(
    root: &Path,
    kind_filter: Option<&str>,
    layer_filter: Option<&str>,
    since_filter: Option<&str>,
) -> Result<Value, String> {
    let all = read_all_json(root, "friction").map_err(|e| e.to_string())?;
    let mut matches = Vec::new();

    for item in all {
        if item.get("type").and_then(|t| t.as_str()) != Some("friction-recorded") {
            continue;
        }

        if let Some(k) = kind_filter {
            let subj_kind = item
                .get("subject")
                .and_then(|s| s.get("kind"))
                .and_then(|k| k.as_str())
                .unwrap_or("");
            if subj_kind != k {
                continue;
            }
        }

        if let Some(l) = layer_filter {
            let layer = item.get("layer").and_then(|l| l.as_str()).unwrap_or("");
            if layer != l {
                continue;
            }
        }

        if let Some(since) = since_filter {
            let ts = item.get("ts").and_then(|t| t.as_str()).unwrap_or("");
            if ts < since {
                continue;
            }
        }

        matches.push(item);
    }

    Ok(json!(matches))
}

/// Shows friction history and current status for a single subject.
pub fn show(root: &Path, subject_str: &str) -> Result<Value, String> {
    let subject = Subject::parse(subject_str)
        .ok_or_else(|| format!("invalid subject \"{}\". Expected format kind:id", subject_str))?;

    let all = read_all_json(root, "friction").map_err(|e| e.to_string())?;
    let mut recorded = Vec::new();
    let mut resolutions: Vec<String> = Vec::new();

    let kind_str = match subject.kind {
        SubjectKind::Run => "run",
        SubjectKind::Session => "session",
        SubjectKind::Executor => "executor",
        SubjectKind::Case => "case",
        SubjectKind::Work => "work",
    };

    for item in all {
        let item_kind = item
            .get("subject")
            .and_then(|s| s.get("kind"))
            .and_then(|k| k.as_str())
            .unwrap_or("");
        let item_id = item
            .get("subject")
            .and_then(|s| s.get("id"))
            .and_then(|i| i.as_str())
            .unwrap_or("");

        if item_kind == kind_str && item_id == subject.id {
            let event_type = item.get("type").and_then(|t| t.as_str()).unwrap_or("");
            if event_type == "friction-recorded" {
                recorded.push(item);
            } else if event_type == "friction-resolved" {
                if let Some(ts) = item.get("ts").and_then(|t| t.as_str()) {
                    resolutions.push(ts.to_string());
                }
            }
        }
    }

    let mut unsettled_count = 0;
    for rec in &recorded {
        let rec_ts = rec.get("ts").and_then(|t| t.as_str()).unwrap_or("");
        if !resolutions.iter().any(|res_ts| res_ts.as_str() > rec_ts) {
            unsettled_count += 1;
        }
    }

    Ok(json!({
        "subject": subject.to_string_repr(),
        "unsettled": unsettled_count,
        "totalRecorded": recorded.len(),
        "totalResolved": resolutions.len(),
        "records": recorded
    }))
}

/// Ranks open friction candidates by unsettled score (highest first).
pub fn rank(root: &Path, limit: Option<usize>) -> Result<Value, String> {
    let all = read_all_json(root, "friction").map_err(|e| e.to_string())?;

    let mut recorded_by_subject: HashMap<(String, String), Vec<Value>> = HashMap::new();
    let mut resolutions_by_subject: HashMap<(String, String), Vec<String>> = HashMap::new();

    for item in all {
        let event_type = item.get("type").and_then(|t| t.as_str()).unwrap_or("");
        let item_kind = item
            .get("subject")
            .and_then(|s| s.get("kind"))
            .and_then(|k| k.as_str())
            .unwrap_or("")
            .to_string();
        let item_id = item
            .get("subject")
            .and_then(|s| s.get("id"))
            .and_then(|i| i.as_str())
            .unwrap_or("")
            .to_string();

        if item_id.is_empty() {
            continue;
        }

        let key = (item_kind, item_id);
        if event_type == "friction-recorded" {
            recorded_by_subject.entry(key).or_default().push(item);
        } else if event_type == "friction-resolved" {
            if let Some(ts) = item.get("ts").and_then(|t| t.as_str()) {
                resolutions_by_subject
                    .entry(key)
                    .or_default()
                    .push(ts.to_string());
            }
        }
    }

    let mut candidates = Vec::new();
    for (key, records) in recorded_by_subject {
        let resolutions = resolutions_by_subject.get(&key);
        let mut unsettled_records = Vec::new();

        for rec in records {
            let rec_ts = rec.get("ts").and_then(|t| t.as_str()).unwrap_or("");
            let is_settled = match resolutions {
                Some(res_list) => res_list.iter().any(|r_ts| r_ts.as_str() > rec_ts),
                None => false,
            };
            if !is_settled {
                unsettled_records.push(rec);
            }
        }

        if !unsettled_records.is_empty() {
            // Find latest by ts
            let latest = unsettled_records
                .iter()
                .max_by(|a, b| {
                    let ts_a = a.get("ts").and_then(|t| t.as_str()).unwrap_or("");
                    let ts_b = b.get("ts").and_then(|t| t.as_str()).unwrap_or("");
                    ts_a.cmp(ts_b)
                })
                .unwrap();

            let score = unsettled_records.len() * 2;
            let (kind, id) = key;
            candidates.push(json!({
                "id": id,
                "kind": kind,
                "score": score,
                "disposition": latest.get("disposition").cloned().unwrap_or(Value::Null),
                "errorClass": latest.get("errorClass").cloned().unwrap_or(Value::Null),
                "layer": latest.get("layer").cloned().unwrap_or(Value::Null),
                "detail": latest.get("detail").cloned().unwrap_or(Value::Null),
                "attempts": latest.get("attempts").cloned().unwrap_or(Value::Null),
            }));
        }
    }

    // Sort: score descending, then id ascending
    candidates.sort_by(|a, b| {
        let score_a = a.get("score").and_then(|s| s.as_i64()).unwrap_or(0);
        let score_b = b.get("score").and_then(|s| s.as_i64()).unwrap_or(0);
        score_b.cmp(&score_a).then_with(|| {
            let id_a = a.get("id").and_then(|s| s.as_str()).unwrap_or("");
            let id_b = b.get("id").and_then(|s| s.as_str()).unwrap_or("");
            id_a.cmp(id_b)
        })
    });

    if let Some(lim) = limit {
        candidates.truncate(lim);
    }

    Ok(json!(candidates))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_friction_record_resolve_lifecycle() {
        let tmp = std::env::temp_dir().join(format!("fgos-fric-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&tmp);
        fs::create_dir_all(&tmp).unwrap();

        let subj = Subject::parse("work:tsk-abc").unwrap();
        let input = FrictionInput {
            subject: subj.clone(),
            layer: "verification".to_string(),
            error_class: "verify-miss".to_string(),
            disposition: "blocked".to_string(),
            detail: "test detail".to_string(),
            producer: "runner.loop".to_string(),
            attempts: Some(1),
            doc_type: None,
        };

        let rec_res = record(&tmp, input, &[]).unwrap();
        assert_eq!(rec_res["ok"], true);

        // List
        let list_res = list(&tmp, None, None, None).unwrap();
        let arr = list_res.as_array().unwrap();
        assert_eq!(arr.len(), 1);
        assert_eq!(arr[0]["subject"]["id"], "tsk-abc");

        // Rank before resolve
        let rank_res = rank(&tmp, None).unwrap();
        let rarr = rank_res.as_array().unwrap();
        assert_eq!(rarr.len(), 1);
        assert_eq!(rarr[0]["id"], "tsk-abc");
        assert_eq!(rarr[0]["score"], 2);

        // Show before resolve
        let show_res = show(&tmp, "work:tsk-abc").unwrap();
        assert_eq!(show_res["unsettled"], 1);

        // Resolve
        let res_res = resolve(&tmp, subj.clone(), "done", "work", &[]).unwrap();
        assert_eq!(res_res["ok"], true);

        // Rank after resolve
        let rank_res_after = rank(&tmp, None).unwrap();
        assert_eq!(rank_res_after.as_array().unwrap().len(), 0);

        // Show after resolve
        let show_res_after = show(&tmp, "work:tsk-abc").unwrap();
        assert_eq!(show_res_after["unsettled"], 0);

        let _ = fs::remove_dir_all(&tmp);
    }

    struct MockLegacySource {
        records: Vec<LegacyFrictionRecord>,
    }

    impl LegacyFrictionSource for MockLegacySource {
        fn source_id(&self) -> &'static str {
            "mock"
        }
        fn read_legacy_frictions(
            &self,
            _root: &Path,
            _since_cursor: Option<(&str, u64)>,
        ) -> Result<Vec<LegacyFrictionRecord>, crate::contract::SourceError> {
            Ok(self.records.clone())
        }
    }

    #[test]
    fn test_friction_lazy_migration_and_deduplication() {
        let tmp = std::env::temp_dir().join(format!("fgos-fric-mig-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&tmp);
        fs::create_dir_all(&tmp).unwrap();

        let legacy_records = vec![
            LegacyFrictionRecord {
                src: "events.jsonl".to_string(),
                seq: 10,
                ts: "2026-07-01T10:00:00Z".to_string(),
                subject_id: "tsk-mig-1".to_string(),
                layer: "verification".to_string(),
                error_class: "verify-miss".to_string(),
                disposition: "blocked".to_string(),
                detail: "failed test".to_string(),
                attempts: Some(1),
                doc_type: None,
                producer: Some("runner.loop".to_string()),
                resolved: true,
                resolve_reason: Some("done@2026-07-01T10:05:00Z".to_string()),
            },
            LegacyFrictionRecord {
                src: "events.jsonl".to_string(),
                seq: 11,
                ts: "2026-07-01T10:10:00Z".to_string(),
                subject_id: "tsk-mig-2".to_string(),
                layer: "state".to_string(),
                error_class: "merge-conflict".to_string(),
                disposition: "blocked".to_string(),
                detail: "merge conflict".to_string(),
                attempts: Some(1),
                doc_type: None,
                producer: Some("runner.loop".to_string()),
                resolved: false,
                resolve_reason: None,
            },
        ];

        let source: Box<dyn LegacyFrictionSource> = Box::new(MockLegacySource {
            records: legacy_records,
        });
        let sources = vec![source];

        // First record triggers lazy migration
        let input = FrictionInput {
            subject: Subject::parse("work:tsk-new").unwrap(),
            layer: "verification".to_string(),
            error_class: "verify-miss".to_string(),
            disposition: "advisory".to_string(),
            detail: "fresh friction".to_string(),
            producer: "test".to_string(),
            attempts: None,
            doc_type: None,
        };
        record(&tmp, input, &sources).unwrap();

        // Check rank: tsk-mig-1 was resolved, so only tsk-mig-2 and tsk-new should be in rank!
        let rank_res = rank(&tmp, None).unwrap();
        let rarr = rank_res.as_array().unwrap();
        assert_eq!(rarr.len(), 2);
        let ids: Vec<&str> = rarr.iter().map(|c| c["id"].as_str().unwrap()).collect();
        assert!(ids.contains(&"tsk-mig-2"));
        assert!(ids.contains(&"tsk-new"));
        assert!(!ids.contains(&"tsk-mig-1"));

        // Second record triggers lazy migration again, but nothing new should be imported
        let input2 = FrictionInput {
            subject: Subject::parse("work:tsk-new-2").unwrap(),
            layer: "environment".to_string(),
            error_class: "worker-timeout".to_string(),
            disposition: "halted".to_string(),
            detail: "timeout".to_string(),
            producer: "test".to_string(),
            attempts: None,
            doc_type: None,
        };
        record(&tmp, input2, &sources).unwrap();

        // Show tsk-mig-1: totalRecorded = 1, totalResolved = 1, unsettled = 0
        let show_res = show(&tmp, "work:tsk-mig-1").unwrap();
        assert_eq!(show_res["unsettled"], 0);
        assert_eq!(show_res["totalRecorded"], 1);
        assert_eq!(show_res["totalResolved"], 1);

        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn test_friction_validation_errors() {
        let tmp = std::env::temp_dir().join(format!("fgos-fric-val-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&tmp);
        fs::create_dir_all(&tmp).unwrap();

        // Invalid layer
        let input = FrictionInput {
            subject: Subject::parse("work:tsk-bad").unwrap(),
            layer: "invalid-layer".to_string(),
            error_class: "err".to_string(),
            disposition: "advisory".to_string(),
            detail: "x".to_string(),
            producer: "test".to_string(),
            attempts: None,
            doc_type: None,
        };
        assert!(record(&tmp, input, &[]).is_err());

        // Invalid docType
        let input_doctype = FrictionInput {
            subject: Subject::parse("work:tsk-bad").unwrap(),
            layer: "verification".to_string(),
            error_class: "err".to_string(),
            disposition: "advisory".to_string(),
            detail: "x".to_string(),
            producer: "test".to_string(),
            attempts: None,
            doc_type: Some("nonexistent".to_string()),
        };
        assert!(record(&tmp, input_doctype, &[]).is_err());

        // Invalid resolve reason
        assert!(resolve(&tmp, Subject::parse("work:tsk-bad").unwrap(), "bad-reason", "user", &[]).is_err());

        let _ = fs::remove_dir_all(&tmp);
    }
}
