//! Codex: payloads recorded on 0.161.0 (`contracts/fixtures/hooks/codex/`).
//! Field names match Claude Code's: `hook_event_name`, `stop_hook_active`,
//! and `agent_id`/`agent_type` on a subagent's event. `session_id` is the
//! thread id: the id `codex queue --thread` takes and the
//! `CODEX_THREAD_ID` the head's tool processes see. The hook process itself
//! sees no identity variable.
use super::{parse_named, session_id, Shape};
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
    Ok(Payload {
        event,
        // Both keys were recorded on a subagent's event; a Codex head that
        // carries either was not measured, so either marks a subagent.
        subordinate: object.contains_key("agent_id") || object.contains_key("agent_type"),
        first_stop,
        session: session_id(object),
    })
}

pub(super) fn shape(event: HookEvent) -> Option<Shape> {
    Some(match event {
        HookEvent::Stop => Shape::StopBlock,
        HookEvent::PostToolUse => Shape::PostToolUseContext,
    })
}
