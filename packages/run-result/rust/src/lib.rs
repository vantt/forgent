//! Run Result Evaluator observation source (Lane A2 - Phase F2).

pub mod unit_summary;
pub use unit_summary::{scan_unit_summaries, UnitSummarySource};

use fgos_observe::{Observation, ObservationSource, SourceError, Subject, SubjectKind, Window};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{BTreeMap, HashSet};
use std::fs::File;
use std::io::BufReader;
use std::path::Path;
use std::time::{Duration, SystemTime};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Outcome {
    pub category: String,
    pub reason: String,
}

/// Pure outcome derivation from classification per Step 01 §11 & Phase 2 closed rules.
pub fn derive_outcome(classification: &Value) -> Outcome {
    let c = match classification.as_object() {
        Some(obj) => obj,
        None => {
            return Outcome {
                category: "corrupt".to_string(),
                reason: "corrupt-classification".to_string(),
            }
        }
    };

    let exec_status = c
        .get("execution")
        .and_then(|e| e.get("status"))
        .and_then(|s| s.as_str())
        .unwrap_or("unknown");

    let verdict = c
        .get("assessment")
        .and_then(|a| a.get("verdict"))
        .and_then(|v| v.as_str())
        .unwrap_or("inconclusive");

    let policy_disp = c
        .get("policy")
        .and_then(|p| p.get("disposition"))
        .and_then(|d| d.as_str())
        .unwrap_or("allow");

    let failure_family = c
        .get("failure")
        .and_then(|f| f.get("family"))
        .and_then(|fam| fam.as_str());

    let failure_code = c
        .get("failure")
        .and_then(|f| f.get("code"))
        .and_then(|code| code.as_str());

    // Rule 1: execution failure
    // execution.status in {failed, cancelled, completion-unknown} and failure.family in {provider, resource, unknown} (or no failure)
    if exec_status == "failed" || exec_status == "cancelled" || exec_status == "completion-unknown" {
        if failure_family == Some("provider")
            || failure_family == Some("resource")
            || failure_family == Some("unknown")
            || failure_family.is_none()
        {
            return Outcome {
                category: "infra".to_string(),
                reason: format!("infra-exec-{}", exec_status),
            };
        }
    }

    // Rule 2: policy refusal or contract/policy failure
    // policy.disposition === 'refuse' or failure.family in {contract, policy}
    if policy_disp == "refuse" || failure_family == Some("contract") || failure_family == Some("policy") {
        let code = failure_code.unwrap_or("policy-refused");
        return Outcome {
            category: "policy".to_string(),
            reason: format!("policy-{}", code),
        };
    }

    // Rule 3: policy disposition === 'needs-input'
    if policy_disp == "needs-input" {
        return Outcome {
            category: "infra".to_string(),
            reason: "infra-policy-needs-input".to_string(),
        };
    }

    // Rule 4: verdict === 'findings'
    if verdict == "findings" {
        return Outcome {
            category: "verdict".to_string(),
            reason: "reviewer-findings".to_string(),
        };
    }

    // Rule 5: verdict === 'blocked'
    if verdict == "blocked" {
        return Outcome {
            category: "blocked".to_string(),
            reason: "verdict-blocked".to_string(),
        };
    }

    // Rule 6: completed execution with pass or not-applicable verdict
    if exec_status == "completed" && (verdict == "pass" || verdict == "not-applicable") {
        return Outcome {
            category: "ok".to_string(),
            reason: "completed-pass".to_string(),
        };
    }

    // Rule 7: remaining (e.g. inconclusive) -> verdict
    Outcome {
        category: "verdict".to_string(),
        reason: format!("verdict-{}", verdict),
    }
}

