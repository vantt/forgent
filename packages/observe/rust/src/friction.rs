//! Friction management for Observe: record, resolve, list, show, rank.

use crate::contract::{Subject, Window};
use crate::shard::{self, is_session_shard, StoredRecord, TornTail, UnsafeShard};
use crate::store_lock::acquire_store_lock;
use crate::time::{now_iso, ParsedWindow};
use fgos_host_runtime::civil_time::parse_rfc3339_millis;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
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

const STORE: &str = "friction";

/// Prefix of every refusal caused by the caller's input (never by the store), so
/// a client can tell the two apart from the first line of the host's error.
pub fn invalid_input(message: impl std::fmt::Display) -> String {
    format!("friction-invalid-input: {message}")
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CallerInfo {
    pub pid: u32,
    #[serde(rename = "sessionId", skip_serializing_if = "Option::is_none")]
    pub session_id: Option<String>,
}

pub fn current_caller() -> CallerInfo {
    let identity = fgos_identity::resolve_current(None);
    let session_id = match identity.source {
        fgos_identity::Source::Env | fgos_identity::Source::Registry => {
            Some(identity.id.to_string())
        }
        fgos_identity::Source::Pid | fgos_identity::Source::Unresolved => None,
    };
    CallerInfo { pid: std::process::id(), session_id }
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
        return Err(invalid_input("subject id must not be empty"));
    }
    if !PUBLISHED_LAYERS.contains(&input.layer.as_str()) {
        return Err(invalid_input(format!(
            "invalid layer \"{}\". Published layers: {}",
            input.layer,
            PUBLISHED_LAYERS.join(", ")
        )));
    }
    if !PUBLISHED_DISPOSITIONS.contains(&input.disposition.as_str()) {
        return Err(invalid_input(format!(
            "invalid disposition \"{}\". Allowed dispositions: {}",
            input.disposition,
            PUBLISHED_DISPOSITIONS.join(", ")
        )));
    }
    if input.error_class.trim().is_empty() {
        return Err(invalid_input("errorClass must not be empty"));
    }
    if input.producer.trim().is_empty() {
        return Err(invalid_input("producer must not be empty"));
    }
    if let Some(dt) = &input.doc_type {
        if !VALID_DOC_TYPES.contains(&dt.as_str()) {
            return Err(invalid_input(format!(
                "invalid docType \"{}\". Allowed docTypes: {}",
                dt,
                VALID_DOC_TYPES.join(", ")
            )));
        }
    }
    Ok(())
}

pub fn validate_resolve_input(reason: &str, by: &str) -> Result<(), String> {
    if !VALID_REASONS.contains(&reason) {
        return Err(invalid_input(format!(
            "invalid resolve reason \"{}\". Allowed reasons: {}",
            reason,
            VALID_REASONS.join(", ")
        )));
    }
    if by.trim().is_empty() {
        return Err(invalid_input("by must not be empty"));
    }
    Ok(())
}

/// A friction event with its stamp parsed once and the shard line it came from.
struct Event {
    value: Value,
    /// `None` only for a resolve whose stamp is free text (written by a past migration).
    millis: Option<i64>,
    shard: String,
    line: usize,
}

impl Event {
    fn kind(&self) -> &str {
        self.value.get("type").and_then(Value::as_str).unwrap_or("")
    }

    fn subject(&self) -> (String, String) {
        let field = |name: &str| {
            self.value
                .get("subject")
                .and_then(|s| s.get(name))
                .and_then(Value::as_str)
                .unwrap_or("")
                .to_string()
        };
        (field("kind"), field("id"))
    }
}

/// The instant of a stamp. A trailing `~` (written by a past migration for a
/// resolve with no stamp of its own) means "just after" the stamp before it.
fn stamp_millis(ts: &str) -> Option<i64> {
    match ts.strip_suffix('~') {
        Some(base) => parse_rfc3339_millis(base).map(|millis| millis + 1),
        None => parse_rfc3339_millis(ts),
    }
}

/// Whether `resolve` settles `record` (same subject). A later instant settles; an
/// equal instant settles only by file order inside one session-named shard
/// (`pid-<N>` shard names are not unique across machines); a resolve with no
/// instant settles the records before it in its own shard.
fn settles(resolve: &Event, record: &Event) -> bool {
    let earlier_line_of_same_shard = resolve.shard == record.shard && resolve.line > record.line;
    match (resolve.millis, record.millis) {
        (Some(resolved), Some(recorded)) if resolved != recorded => resolved > recorded,
        (Some(_), Some(_)) => earlier_line_of_same_shard && is_session_shard(&resolve.shard),
        _ => earlier_line_of_same_shard,
    }
}

