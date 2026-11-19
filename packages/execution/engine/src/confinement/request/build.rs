//! The canonical confinement request, built at the dispatch seam: after the executor is resolved and the run
//! directory allocated, before the adapter spawns. The requirement comes from the caller, else from the runner
//! config's capability declarations, else is "unconfined and omitted" (observed as unknown, never as enforced).

use serde_json::{json, Map, Value};

use super::error::RequestError;
use super::js::{at, coalesce, display, get, non_blank, truthy};
use super::shape::validate_confinement_request;
use crate::accounts::credential::provider_capacity_for_invocation;
use crate::confinement::policy::{
    normalize_legacy_confinement, resolve_confinement_policy, validate_capability_confinement_shape,
};
use fgos_execution::executor_model::{capability_confinement, credential_store_of};

/// What the build takes from the machine: the instant, and the random suffix of a minted dispatch id.
pub struct BuildClock<'a> {
    pub now_ms: &'a dyn Fn() -> u64,
    pub random_suffix: &'a dyn Fn() -> String,
}

/// The clock of a real dispatch: the wall clock's milliseconds and four random bytes from the kernel generator.
pub fn system_clock_parts() -> (u64, String) {
    let millis = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |d| d.as_millis() as u64);
    let bytes = fgos_identity::text::random_bytes::<4>().unwrap_or([0; 4]);
    (millis, bytes.iter().map(|b| format!("{b:02x}")).collect())
}

fn blind_refusal(code: &str, detail: &str) -> RequestError {
    RequestError::coded(code, format!("{code}: {detail}"))
}

fn text<'a>(value: &'a Value, key: &str) -> Option<&'a str> {
    get(value, key).and_then(Value::as_str)
}

/// `a || b` for strings: `a` when it is a non-empty string.
fn first_text<'a>(a: Option<&'a Value>, b: Option<&'a str>) -> Option<&'a str> {
    a.and_then(Value::as_str).filter(|s| !s.is_empty()).or(b)
}

/// The declaration of the capability's own row, when it holds one (a falsy declaration is none).
fn declared<'a>(cfg: Option<&'a Value>, capability: &str) -> Option<&'a Value> {
    capability_confinement(cfg?, capability).filter(|c| truthy(Some(c)))
}

