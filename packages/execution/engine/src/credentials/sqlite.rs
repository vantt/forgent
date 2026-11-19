//! The SQLite engine behind the omp login store: SQLite compiled into the binary (`rusqlite`, `bundled`), so no
//! system library is needed and the store is always readable. It opens a connection the way the previous Node
//! release's `node:sqlite` did (five-second busy wait, foreign keys on, double-quoted strings off), runs the same
//! statements, and reports a failure by SQLite's own message, as `node:sqlite` threw it.

use std::fs;
use std::path::Path;
use std::time::Duration;

use rusqlite::types::{Value as SqlValue, ValueRef};
use rusqlite::{params_from_iter, Connection, OpenFlags};

use super::ports::{OmpRow, RowEdit, RowUpdate, SqliteAdapter, SqliteFailure};

const BUSY_TIMEOUT: Duration = Duration::from_millis(5000);
const OMP_SELECT: &str =
    "SELECT * FROM auth_credentials WHERE credential_type = 'oauth' AND disabled_cause IS NULL";

/// SQLite compiled in: the engine every omp store is read and written through.
pub struct BundledSqlite;

fn message(error: rusqlite::Error) -> String {
    match error {
        rusqlite::Error::SqliteFailure(_, Some(text)) => text,
        other => other.to_string(),
    }
}

fn open(file: &Path, read_only: bool) -> rusqlite::Result<Connection> {
    let flags = if read_only {
        OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_NO_MUTEX
    } else {
        OpenFlags::SQLITE_OPEN_READ_WRITE
            | OpenFlags::SQLITE_OPEN_CREATE
            | OpenFlags::SQLITE_OPEN_NO_MUTEX
    };
    let db = Connection::open_with_flags(file, flags)?;
    db.busy_timeout(BUSY_TIMEOUT)?;
    use rusqlite::config::DbConfig;
    db.set_db_config(DbConfig::SQLITE_DBCONFIG_ENABLE_FKEY, true)?;
    db.set_db_config(DbConfig::SQLITE_DBCONFIG_DQS_DML, false)?;
    db.set_db_config(DbConfig::SQLITE_DBCONFIG_DQS_DDL, false)?;
    Ok(db)
}

/// A value as JavaScript's `String()` reads what `node:sqlite` returned for it.
fn text_of(value: ValueRef<'_>) -> String {
    match value {
        ValueRef::Null => "null".into(),
        ValueRef::Integer(i) => i.to_string(),
        ValueRef::Real(f) if f.is_nan() => "NaN".into(),
        ValueRef::Real(f) if f.is_infinite() => {
            if f > 0.0 { "Infinity" } else { "-Infinity" }.into()
        }
        ValueRef::Real(f) => format!("{f}"),
        ValueRef::Text(t) => String::from_utf8_lossy(t).into_owned(),
        ValueRef::Blob(b) => b.iter().map(u8::to_string).collect::<Vec<_>>().join(","),
    }
}

fn columns(db: &Connection) -> rusqlite::Result<Vec<String>> {
    let mut stmt = db.prepare("PRAGMA table_info(auth_credentials)")?;
    let names = stmt.query_map([], |row| row.get::<_, String>("name"))?;
    names.collect()
}

/// The oauth rows that are not disabled, each with the id value SQLite holds (to address it in an update).
fn select_oauth(db: &Connection) -> rusqlite::Result<Vec<(OmpRow, SqlValue)>> {
    let mut stmt = db.prepare(OMP_SELECT)?;
    let names: Vec<String> = stmt.column_names().map(str::to_owned).collect();
    let at = |name: &str| names.iter().position(|n| n == name);
    let (id, provider, data, updated_at) = (at("id"), at("provider"), at("data"), at("updated_at"));
    let mut rows = stmt.query([])?;
    let mut found = Vec::new();
    while let Some(row) = rows.next()? {
        let text = |index: Option<usize>| -> rusqlite::Result<String> {
            index.map_or(Ok("undefined".into()), |i| row.get_ref(i).map(text_of))
        };
        let id_value = match id {
            Some(i) => row.get::<_, SqlValue>(i)?,
            None => SqlValue::Null,
        };
        let updated = match updated_at {
            Some(i) => match row.get_ref(i)? {
                ValueRef::Null => None,
                value => Some(text_of(value)),
            },
            None => None,
        };
        found.push((
            OmpRow {
                id: text(id)?,
                provider: text(provider)?,
                data: text(data)?,
                updated_at: updated,
            },
            id_value,
        ));
    }
    Ok(found)
}

fn apply_updates(
    db: &Connection,
    current: &[(OmpRow, SqlValue)],
    updates: &[RowUpdate],
    has_updated_at: bool,
) -> rusqlite::Result<()> {
    for update in updates {
        let id = current
            .iter()
            .find(|(row, _)| row.id == update.id && row.provider == update.provider)
            .map_or_else(|| SqlValue::Text(update.id.clone()), |(_, id)| id.clone());
        match (&update.updated_at, has_updated_at) {
            (Some(updated_at), true) => db.execute(
                "UPDATE auth_credentials SET data = ?, updated_at = ? WHERE id = ? AND provider = ?",
                params_from_iter([
                    SqlValue::Text(update.data.clone()),
                    updated_at.clone().map_or(SqlValue::Null, SqlValue::Text),
                    id,
                    SqlValue::Text(update.provider.clone()),
                ]),
            )?,
            _ => db.execute(
                "UPDATE auth_credentials SET data = ? WHERE id = ? AND provider = ?",
                params_from_iter([
                    SqlValue::Text(update.data.clone()),
                    id,
                    SqlValue::Text(update.provider.clone()),
                ]),
            )?,
        };
    }
    Ok(())
}

