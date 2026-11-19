//! The readers of a Run Result: versions 3 and 2 validated against their contract, the deterministic reading of
//! the historical version 1, and the one outcome every dispatch, loop, show and legality decision reads.
//! Nothing here rewrites bytes; a record that cannot be read soundly reads as `contract-corrupt`.

use super::js::{
    get, js_display, js_trim, object, object_like, or_else, path, plain_object, str_of, strings,
    truthy,
};
use super::vocabulary::{
    ASSESSMENT_VERDICTS, CONFIDENCE_LEVELS, DELIVERY_MODES, EXECUTION_STATUSES, FAILURE_FAMILIES,
    POLICY_DISPOSITIONS, PROVENANCE_VALUES, RECOGNIZED_LEGACY_STATUSES, RUN_RESULT_CONTRACT_ID,
    RUN_RESULT_CONTRACT_VERSION, RUN_RESULT_CONTRACT_VERSION_V2,
};
use fgos_run_result::{derive_outcome, legacy_classification, recorded_category_agrees, Outcome};
use serde_json::{json, Map, Value};
use std::path::Path;

/// The classification a record that cannot be read soundly reads as.
pub fn corrupt_classification() -> Value {
    json!({
        "execution": {"status": "completion-unknown", "exitCode": null},
        "assessment": {"verdict": "inconclusive"},
        "confidence": {"level": "failed", "basis": ["contract-corrupt"]},
        "failure": {"family": "contract", "code": "contract-corrupt"},
        "policy": {"disposition": "refuse", "code": "corrupt-result"},
        "delivery": {"mode": "legacy-derived"},
        "provenance": "contract-corrupt",
    })
}

fn contract(version: u64) -> Value {
    json!({"id": RUN_RESULT_CONTRACT_ID, "version": version})
}

/// The legacy `status` of a classification (`done`, `failed`, `blocked`, `no-evidence`).
fn project_legacy_status(classification: &Value) -> &'static str {
    let text = |section: &str, field: &str| str_of(path(classification, &[section, field]));
    let exec = text("execution", "status");
    let verdict = text("assessment", "verdict");
    let policy = text("policy", "disposition");
    let level = text("confidence", "level");
    let failed = truthy(get(classification, "failure"));
    if exec == Some("completion-unknown") {
        return "no-evidence";
    }
    if policy == Some("refuse") || matches!(exec, Some("cancelled" | "failed")) {
        return "failed";
    }
    if exec != Some("completed") {
        return "no-evidence";
    }
    match verdict {
        Some("findings") => "failed",
        Some("blocked") => "blocked",
        Some("pass" | "not-applicable") => {
            if level == Some("no-evidence") {
                "no-evidence"
            } else if failed {
                "failed"
            } else {
                "done"
            }
        }
        Some("inconclusive") => {
            if level == Some("no-evidence") {
                "no-evidence"
            } else if failed {
                "failed"
            } else {
                "done"
            }
        }
        _ => "done",
    }
}

/// The legacy `confidence` of a classification.
fn project_legacy_confidence(classification: &Value) -> String {
    let exec = str_of(path(classification, &["execution", "status"]));
    let level = str_of(path(classification, &["confidence", "level"]));
    if exec == Some("completion-unknown") || level == Some("no-evidence") {
        return "no-evidence".to_string();
    }
    if exec == Some("cancelled") {
        return "failed".to_string();
    }
    if exec == Some("failed") {
        return level
            .filter(|l| !l.is_empty())
            .unwrap_or("failed")
            .to_string();
    }
    level
        .filter(|l| !l.is_empty())
        .unwrap_or("reported")
        .to_string()
}

/// The answer of a validator: why a record is corrupt, and for version 3 the outcome its classification derives.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Validation {
    pub valid: bool,
    pub corrupt: bool,
    pub reasons: Vec<String>,
    pub derived_outcome: Option<Outcome>,
}

impl Validation {
    fn early(reason: &str) -> Self {
        Self {
            valid: false,
            corrupt: true,
            reasons: vec![reason.to_string()],
            derived_outcome: None,
        }
    }

    fn from_reasons(reasons: Vec<String>, derived_outcome: Option<Outcome>) -> Self {
        let valid = reasons.is_empty();
        Self {
            valid,
            corrupt: !valid,
            reasons,
            derived_outcome,
        }
    }
}

fn one_of(value: Option<&Value>, set: &[&str]) -> bool {
    str_of(value).is_some_and(|v| set.contains(&v))
}

