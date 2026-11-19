//! Recovery planner: a pure judgment over a snapshot the caller already read. No file, process or clock is
//! touched here; the caller gathers the snapshot and passes the instant in.
//!
//! The digests hash the canonical JSON form (`fgos-canonical-json`). Node hashed a local key-sorted
//! serialisation; for the values a snapshot holds (strings, integers, booleans, lists, objects) both forms are
//! the same bytes, which the recorded hashes pin.

use fgos_canonical_json::canonical_json;
use fgos_host_runtime::civil_time::{format_unix_millis_rfc3339, parse_rfc3339_millis};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};

/// How long a fresh recommendation stays applicable.
pub const DEFAULT_TTL_MS: i64 = 5 * 60 * 1000;

const RECOGNIZED_EVIDENCE_TYPES: [&str; 2] = ["worker-result", "attempt-receipt"];
const RECOGNIZED_INTENTS: [&str; 2] = ["resume", "reassign"];
const ADOPTABLE_ATTEMPT_STATES: [&str; 2] = ["needs-adopt", "open"];
const LIVE_ATTEMPT_STATES: [&str; 2] = ["running", "being-adopted"];

/// Node's `RecoveryPlannerError`: a caller misuse, with a stable code.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RecoveryPlannerError {
    pub name: &'static str,
    pub code: Option<&'static str>,
    pub message: String,
}

impl RecoveryPlannerError {
    fn invalid_intent(intent: &str) -> Self {
        RecoveryPlannerError {
            name: "RecoveryPlannerError",
            code: Some("invalid-intent"),
            message: format!(
                "requestedIntent must be one of {}, got: {}",
                RECOGNIZED_INTENTS.join("/"),
                serde_json::to_string(intent).unwrap_or_default()
            ),
        }
    }

    /// `{ name, code, message }`, as the vectors state a thrown error.
    pub fn to_json(&self) -> Value {
        json!({ "name": self.name, "code": self.code, "message": self.message })
    }
}

impl std::fmt::Display for RecoveryPlannerError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for RecoveryPlannerError {}

/// What a recovery question is answered with: go ahead, ask for input, or park.
#[derive(Debug, Clone, PartialEq)]
pub enum Verdict {
    Ok { reason: String },
    NeedsInput { reason: String },
    Park { reason: String },
}

impl Verdict {
    fn park(reason: impl Into<String>) -> Self {
        Verdict::Park {
            reason: reason.into(),
        }
    }
}

/// The recovery facts of a snapshot: the verdict, and the action when it is `Ok`.
#[derive(Debug, Clone, PartialEq)]
pub struct Facts {
    pub verdict: Verdict,
    pub action: Option<Value>,
}

impl Facts {
    pub fn to_json(&self) -> Value {
        match &self.verdict {
            Verdict::Ok { reason } => {
                json!({ "status": "ok", "action": self.action, "reason": reason })
            }
            Verdict::NeedsInput { reason } => json!({ "status": "needs-input", "reason": reason }),
            Verdict::Park { reason } => json!({ "status": "park", "reason": reason }),
        }
    }
}

impl Verdict {
    /// `{ status, reason }`, as `isActionLegal` states it.
    pub fn to_json(&self) -> Value {
        match self {
            Verdict::Ok { reason } => json!({ "status": "ok", "reason": reason }),
            Verdict::NeedsInput { reason } => json!({ "status": "needs-input", "reason": reason }),
            Verdict::Park { reason } => json!({ "status": "park", "reason": reason }),
        }
    }
}

fn sha256_hex(text: &str) -> String {
    let digest = Sha256::digest(text.as_bytes());
    digest.iter().map(|byte| format!("{byte:02x}")).collect()
}

/// Deterministic digest over the caller-supplied snapshot: the same facts give the same hash whatever their
/// property insertion order.
pub fn compute_snapshot_hash(snapshot: &Value) -> String {
    sha256_hex(&canonical_json(snapshot).expect("a snapshot holds finite numbers"))
}

fn attempt_state(snapshot: &Value) -> Option<&str> {
    snapshot.pointer("/attempt/state").and_then(Value::as_str)
}

fn is_adoptable(snapshot: &Value) -> bool {
    attempt_state(snapshot).is_some_and(|state| ADOPTABLE_ATTEMPT_STATES.contains(&state))
}

fn js_text(value: Option<&Value>) -> String {
    crate::assignment::js_str(value)
}

