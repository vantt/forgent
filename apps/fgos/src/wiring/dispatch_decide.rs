//! `fgos dispatch decide`, `fgos dispatch explain` and `fgos hook dispatch-decide`: Execution's read door as
//! native operations. The decisions are `fgos-execution`'s (the purpose door, the runner config check, the bind,
//! the hook verdict); this module carries the call to them: which directory the caller means, the repository and
//! config facts the decision reads (the `Workspace` port over the Git door and the config door), the assignment
//! record under the project's `.fgos`, and, for `decide --work`, the Work layer's hint, which only the Node
//! payload can read until the Work layer moves (one operation of the Node rows bridge, never a second Node door).
//!
//! The machine facts a decision reads (PATH, the confinement backend registry, herdr) are the ones the seat-binding
//! route reads: [`HostMachine`] and [`HostProbe`] are shared with it, not copied.

use super::doctor::bridge::{Fault, NodeBridge};
use super::seat_binding::{read_beneath, HostMachine, HostProbe};
use crate::routing::Call;
use fgos_config::detect::PathDetectors;
use fgos_config::snapshot::SnapshotError;
use fgos_execution::bind::BindSession;
use fgos_execution::decide::{
    config_root_for, decide_over, guard_cwd_repo_root, load_checked_runner, run_door_hint,
    CrateBinder, DecideFailure, DecideRequest, LoadedRunner, RunnerOrigin, Workspace,
};
use fgos_execution::executor_model::ModelError;
use fgos_execution::explain::explain_capability;
use fgos_execution::hook::{dispatch_verdict, serve_hook, HookCall, Verdict};
use fgos_execution::runner_check::retired_pattern_key_at;
use fgos_host_runtime::{
    CategorisedRefusal, ContractRef, EventSink, HostInvocation, InvocationControl, JsonOutcome,
    OperationId, OperationProvider, OperationRequest, ProviderDescriptor, ProviderError,
    ProviderLifecycle, ProviderOutcome,
};
use serde_json::Value;
use std::borrow::Cow;
use std::ffi::OsString;
use std::future::Future;
use std::io::Read;
use std::path::{Component, Path, PathBuf};
use std::pin::Pin;

pub const DECIDE_OPERATION_ID: &str = "dispatch.decide";
pub const EXPLAIN_OPERATION_ID: &str = "dispatch.explain";

/// The sub-commands of `fgos dispatch` the host serves; every other one reaches the legacy payload.
pub const AVAILABLE_SUBCOMMANDS: &[&str] = &["decide", "explain"];

/// The most bytes of a hook payload read from stdin; a payload cut at the cap does not parse and so allows.
const HOOK_STDIN_CAP: u64 = 8 * 1024 * 1024;

const fn descriptor(
    operation: &'static str,
    request: &'static str,
    outcome: &'static str,
) -> ProviderDescriptor {
    ProviderDescriptor {
        provider_id: Cow::Borrowed(operation),
        operation_id: OperationId::from_static(operation),
        component_class: Cow::Borrowed("execution"),
        mechanism: Cow::Borrowed("builtin"),
        lifecycle: ProviderLifecycle::Singleton,
        request_contract: ContractRef::from_static(request, "1.0.0"),
        outcome_contract: ContractRef::from_static(outcome, "1.0.0"),
        allowed_hosts: &["cli"],
        allowed_modes: &["sync"],
        capabilities: &[],
        replacement: None,
        concurrency: None,
        health: None,
    }
}

pub const DECIDE_DESCRIPTOR: ProviderDescriptor = descriptor(
    DECIDE_OPERATION_ID,
    "dispatch.decide.request",
    "dispatch.decide.outcome",
);
pub const EXPLAIN_DESCRIPTOR: ProviderDescriptor = descriptor(
    EXPLAIN_OPERATION_ID,
    "dispatch.explain.request",
    "dispatch.explain.outcome",
);

// ---- the request --------------------------------------------------------------------------------------------

