//! `fgos dispatch decide`: which mechanism and executor a dispatch resolves to, read from the committed runner
//! config without running anything. The PreToolUse hook asks the same question for every Agent/Task call
//! ([`crate::hook`]).
//!
//! The order of resolution is the one `compileDispatchPlan` (`src/runner/dispatch/plan.mjs`) applies: an explicit
//! executor id, then an assignment record, then a Work hint, then a purpose, then a need-soul default. A purpose is
//! answered by the one door from a name to what serves it ([`purpose_seat`]): an executor registered under that
//! name, else the tools serving it (a live probe), else Seat Binding for a capability with a `prefer` pool of its
//! own, else nothing. Only the fields the answer carries are derived; the effective dispatch policy of a Unit
//! (tier, model, provenance) is the launch's and stays out of here, except where it decides which executor an
//! assignment record names.
//!
//! Ports: the tools are probed through [`ToolProbe`], Seat Binding through [`SeatBinder`], and the repository and
//! config facts the config root rule reads through [`Workspace`]. The crate stays pure.

use crate::bind::{bind, effective_rigor, BindRequest, BindSession};
use crate::executor_model::{
    lookup_executor, mechanism, resolve_executor_governance, resolve_executor_provider,
    with_default_executor, Governance, Mechanism, ModelError,
};
use crate::ports::Machine;
use crate::runner_check::{check_runner_config, RunnerCheckError};
use crate::tools::{tool_providers, ToolProbe, ToolStatus};
use fgos_seat_binding::Tier;
use serde_json::{json, Map, Value};

/// The usage refusal when no selector is given.
pub const USAGE: &str = "usage: fgos dispatch decide <executorId> [--has-live-task-access] | decide --for <purpose> [--needs-soul] [--has-live-task-access] | decide --work <workId> [--stage <stage>] [--has-live-task-access] | decide --assignment <assignmentId> [--has-live-task-access] | decide --needs-soul [--has-live-task-access]";

/// The refusal of a dispatch that needs the default executor where none is set.
const EXECUTOR_MISSING_MESSAGE: &str = "no runner.executor: none set and no assistant CLI found on PATH; set one with fgos config set runner.executor ... --reason ...";

/// The CLI commands that stay within the Claude ecosystem for cross-provider governance.
const CLAUDE_CLI_COMMANDS: &[&str] = &["claude"];

// ---- reading the JSON ----------------------------------------------------------------------------------

fn present<'a>(value: &'a Value, key: &str) -> Option<&'a Value> {
    value.get(key).filter(|found| !found.is_null())
}

fn str_of<'a>(value: &'a Value, key: &str) -> Option<&'a str> {
    value.get(key).and_then(Value::as_str)
}

/// JavaScript truthiness of a JSON value.
fn truthy(value: Option<&Value>) -> bool {
    match value {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::Number(n)) => n.as_f64().is_some_and(|f| f != 0.0),
        Some(Value::String(s)) => !s.is_empty(),
        Some(_) => true,
    }
}

/// A value as a JavaScript template literal renders it.
fn js_text(value: Option<&Value>) -> String {
    match value {
        None => "undefined".into(),
        Some(Value::Null) => "null".into(),
        Some(Value::String(s)) => s.clone(),
        Some(Value::Array(items)) => items
            .iter()
            .map(|item| match item {
                Value::Null => String::new(),
                other => js_text(Some(other)),
            })
            .collect::<Vec<_>>()
            .join(","),
        Some(Value::Object(_)) => "[object Object]".into(),
        Some(other) => other.to_string(),
    }
}

// ---- the request and the answer --------------------------------------------------------------------------

/// What the Work layer resolved for `--work` at its step (`resolveWorkForDispatch`): the executor identity its
/// Workflow names (`null` when it names none; the key absent is refused), the agent type, rigor and domain.
pub type WorkHint = Value;

/// A dispatch question. At least one selector is set.
#[derive(Debug, Clone, Default)]
pub struct DecideRequest {
    /// The positional executor id (it may also name a capability row, answered like a purpose).
    pub executor_id: Option<String>,
    /// `--for <purpose>`.
    pub purpose: Option<String>,
    /// `--work <id>` with what the Work layer resolved for it (`None` when it found no item).
    pub work_id: Option<String>,
    pub work_hint: Option<WorkHint>,
    /// `--assignment <id>` with its record when one was read (`None` when there is no readable record).
    pub assignment: Option<String>,
    pub assignment_record: Option<Value>,
    /// `--needs-soul`: the caller is about to fire its own Agent/Task tool with nothing to name.
    pub needs_soul: bool,
    /// `--has-live-task-access`: the caller's own declaration, never probed.
    pub has_live_task_access: bool,
}

impl DecideRequest {
    fn has_selector(&self) -> bool {
        let set = |v: &Option<String>| v.as_deref().is_some_and(|s| !s.is_empty());
        set(&self.executor_id)
            || set(&self.purpose)
            || set(&self.work_id)
            || set(&self.assignment)
            || self.needs_soul
    }
}

/// The answer of `fgos dispatch decide`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DecideAnswer {
    /// `in-process`, `out-of-process` or `unavailable`.
    pub mechanism: &'static str,
    /// The agent type an in-process caller passes to its own Agent/Task tool.
    pub agent_type: Option<String>,
    /// For a purpose a tool serves: the mcp tool or command to call, whether its index is behind `HEAD`, and every
    /// provider probed.
    pub mcp_tool: Option<String>,
    pub command: Option<String>,
    pub stale: bool,
    pub providers: Option<Vec<(String, ToolStatus)>>,
    /// Whether the executor named has a registry entry (or the purpose has what serves it).
    pub configured: bool,
    pub reason_codes: Vec<String>,
    /// Why it is unavailable; `Some(None)` is a block whose refusal carried no text.
    pub blocked_reason: Option<Option<String>>,
    /// The executor resolved, named only when the caller did not name it.
    pub executor_id: Option<String>,
}

impl DecideAnswer {
    /// The answer as `fgos dispatch decide` prints it.
    pub fn to_json(&self) -> Value {
        let mut out = Map::new();
        out.insert("mechanism".into(), json!(self.mechanism));
        if let Some(providers) = &self.providers {
            if let Some(tool) = &self.mcp_tool {
                out.insert("mcpTool".into(), json!(tool));
            }
            if let Some(command) = &self.command {
                out.insert("command".into(), json!(command));
            }
            if self.stale {
                out.insert("stale".into(), json!(true));
            }
            out.insert(
                "providers".into(),
                Value::Array(
                    providers
                        .iter()
                        .map(|(id, status)| json!({ "executorId": id, "status": status.as_str() }))
                        .collect(),
                ),
            );
        } else if let Some(agent_type) = &self.agent_type {
            out.insert("agentType".into(), json!(agent_type));
        }
        out.insert("configured".into(), json!(self.configured));
        out.insert("reasonCodes".into(), json!(self.reason_codes));
        if let Some(reason) = &self.blocked_reason {
            out.insert("blockedReason".into(), json!(reason));
        }
        if let Some(id) = &self.executor_id {
            out.insert("executorId".into(), json!(id));
        }
        Value::Object(out)
    }
}

