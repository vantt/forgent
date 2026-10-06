//! Append-only rubric evaluations in `.fgos/observe/evals/<writerId>.jsonl`.

use crate::shard;
use crate::store_lock::{acquire_store_lock, format_iso_now};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashSet};
use std::fs::{self, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::path::Path;

const MAX_LINE_BYTES: usize = 1024 * 1024;
const DISCUSSION_QUALITY_CRITERIA: [&str; 5] = [
    "perspective-spread",
    "decision-clarity",
    "counterfactual-depth",
    "evidence-discipline",
    "execution-quality",
];

/// Callers supply identities and judgments, not the journal envelope.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct EvalInput {
    pub eval_id: String,
    pub harness: String,
    pub question: String,
    pub setup: String,
    pub scores: BTreeMap<String, i64>,
    pub rubric: String,
    pub judge: String,
    pub run_refs: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(deny_unknown_fields)]
pub struct EvalRecord {
    pub v: u32,
    #[serde(rename = "type")]
    pub kind: String,
    pub ts: String,
    #[serde(rename = "evalId")]
    pub eval_id: String,
    pub harness: String,
    pub question: String,
    pub setup: String,
    pub scores: BTreeMap<String, i64>,
    pub rubric: String,
    pub judge: String,
    #[serde(rename = "runRefs")]
    pub run_refs: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct InvalidEvalLine {
    pub file: String,
    pub line: usize,
    pub error: String,
}

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct EvalList {
    pub evals: Vec<EvalRecord>,
    /// Invalid tracked data must remain visible, never be trusted or silently lost.
    pub invalid: Vec<InvalidEvalLine>,
}

fn validate_fields(
    labels: &[(&str, &str)],
    scores: &BTreeMap<String, i64>,
    run_refs: &[String],
    rubric: &str,
) -> Result<(), String> {
    for (name, value) in labels {
        if value.trim().is_empty() {
            return Err(format!("{} must not be empty", name));
        }
    }
    if scores.is_empty() {
        return Err("scores must contain at least one criterion".into());
    }
    for (criterion, score) in scores {
        if criterion.trim().is_empty() {
            return Err("score criterion must not be empty".into());
        }
        if !(0..=2).contains(score) {
            return Err(format!("score for \"{}\" must be an integer in 0..2 (got {})", criterion, score));
        }
    }
    if rubric == "discussion-quality.v1"
        && (scores.len() != DISCUSSION_QUALITY_CRITERIA.len()
            || DISCUSSION_QUALITY_CRITERIA.iter().any(|key| !scores.contains_key(*key)))
    {
        return Err("discussion-quality.v1 scores must contain exactly its five criteria".into());
    }
    if run_refs.iter().any(|id| id.trim().is_empty()) {
        return Err("runRefs must contain only nonempty run identifiers".into());
    }
    Ok(())
}

pub fn validate_input(input: &EvalInput) -> Result<(), String> {
    validate_fields(
        &[("evalId", &input.eval_id), ("harness", &input.harness),
          ("question", &input.question), ("setup", &input.setup),
          ("rubric", &input.rubric), ("judge", &input.judge)],
        &input.scores,
        &input.run_refs,
        &input.rubric,
    )
}

fn validate_record(record: &EvalRecord) -> Result<(), String> {
    if record.v != 1 || record.kind != "eval" {
        return Err("expected eval envelope v=1, type=eval".into());
    }
    validate_fields(
        &[("ts", &record.ts), ("evalId", &record.eval_id),
          ("harness", &record.harness), ("question", &record.question),
          ("setup", &record.setup), ("rubric", &record.rubric), ("judge", &record.judge)],
        &record.scores,
        &record.run_refs,
        &record.rubric,
    )
}

/// Preflight each store component without following links. Queries do not create
/// missing directories; writers create them before locking. This is not an
/// atomic directory walk.
fn eval_store_exists(root: &Path, create: bool) -> Result<bool, String> {
    let mut path = root.to_path_buf();
    for component in [".fgos", "observe", "evals"] {
        path.push(component);
        if create {
            match fs::create_dir(&path) {
                Ok(()) => {}
                Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => {}
                Err(e) => return Err(e.to_string()),
            }
        }
        match fs::symlink_metadata(&path) {
            Ok(metadata) if metadata.file_type().is_dir() => {}
            Ok(_) => return Err(format!("eval store component must be a real directory: {}", path.display())),
            Err(e) if !create && e.kind() == std::io::ErrorKind::NotFound => return Ok(false),
            Err(e) => return Err(e.to_string()),
        }
    }
    Ok(true)
}

/// Refuse a non-regular shard before opening, then verify the opened descriptor.
/// O_NOFOLLOW closes the final-component symlink race on supported Unix hosts.
fn open_append_shard(path: &Path) -> Result<fs::File, std::io::Error> {
    match fs::symlink_metadata(path) {
        Ok(metadata) if !metadata.file_type().is_file() => {
            return Err(std::io::Error::new(std::io::ErrorKind::InvalidInput, "eval shard must be a regular file, not a symlink"));
        }
        Ok(_) => {}
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
        Err(e) => return Err(e),
    }
    let mut options = OpenOptions::new();
    options.create(true).append(true);
    #[cfg(any(target_os = "linux", target_os = "android"))]
    {
        use std::os::unix::fs::OpenOptionsExt;
        // Target-specific no-follow and nonblock flags; the latter prevents a
        // raced FIFO from hanging before descriptor verification.
        options.custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK);
    }
    #[cfg(any(target_os = "macos", target_os = "ios", target_os = "freebsd",
              target_os = "openbsd", target_os = "netbsd", target_os = "dragonfly"))]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK);
    }
    #[cfg(not(any(target_os = "linux", target_os = "android", target_os = "macos",
                  target_os = "ios", target_os = "freebsd", target_os = "openbsd",
                  target_os = "netbsd", target_os = "dragonfly")))]
    {
        // Without an atomic no-follow open, only a newly created shard is safe.
        // Existing shards fail closed rather than follow a raced link.
        options.create_new(true);
    }
    let file = options.open(path)?;
    if !file.metadata()?.is_file() {
        return Err(std::io::Error::new(std::io::ErrorKind::InvalidInput, "eval shard descriptor must be a regular file"));
    }
    Ok(file)
}

