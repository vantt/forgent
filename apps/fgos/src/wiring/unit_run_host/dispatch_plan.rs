//! The dispatch plan of an assignment the assignment runner executes: `compileDispatchPlan(cfg, { assignment,
//! assignmentItem, hasLiveTaskAccess, binding, cliOverride, options })` (retired Node module `src/runner/dispatch/plan.mjs`; last at `85760c6f2`) on its
//! assignment selector, the only one an execution compiles. Every decision is a crate's: the effective dispatch
//! policy (engine `planning::policy`), the registry lookup, the mechanism and the executor resolution with its
//! governance (`fgos-execution`); this module orders them into the plan Node wrote.

use fgos_execution::dispatch_policy::launch_pin_of;
use fgos_execution::executor_config::resolve_executor_config;
use fgos_execution::executor_model::{lookup_executor, mechanism, Mechanism};
use fgos_execution::ports::Machine;
use fgos_execution_engine::assignment_runner::RunnerConfigError;
use fgos_execution_engine::planning::policy::effective_dispatch_policy;
use serde_json::{json, Map, Value};

/// What the plan is compiled from beside the runner config and the assignment.
pub struct PlanAsk<'a> {
    pub binding: Option<&'a Value>,
    pub cli_override: Option<&'a Value>,
    pub options: Option<&'a Value>,
    pub has_live_task_access: bool,
}

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |d| d.as_millis() as u64)
}

/// The plan of `assignment` under `cfg`, or the refusal of its dispatch policy.
pub fn compile_assignment_plan(
    cfg: &Value,
    assignment: &Value,
    ask: &PlanAsk<'_>,
    machine: &dyn Machine,
) -> Result<Value, RunnerConfigError> {
    let assignment_id = assignment
        .get("assignmentId")
        .cloned()
        .unwrap_or(Value::Null);
    let mut params = json!({ "assignment": assignment, "runnerConfig": cfg });
    for (key, value) in [
        ("binding", ask.binding),
        ("cliOverride", ask.cli_override),
        ("options", ask.options),
    ] {
        if let Some(value) = value.filter(|v| !v.is_null()) {
            params[key] = value.clone();
        }
    }
    let policy =
        effective_dispatch_policy(&params, machine, now_ms()).map_err(|e| match e.code {
            Some(code) => RunnerConfigError::coded(e.message, &code),
            None => RunnerConfigError::new(e.message),
        })?;
    let executor_id = policy
        .get("executorId")
        .and_then(Value::as_str)
        .map(str::to_string);
    let shell = |rest: Map<String, Value>| {
        let mut plan = Map::new();
        plan.insert(
            "selector".into(),
            json!({ "type": "assignment", "value": assignment_id }),
        );
        plan.insert("caller".into(), json!({ "role": "driver" }));
        plan.extend(rest);
        Value::Object(plan)
    };
    let Some(executor_id) = executor_id else {
        let mut rest = Map::new();
        rest.insert("mechanism".into(), json!("unavailable"));
        rest.insert("executorId".into(), Value::Null);
        rest.insert("capability".into(), Value::Null);
        rest.insert("invocation".into(), Value::Null);
        rest.insert(
            "governance".into(),
            json!({ "providerFamily": null, "egress": null }),
        );
        rest.insert("reasonCodes".into(), json!(["selector.unregistered"]));
        rest.insert("configured".into(), json!(false));
        return Ok(shell(rest));
    };
    let decided = mechanism(cfg, Some(&executor_id), ask.has_live_task_access);
    let mut reason_codes = vec![json!(if decided == Mechanism::OutOfProcess {
        "native-first.0033.cli-spawn-shaped"
    } else {
        "native-first.rule-2.live-task-access"
    })];
    let resolved = lookup_executor(cfg, Some(&executor_id));
    let agent_type = resolved
        .executor
        .and_then(|e| e.get("agentType"))
        .and_then(Value::as_str)
        .map(str::to_string);
    let capability = json!(executor_id);
    let mut resolved_for_dispatch: Option<Value> = None;
    if decided == Mechanism::OutOfProcess {
        let pin = launch_pin_of(ask.binding, ask.cli_override);
        let pinned = pin
            .get("invocation")
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|s| !s.is_empty());
        match resolve_executor_config(cfg, Some(&executor_id), None, agent_type.as_deref(), pinned)
        {
            Ok(found) => resolved_for_dispatch = Some(found),
            Err(error) => {
                reason_codes.push(json!("governance.blocked"));
                let mut rest = Map::new();
                rest.insert("mechanism".into(), json!("unavailable"));
                rest.insert("executorId".into(), json!(executor_id));
                rest.insert("capability".into(), capability);
                rest.insert("invocation".into(), Value::Null);
                rest.insert(
                    "governance".into(),
                    json!({ "providerFamily": null, "egress": null }),
                );
                rest.insert("reasonCodes".into(), Value::Array(reason_codes));
                rest.insert("configured".into(), json!(resolved.configured));
                rest.insert("blockedReason".into(), json!(error.message));
                return Ok(shell(rest));
            }
        }
    }
    // A real assignment whose policy names another executor than the one decided is refused, never ignored.
    if policy.get("executorId").and_then(Value::as_str) != Some(executor_id.as_str()) {
        return Err(RunnerConfigError::new(format!(
            "dispatch decide mismatch for operation \"{}\": decided executor \"{executor_id}\" does not match execution policy executor \"{}\"",
            assignment.get("operation").and_then(Value::as_str).unwrap_or("undefined"),
            policy.get("executorId").and_then(Value::as_str).unwrap_or("undefined")
        )));
    }
    let invocation = resolved_for_dispatch.as_ref().map(|r| {
        let adapter = r
            .get("adapter")
            .and_then(Value::as_str)
            .or_else(|| {
                resolved
                    .executor
                    .and_then(|e| e.get("adapter"))
                    .and_then(Value::as_str)
            })
            .unwrap_or("cli-spawn");
        json!({ "via": "cli", "adapter": adapter, "protocol": "prompt-stdout-v1" })
    });
    let governance = resolved_for_dispatch
        .as_ref()
        .and_then(|r| r.get("governance").cloned())
        .unwrap_or_else(|| json!({ "providerFamily": null, "egress": null }));
    let field = |key: &str| policy.get(key).cloned().unwrap_or(Value::Null);
    let mut rest = Map::new();
    rest.insert("mechanism".into(), json!(decided.as_str()));
    rest.insert("executorId".into(), json!(executor_id));
    rest.insert("capability".into(), capability);
    rest.insert("invocation".into(), invocation.unwrap_or(Value::Null));
    rest.insert("governance".into(), governance);
    rest.insert("reasonCodes".into(), Value::Array(reason_codes));
    if let Some(agent_type) = agent_type {
        rest.insert("agentType".into(), json!(agent_type));
    }
    rest.insert("configured".into(), json!(resolved.configured));
    rest.insert(
        "bindingSource".into(),
        resolved.binding_source.map_or(Value::Null, |s| json!(s)),
    );
    rest.insert("tier".into(), field("tier"));
    rest.insert("model".into(), field("model"));
    rest.insert("providerModel".into(), field("providerModel"));
    rest.insert("provenance".into(), field("provenance"));
    rest.insert("policy".into(), policy);
    Ok(shell(rest))
}
