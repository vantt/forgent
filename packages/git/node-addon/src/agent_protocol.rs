//! `agentProtocol` namespace: the Node door to the agent protocol's judgment of a CLI's last words.
use crate::check;
use fgos_agent_protocol::{direct::adapter_for, ExitInfo, Outcome};
use napi::Result;
use napi_derive::napi;
use serde_json::{json, Value};

/// What a headless CLI that left no result file stopped on: `{reason, providerSignal}`. `reason` is
/// `login`, `usage-limit` or `provider-error` when its last words (`stderrTail`, and the last JSON
/// event of `stdoutTail`) show one, else null; `providerSignal` is what the provider itself said, or
/// null. The same matcher a supervised run settles through.
#[napi(namespace = "agentProtocol", js_name = "classifyDirect")]
pub fn classify_direct(
    cli: String,
    exit_code: Option<i32>,
    stderr_tail: String,
    stdout_tail: String,
) -> Result<Value> {
    check()?;
    let direct = adapter_for(&cli);
    let reason = match direct.classify(
        ExitInfo { code: exit_code },
        &stderr_tail,
        &stdout_tail,
        None,
    ) {
        Outcome::Blocked(reason) => Some(reason.as_str()),
        Outcome::Completed { .. } | Outcome::NeedsHuman | Outcome::Exited { .. } => None,
    };
    let signal = direct
        .provider_signal(&stderr_tail, &stdout_tail)
        .map(|signal| signal.to_json());
    Ok(json!({ "reason": reason, "providerSignal": signal }))
}
