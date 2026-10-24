//! Append-only rubric evaluations in `.fgos/observe/evals/<writerId>.jsonl`.

use crate::shard::{self, StoredRecord, TornTail, UnsafeShard};
use crate::store_lock::acquire_store_lock;
use crate::time::now_iso;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashSet};
use std::path::Path;

const STORE: &str = "evals";
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
            return Err(format!(
                "score for \"{}\" must be an integer in 0..2 (got {})",
                criterion, score
            ));
        }
    }
    if rubric == "discussion-quality.v1"
        && (scores.len() != DISCUSSION_QUALITY_CRITERIA.len()
            || DISCUSSION_QUALITY_CRITERIA
                .iter()
                .any(|key| !scores.contains_key(*key)))
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
        &[
            ("evalId", &input.eval_id),
            ("harness", &input.harness),
            ("question", &input.question),
            ("setup", &input.setup),
            ("rubric", &input.rubric),
            ("judge", &input.judge),
        ],
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
        &[
            ("ts", &record.ts),
            ("evalId", &record.eval_id),
            ("harness", &record.harness),
            ("question", &record.question),
            ("setup", &record.setup),
            ("rubric", &record.rubric),
            ("judge", &record.judge),
        ],
        &record.scores,
        &record.run_refs,
        &record.rubric,
    )
}

pub fn record(root: &Path, input: EvalInput) -> Result<EvalRecord, String> {
    validate_input(&input)?;
    let record = EvalRecord {
        v: 1,
        kind: "eval".into(),
        ts: now_iso(),
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
    let line = shard::encode_line(&record)?;
    // Same global Observe lock, shard door and fsync as case/friction. The store
    // directories are checked and created before the lock is taken.
    shard::shard_path(root, STORE).map_err(|e| e.to_string())?;
    let _guard = acquire_store_lock(root).map_err(|e| e.to_string())?;
    // Check every shard under the same lock as append. Invalid tracked records
    // may conceal an identity, so fail closed until the store is repaired.
    let existing = list(root, None, None)?;
    if existing
        .evals
        .iter()
        .any(|eval| eval.eval_id == record.eval_id)
    {
        return Err(format!("duplicate evalId: {}", record.eval_id));
    }
    if !existing.invalid.is_empty() {
        return Err(invalid_store_error(&existing.invalid));
    }
    shard::append_lines(root, STORE, TornTail::Refuse, &[line]).map_err(|e| e.to_string())?;
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
pub fn list(
    root: &Path,
    harness: Option<&str>,
    question: Option<&str>,
) -> Result<EvalList, String> {
    let store = shard::read_store(root, STORE, UnsafeShard::Report).map_err(|e| e.to_string())?;
    let mut result = EvalList {
        evals: Vec::new(),
        invalid: store
            .invalid
            .into_iter()
            .map(|item| InvalidEvalLine { file: item.file, line: item.line, error: item.reason })
            .collect(),
    };
    let mut seen_ids = HashSet::new();
    for StoredRecord { value, shard, line } in store.records {
        let file = format!(".fgos/observe/{STORE}/{shard}.jsonl");
        let parsed = serde_json::from_value::<EvalRecord>(value)
            .map_err(|e| e.to_string())
            .and_then(|record| {
                validate_record(&record)?;
                Ok(record)
            });
        match parsed {
            Ok(record) if !seen_ids.insert(record.eval_id.clone()) => {
                let error = format!("duplicate evalId: {}", record.eval_id);
                result.invalid.push(InvalidEvalLine { file, line, error });
            }
            Ok(record) => {
                if harness.is_none_or(|h| record.harness == h)
                    && question.is_none_or(|q| record.question == q)
                {
                    result.evals.push(record);
                }
            }
            Err(error) => result.invalid.push(InvalidEvalLine { file, line, error }),
        }
    }
    result.invalid.sort_by(|a, b| (&a.file, a.line).cmp(&(&b.file, b.line)));
    result
        .evals
        .sort_by(|a, b| a.ts.cmp(&b.ts).then_with(|| a.eval_id.cmp(&b.eval_id)));
    Ok(result)
}
