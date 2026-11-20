//! A terminal attempt's pane: what only its controller can give before the supervisor exists (the brief on disk,
//! the confinement homes, the folder-trust entry, the pane the Session Host opens for the attempt's key), prepared
//! by the engine's round (`prepare_terminal_attempt`) over the terminal control of the herdr session the seat lives
//! in. The host side of `prepareTerminalAttempt` as `executeAssignment` calls it
//! (`src/runner/dispatch/assignment-runner.mjs:1062`, `src/runner/dispatch/herdr-round.mjs:462`).
//!
//! The pane is opened through the session the seat is confined to: until the round names an isolated worker
//! session, that is the controller's own herdr endpoint, and from then on the worker session's (Node builds its
//! terminal control from the round's `sessionEnv` the same way).

use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

use fgos_execution_engine::accounts::credential::credential_source_for_cli;
use fgos_execution_engine::accounts::Host;
use fgos_execution_engine::assignment_runner::attempt::{
    publish_attempt_intent, Attempt, TerminalPrep,
};
use fgos_execution_engine::assignment_runner::seat::{PaneAsk, PaneSeat};
use fgos_execution_engine::assignment_runner::terminal_args::{
    add_dirs_of, terminal_prompt_delivery,
};
use fgos_execution_engine::assignment_runner::RunnerConfigError;
use fgos_execution_engine::confinement::request::control_delivery_of;
use fgos_execution_engine::transport::adapters::{resolve_executor_env, worker_base_env};
use fgos_execution_engine::transport::terminal_slot::resolve_herdr_bin;
use fgos_execution_engine::transport::worker_home::ProcSweeper;
use fgos_execution_engine::transport::worker_session::{Env, WorkerSessionError};
use fgos_execution_engine::transport::worker_session_boot::{
    ensure_worker_session, BootOptions, Capabilities, SystemEffects, TerminalProbe, WorkerSession,
    DEFAULT_WORKER_SESSION,
};
use fgos_execution_engine::transport_round::round::{
    prepare_terminal_attempt, ControlsDelivered, PreparedAttempt, RoundEffects, RoundPanes,
    SeatBinding, TerminalAttempt,
};
use fgos_run_supervisor::controller::error::DispatchError;
use fgos_session_host::{Panes, SessionHost};
use fgos_terminal_control::core::Want;
use fgos_terminal_control::port::{
    AllocateRequest, Allocation, CapabilitiesAsk, Disposition, Inspection, LaunchOutcome,
    LaunchSpec, PaneState, Refusal, ReleaseOutcome, SendOutcome,
};
use fgos_terminal_control::route::CoreParts;
use serde_json::{json, Map, Value};

/// The terminal control of one herdr session: the Session Host's panes, the round's attach and screen read, and
/// whether a server answers there.
pub trait RoutePanes: Panes + RoundPanes {
    fn server(&self) -> Capabilities;
}

/// The terminal machine a terminal attempt is prepared on: the terminal control of the herdr session an endpoint
/// (`HERDR_*`) addresses, and the worker session a confined seat is moved into.
pub trait PaneRoute: Send + Sync {
    fn panes(&self, endpoint: &Env) -> Result<Box<dyn RoutePanes>, String>;
    /// Bring the shared worker session up (`ensureWorkerSession(DEFAULT_WORKER_SESSION, ...)`) with this route's own
    /// herdr binary (the one the round was handed), probing it through this route.
    fn ensure_session(&self, env: &Env) -> Result<WorkerSession, WorkerSessionError>;
}

/// The herdr endpoint entries of `env`: how the controller reaches a herdr server, never what a seat receives.
fn endpoint_of(env: &Env) -> Env {
    env.iter()
        .filter(|(name, _)| name.starts_with("HERDR_"))
        .map(|(k, v)| (k.clone(), v.clone()))
        .collect()
}

/// The real route: terminal-control's core built from the same envelope its route process reads (the herdr binary,
/// the session's endpoint, the project's `terminal.*` layout settings).
pub struct HerdrRoute {
    pub herdr_bin: String,
    pub config: Value,
}

