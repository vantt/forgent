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
mod extension;
#[cfg(unix)]
pub mod payload_head;
#[cfg(unix)]
pub mod version;

use crate::head::Topology;
use crate::hook::{Adapter, HookEvent, Payload, Unparsed};
use fgos_mailbox_core::Cli;
use serde::de::IgnoredAny;
use serde::Deserialize;
use serde_json::{json, Map, Value};
use std::collections::{BTreeMap, BTreeSet};
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
    /// The text itself and a line end: a verb's stdout (`inbox --claim`),
    /// not a hook's.
    Plain,
    /// `{"inject":text,"method":"tool-result"}`: the answer to the generated
    /// pi/omp extension, which appends `text` after the tool's real output
    /// (both ends are ours, spec §7).
    ExtensionToolResult,
}

impl Shape {
    /// The output carrying `text`, built as JSON so any text is escaped.
    pub fn render(self, text: &str) -> String {
        let value = match self {
            Self::Plain => return format!("{text}\n"),
            Self::PostToolUseContext => json!({
                "hookSpecificOutput": {
                    "hookEventName": "PostToolUse",
                    "additionalContext": text,
                }
            }),
            Self::StopBlock => json!({ "decision": "block", "reason": text }),
            Self::ExtensionToolResult => json!({ "inject": text, "method": "tool-result" }),
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
            Self::Pi | Self::Omp => extension::parse(event, &object),
        }
    }