fn is_settled(record: &Event, resolves: &[&Event]) -> bool {
    resolves.iter().any(|resolve| settles(resolve, record))
}

/// Every usable friction event ordered by instant. A bad line, or a record whose
/// stamp does not parse, is named on stderr and skipped; an unreadable store is
/// an error.
fn read_events(root: &Path) -> Result<Vec<Event>, String> {
    let store = shard::read_store(root, STORE, UnsafeShard::Fail).map_err(|e| e.to_string())?;
    let mut invalid = store.invalid;
    let mut events = Vec::new();
    for StoredRecord { value, shard, line } in store.records {
        let millis = value.get("ts").and_then(Value::as_str).and_then(stamp_millis);
        let is_resolve = value.get("type").and_then(Value::as_str) == Some("friction-resolved");
        if millis.is_none() && !is_resolve {
            invalid.push(shard::InvalidLine {
                file: format!(".fgos/observe/{STORE}/{shard}.jsonl"),
                line,
                reason: "ts is not an RFC 3339 instant".to_string(),
            });
            continue;
        }
        events.push(Event { value, millis, shard, line });
    }
    shard::warn_skipped(STORE, &invalid);
    events.sort_by_key(|event| event.millis);
    Ok(events)
}

fn append_values(root: &Path, values: &[Value]) -> Result<(), String> {
    let lines = values.iter().map(shard::encode_line).collect::<Result<Vec<_>, _>>()?;
    shard::append_lines(root, STORE, TornTail::Heal, &lines).map(drop).map_err(|e| e.to_string())
}

/// Records a new friction event.
pub fn record(root: &Path, input: FrictionInput) -> Result<Value, String> {
    validate_record_input(&input)?;

    let _guard = acquire_store_lock(root).map_err(|e| format!("store lock error: {}", e))?;

    let ts = now_iso();
    let record_val = json!({
        "v": 1,
        "type": "friction-recorded",
        "ts": ts,
        "subject": {
            "kind": input.subject.kind.as_str(),
            "id": input.subject.id
        },
        "layer": input.layer,
        "errorClass": input.error_class,
        "disposition": input.disposition,
        "detail": input.detail,
        "attempts": input.attempts,
        "docType": input.doc_type,
        "producer": input.producer,
        "caller": current_caller()
    });
    append_values(root, &[record_val])?;

    Ok(json!({
        "ok": true,
        "ts": ts,
        "subject": input.subject.to_string_repr()
    }))
}

/// Resolves an existing friction event for a subject.
pub fn resolve(root: &Path, subject: Subject, reason: &str, by: &str) -> Result<Value, String> {
    validate_resolve_input(reason, by)?;

    let _guard = acquire_store_lock(root).map_err(|e| format!("store lock error: {}", e))?;

    let ts = now_iso();
    let resolved_val = json!({
        "v": 1,
        "type": "friction-resolved",
        "ts": ts,
        "subject": {
            "kind": subject.kind.as_str(),
            "id": subject.id
        },
        "reason": reason,
        "by": by,
        "caller": current_caller()
    });
    append_values(root, &[resolved_val])?;

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
    let since = since_filter
        .map(|since| ParsedWindow::parse(&Window { since: Some(since.to_string()), until: None }))
        .transpose()
        .map_err(invalid_input)?;
    let matches: Vec<Value> = read_events(root)?
        .into_iter()
        .filter(|event| event.kind() == "friction-recorded")
        .filter(|event| kind_filter.is_none_or(|k| event.subject().0 == k))
        .filter(|event| {
            layer_filter.is_none_or(|l| event.value.get("layer").and_then(Value::as_str) == Some(l))
        })
        .filter(|event| since.is_none_or(|w| w.contains(event.millis.unwrap_or(i64::MIN))))
        .map(|event| event.value)
        .collect();
    Ok(json!(matches))
}

/// Shows friction history and current status for a single subject.
pub fn show(root: &Path, subject_str: &str) -> Result<Value, String> {
    let subject = Subject::parse(subject_str).ok_or_else(|| {
        invalid_input(format!(
            "invalid subject \"{}\". Expected format kind:id",
            subject_str
        ))
    })?;
    let key = (subject.kind.as_str().to_string(), subject.id.clone());

    let events: Vec<Event> =
        read_events(root)?.into_iter().filter(|event| event.subject() == key).collect();
    let recorded: Vec<&Event> = events.iter().filter(|e| e.kind() == "friction-recorded").collect();
    let resolves: Vec<&Event> = events.iter().filter(|e| e.kind() == "friction-resolved").collect();
    let unsettled_count = recorded.iter().filter(|rec| !is_settled(rec, &resolves)).count();

    Ok(json!({
        "subject": subject.to_string_repr(),
        "unsettled": unsettled_count,
        "totalRecorded": recorded.len(),
        "totalResolved": resolves.len(),
        "records": recorded.iter().map(|e| e.value.clone()).collect::<Vec<_>>()
    }))
}