impl HerdrRoute {
    /// The route of this controller (`resolveHerdrBin()`: `FGOS_HERDR_BIN`, else `herdr` on PATH) with the
    /// `terminal.*` settings of the project at `root` (`terminalRouteConfig(projectRoot)`).
    pub fn of_project(root: &Path) -> Self {
        HerdrRoute {
            herdr_bin: resolve_herdr_bin(None, &|name| std::env::var(name).ok()),
            config: crate::wiring::doctor::terminal::project_route_config(root),
        }
    }
}

struct CorePanes(CoreParts);

impl Panes for CorePanes {
    fn allocate(&self, request: &AllocateRequest) -> Result<Allocation, Refusal> {
        Panes::allocate(&self.0.core(), request)
    }
    fn launch(&self, key: &str, spec: &LaunchSpec) -> Result<LaunchOutcome, Refusal> {
        Panes::launch(&self.0.core(), key, spec)
    }
    fn send(
        &self,
        key: &str,
        text: Option<&str>,
        keys: Option<&[String]>,
        submit: bool,
    ) -> Result<SendOutcome, Refusal> {
        Panes::send(&self.0.core(), key, text, keys, submit)
    }
    fn read(&self, key: &str, source: Option<&str>) -> Result<String, Refusal> {
        Panes::read(&self.0.core(), key, source)
    }
    fn inspect(&self, key: &str, want: Want) -> Inspection {
        Panes::inspect(&self.0.core(), key, want)
    }
    fn focus(&self, key: &str) -> Result<(), Refusal> {
        Panes::focus(&self.0.core(), key)
    }
    fn release(&self, key: &str, disposition: Disposition) -> Result<ReleaseOutcome, Refusal> {
        Panes::release(&self.0.core(), key, disposition)
    }
}

impl RoundPanes for CorePanes {
    fn attach(
        &self,
        key: &str,
        pane: &str,
        group_key: &str,
        display: &Value,
    ) -> Result<(), String> {
        RoundPanes::attach(&self.0.core(), key, pane, group_key, display)
    }
    fn read_visible(&self, key: &str) -> Result<String, String> {
        RoundPanes::read_visible(&self.0.core(), key)
    }
}

impl RoutePanes for CorePanes {
    /// A server answered and named its incarnation: the only proof a server is up.
    fn server(&self) -> Capabilities {
        let report = self.0.core().capabilities(CapabilitiesAsk::default());
        Capabilities {
            server_answers: report.server_incarnation.is_some(),
            socket_path: report.socket_path,
        }
    }
}

/// [`TerminalProbe`] over a route's answer for one session.
struct RouteProbe(Result<Box<dyn RoutePanes>, String>);

impl TerminalProbe for RouteProbe {
    fn capabilities(&self) -> Result<Capabilities, String> {
        self.0
            .as_ref()
            .map(|panes| panes.server())
            .map_err(Clone::clone)
    }
}

impl PaneRoute for HerdrRoute {
    fn panes(&self, endpoint: &Env) -> Result<Box<dyn RoutePanes>, String> {
        let envelope =
            json!({ "herdrBin": self.herdr_bin, "env": endpoint, "config": self.config });
        CoreParts::from_envelope(&envelope, std::time::Instant::now())
            .map(|parts| Box::new(CorePanes(parts)) as Box<dyn RoutePanes>)
            .map_err(|refusal| refusal.message)
    }

    fn ensure_session(&self, env: &Env) -> Result<WorkerSession, WorkerSessionError> {
        let terminal_for = |session_env: &Env| -> Box<dyn TerminalProbe> {
            Box::new(RouteProbe(self.panes(&endpoint_of(session_env))))
        };
        ensure_worker_session(
            DEFAULT_WORKER_SESSION,
            env,
            &terminal_for,
            &SystemEffects,
            &BootOptions::new(self.herdr_bin.as_str()),
        )
    }
}