/// What every caller must agree on before branching on intent or action: unrecognized evidence parks, and a
/// closed, live or settled run has nothing left to recover.
fn check_preconditions(snapshot: &Value, evidence: &[Value]) -> Option<Verdict> {
    let unknown: Vec<String> = evidence
        .iter()
        .filter(|e| {
            !e.get("type")
                .and_then(Value::as_str)
                .is_some_and(|t| RECOGNIZED_EVIDENCE_TYPES.contains(&t))
        })
        .map(|e| format!("{}:{}", js_text(e.get("id")), js_text(e.get("type"))))
        .collect();
    if !unknown.is_empty() {
        return Some(Verdict::park(format!(
            "unrecognized evidence type(s): {} -- never guessing an action over evidence this door cannot interpret",
            unknown.join(", ")
        )));
    }
    let state = attempt_state(snapshot);
    if state == Some("closed") {
        return Some(Verdict::park(
            "the attempt is already closed -- there is nothing to recover",
        ));
    }
    if let Some(live) = state.filter(|s| LIVE_ATTEMPT_STATES.contains(s)) {
        return Some(Verdict::park(format!(
            "attempt is {live}: a supervisor or an adopter owns it -- nothing to recover while it runs"
        )));
    }
    let settled = snapshot.pointer("/run/status").and_then(Value::as_str) == Some("settled")
        || snapshot
            .pointer("/settledSignal/outcome")
            .and_then(Value::as_str)
            == Some("settled");
    if !is_adoptable(snapshot) && settled {
        return Some(Verdict::park(
            "run already settled -- there is nothing to recover",
        ));
    }
    None
}

/// The legal next action and who may take it, in one step.
pub fn derive_recovery_facts(
    snapshot: &Value,
    evidence: &[Value],
    requested_intent: &str,
) -> Result<Facts, RecoveryPlannerError> {
    if !RECOGNIZED_INTENTS.contains(&requested_intent) {
        return Err(RecoveryPlannerError::invalid_intent(requested_intent));
    }
    let parked = |reason: String| Facts {
        verdict: Verdict::Park { reason },
        action: None,
    };
    if let Some(blocked) = check_preconditions(snapshot, evidence) {
        return Ok(Facts {
            verdict: blocked,
            action: None,
        });
    }
    if requested_intent == "reassign" {
        return Ok(parked(
            "reassign has no action: a dead controller's attempt is finished through adopt (intent resume)".into(),
        ));
    }
    let state = attempt_state(snapshot);
    if !is_adoptable(snapshot) {
        return Ok(parked(format!(
            "the attempt is {}: only an attempt with no holder that is not closed can be adopted",
            state.unwrap_or("unprobed")
        )));
    }
    let Some(attempt_id) = snapshot
        .pointer("/attempt/attemptId")
        .and_then(Value::as_str)
    else {
        return Ok(parked(
            "the attempt has no readable attemptId in its envelope -- never guessing what to adopt"
                .into(),
        ));
    };
    Ok(Facts {
        verdict: Verdict::Ok {
            reason: format!(
                "attempt {attempt_id} is {} (no holder, not closed) -- adopt settles it and closes it",
                state.unwrap_or_default()
            ),
        },
        action: Some(json!({ "type": "adopt", "attemptId": attempt_id })),
    })
}

/// Whether an action decided at an earlier plan is still legal against a fresh snapshot. Intent-free: the write
/// path re-derives legality from the action's own shape, through the same gate the read path uses.
pub fn is_action_legal(snapshot: &Value, evidence: &[Value], action: &Value) -> Verdict {
    if let Some(blocked) = check_preconditions(snapshot, evidence) {
        return blocked;
    }
    let Some(kind) = action.get("type").and_then(Value::as_str) else {
        return Verdict::park("action is missing or malformed -- never guessing what was meant");
    };
    if kind != "adopt" {
        return Verdict::park(format!("unrecognized action type \"{kind}\""));
    }
    let state = attempt_state(snapshot);
    let current = snapshot.pointer("/attempt/attemptId");
    if action.get("attemptId") != current {
        return Verdict::park(
            "adopt names a different attempt than the one this run directory now holds",
        );
    }
    if is_adoptable(snapshot) {
        return Verdict::Ok {
            reason: format!(
                "adopt remains legal: attempt is {}",
                state.unwrap_or_default()
            ),
        };
    }
    Verdict::park(format!(
        "adopt no longer legal: attempt is {}",
        state.unwrap_or("unprobed")
    ))
}

/// Binds an action key to the exact recommendation it was issued for: (snapshotHash, controlEpoch, action,
/// expiresAt). A staleness binding, not a secrecy boundary.
pub fn compute_action_key(
    snapshot_hash: &str,
    control_epoch: &Value,
    action: &Value,
    expires_at: &str,
) -> String {
    let bound = json!({
        "snapshotHash": snapshot_hash,
        "controlEpoch": control_epoch,
        "action": action,
        "expiresAt": expires_at,
    });
    sha256_hex(&canonical_json(&bound).expect("an action key holds finite numbers"))
}

fn epoch_of(snapshot: &Value) -> Value {
    snapshot
        .get("controlEpoch")
        .filter(|v| !v.is_null())
        .cloned()
        .unwrap_or_else(|| json!(0))
}