fn list(set: &[&str]) -> String {
    set.join(", ")
}

/// The contract, run id and classification-presence checks both versions share. `Err` is the early answer.
fn check_envelope<'a>(
    result: &'a Value,
    version: u64,
    expected_run_id: Option<&str>,
    reasons: &mut Vec<String>,
) -> Result<&'a Value, Validation> {
    if !matches!(result, Value::Object(_)) {
        return Err(Validation::early("RunResult must be an object"));
    }
    match get(result, "contract") {
        Some(c) if truthy(Some(c)) && object_like(Some(c)) => {
            let id = str_of(get(c, "id"));
            if id != Some(RUN_RESULT_CONTRACT_ID)
                || get(c, "version").and_then(Value::as_u64) != Some(version)
            {
                reasons.push(format!(
                    "contract must be {{id: \"{RUN_RESULT_CONTRACT_ID}\", version: {version}}}"
                ));
            }
        }
        _ => reasons.push("contract field is required".to_string()),
    }
    match str_of(get(result, "runId")) {
        Some(run_id) if !js_trim(run_id).is_empty() => {
            if let Some(expected) = expected_run_id {
                if run_id != expected {
                    reasons.push(format!(
                        "runId \"{run_id}\" does not match expectedRunId \"{expected}\""
                    ));
                }
            }
        }
        _ => reasons.push("runId must be a non-empty string".to_string()),
    }
    match get(result, "classification") {
        Some(c) if plain_object(Some(c)) => Ok(c),
        _ => Err(Validation::early(
            "classification is required and must be an object",
        )),
    }
}

fn section<'a>(c: &'a Value, name: &str, reasons: &mut Vec<String>) -> Option<&'a Value> {
    let found = get(c, name).filter(|v| truthy(Some(v)) && object_like(Some(v)));
    if found.is_none() {
        reasons.push(format!("classification.{name} must be an object"));
    }
    found
}

