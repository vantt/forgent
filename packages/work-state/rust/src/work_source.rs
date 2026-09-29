//! Work observation source (Lane A - Phase F6).
//!
//! Implements `ObservationSource` with `source_id: "work"`.
//! Reads `.fgos/events.jsonl` and `.fgos/events/*.jsonl` for timing events
//! (`added`, `moved`, `asked`, `answered`, `gate-approved`).
//! State projection (.fgos/cache/state.json or .fgos/state.json) is used for folded state properties.

use fgos_observe::{Observation, ObservationSource, SourceError, Subject, SubjectKind, Window};
use serde_json::{Map, Value};
use std::collections::HashSet;
use std::fs::{self, File};
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};

pub struct WorkSource;

impl WorkSource {
    pub fn new() -> Self {
        Self
    }
}

impl Default for WorkSource {
    fn default() -> Self {
        Self::new()
    }
}

impl ObservationSource for WorkSource {
    fn source_id(&self) -> &'static str {
        "work"
    }

    fn observations(&self, root: &Path, w: &Window) -> Result<Vec<Observation>, SourceError> {
        let fgos_dir = root.join(".fgos");
        if !fgos_dir.exists() {
            return Ok(Vec::new());
        }

        // Discover files: events.jsonl and events/*.jsonl
        let mut files: Vec<(String, PathBuf)> = Vec::new();
        let baseline = fgos_dir.join("events.jsonl");
        if baseline.is_file() {
            files.push(("events.jsonl".to_string(), baseline));
        }

        let events_dir = fgos_dir.join("events");
        if events_dir.is_dir() {
            if let Ok(entries) = fs::read_dir(&events_dir) {
                let mut shard_files = Vec::new();
                for entry in entries.flatten() {
                    let p = entry.path();
                    if p.is_file() && p.extension().and_then(|s| s.to_str()) == Some("jsonl") {
                        if let Some(name) = p.file_name().and_then(|n| n.to_str()) {
                            shard_files.push((format!("events/{}", name), p));
                        }
                    }
                }
                shard_files.sort_by(|a, b| a.0.cmp(&b.0));
                files.extend(shard_files);
            }
        }

        // Optionally read state.json for revision check / cached state confirmation if needed
        let cache_state = fgos_dir.join("cache").join("state.json");
        let fallback_state = fgos_dir.join("state.json");
        let _state_file = if cache_state.is_file() {
            Some(cache_state)
        } else if fallback_state.is_file() {
            Some(fallback_state)
        } else {
            None
        };

        let mut observations = Vec::new();
        let mut seen: HashSet<(String, u64)> = HashSet::new();

        for (default_src, path) in files {
            let file = match File::open(&path) {
                Ok(f) => f,
                Err(e) => return Err(SourceError::Io("work", e)),
            };
            let reader = BufReader::new(file);

            for line in reader.lines() {
                let line = match line {
                    Ok(l) => l,
                    Err(e) => return Err(SourceError::Io("work", e)),
                };
                let trimmed = line.trim();
                if trimmed.is_empty() {
                    continue;
                }

                let val: Value = match serde_json::from_str(trimmed) {
                    Ok(v) => v,
                    Err(_) => continue,
                };

                let event_type = val.get("type").and_then(|t| t.as_str()).unwrap_or("");
                let ts = val.get("ts").and_then(|t| t.as_str()).unwrap_or("");
                if ts.is_empty() {
                    continue;
                }

                // Check window bounds if provided
                if let Some(since) = &w.since {
                    if ts < since.as_str() {
                        continue;
                    }
                }
                if let Some(until) = &w.until {
                    if ts > until.as_str() {
                        continue;
                    }
                }

                let seq = val.get("seq").and_then(|s| s.as_u64()).unwrap_or(0);
                let src = val
                    .get("src")
                    .and_then(|s| s.as_str())
                    .unwrap_or(&default_src)
                    .to_string();

                if seq > 0 && !seen.insert((src, seq)) {
                    continue; // dedupe (src, seq)
                }

                let payload = match val.get("payload").and_then(|p| p.as_object()) {
                    Some(p) => p,
                    None => continue,
                };

                let id = match payload.get("id").and_then(|id_val| id_val.as_str()) {
                    Some(id) if !id.is_empty() => id,
                    _ => continue,
                };

                let subject = Subject {
                    kind: SubjectKind::Work,
                    id: id.to_string(),
                };

                match event_type {
                    "work.add" => {
                        let mut attrs = Map::new();
                        if let Some(kind) = payload.get("kind") {
                            attrs.insert("kind".to_string(), kind.clone());
                        }
                        if let Some(tier) = payload.get("tier") {
                            attrs.insert("tier".to_string(), tier.clone());
                        }
                        observations.push(Observation {
                            ts: ts.to_string(),
                            subject,
                            kind: "work.added".to_string(),
                            attrs,
                            source: "work",
                        });
                    }
                    "work.move" => {
                        let from = payload
                            .get("from")
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        let to = payload
                            .get("to")
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();

                        let mut attrs = Map::new();
                        attrs.insert("from".to_string(), Value::String(from.clone()));
                        attrs.insert("to".to_string(), Value::String(to.clone()));

                        observations.push(Observation {
                            ts: ts.to_string(),
                            subject: subject.clone(),
                            kind: "work.moved".to_string(),
                            attrs,
                            source: "work",
                        });

                        // work.asked: to == awaiting-human with payload.ask
                        if to == "awaiting-human" && payload.contains_key("ask") {
                            let mut ask_attrs = Map::new();
                            if let Some(ask) = payload.get("ask") {
                                ask_attrs.insert("ask".to_string(), ask.clone());
                            }
                            observations.push(Observation {
                                ts: ts.to_string(),
                                subject: subject.clone(),
                                kind: "work.asked".to_string(),
                                attrs: ask_attrs,
                                source: "work",
                            });
                        }

                        // work.answered: from == awaiting-human with payload.answer
                        if from == "awaiting-human" && payload.contains_key("answer") {
                            let mut ans_attrs = Map::new();
                            if let Some(ans) = payload.get("answer") {
                                ans_attrs.insert("answer".to_string(), ans.clone());
                            }
                            observations.push(Observation {
                                ts: ts.to_string(),
                                subject,
                                kind: "work.answered".to_string(),
                                attrs: ans_attrs,
                                source: "work",
                            });
                        }
                    }
                    "work.gate-approve" | "work.gate-approved" => {
                        let mut attrs = Map::new();
                        if let Some(gate) = payload.get("gate") {
                            attrs.insert("gate".to_string(), gate.clone());
                        }
                        if let Some(actor) = payload.get("actor") {
                            attrs.insert("actor".to_string(), actor.clone());
                        }
                        observations.push(Observation {
                            ts: ts.to_string(),
                            subject,
                            kind: "work.gate-approved".to_string(),
                            attrs,
                            source: "work",
                        });
                    }
                    _ => {}
                }
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
    fn test_work_source_parses_events() {
        let tmp = std::env::temp_dir().join(format!("fgos_test_work_source_{}", std::process::id()));
        let _ = fs::remove_dir_all(&tmp);
        let fgos = tmp.join(".fgos");
        fs::create_dir_all(&fgos).unwrap();

        let events_jsonl = fgos.join("events.jsonl");
        fs::write(
            &events_jsonl,
            r#"{"seq":1,"ts":"2026-09-01T10:00:00Z","type":"work.add","payload":{"id":"tsk-1","kind":"task"}}
{"seq":2,"ts":"2026-09-01T10:05:00Z","type":"work.move","payload":{"id":"tsk-1","from":"todo","to":"awaiting-human","ask":"what to do?"}}
{"seq":3,"ts":"2026-09-01T10:10:00Z","type":"work.move","payload":{"id":"tsk-1","from":"awaiting-human","to":"doing","answer":"do this"}}
{"seq":4,"ts":"2026-09-01T10:20:00Z","type":"work.gate-approve","payload":{"id":"tsk-1","gate":"validateApprove"}}
{"seq":5,"ts":"2026-09-01T10:30:00Z","type":"work.move","payload":{"id":"tsk-1","from":"doing","to":"awaiting-approval"}}
{"seq":6,"ts":"2026-09-01T10:40:00Z","type":"work.move","payload":{"id":"tsk-1","from":"awaiting-approval","to":"delivered"}}
"#,
        )
        .unwrap();

        let source = WorkSource::new();
        let obs = source.observations(&tmp, &Window::default()).unwrap();

        assert_eq!(obs.len(), 8);
        // 1: work.added
        // 2: work.moved + work.asked (2)
        // 3: work.moved + work.answered (2)
        // 4: work.gate-approved (1)
        // 5: work.moved (1)
        // 6: work.moved (1)
        // Total = 1 + 2 + 2 + 1 + 1 + 1 = 8.
        let kinds: Vec<&str> = obs.iter().map(|o| o.kind.as_str()).collect();
        assert_eq!(
            kinds,
            vec![
                "work.added",
                "work.moved",
                "work.asked",
                "work.moved",
                "work.answered",
                "work.gate-approved",
                "work.moved",
                "work.moved"
            ]
        );

        let _ = fs::remove_dir_all(&tmp);
    }
}
