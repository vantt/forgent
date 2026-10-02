//! Work observation source (Lane A - Phase F6/F7).
//!
//! Implements `ObservationSource` with `source_id: "work"`.
//! Reads `.fgos/events.jsonl` and `.fgos/events/*.jsonl` for timing events
//! (`added`, `moved`, `asked`, `answered`, `gate-approved`).
//! Reads state.json (`.fgos/cache/state.json` or `.fgos/state.json`) for folded state properties:
//! outcomes, settlements, learnings, and entropy signals (missing-actual, stale-doing, stage-entry, awaiting-human).

use fgos_observe::{Observation, ObservationSource, SourceError, Subject, SubjectKind, Window};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::collections::{HashMap, HashSet};
use std::fs::{self, File};
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};

pub const DOMAIN_ENTRY_STAGES_JSON: &str =
    include_str!("../../contracts/domain-entry-steps.json");

pub const FINAL_STATUSES: &[&str] = &[
    "awaiting-approval",
    "blocked",
    "delivered",
    "retrospective",
    "cleanup",
    "done",
];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutcomeEntry {
    pub id: String,
    pub predicted: Option<Value>,
    pub actual: Option<Value>,
    #[serde(rename = "docType")]
    pub doc_type: Option<Value>,
    #[serde(rename = "docPath")]
    pub doc_path: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SettlementChannelData {
    pub count: usize,
    #[serde(rename = "byKindRole")]
    pub by_kind_role: HashMap<String, usize>,
    pub recent: Vec<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearningChannelData {
    pub count: usize,
    pub recent: Vec<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MissingOutcomeNagData {
    pub count: usize,
    pub ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkOutcomesReport {
    pub outcomes: Vec<OutcomeEntry>,
    pub settlement: Option<SettlementChannelData>,
    pub learning: Option<LearningChannelData>,
    #[serde(rename = "missingOutcomeNag")]
    pub missing_outcome_nag: Option<MissingOutcomeNagData>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WorkEntropySignals {
    pub missing_actual: u64,
    pub stale_doing: u64,
    pub stage_entry: u64,
    pub awaiting_human: u64,
    pub total_outcomes_with_actual: u64,
    pub total_settlements: u64,
}

pub struct WorkSource;

impl WorkSource {
    pub fn new() -> Self {
        Self
    }

    pub const VIEW_SCHEMA_VERSION: u64 = 4;

    /// Read raw state json from `.fgos/cache/state.json` or `.fgos/state.json`
    pub fn read_state_json(root: &Path) -> Option<Value> {
        let fgos_dir = root.join(".fgos");
        let cache_state = fgos_dir.join("cache").join("state.json");
        let fallback_state = fgos_dir.join("state.json");

        let state_path = if cache_state.is_file() {
            Some(cache_state)
        } else if fallback_state.is_file() {
            Some(fallback_state)
        } else {
            None
        };

        let path = state_path?;
        let content = fs::read_to_string(path).ok()?;
        let val: Value = serde_json::from_str(&content).ok()?;
        if val.get("viewSchemaVersion").and_then(|v| v.as_u64()) != Some(Self::VIEW_SCHEMA_VERSION) {
            return None;
        }
        Some(val)
    }

    /// Read active runtime claims from `.fgos/runtime/claims/*.json`
    pub fn read_active_claims(root: &Path) -> HashMap<String, Value> {
        let mut claims = HashMap::new();
        let claims_dir = root.join(".fgos").join("runtime").join("claims");
        if !claims_dir.is_dir() {
            return claims;
        }

        if let Ok(entries) = fs::read_dir(claims_dir) {
            for entry in entries.flatten() {
                let p = entry.path();
                if p.is_file() && p.extension().and_then(|s| s.to_str()) == Some("json") {
                    if let Some(stem) = p.file_stem().and_then(|s| s.to_str()) {
                        if let Ok(content) = fs::read_to_string(&p) {
                            if let Ok(val) = serde_json::from_str::<Value>(&content) {
                                claims.insert(stem.to_string(), val);
                            }
                        }
                    }
                }
            }
        }
        claims
    }

    /// Returns the domain-to-entry-step mapping from contract (each domain Workflow's first step)
    pub fn domain_entry_steps() -> HashMap<String, String> {
        serde_json::from_str(DOMAIN_ENTRY_STAGES_JSON).unwrap_or_default()
    }

    /// Read outcomes report (optionally filtered by work item id)
    pub fn read_outcomes_report(root: &Path, filter_id: Option<&str>) -> WorkOutcomesReport {
        let state = Self::read_state_json(root).unwrap_or(Value::Object(Map::new()));

        let outcomes_map = state.get("outcomes").and_then(|v| v.as_object());
        let work_map = state.get("work").and_then(|v| v.as_object());
        let settlements_map = state.get("settlements").and_then(|v| v.as_object());
        let learnings_map = state.get("learnings").and_then(|v| v.as_object());

        // 1. Collect outcome entries
        let mut outcomes = Vec::new();
        if let Some(target_id) = filter_id {
            let entry = outcomes_map.and_then(|m| m.get(target_id));
            outcomes.push(Self::collect_outcome_entry(target_id, entry));
        } else if let Some(map) = outcomes_map {
            for (id, val) in map {
                outcomes.push(Self::collect_outcome_entry(id, Some(val)));
            }
        }

        // 2. Settlement data
        let settlement = Self::collect_settlement_data(settlements_map, filter_id);

        // 3. Learning data
        let learning = Self::collect_learning_data(learnings_map, filter_id);

        // 4. Missing outcome nag
        let missing_outcome_nag = Self::collect_missing_outcome_nag(work_map, outcomes_map, filter_id);

        WorkOutcomesReport {
            outcomes,
            settlement,
            learning,
            missing_outcome_nag,
        }
    }

    fn collect_outcome_entry(id: &str, entry: Option<&Value>) -> OutcomeEntry {
        let predicted = entry.and_then(|e| e.get("predicted")).cloned();
        let actual = entry.and_then(|e| e.get("actual")).cloned();
        let doc_type = entry.and_then(|e| e.get("docType")).cloned();
        let doc_path = entry.and_then(|e| e.get("docPath")).cloned();

        OutcomeEntry {
            id: id.to_string(),
            predicted,
            actual,
            doc_type,
            doc_path,
        }
    }

    fn collect_settlement_data(
        settlements_map: Option<&Map<String, Value>>,
        filter_id: Option<&str>,
    ) -> Option<SettlementChannelData> {
        let map = settlements_map?;
        let mut records: Vec<Value> = Vec::new();

        if let Some(target_id) = filter_id {
            if let Some(arr) = map.get(target_id).and_then(|v| v.as_array()) {
                for rec in arr {
                    let mut obj = rec.as_object().cloned().unwrap_or_default();
                    obj.insert("id".to_string(), Value::String(target_id.to_string()));
                    records.push(Value::Object(obj));
                }
            }
        } else {
            for (id, arr_val) in map {
                if let Some(arr) = arr_val.as_array() {
                    for rec in arr {
                        let mut obj = rec.as_object().cloned().unwrap_or_default();
                        obj.insert("id".to_string(), Value::String(id.clone()));
                        records.push(Value::Object(obj));
                    }
                }
            }
        }

        if records.is_empty() {
            return None;
        }

        let mut by_kind_role: HashMap<String, usize> = HashMap::new();
        for r in &records {
            let kind = r.get("kind").and_then(|k| k.as_str()).unwrap_or("unknown");
            let role = r.get("role").and_then(|k| k.as_str()).unwrap_or("unknown");
            let key = format!("{}/{}", kind, role);
            *by_kind_role.entry(key).or_insert(0) += 1;
        }

        // Sort by ts ascending, take last 5, then reverse (newest first)
        records.sort_by(|a, b| {
            let ts_a = a.get("ts").and_then(|t| t.as_str()).unwrap_or("");
            let ts_b = b.get("ts").and_then(|t| t.as_str()).unwrap_or("");
            ts_a.cmp(ts_b)
        });

        let start_idx = if records.len() > 5 { records.len() - 5 } else { 0 };
        let mut recent: Vec<Value> = records[start_idx..].to_vec();
        recent.reverse();

        Some(SettlementChannelData {
            count: records.len(),
            by_kind_role,
            recent,
        })
    }

    fn collect_learning_data(
        learnings_map: Option<&Map<String, Value>>,
        filter_id: Option<&str>,
    ) -> Option<LearningChannelData> {
        let map = learnings_map?;
        let mut records: Vec<Value> = Vec::new();

        if let Some(target_id) = filter_id {
            if let Some(arr) = map.get(target_id).and_then(|v| v.as_array()) {
                for rec in arr {
                    let mut obj = rec.as_object().cloned().unwrap_or_default();
                    obj.insert("id".to_string(), Value::String(target_id.to_string()));
                    records.push(Value::Object(obj));
                }
            }
        } else {
            for (id, arr_val) in map {
                if let Some(arr) = arr_val.as_array() {
                    for rec in arr {
                        let mut obj = rec.as_object().cloned().unwrap_or_default();
                        obj.insert("id".to_string(), Value::String(id.clone()));
                        records.push(Value::Object(obj));
                    }
                }
            }
        }

        if records.is_empty() {
            return None;
        }

        records.sort_by(|a, b| {
            let ts_a = a.get("ts").and_then(|t| t.as_str()).unwrap_or("");
            let ts_b = b.get("ts").and_then(|t| t.as_str()).unwrap_or("");
            ts_a.cmp(ts_b)
        });

        let start_idx = if records.len() > 5 { records.len() - 5 } else { 0 };
        let mut recent: Vec<Value> = records[start_idx..].to_vec();
        recent.reverse();

        Some(LearningChannelData {
            count: records.len(),
            recent,
        })
    }

    fn collect_missing_outcome_nag(
        work_map: Option<&Map<String, Value>>,
        outcomes_map: Option<&Map<String, Value>>,
        filter_id: Option<&str>,
    ) -> Option<MissingOutcomeNagData> {
        let work = work_map?;
        let final_set: HashSet<&str> = FINAL_STATUSES.iter().copied().collect();

        let mut missing_ids = Vec::new();
        for (id, w_val) in work {
            if let Some(fid) = filter_id {
                if id != fid {
                    continue;
                }
            }
            let status = w_val.get("status").and_then(|s| s.as_str()).unwrap_or("");
            if final_set.contains(status) {
                let has_actual = outcomes_map
                    .and_then(|m| m.get(id))
                    .and_then(|o| o.get("actual"))
                    .map(|a| !a.is_null())
                    .unwrap_or(false);
                if !has_actual {
                    missing_ids.push(id.clone());
                }
            }
        }

        if missing_ids.is_empty() {
            None
        } else {
            Some(MissingOutcomeNagData {
                count: missing_ids.len(),
                ids: missing_ids,
            })
        }
    }

    /// Compute entropy signals from state.json and runtime claims
    pub fn read_entropy_signals(root: &Path) -> WorkEntropySignals {
        let state = Self::read_state_json(root).unwrap_or(Value::Object(Map::new()));
        let claims = Self::read_active_claims(root);
        let entry_steps = Self::domain_entry_steps();
        let default_entry = entry_steps.get("coding").cloned().unwrap_or_else(|| "discovery".to_string());

        let work_map = state.get("work").and_then(|v| v.as_object());
        let outcomes_map = state.get("outcomes").and_then(|v| v.as_object());
        let settlements_map = state.get("settlements").and_then(|v| v.as_object());

        let final_set: HashSet<&str> = FINAL_STATUSES.iter().copied().collect();

        let mut missing_actual = 0;
        let mut stale_doing = 0;
        let mut stage_entry = 0;
        let mut awaiting_human = 0;

        if let Some(work) = work_map {
            for (id, item_val) in work {
                let durable_status = item_val.get("status").and_then(|s| s.as_str()).unwrap_or("");
                let step = item_val.get("workflowStep").and_then(|s| s.as_str()).unwrap_or("");
                let domain = item_val.get("domain").and_then(|s| s.as_str()).unwrap_or("coding");

                // Overlay active runtime claim
                let claim = claims.get(id);
                let claim_is_stale = claim.map(|c| {
                    let pre_status = c.get("preClaimStatus").and_then(|s| s.as_str());
                    pre_status.is_some() && pre_status != Some(durable_status)
                }).unwrap_or(false);

                let effective_status = if claim.is_some() && !claim_is_stale {
                    "doing"
                } else {
                    durable_status
                };

                if final_set.contains(effective_status) {
                    let has_actual = outcomes_map
                        .and_then(|m| m.get(id))
                        .and_then(|o| o.get("actual"))
                        .map(|a| !a.is_null())
                        .unwrap_or(false);
                    if !has_actual {
                        missing_actual += 1;
                    }
                }

                if effective_status == "doing" {
                    stale_doing += 1;
                }
                if effective_status == "awaiting-human" {
                    awaiting_human += 1;
                }

                let is_resolved = effective_status == "done" || effective_status == "wontfix";
                if !is_resolved {
                    let domain_entry = entry_steps.get(domain).unwrap_or(&default_entry);
                    if step == domain_entry {
                        stage_entry += 1;
                    }
                }
            }
        }

        let mut total_outcomes_with_actual = 0;
        if let Some(outcomes) = outcomes_map {
            for (_id, o_val) in outcomes {
                let has_actual = o_val.get("actual").map(|a| !a.is_null()).unwrap_or(false);
                if has_actual {
                    total_outcomes_with_actual += 1;
                }
            }
        }

        let mut total_settlements = 0;
        if let Some(settlements) = settlements_map {
            for (_id, s_val) in settlements {
                if let Some(arr) = s_val.as_array() {
                    total_settlements += arr.len() as u64;
                }
            }
        }

        WorkEntropySignals {
            missing_actual,
            stale_doing,
            stage_entry,
            awaiting_human,
            total_outcomes_with_actual,
            total_settlements,
        }
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
                        if let Some(file_name) = p.file_name().and_then(|s| s.to_str()) {
                            shard_files.push((file_name.to_string(), p));
                        }
                    }
                }
                shard_files.sort_by(|a, b| a.0.cmp(&b.0));
                files.extend(shard_files);
            }
        }

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
                        if let Some(size) = payload.get("size").or_else(|| payload.get("tier")) {
                            attrs.insert("size".to_string(), size.clone());
                        }
                        if let Some(rigor) = payload.get("rigor") {
                            attrs.insert("rigor".to_string(), rigor.clone());
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

impl fgos_observe::contract::WorkObservationSource for WorkSource {
    fn read_outcomes_report(
        &self,
        root: &Path,
        filter_id: Option<&str>,
    ) -> Result<fgos_observe::contract::WorkOutcomesRecord, SourceError> {
        let report = Self::read_outcomes_report(root, filter_id);
        let outcomes = report
            .outcomes
            .into_iter()
            .map(|o| fgos_observe::contract::OutcomeEntryRecord {
                id: o.id,
                predicted: o.predicted,
                actual: o.actual,
                doc_type: o.doc_type,
                doc_path: o.doc_path,
            })
            .collect();

        let settlement = report.settlement.map(|s| fgos_observe::contract::SettlementChannelRecord {
            count: s.count,
            by_kind_role: s.by_kind_role,
            recent: s.recent,
        });

        let learning = report.learning.map(|l| fgos_observe::contract::LearningChannelRecord {
            count: l.count,
            recent: l.recent,
        });

        let missing_outcome_nag = report.missing_outcome_nag.map(|m| fgos_observe::contract::MissingOutcomeNagRecord {
            count: m.count,
            ids: m.ids,
        });

        Ok(fgos_observe::contract::WorkOutcomesRecord {
            outcomes,
            settlement,
            learning,
            missing_outcome_nag,
        })
    }

    fn read_entropy_signals(
        &self,
        root: &Path,
    ) -> Result<fgos_observe::contract::WorkEntropySignalsRecord, SourceError> {
        let sig = Self::read_entropy_signals(root);
        Ok(fgos_observe::contract::WorkEntropySignalsRecord {
            missing_actual: sig.missing_actual,
            stale_doing: sig.stale_doing,
            stage_entry: sig.stage_entry,
            awaiting_human: sig.awaiting_human,
            total_outcomes_with_actual: sig.total_outcomes_with_actual,
            total_settlements: sig.total_settlements,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_work_source_parses_events() {
        let dir = std::env::temp_dir().join(format!("fgos_test_work_src_{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        let fgos_dir = dir.join(".fgos");
        fs::create_dir_all(&fgos_dir).unwrap();

        let event1 = r#"{"type":"work.add","seq":1,"ts":"2026-09-01T10:00:00Z","payload":{"id":"tsk-1","kind":"feature","size":"standard"}}"#;
        let event2 = r#"{"type":"work.move","seq":2,"ts":"2026-09-01T10:05:00Z","payload":{"id":"tsk-1","from":"todo","to":"awaiting-human","ask":"what is this?"}}"#;
        let event3 = r#"{"type":"work.move","seq":3,"ts":"2026-09-01T10:10:00Z","payload":{"id":"tsk-1","from":"awaiting-human","to":"doing","answer":"it is X"}}"#;
        let event4 = r#"{"type":"work.gate-approved","seq":4,"ts":"2026-09-01T10:15:00Z","payload":{"id":"tsk-1","gate":"plan","actor":"human"}}"#;

        let content = format!("{}\n{}\n{}\n{}\n", event1, event2, event3, event4);
        fs::write(fgos_dir.join("events.jsonl"), content).unwrap();

        let source = WorkSource::new();
        let w = Window {
            since: None,
            until: None,
        };
        let obs = source.observations(&dir, &w).unwrap();

        assert_eq!(obs.len(), 6); // added, moved, asked, moved, answered, gate-approved
        assert_eq!(obs[0].kind, "work.added");
        assert_eq!(obs[1].kind, "work.moved");
        assert_eq!(obs[2].kind, "work.asked");
        assert_eq!(obs[3].kind, "work.moved");
        assert_eq!(obs[4].kind, "work.answered");
        assert_eq!(obs[5].kind, "work.gate-approved");

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_read_entropy_signals_from_state() {
        let dir = std::env::temp_dir().join(format!("fgos_test_work_entropy_{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        let fgos_dir = dir.join(".fgos");
        fs::create_dir_all(&fgos_dir).unwrap();

        let state_json = r#"{
            "viewSchemaVersion": 4,
            "work": {
                "tsk-1": { "id": "tsk-1", "status": "awaiting-approval", "workflowStep": "executing", "domain": "coding" },
                "tsk-2": { "id": "tsk-2", "status": "doing", "workflowStep": "executing", "domain": "coding" },
                "tsk-3": { "id": "tsk-3", "status": "todo", "workflowStep": "discovery", "domain": "coding" },
                "tsk-4": { "id": "tsk-4", "status": "awaiting-human", "workflowStep": "executing", "domain": "coding" }
            },
            "outcomes": {
                "tsk-1": { "predicted": {}, "actual": null }
            },
            "settlements": {
                "tsk-1": [ { "kind": "close", "ts": "2026-09-01T10:00:00Z" } ]
            }
        }"#;

        fs::write(fgos_dir.join("state.json"), state_json).unwrap();

        let signals = WorkSource::read_entropy_signals(&dir);
        assert_eq!(signals.missing_actual, 1);
        assert_eq!(signals.stale_doing, 1);
        assert_eq!(signals.stage_entry, 1);
        assert_eq!(signals.awaiting_human, 1);
        assert_eq!(signals.total_settlements, 1);

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_state_view_from_an_older_schema_version_is_not_read() {
        let dir = std::env::temp_dir().join(format!("fgos_test_work_entropy_old_{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        let fgos_dir = dir.join(".fgos");
        fs::create_dir_all(&fgos_dir).unwrap();

        // A view folded before work items recorded `workflowStep` carries `stage`; it must be
        // refolded by the Node reader rather than read here under the new field name.
        let state_json = r#"{
            "viewSchemaVersion": 3,
            "work": { "tsk-3": { "id": "tsk-3", "status": "todo", "stage": "discovery", "domain": "coding" } }
        }"#;
        fs::write(fgos_dir.join("state.json"), state_json).unwrap();

        assert!(WorkSource::read_state_json(&dir).is_none());
        assert_eq!(WorkSource::read_entropy_signals(&dir).stage_entry, 0);

        let _ = fs::remove_dir_all(&dir);
    }
}