fn is_classification_valid(c: &serde_json::Map<String, Value>) -> bool {
    const EXECUTION_STATUSES: &[&str] = &["completed", "failed", "cancelled", "completion-unknown"];
    const ASSESSMENT_VERDICTS: &[&str] = &["pass", "findings", "inconclusive", "blocked", "not-applicable"];
    const CONFIDENCE_LEVELS: &[&str] = &["verified", "reported", "inferred", "no-evidence", "failed"];
    const POLICY_DISPOSITIONS: &[&str] = &["allow", "refuse", "needs-input", "not-applicable"];

    if let Some(e) = c.get("execution").and_then(|v| v.as_object()) {
        if let Some(s) = e.get("status").and_then(|v| v.as_str()) {
            if !EXECUTION_STATUSES.contains(&s) {
                return false;
            }
        } else {
            return false;
        }
    } else {
        return false;
    }

    if let Some(a) = c.get("assessment").and_then(|v| v.as_object()) {
        if let Some(v) = a.get("verdict").and_then(|v| v.as_str()) {
            if !ASSESSMENT_VERDICTS.contains(&v) {
                return false;
            }
        } else {
            return false;
        }
    } else {
        return false;
    }

    if let Some(conf) = c.get("confidence").and_then(|v| v.as_object()) {
        if let Some(lvl) = conf.get("level").and_then(|v| v.as_str()) {
            if !CONFIDENCE_LEVELS.contains(&lvl) {
                return false;
            }
        } else {
            return false;
        }
    } else {
        return false;
    }

    if let Some(p) = c.get("policy").and_then(|v| v.as_object()) {
        if let Some(d) = p.get("disposition").and_then(|v| v.as_str()) {
            if !POLICY_DISPOSITIONS.contains(&d) {
                return false;
            }
        }
    }

    true
}

/// Derive outcome for any RunResult record (v3 native, v2 validated, v1 legacy, or corrupt).
pub fn derive_legacy_outcome(record: &Value) -> Outcome {
    let raw = match record.as_object() {
        Some(r) => r,
        None => {
            return Outcome {
                category: "corrupt".to_string(),
                reason: "corrupt-record".to_string(),
            }
        }
    };

    // If v3 record has classification.outcome.category, read it directly without re-derivation
    if let Some(cat) = record
        .get("classification")
        .and_then(|c| c.get("outcome"))
        .and_then(|o| o.get("category"))
        .and_then(|s| s.as_str())
    {
        let reason = record
            .get("classification")
            .and_then(|c| c.get("outcome"))
            .and_then(|o| o.get("reason"))
            .and_then(|s| s.as_str())
            .unwrap_or("recorded-outcome");
        return Outcome {
            category: cat.to_string(),
            reason: reason.to_string(),
        };
    }

    // If contract is present:
    if let Some(contract) = raw.get("contract") {
        let version = contract.get("version").and_then(|v| v.as_u64());
        let id = contract.get("id").and_then(|i| i.as_str());

        if id != Some("assignment-run-result") {
            return Outcome {
                category: "corrupt".to_string(),
                reason: "unsupported-contract".to_string(),
            };
        }

        if version == Some(2) || version == Some(3) || version == Some(4) {
            if let Some(c) = raw.get("classification").and_then(|v| v.as_object()) {
                if !is_classification_valid(c) {
                    return Outcome {
                        category: "corrupt".to_string(),
                        reason: "corrupt-classification".to_string(),
                    };
                }
                return derive_outcome(&Value::Object(c.clone()));
            }
            return Outcome {
                category: "corrupt".to_string(),
                reason: "missing-classification".to_string(),
            };
        }
        return Outcome {
            category: "corrupt".to_string(),
            reason: "unsupported-contract-version".to_string(),
        };
    }

    // Legacy v1 interpretation (contract is absent):
    if raw.get("contract").is_none() && raw.get("status").is_none() && raw.get("runId").is_none() {
        return Outcome {
            category: "corrupt".to_string(),
            reason: "missing-status-and-run-id".to_string(),
        };
    }

    // Check recognized legacy statuses
    const RECOGNIZED_LEGACY_STATUSES: &[&str] = &["done", "failed", "no-evidence", "blocked"];
    if let Some(st) = raw.get("status").and_then(|s| s.as_str()) {
        if !RECOGNIZED_LEGACY_STATUSES.contains(&st) {
            return Outcome {
                category: "corrupt".to_string(),
                reason: format!("unrecognized-status-{}", st),
            };
        }
    }

    let legacy_status = raw
        .get("status")
        .and_then(|s| s.as_str())
        .unwrap_or("no-evidence");

    let legacy_conf = raw
        .get("confidence")
        .and_then(|s| s.as_str())
        .unwrap_or(if legacy_status == "done" { "reported" } else { "failed" });

    let is_timeout = raw
        .get("runtime")
        .and_then(|r| r.get("isTimeout"))
        .and_then(|b| b.as_bool())
        .unwrap_or(false);

    let has_findings = raw
        .get("agentClaim")
        .and_then(|c| c.get("assessment"))
        .and_then(|a| a.get("verdict"))
        .and_then(|v| v.as_str())
        == Some("findings");

    let (exec_status, assess_verdict, failure_family) =
        if legacy_status == "no-evidence" || legacy_conf == "no-evidence" {
            ("completion-unknown", "inconclusive", Some("unknown"))
        } else if legacy_status == "failed" && (legacy_conf == "failed" || is_timeout) {
            ("failed", "not-applicable", Some("unknown"))
        } else if legacy_status == "failed" && has_findings {
            ("completed", "findings", None)
        } else if legacy_status == "blocked" {
            ("completed", "blocked", None)
        } else if legacy_status == "done" {
            ("completed", "pass", None)
        } else {
            ("completed", "not-applicable", None)
        };

    let mut map = serde_json::Map::new();
    let mut exec_map = serde_json::Map::new();
    exec_map.insert("status".to_string(), Value::String(exec_status.to_string()));
    map.insert("execution".to_string(), Value::Object(exec_map));

    let mut assess_map = serde_json::Map::new();
    assess_map.insert("verdict".to_string(), Value::String(assess_verdict.to_string()));
    map.insert("assessment".to_string(), Value::Object(assess_map));

    let mut conf_map = serde_json::Map::new();
    conf_map.insert("level".to_string(), Value::String(legacy_conf.to_string()));
    map.insert("confidence".to_string(), Value::Object(conf_map));

    if let Some(ff) = failure_family {
        let mut fail_map = serde_json::Map::new();
        fail_map.insert("family".to_string(), Value::String(ff.to_string()));
        map.insert("failure".to_string(), Value::Object(fail_map));
    }

    derive_outcome(&Value::Object(map))
}
pub struct RunResultSource;

