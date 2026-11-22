//! The effective dispatch policy of an assignment: the executor and provider it runs on, the tier and the model of
//! that tier's cell, the persona, the visibility, the repeat mode, the constraints and the governance verdict, each
//! with where it came from.
//!
//! Nothing here chooses an executor, a tier or a model. A caller that already bound the seat passes the `binding`:
//! its executor, tier, model and effort are taken as given, each carrying the source Seat Binding recorded for it,
//! never relabelled. Every other caller gets Seat Binding's answer through the bind facade (the same call a unit
//! run makes): a pinned executor, tier or effort is an override it judges, and the model is the one it names. With
//! no runner config and no binding the policy is refused (`runner-config-missing`). Rigor is recorded as the demand
//! it is (checker count, independence) and never moves the tier or the effort.

use crate::bind::{effective_rigor, EFFORTS};
use crate::decide::{BindFailure, DecideFailure, SeatBinder, WorkSeatAsk};
use crate::executor_model::{
    resolve_executor_governance, resolve_executor_provider, Governance, ModelError,
};
use crate::js::truthy;
use crate::seat_resolver::{RIGORS, SEAT_ROLES};
use fgos_seat_binding::Tier;
use serde_json::{json, Map, Value};

const REPEAT_MODES: [&str; 2] = ["pre-delivery", "post-delivery"];
const TIER_PROVENANCE_SCOPES: [&str; 4] = ["actor", "assignment", "cli", "cliOverride"];

fn refuse(message: String) -> DecideFailure {
    DecideFailure::Refused(ModelError::runner(message))
}

fn refuse_coded(message: String, code: &'static str) -> DecideFailure {
    DecideFailure::Refused(ModelError::coded(code, message))
}

/// `a ?? b ?? c`: the first operand that is neither absent nor null, else the last operand as it stands.
fn first_set<'a>(operands: &[Option<&'a Value>]) -> Option<&'a Value> {
    operands
        .iter()
        .flatten()
        .find(|v| !v.is_null())
        .copied()
        .or_else(|| operands.last().copied().flatten())
}

fn set(value: Option<&Value>) -> Option<&Value> {
    value.filter(|v| !v.is_null())
}

fn text(value: Option<&Value>) -> String {
    crate::js::text(value)
}

/// Read-only or mutating, from the `mutation` stamped once at build time.
pub fn is_read_only_assignment(assignment: &Value) -> bool {
    assignment.is_object()
        && assignment.get("mutation").and_then(Value::as_str) == Some("read-only")
}

/// The source Seat Binding recorded for one field of a bound seat, carried over as it is.
fn binding_source(binding: &Value, field: &str) -> Value {
    match binding.pointer(&format!("/provenance/{field}/source")) {
        None => json!({ "scope": "seat-binding" }),
        Some(id) => json!({ "scope": "seat-binding", "id": id }),
    }
}

/// What a launch pins: the bound seat's executor, invocation, pool, account and model; a launch with no binding
/// (the account probe) pins what its dispatch-door override names.
pub fn launch_pin_of(binding: Option<&Value>, cli_override: Option<&Value>) -> Value {
    let from = |value: Option<&Value>, key: &str| -> Option<Value> {
        value
            .and_then(|v| v.get(key))
            .filter(|v| !v.is_null())
            .cloned()
    };
    let pick = |binding_key: &str, override_key: &str| {
        from(binding, binding_key).or_else(|| from(cli_override, override_key))
    };
    let lease_account = from(binding, "leaseAccount")
        .or_else(|| cli_override.and_then(|o| o.get("leaseAccount")).cloned());
    let digest = if truthy(binding.and_then(|b| b.get("leaseAccount"))) {
        from(binding, "bindingInput").and_then(|i| i.get("accountViewDigest").cloned())
    } else {
        from(cli_override, "accountViewDigest")
    }
    .unwrap_or(Value::Null);
    let mut out = Map::new();
    if let Some(v) = pick("executor", "preferExecutor") {
        out.insert("executor".into(), v);
    }
    if let Some(v) = pick("invocation", "preferInvocation") {
        out.insert("invocation".into(), v);
    }
    if let Some(v) = pick("pool", "pool") {
        out.insert("pool".into(), v);
    }
    if let Some(v) = lease_account {
        out.insert("leaseAccount".into(), v);
    }
    out.insert("accountViewDigest".into(), digest);
    if let Some(v) = pick("model", "model") {
        out.insert("model".into(), v);
    }
    Value::Object(out)
}

