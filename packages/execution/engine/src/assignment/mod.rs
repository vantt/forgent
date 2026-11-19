//! The data side of one Assignment, before the runner: where its records live on disk, how it is built and stamped,
//! the brief a worker reads and the prompt it is given.
//!
//! One door per decision. Write-scope grammar is `fgos-write-scope`'s; the provider family, the governance gate and
//! the tool lookup are `fgos-execution`'s (`executor_model::resolve_executor_provider`,
//! `executor_model::resolve_executor_governance`, `tools::tool_providers`); the claim contract is
//! `run_result::claim`'s. This module adds only what has no other owner: the assignment tree layout, the builder and
//! its stamp, the brief, the prompt, the tier cell reader and the Work-item refusal.
//!
//! What it does not own: the execution contract validator and the operation prompt templates (the `contract`
//! module), and the persona text (the agent definitions). They reach this module through [`builder::ContractPort`]
//! and [`builder::PromptPort`], so no rule of theirs is copied here.
//!
//! Golden vectors: `packages/execution/contracts/assignment/`, replayed by `tests/assignment.rs`.

use serde_json::{json, Value};

pub mod brief;
pub mod builder;
pub mod layout;
pub mod normalizer;
pub mod tier_cell;
pub mod work_item_input;
pub mod write_scope;

/// Node's `RunnerConfigError`: a refusal with an optional failure id. The class's own home is the runner config
/// (`fgos-execution::runner_config`); this is the shape the assignment builder throws.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Refusal {
    pub message: String,
    pub code: Option<String>,
}

impl Refusal {
    pub fn new(message: impl Into<String>) -> Self {
        Refusal {
            message: message.into(),
            code: None,
        }
    }

    pub fn with_code(message: impl Into<String>, code: &str) -> Self {
        Refusal {
            message: message.into(),
            code: Some(code.to_string()),
        }
    }

    /// `{ name, category, code?, message }`, as the vectors state a thrown `RunnerConfigError`.
    pub fn to_json(&self) -> Value {
        let mut out = json!({ "name": "RunnerConfigError", "category": "validation" });
        if let Some(code) = &self.code {
            out["code"] = json!(code);
        }
        out["message"] = json!(self.message);
        out
    }
}

impl std::fmt::Display for Refusal {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for Refusal {}

/// JavaScript truthiness of a JSON value (`undefined` is `None`).
pub(crate) fn truthy(value: Option<&Value>) -> bool {
    match value {
        None | Some(Value::Null) => false,
        Some(Value::Bool(flag)) => *flag,
        Some(Value::Number(n)) => n.as_f64().is_some_and(|f| f != 0.0 && !f.is_nan()),
        Some(Value::String(text)) => !text.is_empty(),
        Some(_) => true,
    }
}

/// A present, non-null value: what `??` keeps.
pub(crate) fn present(value: Option<&Value>) -> Option<&Value> {
    value.filter(|v| !v.is_null())
}

/// JavaScript's `String(value)` for the values a template literal interpolates here.
pub(crate) fn js_str(value: Option<&Value>) -> String {
    match value {
        None => "undefined".to_string(),
        Some(Value::Null) => "null".to_string(),
        Some(Value::String(text)) => text.clone(),
        Some(Value::Bool(flag)) => flag.to_string(),
        Some(Value::Number(n)) => match n.as_f64() {
            Some(f) if f.fract() == 0.0 && f.abs() < 1e21 => format!("{}", f as i128),
            _ => n.to_string(),
        },
        Some(other) => other.to_string(),
    }
}

/// ECMAScript white space (`\s`, `trim`).
pub(crate) fn js_space(c: char) -> bool {
    matches!(c, '\u{0009}'..='\u{000d}' | '\u{0020}' | '\u{00a0}' | '\u{1680}' | '\u{2000}'..='\u{200a}' | '\u{2028}' | '\u{2029}' | '\u{202f}' | '\u{205f}' | '\u{3000}' | '\u{feff}')
}