/// Why `decide` could not answer.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DecideFailure {
    /// The config door refused the project's config (it does not parse, breaks a schema, sits in the wrong
    /// scope): `code` is the door's failure id, `message` names every refusal's file and position.
    ConfigDoor { code: String, message: String },
    /// The config door itself failed (an operating-system error, no main checkout): not a refusal of the file.
    DoorFailed { code: String, message: String },
    /// A refusal of the request or of the runner config (the semantic check included).
    Refused(ModelError),
    /// Seat Binding refused the seat of an assignment record: a runner refusal whose code is the refusal's reason.
    SeatRefused { code: String, message: String },
}

impl DecideFailure {
    pub fn message(&self) -> &str {
        match self {
            DecideFailure::ConfigDoor { message, .. }
            | DecideFailure::DoorFailed { message, .. } => message,
            DecideFailure::Refused(error) => &error.message,
            DecideFailure::SeatRefused { message, .. } => message,
        }
    }
}

// ---- ports -----------------------------------------------------------------------------------------------

/// A seat Seat Binding bound.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BoundSeat {
    pub executor: String,
    pub invocation: Option<String>,
}

/// Why Seat Binding bound no seat.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BindFailure {
    /// A refusal with its code (no pool can serve the seat, a pin cannot be met): `decide` answers unavailable
    /// and names it.
    Refused { code: String, detail: String },
    /// Any other failure, which `decide` does not swallow.
    Failed(ModelError),
}

/// The ask of one Work seat (`bindWorkSeat`): a headless Unit with no writes, posture judged at launch, no raise.
#[derive(Debug, Clone, PartialEq)]
pub struct WorkSeatAsk {
    /// `{ id, capability, rigor?, prefer? }`.
    pub unit: Value,
    pub role: String,
    pub read_only: bool,
    /// At most one override: `{ executor?, invocation?, tier?, reasoningEffort? }`.
    pub overrides: Vec<Value>,
}

/// Seat Binding, as `decide` asks it: one Work seat.
pub trait SeatBinder {
    fn bind_work_seat(&self, runner: &Value, ask: &WorkSeatAsk) -> Result<BoundSeat, BindFailure>;
}

/// The Work seat through the crate's own [`crate::bind::bind`], from the config alone (no lease state is read,
/// as `bindWorkSeat` reads none): the adapter the host gives `decide`.
pub struct CrateBinder<'a> {
    pub machine: &'a dyn Machine,
    /// Epoch milliseconds.
    pub now: u64,
}

impl SeatBinder for CrateBinder<'_> {
    fn bind_work_seat(&self, runner: &Value, ask: &WorkSeatAsk) -> Result<BoundSeat, BindFailure> {
        let mut unit = ask.unit.clone();
        unit["writes"] = json!([]);
        let request = json!({
            "unit": unit,
            "seat": "producer",
            "role": ask.role,
            "readOnly": ask.read_only,
            "overrides": ask.overrides,
            "raiseAuthorized": false,
        });
        let walk = json!({});
        let bound = bind(
            &BindRequest {
                ask: &request,
                runner,
                session: BindSession {
                    headless: true,
                    has_native_agent: false,
                    posture_at_launch: true,
                },
                walk: &walk,
                account_state: None,
            },
            self.machine,
            self.now,
        )
        .map_err(BindFailure::Failed)?;
        if let Some(refused) = bound.get("refused") {
            let text = |key: &str| {
                refused
                    .get(key)
                    .and_then(Value::as_str)
                    .unwrap_or_default()
                    .to_string()
            };
            let fix = text("fix");
            return Err(BindFailure::Refused {
                code: text("reason"),
                detail: if fix.is_empty() {
                    text("detail")
                } else {
                    format!("{}; {fix}", text("detail"))
                },
            });
        }
        Ok(BoundSeat {
            executor: bound["executor"].as_str().unwrap_or_default().to_string(),
            invocation: bound
                .get("invocation")
                .and_then(Value::as_str)
                .map(str::to_string),
        })
    }
}

/// One origin of a runner config value, as the config door reports it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RunnerOrigin {
    /// The dotted path, `runner.patterns.reviewed.defaults`.
    pub path: String,
    /// `project`, `global`, `accounts`, `standard` or `detected`.
    pub layer: String,
    /// The provenance file: `project:<name>`, `global:<name>`, or none. The adapter names the layer's file for
    /// every `project` and `global` origin (the file names are fgos-config's); a display never guesses one.
    pub file: Option<String>,
    pub line: Option<u32>,
    pub column: Option<u32>,
}

/// The effective runner section of one project, with the origins of the keys whose refusals are attributed to a
/// file and line (`runner.modelPolicies`, `runner.rigorToTier`, `runner.patterns`, `runner.loops`).
#[derive(Debug, Clone, PartialEq)]
pub struct LoadedRunner {
    pub runner: Value,
    pub origins: Vec<RunnerOrigin>,
}

/// The repository and config facts `decide` reads.
pub trait Workspace {
    /// The worktree root of `dir` (a linked worktree's own root); the refusal text when `dir` is not inside a
    /// repository with a commit.
    fn repo_root(&self, dir: &str) -> Result<String, String>;
    /// The main checkout of `dir`, never a linked worktree's own root; `None` outside a repository.
    fn main_checkout_root(&self, dir: &str) -> Option<String>;
    /// The main checkout of the process's own working directory.
    fn process_main_checkout_root(&self) -> Option<String>;
    /// Whether `root` has a project config file (a YAML file or a legacy JSON one).
    fn project_config_present(&self, root: &str) -> bool;
    /// The effective runner section of the project at `root`, through the config door.
    fn load_runner(&self, root: &str) -> Result<LoadedRunner, DecideFailure>;
    /// `path.join(root, '.fgos')` as the platform writes it.
    fn fgos_dir(&self, root: &str) -> String;
}

// ---- the config root and the guard -----------------------------------------------------------------------

/// The directory whose project config a dispatch reads: the linked worktree `cwd` sits in when that worktree
/// carries a config of its own, otherwise `root`, the main checkout. Only not finding a repository for `cwd` falls
/// back to `root`.
pub fn config_root_for(workspace: &dyn Workspace, cwd: Option<&str>, root: &str) -> String {
    let Some(cwd) = cwd.filter(|c| !c.is_empty()) else {
        return root.to_string();
    };
    let Ok(worktree_root) = workspace.repo_root(cwd) else {
        return root.to_string();
    };
    let main_root = workspace.main_checkout_root(cwd);
    if main_root.as_deref() == Some(root)
        && worktree_root != root
        && workspace.project_config_present(&worktree_root)
    {
        worktree_root
    } else {
        root.to_string()
    }
}

