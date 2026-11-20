//! Pruning eligible records from writer shards under the observe store lock.
//!
//! A record is prunable if its kind declaration has `prunable: true`.
//! A prunable record is removable if it is older than its retention window (default: 30 days)
//! relative to now, OR its subject is contained in the provided settled subjects.

use std::collections::HashSet;
use std::fs::{self, OpenOptions};
use std::io::{BufRead, BufReader};
use std::path::Path;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use super::door::DEFAULT_LOCK_WAIT;
use super::source::RECORDS_STORE;
use crate::record::registry::Registry;
use crate::record::types::{Record, SubjectRef};
use crate::shard::open_regular;
use crate::store_lock::{acquire_store_lock_within, ObserveLockError};
use fgos_host_runtime::civil_time::parse_rfc3339_millis;

/// Summary of a prune operation.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct PruneReport {
    pub scanned: usize,
    pub prunable_found: usize,
    pub pruned: usize,
    pub ids: Vec<String>,
}

#[derive(Debug, thiserror::Error)]
pub enum PruneError {
    #[error("prune lock timeout: {0}")]
    LockTimeout(String),
    #[error("prune io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("invalid timestamp in record: {0}")]
    InvalidTimestamp(String),
    #[error("registry error: {0}")]
    Registry(String),
}

/// Parses retention duration string into milliseconds.
/// Supports units: 'd' (days), 'h' (hours), 'm' (minutes), 's' (seconds).
/// Defaults to 30d (30 * 86,400 * 1,000 ms = 2,592,000,000 ms) if retention is None or empty.
pub fn parse_retention_duration(retention: Option<&str>) -> Result<u64, String> {
    let s = match retention {
        None => return Ok(30 * 86_400 * 1000),
        Some(s) if s.trim().is_empty() => return Ok(30 * 86_400 * 1000),
        Some(s) => s.trim(),
    };
    if s.len() < 2 {
        return Err(format!("retention string too short: '{s}'"));
    }
    let (num_str, unit) = s.split_at(s.len() - 1);
    let val: u64 = num_str
        .parse()
        .map_err(|e| format!("invalid retention number in '{s}': {e}"))?;
    let multiplier: u64 = match unit {
        "d" => 86_400 * 1000,
        "h" => 3600 * 1000,
        "m" => 60 * 1000,
        "s" => 1000,
        _ => return Err(format!("unknown retention unit '{unit}' in '{s}'")),
    };
    Ok(val.saturating_mul(multiplier))
}

/// Prune records with default lock wait.
pub fn prune(
    root: &Path,
    registry: &Registry,
    settled_subjects: &[SubjectRef],
    apply: bool,
) -> Result<PruneReport, PruneError> {
    prune_with_lock_wait(root, registry, settled_subjects, apply, DEFAULT_LOCK_WAIT)
}

/// Prune records waiting up to `lock_wait` for the observe lock.
pub fn prune_with_lock_wait(
    root: &Path,
    registry: &Registry,
    settled_subjects: &[SubjectRef],
    apply: bool,
    lock_wait: Duration,
) -> Result<PruneReport, PruneError> {
    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64;
    prune_with_now(root, registry, settled_subjects, apply, lock_wait, now_ms)
}

