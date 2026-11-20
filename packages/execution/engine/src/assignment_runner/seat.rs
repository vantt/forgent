//! The seat of one attempt, the part a worker attempt and a head session share: the resolved command, the
//! confinement the Authority prepared for it, a terminal attempt's pane, the immutable envelope with its secret
//! side file.
//!
//! What the machine decides sits behind [`SeatPorts`] (the executor command, the confinement the Authority
//! prepares, the pane a terminal attempt runs in); the request, the envelope and the order are this module's.

use std::path::Path;

use fgos_run_supervisor::controller::launch::{
    attempt_gate_command, attempt_paths, build_envelope, prepare_attempt_files,
    terminal_socket_path, with_identity_env, write_attempt_files, AttemptLaunch, EnvelopeInput,
    LaunchSettings, TerminalInput,
};
use serde_json::{json, Map, Value};

use super::attempt::Attempt;
use super::terminal_args::{terminal_agent_args, with_run_dir_access, RunDirAccess, TerminalArgs};
use super::RunnerConfigError;
use crate::accounts::credential::command_cli;
use crate::confinement::request::{build_confinement_request, BuildClock, Launch};

/// The CLIs whose screens the terminal adapters of the agent protocol know.
pub const TERMINAL_CLIS: [&str; 5] = ["claude", "codex", "agy", "pi", "omp"];

/// What a pane worker is prepared with: the paths the envelope names and the endpoint the supervisor reaches the
/// pane through.
#[derive(Debug, Clone, PartialEq)]
pub struct PaneSeat {
    pub brief_path: String,
    pub outbox_dir: String,
    pub group_key: String,
    pub endpoint_env: Map<String, Value>,
}

/// What this module asks of the machine.
pub trait SeatPorts {
    /// The command of the executor the launch resolved (`resolveExecutorCommand` over the config): `command`,
    /// `args`, `argsTemplate`, `env`, `adapter`, the interactive mode, the credential store, the rendered effort
    /// and the model check.
    fn resolve_command(&self, request: &CommandAsk<'_>) -> Result<Value, RunnerConfigError>;
    /// Prepare confinement for the launch (the Authority); persists the prepared record and the finalization
    /// descriptor.
    fn prepare_confinement(&self, request: &Value) -> Result<Launch, RunnerConfigError>;
    /// A terminal attempt's brief, pane and folder trust: what only its controller can give before the
    /// supervisor exists. The pane it opened is the attempt's `terminal_prep` until the handover.
    fn prepare_pane(
        &self,
        attempt: &mut Attempt,
        ask: &PaneAsk<'_>,
    ) -> Result<PaneSeat, RunnerConfigError>;
    /// The writer id of this controller, so a writer can be traced from the agent back to it.
    fn controller_writer_id(&self) -> Option<String>;
}

/// What the command is resolved for.
pub struct CommandAsk<'a> {
    pub cfg: &'a Value,
    pub prompt: &'a str,
    pub model: &'a str,
    pub requested_model: Option<&'a str>,
    pub reasoning_effort: Option<&'a str>,
    pub tier: Option<&'a str>,
    pub executor_id: &'a str,
    pub attest_root: &'a Path,
    /// An explicit caller pin names the invocation; otherwise the executor's own choice stands.
    pub invocation_id: Option<&'a str>,
}

/// What a pane is prepared for.
pub struct PaneAsk<'a> {
    pub resolved_cmd: &'a Value,
    pub prepared: &'a Launch,
    pub confinement_request: &'a Value,
    pub seat: &'a SeatInput<'a>,
    pub agent_args: &'a [String],
    /// The effective execution contract the caller's `after_confinement` returned: the brief names its result
    /// claim.
    pub effective_contract: Option<&'a Value>,
}

