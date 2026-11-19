//! The effective execution contract: the secret-free statement of what one run is allowed and obliged to do,
//! persisted before the worker launches and summarised into its brief.
//!
//! It records the assignment and run ids, the mutation, the workspace and write scope, the main checkout, the
//! executor and adapter, the limits, the result claim path and the permission posture, honest about requested versus
//! enforced (a shell restriction is never called enforced; the filesystem is enforced only when a confinement
//! requirement and a real backend say so). It holds no secret and no raw environment value, and links to the
//! dispatch plan and the resolved config by digest.
//!
//! Digest bytes: the hashes cover canonical JSON (RFC 8785) of the secret-stripped plan and config, written by
//! `fgos-canonical-json`, the one door. The Node file that wrote the same bytes kept a private serialiser only
//! because its live inputs could hold `undefined` members, which a JSON value cannot; for every JSON value the two
//! agree, and the vectors pin it.
//!
//! Golden vectors: `packages/execution/contracts/execution-contract/effective.json`.

use std::fs;
use std::path::{Path, PathBuf};

use fgos_canonical_json::canonical_json;
use serde_json::{json, Map, Value};
use sha2::{Digest, Sha256};

use super::validate::{resolve_mutating_cwd_posture, CheckoutFacts, MutatingCwdPosture};
use crate::assignment::builder::is_read_only_assignment;
use crate::assignment::{js_space, truthy, Refusal};
use crate::confinement::driver::js::{at, display, resolve_cwd};
use crate::confinement::policy::DEFAULT_SEAT_TIMEOUT_MS;
use crate::run_result::claim::{
    AGENT_RESULT_CLAIM_CONTRACT_ID, AGENT_RESULT_CLAIM_CONTRACT_VERSION,
};

pub const EFFECTIVE_EXECUTION_CONTRACT_ID: &str = "effective-execution-contract";
pub const EFFECTIVE_EXECUTION_CONTRACT_VERSION: u64 = 1;
pub const EFFECTIVE_EXECUTION_CONTRACT_FILE: &str = "effective-execution-contract.json";

fn fail(reason: impl AsRef<str>) -> Refusal {
    Refusal::new(format!("effective-execution-contract: {}", reason.as_ref()))
}

// ---- digests and secrets -----------------------------------------------------------------------------------------

/// The canonical JSON text of a value.
pub fn canonical_json_text(value: &Value) -> String {
    canonical_json(value).expect("a JSON value holds only finite numbers")
}

/// `sha256:<hex>` of a string as it is, or of the canonical JSON of any other value.
pub fn compute_sha256_digest(value: &Value) -> String {
    let text = match value {
        Value::String(text) => text.clone(),
        other => canonical_json_text(other),
    };
    let hash = Sha256::digest(text.as_bytes());
    format!(
        "sha256:{}",
        hash.iter().map(|b| format!("{b:02x}")).collect::<String>()
    )
}

fn is_word(c: char) -> bool {
    c.is_ascii_alphanumeric() || c == '_'
}

/// `/token|secret|password|credential|apiKey|privateKey|auth(?!entication|orization\b)|cookie/i`: the key names that
/// hold a secret. (`authentication` and the word `authorization` are not secrets; `authorizationId` is.)
pub fn is_secret_key(key: &str) -> bool {
    let key = key.to_lowercase();
    if [
        "token",
        "secret",
        "password",
        "credential",
        "apikey",
        "privatekey",
        "cookie",
    ]
    .iter()
    .any(|needle| key.contains(needle))
    {
        return true;
    }
    key.match_indices("auth").any(|(at, _)| {
        let rest = &key[at + "auth".len()..];
        if rest.starts_with("entication") {
            return false;
        }
        match rest.strip_prefix("orization") {
            Some(after) => after.chars().next().is_some_and(is_word),
            None => true,
        }
    })
}

fn is_secret_entry(key: &str, value: &Value) -> bool {
    !(key == "credentialProvisioned" && value.is_boolean()) && is_secret_key(key)
}

/// A copy of `value` without any potential secret, credential or raw environment.
pub fn strip_secrets(value: &Value) -> Value {
    match value {
        Value::Array(items) => Value::Array(items.iter().map(strip_secrets).collect()),
        Value::Object(map) => {
            let mut clean = Map::new();
            for (key, val) in map {
                if key == "credentialProvisioned" && val.is_boolean() {
                    clean.insert(key.clone(), val.clone());
                    continue;
                }
                if is_secret_entry(key, val)
                    || matches!(key.as_str(), "env" | "environment" | "headers")
                {
                    continue;
                }
                clean.insert(key.clone(), strip_secrets(val));
            }
            Value::Object(clean)
        }
        other => other.clone(),
    }
}

