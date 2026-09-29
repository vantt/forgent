//! Run Result Evaluator observation source (Lane A2 - Phase F2).

use fgos_observe::{Observation, ObservationSource, SourceError, Subject, SubjectKind, Window};
use serde_json::Value;
use std::collections::HashMap;
use std::fs::File;
use std::io::BufReader;
use std::path::Path;

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

                attrs.insert(
                    "assignmentId".to_string(),
                    json_val
                        .get("assignmentId")
                        .cloned()
                        .unwrap_or_else(|| Value::String(asgn_id.clone())),
                );
                attrs.insert("role".to_string(), role);
                attrs.insert("adapter".to_string(), adapter);

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
}
