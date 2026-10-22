//! Codex: payloads recorded on 0.161.0 (`contracts/fixtures/hooks/codex/`).
//! Field names match Claude Code's: `hook_event_name`, `stop_hook_active`,
//! and `agent_id`/`agent_type` on a subagent's event. `session_id` is the
//! thread id: the id `codex queue --thread` takes and the
//! `CODEX_THREAD_ID` the head's tool processes see. The hook process itself
//! sees no session-identity variable.
use super::{has_subagent_marker, parse_named, Shape};
use crate::hook::{HookEvent, Payload, Unparsed};
use serde_json::{Map, Value};

pub(super) fn parse(event: HookEvent, object: &Map<String, Value>) -> Result<Payload, Unparsed> {
    parse_named(event, object)?;
    let first_stop = match event {
        HookEvent::Stop => object
            .get("stop_hook_active")
            .and_then(Value::as_bool)
            .map(|active| !active),
        HookEvent::PostToolUse => None,
    };
    let thread = object
        .get("session_id")
        .and_then(Value::as_str)
        .filter(|id| !id.is_empty())
        .map(String::from);
    Ok(Payload {
        event,
        subordinate: has_subagent_marker(object),
        first_stop,
        thread,
    })
}

pub(super) fn shape(event: HookEvent) -> Option<Shape> {
    Some(match event {
        HookEvent::Stop => Shape::StopBlock,
        HookEvent::PostToolUse => Shape::PostToolUseContext,
    })
}
