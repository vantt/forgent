//! A head session's launch through the host: engine `launch_session_attempt` over [`HostSessionDriver`], the
//! host's [`AttemptDriver`] (`launchSessionAttempt`, `src/runner/dispatch/session-attempt.mjs`). Each step is the one
//! a worker attempt takes (`execute_assignment` in engine `assignment_runner`), over the same machine
//! ([`HostExecution`]): open the attempt, take its lock (read-only, no dispatch-cwd lease), publish its intent, lease
//! the account the binding names, renew its login, prepare the seat (a terminal pane typed the opening verbatim) and
//! hand it to the supervisor, waiting only for the binding. A session has no run control, no settle step and no
//! result; the engine decides the order and what a refusal gives back.

use std::cell::RefCell;
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use fgos_execution::dispatch_policy::launch_pin_of;
use fgos_execution::executor_model::with_default_executor;
use fgos_execution_engine::accounts::SystemHost;
use fgos_execution_engine::assignment_runner::attempt::{
    close_attempt, open_attempt, publish_attempt_intent, Attempt, OpenAttempt,
};
use fgos_execution_engine::assignment_runner::execute::ExecutePorts;
use fgos_execution_engine::assignment_runner::launch::start_and_bind;
use fgos_execution_engine::assignment_runner::lease::{
    lease_account_for_attempt, renew_leased_login, LeaseRequest,
};
use fgos_execution_engine::assignment_runner::seat::{
    prepare_attempt_seat, CommandAsk, PaneAsk, PaneSeat, SeatHooks, SeatInput, SeatPorts,
};
use fgos_execution_engine::assignment_runner::RunnerConfigError;
use fgos_execution_engine::confinement::request::Launch;
use fgos_execution_engine::transport_round::session_attempt::{
    launch_session_attempt, mint_attempt_id, AttemptDriver, Bound, HeadGrant, Lease, SessionLaunch,
    SessionLaunchError, SessionPlacement, SessionSeat,
};
use fgos_run_supervisor::controller::error::DispatchError;
use fgos_run_supervisor::controller::launch::{
    acquire_attempt_locks, AttemptHost, AttemptLockRequest, Binding,
};
use serde_json::{json, Map, Value};

use super::execution::HostExecution;
use super::terminal::{prepare_pane_here, HerdrRoute, PaneRoute};

/// What `launchSessionAttempt` is given (`placeHead`, `src/session-host/head-start.mjs`), as plain data.
#[derive(Debug, Clone)]
pub struct SessionRequest {
    /// `bind()`'s answer for the seat: executor, invocation, model, tier, effort, account.
    pub binding: Value,
    pub runner_config: Value,
    pub key: String,
    pub role: String,
    pub grant: HeadGrant,
    pub opening: String,
    pub ceiling_ms: u64,
    pub env: BTreeMap<String, String>,
    pub project_root: PathBuf,
    pub beside: Option<String>,
    pub display: Option<Value>,
    /// `opts.providerCapacityRuntimeDir`: the account store the lease is taken from (the machine's own when absent).
    pub runtime_dir: Option<PathBuf>,
}

fn text(request: &Value, key: &str) -> Result<String, String> {
    request
        .get(key)
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty())
        .map(str::to_string)
        .ok_or_else(|| format!("{key} must be a non-empty string"))
}

fn strings(value: Option<&Value>, key: &str) -> Result<Vec<String>, String> {
    let Some(items) = value.and_then(Value::as_array) else {
        return Err(format!("{key} must be an array of strings"));
    };
    items
        .iter()
        .map(|item| {
            item.as_str()
                .map(str::to_string)
                .ok_or_else(|| format!("{key} must be an array of strings"))
        })
        .collect()
}

fn optional<'v>(request: &'v Value, key: &str) -> Option<&'v Value> {
    request.get(key).filter(|v| !v.is_null())
}