/// Validate a Run Result v2 against its contract and invariants.
pub fn validate_run_result_v2(result: &Value, expected_run_id: Option<&str>) -> Validation {
    let mut reasons = Vec::new();
    let c = match check_envelope(
        result,
        RUN_RESULT_CONTRACT_VERSION_V2,
        expected_run_id,
        &mut reasons,
    ) {
        Ok(c) => c,
        Err(early) => return early,
    };
    if let Some(execution) = section(c, "execution", &mut reasons) {
        if !one_of(get(execution, "status"), &EXECUTION_STATUSES) {
            reasons.push(format!(
                "classification.execution.status must be one of [{}]",
                list(&EXECUTION_STATUSES)
            ));
        }
        if !matches!(
            get(execution, "exitCode"),
            Some(Value::Null | Value::Number(_))
        ) {
            reasons.push("classification.execution.exitCode must be a number or null".to_string());
        }
    }
    if let Some(assessment) = section(c, "assessment", &mut reasons) {
        if !one_of(get(assessment, "verdict"), &ASSESSMENT_VERDICTS) {
            reasons.push(format!(
                "classification.assessment.verdict must be one of [{}]",
                list(&ASSESSMENT_VERDICTS)
            ));
        }
    }
    if let Some(confidence) = section(c, "confidence", &mut reasons) {
        if !one_of(get(confidence, "level"), &CONFIDENCE_LEVELS) {
            reasons.push(format!(
                "classification.confidence.level must be one of [{}]",
                list(&CONFIDENCE_LEVELS)
            ));
        }
        if !matches!(get(confidence, "basis"), Some(Value::Array(_))) {
            reasons.push("classification.confidence.basis must be an array".to_string());
        }
    }
    match get(c, "failure") {
        None | Some(Value::Null) => {}
        Some(failure) if !plain_object(Some(failure)) => {
            reasons.push("classification.failure must be null or an object".to_string())
        }
        Some(failure) => {
            if !one_of(get(failure, "family"), &FAILURE_FAMILIES) {
                reasons.push(format!(
                    "classification.failure.family must be one of [{}]",
                    list(&FAILURE_FAMILIES)
                ));
            }
            if !str_of(get(failure, "code")).is_some_and(|code| !js_trim(code).is_empty()) {
                reasons.push("classification.failure.code must be a non-empty string".to_string());
            }
        }
    }
    if let Some(policy) = section(c, "policy", &mut reasons) {
        if !one_of(get(policy, "disposition"), &POLICY_DISPOSITIONS) {
            reasons.push(format!(
                "classification.policy.disposition must be one of [{}]",
                list(&POLICY_DISPOSITIONS)
            ));
        }
        if str_of(get(policy, "disposition")) == Some("refuse")
            && !str_of(get(policy, "code")).is_some_and(|code| !code.is_empty())
        {
            reasons
                .push("classification.policy.refuse requires a non-empty policy code".to_string());
        }
    }
    if let Some(delivery) = section(c, "delivery", &mut reasons) {
        if !one_of(get(delivery, "mode"), &DELIVERY_MODES) {
            reasons.push(format!(
                "classification.delivery.mode must be one of [{}]",
                list(&DELIVERY_MODES)
            ));
        }
        if str_of(get(delivery, "mode")) == Some("replayed")
            && !str_of(get(delivery, "sourceRunId")).is_some_and(|id| !id.is_empty())
        {
            reasons.push("classification.delivery.replayed requires sourceRunId".to_string());
        }
    }
    if !one_of(get(c, "provenance"), &PROVENANCE_VALUES) {
        reasons.push(format!(
            "classification.provenance must be one of [{}]",
            list(&PROVENANCE_VALUES)
        ));
    }
    // A completed execution with a provider failure is contract-corrupt.
    if str_of(path(c, &["execution", "status"])) == Some("completed")
        && truthy(get(c, "failure"))
        && str_of(path(c, &["failure", "family"])) == Some("provider")
    {
        reasons.push(
            "execution.completed with provider failure is forbidden (contract-corrupt)".to_string(),
        );
    }
    // Findings need something to point at.
    if str_of(path(c, &["assessment", "verdict"])) == Some("findings") {
        let non_empty = |value: Option<&Value>| {
            value
                .and_then(Value::as_array)
                .is_some_and(|a| !a.is_empty())
        };
        let has_evidence = non_empty(path(result, &["evidence", "findingRefs"]))
            || non_empty(path(result, &["agentClaim", "evidenceRefs"]))
            || str_of(path(result, &["agentClaim", "summary"]))
                .is_some_and(|s| !js_trim(s).is_empty())
            || str_of(path(c, &["assessment", "severityFloor"])).is_some();
        if !has_evidence {
            reasons
                .push("assessment.findings requires evidence refs or findings summary".to_string());
        }
    }
    // The stored legacy status and confidence must match the projection.
    let expected_status = project_legacy_status(c);
    let expected_confidence = project_legacy_confidence(c);
    if str_of(get(result, "status")) != Some(expected_status) {
        reasons.push(format!(
            "stored status \"{}\" does not match projected status \"{expected_status}\"",
            js_display(get(result, "status"))
        ));
    }
    if str_of(get(result, "confidence")) != Some(expected_confidence.as_str()) {
        reasons.push(format!("stored confidence \"{}\" does not match projected confidence \"{expected_confidence}\"", js_display(get(result, "confidence"))));
    }
    Validation::from_reasons(reasons, None)
}

/// Validate a Run Result v3. The recorded outcome category is a checked cache: a record whose classification
/// derives a category the compatibility rule does not accept is corrupt.
pub fn validate_run_result_v3(result: &Value, expected_run_id: Option<&str>) -> Validation {
    let mut reasons = Vec::new();
    let c = match check_envelope(
        result,
        RUN_RESULT_CONTRACT_VERSION,
        expected_run_id,
        &mut reasons,
    ) {
        Ok(c) => c,
        Err(early) => return early,
    };
    if let Some(execution) = section(c, "execution", &mut reasons) {
        if !one_of(get(execution, "status"), &EXECUTION_STATUSES) {
            reasons.push(format!(
                "classification.execution.status must be one of [{}]",
                list(&EXECUTION_STATUSES)
            ));
        }
    }
    if let Some(assessment) = section(c, "assessment", &mut reasons) {
        if !one_of(get(assessment, "verdict"), &ASSESSMENT_VERDICTS) {
            reasons.push(format!(
                "classification.assessment.verdict must be one of [{}]",
                list(&ASSESSMENT_VERDICTS)
            ));
        }
    }
    if let Some(confidence) = section(c, "confidence", &mut reasons) {
        if !one_of(get(confidence, "level"), &CONFIDENCE_LEVELS) {
            reasons.push(format!(
                "classification.confidence.level must be one of [{}]",
                list(&CONFIDENCE_LEVELS)
            ));
        }
    }
    let mut derived = None;
    match get(c, "outcome").filter(|v| truthy(Some(v)) && object_like(Some(v))) {
        None => reasons.push("classification.outcome must be an object in contract v3".to_string()),
        Some(outcome) => {
            let now = derive_outcome(c);
            let recorded = get(outcome, "category");
            if !str_of(recorded).is_some_and(|r| recorded_category_agrees(r, &now.category)) {
                reasons.push(format!(
                    "classification.outcome.category \"{}\" does not match deriveOutcome \"{}\"",
                    js_display(recorded),
                    now.category
                ));
            }
            derived = Some(now);
        }
    }
    Validation::from_reasons(reasons, derived)
}