/// What the caller decided for this seat (see a worker attempt and a head session).
pub struct SeatInput<'a> {
    pub cfg: &'a Value,
    pub root: &'a Path,
    pub fgos_dir: &'a Path,
    pub executor_id: &'a str,
    pub effective_policy: &'a Value,
    pub pinned_invocation_id: Option<&'a str>,
    pub requested_model: Option<&'a str>,
    pub prompt: &'a str,
    pub timeout_ms: u64,
    pub settings: &'a LaunchSettings,
    pub capability: &'a str,
    pub assignment_launch_context: &'a Value,
    pub provider_capacity: Option<&'a Value>,
    pub provider_capacity_evidence: Option<&'a Value>,
    pub confinement_requirement: &'a Value,
    /// The directory the confinement grants: the Unit worktree under workspace-write, else the main checkout.
    pub repo_root: &'a Path,
    pub context_refs: Option<&'a Value>,
    pub dispatch_batch_key: Option<&'a str>,
    /// How many seats launch together as one group: their panes share the tab in equal parts.
    pub dispatch_batch_size: Option<u32>,
    /// The work a terminal attempt's pane is labelled with (`work_label_of` the assignment).
    pub work_label: Option<&'a Value>,
    pub launch_env: Option<&'a Map<String, Value>>,
    pub blind: bool,
    pub mutating: bool,
    pub case_context: Option<(&'a str, &'a str)>,
    /// A head session: the role, verbs and writes it holds; typed verbatim as its opening.
    pub session: Option<&'a Value>,
    /// What a session's pane is typed verbatim instead of the brief rendered around `prompt`.
    pub opening: Option<&'a str>,
    /// How a session's pane is named (`{ id, title }`).
    pub display: Option<&'a Value>,
    /// The live key of the session whose tab a session's pane opens next to.
    pub beside: Option<&'a str>,
    pub ceiling_ms: Option<u64>,
    pub request_socket: Option<&'a str>,
    pub retain_failed_pane_ms: Option<Value>,
    pub depth: u64,
}

/// What preparing the seat produced.
#[derive(Debug)]
pub struct Seated {
    pub envelope: Value,
    pub resolved_cmd: Value,
    pub launch: Launch,
    pub provider_capacity_evidence: Option<Value>,
}

/// Runs after Authority resolution with the prepared launch and the provider-capacity evidence.
pub type AfterConfinement<'a> = &'a dyn Fn(&Launch, Option<&Value>) -> Option<Value>;

/// Runs right before the envelope is written with the resolved command, the launch and the evidence.
pub type BeforeEnvelope<'a> = &'a dyn Fn(&Value, &Launch, Option<&Value>);

/// Hooks of the caller's own steps. `after_confinement` returns the effective contract the brief is rendered with
/// (or nothing); `before_envelope` runs right before the envelope is written.
#[derive(Default)]
pub struct SeatHooks<'a> {
    pub after_confinement: Option<AfterConfinement<'a>>,
    pub before_envelope: Option<BeforeEnvelope<'a>>,
}

fn error(message: impl Into<String>) -> RunnerConfigError {
    RunnerConfigError::new(message)
}

fn strings(value: Option<&Value>) -> Vec<String> {
    value
        .and_then(Value::as_array)
        .map(|items| {
            items
                .iter()
                .filter_map(|v| v.as_str().map(str::to_string))
                .collect()
        })
        .unwrap_or_default()
}

fn env_map(value: Option<&Value>) -> Map<String, Value> {
    value
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default()
}

fn absolute(path: &Path) -> std::path::PathBuf {
    std::path::absolute(path).unwrap_or_else(|_| path.to_path_buf())
}

