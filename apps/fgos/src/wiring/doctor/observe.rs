//! The doctor rows of the Observe component. All are read-only: the Observe directory is never created by a
//! doctor run (the store creates it on its first write), and the stores are read, not touched. The two pointer rows
//! (write health, friction migration) only warn and name the verb that shows or settles what they count.

use fgos_distribution::doctor::{FixResult, RowOutcome, RowResult};
use fgos_host_runtime::civil_time::{format_unix_millis_rfc3339, parse_rfc3339_millis};
use fgos_observe::contract::{RecordSource, Window};
use fgos_observe::record::store::{HealthSource, RECORDS_STORE};
use fgos_observe::shard::{read_store, UnsafeShard};
use serde_json::Value;
use std::collections::HashSet;
use std::path::{Path, PathBuf};

pub const ROW_IDS: &[&str] = &[
    "observe-dir-writable",
    "observe-host-resolvable",
    "observe-write-health",
    "observe-friction-migrated",
];

/// How far back the write-health pointer looks: writers whose counters changed in this span.
const HEALTH_LOOKBACK_MILLIS: i64 = 7 * 24 * 60 * 60 * 1000;
const HEALTH_VERB: &str = "fgos metrics query --kind fgos.observe.health";
const MIGRATE_VERB: &str = "fgos friction migrate --to-records";
/// The old friction store `fgos friction migrate --to-records` copies from.
const OLD_FRICTION_STORE: &str = "friction";

fn no_fixes(_: &Path, ids: &[&str]) -> Vec<FixResult> {
    ids.iter()
        .map(|id| FixResult::done(id, false, format!("no fix {id} is run in process")))
        .collect()
}

/// The adapter the doctor registers for the observe rows (there is no observe fix).
pub const GROUP: super::Rows = super::Rows {
    rows: ROW_IDS,
    fixes: &[],
    judge: judge_rows,
    fix: no_fixes,
};

fn row(passed: bool, message: String) -> RowOutcome {
    RowOutcome::Judged(RowResult {
        passed,
        status: None,
        message: Some(message),
        fix_command: None,
        detail: None,
    })
}

/// pass when `.fgos/observe` can take a shard or does not exist yet; fail when it exists and cannot.
pub fn dir_writable_row(root: &Path) -> RowOutcome {
    match fgos_observe::shard::probe_observe_dir(root) {
        Ok(false) => row(
            true,
            "info: .fgos/observe does not exist yet; the observe store creates it on first write"
                .into(),
        ),
        Ok(true) => row(true, ".fgos/observe is writable".into()),
        Err(error) => row(false, format!(".fgos/observe is not writable: {error}")),
    }
}

/// A real read of the friction store by this host, so a store it refuses (a symlinked directory or shard, an
/// I/O error) fails the row instead of passing on a ping.
pub fn host_resolvable_row(root: &Path, host: &Path) -> RowOutcome {
    match fgos_observe::friction::rank(root, Some(1)) {
        Ok(_) => row(
            true,
            format!(
                "host binary at {} resolved and verified (friction store readable)",
                host.display()
            ),
        ),
        Err(why) => row(
            false,
            format!(
                "host binary at {} failed the friction read probe: fgos: error: invocation failed: provider failed: {why}",
                host.display()
            ),
        ),
    }
}

/// Counts the records the write door refused (`rejected`) or dropped (`errors`), summed over every writer whose
/// counters changed since `since`. Counters are per writer and cumulative, so a writer that is still writing keeps
/// its old counts in the sum until it stops; the verb shows each writer and its last error.
fn health_failures(root: &Path, since: &str) -> Result<u64, String> {
    let window = Window {
        since: Some(since.to_owned()),
        until: None,
    };
    let records = HealthSource
        .records(root, &window)
        .map_err(|e| e.to_string())?;
    Ok(records
        .iter()
        .flat_map(|r| {
            ["fgos.observe.health.rejected", "fgos.observe.health.errors"]
                .into_iter()
                .filter_map(|name| r.measures.get(name).and_then(|n| n.as_u64()))
        })
        .sum())
}

/// Pointer: records the write door refused or dropped. Passes with a warning when any were counted, and never
/// fails: a write failure never changes its caller's outcome, so it is an incident to read, not a readiness gap.
pub fn write_health_row(root: &Path, now_millis: i64) -> RowOutcome {
    let Some(since) = format_unix_millis_rfc3339(now_millis - HEALTH_LOOKBACK_MILLIS, 0) else {
        return row(
            true,
            format!("warning: no clock to window the write health; run `{HEALTH_VERB}`"),
        );
    };
    match health_failures(root, &since) {
        Ok(0) => row(
            true,
            format!("no observe write rejected or dropped since {since}"),
        ),
        Ok(n) => row(
            true,
            format!("warning: {n} rejected/errors since {since}; run `{HEALTH_VERB}`"),
        ),
        Err(why) => row(
            true,
            format!("warning: observe write health unreadable ({why}); run `{HEALTH_VERB}`"),
        ),
    }
}

