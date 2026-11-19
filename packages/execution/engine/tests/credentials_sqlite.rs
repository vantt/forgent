//! The omp login store through the bundled SQLite engine. Expiry reading and compare-before-write apply replay the
//! vectors recorded from the Node module with `node:sqlite` loaded (`packages/execution/contracts/credentials/
//! omp.v1.json`); the snapshot, the transaction's failures and the isolated login are proven on real temp stores.

use std::fs;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use fgos_execution_engine::credentials::ports::{RowUpdate, SqliteAdapter};
use fgos_execution_engine::credentials::*;
use rusqlite::types::Value as SqlValue;
use rusqlite::Connection;
use serde_json::{json, Value};

fn vectors() -> Value {
    let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("../contracts/credentials/omp.v1.json");
    serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap()
}

fn scratch(tag: &str) -> PathBuf {
    use std::sync::atomic::{AtomicU32, Ordering};
    static N: AtomicU32 = AtomicU32::new(0);
    let dir = std::env::temp_dir().join(format!(
        "fgos-credentials-sqlite-{tag}-{}-{}",
        std::process::id(),
        N.fetch_add(1, Ordering::SeqCst)
    ));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn sql_value(value: &Value) -> SqlValue {
    match value {
        Value::Null => SqlValue::Null,
        Value::String(s) => SqlValue::Text(s.clone()),
        Value::Number(n) => n
            .as_i64()
            .map_or_else(|| SqlValue::Real(n.as_f64().unwrap()), SqlValue::Integer),
        other => panic!("no SQL value for {other}"),
    }
}

/// A store as the recorder describes it: `{schema, rows}`, `{raw}`, or `null` for none.
fn lay_store(dir: &Path, described: &Value) {
    let file = dir.join("agent.db");
    if described.is_null() {
        return;
    }
    if let Some(raw) = described.get("raw") {
        fs::write(file, raw.as_str().unwrap()).unwrap();
        return;
    }
    let db = Connection::open(file).unwrap();
    db.execute_batch(described["schema"].as_str().unwrap())
        .unwrap();
    for row in described["rows"].as_array().unwrap() {
        let row = row.as_object().unwrap();
        let names: Vec<&str> = row.keys().map(String::as_str).collect();
        db.execute(
            &format!(
                "INSERT INTO auth_credentials ({}) VALUES ({})",
                names.join(", "),
                vec!["?"; names.len()].join(", ")
            ),
            rusqlite::params_from_iter(row.values().map(sql_value)),
        )
        .unwrap();
    }
}

fn literal_rows(file: &Path) -> Vec<Vec<String>> {
    let db = Connection::open(file).unwrap();
    let names: Vec<String> = db
        .prepare("PRAGMA table_info(auth_credentials)")
        .unwrap()
        .query_map([], |r| r.get::<_, String>("name"))
        .unwrap()
        .map(Result::unwrap)
        .collect();
    let select = names
        .iter()
        .map(|n| format!("quote(\"{n}\")"))
        .collect::<Vec<_>>()
        .join(", ");
    let mut stmt = db
        .prepare(&format!(
            "SELECT {select} FROM auth_credentials ORDER BY rowid"
        ))
        .unwrap();
    stmt.query_map([], |r| {
        (0..names.len())
            .map(|i| r.get::<_, String>(i))
            .collect::<Result<Vec<_>, _>>()
    })
    .unwrap()
    .map(Result::unwrap)
    .collect()
}

const SCHEMA: &str = "CREATE TABLE auth_credentials (id INTEGER PRIMARY KEY AUTOINCREMENT, provider TEXT NOT NULL, credential_type TEXT NOT NULL, data TEXT NOT NULL, disabled_cause TEXT DEFAULT NULL, updated_at INTEGER NOT NULL DEFAULT 0)";

fn omp_store(dir: &Path, refresh: &str, expires: i64) -> PathBuf {
    let file = dir.join("agent.db");
    let db = Connection::open(&file).unwrap();
    db.execute_batch(SCHEMA).unwrap();
    db.execute(
        "INSERT INTO auth_credentials (id, provider, credential_type, data, updated_at) VALUES (1, 'openai-codex', 'oauth', ?, 7)",
        [json!({"type": "oauth", "access": "a", "refresh": refresh, "expires": expires}).to_string()],
    )
    .unwrap();
    file
}

#[test]
fn omp_expiry_vectors_read_through_sqlite_match_node() {
    for case in vectors()["expiry"].as_array().unwrap() {
        let id = case["id"].as_str().unwrap();
        let dir = scratch("expiry");
        lay_store(&dir, &case["store"]);
        let got = read_credential_expiry("omp-agent-db", &dir, &BundledSqlite);
        let expected = &case["expected"];
        match got {
            Ok(entries) => {
                assert_eq!(expected["ok"], json!(true), "{id}");
                let got: Vec<Value> = entries
                    .iter()
                    .map(|e| json!({"key": e.key, "expiresMs": e.expires_ms, "dueMs": e.due_ms}))
                    .collect();
                let want: Vec<Value> = expected["entries"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|w| json!({"key": w["key"], "expiresMs": w["expiresMs"].as_f64(), "dueMs": w["dueMs"].as_f64()}))
                    .collect();
                assert_eq!(got, want, "{id}");
            }
            Err(code) => assert_eq!(
                (expected["ok"].as_bool(), expected["code"].as_str()),
                (Some(false), Some(code)),
                "{id}"
            ),
        }
        fs::remove_dir_all(dir).unwrap();
    }
}

#[test]
fn omp_apply_vectors_update_the_source_rows_as_node_does() {
    for case in vectors()["apply"].as_array().unwrap() {
        let id = case["id"].as_str().unwrap();
        let (source, copy) = (scratch("apply-source"), scratch("apply-copy"));
        lay_store(&source, &case["source"]);
        lay_store(&copy, &case["copy"]);
        let got = apply_renewed_credential(&ApplyRequest {
            layout_name: "omp-agent-db",
            source_home: &source,
            copy_home: &copy,
            provider: case["provider"].as_str(),
            require_future: case["requireFuture"].as_bool().unwrap(),
            now: case["now"].as_f64().unwrap(),
            sqlite: &BundledSqlite,
        })
        .unwrap();
        let want = &case["expected"]["result"];
        assert_eq!(got.status(), want["status"].as_str().unwrap(), "{id}");
        match &got {
            ApplyOutcome::Applied(keys) => assert_eq!(json!(keys), want["keys"], "{id}"),
            ApplyOutcome::Unchanged => assert_eq!(want["keys"], json!([]), "{id}"),
            ApplyOutcome::Unreadable(code) => {
                assert_eq!(Some(*code), want["code"].as_str(), "{id}")
            }
            ApplyOutcome::ApplyDeferred(code) => {
                assert_eq!(Some(code.as_str()), want["code"].as_str(), "{id}")
            }
        }
        if let Some(rows) = case["expected"]["sourceAfter"].as_array() {
            let want: Vec<Vec<String>> = rows
                .iter()
                .map(|r| {
                    r.as_array()
                        .unwrap()
                        .iter()
                        .map(|v| v.as_str().unwrap().to_owned())
                        .collect()
                })
                .collect();
            assert_eq!(
                literal_rows(&source.join("agent.db")),
                want,
                "{id}: the source rows after it, as SQL literals"
            );
        }
        fs::remove_dir_all(source).unwrap();
        fs::remove_dir_all(copy).unwrap();
    }
}

#[test]
fn a_snapshot_holds_what_is_still_in_the_write_ahead_log_and_never_replaces_a_file() {
    let dir = scratch("snapshot");
    let file = omp_store(&dir, "old", 1);
    // A writer that keeps its connection open: the update stays in the log, not the main file.
    let writer = Connection::open(&file).unwrap();
    writer
        .query_row("PRAGMA journal_mode = WAL", [], |_| Ok(()))
        .unwrap();
    writer
        .execute_batch("PRAGMA wal_autocheckpoint = 0")
        .unwrap();
    writer
        .execute(
            "UPDATE auth_credentials SET data = ? WHERE id = 1",
            [json!({"refresh": "in-the-log", "expires": 2}).to_string()],
        )
        .unwrap();
    assert!(fs::metadata(dir.join("agent.db-wal")).unwrap().len() > 0);

    let out = scratch("snapshot-out");
    let destination = out.join("agent.db");
    assert!(BundledSqlite.snapshot(&file, &destination));
    let rows = BundledSqlite.oauth_rows(&destination).unwrap();
    assert!(rows[0].data.contains("in-the-log"));
    assert!(!out.join("agent.db-wal").exists());
    let leftovers: Vec<_> = fs::read_dir(&out).unwrap().collect();
    assert_eq!(leftovers.len(), 1, "only the snapshot is left");
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mode = fs::metadata(&destination).unwrap().permissions().mode();
        assert_eq!(mode & 0o777, 0o600);
    }

    // The destination is taken: no snapshot, and what is there stays.
    fs::write(&destination, "kept").unwrap();
    assert!(!BundledSqlite.snapshot(&file, &destination));
    assert_eq!(fs::read_to_string(&destination).unwrap(), "kept");
    // A source that is not a database: no snapshot, nothing left behind.
    let bad = dir.join("bad.db");
    fs::write(&bad, "not a database, not even close to one").unwrap();
    let other = out.join("other.db");
    assert!(!BundledSqlite.snapshot(&bad, &other));
    assert!(!other.exists());
    assert_eq!(fs::read_dir(&out).unwrap().count(), 1);
    drop(writer);
    fs::remove_dir_all(dir).unwrap();
    fs::remove_dir_all(out).unwrap();
}