/// The capability an operation runs under when its policy declares none: the work product's primary capability,
/// else the domain's `review` row when the catalog has it, else `review`. Returns the raw name (`null` unbound).
fn derived_capability(assignment: &Value, op_policy: &Value, runner: &Value) -> Value {
    if let Some(declared) = op_policy.get("capability") {
        return declared.clone();
    }
    let result_kind = match set(assignment.get("result")) {
        Some(result) => result.get("kind"),
        None => assignment.get("resultKind"),
    };
    if result_kind.and_then(Value::as_str) == Some("work-product") {
        return assignment
            .get("primaryCapability")
            .filter(|p| truthy(Some(p)))
            .cloned()
            .unwrap_or(Value::Null);
    }
    let row = assignment
        .get("domain")
        .filter(|d| truthy(Some(d)))
        .map(|d| format!("{}:review", text(Some(d))));
    let registered = |row: &str| {
        runner
            .get("capabilities")
            .and_then(Value::as_object)
            .and_then(|section| section.get(row))
            .is_some_and(|entry| entry.is_object() || entry.is_array())
    };
    match row {
        Some(row) if registered(&row) => json!(row),
        _ => json!("review"),
    }
}

fn governance_of(options: &Value) -> Governance {
    let list = |key: &str| -> Vec<String> {
        options
            .get(key)
            .and_then(Value::as_array)
            .map(|items| {
                items
                    .iter()
                    .filter_map(|e| e.as_str().map(str::to_string))
                    .collect()
            })
            .unwrap_or_default()
    };
    Governance {
        disallowed_providers: list("disallowedProviders"),
        disallowed_executors: list("disallowedExecutors"),
    }
}

fn checked_rigor<'a>(value: &'a Value, label: &str) -> Result<&'a str, DecideFailure> {
    value
        .as_str()
        .filter(|r| RIGORS.contains(r))
        .ok_or_else(|| {
            refuse(format!(
                "invalid {label} rigor \"{}\". Valid rigors: [{}]",
                text(Some(value)),
                RIGORS.join(", ")
            ))
        })
}

fn insert_some(map: &mut Map<String, Value>, key: &str, value: Option<&Value>) {
    if let Some(value) = value {
        map.insert(key.into(), value.clone());
    }
}

