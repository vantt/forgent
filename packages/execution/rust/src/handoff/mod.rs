//! The one hand-off, as rules: an earlier seat's work reaches a later seat as the absolute, read-only path of its
//! report, listed in the later seat's context refs. Inside a Unit run the pattern passes the earlier record;
//! across Units an input `unit-run:<unitRunId>/<seat>` (or a gate answer, `gate-answer:<workflowRunId>/<stepId>`)
//! is resolved once when the run is created and kept in unit.json. `unit-run:<unitRunId>/{seat}` stands for the
//! report the receiving role's own seat left in that run.
//!
//! This module is the pure half: what an input is, which report a record names, whether changed bytes may still
//! be handed over, and the neutral names of copies. Reading a report's bytes, copying a hand-off into a role's
//! directory and judging a path against the roots a blind worker cannot read are file work and belong to the
//! engine; they ask these functions what to do.

use crate::case_paths::{gate_answer_file, is_case_id};
use crate::seat_resolver::value::{get, items, str_at};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::path::{Component, Path, PathBuf};

pub const UNIT_RUN_PREFIX: &str = "unit-run:";
pub const GATE_ANSWER_PREFIX: &str = "gate-answer:";
pub const SEAT_PLACEHOLDER: &str = "{seat}";
pub const OWN_PREVIOUS_NAME: &str = "own-previous";

/// A hand-off that cannot be turned into a path; `reason` names why.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HandoffRefError {
    pub subject: String,
    pub reason: String,
}

impl HandoffRefError {
    pub fn new(subject: impl Into<String>, reason: impl Into<String>) -> Self {
        HandoffRefError {
            subject: subject.into(),
            reason: reason.into(),
        }
    }
}

impl std::fmt::Display for HandoffRefError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "handoff-ref-unresolved: {}: {}",
            self.subject, self.reason
        )
    }
}

impl std::error::Error for HandoffRefError {}

/// Whether an input names the earlier result of the receiving role's own seat.
pub fn is_seat_input(input: &str) -> bool {
    input.starts_with(UNIT_RUN_PREFIX) && input.ends_with(&format!("/{SEAT_PLACEHOLDER}"))
}

/// What a Unit's `inputs` entry names.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum InputRef {
    /// `unit-run:<id>/{seat}`: the receiving role's own earlier result.
    OwnSeat,
    /// `unit-run:<id>/<seat>`.
    UnitRun {
        unit_run_id: String,
        seat: Option<String>,
    },
    /// `gate-answer:<runId>/<stepId>`; `extra` is true when more segments follow (never a valid answer).
    GateAnswer {
        workflow_run_id: String,
        step_id: Option<String>,
        extra: bool,
    },
    /// A repository path, as it is.
    Path,
}

/// Classifies an input the way the resolver reads it.
pub fn classify_input(input: &str) -> InputRef {
    if is_seat_input(input) {
        return InputRef::OwnSeat;
    }
    if let Some(rest) = input.strip_prefix(UNIT_RUN_PREFIX) {
        let mut parts = rest.split('/');
        let unit_run_id = parts.next().unwrap_or_default().to_string();
        return InputRef::UnitRun {
            unit_run_id,
            seat: parts.next().map(str::to_string),
        };
    }
    if let Some(rest) = input.strip_prefix(GATE_ANSWER_PREFIX) {
        let mut parts = rest.split('/');
        let workflow_run_id = parts.next().unwrap_or_default().to_string();
        let step_id = parts.next().map(str::to_string);
        return InputRef::GateAnswer {
            workflow_run_id,
            step_id,
            extra: parts.next().is_some(),
        };
    }
    InputRef::Path
}

/// The file a gate-answer input names under `fgos_dir`, or the refusal `no-such-answer` when it names none.
pub fn gate_answer_path(input: &str, fgos_dir: &Path) -> Result<PathBuf, HandoffRefError> {
    match classify_input(input) {
        InputRef::GateAnswer {
            workflow_run_id,
            step_id: Some(step),
            extra: false,
        } if is_case_id(&workflow_run_id) => gate_answer_file(fgos_dir, &workflow_run_id, &step)
            .ok_or_else(|| HandoffRefError::new(input, "no-such-answer")),
        _ => Err(HandoffRefError::new(input, "no-such-answer")),
    }
}

/// The directory of a unit run under `assignments_dir`, or `None` when the id is not exactly one path segment
/// (an id like `..` or `a/b` never names a run).
pub fn unit_run_dir(assignments_dir: &Path, unit_run_id: &str) -> Option<PathBuf> {
    let mut parts = Path::new(unit_run_id).components();
    match (parts.next(), parts.next()) {
        (Some(Component::Normal(_)), None) => Some(assignments_dir.join(unit_run_id)),
        _ => None,
    }
}

/// The refusal for a seat that cannot be a path segment of a run's directory; `own_seat` says the input was an
/// own-seat input, which names the missing seat rather than the missing role.
pub fn unit_run_ref_refusal(input: &str, reason: &str, own_seat: bool) -> HandoffRefError {
    let reason = if own_seat && reason == "no-such-role" {
        "no-such-seat"
    } else {
        reason
    };
    HandoffRefError::new(input, reason)
}