/// The panes of the session the round's seat lives in, reached anew on every call: the controller's endpoint until
/// the round moves the seat into a worker session, that session's from then on.
struct SessionPanes {
    route: Arc<dyn PaneRoute>,
    endpoint: Mutex<Env>,
}

impl SessionPanes {
    fn with<T>(
        &self,
        call: impl FnOnce(&dyn RoutePanes) -> T,
        unreachable: impl FnOnce(String) -> T,
    ) -> T {
        let endpoint = self.endpoint.lock().map(|e| e.clone()).unwrap_or_default();
        match self.route.panes(&endpoint) {
            Ok(panes) => call(panes.as_ref()),
            Err(reason) => unreachable(reason),
        }
    }
}

fn unknown<T>(reason: String) -> Result<T, Refusal> {
    Err(Refusal::Unknown { reason })
}

impl Panes for SessionPanes {
    fn allocate(&self, request: &AllocateRequest) -> Result<Allocation, Refusal> {
        self.with(|p| p.allocate(request), unknown)
    }
    fn launch(&self, key: &str, spec: &LaunchSpec) -> Result<LaunchOutcome, Refusal> {
        self.with(|p| p.launch(key, spec), unknown)
    }
    fn send(
        &self,
        key: &str,
        text: Option<&str>,
        keys: Option<&[String]>,
        submit: bool,
    ) -> Result<SendOutcome, Refusal> {
        self.with(|p| p.send(key, text, keys, submit), unknown)
    }
    fn read(&self, key: &str, source: Option<&str>) -> Result<String, Refusal> {
        self.with(|p| p.read(key, source), unknown)
    }
    fn inspect(&self, key: &str, want: Want) -> Inspection {
        self.with(
            |p| p.inspect(key, want),
            |_| Inspection {
                pane: PaneState::Unknown,
                foreground: None,
                activity: None,
            },
        )
    }
    fn focus(&self, key: &str) -> Result<(), Refusal> {
        self.with(|p| p.focus(key), unknown)
    }
    fn release(&self, key: &str, disposition: Disposition) -> Result<ReleaseOutcome, Refusal> {
        self.with(|p| p.release(key, disposition), unknown)
    }
}

impl RoundPanes for SessionPanes {
    fn attach(
        &self,
        key: &str,
        pane: &str,
        group_key: &str,
        display: &Value,
    ) -> Result<(), String> {
        self.with(|p| p.attach(key, pane, group_key, display), Err)
    }
    fn read_visible(&self, key: &str) -> Result<String, String> {
        self.with(|p| p.read_visible(key), Err)
    }
}

/// What a prepared pane owes until the handover: the pane, the private home and the trust entry, given back
/// through the session the pane was opened in.
struct PanePrep {
    panes: SessionPanes,
    prepared: PreparedAttempt,
}

impl TerminalPrep for PanePrep {
    fn abandon(&self) {
        self.prepared.abandon(&SessionHost { panes: &self.panes });
    }
}

/// What the machine around a terminal attempt's controller says: its environment, the state root a seat is pinned
/// to, where homes are made, and the clock.
pub struct PaneMachine<'a> {
    pub env: &'a Env,
    pub state_root: &'a Path,
    pub tmp_dir: PathBuf,
    pub host: &'a dyn Host,
}

fn text<'v>(value: &'v Value, pointer: &str) -> Option<&'v str> {
    value.pointer(pointer).and_then(Value::as_str)
}

fn env_of(value: Option<&Value>) -> Env {
    value
        .and_then(Value::as_object)
        .into_iter()
        .flatten()
        .filter_map(|(k, v)| v.as_str().map(|v| (k.clone(), v.to_string())))
        .collect()
}

fn dispatch_refusal(error: DispatchError) -> RunnerConfigError {
    let mut out = RunnerConfigError::coded(error.message, &error.code);
    for (key, value) in error.detail {
        out = out.with(&key, value);
    }
    out
}