/// Retain at most cap+1 bytes, draining an overflowing logical line in place.
/// Returns None at EOF, or whether the returned logical line exceeded the cap.
fn read_bounded_line(reader: &mut impl BufRead, line: &mut Vec<u8>) -> std::io::Result<Option<bool>> {
    line.clear();
    let mut seen = false;
    let mut overflow = false;
    loop {
        let buffer = reader.fill_buf()?;
        if buffer.is_empty() {
            return Ok(seen.then_some(overflow));
        }
        seen = true;
        let newline = buffer.iter().position(|byte| *byte == b'\n');
        let content_len = newline.unwrap_or(buffer.len());
        let remaining = (MAX_LINE_BYTES + 1).saturating_sub(line.len());
        let retained = content_len.min(remaining);
        line.extend_from_slice(&buffer[..retained]);
        overflow |= retained < content_len || line.len() > MAX_LINE_BYTES;
        let consumed = content_len + usize::from(newline.is_some());
        reader.consume(consumed);
        if newline.is_some() {
            return Ok(Some(overflow));
        }
    }
}

pub fn record(root: &Path, input: EvalInput) -> Result<EvalRecord, String> {
    validate_input(&input)?;
    let writer_id = shard::resolve_writer_id();
    let mut components = Path::new(&writer_id).components();
    if writer_id.contains(['/', '\\'])
        || !matches!(components.next(), Some(std::path::Component::Normal(_)))
        || components.next().is_some() {
        return Err("eval writer identifier must be a single filename component".into());
    }
    let record = EvalRecord {
        v: 1,
        kind: "eval".into(),
        ts: format_iso_now(),
        eval_id: input.eval_id,
        harness: input.harness,
        question: input.question,
        setup: input.setup,
        scores: input.scores,
        rubric: input.rubric,
        judge: input.judge,
        run_refs: input.run_refs,
    };
    validate_record(&record)?;
    let mut line = serde_json::to_vec(&record).map_err(|e| e.to_string())?;
    if line.len() > MAX_LINE_BYTES {
        return Err("eval record exceeds 1 MiB line limit".into());
    }
    line.push(b'\n');
    // Same global Observe lock, shard identity, O_APPEND and fsync as case/friction.
    eval_store_exists(root, true)?;
    let _guard = acquire_store_lock(root).map_err(|e| e.to_string())?;
    // Check every shard under the same lock as append. Invalid tracked records
    // may conceal an identity, so fail closed until the store is repaired.
    let existing = list(root, None, None)?;
    if existing.evals.iter().any(|eval| eval.eval_id == record.eval_id) {
        return Err(format!("duplicate evalId: {}", record.eval_id));
    }
    if !existing.invalid.is_empty() {
        return Err(invalid_store_error(&existing.invalid));
    }
    let path = shard::shard_path(root, "evals").map_err(|e| e.to_string())?;
    if path != root.join(".fgos/observe/evals").join(format!("{}.jsonl", writer_id)) {
        return Err("eval writer shard path changed during record".into());
    }
    let mut file = open_append_shard(&path).map_err(|e| e.to_string())?;
    file.write_all(&line).map_err(|e| e.to_string())?;
    file.sync_all().map_err(|e| e.to_string())?;
    Ok(record)
}