/// `--repo-root` without `--cwd` is refused unless the process's own main checkout is that root.
pub fn guard_cwd_repo_root(
    workspace: &dyn Workspace,
    cwd: Option<&str>,
    repo_root: Option<&str>,
    resolve: impl Fn(&str) -> String,
) -> Result<(), ModelError> {
    let (Some(repo_root), None) = (
        repo_root.filter(|r| !r.is_empty()),
        cwd.filter(|c| !c.is_empty()),
    ) else {
        return Ok(());
    };
    let main_root = workspace.process_main_checkout_root();
    if main_root.as_deref().map(&resolve) == Some(resolve(repo_root)) {
        return Ok(());
    }
    let display =
        main_root.map_or_else(|| "not a main checkout".to_string(), |m| format!("\"{m}\""));
    Err(ModelError::runner(format!(
        "--repo-root (\"{repo_root}\") passed without --cwd, but process.cwd() main checkout root resolved to {display} — pass --cwd explicitly."
    )))
}

// ---- attributing a runner refusal ------------------------------------------------------------------------

fn parent_path(path: &str) -> Option<String> {
    if path.ends_with(']') {
        return path.rfind('[').map(|at| path[..at].to_string());
    }
    path.rfind('.').map(|at| path[..at].to_string())
}

/// Where in which file a refused value sits, nearest first: its own origin, else its nearest ancestor's, else
/// the origins under it, else the first line of its nearest existing parent entry.
pub fn origin_locations(
    origins: &[RunnerOrigin],
    paths: &[String],
    project_dir: Option<&str>,
) -> Vec<String> {
    let mut locations: Vec<String> = Vec::new();
    for target in paths {
        let mut matched: Vec<&RunnerOrigin> =
            origins.iter().filter(|o| o.path == *target).collect();
        if matched.is_empty() {
            let mut cur = target.clone();
            while cur.contains('.') || cur.contains('[') {
                let Some(parent) = parent_path(&cur) else {
                    break;
                };
                cur = parent;
                let found: Vec<&RunnerOrigin> = origins.iter().filter(|o| o.path == cur).collect();
                if !found.is_empty() {
                    matched = found;
                    break;
                }
            }
            if matched.is_empty() {
                let (dot, bracket) = (format!("{target}."), format!("{target}["));
                matched = origins
                    .iter()
                    .filter(|o| o.path.starts_with(&dot) || o.path.starts_with(&bracket))
                    .collect();
            }
            let mut parent = target.clone();
            while matched.is_empty() && parent.split('.').count() > 3 {
                parent = parent[..parent.rfind('.').unwrap_or(0)].to_string();
                let (dot, bracket) = (format!("{parent}."), format!("{parent}["));
                let mut first_per_file: Vec<&RunnerOrigin> = Vec::new();
                for origin in origins
                    .iter()
                    .filter(|o| o.path.starts_with(&dot) || o.path.starts_with(&bracket))
                {
                    match first_per_file
                        .iter_mut()
                        .find(|held| held.file == origin.file)
                    {
                        Some(held) => {
                            if origin.line.unwrap_or(u32::MAX) < held.line.unwrap_or(u32::MAX) {
                                *held = origin;
                            }
                        }
                        None => first_per_file.push(origin),
                    }
                }
                matched = first_per_file;
            }
        }
        for entry in matched {
            let file = entry.file.as_deref();
            let display = if entry.layer == "global"
                || file.is_some_and(|f| f.starts_with("global:"))
            {
                format!(
                    "~/.fgos/{}",
                    file.map_or("<file>", |f| f.strip_prefix("global:").unwrap_or(f))
                )
            } else if entry.layer == "project" || file.is_some_and(|f| f.starts_with("project:")) {
                let rel = file.map_or("<file>", |f| f.strip_prefix("project:").unwrap_or(f));
                match project_dir {
                    Some(dir) => format!("{dir}/.fgos/{rel}"),
                    None => format!(".fgos/{rel}"),
                }
            } else if entry.layer == "shipped" || entry.layer == "standard" {
                "<standard>".to_string()
            } else {
                file.unwrap_or("<file>").to_string()
            };
            let location = match entry.line {
                Some(line) => format!("{display}:{line}"),
                None => display,
            };
            if !locations.contains(&location) {
                locations.push(location);
            }
        }
    }
    locations
}

/// The dotted parent every path shares.
fn common_dotted_parent(paths: &[String]) -> String {
    match paths {
        [] => String::new(),
        [one] => one.clone(),
        [first, rest @ ..] => {
            let mut common = Vec::new();
            for (i, seg) in first.split('.').enumerate() {
                if rest.iter().all(|p| p.split('.').nth(i) == Some(seg)) {
                    common.push(seg);
                } else {
                    break;
                }
            }
            common.join(".")
        }
    }
}

/// A runner refusal named by the file and line its value comes from, when its origins say: the refusal of the
/// check as the config load raises it.
pub fn attribute_runner_refusal(
    refusal: RunnerCheckError,
    origins: &[RunnerOrigin],
    project_dir: &str,
) -> ModelError {
    let paths: Vec<String> = if !refusal.paths.is_empty() {
        refusal.paths.clone()
    } else {
        refusal.path.iter().cloned().collect()
    };
    if refusal.error.name != "RunnerConfigError" || paths.is_empty() {
        return refusal.error;
    }
    let locations = origin_locations(origins, &paths, Some(project_dir));
    if locations.is_empty() {
        return refusal.error;
    }
    let subpath = match paths.as_slice() {
        [one] => Some(one.strip_prefix("runner.").unwrap_or(one).to_string()),
        many => Some(common_dotted_parent(many))
            .map(|c| c.strip_prefix("runner.").unwrap_or(&c).to_string())
            .filter(|c| !c.is_empty()),
    };
    let detail = refusal.detail.unwrap_or(refusal.error.message);
    ModelError {
        name: "RunnerConfigError",
        code: refusal.error.code,
        message: format!(
            "runner config ({}{}) {detail}",
            locations.join(", "),
            subpath.map_or_else(String::new, |s| format!(" {s}"))
        ),
    }
}

