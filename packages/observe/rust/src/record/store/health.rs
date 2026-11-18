//! Per-writer counters and their projection as a `RecordSource`.
//!
//! `accepted` counts every record handed to the door; `written` those appended; `duplicates` those ignored because
//! their id was already stored; `rejected` those the registry (or the redaction rule) refused; `errors` those dropped
//! on a failure (registry load, lock, I/O).

use super::source::RECORDS_STORE;
use crate::contract::{RecordSource, SourceError, Window};
use crate::record::registry::EmbeddedDeclaration;
use crate::record::types::{AttrValue, Basis, Origin, Record, SubjectRef, RECORD_VERSION};
use crate::shard::{open_regular, writer_shard_name};
use crate::time::{now_iso, ParsedWindow};
use fgos_host_runtime::civil_time::parse_rfc3339_millis;
use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::{self, Read};
use std::path::{Path, PathBuf};

/// Kind of the record each writer's health projects as.
pub const HEALTH_KIND: &str = "fgos.observe.health";
/// The declaration of [`HEALTH_KIND`], for the composition root's embedded list.
pub const HEALTH_DECLARATION: EmbeddedDeclaration = EmbeddedDeclaration {
    label: "fgos-observe-health",
    json: include_str!("health-kinds.json"),
};
const SOURCE_ID: &str = "fgos.observe.health";
const HEALTH_DIR: &str = "health";
const LAST_ERROR_MAX: usize = 200;
/// A health file is a handful of counters; anything larger is not one.
const HEALTH_MAX_BYTES: u64 = 64 * 1024;
const NAME_PREFIX: &str = "fgos.observe.health.";

#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct Health {
    #[serde(default)]
    pub accepted: u64,
    #[serde(default)]
    pub written: u64,
    #[serde(default)]
    pub duplicates: u64,
    #[serde(default)]
    pub rejected: u64,
    #[serde(default)]
    pub errors: u64,
    #[serde(default, rename = "lastError")]
    pub last_error: Option<String>,
    #[serde(default, rename = "updatedAt")]
    pub updated_at: String,
}

/// What writes add to the counters; deltas not yet stored add up.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub(super) struct Delta {
    pub accepted: u64,
    pub written: u64,
    pub duplicates: u64,
    pub rejected: u64,
    pub errors: u64,
    pub last_error: Option<String>,
}

impl Delta {
    pub fn add(&mut self, other: Delta) {
        self.accepted += other.accepted;
        self.written += other.written;
        self.duplicates += other.duplicates;
        self.rejected += other.rejected;
        self.errors += other.errors;
        if other.last_error.is_some() {
            self.last_error = other.last_error;
        }
    }
}

fn health_dir(root: &Path) -> PathBuf {
    root.join(".fgos")
        .join("observe")
        .join(RECORDS_STORE)
        .join(HEALTH_DIR)
}

fn is_real_dir(path: &Path) -> bool {
    fs::symlink_metadata(path).is_ok_and(|m| m.file_type().is_dir())
}

/// Reads one writer's counters; a missing, linked, oversized or unreadable file is zero.
pub fn read_health(root: &Path, writer: &str) -> Health {
    let dir = health_dir(root);
    if !is_real_dir(&dir) {
        return Health::default();
    }
    read_health_file(&dir.join(format!("{writer}.json"))).unwrap_or_default()
}

fn read_health_file(path: &Path) -> Option<Health> {
    let file = open_regular(path, OpenOptions::new().read(true)).ok()?;
    let mut bytes = Vec::new();
    file.take(HEALTH_MAX_BYTES + 1)
        .read_to_end(&mut bytes)
        .ok()?;
    if bytes.len() as u64 > HEALTH_MAX_BYTES {
        return None;
    }
    serde_json::from_slice(&bytes).ok()
}

