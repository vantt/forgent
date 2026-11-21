//! What settlement reads off an attempt before it writes the Run Result: the worker's own claim and report, the
//! changed files, the scope the assignment declared and the outcome facts those give.

use std::collections::{BTreeMap, BTreeSet};
use std::path::Path;

use fgos_execution::handoff::sha256_hex;
use serde_json::{json, Map, Value};

use crate::confinement::driver::js::{relative, truthy};
use crate::credentials::files::read_agent_file;
use crate::run_result::claim::CLAIM_FRICTIONS_MAX;
use crate::run_result::{is_verdict_seat, validate_agent_result_claim_contract, ClaimContext};
use crate::steps::worker_artifacts::resolve_worker_artifact_path;

use super::ports::SettlementGit;

/// The agent writes its claim and report: a larger file is not one.
pub const MAX_AGENT_FILE_BYTES: u64 = 4 * 1024 * 1024;

fn str_of<'a>(value: &'a Value, key: &str) -> Option<&'a str> {
    value.get(key).and_then(Value::as_str)
}

/// A claim keeps at most [`CLAIM_FRICTIONS_MAX`] frictions; the rest are counted in `frictionsDropped`, never stored
/// and never a reason to refuse the claim. The claim digest stays the digest of the file the worker wrote.
pub fn bound_frictions(claim: Value) -> Value {
    let Some(list) = claim.get("frictions").and_then(Value::as_array) else {
        return claim;
    };
    if list.len() <= CLAIM_FRICTIONS_MAX {
        return claim;
    }
    let dropped = list.len() - CLAIM_FRICTIONS_MAX;
    let kept: Vec<Value> = list[..CLAIM_FRICTIONS_MAX].to_vec();
    let mut out = claim.as_object().cloned().unwrap_or_default();
    out.insert("frictions".into(), Value::Array(kept));
    out.insert("frictionsDropped".into(), json!(dropped));
    Value::Object(out)
}

/// Whether a text string constitutes substantive agent report content. Placeholders (TODO, TBD, N/A, ...) and
/// headings alone are not; a one-word answer (OK, YES, NO) is, since it states what was answered.
pub fn is_substantive_report_text(text: &str) -> bool {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return false;
    }
    let lower = trimmed.to_lowercase();
    // `^(todo|n/?a|none|tbd|placeholder|null|undefined)[\s.!\-:#]*$`
    let bare = [
        "todo",
        "n/a",
        "na",
        "none",
        "tbd",
        "placeholder",
        "null",
        "undefined",
    ];
    for word in bare {
        if let Some(rest) = lower.strip_prefix(word) {
            if rest
                .chars()
                .all(|c| c.is_whitespace() || matches!(c, '.' | '!' | '-' | ':' | '#'))
            {
                return false;
            }
        }
    }
    let words = upper_words(trimmed);
    if words.is_empty() {
        return false;
    }
    const GENERIC: [&str; 29] = [
        "TODO",
        "N",
        "A",
        "NA",
        "NONE",
        "TBD",
        "PLACEHOLDER",
        "NULL",
        "UNDEFINED",
        "DONE",
        "PASSED",
        "PASS",
        "FAIL",
        "FAILED",
        "REJECTED",
        "READY",
        "SUMMARY",
        "VERDICT",
        "REPORT",
        "STATUS",
        "RESULT",
        "RESULTS",
        "CHECK",
        "TITLE",
        "HEADER",
        "NOTES",
        "NOTE",
        "DETAILS",
        "FINDINGS",
    ];
    let non_generic = words
        .iter()
        .filter(|w| !GENERIC.contains(&w.as_str()))
        .count();
    if non_generic == 0 {
        return false;
    }
    let explicit_placeholder = has_placeholder_word(&lower);
    !(explicit_placeholder && non_generic < 3)
}