impl SessionRequest {
    /// The request as the `launch-session` op receives it; anything outside it is refused by name.
    pub fn from_json(request: &Value) -> Result<Self, String> {
        const KNOWN: [&str; 12] = [
            "binding",
            "runnerConfig",
            "key",
            "role",
            "grant",
            "opening",
            "ceilingMs",
            "env",
            "projectRoot",
            "beside",
            "display",
            "opts",
        ];
        let object = request.as_object().ok_or("the request is not an object")?;
        if let Some(unknown) = object.keys().find(|k| !KNOWN.contains(&k.as_str())) {
            return Err(format!("launch-session takes no \"{unknown}\""));
        }
        let binding = request
            .get("binding")
            .filter(|b| b.get("executor").and_then(Value::as_str).is_some())
            .cloned()
            .ok_or("binding must be an object naming its executor")?;
        let runner_config = request
            .get("runnerConfig")
            .filter(|c| c.is_object())
            .cloned()
            .ok_or("runnerConfig must be an object")?;
        let grant = request
            .get("grant")
            .filter(|g| g.is_object())
            .ok_or("grant must be an object")?;
        let flag = |key: &str| -> Result<bool, String> {
            match grant.get(key) {
                None | Some(Value::Null) => Ok(false),
                Some(Value::Bool(b)) => Ok(*b),
                Some(_) => Err(format!("grant.{key} must be a boolean")),
            }
        };
        let grant = HeadGrant {
            verbs: strings(grant.get("verbs"), "grant.verbs")?,
            writes: strings(grant.get("writes"), "grant.writes")?,
            mailbox: flag("mailbox")?,
            peers: flag("peers")?,
        };
        let opening = request
            .get("opening")
            .and_then(Value::as_str)
            .ok_or("opening must be a string")?
            .to_string();
        let ceiling_ms = request
            .get("ceilingMs")
            .and_then(Value::as_u64)
            .filter(|ms| *ms > 0)
            .ok_or("ceilingMs must be a positive whole number of milliseconds")?;
        let env = match optional(request, "env") {
            None => BTreeMap::new(),
            Some(Value::Object(map)) => map
                .iter()
                .map(|(k, v)| {
                    v.as_str()
                        .map(|v| (k.clone(), v.to_string()))
                        .ok_or_else(|| format!("env.{k} must be a string"))
                })
                .collect::<Result<_, _>>()?,
            Some(_) => return Err("env must be an object of strings".into()),
        };
        let beside = match optional(request, "beside") {
            None => None,
            Some(Value::String(s)) => Some(s.clone()),
            Some(_) => return Err("beside must be a string or null".into()),
        };
        let display = match optional(request, "display") {
            None => None,
            Some(d) if d.is_object() => Some(d.clone()),
            Some(_) => return Err("display must be an object or null".into()),
        };
        let runtime_dir = match optional(request, "opts") {
            None => None,
            Some(Value::Object(opts)) => {
                if let Some(unknown) = opts.keys().find(|k| *k != "providerCapacityRuntimeDir") {
                    return Err(format!("launch-session takes no opts.{unknown}"));
                }
                match opts.get("providerCapacityRuntimeDir") {
                    None | Some(Value::Null) => None,
                    Some(Value::String(dir)) => Some(PathBuf::from(dir)),
                    Some(_) => {
                        return Err("opts.providerCapacityRuntimeDir must be a string".into())
                    }
                }
            }
            Some(_) => return Err("opts must be an object".into()),
        };
        Ok(Self {
            binding,
            runner_config,
            key: text(request, "key")?,
            role: text(request, "role")?,
            grant,
            opening,
            ceiling_ms,
            env,
            project_root: PathBuf::from(text(request, "projectRoot")?),
            beside,
            display,
            runtime_dir,
        })
    }
}

/// A refusal of a host port, by the code it names (`error` when it names none) with its facts.
fn refusal(error: RunnerConfigError) -> SessionLaunchError {
    let mut out = SessionLaunchError::new(error.code.as_deref().unwrap_or("error"), error.message);
    if let Some(phase) = error.phase {
        out = out.with("phase", json!(phase));
    }
    for (key, value) in error.facts.into_iter() {
        out = out.with(&key, value);
    }
    out
}

fn dispatch_refusal(error: DispatchError) -> SessionLaunchError {
    let mut out = SessionLaunchError::new(&error.code, error.message);
    for (key, value) in error.detail {
        out = out.with(&key, value);
    }
    out
}

fn not_opened() -> SessionLaunchError {
    SessionLaunchError::new("error", "the session attempt was not opened")
}

/// The seat ports of a session: the host's own, with the pane prepared over `route` (the herdr route of the
/// project when none is given) and its endpoint kept for the supervisor's environment, as Node hands
/// `terminalPrep.endpointEnv` to `startSupervisor`.
struct SessionSeatPorts<'a> {
    exec: &'a HostExecution,
    route: Option<Arc<dyn PaneRoute>>,
    host: SystemHost,
    endpoint_env: RefCell<Map<String, Value>>,
}