/// One `fgos dispatch decide|explain` invocation, as the projector read it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DispatchRequest {
    pub explain: bool,
    /// The directory the process runs in.
    pub process_cwd: PathBuf,
    /// The project `--dir` names, if any.
    pub dir: Option<String>,
    /// `--cwd`, else `--dir`: where `decide` resolves the project from.
    pub cwd: Option<String>,
    pub repo_root: Option<String>,
    pub executor_id: Option<String>,
    pub purpose: Option<String>,
    pub work: Option<String>,
    pub stage: Option<String>,
    pub assignment: Option<String>,
    pub rigor: Option<String>,
    pub needs_soul: bool,
    pub has_live_task_access: bool,
}

/// A flag that carries text; a bare use, a repeat or an empty value says nothing, as the Node CLI reads it.
fn text_flag(call: &Call, name: &str) -> Option<String> {
    use fgos_host_runtime::cli_args::{FlagScalar, FlagValue};
    match call.parsed().flag(name) {
        Some(FlagValue::One(FlagScalar::Str(text))) if !text.is_empty() => Some(text.clone()),
        _ => None,
    }
}

/// Reads a call of `dispatch decide|explain` (`args[0]` is the verb) through the shared parser. The sub-command
/// and the flags were checked before this runs.
pub fn project_dispatch_request(args: &[OsString]) -> DispatchRequest {
    let call = Call::new(args);
    let present = |name: &str| call.parsed().flag(name).is_some();
    let dir = call.named_dir();
    DispatchRequest {
        explain: call.sub_word() == Some("explain"),
        process_cwd: std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
        cwd: text_flag(&call, "cwd").or_else(|| dir.clone().filter(|dir| !dir.is_empty())),
        dir,
        repo_root: text_flag(&call, "repo-root"),
        executor_id: call.parsed().positional.get(1).cloned(),
        purpose: text_flag(&call, "for"),
        work: text_flag(&call, "work"),
        stage: text_flag(&call, "stage"),
        assignment: text_flag(&call, "assignment"),
        rigor: text_flag(&call, "rigor"),
        needs_soul: present("needs-soul"),
        has_live_task_access: present("has-live-task-access"),
    }
}

// ---- failures -----------------------------------------------------------------------------------------------

/// Why a request ended without an answer: the decision's own failure, or the refusal of a step around it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Failure {
    Decide(DecideFailure),
    Refused(CategorisedRefusal),
}

impl Failure {
    fn validation(message: impl Into<String>) -> Self {
        Failure::Refused(CategorisedRefusal::new("validation", message))
    }

    /// The refusal the caller prints: a runner config refusal and a config door refusal are validation errors, any
    /// other class of the model is a failure no category names (as the Node CLI exits for it).
    fn into_refusal(self) -> CategorisedRefusal {
        match self {
            Failure::Refused(refusal) => refusal,
            Failure::Decide(DecideFailure::Refused(error)) => model_refusal(&error),
            Failure::Decide(DecideFailure::ConfigDoor { message, .. })
            | Failure::Decide(DecideFailure::SeatRefused { message, .. }) => {
                CategorisedRefusal::new("validation", message)
            }
        }
    }

    /// The failure as the hook judges it (a refusal of a step around the decision is no config refusal).
    fn into_decide(self) -> DecideFailure {
        match self {
            Failure::Decide(failure) => failure,
            Failure::Refused(refusal) => DecideFailure::Refused(ModelError {
                name: "Error",
                code: None,
                message: refusal.message,
            }),
        }
    }
}

fn model_refusal(error: &ModelError) -> CategorisedRefusal {
    if error.name == "RunnerConfigError" {
        CategorisedRefusal::new("validation", error.message.clone())
    } else {
        CategorisedRefusal::unexpected(error.message.clone())
    }
}

/// The exit category a bridge refusal names, when the exit table has it.
fn category_named(name: &str) -> Option<&'static str> {
    [
        "precondition",
        "conflict",
        "validation",
        "corrupt-log",
        "lock-timeout",
        "session-fail",
        "merge-fail",
        "not-found",
    ]
    .into_iter()
    .find(|category| *category == name)
}

// ---- the workspace ------------------------------------------------------------------------------------------

