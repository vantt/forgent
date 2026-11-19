//! The inline execution contract an agent proposes: its field set, its caller, the engine-reserved
//! protocol-operation stamp and the check that a mutating dispatch runs in a linked worktree.
//!
//! Pure data rules; the one fact they read from the machine (which checkout a directory is in) arrives through
//! [`CheckoutFacts`]. Two checks are named on purpose and not folded into the generic unknown-field gate, because
//! they are the safety-critical ones: `mutation: "mutating"` is accepted only when the contract carries the
//! protocol-operation stamp (proof it was built by the mediated dispatch door, not forged by a caller), and a
//! session or coordination field name is refused by name.
//!
//! Golden vectors: `packages/execution/contracts/execution-contract/contract.json`.

use fgos_seat_binding::tier::Tier;
use serde_json::{json, Map, Value};

use crate::assignment::builder::ContractPort;
pub use crate::assignment::builder::CONTRACT_POLICY_VERSION;
use crate::assignment::{js_space, Refusal};

pub const REPEAT_MODE_VALUES: [&str; 2] = ["pre-delivery", "post-delivery"];
pub const POLICY_PATCH_FIELDS: [&str; 6] = [
    "rigor",
    "tier",
    "visibility",
    "repeatMode",
    "capability",
    "distinctProviderFrom",
];
/// The reserved `contract.constraints` namespace marking an inline contract as engine-derived operation
/// provenance.
pub const PROTOCOL_OPERATION_STAMP_PREFIX: &str = "protocol-operation:";
/// Longest writer id the caller may name.
pub const MAX_WRITER_ID_LENGTH: usize = 200;

const RETIRED_SAVED_TIER_FIELD: &str = "minTier";
const ACCEPTED_CONTRACT_FIELDS: [&str; 12] = [
    "objective",
    "contextRefs",
    "constraints",
    "expectedOutputs",
    "mutation",
    "evidence",
    "role",
    "capabilities",
    "budget",
    "supports",
    "contractTemplate",
    "policy",
];
const ACCEPTED_CALLER_FIELDS: [&str; 3] = ["writerId", "parentAssignmentId", "coordination"];
const ACCEPTED_COORDINATION_CALLER_FIELDS: [&str; 2] = ["fanOutPayload", "actionInvocation"];
const ACTION_INVOCATION_KINDS: [&str; 6] = [
    "dispatch-operation",
    "authorize-and-dispatch",
    "record-disposition",
    "record-human-turn",
    "link-contribution",
    "fan-out",
];
const NORMALIZED_STEP_FIELDS: [&str; 39] = [
    "type",
    "as",
    "operationId",
    "targetActorId",
    "nodeId",
    "objective",
    "expectedOutputs",
    "contextRefs",
    "constraints",
    "capabilities",
    "fromAssignmentId",
    "intent",
    "round",
    "taskKey",
    "mutation",
    "authorizationId",
    "invocationKey",
    "reason",
    "grantedContextRefs",
    "targetArtifactRef",
    "targetRef",
    "disposition",
    "rationale",
    "evidenceRefs",
    "turnId",
    "turnOrdinal",
    "channel",
    "artifactRef",
    "externalRef",
    "attributedTo",
    "respondsToRefs",
    "contributionId",
    "contributionType",
    "assignmentId",
    "roundKey",
    "anchors",
    "respondsTo",
    "branches",
    "omittedFields",
];
const ACCEPTED_BUDGET_FIELDS: [&str; 3] = ["timeoutMs", "maxRuns", "tokens"];
const ACCEPTED_EVIDENCE_FIELDS: [&str; 1] = ["required"];
const ACCEPTED_POLICY_FIELDS: [&str; 1] = ["tier"];
/// ADR-006 section 6: no session or coordination reference on a contract or its caller.
const FORBIDDEN_SESSION_FIELDS: [&str; 4] =
    ["coordinationId", "sessionId", "threadId", "coordinationRef"];

/// The tier names a policy may carry, weakest first.
pub fn model_policy_tiers() -> Vec<&'static str> {
    Tier::ALL.iter().map(|tier| tier.name()).collect()
}

/// `/^[A-Za-z0-9._-]+$/`: the writer id charset (a format floor, not an identity check).
pub fn is_writer_id(id: &str) -> bool {
    !id.is_empty()
        && id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'.' | b'_' | b'-'))
}

fn fail(reason: impl AsRef<str>) -> Refusal {
    Refusal::new(format!("execution-contract: {}", reason.as_ref()))
}

fn is_non_empty_string(value: Option<&Value>) -> bool {
    value
        .and_then(Value::as_str)
        .is_some_and(|s| !s.trim_matches(js_space).is_empty())
}