impl RunResultSource {
    pub fn new() -> Self {
        Self
    }
}

impl Default for RunResultSource {
    fn default() -> Self {
        Self::new()
    }
}

impl ObservationSource for RunResultSource {
    fn source_id(&self) -> &'static str {
        "run-result"
    }

    fn observations(&self, root: &Path, w: &Window) -> Result<Vec<Observation>, SourceError> {
        let mut runs = scan_runs(root)?.runs;
        runs.retain(|o| {
            w.since
                .as_ref()
                .map_or(true, |since| o.ts.as_str() >= since.as_str())
                && w.until
                    .as_ref()
                    .map_or(true, |until| o.ts.as_str() <= until.as_str())
        });
        Ok(runs)
    }
}

/// Assignment-relative depth; run attempts under `runs/` do not add depth.
pub const MAX_ASSIGNMENT_DEPTH: usize = 16;

#[derive(Debug, Default)]
pub struct RunScan {
    pub runs: Vec<Observation>,
    pub skipped: BTreeMap<&'static str, usize>,
    pub run_dirs_seen: usize,
    pub recent_runs: usize,
}

impl RunScan {
    fn skip(&mut self, reason: &'static str) {
        *self.skipped.entry(reason).or_default() += 1;
    }

    fn barrier(&mut self, reason: &'static str) {
        self.run_dirs_seen += 1;
        self.skip(reason);
    }
}

