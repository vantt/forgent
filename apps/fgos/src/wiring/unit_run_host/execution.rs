//! The machine the assignment runner executes one seat on: the host side of `ExecutePorts` and `SeatPorts`
//! (`executeAssignment`, `src/runner/dispatch/assignment-runner.mjs:1289`), the falsification probe of a bwrap
//! backend and the prompt seams. Each port is the door that owns the fact: the checkout and config doors, the
//! seat-binding machine, the Git door, the run supervisor's adopt door, launch settings and step environment, the
//! accounts module, the dispatch plan, the operation prompt templates, the executor command and the Confinement
//! Authority.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use fgos_execution::decide::CheckoutFacts;
use fgos_execution::ports::Machine;
use fgos_execution_engine::accounts::credential_probe::{probe_credential, DEFAULT_TIMEOUT_MS};
use fgos_execution_engine::accounts::{AccountLock, ProbeRequest};
use fgos_execution_engine::accounts::{Accounts, SystemHost};
use fgos_execution_engine::assignment::builder::{
    render_assignment_prompt, PromptOptions, PromptPort,
};
use fgos_execution_engine::assignment::Refusal;
use fgos_execution_engine::assignment_runner::attempt::{Attempt, GiveBack, MachineGiveBack};
use fgos_execution_engine::assignment_runner::execute::{ExecuteOptions, ExecutePorts};
use fgos_execution_engine::assignment_runner::inputs::{CheckoutRoots, GitCheckoutRoots};
use fgos_execution_engine::assignment_runner::lease::{
    CredentialProbe, CredentialRenewal, RenewAsk,
};
use fgos_execution_engine::assignment_runner::outcome::{AdoptDoor, SupervisorAdoptDoor};
use fgos_execution_engine::assignment_runner::seat::{CommandAsk, PaneAsk, PaneSeat, SeatPorts};
use fgos_execution_engine::assignment_runner::RunnerConfigError;
use fgos_execution_engine::confinement::cleanup::probes::{
    compute_probe_fingerprint, driver_over, run_all_confinement_probes, FingerprintInput,
    PolicyResolver, ProbePorts,
};
use fgos_execution_engine::confinement::cleanup::AttemptHomeRecords;
use fgos_execution_engine::confinement::driver::attestation::{
    ProbeCache, DEFAULT_PROBE_CACHE_TTL_MS,
};
use fgos_execution_engine::confinement::driver::registry::DriverRegistry;
use fgos_execution_engine::confinement::driver::registry::{load_machine_registry, registry_path};
use fgos_execution_engine::confinement::policy::resolve_posture;
use fgos_execution_engine::confinement::request::{
    prepare_confinement_for_launch, system_clock_parts, BuildClock, Launch, LaunchHost,
    ProbeVerdict, Probes, StageRenewedLogin,
};
use fgos_execution_engine::contract::templates::{
    resolve_and_render_operation_prompt, ResolveOptions as TemplateAsk, Roots,
};
use fgos_execution_engine::credentials::{
    refresh_ahead, AccountsProbe, BundledSqlite, RefreshOptions, RefreshRequest,
};
use fgos_execution_engine::settlement::{GitDoor, SettlementGit};
use fgos_execution_engine::transport_round::executor_command::{
    resolve_executor_command, CommandRequest,
};
use fgos_run_supervisor::controller::launch::{
    attempt_step_env, read_launch_settings, AttemptHost, LaunchSettings,
};
use serde_json::{json, Map, Value};

use super::dispatch_plan::{compile_assignment_plan, PlanAsk};
use super::settlement::TargetAccountLocks;
use super::terminal::HerdrRoute;
use crate::wiring::dispatch_decide::HostWorkspace;
use crate::wiring::seat_binding::HostMachine;

fn now_millis() -> u64 {
    system_clock_parts().0
}

fn random_suffix() -> String {
    system_clock_parts().1
}

fn env_var(name: &str) -> Option<String> {
    std::env::var(name).ok()
}

/// The machine around one seat's execution.
pub struct HostExecution {
    workspace: HostWorkspace,
    machine: HostMachine,
    git: GitDoor,
    adopt: SupervisorAdoptDoor,
    host: SystemHost,
    attempt_host: AttemptHost,
    /// The root of the payload the templates and personas of core and the domains are read from.
    payload_root: PathBuf,
}

