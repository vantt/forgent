//! Agent Coordination state observation source (Lane A2 - Phase F2).

use fgos_observe::{Observation, ObservationSource, SourceError, Subject, SubjectKind, Window};
use serde_json::Value;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::Path;

pub struct CoordinationSource;

impl CoordinationSource {
    pub fn new() -> Self {
        Self
    }
}

impl Default for CoordinationSource {
    fn default() -> Self {
        Self::new()
    }
}

impl ObservationSource for CoordinationSource {
    fn source_id(&self) -> &'static str {
        "coordination"
    }

    fn observations(&self, root: &Path, w: &Window) -> Result<Vec<Observation>, SourceError> {
        let sessions_dir = root.join(".fgos").join("coordination").join("sessions");
        if !sessions_dir.exists() {
            return Ok(Vec::new());
        }

        let mut observations = Vec::new();

        let entries = match std::fs::read_dir(&sessions_dir) {
            Ok(e) => e,
            Err(err) => return Err(SourceError::Io("coordination", err)),
        };

        for entry in entries {
            let entry = match entry {
                Ok(e) => e,
                Err(_) => continue,
            };
            let session_path = entry.path();
            if !session_path.is_dir() {
                continue;
            }

            let session_id = entry.file_name().to_string_lossy().to_string();

            // 1. Read session.json to see if it's closed/terminal (fallback if events doesn't contain terminal event)
            let mut session_status: Option<String> = None;
            let mut session_completed_at: Option<String> = None;
            let session_json_path = session_path.join("session.json");
            if session_json_path.is_file() {
                if let Ok(sf) = File::open(&session_json_path) {
                    if let Ok(sv) = serde_json::from_reader::<_, Value>(BufReader::new(sf)) {
                        if let Some(st) = sv.get("status").and_then(|v| v.as_str()) {
                            session_status = Some(st.to_string());
                        }
                        if let Some(ca) = sv.get("completedAt").and_then(|v| v.as_str()) {
                            session_completed_at = Some(ca.to_string());
                        }
                    }
                }
            }

            // 2. Read events.jsonl
            let events_file = session_path.join("events.jsonl");
            let mut has_closed_event = false;

            if events_file.is_file() {
                if let Ok(file) = File::open(&events_file) {
                    let reader = BufReader::new(file);
                    for line in reader.lines() {
                        let line = match line {
                            Ok(l) => l,
                            Err(_) => continue,
                        };
                        let line = line.trim();
                        if line.is_empty() {
                            continue;
                        }
                        let event_val: Value = match serde_json::from_str(line) {
                            Ok(v) => v,
                            Err(_) => continue, // skip malformed lines
                        };

                        let event_type = match event_val.get("type").and_then(|v| v.as_str()) {
                            Some(t) => t,
                            None => continue,
                        };

                        let ts = match event_val.get("ts").and_then(|v| v.as_str()) {
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

                        let payload = event_val.get("payload").unwrap_or(&Value::Null);

                        match event_type {
                            "session-opened" => {
                                let mut attrs = serde_json::Map::new();
                                if let Some(obj) = payload.as_object() {
                                    for (k, v) in obj {
                                        attrs.insert(k.clone(), v.clone());
                                    }
                                }
                                observations.push(Observation {
                                    ts,
                                    subject: Subject {
                                        kind: SubjectKind::Session,
                                        id: session_id.clone(),
                                    },
                                    kind: "session.opened".to_string(),
                                    attrs,
                                    source: "coordination",
                                });
                            }
                            "assignment-created" => {
                                let mut attrs = serde_json::Map::new();
                                if let Some(actor_id) = payload.get("actorId") {
                                    attrs.insert("actorId".to_string(), actor_id.clone());
                                }
                                if let Some(asgn_id) = payload.get("assignmentId") {
                                    attrs.insert("assignmentId".to_string(), asgn_id.clone());
                                }
                                observations.push(Observation {
                                    ts,
                                    subject: Subject {
                                        kind: SubjectKind::Session,
                                        id: session_id.clone(),
                                    },
                                    kind: "session.assignment".to_string(),
                                    attrs,
                                    source: "coordination",
                                });
                            }
                            "result-linked" => {
                                let mut attrs = serde_json::Map::new();
                                if let Some(asgn_id) = payload.get("assignmentId") {
                                    attrs.insert("assignmentId".to_string(), asgn_id.clone());
                                }
                                if let Some(run_id) = payload.get("runId") {
                                    attrs.insert("runId".to_string(), run_id.clone());
                                }
                                observations.push(Observation {
                                    ts,
                                    subject: Subject {
                                        kind: SubjectKind::Session,
                                        id: session_id.clone(),
                                    },
                                    kind: "session.result_linked".to_string(),
                                    attrs,
                                    source: "coordination",
                                });
                            }
                            "driver-disposition-recorded" => {
                                let mut attrs = serde_json::Map::new();
                                if let Some(obj) = payload.as_object() {
                                    for (k, v) in obj {
                                        attrs.insert(k.clone(), v.clone());
                                    }
                                }
                                observations.push(Observation {
                                    ts,
                                    subject: Subject {
                                        kind: SubjectKind::Session,
                                        id: session_id.clone(),
                                    },
                                    kind: "session.disposition".to_string(),
                                    attrs,
                                    source: "coordination",
                                });
                            }
                            "session-completed" | "session-partial" | "session-failed"
                            | "session-stopped" | "session-closed" => {
                                has_closed_event = true;
                                let mut attrs = serde_json::Map::new();
                                attrs.insert("terminal".to_string(), Value::Bool(true));
                                attrs.insert(
                                    "status".to_string(),
                                    Value::String(
                                        event_type
                                            .strip_prefix("session-")
                                            .unwrap_or(event_type)
                                            .to_string(),
                                    ),
                                );
                                if let Some(obj) = payload.as_object() {
                                    for (k, v) in obj {
                                        attrs.insert(k.clone(), v.clone());
                                    }
                                }
                                observations.push(Observation {
                                    ts,
                                    subject: Subject {
                                        kind: SubjectKind::Session,
                                        id: session_id.clone(),
                                    },
                                    kind: "session.closed".to_string(),
                                    attrs,
                                    source: "coordination",
                                });
                            }
                            _ => {}
                        }
                    }
                }
            }

            // Fallback: If session.json has a terminal status (completed, partial, failed, cancelled) but no terminal event was in events.jsonl
            if !has_closed_event {
                if let Some(status) = session_status {
                    let is_terminal = matches!(
                        status.as_str(),
                        "completed" | "partial" | "failed" | "cancelled"
                    );
                    if is_terminal {
                        let ts = session_completed_at.unwrap_or_else(|| "".to_string());
                        let in_window = {
                            let mut ok = true;
                            if let Some(since) = &w.since {
                                if !ts.is_empty() && ts.as_str() < since.as_str() {
                                    ok = false;
                                }
                            }
                            if let Some(until) = &w.until {
                                if !ts.is_empty() && ts.as_str() > until.as_str() {
                                    ok = false;
                                }
                            }
                            ok
                        };

                        if in_window && !ts.is_empty() {
                            let mut attrs = serde_json::Map::new();
                            attrs.insert("terminal".to_string(), Value::Bool(true));
                            attrs.insert("status".to_string(), Value::String(status));
                            observations.push(Observation {
                                ts,
                                subject: Subject {
                                    kind: SubjectKind::Session,
                                    id: session_id,
                                },
                                kind: "session.closed".to_string(),
                                attrs,
                                source: "coordination",
                            });
                        }
                    }
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
    fn test_coordination_source() {
        let temp_dir = std::env::temp_dir().join(format!("test_coord_source_{}", std::process::id()));
        let _ = fs::remove_dir_all(&temp_dir);
        let session_dir = temp_dir
            .join(".fgos")
            .join("coordination")
            .join("sessions")
            .join("sess_01");
        fs::create_dir_all(&session_dir).unwrap();

        fs::write(
            session_dir.join("session.json"),
            r#"{"status": "completed", "completedAt": "2026-09-07T07:12:03.871Z"}"#,
        )
        .unwrap();

        let events = r#"{"seq":1,"ts":"2026-09-07T03:25:40.408Z","type":"session-opened","payload":{"coordinationId":"sess_01"}}
{"seq":2,"ts":"2026-09-07T03:26:00.000Z","type":"assignment-created","payload":{"actorId":"doer","assignmentId":"asgn_01"}}
{"seq":3,"ts":"2026-09-07T03:27:00.000Z","type":"driver-disposition-recorded","payload":{"targetRef":"asgn_01","disposition":"accepted"}}
{"seq":4,"ts":"2026-09-07T07:12:03.871Z","type":"session-completed","payload":{}}
"#;
        fs::write(session_dir.join("events.jsonl"), events).unwrap();

        let source = CoordinationSource::new();
        let obs = source
            .observations(&temp_dir, &Window::default())
            .unwrap();

        assert_eq!(obs.len(), 4);
        assert_eq!(obs[0].kind, "session.opened");
        assert_eq!(obs[0].subject.kind, SubjectKind::Session);
        assert_eq!(obs[0].subject.id, "sess_01");

        assert_eq!(obs[1].kind, "session.assignment");
        assert_eq!(obs[1].attrs.get("actorId").unwrap(), "doer");
        assert_eq!(obs[1].attrs.get("assignmentId").unwrap(), "asgn_01");

        assert_eq!(obs[2].kind, "session.disposition");
        assert_eq!(obs[2].attrs.get("disposition").unwrap(), "accepted");

        assert_eq!(obs[3].kind, "session.closed");
        assert_eq!(obs[3].attrs.get("terminal").unwrap(), true);
        assert_eq!(obs[3].attrs.get("status").unwrap(), "completed");

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_partial_session_and_malformed_event() {
        let temp_dir = std::env::temp_dir().join(format!("test_coord_partial_{}", std::process::id()));
        let _ = fs::remove_dir_all(&temp_dir);
        let session_dir = temp_dir
            .join(".fgos")
            .join("coordination")
            .join("sessions")
            .join("sess_partial");
        fs::create_dir_all(&session_dir).unwrap();

        let events = r#"{"seq":1,"ts":"2026-09-05T14:12:12.011Z","type":"session-opened","payload":{}}
CORRUPT JSON LINE
{"seq":2,"ts":"2026-09-05T14:38:03.388Z","type":"session-partial","payload":{"missingActors":["doer"]}}
"#;
        fs::write(session_dir.join("events.jsonl"), events).unwrap();

        let source = CoordinationSource::new();
        let obs = source
            .observations(&temp_dir, &Window::default())
            .unwrap();

        assert_eq!(obs.len(), 2);
        assert_eq!(obs[0].kind, "session.opened");
        assert_eq!(obs[1].kind, "session.closed");
        assert_eq!(obs[1].attrs.get("status").unwrap(), "partial");
        assert_eq!(obs[1].attrs.get("terminal").unwrap(), true);

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