/// The requirement a capability's declarations (own, stage skill, fallback anchor) give, or an omitted-unconfined one.
fn requirement_from_config(
    args: &Value,
    cap: &str,
    stage_skill: Option<&str>,
    invocation: &Value,
) -> Result<Value, RequestError> {
    let cfg = get(args, "cfg").filter(|c| !c.is_null());
    let fallback = first_text(
        get(args, "fallbackFrom"),
        first_text(get(args, "anchorCapability"), None),
    );
    let cap_confinement = declared(cfg, cap);
    let skill_confinement = stage_skill
        .filter(|skill| *skill != cap)
        .and_then(|skill| declared(cfg, skill));

    if let (Some(own), Some(skill_row)) = (cap_confinement, skill_confinement) {
        let skill = stage_skill.unwrap_or_default();
        validate_capability_confinement_shape(own, &format!("capabilities.{cap}.confinement"))?;
        validate_capability_confinement_shape(
            skill_row,
            &format!("capabilities.{skill}.confinement"),
        )?;
        let (cap_mode, skill_mode) = (get(own, "mode"), get(skill_row, "mode"));
        let (cap_policy, skill_policy) = (get(own, "policy"), get(skill_row, "policy"));
        if cap_mode != skill_mode || cap_policy != skill_policy {
            let named = |policy: Option<&Value>| match policy {
                None | Some(Value::Null) => "none".to_string(),
                other => display(other),
            };
            return Err(RequestError::plain(format!(
                "ambiguous confinement policies between capability \"{cap}\" ({}:{}) and stage skill \"{skill}\" ({}:{}).",
                display(cap_mode),
                named(cap_policy),
                display(skill_mode),
                named(skill_policy),
            )));
        }
    }

    let mut active = cap_confinement.or(skill_confinement);
    let mut anchor: Option<&str> = if cap_confinement.is_some() {
        Some(cap)
    } else if skill_confinement.is_some() {
        stage_skill
    } else {
        None
    };
    // A capability fallback carries the confinement of the anchor it fell back from.
    let fallback_confinement = fallback.and_then(|name| declared(cfg, name));
    if active.is_none() {
        if let Some(row) = fallback_confinement {
            active = Some(row);
            anchor = fallback;
        }
    }
    let anchor_value = anchor.map_or(Value::Null, |a| json!(a));

    if let Some(row) = active {
        validate_capability_confinement_shape(
            row,
            &format!("capabilities.{}.confinement", anchor.unwrap_or("null")),
        )?;
        let mode = get(row, "mode").cloned().unwrap_or(Value::Null);
        if mode.as_str() == Some("unconfined") {
            return Ok(
                json!({ "mode": "unconfined", "policyId": null, "policy": null, "anchor": anchor_value }),
            );
        }
        let policy_ref = get(row, "policy");
        let custom = cfg.and_then(|c| get(c, "confinementPolicies"));
        let policy = policy_ref
            .and_then(Value::as_str)
            .and_then(|id| resolve_confinement_policy(id, custom));
        let Some(policy) = policy else {
            return Err(RequestError::plain(format!(
                "runner config policy \"{}\" is unknown (neither built-in nor declared in confinementPolicies).",
                display(policy_ref)
            )));
        };
        return Ok(json!({
            "mode": mode,
            "policyId": policy_ref.cloned().unwrap_or(Value::Null),
            "policy": policy,
            "anchor": anchor_value,
        }));
    }

    // Strict mode means every capability declares its confinement; a label (no row) declares none.
    if cfg.and_then(|c| at(c, &["confinement", "strict"])) == Some(&Value::Bool(true)) {
        return Err(RequestError::plain(format!(
            "strict mode: capability \"{cap}\" has no runner.capabilities row of its own declaring confinement (an alias of a row does not count; name the row) (confinement-policy-missing)."
        )));
    }
    let legacy = get(invocation, "confinement")
        .filter(|c| truthy(Some(c)))
        .and_then(normalize_legacy_confinement);
    let mut requirement = json!({
        "mode": "unconfined", "policyId": null, "policy": null, "omitted": true, "anchor": anchor_value,
    });
    if let Some(legacy) = legacy {
        requirement["legacy"] = legacy;
    }
    Ok(requirement)
}

/// The invocation as the request carries it: what the launch runs and the declared login store, with fields the
/// caller did not set left out.
fn request_invocation(invocation: &Value) -> Value {
    let mut out = Map::new();
    let copy = |out: &mut Map<String, Value>, key: &str| {
        if let Some(value) = get(invocation, key) {
            out.insert(key.to_string(), value.clone());
        }
    };
    for key in ["command", "args", "argsTemplate", "prompt"] {
        copy(&mut out, key);
    }
    let env = get(invocation, "env").filter(|e| truthy(Some(e)));
    out.insert("env".into(), env.cloned().unwrap_or_else(|| json!({})));
    for key in [
        "liveOutput",
        "interactiveMode",
        "promptDelivery",
        "permissionMode",
    ] {
        copy(&mut out, key);
    }
    if let Some(confinement) = get(invocation, "confinement") {
        let normalized = truthy(Some(confinement))
            .then(|| normalize_legacy_confinement(confinement))
            .flatten();
        out.insert(
            "confinement".into(),
            normalized.unwrap_or_else(|| confinement.clone()),
        );
    }
    let adapter = first_text(get(invocation, "adapter"), Some("cli-spawn")).unwrap_or("cli-spawn");
    out.insert("adapter".into(), json!(adapter));
    // The login store the launch declares: the driver hands that store's files to the private home and points
    // `homeEnv` at it. Absent when it reads none.
    if let Some(store) = credential_store_of(invocation).filter(|s| truthy(Some(s))) {
        out.insert("credentialStore".into(), store.clone());
    }
    if truthy(get(invocation, "method")) || truthy(get(invocation, "url")) {
        for key in ["method", "url", "headers", "body"] {
            copy(&mut out, key);
        }
    }
    if truthy(get(invocation, "transport")) {
        copy(&mut out, "transport");
    }
    for key in ["providerKindOnly", "workerCommandSeam"] {
        copy(&mut out, key);
    }
    Value::Object(out)
}

