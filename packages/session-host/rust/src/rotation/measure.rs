//! How full a session's context window is, as a fraction. The status-line sidecar is the primary source: it carries
//! the window size and the current usage, and its record for the turn lands shortly AFTER the Stop hook fires, so
//! only a record newer than the hook's own timestamp counts as fresh. The transcript is the fallback and is one
//! turn behind at Stop, so a fraction from it is reported `stale`.

use serde_json::Value;
use std::path::Path;
use std::time::{Duration, Instant};

/// How long a Stop hook waits for a fresh sidecar record.
pub const FRESH_WAIT: Duration = Duration::from_millis(1500);
const POLL: Duration = Duration::from_millis(100);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Source {
    Sidecar,
    Transcript,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Measure {
    pub fraction: f64,
    pub tokens: u64,
    pub window_size: u64,
    pub source: Source,
    /// The transcript lags one turn at Stop; a sidecar record newer than the hook is current.
    pub stale: bool,
}

fn lines_of(file: &Path) -> Vec<Value> {
    std::fs::read_to_string(file)
        .map(|text| {
            text.lines()
                .filter(|l| !l.trim().is_empty())
                .filter_map(|l| serde_json::from_str::<Value>(l).ok())
                .collect()
        })
        .unwrap_or_default()
}

fn tokens_of(usage: &Value) -> u64 {
    [
        "input_tokens",
        "cache_creation_input_tokens",
        "cache_read_input_tokens",
    ]
    .iter()
    .filter_map(|key| usage.get(*key).and_then(Value::as_u64))
    .sum()
}

/// Fraction from one sidecar record, or `None` when it carries no usage or window.
pub fn from_sidecar_record(record: &Value) -> Option<Measure> {
    let window = record.get("context_window")?;
    let usage = window.get("current_usage").filter(|u| u.is_object())?;
    let size = window
        .get("context_window_size")?
        .as_u64()
        .filter(|s| *s > 0)?;
    let tokens = tokens_of(usage);
    Some(Measure {
        fraction: tokens as f64 / size as f64,
        tokens,
        window_size: size,
        source: Source::Sidecar,
        stale: false,
    })
}

/// The newest record of `session_id` (any session when `None`) whose numeric `ts` (epoch milliseconds) is later
/// than `after_ms`.
pub fn latest_sidecar_record(
    sidecar: &Path,
    session_id: Option<&str>,
    after_ms: u64,
) -> Option<Value> {
    let mut found: Option<(u64, Value)> = None;
    for record in lines_of(sidecar) {
        if session_id.is_some_and(|id| record.get("session_id").and_then(Value::as_str) != Some(id))
        {
            continue;
        }
        let Some(ts) = record
            .get("ts")
            .and_then(Value::as_u64)
            .filter(|ts| *ts > after_ms)
        else {
            continue;
        };
        if found.as_ref().is_none_or(|(best, _)| ts >= *best) {
            found = Some((ts, record));
        }
    }
    found.map(|(_, record)| record)
}

/// Fraction from the transcript: the last non-sidechain assistant entry, deduplicated by `message.id`, over
/// `window_size`.
pub fn from_transcript(transcript: &Path, window_size: u64) -> Option<Measure> {
    if window_size == 0 {
        return None;
    }
    // A repeated id keeps its last entry; the order is that of first insertion.
    let mut order: Vec<String> = Vec::new();
    let mut usage: std::collections::HashMap<String, Value> = std::collections::HashMap::new();
    for entry in lines_of(transcript) {
        if entry.get("type").and_then(Value::as_str) != Some("assistant")
            || entry.get("isSidechain").and_then(Value::as_bool) == Some(true)
        {
            continue;
        }
        let Some(u) = entry.pointer("/message/usage").filter(|u| u.is_object()) else {
            continue;
        };
        let id = entry
            .pointer("/message/id")
            .and_then(Value::as_str)
            .map_or_else(|| format!("line-{}", order.len()), str::to_string);
        if usage.insert(id.clone(), u.clone()).is_none() {
            order.push(id);
        }
    }
    let tokens = tokens_of(usage.get(order.last()?)?);
    Some(Measure {
        fraction: tokens as f64 / window_size as f64,
        tokens,
        window_size,
        source: Source::Transcript,
        stale: true,
    })
}

/// What `measure` reads.
pub struct Sources<'a> {
    pub sidecar: Option<&'a Path>,
    pub transcript: Option<&'a Path>,
    pub session_id: Option<&'a str>,
    /// The Stop hook's own timestamp, epoch milliseconds: only a sidecar record newer than it is fresh.
    pub after_ms: u64,
    pub window_size: u64,
}