/// [`prepare_pane`] over this machine: its environment, its state root and its temporary directory.
pub fn prepare_pane_here(
    attempt: &mut Attempt,
    ask: &PaneAsk<'_>,
    route: Arc<dyn PaneRoute>,
    host: &dyn Host,
) -> Result<PaneSeat, RunnerConfigError> {
    let env: Env = std::env::vars().collect();
    let state_root = fgos_holder_lock::state_root::state_root().0;
    prepare_pane(
        attempt,
        ask,
        route,
        &PaneMachine {
            env: &env,
            state_root: &state_root,
            tmp_dir: std::env::temp_dir(),
            host,
        },
    )
}

/// Prepare the pane of a terminal attempt (`prepareTerminalAttempt` with the context `executeAssignment` gives it):
/// the pane becomes the attempt's `terminal_prep` until the handover, and the intent names it before it is
/// allocated, so a controller killed from there on leaves a record naming the pane to give back.
pub fn prepare_pane(
    attempt: &mut Attempt,
    ask: &PaneAsk<'_>,
    route: Arc<dyn PaneRoute>,
    machine: &PaneMachine<'_>,
) -> Result<PaneSeat, RunnerConfigError> {
    let seat = ask.seat;
    let resolved = ask.resolved_cmd;
    let launched = &ask.prepared.attempt;
    let lookup = |name: &str| machine.env.get(name).cloned();
    let herdr_bin = resolve_herdr_bin(None, &lookup);
    // The controller's own view: the worker's allowed names plus the herdr endpoint it dials (never given to the seat).
    let root = machine.state_root.to_string_lossy();
    let mut full_env: Env = worker_base_env(
        machine.env.iter().map(|(k, v)| (k.as_str(), v.as_str())),
        Some(&root),
    )
    .into_iter()
    .collect();
    full_env.extend(endpoint_of(machine.env));
    full_env.extend(env_of(Some(&Value::Object(resolve_executor_env(
        resolved.get("env").unwrap_or(&Value::Null),
        &lookup,
    )))));
    let attempt_env = env_of(launched.get("secretEnv"));
    let kind = text(resolved, "/interactiveMode/kind");
    // claude asks for trust on the run directory it is granted too, not only on its working directory.
    let trust_also = if kind == Some("claude") {
        add_dirs_of(ask.agent_args)
    } else {
        Vec::new()
    };
    let capacity = seat
        .provider_capacity
        .filter(|c| text(c, "/status") == Some("selected"));
    let trust_account_source = capacity.and_then(|capacity| {
        let cli = text(resolved, "/credentialStore/use")?;
        resolved.get("credentialStore").filter(|s| !s.is_null())?;
        credential_source_for_cli(capacity, Some(cli)).cloned()
    });
    let binding = SeatBinding {
        command: None,
        args: Vec::new(),
        env: Env::new(),
        confinement: resolved
            .get("confinement")
            .filter(|c| !c.is_null())
            .cloned(),
        permission_mode: text(resolved, "/permissionMode").map(str::to_string),
        trust_store: resolved
            .pointer("/interactiveMode/trustStore")
            .filter(|s| !s.is_null())
            .cloned(),
        trust_also,
        trust_account_source,
    };
    let agent_kind = kind.map(str::to_string).or_else(|| {
        text(launched, "/command").map(|command| {
            Path::new(command)
                .file_name()
                .map(|name| name.to_string_lossy().into_owned())
                .unwrap_or_default()
        })
    });
    let delivery = terminal_prompt_delivery(resolved);
    // The answer the Authority judged the request by, never one rebuilt from the prepared record.
    let controls = control_delivery_of(ask.confinement_request);
    let anchor = machine
        .env
        .get("FGOS_HERDR_ANCHOR_PANE")
        .map(|pane| pane.trim().to_string())
        .filter(|pane| !pane.is_empty());
    let role = ask
        .effective_contract
        .and_then(|contract| text(contract, "/assignment/role"))
        .map(str::to_string);

    let (attempt_id, run_dir, cwd, run_id) = (
        attempt.attempt_id.clone(),
        attempt.run_dir.clone(),
        PathBuf::from(&attempt.cwd),
        attempt.run_id.clone(),
    );
    let terminal = TerminalAttempt {
        attempt_id: &attempt_id,
        run_dir: &run_dir,
        cwd: &cwd,
        repo_root: Some(seat.root),
        // A session types its opening; a worker gets the brief rendered around its prompt.
        prompt: seat.opening.unwrap_or(seat.prompt),
        work_id: Some(seat.executor_id),
        tier: text(seat.effective_policy, "/tier"),
        model: text(seat.effective_policy, "/model"),
        run_id: Some(&run_id),
        herdr_bin: &herdr_bin,
        full_env: &full_env,
        binding: &binding,
        agent_kind: agent_kind.as_deref(),
        delivery: &delivery,
        attempt_env: Some(&attempt_env),
        dispatch_batch_key: seat.dispatch_batch_key,
        dispatch_batch_size: seat.dispatch_batch_size,
        anchor_pane_id: anchor.as_deref(),
        work_label: seat.work_label,
        display: seat.display.cloned(),
        effective_contract: ask.effective_contract,
        // A session's opening is typed as it is, with no result claim or outbox words around it.
        opening: if seat.opening.is_some() {
            "verbatim"
        } else {
            "brief"
        },
        beside: seat.beside,
        controls_delivered: ControlsDelivered {
            root_workspace_allowed: controls.root_workspace_allowed,
            backend_delivers: controls.backend_delivers,
        },
        role: role.as_deref(),
    };

    let panes = SessionPanes {
        route: route.clone(),
        endpoint: Mutex::new(endpoint_of(&full_env)),
    };
    let ensure_session = |env: &Env, _herdr_bin: &str| {
        let session = route.ensure_session(env)?;
        if let Ok(mut endpoint) = panes.endpoint.lock() {
            *endpoint = endpoint_of(&session.env);
        }
        Ok(session)
    };
    let now_iso = fgos_identity::text::iso_utc_now;
    let now_ms = || machine.host.now_ms();
    let offset = |at_ms: i64| (machine.host.utc_offset_min(at_ms) * 60) as i32;
    let sweeper = ProcSweeper::default();
    let diagnostic = |line: &str| eprintln!("{line}");
    let effects = RoundEffects {
        now_iso: &now_iso,
        now_ms: &now_ms,
        local_offset_seconds: &offset,
        ensure_session: &ensure_session,
        sweeper: &sweeper,
        tmp_dir: machine.tmp_dir.clone(),
        home_dir: fgos_config::machine::home_dir(|name| machine.env.get(name).cloned())
            .unwrap_or_default(),
        diagnostic: &diagnostic,
    };
    // The intent names the pane's key and endpoint before the pane exists. A failed publish is the attempt's to
    // refuse once the pane it would have named is given back.
    let mut intent_failure: Option<std::io::Error> = None;
    let mut before_allocate = |key: &str, group_key: &str, endpoint: &Env| {
        if attempt.intent_written {
            let pane =
                json!({ "slot": { "key": key, "groupKey": group_key }, "endpointEnv": endpoint });
            if let Err(error) = publish_attempt_intent(attempt, Some(&pane)) {
                intent_failure = Some(error);
            }
        }
    };
    let host = SessionHost { panes: &panes };
    let prepared =
        prepare_terminal_attempt(&terminal, &host, &panes, &mut before_allocate, &effects)
            .map_err(dispatch_refusal)?;
    if let Some(error) = intent_failure {
        prepared.abandon(&host);
        return Err(RunnerConfigError::new(format!(
            "executeAssignment: the attempt intent could not name its pane: {error}"
        )));
    }
    let endpoint_env: Map<String, Value> = prepared
        .endpoint_env
        .iter()
        .map(|(k, v)| (k.clone(), json!(v)))
        .collect();
    let seat = PaneSeat {
        brief_path: prepared.brief_path.clone(),
        outbox_dir: prepared.outbox_dir.clone(),
        group_key: prepared.group_key.clone(),
        endpoint_env,
    };
    attempt.terminal_prep = Some(Box::new(PanePrep { panes, prepared }));
    Ok(seat)
}