/// A Run Result as read: the record, and the legacy `status` and `confidence` it reads as. For version 3 those two
/// come from the classification and are not part of the record's bytes; for the other versions they are fields of it.
#[derive(Debug, Clone, PartialEq)]
pub struct InterpretedRunResult {
    pub record: Value,
    pub status: String,
    pub confidence: Value,
    /// The record could not be read soundly; its classification is `contract-corrupt`.
    pub corrupt: bool,
}

/// The legacy `status` a version 3 record reads as, from its classification.
pub fn legacy_status(record: &Value) -> &'static str {
    match str_of(path(record, &["classification", "outcome", "category"])) {
        Some("ok") => "done",
        Some("blocked") => "blocked",
        _ if str_of(path(record, &["classification", "confidence", "level"]))
            == Some("no-evidence") =>
        {
            "no-evidence"
        }
        _ => "failed",
    }
}

/// The legacy `confidence` a version 3 record reads as: the level its classification names.
pub fn legacy_confidence(record: &Value) -> Value {
    or_else(
        path(record, &["classification", "confidence", "level"]),
        Value::Null,
    )
}

fn with_view(record: Value) -> InterpretedRunResult {
    InterpretedRunResult {
        status: legacy_status(&record).to_string(),
        confidence: legacy_confidence(&record),
        record,
        corrupt: false,
    }
}

fn corrupt_of(
    mut record: Map<String, Value>,
    contract_value: Value,
    reasons: Vec<String>,
) -> InterpretedRunResult {
    record.insert("contract".into(), contract_value);
    record.insert("classification".into(), corrupt_classification());
    stamp_corrupt(record, reasons)
}

fn stamp_corrupt(mut record: Map<String, Value>, reasons: Vec<String>) -> InterpretedRunResult {
    record.insert("status".into(), json!("no-evidence"));
    record.insert("confidence".into(), json!("failed"));
    record.insert("contractCorrupt".into(), json!(true));
    record.insert("resultCorrupt".into(), json!(true));
    record.insert("corrupt".into(), json!(true));
    record.insert(
        "corruptionReasons".into(),
        Value::Array(reasons.into_iter().map(Value::String).collect()),
    );
    InterpretedRunResult {
        record: Value::Object(record),
        status: "no-evidence".to_string(),
        confidence: json!("failed"),
        corrupt: true,
    }
}

/// A record built only to say it is corrupt: the result of an input that has no usable structure to keep.
fn standalone_corrupt(
    run_id: Value,
    assignment_id: Value,
    basis: &str,
    code: &str,
    reasons: Vec<String>,
    runtime: Value,
    evidence: Value,
) -> InterpretedRunResult {
    let mut classification = corrupt_classification();
    classification["confidence"] = json!({"level": "failed", "basis": [basis]});
    classification["failure"] = json!({"family": "contract", "code": code});
    let record = match object(vec![
        ("contract", contract(RUN_RESULT_CONTRACT_VERSION)),
        ("runId", run_id),
        ("assignmentId", assignment_id),
        ("classification", classification),
    ]) {
        Value::Object(map) => map,
        _ => Map::new(),
    };
    let mut result = stamp_corrupt(record, reasons);
    if let Value::Object(map) = &mut result.record {
        map.insert("runtime".into(), runtime);
        map.insert("evidence".into(), evidence);
    }
    result
}