/// Names each offending shard line so the operator can repair the append-only
/// store by hand; the writer never rewrites existing records itself.
fn invalid_store_error(invalid: &[InvalidEvalLine]) -> String {
    const SHOWN: usize = 5;
    let mut locations = invalid
        .iter()
        .take(SHOWN)
        .map(|item| format!("{}:{} ({})", item.file, item.line, item.error))
        .collect::<Vec<_>>()
        .join("; ");
    if invalid.len() > SHOWN {
        locations.push_str(&format!("; and {} more", invalid.len() - SHOWN));
    }
    format!(
        "cannot establish evalId uniqueness while the eval store contains invalid records: {locations}; \
         repair or remove those lines by hand (`metrics eval list` reports every invalid line), then record again"
    )
}

/// Reads all shards, validates before filtering, and reports each invalid line.
pub fn list(root: &Path, harness: Option<&str>, question: Option<&str>) -> Result<EvalList, String> {
    let dir = root.join(".fgos/observe/evals");
    let mut result = EvalList::default();
    if !eval_store_exists(root, false)? {
        return Ok(result);
    }
    let entries = match fs::read_dir(&dir) {
        Ok(entries) => entries,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(result),
        Err(e) => return Err(e.to_string()),
    };
    let mut paths = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) != Some("jsonl") {
            continue;
        }
        if entry.file_type().map_err(|e| e.to_string())?.is_file() {
            paths.push(path);
        } else {
            result.invalid.push(InvalidEvalLine {
                file: path.strip_prefix(root).unwrap_or(&path).to_string_lossy().into_owned(),
                line: 0,
                error: "eval shard must be a regular file, not a symlink".into(),
            });
        }
    }
    paths.sort();
    let mut seen_ids = HashSet::new();
    for path in paths {
        let file = fs::File::open(&path).map_err(|e| e.to_string())?;
        let mut reader = BufReader::new(file);
        let mut line = Vec::new();
        let mut line_number = 0;
        while let Some(overflow) = read_bounded_line(&mut reader, &mut line).map_err(|e| e.to_string())? {
            line_number += 1;
            let parsed = if overflow {
                Err("eval line exceeds 1 MiB limit".into())
            } else if line.iter().all(|byte| byte.is_ascii_whitespace()) {
                continue;
            } else {
                serde_json::from_slice::<EvalRecord>(&line)
                    .map_err(|e| e.to_string())
                    .and_then(|record| { validate_record(&record)?; Ok(record) })
            };
            match parsed {
                Ok(record) => {
                    if !seen_ids.insert(record.eval_id.clone()) {
                        result.invalid.push(InvalidEvalLine {
                            file: path.strip_prefix(root).unwrap_or(&path).to_string_lossy().into_owned(),
                            line: line_number,
                            error: format!("duplicate evalId: {}", record.eval_id),
                        });
                        continue;
                    }
                    if harness.is_none_or(|h| record.harness == h)
                        && question.is_none_or(|q| record.question == q) {
                        result.evals.push(record);
                    }
                }
                Err(error) => result.invalid.push(InvalidEvalLine {
                    file: path.strip_prefix(root).unwrap_or(&path).to_string_lossy().into_owned(),
                    line: line_number,
                    error,
                }),
            }
        }
    }
    result.evals.sort_by(|a, b| a.ts.cmp(&b.ts).then_with(|| a.eval_id.cmp(&b.eval_id)));
    Ok(result)
}