/// Refuses a value that holds a secret key anywhere inside.
pub fn assert_no_secrets(value: &Value, path: &str) -> Result<(), Refusal> {
    match value {
        Value::Array(items) => {
            for (index, item) in items.iter().enumerate() {
                assert_no_secrets(item, &format!("{path}[{index}]"))?;
            }
        }
        Value::Object(map) => {
            for (key, val) in map {
                let current = if path.is_empty() {
                    key.clone()
                } else {
                    format!("{path}.{key}")
                };
                if key == "credentialProvisioned" && val.is_boolean() {
                    continue;
                }
                if is_secret_key(key) {
                    return Err(fail(format!(
                        "prohibited secret field \"{current}\" detected in effective contract"
                    )));
                }
                assert_no_secrets(val, &current)?;
            }
        }
        _ => {}
    }
    Ok(())
}

// ---- building ----------------------------------------------------------------------------------------------------

fn get<'a>(value: &'a Value, key: &str) -> Option<&'a Value> {
    value.as_object().and_then(|o| o.get(key))
}

/// A present, non-null value (what `??` keeps).
fn kept(value: Option<&Value>) -> Option<&Value> {
    value.filter(|v| !v.is_null())
}

/// A non-empty string (the `!x || typeof x !== 'string'` guard).
fn guard_string(value: Option<&Value>) -> Option<&str> {
    value.and_then(Value::as_str).filter(|s| !s.is_empty())
}

fn positive_integer(value: Option<&Value>) -> Option<Value> {
    let n = value?
        .as_f64()
        .filter(|f| f.is_finite() && f.fract() == 0.0 && *f > 0.0)?;
    Some(json!(n as u64))
}