impl HostExecution {
    /// `attempt_host` is the host binary the supervisor runs as and the payload beside it (`resolveAttemptHost`,
    /// `src/run-supervisor/direct-launch.mjs:44`); the session's `pathEnv` and `herdrPresent` name the machine.
    pub fn new(attempt_host: AttemptHost, session: &Value) -> Result<Self, String> {
        let state_root = fgos_holder_lock::state_root::state_root().0;
        Ok(Self {
            workspace: HostWorkspace {
                process_cwd: std::env::current_dir().unwrap_or_default(),
            },
            machine: HostMachine::new(
                session.get("pathEnv").and_then(Value::as_str),
                session.get("herdrPresent").and_then(Value::as_bool),
            ),
            git: GitDoor::new(&state_root)?,
            adopt: SupervisorAdoptDoor {
                kill_wait_ms: fgos_holder_lock::DEFAULT_KILL_WAIT_MS,
            },
            host: SystemHost::new(),
            payload_root: PathBuf::from(&attempt_host.payload_root),
            attempt_host,
        })
    }
}

/// The give-back of an attempt's home and lease: the finalize-home step with the bundled SQLite engine and the
/// target store's account locks, and the accounts module (`closeAttempt`'s give-back).
struct HostGiveBack;

impl GiveBack for HostGiveBack {
    fn give_back_attempt_home(&self, run_dir: &Path, attempt_id: &str) -> bool {
        let stage = StageRenewedLogin {
            sqlite: &BundledSqlite,
            locks: &TargetAccountLocks,
        };
        let host = SystemHost::new();
        let accounts_at = |dir: Option<&Path>| accounts_of(dir, &host);
        let now = || now_millis() as i64;
        MachineGiveBack {
            stage: &stage,
            accounts_at: &accounts_at,
            now_ms: &now,
        }
        .give_back_attempt_home(run_dir, attempt_id)
    }

    fn release_provider_lease(&self, selection: &Value, run_id: &str, runtime_dir: Option<&Path>) {
        let stage = StageRenewedLogin {
            sqlite: &BundledSqlite,
            locks: &TargetAccountLocks,
        };
        let host = SystemHost::new();
        let accounts_at = |dir: Option<&Path>| accounts_of(dir, &host);
        let now = || now_millis() as i64;
        MachineGiveBack {
            stage: &stage,
            accounts_at: &accounts_at,
            now_ms: &now,
        }
        .release_provider_lease(selection, run_id, runtime_dir);
    }
}

fn accounts_of<'h>(dir: Option<&Path>, host: &'h SystemHost) -> Option<Accounts<'h>> {
    match dir {
        Some(dir) => Some(Accounts::new(dir, fgos_holder_lock::lock_root(), host)),
        None => Accounts::from_environment(host).ok(),
    }
}

/// `renewCredential` of `createCredentialRenewal()` (`src/runner/dispatch/provider-credential-renewal.mjs:1496`):
/// refresh-ahead of one login store, in a copy fgOS holds, under the account lock of the store's runtime directory,
/// with the account module's credential probe, the bundled SQLite engine and the window widened to the seat's
/// timeout. A seat still running on the store may hold the only good login, so its home is taken first
/// (`liveSeatHomes: listLiveSeatHomes`).
pub struct HostRenewal;

impl CredentialRenewal for HostRenewal {
    fn renew(&self, ask: &RenewAsk<'_>) -> Result<Option<Value>, String> {
        let source = source_of(ask.credential_source);
        let home = env_var("HOME");
        let probe = AccountsProbe {
            home_dir: home.clone(),
            inherited: std::env::vars().collect(),
        };
        let now = || now_millis() as f64;
        let live_seats = AttemptHomeRecords::default();
        let mut options = RefreshOptions::new(&TargetAccountLocks, &probe, &BundledSqlite, &now);
        options.seat_timeout_ms = Some(ask.seat_timeout_ms as f64);
        options.live_seat_homes = &live_seats;
        let outcome = refresh_ahead(
            &RefreshRequest {
                provider: ask.provider,
                account_id: ask.account_id,
                credential_source: &source,
                runtime_dir: ask.runtime_dir,
                home_dir: home.as_deref(),
            },
            &options,
        );
        Ok(Some(
            json!({ "status": outcome.status, "reason": outcome.reason }),
        ))
    }
}

