//! Claude Code transcripts observation source (Lane A2 - Phase F2).

use crate::{Observation, ObservationSource, SourceError, Subject, SubjectKind, Window};
use serde::Deserialize;
use serde_json::Value;

#[derive(Deserialize)]
struct FastLine<'a> {
    #[serde(borrow)]
    timestamp: Option<&'a str>,
    #[serde(borrow)]
    cwd: Option<&'a str>,
    #[serde(borrow)]
    session_id: Option<&'a str>,
    #[serde(borrow, rename = "sessionId")]
    session_id_camel: Option<&'a str>,
    message: Option<FastMessage<'a>>,
}

#[derive(Deserialize)]
struct FastMessage<'a> {
    #[serde(borrow)]
    id: Option<&'a str>,
    #[serde(borrow)]
    model: Option<&'a str>,
    #[serde(borrow)]
    timestamp: Option<&'a str>,
    #[serde(borrow)]
    cwd: Option<&'a str>,
    usage: Option<FastUsage>,
}

#[derive(Deserialize)]
struct FastUsage {
    input_tokens: Option<u64>,
    output_tokens: Option<u64>,
    cache_creation_input_tokens: Option<u64>,
    cache_read_input_tokens: Option<u64>,
}
use std::collections::HashSet;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::Command;

pub struct ClaudeTranscriptsSource;

impl ClaudeTranscriptsSource {
    pub fn new() -> Self {
        Self
    }
}

impl Default for ClaudeTranscriptsSource {
    fn default() -> Self {
        Self::new()
    }
}

fn parse_iso_secs(s: &str) -> Option<i64> {
    if s.len() < 19 {
        return None;
    }
    let y: i64 = s.get(0..4)?.parse().ok()?;
    let m: i64 = s.get(5..7)?.parse().ok()?;
    let d: i64 = s.get(8..10)?.parse().ok()?;
    let hour: i64 = s.get(11..13)?.parse().ok()?;
    let min: i64 = s.get(14..16)?.parse().ok()?;
    let sec: i64 = s.get(17..19)?.parse().ok()?;

    let y_adj = if m <= 2 { y - 1 } else { y };
    let m_adj = if m <= 2 { m + 9 } else { m - 3 };
    let era = (if y_adj >= 0 { y_adj } else { y_adj - 399 }) / 400;
    let yoe = (y_adj - era * 400) as u32;
    let doy = (153 * m_adj + 2) / 5 + d - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy as u32;
    let days = era * 146097 + doe as i64 - 719468;

    Some(days * 86400 + hour * 3600 + min * 60 + sec)
}
/// Helper to get valid project and worktree paths from git.
fn get_valid_cwds(root: &Path) -> Vec<PathBuf> {
    let mut cwds = Vec::new();
    if let Ok(canon) = root.canonicalize() {
        cwds.push(canon);
    } else {
        cwds.push(root.to_path_buf());
    }

    // Run git worktree list --porcelain to discover other worktrees
    if let Ok(output) = Command::new("git")
        .arg("-C")
        .arg(root)
        .args(["worktree", "list", "--porcelain"])
        .output()
    {
        if output.status.success() {
            let text = String::from_utf8_lossy(&output.stdout);
            for line in text.lines() {
                if let Some(worktree_path) = line.strip_prefix("worktree ") {
                    let p = PathBuf::from(worktree_path.trim());
                    if let Ok(canon) = p.canonicalize() {
                        if !cwds.contains(&canon) {
                            cwds.push(canon);
                        }
                    } else if !cwds.contains(&p) {
                        cwds.push(p);
                    }
                }
            }
        }
    }
    cwds
}

/// Encodes project dir replacing '/' and '.' with '-'
pub fn encode_project_dir(path: &Path) -> String {
    let s = path.to_string_lossy();
    let mut encoded = String::with_capacity(s.len());
    for c in s.chars() {
        if c == '/' || c == '.' {
            encoded.push('-');
        } else {
            encoded.push(c);
        }
    }
    encoded
}

