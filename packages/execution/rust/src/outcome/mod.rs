//! Execution's outcome vocabulary (unit-run-result contract, sections 3 and 5): the closed table of seat
//! outcomes, their classes, the predicates two layers used to hold with different lists, and the one table from
//! an outcome to the process exit code. The loops, the unit summary, resume and the CLI read from here.
//!
//! Not Execution outcomes, so not in the table: Workflow's `admission-refused` and `partial-writes` (a stop
//! reason on `fallbackExhausted`/`retryStopped`, never the outcome of a seat).

use crate::seat_resolver::value::{get, items, truthy};
use crate::seat_resolver::{is_verdict_result, is_verify_result, seat_key_of};
use serde_json::{json, Value};

/// A seat outcome; the six values a seat can end with.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Outcome {
    Pass,
    Findings,
    ExecutionFailure,
    PolicyRefusal,
    ProviderLimit,
    Blocked,
}

impl Outcome {
    pub fn as_str(self) -> &'static str {
        match self {
            Outcome::Pass => "pass",
            Outcome::Findings => "findings",
            Outcome::ExecutionFailure => "execution-failure",
            Outcome::PolicyRefusal => "policy-refusal",
            Outcome::ProviderLimit => "provider-limit",
            Outcome::Blocked => "blocked",
        }
    }

    pub fn parse(text: &str) -> Option<Outcome> {
        VALID_OUTCOMES_ENUM
            .iter()
            .copied()
            .find(|o| o.as_str() == text)
    }

    /// `verdict` for a completed judgment, else the class of the failure.
    pub fn class(self) -> &'static str {
        match self {
            Outcome::Pass | Outcome::Findings => "verdict",
            Outcome::ExecutionFailure => "infrastructure",
            Outcome::PolicyRefusal => "policy",
            Outcome::ProviderLimit => "provider",
            Outcome::Blocked => "blocked",
        }
    }
}

const VALID_OUTCOMES_ENUM: [Outcome; 6] = [
    Outcome::Pass,
    Outcome::Findings,
    Outcome::ExecutionFailure,
    Outcome::PolicyRefusal,
    Outcome::ProviderLimit,
    Outcome::Blocked,
];

/// The closed table of seat outcomes, in table order.
pub const VALID_OUTCOMES: [&str; 6] = [
    "pass",
    "findings",
    "execution-failure",
    "policy-refusal",
    "provider-limit",
    "blocked",
];

/// The outcomes of a seat that did not finish its job: the seat ended in error and a resume binds it again.
pub const ERROR_OUTCOMES: [&str; 4] = [
    "execution-failure",
    "policy-refusal",
    "provider-limit",
    "blocked",
];

/// A reserved value, not a seat outcome: a case reservation settles with it when no seat was given its brief.
pub const NOT_STARTED_OUTCOME: &str = "not-started";

/// A read-model value, not a seat outcome: a summary that cannot derive an outcome from what was recorded.
pub const UNDETERMINED_OUTCOME: &str = "undetermined";

/// The class of an outcome a reader can meet, or `None` when the value is unknown (a reader treats that as no
/// verdict).
pub fn outcome_class(outcome: &str) -> Option<&'static str> {
    if outcome == NOT_STARTED_OUTCOME {
        return Some("infrastructure");
    }
    Outcome::parse(outcome).map(Outcome::class)
}

/// Whether the outcome is a completed judgment of the work: `pass` or `findings`.
pub fn is_verdict(outcome: &str) -> bool {
    outcome_class(outcome) == Some("verdict")
}

/// Whether the outcome says the run ended on infrastructure: `execution-failure` or `not-started`.
pub fn is_infrastructure(outcome: &str) -> bool {
    outcome_class(outcome) == Some("infrastructure")
}

/// Whether the outcome ends a round in error.
pub fn is_error_outcome(outcome: &str) -> bool {
    ERROR_OUTCOMES.contains(&outcome)
}

/// Whether a resume binds the seat again: its last attempt ended in error.
pub fn rebinds_on_resume(seat_outcome: &str) -> bool {
    is_error_outcome(seat_outcome)
}

fn outcome_text(value: Option<&Value>) -> &str {
    value.and_then(Value::as_str).unwrap_or("")
}

/// Whether a unit ended on infrastructure, so a rerun can still produce the verdict: its outcome is
/// infrastructure, it wrote no path outside its declared scope, no seat of it was refused (a refused seat is
/// never infrastructure, whatever the unit outcome says), and no verdict seat of it reached a verdict.
pub fn infrastructure(unit_result: &Value) -> bool {
    if !is_infrastructure(outcome_text(unit_result.get("outcome"))) {
        return false;
    }
    let out_of_scope = get(unit_result, "outOfScope").is_some_and(|v| match v {
        Value::Array(a) => !a.is_empty(),
        Value::String(s) => !s.is_empty(),
        _ => false,
    });
    if out_of_scope {
        return false;
    }
    !items(unit_result.get("results")).iter().any(|result| {
        get(result, "refused").is_some_and(truthy)
            || (is_verdict_result(result) && is_verdict(outcome_text(result.get("outcome"))))
    })
}

/// The rule "writing outside the declared writes is not a pass": a unit that passed with paths outside its
/// scope is a finding. Any other outcome stands.
pub fn outcome_after_scope_rule<'a>(outcome: &'a str, out_of_scope: &[String]) -> &'a str {
    if outcome == "pass" && !out_of_scope.is_empty() {
        "findings"
    } else {
        outcome
    }
}

/// One entry per evaluator result that reached a verdict: the harness's verify round and a checker's verdict.
/// What a worker wrote about itself is never an evaluation, and an evaluator that did not finish judged
/// nothing. Each entry is `{ kind: 'verify'|'verdict', seat, round, passed }`.
pub fn evaluations_of(results: &[Value]) -> Vec<Value> {
    results
        .iter()
        .filter(|result| is_verdict(outcome_text(result.get("outcome"))))
        .filter_map(|result| {
            let kind = if is_verify_result(result) {
                "verify"
            } else if is_verdict_result(result) {
                "verdict"
            } else {
                return None;
            };
            Some(json!({
                "kind": kind,
                "seat": seat_key_of(result).cloned().unwrap_or(Value::Null),
                "round": get(result, "round").cloned().unwrap_or(json!(1)),
                "passed": result.get("outcome") == Some(&json!("pass")),
            }))
        })
        .collect()
}

/// Execution outcome codes of `fgos run` and foreground workflow runs. `partial-writes` is the code reserved for
/// that stop reason; the CLI help documents it.
pub const OUTCOME_EXIT_CODES: [(&str, i32); 7] = [
    ("policy-refusal", 4),
    ("provider-limit", 10),
    ("execution-failure", 11),
    (NOT_STARTED_OUTCOME, 11),
    ("partial-writes", 12),
    ("blocked", 13),
    ("findings", 14),
];

/// Map an execution outcome onto a canonical exit code: `pass` is 0, a recognised non-pass outcome its table
/// code, anything else 1.
pub fn exit_code_for_outcome(outcome: &str) -> i32 {
    if outcome == "pass" {
        return 0;
    }
    OUTCOME_EXIT_CODES
        .iter()
        .find(|(name, _)| *name == outcome)
        .map_or(1, |(_, code)| *code)
}