/// The context fraction of a session. Waits up to `wait` for a sidecar record newer than `after_ms` (no wait when
/// the sidecar file does not exist), else falls back to the transcript and marks the answer stale. `None` when
/// neither has data.
pub fn measure(sources: &Sources, wait: Duration) -> Option<Measure> {
    let deadline = Instant::now() + wait;
    if let Some(sidecar) = sources.sidecar {
        loop {
            if let Some(fresh) =
                latest_sidecar_record(sidecar, sources.session_id, sources.after_ms)
                    .as_ref()
                    .and_then(from_sidecar_record)
            {
                return Some(fresh);
            }
            if !sidecar.exists() || Instant::now() >= deadline {
                break;
            }
            std::thread::sleep(POLL);
        }
    }
    sources
        .transcript
        .and_then(|t| from_transcript(t, sources.window_size))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::path::PathBuf;

    fn dir(tag: &str) -> PathBuf {
        let d = std::env::temp_dir().join(format!("rot-measure-{}-{tag}", std::process::id()));
        std::fs::create_dir_all(&d).unwrap();
        d
    }
    fn write(dir: &Path, name: &str, lines: &[Value]) -> PathBuf {
        let f = dir.join(name);
        std::fs::write(
            &f,
            lines.iter().map(|l| format!("{l}\n")).collect::<String>(),
        )
        .unwrap();
        f
    }
    fn usage(i: u64, c: u64, r: u64) -> Value {
        json!({ "input_tokens": i, "cache_creation_input_tokens": c, "cache_read_input_tokens": r, "output_tokens": 999 })
    }
    fn rec(ts: u64, sid: &str, tokens: u64, size: u64) -> Value {
        json!({ "ts": ts, "session_id": sid, "context_window": { "context_window_size": size, "current_usage": usage(tokens, 0, 0) } })
    }
    fn sources<'a>(
        sidecar: Option<&'a Path>,
        transcript: Option<&'a Path>,
        after_ms: u64,
    ) -> Sources<'a> {
        Sources {
            sidecar,
            transcript,
            session_id: Some("s"),
            after_ms,
            window_size: 1_000_000,
        }
    }

    #[test]
    fn a_sidecar_record_newer_than_the_stop_timestamp_gives_the_fraction_from_its_own_window_size()
    {
        let d = dir("a");
        let sidecar = write(
            &d,
            "a.jsonl",
            &[
                rec(100, "s", 1, 1_000_000),
                rec(300, "s", 200_000, 500_000),
                rec(400, "other", 9, 1_000_000),
            ],
        );
        let m = measure(&sources(Some(&sidecar), None, 200), Duration::ZERO).unwrap();
        assert_eq!(
            (m.source, m.stale, m.fraction),
            (Source::Sidecar, false, 0.4)
        );
    }

    #[test]
    fn a_sidecar_record_older_than_the_stop_timestamp_is_not_fresh_and_the_stale_transcript_is_used(
    ) {
        let d = dir("b");
        let sidecar = write(&d, "b.jsonl", &[rec(100, "s", 500_000, 1_000_000)]);
        let transcript = write(
            &d,
            "b-t.jsonl",
            &[
                json!({ "type": "assistant", "message": { "id": "m1", "usage": usage(100_000, 50_000, 50_000) } }),
            ],
        );
        let m = measure(
            &sources(Some(&sidecar), Some(&transcript), 200),
            Duration::ZERO,
        )
        .unwrap();
        assert_eq!(
            (m.source, m.stale, m.fraction),
            (Source::Transcript, true, 0.2)
        );
    }

    #[test]
    fn a_sidecar_record_that_lands_while_waiting_is_taken() {
        let d = dir("c");
        let sidecar = d.join("c.jsonl");
        std::fs::write(&sidecar, "").unwrap();
        let late = sidecar.clone();
        let writer = std::thread::spawn(move || {
            std::thread::sleep(Duration::from_millis(50));
            std::fs::write(
                &late,
                format!("{}\n", rec(u64::MAX / 2, "s", 100_000, 1_000_000)),
            )
            .unwrap();
        });
        let m = measure(
            &sources(Some(&sidecar), None, 1),
            Duration::from_millis(1500),
        )
        .unwrap();
        writer.join().unwrap();
        assert_eq!(m.fraction, 0.1);
    }

    #[test]
    fn a_missing_sidecar_file_is_not_waited_for() {
        let d = dir("e");
        let started = Instant::now();
        assert!(measure(
            &sources(Some(&d.join("none")), Some(&d.join("none2")), 0),
            Duration::from_secs(5)
        )
        .is_none());
        assert!(started.elapsed() < Duration::from_secs(1));
    }

    #[test]
    fn the_transcript_sum_uses_the_last_non_sidechain_assistant_entry_once_per_message_id() {
        let d = dir("d");
        let t = write(
            &d,
            "d.jsonl",
            &[
                json!({ "type": "assistant", "message": { "id": "m1", "usage": usage(10, 0, 0) } }),
                json!({ "type": "assistant", "message": { "id": "m2", "usage": usage(1000, 2000, 3000) } }),
                json!({ "type": "assistant", "message": { "id": "m2", "usage": usage(1000, 2000, 7000) } }),
                json!({ "type": "assistant", "isSidechain": true, "message": { "id": "m3", "usage": usage(999_999, 0, 0) } }),
                json!({ "type": "user", "message": {} }),
            ],
        );
        let m = from_transcript(&t, 10_000).unwrap();
        assert_eq!((m.tokens, m.fraction), (10_000, 1.0));
    }
}