/// `probeCredential` of `createCredentialProbe()` (`src/runner/dispatch/provider-credential-probe.mjs:173`): one
/// real call with the account's login, holding the account lock it is handed.
fn probe_account_credential(request: &ProbeRequest<'_>, lock: &AccountLock) -> Value {
    let inherited: BTreeMap<String, String> = std::env::vars().collect();
    probe_credential(
        request,
        lock,
        DEFAULT_TIMEOUT_MS,
        env_var("HOME").as_deref(),
        &inherited,
    )
}

/// `verifyRequiredProbe` (`src/runner/dispatch/confinement/authority.mjs:114`) for a bwrap backend: the cached pass
/// of the same fingerprint, else every falsification probe run fresh, a pass cached.
pub struct HostProbes;

fn probe_cache() -> &'static ProbeCache {
    static CACHE: std::sync::OnceLock<ProbeCache> = std::sync::OnceLock::new();
    CACHE.get_or_init(ProbeCache::new)
}

impl Probes for HostProbes {
    fn verify_bwrap(
        &self,
        request: &Value,
        executable: &str,
        driver_version: &str,
        backend_config: &Value,
    ) -> ProbeVerdict {
        let blind = fgos_execution_engine::confinement::policy::request_is_blind(request);
        let fingerprint = compute_probe_fingerprint(&FingerprintInput {
            policy: request
                .pointer("/requirement/policy")
                .cloned()
                .unwrap_or(Value::Null),
            driver_version: driver_version.into(),
            backend_config: backend_config.clone(),
            bwrap_executable: executable.into(),
            blind,
        });
        let context = request.get("context").cloned().unwrap_or(Value::Null);
        let now = now_millis() as i64;
        let verdict = |found: &Value| {
            let mut detail = found.as_object().cloned().unwrap_or_default();
            let passed = detail.remove("passed") == Some(Value::Bool(true));
            let message = detail
                .remove("message")
                .and_then(|m| m.as_str().map(str::to_string))
                .unwrap_or_default();
            ProbeVerdict {
                passed,
                message,
                fingerprint: Some(fingerprint.clone()),
                detail,
            }
        };
        if let Some(cached) = probe_cache().load(
            &fingerprint,
            &context,
            DEFAULT_PROBE_CACHE_TTL_MS,
            now,
            &env_var,
        ) {
            return verdict(&cached);
        }
        let scratch = std::env::temp_dir().join(format!(
            "fgos-probe-{}-{}",
            std::process::id(),
            random_suffix()
        ));
        let ports = ProbePorts {
            resolver: &PolicyResolver,
            driver_for: &driver_over,
        };
        let ran = run_all_confinement_probes(executable, &scratch, blind, &ports);
        let _ = std::fs::remove_dir_all(&scratch);
        let result = json!({
            "passed": ran.passed,
            "message": ran.message,
            "results": ran.results.iter().map(|r| r.to_json()).collect::<Vec<_>>(),
        });
        if ran.passed {
            probe_cache().save(&fingerprint, &result, &context, now, &env_var);
        }
        verdict(&result)
    }
}

/// The login files a leased account puts into a private home (`drivers/bwrap.mjs` imports `copyCredentialFiles`,
/// `credentialWriteBackTarget` and `loginLifeProblem`): credential renewal's own functions over the bundled SQLite
/// engine.
pub struct HostCredentials;

fn source_of(value: &Value) -> fgos_execution_engine::credentials::CredentialSource {
    let text = |key: &str| {
        value
            .get(key)
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string()
    };
    fgos_execution_engine::credentials::CredentialSource {
        kind: text("kind"),
        home: text("home"),
        files: value
            .get("files")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .filter_map(Value::as_str)
            .map(str::to_string)
            .collect(),
        cli: value.get("cli").and_then(Value::as_str).map(str::to_string),
    }
}

