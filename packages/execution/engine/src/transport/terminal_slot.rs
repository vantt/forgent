//! One round's view of its terminal slot: the names and display facts, and the refusal the round code branches
//! on.
//!
//! Every herdr call of a round goes through terminal-control, which addresses a pane by a key. This module
//! names keys and display facts and turns a refusal from the port into a [`TerminalSlotError`] whose `code` is
//! the driver's own error code when the driver named one. The client itself (one per route configuration) is
//! the run supervisor's backend; what happens in the pane after the handover belongs to the run supervisor.

use serde_json::{json, Map, Value};

/// The herdr binary a caller names, else `FGOS_HERDR_BIN`, else `herdr` on PATH. The one place that default
/// lives.
pub fn resolve_herdr_bin(named: Option<&str>, env: &dyn Fn(&str) -> Option<String>) -> String {
    let clean = |text: Option<String>| text.map(|t| t.trim().to_string()).filter(|t| !t.is_empty());
    clean(named.map(String::from))
        .or_else(|| clean(env("FGOS_HERDR_BIN")))
        .unwrap_or_else(|| "herdr".to_string())
}

/// The herdr endpoint entries (`HERDR_*`, string valued) of `env`: how the controller reaches its herdr
/// server, never what a seat receives.
pub fn herdr_endpoint_env(env: &Map<String, Value>) -> Map<String, Value> {
    env.iter()
        .filter(|(name, value)| name.starts_with("HERDR_") && value.is_string())
        .map(|(name, value)| (name.clone(), value.clone()))
        .collect()
}

/// A refusal turned into the error the round branches on.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
#[error("{message}")]
pub struct TerminalSlotError {
    pub code: String,
    pub message: String,
    /// The capability an `unsupported` refusal names.
    pub capability: Option<String>,
}

/// What a refusal from the terminal port says: Terminal Control's `reason`, the Session Host's `detail`.
#[derive(Debug, Clone, Copy, Default)]
pub struct RefusalView<'a> {
    pub result: &'a str,
    pub reason: Option<&'a str>,
    pub detail: Option<&'a str>,
    pub capability: Option<&'a str>,
}

/// A key or group key the port accepts: letters, digits, `.`, `_`, `-`, at most 128. Anything else becomes
/// `-` (one per UTF-16 unit, as the port counts), a leading non-alphanumeric run is dropped.
pub fn port_key(raw: Option<&str>, fallback: &str) -> String {
    let mut cleaned = String::new();
    for c in raw.unwrap_or("").chars() {
        if c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-') {
            cleaned.push(c);
        } else {
            cleaned.extend(std::iter::repeat_n('-', c.len_utf16()));
        }
    }
    let trimmed: String = cleaned
        .trim_start_matches(|c: char| !c.is_ascii_alphanumeric())
        .chars()
        .take(128)
        .collect();
    if trimmed.is_empty() {
        fallback.to_string()
    } else {
        trimmed
    }
}

/// The driver error code inside a refusal reason: `herdr agent_blocked: ...` -> `agent_blocked`.
pub fn driver_code_of(reason: Option<&str>, detail: Option<&str>) -> Option<String> {
    let text = reason.or(detail).unwrap_or("");
    let rest = text.strip_prefix("herdr ")?;
    let code: String = rest
        .chars()
        .take_while(|c| c.is_ascii_lowercase() || *c == '_')
        .collect();
    (!code.is_empty() && rest[code.len()..].starts_with(':')).then_some(code)
}

pub fn refusal_error(refusal: RefusalView<'_>, what: &str) -> TerminalSlotError {
    if refusal.result == "unsupported" {
        return TerminalSlotError {
            code: "terminal_unsupported".into(),
            message: format!("{what}: {}", refusal.detail.unwrap_or("undefined")),
            capability: refusal.capability.map(String::from),
        };
    }
    let code =
        driver_code_of(refusal.reason, refusal.detail).unwrap_or_else(|| "terminal_unknown".into());
    let detail = refusal.reason.or(refusal.detail).unwrap_or(refusal.result);
    TerminalSlotError {
        code,
        message: format!("{what}: {detail}"),
        capability: None,
    }
}

fn js_string(value: &Value) -> Option<String> {
    match value {
        Value::Null => None,
        Value::String(text) => Some(text.clone()),
        other => Some(other.to_string()),
    }
}

fn present(value: &Value, key: &str) -> Option<String> {
    js_string(&value[key]).filter(|text| !text.is_empty())
}

/// What names the work in a label: its work item, else its run (`run-` and the first four characters of the
/// unit run's random part) with the start of its objective as the title. A work item carries its own title when
/// the item had one at dispatch; without it the label shows the id alone.
pub fn work_label_of(assignment: &Value) -> Value {
    let mut label = Map::new();
    if let Some(work_id) = present(assignment, "workId") {
        label.insert("id".into(), json!(work_id));
        if let Some(title) = present(assignment, "title") {
            label.insert("title".into(), json!(title));
        }
        return Value::Object(label);
    }
    let unit_run_id = present(assignment, "unitRunId")
        .or_else(|| present(&assignment["provenance"], "unitRunId"));
    let random = unit_run_id.as_deref().and_then(|id| {
        let (_, tail) = id.rsplit_once('-')?;
        (tail.len() == 8 && tail.chars().all(|c| matches!(c, '0'..='9' | 'a'..='f')))
            .then(|| tail[..4].to_string())
    });
    if let Some(random) = random {
        label.insert("id".into(), json!(format!("run-{random}")));
    }
    if let Some(objective) = present(assignment, "objective") {
        label.insert("title".into(), json!(objective));
    }
    Value::Object(label)
}

/// Display data for a slot: structured and written to the terminal only. The port builds the visible label from
/// these fields, so nothing here formats text. `agent` is reduced to its program name.
pub fn slot_display(fields: &Value) -> Value {
    let mut out = Map::new();
    for key in ["id", "title", "role"] {
        if let Some(text) = present(fields, key) {
            out.insert(key.into(), json!(text));
        }
    }
    if let Some(agent) = present(fields, "agent") {
        let name = agent
            .trim_end_matches('/')
            .rsplit('/')
            .next()
            .unwrap_or("")
            .to_string();
        out.insert("agent".into(), json!(name));
    }
    if let Some(model) = present(fields, "model") {
        out.insert("model".into(), json!(model));
    }
    Value::Object(out)
}