/// Scan the owner's settled run records once. Never descend into a `runs/`
/// directory's attempts, which keeps worker output outside this read contract.
pub fn scan_runs(root: &Path) -> Result<RunScan, SourceError> {
    let assignments = root.join(".fgos/assignments");
    let mut scan = RunScan::default();
    let metadata = match std::fs::symlink_metadata(&assignments) {
        Ok(metadata) => metadata,
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => return Ok(scan),
        Err(err) => return Err(SourceError::Io("run-result", err)),
    };
    if metadata.file_type().is_symlink() {
        scan.barrier("symlink");
        return Ok(scan);
    }
    let mut seen_ids = HashSet::new();
    walk_assignments(
        &assignments,
        &assignments,
        0,
        SystemTime::now(),
        &mut seen_ids,
        &mut scan,
    )?;
    scan.runs.sort_by(|a, b| {
        a.ts.cmp(&b.ts)
            .then_with(|| a.subject.id.cmp(&b.subject.id))
    });
    Ok(scan)
}

/// Composition-root callback for Observe. No transcripts or other sources.
pub fn scan_coverage(root: &Path) -> Result<Value, String> {
    let scan = scan_runs(root).map_err(|err| err.to_string())?;
    Ok(serde_json::json!({
        "layoutRule": "v2",
        "runDirsSeen": scan.run_dirs_seen,
        "observed": scan.runs.len(),
        "skipped": scan.skipped,
        "recentRuns": scan.recent_runs,
    }))
}

fn sorted_entries(dir: &Path) -> Result<Vec<std::fs::DirEntry>, SourceError> {
    let mut entries = std::fs::read_dir(dir)
        .map_err(|err| SourceError::Io("run-result", err))?
        .filter_map(Result::ok)
        .collect::<Vec<_>>();
    entries.sort_by_cached_key(|entry| entry.file_name());
    Ok(entries)
}

fn walk_assignments(
    assignments: &Path,
    dir: &Path,
    depth: usize,
    now: SystemTime,
    seen_ids: &mut HashSet<String>,
    scan: &mut RunScan,
) -> Result<(), SourceError> {
    let entries = match sorted_entries(dir) {
        Ok(entries) => entries,
        Err(err) if depth == 0 => return Err(err),
        Err(_) => return Ok(()), // Unreadable/disappearing child; continue its siblings.
    };
    for entry in entries {
        let file_type = match entry.file_type() {
            Ok(file_type) => file_type,
            Err(_) => continue,
        };
        if file_type.is_symlink() {
            scan.barrier("symlink");
        } else if file_type.is_dir() {
            let path = entry.path();
            if entry.file_name() == "runs" {
                scan_assignment_runs(assignments, dir, &path, now, seen_ids, scan)?;
            } else if depth >= MAX_ASSIGNMENT_DEPTH {
                scan.barrier("depth");
            } else {
                walk_assignments(assignments, &path, depth + 1, now, seen_ids, scan)?;
            }
        }
    }
    Ok(())
}

fn read_assignment(dir: &Path) -> Value {
    let path = dir.join("assignment.json");
    // Optional metadata is never a reason to lose an otherwise valid run.
    match std::fs::symlink_metadata(&path) {
        Ok(metadata) if metadata.file_type().is_file() => File::open(path)
            .ok()
            .and_then(|file| serde_json::from_reader(BufReader::new(file)).ok())
            .unwrap_or(Value::Null),
        _ => Value::Null,
    }
}

fn nonempty_string(value: Option<&Value>) -> Option<&str> {
    value
        .and_then(Value::as_str)
        .filter(|s| !s.trim().is_empty())
}

