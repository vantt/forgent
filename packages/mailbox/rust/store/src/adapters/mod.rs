//! One adapter per CLI (spec §4.1): its hook payload's field names and the
//! output shape that CLI was recorded injecting
//! (`packages/mailbox/contracts/fixtures/hooks/<cli>/`). Adapters do no I/O
//! and know nothing of the mailbox's state.
#![deny(clippy::unwrap_used, clippy::expect_used, clippy::panic)]
mod agy;
mod claude;
mod codex;

use crate::hook::{Adapter, HookEvent, Payload, Unparsed};
use serde_json::{json, Map, Value};
use std::sync::OnceLock;

const ADAPTERS_CONTRACT: &str = include_str!("../../../../contracts/adapters.v1.json");

/// An output shape a CLI was recorded injecting.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Shape {
    /// `{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":text}}`
    PostToolUseContext,
    /// `{"decision":"block","reason":text}`
    StopBlock,
}

impl Shape {
    /// The output carrying `text`, built as JSON so any text is escaped.
    pub fn render(self, text: &str) -> String {
        let value = match self {
            Self::PostToolUseContext => json!({
                "hookSpecificOutput": {
                    "hookEventName": "PostToolUse",
                    "additionalContext": text,
                }
            }),
            Self::StopBlock => json!({ "decision": "block", "reason": text }),
        };
        value.to_string()
    }
}

impl Adapter {
    /// The facts of one payload of `event`.
    pub fn parse(self, event: HookEvent, stdin: &[u8]) -> Result<Payload, Unparsed> {
        let object = match serde_json::from_slice::<Value>(stdin) {
            Ok(Value::Object(object)) => object,
            _ => return Err(Unparsed::Malformed),
        };
        match self {
            Self::Claude => claude::parse(event, &object),
            Self::Codex => codex::parse(event, &object),
            Self::Agy => agy::parse(event, &object),
        }
    }

    /// The output shape this CLI was recorded injecting at `event`; `None`
    /// where no shape was proven.
    pub fn shape(self, event: HookEvent) -> Option<Shape> {
        match self {
            Self::Claude => claude::shape(event),
            Self::Codex => codex::shape(event),
            Self::Agy => agy::shape(event),
        }
    }

    /// Whether the adapters contract lists this CLI under `testedAgainst`.
    /// Only a tested CLI is drained; a deferred one is quiet.
    pub fn is_tested(self) -> bool {
        tested_clis().iter().any(|cli| cli == self.word())
    }
}

fn tested_clis() -> &'static [String] {
    static TESTED: OnceLock<Vec<String>> = OnceLock::new();
    TESTED.get_or_init(|| {
        let contract: Value = serde_json::from_str(ADAPTERS_CONTRACT).unwrap_or(Value::Null);
        contract["testedAgainst"]
            .as_array()
            .map(|entries| {
                entries
                    .iter()
                    .filter_map(|entry| entry["cli"].as_str().map(String::from))
                    .collect()
            })
            .unwrap_or_default()
    })
}

/// The Claude Code and Codex payload rules, which share field names:
/// `hook_event_name` names the event, and the key `agent_id` or
/// `agent_type`, whatever its value, marks a subagent's event.
fn parse_named(event: HookEvent, object: &Map<String, Value>) -> Result<(), Unparsed> {
    let expected = match event {
        HookEvent::Stop => "Stop",
        HookEvent::PostToolUse => "PostToolUse",
    };
    if object.get("hook_event_name").and_then(Value::as_str) != Some(expected) {
        return Err(Unparsed::EventMismatch);
    }
    Ok(())
}

fn has_subagent_marker(object: &Map<String, Value>) -> bool {
    object.contains_key("agent_id") || object.contains_key("agent_type")
}
