//! Dispatch takes generic inputs only, never a Work item.

use serde_json::Value;

use super::Refusal;

/// Option names that once carried a Work item (or the pieces dispatch used to read off one) into dispatch. A caller
/// still passing one is refused instead of having it silently ignored.
pub const WORK_ITEM_KEYS: [&str; 2] = ["work", "workItem"];
pub const WORK_ITEM_INPUT_KEYS: [&str; 3] = ["work", "workItem", "workExecutorId"];

/// Refuses when `params` still carries a Work item input; `where_` names the entry point. `keys` narrows the check
/// (a `--work` hint legitimately carries `workExecutorId`).
pub fn refuse_work_item_input(params: &Value, where_: &str, keys: &[&str]) -> Result<(), Refusal> {
    let found: Vec<&str> = match params.as_object() {
        Some(object) => keys
            .iter()
            .copied()
            .filter(|key| object.contains_key(*key))
            .collect(),
        None => Vec::new(),
    };
    if found.is_empty() {
        return Ok(());
    }
    Err(Refusal::new(format!(
        "{where_} takes no Work item ({}): pass its demand as generic inputs (assignment rigor/domain, a work hint, capability hints, agent type)",
        found.join(", ")
    )))
}
