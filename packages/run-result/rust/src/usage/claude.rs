//! claude: the seat's own transcript `<projects>/<cwd-slug>/<sessionId>.jsonl` (one `usage` object on every
//! assistant line) or, failing that, the single JSON result object of `--output-format json`. `input_tokens`
//! excludes cache.
use super::{add, sum_present, ClaudeSession, Usage};
use fgos_host_runtime::civil_time::parse_rfc3339_millis;
use serde_json::Value;
use std::collections::BTreeMap;
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};

fn num(v: &Value, key: &str) -> Option<u64> {
    v.get(key).and_then(Value::as_u64)
}

fn from_usage(usage: &Value, source: &str) -> Usage {
    let field = |k| num(usage, k);
    let (i, o) = (field("input_tokens"), field("output_tokens"));
    let (r, c) = (
        field("cache_read_input_tokens"),
        field("cache_creation_input_tokens"),
    );
    Usage {
        input_tokens: i,
        output_tokens: o,
        cache_read_tokens: r,
        cache_creation_tokens: c,
        total_tokens: sum_present(&[i, o, r, c]),
        reasoning_tokens: usage["output_tokens_details"]["thinking_tokens"].as_u64(),
        source: source.to_string(),
        ..Usage::default()
    }
}

/// A claude session id: a UUID in its hyphenated text form, the only name a transcript file has.
fn is_session_id(id: &str) -> bool {
    id.len() == 36
        && id.char_indices().all(|(i, c)| match i {
            8 | 13 | 18 | 23 => c == '-',
            _ => c.is_ascii_hexdigit(),
        })
}

/// The directory name claude gives a cwd under `projects`: every character but an ASCII letter or digit becomes
/// `-`, so it can hold no separator and no `..`.
fn slug(cwd: &str) -> String {
    cwd.chars()
        .map(|c| if c.is_ascii_alphanumeric() { c } else { '-' })
        .collect()
}

/// What one transcript holds: the span of its line timestamps and its summed usage. Read a line at a time;
/// lines repeat one message's usage once per content block, so the last line of each message id counts.
struct Transcript {
    span: Option<(i64, i64)>,
    usage: Option<Usage>,
}

fn read_transcript(path: &Path) -> Option<Transcript> {
    let mut reader = BufReader::new(fs::File::open(path).ok()?);
    let mut by_message: BTreeMap<String, Value> = BTreeMap::new();
    let mut anonymous = Vec::new();
    let mut span: Option<(i64, i64)> = None;
    let mut line = Vec::new();
    loop {
        line.clear();
        if reader.read_until(b'\n', &mut line).ok()? == 0 {
            break;
        }
        let Ok(v) = serde_json::from_slice::<Value>(&line) else {
            continue;
        };
        if let Some(t) = v["timestamp"].as_str().and_then(parse_rfc3339_millis) {
            span = Some(span.map_or((t, t), |(lo, hi)| (lo.min(t), hi.max(t))));
        }
        let message = &v["message"];
        if v["type"] != "assistant" || !message["usage"].is_object() {
            continue;
        }
        match message["id"].as_str() {
            Some(id) => {
                by_message.insert(id.to_string(), message["usage"].clone());
            }
            None => anonymous.push(message["usage"].clone()),
        }
    }
    let turns: Vec<Value> = by_message.into_values().chain(anonymous).collect();
    let usage = (!turns.is_empty()).then(|| {
        let mut sum = Usage {
            source: "transcript".to_string(),
            ..Usage::default()
        };
        for u in &turns {
            let t = from_usage(u, "transcript");
            add(&mut sum.input_tokens, t.input_tokens);
            add(&mut sum.output_tokens, t.output_tokens);
            add(&mut sum.cache_read_tokens, t.cache_read_tokens);
            add(&mut sum.cache_creation_tokens, t.cache_creation_tokens);
            add(&mut sum.reasoning_tokens, t.reasoning_tokens);
            add(&mut sum.total_tokens, t.total_tokens);
        }
        sum.found()
    });
    Some(Transcript { span, usage })
}

/// A regular file (never a link) named `<sessionId>.jsonl` whose real path stays under `projects`.
fn transcript_file(projects: &Path, path: &Path) -> bool {
    let named = path
        .file_name()
        .and_then(|n| n.to_str())
        .and_then(|n| n.strip_suffix(".jsonl"))
        .is_some_and(is_session_id);
    named
        && fs::symlink_metadata(path).is_ok_and(|m| m.file_type().is_file())
        && fs::canonicalize(path).is_ok_and(|real| real.starts_with(projects))
}

/// The seat's transcript: the file of its session id, or else the only one whose lines all fall in the run's
/// window. `None` when there is none, or more than one could be it.
fn find_transcript(session: &ClaudeSession) -> Option<Transcript> {
    let projects = fs::canonicalize(&session.projects_dir).ok()?;
    let dir = projects.join(slug(&session.cwd));
    if !fs::symlink_metadata(&dir).is_ok_and(|m| m.file_type().is_dir()) {
        return None;
    }
    if let Some(id) = session.session_id.as_deref() {
        let file = dir.join(format!("{id}.jsonl"));
        return (is_session_id(id) && transcript_file(&projects, &file))
            .then(|| read_transcript(&file))
            .flatten();
    }
    let start = parse_rfc3339_millis(session.started_at.as_deref()?)?;
    let end = parse_rfc3339_millis(session.ended_at.as_deref()?)?;
    let mut found: Option<Transcript> = None;
    let files: Vec<PathBuf> = fs::read_dir(&dir)
        .ok()?
        .filter_map(|e| e.ok().map(|e| e.path()))
        .filter(|p| transcript_file(&projects, p))
        .collect();
    for file in files {
        let Some(transcript) = read_transcript(&file) else {
            continue;
        };
        if transcript
            .span
            .is_some_and(|(lo, hi)| lo >= start && hi <= end)
        {
            if found.is_some() {
                return None;
            }
            found = Some(transcript);
        }
    }
    found
}

pub(super) fn parse(stdout: &str, session: Option<&ClaudeSession>) -> Usage {
    let mut reason = "no-structured-output";
    if let Some(session) = session {
        match find_transcript(session) {
            Some(Transcript {
                usage: Some(usage), ..
            }) => return usage,
            Some(_) => {}
            None => reason = "transcript-not-found",
        }
    }
    if let Ok(v) = serde_json::from_str::<Value>(stdout.trim()) {
        if v["usage"].is_object() {
            return from_usage(&v["usage"], "claude-json").found();
        }
    }
    Usage::absent("transcript", reason)
}