fn scan_assignment_runs(
    assignments: &Path,
    assignment_dir: &Path,
    runs_dir: &Path,
    now: SystemTime,
    seen_ids: &mut HashSet<String>,
    scan: &mut RunScan,
) -> Result<(), SourceError> {
    let assignment_id = assignment_dir
        .strip_prefix(assignments)
        .expect("assignment inside scanner root")
        .to_string_lossy();
    let assignment = read_assignment(assignment_dir);
    let entries = match sorted_entries(runs_dir) {
        Ok(entries) => entries,
        Err(_) => return Ok(()),
    };
    for entry in entries {
        let file_type = match entry.file_type() {
            Ok(file_type) => file_type,
            Err(_) => continue,
        };
        if file_type.is_symlink() {
            scan.barrier("symlink");
            continue;
        }
        if !file_type.is_dir() {
            continue;
        }
        scan.run_dirs_seen += 1;
        let result_path = entry.path().join("result.json");
        let metadata = match std::fs::symlink_metadata(&result_path) {
            Ok(metadata) => metadata,
            Err(_) => {
                scan.skip("unparseable");
                continue;
            }
        };
        if metadata.file_type().is_symlink() {
            scan.skip("symlink");
            continue;
        }
        if !metadata.file_type().is_file() {
            scan.skip("unparseable");
            continue;
        }
        if metadata.modified().ok().is_some_and(|mtime| {
            now.duration_since(mtime).unwrap_or_default() <= Duration::from_secs(60)
        }) {
            scan.recent_runs += 1;
        }
        let record: Value = match File::open(&result_path)
            .ok()
            .and_then(|file| serde_json::from_reader(BufReader::new(file)).ok())
        {
            Some(record) => record,
            None => {
                scan.skip("unparseable");
                continue;
            }
        };
        let run_id = match nonempty_string(record.get("runId")) {
            Some(id) => id,
            None => {
                scan.skip(if nonempty_string(record.get("unitRunId")).is_some() {
                    "inline-record"
                } else {
                    "no-run-id"
                });
                continue;
            }
        };
        let timestamp = match nonempty_string(record.get("settledAt"))
            .or_else(|| nonempty_string(record.get("timestamp")))
        {
            Some(timestamp) => timestamp,
            None => {
                scan.skip("no-timestamp");
                continue;
            }
        };
        // Lexical directory order picks the first valid occurrence, independently
        // of a consumer's window and of filesystem enumeration order.
        if seen_ids.contains(run_id) {
            scan.skip("duplicate-run-id");
            continue;
        }
        seen_ids.insert(run_id.to_string());
        scan.runs.push(run_observation(
            &record,
            &assignment,
            &assignment_id,
            run_id,
            timestamp,
        ));
    }
    Ok(())
}