/// `runner.rigorToTier` set in the global file is refused naming that file.
pub fn refuse_global_rigor_to_tier(origins: &[RunnerOrigin]) -> Result<(), ModelError> {
    let Some(at) = origins.iter().find(|o| {
        o.layer == "global"
            && (o.path == "runner.rigorToTier" || o.path.starts_with("runner.rigorToTier."))
    }) else {
        return Ok(());
    };
    let file = at.file.as_deref().unwrap_or("<file>");
    let position = match (at.line, at.column) {
        (Some(line), column) => format!(":{line}:{}", js_text(column.map(|c| json!(c)).as_ref())),
        (None, _) => String::new(),
    };
    Err(ModelError::runner(format!(
        "~/.fgos/{}{position} runner.rigorToTier no longer exists: rigor no longer chooses a tier; delete the key.",
        file.strip_prefix("global:").unwrap_or(file)
    )))
}

/// The runner config of the project at `root` as `decide` reads it: the door's section, the global
/// `rigorToTier` refusal, then the semantic check under the label `<root>/.fgos runner`, its refusal attributed.
/// The warnings the check gives are returned for the caller to print.
pub fn load_checked_runner(
    workspace: &dyn Workspace,
    root: &str,
) -> Result<(Value, Vec<String>), DecideFailure> {
    let loaded = workspace.load_runner(root)?;
    refuse_global_rigor_to_tier(&loaded.origins).map_err(DecideFailure::Refused)?;
    let label = format!("{} runner", workspace.fgos_dir(root));
    match check_runner_config(&loaded.runner, &label) {
        Ok(warnings) => Ok((loaded.runner, warnings)),
        Err(refusal) => Err(DecideFailure::Refused(attribute_runner_refusal(
            refusal,
            &loaded.origins,
            root,
        ))),
    }
}

// ---- the purpose door ------------------------------------------------------------------------------------

/// What answers a purpose (a capability name, or an executor id).
#[derive(Debug, Clone, PartialEq, Eq)]
enum PurposeAnswer {
    /// An executor registered under that name, or nothing at all.
    Named {
        executor_id: Option<String>,
        configured: bool,
    },
    /// The tools serving it, the best by status.
    Tool {
        executor_id: String,
        mechanism: &'static str,
        reason_code: &'static str,
        stale: bool,
        mcp_tool: Option<String>,
        command: Option<String>,
        providers: Vec<(String, ToolStatus)>,
    },
    /// The seat Seat Binding bound for its `prefer` pool.
    Bound(BoundSeat),
    /// Seat Binding refused the seat.
    Refused { code: String, detail: String },
}

/// Whether the exact entry of `name` names at least one executor in `prefer`.
fn has_own_prefer_pool(runner: &Value, name: &str) -> bool {
    let entry = runner
        .get("capabilities")
        .filter(|c| c.is_object() || c.is_array())
        .and_then(|c| c.as_object())
        .and_then(|c| c.get(name))
        .filter(|e| e.is_object() || e.is_array());
    match entry.and_then(|e| e.get("prefer")) {
        Some(Value::String(s)) => !s.trim().is_empty(),
        Some(Value::Array(list)) => !list.is_empty(),
        _ => false,
    }
}

/// The registered name a capability goes by: its own key, else the first key that lists it in `aliases`.
pub fn registered_capability_of<'a>(runner: &'a Value, name: &str) -> Option<&'a str> {
    let section = runner.get("capabilities").and_then(Value::as_object)?;
    let is_entry = |v: &Value| v.is_object() || v.is_array();
    if let Some((key, _)) = section.get_key_value(name).filter(|(_, v)| is_entry(v)) {
        return Some(key.as_str());
    }
    section
        .iter()
        .filter(|(_, v)| is_entry(v))
        .find(|(_, entry)| {
            entry
                .get("aliases")
                .and_then(Value::as_array)
                .is_some_and(|aliases| aliases.iter().any(|a| a.as_str() == Some(name)))
        })
        .map(|(key, _)| key.as_str())
}

fn status_rank(status: ToolStatus) -> u8 {
    match status {
        ToolStatus::Present => 0,
        ToolStatus::Stale => 1,
        ToolStatus::Missing | ToolStatus::Unknown => 2,
    }
}

/// The one door from a purpose to what serves it: a registered executor of that name; else the tools that serve
/// it, answered by their live presence (the row's `prefer` is never read); else Seat Binding for a row with a
/// `prefer` pool of its own; else nothing configured.
fn purpose_seat(
    runner: &Value,
    purpose: Option<&str>,
    probe: &dyn ToolProbe,
    binder: &dyn SeatBinder,
) -> Result<PurposeAnswer, ModelError> {
    let named = lookup_executor(runner, purpose);
    let named_answer = PurposeAnswer::Named {
        executor_id: named.executor_id.clone(),
        configured: named.configured,
    };
    let Some(purpose) = purpose.filter(|p| !p.is_empty()) else {
        return Ok(named_answer);
    };
    if named.configured {
        return Ok(named_answer);
    }
    let providers = tool_providers(runner, Some(purpose), probe);
    if let Some(first) = providers.first() {
        let best = providers.iter().fold(first, |chosen, next| {
            if status_rank(next.status) < status_rank(chosen.status) {
                next
            } else {
                chosen
            }
        });
        let callable_status = matches!(best.status, ToolStatus::Present | ToolStatus::Stale);
        let names_something = best.mcp_tool.is_some() || best.command.is_some();
        let (mechanism, reason_code) = match best.status {
            ToolStatus::Present | ToolStatus::Stale if !names_something => {
                ("unavailable", "tool.unnamed")
            }
            ToolStatus::Present => ("in-process", "tool.present"),
            ToolStatus::Stale => ("in-process", "tool.stale"),
            ToolStatus::Missing => ("unavailable", "tool.missing"),
            ToolStatus::Unknown => ("unavailable", "tool.unprobeable"),
        };
        let callable = callable_status && names_something;
        return Ok(PurposeAnswer::Tool {
            executor_id: best.executor_id.clone(),
            mechanism,
            reason_code,
            stale: best.status == ToolStatus::Stale,
            mcp_tool: best.mcp_tool.clone().filter(|_| callable),
            command: best.command.clone().filter(|_| callable),
            providers: providers
                .iter()
                .map(|p| (p.executor_id.clone(), p.status))
                .collect(),
        });
    }
    if has_own_prefer_pool(runner, purpose) {
        let ask = WorkSeatAsk {
            unit: json!({ "id": purpose, "capability": purpose }),
            role: "producer".into(),
            read_only: false,
            overrides: Vec::new(),
        };
        return match binder.bind_work_seat(runner, &ask) {
            Ok(seat) => Ok(PurposeAnswer::Bound(seat)),
            Err(BindFailure::Refused { code, detail }) => {
                Ok(PurposeAnswer::Refused { code, detail })
            }
            // A coded runner refusal of the bind is a refusal of the seat too; any other failure is not swallowed.
            Err(BindFailure::Failed(error)) => match error.code {
                Some(code) if error.name == "RunnerConfigError" => {
                    let prefix = format!("{code}: ");
                    Ok(PurposeAnswer::Refused {
                        code: code.to_string(),
                        detail: error
                            .message
                            .strip_prefix(&prefix)
                            .unwrap_or(&error.message)
                            .to_string(),
                    })
                }
                _ => Err(error),
            },
        };
    }
    Ok(named_answer)
}