fn text_of(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

/// Builds the effective execution contract from a call's parameters (the keys the Node builder took:
/// `assignment`, `dispatchPlan`, `runId`, `runDir`, `cwd`, `repoRoot`, `runnerConfig`, `timeoutMs`,
/// `sessionWallTimeExpiresAt`, `executorId`, `adapter`, `confinement`, `providerCapacity`, `resultClaimPath`,
/// `templateProvenance`), reading the checkout of the working directory through `facts`, and validates it.
///
/// `process_cwd` is the working directory the call defaults to when neither the call nor the plan names one.
pub fn build_effective_execution_contract(
    params: &Value,
    facts: &dyn CheckoutFacts,
    process_cwd: &Path,
) -> Result<Value, Refusal> {
    let param = |key: &str| kept(get(params, key));
    let assignment = param("assignment").filter(|a| a.is_object() || a.is_array());
    let Some(assignment) = assignment else {
        return Err(fail("assignment must be a non-null object"));
    };
    let Some(assignment_id) = guard_string(get(assignment, "assignmentId")) else {
        return Err(fail("assignment.assignmentId must be a non-empty string"));
    };

    let mutation = match get(assignment, "mutation").filter(|m| truthy(Some(m))) {
        Some(declared) => declared.clone(),
        None if is_read_only_assignment(assignment) => json!("read-only"),
        None => json!("mutating"),
    };
    let effective_mutation = match mutation.as_str() {
        Some(m @ ("read-only" | "mutating")) => m.to_string(),
        _ => {
            return Err(fail(format!(
                "mutation must be \"read-only\" or \"mutating\", got {mutation}"
            )))
        }
    };

    let Some(run_id) = guard_string(param("runId")) else {
        return Err(fail("runId must be a non-empty string"));
    };
    let Some(run_dir) = guard_string(param("runDir")) else {
        return Err(fail("runDir must be a non-empty string"));
    };

    let plan = param("dispatchPlan").filter(|p| p.is_object() || p.is_array());
    let Some(plan) = plan else {
        return Err(fail("dispatchPlan must be a non-null object"));
    };
    if kept(get(plan, "mechanism")).is_none() {
        return Err(fail("dispatchPlan.mechanism is required"));
    }

    let Some(executor_id) =
        guard_string(param("executorId").or_else(|| kept(get(plan, "executorId"))))
    else {
        return Err(fail("executorId must be a non-empty string"));
    };
    let adapter_value = param("adapter").or_else(|| kept(at(plan, &["invocation", "adapter"])));
    let Some(adapter) = guard_string(adapter_value) else {
        return Err(fail(
            "adapter must be a non-empty string (from dispatchPlan.invocation.adapter or parameter)",
        ));
    };

    let cwd_value = param("cwd")
        .or_else(|| kept(at(plan, &["invocation", "cwd"])))
        .or_else(|| kept(get(plan, "cwd")));
    let abs_cwd = match cwd_value {
        Some(value) => resolve_cwd(&display(Some(value))),
        None => resolve_cwd(&text_of(process_cwd)),
    };

    let (workspace_posture, main_checkout_root) =
        match resolve_mutating_cwd_posture(facts, &abs_cwd) {
            MutatingCwdPosture::Ok {
                main_checkout_root, ..
            } => ("worktree", Some(main_checkout_root)),
            MutatingCwdPosture::MainCheckout { repo_root } => ("main-checkout", Some(repo_root)),
            MutatingCwdPosture::OutsideGit => ("outside-git", None),
            MutatingCwdPosture::Unresolvable { .. } => (
                "unresolvable",
                param("repoRoot")
                    .and_then(Value::as_str)
                    .filter(|s| !s.is_empty())
                    .map(resolve_cwd),
            ),
        };

    let write_scope: Vec<String> = if effective_mutation == "read-only" {
        Vec::new()
    } else {
        vec![abs_cwd.clone()]
    };

    let runner_config = param("runnerConfig");
    let confinement = param("confinement")
        .or_else(|| kept(at(plan, &["policy", "confinement"])))
        .or_else(|| {
            let executors = runner_config.and_then(|c| get(c, "executors"))?;
            kept(at(executors, &[executor_id, "confinement"]))
        })
        .or_else(|| kept(runner_config.and_then(|c| at(c, &["executor", "confinement"]))));
    let requirement = confinement.and_then(|c| kept(get(c, "requirement")).or(Some(c)));
    let backend = confinement.and_then(|c| kept(get(c, "backend")));
    let is_enforced = requirement.is_some_and(|req| {
        truthy(Some(req))
            && get(req, "mode").and_then(Value::as_str) != Some("unconfined")
            && (truthy(get(req, "policyId"))
                || truthy(get(req, "controls"))
                || get(req, "mode").and_then(Value::as_str) == Some("required"))
            && backend.is_none_or(|b| {
                !truthy(Some(b))
                    || (get(b, "id").and_then(Value::as_str) != Some("none")
                        && get(b, "type").and_then(Value::as_str) != Some("none"))
            })
    });
    let shell_mode = if effective_mutation == "read-only" {
        "restricted"
    } else {
        "worktree-write"
    };
    let posture = if is_enforced {
        "enforced"
    } else {
        "instructed"
    };

    let timeout = positive_integer(param("timeoutMs"))
        .or_else(|| positive_integer(at(assignment, &["budget", "timeoutMs"])))
        .or_else(|| positive_integer(runner_config.and_then(|c| get(c, "timeoutMs"))))
        .unwrap_or_else(|| json!(DEFAULT_SEAT_TIMEOUT_MS));

    let abs_run_dir = resolve_cwd(run_dir);
    let claim_path = match param("resultClaimPath").filter(|p| truthy(Some(p))) {
        Some(path) => resolve_cwd(&display(Some(path))),
        None => text_of(
            &PathBuf::from(&abs_run_dir)
                .join("worker-output")
                .join("outbox")
                .join("result-1.json"),
        ),
    };

    let plan_hash = compute_sha256_digest(&strip_secrets(plan));
    let config_hash = runner_config
        .filter(|c| truthy(Some(c)))
        .map(|c| compute_sha256_digest(&strip_secrets(c)));

    let shell = json!({
        "mode": shell_mode, "enforced": false, "enforcement": "instructed", "allowedCommands": [],
    });
    let mut limits = Map::new();
    limits.insert("executorTimeoutMs".into(), timeout);
    if let Some(expires) = param("sessionWallTimeExpiresAt").filter(|e| truthy(Some(e))) {
        limits.insert("sessionWallTimeExpiresAt".into(), expires.clone());
    }
    let mut provenance = Map::new();
    provenance.insert("dispatchPlanHash".into(), json!(plan_hash));
    if let Some(hash) = config_hash {
        provenance.insert("configHash".into(), json!(hash));
    }
    provenance.insert("executorId".into(), json!(executor_id));
    provenance.insert("adapter".into(), json!(adapter));
    provenance.insert("adapterFamily".into(), json!(adapter));
    let template = param("templateProvenance")
        .filter(|t| truthy(Some(t)))
        .or_else(|| at(assignment, &["provenance", "template"]).filter(|t| truthy(Some(t))));
    if let Some(template) = template {
        provenance.insert("template".into(), template.clone());
    }

    let mut contract = Map::new();
    contract.insert(
        "contract".into(),
        json!({ "id": EFFECTIVE_EXECUTION_CONTRACT_ID, "version": EFFECTIVE_EXECUTION_CONTRACT_VERSION }),
    );
    contract.insert("assignmentId".into(), json!(assignment_id));
    contract.insert("runId".into(), json!(run_id));
    contract.insert("mutation".into(), json!(effective_mutation));
    contract.insert(
        "workspace".into(),
        json!({
            "cwd": abs_cwd, "writeScope": write_scope, "mainCheckout": main_checkout_root,
            "posture": workspace_posture,
        }),
    );
    contract.insert("tools".into(), json!({ "shell": shell }));
    contract.insert(
        "permissions".into(),
        json!({
            "posture": posture,
            "shell": shell,
            "filesystem": {
                "mode": if effective_mutation == "read-only" { "read-only" } else { "workspace-write" },
                "enforced": is_enforced, "enforcement": posture, "writeScope": write_scope,
            },
            "network": { "enforced": false, "enforcement": "instructed" },
        }),
    );
    contract.insert("limits".into(), Value::Object(limits));
    contract.insert(
        "resultClaim".into(),
        json!({
            "contract": {
                "id": AGENT_RESULT_CLAIM_CONTRACT_ID, "version": AGENT_RESULT_CLAIM_CONTRACT_VERSION,
            },
            "path": claim_path,
        }),
    );
    contract.insert("provenance".into(), Value::Object(provenance));
    if let Some(capacity) = param("providerCapacity").filter(|c| truthy(Some(c))) {
        contract.insert("providerCapacity".into(), strip_secrets(capacity));
    }
    contract.insert("enforcementPosture".into(), json!(posture));
    contract.insert("permissionEnforcementPosture".into(), json!(posture));
    contract.insert("executorId".into(), json!(executor_id));
    contract.insert("adapter".into(), json!(adapter));
    contract.insert("adapterFamily".into(), json!(adapter));

    let contract = Value::Object(contract);
    validate_effective_execution_contract(&contract)?;
    Ok(contract)
}

// ---- validating --------------------------------------------------------------------------------------------------

fn object_at<'a>(value: &'a Value, key: &str) -> Option<&'a Value> {
    get(value, key).filter(|v| v.is_object())
}