fn run_observation(
    record: &Value,
    assignment: &Value,
    assignment_id: &str,
    run_id: &str,
    timestamp: &str,
) -> Observation {
    let mut attrs = serde_json::Map::new();
    attrs.insert(
        "executor".to_string(),
        record
            .get("executorId")
            .or_else(|| record.get("executor"))
            .cloned()
            .unwrap_or(Value::Null),
    );
    for key in ["status", "confinement", "durationMs", "usage"] {
        attrs.insert(
            key.to_string(),
            record.get(key).cloned().unwrap_or(Value::Null),
        );
    }
    if let Some(classification) = record.get("classification") {
        attrs.insert("classification".to_string(), classification.clone());
    }
    let outcome = derive_legacy_outcome(record);
    attrs.insert(
        "category".to_string(),
        Value::String(outcome.category.clone()),
    );
    attrs.insert(
        "outcome".to_string(),
        serde_json::to_value(outcome).unwrap_or(Value::Null),
    );
    for key in ["adapter", "role"] {
        attrs.insert(
            key.to_string(),
            record
                .get(key)
                .or_else(|| assignment.get(key))
                .cloned()
                .unwrap_or(Value::Null),
        );
    }
    attrs.insert(
        "assignmentId".to_string(),
        Value::String(assignment_id.to_string()),
    );
    Observation {
        ts: timestamp.to_string(),
        subject: Subject {
            kind: SubjectKind::Run,
            id: run_id.to_string(),
        },
        kind: "run.settled".to_string(),
        attrs,
        source: "run-result",
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_run_result_source() {
        let temp_dir = std::env::temp_dir().join(format!("test_run_result_{}", std::process::id()));
        let _ = fs::remove_dir_all(&temp_dir);
        let asgn_dir = temp_dir
            .join(".fgos")
            .join("assignments")
            .join("asgn_001");
        let run_dir = asgn_dir.join("runs").join("01");
        fs::create_dir_all(&run_dir).unwrap();

        fs::write(
            asgn_dir.join("assignment.json"),
            r#"{"assignmentId":"asgn_001","role":"doer","adapter":null}"#,
        )
        .unwrap();

        fs::write(
            run_dir.join("result.json"),
            r#"{
                "runId": "run_001_01",
                "assignmentId": "asgn_001",
                "executorId": "gemini",
                "status": "done",
                "settledAt": "2026-09-26T02:45:11.712Z",
                "classification": {"category": "clean"}
            }"#,
        )
        .unwrap();

        let source = RunResultSource::new();
        let obs = source
            .observations(&temp_dir, &Window::default())
            .unwrap();

        assert_eq!(obs.len(), 1);
        let o = &obs[0];
        assert_eq!(o.kind, "run.settled");
        assert_eq!(o.subject.kind, SubjectKind::Run);
        assert_eq!(o.subject.id, "run_001_01");
        assert_eq!(o.attrs.get("executor").unwrap(), "gemini");
        assert_eq!(o.attrs.get("status").unwrap(), "done");
        assert_eq!(o.attrs.get("role").unwrap(), "doer");
        assert_eq!(o.attrs.get("adapter").unwrap(), &Value::Null);
        assert!(o.attrs.contains_key("classification"));

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_run_result_source_without_classification_and_corrupt_files() {
        let temp_dir = std::env::temp_dir().join(format!("test_run_result_corrupt_{}", std::process::id()));
        let _ = fs::remove_dir_all(&temp_dir);
        let asgn_dir = temp_dir
            .join(".fgos")
            .join("assignments")
            .join("asgn_002");
        let run_dir = asgn_dir.join("runs").join("01");
        let run_corrupt = asgn_dir.join("runs").join("02");
        fs::create_dir_all(&run_dir).unwrap();
        fs::create_dir_all(&run_corrupt).unwrap();

        fs::write(
            asgn_dir.join("assignment.json"),
            r#"{"assignmentId":"asgn_002","role":"reviewer"}"#,
        )
        .unwrap();

        fs::write(
            run_dir.join("result.json"),
            r#"{
                "runId": "run_002_01",
                "assignmentId": "asgn_002",
                "executorId": "claude",
                "status": "failed",
                "settledAt": "2026-09-26T03:00:00.000Z"
            }"#,
        )
        .unwrap();

        // Corrupt JSON file in run_corrupt
        fs::write(run_corrupt.join("result.json"), "NOT JSON").unwrap();

        let source = RunResultSource::new();
        let obs = source
            .observations(&temp_dir, &Window::default())
            .unwrap();

        assert_eq!(obs.len(), 1);
        let o = &obs[0];
        assert_eq!(o.subject.id, "run_002_01");
        assert!(!o.attrs.contains_key("classification"));
        assert_eq!(o.attrs.get("role").unwrap(), "reviewer");

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_legacy_derivation_fixture() {
        let manifest_dir = Path::new(env!("CARGO_MANIFEST_DIR"));
        let fixture_path = manifest_dir.join("../../../test/fixtures/run-outcome/legacy-derivation.json");
        let content = fs::read_to_string(&fixture_path).expect("read legacy-derivation.json");
        let entries: Vec<Value> = serde_json::from_str(&content).expect("parse legacy-derivation.json");

        assert!(!entries.is_empty(), "fixture entries should not be empty");

        for entry in entries {
            let id = entry.get("id").and_then(|v| v.as_str()).unwrap_or("unknown");
            let record = entry.get("record").expect("entry.record");
            let expected_cat = entry
                .get("expected")
                .and_then(|e| e.get("category"))
                .and_then(|c| c.as_str())
                .expect("expected.category");

            let outcome = derive_legacy_outcome(record);
            assert_eq!(
                outcome.category, expected_cat,
                "Fixture mismatch for id {}: expected {}, got {}",
                id, expected_cat, outcome.category
            );
        }
    }
}
