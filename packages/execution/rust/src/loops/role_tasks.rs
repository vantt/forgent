//! What each seat of a collaboration pattern is FOR, as data, and the one helper that tells a seat its task.
//!
//! Every role of one Unit run is dispatched with the unit's objective, which is the producer's task; the pattern
//! owns what its roles mean, so the pattern wraps the objective for the role and the runner only honours the
//! unit it is handed. `params.roleTasks[seat]` (or `[kind]`) replaces the default text; `{objective}` in a task
//! stands for the unit's original objective.

use super::role_tasks_data::DEFAULT_ROLE_TASKS;
use crate::seat_resolver::value::{get, items};
use serde_json::{json, Value};

/// What a role is told: `seat` is the id being dispatched, `kind` the default-task key (a task kind the pattern
/// owns, not a seat id), `stance` marks a panel member whose stance is measured, `findings` are what the
/// previous round's checks found, listed for a producer.
#[derive(Debug, Clone)]
pub struct RoleAsk<'a> {
    pub seat: &'a str,
    pub kind: &'a str,
    pub stance: bool,
    pub params: &'a Value,
    pub findings: &'a [Value],
}

impl<'a> RoleAsk<'a> {
    pub fn new(seat: &'a str, params: &'a Value) -> Self {
        RoleAsk {
            seat,
            kind: seat,
            stance: false,
            params,
            findings: &[],
        }
    }

    pub fn kind(mut self, kind: &'a str) -> Self {
        self.kind = kind;
        self
    }

    pub fn stance(mut self) -> Self {
        self.stance = true;
        self
    }

    pub fn findings(mut self, findings: &'a [Value]) -> Self {
        self.findings = findings;
        self
    }
}

/// `String(value)` as the unit text a role reads.
pub(crate) fn js_text(value: Option<&Value>) -> String {
    match value {
        None => "undefined".to_string(),
        Some(Value::String(s)) => s.clone(),
        Some(Value::Array(list)) => list
            .iter()
            .map(|v| js_text(Some(v)))
            .collect::<Vec<_>>()
            .join(","),
        Some(Value::Object(_)) => "[object Object]".to_string(),
        Some(other) => other.to_string(),
    }
}

fn wrap(task: &str, objective: &str) -> String {
    if task.contains("{objective}") {
        task.replace("{objective}", objective)
    } else {
        format!("{task}\n\n{objective}")
    }
}

fn default_task(kind: &str) -> Option<&'static str> {
    DEFAULT_ROLE_TASKS
        .iter()
        .find(|(k, _)| *k == kind)
        .map(|(_, t)| *t)
}

/// The unit as `ask.seat` should see it. Returns the very same unit when the role has no task and there is
/// nothing to add, so a pattern can call this for every role without changing the ones that need no wrapping.
pub fn role_unit(unit: &Value, ask: &RoleAsk) -> Value {
    let override_task = |key: &str| get(ask.params, "roleTasks").and_then(|t| get(t, key));
    let task = override_task(ask.seat)
        .or_else(|| override_task(ask.kind))
        .map(|t| t.as_str().map(str::to_string))
        .unwrap_or_else(|| default_task(ask.kind).map(str::to_string));
    let has_findings = !ask.findings.is_empty();
    let stance_options = get(unit, "stanceOptions")
        .cloned()
        .unwrap_or_else(|| json!([]));
    let has_stance = ask.stance && !items(Some(&stance_options)).is_empty();
    if task.is_none() && !has_findings && !has_stance {
        return unit.clone();
    }
    let original = js_text(unit.get("objective"));
    let mut objective = match &task {
        Some(task) => wrap(task, &original),
        None => original,
    };
    if has_findings {
        let lines = ask
            .findings
            .iter()
            .map(|f| format!("- {}", js_text(Some(f))))
            .collect::<Vec<_>>()
            .join("\n");
        objective.push_str(&format!(
            "\n\nThe previous round's checks reported these findings. Fix them and change nothing else:\n{lines}"
        ));
    }
    if has_stance {
        objective.push_str(&format!(
            "\n\nPassive stance measurement for this question. Declared choices: {stance_options}; \"other\" is also allowed.\nEnd your report by stating your stance and include \"stance\": {{\"choice\": <one declared choice or \"other\">, \"confidence\": <number from 0 to 1>}} in your result claim. This optional measurement never changes whether your work passes."
        ));
    }
    let mut out = unit.clone();
    if let Some(map) = out.as_object_mut() {
        map.insert("objective".into(), json!(objective));
    }
    out
}
