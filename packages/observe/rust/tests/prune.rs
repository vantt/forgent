//! Owning tests for Observe prune door:
//! - Record records through RecordDoor (including fgos.coordination.act).
//! - Verify dry-run removes nothing from disk and reports counts/ids.
//! - Verify apply removes only eligible prunable records (older than 30d or settled).
//! - Verify non-prunable kinds are never removed.
//! - Verify held lock fails open without partial writes.

use fgos_observe::record::registry::{EmbeddedDeclaration, Registry};
use fgos_observe::record::store::{
    parse_retention_duration, prune, prune_with_lock_wait, PruneError, PruneReport, RecordDoor,
};
use fgos_observe::record::types::{AttrValue, Basis, Origin, Record, SubjectRef, RECORD_VERSION};
use fgos_observe::shard::{read_store, UnsafeShard};
use fgos_observe::store_lock::acquire_store_lock_within;
use fgos_observe::time::now_iso;
use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;

const EMBEDDED_SUPERVISION: EmbeddedDeclaration = EmbeddedDeclaration {
    label: "supervision",
    json: include_str!("../../../supervision/rust/observe-kinds.json"),
};

fn temp_root(tag: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let dir = std::env::temp_dir().join(format!(
        "fgos-observe-prune-{tag}-{}-{nanos}",
        std::process::id()
    ));
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn door(root: &Path) -> RecordDoor {
    RecordDoor::new(root.to_path_buf(), vec![EMBEDDED_SUPERVISION], None)
}

fn coordination_record(id: &str, ts: &str, subject_id: &str) -> Record {
    let mut attrs = BTreeMap::new();
    attrs.insert(
        "fgos.coordination.act".to_string(),
        AttrValue::Str("handoff".to_string()),
    );
    attrs.insert(
        "fgos.coordination.from".to_string(),
        AttrValue::Str("lead".to_string()),
    );
    attrs.insert(
        "fgos.coordination.to".to_string(),
        AttrValue::Str("worker".to_string()),
    );
    attrs.insert(
        "fgos.coordination.outcome".to_string(),
        AttrValue::Str("success".to_string()),
    );
    Record {
        v: RECORD_VERSION,
        id: id.to_string(),
        kind: "fgos.coordination.act".to_string(),
        ts: ts.to_string(),
        end_ts: None,
        subject: SubjectRef {
            kind: "session".to_string(),
            id: subject_id.to_string(),
        },
        refs: Vec::new(),
        attrs,
        measures: BTreeMap::new(),
        basis: Basis::Observed,
        origin: Origin {
            source: "test".to_string(),
            ..Default::default()
        },
        detail: None,
        redaction: None,
    }
}

fn wake_record(id: &str, ts: &str, subject_id: &str) -> Record {
    let mut attrs = BTreeMap::new();
    attrs.insert(
        "fgos.supervisor.trigger".to_string(),
        AttrValue::Str("timer".to_string()),
    );
    attrs.insert(
        "fgos.supervisor.outcome".to_string(),
        AttrValue::Str("started".to_string()),
    );
    Record {
        v: RECORD_VERSION,
        id: id.to_string(),
        kind: "fgos.supervisor.wake".to_string(),
        ts: ts.to_string(),
        end_ts: None,
        subject: SubjectRef {
            kind: "session".to_string(),
            id: subject_id.to_string(),
        },
        refs: Vec::new(),
        attrs,
        measures: BTreeMap::new(),
        basis: Basis::Observed,
        origin: Origin {
            source: "test".to_string(),
            ..Default::default()
        },
        detail: None,
        redaction: None,
    }
}

#[test]
fn registry_prunable_and_retention_metadata() {
    let registry = Registry::from_embedded(&[EMBEDDED_SUPERVISION]).unwrap();
    assert!(registry.is_prunable("fgos.coordination.act"));
    assert_eq!(registry.retention("fgos.coordination.act"), Some("30d"));

    assert!(!registry.is_prunable("fgos.supervisor.wake"));
    assert_eq!(registry.retention("fgos.supervisor.wake"), None);

    assert!(!registry.is_prunable("fgos.watcher.tick"));
    assert!(!registry.is_prunable("unknown.kind"));
}

#[test]
fn retention_duration_parser_supports_units() {
    assert_eq!(parse_retention_duration(None).unwrap(), 30 * 86_400 * 1000);
    assert_eq!(
        parse_retention_duration(Some("30d")).unwrap(),
        30 * 86_400 * 1000
    );
    assert_eq!(
        parse_retention_duration(Some("7d")).unwrap(),
        7 * 86_400 * 1000
    );
    assert_eq!(
        parse_retention_duration(Some("24h")).unwrap(),
        24 * 3600 * 1000
    );
    assert_eq!(
        parse_retention_duration(Some("60m")).unwrap(),
        60 * 60 * 1000
    );
    assert_eq!(parse_retention_duration(Some("10s")).unwrap(), 10 * 1000);
    assert!(parse_retention_duration(Some("bad")).is_err());
}

#[test]
fn dry_run_removes_nothing_from_disk_and_reports_counts_and_ids() {
    let tmp = temp_root("dry-run");
    let d = door(&tmp);

    // Write:
    // 1. Old prunable record (> 30d ago)
    let old_rec = coordination_record("act-old", "2025-01-01T00:00:00.000Z", "s-1");
    assert_eq!(
        d.write(old_rec.clone()),
        fgos_observe::record::WriteOutcome::Written
    );

    // 2. Recent prunable record (< 30d ago)
    let recent_rec = coordination_record("act-recent", &now_iso(), "s-2");
    assert_eq!(
        d.write(recent_rec.clone()),
        fgos_observe::record::WriteOutcome::Written
    );

    // 3. Non-prunable record
    let wake_rec = wake_record("wake-1", "2025-01-01T00:00:00.000Z", "s-3");
    assert_eq!(
        d.write(wake_rec.clone()),
        fgos_observe::record::WriteOutcome::Written
    );

    // Dry-run prune (apply: false)
    let report = d.prune(&[], false).expect("dry-run prune");

    assert_eq!(report.scanned, 3);
    assert_eq!(report.prunable_found, 2);
    assert_eq!(report.pruned, 1);
    assert_eq!(report.ids, vec!["act-old"]);

    // Verify disk still has all 3 records
    let read = read_store(&tmp, "records", UnsafeShard::Fail).unwrap();
    assert_eq!(read.records.len(), 3);
    let ids: Vec<&str> = read
        .records
        .iter()
        .map(|r| r.value["id"].as_str().unwrap())
        .collect();
    assert_eq!(ids, vec!["act-old", "act-recent", "wake-1"]);

    let _ = fs::remove_dir_all(&tmp);
}

#[test]
fn apply_removes_only_eligible_prunable_records_older_or_settled() {
    let tmp = temp_root("apply");
    let d = door(&tmp);

    // 1. Old prunable record (older than 30d, not in settled list) -> eligible
    let r1 = coordination_record(
        "act-old-unsettled",
        "2025-01-01T00:00:00.000Z",
        "s-unsettled",
    );
    assert_eq!(d.write(r1), fgos_observe::record::WriteOutcome::Written);

    // 2. Recent prunable record (subject in settled list) -> eligible
    let r2 = coordination_record("act-recent-settled", &now_iso(), "s-settled");
    assert_eq!(d.write(r2), fgos_observe::record::WriteOutcome::Written);

    // 3. Recent prunable record (not settled) -> NOT eligible
    let r3 = coordination_record("act-recent-unsettled", &now_iso(), "s-active");
    assert_eq!(d.write(r3), fgos_observe::record::WriteOutcome::Written);

    // 4. Non-prunable record (older than 30d and settled subject) -> NOT eligible
    let r4 = wake_record("wake-old-settled", "2025-01-01T00:00:00.000Z", "s-settled");
    assert_eq!(d.write(r4), fgos_observe::record::WriteOutcome::Written);

    let settled = vec![SubjectRef {
        kind: "session".to_string(),
        id: "s-settled".to_string(),
    }];

    // Apply prune
    let report = d.prune(&settled, true).expect("apply prune");

    assert_eq!(report.scanned, 4);
    assert_eq!(report.prunable_found, 3);
    assert_eq!(report.pruned, 2);
    assert!(report.ids.contains(&"act-old-unsettled".to_string()));
    assert!(report.ids.contains(&"act-recent-settled".to_string()));

    // Verify disk now only contains the 2 kept records in original relative order
    let read = read_store(&tmp, "records", UnsafeShard::Fail).unwrap();
    assert_eq!(read.records.len(), 2);
    let ids: Vec<&str> = read
        .records
        .iter()
        .map(|r| r.value["id"].as_str().unwrap())
        .collect();
    assert_eq!(ids, vec!["act-recent-unsettled", "wake-old-settled"]);

    let _ = fs::remove_dir_all(&tmp);
}

#[test]
fn non_prunable_kinds_are_never_removed() {
    let tmp = temp_root("non-prunable");
    let d = door(&tmp);

    let wake1 = wake_record("w-1", "2020-01-01T00:00:00.000Z", "s-1");
    let wake2 = wake_record("w-2", "2021-01-01T00:00:00.000Z", "s-2");
    assert_eq!(d.write(wake1), fgos_observe::record::WriteOutcome::Written);
    assert_eq!(d.write(wake2), fgos_observe::record::WriteOutcome::Written);

    let settled = vec![
        SubjectRef {
            kind: "session".to_string(),
            id: "s-1".to_string(),
        },
        SubjectRef {
            kind: "session".to_string(),
            id: "s-2".to_string(),
        },
    ];

    let report = d.prune(&settled, true).expect("prune non-prunable");
    assert_eq!(report.scanned, 2);
    assert_eq!(report.prunable_found, 0);
    assert_eq!(report.pruned, 0);
    assert!(report.ids.is_empty());

    let read = read_store(&tmp, "records", UnsafeShard::Fail).unwrap();
    assert_eq!(read.records.len(), 2);

    let _ = fs::remove_dir_all(&tmp);
}

#[test]
fn held_lock_fails_open_without_partial_writes() {
    let tmp = temp_root("held-lock");
    let d = door(&tmp);

    let old_rec = coordination_record("act-lock-test", "2025-01-01T00:00:00.000Z", "s-1");
    assert_eq!(
        d.write(old_rec),
        fgos_observe::record::WriteOutcome::Written
    );

    // Hold the store lock externally
    let lock_guard = acquire_store_lock_within(&tmp, Duration::from_secs(2)).expect("acquire lock");

    // Prune with a very short timeout (50ms)
    let registry = Registry::from_embedded(&[EMBEDDED_SUPERVISION]).unwrap();
    let res = prune_with_lock_wait(&tmp, &registry, &[], true, Duration::from_millis(50));

    match res {
        Err(PruneError::LockTimeout(_)) => {}
        other => panic!("expected PruneError::LockTimeout, got: {other:?}"),
    }

    // Verify record on disk was NOT touched (no partial writes)
    drop(lock_guard);

    let read = read_store(&tmp, "records", UnsafeShard::Fail).unwrap();
    assert_eq!(read.records.len(), 1);
    assert_eq!(
        read.records[0].value["id"].as_str().unwrap(),
        "act-lock-test"
    );

    // After release, prune succeeds
    let report: PruneReport = prune(&tmp, &registry, &[], true).expect("prune after release");
    assert_eq!(report.pruned, 1);

    let read_after = read_store(&tmp, "records", UnsafeShard::Fail).unwrap();
    assert_eq!(read_after.records.len(), 0);

    let _ = fs::remove_dir_all(&tmp);
}

#[test]
fn invalid_timestamp_returns_error() {
    let tmp = temp_root("bad-ts");
    let d = door(&tmp);

    // Write a prunable record with an unparseable timestamp
    // (Bypass door.write validation by writing to the shard file directly)
    let shard_dir = tmp.join(".fgos/observe/records");
    fs::create_dir_all(&shard_dir).unwrap();
    let bad_record = serde_json::json!({
        "v": RECORD_VERSION,
        "id": "act-bad-ts",
        "kind": "fgos.coordination.act",
        "ts": "invalid-timestamp",
        "subject": { "kind": "session", "id": "s-1" },
        "basis": "observed",
        "origin": { "source": "test" }
    });
    fs::write(
        shard_dir.join("test-shard.jsonl"),
        format!("{}\n", bad_record),
    )
    .unwrap();

    let res = d.prune(&[], true);
    match res {
        Err(PruneError::InvalidTimestamp(ts)) => assert_eq!(ts, "invalid-timestamp"),
        other => panic!("expected PruneError::InvalidTimestamp, got: {other:?}"),
    }

    let _ = fs::remove_dir_all(&tmp);
}
