//! Writer shard helpers for `.fgos/observe/<store>/<writerId>.jsonl`.

use std::fs;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};

/// Resolves the writer identifier for the current process:
/// prefers `FGOS_SESSION_ID` if set and non-empty, otherwise falls back to `pid-<pid>`.
pub fn resolve_writer_id() -> String {
    if let Ok(val) = std::env::var("FGOS_SESSION_ID") {
        let trimmed = val.trim();
        if !trimmed.is_empty() {
            return trimmed.to_string();
        }
    }
    format!("pid-{}", std::process::id())
}

/// Returns the shard path `<root>/.fgos/observe/<store>/<writerId>.jsonl`
/// ensuring `<root>/.fgos/observe/<store>` directory exists.
pub fn shard_path(root: &Path, store: &str) -> Result<PathBuf, std::io::Error> {
    let dir = root.join(".fgos").join("observe").join(store);
    fs::create_dir_all(&dir)?;
    let writer_id = resolve_writer_id();
    Ok(dir.join(format!("{}.jsonl", writer_id)))
}

/// Reads all lines from all `.jsonl` files under `<root>/.fgos/observe/<store>`,
/// parses each line as JSON, and sorts all records by their `ts` string field ascending.
pub fn read_all_json(root: &Path, store: &str) -> Result<Vec<serde_json::Value>, std::io::Error> {
    let dir = root.join(".fgos").join("observe").join(store);
    if !dir.exists() {
        return Ok(Vec::new());
    }

    let mut records: Vec<(String, serde_json::Value)> = Vec::new();
    let entries = fs::read_dir(&dir)?;
    for entry in entries {
        let entry = entry?;
        let p = entry.path();
        if p.is_file() && p.extension().and_then(|s| s.to_str()) == Some("jsonl") {
            let file = fs::File::open(&p)?;
            let reader = BufReader::new(file);
            for line in reader.lines() {
                let line = line?;
                let trimmed = line.trim();
                if trimmed.is_empty() {
                    continue;
                }
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(trimmed) {
                    let ts = val
                        .get("ts")
                        .and_then(|t| t.as_str())
                        .unwrap_or("")
                        .to_string();
                    records.push((ts, val));
                }
            }
        }
    }

    records.sort_by(|a, b| a.0.cmp(&b.0));
    Ok(records.into_iter().map(|(_, v)| v).collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_shard_path_and_read_all() {
        let tmp = std::env::temp_dir().join(format!("fgos-test-shard-{}", std::process::id()));
        let _ = fs::remove_dir_all(&tmp);
        fs::create_dir_all(&tmp).unwrap();

        let path = shard_path(&tmp, "test_store").unwrap();
        assert!(path.to_string_lossy().ends_with(".jsonl"));

        fs::write(
            &path,
            r#"{"ts":"2026-09-29T10:00:00Z","val":1}
{"ts":"2026-09-29T10:05:00Z","val":2}
"#,
        )
        .unwrap();

        let all = read_all_json(&tmp, "test_store").unwrap();
        assert_eq!(all.len(), 2);
        assert_eq!(all[0]["val"], 1);
        assert_eq!(all[1]["val"], 2);

        let _ = fs::remove_dir_all(&tmp);
    }
}