// ---- resolving an out-of-process dispatch ----------------------------------------------------------------

/// The hostname of a URL as the WHATWG URL parser reads it, for the schemes an API base URL uses; `None` when it
/// does not parse as such a URL.
fn url_hostname(url: &str) -> Option<String> {
    let url = url.trim_matches(|c: char| c <= ' ');
    let colon = url.find(':')?;
    let scheme = &url[..colon];
    let mut chars = scheme.chars();
    if !chars.next()?.is_ascii_alphabetic()
        || !chars.all(|c| c.is_ascii_alphanumeric() || matches!(c, '+' | '-' | '.'))
    {
        return None;
    }
    let scheme = scheme.to_ascii_lowercase();
    let rest = &url[colon + 1..];
    let special = matches!(scheme.as_str(), "http" | "https" | "ws" | "wss" | "ftp");
    let authority_start = if special {
        rest.trim_start_matches(['/', '\\'])
    } else if let Some(stripped) = rest.strip_prefix("//") {
        stripped
    } else {
        return Some(String::new());
    };
    let end = authority_start
        .find(|c: char| matches!(c, '/' | '?' | '#') || (special && c == '\\'))
        .unwrap_or(authority_start.len());
    let authority = &authority_start[..end];
    let host_port = authority.rsplit_once('@').map_or(authority, |(_, h)| h);
    let host = if host_port.starts_with('[') {
        host_port
            .find(']')
            .map_or(host_port, |at| &host_port[..=at])
    } else {
        host_port.rsplit_once(':').map_or(host_port, |(h, _)| h)
    };
    if special && host.is_empty() {
        return None;
    }
    Some(if special {
        host.to_ascii_lowercase()
    } else {
        host.to_string()
    })
}

fn is_anthropic_api_host(url: &str) -> bool {
    url_hostname(url)
        .is_some_and(|host| host == "api.anthropic.com" || host.ends_with(".api.anthropic.com"))
}

/// Whether an out-of-process dispatch of `executor_id` can be resolved to a command to run: the checks
/// `resolveExecutorConfig` makes before a launch, with the text of the refusal it gives (`None` text for a refusal
/// that carries none). A content class is never declared by `decide`, so an executor that declares `carries` is
/// refused.
fn dispatch_refusal(
    runner: &Value,
    executor_id: &str,
    agent_type: Option<&Value>,
    invocation_id: Option<&str>,
) -> Option<String> {
    let entry = lookup_executor(runner, Some(executor_id)).executor;
    if let Some(carries) = entry.and_then(|e| e.get("carries")) {
        return Some(format!(
            "executor \"{executor_id}\" declares \"carries: {}\" but this dispatch did not declare what content it carries — pass an explicit content class before dispatch.",
            js_text(Some(carries))
        ));
    }
    let invocations = entry
        .and_then(|e| e.get("invocations"))
        .and_then(Value::as_array);
    let cli = invocations.and_then(|list| {
        list.iter().find(|inv| {
            str_of(inv, "via") == Some("cli")
                && invocation_id.is_none_or(|id| str_of(inv, "id") == Some(id))
        })
    });
    if let (Some(list), None) = (invocations, cli) {
        return Some(match invocation_id {
            Some(id) => format!(
                "executor \"{executor_id}\" has no \"invocations\" entry with \"id\": \"{id}\" dispatchable via \"cli\" (has: {}).",
                list.iter()
                    .map(|inv| format!(
                        "{}:{}",
                        present(inv, "id").map_or_else(|| "(no id)".into(), |v| js_text(Some(v))),
                        js_text(inv.get("via"))
                    ))
                    .collect::<Vec<_>>()
                    .join(", ")
            ),
            None => format!(
                "executor \"{executor_id}\" declares \"invocations\" but none is dispatchable via \"cli\" (has: {}) — resolveExecutorConfig only ever spawns a cli invocation; this executor cannot be dispatched this way.",
                list.iter().map(|inv| js_text(inv.get("via"))).collect::<Vec<_>>().join("/")
            ),
        });
    }
    let default = present(runner, "executor");
    let effective_agent_type = entry
        .and_then(|e| present(e, "agentType"))
        .or(agent_type.filter(|v| !v.is_null()));
    let entry_has_command =
        entry.is_some_and(|e| truthy(e.get("adapter")) || truthy(e.get("command")));
    let via_agent_type =
        cli.is_none() && !entry_has_command && truthy(effective_agent_type) && default.is_some();
    let default_cli = match (entry, default) {
        (None, Some(default)) => default
            .get("invocations")
            .and_then(Value::as_array)
            .and_then(|list| list.iter().find(|inv| str_of(inv, "via") == Some("cli"))),
        _ => None,
    };
    // The command, args and env of what would run: the cli invocation, the entry itself, the default executor's
    // cli invocation, the default executor run with `--agent <type>`, else the default executor.
    let (command, args_ok, env): (Option<&Value>, Result<bool, String>, Option<&Value>) =
        if let Some(cli) = cli {
            (
                cli.get("command"),
                Ok(cli.get("args").is_some_and(Value::is_array)),
                cli.get("env"),
            )
        } else if let Some(entry) = entry.filter(|_| entry_has_command) {
            (
                entry.get("command"),
                Ok(entry.get("args").is_some_and(Value::is_array)),
                entry.get("env"),
            )
        } else if let Some(inv) = default_cli {
            let env = present(inv, "env").or_else(|| default.and_then(|d| d.get("env")));
            (
                inv.get("command"),
                Ok(inv.get("args").is_some_and(Value::is_array)),
                env,
            )
        } else if via_agent_type {
            let default = default.expect("an agent type resolves only over the default executor");
            let args = match default.get("args") {
                Some(Value::Array(_)) => Ok(true),
                None | Some(Value::Null) => Err(format!(
                    "Cannot read properties of {} (reading 'length')",
                    js_text(default.get("args"))
                )),
                Some(_) => Ok(true),
            };
            (default.get("command"), args, None)
        } else if let Some(default) = default {
            (
                default.get("command"),
                Ok(default.get("args").is_some_and(Value::is_array)),
                default.get("env"),
            )
        } else {
            return Some(EXECUTOR_MISSING_MESSAGE.into());
        };
    match args_ok {
        Err(type_error) => return Some(type_error),
        Ok(args_ok) => {
            if !command.is_some_and(Value::is_string) || !args_ok {
                return Some("runner config \"executor\" must have a string \"command\" and an \"args\" array.".into());
            }
        }
    }
    let command = command.and_then(Value::as_str).unwrap_or_default();
    let env = env.or_else(|| cli.and_then(|c| c.get("env")));
    let env_target = env.and_then(|block| {
        ["ANTHROPIC_BASE_URL", "OPENAI_BASE_URL", "BASE_URL"]
            .iter()
            .map(|key| block.get(*key))
            .find(|value| truthy(*value))
            .flatten()
    });
    let url_override = env_target
        .and_then(Value::as_str)
        .filter(|target| !target.trim().is_empty() && !is_anthropic_api_host(target));
    let entry = entry?;
    let cross_provider = url_override.is_some()
        || !CLAUDE_CLI_COMMANDS.contains(&command)
        || entry
            .get("providerModel")
            .is_some_and(|m| m.as_str() != Some("claude"));
    if !via_agent_type && cross_provider && entry.get("allowCrossProvider") != Some(&json!(true)) {
        return Some(format!(
            "executor \"{executor_id}\" resolves to cross-provider egress target \"{}\" — prompt content would leave the Claude ecosystem. Set executors.{executor_id}.allowCrossProvider: true to permit this.",
            url_override.unwrap_or(command)
        ));
    }
    None
}