/// `plan(snapshot, evidence, requestedIntent)`: pure and deterministic; only `expiresAt` (and what derives from
/// it) depends on `now`, an RFC 3339 instant.
pub fn plan(
    snapshot: &Value,
    evidence: &[Value],
    requested_intent: &str,
    now: &str,
    ttl_ms: i64,
) -> Result<Value, RecoveryPlannerError> {
    let facts = derive_recovery_facts(snapshot, evidence, requested_intent)?;
    let evidence_ids: Vec<Value> = evidence
        .iter()
        .map(|e| e.get("id").cloned().unwrap_or(Value::Null))
        .collect();
    let (kind, reason) = match &facts.verdict {
        Verdict::Park { reason } => ("park", reason),
        Verdict::NeedsInput { reason } => ("needs-input", reason),
        Verdict::Ok { reason } => {
            let action = facts.action.clone().unwrap_or(Value::Null);
            let expires_at = parse_rfc3339_millis(now)
                .and_then(|ms| ms.checked_add(ttl_ms))
                .and_then(|ms| format_unix_millis_rfc3339(ms, 0))
                .ok_or_else(|| RecoveryPlannerError {
                    name: "RangeError",
                    code: None,
                    message: "Invalid time value".into(),
                })?;
            let snapshot_hash = compute_snapshot_hash(snapshot);
            let epoch = epoch_of(snapshot);
            let action_key = compute_action_key(&snapshot_hash, &epoch, &action, &expires_at);
            return Ok(json!({
                "kind": "recommendation",
                "snapshotHash": snapshot_hash,
                "expectedControlEpoch": epoch,
                "actionKey": action_key,
                "evidenceIds": evidence_ids,
                "action": action,
                "expiresAt": expires_at,
                "reason": reason,
            }));
        }
    };
    Ok(json!({ "kind": kind, "reason": reason, "evidenceIds": evidence_ids }))
}

/// The five expectations a caller applies a recommendation under.
pub struct ApplyRequest<'a> {
    pub snapshot: &'a Value,
    pub evidence: &'a [Value],
    pub action: &'a Value,
    pub expected_snapshot: &'a str,
    pub expected_control_epoch: &'a Value,
    pub expected_expires_at: &'a str,
    pub action_key: &'a str,
    /// Epoch milliseconds, or an RFC 3339 instant.
    pub now: &'a Value,
}

fn instant_millis(now: &Value) -> Option<f64> {
    match now {
        Value::Number(n) => n.as_f64().filter(|f| f.is_finite()),
        Value::String(text) => parse_rfc3339_millis(text).map(|ms| ms as f64),
        _ => None,
    }
}

/// The write door's own re-check, pure: whether an apply may proceed against a freshly re-read snapshot.
/// `{ outcome: 'ok' }` or `{ outcome, reason }` for plan-stale, plan-expired, needs-input and park.
pub fn check_apply(request: &ApplyRequest<'_>) -> Value {
    let refuse = |outcome: &str, reason: String| json!({ "outcome": outcome, "reason": reason });
    let expected_key = compute_action_key(
        request.expected_snapshot,
        request.expected_control_epoch,
        request.action,
        request.expected_expires_at,
    );
    if request.action_key != expected_key {
        return refuse(
            "plan-stale",
            "actionKey does not match the action/snapshot/epoch/expiresAt it was issued for -- refusing a mismatched replay".into(),
        );
    }
    if compute_snapshot_hash(request.snapshot) != request.expected_snapshot {
        return refuse(
            "plan-stale",
            "the run's observed state (visibility/outbox) has changed since this recommendation was issued -- snapshot hash mismatch".into(),
        );
    }
    let current_epoch = epoch_of(request.snapshot);
    if &current_epoch != request.expected_control_epoch {
        return refuse(
            "plan-stale",
            format!(
                "the run's control epoch has advanced since this recommendation was issued (expected {}, now {})",
                js_text(Some(request.expected_control_epoch)),
                js_text(Some(&current_epoch))
            ),
        );
    }
    let expires = parse_rfc3339_millis(request.expected_expires_at).map(|ms| ms as f64);
    match (instant_millis(request.now), expires) {
        (Some(now), Some(expires)) if now <= expires => {}
        _ => {
            return refuse(
                "plan-expired",
                format!(
                    "this recommendation expired at {}",
                    request.expected_expires_at
                ),
            )
        }
    }
    match is_action_legal(request.snapshot, request.evidence, request.action) {
        Verdict::Park { reason } => refuse("park", reason),
        Verdict::NeedsInput { reason } => refuse("needs-input", reason),
        Verdict::Ok { .. } => json!({ "outcome": "ok" }),
    }
}

/// Evidence derived from an already-read snapshot: the attempt's own files, and the outbox entries by name. A
/// name no rule recognizes is `unknown`, which parks a recommendation instead of guessing.
pub fn collect_evidence(snapshot: &Value) -> Vec<Value> {
    let mut evidence: Vec<Value> = Vec::new();
    let listed = |key: &str| {
        snapshot
            .get(key)
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default()
    };
    for name in listed("attemptFiles") {
        evidence.push(json!({ "id": name, "type": "attempt-receipt" }));
    }
    for entry in listed("outbox") {
        let name = entry.get("name");
        let text = name.and_then(Value::as_str).unwrap_or_default();
        let worker_result = ["ack-", "report-", "result-"]
            .iter()
            .any(|prefix| text.starts_with(prefix))
            || text == "result.json";
        let kind = if worker_result {
            "worker-result"
        } else {
            "unknown"
        };
        evidence.push(json!({ "id": name, "type": kind }));
    }
    evidence
}
