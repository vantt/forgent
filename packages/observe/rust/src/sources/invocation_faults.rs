//! Observation source for invocation faults (Phase F4).
//!
//! Reads `.fgos/logs/invocation-faults.jsonl`.

use crate::contract::{Observation, ObservationSource, SourceError, Subject, SubjectKind, Window};
use serde_json::Value;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::Path;

pub struct InvocationFaultsSource;

impl InvocationFaultsSource {
    pub fn new() -> Self {
        Self
    }
}

impl Default for InvocationFaultsSource {
    fn default() -> Self {
        Self::new()
    }
}

impl ObservationSource for InvocationFaultsSource {
    fn source_id(&self) -> &'static str {
        "invocation-faults"
    }

    fn observations(&self, root: &Path, w: &Window) -> Result<Vec<Observation>, SourceError> {
        let log_path = root.join(".fgos").join("logs").join("invocation-faults.jsonl");
        if !log_path.exists() {
            return Ok(Vec::new());
        }

        let file = match File::open(&log_path) {
            Ok(f) => f,
            Err(e) => return Err(SourceError::Io("invocation-faults", e)),
        };

        let reader = BufReader::new(file);
        let mut observations = Vec::new();

        for line in reader.lines() {
            let line = match line {
                Ok(l) => l,
                Err(_) => continue,
            };
            let line = line.trim();
            if line.is_empty() {
                continue;
            }

            let val: Value = match serde_json::from_str(line) {
                Ok(v) => v,
                Err(_) => continue,
            };

            let ts = match val.get("ts").and_then(|v| v.as_str()) {
                Some(t) => t.to_string(),
                None => continue,
            };

            if let Some(since) = &w.since {
                if ts.as_str() < since.as_str() {
                    continue;
                }
            }
            if let Some(until) = &w.until {
                if ts.as_str() > until.as_str() {
                    continue;
                }
            }

            let mut attrs = serde_json::Map::new();
            if let Some(obj) = val.as_object() {
                for (k, v) in obj {
                    attrs.insert(k.clone(), v.clone());
                }
            }

            observations.push(Observation {
                ts,
                subject: Subject {
                    kind: SubjectKind::Case,
                    id: "host".to_string(),
                },
                kind: "host.fault".to_string(),
                attrs,
                source: "invocation-faults",
            });
        }

        Ok(observations)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_invocation_faults_source() {
        let tmp = std::env::temp_dir().join(format!("test_invoc_faults_{}", std::process::id()));
        let _ = fs::remove_dir_all(&tmp);
        let logs_dir = tmp.join(".fgos").join("logs");
        fs::create_dir_all(&logs_dir).unwrap();

        let log_content = r#"{"ts":"2026-09-01T10:00:00Z","faultClass":"unknown-verb","verb":"bogus","message":"unknown verb"}
{"ts":"2026-09-01T11:00:00Z","faultClass":"requires-existing-store","verb":"add","message":"store missing"}
"#;
        fs::write(logs_dir.join("invocation-faults.jsonl"), log_content).unwrap();

        let src = InvocationFaultsSource::new();
        let w = Window {
            since: Some("2026-09-01T09:00:00Z".to_string()),
            until: Some("2026-09-01T10:30:00Z".to_string()),
        };
        let obs = src.observations(&tmp, &w).unwrap();
        assert_eq!(obs.len(), 1);
        assert_eq!(obs[0].attrs.get("faultClass").unwrap().as_str().unwrap(), "unknown-verb");
    }
}