/// Read and interpret a Run Result deterministically.
///
/// A present contract is an explicit claim of a versioned format: only its complete absence is historical v1, and a
/// partial, unknown or mismatched contract never demotes itself into attacker-controlled v1 projections. A legacy v1
/// record is derived into a classification (`legacy-derived`) without rewriting its bytes.
pub fn interpret_run_result(input: &Value, expected_run_id: Option<&str>) -> InterpretedRunResult {
    let expected = expected_run_id.filter(|e| !e.is_empty());
    let Value::Object(raw) = input else {
        return standalone_corrupt(
            Value::Null,
            Value::Null,
            "invalid-json",
            "invalid-run-result-structure",
            vec!["Input is not an object".to_string()],
            json!({}),
            json!({}),
        );
    };
    let raw_value = input;
    let raw_get = |key: &str| raw.get(key);
    if let Some(expected) = expected {
        if !truthy(raw_get("runId")) {
            return standalone_corrupt(
                Value::Null,
                or_else(raw_get("assignmentId"), Value::Null),
                "run-id-missing",
                "run-id-missing",
                vec![format!(
                    "runId is missing but expectedRunId was specified (\"{expected}\")"
                )],
                or_else(raw_get("runtime"), json!({})),
                or_else(raw_get("evidence"), json!({})),
            );
        }
        if str_of(raw_get("runId")) != Some(expected) {
            return standalone_corrupt(
                raw_get("runId").cloned().unwrap_or(Value::Null),
                or_else(raw_get("assignmentId"), Value::Null),
                "run-id-mismatch",
                "run-id-mismatch",
                vec![format!(
                    "runId \"{}\" does not match expectedRunId \"{expected}\"",
                    js_display(raw_get("runId"))
                )],
                or_else(raw_get("runtime"), json!({})),
                or_else(raw_get("evidence"), json!({})),
            );
        }
    }
    let contract_ref = raw_get("contract");
    let version = contract_ref
        .and_then(|c| get(c, "version"))
        .and_then(Value::as_u64);
    let id_ok = str_of(contract_ref.and_then(|c| get(c, "id"))) == Some(RUN_RESULT_CONTRACT_ID);

    if version == Some(RUN_RESULT_CONTRACT_VERSION) && id_ok {
        let validation = validate_run_result_v3(raw_value, expected);
        if !validation.valid {
            return corrupt_of(
                raw.clone(),
                contract(RUN_RESULT_CONTRACT_VERSION),
                validation.reasons,
            );
        }
        // A record whose recorded category the compatibility rule accepted but no longer derives (a provider
        // limit recorded `infra`) reads as it derives today.
        let derived = validation.derived_outcome.unwrap_or(Outcome {
            category: String::new(),
            reason: String::new(),
        });
        let mut classification = raw_get("classification").cloned().unwrap_or(Value::Null);
        if str_of(path(&classification, &["outcome", "category"]))
            != Some(derived.category.as_str())
        {
            if let Some(map) = classification.as_object_mut() {
                map.insert(
                    "outcome".into(),
                    json!({"category": derived.category, "reason": derived.reason}),
                );
            }
        }
        let mut record = raw.clone();
        record.insert("classification".into(), classification);
        return with_view(Value::Object(record));
    }

    if version == Some(RUN_RESULT_CONTRACT_VERSION_V2) && id_ok {
        let validation = validate_run_result_v2(raw_value, expected);
        if !validation.valid {
            return corrupt_of(
                raw.clone(),
                contract(RUN_RESULT_CONTRACT_VERSION_V2),
                validation.reasons,
            );
        }
        return InterpretedRunResult {
            record: raw_value.clone(),
            status: str_of(raw_get("status"))
                .unwrap_or("no-evidence")
                .to_string(),
            confidence: or_else(raw_get("confidence"), Value::Null),
            corrupt: false,
        };
    }

    if contract_ref.is_some() {
        return corrupt_of(
            raw.clone(),
            contract(RUN_RESULT_CONTRACT_VERSION),
            vec![format!(
                "contract must be {{id: \"{RUN_RESULT_CONTRACT_ID}\", version: 2|3}}"
            )],
        );
    }

    // An object with no contract, no status and no runId is not a result structure.
    if !truthy(raw_get("status")) && !truthy(raw_get("runId")) {
        return standalone_corrupt(
            Value::Null,
            Value::Null,
            "invalid-json",
            "invalid-run-result-structure",
            vec!["Legacy result must have at least runId or status".to_string()],
            json!({}),
            json!({}),
        );
    }

    // A legacy result's explicit status must be one of the recognized legacy statuses.
    if let Some(status) = raw_get("status").filter(|s| !s.is_null()) {
        if !str_of(Some(status)).is_some_and(|s| RECOGNIZED_LEGACY_STATUSES.contains(&s)) {
            return standalone_corrupt(
                or_else(raw_get("runId"), Value::Null),
                or_else(raw_get("assignmentId"), Value::Null),
                "invalid-status",
                "non-standard-status",
                vec![format!(
                    "status \"{}\" is not a recognized status (must be one of [{}])",
                    js_display(Some(status)),
                    list(&RECOGNIZED_LEGACY_STATUSES)
                )],
                or_else(raw_get("runtime"), json!({})),
                or_else(raw_get("evidence"), json!({})),
            );
        }
    }

    interpret_legacy_v1(raw)
}

