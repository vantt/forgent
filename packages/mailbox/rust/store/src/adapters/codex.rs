//! Codex: not recorded at V3 (the account's login had expired). The field
//! names come from the S0 report
//! (`plans/reports/research-261020-1612-mailbox-s0-human-input-and-peer-prompt-hooks.md`):
//! real Codex payloads carry `hook_event_name` and `session_id`, the thread
//! id `codex queue --thread` takes, and the binary's schema adds `agent_id`
//! and `agent_type` for a subagent. No Stop or PostToolUse payload, and so
//! no first-Stop marker, was recorded, and no output shape was proven:
//! both stay deferred.
use super::{has_subagent_marker, parse_named, Shape};
use crate::hook::{HookEvent, Payload, Unparsed};
use serde_json::{Map, Value};

pub(super) fn parse(event: HookEvent, object: &Map<String, Value>) -> Result<Payload, Unparsed> {
    parse_named(event, object)?;
    let thread = object
        .get("session_id")
        .and_then(Value::as_str)
        .filter(|id| !id.is_empty())
        .map(String::from);
    Ok(Payload {
        event,
        subordinate: has_subagent_marker(object),
        first_stop: None,
        thread,
    })
}

pub(super) fn shape(_event: HookEvent) -> Option<Shape> {
    None
}
