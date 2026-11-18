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

/// Most bytes read from the end of a transcript to find its last entries; an older part is never read.
pub(crate) const TAIL_CAP: u64 = 8 * 1024 * 1024;
const TAIL_CHUNK: u64 = 64 * 1024;

/// The JSON entries of a JSON-lines file, newest first, read backwards from the end in bounded chunks: `visit`
/// returns `true` to stop. At most `cap` bytes are read; a line that is not complete within them (or not JSON,
/// such as a last line still being written) is skipped.
pub(crate) fn scan_back(file: &Path, cap: u64, mut visit: impl FnMut(&Value) -> bool) {
    use std::io::{Read, Seek, SeekFrom};
    let Ok(mut f) = std::fs::File::open(file) else {
        return;
    };
    let Ok(len) = f.metadata().map(|m| m.len()) else {
        return;
    };
    let floor = len.saturating_sub(cap);
    let mut pos = len;
    // The start of a line whose beginning lies before `pos`, not yet complete.
    let mut carry: Vec<u8> = Vec::new();
    while pos > floor {
        let start = pos.saturating_sub(TAIL_CHUNK).max(floor);
        let mut buf = vec![0; (pos - start) as usize];
        if f.seek(SeekFrom::Start(start)).is_err() || f.read_exact(&mut buf).is_err() {
            return;
        }
        buf.extend_from_slice(&carry);
        pos = start;
        let complete_from = if pos == 0 {
            0
        } else {
            match buf.iter().position(|b| *b == b'\n') {
                Some(i) => i + 1,
                None => {
                    carry = buf;
                    continue;
                }
            }
        };
        for line in buf[complete_from..].rsplit(|b| *b == b'\n') {
            let Ok(value) = serde_json::from_slice::<Value>(line) else {
                continue;
            };
            if visit(&value) {
                return;
            }
        }
        buf.truncate(complete_from.saturating_sub(1));
        carry = buf;
    }
}