fn is_string_array(value: Option<&Value>) -> bool {
    value
        .and_then(Value::as_array)
        .is_some_and(|items| items.iter().all(Value::is_string))
}

/// `Number.isInteger`.
fn is_integer(value: Option<&Value>) -> bool {
    matches!(value, Some(Value::Number(n)) if n.as_f64().is_some_and(|f| f.is_finite() && f.fract() == 0.0))
}

fn number(value: Option<&Value>) -> Option<f64> {
    match value {
        Some(Value::Number(n)) => n.as_f64(),
        _ => None,
    }
}

fn assert_no_forbidden_fields(object: &Map<String, Value>, label: &str) -> Result<(), Refusal> {
    for key in object.keys() {
        if FORBIDDEN_SESSION_FIELDS.contains(&key.as_str()) {
            return Err(fail(format!(
                "{label} carries a forbidden session/coordination field \"{key}\" -- no session reference in this slice (ADR-006 \u{a7}6)"
            )));
        }
    }
    Ok(())
}

fn assert_only_accepted_fields(
    object: &Map<String, Value>,
    accepted: &[&str],
    label: &str,
) -> Result<(), Refusal> {
    for key in object.keys() {
        if !accepted.contains(&key.as_str()) {
            return Err(fail(format!("{label} has unknown field \"{key}\"")));
        }
    }
    Ok(())
}

/// Whether `constraints` carries at least one entry in the reserved protocol-operation namespace.
pub fn carries_protocol_operation_stamp(constraints: Option<&Value>) -> bool {
    constraints.and_then(Value::as_array).is_some_and(|items| {
        items.iter().any(|entry| {
            entry
                .as_str()
                .is_some_and(|s| s.starts_with(PROTOCOL_OPERATION_STAMP_PREFIX))
        })
    })
}

/// `protocol-operation:<definitionId>@<definitionVersion>#<operationId>`, parsed.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProtocolOperationStamp {
    pub definition_id: String,
    pub definition_version: String,
    pub operation_id: String,
}

impl ProtocolOperationStamp {
    pub fn to_json(&self) -> Value {
        json!({
            "definitionId": self.definition_id,
            "definitionVersion": self.definition_version,
            "operationId": self.operation_id,
        })
    }
}

fn is_line_terminator(c: char) -> bool {
    matches!(c, '\n' | '\r' | '\u{2028}' | '\u{2029}')
}

/// The single stamped entry of `constraints`, parsed. `None` (never an error) when there is no such entry, more
/// than one, or the one present does not match the shape: a missing, ambiguous or malformed stamp is exactly as
/// unauthorised as no stamp.
pub fn extract_protocol_operation_stamp(
    constraints: Option<&Value>,
) -> Option<ProtocolOperationStamp> {
    let items = constraints?.as_array()?;
    let mut stamped = items
        .iter()
        .filter_map(Value::as_str)
        .filter(|s| s.starts_with(PROTOCOL_OPERATION_STAMP_PREFIX));
    let only = stamped.next()?;
    if stamped.next().is_some() {
        return None;
    }
    let rest = &only[PROTOCOL_OPERATION_STAMP_PREFIX.len()..];
    // ^([^@]+)@([^#]+)#(.+)$ : the first `@` ends the id, the first `#` after it ends the version.
    let (definition_id, after_at) = rest.split_once('@')?;
    let (definition_version, operation_id) = after_at.split_once('#')?;
    if definition_id.is_empty()
        || definition_version.is_empty()
        || operation_id.is_empty()
        || operation_id.chars().any(is_line_terminator)
    {
        return None;
    }
    Some(ProtocolOperationStamp {
        definition_id: definition_id.to_string(),
        definition_version: definition_version.to_string(),
        operation_id: operation_id.to_string(),
    })
}

/// The checkout facts a directory has: `fgos-execution`'s port, the one `decide` reads through its `Workspace`.
pub use fgos_execution::decide::CheckoutFacts;

/// Whether a directory is safe for a mutating dispatch.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MutatingCwdPosture {
    /// A linked worktree: the main checkout and the worktree root.
    Ok {
        main_checkout_root: String,
        repo_root: String,
    },
    OutsideGit,
    /// The repository root could not be established.
    Unresolvable {
        error: String,
    },
    /// The directory is in the main checkout itself.
    MainCheckout {
        repo_root: String,
    },
}