/// Internal implementation allowing explicit reference instant for deterministic temporal testing.
pub fn prune_with_now(
    root: &Path,
    registry: &Registry,
    settled_subjects: &[SubjectRef],
    apply: bool,
    lock_wait: Duration,
    now_ms: i64,
) -> Result<PruneReport, PruneError> {
    let _guard = acquire_store_lock_within(root, lock_wait).map_err(|e| match e {
        ObserveLockError::Timeout(path) => PruneError::LockTimeout(path.display().to_string()),
        other => PruneError::LockTimeout(other.to_string()),
    })?;

    let dir = root.join(".fgos").join("observe").join(RECORDS_STORE);
    if !dir.exists() {
        return Ok(PruneReport::default());
    }

    let settled_set: HashSet<&SubjectRef> = settled_subjects.iter().collect();
    let mut report = PruneReport::default();

    let mut shard_paths = Vec::new();
    for entry in fs::read_dir(&dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("jsonl")
            && entry.file_type()?.is_file()
        {
            shard_paths.push(path);
        }
    }
    shard_paths.sort();

    for path in shard_paths {
        let file = open_regular(&path, OpenOptions::new().read(true))?;
        let mut reader = BufReader::new(file);
        let mut line_bytes = Vec::new();
        let mut kept_bytes = Vec::new();
        let mut shard_pruned = 0;

        while reader.read_until(b'\n', &mut line_bytes)? > 0 {
            let is_empty = line_bytes.iter().all(u8::is_ascii_whitespace);
            if is_empty {
                kept_bytes.extend_from_slice(&line_bytes);
                line_bytes.clear();
                continue;
            }

            match serde_json::from_slice::<Record>(&line_bytes) {
                Ok(record) => {
                    report.scanned += 1;
                    if registry.is_prunable(&record.kind) {
                        report.prunable_found += 1;
                        let is_settled = settled_set.contains(&record.subject);
                        let ts_ms = parse_rfc3339_millis(&record.ts)
                            .ok_or_else(|| PruneError::InvalidTimestamp(record.ts.clone()))?;
                        let retention_ms = parse_retention_duration(
                            registry.retention(&record.kind),
                        )
                        .map_err(|e| {
                            PruneError::Io(std::io::Error::new(std::io::ErrorKind::InvalidData, e))
                        })? as i64;
                        let is_older = now_ms.saturating_sub(ts_ms) >= retention_ms;

                        if is_settled || is_older {
                            report.pruned += 1;
                            shard_pruned += 1;
                            report.ids.push(record.id);
                        } else {
                            kept_bytes.extend_from_slice(&line_bytes);
                            if !kept_bytes.ends_with(b"\n") {
                                kept_bytes.push(b'\n');
                            }
                        }
                    } else {
                        // Non-prunable kind: preserved
                        kept_bytes.extend_from_slice(&line_bytes);
                        if !kept_bytes.ends_with(b"\n") {
                            kept_bytes.push(b'\n');
                        }
                    }
                }
                Err(_) => {
                    // Line does not parse as Record; preserve as-is
                    kept_bytes.extend_from_slice(&line_bytes);
                    if !kept_bytes.ends_with(b"\n") {
                        kept_bytes.push(b'\n');
                    }
                }
            }
            line_bytes.clear();
        }

        if apply && shard_pruned > 0 {
            let shard_file = path.file_name().and_then(|s| s.to_str()).ok_or_else(|| {
                PruneError::Io(std::io::Error::new(
                    std::io::ErrorKind::InvalidInput,
                    "invalid shard filename",
                ))
            })?;
            fgos_durable_file::replace_durably(&dir, shard_file, &kept_bytes)
                .map_err(|e| PruneError::Io(e.source))?;
        }
    }

    Ok(report)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_retention_duration() {
        assert_eq!(parse_retention_duration(None).unwrap(), 30 * 86_400 * 1000);
        assert_eq!(
            parse_retention_duration(Some("")).unwrap(),
            30 * 86_400 * 1000
        );
        assert_eq!(
            parse_retention_duration(Some("30d")).unwrap(),
            30 * 86_400 * 1000
        );
        assert_eq!(parse_retention_duration(Some("1d")).unwrap(), 86_400 * 1000);
        assert_eq!(
            parse_retention_duration(Some("12h")).unwrap(),
            12 * 3600 * 1000
        );
        assert_eq!(
            parse_retention_duration(Some("30m")).unwrap(),
            30 * 60 * 1000
        );
        assert_eq!(parse_retention_duration(Some("45s")).unwrap(), 45 * 1000);
        assert!(parse_retention_duration(Some("invalid")).is_err());
        assert!(parse_retention_duration(Some("10x")).is_err());
    }
}