/// Old friction shard lines the record store does not hold yet. A line's record id is the one
/// `fgos_observe::friction::migrate_to_records` gives it (`legacy:<shard>:<line>`); the row test runs that migration
/// and expects zero, so the two cannot drift apart unnoticed.
fn unmigrated_friction(root: &Path) -> Result<usize, String> {
    let old =
        read_store(root, OLD_FRICTION_STORE, UnsafeShard::Report).map_err(|e| e.to_string())?;
    let mut lines = old.records.iter().filter(|stored| {
        matches!(
            stored.value.get("type").and_then(Value::as_str),
            Some("friction-recorded" | "friction-resolved")
        )
    });
    let Some(first) = lines.next() else {
        return Ok(0);
    };
    let stored = read_store(root, RECORDS_STORE, UnsafeShard::Report).map_err(|e| e.to_string())?;
    let ids: HashSet<&str> = stored
        .records
        .iter()
        .filter_map(|r| r.value.get("id").and_then(Value::as_str))
        .collect();
    Ok(std::iter::once(first)
        .chain(lines)
        .filter(|old| !ids.contains(format!("legacy:{}:{}", old.shard, old.line).as_str()))
        .count())
}

/// Pointer: old friction shards the record store lacks. Warns while any remain; the migration is an explicit
/// operator command, so the row neither fails nor repairs.
pub fn friction_migrated_row(root: &Path) -> RowOutcome {
    match unmigrated_friction(root) {
        Ok(0) => row(true, "friction store holds no unmigrated old shard lines".into()),
        Ok(n) => row(
            true,
            format!("warning: friction store not migrated ({n} old lines missing from the records store); run `{MIGRATE_VERB}`"),
        ),
        Err(why) => row(
            true,
            format!("warning: friction migration state unreadable ({why}); run `{MIGRATE_VERB}`"),
        ),
    }
}

fn now_millis() -> i64 {
    parse_rfc3339_millis(&fgos_observe::time::now_iso()).unwrap_or_default()
}