/// `trimmed.toUpperCase().match(/\b[A-Z0-9_-]+\b/g)`: runs of `[A-Z0-9_-]` that start and end on a word boundary.
fn upper_words(text: &str) -> Vec<String> {
    let upper = text.to_uppercase();
    let chars: Vec<char> = upper.chars().collect();
    let is_word = |c: char| c.is_ascii_alphanumeric() || c == '_';
    let in_class = |c: char| c.is_ascii_uppercase() || c.is_ascii_digit() || c == '_' || c == '-';
    let mut out = Vec::new();
    let mut i = 0;
    while i < chars.len() {
        if !in_class(chars[i]) {
            i += 1;
            continue;
        }
        let mut j = i;
        while j < chars.len() && in_class(chars[j]) {
            j += 1;
        }
        // Trim to boundaries: `\b` sits between a word character and a non-word one (or an edge).
        let mut s = i;
        let mut e = j;
        while s < e && !is_word(chars[s]) {
            s += 1;
        }
        while e > s && !is_word(chars[e - 1]) {
            e -= 1;
        }
        if s < e {
            out.push(chars[s..e].iter().collect());
        }
        i = j;
    }
    out
}

/// `/\b(todo|n\/?a|none|tbd|placeholder)\b/i`
fn has_placeholder_word(lower: &str) -> bool {
    let chars: Vec<char> = lower.chars().collect();
    let is_word = |c: char| c.is_alphanumeric() || c == '_';
    for word in ["todo", "n/a", "na", "none", "tbd", "placeholder"] {
        let w: Vec<char> = word.chars().collect();
        let mut i = 0;
        while i + w.len() <= chars.len() {
            if chars[i..i + w.len()] == w[..] {
                let before = i == 0 || !is_word(chars[i - 1]);
                let after = i + w.len() == chars.len() || !is_word(chars[i + w.len()]);
                let first_word = is_word(w[0]);
                let last_word = is_word(w[w.len() - 1]);
                if (!first_word || before) && (!last_word || after) {
                    return true;
                }
            }
            i += 1;
        }
    }
    false
}

/// Re-hash every pre-launch dirty file under `cwd` and return the relative paths whose existence or sha256 differs
/// from its snapshot. A file that cannot be read counts as absent.
pub fn find_mutated_dirty_before_files(
    cwd: &Path,
    snapshots: &BTreeMap<String, (bool, Option<String>)>,
) -> Vec<String> {
    let mut mutated = Vec::new();
    for (rel, (exists, hash)) in snapshots {
        let full = cwd.join(rel);
        // A path that is not a regular file (a pipe would block a read) counts as absent.
        let current = std::fs::metadata(&full)
            .ok()
            .filter(|m| m.is_file())
            .and_then(|_| std::fs::read(&full).ok())
            .map(|bytes| sha256_hex(&bytes));
        let current_exists = current.is_some();
        if current_exists != *exists || current != *hash {
            mutated.push(rel.clone());
        }
    }
    mutated
}

/// The snapshots of a baseline as [`find_mutated_dirty_before_files`] reads them: `{exists, sha256}` per path.
pub fn snapshots_of(baseline: &Value) -> BTreeMap<String, (bool, Option<String>)> {
    let mut out = BTreeMap::new();
    if let Some(map) = baseline.as_object() {
        for (path, snap) in map {
            let exists = snap.get("exists").and_then(Value::as_bool).unwrap_or(false);
            let hash = snap
                .get("hash")
                .or_else(|| snap.get("sha256"))
                .and_then(Value::as_str)
                .map(str::to_string);
            out.insert(path.clone(), (exists, hash));
        }
    }
    out
}

/// The changed files of a run and why each is one.
pub struct ChangedFiles {
    pub changed_files: Vec<String>,
    pub reasons: Map<String, Value>,
}

/// Compute changed files produced during the run.
pub fn compute_changed_files(
    git: &dyn SettlementGit,
    dir: &Path,
    git_before: Option<&str>,
    git_after: Option<&str>,
    dirty_before: &[String],
    dirty_after: &[String],
) -> ChangedFiles {
    let before_set: BTreeSet<&String> = dirty_before.iter().collect();
    let committed = match (git_before, git_after) {
        (Some(b), Some(a)) if !b.is_empty() && !a.is_empty() && b != a => {
            git.committed_diff_files(dir, b, a)
        }
        _ => Vec::new(),
    };
    let mut reasons = Map::new();
    for f in dirty_after {
        if !before_set.contains(f) {
            reasons.insert(f.clone(), json!("new-dirty-after-run"));
        }
    }
    for f in &committed {
        let reason = if reasons.contains_key(f) {
            "new-dirty-and-committed-after-run"
        } else {
            "committed-after-run"
        };
        reasons.insert(f.clone(), json!(reason));
    }
    let mut changed: Vec<String> = reasons.keys().cloned().collect();
    changed.sort();
    changed.dedup();
    ChangedFiles {
        changed_files: changed,
        reasons,
    }
}