impl ObservationSource for ClaudeTranscriptsSource {
    fn source_id(&self) -> &'static str {
        "claude-transcripts"
    }

    fn observations(&self, root: &Path, w: &Window) -> Result<Vec<Observation>, SourceError> {
        let claude_dir = match std::env::var("CLAUDE_CONFIG_DIR") {
            Ok(dir) => PathBuf::from(dir),
            Err(_) => match std::env::var("HOME") {
                Ok(home) => PathBuf::from(home).join(".claude"),
                Err(_) => return Ok(Vec::new()),
            },
        };

        let projects_dir = claude_dir.join("projects");
        if !projects_dir.is_dir() {
            return Ok(Vec::new());
        }

        let root_canon = root.canonicalize().unwrap_or_else(|_| root.to_path_buf());
        let enc = encode_project_dir(&root_canon);
        let worktree_prefix = format!("{enc}--claude-worktrees-");

        let valid_cwds = get_valid_cwds(&root_canon);

        let entries = match std::fs::read_dir(&projects_dir) {
            Ok(e) => e,
            Err(err) => return Err(SourceError::Io("claude-transcripts", err)),
        };

        let mut matching_dirs = Vec::new();
        for entry in entries {
            let entry = match entry {
                Ok(e) => e,
                Err(_) => continue,
            };
            let p = entry.path();
            if !p.is_dir() {
                continue;
            }
            let name = entry.file_name().to_string_lossy().to_string();
            if name == enc || name.starts_with(&worktree_prefix) {
                matching_dirs.push(p);
            }
        }

        let mut observations = Vec::new();
        let mut seen_message_ids: HashSet<String> = HashSet::new();

        for proj_dir in matching_dirs {
            let files = match std::fs::read_dir(&proj_dir) {
                Ok(f) => f,
                Err(_) => continue,
            };

            for file_entry in files {
                let file_entry = match file_entry {
                    Ok(fe) => fe,
                    Err(_) => continue,
                };
                let path = file_entry.path();
                if path.extension().and_then(|ext| ext.to_str()) != Some("jsonl") {
                    continue;
                }

                // Filter by file mtime >= since if since is provided
                if let Some(since) = &w.since {
                    if let Ok(meta) = file_entry.metadata() {
                        if let Ok(mtime) = meta.modified() {
                            if let Ok(dur) = mtime.duration_since(std::time::UNIX_EPOCH) {
                                let mtime_secs = dur.as_secs() as i64;
                                if let Some(since_secs) = parse_iso_secs(since) {
                                    // Give 1 day buffer for timezone / clock skew
                                    if mtime_secs < since_secs - 86400 {
                                        continue;
                                    }
                                }
                            }
                        }
                    }
                }

                let file = match File::open(&path) {
                    Ok(f) => f,
                    Err(_) => continue,
                };

                let reader = BufReader::with_capacity(128 * 1024, file);
                for line in reader.lines() {
                    let line = match line {
                        Ok(l) => l,
                        Err(_) => continue,
                    };
                    let line = line.trim();
                    if line.is_empty() || !line.contains("\"usage\"") {
                        continue;
                    }

                    let parsed: FastLine = match serde_json::from_str(line) {
                        Ok(v) => v,
                        Err(_) => continue,
                    };

                    let msg = match &parsed.message {
                        Some(m) => m,
                        None => continue,
                    };

                    let usage = match &msg.usage {
                        Some(u) => u,
                        None => continue,
                    };

                    // Check cwd of record
                    let record_cwd = parsed.cwd.or(msg.cwd);
                    if let Some(rcwd) = record_cwd {
                        let path_rcwd = Path::new(rcwd);
                        let is_valid = valid_cwds.iter().any(|v| path_rcwd.starts_with(v));
                        if !is_valid {
                            continue;
                        }
                    }

                    // Check timestamp before message id allocation
                    let ts_str = match parsed.timestamp {
                        Some(t) => t,
                        None => match msg.timestamp {
                            Some(t) => t,
                            None => continue,
                        },
                    };

                    if let Some(since) = &w.since {
                        if ts_str < since.as_str() {
                            continue;
                        }
                    }
                    if let Some(until) = &w.until {
                        if ts_str > until.as_str() {
                            continue;
                        }
                    }

                    // Dedupe by message.id
                    let msg_id = match msg.id {
                        Some(id) => id,
                        None => continue,
                    };

                    if seen_message_ids.contains(msg_id) {
                        continue;
                    }
                    seen_message_ids.insert(msg_id.to_string());
                    let ts = ts_str.to_string();
                    let session_id = parsed
                        .session_id_camel
                        .or(parsed.session_id)
                        .unwrap_or("")
                        .to_string();

                    let model = msg
                        .model
                        .unwrap_or("unknown")
                        .to_string();

                    let input_tokens = usage.input_tokens.unwrap_or(0);
                    let output_tokens = usage.output_tokens.unwrap_or(0);
                    let cache_read = usage.cache_read_input_tokens.unwrap_or(0);
                    let cache_creation = usage.cache_creation_input_tokens.unwrap_or(0);
                    let mut attrs = serde_json::Map::new();
                    attrs.insert("sessionId".to_string(), Value::String(session_id));
                    attrs.insert("model".to_string(), Value::String(model));
                    attrs.insert("input_tokens".to_string(), Value::from(input_tokens));
                    attrs.insert("output_tokens".to_string(), Value::from(output_tokens));
                    attrs.insert("cache_read".to_string(), Value::from(cache_read));
                    attrs.insert("cache_creation".to_string(), Value::from(cache_creation));

                    observations.push(Observation {
                        ts,
                        subject: Subject {
                            kind: SubjectKind::Case,
                            id: "".to_string(), // subject: case: (assigned in F4 based on time window)
                        },
                        kind: "llm.usage".to_string(),
                        attrs,
                        source: "claude-transcripts",
                    });
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
    fn test_encode_project_dir() {
        let p = Path::new("/home/vantt/projects/forgentX");
        assert_eq!(encode_project_dir(p), "-home-vantt-projects-forgentX");
        let p2 = Path::new("/var/data.test/repo");
        assert_eq!(encode_project_dir(p2), "-var-data-test-repo");
    }

    #[test]
    fn test_claude_transcripts_dedupe_and_filter() {
        let temp_dir = std::env::temp_dir().join(format!("test_claude_transcripts_{}", std::process::id()));
        let _ = fs::remove_dir_all(&temp_dir);
        let home_dir = temp_dir.join("home");
        let project_root = temp_dir.join("project");
        fs::create_dir_all(&project_root).unwrap();

        let enc = encode_project_dir(&project_root);
        let projects_dir = home_dir.join("projects").join(&enc);
        fs::create_dir_all(&projects_dir).unwrap();

        std::env::set_var("CLAUDE_CONFIG_DIR", home_dir.to_str().unwrap());

        let file_path = projects_dir.join("test-session.jsonl");
        let content = format!(
            r#"{{"sessionId":"s1","cwd":"{cwd}","timestamp":"2026-09-29T10:00:00Z","message":{{"id":"msg_1","model":"claude-3-5-sonnet","usage":{{"input_tokens":100,"output_tokens":50,"cache_read_input_tokens":10,"cache_creation_input_tokens":5}}}}}}
{{"sessionId":"s1","cwd":"{cwd}","timestamp":"2026-09-29T10:01:00Z","message":{{"id":"msg_1","model":"claude-3-5-sonnet","usage":{{"input_tokens":100,"output_tokens":50,"cache_read_input_tokens":10,"cache_creation_input_tokens":5}}}}}}
{{"sessionId":"s1","cwd":"{cwd}","timestamp":"2026-09-29T10:02:00Z","message":{{"id":"msg_2","model":"claude-3-5-sonnet","usage":{{"input_tokens":200,"output_tokens":80,"cache_read_input_tokens":20,"cache_creation_input_tokens":0}}}}}}
{{"sessionId":"s1","cwd":"/different/path","timestamp":"2026-09-29T10:03:00Z","message":{{"id":"msg_3","model":"claude-3-5-sonnet","usage":{{"input_tokens":50,"output_tokens":20,"cache_read_input_tokens":0,"cache_creation_input_tokens":0}}}}}}
"#,
            cwd = project_root.to_str().unwrap()
        );
        fs::write(file_path, content).unwrap();

        let source = ClaudeTranscriptsSource::new();
        let obs = source
            .observations(&project_root, &Window::default())
            .unwrap();

        let _ = fs::remove_dir_all(&temp_dir);

        // msg_1 was duplicated (should be deduplicated to 1)
        // msg_3 was from /different/path (should be filtered out)
        // Total should be 2 observations: msg_1 and msg_2
        assert_eq!(obs.len(), 2);
        assert_eq!(obs[0].attrs.get("input_tokens").unwrap(), 100);
        assert_eq!(obs[0].attrs.get("output_tokens").unwrap(), 50);
        assert_eq!(obs[0].attrs.get("cache_read").unwrap(), 10);
        assert_eq!(obs[0].attrs.get("cache_creation").unwrap(), 5);

        assert_eq!(obs[1].attrs.get("input_tokens").unwrap(), 200);
        assert_eq!(obs[1].attrs.get("output_tokens").unwrap(), 80);
    }
}
