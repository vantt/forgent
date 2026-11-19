//! The closed shape of a confinement request. It judges a request however it arrived, so a request built without
//! the config loader is held to the same rules; a policy and an override are canonicalised in place.

use serde_json::Value;

use super::error::RequestError;
use super::js::{at, display, get, is_object, non_blank};
use super::launch_context::validate_assignment_launch_context;
use crate::confinement::policy::{
    validate_confinement_policy_shape, validate_override_confinement_shape,
};
use fgos_execution::runner_check::credential_store_problem;

const REQUIREMENT_MODES: [&str; 3] = ["unconfined", "preferred", "required"];

const ALLOWED_KEYS: [&str; 19] = [
    "contract",
    "dispatchId",
    "capability",
    "stageSkill",
    "executorId",
    "invocation",
    "context",
    "requirement",
    "override",
    "resourceNeeds",
    "backendId",
    "authorityScope",
    "assignmentLaunchContext",
    "providerCapacity",
    "attemptId",
    "launchMode",
    "gateCommand",
    "attemptBinds",
    "requestSocket",
];

fn must_be(what: &str, ok: bool) -> Result<(), RequestError> {
    if ok {
        Ok(())
    } else {
        Err(RequestError::plain(format!("ConfinementRequest {what}")))
    }
}

/// Validates a request (`confinement-request.v1`). A malformed request is refused, never read leniently.
pub fn validate_confinement_request(request: &mut Value) -> Result<(), RequestError> {
    if !is_object(Some(request)) {
        return Err(RequestError::plain("ConfinementRequest must be an object."));
    }
    if let Some(key) = request
        .as_object()
        .into_iter()
        .flat_map(|o| o.keys())
        .find(|key| !ALLOWED_KEYS.contains(&key.as_str()))
    {
        return Err(RequestError::plain(format!(
            "ConfinementRequest contains unknown key \"{key}\"."
        )));
    }
    let contract = get(request, "contract");
    if contract.and_then(Value::as_str) != Some("confinement-request.v1") {
        return Err(RequestError::plain(format!(
            "ConfinementRequest contract must be \"confinement-request.v1\", got \"{}\".",
            display(contract)
        )));
    }
    let text = |key: &str| matches!(get(request, key), Some(Value::String(s)) if !s.is_empty());
    must_be("dispatchId must be a non-empty string.", text("dispatchId"))?;
    must_be("capability must be a non-empty string.", text("capability"))?;
    if let Some(skill) = get(request, "stageSkill") {
        must_be(
            "stageSkill must be a non-empty string when present.",
            matches!(skill, Value::String(s) if !s.is_empty()),
        )?;
    }
    must_be("executorId must be a non-empty string.", text("executorId"))?;
    let invocation = get(request, "invocation");
    must_be("invocation must be an object.", is_object(invocation))?;
    if let Some(store) = invocation.and_then(|i| get(i, "credentialStore")) {
        if let Some(problem) = credential_store_problem(store) {
            return Err(RequestError::plain(format!(
                "ConfinementRequest invocation.credentialStore {problem}."
            )));
        }
    }
    let context = get(request, "context");
    must_be("context must be an object.", is_object(context))?;
    let context = context.unwrap_or(&Value::Null);
    must_be(
        "context.cwd must be a non-empty string.",
        matches!(get(context, "cwd"), Some(Value::String(s)) if !s.is_empty()),
    )?;
    must_be(
        "context.runDir must be a non-empty string.",
        non_blank(get(context, "runDir")),
    )?;
    let requirement = get(request, "requirement");
    must_be("requirement must be an object.", is_object(requirement))?;
    let requirement = requirement.unwrap_or(&Value::Null);
    let mode = get(requirement, "mode");
    if !mode
        .and_then(Value::as_str)
        .is_some_and(|m| REQUIREMENT_MODES.contains(&m))
    {
        return Err(RequestError::plain(format!(
            "ConfinementRequest requirement.mode must be one of \"unconfined\", \"preferred\", \"required\", got \"{}\".",
            display(mode)
        )));
    }
    let mode = mode.and_then(Value::as_str).unwrap_or_default().to_string();
    let is_null = |key: &str| matches!(get(requirement, key), Some(Value::Null));
    if mode == "unconfined" && !(is_null("policyId") && is_null("policy")) {
        return Err(RequestError::plain(
            "ConfinementRequest unconfined requirement must set policyId and policy to null.",
        ));
    }
    // Requests can reach the authority without the config loader. An invalid control is a malformed request, not
    // "unknown" coverage that could accidentally be executed.
    let has_policy = !matches!(
        at(request, &["requirement", "policy"]),
        None | Some(Value::Null)
    );
    if has_policy {
        let policy = request
            .get_mut("requirement")
            .and_then(|r| r.get_mut("policy"))
            .expect("the policy is present");
        validate_confinement_policy_shape(policy, "ConfinementRequest requirement.policy", false)?;
    }
    let base_policy = at(request, &["requirement", "policy"])
        .filter(|p| !p.is_null())
        .cloned();
    if !matches!(get(request, "override"), None | Some(Value::Null)) {
        let over = request
            .get_mut("override")
            .expect("the override is present");
        validate_override_confinement_shape(
            over,
            base_policy.as_ref(),
            "ConfinementRequest override",
            &mode,
        )?;
    }
    if let Some(launch) = get(request, "assignmentLaunchContext").filter(|l| !l.is_null()) {
        validate_assignment_launch_context(launch, get(request, "context"))?;
    }
    Ok(())
}