// ---- the executor of an assignment record ----------------------------------------------------------------

const RIGORS: [&str; 4] = ["low", "standard", "high", "critical"];
const REASONING_EFFORTS: [&str; 4] = ["low", "medium", "high", "max"];
const REPEAT_MODES: [&str; 2] = ["pre-delivery", "post-delivery"];
const SEAT_ROLES: [&str; 5] = ["producer", "synthesizer", "reviewer", "red-team", "judge"];

/// The capability an operation runs under when its policy declares none: the work product's primary capability,
/// else the domain's `review` row when the catalog has it, else `review`.
fn derived_capability(record: &Value, policy: &Value, runner: &Value) -> Option<String> {
    if let Some(declared) = policy.get("capability") {
        return declared.as_str().map(str::to_string);
    }
    let result_kind = match record.get("result") {
        Some(result) if !result.is_null() => result.get("kind"),
        _ => record.get("resultKind"),
    };
    if result_kind.and_then(Value::as_str) == Some("work-product") {
        return record
            .get("primaryCapability")
            .filter(|p| truthy(Some(p)))
            .and_then(Value::as_str)
            .map(str::to_string);
    }
    let domain = record
        .get("domain")
        .filter(|d| truthy(Some(d)))
        .map(|d| js_text(Some(d)));
    let section = runner.get("capabilities").and_then(Value::as_object);
    match domain.map(|d| format!("{d}:review")) {
        Some(row)
            if section
                .and_then(|s| s.get(&row))
                .is_some_and(|e| e.is_object() || e.is_array()) =>
        {
            Some(row)
        }
        _ => Some("review".into()),
    }
}

/// The executor the effective dispatch policy of an assignment record runs on, with the refusals the policy gives
/// before it: the record's policy shape, its rigor, effort and tier demands, then Seat Binding's bind of the seat
/// with the record's executor (else the default executor) as a hard pin, then governance and the repeat mode.
fn assignment_executor(
    runner: &Value,
    record: &Value,
    binder: &dyn SeatBinder,
) -> Result<String, DecideFailure> {
    let refuse = |message: String| DecideFailure::Refused(ModelError::runner(message));
    let empty = json!({});
    let policy = match record.get("policy") {
        None => &empty,
        Some(policy) if policy.is_object() => policy,
        Some(_) => {
            return Err(refuse(
                "assignment.policy must be an object when provided".into(),
            ))
        }
    };
    if policy.get("minTier").is_some() {
        return Err(refuse("assignment policy field \"minTier\" was removed; normalize persisted assignments at the load boundary or use \"rigor\"/\"tier\"".into()));
    }
    let from_yaml = truthy(policy.get("_fromYaml"));
    if from_yaml && policy.get("tier").is_some() {
        return Err(refuse("workflow YAML cannot set explicit tier; declare the tier in the project config (capability, role, persona or seat), or set it at actor/assignment/CLI scope".into()));
    }
    if truthy(policy.get("model")) && !truthy(record.get("_allowLiteralModel")) && from_yaml {
        return Err(refuse("workflow YAML cannot pin literal model names; declare the cell in modelPolicies or name a persona".into()));
    }
    let mut demand: Option<&str> = None;
    for (value, label) in [
        (policy.get("rigor"), "operation"),
        (record.get("rigor"), "assignment"),
    ] {
        let Some(value) = value else { continue };
        let Some(rigor) = RIGORS.iter().copied().find(|r| value.as_str() == Some(r)) else {
            return Err(refuse(format!(
                "invalid {label} rigor \"{}\". Valid rigors: [{}]",
                js_text(Some(value)),
                RIGORS.join(", ")
            )));
        };
        let rank = |r: &str| RIGORS.iter().position(|x| *x == r);
        if demand.is_none_or(|best| rank(rigor) > rank(best)) {
            demand = Some(rigor);
        }
    }
    let capability = match present(policy, "capability").or_else(|| present(record, "capability")) {
        None => derived_capability(record, policy, runner),
        Some(value) => value.as_str().map(str::to_string),
    };
    let rigor = effective_rigor(
        &json!({ "rigor": demand, "capability": capability }),
        runner,
    )
    .map_err(DecideFailure::Refused)?
    .unwrap_or("standard");
    let effort = policy.get("reasoningEffort");
    if let Some(effort) =
        effort.filter(|e| !REASONING_EFFORTS.iter().any(|r| e.as_str() == Some(r)))
    {
        return Err(refuse(format!(
            "invalid reasoningEffort \"{}\". Valid values: [{}]",
            js_text(Some(effort)),
            REASONING_EFFORTS.join(", ")
        )));
    }
    // `??`: an empty preferExecutor is a name (no pin, and no default executor either).
    let named = present(policy, "preferExecutor").map(|e| e.as_str().unwrap_or_default());
    let default = present(runner, "executor").and_then(|default| {
        let executors = runner.get("executors").and_then(Value::as_object);
        [str_of(default, "command"), Some("claude")]
            .into_iter()
            .flatten()
            .find(|id| !id.is_empty() && executors.is_none_or(|all| truthy(all.get(*id))))
    });
    let pinned = named.or(default).filter(|p| !p.is_empty());
    let tier = policy.get("tier");
    if let Some(tier) = tier.filter(|t| t.as_str().and_then(Tier::parse).is_none()) {
        return Err(refuse(format!(
            "invalid explicit tier \"{}\". Valid tiers: [{}]",
            js_text(Some(tier)),
            Tier::ALL.map(Tier::name).join(", ")
        )));
    }
    let mut overrides = Map::new();
    if let Some(pinned) = pinned {
        overrides.insert("executor".into(), json!(pinned));
    }
    if let Some(tier) = tier {
        overrides.insert("tier".into(), tier.clone());
    }
    if let Some(effort) = effort {
        overrides.insert("reasoningEffort".into(), effort.clone());
    }
    let operation = record.get("operation").filter(|o| !o.is_null());
    let mut unit = json!({
        "id": operation.cloned().unwrap_or_else(|| json!("work-seat")),
        "capability": capability.unwrap_or_default(),
        "rigor": rigor,
    });
    if let Some(pinned) = pinned {
        unit["prefer"] = json!([pinned]);
    }
    let role = record
        .get("role")
        .and_then(Value::as_str)
        .filter(|r| SEAT_ROLES.contains(r))
        .unwrap_or("producer");
    let ask = WorkSeatAsk {
        unit,
        role: role.into(),
        read_only: record.get("mutation").and_then(Value::as_str) == Some("read-only"),
        overrides: if overrides.is_empty() {
            Vec::new()
        } else {
            vec![Value::Object(overrides)]
        },
    };
    let seat = match binder.bind_work_seat(runner, &ask) {
        Ok(seat) => seat,
        Err(BindFailure::Refused { code, detail }) => {
            return Err(DecideFailure::SeatRefused {
                message: format!("{code}: {detail}"),
                code,
            })
        }
        Err(BindFailure::Failed(error)) => return Err(DecideFailure::Refused(error)),
    };
    if let Some(pinned) = pinned.filter(|p| *p != seat.executor) {
        return Err(DecideFailure::SeatRefused {
            code: "pin-unsatisfiable".into(),
            message: format!(
                "pin-unsatisfiable: preferExecutor \"{pinned}\" is not registered or cannot serve this seat; Seat Binding chose \"{}\"",
                seat.executor
            ),
        });
    }
    let governance = Governance::default();
    let provider = resolve_executor_provider(runner, &seat.executor, &governance)
        .map_err(DecideFailure::Refused)?;
    // An undeclared repeat mode is null, which is refused when the policy states it null.
    if let Some(mode) = policy.get("repeatMode") {
        if !REPEAT_MODES.iter().any(|r| mode.as_str() == Some(r)) {
            return Err(refuse(format!(
                "invalid repeatMode \"{}\". Valid repeatModes: [{}]",
                js_text(Some(mode)),
                REPEAT_MODES.join(", ")
            )));
        }
    }
    resolve_executor_governance(&seat.executor, &provider.family, &governance)
        .map_err(DecideFailure::Refused)?;
    Ok(seat.executor)
}

