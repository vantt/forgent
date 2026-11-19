//! The contract the Execution Core asks before it runs a Unit for a case. The core owns this contract and never
//! the decision; Workflow implements [`CaseAdmission`] and the entry point injects it into the run, so the core
//! never imports Workflow. There is no adapter here, and nothing in this module writes a ledger.
//!
//! The port is asked at four moments and nowhere else:
//!
//! * `resolve_binding`: before anything exists: is the worktree free (`unbound`), or whose is it?
//! * `admit`: a Unit that names a case: may this activity run now? Holds the reservation.
//! * `recheck_effect`: before a writing round's commit: does the consent the admission stood on still hold?
//! * `settle`: once, after the pattern settled (or the run failed): the Unit shape of the unit-run-result
//!   contract (final outcome, infrastructure, scope, evaluations, start, launches).
//!
//! Two more questions Workflow answers for the run and the entry point injects with it: `activity_unit_of`
//! (what a case's pinned workflow says about an activity's Unit pattern) and `confined_write_refusal` (why this
//! process may not write a case's ledger, or none).

use crate::outcome::NOT_STARTED_OUTCOME;
use crate::seat_resolver::value::{get, items, str_at};
use serde_json::{json, Map, Value};

pub use crate::seat_resolver::seat_launches_of;

pub const PORT_MISSING: &str = "case-admission-port-missing";
pub const SEAT_LAUNCH_CEILING: &str = "seat-launch-ceiling";
/// The refusal code of a write from a confined worker (`confined_write_refusal` gives the reason).
pub const CONFINED_WRITE_CODE: &str = "nested-write-from-confined-worker";

/// The version shape every settle carries (docs/platform/runner/contracts/unit-run-result.md, section 2).
pub fn unit_run_result_contract() -> Value {
    json!({ "id": "unit-run-result", "version": 1 })
}

/// The Unit facts a settle reports (the Unit shape of the unit-run-result contract).
#[derive(Debug, Clone, PartialEq)]
pub struct UnitFacts {
    pub outcome: String,
    pub infrastructure: bool,
    pub out_of_scope: Vec<Value>,
    pub out_of_scope_on_branch: Vec<Value>,
    pub evaluations: Vec<Value>,
    /// `{ value: bool, reason: string|null }`
    pub started: Value,
    /// `{ ceiling: number|null, used: number, ceilingHit: bool }`
    pub launches: Value,
    pub results: Vec<Value>,
}

/// The settle a reservation takes when its Unit ended with `unit` facts: the one place that message is made,
/// for a Unit that ran and for a reservation released without a run.
pub fn unit_run_settle(case_id: &str, unit_run_id: Option<&str>, unit: &UnitFacts) -> Value {
    let started = unit.started.get("value") == Some(&Value::Bool(true));
    json!({
        "contract": unit_run_result_contract(),
        "caseId": case_id,
        "outcome": unit.outcome,
        "unitRunId": if started { unit_run_id.map_or(Value::Null, |id| json!(id)) } else { Value::Null },
        "infrastructure": unit.infrastructure,
        "outOfScope": unit.out_of_scope,
        "outOfScopeOnBranch": unit.out_of_scope_on_branch,
        "evaluations": unit.evaluations,
        "started": unit.started,
        "launches": unit.launches,
        "results": unit.results,
        "seatLaunchesUsed": unit.launches.get("used").cloned().unwrap_or(Value::Null),
        "frameExhausted": unit.launches.get("ceilingHit").cloned().unwrap_or(Value::Null),
    })
}

/// The settle of a reservation whose Unit run can no longer run and never reported: no seat was given a brief.
pub fn released_unit_run_settle(case_id: &str) -> Value {
    unit_run_settle(
        case_id,
        None,
        &UnitFacts {
            outcome: NOT_STARTED_OUTCOME.to_string(),
            infrastructure: true,
            out_of_scope: Vec::new(),
            out_of_scope_on_branch: Vec::new(),
            evaluations: Vec::new(),
            started: json!({ "value": false, "reason": "reservation-released" }),
            launches: json!({ "ceiling": Value::Null, "used": 0, "ceilingHit": false }),
            results: Vec::new(),
        },
    )
}

/// What a port answers to `admit`.
#[derive(Debug, Clone, PartialEq)]
pub enum Admission {
    /// `{ admitted: true, reservationId, caseId, seatLaunchCeiling }`
    Admitted {
        reservation_id: String,
        case_id: String,
        seat_launch_ceiling: Option<u64>,
    },
    Refused(Refusal),
}

/// A refusal: a stable `code`, the `condition` it names, and the violations that came with it.
#[derive(Debug, Clone, PartialEq)]
pub struct Refusal {
    pub code: String,
    pub condition: String,
    pub violations: Option<Vec<Value>>,
}