/// The request's `context`: the caller's fields, `cwd` defaulting to the process's, and the context refs only for
/// a blind dispatch.
fn request_context(context: &Value, blind: bool) -> Value {
    let mut out = Map::new();
    let cwd = first_text(get(context, "cwd"), None)
        .map(String::from)
        .or_else(|| {
            std::env::current_dir()
                .ok()
                .map(|p| p.to_string_lossy().into_owned())
        });
    if let Some(cwd) = cwd {
        out.insert("cwd".into(), json!(cwd));
    }
    for key in [
        "repoRoot",
        "runDir",
        "fgosDir",
        "timeoutMs",
        "idleTimeoutMs",
        "maxBuffer",
        "workId",
        "tier",
        "model",
        "herdrBin",
        "transportDeadlines",
        "closeAlways",
        "dispatchBatchKey",
        "effectiveContract",
    ] {
        if let Some(value) = get(context, key) {
            out.insert(key.to_string(), value.clone());
        }
    }
    if blind {
        if let Some(refs @ Value::Array(_)) = get(context, "contextRefs") {
            out.insert("contextRefs".into(), refs.clone());
        }
    }
    Value::Object(out)
}

/// The executor's registered confinement (`cfg.executors[execId].confinement`).
fn registered_confinement<'a>(cfg: Option<&'a Value>, exec_id: &str) -> Option<&'a Value> {
    cfg.and_then(|c| at(c, &["executors", exec_id, "confinement"]))
}

