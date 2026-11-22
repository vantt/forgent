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

use crate::bind::{bind, bypass_outside_head_refusal, BindRequest, BindSession};
use crate::dispatch_policy::effective_dispatch_policy;
use crate::executor_config::resolve_executor_config;
use crate::executor_model::{
    has_own_prefer_pool, lookup_executor, mechanism, registered_capability_of,
    with_default_executor, Mechanism, ModelError,
};
use crate::js::text as js_text;
use crate::ports::Machine;
use crate::runner_config::{load_runner_config, DoorRead, RunnerConfigError};
use crate::tools::{tool_providers, ToolProbe, ToolStatus};
use serde_json::{json, Map, Value};

/// The usage refusal when no selector is given.
pub const USAGE: &str = "usage: fgos dispatch decide <executorId> [--has-live-task-access] | decide --for <purpose> [--needs-soul] [--has-live-task-access] | decide --work <workId> [--stage <stage>] [--has-live-task-access] | decide --assignment <assignmentId> [--has-live-task-access] | decide --needs-soul [--has-live-task-access]";

// ---- reading the JSON ----------------------------------------------------------------------------------

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
    /// The binding of the seat bound for the purpose, when one was; not part of the printed answer
    /// ([`DecideAnswer::to_json`]), carried for the route's `plan` op.
    pub binding: Option<Value>,
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
    /// The config door could not give the project's config: it refused the file (it does not parse, breaks a
    /// schema, sits in the wrong scope) or failed reading it (an operating-system error, no main checkout).
    /// `code` is the door's `config-*` id, `message` names files and positions, never a value. Either way the
    /// config cannot be judged, so the hook blocks on it as it blocks on any other `config-*` refusal.
    ConfigDoor { code: String, message: String },
    /// A refusal of the request or of the runner config (the semantic check included).
    Refused(ModelError),
    /// Seat Binding refused the seat of an assignment record: a runner refusal whose code is the refusal's reason.
    SeatRefused { code: String, message: String },
}