impl SeatPorts for SessionSeatPorts<'_> {
    fn resolve_command(&self, ask: &CommandAsk<'_>) -> Result<Value, RunnerConfigError> {
        self.exec.resolve_command(ask)
    }
    fn prepare_confinement(&self, request: &Value) -> Result<Launch, RunnerConfigError> {
        self.exec.prepare_confinement(request)
    }
    fn prepare_pane(
        &self,
        attempt: &mut Attempt,
        ask: &PaneAsk<'_>,
    ) -> Result<PaneSeat, RunnerConfigError> {
        let route = self
            .route
            .clone()
            .unwrap_or_else(|| Arc::new(HerdrRoute::of_project(ask.seat.root)));
        let pane = prepare_pane_here(attempt, ask, route, &self.host)?;
        *self.endpoint_env.borrow_mut() = pane.endpoint_env.clone();
        Ok(pane)
    }
    fn controller_writer_id(&self) -> Option<String> {
        self.exec.controller_writer_id()
    }
}

/// The host's [`AttemptDriver`]: the attempt it opened and what it took for it.
pub struct HostSessionDriver<'a> {
    exec: &'a HostExecution,
    seat_ports: SessionSeatPorts<'a>,
    request: &'a SessionRequest,
    /// The runner config with its default executor applied (`withDefaultExecutor`).
    cfg: Value,
    pin: Value,
    effective_policy: Value,
    executor_id: String,
    pinned_invocation_id: Option<String>,
    fgos_dir: PathBuf,
    attempt: Option<Attempt>,
    evidence: Option<Value>,
    provider_capacity: Option<Value>,
    envelope: Option<Value>,
}

impl<'a> HostSessionDriver<'a> {
    pub fn new(
        exec: &'a HostExecution,
        request: &'a SessionRequest,
        route: Option<Arc<dyn PaneRoute>>,
    ) -> Self {
        let binding = &request.binding;
        let executor_id = binding
            .get("executor")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string();
        let effective_policy = json!({
            "model": binding.get("model"),
            "tier": binding.get("tier"),
            "reasoningEffort": binding.get("reasoningEffort").filter(|e| !e.is_null()),
            "executorId": executor_id,
        });
        Self {
            exec,
            seat_ports: SessionSeatPorts {
                exec,
                route,
                host: SystemHost::new(),
                endpoint_env: RefCell::new(Map::new()),
            },
            request,
            cfg: with_default_executor(&request.runner_config),
            pin: launch_pin_of(Some(binding), None),
            effective_policy,
            pinned_invocation_id: binding
                .get("invocation")
                .and_then(Value::as_str)
                .map(str::to_string),
            executor_id,
            fgos_dir: super::machine::fgos_dir(&request.project_root),
            attempt: None,
            evidence: None,
            provider_capacity: None,
            envelope: None,
        }
    }
}