/// Builds and validates a `confinement-request.v1` from the dispatch seam's arguments (`args` is the object the Node
/// original took: `capability`, `stageSkill`, `executorId`, `invocation`, `context`, `cfg`, `requirement`, `blind`, ...).
pub fn build_confinement_request(
    args: &Value,
    clock: &BuildClock<'_>,
) -> Result<Value, RequestError> {
    let cfg = get(args, "cfg").filter(|c| !c.is_null());
    let empty = json!({});
    let invocation = match get(args, "invocation") {
        None => &empty,
        Some(other) => other,
    };
    let context = match get(args, "context") {
        None => &empty,
        Some(other) => other,
    };
    let stage_skill = first_text(get(args, "stageSkill"), None);
    let executor = first_text(get(args, "executorId"), None);
    let cap = first_text(get(args, "capability"), executor).unwrap_or("(unknown-capability)");
    let exec_id = executor.unwrap_or(cap);

    if !non_blank(get(context, "runDir")) {
        return Err(RequestError::plain(
            "ConfinementRequest context.runDir must be a non-empty string.",
        ));
    }

    let given = get(args, "requirement").filter(|r| truthy(Some(r)));
    let requirement = match given {
        Some(req) if req.get("mode").and_then(Value::as_str) == Some("unconfined") => {
            let mut merged = Map::new();
            merged.insert("policyId".into(), Value::Null);
            merged.insert("policy".into(), Value::Null);
            if let Some(fields) = req.as_object() {
                merged.extend(fields.clone());
            }
            Value::Object(merged)
        }
        Some(req) => req.clone(),
        None => requirement_from_config(args, cap, stage_skill, invocation)?,
    };

    // A blind dispatch is never run unblind: it needs a required policy, and a live sandbox around the worker
    // (an in-process agent has none).
    let blind = truthy(get(args, "blind"));
    if blind {
        if text(args, "authorityScope") == Some("external-harness") {
            return Err(blind_refusal(
                "blind-in-process",
                "a blind dispatch cannot run in-process: no sandbox wraps an in-process agent.",
            ));
        }
        let mode = requirement.get("mode");
        let has_policy = truthy(requirement.get("policy"));
        if mode.and_then(Value::as_str) != Some("required") || !has_policy {
            return Err(blind_refusal(
                "blind-requires-confinement",
                &format!(
                    "a blind dispatch needs required confinement with a policy, got mode \"{}\".",
                    mode.map_or("none".to_string(), |m| display(Some(m)))
                ),
            ));
        }
    }
    let given_override = get(args, "override");
    let fallback_override = || -> Option<&Value> {
        coalesce(
            given_override,
            coalesce(
                at(invocation, &["confinement", "override"]),
                registered_confinement(cfg, exec_id).and_then(|c| get(c, "override")),
            ),
        )
    };
    let blind_override = blind.then(|| {
        let mut over = match fallback_override() {
            Some(Value::Object(fields)) => fields.clone(),
            _ => Map::new(),
        };
        let mut controls = match over.get("controls") {
            Some(Value::Object(fields)) => fields.clone(),
            _ => Map::new(),
        };
        // deny is stricter than blind and stays as it is; the driver names it unsupported.
        if controls.get("hostRead").and_then(Value::as_str) != Some("deny") {
            controls.insert("hostRead".into(), json!("blind"));
        }
        over.insert("controls".into(), Value::Object(controls));
        Value::Object(over)
    });

    let id = match first_text(get(args, "dispatchId"), None) {
        Some(id) => id.to_string(),
        None => format!("disp_{}_{}", (clock.now_ms)(), (clock.random_suffix)()),
    };

    let mut req = Map::new();
    req.insert("contract".into(), json!("confinement-request.v1"));
    req.insert("dispatchId".into(), json!(id));
    req.insert("capability".into(), json!(cap));
    if let Some(skill) = stage_skill {
        req.insert("stageSkill".into(), json!(skill));
    }
    req.insert("executorId".into(), json!(exec_id));
    req.insert("invocation".into(), request_invocation(invocation));
    req.insert("context".into(), request_context(context, blind));
    req.insert("requirement".into(), requirement);
    let override_value = blind_override
        .as_ref()
        .or_else(|| fallback_override().filter(|o| !o.is_null()));
    if let Some(over) = override_value {
        req.insert("override".into(), over.clone());
    }
    let needs = match get(args, "resourceNeeds") {
        Some(list @ Value::Array(_)) => list.clone(),
        _ => json!([]),
    };
    req.insert("resourceNeeds".into(), needs);
    // Invocation data is untrusted at this boundary. Backend selection belongs to the trusted executor
    // registration (or an explicit caller argument).
    let backend = coalesce(
        get(args, "backendId"),
        registered_confinement(cfg, exec_id).and_then(|c| get(c, "backend")),
    );
    req.insert("backendId".into(), backend.cloned().unwrap_or(Value::Null));
    for key in ["authorityScope", "assignmentLaunchContext"] {
        if let Some(value) = get(args, key).filter(|v| truthy(Some(v))) {
            req.insert(key.to_string(), value.clone());
        }
    }
    // A supervised attempt: the driver names the gate as the command the sandbox runs and returns the prefix and
    // the agent argv instead of a worker command line.
    if let Some(attempt) = get(args, "attemptId").filter(|v| truthy(Some(v))) {
        req.insert("attemptId".into(), attempt.clone());
        let mode = coalesce(get(args, "launchMode"), None).cloned();
        req.insert("launchMode".into(), mode.unwrap_or_else(|| json!("direct")));
        for key in ["gateCommand", "attemptBinds"] {
            if let Some(list @ Value::Array(_)) = get(args, key) {
                req.insert(key.to_string(), list.clone());
            }
        }
        if let Some(socket) = get(args, "requestSocket")
            .and_then(Value::as_str)
            .filter(|s| !s.is_empty())
        {
            req.insert("requestSocket".into(), json!(socket));
        }
    }
    // The account leased for this launch hands over the login store of the CLI this invocation runs (an account
    // may keep one per CLI); private-home provisioning, write-back and trust seeding read it.
    if let Some(capacity) = get(args, "providerCapacity").filter(|v| truthy(Some(v))) {
        req.insert(
            "providerCapacity".into(),
            provider_capacity_for_invocation(capacity, invocation),
        );
    }

    let mut request = Value::Object(req);
    validate_confinement_request(&mut request)?;
    Ok(request)
}
