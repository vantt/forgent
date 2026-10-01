//! Run Result Evaluator observation source (Lane A2 - Phase F2).

use fgos_observe::{Observation, ObservationSource, SourceError, Subject, SubjectKind, Window};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::fs::File;
use std::io::BufReader;
use std::path::Path;

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
        let assignments_dir = root.join(".fgos").join("assignments");
        if !assignments_dir.exists() {
            return Ok(Vec::new());
        }

        let mut observations = Vec::new();
        // Cache per assignment: (role, adapter, created_at)
        let mut assignment_cache: HashMap<String, (Value, Value, Option<String>)> = HashMap::new();

        let entries = match std::fs::read_dir(&assignments_dir) {
            Ok(e) => e,
            Err(err) => return Err(SourceError::Io("run-result", err)),
        };

        for entry in entries {
            let entry = match entry {
                Ok(e) => e,
                Err(_) => continue,
            };
            let asgn_path = entry.path();
            if !asgn_path.is_dir() {
                continue;
            }

            let asgn_id = entry.file_name().to_string_lossy().to_string();
            let runs_dir = asgn_path.join("runs");
            if !runs_dir.is_dir() {
                continue;
            }

            let run_entries = match std::fs::read_dir(&runs_dir) {
                Ok(e) => e,
                Err(_) => continue,
            };

            for run_entry in run_entries {
                let run_entry = match run_entry {
                    Ok(re) => re,
                    Err(_) => continue,
                };
                let run_path = run_entry.path();
                if !run_path.is_dir() {
                    continue;
                }

                let result_file = run_path.join("result.json");
                if !result_file.is_file() {
                    continue;
                }

                let file = match File::open(&result_file) {
                    Ok(f) => f,
                    Err(_) => continue,
                };
                let reader = BufReader::new(file);
                let json_val: Value = match serde_json::from_reader(reader) {
                    Ok(v) => v,
                    Err(_) => continue, // record hỏng thì bỏ qua
                };

                let run_id = match json_val.get("runId").and_then(|v| v.as_str()) {
                    Some(id) => id.to_string(),
                    None => continue,
                };

                // Read role, adapter, createdAt from assignment.json (cached per assignment)
                let (role, adapter, asgn_created_at) = assignment_cache
                    .entry(asgn_id.clone())
                    .or_insert_with(|| {
                        let asgn_json_path = asgn_path.join("assignment.json");
                        if asgn_json_path.is_file() {
                            if let Ok(af) = File::open(&asgn_json_path) {
                                if let Ok(av) = serde_json::from_reader::<_, Value>(BufReader::new(af)) {
                                    let r = av.get("role").cloned().unwrap_or(Value::Null);
                                    let a = av.get("adapter").cloned().unwrap_or(Value::Null);
                                    let ca = av.get("createdAt").and_then(|v| v.as_str()).map(|s| s.to_string());
                                    return (r, a, ca);
                                }
                            }
                        }
                        (Value::Null, Value::Null, None)
                    })
                    .clone();

                let settled_at = match json_val.get("settledAt").and_then(|v| v.as_str()) {
                    Some(s) => s.to_string(),
                    None => match json_val.get("timestamp").and_then(|v| v.as_str()) {
                        Some(s) => s.to_string(),
                        None => match asgn_created_at {
                            Some(ca) => ca,
                            None => continue,
                        },
                    },
                };

                if let Some(since) = &w.since {
                    if settled_at.as_str() < since.as_str() {
                        continue;
                    }
                }
                if let Some(until) = &w.until {
                    if settled_at.as_str() > until.as_str() {
                        continue;
                    }
                }

                let mut attrs = serde_json::Map::new();
                if let Some(executor) = json_val.get("executorId") {
                    attrs.insert("executor".to_string(), executor.clone());
                } else if let Some(executor) = json_val.get("executor") {
                    attrs.insert("executor".to_string(), executor.clone());
                } else {
                    attrs.insert("executor".to_string(), Value::Null);
                }

                if let Some(status) = json_val.get("status") {
                    attrs.insert("status".to_string(), status.clone());
                } else {
                    attrs.insert("status".to_string(), Value::Null);
                }

                if let Some(classification) = json_val.get("classification") {
                    attrs.insert("classification".to_string(), classification.clone());
                }

                let outcome = derive_legacy_outcome(&json_val);
                attrs.insert(
                    "outcome".to_string(),
                    serde_json::to_value(&outcome).unwrap_or(Value::Null),
                );
                attrs.insert("category".to_string(), Value::String(outcome.category.clone()));

                let adapter_val = json_val.get("adapter").cloned().unwrap_or(adapter);
                attrs.insert("adapter".to_string(), adapter_val);

                let role_val = json_val.get("role").cloned().unwrap_or(role);
                attrs.insert("role".to_string(), role_val);

                let confinement_val = json_val.get("confinement").cloned().unwrap_or(Value::Null);
                attrs.insert("confinement".to_string(), confinement_val);

                let duration_ms_val = json_val.get("durationMs").cloned().unwrap_or(Value::Null);
                attrs.insert("durationMs".to_string(), duration_ms_val);

                let usage_val = json_val.get("usage").cloned().unwrap_or(Value::Null);
                attrs.insert("usage".to_string(), usage_val);

                attrs.insert(
                    "assignmentId".to_string(),
                    json_val
                        .get("assignmentId")
                        .cloned()
                        .unwrap_or_else(|| Value::String(asgn_id.clone())),
                );
                observations.push(Observation {
                    ts: settled_at,
                    subject: Subject {
                        kind: SubjectKind::Run,
                        id: run_id,
                    },
                    kind: "run.settled".to_string(),
                    attrs,
                    source: "run-result",
                });
            }
        }

        observations.sort_by(|a, b| a.ts.cmp(&b.ts));
        Ok(observations)
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