/// A path as Node's `path.resolve` writes it: made absolute against `base`, `.` and `..` folded, no link followed.
pub(crate) fn resolve_path(path: &str, base: &Path) -> PathBuf {
    let joined = if Path::new(path).is_absolute() {
        PathBuf::from(path)
    } else {
        base.join(path)
    };
    let mut out = PathBuf::new();
    for part in joined.components() {
        match part {
            Component::CurDir => {}
            Component::ParentDir => {
                if !matches!(
                    out.components().next_back(),
                    None | Some(Component::RootDir)
                ) {
                    out.pop();
                }
            }
            other => out.push(other.as_os_str()),
        }
    }
    out
}

/// A path through its real location when it has one (`realpathOrSelf`).
fn real(path: &Path) -> String {
    let real = std::fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf());
    fgos_process::path::plain_path(&real)
        .to_string_lossy()
        .into_owned()
}

/// The repository and config facts a decision reads, over the Git door and the config door.
struct HostWorkspace {
    process_cwd: PathBuf,
}

impl HostWorkspace {
    fn topology(&self, dir: &str) -> Option<fgos_git::RepoHandle> {
        let path = resolve_path(dir, &self.process_cwd);
        fgos_git::GitDriver::topology_at(&path).ok().flatten()
    }

    /// Whether `HEAD` of the repository at `root` resolves. A machine with no Git state root has read nothing yet,
    /// so there is nothing to refuse on.
    fn has_commit(&self, root: &Path) -> bool {
        use fgos_git::{GitDriver, ResolveRepo};
        let state_root = fgos_holder_lock::state_root().0;
        let Ok(Some(driver)) = GitDriver::new_if_root_exists(&state_root) else {
            return true;
        };
        match driver.resolve_repo(root, root) {
            Ok(ResolveRepo::Repository(repo)) => {
                matches!(driver.resolve_commit_ref(&repo, "HEAD"), Ok(Some(_)))
            }
            _ => true,
        }
    }
}

/// What the config door refuses with, as the Node door client words it.
fn refusals_text(refusals: &[fgos_config::error::ConfigRefusal]) -> (String, String) {
    let code = refusals
        .first()
        .map_or("config-io", |refusal| refusal.code)
        .to_owned();
    let message = refusals
        .iter()
        .map(super::doctor::config_refusal_text)
        .collect::<Vec<_>>()
        .join("; ");
    (code, message)
}

fn door_failure(error: SnapshotError) -> DecideFailure {
    match error {
        SnapshotError::Refused(refusals) => {
            let (code, message) = refusals_text(&refusals);
            DecideFailure::ConfigDoor { code, message }
        }
        SnapshotError::Io(io) => DecideFailure::ConfigDoor {
            code: "config-io".into(),
            message: format!("config-io ({:?})", io.kind()),
        },
    }
}

/// The keys of the runner section whose refusals are attributed to a file and line.
const ORIGIN_KEYS: [&str; 4] = [
    "runner.modelPolicies",
    "runner.rigorToTier",
    "runner.patterns",
    "runner.loops",
];

impl Workspace for HostWorkspace {
    fn repo_root(&self, dir: &str) -> Result<String, String> {
        let shown = dir.to_owned();
        let Some(repo) = self.topology(dir) else {
            return Err(format!(
                "fgos-runner must run inside a git repository (cwd: {shown}): not a git checkout"
            ));
        };
        let Some(work_tree) = repo.work_tree() else {
            return Err(format!(
                "fgos-runner must run inside a git repository (cwd: {shown}): not a git checkout"
            ));
        };
        let root = real(work_tree);
        if !self.has_commit(Path::new(&root)) {
            return Err(format!(
                "fgos-runner requires at least one commit in {root} (HEAD does not resolve) -- run \"git commit\" (e.g. an initial commit) before running fgos-runner"
            ));
        }
        Ok(root)
    }

    fn main_checkout_root(&self, dir: &str) -> Option<String> {
        self.topology(dir)
            .map(|repo| real(repo.trusted_main_root()))
    }

    fn process_main_checkout_root(&self) -> Option<String> {
        self.main_checkout_root(&self.process_cwd.to_string_lossy())
    }

    fn project_config_present(&self, root: &str) -> bool {
        read_snapshot(Path::new(root))
            .map(|snapshot| snapshot.revisions.get("project").map(String::as_str) != Some("absent"))
            .unwrap_or(false)
    }

