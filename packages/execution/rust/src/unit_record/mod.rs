//! The record of a Unit run, as rules: the unit summary read model, what a unit run is doing when nobody may be
//! driving it, and where its controller's ledger lives. Pure: these functions take the facts a reader gathered
//! (the unit record, the seats read from the run directory, whether a controller is alive, what an attempt probe
//! said) and decide. Reading the directory, probing an attempt and publishing the summary file belong to the
//! engine's `unit_run`; they ask this module what the facts mean.
//!
//! Contracts: the summary is `unit-summary` version 3 and the state names and rules are
//! `packages/run-supervisor/contracts/unit-state.v1.json`.

mod timestamp;

use crate::loops::pattern_history_outcome;
use crate::outcome::{UNDETERMINED_OUTCOME, VALID_OUTCOMES};
use crate::seat_resolver::value::{get, items, str_at, truthy};
use crate::seat_resolver::{collaboration_of_record, seat_kind, seats_of_record, VERIFY_SEAT};
use serde_json::{json, Map, Value};
use std::path::{Path, PathBuf};

pub use timestamp::parse_timestamp_ms;

/// Version 3 copies the infrastructure facts Execution stored on the unit record at settlement
/// (`infrastructure`, `infrastructureReason`, `refused`); a record settled before they were stored reads as not
/// known (`null`, `null`, `[]`), never as a pass. Version 2 files already on disk are still read. Each seat
/// carries an owner-written kind, and a finished unit whose pattern was never recorded is published as
/// `undetermined` instead of being derived as if it were solo.
pub fn unit_summary_contract() -> Value {
    json!({ "id": "unit-summary", "version": 3 })
}

/// A summary could not be built from what was given.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SummaryError(pub String);

impl std::fmt::Display for SummaryError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.0)
    }
}

impl std::error::Error for SummaryError {}

/// The stance a panel member's claim states: `{ status: 'missing' }`, `{ status: 'invalid', reason }` or
/// `{ status: 'valid', choice, confidence }`. A choice must be a declared option or `other`.
pub fn extract_stance(agent_claim: Option<&Value>, options: &[Value]) -> Value {
    let Some(stance) = agent_claim.and_then(|c| c.get("stance")) else {
        return json!({ "status": "missing" });
    };
    if !stance.is_object() {
        return json!({ "status": "invalid", "reason": "stance-not-object" });
    }
    let choice = stance.get("choice").and_then(Value::as_str);
    let declared =
        choice.is_some_and(|c| c == "other" || options.iter().any(|o| o.as_str() == Some(c)));
    let Some(choice) = choice.filter(|_| declared) else {
        return json!({ "status": "invalid", "reason": "choice-not-declared" });
    };
    let confidence = get(stance, "confidence");
    if let Some(c) = confidence {
        if !c
            .as_f64()
            .is_some_and(|f| f.is_finite() && (0.0..=1.0).contains(&f))
        {
            return json!({ "status": "invalid", "reason": "confidence-out-of-range" });
        }
    }
    json!({ "status": "valid", "choice": choice, "confidence": confidence.cloned().unwrap_or(Value::Null) })
}

fn timestamp(value: Option<&Value>) -> Option<&str> {
    value
        .and_then(Value::as_str)
        .filter(|s| parse_timestamp_ms(s).is_some())
}

fn text_at(value: &Value, key: &str) -> Option<String> {
    str_at(value, key)
        .map(str::trim)
        .filter(|t| !t.is_empty())
        .map(str::to_string)
}

/// `{ caseId, activity, reservationId }` of a workflow link (`runId`/`stepId` are the older names); `None` for
/// an absent or malformed link.
pub fn workflow_link_of(value: Option<&Value>) -> Option<Value> {
    let value = value.filter(|v| v.is_object())?;
    let case_id = text_at(value, "caseId").or_else(|| text_at(value, "runId"))?;
    let activity = text_at(value, "activity").or_else(|| text_at(value, "stepId"))?;
    Some(
        json!({ "caseId": case_id, "activity": activity, "reservationId": text_at(value, "reservationId") }),
    )
}