/// Ranks open friction candidates by unsettled score (highest first).
pub fn rank(root: &Path, limit: Option<usize>) -> Result<Value, String> {
    let events = read_events(root)?;

    let mut recorded_by_subject: HashMap<(String, String), Vec<&Event>> = HashMap::new();
    let mut resolves_by_subject: HashMap<(String, String), Vec<&Event>> = HashMap::new();
    for event in &events {
        let key = event.subject();
        if key.1.is_empty() {
            continue;
        }
        match event.kind() {
            "friction-recorded" => recorded_by_subject.entry(key).or_default().push(event),
            "friction-resolved" => resolves_by_subject.entry(key).or_default().push(event),
            _ => {}
        }
    }

    let mut candidates = Vec::new();
    for (key, records) in recorded_by_subject {
        let resolves = resolves_by_subject.get(&key).map(Vec::as_slice).unwrap_or(&[]);
        let unsettled: Vec<&&Event> = records.iter().filter(|rec| !is_settled(rec, resolves)).collect();
        // Events are in instant order, so the last of the maxima is the latest.
        let Some(latest) = unsettled.iter().max_by_key(|event| event.millis) else {
            continue;
        };
        let (kind, id) = key;
        candidates.push(json!({
            "id": id,
            "kind": kind,
            "score": unsettled.len() * 2,
            "disposition": latest.value.get("disposition").cloned().unwrap_or(Value::Null),
            "errorClass": latest.value.get("errorClass").cloned().unwrap_or(Value::Null),
            "layer": latest.value.get("layer").cloned().unwrap_or(Value::Null),
            "detail": latest.value.get("detail").cloned().unwrap_or(Value::Null),
            "attempts": latest.value.get("attempts").cloned().unwrap_or(Value::Null),
        }));
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

        let rec_res = record(&tmp, input).unwrap();
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
        let res_res = resolve(&tmp, subj.clone(), "done", "work").unwrap();
        assert_eq!(res_res["ok"], true);

        // Rank after resolve
        let rank_res_after = rank(&tmp, None).unwrap();
        assert_eq!(rank_res_after.as_array().unwrap().len(), 0);

        // Show after resolve
        let show_res_after = show(&tmp, "work:tsk-abc").unwrap();
        assert_eq!(show_res_after["unsettled"], 0);

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
        let refusal = record(&tmp, input).unwrap_err();
        assert!(refusal.starts_with("friction-invalid-input: invalid layer"), "{refusal}");

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
        assert!(record(&tmp, input_doctype).is_err());

        // Invalid resolve reason
        assert!(resolve(
            &tmp,
            Subject::parse("work:tsk-bad").unwrap(),
            "bad-reason",
            "user"
        )
        .is_err());

        let _ = fs::remove_dir_all(&tmp);
    }

    fn temp_root(tag: &str) -> std::path::PathBuf {
        let tmp = std::env::temp_dir().join(format!("fgos-fric-{tag}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&tmp);
        fs::create_dir_all(tmp.join(".fgos/observe/friction")).unwrap();
        tmp
    }

    fn friction_dir(root: &Path) -> std::path::PathBuf {
        root.join(".fgos/observe/friction")
    }

    fn recorded_line(id: &str, ts: &str) -> String {
        json!({
            "v": 1, "type": "friction-recorded", "ts": ts,
            "subject": { "kind": "work", "id": id },
            "layer": "verification", "errorClass": "verify-miss", "disposition": "blocked",
            "detail": "d", "attempts": 1, "docType": null, "producer": "test",
            "caller": { "pid": 1 }
        })
        .to_string()
    }

    fn resolved_line(id: &str, ts: &str) -> String {
        json!({
            "v": 1, "type": "friction-resolved", "ts": ts,
            "subject": { "kind": "work", "id": id },
            "reason": "done", "by": "test", "caller": { "pid": 1 }
        })
        .to_string()
    }

    fn fresh_input(id: &str) -> FrictionInput {
        FrictionInput {
            subject: Subject::parse(&format!("work:{id}")).unwrap(),
            layer: "verification".to_string(),
            error_class: "verify-miss".to_string(),
            disposition: "advisory".to_string(),
            detail: "fresh".to_string(),
            producer: "test".to_string(),
            attempts: None,
            doc_type: None,
        }
    }

    fn listed_ids(root: &Path) -> Vec<String> {
        list(root, None, None, None)
            .expect("friction list must succeed")
            .as_array()
            .unwrap()
            .iter()
            .map(|item| item["subject"]["id"].as_str().unwrap().to_string())
            .collect()
    }

    #[test]
    fn a_resolve_at_the_same_instant_or_later_settles_the_record_whatever_the_stamp_precision() {
        let tmp = temp_root("instants");
        let lines = [
            recorded_line("tsk-equal", "2026-10-01T10:00:00.000Z"),
            resolved_line("tsk-equal", "2026-10-01T10:00:00.000Z"),
            recorded_line("tsk-legacy-stamp", "2026-07-01T10:00:00Z"),
            resolved_line("tsk-legacy-stamp", "2026-07-01T10:00:00.500Z"),
        ];
        fs::write(friction_dir(&tmp).join("one-writer.jsonl"), format!("{}\n", lines.join("\n"))).unwrap();

        for subject in ["work:tsk-equal", "work:tsk-legacy-stamp"] {
            assert_eq!(show(&tmp, subject).unwrap()["unsettled"], 0, "{subject} stays unsettled");
        }
        assert_eq!(rank(&tmp, None).unwrap(), json!([]), "rank still lists settled records");
        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn a_resolve_stamped_just_after_or_with_no_instant_settles_the_records_already_written_before_it() {
        let tmp = temp_root("legacy-stamps");
        let lines = [
            recorded_line("tsk-marker", "2026-07-01T10:00:00Z"),
            resolved_line("tsk-marker", "2026-07-01T10:00:00Z~"),
            recorded_line("tsk-free-text", "2026-07-01T10:00:00Z"),
            resolved_line("tsk-free-text", "sometime later"),
        ];
        fs::write(friction_dir(&tmp).join("one-writer.jsonl"), format!("{}\n", lines.join("\n"))).unwrap();

        for id in ["tsk-marker", "tsk-free-text"] {
            assert_eq!(show(&tmp, &format!("work:{id}")).unwrap()["unsettled"], 0, "{id} stays unsettled");
        }
        assert_eq!(rank(&tmp, None).unwrap(), json!([]));
        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn an_equal_instant_settles_in_a_session_shard_but_never_in_a_pid_shard() {
        let tmp = temp_root("pid-ties");
        let ts = "2026-10-01T10:00:00.000Z";
        for (shard, id) in [("pid-7", "tsk-pid"), ("session-a", "tsk-session")] {
            let lines = [recorded_line(id, ts), resolved_line(id, ts)];
            fs::write(friction_dir(&tmp).join(format!("{shard}.jsonl")), format!("{}\n", lines.join("\n"))).unwrap();
        }
        assert_eq!(show(&tmp, "work:tsk-pid").unwrap()["unsettled"], 1);
        assert_eq!(show(&tmp, "work:tsk-session").unwrap()["unsettled"], 0);
        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn a_record_with_an_unparsable_stamp_is_skipped_by_every_reader() {
        let tmp = temp_root("bad-stamp");
        let lines = [
            recorded_line("tsk-good", "2026-10-01T10:00:00.000Z"),
            recorded_line("tsk-bad-stamp", "yesterday"),
        ];
        fs::write(friction_dir(&tmp).join("w.jsonl"), format!("{}\n", lines.join("\n"))).unwrap();
        assert_eq!(listed_ids(&tmp), vec!["tsk-good".to_string()]);
        assert_eq!(show(&tmp, "work:tsk-bad-stamp").unwrap()["totalRecorded"], 0);
        let _ = fs::remove_dir_all(&tmp);
    }

    #[cfg(unix)]
    #[test]
    fn a_symlinked_writer_shard_is_refused_and_its_target_never_changes() {
        let tmp = temp_root("symlink");
        let external = temp_root("symlink-external");
        let target = external.join("outside.jsonl");
        let original = format!("{}\n", recorded_line("tsk-outside", "2026-10-01T10:00:00.000Z"));
        fs::write(&target, &original).unwrap();
        std::os::unix::fs::symlink(&target, crate::shard::shard_path(&tmp, "friction").unwrap()).unwrap();

        assert!(record(&tmp, fresh_input("tsk-new")).is_err(), "record wrote through a symlinked shard");
        assert_eq!(fs::read_to_string(&target).unwrap(), original);
        if let Ok(listed) = list(&tmp, None, None, None) {
            assert!(!listed.to_string().contains("tsk-outside"), "list read records through a symlinked shard");
        }
        let _ = fs::remove_dir_all(&tmp);
        let _ = fs::remove_dir_all(&external);
    }
}