impl fgos_execution_engine::confinement::driver::ports::Credentials for HostCredentials {
    fn login_life_problem(&self, source: &Value, timeout_ms: u64) -> Option<String> {
        let home = env_var("HOME");
        fgos_execution_engine::credentials::login_life_problem(
            &source_of(source),
            home.as_deref(),
            Some(timeout_ms as f64),
            None,
            now_millis() as f64,
            &BundledSqlite,
        )
    }
    fn copy_files(
        &self,
        private_home: &Path,
        source_home: &Path,
        files: &[String],
    ) -> Result<Vec<String>, fgos_execution_engine::confinement::driver::DriverError> {
        fgos_execution_engine::credentials::copy_credential_files(
            private_home,
            source_home,
            files,
            &fgos_execution_engine::credentials::CopyOptions {
                sqlite: &BundledSqlite,
                skip_missing: true,
            },
        )
        .map_err(|message| {
            fgos_execution_engine::confinement::driver::DriverError::new(
                fgos_execution_engine::confinement::driver::ErrorKind::Port,
                message,
            )
        })
    }
    fn write_back_target(&self, capacity: &Value) -> Option<Value> {
        let runtime = capacity
            .pointer("/credentialWriteBack/runtimeDir")?
            .as_str()?;
        let text = |key: &str| {
            capacity
                .get(key)
                .and_then(Value::as_str)
                .unwrap_or_default()
        };
        let home = env_var("HOME");
        fgos_execution_engine::credentials::credential_write_back_target(
            text("provider"),
            text("accountId"),
            &source_of(capacity.get("credentialSource")?),
            Path::new(runtime),
            home.as_deref(),
        )
    }
}

/// The confinement backend drivers of this machine: bwrap, over the policy resolver, the private-home records and
/// the login copy (Node's Confinement Authority registers the same driver).
fn drivers() -> DriverRegistry {
    use std::sync::Arc;
    let mut registry = DriverRegistry::new();
    let env: fgos_execution_engine::confinement::driver::ports::EnvFn = Arc::new(env_var);
    let driver = fgos_execution_engine::confinement::driver::bwrap::BwrapDriver::new(
        Arc::new(PolicyResolver),
        Arc::new(fgos_execution_engine::confinement::cleanup::CleanupHomes::<
            fgos_execution_engine::confinement::cleanup::SystemHost,
        >::default()),
        Arc::new(HostCredentials),
        env,
        fgos_execution_engine::confinement::cleanup::current_uid().unwrap_or(0),
    );
    let _ = registry.register(Arc::new(driver));
    registry
}

/// The prompt seams of a worker brief: the operation prompt template the assignment names and the persona block.
struct HostPrompt<'a> {
    payload_root: &'a Path,
}

impl PromptPort for HostPrompt<'_> {
    fn render_operation_prompt(
        &self,
        assignment: &Value,
        options: &PromptOptions,
    ) -> Result<String, Refusal> {
        let cwd = options
            .cwd
            .clone()
            .or_else(|| options.repo_root.clone())
            .unwrap_or_default();
        render_template(assignment, &cwd, self.payload_root)
            .map(|rendered| {
                rendered
                    .get("renderedBody")
                    .and_then(Value::as_str)
                    .unwrap_or_default()
                    .to_string()
            })
            .map_err(|e| Refusal::new(e.message))
    }
    fn persona_section(
        &self,
        persona: &str,
        pinned_text: Option<&str>,
        project_root: &Path,
    ) -> Vec<String> {
        super::persona::persona_section(persona, pinned_text, project_root, self.payload_root)
    }
}

/// `resolveAndRenderOperationPrompt(assignment, { cwd, domain })`.
fn render_template(
    assignment: &Value,
    cwd: &Path,
    payload_root: &Path,
) -> Result<Value, RunnerConfigError> {
    resolve_and_render_operation_prompt(
        assignment,
        &TemplateAsk {
            roots: Roots {
                cwd: cwd.to_path_buf(),
                package_root: payload_root.to_path_buf(),
            },
            domain: assignment
                .get("domain")
                .and_then(Value::as_str)
                .map(str::to_string),
            variables: None,
            assignment: None,
            pinned_template: None,
        },
    )
    .map_err(|e| RunnerConfigError::coded(e.message, e.code))
}