/// `{ dir, phase }` of a plan reference; `None` for an absent or malformed one.
pub fn plan_ref_of(value: Option<&Value>) -> Option<Value> {
    let value = value.filter(|v| v.is_object())?;
    let raw_dir = value.get("dir")?.as_str()?;
    let trimmed = raw_dir.trim();
    let trimmed = trimmed
        .strip_prefix("./")
        .unwrap_or(trimmed)
        .trim_end_matches('/');
    let dir = if trimmed.starts_with("plans/") {
        trimmed.to_string()
    } else {
        format!("plans/{trimmed}")
    };
    let name = &dir["plans/".len()..];
    if name.is_empty() || name.contains('/') || name.contains('\\') || name == "." || name == ".." {
        return None;
    }
    let phase = match get(value, "phase") {
        None => return Some(json!({ "dir": dir, "phase": Value::Null })),
        Some(Value::String(s)) => s.trim().to_string(),
        Some(Value::Number(n)) if n.as_u64().is_some() => n.to_string(),
        Some(_) => return None,
    };
    let mut chars = phase.chars();
    let valid = chars.next().is_some_and(|c| c.is_ascii_alphanumeric())
        && chars.all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-'));
    valid.then(|| json!({ "dir": dir, "phase": phase }))
}

/// Whether the record says an attempt is still open: its `execution.status` when stored, else what the
/// directory scan finds (`scan` reports a published attempt without its terminal result).
pub fn unit_has_active_run(record: &Value, scan: impl FnOnce() -> bool) -> bool {
    match get(record, "execution")
        .and_then(|e| get(e, "status"))
        .filter(|s| truthy(s))
    {
        Some(status) => status.as_str() != Some("settled"),
        None => scan(),
    }
}

/// What the summary is built from.
pub struct SummaryInput<'a> {
    /// The parsed `unit.json`.
    pub record: &'a Value,
    /// The directory name of the unit run.
    pub unit_run_id: &'a str,
    /// The seats read from the run directory: `{ seat, round, attempts, final }` each.
    pub raw_seats: &'a [Value],
    /// The shipped catalog a record without `collaboration` is decoded against.
    pub shipped: Option<&'a Value>,
    /// A completion a legacy record settled with; it must name this unit run.
    pub legacy_completion: Option<&'a Value>,
    /// Whether an attempt is still open (see [`unit_has_active_run`]).
    pub active: bool,
}

fn valid_completion(completion: Option<&Value>) -> Option<&Value> {
    let c = completion?;
    let outcome = str_at(c, "outcome")?;
    (VALID_OUTCOMES.contains(&outcome) && timestamp(c.get("settledAt")).is_some()).then_some(c)
}

fn bool_text(value: Option<&Value>) -> Value {
    value
        .filter(|v| v.is_boolean())
        .cloned()
        .unwrap_or(Value::Null)
}