/// The settled facts classification of one attempt's evidence.
#[derive(Debug, Clone, PartialEq)]
pub struct EvidenceFacts {
    pub exec_status: &'static str,
    pub confidence_level: &'static str,
    pub verdict: &'static str,
    pub failure: Option<Value>,
    pub policy: Option<Value>,
}

/// What [`classify_evidence_to_outcome_facts`] reads.
pub struct EvidenceInput<'a> {
    pub exit_code: Option<i64>,
    pub signal: Option<&'a str>,
    pub is_timeout: bool,
    pub agent_claim: Option<&'a Value>,
    pub claim_invalid: bool,
    pub worker_artifacts: &'a [String],
    pub changed_files: &'a [String],
    pub edited_sync_conflicts: &'a [String],
    pub is_read_only: bool,
    pub attribution_refusal_code: Option<&'a str>,
    pub role: Option<&'a str>,
    pub assignment: &'a Value,
}

fn failure(family: &str, code: &str) -> Option<Value> {
    Some(json!({"family": family, "code": code}))
}

fn allow() -> Option<Value> {
    Some(json!({"disposition": "allow", "code": Value::Null}))
}

/// The claim context an assignment gives (`role`, `operation`, and a posture when it names one).
pub fn claim_context_of(assignment: &Value) -> ClaimContext {
    ClaimContext {
        role: str_of(assignment, "role").map(str::to_string),
        operation: str_of(assignment, "operation").map(str::to_string),
        posture_verdict: assignment
            .get("posture")
            .filter(|p| !p.is_null() && *p != &json!(false))
            .map(|p| p.get("verdict") == Some(&json!(true))),
    }
}

fn is_outbox_result(artifact: &str) -> bool {
    // `[/\\]outbox[/\\]result-\d+\.json$`
    let norm = artifact.replace('\\', "/");
    match norm.rsplit_once("/outbox/") {
        Some((_, tail)) => tail
            .strip_prefix("result-")
            .and_then(|r| r.strip_suffix(".json"))
            .is_some_and(|d| !d.is_empty() && d.chars().all(|c| c.is_ascii_digit())),
        None => false,
    }
}

