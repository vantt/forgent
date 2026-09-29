//! Case journal for Observe metrics cases (Lane A1 - Phase F3).
//!
//! Stores case lifecycles in `.fgos/observe/cases/<writerId>.jsonl`.
//! Manages open/close transitions, prevents overlapping open cases, and provides
//! lookup and listing capabilities.

use crate::shard;
use crate::store_lock::{acquire_store_lock, format_iso_now};
use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::path::Path;
use std::process::Command;

/// Maximum allowable line length (1 MiB) to guard against corrupted or huge lines.
const MAX_LINE_BYTES: usize = 1024 * 1024;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type")]
pub enum CaseRecord {
    #[serde(rename = "case-opened")]
    Opened(CaseOpenedRecord),
    #[serde(rename = "case-closed")]
    Closed(CaseClosedRecord),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CaseOpenedRecord {
    pub v: u32,
    pub ts: String,
    pub name: String,
    pub project: String,
    pub harness: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task: Option<String>,
    #[serde(rename = "headAtOpen")]
    pub head_at_open: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CaseClosedRecord {
    pub v: u32,
    pub ts: String,
    pub name: String,
    pub interventions: u64,
    pub verdict: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub items: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub sessions: Vec<String>,
    #[serde(rename = "headAtClose")]
    pub head_at_close: Option<String>,
}

/// A unified view of a case window (for F4 and listing).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CaseWindow {
    pub name: String,
    pub project: String,
    pub harness: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task: Option<String>,
    pub since: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub until: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub head_at_open: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub head_at_close: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub interventions: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub verdict: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub items: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub sessions: Vec<String>,
}

#[derive(Debug, thiserror::Error)]
pub enum CaseError {
    #[error("project already has an open case \"{0}\"")]
    AlreadyOpen(String),
    #[error("case \"{0}\" already exists")]
    DuplicateName(String),
    #[error("case \"{0}\" is not open")]
    NotOpen(String),
    #[error("case \"{0}\" is already closed")]
    AlreadyClosed(String),
    #[error("case \"{0}\" not found")]
    NotFound(String),
    #[error("invalid verdict \"{0}\". Allowed: usable, fixed, discarded")]
    InvalidVerdict(String),
    #[error("invalid harness \"{0}\". Allowed: fgos, cook-plan, plain")]
    InvalidHarness(String),
    #[error("store lock error: {0}")]
    Lock(#[from] crate::store_lock::ObserveLockError),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),
}

/// Helper to get current git rev-parse HEAD if in a git repo.
pub fn get_git_head(root: &Path) -> Option<String> {
    if let Ok(head) = std::env::var("FGOS_GIT_HEAD") {
        let trimmed = head.trim();
        if !trimmed.is_empty() {
            return Some(trimmed.to_string());
        }
    }
    let output = Command::new("git")
        .arg("rev-parse")
        .arg("HEAD")
        .current_dir(root)
        .output()
        .ok()?;

    if output.status.success() {
        let rev = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !rev.is_empty() {
            return Some(rev);
        }
    }
    None
}

/// Reads all valid case records from `.fgos/observe/cases/*.jsonl`, skipping
/// incomplete or corrupted lines.
pub fn read_all_case_records(root: &Path) -> Result<Vec<CaseRecord>, std::io::Error> {
    let dir = root.join(".fgos").join("observe").join("cases");
    if !dir.exists() {
        return Ok(Vec::new());
    }

    let mut records_with_ts: Vec<(String, CaseRecord)> = Vec::new();
    let entries = fs::read_dir(&dir)?;
    for entry in entries {
        let entry = entry?;
        let p = entry.path();
        if p.is_file() && p.extension().and_then(|s| s.to_str()) == Some("jsonl") {
            let file = fs::File::open(&p)?;
            let reader = BufReader::new(file);
            for line in reader.lines() {
                let line = match line {
                    Ok(l) => l,
                    Err(_) => continue, // skip broken bytes / interrupted read
                };
                let trimmed = line.trim();
                if trimmed.is_empty() || trimmed.len() > MAX_LINE_BYTES {
                    continue;
                }
                if let Ok(rec) = serde_json::from_str::<CaseRecord>(trimmed) {
                    let ts = match &rec {
                        CaseRecord::Opened(o) => o.ts.clone(),
                        CaseRecord::Closed(c) => c.ts.clone(),
                    };
                    records_with_ts.push((ts, rec));
                }
            }
        }
    }

    // Sort by timestamp ascending
    records_with_ts.sort_by(|a, b| a.0.cmp(&b.0));
    Ok(records_with_ts.into_iter().map(|(_, r)| r).collect())
}

/// Materializes state of all cases from records.
pub fn materialize_cases(records: &[CaseRecord]) -> Vec<CaseWindow> {
    let mut cases: Vec<CaseWindow> = Vec::new();

    for rec in records {
        match rec {
            CaseRecord::Opened(o) => {
                cases.push(CaseWindow {
                    name: o.name.clone(),
                    project: o.project.clone(),
                    harness: o.harness.clone(),
                    task: o.task.clone(),
                    since: o.ts.clone(),
                    until: None,
                    head_at_open: o.head_at_open.clone(),
                    head_at_close: None,
                    interventions: None,
                    verdict: None,
                    note: None,
                    items: Vec::new(),
                    sessions: Vec::new(),
                });
            }
            CaseRecord::Closed(c) => {
                if let Some(existing) = cases.iter_mut().rev().find(|w| w.name == c.name) {
                    existing.until = Some(c.ts.clone());
                    existing.head_at_close = c.head_at_close.clone();
                    existing.interventions = Some(c.interventions);
                    existing.verdict = Some(c.verdict.clone());
                    existing.note = c.note.clone();
                    existing.items = c.items.clone();
                    existing.sessions = c.sessions.clone();
                }
            }
        }
    }

    cases
}

/// Returns the currently open case if one exists.
pub fn find_currently_open(cases: &[CaseWindow]) -> Option<&CaseWindow> {
    cases.iter().find(|c| c.until.is_none())
}

/// Appends a serialized JSON line to the writer's shard under `.fgos/observe/cases/`
/// using O_APPEND and fsync.
fn append_record(root: &Path, record: &CaseRecord) -> Result<(), CaseError> {
    let shard_file_path = shard::shard_path(root, "cases")?;
    let mut file = OpenOptions::new()
        .create(true)
        .write(true)
        .append(true)
        .open(&shard_file_path)?;

    let mut json = serde_json::to_string(record)?;
    json.push('\n');

    file.write_all(json.as_bytes())?;
    file.sync_all()?;
    Ok(())
}

/// Open a new case.
pub fn open_case(
    root: &Path,
    name: &str,
    harness: &str,
    task: Option<String>,
) -> Result<CaseWindow, CaseError> {
    if harness != "fgos" && harness != "cook-plan" && harness != "plain" {
        return Err(CaseError::InvalidHarness(harness.to_string()));
    }

    let abs_root = if root.is_absolute() {
        root.to_path_buf()
    } else {
        std::env::current_dir()?.join(root)
    };
    let abs_root_str = abs_root.canonicalize().unwrap_or(abs_root).to_string_lossy().to_string();

    // Critical: check & append must occur within the store lock
    let _lock_guard = acquire_store_lock(root)?;

    let records = read_all_case_records(root)?;
    let cases = materialize_cases(&records);

    // 1. Check if there is an open case in the project
    if let Some(open) = find_currently_open(&cases) {
        return Err(CaseError::AlreadyOpen(open.name.clone()));
    }

    // 2. Check if name was ever used before
    if cases.iter().any(|c| c.name == name) {
        return Err(CaseError::DuplicateName(name.to_string()));
    }

    let head_at_open = get_git_head(root);
    let ts = format_iso_now();

    let project = if let Ok(p) = std::env::var("FGOS_PROJECT_NAME") {
        let trimmed = p.trim();
        if !trimmed.is_empty() {
            trimmed.to_string()
        } else {
            abs_root_str.clone()
        }
    } else {
        abs_root_str.clone()
    };

    let open_rec = CaseOpenedRecord {
        v: 1,
        ts: ts.clone(),
        name: name.to_string(),
        project: project.clone(),
        harness: harness.to_string(),
        task: task.clone(),
        head_at_open: head_at_open.clone(),
    };

    append_record(root, &CaseRecord::Opened(open_rec))?;

    Ok(CaseWindow {
        name: name.to_string(),
        project,
        harness: harness.to_string(),
        task,
        since: ts,
        until: None,
        head_at_open,
        head_at_close: None,
        interventions: None,
        verdict: None,
        note: None,
        items: Vec::new(),
        sessions: Vec::new(),
    })
}

/// Close an open case.
pub fn close_case(
    root: &Path,
    name: &str,
    interventions: u64,
    verdict: &str,
    note: Option<String>,
    items: Vec<String>,
    sessions: Vec<String>,
) -> Result<CaseWindow, CaseError> {
    if verdict != "usable" && verdict != "fixed" && verdict != "discarded" {
        return Err(CaseError::InvalidVerdict(verdict.to_string()));
    }

    let _lock_guard = acquire_store_lock(root)?;

    let records = read_all_case_records(root)?;
    let cases = materialize_cases(&records);

    let target = cases
        .iter()
        .find(|c| c.name == name)
        .ok_or_else(|| CaseError::NotFound(name.to_string()))?;

    if target.until.is_some() {
        return Err(CaseError::AlreadyClosed(name.to_string()));
    }

    let head_at_close = get_git_head(root);
    let ts = format_iso_now();

    let close_rec = CaseClosedRecord {
        v: 1,
        ts: ts.clone(),
        name: name.to_string(),
        interventions,
        verdict: verdict.to_string(),
        note: note.clone(),
        items: items.clone(),
        sessions: sessions.clone(),
        head_at_close: head_at_close.clone(),
    };

    append_record(root, &CaseRecord::Closed(close_rec))?;

    let mut closed_window = target.clone();
    closed_window.until = Some(ts);
    closed_window.head_at_close = head_at_close;
    closed_window.interventions = Some(interventions);
    closed_window.verdict = Some(verdict.to_string());
    closed_window.note = note;
    closed_window.items = items;
    closed_window.sessions = sessions;

    Ok(closed_window)
}

/// Find a case window by name (for F4 and consumers).
pub fn find(root: &Path, name: &str) -> Option<CaseWindow> {
    let records = read_all_case_records(root).ok()?;
    let cases = materialize_cases(&records);
    cases.into_iter().find(|c| c.name == name)
}

/// List all cases or only open cases.
pub fn list_cases(root: &Path, only_open: bool) -> Result<Vec<CaseWindow>, CaseError> {
    let records = read_all_case_records(root)?;
    let cases = materialize_cases(&records);
    if only_open {
        Ok(cases.into_iter().filter(|c| c.until.is_none()).collect())
    } else {
        Ok(cases)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    fn create_test_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("fgos-test-case-journal-{}-{}", name, std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn test_lifecycle_open_duplicate_close_list() {
        let root = create_test_dir("lifecycle");

        // 1. Open first case
        let open_res = open_case(&root, "case-1", "plain", Some("task 1".into()));
        assert!(open_res.is_ok());
        let window = open_res.unwrap();
        assert_eq!(window.name, "case-1");
        assert_eq!(window.harness, "plain");
        assert!(window.until.is_none());

        // 2. Duplicate open while one is already open -> error AlreadyOpen
        let open_second = open_case(&root, "case-2", "fgos", None);
        match open_second {
            Err(CaseError::AlreadyOpen(open_name)) => {
                assert_eq!(open_name, "case-1");
            }
            other => panic!("expected AlreadyOpen, got: {:?}", other),
        }

        // 3. List should show 1 open case
        let open_list = list_cases(&root, true).unwrap();
        assert_eq!(open_list.len(), 1);
        assert_eq!(open_list[0].name, "case-1");

        // 4. Close case-1
        let close_res = close_case(
            &root,
            "case-1",
            2,
            "fixed",
            Some("resolved".into()),
            vec!["tsk-1".into()],
            vec!["sess-1".into()],
        );
        assert!(close_res.is_ok());
        let closed = close_res.unwrap();
        assert_eq!(closed.name, "case-1");
        assert!(closed.until.is_some());
        assert_eq!(closed.interventions, Some(2));
        assert_eq!(closed.verdict.as_deref(), Some("fixed"));

        // 5. Close again -> error AlreadyClosed
        let close_again = close_case(&root, "case-1", 0, "usable", None, vec![], vec![]);
        match close_again {
            Err(CaseError::AlreadyClosed(name)) => assert_eq!(name, "case-1"),
            other => panic!("expected AlreadyClosed, got: {:?}", other),
        }

        // 6. Name reuse -> error DuplicateName
        let reuse_name = open_case(&root, "case-1", "plain", None);
        match reuse_name {
            Err(CaseError::DuplicateName(name)) => assert_eq!(name, "case-1"),
            other => panic!("expected DuplicateName, got: {:?}", other),
        }

        // 7. Now opening case-2 works since no case is open
        let open_second_now = open_case(&root, "case-2", "cook-plan", None);
        assert!(open_second_now.is_ok());

        // 8. list all -> 2 cases, list open -> 1 case
        let all = list_cases(&root, false).unwrap();
        assert_eq!(all.len(), 2);
        let open_only = list_cases(&root, true).unwrap();
        assert_eq!(open_only.len(), 1);
        assert_eq!(open_only[0].name, "case-2");

        // 9. find
        let found = find(&root, "case-1");
        assert!(found.is_some());
        assert_eq!(found.unwrap().name, "case-1");

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn test_corrupt_line_handling() {
        let root = create_test_dir("corrupt");
        let _ = open_case(&root, "c-1", "plain", None).unwrap();

        // Inject incomplete/corrupted JSON line into shard
        let shard_path = shard::shard_path(&root, "cases").unwrap();
        let mut f = OpenOptions::new().append(true).open(&shard_path).unwrap();
        f.write_all(b"{\"v\":1,\"type\":\"case-open\n").unwrap(); // malformed
        f.flush().unwrap();

        // Reading should still recover c-1
        let records = read_all_case_records(&root).unwrap();
        assert_eq!(records.len(), 1);

        let _ = fs::remove_dir_all(&root);
    }
}
