//! Executor resolution: the capability a dispatch is for, the executor block a name resolves to, and the
//! cross-provider governance gate on its egress.
//!
//! The registry lookup, the provider family and the capability catalog reads are `fgos-execution`'s
//! (`executor_model`); this module composes them and adds the resolution rules of the launch path. Which executor
//! a purpose runs on is Seat Binding's answer, never chosen here.

use fgos_execution::executor_model::{
    capability_confinement, family_of, registered_capability_of, FamilySource,
};
use serde_json::{json, Map, Value};

use crate::assignment::{js_str, truthy, Refusal};

pub use fgos_execution::executor_model::lookup_executor;

/// What a dispatch's content may carry, narrowest first.
pub const EXECUTOR_CARRIES: [&str; 2] = ["user-text", "repo-content"];
/// The commands that are Claude's own CLI: any other command is cross-provider egress.
pub const CLAUDE_CLI_COMMANDS: [&str; 1] = ["claude"];
/// The refusal of a run that needs the default executor where none is set and no assistant CLI is on PATH.
pub const EXECUTOR_MISSING_MESSAGE: &str = "no runner.executor: none set and no assistant CLI found on PATH; set one with fgos config set runner.executor ... --reason ...";

/// What the caller knows about what a dispatch is FOR.
#[derive(Debug, Clone, Default)]
pub struct CapabilityHints {
    pub candidates: Vec<String>,
    pub preferred: Option<String>,
    pub fallback_label: Option<String>,
}

/// What a dispatch resolves to: its capability, and the capability whose confinement policy anchors it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CapabilityDetails {
    pub capability: String,
    pub anchor_capability: Option<String>,
}

impl CapabilityDetails {
    pub fn to_json(&self) -> Value {
        json!({ "capability": self.capability, "anchorCapability": self.anchor_capability })
    }
}

/// JavaScript's default string order: UTF-16 code units.
fn js_sorted(mut items: Vec<String>) -> Vec<String> {
    items.sort_by(|a, b| a.encode_utf16().cmp(b.encode_utf16()));
    items
}

fn has_capability_entry(runner: &Value, name: &str) -> bool {
    runner
        .get("capabilities")
        .and_then(Value::as_object)
        .and_then(|section| section.get(name))
        .is_some_and(|entry| entry.is_object() || entry.is_array())
}

fn confinement_of<'a>(runner: &'a Value, capability: &str) -> Option<&'a Value> {
    capability_confinement(runner, capability)
}

fn confinement_is_required(runner: &Value, capability: &str) -> bool {
    confinement_of(runner, capability)
        .and_then(|confinement| confinement.get("mode"))
        .and_then(Value::as_str)
        == Some("required")
}

fn has_confinement(runner: &Value, capability: &str) -> bool {
    truthy(confinement_of(runner, capability))
}

/// The capabilities a tool executor serves; an agent executor serves none (its `for` is inert).
fn served_capabilities(executor: Option<&Value>) -> Vec<String> {
    let Some(executor) = executor.filter(|e| e.get("kind").and_then(Value::as_str) == Some("tool"))
    else {
        return Vec::new();
    };
    executor
        .get("for")
        .and_then(Value::as_array)
        .map(|list| {
            list.iter()
                .filter_map(Value::as_str)
                .map(|name| name.trim().to_string())
                .filter(|name| !name.is_empty())
                .collect()
        })
        .unwrap_or_default()
}