    fn load_runner(&self, root: &str) -> Result<LoadedRunner, DecideFailure> {
        let snapshot = read_snapshot(Path::new(root))?;
        let runner = snapshot
            .value
            .get("runner")
            .cloned()
            .unwrap_or(Value::Object(Default::default()));
        let origins = snapshot
            .origins
            .iter()
            .filter_map(|origin| {
                let path = fgos_yaml_doc::path::format_path(&origin.path);
                let wanted = ORIGIN_KEYS.iter().any(|key| {
                    path == *key
                        || path
                            .strip_prefix(key)
                            .is_some_and(|rest| rest.starts_with(['.', '[']))
                });
                wanted.then(|| RunnerOrigin {
                    path,
                    layer: origin.provenance.layer.to_owned(),
                    file: origin.provenance.file.clone(),
                    line: origin.provenance.line,
                    column: origin.provenance.column,
                })
            })
            .collect();
        Ok(LoadedRunner { runner, origins })
    }

    fn fgos_dir(&self, root: &str) -> String {
        Path::new(root).join(".fgos").to_string_lossy().into_owned()
    }
}

/// The config of the project at `root` through the config door: project over global over the standard, the
/// detected executor filled in from this process's PATH, nothing created or rewritten.
fn read_snapshot(root: &Path) -> Result<fgos_config::snapshot::Snapshot, DecideFailure> {
    let detectors = PathDetectors {
        path: std::env::var_os("PATH"),
    };
    let ctx = fgos_config::machine::context(&detectors).map_err(|refusal| {
        let (code, message) = refusals_text(&[refusal]);
        DecideFailure::ConfigDoor { code, message }
    })?;
    let roots =
        fgos_config::provider::roots(root).map_err(|refusal| DecideFailure::ConfigDoor {
            code: match refusal.reason {
                "git-read-failed" => "config-trusted-root-unresolved".to_owned(),
                other => format!("config-{other}"),
            },
            message: refusal.detail,
        })?;
    fgos_config::snapshot::snapshot(&ctx, &roots).map_err(|error| match error {
        SnapshotError::Refused(refusals) => retired_key_failure(&ctx, &roots, &refusals)
            .unwrap_or_else(|| door_failure(SnapshotError::Refused(refusals))),
        other => door_failure(other),
    })
}

/// Where a config check or refusal points: path, file, line, column.
type Place = (Option<String>, Option<String>, Option<u32>, Option<u32>);

/// The places of the config check's findings. The check is the config component's doctor, which runs on Unix; the
/// refusals alone name the places elsewhere.
#[cfg(unix)]
fn check_places(
    ctx: &fgos_config::snapshot::Context<'_>,
    roots: &fgos_config::snapshot::SnapshotRequest,
) -> Vec<Place> {
    fgos_config::doctor::check(ctx, roots, std::time::SystemTime::now())
        .into_iter()
        .map(|f| (f.path, f.file, f.line, f.column))
        .collect()
}

#[cfg(not(unix))]
fn check_places(
    _ctx: &fgos_config::snapshot::Context<'_>,
    _roots: &fgos_config::snapshot::SnapshotRequest,
) -> Vec<Place> {
    Vec::new()
}

/// A refusal of the config door that lies on a retired `runner.patterns` key says so, naming the file, the position
/// and what replaced the key (code `config-key-retired`). The places come from the config check's findings first,
/// then from the refusals themselves, one sentence per key and file.
fn retired_key_failure(
    ctx: &fgos_config::snapshot::Context<'_>,
    roots: &fgos_config::snapshot::SnapshotRequest,
    refusals: &[fgos_config::error::ConfigRefusal],
) -> Option<DecideFailure> {
    let mut places = check_places(ctx, roots);
    places.extend(
        refusals
            .iter()
            .map(|r| (r.path.clone(), r.file.clone(), r.line, r.column)),
    );
    let mut sentences: Vec<String> = Vec::new();
    let mut seen: Vec<(String, String)> = Vec::new();
    for (path, file, line, column) in places {
        let Some((key, instruction)) = path.as_deref().and_then(retired_pattern_key_at) else {
            continue;
        };
        let file_text = file.as_deref().unwrap_or_default();
        if seen.iter().any(|(k, f)| *k == key && f == file_text) {
            continue;
        }
        seen.push((key.clone(), file_text.to_owned()));
        let shown = match file.as_deref() {
            Some(global) if global.starts_with("global:") => {
                format!("~/.fgos/{}", &global["global:".len()..])
            }
            Some(other) => other.to_owned(),
            None => "<file>".to_owned(),
        };
        let at = match (line, column) {
            (Some(line), Some(column)) => format!(":{line}:{column}"),
            _ => String::new(),
        };
        sentences.push(format!("{shown}{at}: {key} was retired; {instruction}."));
    }
    (!sentences.is_empty()).then(|| DecideFailure::ConfigDoor {
        code: "config-key-retired".into(),
        message: sentences.join("\n"),
    })
}