impl AttemptDriver for HostSessionDriver<'_> {
    fn open_attempt(
        &mut self,
        run_dir: &Path,
        run_id: &str,
        attempt_id: &str,
        key: &str,
    ) -> Result<(), SessionLaunchError> {
        let host = self.exec.attempt_host().map_err(refusal)?;
        self.attempt = Some(open_attempt(OpenAttempt {
            run_dir: run_dir.to_path_buf(),
            run_id: run_id.into(),
            attempt_id: attempt_id.into(),
            unit_run_id: key.into(),
            terminal: true,
            cwd: self.request.project_root.to_string_lossy().into_owned(),
            host: Some(host),
            step_env: self.exec.step_env(),
            custody: false,
            lease_runtime_dir: self.request.runtime_dir.clone(),
            session: true,
        }));
        Ok(())
    }

    fn acquire_locks(&mut self) -> Result<(), SessionLaunchError> {
        let attempt = self.attempt.as_mut().ok_or_else(not_opened)?;
        let attempt_str = attempt
            .run_dir
            .file_name()
            .map(|name| name.to_string_lossy().into_owned())
            .unwrap_or_default();
        let assignment_dir = self.fgos_dir.join("assignments").join(&self.request.key);
        let locks = acquire_attempt_locks(AttemptLockRequest {
            fgos_dir: &self.fgos_dir,
            assignment_dir: &assignment_dir,
            attempt_str: &attempt_str,
            cwd: &self.request.project_root,
            mutating: false,
            custody: None,
            executor_id: Some(&self.executor_id),
            capability: Some("execute"),
        })
        .map_err(dispatch_refusal)?;
        attempt.locks = Some(locks);
        Ok(())
    }

    fn publish_intent(&mut self) -> Result<(), SessionLaunchError> {
        let attempt = self.attempt.as_mut().ok_or_else(not_opened)?;
        publish_attempt_intent(attempt, None)
            .map_err(|e| SessionLaunchError::new("error", format!("the attempt intent: {e}")))
    }

    fn lease_account(&mut self) -> Result<Lease, SessionLaunchError> {
        let attempt = self.attempt.as_mut().ok_or_else(not_opened)?;
        let runtime_dir = self.request.runtime_dir.as_deref();
        let accounts = self.exec.accounts_at(runtime_dir).map_err(refusal)?;
        let leased = lease_account_for_attempt(
            &accounts,
            self.exec.machine(),
            &LeaseRequest {
                cfg: &self.cfg,
                mechanism: Some("out-of-process"),
                effective_policy: &self.effective_policy,
                executor_id: &self.executor_id,
                pinned_invocation_id: self.pinned_invocation_id.as_deref(),
                pin: &self.pin,
                assignments_dir: &self.fgos_dir.join("assignments"),
                assignment_id: &self.request.key,
                run_id: &attempt.run_id,
                run_dir: &attempt.run_dir,
                repo_root: &self.request.project_root,
                run_is_dead: None,
                is_run_worker_alive: None,
                run_key: &self.request.key,
                now_ms: self.exec.now_ms(),
            },
            None,
        )
        .map_err(|e| SessionLaunchError::new("error", format!("the account lease: {e}")))?;
        if let Some(selection) = leased
            .selection
            .as_ref()
            .filter(|s| s.get("status").and_then(Value::as_str) == Some("refused"))
        {
            let field = |key: &str| selection.get(key).and_then(Value::as_str);
            return Ok(Lease::Refused {
                reason: field("reason").unwrap_or_default().to_string(),
                detail: field("detail")
                    .filter(|d| !d.is_empty())
                    .map(str::to_string),
                selection: selection.clone(),
            });
        }
        attempt.lease = leased.selection;
        self.evidence = leased.evidence;
        Ok(Lease::Selected)
    }

    fn renew_leased_login(&mut self, requirement: &Value) -> Result<(), SessionLaunchError> {
        let attempt = self.attempt.as_ref().ok_or_else(not_opened)?;
        self.provider_capacity = attempt.lease.as_ref().map(|selection| {
            renew_leased_login(
                selection,
                self.exec.renewal(),
                &self.cfg,
                &self.executor_id,
                self.pinned_invocation_id.as_deref(),
                requirement.get("mode").and_then(Value::as_str),
                self.request.runtime_dir.as_deref(),
                None,
            )
        });
        Ok(())
    }

    fn prepare_seat(&mut self, seat: &SessionSeat) -> Result<(), SessionLaunchError> {
        let attempt = self.attempt.as_mut().ok_or_else(not_opened)?;
        let root = &self.request.project_root;
        let settings = self.exec.launch_settings(root).map_err(refusal)?;
        let launch_context = json!({
            "contract": "assignment-launch-context.v1",
            "kind": "session",
            "run": { "runId": seat.run_id, "assignmentId": seat.key, "attempt": 1 },
            "command": { "launchCommandId": seat.attempt_id },
            "session": { "role": seat.role },
        });
        let launch_env: Map<String, Value> = seat
            .launch_env
            .iter()
            .map(|(k, v)| (k.clone(), json!(v)))
            .collect();
        let request_socket = seat
            .request_socket
            .as_ref()
            .map(|p| p.to_string_lossy().into_owned());
        let retain = crate::wiring::doctor::terminal::project_retain_failed_pane_ms(root);
        let input = SeatInput {
            cfg: &self.cfg,
            root,
            fgos_dir: &self.fgos_dir,
            executor_id: &self.executor_id,
            effective_policy: &self.effective_policy,
            pinned_invocation_id: self.pinned_invocation_id.as_deref(),
            requested_model: self.pin.get("model").and_then(Value::as_str),
            prompt: "",
            // A session has no round timeout: its ceiling bounds it.
            timeout_ms: 0,
            settings: &settings,
            capability: "execute",
            assignment_launch_context: &launch_context,
            provider_capacity: self.provider_capacity.as_ref(),
            provider_capacity_evidence: self.evidence.as_ref(),
            confinement_requirement: &seat.confinement_requirement,
            repo_root: root,
            context_refs: None,
            dispatch_batch_key: Some(&seat.dispatch_batch_key),
            dispatch_batch_size: None,
            work_label: None,
            launch_env: Some(&launch_env),
            blind: false,
            mutating: false,
            case_context: None,
            session: Some(&seat.session),
            opening: Some(&seat.opening),
            display: seat.display.as_ref(),
            beside: seat.beside.as_deref(),
            ceiling_ms: Some(seat.ceiling_ms),
            request_socket: request_socket.as_deref(),
            retain_failed_pane_ms: Some(retain),
            depth: self.exec.dispatch_depth() as u64,
        };
        let clock = self.exec.clock();
        let seated = prepare_attempt_seat(
            attempt,
            &input,
            &SeatHooks::default(),
            &self.seat_ports,
            &clock,
        )
        .map_err(refusal)?;
        self.envelope = Some(seated.envelope);
        Ok(())
    }

    fn start_and_bind(&mut self) -> Result<Bound, SessionLaunchError> {
        let attempt = self.attempt.as_mut().ok_or_else(not_opened)?;
        let envelope = self
            .envelope
            .as_ref()
            .ok_or_else(|| SessionLaunchError::new("error", "the seat has no envelope"))?;
        let endpoint = self.seat_ports.endpoint_env.borrow().clone();
        // The supervisor outlives this call: its child handle is dropped, never waited on or ended.
        let (binding, _supervisor) =
            start_and_bind(attempt, envelope, &endpoint, None).map_err(refusal)?;
        Ok(match binding {
            Binding::Bound => Bound {
                state: "bound".into(),
                exit: None,
            },
            Binding::Exited { exit, .. } => Bound {
                state: "exited".into(),
                exit: exit.map(i64::from),
            },
            Binding::Unknown => Bound {
                state: "unknown".into(),
                exit: None,
            },
        })
    }

    fn adopt(&mut self, run_dir: &Path) {
        let run_dir = std::path::absolute(run_dir).unwrap_or_else(|_| run_dir.to_path_buf());
        // Adopt names its own failure in what it leaves on disk.
        let _ = self.exec.adopt().adopt(&run_dir);
    }

    fn handed_over(&self) -> bool {
        self.attempt.as_ref().is_some_and(|a| a.handed_over)
    }

    fn lease_selected(&self) -> bool {
        self.attempt
            .as_ref()
            .and_then(|a| a.lease.as_ref())
            .is_some_and(|l| l.get("status").and_then(Value::as_str) == Some("selected"))
    }

    fn release_lease(&mut self, run_id: &str) {
        if let Some(selection) = self.attempt.as_ref().and_then(|a| a.lease.as_ref()) {
            self.exec.give_back().release_provider_lease(
                selection,
                run_id,
                self.request.runtime_dir.as_deref(),
            );
        }
    }

    fn close(&mut self) {
        if let Some(attempt) = self.attempt.as_mut() {
            close_attempt(attempt, self.exec.give_back());
        }
    }
}