impl MutatingCwdPosture {
    pub fn to_json(&self) -> Value {
        match self {
            Self::Ok {
                main_checkout_root,
                repo_root,
            } => {
                json!({ "ok": true, "mainCheckoutRoot": main_checkout_root, "repoRoot": repo_root })
            }
            Self::OutsideGit => json!({ "ok": false, "reason": "outside-git" }),
            Self::Unresolvable { error } => {
                json!({ "ok": false, "reason": "unresolvable", "error": { "message": error } })
            }
            Self::MainCheckout { repo_root } => {
                json!({ "ok": false, "reason": "main-checkout", "repoRoot": repo_root })
            }
        }
    }
}

/// A mutating dispatch must run in a LINKED worktree, never the main checkout, and never fail open on a root it
/// cannot resolve. The toplevel of `cwd` is compared with the main checkout, so a subdirectory of either is judged
/// as its checkout is.
pub fn resolve_mutating_cwd_posture(facts: &dyn CheckoutFacts, cwd: &str) -> MutatingCwdPosture {
    let Some(main_checkout_root) = facts.main_checkout_root(cwd) else {
        return MutatingCwdPosture::OutsideGit;
    };
    let repo_root = match facts.repo_root(cwd) {
        Ok(root) => root,
        Err(error) => return MutatingCwdPosture::Unresolvable { error },
    };
    if main_checkout_root == repo_root {
        return MutatingCwdPosture::MainCheckout { repo_root };
    }
    MutatingCwdPosture::Ok {
        main_checkout_root,
        repo_root,
    }
}

/// Normalises the one retired persisted policy key (`minTier`) at the load boundary; current producers and the
/// generic validation never accept or write it.
pub fn normalize_saved_policy_tier(
    policy: &Value,
    allow_additional_fields: bool,
) -> Result<Value, Refusal> {
    let Some(object) = policy
        .as_object()
        .filter(|o| o.contains_key(RETIRED_SAVED_TIER_FIELD))
    else {
        return Ok(policy.clone());
    };
    if object.contains_key("tier") {
        return Err(fail(format!(
            "saved policy cannot declare both \"{RETIRED_SAVED_TIER_FIELD}\" and \"tier\""
        )));
    }
    let tier = &object[RETIRED_SAVED_TIER_FIELD];
    let names = model_policy_tiers();
    if !tier.as_str().is_some_and(|t| names.contains(&t)) {
        return Err(fail(format!(
            "saved policy.{RETIRED_SAVED_TIER_FIELD} must be one of {}",
            names.join(", ")
        )));
    }
    let mut remaining = Map::new();
    for (key, value) in object {
        if key != RETIRED_SAVED_TIER_FIELD {
            remaining.insert(key.clone(), value.clone());
        }
    }
    if !allow_additional_fields && !remaining.is_empty() {
        return Err(fail(format!(
            "saved contract.policy may contain only \"{RETIRED_SAVED_TIER_FIELD}\""
        )));
    }
    remaining.insert("tier".into(), tier.clone());
    Ok(Value::Object(remaining))
}

fn string_array_field(
    object: &Map<String, Value>,
    key: &str,
    label: &str,
    non_empty: bool,
) -> Result<(), Refusal> {
    let value = object.get(key);
    let empty = non_empty
        && value
            .and_then(Value::as_array)
            .is_some_and(|items| items.is_empty());
    if !is_string_array(value) || empty {
        return Err(fail(format!(
            "{label}.{key} must be {} array of strings",
            if non_empty { "a non-empty" } else { "an" }
        )));
    }
    Ok(())
}