/// Who may hand over a settled report whose bytes changed since settlement.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub enum Accept {
    #[default]
    Nothing,
    /// The caller's authority covers any revision.
    Any,
    /// The sha256 hex of each revision the caller stands behind.
    Digests(Vec<String>),
}

impl Accept {
    fn takes(&self, actual: &str) -> bool {
        match self {
            Accept::Nothing => false,
            Accept::Any => true,
            Accept::Digests(list) => list.iter().any(|d| d == actual),
        }
    }
}

/// Which file a seat result left as its account.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ReportRef {
    /// The settled report (`runResult.settleReports[0]`): its path and the sha256 settlement recorded.
    Settled {
        path: String,
        sha256: Option<String>,
    },
    /// The claim artifact settlement kept (`runResult.evidence.artifacts`).
    Artifact(String),
}

/// The subject a refusal about a record names: `seat "<seat>" round <round>`.
pub fn record_subject(record: &Value) -> String {
    let seat = crate::seat_resolver::seat_key_of(record)
        .and_then(Value::as_str)
        .unwrap_or("undefined");
    let round = get(record, "round").map_or_else(|| "undefined".to_string(), |r| r.to_string());
    format!("seat \"{seat}\" round {round}")
}

/// The report a seat result names: its settled report, else the first claim artifact; `no-report` when it has
/// neither. Paths are relative to the main root until the caller resolves them.
pub fn report_ref_of_record(record: &Value) -> Result<ReportRef, HandoffRefError> {
    let run_result = get(record, "runResult");
    let settled = run_result
        .and_then(|r| items(r.get("settleReports")).first())
        .filter(|s| !s.is_null());
    if let Some(path) = settled
        .and_then(|s| str_at(s, "path"))
        .filter(|p| !p.is_empty())
    {
        let sha = settled
            .and_then(|s| str_at(s, "sha256"))
            .map(str::to_string);
        return Ok(ReportRef::Settled {
            path: path.to_string(),
            sha256: sha,
        });
    }
    let artifact = run_result
        .and_then(|r| get(r, "evidence"))
        .map(|e| items(e.get("artifacts")))
        .and_then(|list| {
            list.iter()
                .filter_map(Value::as_str)
                .find(|a| !a.is_empty())
        });
    match artifact {
        Some(a) => Ok(ReportRef::Artifact(a.to_string())),
        None => Err(HandoffRefError::new(record_subject(record), "no-report")),
    }
}

/// Whether a settled report whose bytes are now `actual` (`None` when it is missing) may be handed over: its
/// bytes are what settlement recorded, or the caller accepts the revision.
pub fn settled_report_stands(
    record: &Value,
    recorded: Option<&str>,
    actual: Option<&str>,
    accept: &Accept,
) -> Result<(), HandoffRefError> {
    if actual.is_some() && actual == recorded {
        return Ok(());
    }
    if actual.is_some_and(|a| accept.takes(a)) {
        return Ok(());
    }
    Err(HandoffRefError::new(
        record_subject(record),
        "report-changed-after-settle",
    ))
}

/// The sha256 hex of some bytes (what a copy must still have).
pub fn sha256_hex(bytes: &[u8]) -> String {
    Sha256::digest(bytes)
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect()
}

/// The neutral name (without extension) of the nth anonymized input: seat-A ... seat-Z, seat-AA, ...
pub fn anonymous_input_name(index: usize) -> String {
    let mut n = index as i64;
    let mut letters = String::new();
    loop {
        letters.insert(0, char::from(b'A' + (n % 26) as u8));
        n = n / 26 - 1;
        if n < 0 {
            break;
        }
    }
    format!("seat-{letters}")
}

/// The stable plain name (no extension) of the nth copied hand-off: its position, then `<seat>-r<round>` for an
/// assignment's report, `gate-<step>` for a gate answer, else the file's own name.
pub fn plain_input_name(index: usize, source: &Path, fgos_dir: &Path) -> String {
    let rel: Vec<String> = match source.strip_prefix(fgos_dir) {
        Ok(rel) => rel
            .components()
            .map(|c| c.as_os_str().to_string_lossy().into_owned())
            .collect(),
        Err(_) => Vec::new(),
    };
    let mut what = source
        .file_stem()
        .map(|s| s.to_string_lossy().into_owned())
        .unwrap_or_default();
    if rel.first().map(String::as_str) == Some("assignments") && rel.len() > 4 {
        what = format!("{}-r{}", rel[2], rel[3]);
    } else if source.starts_with(crate::case_paths::runs_root(fgos_dir))
        && rel.get(2).map(String::as_str) == Some("gate-answers")
    {
        what = format!("gate-{what}");
    }
    format!("{}-{what}", index + 1)
}

/// The file name of the nth own-seat copy: `own-previous.<ext>`, `own-previous-2.<ext>`, ...
pub fn own_previous_name(index: usize, extension: &str) -> String {
    let base = if index == 0 {
        OWN_PREVIOUS_NAME.to_string()
    } else {
        format!("{OWN_PREVIOUS_NAME}-{}", index + 1)
    };
    format!("{base}{extension}")
}