fn non_blank(value: Option<&Value>) -> bool {
    value
        .and_then(Value::as_str)
        .is_some_and(|s| !s.trim_matches(js_space).is_empty())
}

fn is_sha256_hex(value: Option<&Value>) -> bool {
    value.and_then(Value::as_str).is_some_and(|s| {
        s.strip_prefix("sha256:").is_some_and(|hex| {
            hex.len() == 64
                && hex
                    .bytes()
                    .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
        })
    })
}

/// Refuses a value that is not a v1 effective execution contract, or that holds a secret.
pub fn validate_effective_execution_contract(value: &Value) -> Result<(), Refusal> {
    if !value.is_object() {
        return Err(fail("contract must be a non-null object"));
    }
    assert_no_secrets(value, "")?;

    let Some(header) = object_at(value, "contract") else {
        return Err(fail("contract.contract must be an object"));
    };
    if get(header, "id").and_then(Value::as_str) != Some(EFFECTIVE_EXECUTION_CONTRACT_ID)
        || get(header, "version").and_then(Value::as_u64)
            != Some(EFFECTIVE_EXECUTION_CONTRACT_VERSION)
    {
        return Err(fail(format!(
            "contract must have id \"{EFFECTIVE_EXECUTION_CONTRACT_ID}\" and version {EFFECTIVE_EXECUTION_CONTRACT_VERSION}"
        )));
    }
    if !non_blank(get(value, "assignmentId")) {
        return Err(fail("assignmentId must be a non-empty string"));
    }
    if !non_blank(get(value, "runId")) {
        return Err(fail("runId must be a non-empty string"));
    }
    if !matches!(
        get(value, "mutation").and_then(Value::as_str),
        Some("read-only" | "mutating")
    ) {
        return Err(fail("mutation must be \"read-only\" or \"mutating\""));
    }

    let Some(workspace) = object_at(value, "workspace") else {
        return Err(fail("workspace must be a non-null object"));
    };
    if !non_blank(get(workspace, "cwd")) {
        return Err(fail("workspace.cwd must be a non-empty string"));
    }
    if !get(workspace, "writeScope").is_some_and(Value::is_array) {
        return Err(fail("workspace.writeScope must be an array"));
    }
    match get(workspace, "mainCheckout") {
        Some(Value::Null) => {}
        main if non_blank(main) => {}
        _ => {
            return Err(fail(
                "workspace.mainCheckout must be a non-empty string or null",
            ))
        }
    }

    let Some(tools) = object_at(value, "tools") else {
        return Err(fail("tools must be a non-null object"));
    };
    let Some(shell) = object_at(tools, "shell") else {
        return Err(fail("tools.shell must be a non-null object"));
    };
    if !get(shell, "enforced").is_some_and(Value::is_boolean) {
        return Err(fail("tools.shell.enforced must be a boolean"));
    }
    let Some(permissions) = object_at(value, "permissions") else {
        return Err(fail("permissions must be a non-null object"));
    };
    if !at(permissions, &["filesystem", "enforced"]).is_some_and(Value::is_boolean) {
        return Err(fail("permissions.filesystem.enforced must be a boolean"));
    }
    if !matches!(
        get(value, "enforcementPosture").and_then(Value::as_str),
        Some("enforced" | "instructed")
    ) {
        return Err(fail(
            "enforcementPosture must be \"enforced\" or \"instructed\"",
        ));
    }
    if !non_blank(get(value, "adapterFamily")) {
        return Err(fail("adapterFamily must be a non-empty string"));
    }

    let Some(limits) = object_at(value, "limits") else {
        return Err(fail("limits must be a non-null object"));
    };
    if positive_integer(get(limits, "executorTimeoutMs")).is_none() {
        return Err(fail("limits.executorTimeoutMs must be a positive integer"));
    }

    let Some(claim) = object_at(value, "resultClaim") else {
        return Err(fail("resultClaim must be a non-null object"));
    };
    let claim_contract = get(claim, "contract");
    if claim_contract
        .and_then(|c| get(c, "id"))
        .and_then(Value::as_str)
        != Some(AGENT_RESULT_CLAIM_CONTRACT_ID)
        || claim_contract
            .and_then(|c| get(c, "version"))
            .and_then(Value::as_u64)
            != Some(AGENT_RESULT_CLAIM_CONTRACT_VERSION)
    {
        return Err(fail(format!(
            "resultClaim.contract must be {{ id: \"{AGENT_RESULT_CLAIM_CONTRACT_ID}\", version: {AGENT_RESULT_CLAIM_CONTRACT_VERSION} }}"
        )));
    }
    if !non_blank(get(claim, "path")) {
        return Err(fail("resultClaim.path must be a non-empty string"));
    }

    let Some(provenance) = object_at(value, "provenance") else {
        return Err(fail("provenance must be a non-null object"));
    };
    if !get(provenance, "dispatchPlanHash")
        .and_then(Value::as_str)
        .is_some_and(|h| h.starts_with("sha256:"))
    {
        return Err(fail(
            "provenance.dispatchPlanHash must be a sha256 digest string",
        ));
    }
    if !non_blank(get(provenance, "executorId")) {
        return Err(fail("provenance.executorId must be a non-empty string"));
    }
    if !non_blank(get(provenance, "adapter")) {
        return Err(fail("provenance.adapter must be a non-empty string"));
    }
    if let Some(template) = get(provenance, "template") {
        validate_template_provenance(template)?;
    }
    if let Some(capacity) = get(value, "providerCapacity") {
        validate_provider_capacity(capacity)?;
    }
    Ok(())
}