/// Validates an inline execution contract and its caller provenance against the minimum field set; the first
/// violation is the refusal. A contract or caller that is not an object is refused the same way whether absent
/// or `null`.
pub fn validate_execution_contract(contract: &Value, caller: &Value) -> Result<(), Refusal> {
    let Some(object) = contract.as_object() else {
        return Err(fail("contract must be a non-null object"));
    };

    assert_no_forbidden_fields(object, "contract")?;
    assert_only_accepted_fields(object, &ACCEPTED_CONTRACT_FIELDS, "contract")?;

    if !is_non_empty_string(object.get("objective")) {
        return Err(fail("contract.objective must be a non-empty string"));
    }
    if !is_string_array(object.get("contextRefs")) {
        return Err(fail(
            "contract.contextRefs must be an array of strings (bounded context references)",
        ));
    }
    if !is_string_array(object.get("constraints")) {
        return Err(fail(
            "contract.constraints must be an array of strings (constraints/authority)",
        ));
    }
    let outputs = object.get("expectedOutputs");
    if !is_string_array(outputs) || outputs.and_then(Value::as_array).is_some_and(Vec::is_empty) {
        return Err(fail(
            "contract.expectedOutputs must be a non-empty array of strings",
        ));
    }

    // The single most safety-critical check: read-only unless the engine's own stamp rides in the constraints.
    match object.get("mutation").and_then(Value::as_str) {
        Some("mutating") => {
            if !carries_protocol_operation_stamp(object.get("constraints")) {
                return Err(fail(
                    "contract.mutation \"mutating\" is rejected -- only an inline contract carrying the engine-reserved protocol-operation stamp in its constraints (session-engine.mjs's own mediated dispatchDeclaredOperation door) may declare \"mutating\"; every other caller stays read-only-only (ADR-006 \u{a7}6)",
                ));
            }
        }
        Some("read-only") => {}
        _ => {
            return Err(fail(
                "contract.mutation must be \"read-only\" or \"mutating\" (missing, or any other value, is rejected)",
            ))
        }
    }

    let Some(evidence) = object.get("evidence").and_then(Value::as_object) else {
        return Err(fail(
            "contract.evidence must be an object with a \"required\" field",
        ));
    };
    assert_only_accepted_fields(evidence, &ACCEPTED_EVIDENCE_FIELDS, "contract.evidence")?;
    if !matches!(
        evidence.get("required").and_then(Value::as_str),
        Some("reported" | "verified")
    ) {
        return Err(fail(
            "contract.evidence.required must be \"reported\" or \"verified\"",
        ));
    }

    if !is_non_empty_string(object.get("role")) {
        return Err(fail("contract.role must be a non-empty string (role hint)"));
    }
    if object.get("supports").is_some() && !is_non_empty_string(object.get("supports")) {
        return Err(fail(
            "contract.supports must be a non-empty string when provided (an operation id it claims to support -- legality against the Work's declared Stage is checked by the domain harness seam, ADR-007 \u{a7}3, not here)",
        ));
    }
    if object.get("contractTemplate").is_some()
        && !is_non_empty_string(object.get("contractTemplate"))
    {
        return Err(fail(
            "contract.contractTemplate must be a non-empty string when provided",
        ));
    }
    if object.get("capabilities").is_some() && !is_string_array(object.get("capabilities")) {
        return Err(fail(
            "contract.capabilities must be an array of strings when provided (capability hints)",
        ));
    }

    if let Some(policy) = object.get("policy") {
        let Some(policy) = policy.as_object() else {
            return Err(fail("contract.policy must be an object when provided"));
        };
        assert_only_accepted_fields(policy, &ACCEPTED_POLICY_FIELDS, "contract.policy")?;
        let names = model_policy_tiers();
        if !policy
            .get("tier")
            .and_then(Value::as_str)
            .is_some_and(|t| names.contains(&t))
        {
            return Err(fail(format!(
                "contract.policy.tier must be one of {}",
                names.join(", ")
            )));
        }
    }

    let Some(budget) = object.get("budget").and_then(Value::as_object) else {
        return Err(fail("contract.budget must be an object"));
    };
    assert_only_accepted_fields(budget, &ACCEPTED_BUDGET_FIELDS, "contract.budget")?;
    if !is_integer(budget.get("timeoutMs")) || number(budget.get("timeoutMs")) <= Some(0.0) {
        return Err(fail(
            "contract.budget.timeoutMs must be a positive integer (milliseconds) -- the only enforced time budget",
        ));
    }
    if !is_integer(budget.get("maxRuns")) || number(budget.get("maxRuns")) <= Some(0.0) {
        return Err(fail(
            "contract.budget.maxRuns must be a positive integer -- the only enforced run-count budget",
        ));
    }
    if let Some(tokens) = budget.get("tokens") {
        if !number(Some(tokens)).is_some_and(|t| t.is_finite() && t >= 0.0) {
            return Err(fail(
                "contract.budget.tokens must be a non-negative finite number when provided (telemetry only, never enforced as a limit)",
            ));
        }
    }

    validate_caller(caller)
}