/// Prepare the seat of one attempt and write its envelope and side file.
pub fn prepare_attempt_seat(
    attempt: &mut Attempt,
    seat: &SeatInput<'_>,
    hooks: &SeatHooks<'_>,
    ports: &dyn SeatPorts,
    clock: &BuildClock<'_>,
) -> Result<Seated, RunnerConfigError> {
    let attempt_run_dir = absolute(&attempt.run_dir);
    let control = attempt.control.clone();
    let session = seat.session.filter(|s| !s.is_null());
    let model = seat
        .effective_policy
        .get("model")
        .and_then(Value::as_str)
        .unwrap_or_default();

    let mut resolved = ports.resolve_command(&CommandAsk {
        cfg: seat.cfg,
        prompt: seat.prompt,
        model,
        requested_model: seat.requested_model,
        reasoning_effort: seat
            .effective_policy
            .get("reasoningEffort")
            .and_then(Value::as_str),
        tier: seat.effective_policy.get("tier").and_then(Value::as_str),
        executor_id: seat.executor_id,
        attest_root: Path::new(&attempt.cwd),
        invocation_id: seat.pinned_invocation_id,
    })?;
    // Admitted into a case: the worker's own environment names it, from this admission and no other.
    if let Some((case_id, reservation_id)) = seat.case_context {
        let mut env = env_map(resolved.get("env"));
        for (name, value) in crate::transport::adapters::case_context_env(case_id, reservation_id) {
            env.insert(name.to_string(), json!(value));
        }
        resolved["env"] = Value::Object(env);
    }

    // The attempt's writer id is a pure function of its id, so a resume of the attempt sees the same one.
    let attempt_writer_id =
        fgos_identity::mint_attempt_writer_id(&attempt.attempt_id).map_err(|e| {
            error(format!(
                "executeAssignment: the attempt id has no writer id ({e:?})"
            ))
        })?;
    let identity =
        json!({ "writerId": attempt_writer_id, "parentWriterId": ports.controller_writer_id() });
    let terminal_socket = if attempt.terminal {
        Some(terminal_socket_path(&attempt.attempt_id).map_err(|e| error(e.to_string()))?)
    } else {
        None
    };
    let command = resolved
        .get("command")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string();
    let attempt_args = if attempt.terminal {
        terminal_agent_args(&TerminalArgs {
            resolved_cmd: &resolved,
            prompt: seat.prompt,
            model,
            run_dir: &attempt_run_dir,
            writer_id: &attempt_writer_id,
            case_context: seat.case_context.map(|(case_id, reservation_id)| {
                super::terminal_args::CaseContext {
                    case_id,
                    reservation_id,
                }
            }),
        })
    } else {
        with_run_dir_access(
            &strings(resolved.get("args")),
            &RunDirAccess::CliSpawn {
                command: &command,
                outbox_dir: Some(&attempt_paths(&attempt_run_dir, &attempt.attempt_id).outbox_dir),
            },
        )
    };

    let host = attempt
        .host
        .as_ref()
        .ok_or_else(|| error("executeAssignment: an attempt with no host cannot be launched"))?
        .clone();
    let mut invocation_env = env_map(resolved.get("env"));
    if let Some(extra) = seat.launch_env {
        invocation_env.extend(extra.clone());
    }
    let pick = |key: &str| resolved.get(key).cloned().unwrap_or(Value::Null);
    let mut context = json!({
        "cwd": attempt.cwd,
        "repoRoot": seat.repo_root,
        "runDir": attempt_run_dir,
        "fgosDir": seat.fgos_dir,
        "timeoutMs": seat.timeout_ms,
        "idleTimeoutMs": seat.cfg.get("idleTimeoutMs"),
        "maxBuffer": seat.cfg.get("maxBuffer"),
        "workId": seat.executor_id,
        "tier": seat.effective_policy.get("tier"),
        "model": seat.effective_policy.get("model"),
        "dispatchBatchKey": seat.dispatch_batch_key,
        "controlToken": control.as_ref().map(|c| c.token.clone()),
        "controlEpoch": control.as_ref().map(|c| c.epoch),
        "launchCommandId": attempt.attempt_id,
    });
    if let Some(refs) = seat.context_refs {
        context["contextRefs"] = refs.clone();
    }
    let mut request = json!({
        "capability": seat.capability,
        "stageSkill": seat.executor_id,
        "executorId": seat.executor_id,
        "cfg": seat.cfg,
        "assignmentLaunchContext": seat.assignment_launch_context,
        "invocation": {
            "command": command,
            "args": attempt_args,
            "argsTemplate": pick("argsTemplate"),
            "prompt": seat.prompt,
            "env": Value::Object(invocation_env),
            "liveOutput": pick("liveOutput"),
            "interactiveMode": pick("interactiveMode"),
            "promptDelivery": pick("promptDelivery"),
            "permissionMode": pick("permissionMode"),
            "confinement": pick("confinement"),
            "adapter": resolved.get("adapter").filter(|a| !a.is_null()).cloned().unwrap_or_else(|| json!("cli-spawn")),
            "method": pick("method"),
            "url": pick("url"),
            "headers": pick("headers"),
            "body": pick("body"),
            "credentialStore": pick("credentialStore"),
        },
        "providerCapacity": seat.provider_capacity,
        "context": context,
        "requirement": seat.confinement_requirement,
        "attemptId": attempt.attempt_id,
        "launchMode": if attempt.terminal { "terminal" } else { "direct" },
        "gateCommand": attempt_gate_command(&host.host_bin, &attempt_run_dir, terminal_socket.as_ref().map(|p| p.to_string_lossy().into_owned()).as_deref()),
        "attemptBinds": prepare_attempt_files(&attempt_run_dir, &attempt.attempt_id).map_err(|e| error(e.to_string()))?,
    });
    if seat.blind {
        request["blind"] = json!(true);
    }
    if let Some(socket) = seat.request_socket {
        request["requestSocket"] = json!(socket);
    }
    let request = build_confinement_request(&request, clock).map_err(|e| error(e.to_string()))?;
    let prepared = ports.prepare_confinement(&request)?;

    let mut evidence = seat.provider_capacity_evidence.cloned();
    if let (Some(current), true) = (
        evidence.as_ref(),
        prepared
            .provider_capacity
            .as_ref()
            .and_then(|c| c.get("credentialProvisioned"))
            == Some(&json!(true)),
    ) {
        let mut next = current.clone();
        next["credentialProvisioned"] = json!(true);
        // The settle context below still carries the provisioned evidence when this write is lost.
        let _ = super::lease::write_pretty(
            &attempt.run_dir.join("provider-capacity-selection.json"),
            &next,
        );
        evidence = Some(next);
    }

    // Persisted after Authority resolution, before the supervisor is spawned.
    let effective_contract = hooks
        .after_confinement
        .and_then(|hook| hook(&prepared, evidence.as_ref()));

    // A terminal attempt gets what only its controller can give before the supervisor exists.
    let pane = if attempt.terminal {
        let ask_args = attempt_args.clone();
        Some(ports.prepare_pane(
            attempt,
            &PaneAsk {
                resolved_cmd: &resolved,
                prepared: &prepared,
                confinement_request: &request,
                seat,
                agent_args: &ask_args,
                effective_contract: effective_contract.as_ref(),
            },
        )?)
    } else {
        None
    };

    // The envelope, the secret side file and the context the settle step needs. The envelope is immutable from
    // here on; nothing the controller still learns changes what the attempt runs.
    let launched = &prepared.attempt;
    let mut launch_env = env_map(launched.get("env"));
    if attempt.terminal {
        launch_env.retain(|name, _| {
            !crate::transport_round::round::PANE_TERMINAL_ENV.contains(&name.as_str())
                && !name.starts_with("HERDR_")
        });
    }
    let attempt_launch = AttemptLaunch {
        command: launched
            .get("command")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string(),
        args: strings(launched.get("args")),
        env: launch_env,
        bwrap_prefix: launched
            .get("bwrapPrefix")
            .filter(|p| !p.is_null())
            .map(|p| strings(Some(p))),
        bwrap_executable: launched
            .get("bwrapExecutable")
            .and_then(Value::as_str)
            .map(str::to_string),
    };
    let cli_kind = resolved
        .pointer("/interactiveMode/kind")
        .and_then(Value::as_str);
    let cli = if attempt.terminal && cli_kind.is_some_and(|k| TERMINAL_CLIS.contains(&k)) {
        json!(cli_kind)
    } else {
        json!(command_cli(&attempt_launch.command))
    };
    let terminal = pane.as_ref().map(|pane| TerminalInput {
        brief_path: pane.brief_path.clone(),
        outbox_dir: Some(pane.outbox_dir.clone()),
        group_key: pane.group_key.clone(),
        socket_path: terminal_socket
            .as_ref()
            .map(|p| p.to_string_lossy().into_owned())
            .unwrap_or_default(),
        exit_command: resolved
            .pointer("/interactiveMode/exitCommand")
            .cloned()
            .filter(|v| !v.is_null()),
        orphan_settle_ms: crate::transport_round::round::ORPHAN_SETTLE_MS,
        retain_failed_pane_ms: seat.retain_failed_pane_ms.clone(),
    });
    let idle_timeout_ms = if attempt.terminal {
        crate::transport_round::round::PANE_IDLE_TIMEOUT_MS
    } else {
        seat.cfg
            .get("idleTimeoutMs")
            .and_then(Value::as_u64)
            .unwrap_or(0)
    };
    let lanes = fgos_run_supervisor::controller::launch::lane_transport(
        Some(&seat.settings.lanes),
        seat.depth,
    );
    let cwd_lease_file = attempt
        .locks
        .as_ref()
        .and_then(|locks| locks.cwd_lease_file())
        .map(|lease| lease.to_string_lossy().into_owned())
        .filter(|_| seat.mutating);
    let extra_steps: Vec<String> = if attempt.terminal {
        vec!["cleanup-trust".into()]
    } else {
        Vec::new()
    };
    let envelope_body = build_envelope(&EnvelopeInput {
        attempt_id: &attempt.attempt_id,
        unit_run_id: &attempt.unit_run_id,
        run_dir: &attempt_run_dir,
        host: &host,
        cwd: launched
            .get("cwd")
            .and_then(Value::as_str)
            .unwrap_or(&attempt.cwd),
        mutating: seat.mutating,
        attempt: &attempt_launch,
        timeout_ms: seat.timeout_ms,
        idle_timeout_ms,
        max_output_bytes: Some(
            seat.cfg
                .get("maxBuffer")
                .and_then(Value::as_u64)
                .filter(|b| *b > 0)
                .unwrap_or(10_485_760),
        ),
        cli: &cli,
        step_env: &attempt.step_env,
        gate_kill_grace_ms: seat.settings.gate_kill_grace_ms,
        kill_wait_ms: seat.settings.kill_wait_ms,
        cwd_lease_file: cwd_lease_file.as_deref(),
        cwd_lease_owner: None,
        identity: Some(&identity),
        terminal: terminal.as_ref(),
        extra_steps: &extra_steps,
        session,
        ceiling_ms: seat.ceiling_ms,
        lanes: lanes.as_ref(),
    })
    .map_err(|e| error(format!("{}: {}", e.code, e.message)))?;
    if let Some(hook) = hooks.before_envelope {
        hook(&resolved, &prepared, evidence.as_ref());
    }
    // The side file is merged over the envelope's own environment, so the dispatcher's id the Authority put in it
    // must not win over the attempt's.
    let mut secret_env = env_map(launched.get("secretEnv"));
    if attempt.terminal {
        secret_env.retain(|name, _| {
            !crate::transport_round::round::PANE_TERMINAL_ENV.contains(&name.as_str())
                && !name.starts_with("HERDR_")
        });
    }
    let secret_env = with_identity_env(&secret_env, Some(&identity));
    let (epoch, token) = control
        .map(|c| (c.epoch, c.token))
        .unwrap_or((0, String::new()));
    let envelope = write_attempt_files(
        &attempt_run_dir,
        &envelope_body,
        &Value::Object(secret_env),
        epoch,
        &token,
    )
    .map_err(|e| error(format!("{}: {}", e.code, e.message)))?;
    Ok(Seated {
        envelope,
        resolved_cmd: resolved,
        launch: prepared,
        provider_capacity_evidence: evidence,
    })
}