/// Every `auth_credentials` column and row of `from`, values as SQLite holds them.
fn login_rows(from: &Path) -> rusqlite::Result<(Vec<String>, Vec<Vec<SqlValue>>)> {
    let db = open(from, true)?;
    let names = columns(&db)?;
    let mut stmt = db.prepare("SELECT * FROM auth_credentials")?;
    let selected: Vec<String> = stmt.column_names().map(str::to_owned).collect();
    let mut rows = stmt.query([])?;
    let mut values = Vec::new();
    while let Some(row) = rows.next()? {
        let mut out = Vec::with_capacity(names.len());
        for name in &names {
            out.push(match selected.iter().position(|n| n == name) {
                Some(i) => row.get::<_, SqlValue>(i)?,
                None => SqlValue::Null,
            });
        }
        values.push(out);
    }
    Ok((names, values))
}

fn quote(name: &str) -> String {
    format!("\"{}\"", name.replace('"', "\"\""))
}

/// `VACUUM INTO` a temporary beside `destination`, then install its bytes through the durable-file door (new name
/// only, owner-only, file and directory synced); the temporary is always removed.
fn snapshot_durably(source: &Path, destination: &Path) -> Result<(), ()> {
    let (Some(dir), Some(name)) = (
        destination.parent(),
        destination.file_name().and_then(|n| n.to_str()),
    ) else {
        return Err(());
    };
    let temporary = dir.join(format!(".{name}.snapshot-{}", std::process::id()));
    let _ = fs::remove_file(&temporary);
    let taken = (|| {
        let db = open(source, true).map_err(drop)?;
        db.execute("VACUUM INTO ?", [temporary.to_str().ok_or(())?.to_owned()])
            .map_err(drop)?;
        drop(db);
        let bytes = fs::read(&temporary).map_err(drop)?;
        match fgos_durable_file::install_once_with_mode(dir, name, &bytes, 0o600) {
            Ok(fgos_durable_file::Installed::Created) => Ok(()),
            // A file already there is never replaced, and is not this snapshot.
            Ok(fgos_durable_file::Installed::AlreadyExists) | Err(_) => Err(()),
        }
    })();
    let _ = fs::remove_file(&temporary);
    taken
}

impl SqliteAdapter for BundledSqlite {
    fn available(&self) -> bool {
        true
    }

    fn oauth_rows(&self, file: &Path) -> Result<Vec<OmpRow>, SqliteFailure> {
        open(file, true)
            .and_then(|db| select_oauth(&db))
            .map(|rows| rows.into_iter().map(|(row, _)| row).collect())
            .map_err(|_| SqliteFailure::Unreadable)
    }

    fn update_rows(&self, file: &Path, edit: &mut RowEdit<'_>) -> Result<Vec<RowUpdate>, String> {
        let db = open(file, false).map_err(message)?;
        let has_updated_at = columns(&db)
            .map_err(message)?
            .iter()
            .any(|n| n == "updated_at");
        db.execute_batch("BEGIN IMMEDIATE").map_err(message)?;
        let done = (|| {
            let current = select_oauth(&db).map_err(message)?;
            let rows: Vec<OmpRow> = current.iter().map(|(row, _)| row.clone()).collect();
            let updates = edit(&rows)?;
            apply_updates(&db, &current, &updates, has_updated_at).map_err(message)?;
            db.execute_batch("COMMIT").map_err(message)?;
            Ok(updates)
        })();
        let updates = match done {
            Ok(updates) => updates,
            Err(error) => {
                // The transaction may already be gone (a failed COMMIT rolls back by itself).
                let _ = db.execute_batch("ROLLBACK");
                return Err(error);
            }
        };
        if !updates.is_empty() {
            // Best effort: hand what was just written to the main file without waiting for readers.
            let _ = db.query_row("PRAGMA wal_checkpoint(PASSIVE)", [], |_| Ok(()));
        }
        Ok(updates)
    }

    fn snapshot(&self, source: &Path, destination: &Path) -> bool {
        snapshot_durably(source, destination).is_ok()
    }

    fn isolate_login(&self, from: &Path, to: &Path) -> Result<(), SqliteFailure> {
        let (names, rows) = login_rows(from).map_err(|_| SqliteFailure::Unreadable)?;
        let build = || -> rusqlite::Result<()> {
            let db = open(to, false)?;
            let declared: Vec<String> = names
                .iter()
                .map(|name| {
                    if name == "id" {
                        "\"id\" INTEGER PRIMARY KEY".to_owned()
                    } else {
                        quote(name)
                    }
                })
                .collect();
            db.execute_batch(&format!(
                "CREATE TABLE auth_credentials ({})",
                declared.join(", ")
            ))?;
            let mut insert = db.prepare(&format!(
                "INSERT INTO auth_credentials ({}) VALUES ({})",
                names
                    .iter()
                    .map(|n| quote(n))
                    .collect::<Vec<_>>()
                    .join(", "),
                vec!["?"; names.len()].join(", ")
            ))?;
            for row in &rows {
                insert.execute(params_from_iter(row.iter()))?;
            }
            Ok(())
        };
        build().map_err(|_| SqliteFailure::Unreadable)
    }
}