/// Adds `delta` to this writer's counters. The caller holds the observe lock, which serializes every process and
/// thread writing this file. Best effort: the caller keeps the delta on a failure, since a counter must never change
/// the outcome of the write it describes.
pub(super) fn bump(root: &Path, delta: &Delta) -> io::Result<()> {
    // The records store directory is checked component by component by the shard door.
    let store = crate::shard::shard_path(root, RECORDS_STORE)?
        .parent()
        .map(Path::to_path_buf)
        .ok_or_else(|| io::Error::other("records store has no directory"))?;
    let dir = store.join(HEALTH_DIR);
    match fs::create_dir(&dir) {
        Ok(()) => {}
        Err(e) if e.kind() == io::ErrorKind::AlreadyExists => {}
        Err(e) => return Err(e),
    }
    if !is_real_dir(&dir) {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "health directory must be a real directory",
        ));
    }
    let writer = writer_shard_name();
    let mut health = read_health(root, &writer);
    health.accepted += delta.accepted;
    health.written += delta.written;
    health.duplicates += delta.duplicates;
    health.rejected += delta.rejected;
    health.errors += delta.errors;
    if let Some(message) = &delta.last_error {
        health.last_error = Some(message.chars().take(LAST_ERROR_MAX).collect());
    }
    health.updated_at = now_iso();
    let bytes = serde_json::to_vec(&health).map_err(io::Error::other)?;
    fgos_durable_file::replace_durably(&dir, &format!("{writer}.json"), &bytes)
        .map(|_| ())
        .map_err(|e| io::Error::other(e.to_string()))
}

/// Every writer's counters as one `fgos.observe.health` record each, windowed on the last update.
pub struct HealthSource;

impl RecordSource for HealthSource {
    fn source_id(&self) -> &'static str {
        SOURCE_ID
    }

    fn kinds(&self) -> &[&str] {
        &[HEALTH_KIND]
    }

    fn records(&self, root: &Path, w: &Window) -> Result<Vec<Record>, SourceError> {
        let window = ParsedWindow::parse(w).map_err(|message| SourceError::ReadFailed {
            source_id: SOURCE_ID,
            message,
        })?;
        let dir = health_dir(root);
        // A missing or linked health directory has nothing to read; it is checked before it is listed.
        if !is_real_dir(&dir) {
            return Ok(Vec::new());
        }
        let entries = fs::read_dir(&dir).map_err(|e| SourceError::Io(SOURCE_ID, e))?;
        let mut writers = Vec::new();
        for entry in entries {
            let entry = entry.map_err(|e| SourceError::Io(SOURCE_ID, e))?;
            let path = entry.path();
            let is_file = entry.file_type().is_ok_and(|t| t.is_file());
            if is_file && path.extension().is_some_and(|x| x == "json") {
                if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                    writers.push(stem.to_owned());
                }
            }
        }
        writers.sort();
        let mut records = Vec::new();
        for writer in writers {
            let health = read_health(root, &writer);
            let Some(millis) = parse_rfc3339_millis(&health.updated_at) else {
                continue;
            };
            if !window.contains(millis) {
                continue;
            }
            records.push(project(&writer, &health));
        }
        Ok(records)
    }
}

fn project(writer: &str, health: &Health) -> Record {
    let measures = [
        ("accepted", health.accepted),
        ("written", health.written),
        ("duplicates", health.duplicates),
        ("rejected", health.rejected),
        ("errors", health.errors),
    ]
    .into_iter()
    .map(|(name, n)| (format!("{NAME_PREFIX}{name}"), n.into()))
    .collect();
    let mut attrs = std::collections::BTreeMap::new();
    if let Some(message) = &health.last_error {
        attrs.insert(
            format!("{NAME_PREFIX}last_error"),
            AttrValue::Str(message.clone()),
        );
    }
    Record {
        v: RECORD_VERSION,
        id: format!("health:{writer}:{}", health.updated_at),
        kind: HEALTH_KIND.to_owned(),
        ts: health.updated_at.clone(),
        end_ts: None,
        subject: SubjectRef {
            kind: "session".to_owned(),
            id: writer.to_owned(),
        },
        refs: Vec::new(),
        attrs,
        measures,
        basis: Basis::Observed,
        origin: Origin {
            source: SOURCE_ID.to_owned(),
            component: Some("observe".to_owned()),
            writer: Some(writer.to_owned()),
            ..Origin::default()
        },
        detail: None,
        redaction: None,
    }
}