impl ExecutePorts for HostExecution {
    fn checkout(&self) -> &dyn CheckoutFacts {
        &self.workspace
    }
    fn machine(&self) -> &dyn Machine {
        &self.machine
    }
    fn git(&self) -> &dyn SettlementGit {
        &self.git
    }
    fn roots(&self) -> &dyn CheckoutRoots {
        &GitCheckoutRoots
    }
    fn adopt(&self) -> &dyn AdoptDoor {
        &self.adopt
    }
    fn give_back(&self) -> &dyn GiveBack {
        &HostGiveBack
    }
    fn accounts_at(&self, runtime_dir: Option<&Path>) -> Result<Accounts<'_>, RunnerConfigError> {
        match runtime_dir {
            Some(dir) => Ok(Accounts::new(
                dir,
                fgos_holder_lock::lock_root(),
                &self.host,
            )),
            None => Accounts::from_environment(&self.host)
                .map_err(|e| RunnerConfigError::new(e.to_string())),
        }
    }
    fn load_runner_config(&self, root: &Path) -> Result<Value, RunnerConfigError> {
        super::machine::load_runner_config(root).map_err(|e| match e.code {
            Some(code) => RunnerConfigError::coded(e.message, &code),
            None => RunnerConfigError::new(e.message),
        })
    }
    fn decided_dispatch_plan(
        &self,
        cfg: &Value,
        assignment: &Value,
        opts: &ExecuteOptions,
    ) -> Result<Value, RunnerConfigError> {
        compile_assignment_plan(
            cfg,
            assignment,
            &PlanAsk {
                binding: opts.binding.as_ref(),
                cli_override: opts.cli_override.as_ref(),
                options: opts.options.as_ref(),
                has_live_task_access: opts.has_live_task_access,
            },
            &self.machine,
        )
    }
    /// `resolvePosture(binding, { runnerConfig }).requirement`
    /// (`src/runner/dispatch/confinement/policies.mjs:653`).
    fn posture_requirement(&self, binding: &Value, cfg: &Value) -> Value {
        resolve_posture(
            binding.get("posture").and_then(Value::as_str),
            cfg.get("confinementPolicies"),
        )
        .requirement()
    }
    fn resolve_template(&self, assignment: &Value, cwd: &Path) -> Result<Value, RunnerConfigError> {
        render_template(assignment, cwd, &self.payload_root)
    }
    fn render_prompt(
        &self,
        assignment: &Value,
        options: &PromptOptions,
    ) -> Result<String, RunnerConfigError> {
        render_assignment_prompt(
            assignment,
            options,
            &HostPrompt {
                payload_root: &self.payload_root,
            },
        )
        .map_err(|r| match r.code {
            Some(code) => RunnerConfigError::coded(r.message, &code),
            None => RunnerConfigError::new(r.message),
        })
    }
    fn attempt_host(&self) -> Result<AttemptHost, RunnerConfigError> {
        Ok(self.attempt_host.clone())
    }
    /// `attemptStepEnvOf()`: the variables the supervisor's steps run with.
    fn step_env(&self) -> Map<String, Value> {
        let env: BTreeMap<String, String> = std::env::vars().collect();
        attempt_step_env(&env)
    }
    fn launch_settings(&self, root: &Path) -> Result<LaunchSettings, RunnerConfigError> {
        read_launch_settings(root).map_err(|e| RunnerConfigError::new(e.0))
    }
    fn fgos_dir_of_root(&self, root: &Path) -> PathBuf {
        super::machine::fgos_dir(root)
    }
    /// `createCredentialRenewal()` (`src/runner/execution/run.mjs:1012`).
    fn renewal(&self) -> Option<&dyn CredentialRenewal> {
        Some(&HostRenewal)
    }
    /// `createCredentialProbe()` (`src/runner/execution/run.mjs:1011`).
    fn credential_probe(&self) -> Option<CredentialProbe<'_>> {
        Some(&probe_account_credential)
    }
    fn clock(&self) -> BuildClock<'_> {
        BuildClock {
            now_ms: &now_millis,
            random_suffix: &random_suffix,
        }
    }
}