/// Judges the Observe rows `ids` of the project at `root`.
pub fn judge_rows(root: &Path, ids: &[&str]) -> Vec<RowOutcome> {
    let host = std::env::current_exe().unwrap_or_else(|_| PathBuf::from("fgos"));
    ids.iter()
        .map(|id| match *id {
            "observe-dir-writable" => dir_writable_row(root),
            "observe-host-resolvable" => host_resolvable_row(root, &host),
            "observe-write-health" => write_health_row(root, now_millis()),
            "observe-friction-migrated" => friction_migrated_row(root),
            other => RowOutcome::Unavailable {
                message: format!("no observe row {other}"),
                next: "run fgos doctor again".to_owned(),
            },
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn temp(tag: &str) -> PathBuf {
        let dir =
            std::env::temp_dir().join(format!("fgos-doctor-observe-{tag}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn message(outcome: RowOutcome) -> (bool, String) {
        match outcome {
            RowOutcome::Judged(result) => (result.passed, result.message.unwrap()),
            RowOutcome::Unavailable { message, .. } => panic!("{message}"),
        }
    }

    #[test]
    fn a_doctor_run_in_a_repository_with_no_setup_writes_nothing_under_the_observe_directory() {
        let root = temp("fresh");
        let (passed, text) = message(dir_writable_row(&root));
        assert!(
            passed && text.starts_with("info: .fgos/observe does not exist yet"),
            "{text}"
        );
        let (passed, text) = message(host_resolvable_row(&root, Path::new("/h/fgos")));
        assert!(passed && text.contains("friction store readable"), "{text}");
        assert!(
            !root.join(".fgos").exists(),
            "a read never creates the directory"
        );
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn an_existing_observe_directory_is_proven_writable_and_left_as_it_was() {
        let root = temp("existing");
        fs::create_dir_all(root.join(".fgos/observe")).unwrap();
        assert_eq!(
            message(dir_writable_row(&root)),
            (true, ".fgos/observe is writable".into())
        );
        assert_eq!(fs::read_dir(root.join(".fgos/observe")).unwrap().count(), 0);
        let _ = fs::remove_dir_all(root);
    }

    /// A record of a kind no declaration names: the door refuses it and counts it in this writer's health.
    fn refused_write(root: &Path) {
        use fgos_observe::record::store::{RecordDoor, WriteOutcome, HEALTH_DECLARATION};
        use fgos_observe::record::types::{Basis, Origin, Record, SubjectRef, RECORD_VERSION};
        let door = RecordDoor::new(root.to_path_buf(), vec![HEALTH_DECLARATION], None);
        let outcome = door.write(Record {
            v: RECORD_VERSION,
            id: "doctor-row-probe".into(),
            kind: "no.such.kind".into(),
            ts: "2026-11-18T10:00:00Z".into(),
            end_ts: None,
            subject: SubjectRef {
                kind: "session".into(),
                id: "s".into(),
            },
            refs: Vec::new(),
            attrs: Default::default(),
            measures: Default::default(),
            basis: Basis::Observed,
            origin: Origin {
                source: "doctor-test".into(),
                ..Origin::default()
            },
            detail: None,
            redaction: None,
        });
        assert!(matches!(outcome, WriteOutcome::Rejected(_)), "{outcome:?}");
    }

    #[test]
    fn write_health_points_at_the_health_query_while_recent_writes_were_refused_and_never_fails() {
        let root = temp("health");
        let (passed, text) = message(write_health_row(&root, now_millis()));
        assert!(
            passed && text.starts_with("no observe write rejected or dropped since"),
            "{text}"
        );
        assert!(
            !root.join(".fgos").exists(),
            "a read never creates the directory"
        );

        refused_write(&root);
        let (passed, text) = message(write_health_row(&root, now_millis()));
        assert!(passed, "a pointer never fails: {text}");
        assert!(
            text.starts_with("warning: 1 rejected/errors since ")
                && text.ends_with("; run `fgos metrics query --kind fgos.observe.health`"),
            "{text}"
        );

        // A writer whose counters last changed before the look-back window is not counted.
        let later = now_millis() + HEALTH_LOOKBACK_MILLIS + 60_000;
        let (passed, text) = message(write_health_row(&root, later));
        assert!(
            passed && text.starts_with("no observe write rejected"),
            "{text}"
        );
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn friction_migration_warns_while_old_shard_lines_are_missing_from_the_records_store_and_clears_after_migrate(
    ) {
        let root = temp("friction-migrated");
        let (passed, text) = message(friction_migrated_row(&root));
        assert!(
            passed && text == "friction store holds no unmigrated old shard lines",
            "{text}"
        );
        assert!(
            !root.join(".fgos").exists(),
            "a read never creates the directory"
        );

        let old = root.join(".fgos/observe/friction");
        fs::create_dir_all(&old).unwrap();
        let line = |kind: &str, ts: &str| {
            serde_json::json!({
                "v": 1, "type": kind, "ts": ts,
                "subject": { "kind": "work", "id": "tsk-a" },
                "layer": "docs", "errorClass": "doc-drift", "disposition": "advisory",
                "detail": "d", "producer": "test", "by": "test", "reason": "done"
            })
            .to_string()
        };
        fs::write(
            old.join("old-writer.jsonl"),
            format!(
                "{}\n{}\n",
                line("friction-recorded", "2026-10-01T10:00:00.000Z"),
                line("friction-resolved", "2026-10-02T10:00:00.000Z")
            ),
        )
        .unwrap();
        let (passed, text) = message(friction_migrated_row(&root));
        assert!(passed, "the row only warns: {text}");
        assert_eq!(
            text,
            "warning: friction store not migrated (2 old lines missing from the records store); run `fgos friction migrate --to-records`"
        );

        let report = fgos_observe::friction::migrate_to_records(&root).unwrap();
        assert_eq!(report["written"], 2, "{report}");
        let (passed, text) = message(friction_migrated_row(&root));
        assert!(
            passed && text == "friction store holds no unmigrated old shard lines",
            "{text}"
        );
        assert!(
            old.join("old-writer.jsonl").exists(),
            "the row never touches the old shards"
        );
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn every_observe_row_has_its_own_judge() {
        let root = temp("all-rows");
        for outcome in judge_rows(&root, ROW_IDS) {
            assert!(matches!(outcome, RowOutcome::Judged(_)));
        }
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn a_friction_store_the_host_refuses_fails_the_row_with_the_cause() {
        #[cfg(unix)]
        {
            let root = temp("symlinked");
            fs::create_dir_all(root.join(".fgos/observe")).unwrap();
            fs::create_dir_all(root.join("real")).unwrap();
            std::os::unix::fs::symlink(root.join("real"), root.join(".fgos/observe/friction"))
                .unwrap();
            let (passed, text) = message(host_resolvable_row(&root, Path::new("/h/fgos")));
            assert!(!passed);
            assert!(
                text.starts_with("host binary at /h/fgos failed the friction read probe: fgos: error: invocation failed: provider failed: observe store component must be a real directory"),
                "{text}"
            );
            let _ = fs::remove_dir_all(root);
        }
    }
}