#[test]
fn an_update_waits_for_a_held_write_lock_then_reports_it_and_changes_nothing() {
    let dir = scratch("busy");
    let file = omp_store(&dir, "old", 1);
    let holder = Connection::open(&file).unwrap();
    holder.execute_batch("BEGIN IMMEDIATE").unwrap();
    let started = Instant::now();
    let mut called = false;
    let got = BundledSqlite.update_rows(&file, &mut |_| {
        called = true;
        Ok(vec![])
    });
    assert_eq!(got.unwrap_err(), "database is locked");
    assert!(
        started.elapsed() >= Duration::from_millis(4500),
        "waits for the lock"
    );
    assert!(!called);
    holder.execute_batch("ROLLBACK").unwrap();
    drop(holder);
    fs::remove_dir_all(dir).unwrap();
}

#[test]
fn a_failed_edit_rolls_back_and_a_store_without_the_table_or_not_a_database_is_refused() {
    let dir = scratch("refused");
    let file = omp_store(&dir, "old", 1);
    let before = literal_rows(&file);
    let got = BundledSqlite.update_rows(&file, &mut |rows| {
        assert_eq!(rows.len(), 1);
        assert_eq!(
            (rows[0].id.as_str(), rows[0].updated_at.as_deref()),
            ("1", Some("7"))
        );
        Err("entry-unidentified".into())
    });
    assert_eq!(got.unwrap_err(), "entry-unidentified");
    assert_eq!(literal_rows(&file), before);
    // The rollback freed the lock: the next transaction writes, keyed by the row's own id value.
    let updated = BundledSqlite
        .update_rows(&file, &mut |rows| {
            Ok(vec![RowUpdate {
                id: rows[0].id.clone(),
                provider: rows[0].provider.clone(),
                data: "{\"expires\":3}".into(),
                updated_at: Some(Some("9".into())),
            }])
        })
        .unwrap();
    assert_eq!(updated.len(), 1);
    assert_eq!(literal_rows(&file)[0][3], "'{\"expires\":3}'");
    assert_eq!(
        literal_rows(&file)[0][5],
        "9",
        "an integer column keeps an integer"
    );

    let empty = dir.join("empty.db");
    Connection::open(&empty)
        .unwrap()
        .execute_batch("CREATE TABLE settings (k TEXT)")
        .unwrap();
    assert_eq!(
        BundledSqlite
            .update_rows(&empty, &mut |_| Ok(vec![]))
            .unwrap_err(),
        "no such table: auth_credentials"
    );
    let corrupt = dir.join("corrupt.db");
    fs::write(&corrupt, "not a database, not even close to one").unwrap();
    assert_eq!(
        BundledSqlite
            .update_rows(&corrupt, &mut |_| Ok(vec![]))
            .unwrap_err(),
        "file is not a database"
    );
    assert!(BundledSqlite.oauth_rows(&corrupt).is_err());
    fs::remove_dir_all(dir).unwrap();
}