pub fn classify_evidence_to_outcome_facts(input: &EvidenceInput<'_>) -> EvidenceFacts {
    let facts = |exec: &'static str,
                 conf: &'static str,
                 verdict: &'static str,
                 failure: Option<Value>,
                 policy: Option<Value>| EvidenceFacts {
        exec_status: exec,
        confidence_level: conf,
        verdict,
        failure,
        policy,
    };
    if input.is_timeout || input.exit_code.is_some_and(|c| c != 0) || input.signal.is_some() {
        let f = if input.is_timeout {
            failure("resource", "execution-timeout")
        } else {
            failure("provider", "nonzero-process-exit")
        };
        return facts("failed", "failed", "not-applicable", f, None);
    }
    if input.claim_invalid {
        return facts(
            "failed",
            "failed",
            "not-applicable",
            failure("contract", "invalid-agent-result-claim"),
            Some(json!({"disposition": "refuse", "code": "invalid-agent-result-claim"})),
        );
    }
    let has_worker_report = input
        .worker_artifacts
        .iter()
        .any(|p| !p.ends_with("agent-result.json") && !is_outbox_result(p));
    let claim_status = input
        .agent_claim
        .and_then(|c| c.get("status"))
        .and_then(Value::as_str);
    let claim_verdict = input
        .agent_claim
        .and_then(|c| c.get("assessment"))
        .and_then(|a| a.get("verdict"))
        .and_then(Value::as_str);

    if claim_status == Some("failed") {
        let seat = |role: Option<&str>| {
            let mut ctx = claim_context_of(input.assignment);
            ctx.role = role.map(str::to_string);
            is_verdict_seat(&ctx)
        };
        let reviewer = seat(input.role) || seat(str_of(input.assignment, "role"));
        if (reviewer || claim_verdict == Some("findings"))
            && has_worker_report
            && input.exit_code == Some(0)
            && !input.is_timeout
        {
            return facts("completed", "reported", "findings", None, allow());
        }
        return facts(
            "failed",
            "failed",
            "not-applicable",
            failure("provider", "agent-failed"),
            None,
        );
    }

    let has_external = !input.changed_files.is_empty() || !input.edited_sync_conflicts.is_empty();

    if let Some(code) = input.attribution_refusal_code {
        return facts(
            "failed",
            "failed",
            "not-applicable",
            failure("policy", code),
            Some(json!({"disposition": "refuse", "code": code})),
        );
    }
    if claim_status == Some("blocked") {
        return facts("completed", "reported", "blocked", None, allow());
    }
    if input.agent_claim.is_some() && claim_status == Some("done") {
        let verdict = if claim_verdict == Some("findings") {
            "findings"
        } else {
            "pass"
        };
        if input.is_read_only {
            if has_worker_report {
                return facts("completed", "reported", verdict, None, allow());
            }
            return facts("completed", "no-evidence", "inconclusive", None, None);
        }
        if has_external {
            return facts("completed", "verified", verdict, None, allow());
        }
        return facts("completed", "no-evidence", "inconclusive", None, None);
    }
    if !input.is_read_only && has_external {
        return facts("completed", "inferred", "pass", None, allow());
    }
    // Exit 0 with no claim and no report is `no-report`: the result never reached the harness.
    let f = if input.agent_claim.is_some() || has_worker_report {
        None
    } else {
        failure("unknown", "no-report")
    };
    facts("completed", "no-evidence", "inconclusive", f, None)
}

/// Whether the report a seat left is complete: complete when a substantive report exists and the seat ended on its
/// own (it wrote its claim and was neither timed out nor killed). Never unknown: false carries its reason.
pub fn declare_report(
    settle_reports: &[Value],
    agent_claim: Option<&Value>,
    is_timeout: bool,
    signal: Option<&str>,
) -> Value {
    if settle_reports.is_empty() {
        return json!({"complete": false, "incompleteReason": "no-report"});
    }
    if is_timeout || signal.is_some() || agent_claim.is_none() {
        return json!({"complete": false, "incompleteReason": "seat-did-not-finish"});
    }
    json!({"complete": true, "incompleteReason": Value::Null})
}

/// The scope the assignment declared (a unit's writes): a change inside it is covered, one outside it warns.
pub struct DeclaredScope {
    pub declared_writes: Option<Vec<String>>,
    pub edited_sync_conflicts: Vec<String>,
}

pub fn declared_scope_of(
    assignment: &Value,
    is_read_only: bool,
    settlement_cwd: &Path,
    dirty_before_snapshots: Option<&BTreeMap<String, (bool, Option<String>)>>,
) -> DeclaredScope {
    let strings = |key: &str| -> Option<Vec<String>> {
        assignment.get(key).and_then(Value::as_array).map(|a| {
            a.iter()
                .filter_map(|v| v.as_str().map(str::to_string))
                .collect()
        })
    };
    let declared_writes = if is_read_only {
        None
    } else {
        strings("writes").filter(|w| !w.is_empty())
    };
    let edited = match (
        &declared_writes,
        strings("syncConflicts"),
        dirty_before_snapshots,
    ) {
        (Some(writes), Some(conflicts), Some(snaps)) => {
            let conflicts: BTreeSet<String> = conflicts.into_iter().collect();
            find_mutated_dirty_before_files(settlement_cwd, snaps)
                .into_iter()
                .filter(|p| {
                    conflicts.contains(p)
                        && fgos_write_scope::matches(p.as_bytes(), writes).unwrap_or(false)
                })
                .collect()
        }
        _ => Vec::new(),
    };
    DeclaredScope {
        declared_writes,
        edited_sync_conflicts: edited,
    }
}