/// The effective dispatch policy. `params` is `{ assignment, runnerConfig?, binding?, cliOverride?, options? }`;
/// a seat not bound upstream is bound through `binder` (one Work seat). A refusal of that seat is
/// [`DecideFailure::SeatRefused`] with the refusal's reason as its code.
pub fn effective_dispatch_policy(
    params: &Value,
    binder: &dyn SeatBinder,
) -> Result<Value, DecideFailure> {
    let empty = json!({});
    let assignment = params
        .get("assignment")
        .filter(|a| a.is_object() || a.is_array())
        .ok_or_else(|| refuse("an effective dispatch policy needs an assignment object".into()))?;
    let runner_config = set(params.get("runnerConfig"));
    let runner = runner_config.unwrap_or(&empty);
    let binding = set(params.get("binding")).filter(|b| truthy(Some(b)));
    let cli = set(params.get("cliOverride")).unwrap_or(&empty);
    let options = set(params.get("options")).unwrap_or(&empty);

    let op_policy = match assignment.get("policy") {
        None => &empty,
        Some(policy) if policy.is_object() => policy,
        Some(_) => {
            return Err(refuse(
                "assignment.policy must be an object when provided".into(),
            ))
        }
    };
    if op_policy.get("minTier").is_some() {
        return Err(refuse("assignment policy field \"minTier\" was removed; normalize persisted assignments at the load boundary or use \"rigor\"/\"tier\"".into()));
    }
    let from_yaml = truthy(op_policy.get("_fromYaml"));
    if from_yaml && op_policy.get("tier").is_some() {
        return Err(refuse("workflow YAML cannot set explicit tier; declare the tier in the project config (capability, role, persona or seat), or set it at actor/assignment/CLI scope".into()));
    }
    if truthy(op_policy.get("model"))
        && !truthy(assignment.get("_allowLiteralModel"))
        && !truthy(cli.get("model"))
        && binding.is_none()
        && from_yaml
    {
        return Err(refuse("workflow YAML cannot pin literal model names; declare the cell in modelPolicies or name a persona".into()));
    }
    let op_id = assignment.get("operation");
    let op_scope = || match op_id {
        Some(id) => json!({ "scope": "opPolicy", "id": id }),
        None => json!({ "scope": "opPolicy" }),
    };

    // Rigor: the strongest explicit demand of the operation, the assignment and the caller.
    let derived = derived_capability(assignment, op_policy, runner);
    let target_cap: Value = first_set(&[
        op_policy.get("capability"),
        assignment.get("capability"),
        Some(&derived),
    ])
    .cloned()
    .unwrap_or(Value::Null);
    let mut demands: Vec<(&str, Value)> = Vec::new();
    if let Some(value) = op_policy.get("rigor") {
        demands.push((checked_rigor(value, "operation")?, op_scope()));
    }
    if let Some(value) = assignment.get("rigor") {
        let id = first_set(&[assignment.get("assignmentId"), assignment.get("workId")])
            .cloned()
            .unwrap_or(Value::Null);
        demands.push((
            checked_rigor(value, "assignment")?,
            json!({ "scope": "assignment", "id": id }),
        ));
    }
    if let Some(value) = cli.get("rigor") {
        let source = cli
            .pointer("/policyProvenance/rigor")
            .filter(|v| !v.is_null())
            .cloned()
            .unwrap_or_else(|| json!({ "scope": "cliOverride" }));
        demands.push((checked_rigor(value, "override")?, source));
    }
    let rank = |r: &str| RIGORS.iter().position(|x| *x == r);
    let mut best: Option<&(&str, Value)> = None;
    for demand in &demands {
        if best.is_none_or(|b| rank(demand.0) > rank(b.0)) {
            best = Some(demand);
        }
    }
    let (demand_rigor, demand_source) = match best {
        Some((rigor, source)) => (Some(*rigor), source.clone()),
        None => (None, json!({ "scope": "default" })),
    };
    let model_error = DecideFailure::Refused;
    let rigor_unit = json!({ "rigor": demand_rigor, "capability": target_cap });
    let effective = effective_rigor(&rigor_unit, runner)
        .map_err(model_error)?
        .unwrap_or("standard");
    let capability_rigor =
        effective_rigor(&json!({ "capability": target_cap }), runner).map_err(model_error)?;
    let rigor_source = if Some(effective) != demand_rigor && Some(effective) == capability_rigor {
        json!({ "scope": "capability", "id": target_cap })
    } else {
        demand_source
    };

    // Reasoning effort: only an explicit level is rendered into the launch.
    let explicit_effort = first_set(&[
        binding.and_then(|b| b.get("reasoningEffort")),
        cli.get("reasoningEffort"),
        op_policy.get("reasoningEffort"),
    ]);
    if let Some(effort) = explicit_effort {
        if !EFFORTS.iter().any(|e| effort.as_str() == Some(e)) {
            return Err(refuse(format!(
                "invalid reasoningEffort \"{}\". Valid values: [{}]",
                text(Some(effort)),
                EFFORTS.join(", ")
            )));
        }
    }
    let effort_source = match (binding, explicit_effort) {
        (Some(b), _) => binding_source(b, "reasoningEffort"),
        (None, None) => json!({ "scope": "default" }),
        (None, Some(_)) if truthy(cli.get("reasoningEffort")) => json!({ "scope": "cliOverride" }),
        _ => op_scope(),
    };

    // Persona: a bound seat's is Seat Binding's answer, none included; any other caller names it itself.
    let resolved_persona: Option<Value> = match binding {
        Some(b) => set(b.get("persona")).cloned(),
        None => {
            let reviewer = assignment.get("role").and_then(Value::as_str) == Some("reviewer");
            let fallback = reviewer.then(|| json!("code-reviewer"));
            first_set(&[cli.get("preferPersona"), op_policy.get("preferPersona")])
                .filter(|v| !v.is_null())
                .cloned()
                .or(fallback)
        }
    };
    let persona_source = match binding {
        Some(b) => binding_source(b, "persona"),
        None if truthy(cli.get("preferPersona")) => cli
            .pointer("/policyProvenance/persona")
            .filter(|v| !v.is_null())
            .cloned()
            .unwrap_or_else(|| json!({ "scope": "cliOverride" })),
        None if truthy(op_policy.get("preferPersona")) => op_scope(),
        None if resolved_persona.as_ref().is_some_and(|p| truthy(Some(p))) => {
            json!({ "scope": "default", "id": assignment.get("role").cloned().unwrap_or(Value::Null) })
        }
        None => json!({ "scope": "default" }),
    };

    // Executor, tier, model and effort.
    let named_executor = first_set(&[
        binding.and_then(|b| b.get("executor")),
        cli.get("preferExecutor"),
        op_policy.get("preferExecutor"),
    ])
    .filter(|v| !v.is_null());
    let default_executor: Option<String> = runner_config
        .and_then(|r| set(r.get("executor")))
        .filter(|d| truthy(Some(d)))
        .and_then(|default| {
            let registry = runner.get("executors").filter(|e| truthy(Some(e)));
            [
                default.get("command").and_then(Value::as_str),
                Some("claude"),
            ]
            .into_iter()
            .flatten()
            .find(|id| !id.is_empty() && registry.is_none_or(|all| truthy(all.get(*id))))
            .map(str::to_string)
        });
    let pinned_executor: Option<Value> = named_executor
        .cloned()
        .or(default_executor.map(Value::String));
    let launch_pin = launch_pin_of(binding, params.get("cliOverride"));
    let pinned_invocation = launch_pin.get("invocation").cloned();
    let explicit_tier = first_set(&[
        binding.and_then(|b| b.get("tier")),
        cli.get("tier"),
        op_policy.get("tier"),
    ]);
    if let Some(tier) = explicit_tier {
        if tier.as_str().and_then(Tier::parse).is_none() {
            return Err(refuse(format!(
                "invalid explicit tier \"{}\". Valid tiers: [{}]",
                text(Some(tier)),
                Tier::ALL.map(Tier::name).join(", ")
            )));
        }
    }
    if let (None, Some(_), Some(provenance)) = (
        binding,
        cli.get("tier"),
        cli.pointer("/policyProvenance/tier"),
    ) {
        let scope = provenance.get("scope").and_then(Value::as_str);
        if !scope.is_some_and(|s| TIER_PROVENANCE_SCOPES.contains(&s)) {
            return Err(refuse(format!(
                "explicit tier provenance scope \"{}\" is not allowed; tier may be explicit only at actor, assignment, or CLI scope",
                text(provenance.get("scope"))
            )));
        }
    }
    let bound_upstream =
        binding.is_some_and(|b| b.get("tier").is_some() && b.get("model").is_some());
    let mut bound: Option<Value> = None;
    if !bound_upstream {
        let Some(config) = runner_config else {
            return Err(refuse_coded(
                "the dispatch policy needs the runner config to choose a tier and a model: pass it, or pass both the tier and the model".into(),
                "runner-config-missing",
            ));
        };
        let mut override_ = Map::new();
        if let Some(pin) = &pinned_executor {
            override_.insert("executor".into(), pin.clone());
            if let Some(invocation) = pinned_invocation.as_ref().filter(|i| truthy(Some(i))) {
                override_.insert("invocation".into(), invocation.clone());
            }
        }
        if let Some(tier) = explicit_tier {
            override_.insert("tier".into(), tier.clone());
        }
        if let Some(effort) = explicit_effort {
            override_.insert("reasoningEffort".into(), effort.clone());
        }
        let mut unit = Map::new();
        unit.insert(
            "id".into(),
            set(op_id).cloned().unwrap_or_else(|| json!("work-seat")),
        );
        unit.insert(
            "capability".into(),
            set(Some(&target_cap)).cloned().unwrap_or_else(|| json!("")),
        );
        unit.insert("rigor".into(), json!(effective));
        if let Some(pin) = pinned_executor.as_ref().filter(|p| truthy(Some(p))) {
            unit.insert("prefer".into(), json!([pin]));
        }
        let role = assignment
            .get("role")
            .and_then(Value::as_str)
            .filter(|r| SEAT_ROLES.contains(r))
            .unwrap_or("producer");
        let ask = WorkSeatAsk {
            unit: Value::Object(unit),
            role: role.into(),
            read_only: is_read_only_assignment(assignment),
            overrides: if override_.is_empty() {
                Vec::new()
            } else {
                vec![Value::Object(override_)]
            },
        };
        bound = Some(match binder.bind_work_seat(config, &ask) {
            Ok(seat) => seat.binding,
            Err(BindFailure::Refused { code, detail }) => {
                return Err(DecideFailure::SeatRefused {
                    message: format!("{code}: {detail}"),
                    code,
                })
            }
            Err(BindFailure::Failed(error)) => return Err(DecideFailure::Refused(error)),
        });
    }
    // A pin is hard: an executor Seat Binding did not take (not registered, or unable to serve the seat) is refused.
    if let (Some(bound), Some(pin)) = (&bound, pinned_executor.as_ref().filter(|p| truthy(Some(p))))
    {
        if bound.get("executor") != Some(pin) {
            return Err(DecideFailure::SeatRefused {
                code: "pin-unsatisfiable".into(),
                message: format!(
                    "pin-unsatisfiable: preferExecutor \"{}\" is not registered or cannot serve this seat; Seat Binding chose \"{}\"",
                    text(Some(pin)),
                    text(bound.get("executor"))
                ),
            });
        }
    }
    let primary_executor: Value = bound
        .as_ref()
        .and_then(|b| set(b.get("executor")))
        .cloned()
        .or(pinned_executor.clone())
        .unwrap_or_else(|| json!("claude"));
    let executor_source = if named_executor.is_some() {
        if truthy(binding.and_then(|b| b.get("executor"))) {
            binding_source(binding.unwrap_or(&empty), "executor")
        } else if truthy(cli.get("preferExecutor")) {
            cli.pointer("/policyProvenance/executor")
                .filter(|v| !v.is_null())
                .cloned()
                .unwrap_or_else(|| json!({ "scope": "cliOverride" }))
        } else {
            op_scope()
        }
    } else {
        json!({ "scope": "default" })
    };
    let governance = governance_of(options);
    let primary_text = text(Some(&primary_executor));
    let provider =
        resolve_executor_provider(runner, &primary_text, &governance).map_err(model_error)?;
    let provider_source = if provider.registered {
        json!({ "scope": "registeredExecutor", "id": primary_executor })
    } else {
        executor_source.clone()
    };

    let (effective_tier, tier_source, resolved_model, model_source): (
        Value,
        Value,
        Option<Value>,
        Value,
    );
    if bound_upstream {
        let b = binding.unwrap_or(&empty);
        effective_tier = b.get("tier").cloned().unwrap_or(Value::Null);
        tier_source = binding_source(b, "tier");
        resolved_model = b.get("model").cloned();
        model_source = binding_source(b, "model");
    } else {
        let b = bound.as_ref().unwrap_or(&empty);
        effective_tier = b.get("tier").cloned().unwrap_or(Value::Null);
        tier_source = json!({ "scope": "seat-binding", "id": b.pointer("/provenance/tier/source").cloned().unwrap_or(Value::Null) });
        if truthy(cli.get("model")) {
            resolved_model = cli.get("model").cloned();
            model_source = json!({ "scope": "cliOverride" });
        } else if truthy(op_policy.get("model")) {
            resolved_model = op_policy.get("model").cloned();
            model_source = op_scope();
        } else {
            resolved_model = b.get("model").cloned();
            model_source = json!({ "scope": "placement-policy", "id": format!("{}.{}", provider.family, text(Some(&effective_tier))) });
        }
    }
    // Only a level somebody stated (the caller, the operation or the tier's cell) is rendered into the launch.
    let reasoning_effort: Option<Value> = match &bound {
        Some(b)
            if b.pointer("/provenance/reasoningEffort/source")
                .and_then(Value::as_str)
                != Some("invocation-default") =>
        {
            b.get("reasoningEffort").cloned()
        }
        _ => explicit_effort.cloned(),
    };

    // Visibility and repeat mode.
    let visibility = first_set(&[cli.get("visibility"), op_policy.get("visibility")])
        .filter(|v| !v.is_null())
        .cloned()
        .unwrap_or_else(|| json!("headless"));
    let visibility_source = if truthy(cli.get("visibility")) {
        cli.pointer("/policyProvenance/visibility")
            .filter(|v| !v.is_null())
            .cloned()
            .unwrap_or_else(|| json!({ "scope": "cliOverride" }))
    } else if truthy(op_policy.get("visibility")) {
        op_scope()
    } else {
        json!({ "scope": "default" })
    };
    let repeat_mode = first_set(&[cli.get("repeatMode"), op_policy.get("repeatMode")]);
    if let Some(mode) = repeat_mode {
        if !REPEAT_MODES.iter().any(|m| mode.as_str() == Some(m)) {
            return Err(refuse(format!(
                "invalid repeatMode \"{}\". Valid repeatModes: [{}]",
                text(Some(mode)),
                REPEAT_MODES.join(", ")
            )));
        }
    }
    let repeat_source = if truthy(cli.get("repeatMode")) {
        json!({ "scope": "cliOverride" })
    } else if truthy(op_policy.get("repeatMode")) {
        op_scope()
    } else {
        json!({ "scope": "default" })
    };
    let repeat_value = repeat_mode
        .filter(|m| !m.is_null())
        .cloned()
        .unwrap_or(Value::Null);

    // Constraints accumulate.
    let skills = assignment
        .get("skills")
        .filter(|s| s.is_array())
        .cloned()
        .unwrap_or_else(|| json!([]));
    let mut constraints = Map::new();
    constraints.insert("requiresSkills".into(), skills);
    if let Some(declared) = op_policy
        .get("constraints")
        .filter(|c| truthy(Some(c)))
        .and_then(Value::as_object)
    {
        for (key, value) in declared {
            constraints.insert(key.clone(), value.clone());
        }
    }
    let constraints = Value::Object(constraints);
    let mut constraints_source = Map::new();
    constraints_source.insert("scope".into(), json!("assignment"));
    insert_some(
        &mut constraints_source,
        "id",
        assignment.get("assignmentId"),
    );

    let canonical = resolve_executor_governance(&primary_text, &provider.family, &governance)
        .map_err(model_error)?;

    let entry = |value: Option<&Value>, source: &Value| -> Value {
        let mut e = Map::new();
        insert_some(&mut e, "value", value);
        e.insert("source".into(), source.clone());
        Value::Object(e)
    };
    let family = json!(provider.family);
    let rigor_value = json!(effective);
    let null = Value::Null;
    let persona_for_provenance = match (binding, &resolved_persona) {
        (Some(_), None) => Some(&null),
        (_, persona) => persona.as_ref(),
    };
    let effort_for_provenance = match (binding, &reasoning_effort) {
        (Some(_), None) => Some(&null),
        (_, effort) => effort.as_ref(),
    };
    let provenance = json!({
        "executor": entry(Some(&primary_executor), &executor_source),
        "provider": entry(Some(&family), &provider_source),
        "model": entry(resolved_model.as_ref(), &model_source),
        "rigor": entry(Some(&rigor_value), &rigor_source),
        "tier": entry(Some(&effective_tier), &tier_source),
        "reasoningEffort": entry(effort_for_provenance, &effort_source),
        "persona": entry(persona_for_provenance, &persona_source),
        "visibility": entry(Some(&visibility), &visibility_source),
        "repeatMode": entry(Some(&repeat_value), &repeat_source),
        "constraints": entry(Some(&constraints), &Value::Object(constraints_source)),
        "governance": entry(Some(&json!("allowed")), &json!({ "scope": "governance", "id": canonical })),
    });

    let mut policy = Map::new();
    insert_some(&mut policy, "role", assignment.get("role"));
    insert_some(&mut policy, "persona", resolved_persona.as_ref());
    policy.insert("executorId".into(), primary_executor);
    policy.insert("providerModel".into(), family);
    policy.insert("rigor".into(), rigor_value);
    policy.insert("tier".into(), effective_tier);
    insert_some(&mut policy, "model", resolved_model.as_ref());
    insert_some(&mut policy, "reasoningEffort", reasoning_effort.as_ref());
    policy.insert("visibility".into(), visibility);
    policy.insert("repeatMode".into(), repeat_value);
    policy.insert("constraints".into(), constraints);
    policy.insert("provenance".into(), provenance);
    Ok(Value::Object(policy))
}
