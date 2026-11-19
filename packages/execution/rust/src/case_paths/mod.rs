//! Where a case's run directory is: the one place that decides what a case id is, and builds the path.
//!
//! Every case keeps its ledger and runtime files in `<fgos dir>/workflow-runs/<case id>`. A case id is one path
//! segment: it starts with a letter or digit, so `.bindings` (the bindings directory beside the cases) and `..`
//! can never name a case, and it holds only letters, digits, `.`, `_` and `-`. The module is pure: it joins
//! path text and never touches a file; the `.fgos` directory name arrives from the caller.

use std::path::{Path, PathBuf};

/// The id was not a case id; `code` is the stable `invalid-case-id`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InvalidCaseId {
    pub message: String,
}

impl InvalidCaseId {
    pub const CODE: &'static str = "invalid-case-id";
}

impl std::fmt::Display for InvalidCaseId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for InvalidCaseId {}

/// Whether `id` is a case id: `[A-Za-z0-9][A-Za-z0-9._-]{0,127}`.
pub fn is_case_id(id: &str) -> bool {
    let mut chars = id.chars();
    chars.next().is_some_and(|c| c.is_ascii_alphanumeric())
        && id.chars().count() <= 128
        && chars.all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-'))
}

/// The directory that holds every case, and the bindings directory beside them.
pub fn runs_root(fgos_dir: &Path) -> PathBuf {
    fgos_dir.join("workflow-runs")
}

/// The directory of one case; refuses an id that is not a case id.
pub fn run_dir_of(fgos_dir: &Path, case_id: &str) -> Result<PathBuf, InvalidCaseId> {
    if !is_case_id(case_id) {
        return Err(InvalidCaseId {
            message: format!("\"{case_id}\" is not a case id (invalid-case-id)"),
        });
    }
    Ok(runs_root(fgos_dir).join(case_id))
}

fn is_path_segment(segment: &str) -> bool {
    !segment.is_empty()
        && segment != "."
        && segment != ".."
        && !segment
            .chars()
            .any(|c| matches!(c, '/' | '\\' | '\0') || c.is_whitespace())
}

/// Where the owner's answer to one gate of a case is kept; `None` when an id names no file there.
pub fn gate_answer_file(fgos_dir: &Path, case_id: &str, step_id: &str) -> Option<PathBuf> {
    if !is_case_id(case_id) || !is_path_segment(step_id) {
        return None;
    }
    Some(
        run_dir_of(fgos_dir, case_id)
            .ok()?
            .join("gate-answers")
            .join(format!("{step_id}.md")),
    )
}