// ---- decide -------------------------------------------------------------------------------------------------

/// The Work layer's hint for `--work`, asked of the Node rows bridge.
fn work_hint(root: &Path, work_id: &str, stage: Option<&str>) -> Result<Option<Value>, Failure> {
    NodeBridge::new()
        .work_dispatch_hint(root, work_id, stage)
        .map_err(|fault| match fault {
            Fault::Refused { message, category } => {
                Failure::Refused(match category.as_deref().and_then(category_named) {
                    Some(category) => CategorisedRefusal::new(category, message),
                    None => CategorisedRefusal::unexpected(message),
                })
            }
            other => Failure::Refused(CategorisedRefusal::new(
                "precondition",
                format!(
                    "--work needs the Work layer, which is read through Node: {}",
                    other.message()
                ),
            )),
        })
}

/// The assignment record of `id` under the project's `.fgos`; absent or unreadable is no record.
fn assignment_record(fgos_dir: &Path, id: &str) -> Option<Value> {
    let relative = Path::new("assignments").join(id).join("assignment.json");
    let bytes = read_beneath(fgos_dir, &relative)?;
    serde_json::from_slice(&bytes).ok()
}

/// An id that is one plain path segment: no separator, no drive prefix, no `.` or `..`, no NUL.
fn plain_segment(id: &str) -> bool {
    !id.contains(['/', '\\', ':', '\0'])
        && matches!(
            Path::new(id).components().collect::<Vec<_>>().as_slice(),
            [std::path::Component::Normal(_)]
        )
}

/// What a decision is asked, whichever door asks it.
struct DecideInput<'a> {
    process_cwd: &'a Path,
    cwd: Option<&'a str>,
    repo_root: Option<&'a str>,
    executor_id: Option<&'a str>,
    purpose: Option<&'a str>,
    work: Option<&'a str>,
    stage: Option<&'a str>,
    assignment: Option<&'a str>,
    needs_soul: bool,
    has_live_task_access: bool,
}