// ---- deciding --------------------------------------------------------------------------------------------

fn native_first_code(live: bool) -> &'static str {
    if live {
        "native-first.rule-2.live-task-access"
    } else {
        "native-first.rule-1.no-native-mechanism"
    }
}

fn native_first(live: bool) -> &'static str {
    if live {
        "in-process"
    } else {
        "out-of-process"
    }
}

fn answer(mechanism: &'static str, configured: bool, reason_codes: Vec<&str>) -> DecideAnswer {
    DecideAnswer {
        mechanism,
        agent_type: None,
        mcp_tool: None,
        command: None,
        stale: false,
        providers: None,
        configured,
        reason_codes: reason_codes.into_iter().map(str::to_string).collect(),
        blocked_reason: None,
        executor_id: None,
    }
}

/// The answer a purpose answered by a tool or by a seat refusal carries, or `None` when the answer names an
/// executor to dispatch.
fn purpose_final(answer: &PurposeAnswer) -> Option<(DecideAnswer, Option<String>)> {
    match answer {
        PurposeAnswer::Refused { code, detail } => {
            let mut out = self::answer("unavailable", true, vec!["seat-binding.refused"]);
            out.blocked_reason = Some(Some(format!("{code}: {detail}")));
            Some((out, None))
        }
        PurposeAnswer::Tool {
            executor_id,
            mechanism,
            reason_code,
            stale,
            mcp_tool,
            command,
            providers,
        } => {
            let mut out = self::answer(mechanism, true, vec![reason_code]);
            out.mcp_tool = mcp_tool.clone();
            out.command = command.clone();
            out.stale = *stale;
            out.providers = Some(providers.clone());
            Some((out, Some(executor_id.clone())))
        }
        _ => None,
    }
}

fn refused(message: String) -> DecideFailure {
    DecideFailure::Refused(ModelError::runner(message))
}