/// What a port answers to `recheck_effect`.
#[derive(Debug, Clone, PartialEq)]
pub enum Recheck {
    Ok,
    Refused { code: String, condition: String },
}

/// The case admission port, as the peer protocol carries it. Payloads are the documents of the unit-run-result
/// contract, kept as JSON.
pub trait CaseAdmission {
    /// `{ worktree, caseId? }` to `{ answer, record? }`.
    fn resolve_binding(&self, ask: &Value) -> Value;
    /// A proposal to its admission or refusal.
    fn admit(&self, proposal: &Value) -> Admission;
    /// Whether the consent the admission stood on still holds for `paths` of `case_id`.
    fn recheck_effect(&self, reservation_id: &str, case_id: &str, paths: &[String]) -> Recheck;
    /// The one settle of a reservation (see [`unit_run_settle`]).
    fn settle(&self, reservation_id: &str, settle: &Value);
    /// `{ pattern, params }` of an activity's Unit, or `None` when the case or activity has none.
    fn activity_unit_of(&self, main_root: &str, case_id: &str, activity: &str) -> Option<Value>;
    /// Why this process may not write the case's ledger and bindings; `None` when it may.
    fn confined_write_refusal(&self, main_root: &str, case_id: Option<&str>) -> Option<String>;
}

/// The refusal a run reports when the port refuses; the port's own answer rides along as `refusal`.
#[derive(Debug, Clone, PartialEq)]
pub struct CaseAdmissionRefused {
    pub refusal: Refusal,
}

impl CaseAdmissionRefused {
    pub const NAME: &'static str = "CaseAdmissionRefusedError";

    pub fn code(&self) -> &str {
        &self.refusal.code
    }
}

impl std::fmt::Display for CaseAdmissionRefused {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "case admission refused {}: {}",
            self.refusal.code, self.refusal.condition
        )
    }
}

impl std::error::Error for CaseAdmissionRefused {}

/// A case reference was not `{ caseId, activity }` with both non-empty.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InvalidCaseRef;

impl std::fmt::Display for InvalidCaseRef {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("runUnit: caseRef requires non-empty caseId and activity")
    }
}

impl std::error::Error for InvalidCaseRef {}

/// The case a Unit names: `{ caseId, activity }` plus the optional unit id, the route the proposer says it
/// takes, and its reason. `Ok(None)` when no case is named.
pub fn normalize_case_ref(value: Option<&Value>) -> Result<Option<Value>, InvalidCaseRef> {
    let Some(value) = value.filter(|v| !v.is_null()) else {
        return Ok(None);
    };
    let text = |key: &str| str_at(value, key).map(str::trim).filter(|t| !t.is_empty());
    if !value.is_object() || text("caseId").is_none() || text("activity").is_none() {
        return Err(InvalidCaseRef);
    }
    let mut out = Map::new();
    for key in ["caseId", "activity", "unitId", "route", "reason"] {
        if let Some(t) = text(key) {
            out.insert(key.into(), json!(t));
        }
    }
    Ok(Some(Value::Object(out)))
}

/// Whether an attempt's receipt says its agent was never given the brief (nothing was typed, or the launch was
/// abandoned first).
pub fn brief_never_reached(receipt: &Value) -> bool {
    str_at(receipt, "outcome").is_some_and(|o| o.starts_with("abandoned"))
        || str_at(receipt, "reason") == Some("terminal:foreground-not-agent")
}

/// Every attempt of a unit record's `bindings`, flattened in key order.
fn attempts_of(unit_record: &Value) -> Vec<&Value> {
    get(unit_record, "bindings")
        .and_then(Value::as_object)
        .into_iter()
        .flat_map(|b| b.values())
        .flat_map(|attempts| items(Some(attempts)))
        .collect()
}

/// An attempt that launched a worker: it has a dispatch retry id and its account was not refused a lease.
fn launched(attempt: &&Value) -> bool {
    attempt.get("dispatchRetryId").is_some()
        && attempt.get("leaseConflict") != Some(&Value::Bool(true))
}

/// Whether the run launched seats and none of them was given its brief. Such a run did nothing a case should
/// pay for, so its reservation is handed back instead of spending the frame's dispatch.
pub fn no_brief_delivered(unit_record: &Value) -> bool {
    let attempts: Vec<&Value> = attempts_of(unit_record)
        .into_iter()
        .filter(launched)
        .collect();
    !attempts.is_empty()
        && attempts
            .iter()
            .all(|a| a.get("briefNotDelivered") == Some(&Value::Bool(true)))
}

/// Every attempt a Unit run has launched so far, from its record: the one count the ceiling is held against.
/// An attempt whose account could not be leased never started a worker: it is not a launch.
pub fn seat_launches_used(unit_record: &Value) -> u64 {
    attempts_of(unit_record)
        .into_iter()
        .filter(launched)
        .count() as u64
}