/// The canonical capability identity of a dispatch, independent of any Work item. An explicit purpose wins; else
/// a candidate with required confinement, then any configured confinement, then the preferred one, then a
/// registered capability, then the first sorted candidate.
pub fn resolve_capability_details_from_hints(
    runner: &Value,
    executor_id: Option<&str>,
    resolved_executor: Option<&Value>,
    purpose: Option<&str>,
    hints: &CapabilityHints,
) -> CapabilityDetails {
    let resolve_alias = |name: &str| -> String {
        if name.is_empty() {
            return String::new();
        }
        registered_capability_of(runner, &Value::String(name.to_string()))
            .unwrap_or(name)
            .to_string()
    };
    let explicit_purpose = purpose
        .map(str::trim)
        .filter(|text| !text.is_empty())
        .map(resolve_alias);

    let mut candidates: Vec<String> = Vec::new();
    let mut add = |name: String| {
        if !candidates.contains(&name) {
            candidates.push(name);
        }
    };
    hints.candidates.iter().cloned().for_each(&mut add);
    served_capabilities(resolved_executor)
        .into_iter()
        .for_each(&mut add);
    if let Some(id) = executor_id.filter(|id| !id.is_empty()) {
        add(id.to_string());
    }
    let normalized: Vec<String> = candidates
        .iter()
        .map(|c| resolve_alias(c))
        .filter(|c| !c.is_empty())
        .collect();

    let mut capability = explicit_purpose.unwrap_or_default();
    if capability.is_empty() && normalized.is_empty() {
        capability = hints
            .fallback_label
            .clone()
            .or_else(|| executor_id.map(str::to_string))
            .unwrap_or_else(|| "(unknown-capability)".to_string());
    }
    let pick = |matching: Vec<String>| js_sorted(matching).into_iter().next();
    let by = |test: &dyn Fn(&str) -> bool| -> Vec<String> {
        normalized.iter().filter(|c| test(c)).cloned().collect()
    };
    if capability.is_empty() {
        capability = pick(by(&|c| confinement_is_required(runner, c))).unwrap_or_default();
    }
    if capability.is_empty() {
        capability = pick(by(&|c| has_confinement(runner, c))).unwrap_or_default();
    }
    if capability.is_empty() {
        if let Some(preferred) = hints.preferred.as_ref().filter(|p| normalized.contains(p)) {
            capability = preferred.clone();
        }
    }
    if capability.is_empty() {
        capability = pick(by(&|c| has_capability_entry(runner, c))).unwrap_or_default();
    }
    if capability.is_empty() {
        capability = pick(normalized.clone()).unwrap_or_default();
    }

    let anchors: Vec<String> = normalized
        .iter()
        .filter(|c| **c != capability && has_confinement(runner, c))
        .cloned()
        .collect();
    let required: Vec<String> = anchors
        .iter()
        .filter(|c| confinement_is_required(runner, c))
        .cloned()
        .collect();
    let anchor_capability = pick(required).or_else(|| pick(anchors));
    CapabilityDetails {
        capability,
        anchor_capability,
    }
}

/// A real, spawnable executor block for an executor that declares only `agentType`: the base executor's args
/// verbatim, without the `--model {model}` pair (the named agent's own model wins), plus `--agent <type>`.
fn build_agent_type_executor(base: &Value, agent_type: &str) -> Value {
    let args = base
        .get("args")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let mut kept: Vec<Value> = Vec::new();
    let mut i = 0;
    while i < args.len() {
        if args[i].as_str() == Some("--model")
            && args.get(i + 1).and_then(Value::as_str) == Some("{model}")
        {
            i += 2;
            continue;
        }
        kept.push(args[i].clone());
        i += 1;
    }
    kept.push(json!("--agent"));
    kept.push(json!(agent_type));
    json!({ "command": base.get("command").cloned().unwrap_or(Value::Null), "args": kept })
}

/// Whether `url` names the Anthropic API host (a real hostname comparison, fail-closed: a value that does not
/// parse as an absolute URL is never trusted as Anthropic).
fn is_anthropic_api_host(url: &str) -> bool {
    let Some((scheme, rest)) = url.trim().split_once("://") else {
        return false;
    };
    let scheme_ok = scheme
        .chars()
        .next()
        .is_some_and(|c| c.is_ascii_alphabetic())
        && scheme
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || "+-.".contains(c));
    if !scheme_ok {
        return false;
    }
    let authority = rest.split(['/', '?', '#', '\\']).next().unwrap_or_default();
    let host_port = authority.rsplit('@').next().unwrap_or_default();
    let host = if host_port.starts_with('[') {
        host_port
            .split(']')
            .next()
            .map(|h| format!("{h}]"))
            .unwrap_or_default()
    } else {
        host_port.split(':').next().unwrap_or_default().to_string()
    };
    let host = host.to_lowercase();
    host == "api.anthropic.com" || host.ends_with(".api.anthropic.com")
}

fn first_cli<'a>(invocations: &'a [Value], id: Option<&str>) -> Option<&'a Value> {
    invocations.iter().find(|inv| {
        inv.get("via").and_then(Value::as_str) == Some("cli")
            && id.is_none_or(|id| inv.get("id").and_then(Value::as_str) == Some(id))
    })
}

fn pick_keys(source: &Value, keys: &[&str], into: &mut Map<String, Value>) {
    for key in keys {
        if let Some(value) = source.get(*key) {
            into.insert((*key).to_string(), value.clone());
        }
    }
}

