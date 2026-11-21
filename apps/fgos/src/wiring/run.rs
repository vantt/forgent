//! `fgos run`: the door for one task, served from engine `unit_run` over the composed host.
//!
//! The call is read with the shared parser and handed to `fgos-execution`'s `build_run_request` (the three ways to
//! run, the Unit a prompt stands for, the overrides, the request parameters, the case), whose questions this module
//! answers from the machine: the Git door, the runner config, the persona layers, the plan rule, the dispatch depth.
//! The run itself is [`HostUnitRun::run_unit`] over the host [`execution_routes::unit_run_host`] composes, so the
//! cancel handlers hold for as long as it lasts. The answer is the envelope of the run's result, whatever `--json`
//! says, and the exit status of its outcome; a refusal is one `fgos: <message>` line with its category's status.
//!
//! The Workflow's case admission port is still Node's: the first time a run asks it (every writing run asks
//! `resolveBinding`, a run that names a case asks `activityUnitOf`, a confined worker's writing run asks
//! `confinedWriteRefusal`), the payload's admission peer is started through `legacy_exec` and spoken to over its
//! stdin and stdout. A run that never asks the port starts no Node.

use std::cell::RefCell;
use std::ffi::OsString;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;
use std::process::{Child, Stdio};
use std::sync::{Arc, OnceLock};
use std::time::{Duration, Instant};

use fgos_execution::admission::{Admission, CaseAdmission, Recheck};
use fgos_execution::run_request::{
    build_run_request, resolve_path, Flags, GitRoots, RunRequestHost,
};
use fgos_execution::unit::Refusal;
use fgos_execution_engine::unit_run::peer::{
    PeerAdmission, PeerChannel, PeerError, DEFAULT_DEADLINE,
};
use fgos_execution_engine::unit_run::run_unit_contract::{ErrorTag, RunUnitError};
use fgos_git::{GitDriver, ResolveRepo};
use fgos_host_runtime::cli_args::{FlagScalar, FlagValue};
use fgos_host_runtime::{
    CategorisedRefusal, ContractRef, EventSink, HostInvocation, InvocationControl, OperationId,
    OperationProvider, OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle,
    ProviderOutcome, VerbAnswer,
};
use serde_json::{json, Value};
use std::borrow::Cow;

use super::execution_routes::{self, SharedPort};
use super::unit_run_host::{checks, machine, persona};
use crate::legacy_exec;
use crate::routing::Call;

pub const OPERATION_ID: &str = "run.unit";

