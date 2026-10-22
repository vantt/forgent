//! One adapter per CLI (spec §4.1): its hook payload's field names and the
//! output shape that CLI was recorded injecting
//! (`packages/mailbox/contracts/fixtures/hooks/<cli>/`). Adapters do no I/O
//! and know nothing of the mailbox's state.
#![deny(clippy::unwrap_used, clippy::expect_used, clippy::panic)]
mod agy;
mod claude;
#[cfg(unix)]
pub mod claude_head;
mod codex;

use crate::head::Topology;
use crate::hook::{Adapter, HookEvent, Payload, Unparsed};
use serde::de::IgnoredAny;
use serde::Deserialize;
use serde_json::{json, Map, Value};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
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
}

/// The measured hook facts of one drained CLI (`hookFacts.<cli>` of the
/// adapters contract): how the CLI starts its hook command, which process
/// may sit at the head position, and how large a `PostToolUse` drain's
/// output may be.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AdapterFacts {
    pub topology: Topology,
    /// The path the CLI invokes for a hook command under one shell hop
    /// (checked against the hop parent's executable and argv[0]); `None`
    /// for a direct topology.
    pub hook_shell: Option<PathBuf>,
    /// Executable basenames accepted at a direct head position; may be
    /// empty under one shell hop, where the head finder binds the head.
    pub head_executables: Vec<String>,
    /// The bound of a `PostToolUse` drain's output; `None`: no drain at
    /// that event, only at Stop and `inbox --claim`.
    pub post_tool_use_max_bytes: Option<u64>,
}

/// Why an adapters contract was refused; names the offending entry.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ContractError(pub String);

impl std::fmt::Display for ContractError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "adapters contract refused: {}", self.0)
    }
}

impl std::error::Error for ContractError {}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct RawContract {
    #[serde(rename = "contract")]
    _contract: IgnoredAny,
    #[serde(rename = "description")]
    _description: String,
    #[serde(rename = "source")]
    _source: String,
    tested_against: Vec<RawTested>,
    hook_facts: BTreeMap<String, RawFacts>,
    #[serde(rename = "deferred")]
    _deferred: IgnoredAny,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RawTested {
    cli: String,
    version: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct RawFacts {
    measured_on: RawMeasured,
    hook_topology: String,
    hook_shell: Option<String>,
    head_executables: Vec<String>,
    post_tool_use_context_max_bytes: Option<u64>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RawMeasured {
    versions: Vec<String>,
    #[serde(rename = "platform")]
    _platform: String,
}

/// The CLIs an adapters contract lists under `testedAgainst`, with the
/// hook facts of each. Only a tested CLI is drained; a deferred one is
/// quiet.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct TestedClis {
    clis: Vec<String>,
    facts: BTreeMap<String, AdapterFacts>,
}

impl TestedClis {
    /// Parses an adapters contract. Refused: an unknown field, a tested
    /// CLI without `hookFacts`, facts for a CLI that is not tested, a
    /// `measuredOn` version not under `testedAgainst`, an unknown topology,
    /// a direct entry with a hook shell or without head executables, and a
    /// one-shell-hop entry without an absolute hook shell.
    pub fn from_contract(text: &str) -> Result<Self, ContractError> {
        let raw: RawContract =
            serde_json::from_str(text).map_err(|e| ContractError(e.to_string()))?;
        let mut clis: Vec<String> = Vec::new();
        for entry in &raw.tested_against {
            if !clis.contains(&entry.cli) {
                clis.push(entry.cli.clone());
            }
        }
        let mut facts = BTreeMap::new();
        for (cli, entry) in raw.hook_facts {
            if !clis.contains(&cli) {
                return Err(ContractError(format!(
                    "hookFacts.{cli}: {cli} is not tested"
                )));
            }
            for version in &entry.measured_on.versions {
                let listed = raw
                    .tested_against
                    .iter()
                    .any(|t| t.cli == cli && &t.version == version);
                if !listed {
                    return Err(ContractError(format!(
                        "hookFacts.{cli}.measuredOn: {version} is not under testedAgainst"
                    )));
                }
            }
            facts.insert(cli.clone(), facts_of(&cli, entry)?);
        }
        if let Some(missing) = clis.iter().find(|cli| !facts.contains_key(*cli)) {
            return Err(ContractError(format!(
                "{missing} is tested but has no hookFacts"
            )));
        }
        Ok(Self { clis, facts })
    }

    /// The contract this crate was built with. Its own test proves it
    /// parses; were it ever refused, every CLI would stay quiet.
    pub fn embedded() -> &'static Self {
        static TESTED: OnceLock<TestedClis> = OnceLock::new();
        TESTED.get_or_init(|| Self::from_contract(ADAPTERS_CONTRACT).unwrap_or_default())
    }

    pub fn contains(&self, adapter: Adapter) -> bool {
        self.clis.iter().any(|cli| cli == adapter.word())
    }

    /// The measured hook facts of a tested CLI.
    pub fn facts(&self, adapter: Adapter) -> Option<&AdapterFacts> {
        self.facts.get(adapter.word())
    }
}

fn facts_of(cli: &str, raw: RawFacts) -> Result<AdapterFacts, ContractError> {
    let refuse = |why: &str| Err(ContractError(format!("hookFacts.{cli}: {why}")));
    let topology = match raw.hook_topology.as_str() {
        "direct" => Topology::Direct,
        "one-shell-hop" => Topology::OneShellHop,
        other => return refuse(&format!("unknown hookTopology {other}")),
    };
    let hook_shell = raw.hook_shell.map(PathBuf::from);
    match topology {
        Topology::Direct if hook_shell.is_some() => {
            return refuse("a direct topology has no hookShell")
        }
        Topology::Direct if raw.head_executables.is_empty() => {
            return refuse("a direct topology names its headExecutables")
        }
        Topology::OneShellHop if !hook_shell.as_deref().is_some_and(Path::is_absolute) => {
            return refuse("a one-shell-hop topology names an absolute hookShell")
        }
        _ => {}
    }
    Ok(AdapterFacts {
        topology,
        hook_shell,
        head_executables: raw.head_executables,
        post_tool_use_max_bytes: raw.post_tool_use_context_max_bytes,
    })
}

/// The Claude Code and Codex payload rule: `hook_event_name` names the
/// event.
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

/// The payload's `session_id`, when it is a non-empty string.
fn session_id(object: &Map<String, Value>) -> Option<String> {
    object
        .get("session_id")
        .and_then(Value::as_str)
        .filter(|id| !id.is_empty())
        .map(String::from)
}