/// `decide` end to end: the `--repo-root` guard, the project root, the config root, the checked runner (its
/// warnings handed to `on_warning`), the Work hint and the assignment record, then the decision.
fn decide_flow(
    input: &DecideInput,
    on_warning: &dyn Fn(&str),
) -> Result<fgos_execution::decide::DecideAnswer, Failure> {
    let ws = HostWorkspace {
        process_cwd: input.process_cwd.to_path_buf(),
    };
    let resolve = |path: &str| {
        resolve_path(path, input.process_cwd)
            .to_string_lossy()
            .into_owned()
    };
    guard_cwd_repo_root(&ws, input.cwd, input.repo_root, resolve)
        .map_err(|error| Failure::Decide(DecideFailure::Refused(error)))?;
    let cwd = input.cwd.map_or_else(
        || input.process_cwd.to_string_lossy().into_owned(),
        str::to_owned,
    );
    let root = match input.repo_root {
        Some(root) => root.to_owned(),
        None => match ws.main_checkout_root(&cwd) {
            Some(root) => root,
            None => ws.repo_root(&cwd).map_err(Failure::validation)?,
        },
    };
    let config_root = config_root_for(&ws, Some(&cwd), &root);
    let (runner, warnings) = load_checked_runner(&ws, &config_root).map_err(Failure::Decide)?;
    for warning in &warnings {
        on_warning(warning);
    }
    let named = input.executor_id.is_some_and(|id| !id.is_empty());
    let mut request = DecideRequest {
        executor_id: input.executor_id.map(str::to_owned),
        purpose: input.purpose.map(str::to_owned),
        work_id: input.work.map(str::to_owned),
        assignment: input.assignment.map(str::to_owned),
        needs_soul: input.needs_soul,
        has_live_task_access: input.has_live_task_access,
        ..DecideRequest::default()
    };
    if let (false, Some(work_id)) = (named, input.work) {
        request.work_hint = work_hint(Path::new(&root), work_id, input.stage)?;
    }
    if let (false, Some(id)) = (named, input.assignment) {
        if !plain_segment(id) {
            return Err(Failure::validation(format!(
                "--assignment \"{id}\" must be one plain path segment (an assignment id), not a path"
            )));
        }
        request.assignment_record = assignment_record(&Path::new(&root).join(".fgos"), id);
    }
    let machine = HostMachine::new(None, None);
    let probe = HostProbe::new(&machine, Some(PathBuf::from(&config_root)));
    let binder = CrateBinder {
        machine: &machine,
        now: now_ms(),
    };
    decide_over(&runner, &request, &probe, &binder).map_err(Failure::Decide)
}

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |elapsed| elapsed.as_millis() as u64)
}

// ---- explain ------------------------------------------------------------------------------------------------

/// `explain` end to end: the checked runner of the project (the directory `--dir` names, else the process's own),
/// then the capability's seat explained for a headless session.
fn explain_flow(request: &DispatchRequest, on_warning: &dyn Fn(&str)) -> Result<Value, Failure> {
    let Some(capability) = request.purpose.as_deref() else {
        return Err(Failure::validation(
            "dispatch explain requires --for <capability>",
        ));
    };
    let ws = HostWorkspace {
        process_cwd: request.process_cwd.clone(),
    };
    let project = match request.dir.as_deref() {
        Some(dir) => resolve_path(dir, &request.process_cwd),
        None => request.process_cwd.clone(),
    };
    let (runner, warnings) =
        load_checked_runner(&ws, &project.to_string_lossy()).map_err(Failure::Decide)?;
    for warning in &warnings {
        on_warning(warning);
    }
    let machine = HostMachine::new(None, None);
    let session = BindSession {
        headless: true,
        has_native_agent: false,
        posture_at_launch: false,
    };
    explain_capability(
        &runner,
        capability,
        request.rigor.as_deref(),
        &session,
        &machine,
        now_ms(),
    )
    .map_err(|error| Failure::Decide(DecideFailure::Refused(error)))
}

/// What a request answers: the data of the envelope, or the caller's refusal.
fn answer(request: &DispatchRequest) -> Result<Value, CategorisedRefusal> {
    let warn = |text: &str| eprintln!("{text}");
    let outcome = if request.explain {
        explain_flow(request, &warn)
    } else {
        decide_flow(
            &DecideInput {
                process_cwd: &request.process_cwd,
                cwd: request.cwd.as_deref(),
                repo_root: request.repo_root.as_deref(),
                executor_id: request.executor_id.as_deref(),
                purpose: request.purpose.as_deref(),
                work: request.work.as_deref(),
                stage: request.stage.as_deref(),
                assignment: request.assignment.as_deref(),
                needs_soul: request.needs_soul,
                has_live_task_access: request.has_live_task_access,
            },
            &warn,
        )
        .map(|decided| decided.to_json())
    };
    outcome.map_err(Failure::into_refusal)
}

/// The provider of `dispatch decide` and `dispatch explain`.
pub struct DispatchProvider {
    descriptor: ProviderDescriptor,
}

impl DispatchProvider {
    pub fn for_descriptor(descriptor: ProviderDescriptor) -> Self {
        Self { descriptor }
    }
}

impl OperationProvider for DispatchProvider {
    fn descriptor(&self) -> &ProviderDescriptor {
        &self.descriptor
    }