/// The policy a receipt records, plus what the launch itself did with it, under `launch`: the effort level as the
/// provider CLI's own flag (the rendered control `{command, flag, native}` a launch records, kept whole) and every
/// place the model that ran differs from the one bound.
pub fn with_launch_facts(
    policy: &Value,
    reasoning_effort: Option<&Value>,
    model_warnings: &[Value],
) -> Value {
    let effort = reasoning_effort.filter(|e| truthy(Some(e)));
    if effort.is_none() && model_warnings.is_empty() {
        return policy.clone();
    }
    let mut launch = Map::new();
    if let Some(effort) = effort {
        launch.insert("effortRendered".into(), effort.clone());
    }
    if !model_warnings.is_empty() {
        launch.insert("modelDrift".into(), Value::Array(model_warnings.to_vec()));
    }
    let mut out = policy.as_object().cloned().unwrap_or_default();
    out.insert("launch".into(), Value::Object(launch));
    Value::Object(out)
}

/// What reading the worker's artifacts of a run directory gave.
pub struct WorkerArtifacts {
    pub agent_claim: Option<Value>,
    pub claim_invalid: bool,
    pub claim_sha256: Option<String>,
    pub worker_artifacts: Vec<Value>,
    pub settle_reports: Vec<Value>,
    pub worker_artifact_paths: Vec<String>,
}

/// Reads the agent's result claim and report from the run directory; a claim that fails validation is recorded as
/// invalid. `given_result_path`: `None` lets settlement look for the claim; `Some(None)` is a receipt that names none.
pub fn read_worker_artifacts(
    run_dir: &Path,
    root: &Path,
    given_result_path: Option<Option<&Path>>,
    assignment: &Value,
) -> WorkerArtifacts {
    let report_path = resolve_worker_artifact_path(run_dir, "report-", ".md", "agent-report.md");
    let result_path = match given_result_path {
        None => Some(resolve_worker_artifact_path(
            run_dir,
            "result-",
            ".json",
            "agent-result.json",
        )),
        Some(given) => given.map(Path::to_path_buf),
    };
    let result_exists = result_path.as_ref().is_some_and(|p| p.exists());

    let mut agent_claim = None;
    let mut claim_invalid = false;
    let mut claim_sha256 = None;
    if result_exists {
        let path = result_path.as_ref().expect("checked above");
        let parsed = read_agent_file(path, MAX_AGENT_FILE_BYTES)
            .ok()
            .and_then(|bytes| {
                let value: Value = serde_json::from_slice(&bytes).ok()?;
                Some((value, bytes))
            });
        match parsed {
            Some((value, bytes)) => {
                let validation =
                    validate_agent_result_claim_contract(&value, &claim_context_of(assignment));
                if validation.valid {
                    claim_sha256 = Some(sha256_hex(&bytes));
                    agent_claim = Some(bound_frictions(value));
                } else {
                    claim_invalid = true;
                }
            }
            None => claim_invalid = true,
        }
    }

    let mut worker_artifacts = Vec::new();
    let mut settle_reports = Vec::new();
    if report_path.exists() {
        let mut report_sha = None;
        if let Ok(bytes) = read_agent_file(&report_path, MAX_AGENT_FILE_BYTES) {
            if is_substantive_report_text(&String::from_utf8_lossy(&bytes)) {
                report_sha = Some(sha256_hex(&bytes));
            }
        }
        let rel = relative(root, &report_path);
        worker_artifacts
            .push(json!({"path": rel, "kind": "agent-report", "valid": report_sha.is_some()}));
        if let Some(sha) = report_sha {
            settle_reports.push(json!({"path": rel, "sha256": sha}));
        }
    }
    if result_exists {
        let path = result_path.as_ref().expect("checked above");
        worker_artifacts.push(
            json!({"path": relative(root, path), "kind": "agent-result", "valid": !claim_invalid}),
        );
    }
    let worker_artifact_paths = worker_artifacts
        .iter()
        .filter(|a| a["valid"] == json!(true))
        .filter_map(|a| a["path"].as_str().map(str::to_string))
        .collect();
    WorkerArtifacts {
        agent_claim,
        claim_invalid,
        claim_sha256,
        worker_artifacts,
        settle_reports,
        worker_artifact_paths,
    }
}