fn validate_template_provenance(template: &Value) -> Result<(), Refusal> {
    if !template.is_object() {
        return Err(fail("provenance.template must be an object when present"));
    }
    if !non_blank(get(template, "id")) {
        return Err(fail("provenance.template.id must be a non-empty string"));
    }
    if !is_sha256_hex(get(template, "contentDigest")) {
        return Err(fail(
            "provenance.template.contentDigest must be a valid sha256 digest string",
        ));
    }
    if !is_sha256_hex(get(template, "renderedPromptDigest")) {
        return Err(fail(
            "provenance.template.renderedPromptDigest must be a valid sha256 digest string",
        ));
    }
    for key in ["tier", "source"] {
        if get(template, key).is_some() && !non_blank(get(template, key)) {
            return Err(fail(format!(
                "provenance.template.{key} must be a non-empty string when present"
            )));
        }
    }
    if let Some(path) = get(template, "filePath") {
        if !path.is_null() && !non_blank(Some(path)) {
            return Err(fail(
                "provenance.template.filePath must be a string or null when present",
            ));
        }
    }
    if let Some(snapshot) = get(template, "templateSnapshot") {
        if !non_blank(Some(snapshot)) {
            return Err(fail(
                "provenance.template.templateSnapshot must be a non-empty string when present",
            ));
        }
        let actual = compute_sha256_digest(snapshot);
        let expected = get(template, "contentDigest")
            .and_then(Value::as_str)
            .unwrap_or_default();
        if actual != expected {
            return Err(fail(format!(
                "provenance.template.templateSnapshot digest mismatch: expected \"{expected}\", computed \"{actual}\""
            )));
        }
    }
    Ok(())
}