    fn invoke<'a>(
        &'a self,
        _invocation: &'a HostInvocation,
        request: OperationRequest,
        _control: InvocationControl,
        events: &'a dyn EventSink,
    ) -> Pin<Box<dyn Future<Output = Result<ProviderOutcome, ProviderError>> + Send + 'a>> {
        Box::pin(async move {
            events.record_event(&format!("{}.invoked", self.descriptor.operation_id));
            let request = request
                .input
                .downcast_ref::<DispatchRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not DispatchRequest".into())
                })?;
            let contract = self.descriptor.outcome_contract.clone();
            Ok(match answer(request) {
                Ok(value) => ProviderOutcome::completed(contract, Box::new(JsonOutcome(value))),
                Err(refusal) => ProviderOutcome::completed(contract, Box::new(refusal)),
            })
        })
    }
}

// ---- the hook -----------------------------------------------------------------------------------------------

/// `--format=<name>` among the flags of a hook call, else none: the payload's own shape decides.
fn format_of_flags(flags: &[OsString]) -> Option<String> {
    flags.iter().find_map(|flag| {
        flag.to_string_lossy()
            .strip_prefix("--format=")
            .map(str::to_owned)
    })
}

/// The verdict for one call: `decide --for <subagent type> --needs-soul --has-live-task-access` at the call's
/// project, and the run door named from the main checkout's config.
fn judge(call: &HookCall) -> Verdict {
    let project = PathBuf::from(&call.project_dir);
    let process_cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    dispatch_verdict(
        call,
        project.is_dir(),
        |subagent_type| {
            decide_flow(
                &DecideInput {
                    process_cwd: &process_cwd,
                    cwd: Some(&call.project_dir),
                    repo_root: None,
                    executor_id: None,
                    purpose: Some(subagent_type),
                    work: None,
                    stage: None,
                    assignment: None,
                    needs_soul: true,
                    has_live_task_access: true,
                },
                &|_| {},
            )
            .map_err(Failure::into_decide)
        },
        |executor_id, capability| {
            let ws = HostWorkspace {
                process_cwd: process_cwd.clone(),
            };
            let cwd = call.project_dir.as_str();
            let runner = ws
                .main_checkout_root(cwd)
                .or_else(|| ws.repo_root(cwd).ok())
                .and_then(|root| load_checked_runner(&ws, &root).ok())
                .map(|(runner, _)| runner);
            run_door_hint(runner.as_ref(), executor_id, Some(capability))
        },
    )
}

/// Runs the hook over `payload` and returns what it prints and exits with; separate from the process so the
/// wiring can be proven without one.
pub fn hook_answer_for(
    payload: &str,
    flags: &[OsString],
    claude_project_dir: Option<&str>,
    cwd: &str,
) -> fgos_execution::hook::HookAnswer {
    serve_hook(
        payload,
        format_of_flags(flags).as_deref(),
        claude_project_dir,
        cwd,
        judge,
    )
}

