//! Input and output shapes of the two stages. All JSON is camelCase and
//! versioned by `protocol`. Nothing here reads a clock, the environment or a
//! file: every machine fact arrives as data (`launchView`, `accountView`,
//! `now`), and effective rigor arrives as an input.

use crate::tier::{Effort, Rigor, Tier};
use serde::de::DeserializeOwned;
use serde::{Deserialize, Deserializer, Serialize};
use std::collections::BTreeMap;

pub const PROTOCOL: u32 = 1;

/// The five seat roles.
pub const ROLES: [&str; 5] = ["producer", "synthesizer", "reviewer", "red-team", "judge"];

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Role {
    Producer,
    Synthesizer,
    Reviewer,
    RedTeam,
    Judge,
}

impl Role {
    pub fn name(self) -> &'static str {
        match self {
            Role::Producer => "producer",
            Role::Synthesizer => "synthesizer",
            Role::Reviewer => "reviewer",
            Role::RedTeam => "red-team",
            Role::Judge => "judge",
        }
    }
}

/// A refusal names its reason and, where one exists, the config line to change.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, thiserror::Error)]
#[error("{reason}: {detail}")]
#[serde(rename_all = "camelCase")]
pub struct Refusal {
    pub reason: String,
    pub detail: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub config: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub peers: Vec<PeerRef>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub rendered: Vec<Effort>,
    /// How many candidates the seat's config named before any filter ran; zero lets the caller
    /// tell "nothing configured" from "everything filtered".
    #[serde(default)]
    pub configured: usize,
}

impl Refusal {
    pub fn new(reason: &str, detail: impl Into<String>) -> Self {
        Refusal {
            reason: reason.to_string(),
            detail: detail.into(),
            config: None,
            peers: Vec::new(),
            rendered: Vec::new(),
            configured: 0,
        }
    }

    pub fn at(mut self, config: impl Into<String>) -> Self {
        self.config = Some(config.into());
        self
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct PeerRef {
    pub seat: String,
    pub family: String,
}

// ---------------------------------------------------------------- config

/// A map that ignores the `"$comment"` key the setup writes beside real entries.
#[derive(Debug, Clone, PartialEq)]
pub struct Table<T>(pub BTreeMap<String, T>);

impl<T> Default for Table<T> {
    fn default() -> Self {
        Table(BTreeMap::new())
    }
}

impl<'de, T: DeserializeOwned> Deserialize<'de> for Table<T> {
    fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        let raw: BTreeMap<String, serde_json::Value> = BTreeMap::deserialize(d)?;
        let mut out = BTreeMap::new();
        for (key, value) in raw {
            if key == "$comment" {
                continue;
            }
            let parsed = serde_json::from_value(value).map_err(serde::de::Error::custom)?;
            out.insert(key, parsed);
        }
        Ok(Table(out))
    }
}

impl<T: Serialize> Serialize for Table<T> {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        self.0.serialize(s)
    }
}

/// `"<model>[@<pool>]"` or `{model, pool?, effort?}`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum CellEntrySpec {
    Text(String),
    Object {
        model: String,
        #[serde(default)]
        pool: Option<String>,
        #[serde(default)]
        effort: Option<Effort>,
    },
}

/// One cell: a single entry, or an ordered non-empty list.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Cell {
    One(CellEntrySpec),
    Many(Vec<CellEntrySpec>),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CellEntry {
    pub model: String,
    /// `None` means the pool of the family.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pool: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub effort: Option<Effort>,
}

impl Cell {
    pub fn entries(&self) -> Result<Vec<CellEntry>, String> {
        let specs: Vec<&CellEntrySpec> = match self {
            Cell::One(one) => vec![one],
            Cell::Many(many) => many.iter().collect(),
        };
        if specs.is_empty() {
            return Err("a cell list must not be empty".to_string());
        }
        specs
            .into_iter()
            .map(|spec| match spec {
                CellEntrySpec::Text(text) => {
                    let (model, pool) = match text.rsplit_once('@') {
                        Some((model, pool)) if !model.is_empty() && !pool.is_empty() => {
                            (model.to_string(), Some(pool.to_string()))
                        }
                        _ => (text.clone(), None),
                    };
                    if model.trim().is_empty() {
                        return Err("a cell model must not be empty".to_string());
                    }
                    Ok(CellEntry { model, pool, effort: None })
                }
                CellEntrySpec::Object { model, pool, effort } => {
                    if model.trim().is_empty() {
                        return Err("a cell model must not be empty".to_string());
                    }
                    Ok(CellEntry { model: model.clone(), pool: pool.clone(), effort: *effort })
                }
            })
            .collect()
    }
}