/// The derived discussion read model of a unit run, built without changing the original records.
pub fn build_unit_summary(input: &SummaryInput) -> Result<Value, SummaryError> {
    let record = input.record;
    if let Some(lc) = input.legacy_completion.filter(|c| !c.is_null()) {
        if str_at(lc, "unitRunId") != Some(input.unit_run_id) {
            return Err(SummaryError(
                "completion belongs to another unit run".into(),
            ));
        }
    }
    // Records written before the owner stored its pattern do not say which pattern ran, so the pattern stays
    // unknown rather than defaulting to solo.
    let pin = get(record, "collaboration").filter(|c| truthy(c));
    let pattern =
        get(record, "pattern").or_else(|| get(record, "unit").and_then(|u| get(u, "pattern")));
    let decoded = (pin.is_none() && pattern.is_some())
        .then(|| collaboration_of_record(record, input.shipped));
    let recognized = decoded
        .as_ref()
        .is_some_and(|d| d.get("recognized") == Some(&Value::Bool(true)));
    let loop_name: Option<String> = pin
        .and_then(|p| get(p, "effective"))
        .and_then(|e| get(e, "loop"))
        .or_else(|| {
            decoded
                .as_ref()
                .filter(|_| recognized)
                .and_then(|d| d.get("effective"))
                .and_then(|e| get(e, "loop"))
        })
        .and_then(Value::as_str)
        .map(str::to_string);
    let params = pin
        .and_then(|p| get(p, "effective"))
        .and_then(|e| get(e, "params"))
        .or_else(|| {
            decoded
                .as_ref()
                .and_then(|d| d.get("effective"))
                .and_then(|e| get(e, "params"))
        })
        .cloned()
        .unwrap_or_else(|| json!({}));
    let cfg = get(record, "configSnapshot")
        .and_then(|c| get(c, "runner"))
        .cloned()
        .unwrap_or_else(|| json!({}));
    let record_seats = seats_of_record(record);
    let seat_info = |id: &str| record_seats.iter().find(|s| str_at(s, "seat") == Some(id));
    let kind_of = |id: &str| -> &str {
        if let Some(known) = seat_info(id) {
            return seat_kind(known);
        }
        match loop_name.as_deref() {
            None => "unknown",
            Some(_) if id == VERIFY_SEAT || id == "verifier" => "verifier",
            Some("reviewed") => "checker",
            Some(_) => "unknown",
        }
    };
    let options: Vec<Value> = get(record, "unit")
        .map(|u| items(u.get("stanceOptions")).to_vec())
        .unwrap_or_default();
    let mut settlement_times: Vec<String> = Vec::new();
    // Provider family each final seat was bound to, when its binding asked for a soft spread.
    let mut family_by_seat: Vec<(String, String)> = Vec::new();
    let mut seats: Vec<Value> = Vec::new();
    for seat in input.raw_seats.iter().filter(|s| get(s, "final").is_some()) {
        let seat_id = str_at(seat, "seat").unwrap_or_default();
        let round = seat.get("round").cloned().unwrap_or(Value::Null);
        let final_attempt = &seat["final"];
        let attempts = items(seat.get("attempts"));
        let final_index = attempts.iter().position(|a| a == final_attempt);
        let mut project = |attempt: &Value, is_final: bool| -> Value {
            let result = get(attempt, "runResult")
                .cloned()
                .unwrap_or_else(|| json!({}));
            let key = format!("{seat_id}/{}", crate::loops::round_text(&round));
            let recorded = get(record, "bindings")
                .and_then(|b| get(b, &key))
                .map(|list| items(Some(list)))
                .and_then(|list| {
                    list.iter()
                        .find(|e| e.get("assignmentId") == attempt.get("assignmentId"))
                });
            let binding = recorded
                .and_then(|r| get(r, "binding"))
                .or_else(|| get(attempt, "assignment").and_then(|a| get(a, "binding")))
                .cloned()
                .unwrap_or_else(|| json!({}));
            if is_final {
                let family = get(&binding, "provenance")
                    .and_then(|p| get(p, "familySpread"))
                    .and_then(|f| get(f, "value"))
                    .and_then(|v| get(v, "family"))
                    .filter(|f| truthy(f))
                    .and_then(Value::as_str);
                if let Some(family) = family {
                    match family_by_seat.iter_mut().find(|(k, _)| *k == key) {
                        Some(entry) => entry.1 = family.to_string(),
                        None => family_by_seat.push((key.clone(), family.to_string())),
                    }
                }
            }
            let executor = get(&result, "executorId")
                .or_else(|| get(&binding, "executor"))
                .cloned();
            let settled_at =
                timestamp(result.get("settledAt")).or_else(|| timestamp(result.get("timestamp")));
            if let Some(at) = settled_at {
                settlement_times.push(at.to_string());
            }
            let duration = recorded
                .and_then(|r| r.get("durationMs"))
                .and_then(Value::as_u64);
            let account = recorded
                .and_then(|r| get(r, "leaseReceipt"))
                .and_then(|l| str_at(l, "accountId"))
                .filter(|a| !a.is_empty());
            let provider = get(&result, "policy")
                .and_then(|p| get(p, "providerModel"))
                .or_else(|| {
                    let ex = executor.as_ref().and_then(Value::as_str)?;
                    get(&cfg, "executors")
                        .and_then(|e| get(e, ex))
                        .and_then(|e| get(e, "providerModel"))
                });
            let mut out = Map::new();
            let put = |out: &mut Map<String, Value>, k: &str, v: Option<&Value>| {
                out.insert(k.into(), v.cloned().unwrap_or(Value::Null));
            };
            put(
                &mut out,
                "assignmentId",
                get(&result, "assignmentId").or_else(|| attempt.get("assignmentId")),
            );
            put(&mut out, "runId", get(&result, "runId"));
            put(&mut out, "executor", executor.as_ref());
            put(&mut out, "provider", provider);
            put(
                &mut out,
                "persona",
                get(&result, "policy")
                    .and_then(|p| get(p, "persona"))
                    .or_else(|| get(&binding, "persona")),
            );
            put(
                &mut out,
                "model",
                get(&result, "policy")
                    .and_then(|p| get(p, "model"))
                    .or_else(|| get(&binding, "model")),
            );
            if let Some(o) = attempt.get("outcome") {
                out.insert("outcome".into(), o.clone());
            }
            put(
                &mut out,
                "fallbackFrom",
                recorded
                    .and_then(|r| get(r, "fallbackFrom"))
                    .or_else(|| get(&binding, "provenance").and_then(|p| get(p, "fallbackFrom"))),
            );
            if let Some(a) = account {
                out.insert("accountId".into(), json!(a));
            }
            if let Some(d) = duration {
                out.insert("durationMs".into(), json!(d));
            }
            if let Some(u) = result
                .get("usage")
                .filter(|u| u.is_object() || u.is_array())
            {
                out.insert("usage".into(), u.clone());
            }
            Value::Object(out)
        };
        let mut final_projection = project(final_attempt, final_index.is_none());
        let projected: Vec<Value> = attempts
            .iter()
            .enumerate()
            .map(|(i, a)| project(a, Some(i) == final_index))
            .collect();
        if let Some(i) = final_index {
            final_projection = projected[i].clone();
        }
        let stance = extract_stance(
            get(final_attempt, "runResult").and_then(|r| r.get("agentClaim")),
            &options,
        );
        if let Some(map) = final_projection.as_object_mut() {
            map.insert("stance".into(), stance);
        }
        seats.push(json!({
            "seat": seat_id,
            "role": seat_info(seat_id).and_then(|s| s.get("role")).cloned().unwrap_or_else(|| json!(seat_id)),
            "kind": kind_of(seat_id),
            "round": round,
            "final": final_projection,
            "attempts": projected,
        }));
    }
    seats.sort_by(|a, b| {
        let key = |v: &Value| {
            (
                str_at(v, "seat").unwrap_or_default().to_string(),
                v.get("round").and_then(Value::as_f64).unwrap_or(0.0),
            )
        };
        let (ka, kb) = (key(a), key(b));
        ka.0.cmp(&kb.0)
            .then(ka.1.partial_cmp(&kb.1).unwrap_or(std::cmp::Ordering::Equal))
    });
    // Seats that ended up on one provider family. Absent when every spread seat has its own, so a summary
    // never claims independence it lacks and older summaries keep their bytes.
    let mut by_family: Vec<(String, Vec<String>)> = Vec::new();
    for (seat, family) in &family_by_seat {
        match by_family.iter_mut().find(|(f, _)| f == family) {
            Some((_, list)) => list.push(seat.clone()),
            None => by_family.push((family.clone(), vec![seat.clone()])),
        }
    }
    let mut shared: Vec<(String, Vec<String>)> =
        by_family.into_iter().filter(|(_, s)| s.len() > 1).collect();
    for (_, list) in &mut shared {
        list.sort();
    }
    shared.sort_by(|a, b| a.0.cmp(&b.0));
    settlement_times.sort_by_key(|t| parse_timestamp_ms(t));
    let settlement = valid_completion(get(record, "settlement"));
    let legacy = valid_completion(input.legacy_completion);
    let derived: Option<String> = match &loop_name {
        None => Some(UNDETERMINED_OUTCOME.to_string()),
        Some(loop_name) => {
            let history: Vec<Value> = input
                .raw_seats
                .iter()
                .filter(|s| get(s, "final").is_some())
                .map(|s| json!({ "seat": s.get("seat"), "round": s.get("round"), "outcome": s["final"].get("outcome") }))
                .collect();
            pattern_history_outcome(
                loop_name,
                &params,
                record.get("unit").unwrap_or(&Value::Null),
                &cfg,
                &record_seats,
                &history,
            )
            .map_err(|e| SummaryError(e.message))?
        }
    };
    let outcome: String = if input.active {
        "unknown".into()
    } else {
        settlement
            .and_then(|s| str_at(s, "outcome"))
            .or_else(|| legacy.and_then(|l| str_at(l, "outcome")))
            .map(str::to_string)
            .or(derived)
            .unwrap_or_else(|| "unknown".into())
    };
    let mut out = Map::new();
    out.insert("contract".into(), unit_summary_contract());
    out.insert("unitRunId".into(), json!(input.unit_run_id));
    let workflow = workflow_link_of(get(record, "workflow"))
        .or_else(|| workflow_link_of(input.legacy_completion.and_then(|c| get(c, "workflow"))));
    out.insert("workflow".into(), workflow.unwrap_or(Value::Null));
    if let Some(plan) = plan_ref_of(get(record, "unit").and_then(|u| get(u, "plan"))) {
        out.insert("plan".into(), plan);
    }
    let pattern_text = match pattern {
        None => Value::Null,
        Some(Value::String(s)) => json!(s),
        Some(p) => decoded
            .as_ref()
            .and_then(|d| get(d, "selector"))
            .or_else(|| get(p, "pattern"))
            .cloned()
            .unwrap_or(Value::Null),
    };
    out.insert("pattern".into(), pattern_text);
    out.insert(
        "capability".into(),
        get(record, "unit")
            .and_then(|u| get(u, "capability"))
            .cloned()
            .unwrap_or(Value::Null),
    );
    out.insert("outcome".into(), json!(outcome));
    out.insert(
        "infrastructure".into(),
        bool_text(settlement.and_then(|s| s.get("infrastructure"))),
    );
    out.insert(
        "infrastructureReason".into(),
        settlement
            .and_then(|s| s.get("infrastructureReason"))
            .filter(|v| v.is_string())
            .cloned()
            .unwrap_or(Value::Null),
    );
    out.insert(
        "refused".into(),
        settlement
            .and_then(|s| s.get("refused"))
            .filter(|v| v.is_array())
            .cloned()
            .unwrap_or_else(|| json!([])),
    );
    if let Some(verify) = settlement
        .and_then(|s| s.get("verify"))
        .filter(|v| v.is_object() && v.get("ran").is_some_and(Value::is_boolean))
    {
        out.insert("verify".into(), verify.clone());
    }
    out.insert(
        "startedAt".into(),
        timestamp(record.get("createdAt")).map_or(Value::Null, |t| json!(t)),
    );
    let settled_at = if outcome == "unknown" {
        None
    } else {
        timestamp(settlement.and_then(|s| s.get("settledAt")))
            .or_else(|| timestamp(legacy.and_then(|l| l.get("settledAt"))))
            .or_else(|| settlement_times.last().map(String::as_str))
    };
    out.insert(
        "settledAt".into(),
        settled_at.map_or(Value::Null, |t| json!(t)),
    );
    out.insert("stanceOptions".into(), Value::Array(options));
    out.insert("seats".into(), Value::Array(seats));
    if !shared.is_empty() {
        out.insert(
            "sharedFamilies".into(),
            Value::Array(
                shared
                    .iter()
                    .map(|(f, s)| json!({ "family": f, "seats": s }))
                    .collect(),
            ),
        );
    }
    if let (Some(evidence), None) = (
        legacy
            .and_then(|l| get(l, "evidence"))
            .filter(|e| truthy(e)),
        settlement,
    ) {
        out.insert("derivation".into(), evidence.clone());
    }
    if let Some(pin) = pin {
        let effective = pin.get("effective").unwrap_or(&Value::Null);
        out.insert(
            "collaboration".into(),
            json!({
                "loop": effective.get("loop"),
                "params": get(effective, "params").cloned().unwrap_or_else(|| json!({})),
                "provenance": get(pin, "provenance").cloned().unwrap_or_else(|| json!({ "params": {}, "checkers": {} })),
            }),
        );
    }
    Ok(Value::Object(out))
}