fn validate_caller(caller: &Value) -> Result<(), Refusal> {
    let Some(caller) = caller.as_object() else {
        return Err(fail("caller must be a non-null object"));
    };
    assert_no_forbidden_fields(caller, "caller")?;
    assert_only_accepted_fields(caller, &ACCEPTED_CALLER_FIELDS, "caller")?;
    if !is_non_empty_string(caller.get("writerId")) {
        return Err(fail("caller.writerId must be a non-empty string"));
    }
    let writer = caller["writerId"].as_str().unwrap_or_default();
    if writer.encode_utf16().count() > MAX_WRITER_ID_LENGTH || !is_writer_id(writer) {
        return Err(fail(format!(
            "caller.writerId must match /^[A-Za-z0-9._-]+$/ and be at most {MAX_WRITER_ID_LENGTH} characters (format-only floor, not an identity check)"
        )));
    }
    if caller.get("parentAssignmentId").is_some()
        && !is_non_empty_string(caller.get("parentAssignmentId"))
    {
        return Err(fail(
            "caller.parentAssignmentId must be a non-empty string when provided",
        ));
    }
    let Some(coordination) = caller.get("coordination") else {
        return Ok(());
    };
    let Some(coordination) = coordination.as_object() else {
        return Err(fail("caller.coordination must be an object when provided"));
    };
    assert_only_accepted_fields(
        coordination,
        &ACCEPTED_COORDINATION_CALLER_FIELDS,
        "caller.coordination",
    )?;
    if let Some(payload) = coordination.get("fanOutPayload") {
        validate_fan_out_payload(payload)?;
    }
    if let Some(invocation) = coordination.get("actionInvocation") {
        validate_action_invocation(invocation)?;
    }
    Ok(())
}

fn validate_fan_out_payload(payload: &Value) -> Result<(), Refusal> {
    let Some(payload) = payload.as_object() else {
        return Err(fail(
            "caller.coordination.fanOutPayload must be an object when provided",
        ));
    };
    for field in ["actorId", "objective", "taskKey"] {
        if !is_non_empty_string(payload.get(field)) {
            return Err(fail(format!(
                "caller.coordination.fanOutPayload.{field} must be a non-empty string"
            )));
        }
    }
    string_array_field(
        payload,
        "expectedOutputs",
        "caller.coordination.fanOutPayload",
        true,
    )?;
    string_array_field(
        payload,
        "constraints",
        "caller.coordination.fanOutPayload",
        false,
    )?;
    if payload.get("capabilities").is_some() && !is_string_array(payload.get("capabilities")) {
        return Err(fail(
            "caller.coordination.fanOutPayload.capabilities must be an array of strings when provided",
        ));
    }
    for field in ["fromAssignmentId", "intent"] {
        if payload.get(field).is_some() && !is_non_empty_string(payload.get(field)) {
            return Err(fail(format!(
                "caller.coordination.fanOutPayload.{field} must be a non-empty string when provided"
            )));
        }
    }
    Ok(())
}

fn validate_action_invocation(invocation: &Value) -> Result<(), Refusal> {
    let Some(invocation) = invocation.as_object() else {
        return Err(fail(
            "caller.coordination.actionInvocation must be an object when provided",
        ));
    };
    assert_only_accepted_fields(
        invocation,
        &["actionKey", "kind", "normalizedSteps"],
        "caller.coordination.actionInvocation",
    )?;
    if !is_non_empty_string(invocation.get("actionKey"))
        || !invocation["actionKey"]
            .as_str()
            .is_some_and(|k| k.starts_with("sha256:"))
    {
        return Err(fail(
            "caller.coordination.actionInvocation.actionKey must be a sha256 action key",
        ));
    }
    if !invocation
        .get("kind")
        .and_then(Value::as_str)
        .is_some_and(|k| ACTION_INVOCATION_KINDS.contains(&k))
    {
        return Err(fail(
            "caller.coordination.actionInvocation.kind is not a supported coordination action kind",
        ));
    }
    let steps = invocation
        .get("normalizedSteps")
        .and_then(Value::as_array)
        .filter(|steps| !steps.is_empty());
    let Some(steps) = steps else {
        return Err(fail(
            "caller.coordination.actionInvocation.normalizedSteps must be a non-empty array",
        ));
    };
    for step in steps {
        let Some(step) = step.as_object() else {
            return Err(fail(
                "caller.coordination.actionInvocation.normalizedSteps entries must be objects",
            ));
        };
        assert_only_accepted_fields(
            step,
            &NORMALIZED_STEP_FIELDS,
            "caller.coordination.actionInvocation.normalizedSteps[]",
        )?;
        if step.get("omittedFields").is_some() && !is_string_array(step.get("omittedFields")) {
            return Err(fail(
                "caller.coordination.actionInvocation.normalizedSteps[].omittedFields must be an array of strings when provided",
            ));
        }
    }
    Ok(())
}

/// The execution contract validator, handed to the assignment builder.
pub struct ExecutionContract;

impl ContractPort for ExecutionContract {
    fn validate(&self, contract: &Value, caller: &Value) -> Result<(), Refusal> {
        validate_execution_contract(contract, caller)
    }

    fn carries_protocol_stamp(&self, contract: &Value) -> bool {
        carries_protocol_operation_stamp(contract.get("constraints"))
    }
}
