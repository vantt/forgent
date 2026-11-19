//! The one writer of a Run Result: version 3 only. Facts in, the settled record out; the outcome of the
//! classification comes from the Run Result crate. The clock is an argument, never read here.

use super::claim::{is_assessment_required, ClaimContext};
use super::js::{get, js_display, object, or_else, path, str_of, strings, truthy};
use super::vocabulary::{ASSESSMENT_VERDICTS, RUN_RESULT_CONTRACT_ID, RUN_RESULT_CONTRACT_VERSION};
use fgos_run_result::derive_outcome;
use serde_json::{json, Map, Value};

fn is_true(value: Option<&Value>) -> bool {
    value == Some(&Value::Bool(true))
}

fn non_empty_array(value: Option<&Value>) -> bool {
    value
        .and_then(Value::as_array)
        .is_some_and(|a| !a.is_empty())
}

fn failure(family: &str, code: &str) -> Value {
    json!({"family": family, "code": code})
}

/// Construct a Run Result v3 from the facts of a settled run. `input` carries the same fields the Node writer took
/// (`runId`, `runtime`, `agentClaim`, `evidence`, the overrides, ...); an absent field and an explicit `null` read
/// as they did there. `now` (an ISO 8601 UTC timestamp) stands in for `settledAt` when the facts carry none.
pub fn normalize_run_result_v3(input: &Value, now: &str) -> Value {
    let empty = Map::new();
    let arg_map = input.as_object().unwrap_or(&empty);
    let arg = |key: &str| arg_map.get(key);
    let runtime = arg("runtime").filter(|v| v.is_object());
    let rt = |key: &str| runtime.and_then(|r| get(r, key));
    let evidence_in = arg("evidence").filter(|v| v.is_object());
    let ev = |key: &str| evidence_in.and_then(|e| get(e, key));
    let agent_claim = arg("agentClaim").filter(|v| truthy(Some(v)));
    let claim_field = |keys: &[&str]| agent_claim.and_then(|c| path(c, keys));
    let claim_invalid = truthy(arg("claimInvalid"));
    let role = arg("role").filter(|v| !v.is_null());
    let role_text = str_of(role);
    let operation = arg("operation");
    let is_read_only = truthy(arg("isReadOnlyOperation"));
    let confidence_level = arg("confidenceLevel").filter(|v| !v.is_null());

    let exit_value = rt("exitCode").filter(|v| v.is_number());
    let exit_code = exit_value.and_then(Value::as_f64);
    let is_timeout = is_true(rt("isTimeout"));
    let is_cancelled = is_true(rt("isCancelled"));
    let execution_error = rt("executionError").filter(|v| truthy(Some(v)));

    // 1. Execution status
    let exec_status = match arg("execStatusOverride").filter(|v| truthy(Some(v))) {
        Some(over) => js_display(Some(over)),
        None => {
            let nothing_captured =
                !truthy(rt("stdoutLog")) && !truthy(rt("stderrLog")) && !truthy(rt("settledAt"));
            if is_cancelled {
                "cancelled"
            } else if is_timeout || execution_error.is_some() || exit_code.is_some_and(|c| c != 0.0)
            {
                "failed"
            } else if exit_code.is_none() && nothing_captured {
                "completion-unknown"
            } else if exit_code == Some(0.0) {
                "completed"
            } else {
                "completion-unknown"
            }
            .to_string()
        }
    };

    // 2. Failure classification
    let failure_value = if let Some(over) = arg("failureOverride").filter(|v| truthy(Some(v))) {
        over.clone()
    } else if exec_status == "completed" {
        Value::Null
    } else if is_timeout || exit_code == Some(124.0) {
        failure("resource", "execution-timeout")
    } else if exit_code == Some(137.0) {
        failure("resource", "oom-killed")
    } else if let Some(error) = execution_error {
        let code = get(error, "code")
            .filter(|v| truthy(Some(v)))
            .cloned()
            .unwrap_or_else(|| json!("provider-spawn-error"));
        let message = get(error, "message")
            .filter(|v| truthy(Some(v)))
            .cloned()
            .unwrap_or_else(|| Value::String(js_display(Some(error))));
        object(vec![
            ("family", json!("provider")),
            ("code", code),
            ("message", message),
        ])
    } else if exec_status == "cancelled" {
        failure("policy", "cancelled")
    } else if exec_status == "completion-unknown" {
        failure("unknown", "lost-supervisor")
    } else if exec_status == "failed" {
        failure("provider", "nonzero-process-exit")
    } else {
        Value::Null
    };

    // 3. Assessment classification
    let claim_status = str_of(claim_field(&["status"]));
    let verdict = |name: &str| json!({"verdict": name});
    let assessment = if let Some(over) = arg("assessmentOverride").filter(|v| truthy(Some(v))) {
        over.clone()
    } else if exec_status == "failed" || exec_status == "cancelled" {
        verdict("not-applicable")
    } else if exec_status == "completion-unknown" {
        verdict("inconclusive")
    } else {
        let context = ClaimContext {
            role: role_text.map(str::to_string),
            operation: str_of(operation).map(str::to_string),
            posture_verdict: None,
        };
        let assessment_role =
            is_assessment_required(&context) || matches!(role_text, Some("reviewer" | "red-team"));
        if assessment_role {
            let claimed = str_of(claim_field(&["assessment", "verdict"]))
                .filter(|v| ASSESSMENT_VERDICTS.contains(v));
            if let Some(claimed) = claimed {
                let mut map = Map::new();
                map.insert("verdict".into(), json!(claimed));
                if let Some(floor) =
                    claim_field(&["assessment", "severityFloor"]).filter(|v| truthy(Some(v)))
                {
                    map.insert("severityFloor".into(), floor.clone());
                }
                Value::Object(map)
            } else {
                match claim_status {
                    Some("failed") => verdict("findings"),
                    Some("done") => verdict("pass"),
                    Some("blocked") => verdict("blocked"),
                    _ => verdict("inconclusive"),
                }
            }
        } else {
            match claim_status {
                Some("done") => verdict("pass"),
                Some("blocked") => verdict("blocked"),
                Some("failed") => verdict("not-applicable"),
                _ if matches!(
                    str_of(confidence_level),
                    Some("verified" | "reported" | "inferred")
                ) =>
                {
                    verdict("pass")
                }
                _ => verdict("inconclusive"),
            }
        }
    };

    // 4. Confidence classification
    let changed_files_present = non_empty_array(ev("changedFiles"));
    let mut basis: Vec<&str> = Vec::new();
    if agent_claim.is_some() && !claim_invalid {
        basis.push("valid-agent-result-claim");
    }
    if claim_invalid {
        basis.push("invalid-agent-result-claim");
    }
    if truthy(rt("stdoutLog")) {
        basis.push("captured-stdout");
    }
    if changed_files_present {
        basis.push("workspace-git-diff");
    }
    if is_timeout {
        basis.push("timeout");
    }
    let mut level: Value = confidence_level.cloned().unwrap_or(Value::Null);
    if exec_status == "completion-unknown" {
        level = json!("no-evidence");
        if !basis.contains(&"missing-agent-result") {
            basis.push("missing-agent-result");
        }
    } else if exec_status == "cancelled" {
        level = json!("failed");
        basis.push("cancelled");
    } else if exec_status == "failed" {
        level = json!("failed");
        basis.push("failed-exit");
    } else if claim_invalid {
        // A malformed or schema-invalid worker claim fails closed on its own, whatever the process exit was.
        level = json!("failed");
    } else if !truthy(Some(&level)) {
        level = if claim_status == Some("done") && !is_read_only && changed_files_present {
            json!("verified")
        } else {
            json!("reported")
        };
    }

    // 5. Policy classification
    let failure_family = str_of(path(&failure_value, &["family"]));
    let policy = if let Some(over) = arg("policyOverride").filter(|v| truthy(Some(v))) {
        over.clone()
    } else if claim_invalid {
        json!({"disposition": "refuse", "code": "invalid-agent-result-claim"})
    } else if exec_status == "completion-unknown" {
        json!({"disposition": "needs-input", "code": "completion-unknown"})
    } else if matches!(failure_family, Some("provider" | "resource")) {
        json!({"disposition": "needs-input", "code": or_else(path(&failure_value, &["code"]), Value::Null)})
    } else if exec_status == "failed" {
        json!({"disposition": "not-applicable", "code": null})
    } else {
        json!({"disposition": "allow", "code": null})
    };

    // 6. Delivery classification
    let delivery_mode = arg("deliveryMode")
        .filter(|v| truthy(Some(v)))
        .cloned()
        .unwrap_or_else(|| json!("fresh"));
    let mut delivery = Map::new();
    delivery.insert("mode".into(), delivery_mode.clone());
    if delivery_mode.as_str() == Some("replayed") && truthy(arg("sourceRunId")) {
        delivery.insert(
            "sourceRunId".into(),
            arg("sourceRunId").cloned().unwrap_or(Value::Null),
        );
    }

    let exit_json = exit_value.cloned().unwrap_or(Value::Null);
    let mut classification = object(vec![
        (
            "execution",
            json!({"status": exec_status, "exitCode": exit_json}),
        ),
        ("assessment", assessment),
        (
            "confidence",
            json!({"level": level, "basis": strings(&basis)}),
        ),
        ("failure", failure_value),
        ("policy", policy),
        ("delivery", Value::Object(delivery)),
        ("provenance", json!("native-v3")),
    ]);
    let outcome = derive_outcome(&classification);
    if let Some(map) = classification.as_object_mut() {
        map.insert(
            "outcome".into(),
            json!({"category": outcome.category, "reason": outcome.reason}),
        );
    }

    let mut record = Map::new();
    record.insert(
        "contract".into(),
        json!({"id": RUN_RESULT_CONTRACT_ID, "version": RUN_RESULT_CONTRACT_VERSION}),
    );
    if let Some(run_id) = arg("runId") {
        record.insert("runId".into(), run_id.clone());
    }
    record.insert(
        "assignmentId".into(),
        or_else(arg("assignmentId"), Value::Null),
    );
    if let Some(v) = arg("unitRunId").filter(|v| !v.is_null()) {
        record.insert("unitRunId".into(), v.clone());
    }
    if let Some(v) = arg("round").filter(|v| !v.is_null()) {
        record.insert("round".into(), v.clone());
    }
    for key in ["workId", "controlEpoch", "controlToken"] {
        if let Some(v) = arg(key) {
            record.insert(key.into(), v.clone());
        }
    }
    if let Some(v) = arg("executorId").filter(|v| !v.is_null()) {
        record.insert("executorId".into(), v.clone());
    }
    record.insert(
        "adapter".into(),
        or_else(arg("adapter"), json!("cli-spawn")),
    );
    record.insert(
        "confinement".into(),
        or_else(arg("confinement"), Value::Null),
    );
    record.insert("role".into(), or_else(arg("role"), Value::Null));
    if let Some(v) = arg("executorRedirected") {
        record.insert("executorRedirected".into(), v.clone());
    }
    let dispatch_policy = arg("policy");
    if let Some(p) = dispatch_policy {
        record.insert("policy".into(), p.clone());
    }
    if let Some(persona) = dispatch_policy
        .and_then(|p| get(p, "persona"))
        .filter(|v| truthy(Some(v)))
    {
        let source = or_else(
            dispatch_policy.and_then(|p| path(p, &["provenance", "persona", "source"])),
            Value::Null,
        );
        record.insert(
            "promptEnvelope".into(),
            json!({"persona": {"ref": persona, "delivery": "section", "applied": true, "source": source}}),
        );
    }
    record.insert(
        "settledAt".into(),
        arg("settledAt")
            .filter(|v| truthy(Some(v)))
            .cloned()
            .unwrap_or_else(|| json!(now)),
    );
    if let Some(v) = arg("planContentHash").filter(|v| truthy(Some(v))) {
        record.insert("planContentHash".into(), v.clone());
    }
    if non_empty_array(arg("inputDigests")) {
        record.insert(
            "inputDigests".into(),
            arg("inputDigests").cloned().unwrap_or(Value::Null),
        );
    }
    if let Some(v) = arg("claimSha256").filter(|v| truthy(Some(v))) {
        record.insert("claimSha256".into(), v.clone());
    }
    record.insert(
        "settleReports".into(),
        or_else(arg("settleReports"), json!([])),
    );
    if let Some(v) = arg("reportDeclaration").filter(|v| truthy(Some(v))) {
        record.insert("reportDeclaration".into(), v.clone());
    }
    record.insert("classification".into(), classification);

    let mut runtime_out = Map::new();
    runtime_out.insert("exitCode".into(), exit_json);
    for key in ["stdoutLog", "stderrLog", "settledAt"] {
        if let Some(v) = rt(key).filter(|v| truthy(Some(v))) {
            runtime_out.insert(key.into(), v.clone());
        }
    }
    record.insert("runtime".into(), Value::Object(runtime_out));
    if let Some(claim) = agent_claim {
        record.insert("agentClaim".into(), claim.clone());
    }
    let note = match arg("runnerNote").filter(|v| truthy(Some(v))) {
        Some(Value::String(text)) => json!({"summary": text}),
        Some(other) => other.clone(),
        None => {
            // A message-less error leaves the summary out, as an undefined summary dropped out of the JSON.
            let summary: Option<Value> = if claim_invalid {
                Some(json!(
                    "agent-result.json was present but failed schema validation"
                ))
            } else if let Some(error) = execution_error {
                get(error, "message").cloned()
            } else if is_timeout {
                Some(json!("Execution timed out"))
            } else {
                Some(json!("Settled"))
            };
            let mut map = Map::new();
            if let Some(s) = summary {
                map.insert("summary".into(), s);
            }
            Value::Object(map)
        }
    };
    record.insert("runnerNote".into(), note);
    record.insert("usage".into(), or_else(arg("usage"), Value::Null));
    if non_empty_array(arg("warnings")) {
        record.insert(
            "warnings".into(),
            arg("warnings").cloned().unwrap_or(Value::Null),
        );
    }

    let mut evidence: Map<String, Value> = evidence_in
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    evidence.insert("gitBefore".into(), or_else(ev("gitBefore"), Value::Null));
    evidence.insert("gitAfter".into(), or_else(ev("gitAfter"), Value::Null));
    evidence.insert(
        "gitBeforeSource".into(),
        or_else(ev("gitBeforeSource"), json!("pre-launch")),
    );
    for key in [
        "changedFiles",
        "mutatedDirtyBeforeFiles",
        "artifacts",
        "tests",
    ] {
        evidence.insert(key.into(), or_else(ev(key), json!([])));
    }
    if let Some(v) = ev("attribution").filter(|v| truthy(Some(v))) {
        evidence.insert("attribution".into(), v.clone());
    }
    if let Some(v) = ev("findingRefs").filter(|v| truthy(Some(v))) {
        evidence.insert("findingRefs".into(), v.clone());
    } else if let Some(v) = claim_field(&["evidenceRefs"]).filter(|v| truthy(Some(v))) {
        evidence.insert("findingRefs".into(), v.clone());
    }
    record.insert("evidence".into(), Value::Object(evidence));
    Value::Object(record)
}