/// The summary as it is stored: two-space JSON and a final newline.
pub fn serialize_unit_summary(summary: &Value) -> String {
    format!(
        "{}\n",
        serde_json::to_string_pretty(summary).unwrap_or_default()
    )
}

/// Why no summary can be published now: `active` while any attempt is still open, `unsettled` when the unit is
/// finished but has no establishable outcome or settlement time; `None` when it can be published.
pub fn unit_summary_skip_reason(
    summary: &Value,
    active: impl FnOnce() -> bool,
) -> Option<&'static str> {
    if str_at(summary, "outcome") != Some("unknown") && get(summary, "settledAt").is_some() {
        return None;
    }
    Some(if active() { "active" } else { "unsettled" })
}

// ---- who drives a unit run ---------------------------------------------------------------------------

/// The directory whose `control/` ledger records the unit's controller.
pub fn unit_control_dir(unit_dir: &Path) -> PathBuf {
    unit_dir.join("unit-control")
}

/// The last attempt recorded for each seat/round of a unit record.
pub fn last_attempts(unit_record: &Value) -> Vec<&Value> {
    get(unit_record, "bindings")
        .and_then(Value::as_object)
        .into_iter()
        .flat_map(|b| b.values())
        .filter_map(|attempts| items(Some(attempts)).last())
        .filter(|a| !a.is_null())
        .collect()
}

