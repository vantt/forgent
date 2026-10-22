//! agy: payloads recorded on 1.4.4 (`contracts/fixtures/hooks/agy/`). The
//! payload names no event; a Stop carries `executionNum` (with `fullyIdle`
//! and `terminationReason`) and a PostToolUse `toolCall` (with `stepIdx`),
//! keys recorded only for that event. A
//! subagent runs as its own conversation and its events carry no marker, so
//! no agy event can be told to be the head's: every one is subordinate
//! (owner question Q1, option C). The Stop block was recorded injected;
//! agy 1.4.4 refused both PostToolUse context shapes.
use super::Shape;
use crate::hook::{HookEvent, Payload, Unparsed};
use serde_json::{Map, Value};

pub(super) fn parse(event: HookEvent, object: &Map<String, Value>) -> Result<Payload, Unparsed> {
    let marker = match event {
        HookEvent::Stop => "executionNum",
        HookEvent::PostToolUse => "toolCall",
    };
    if !object.contains_key(marker) {
        return Err(Unparsed::EventMismatch);
    }
    let first_stop = match event {
        HookEvent::Stop => object
            .get("executionNum")
            .and_then(Value::as_u64)
            .map(|n| n == 0),
        HookEvent::PostToolUse => None,
    };
    Ok(Payload {
        event,
        subordinate: true,
        first_stop,
        thread: None,
    })
}

pub(super) fn shape(event: HookEvent) -> Option<Shape> {
    match event {
        HookEvent::Stop => Some(Shape::StopBlock),
        HookEvent::PostToolUse => None,
    }
}