    /// The output shape this CLI was recorded injecting at `event`; `None`
    /// where no shape was proven.
    pub fn shape(self, event: HookEvent) -> Option<Shape> {
        match self {
            Self::Claude => claude::shape(event),
            Self::Codex => codex::shape(event),
            Self::Agy => agy::shape(event),
            Self::Pi | Self::Omp => extension::shape(event),
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
    /// Whether a `Stop` hook takes mail (`channels.stop.deliver`). When not,
    /// a `Stop` only registers the head, and a wake toward this CLI has no
    /// channel.
    pub stop_delivers: bool,
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
    channels: RawChannels,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct RawChannels {
    stop: RawChannel,
    post_tool_use: RawChannel,
}

/// One hook channel: whether it delivers mail, and the role its text was
/// recorded reaching the model under.
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RawChannel {
    deliver: bool,
    role: String,
    #[serde(rename = "source")]
    _source: String,
}

/// The role a channel's text reaches the model under, as the contract
/// records it: a provider-level message role, or a CLI transcript record
/// type where the provider-level role was not recorded. A closed set, so a
/// misspelt role (`User`, ` user`) is refused instead of passing the rule.
#[derive(Debug, Clone, PartialEq, Eq)]
enum ChannelRole {
    /// The model takes the text as its user's own request; no delivering
    /// channel may have it.
    User,
    Developer,
    System,
    Tool,
    /// A transcript record type (`transcript:<type>`): the provider-level
    /// role is unmeasured, an accepted residual named in the spec (§7.3).
    Transcript,
}

impl ChannelRole {
    fn parse(text: &str) -> Option<Self> {
        match text {
            "user" => Some(Self::User),
            "developer" => Some(Self::Developer),
            "system" => Some(Self::System),
            "tool" => Some(Self::Tool),
            _ => text
                .strip_prefix("transcript:")
                .filter(|kind| {
                    !kind.is_empty()
                        && kind
                            .chars()
                            .all(|c| c.is_ascii_alphanumeric() || matches!(c, ':' | '_' | '-'))
                })
                .map(|_| Self::Transcript),
        }
    }
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RawMeasured {
    versions: Vec<String>,
    platform: String,
}

/// The CLIs an adapters contract lists under `testedAgainst`, with the
/// hook facts of each. Only a tested CLI is drained; a deferred one is
/// quiet.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct TestedClis {
    clis: Vec<String>,
    versions: Vec<(String, String)>,
    facts: BTreeMap<String, AdapterFacts>,
    /// The platform each CLI's facts were measured on.
    platforms: BTreeMap<String, String>,
}

impl TestedClis {
    /// Parses an adapters contract. Refused: an unknown field, a tested
    /// CLI without `hookFacts`, facts for a CLI that is not tested, a
    /// `measuredOn` version not under `testedAgainst`, an unknown topology,
    /// a direct entry with a hook shell or without head executables, a
    /// one-shell-hop entry without an absolute hook shell, a delivering
    /// channel whose role is `user`, and a `PostToolUse` channel whose
    /// `deliver` disagrees with its output bound.
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
        let mut platforms = BTreeMap::new();
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
            platforms.insert(cli.clone(), entry.measured_on.platform.clone());
            facts.insert(cli.clone(), facts_of(&cli, entry)?);
        }
        if let Some(missing) = clis.iter().find(|cli| !facts.contains_key(*cli)) {
            return Err(ContractError(format!(
                "{missing} is tested but has no hookFacts"
            )));
        }
        let versions = raw
            .tested_against
            .into_iter()
            .map(|t| (t.cli, t.version))
            .collect();
        Ok(Self {
            clis,
            versions,
            facts,
            platforms,
        })
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

    /// Whether `version` of `cli` is listed under `testedAgainst`.
    pub fn lists_version(&self, cli: &str, version: &str) -> bool {
        self.versions.iter().any(|(c, v)| c == cli && v == version)
    }

    /// The measured hook facts of a tested CLI, only on the platform they
    /// were measured on (`std::env::consts::OS`): elsewhere the hook shell
    /// and head executables are unmeasured, so the CLI is quiet as untested
    /// instead of failing the caller check on every call.
    pub fn facts(&self, adapter: Adapter) -> Option<&AdapterFacts> {
        self.facts_here(adapter.word())
    }

    /// The facts of the CLI named `word`, only on the platform they were
    /// measured on: the one platform rule [`TestedClis::facts`], `tier` and
    /// `stop_drains` share.
    fn facts_here(&self, word: &str) -> Option<&AdapterFacts> {
        if self.platforms.get(word).map(String::as_str) != Some(std::env::consts::OS) {
            return None;
        }
        self.facts.get(word)
    }

    /// The tier `send` and `list` name for a head of `cli` (spec §6.2): `turn`
    /// where a step drain delivers (no wake channel is built yet), `pull`
    /// otherwise (mail only through `inbox --claim`).
    pub fn tier(&self, cli: &Cli) -> &'static str {
        let delivers = self
            .facts_here(cli.as_str())
            .is_some_and(|f| f.post_tool_use_max_bytes.is_some());
        if delivers {
            "turn"
        } else {
            "pull"
        }
    }

    /// The CLIs whose `Stop` takes mail, by the facts usable on this
    /// platform: what `send` passes the core, so a wake toward any other
    /// CLI, or one the contract does not know, has no channel.
    pub fn stop_drains(&self) -> BTreeSet<Cli> {
        self.clis
            .iter()
            .filter(|cli| self.facts_here(cli).is_some_and(|f| f.stop_delivers))
            .filter_map(|cli| Cli::new(cli).ok())
            .collect()
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
    for (name, channel) in [
        ("stop", &raw.channels.stop),
        ("postToolUse", &raw.channels.post_tool_use),
    ] {
        let Some(role) = ChannelRole::parse(&channel.role) else {
            return refuse(&format!(
                "channels.{name}.role {:?} is not a known role",
                channel.role
            ));
        };
        if channel.deliver && role == ChannelRole::User {
            return refuse(&format!("channels.{name} delivers under the user role"));
        }
    }
    if raw.channels.post_tool_use.deliver != raw.post_tool_use_context_max_bytes.is_some() {
        return refuse("channels.postToolUse.deliver disagrees with postToolUseContextMaxBytes");
    }
    Ok(AdapterFacts {
        topology,
        hook_shell,
        head_executables: raw.head_executables,
        post_tool_use_max_bytes: raw.post_tool_use_context_max_bytes,
        stop_delivers: raw.channels.stop.deliver,
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
