//! Historical work.friction and settlement reader for lazy migration into Observe (Lane B - Phase F5).

use fgos_observe::contract::{LegacyFrictionRecord, LegacyFrictionSource, SourceError};
use serde_json::Value;
use std::collections::HashMap;
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::Path;

#[derive(Debug, Default, Clone)]
pub struct WorkStateLegacyFrictionSource;

impl WorkStateLegacyFrictionSource {
    pub fn new() -> Self {
        Self
    }
}

#[derive(Debug, Clone)]
struct Settlement {
    ts: String,
    kind: String,
}

#[derive(Debug, Clone)]
struct RawFriction {
    src: String,
    seq: u64,
    ts: String,
    subject_id: String,
    layer: String,
    error_class: String,
    disposition: String,
    detail: String,
    attempts: Option<u32>,
    doc_type: Option<String>,
    producer: Option<String>,
}

impl LegacyFrictionSource for WorkStateLegacyFrictionSource {
    fn source_id(&self) -> &'static str {
        "work.legacy_friction"
    }

    fn read_legacy_frictions(
        &self,
        root: &Path,
        since_cursor: Option<(&str, u64)>,
    ) -> Result<Vec<LegacyFrictionRecord>, SourceError> {
        let fgos_dir = root.join(".fgos");
        if !fgos_dir.exists() {
            return Ok(Vec::new());
        }

        // Discover files: events.jsonl and events/*.jsonl
        let mut files: Vec<(String, std::path::PathBuf)> = Vec::new();
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

        let mut raw_frictions: Vec<RawFriction> = Vec::new();
        let mut settlements: HashMap<String, Vec<Settlement>> = HashMap::new();
        let mut discovery_verdicts: HashMap<String, Vec<bool>> = HashMap::new();

        // Read all events
        for (src, path) in files {
            let file = match fs::File::open(&path) {
                Ok(f) => f,
                Err(_) => continue,
            };
            let reader = BufReader::new(file);

            for line in reader.lines() {
                let line = match line {
                    Ok(l) => l,
                    Err(_) => continue,
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
                let ts = val.get("ts").and_then(|t| t.as_str()).unwrap_or("").to_string();
                let seq = val.get("seq").and_then(|s| s.as_u64()).unwrap_or(0);
                let payload = val.get("payload").and_then(|p| p.as_object());

                let id = payload
                    .and_then(|p| p.get("id"))
                    .and_then(|id_val| id_val.as_str())
                    .unwrap_or("")
                    .to_string();

                if id.is_empty() {
                    continue;
                }

                match event_type {
                    "work.discovery" => {
                        let clear = payload
                            .and_then(|p| p.get("clear"))
                            .and_then(|c| c.as_bool())
                            .unwrap_or(true);
                        discovery_verdicts.entry(id).or_default().push(clear);
                    }
                    "work.friction" => {
                        let layer = payload
                            .and_then(|p| p.get("layer"))
                            .and_then(|l| l.as_str())
                            .unwrap_or("state")
                            .to_string();
                        let error_class = payload
                            .and_then(|p| p.get("errorClass"))
                            .and_then(|e| e.as_str())
                            .unwrap_or("unknown")
                            .to_string();
                        let disposition = payload
                            .and_then(|p| p.get("disposition"))
                            .and_then(|d| d.as_str())
                            .unwrap_or("advisory")
                            .to_string();
                        let detail = payload
                            .and_then(|p| p.get("detail"))
                            .and_then(|d| d.as_str())
                            .unwrap_or("")
                            .to_string();
                        let attempts = payload
                            .and_then(|p| p.get("attempts"))
                            .and_then(|a| a.as_u64())
                            .map(|a| a as u32);
                        let doc_type = payload
                            .and_then(|p| p.get("docType"))
                            .and_then(|dt| dt.as_str())
                            .map(|s| s.to_string());
                        let producer = payload
                            .and_then(|p| p.get("producer"))
                            .and_then(|pr| pr.as_str())
                            .map(|s| s.to_string());

                        raw_frictions.push(RawFriction {
                            src: src.clone(),
                            seq,
                            ts,
                            subject_id: id,
                            layer,
                            error_class,
                            disposition,
                            detail,
                            attempts,
                            doc_type,
                            producer,
                        });
                    }
                    "work.move" => {
                        let answer = payload.and_then(|p| p.get("answer")).and_then(|a| a.as_str());
                        let to = payload.and_then(|p| p.get("to")).and_then(|t| t.as_str()).unwrap_or("");

                        let kind = if answer.is_some() {
                            Some("answer")
                        } else if to == "done" {
                            Some("done")
                        } else if to == "wontfix" {
                            Some("wontfix")
                        } else {
                            None
                        };

                        if let Some(k) = kind {
                            settlements.entry(id).or_default().push(Settlement {
                                ts,
                                kind: k.to_string(),
                            });
                        }
                    }
                    // `work.stage` is the name a binary from before the rename still writes.
                    "work.step" | "work.stage" => {
                        let from = payload.and_then(|p| p.get("from")).and_then(|f| f.as_str()).unwrap_or("");
                        let last_verdict = discovery_verdicts.get(&id).and_then(|v| v.last()).copied();

                        if from == "discovery" && last_verdict != Some(false) {
                            settlements.entry(id).or_default().push(Settlement {
                                ts,
                                kind: "clarify-pass".to_string(),
                            });
                        }
                    }
                    _ => {}
                }
            }
        }

        // Link settlements and build LegacyFrictionRecords
        let mut records = Vec::new();
        for raw in raw_frictions {
            if let Some((cursor_src, cursor_seq)) = since_cursor {
                if raw.src == cursor_src && raw.seq <= cursor_seq {
                    continue;
                }
            }

            let mut earliest_settlement: Option<&Settlement> = None;
            if let Some(setts) = settlements.get(&raw.subject_id) {
                for s in setts {
                    if s.ts.as_str() > raw.ts.as_str() {
                        match earliest_settlement {
                            None => earliest_settlement = Some(s),
                            Some(cur) => {
                                if s.ts.as_str() < cur.ts.as_str() {
                                    earliest_settlement = Some(s);
                                }
                            }
                        }
                    }
                }
            }

            let resolved = earliest_settlement.is_some();
            let resolve_reason = earliest_settlement.map(|s| format!("{}@{}", s.kind, s.ts));

            records.push(LegacyFrictionRecord {
                src: raw.src,
                seq: raw.seq,
                ts: raw.ts,
                subject_id: raw.subject_id,
                layer: raw.layer,
                error_class: raw.error_class,
                disposition: raw.disposition,
                detail: raw.detail,
                attempts: raw.attempts,
                doc_type: raw.doc_type,
                producer: raw.producer,
                resolved,
                resolve_reason,
            });
        }

        // Sort by ts ascending, then src, then seq
        records.sort_by(|a, b| {
            a.ts.cmp(&b.ts)
                .then_with(|| a.src.cmp(&b.src))
                .then_with(|| a.seq.cmp(&b.seq))
        });

        Ok(records)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_legacy_friction_reader() {
        let tmp = std::env::temp_dir().join(format!("fgos-legacy-fric-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&tmp);
        let fgos = tmp.join(".fgos");
        fs::create_dir_all(&fgos).unwrap();

        let events_jsonl = fgos.join("events.jsonl");
        fs::write(
            &events_jsonl,
            r#"{"seq":1,"ts":"2026-07-01T10:00:00Z","type":"work.friction","payload":{"id":"tsk-1","layer":"verification","errorClass":"verify-miss","disposition":"blocked","detail":"failed"}}
{"seq":2,"ts":"2026-07-01T10:05:00Z","type":"work.move","payload":{"id":"tsk-1","to":"done"}}
{"seq":3,"ts":"2026-07-01T10:10:00Z","type":"work.friction","payload":{"id":"tsk-2","layer":"state","errorClass":"merge-conflict","disposition":"blocked","detail":"conflict"}}
"#,
        )
        .unwrap();

        let source = WorkStateLegacyFrictionSource::new();
        let records = source.read_legacy_frictions(&tmp, None).unwrap();
        assert_eq!(records.len(), 2);
        assert_eq!(records[0].subject_id, "tsk-1");
        assert!(records[0].resolved);
        assert_eq!(records[0].resolve_reason.as_deref(), Some("done@2026-07-01T10:05:00Z"));

        assert_eq!(records[1].subject_id, "tsk-2");
        assert!(!records[1].resolved);
        assert_eq!(records[1].resolve_reason, None);

        let filtered = source
            .read_legacy_frictions(&tmp, Some(("events.jsonl", 1)))
            .unwrap();
        assert_eq!(filtered.len(), 1);
        assert_eq!(filtered[0].subject_id, "tsk-2");

        let _ = fs::remove_dir_all(&tmp);
    }
}