/// The decision over a runner section the caller loaded and checked ([`load_checked_runner`]), before the default
/// executor is layered on, which this does. The caller composes `fgos dispatch decide` around it: the `--repo-root`
/// guard ([`guard_cwd_repo_root`]), the project root (the invocation-root door), the config root ([`config_root_for`]), the
/// Work hint and the assignment record read at that root. The answer carries `executorId` only when the caller did
/// not name it.
pub fn decide_over(
    loaded_runner: &Value,
    req: &DecideRequest,
    probe: &dyn ToolProbe,
    binder: &dyn SeatBinder,
) -> Result<DecideAnswer, DecideFailure> {
    if !req.has_selector() {
        return Err(refused(USAGE.into()));
    }
    let runner = with_default_executor(loaded_runner);
    let runner = &runner;
    fn text(v: &Option<String>) -> Option<&str> {
        v.as_deref().filter(|s| !s.is_empty())
    }
    let named_id = text(&req.executor_id);
    let purpose = text(&req.purpose);
    let work_id = text(&req.work_id);
    let assignment = text(&req.assignment);
    let live = req.has_live_task_access;
    let indirect = |(mut out, id): (DecideAnswer, Option<String>)| {
        if named_id.is_none() {
            out.executor_id = id;
        }
        out
    };
    let selector_type = if named_id.is_some() {
        "executor"
    } else if assignment.is_some() {
        "assignment"
    } else if work_id.is_some() {
        "work"
    } else if purpose.is_some() {
        "purpose"
    } else {
        "adHocAgent"
    };

    let mut executor_id: Option<String> = named_id.map(str::to_string);
    let mut bound: Option<BoundSeat> = None;

    if executor_id.is_none() {
        if let (Some(_), Some(record)) = (
            assignment,
            req.assignment_record.as_ref().filter(|r| !r.is_null()),
        ) {
            executor_id = Some(assignment_executor(runner, record, binder)?);
        }
    }

    if executor_id.is_none() {
        if let Some(work) = work_id {
            let Some(hint) = &req.work_hint else {
                return Err(refused(format!(
                    "no work item \"{work}\" found -- cannot resolve its dispatch executor."
                )));
            };
            let item_keys: Vec<&str> = ["work", "workItem"]
                .into_iter()
                .filter(|key| hint.get(*key).is_some())
                .collect();
            if !item_keys.is_empty() {
                return Err(refused(format!(
                    "the --work resolver result takes no Work item ({}): pass its demand as generic inputs (assignment rigor/domain, a work hint, capability hints, agent type)",
                    item_keys.join(", ")
                )));
            }
            let Some(work_executor) = hint.get("workExecutorId") else {
                return Err(refused(format!(
                    "work item \"{work}\" was supplied without the executor identity its Workflow step resolves to -- the Work layer must resolve it (dispatch does not look steps up)."
                )));
            };
            let work_input = work_executor.as_str().map(str::to_string);
            let seat = purpose_seat(runner, work_input.as_deref(), probe, binder)
                .map_err(DecideFailure::Refused)?;
            if let Some(final_answer) = purpose_final(&seat) {
                return Ok(indirect(final_answer));
            }
            match seat {
                PurposeAnswer::Named {
                    configured: false, ..
                } => {
                    // A work item whose step executor has no registry entry of its own dispatches native-first.
                    let out = answer(native_first(live), false, vec![native_first_code(live)]);
                    return Ok(indirect((out, work_input.clone())));
                }
                PurposeAnswer::Bound(seat) => {
                    executor_id = Some(seat.executor.clone());
                    bound = Some(seat);
                }
                _ => executor_id = work_input.clone(),
            }
        }
    }

    if executor_id.is_none() {
        if let Some(purpose) = purpose {
            let seat = purpose_seat(runner, Some(purpose), probe, binder)
                .map_err(DecideFailure::Refused)?;
            if let Some(final_answer) = purpose_final(&seat) {
                return Ok(indirect(final_answer));
            }
            match seat {
                PurposeAnswer::Bound(seat) => {
                    executor_id = Some(seat.executor.clone());
                    bound = Some(seat);
                }
                PurposeAnswer::Named {
                    executor_id: id, ..
                } => executor_id = id,
                _ => {}
            }
        }
    }

    let Some(mut executor) = executor_id else {
        if req.needs_soul {
            return Ok(answer(
                native_first(live),
                false,
                vec![native_first_code(live)],
            ));
        }
        let mut codes = vec!["selector.unregistered"];
        if selector_type == "purpose"
            && purpose.is_some_and(|p| registered_capability_of(runner, p).is_none())
        {
            codes.push("capability.unknown");
        }
        return Ok(answer("unavailable", false, codes));
    };

    // A positional name may be a capability row rather than an executor id: it is answered the way a purpose is.
    if let Some(positional) = named_id {
        let seat = purpose_seat(runner, Some(positional), probe, binder)
            .map_err(DecideFailure::Refused)?;
        if let Some(final_answer) = purpose_final(&seat) {
            return Ok(indirect(final_answer));
        }
        if let PurposeAnswer::Bound(seat) = seat {
            executor = seat.executor.clone();
            bound = Some(seat);
        }
    }

    let mechanism = mechanism(runner, Some(&executor), live);
    let mut codes = vec![match mechanism {
        Mechanism::OutOfProcess => "native-first.0033.cli-spawn-shaped",
        Mechanism::InProcess => "native-first.rule-2.live-task-access",
    }];
    let found = lookup_executor(runner, Some(&executor));
    let configured = found.configured;
    let resolved_indirectly = named_id.is_none();
    let named_out = |mut out: DecideAnswer| {
        if resolved_indirectly {
            out.executor_id = Some(executor.clone());
        }
        out
    };
    if selector_type == "executor" && !configured {
        codes.push("selector.unregistered");
        return Ok(named_out(answer("unavailable", false, codes)));
    }
    let agent_type = found.executor.and_then(|e| e.get("agentType"));
    if mechanism == Mechanism::OutOfProcess {
        let pinned = bound
            .as_ref()
            .and_then(|seat| seat.invocation.as_deref())
            .filter(|id| !id.trim().is_empty());
        if let Some(reason) = dispatch_refusal(runner, &executor, agent_type, pinned) {
            codes.push("governance.blocked");
            let mut out = answer("unavailable", configured, codes);
            out.blocked_reason = Some(Some(reason));
            return Ok(named_out(out));
        }
    }
    let mut out = answer(mechanism.as_str(), configured, codes);
    out.agent_type = agent_type
        .and_then(Value::as_str)
        .filter(|t| !t.is_empty())
        .map(str::to_string);
    Ok(named_out(out))
}

/// The run door a caller uses instead of dispatching `executor_id` directly: `--provider` names agent executors
/// only and is a preference bind may override; a tool executor has no run door; `--capability` is kept when the
/// capability is a registered one. `runner` is the main checkout's config, `None` when it cannot be read.
pub fn run_door_hint(
    runner: Option<&Value>,
    executor_id: Option<&str>,
    capability: Option<&str>,
) -> String {
    let executor = match (executor_id.filter(|id| !id.is_empty()), runner) {
        (Some(id), Some(runner)) => runner
            .get("executors")
            .and_then(Value::as_object)
            .and_then(|all| all.get(id))
            .map(|entry| (id, entry)),
        _ => None,
    };
    let kind = |entry: &Value| match entry.get("kind") {
        None | Some(Value::Null) => "agent".to_string(),
        Some(other) => js_text(Some(other)),
    };
    let is_agent = executor.is_some_and(|(_, entry)| kind(entry) == "agent");
    let registered = match (capability.filter(|c| !c.is_empty()), runner) {
        (Some(capability), Some(runner)) => registered_capability_of(runner, capability),
        _ => None,
    };
    let mut command = vec!["fgos run \"<prompt>\"".to_string()];
    if let (true, Some((id, _))) = (is_agent, executor) {
        command.push(format!("--provider {id}"));
    }
    if let Some(capability) = registered {
        command.push(format!("--capability {capability}"));
    }
    command.push("[--writes <paths> --worktree <path>]".into());
    let hint = format!("`{}`", command.join(" "));
    match executor {
        Some(_) if is_agent => format!(
            "{hint} (--provider is a preference: bind may choose another executor that serves the capability)"
        ),
        Some((id, entry)) => format!(
            "{hint}; \"{id}\" is a {} executor, which fgos run cannot name -- call that tool directly instead",
            js_text(entry.get("kind"))
        ),
        None => hint,
    }
}

#[cfg(test)]
mod tests {
    use super::url_hostname;

    #[test]
    fn a_base_url_is_judged_by_its_hostname_not_by_its_text() {
        assert_eq!(
            url_hostname("https://API.Anthropic.com/v1").as_deref(),
            Some("api.anthropic.com")
        );
        assert_eq!(
            url_hostname("https://evil.example.com/api.anthropic.com").as_deref(),
            Some("evil.example.com")
        );
        assert_eq!(
            url_hostname("https://user@x.api.anthropic.com:443?q").as_deref(),
            Some("x.api.anthropic.com")
        );
        assert_eq!(url_hostname("api.anthropic.com"), None);
        assert_eq!(url_hostname("https://"), None);
    }
}
