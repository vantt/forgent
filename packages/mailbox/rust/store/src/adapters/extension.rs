//! pi and omp: the payload the generated extension (`src/setup/agent-hooks.mjs`)
//! writes, recorded on pi 1.4.0 and omp 18.12.6
//! (`contracts/fixtures/hooks/{pi,omp}/`). Both ends are ours: the extension
//! names the event in `hook_event_name` as Claude Code and Codex do, the
//! session in `session_id` (`ctx.sessionManager.getSessionId()`), and sets
//! `subagent` when the session's header names a parent session (an omp
//! `task` subagent runs its own copy of the extension in the head's process;
//! pi has no subagent). The host answers in [`shape`], which the extension
//! appends after the tool's real output: the method recorded reaching the
//! provider as tool output on both CLIs.
use super::{parse_named, session_id, Shape};
use crate::hook::{HookEvent, Payload, Unparsed};
use serde_json::{Map, Value};

/// The answer the extension applies at a tool result. A `Stop` takes no mail
/// for these CLIs (their adapters contract entry says so), so it has no shape:
/// the extension's end-of-run call only registers the head.
pub(super) fn shape(event: HookEvent) -> Option<Shape> {
    match event {
        HookEvent::PostToolUse => Some(Shape::ExtensionToolResult),
        HookEvent::Stop => None,
    }
}

pub(super) fn parse(event: HookEvent, object: &Map<String, Value>) -> Result<Payload, Unparsed> {
    parse_named(event, object)?;
    Ok(Payload {
        event,
        // Anything but an explicit `false` is a subagent's or unknown: quiet.
        subordinate: object.get("subagent") != Some(&Value::Bool(false)),
        first_stop: None,
        session: session_id(object),
    })
}