/// The unit run an assignment id belongs to: its id starts with the unit run id (`<unitRunId>/<seat>/<round>`).
pub fn unit_run_id_of_assignment(assignment_id: &str) -> &str {
    assignment_id.split('/').next().unwrap_or_default()
}

/// Whether a unit record names the assignment among its last attempts (the check that the unit owns it).
pub fn record_owns_assignment(unit_record: &Value, assignment_id: &str) -> bool {
    last_attempts(unit_record)
        .iter()
        .any(|a| str_at(a, "assignmentId") == Some(assignment_id))
}

/// The name of the attempt directory an admission generation committed: its `attemptStr`, else the attempt
/// number padded to two digits.
pub fn attempt_dir_name(generation: &Value) -> Option<String> {
    if let Some(s) = get(generation, "attemptStr").and_then(Value::as_str) {
        return Some(s.to_string());
    }
    let attempt = get(generation, "attempt")?;
    let text = attempt
        .as_str()
        .map_or_else(|| attempt.to_string(), str::to_string);
    Some(format!("{text:0>2}"))
}

/// What the admission ledger and the adopt probe say about one attempt of a unit run.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AttemptState {
    /// Nothing admitted, or the attempt directory was never made.
    NotAdmitted,
    /// A run from before the supervisor that the legacy sweep settled.
    AbandonedLegacy,
    /// The adopt probe says the attempt is not closed.
    Open,
    Closed,
}