/// The deterministic reading of a historical v1 record: its legacy status and confidence map to a classification.
fn interpret_legacy_v1(raw: &Map<String, Value>) -> InterpretedRunResult {
    let raw_get = |key: &str| raw.get(key);
    let legacy_status: Value = raw_get("status")
        .filter(|v| truthy(Some(v)))
        .cloned()
        .unwrap_or_else(|| json!("no-evidence"));
    let status_text = legacy_status.as_str().unwrap_or("no-evidence");
    let legacy_confidence: Value = raw_get("confidence")
        .filter(|v| truthy(Some(v)))
        .cloned()
        .unwrap_or_else(|| {
            json!(if status_text == "done" {
                "reported"
            } else {
                "failed"
            })
        });
    let confidence_text = legacy_confidence.as_str();
    let runtime = raw_get("runtime");
    let mut exit_code: Option<Value> = runtime
        .and_then(|r| get(r, "exitCode"))
        .filter(|v| !v.is_null())
        .cloned();
    let is_timeout = truthy(runtime.and_then(|r| get(r, "isTimeout")));
    let claim_verdict =
        str_of(raw_get("agentClaim").and_then(|c| path(c, &["assessment", "verdict"])));

    let legacy = legacy_classification(status_text, confidence_text, is_timeout, claim_verdict);
    let (exec_status, verdict) = (legacy.execution_status, legacy.verdict);
    let failure = legacy.failure.map_or(
        Value::Null,
        |(family, code)| json!({"family": family, "code": code}),
    );
    if let Some(code) = legacy.default_exit_code {
        exit_code.get_or_insert_with(|| json!(code));
    }

    let mut execution = Map::new();
    execution.insert("status".into(), json!(exec_status));
    if let Some(code) = exit_code {
        execution.insert("exitCode".into(), code);
    }
    let mut assessment = Map::new();
    assessment.insert("verdict".into(), json!(verdict));
    if let Some(floor) = raw_get("agentClaim")
        .and_then(|c| path(c, &["assessment", "severityFloor"]))
        .filter(|v| truthy(Some(v)))
    {
        assessment.insert("severityFloor".into(), floor.clone());
    }
    let classification = object(vec![
        ("execution", Value::Object(execution)),
        ("assessment", Value::Object(assessment)),
        (
            "confidence",
            json!({"level": legacy_confidence, "basis": strings(&["v1-status"])}),
        ),
        ("failure", failure),
        (
            "policy",
            json!({"disposition": "not-applicable", "code": null}),
        ),
        ("delivery", json!({"mode": "legacy-derived"})),
        ("provenance", json!("legacy-derived")),
    ]);

    let mut view = Map::new();
    view.insert("contract".into(), contract(RUN_RESULT_CONTRACT_VERSION_V2));
    view.insert("runId".into(), or_else(raw_get("runId"), Value::Null));
    view.insert(
        "assignmentId".into(),
        or_else(raw_get("assignmentId"), Value::Null),
    );
    for key in [
        "workId",
        "controlEpoch",
        "controlToken",
        "executorId",
        "executorRedirected",
        "policy",
        "settledAt",
        "durationMs",
    ] {
        if let Some(v) = raw_get(key) {
            view.insert(key.into(), v.clone());
        }
    }
    if let Some(v) = raw_get("planContentHash").filter(|v| truthy(Some(v))) {
        view.insert("planContentHash".into(), v.clone());
    }
    if let Some(v) = raw_get("inputDigests").filter(|v| v.is_array()) {
        view.insert("inputDigests".into(), v.clone());
    }
    if let Some(v) = raw_get("claimSha256").filter(|v| truthy(Some(v))) {
        view.insert("claimSha256".into(), v.clone());
    }
    view.insert(
        "settleReports".into(),
        or_else(raw_get("settleReports"), json!([])),
    );
    if let Some(v) = raw_get("reportDeclaration").filter(|v| truthy(Some(v))) {
        view.insert("reportDeclaration".into(), v.clone());
    }
    view.insert("classification".into(), classification);
    view.insert("status".into(), legacy_status.clone());
    view.insert("confidence".into(), legacy_confidence.clone());
    view.insert("runtime".into(), or_else(raw_get("runtime"), json!({})));
    if let Some(claim) = raw_get("agentClaim") {
        view.insert("agentClaim".into(), claim.clone());
    }
    let mut evidence: Map<String, Value> = raw_get("evidence")
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    evidence.insert("sourceVersion".into(), json!("v1"));
    evidence.insert("bytesRewritten".into(), json!(false));
    view.insert("evidence".into(), Value::Object(evidence));
    InterpretedRunResult {
        record: Value::Object(view),
        status: status_text.to_string(),
        confidence: legacy_confidence,
        corrupt: false,
    }
}