/// `launchSessionAttempt(request)`: start the session attempt of `request.key` on this machine and return once its
/// supervisor bound it. `route` is the pane route (the project's herdr route when `None`).
pub fn launch_session(
    request: &SessionRequest,
    attempt_host: AttemptHost,
    route: Option<Arc<dyn PaneRoute>>,
) -> Result<SessionPlacement, SessionLaunchError> {
    let exec = HostExecution::new(attempt_host, &json!({}))
        .map_err(|e| SessionLaunchError::new("error", e))?;
    let now_ms = exec.now_ms().max(0) as u128;
    let attempt_id = mint_attempt_id(now_ms).map_err(|e| {
        SessionLaunchError::new("error", format!("no random bytes for the attempt id: {e}"))
    })?;
    let fgos_dir = super::machine::fgos_dir(&request.project_root);
    let mut driver = HostSessionDriver::new(&exec, request, route);
    launch_session_attempt(
        &mut driver,
        &SessionLaunch {
            key: &request.key,
            role: &request.role,
            grant: &request.grant,
            opening: &request.opening,
            ceiling_ms: request.ceiling_ms,
            env: request.env.clone(),
            fgos_dir: &fgos_dir,
            beside: request.beside.as_deref(),
            display: request.display.clone(),
            attempt_id: &attempt_id,
        },
    )
}

/// Node's answer of `launchSessionAttempt`: `{ placement: { host, key }, runDir, attemptId }`, or for a refusal
/// `{ refused: { code, message, ...extra } }`, the fields its `SessionLaunchError` carries.
pub fn launched_json(launched: Result<SessionPlacement, SessionLaunchError>) -> Value {
    match launched {
        Ok(placement) => json!({
            "placement": { "host": placement.host, "key": placement.key },
            "runDir": placement.run_dir,
            "attemptId": placement.attempt_id,
        }),
        Err(error) => {
            let mut refused = Map::new();
            for (key, value) in error.extra {
                refused.insert(key, value);
            }
            refused.insert("code".into(), json!(error.code));
            refused.insert("message".into(), json!(error.message));
            json!({ "refused": refused })
        }
    }
}