/// `prefer` entry: an executor id, or `{executor, invocation}` (the pin).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Prefer {
    Executor(String),
    Pinned {
        executor: String,
        #[serde(default)]
        invocation: Option<String>,
    },
}

impl Prefer {
    pub fn executor(&self) -> &str {
        match self {
            Prefer::Executor(id) => id,
            Prefer::Pinned { executor, .. } => executor,
        }
    }

    pub fn invocation(&self) -> Option<&str> {
        match self {
            Prefer::Executor(_) => None,
            Prefer::Pinned { invocation, .. } => invocation.as_deref(),
        }
    }
}

/// `roles.<role>`, `personas.<name>`, `seats.<seat>` entries.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Scope {
    #[serde(default)]
    pub tier: Option<Tier>,
    #[serde(default)]
    pub prefer: Option<Vec<Prefer>>,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CapabilityEntry {
    #[serde(default)]
    pub tier: Option<Tier>,
    #[serde(default)]
    pub max_tier: Option<Tier>,
    #[serde(default)]
    pub prefer: Option<Vec<Prefer>>,
    #[serde(default)]
    pub roles: Table<Scope>,
    #[serde(default)]
    pub personas: Table<Scope>,
    #[serde(default)]
    pub seats: Table<Scope>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Defaults {
    #[serde(default = "default_tier")]
    pub tier: Tier,
}

impl Default for Defaults {
    fn default() -> Self {
        Defaults { tier: default_tier() }
    }
}

fn default_tier() -> Tier {
    Tier::Standard
}

/// The slice of the runner config seat choice reads.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    #[serde(default)]
    pub defaults: Defaults,
    #[serde(default)]
    pub max_tier: Option<Tier>,
    #[serde(default)]
    pub tier_fallback: Table<Vec<String>>,
    #[serde(default)]
    pub model_policies: Table<Table<Cell>>,
    #[serde(default)]
    pub capabilities: Table<CapabilityEntry>,
}

// ------------------------------------------------------------------- ask

/// A tier the workflow recommends on the seat and where it was declared
/// (`workflow:<id>/<unit>/<seat>`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct WorkflowTier {
    pub tier: Tier,
    pub source: String,
}

/// Values a door chose; each replaces the workflow-declared value of the same name.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct Selectors {
    #[serde(default)]
    pub persona: Option<String>,
    #[serde(default)]
    pub seat: Option<String>,
    #[serde(default)]
    pub capability: Option<String>,
}

