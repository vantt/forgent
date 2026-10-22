//! Claude Code: payloads recorded on 2.1.307
//! (`contracts/fixtures/hooks/claude/`).
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
    Ok(Payload {
        event,
        subordinate: has_subagent_marker(object),
        first_stop,
        thread: None,
    })
}

pub(super) fn shape(event: HookEvent) -> Option<Shape> {
    Some(match event {
        HookEvent::Stop => Shape::StopBlock,
        HookEvent::PostToolUse => Shape::PostToolUseContext,
    })
}