fn validate_provider_capacity(capacity: &Value) -> Result<(), Refusal> {
    if !capacity.is_object() {
        return Err(fail("providerCapacity must be an object when present"));
    }
    for forbidden in [
        "credentialSource",
        "home",
        "env",
        "environment",
        "authJsonDigest",
        "sha256",
    ] {
        if get(capacity, forbidden).is_some() {
            return Err(fail(format!(
                "providerCapacity must not persist \"{forbidden}\""
            )));
        }
    }
    if !non_blank(get(capacity, "provider")) {
        return Err(fail(
            "providerCapacity.provider must be a non-empty string when present",
        ));
    }
    if !non_blank(get(capacity, "accountId")) {
        return Err(fail(
            "providerCapacity.accountId must be a non-empty string when present",
        ));
    }
    Ok(())
}

// ---- brief and disk ----------------------------------------------------------------------------------------------

/// A concise, stable, human-readable summary of a validated contract for the prompt and brief.
pub fn render_effective_contract_summary(contract: &Value) -> String {
    let field = |path: &[&str]| at(contract, path);
    let timeout = field(&["limits", "executorTimeoutMs"])
        .filter(|v| !v.is_null())
        .or_else(|| field(&["limits", "timeoutMs"]));
    let scope: Vec<String> = field(&["workspace", "writeScope"])
        .and_then(Value::as_array)
        .map(|items| items.iter().map(|i| display(Some(i))).collect())
        .unwrap_or_default();
    let scope = if scope.is_empty() {
        "none in the workspace (read-only); your result files are still required".to_string()
    } else {
        scope.join(", ")
    };
    let main = field(&["workspace", "mainCheckout"])
        .filter(|v| truthy(Some(v)))
        .map_or_else(|| "(none)".to_string(), |v| display(Some(v)));
    [
        "Effective execution contract:".to_string(),
        format!(
            "- Contract: {}.v{}",
            display(field(&["contract", "id"])),
            display(field(&["contract", "version"]))
        ),
        format!("- Mutation: {}", display(field(&["mutation"]))),
        format!("- Claim path: {}", display(field(&["resultClaim", "path"]))),
        format!("- Timeout: {}ms", display(timeout)),
        format!("- Write scope: {scope}"),
        format!("- Main checkout: {main}"),
        format!(
            "- Permission enforcement: {}",
            display(field(&["enforcementPosture"]))
        ),
    ]
    .join("\n")
}

/// Reads and validates the contract file of a run directory.
pub fn read_effective_execution_contract(run_dir: &Path) -> Result<Value, Refusal> {
    let path =
        PathBuf::from(resolve_cwd(&text_of(run_dir))).join(EFFECTIVE_EXECUTION_CONTRACT_FILE);
    if !path.exists() {
        return Err(Refusal::new(format!(
            "effective execution contract not found at {}",
            path.display()
        )));
    }
    let raw = fs::read_to_string(&path).map_err(|e| {
        Refusal::new(format!(
            "cannot read effective execution contract at {}: {e}",
            path.display()
        ))
    })?;
    let parsed: Value = serde_json::from_str(&raw).map_err(|e| {
        Refusal::new(format!(
            "invalid JSON in effective execution contract at {}: {e}",
            path.display()
        ))
    })?;
    validate_effective_execution_contract(&parsed)?;
    Ok(parsed)
}