#[test]
fn the_isolated_login_holds_only_the_auth_credentials_rows_with_their_values() {
    let dir = scratch("isolate");
    let file = omp_store(&dir, "r", 1);
    let db = Connection::open(&file).unwrap();
    db.execute_batch(
        "CREATE TABLE settings (k TEXT); INSERT INTO settings VALUES ('secret');
         INSERT INTO auth_credentials (id, provider, credential_type, data, disabled_cause, updated_at)
         VALUES (5, 'xai', 'api_key', 'k', 'revoked', 11);",
    )
    .unwrap();
    drop(db);
    let to = dir.join("isolated.db");
    BundledSqlite.isolate_login(&file, &to).unwrap();
    assert_eq!(literal_rows(&to), literal_rows(&file));
    let tables: Vec<String> = Connection::open(&to)
        .unwrap()
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
        .unwrap()
        .query_map([], |r| r.get(0))
        .unwrap()
        .map(Result::unwrap)
        .collect();
    assert_eq!(tables, ["auth_credentials"]);
    let missing = dir.join("none.db");
    Connection::open(&missing)
        .unwrap()
        .execute_batch("CREATE TABLE settings (k TEXT)")
        .unwrap();
    assert!(BundledSqlite
        .isolate_login(&missing, &dir.join("never.db"))
        .is_err());
    assert!(!dir.join("never.db").exists());
    fs::remove_dir_all(dir).unwrap();
}