pub const DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed(OPERATION_ID),
    operation_id: OperationId::from_static(OPERATION_ID),
    component_class: Cow::Borrowed("execution"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("run.unit.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("run.unit.outcome", "1.0.0"),
    allowed_hosts: &["cli"],
    allowed_modes: &["sync"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

/// The payload module that serves the Workflow's case admission port.
const PEER_MODULE: &str = "src/workflow/admission-peer.mjs";
/// How long a peer whose channel closed may take to end before it is ended.
const PEER_EXIT_GRACE: Duration = Duration::from_secs(5);

// ---- the request --------------------------------------------------------------------------------------------

/// One `fgos run` invocation: the flags and positionals as the Node parser reads them, and where it runs.
#[derive(Debug, Clone, PartialEq)]
pub struct RunCall {
    pub flags: Flags,
    pub positional: Vec<String>,
    pub cwd: PathBuf,
}

fn scalar(value: &FlagScalar) -> Value {
    match value {
        FlagScalar::Bool => Value::Bool(true),
        FlagScalar::Str(text) => Value::String(text.clone()),
    }
}

/// Reads a call of `run` (`args[0]` is the verb) through the shared parser: a bare flag is `true`, a repeatable one
/// the list of its uses. The flags were checked against the registry before this runs.
pub fn project_run_request(args: &[OsString]) -> RunCall {
    let call = Call::new(args);
    let flags = call
        .parsed()
        .flags
        .iter()
        .map(|(name, value)| {
            let value = match value {
                FlagValue::One(one) => scalar(one),
                FlagValue::Many(all) => Value::Array(all.iter().map(scalar).collect()),
            };
            (name.clone(), value)
        })
        .collect();
    RunCall {
        flags,
        positional: call.parsed().positional.clone(),
        cwd: std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
    }
}

// ---- the admission peer -------------------------------------------------------------------------------------

/// A started peer: the channel to it and the process, which ends once the channel is closed.
struct StartedPeer {
    port: Option<PeerAdmission>,
    child: Child,
}

impl Drop for StartedPeer {
    fn drop(&mut self) {
        // Closing its stdin ends the peer's serve loop; one that does not end in the grace is ended.
        drop(self.port.take());
        let until = Instant::now() + PEER_EXIT_GRACE;
        while Instant::now() < until {
            if !matches!(self.child.try_wait(), Ok(None)) {
                return;
            }
            std::thread::sleep(Duration::from_millis(20));
        }
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

/// The Workflow's case admission port for one run, served by the admission peer, which starts the first time the
/// port is asked. `repo_root` is the main checkout the port is built for, when the run knows it.
pub struct LazyPeer {
    repo_root: Option<String>,
    started: OnceLock<Result<StartedPeer, PeerError>>,
}

impl LazyPeer {
    pub fn new(repo_root: Option<String>) -> Self {
        Self {
            repo_root,
            started: OnceLock::new(),
        }
    }

    fn start(&self) -> Result<StartedPeer, PeerError> {
        let refused =
            |why: String| PeerError::Io(format!("the admission peer cannot start: {why}"));
        let mut command = legacy_exec::payload_module_command(PEER_MODULE).map_err(refused)?;
        if let Some(root) = &self.repo_root {
            command.arg("--repo-root").arg(root);
        }
        command
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit());
        // Its own process group: a Ctrl-C at the terminal cancels the run, and the run still settles through the
        // peer; the peer ends when the run closes its channel.
        #[cfg(unix)]
        {
            use std::os::unix::process::CommandExt;
            command.process_group(0);
        }
        let mut child = fgos_process::control::spawn_with_fds(command, &[])
            .map_err(|e| refused(e.to_string()))?;
        match PeerChannel::over_child(&mut child, DEFAULT_DEADLINE) {
            Some(channel) => Ok(StartedPeer {
                port: Some(PeerAdmission::new(channel)),
                child,
            }),
            None => {
                let _ = child.kill();
                let _ = child.wait();
                Err(refused("its pipes were not captured".into()))
            }
        }
    }

    fn port(&self) -> Result<&PeerAdmission, PeerError> {
        match self.started.get_or_init(|| self.start()) {
            Ok(started) => Ok(started
                .port
                .as_ref()
                .expect("the port is taken only when the peer is dropped")),
            Err(error) => Err(error.clone()),
        }
    }
}

impl CaseAdmission for LazyPeer {
    type Error = PeerError;
    fn resolve_binding(&self, ask: &Value) -> Result<Value, PeerError> {
        self.port()?.resolve_binding(ask)
    }
    fn admit(&self, proposal: &Value) -> Result<Admission, PeerError> {
        self.port()?.admit(proposal)
    }
    fn recheck_effect(
        &self,
        reservation_id: &str,
        case_id: &str,
        paths: &[String],
    ) -> Result<Recheck, PeerError> {
        self.port()?.recheck_effect(reservation_id, case_id, paths)
    }
    fn settle(&self, reservation_id: &str, settle: &Value) -> Result<(), PeerError> {
        self.port()?.settle(reservation_id, settle)
    }
    fn activity_unit_of(
        &self,
        main_root: &str,
        case_id: &str,
        activity: &str,
    ) -> Result<Option<Value>, PeerError> {
        self.port()?.activity_unit_of(main_root, case_id, activity)
    }
    fn confined_write_refusal(
        &self,
        main_root: &str,
        case_id: Option<&str>,
    ) -> Result<Option<String>, PeerError> {
        self.port()?.confined_write_refusal(main_root, case_id)
    }
}

// ---- what the request reads of the machine ------------------------------------------------------------------

/// The machine a run request is built on. A port question the peer could not answer, or a failing random source,
/// ends the request with that failure, as the Node call that threw did.
struct RunMachine<'a> {
    cwd: String,
    peer: &'a LazyPeer,
    fault: RefCell<Option<String>>,
}

impl RunMachine<'_> {
    fn failed(&self, message: String) {
        self.fault.borrow_mut().get_or_insert(message);
    }

    fn peer_failed(&self, error: PeerError) {
        self.failed(match error {
            PeerError::Remote { message, .. } => message,
            other => other.to_string(),
        });
    }
}

impl RunRequestHost for RunMachine<'_> {
    fn cwd(&self) -> String {
        self.cwd.clone()
    }
    fn process_cwd(&self) -> String {
        self.cwd.clone()
    }
    /// `resolveGitRoots` (`src/runner/execution/run.mjs`): a directory Git cannot answer for is a
    /// `RunnerConfigError`.
    fn git_roots(&self, dir: &str) -> Result<GitRoots, Refusal> {
        machine::git_roots(Path::new(dir), false)
            .map(|roots| GitRoots {
                main_checkout_root: roots.main_checkout_root.to_string_lossy().into_owned(),
                is_linked_worktree: roots.is_linked_worktree,
            })
            .map_err(Refusal::config)
    }
    fn confined_write_refusal(&self, main_root: &str, case_id: Option<&str>) -> Option<String> {
        self.peer
            .confined_write_refusal(main_root, case_id)
            .unwrap_or_else(|error| {
                self.peer_failed(error);
                None
            })
    }
    fn activity_unit_of(
        &self,
        main_root: Option<&str>,
        case_id: &str,
        activity: &str,
    ) -> Option<Value> {
        self.peer
            .activity_unit_of(main_root.unwrap_or_default(), case_id, activity)
            .unwrap_or_else(|error| {
                self.peer_failed(error);
                None
            })
    }
    fn dispatch_depth(&self) -> f64 {
        fgos_execution_engine::transport::adapters::current_dispatch_depth()
    }
    fn random_hex4(&self) -> String {
        match fgos_identity::text::random_bytes::<2>() {
            Ok(bytes) => fgos_execution::handoff::hex(&bytes),
            Err(error) => {
                self.failed(format!("no random bytes for the unit id: {error}"));
                String::new()
            }
        }
    }
    fn parse_run_timeout(&self, text: &str) -> Result<u64, String> {
        fgos_execution::bind::parse_run_timeout(text, "--timeout")
    }
    fn provider_ids(&self, main_root: &str) -> Result<Vec<String>, Refusal> {
        let runner =
            machine::load_runner_config(Path::new(main_root)).map_err(|error| Refusal {
                name: error.tag.as_str(),
                message: error.message,
                code: error.code,
                phase: error.phase,
            })?;
        Ok(runner
            .get("executors")
            .and_then(Value::as_object)
            .into_iter()
            .flatten()
            .filter(|(_, executor)| {
                executor
                    .get("kind")
                    .and_then(Value::as_str)
                    .unwrap_or("agent")
                    == "agent"
            })
            .map(|(id, _)| id.clone())
            .collect())
    }
    fn check_agent_definition(&self, name: &str, project_root: &str) -> Result<(), String> {
        let install = crate::active_payload_root()?;
        persona::check_agent_definition(name, Path::new(project_root), &install)
    }
    fn plan_dir_problem(&self, name: &str, main_root: &str) -> Result<Option<String>, String> {
        checks::PlanChecks.plan_dir_problem(name, main_root)
    }
    fn is_plan_directory(&self, main_root: &str, plan_dir: &str) -> bool {
        checks::PlanChecks.is_plan_directory(main_root, plan_dir)
    }
}

/// The refusal of an error of the Node class `class`, exiting as Node's CLI exited for it (`EXIT_CODES[categoryOf
/// (err)]`, `bin/fgos.mjs`): `RunnerConfigError` and `CaseAdmissionRefusedError`, which extends it, carry the
/// `validation` category. No other class `fgos run` can end in carries one (`RunRequestError`, `TypeError`,
/// `DispatchError`, `SeatResolutionError`, `SeatBindingError`, `YamlParseError`, the confinement errors, a file system
/// error), so each exits as unexpected.
fn refusal_of_class(class: &str, message: String) -> CategorisedRefusal {
    match class {
        "RunnerConfigError" | "CaseAdmissionRefusedError" => {
            CategorisedRefusal::new("validation", message)
        }
        _ => CategorisedRefusal::unexpected(message),
    }
}

/// A request refusal, under the class it was raised as.
fn request_refusal(refusal: Refusal) -> CategorisedRefusal {
    refusal_of_class(refusal.name, refusal.message)
}

/// A run that ended in an error, as `fgos run` reports it: a `RunnerConfigError` (or a class that extends it)
/// names its code when its message does not; the class decides the exit.
fn run_refusal(error: RunUnitError) -> CategorisedRefusal {
    let message = match &error.code {
        Some(code) if error.tag != ErrorTag::Error && !error.message.contains(code.as_str()) => {
            format!("{code}: {}", error.message)
        }
        _ => error.message,
    };
    refusal_of_class(error.tag.as_str(), message)
}

// ---- the dir warning ----------------------------------------------------------------------------------------

/// The checkout root and the common Git directory of `dir`, links resolved; `None` outside a repository.
fn checkout_of(driver: &GitDriver, dir: &Path) -> Option<(PathBuf, PathBuf)> {
    let real = |path: &Path| {
        fgos_process::path::plain_path(&std::fs::canonicalize(path).unwrap_or(path.to_path_buf()))
    };
    match driver.resolve_repo(dir, dir).ok()? {
        ResolveRepo::Repository(repo) => Some((real(repo.work_tree()?), real(repo.common_dir()))),
        ResolveRepo::NotARepository => None,
    }
}

/// `dirDiffersFromCwdWarning` (`src/workflow/dir-guard.mjs`): a `--dir` naming another project than the working
/// directory, where workers start. None without `--dir`, with `--worktree`, in a detached child, outside a
/// repository on either side, in the same repository, or when one project lies inside the other.
fn dir_differs_from_cwd(call: &RunCall) -> Option<Value> {
    let dir = call.flags.get("dir").and_then(Value::as_str)?;
    let worktree = call.flags.get("worktree");
    if dir.is_empty()
        || worktree.is_some_and(|w| match w {
            Value::String(text) => !text.is_empty(),
            Value::Bool(given) => *given,
            _ => true,
        })
        || std::env::var("FGOS_WORKFLOW_ADVANCE_DETACHED").as_deref() == Ok("1")
    {
        return None;
    }
    let driver = GitDriver::new(&fgos_holder_lock::state_root::state_root().0).ok()?;
    let (there, there_common) = checkout_of(&driver, &call.cwd.join(dir))?;
    let (here, here_common) = checkout_of(&driver, &call.cwd)?;
    if there_common == here_common || there.starts_with(&here) || here.starts_with(&there) {
        return None;
    }
    let (there, here) = (there.display(), here.display());
    Some(json!({
        "code": "dir-differs-from-cwd",
        "message": format!("--dir {there} is a different project than the current directory {here}: state is stored under --dir, but workers start in {here} and cannot read {there} without a permission prompt"),
        "fix": format!("cd {there} first and run fgos from there (or pass --worktree {there})"),
    }))
}

// ---- the run ------------------------------------------------------------------------------------------------

/// What a run answers: the envelope's data and the exit status of its outcome, or the refusal.
fn answer(call: &RunCall) -> Result<VerbAnswer, CategorisedRefusal> {
    let cwd = call.cwd.to_string_lossy().into_owned();
    // The port is built for the root the request names it for (`--dir`, else the main checkout of the working
    // directory), known before the request asks the port anything.
    let port_root = match call.flags.get("dir").and_then(Value::as_str) {
        Some(dir) if !dir.is_empty() => Some(resolve_path(&cwd, dir)),
        _ => machine::git_roots(&call.cwd, false)
            .ok()
            .map(|roots| roots.main_checkout_root.to_string_lossy().into_owned()),
    };
    let peer = Arc::new(LazyPeer::new(port_root));
    let machine = RunMachine {
        cwd,
        peer: &peer,
        fault: RefCell::new(None),
    };
    let built = build_run_request(&call.flags, &call.positional, &machine);
    if let Some(fault) = machine.fault.take() {
        return Err(CategorisedRefusal::unexpected(fault));
    }
    let request = built.map_err(request_refusal)?;
    let serves_port = request.case_admission_root.is_some();
    let mut options = request.to_json(&|_| Value::Null);
    if let Some(options) = options.as_object_mut() {
        options.remove("caseAdmission");
    }
    let warning = dir_differs_from_cwd(call);
    if let Some(warning) = &warning {
        eprintln!(
            "warning [{}]: {}. Fix: {}",
            warning["code"].as_str().unwrap_or_default(),
            warning["message"].as_str().unwrap_or_default(),
            warning["fix"].as_str().unwrap_or_default()
        );
    }
    // This process is a controller: Ctrl-C and SIGTERM cancel the attempts it started.
    fgos_run_supervisor::controller::cancel::enable_cancel_on_signal();
    let host = execution_routes::unit_run_host(
        &options,
        serves_port.then(|| SharedPort(Arc::clone(&peer))),
    )
    .map_err(CategorisedRefusal::unexpected)?;
    let mut data = host.run_unit(&options).map_err(run_refusal)?;
    drop(host);
    if let (Some(warning), Some(object)) = (warning, data.as_object_mut()) {
        let warnings = object.entry("warnings").or_insert_with(|| json!([]));
        if let Some(list) = warnings.as_array_mut() {
            list.push(warning);
        }
    }
    let exit = match data.get("outcome").and_then(Value::as_str) {
        Some(outcome) if !outcome.is_empty() => {
            fgos_execution::outcome::exit_code_for_outcome(outcome)
        }
        _ => 0,
    };
    Ok(VerbAnswer {
        data,
        exit,
        text: None,
    })
}

/// The provider of `fgos run`.
pub struct RunProvider {
    descriptor: ProviderDescriptor,
}

impl RunProvider {
    pub fn new() -> Self {
        Self {
            descriptor: DESCRIPTOR,
        }
    }
}

impl Default for RunProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl OperationProvider for RunProvider {
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
            events.record_event(&format!("{OPERATION_ID}.invoked"));
            let call = request
                .input
                .downcast_ref::<RunCall>()
                .ok_or_else(|| ProviderError::SemanticValidation("input is not RunCall".into()))?;
            let contract = self.descriptor.outcome_contract.clone();
            Ok(match answer(call) {
                Ok(answer) => ProviderOutcome::completed(contract, Box::new(answer)),
                Err(refusal) => ProviderOutcome::completed(contract, Box::new(refusal)),
            })
        })
    }
}