/// Whether a transcript entry is an assistant entry of the session itself, not of a subagent (a sidechain).
pub(crate) fn main_assistant(entry: &Value) -> bool {
    entry.get("type").and_then(Value::as_str) == Some("assistant")
        && entry.get("isSidechain").and_then(Value::as_bool) != Some(true)
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

/// Epoch milliseconds of an ISO-8601 timestamp, read through the civil-time door (`fgos_host_runtime::civil_time`):
/// an RFC 3339 instant (`YYYY-MM-DDTHH:MM:SS[.fff]` with `Z` or a numeric offset) or a calendar date (UTC midnight).
pub fn parse_iso_millis(text: &str) -> Option<f64> {
    fgos_host_runtime::civil_time::parse_rfc3339_millis(text)
        .or_else(|| fgos_host_runtime::civil_time::parse_date_midnight_millis(text))
        .map(|millis| millis as f64)
}

/// A sidecar record's `ts` in epoch milliseconds: a number, or an ISO-8601 string.
fn ts_ms(record: &Value) -> Option<f64> {
    match record.get("ts")? {
        Value::Number(n) => n.as_f64(),
        Value::String(text) => parse_iso_millis(text),
        _ => None,
    }
}

/// The newest record of `session_id` (any session when `None`) whose `ts` is later than `after_ms`.
pub fn latest_sidecar_record(
    sidecar: &Path,
    session_id: Option<&str>,
    after_ms: u64,
) -> Option<Value> {
    let mut found: Option<(f64, Value)> = None;
    for record in lines_of(sidecar) {
        if session_id.is_some_and(|id| record.get("session_id").and_then(Value::as_str) != Some(id))
        {
            continue;
        }
        let Some(ts) = ts_ms(&record).filter(|ts| *ts > after_ms as f64) else {
            continue;
        };
        if found.as_ref().is_none_or(|(best, _)| ts >= *best) {
            found = Some((ts, record));
        }
    }
    found.map(|(_, record)| record)
}

/// Fraction from the transcript: the last entry of the last non-sidechain assistant message with usage, read from
/// the end of the file (at most [`TAIL_CAP`] bytes), over `window_size`.
pub fn from_transcript(transcript: &Path, window_size: u64) -> Option<Measure> {
    if window_size == 0 {
        return None;
    }
    // Newest first: the first assistant entry with usage is the last entry of the last message.
    let mut last: Option<Value> = None;
    scan_back(transcript, TAIL_CAP, |entry| {
        last = main_assistant(entry)
            .then(|| {
                entry
                    .pointer("/message/usage")
                    .filter(|u| u.is_object())
                    .cloned()
            })
            .flatten();
        last.is_some()
    });
    let tokens = tokens_of(&last?);
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

/// Whether a status-line writer is running for this session: the sidecar holds at least one record of it (of
/// any session when `session_id` is `None`), whatever its age. The one signal read from real state; no writer
/// ships with fgOS, so a project without one is never waited for.
fn writer_seen(sidecar: &Path, session_id: Option<&str>) -> bool {
    lines_of(sidecar).iter().any(|record| {
        session_id.is_none_or(|id| record.get("session_id").and_then(Value::as_str) == Some(id))
    })
}

/// The context fraction of a session. Waits up to `wait` for a sidecar record newer than `after_ms` (only when the sidecar already
/// holds a record of this session, see `writer_seen`), else falls back to the transcript and marks the answer stale. `None` when
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
            // Only a writer that has already written for this session can still deliver this turn's record;
            // with none, waiting would stall every stop for nothing.
            if !writer_seen(sidecar, sources.session_id) || Instant::now() >= deadline {
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
    fn a_newer_record_that_replaces_the_file_while_waiting_is_taken() {
        let d = dir("c");
        let sidecar = write(&d, "c.jsonl", &[rec(0, "s", 1, 1_000_000)]);
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
        assert_eq!((m.source, m.fraction), (Source::Sidecar, 0.1));
    }

    #[test]
    fn a_record_that_lands_in_an_existing_sidecar_while_waiting_is_taken() {
        let d = dir("c2");
        let sidecar = write(&d, "c2.jsonl", &[rec(0, "s", 1, 1_000_000)]);
        let late = sidecar.clone();
        let writer = std::thread::spawn(move || {
            std::thread::sleep(Duration::from_millis(50));
            std::fs::write(
                &late,
                format!("{}\n", rec(u64::MAX / 2, "s", 200_000, 1_000_000)),
            )
            .unwrap();
        });
        let m = measure(
            &sources(Some(&sidecar), None, 1),
            Duration::from_millis(1500),
        )
        .unwrap();
        writer.join().unwrap();
        assert_eq!(m.fraction, 0.2);
    }

    #[test]
    fn a_timestamp_is_epoch_milliseconds_or_iso_8601_and_a_record_older_than_the_stop_is_not_fresh()
    {
        let d = dir("iso");
        assert_eq!(
            parse_iso_millis("2026-11-18T03:00:00Z"),
            Some(1_794_970_800_000.0)
        );
        assert_eq!(
            parse_iso_millis("2026-11-18T10:00:00.250+07:00"),
            Some(1_794_970_800_250.0)
        );
        assert_eq!(parse_iso_millis("2026-11-18T03:00:00"), None);
        assert_eq!(parse_iso_millis("1970-01-01"), Some(0.0));
        assert_eq!(parse_iso_millis("not a date"), None);
        assert_eq!(parse_iso_millis("2026-13-01T00:00:00Z"), None);
        let iso = |ts: &str, tokens: u64| json!({ "ts": ts, "session_id": "s", "context_window": { "context_window_size": 1_000_000, "current_usage": usage(tokens, 0, 0) } });
        let sidecar = write(
            &d,
            "iso.jsonl",
            &[
                iso("2026-11-18T03:00:00.000Z", 700_000),
                iso("2026-11-18T03:00:05.000Z", 300_000),
                json!({ "ts": "garbage", "session_id": "s" }),
            ],
        );
        let m = measure(
            &sources(Some(&sidecar), None, 1_794_970_802_000),
            Duration::ZERO,
        )
        .unwrap();
        assert_eq!(m.fraction, 0.3);
        assert!(measure(
            &sources(Some(&sidecar), None, 1_794_970_805_000),
            Duration::ZERO
        )
        .is_none());
    }

    #[test]
    fn no_writer_for_this_session_means_no_wait_and_the_transcript_is_used_at_once() {
        let d = dir("nowriter");
        let transcript = write(
            &d,
            "t.jsonl",
            &[
                json!({ "type": "assistant", "message": { "id": "m", "usage": usage(250_000, 0, 0) } }),
            ],
        );
        let other = write(
            &d,
            "other.jsonl",
            &[rec(0, "another-session", 1, 1_000_000)],
        );
        for sidecar in [d.join("absent.jsonl"), other] {
            let started = Instant::now();
            let m = measure(
                &sources(Some(&sidecar), Some(&transcript), 1),
                Duration::from_secs(5),
            )
            .unwrap();
            assert_eq!((m.source, m.fraction), (Source::Transcript, 0.25));
            assert!(started.elapsed() < Duration::from_secs(1));
        }
    }

    #[test]
    fn no_data_at_all_measures_nothing() {
        let d = dir("none");
        let started = Instant::now();
        assert!(measure(
            &sources(Some(&d.join("none")), Some(&d.join("none2")), 0),
            Duration::ZERO
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

    #[test]
    fn the_backward_scan_gives_every_complete_line_newest_first_across_chunks_and_stops_at_the_cap()
    {
        let d = dir("scan");
        let lines: Vec<Value> = (0..300)
            .map(|i| json!({ "i": i, "pad": "y".repeat(500) }))
            .collect();
        let mut text = lines.iter().map(|l| format!("{l}\n")).collect::<String>();
        text.push_str("{\"partial\":");
        let f = d.join("scan.jsonl");
        std::fs::write(&f, &text).unwrap();
        let mut seen = Vec::new();
        scan_back(&f, TAIL_CAP, |v| {
            seen.push(v["i"].as_u64().unwrap());
            false
        });
        assert_eq!(seen, (0..300).rev().collect::<Vec<u64>>());
        let mut capped = Vec::new();
        scan_back(&f, 10_000, |v| {
            capped.push(v["i"].as_u64().unwrap());
            false
        });
        assert!(!capped.is_empty() && capped.len() < 20, "{capped:?}");
        assert_eq!(capped[0], 299);
        let mut first = None;
        scan_back(&f, TAIL_CAP, |v| {
            first = v["i"].as_u64();
            true
        });
        assert_eq!(first, Some(299), "visit stops the scan");
    }
}