impl DecideFailure {
    pub fn message(&self) -> &str {
        match self {
            DecideFailure::ConfigDoor { message, .. } => message,
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
    /// The whole binding the bind answered, for a caller that reads its policy (the route's `plan` op carries it).
    pub binding: Value,
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
/// as `bindWorkSeat` reads none), a bypass invocation refused as for every worker seat: the adapter the host
/// gives `decide`.
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
        let bound = match bypass_outside_head_refusal(&bound, runner) {
            Some(refused) => json!({ "refused": refused }),
            None => bound,
        };
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
            binding: bound,
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

impl RunnerOrigin {
    /// The origin as the runner config loader reads it: `{ path, layer, file?, line?, column? }`.
    pub fn to_json(&self) -> Value {
        let mut out = Map::new();
        out.insert("path".into(), json!(self.path));
        out.insert("layer".into(), json!(self.layer));
        for (key, value) in [
            ("file", self.file.as_ref().map(|f| json!(f))),
            ("line", self.line.map(|l| json!(l))),
            ("column", self.column.map(|c| json!(c))),
        ] {
            if let Some(value) = value {
                out.insert(key.into(), value);
            }
        }
        Value::Object(out)
    }
}

/// The effective runner section of one project, with the origins of the keys whose refusals are attributed to a
/// file and line (`runner.modelPolicies`, `runner.rigorToTier`, `runner.patterns`, `runner.loops`).
#[derive(Debug, Clone, PartialEq)]
pub struct LoadedRunner {
    pub runner: Value,
    pub origins: Vec<RunnerOrigin>,
}

/// The checkout facts a directory has, answered by the host's Git door; the rules that read them never read Git.
pub trait CheckoutFacts {
    /// The worktree root of `dir` (a linked worktree's own root); the refusal text when `dir` is not inside a
    /// repository with a commit.
    fn repo_root(&self, dir: &str) -> Result<String, String>;
    /// The main checkout of `dir`, never a linked worktree's own root; `None` outside a repository.
    fn main_checkout_root(&self, dir: &str) -> Option<String>;
}

/// The repository and config facts `decide` reads: the checkout facts, plus the process's own checkout and config.
pub trait Workspace: CheckoutFacts {
    /// The main checkout of the process's own working directory.
    fn process_main_checkout_root(&self) -> Option<String>;
    /// Whether `root` has a project config file (a YAML file or a legacy JSON one).
    fn project_config_present(&self, root: &str) -> bool;
    /// The effective runner section of the project at `root`, through the config door.
    fn load_runner(&self, root: &str) -> Result<LoadedRunner, DecideFailure>;
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

// ---- the runner config ----------------------------------------------------------------------------------

/// The runner config of the project at `root` as `decide` reads it: the door's section through the one runner
/// config loader ([`load_runner_config`]). The warnings the check gives are returned for the caller to print.
pub fn load_checked_runner(
    workspace: &dyn Workspace,
    root: &str,
) -> Result<(Value, Vec<String>), DecideFailure> {
    check_loaded_runner(workspace.load_runner(root)?, root)
}

/// A runner section already loaded, through the one runner config loader: the global `rigorToTier` refusal, the
/// semantic check with its refusal attributed to the file and line its value came from, the confinement of every
/// executor brought to one policy shape.
pub fn check_loaded_runner(
    loaded: LoadedRunner,
    root: &str,
) -> Result<(Value, Vec<String>), DecideFailure> {
    let origins = loaded.origins.iter().map(RunnerOrigin::to_json).collect();
    let door = DoorRead::Read {
        runner: loaded.runner,
        origins,
    };
    match load_runner_config(root, door) {
        Ok(checked) => Ok((checked.config, checked.warnings)),
        Err(RunnerConfigError::Door(door)) => Err(DecideFailure::ConfigDoor {
            code: door.code,
            message: door.message,
        }),
        Err(RunnerConfigError::Config(failure)) => Err(DecideFailure::Refused(failure.error)),
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

/// What serves a purpose (a capability row name, or an executor id), as the Work layer reads it: the answer of the
/// one purpose door, with the executor entry it names. `{ configured, executorId, executor?, bindingSource }`, plus
/// `tool` for a tool provider, `invocationId` and `binding` for a seat Seat Binding bound, `refused` for a seat it
/// refused.
pub fn purpose_seat_of(
    runner: &Value,
    purpose: Option<&str>,
    probe: &dyn ToolProbe,
    binder: &dyn SeatBinder,
) -> Result<Value, ModelError> {
    let executor_of = |id: &str| {
        runner
            .get("executors")
            .and_then(|all| all.get(id))
            .filter(|entry| !entry.is_null())
            .cloned()
    };
    let mut out = Map::new();
    match purpose_seat(runner, purpose, probe, binder)? {
        PurposeAnswer::Named { .. } => {
            let named = lookup_executor(runner, purpose);
            out.insert("configured".into(), json!(named.configured));
            out.insert("executorId".into(), json!(named.executor_id));
            if let Some(executor) = named.executor {
                out.insert("executor".into(), executor.clone());
            }
            out.insert("bindingSource".into(), json!(named.binding_source));
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
            let mut tool = Map::new();
            tool.insert("mechanism".into(), json!(mechanism));
            tool.insert("reasonCode".into(), json!(reason_code));
            if stale {
                tool.insert("stale".into(), json!(true));
            }
            if let Some(mcp_tool) = mcp_tool {
                tool.insert("mcpTool".into(), json!(mcp_tool));
            }
            if let Some(command) = command {
                tool.insert("command".into(), json!(command));
            }
            let providers: Vec<Value> = providers
                .iter()
                .map(|(id, status)| json!({ "executorId": id, "status": status.as_str() }))
                .collect();
            tool.insert("providers".into(), Value::Array(providers));
            out.insert("configured".into(), json!(true));
            out.insert("executorId".into(), json!(executor_id));
            if let Some(executor) = executor_of(&executor_id) {
                out.insert("executor".into(), executor);
            }
            out.insert("bindingSource".into(), json!("tool-provider"));
            out.insert("tool".into(), Value::Object(tool));
        }
        PurposeAnswer::Bound(seat) => {
            out.insert("configured".into(), json!(true));
            out.insert("executorId".into(), json!(seat.executor));
            if let Some(executor) = executor_of(&seat.executor) {
                out.insert("executor".into(), executor);
            }
            out.insert("bindingSource".into(), json!("seat-binding"));
            if let Some(invocation) = &seat.invocation {
                out.insert("invocationId".into(), json!(invocation));
            }
            out.insert("binding".into(), seat.binding);
        }
        PurposeAnswer::Refused { code, detail } => {
            out.insert("configured".into(), json!(true));
            out.insert("executorId".into(), Value::Null);
            out.insert("bindingSource".into(), Value::Null);
            out.insert(
                "refused".into(),
                json!({ "reason": code, "detail": detail }),
            );
        }
    }
    Ok(Value::Object(out))
}

// ---- resolving an out-of-process dispatch ----------------------------------------------------------------

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
    resolve_executor_config(
        runner,
        Some(executor_id),
        None,
        agent_type.and_then(Value::as_str),
        invocation_id,
    )
    .err()
    .map(|refusal| refusal.message)
}

// ---- the executor of an assignment record ----------------------------------------------------------------

/// The executor the effective dispatch policy of an assignment record runs on: the policy's own answer
/// ([`crate::dispatch_policy`]), with every refusal it gives before it.
fn assignment_executor(
    runner: &Value,
    record: &Value,
    binder: &dyn SeatBinder,
) -> Result<String, DecideFailure> {
    let params = json!({ "assignment": record, "runnerConfig": runner });
    let policy = effective_dispatch_policy(&params, binder)?;
    Ok(js_text(policy.get("executorId")))
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
        binding: None,
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
            && purpose.is_some_and(|p| registered_capability_of(runner, &json!(p)).is_none())
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
    out.binding = bound.map(|seat| seat.binding);
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
        (Some(capability), Some(runner)) => registered_capability_of(runner, &json!(capability)),
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