/// `fgos hook dispatch-decide [--format=standard|agy]`: reads the payload from stdin, answers in the call's
/// protocol and ends the process. A payload that does not parse, a failure of the decision other than a refused
/// config, and a panic all allow the call.
pub fn hook_main(flags: &[OsString]) -> ! {
    let mut raw = Vec::new();
    // An unreadable stdin is an empty payload, which allows.
    let _ = std::io::stdin().take(HOOK_STDIN_CAP).read_to_end(&mut raw);
    let payload = String::from_utf8_lossy(&raw);
    let cwd = std::env::current_dir()
        .map(|cwd| cwd.to_string_lossy().into_owned())
        .unwrap_or_else(|_| ".".to_owned());
    let claude_dir = std::env::var("CLAUDE_PROJECT_DIR").ok();
    let answer = hook_answer_for(&payload, flags, claude_dir.as_deref(), &cwd);
    use std::io::Write;
    let _ = std::io::stdout().write_all(answer.stdout.as_bytes());
    let _ = std::io::stderr().write_all(answer.stderr.as_bytes());
    std::process::exit(answer.exit_code)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn os(args: &[&str]) -> Vec<OsString> {
        args.iter().map(OsString::from).collect()
    }

    #[test]
    fn a_decide_call_reads_its_selectors_and_the_flags_by_presence() {
        let request = project_dispatch_request(&os(&[
            "dispatch",
            "decide",
            "judge-discovery",
            "--for",
            "review",
            "--has-live-task-access",
            "--needs-soul",
            "--cwd",
            "/work",
            "--repo-root",
            "/main",
            "--work",
            "tsk-1",
            "--stage",
            "plan",
            "--assignment",
            "asgn-1",
        ]));
        assert!(!request.explain);
        assert_eq!(request.executor_id.as_deref(), Some("judge-discovery"));
        assert_eq!(request.purpose.as_deref(), Some("review"));
        assert_eq!(
            (request.work.as_deref(), request.stage.as_deref()),
            (Some("tsk-1"), Some("plan"))
        );
        assert_eq!(request.assignment.as_deref(), Some("asgn-1"));
        assert_eq!(request.cwd.as_deref(), Some("/work"));
        assert_eq!(request.repo_root.as_deref(), Some("/main"));
        assert!(request.needs_soul && request.has_live_task_access);
    }

    #[test]
    fn a_dir_names_the_cwd_when_no_cwd_is_given_and_a_bare_selector_flag_says_nothing() {
        let request =
            project_dispatch_request(&os(&["dispatch", "decide", "--dir", "/p", "--for"]));
        assert_eq!(request.cwd.as_deref(), Some("/p"));
        assert_eq!(request.purpose, None);
        let explain = project_dispatch_request(&os(&[
            "dispatch",
            "explain",
            "--for",
            "code:implement",
            "--rigor",
            "high",
        ]));
        assert!(explain.explain);
        assert_eq!(explain.purpose.as_deref(), Some("code:implement"));
        assert_eq!(explain.rigor.as_deref(), Some("high"));
    }

    #[test]
    fn a_path_is_resolved_like_node_resolves_it() {
        let base = Path::new("/a/b");
        assert_eq!(resolve_path("c/../d", base), PathBuf::from("/a/b/d"));
        assert_eq!(resolve_path("/x/./y/..", base), PathBuf::from("/x"));
        assert_eq!(resolve_path("../../..", base), PathBuf::from("/"));
    }

    #[test]
    fn an_assignment_id_is_one_plain_path_segment() {
        for good in ["asgn-1", "unit-run-1794977600551-f5a8957a"] {
            assert!(plain_segment(good), "{good}");
        }
        for bad in ["", ".", "..", "a/b", "../x", "a\\b", "a\0b", "C:x", "C:"] {
            assert!(!plain_segment(bad), "{bad:?}");
        }
    }

    #[test]
    fn the_format_flag_is_read_in_its_equals_form_only() {
        assert_eq!(
            format_of_flags(&os(&["--format=agy"])).as_deref(),
            Some("agy")
        );
        assert_eq!(format_of_flags(&os(&["--format", "agy"])), None);
        assert_eq!(format_of_flags(&[]), None);
    }

    #[test]
    fn a_payload_that_is_empty_or_names_no_agent_tool_allows_in_the_format_of_its_flag() {
        let allow_standard = hook_answer_for("", &[], None, "/cwd");
        assert_eq!(
            (allow_standard.exit_code, allow_standard.stdout.as_str()),
            (0, "")
        );
        let allow_agy = hook_answer_for("", &os(&["--format=agy"]), None, "/cwd");
        assert_eq!(allow_agy.stdout, "{\"decision\":\"allow\"}\n");
        let other_tool = hook_answer_for(
            r#"{"tool_name":"Bash","tool_input":{"command":"ls"}}"#,
            &[],
            None,
            "/cwd",
        );
        assert_eq!(other_tool.exit_code, 0);
    }

    #[test]
    fn a_missing_project_directory_blocks_an_agent_call_in_the_standard_protocol() {
        let answer = hook_answer_for(
            r#"{"tool_name":"Task","tool_input":{"subagent_type":"x"}}"#,
            &[],
            Some("/nonexistent-fgos-project-directory"),
            "/cwd",
        );
        assert_eq!(answer.exit_code, 2);
        assert!(
            answer.stderr.starts_with(
                "BLOCKED: this Task call cannot be routed because the project directory"
            ),
            "{}",
            answer.stderr
        );
    }
}