impl SeatPorts for HostExecution {
    /// `resolveExecutorCommand(cfg, { prompt, model, requestedModel, reasoningEffort, tier, executorId, fgosDir,
    /// attestRoot, invocationId })` (`src/runner/dispatch/transport.mjs:144`).
    fn resolve_command(&self, ask: &CommandAsk<'_>) -> Result<Value, RunnerConfigError> {
        let executor = fgos_execution::executor_config::resolve_executor_config(
            ask.cfg,
            Some(ask.executor_id),
            None,
            None,
            ask.invocation_id,
        )
        .map_err(|e| RunnerConfigError::new(e.message))?;
        let main = self
            .workspace
            .main_checkout_root(&ask.attest_root.to_string_lossy())
            .map(PathBuf::from);
        let fgos_dir = main.as_deref().map(super::machine::fgos_dir);
        resolve_executor_command(
            &executor,
            &CommandRequest {
                prompt: ask.prompt,
                model: ask.model,
                executor_id: Some(ask.executor_id),
                fgos_dir: fgos_dir.as_deref(),
                attest_root: Some(ask.attest_root),
                reasoning_effort: ask.reasoning_effort,
                requested_model: ask.requested_model,
            },
        )
        .map_err(|e| RunnerConfigError::new(e.message))
    }

    /// `prepareConfinementForLaunch(request)` (`src/runner/dispatch/confinement/authority.mjs`): the Confinement
    /// Authority over this machine's backend registry and drivers.
    fn prepare_confinement(&self, request: &Value) -> Result<Launch, RunnerConfigError> {
        let env: Vec<(String, String)> = std::env::vars().collect();
        let drivers = drivers();
        let registry = registry_path(&env_var)
            .ok()
            .and_then(|path| load_machine_registry(&path).ok());
        let roots: Vec<String> =
            fgos_execution_engine::confinement::cleanup::credential_scan_roots(registry.as_ref())
                .iter()
                .map(|p| p.to_string_lossy().into_owned())
                .collect();
        let now_iso = || fgos_identity::text::iso_utc_now();
        let discard = |_: &fgos_execution_engine::confinement::driver::Prepared| {};
        let home = std::env::var("HOME").map(PathBuf::from).unwrap_or_default();
        let approvals = |trust: &Value, cwd: &str, repo_root: &str| {
            let store = trust.get("path").and_then(Value::as_str).map(Path::new);
            let claude_dir = std::env::var("CLAUDE_CONFIG_DIR").ok();
            let store_path =
                fgos_run_supervisor::controller::trust_store::operator_claude_store_path(
                    store,
                    claude_dir.as_deref(),
                    &home,
                );
            fgos_run_supervisor::controller::trust_store::claude_mcp_approval_args(
                Path::new(cwd),
                repo_root,
                &store_path,
            )
        };
        let host = LaunchHost {
            env: &env,
            drivers: &drivers,
            probes: &HostProbes,
            credential_scan_roots: &roots,
            now_iso: &now_iso,
            discard_prepared: &discard,
            claude_mcp_approval_args: &approvals,
        };
        prepare_confinement_for_launch(request, &host).map_err(|e| {
            let message = e.message.clone();
            match e.code {
                Some(code) => RunnerConfigError::coded(message, &code),
                None => RunnerConfigError::new(message),
            }
        })
    }

    /// A terminal attempt's pane (`prepareTerminalAttempt`, `src/runner/dispatch/herdr-round.mjs:462`, as
    /// `src/runner/dispatch/assignment-runner.mjs:1062` calls it) over the herdr route of this machine and the
    /// project's `terminal.*` layout settings (`terminalRouteConfig(projectRoot)`).
    fn prepare_pane(
        &self,
        attempt: &mut Attempt,
        ask: &PaneAsk<'_>,
    ) -> Result<PaneSeat, RunnerConfigError> {
        let route = Arc::new(HerdrRoute::of_project(ask.seat.root));
        super::terminal::prepare_pane_here(attempt, ask, route, &self.host)
    }

    fn controller_writer_id(&self) -> Option<String> {
        Some(super::machine::git_writer())
    }
}