/// A stored summary whose outcome is not yet known (a run still in flight) is not a verdict.
const UNSETTLED_SUMMARY_OUTCOMES: [&str; 2] = ["unknown", "undetermined"];

/// What a unit run is doing when nobody may be driving it, derived from facts, never stored: `completed` or
/// `failed` from a settled summary; `running` while a controller is alive (or not provably dead) or an attempt
/// is open; else `awaiting-resume` with the command that resumes it. `attempt_state` is asked for each
/// attempt's assignment id in record order, until one is open.
pub fn derive_unit_state(
    unit_run_id: &str,
    summary: Option<&Value>,
    controller_held: impl FnOnce() -> bool,
    record: Option<&Value>,
    mut attempt_state: impl FnMut(&str) -> AttemptState,
) -> Value {
    if let Some(summary) = summary.filter(|s| !s.is_null()) {
        let settled = summary
            .get("outcome")
            .and_then(Value::as_str)
            .is_none_or(|o| !UNSETTLED_SUMMARY_OUTCOMES.contains(&o));
        if settled {
            let state = if str_at(summary, "outcome") == Some("pass") {
                "completed"
            } else {
                "failed"
            };
            return json!({ "unitRunId": unit_run_id, "unitState": state });
        }
    }
    // Held, or not provably dead, counts as a live controller: the unit keeps `running`.
    if controller_held() {
        return json!({ "unitRunId": unit_run_id, "unitState": "running" });
    }
    for attempt in record.map(last_attempts).unwrap_or_default() {
        let Some(id) = str_at(attempt, "assignmentId") else {
            continue;
        };
        if attempt_state(id) == AttemptState::Open {
            return json!({ "unitRunId": unit_run_id, "unitState": "running" });
        }
    }
    json!({
        "unitRunId": unit_run_id,
        "unitState": "awaiting-resume",
        "resumeCommand": format!("fgos run --resume {unit_run_id}"),
    })
}