/// What reading a result file can fail on.
#[derive(Debug, thiserror::Error)]
pub enum ReadError {
    #[error("run result file unreadable: {0}")]
    Io(#[from] std::io::Error),
    #[error("run result file is not JSON: {0}")]
    Json(#[from] serde_json::Error),
}

/// Interpret the Run Result at `file`; a file that cannot be read or parsed is an error, not a corrupt record.
pub fn interpret_run_result_file(
    file: &Path,
    expected_run_id: Option<&str>,
) -> Result<InterpretedRunResult, ReadError> {
    let text = std::fs::read_to_string(file)?;
    Ok(interpret_run_result(
        &serde_json::from_str(&text)?,
        expected_run_id,
    ))
}

/// The settled result of an attempt directory, or `None` while there is none (or it cannot be read soundly).
pub fn read_settled_result(run_dir: &Path, run_id: &str) -> Option<InterpretedRunResult> {
    let file = run_dir.join("result.json");
    if !file.exists() {
        return None;
    }
    let read = interpret_run_result_file(&file, Some(run_id)).ok()?;
    let sound = !read.corrupt
        && str_of(path(&read.record, &["classification", "provenance"]))
            != Some("contract-corrupt");
    sound.then_some(read)
}

struct Floor {
    status: Option<String>,
    confidence: Option<String>,
}

fn is_companion_report(artifact: &str) -> bool {
    !artifact.ends_with("agent-result.json") && !is_outbox_result(artifact)
}

/// `[/\\]outbox[/\\]result-\d+\.json$`
fn is_outbox_result(artifact: &str) -> bool {
    let Some(stem) = artifact.strip_suffix(".json") else {
        return false;
    };
    let digits = stem.bytes().rev().take_while(u8::is_ascii_digit).count();
    if digits == 0 {
        return false;
    }
    let Some(head) = stem[..stem.len() - digits].strip_suffix("result-") else {
        return false;
    };
    let is_sep = |c: char| c == '/' || c == '\\';
    let Some(head) = head.strip_suffix(is_sep) else {
        return false;
    };
    head.strip_suffix("outbox")
        .is_some_and(|rest| rest.ends_with(is_sep))
}

fn derive_floor(floor: &Value) -> Option<Floor> {
    if !floor.is_object() {
        return None;
    }
    if get(floor, "status").is_some() && get(floor, "confidence").is_some() {
        return Some(Floor {
            status: str_of(get(floor, "status")).map(str::to_string),
            confidence: str_of(get(floor, "confidence")).map(str::to_string),
        });
    }
    let done = |status: &str, confidence: &str| {
        Some(Floor {
            status: Some(status.to_string()),
            confidence: Some(confidence.to_string()),
        })
    };
    let exit_code = get(floor, "exitCode")
        .filter(|v| v.is_number())
        .and_then(Value::as_f64);
    let signal = str_of(get(floor, "signal")).is_some_and(|s| !s.is_empty());
    let is_timeout = get(floor, "isTimeout") == Some(&Value::Bool(true));
    let claim = get(floor, "agentClaim").filter(|v| !v.is_null());
    let claim_invalid = get(floor, "claimInvalid") == Some(&Value::Bool(true));
    let has_worker_report = get(floor, "workerArtifacts")
        .and_then(Value::as_array)
        .is_some_and(|items| {
            items
                .iter()
                .filter_map(Value::as_str)
                .any(is_companion_report)
        });
    let present = |key: &str| {
        get(floor, key)
            .and_then(Value::as_array)
            .is_some_and(|a| !a.is_empty())
    };
    let flag = |key: &str| get(floor, key) == Some(&Value::Bool(true));
    let read_only = flag("isReadOnlyOperation");

    if is_timeout || exit_code.is_some_and(|c| c != 0.0) || signal || claim_invalid {
        return done("failed", "failed");
    }
    let claim_status = claim.and_then(|c| str_of(get(c, "status")));
    if claim_status == Some("failed") {
        let finding =
            claim.and_then(|c| str_of(path(c, &["assessment", "verdict"]))) == Some("findings");
        if finding && has_worker_report && exit_code == Some(0.0) {
            return done("failed", "reported");
        }
        return done("failed", "failed");
    }
    // A checkout change seen across a read-only run is correlated evidence (another session may have made it).
    let external = present("changedFiles") || flag("hasDirtyBeforeMutation");
    if claim_status == Some("blocked") {
        return done("blocked", "reported");
    }
    if claim_status == Some("done") {
        if read_only {
            return if has_worker_report {
                done("done", "reported")
            } else {
                done("no-evidence", "no-evidence")
            };
        }
        return if external {
            done("done", "verified")
        } else {
            done("no-evidence", "no-evidence")
        };
    }
    if !read_only && external {
        return done("done", "inferred");
    }
    done("no-evidence", "no-evidence")
}

/// The one reading of a run's outcome, for every dispatch, coordination, loop, show and legality decision.
#[derive(Debug, Clone, PartialEq)]
pub struct RunOutcome {
    pub category: String,
    pub executed: String,
    pub verdict: String,
    pub refused: bool,
    pub evidence: String,
    pub satisfied: bool,
    pub infra_failure: bool,
    pub failure: Value,
}

/// Read the outcome of a Run Result record. A corrupt record fails closed; `evidence_floor` downgrades a
/// settlement the independent evidence does not support.
pub fn run_outcome(input: &Value, evidence_floor: Option<&Value>) -> RunOutcome {
    let floor = evidence_floor.and_then(derive_floor);
    let result = interpret_run_result(input, None);
    let classification = get(&result.record, "classification");
    let provenance_corrupt =
        str_of(classification.and_then(|c| get(c, "provenance"))) == Some("contract-corrupt");
    if result.corrupt || provenance_corrupt {
        let no_evidence = floor.as_ref().is_some_and(|f| {
            f.confidence.as_deref() == Some("no-evidence")
                || f.status.as_deref() == Some("no-evidence")
        });
        return RunOutcome {
            category: "corrupt".to_string(),
            executed: "unknown".to_string(),
            verdict: "inconclusive".to_string(),
            refused: true,
            evidence: if no_evidence { "no-evidence" } else { "failed" }.to_string(),
            satisfied: false,
            infra_failure: true,
            failure: or_else(
                classification.and_then(|c| get(c, "failure")),
                json!({"family": "contract", "code": "corrupt-record"}),
            ),
        };
    }
    let classification = classification.cloned().unwrap_or(Value::Null);
    let mut category =
        match str_of(path(&classification, &["outcome", "category"])).filter(|c| !c.is_empty()) {
            Some(category) => category.to_string(),
            None => derive_outcome(&classification).category,
        };
    let mut evidence = str_of(path(&classification, &["confidence", "level"]))
        .unwrap_or("none")
        .to_string();
    if let Some(floor) = &floor {
        let settles_advance =
            category == "ok" && matches!(evidence.as_str(), "reported" | "verified");
        let derived_advances = floor.status.as_deref() == Some("done")
            && matches!(floor.confidence.as_deref(), Some("reported" | "verified"));
        if !derived_advances || settles_advance {
            match floor.status.as_deref() {
                Some("failed") => {
                    category = "infra".to_string();
                    evidence = floor
                        .confidence
                        .clone()
                        .unwrap_or_else(|| "failed".to_string());
                }
                Some("no-evidence") => {
                    category = "infra".to_string();
                    evidence = floor
                        .confidence
                        .clone()
                        .unwrap_or_else(|| "no-evidence".to_string());
                }
                _ => {}
            }
        }
    }
    RunOutcome {
        executed: str_of(path(&classification, &["execution", "status"]))
            .unwrap_or("unknown")
            .to_string(),
        verdict: str_of(path(&classification, &["assessment", "verdict"]))
            .unwrap_or("inconclusive")
            .to_string(),
        refused: category == "policy"
            || str_of(path(&classification, &["policy", "disposition"])) == Some("refuse"),
        satisfied: category == "ok",
        infra_failure: matches!(category.as_str(), "infra" | "provider" | "corrupt"),
        failure: or_else(get(&classification, "failure"), Value::Null),
        evidence,
        category,
    }
}
