//! The executor block a dispatch launches (Node's `resolveExecutorConfig`): which block applies for an executor id,
//! and the cross-provider governance gate on its egress. `decide` asks it whether an out-of-process dispatch would
//! be refused; the launch path takes the block it answers. The registry lookup and the provider family are
//! [`crate::executor_model`]'s.

use crate::executor_model::{family_of, lookup_executor, FamilySource, ModelError};
use crate::js::{text, truthy};
use serde_json::{json, Map, Value};

/// What a dispatch's content may carry, narrowest first.
pub const EXECUTOR_CARRIES: [&str; 2] = ["user-text", "repo-content"];
/// The commands that are Claude's own CLI: any other command is cross-provider egress.
pub const CLAUDE_CLI_COMMANDS: [&str; 1] = ["claude"];
/// The refusal of a run that needs the default executor where none is set and no assistant CLI is on PATH.
pub const EXECUTOR_MISSING_MESSAGE: &str = "no runner.executor: none set and no assistant CLI found on PATH; set one with fgos config set runner.executor ... --reason ...";

/// The hostname of a URL as the WHATWG URL parser reads it, for the schemes an API base URL uses; `None` when it
/// does not parse as such a URL.
fn url_hostname(url: &str) -> Option<String> {
    let url = url.trim_matches(|c: char| c <= ' ');
    let colon = url.find(':')?;
    let scheme = &url[..colon];
    let mut chars = scheme.chars();
    if !chars.next()?.is_ascii_alphabetic()
        || !chars.all(|c| c.is_ascii_alphanumeric() || matches!(c, '+' | '-' | '.'))
    {
        return None;
    }
    let scheme = scheme.to_ascii_lowercase();
    let rest = &url[colon + 1..];
    let special = matches!(scheme.as_str(), "http" | "https" | "ws" | "wss" | "ftp");
    let authority_start = if special {
        rest.trim_start_matches(['/', '\\'])
    } else if let Some(stripped) = rest.strip_prefix("//") {
        stripped
    } else {
        return Some(String::new());
    };
    let end = authority_start
        .find(|c: char| matches!(c, '/' | '?' | '#') || (special && c == '\\'))
        .unwrap_or(authority_start.len());
    let authority = &authority_start[..end];
    let host_port = authority.rsplit_once('@').map_or(authority, |(_, h)| h);
    let host = if host_port.starts_with('[') {
        host_port
            .find(']')
            .map_or(host_port, |at| &host_port[..=at])
    } else {
        host_port.rsplit_once(':').map_or(host_port, |(h, _)| h)
    };
    if special && host.is_empty() {
        return None;
    }
    Some(if special {
        host.to_ascii_lowercase()
    } else {
        host.to_string()
    })
}

pub fn is_anthropic_api_host(url: &str) -> bool {
    url_hostname(url)
        .is_some_and(|host| host == "api.anthropic.com" || host.ends_with(".api.anthropic.com"))
}

/// A real, spawnable executor block for an executor that declares only `agentType`: the base executor's args
/// verbatim, without the `--model {model}` pair (the named agent's own model wins), plus `--agent <type>`.
fn build_agent_type_executor(base: &Value, agent_type: &str) -> Result<Value, ModelError> {
    // `baseExecutor.args.length` throws on an absent or null `args`.
    let args = match base.get("args") {
        None | Some(Value::Null) => {
            return Err(ModelError::of_class(
                "TypeError",
                None,
                format!(
                    "Cannot read properties of {} (reading 'length')",
                    text(base.get("args"))
                ),
            ))
        }
        Some(args) => args.as_array().cloned().unwrap_or_default(),
    };
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
    Ok(json!({ "command": base.get("command").cloned().unwrap_or(Value::Null), "args": kept }))
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
) -> Result<Value, ModelError> {
    let executor_id = executor_id.filter(|id| !id.is_empty());
    let entry: Option<&Value> =
        executor_id.and_then(|id| lookup_executor(runner, Some(id)).executor);

    if let Some(carries) = entry.and_then(|e| e.get("carries")) {
        let id = executor_id.unwrap_or_default();
        let Some(content) = content_carries else {
            return Err(ModelError::runner(format!(
                "executor \"{id}\" declares \"carries: {}\" but this dispatch did not declare what content it carries — pass an explicit content class before dispatch.",
                text(Some(carries))
            )));
        };
        if !EXECUTOR_CARRIES.contains(&content) {
            return Err(ModelError::runner(format!(
                "dispatch content class must be one of {}, got: {}.",
                EXECUTOR_CARRIES.join("/"),
                serde_json::to_string(content).unwrap_or_default()
            )));
        }
        if content == "repo-content" && carries.as_str() == Some("user-text") {
            return Err(ModelError::runner(format!(
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
                    let via = text(inv.get("via"));
                    if with_id {
                        let named = inv.get("id").filter(|v| !v.is_null());
                        format!(
                            "{}:{via}",
                            named.map_or("(no id)".to_string(), |v| text(Some(v)))
                        )
                    } else {
                        via
                    }
                })
                .collect::<Vec<_>>()
                .join(sep)
        };
        return Err(ModelError::runner(match invocation_id {
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
            .transpose()?
    } else {
        None
    };
    if by_executor.is_none() && default_executor.is_none() {
        return Err(ModelError::coded(
            "runner-executor-missing",
            EXECUTOR_MISSING_MESSAGE.into(),
        ));
    }
    let executor = by_executor
        .or_else(|| default_executor.cloned())
        .unwrap_or(Value::Null);
    let command = executor.get("command").and_then(Value::as_str);
    if command.is_none() || !executor.get("args").is_some_and(Value::is_array) {
        return Err(ModelError::runner(
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
            return Err(ModelError::coded(
                "governance.cross-provider-not-permitted",
                format!(
                    "executor \"{id}\" resolves to cross-provider egress target \"{egress_target}\" — prompt content would leave the Claude ecosystem. Set executors.{id}.allowCrossProvider: true to permit this."
                ),
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

#[cfg(test)]
mod tests {
    use super::url_hostname;

    #[test]
    fn a_base_url_is_judged_by_its_hostname_not_by_its_text() {
        assert_eq!(
            url_hostname("https://API.Anthropic.com/v1").as_deref(),
            Some("api.anthropic.com")
        );
        assert_eq!(
            url_hostname("https://evil.example.com/api.anthropic.com").as_deref(),
            Some("evil.example.com")
        );
        assert_eq!(
            url_hostname("https://user@x.api.anthropic.com:443?q").as_deref(),
            Some("x.api.anthropic.com")
        );
        // A special scheme needs no `//`: `new URL("https:api.anthropic.com")` reads the host all the same.
        assert_eq!(
            url_hostname("https:api.anthropic.com").as_deref(),
            Some("api.anthropic.com")
        );
        assert_eq!(url_hostname("api.anthropic.com"), None);
        assert_eq!(url_hostname("https://"), None);
    }
}
