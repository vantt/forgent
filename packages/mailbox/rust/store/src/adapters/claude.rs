//! Claude Code: payloads recorded on 2.1.307 and again on 2.1.308, which
//! matched in structure (`contracts/fixtures/hooks/claude/` holds the 2.1.308
//! recording). A subagent's event carries
//! `agent_id`; a head session started with `--agent` carries `agent_type`
//! alone on its own events (recorded), so only `agent_id`, whatever its
//! value, marks a subagent.
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
        subordinate: object.contains_key("agent_id"),
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