/// The launch block of a cli invocation: its own fields, the executor's provider, and its credential store.
fn invocation_block(invocation: &Value, provider: Option<&Value>, env: Option<&Value>) -> Value {
    let mut block = Map::new();
    pick_keys(invocation, &["command", "args", "adapter"], &mut block);
    if let Some(provider) = provider {
        block.insert("provider".into(), provider.clone());
    }
    if let Some(env) = env {
        block.insert("env".into(), env.clone());
    }
    pick_keys(
        invocation,
        &[
            "liveOutput",
            "interactiveMode",
            "promptDelivery",
            "permissionMode",
            "confinement",
        ],
        &mut block,
    );
    let store = invocation
        .get("credentialStore")
        .filter(|v| !v.is_null())
        .cloned()
        .unwrap_or(Value::Null);
    block.insert("credentialStore".into(), store);
    Value::Object(block)
}

fn refuse(message: String) -> Refusal {
    Refusal::new(message)
}

/// Resolves which executor block applies for `executor_id` and gates its egress. Precedence: the registry entry
/// that declares its own `command`/`adapter`, its cli invocation (the named one, else the first), the default
/// executor's cli invocation, an `agentType`-only entry built over the default executor, then the default
/// executor itself. A resolved block that leaves the Claude ecosystem needs `allowCrossProvider: true`.
pub fn resolve_executor_config(
    runner: &Value,
    executor_id: Option<&str>,
    content_carries: Option<&str>,
    resolved_agent_type: Option<&str>,
    invocation_id: Option<&str>,
) -> Result<Value, Refusal> {
    let executor_id = executor_id.filter(|id| !id.is_empty());
    let entry: Option<&Value> =
        executor_id.and_then(|id| lookup_executor(runner, Some(id)).executor);

    if let Some(carries) = entry.and_then(|e| e.get("carries")) {
        let id = executor_id.unwrap_or_default();
        let Some(content) = content_carries else {
            return Err(refuse(format!(
                "executor \"{id}\" declares \"carries: {}\" but this dispatch did not declare what content it carries — pass an explicit content class before dispatch.",
                js_str(Some(carries))
            )));
        };
        if !EXECUTOR_CARRIES.contains(&content) {
            return Err(refuse(format!(
                "dispatch content class must be one of {}, got: {}.",
                EXECUTOR_CARRIES.join("/"),
                serde_json::to_string(content).unwrap_or_default()
            )));
        }
        if content == "repo-content" && carries.as_str() == Some("user-text") {
            return Err(refuse(format!(
                "executor \"{id}\" declares \"carries: user-text\" but this dispatch carries repo-content — refused before spawn (tsk-5td D15)."
            )));
        }
    }

    let invocation_id = invocation_id.filter(|id| !id.is_empty());
    let invocations = entry
        .and_then(|e| e.get("invocations"))
        .and_then(Value::as_array);
    let cli_invocation = invocations.and_then(|list| first_cli(list, invocation_id));
    if let (Some(list), None) = (invocations, cli_invocation) {
        let id = executor_id.unwrap_or_default();
        let has = |sep: &str, with_id: bool| {
            list.iter()
                .map(|inv| {
                    let via = js_str(inv.get("via"));
                    if with_id {
                        let named = inv.get("id").filter(|v| !v.is_null());
                        format!(
                            "{}:{via}",
                            named.map_or("(no id)".to_string(), |v| js_str(Some(v)))
                        )
                    } else {
                        via
                    }
                })
                .collect::<Vec<_>>()
                .join(sep)
        };
        return Err(refuse(match invocation_id {
            Some(wanted) => format!(
                "executor \"{id}\" has no \"invocations\" entry with \"id\": \"{wanted}\" dispatchable via \"cli\" (has: {}).",
                has(", ", true)
            ),
            None => format!(
                "executor \"{id}\" declares \"invocations\" but none is dispatchable via \"cli\" (has: {}) — resolveExecutorConfig only ever spawns a cli invocation; this executor cannot be dispatched this way.",
                has("/", false)
            ),
        }));
    }

    let default_executor = runner.get("executor").filter(|e| truthy(Some(e)));
    let effective_agent_type = entry
        .and_then(|e| e.get("agentType"))
        .filter(|v| !v.is_null())
        .and_then(Value::as_str)
        .or(resolved_agent_type)
        .filter(|t| !t.is_empty());
    let own_launch = entry.is_some_and(|e| truthy(e.get("adapter")) || truthy(e.get("command")));
    let via_agent_type = cli_invocation.is_none()
        && !own_launch
        && effective_agent_type.is_some()
        && default_executor.is_some();
    let default_cli = if entry.is_none() {
        default_executor
            .and_then(|d| d.get("invocations"))
            .and_then(Value::as_array)
            .and_then(|list| first_cli(list, None))
    } else {
        None
    };

    let by_executor: Option<Value> = if let Some(invocation) = cli_invocation {
        let env = invocation.get("env");
        Some(invocation_block(
            invocation,
            entry.and_then(|e| e.get("provider")),
            env,
        ))
    } else if let (Some(entry), true) = (entry, own_launch) {
        Some(entry.clone())
    } else if let Some(invocation) = default_cli {
        let env = invocation
            .get("env")
            .filter(|v| !v.is_null())
            .or_else(|| default_executor.and_then(|d| d.get("env")));
        Some(invocation_block(
            invocation,
            default_executor.and_then(|d| d.get("provider")),
            env,
        ))
    } else if via_agent_type {
        default_executor
            .zip(effective_agent_type)
            .map(|(base, agent_type)| build_agent_type_executor(base, agent_type))
    } else {
        None
    };
    if by_executor.is_none() && default_executor.is_none() {
        return Err(Refusal::with_code(
            EXECUTOR_MISSING_MESSAGE,
            "runner-executor-missing",
        ));
    }
    let executor = by_executor
        .or_else(|| default_executor.cloned())
        .unwrap_or(Value::Null);
    let command = executor.get("command").and_then(Value::as_str);
    if command.is_none() || !executor.get("args").is_some_and(Value::is_array) {
        return Err(refuse(
            "runner config \"executor\" must have a string \"command\" and an \"args\" array."
                .into(),
        ));
    }
    let command = command.unwrap_or_default();

    let env_block = executor
        .get("env")
        .filter(|v| !v.is_null())
        .or_else(|| cli_invocation.and_then(|i| i.get("env")));
    let env_target = ["ANTHROPIC_BASE_URL", "OPENAI_BASE_URL", "BASE_URL"]
        .iter()
        .filter_map(|key| env_block.and_then(|e| e.get(*key)))
        .find(|v| truthy(Some(v)))
        .or_else(|| env_block.and_then(|e| e.get("BASE_URL")));
    let env_override = env_target
        .and_then(Value::as_str)
        .filter(|url| !url.trim().is_empty())
        .filter(|url| !is_anthropic_api_host(url));

    let provider_family = family_of(FamilySource::from_json(entry), Some(command));
    let egress_target = env_override.unwrap_or(command).to_string();
    let provider_model_foreign = entry
        .and_then(|e| e.get("providerModel"))
        .is_some_and(|model| model.as_str() != Some("claude"));
    let cross_provider =
        env_override.is_some() || !CLAUDE_CLI_COMMANDS.contains(&command) || provider_model_foreign;
    let egress_kind = if cross_provider {
        "cross-provider"
    } else {
        "same-provider"
    };
    let egress_content = entry
        .and_then(|e| e.get("carries"))
        .filter(|v| !v.is_null())
        .cloned()
        .or_else(|| content_carries.map(|c| json!(c)))
        .unwrap_or_else(|| json!("repo-content"));

    if let Some(entry) = entry {
        if !via_agent_type
            && cross_provider
            && entry.get("allowCrossProvider") != Some(&json!(true))
        {
            let id = executor_id.unwrap_or_default();
            return Err(Refusal::with_code(
                format!(
                    "executor \"{id}\" resolves to cross-provider egress target \"{egress_target}\" — prompt content would leave the Claude ecosystem. Set executors.{id}.allowCrossProvider: true to permit this."
                ),
                "governance.cross-provider-not-permitted",
            ));
        }
    }

    let mut resolved = match executor {
        Value::Object(map) => map,
        _ => Map::new(),
    };
    if let Some(supports) = entry
        .and_then(|e| e.get("supports"))
        .filter(|v| truthy(Some(v)))
    {
        if !truthy(resolved.get("supports")) {
            resolved.insert("supports".into(), supports.clone());
        }
    }
    resolved.insert(
        "governance".into(),
        json!({
            "providerFamily": provider_family,
            "egress": { "kind": egress_kind, "target": egress_target, "content": egress_content },
        }),
    );
    Ok(Value::Object(resolved))
}