impl Selectors {
    pub fn is_empty(&self) -> bool {
        self.persona.is_none() && self.seat.is_none() && self.capability.is_none()
    }
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Override {
    #[serde(default)]
    pub tier: Option<Tier>,
    #[serde(default)]
    pub executor: Option<String>,
    #[serde(default)]
    pub invocation: Option<String>,
    #[serde(default)]
    pub effort: Option<Effort>,
    /// `pool/account`.
    #[serde(default)]
    pub account: Option<String>,
    /// Ignored unless the ask is `raiseAuthorized`.
    #[serde(default)]
    pub accept_dependence: bool,
    /// A run-wide pin is skipped for a seat it cannot apply to, never refused.
    #[serde(default)]
    pub run_wide: bool,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Posture {
    #[serde(default)]
    pub read_only: bool,
    #[serde(default)]
    pub force_out_of_process: bool,
    #[serde(default)]
    pub blind: bool,
}

/// Seat names (or provider families) a seat must or should differ from.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Independence {
    #[serde(default)]
    pub hard: Vec<String>,
    /// Other checkers: hard at high and critical effective rigor, soft below.
    #[serde(default)]
    pub hard_checkers: Vec<String>,
    #[serde(default)]
    pub soft: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Ask {
    pub capability: String,
    pub seat: String,
    pub role: Role,
    #[serde(default)]
    pub persona: Option<String>,
    /// `<workflow> / <unit>` for `explain`.
    #[serde(default)]
    pub label: Option<String>,
    #[serde(default)]
    pub workflow: Option<WorkflowTier>,
    #[serde(default)]
    pub selectors: Selectors,
    #[serde(default)]
    pub raise_authorized: bool,
    #[serde(default, rename = "override")]
    pub override_: Option<Override>,
    #[serde(default)]
    pub posture: Posture,
    /// An input: Node's seat resolver is the one authority for effective rigor.
    #[serde(default)]
    pub effective_rigor: Rigor,
    #[serde(default)]
    pub independence: Independence,
    #[serde(default)]
    pub required_skills: Vec<String>,
}

// ------------------------------------------------------------- machine facts

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ExecutorKind {
    Agent,
    Tool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Mechanism {
    OutOfProcess,
    InProcess,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InvocationFacts {
    pub id: String,
    /// The CLI whose login store the invocation reads.
    #[serde(default)]
    pub cli: Option<String>,
    /// Effort levels the CLI can render.
    #[serde(default)]
    pub efforts: Vec<Effort>,
    #[serde(default = "yes")]
    pub carries_posture: bool,
}

fn yes() -> bool {
    true
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutorFacts {
    pub kind: ExecutorKind,
    pub family: String,
    pub mechanism: Mechanism,
    /// Set when governance disallows the executor; the text is the detail.
    #[serde(default)]
    pub disallowed: Option<String>,
    #[serde(default)]
    pub skills: Vec<String>,
    #[serde(default)]
    pub invocations: Vec<InvocationFacts>,
    /// The invocation the transport picks when nothing pins one; none can carry the posture when absent.
    #[serde(default)]
    pub default_invocation: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct LaunchView {
    #[serde(default)]
    pub executors: BTreeMap<String, ExecutorFacts>,
}

impl LaunchView {
    /// An executor by id, else the one that serves the family (one agent executor per family).
    pub fn find(&self, name: &str) -> Option<(&String, &ExecutorFacts)> {
        self.executors.get_key_value(name).or_else(|| {
            self.executors
                .iter()
                .find(|(_, facts)| facts.kind == ExecutorKind::Agent && facts.family == name)
        })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "kebab-case")]
pub enum Probe {
    #[default]
    Unprobed,
    Ok,
    Failed,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountFacts {
    pub id: String,
    /// CLI names the account holds a login store for; never homes or paths.
    #[serde(default)]
    pub clis: Vec<String>,
    #[serde(default)]
    pub disabled: bool,
    #[serde(default)]
    pub sticky: bool,
    /// Epoch milliseconds; the account is out while `now` is before it.
    #[serde(default)]
    pub quarantined_until: Option<u64>,
    #[serde(default)]
    pub probe: Probe,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct AccountView {
    #[serde(default)]
    pub pools: BTreeMap<String, Vec<AccountFacts>>,
}

// ------------------------------------------------------------ peers and walk

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Peer {
    pub seat: String,
    #[serde(default)]
    pub role: Option<Role>,
    pub executor: String,
    pub family: String,
}

/// What names one candidate of a seat's walk.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Identity {
    pub executor: String,
    #[serde(default)]
    pub invocation: Option<String>,
    #[serde(default)]
    pub pool: Option<String>,
    #[serde(default)]
    pub model: Option<String>,
    #[serde(default)]
    pub effort: Option<Effort>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct PoolAccount {
    pub pool: String,
    pub account: String,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Walk {
    /// Earlier bindings of the seat, oldest first; the last one failed.
    #[serde(default)]
    pub tried: Vec<Identity>,
    #[serde(default)]
    pub exclude_pools: Vec<String>,
    #[serde(default)]
    pub failed_accounts: Vec<PoolAccount>,
    /// A multi-round seat keeps executor, model and effort; only its account may rotate.
    #[serde(default)]
    pub continuity: Option<Identity>,
}

// ----------------------------------------------------------------- outputs

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MaxTier {
    pub value: Tier,
    pub source: String,
    pub applied: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Lowered {
    pub from: Tier,
    pub from_source: String,
    pub reason: String,
}

/// Stage 1 result: tier, ceiling, ordered executors and the cells at the final tier.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Policy {
    pub tier: Tier,
    /// The config path, `workflow:<id>/<unit>/<seat>`, `override`, or the `maxTier` line when it lowered the tier.
    pub tier_source: String,
    /// Names the selector that raised the tier when a door chose one.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub raised_by: Option<String>,
    /// The workflow's recommendation when the chosen tier is not it.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub recommendation: Option<WorkflowTier>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub lowered_from: Option<Lowered>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max_tier: Option<MaxTier>,
    pub definition: String,
    pub prefer: Vec<Prefer>,
    pub prefer_source: String,
    /// `tierFallback.<tier>`: family names, the walk order after the first list.
    pub tier_fallback: Vec<String>,
    /// Cells at the final tier by family; a family without a key serves no cell.
    pub cells: BTreeMap<String, Vec<CellEntry>>,
    /// Config path that sets this seat's tier (the line to edit).
    pub seat_tier_path: String,
    pub effective_rigor: Rigor,
    pub ask: Ask,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Candidate {
    pub executor: String,
    pub family: String,
    pub invocation: Option<String>,
    pub model: Option<String>,
    pub model_source: String,
    pub effort: Option<Effort>,
    /// `cell`, `override` or `invocation-default`.
    pub effort_source: String,
    pub pool: Option<String>,
    /// Usable accounts in lease order; empty when the pool has none (the executor's own login).
    pub accounts: Vec<String>,
    pub account: Option<String>,
    pub mechanism: Mechanism,
    pub source: String,
    pub pinned: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Skip {
    pub executor: String,
    pub family: String,
    pub reason: String,
    pub detail: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub config: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Ranked {
    pub candidates: Vec<Candidate>,
    pub skipped: Vec<Skip>,
    /// Filters that moved the seat off its first-listed candidate: `independence`, `spread`.
    pub moved_by: Vec<String>,
    /// Soft peers whose family the seat shares, recorded when spread could not avoid it.
    pub shared_with: Vec<String>,
    /// The peers the seat is hard-independent of at this effective rigor.
    pub independent_of: Vec<PeerRef>,
    /// Families a failure walks to after the first candidate: `tierFallback.<tier>` within the seat's list.
    pub fallback_families: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub refusal: Option<Refusal>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Explain {
    pub lines: Vec<String>,
}

impl Explain {
    pub fn text(&self) -> String {
        self.lines.join("\n")
    }
}

/// Everything one `bind` call needs; the facade collects it, the crate decides from it alone.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BindInput {
    pub protocol: u32,
    pub ask: Ask,
    pub config: Config,
    #[serde(default)]
    pub peers: Vec<Peer>,
    #[serde(default)]
    pub walk: Walk,
    #[serde(default)]
    pub account_view: AccountView,
    #[serde(default)]
    pub launch_view: LaunchView,
    /// Epoch milliseconds, supplied by the caller; the crate has no clock.
    pub now: u64,
    #[serde(default)]
    pub config_digest: Option<String>,
    #[serde(default)]
    pub account_view_digest: Option<String>,
}

/// The replayable, non-secret subset of a bind input: no config body, no account facts.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BindingInput {
    pub protocol: u32,
    pub ask: Ask,
    pub peers: Vec<Peer>,
    pub walk: Walk,
    pub now: u64,
    pub config_digest: Option<String>,
    pub account_view_digest: Option<String>,
}

impl BindInput {
    pub fn binding_input(&self) -> BindingInput {
        BindingInput {
            protocol: self.protocol,
            ask: self.ask.clone(),
            peers: self.peers.clone(),
            walk: self.walk.clone(),
            now: self.now,
            config_digest: self.config_digest.clone(),
            account_view_digest: self.account_view_digest.clone(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BindOutput {
    pub protocol: u32,
    pub ok: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub policy: Option<Policy>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ranked: Option<Ranked>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub refusal: Option<Refusal>,
    pub explain: Explain,
    pub binding_input: BindingInput,
}
