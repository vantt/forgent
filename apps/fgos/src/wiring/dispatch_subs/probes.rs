//! The two diagnostics of `fgos dispatch`: `probe-account` (one provider account, or every enabled one, probed two
//! ways: its login called directly, then every CLI of it at once through the real dispatch door) and
//! `probe-session` (one tiny read-only seat of one executor, then where its CLI wrote the session). The judgements
//! are the engine's account and session probes; the seat runs through the same assignment runner and unit run a
//! real dispatch uses.

use super::{validation, Answer, Answered, Flags, SubRequest};
use crate::wiring::dispatch_decide::HostWorkspace;
use crate::wiring::execution_routes::{attempt_host, unit_run_host, SharedPort};
use crate::wiring::run::LazyPeer;
use crate::wiring::seat_binding::HostMachine;
use crate::wiring::unit_run_host::execution::HostExecution;
use fgos_execution::account_pin::config_pinned_to_account;
use fgos_execution::accounts::provider_account_inventory;
use fgos_execution::decide::{load_checked_runner, CheckoutFacts};
use fgos_execution::run_request::resolve_path;
use fgos_execution_engine::accounts::account_probe::{
    account_invocations, account_probe_verdict, classify_account_probe, probe_contract,
    probe_model_for, run_direct_leg, with_probe_binding, ProbeRun,
};
use fgos_execution_engine::accounts::credential_probe::{probe_credential, DEFAULT_TIMEOUT_MS};
use fgos_execution_engine::accounts::session_probe::{
    describe_session_keep, session_category, session_probe_invocation,
};
use fgos_execution_engine::accounts::{Accounts, ProbeRecord, ProbeRequest, SystemHost};
use fgos_execution_engine::assignment::builder::{
    build_assignment, claim_assignment_id, BuildOptions,
};
use fgos_execution_engine::assignment_runner::execute::{
    execute_assignment, ExecuteError, ExecuteOptions,
};
use fgos_execution_engine::contract::validate::ExecutionContract;
use fgos_execution_engine::run_result::reader::run_outcome;
use fgos_execution_engine::run_result::vocabulary::LEASE_CONFLICT_FAILURE_CODE;
use fgos_execution_engine::transport::terminal_slot::herdr_endpoint_env;
use fgos_execution_engine::transport::worker_session::env_for_session;
use fgos_execution_engine::transport_round::round::close_live_pane;
use fgos_host_runtime::CategorisedRefusal;
use fgos_session_host::SessionHost;
use serde_json::{json, Map, Value};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Instant;

pub const ACCOUNT_PROBE_PROMPT: &str =
    "Account probe: there is no task. Reply with the single word OK.";
pub const SESSION_PROBE_PROMPT: &str =
    "Session probe: there is no task. Reply with the single word OK.";
const ACCOUNT_PROBE_LEGS: [&str; 3] = ["direct", "harness", "both"];
const DEFAULT_ACCOUNT_PROBE_TIMEOUT_MS: u64 = 3 * 60 * 1000;

fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |d| d.as_millis() as i64)
}

/// The flags of a probe call, read through the shared parser: the positional id right after the sub-command, and
/// each flag by its name.
struct Raw<'a> {
    executor_id: Option<String>,
    flags: &'a Flags,
}

impl<'a> Raw<'a> {
    fn of(flags: &'a Flags) -> Self {
        Raw {
            executor_id: flags.positional(1).map(str::to_owned),
            flags,
        }
    }

    /// `name` is the flag as the help writes it (`--provider`).
    fn value(&self, name: &str) -> Option<String> {
        self.flags.text(name.trim_start_matches('-'))
    }

    fn has(&self, name: &str) -> bool {
        self.flags.given(name.trim_start_matches('-'))
    }

    /// A milliseconds flag: absent stays absent (the config value applies).
    fn positive_int(&self, name: &str) -> Result<Option<u64>, CategorisedRefusal> {
        let Some(raw) = self.value(name) else {
            return Ok(None);
        };
        match raw.parse::<u64>() {
            Ok(value)
                if raw.bytes().all(|b| b.is_ascii_digit()) && value > 0 && value < (1u64 << 53) =>
            {
                Ok(Some(value))
            }
            _ => Err(validation(format!(
                "{name} must be a positive integer (milliseconds), got {}",
                Value::String(raw)
            ))),
        }
    }

    /// The working directory and the main checkout a probe runs against.
    fn dirs(&self, process_cwd: &Path) -> (PathBuf, PathBuf) {
        let cwd = resolve(
            process_cwd,
            &self
                .value("--cwd")
                .or_else(|| self.value("--dir"))
                .unwrap_or_else(|| process_cwd.to_string_lossy().into_owned()),
        );
        let workspace = HostWorkspace {
            process_cwd: process_cwd.to_path_buf(),
        };
        let cwd_text = cwd.to_string_lossy().into_owned();
        let repo_root = match self.value("--repo-root") {
            Some(root) => resolve(process_cwd, &root),
            None => workspace
                .main_checkout_root(&cwd_text)
                .or_else(|| workspace.repo_root(&cwd_text).ok())
                .map_or_else(|| cwd.clone(), PathBuf::from),
        };
        (cwd, repo_root)
    }
}

/// `path.resolve(base, path)`, through the one resolver the run request uses.
fn resolve(base: &Path, path: &str) -> PathBuf {
    PathBuf::from(resolve_path(&base.to_string_lossy(), path))
}

/// The checked runner of the project at `root`; its warnings go to stderr.
fn runner_of(process_cwd: &Path, root: &Path) -> Result<Value, CategorisedRefusal> {
    let workspace = HostWorkspace {
        process_cwd: process_cwd.to_path_buf(),
    };
    let (runner, warnings) = load_checked_runner(&workspace, &root.to_string_lossy())
        .map_err(|failure| validation(failure.message().to_owned()))?;
    for warning in warnings {
        eprintln!("{warning}");
    }
    Ok(runner)
}

fn home_dir() -> Option<String> {
    std::env::var("HOME").ok().filter(|home| !home.is_empty())
}

// ---- what a run left ----------------------------------------------------------------------------------------

fn read_json(file: &Path) -> Option<Value> {
    serde_json::from_str(&std::fs::read_to_string(file).ok()?).ok()
}

/// The last `limit` bytes of a text file, as the JavaScript `slice(-limit)` of its text.
fn tail_text(file: &Path, limit: usize) -> String {
    let text = std::fs::read_to_string(file).unwrap_or_default();
    let chars: Vec<char> = text.chars().collect();
    chars[chars.len().saturating_sub(limit)..].iter().collect()
}

/// What a settled round says, read back from where the door wrote it.
#[derive(Debug, Clone, Default)]
pub(crate) struct RunRead {
    pub ok: bool,
    pub text: String,
    pub failure_code: Option<String>,
    pub cause: Option<String>,
    pub provider_signal: Value,
    pub run_dir: Option<PathBuf>,
    pub pane_id: Option<String>,
    pub terminal_key: Option<String>,
    pub herdr_session: Option<String>,
}

fn text_of(value: Option<&Value>) -> Option<String> {
    value
        .and_then(Value::as_str)
        .filter(|text| !text.is_empty())
        .map(str::to_owned)
}

/// `readRunOutcome(runResult, { repoRoot })`: the claim, the tail of the logs and the run note of a Run Result's
/// round, and whether its execution completed without a failure.
pub(crate) fn read_run_outcome(run_result: &Value, repo_root: &Path) -> RunRead {
    let stdout_log =
        text_of(run_result.pointer("/runtime/stdoutLog")).map(|log| resolve(repo_root, &log));
    let run_dir = stdout_log
        .as_deref()
        .and_then(Path::parent)
        .map(Path::to_path_buf);
    let visibility = run_dir
        .as_deref()
        .and_then(|dir| read_json(&dir.join("visibility.json")));
    let claim = run_dir
        .as_deref()
        .and_then(|dir| read_json(&dir.join("outbox").join("result-1.json")));
    let parts = [
        text_of(claim.as_ref().and_then(|c| c.get("summary"))),
        stdout_log.as_deref().map(|log| tail_text(log, 16 * 1024)),
        run_dir
            .as_deref()
            .map(|dir| tail_text(&dir.join("stderr.log"), 16 * 1024)),
        text_of(run_result.pointer("/runnerNote/summary")),
    ];
    let text = parts
        .into_iter()
        .flatten()
        .filter(|part| !part.is_empty())
        .collect::<Vec<_>>()
        .join("\n");
    let outcome = (!run_result.is_null()).then(|| run_outcome(run_result, None));
    let failure = outcome
        .as_ref()
        .map(|o| o.failure.clone())
        .filter(|f| !f.is_null() && f != &Value::Bool(false));
    let pick = |key: &str| {
        visibility
            .as_ref()
            .and_then(|v| v.get(key))
            .and_then(Value::as_str)
            .map(str::to_owned)
    };
    RunRead {
        ok: outcome
            .as_ref()
            .is_some_and(|o| o.executed == "completed" && failure.is_none()),
        text,
        failure_code: failure.as_ref().and_then(|f| text_of(f.get("code"))),
        cause: failure.as_ref().and_then(|f| text_of(f.get("cause"))),
        provider_signal: failure
            .as_ref()
            .and_then(|f| f.get("providerSignal").cloned())
            .unwrap_or(Value::Null),
        run_dir,
        pane_id: pick("paneId"),
        terminal_key: pick("terminalKey"),
        herdr_session: pick("herdrSession"),
    }
}

/// A refused dispatch, as a round that did not run: its message, and the class and the paths the refusal names.
fn refused_run(error: &ExecuteError) -> RunRead {
    let (code, facts) = match error {
        ExecuteError::Dispatch(e) => (Some(e.code.clone()), Some((*e.detail).clone())),
        ExecuteError::Config(e) if e.facts.get("name") == Some(&json!("DispatchError")) => {
            (e.code.clone(), Some((*e.facts).clone()))
        }
        ExecuteError::Config(e) => (None, Some((*e.facts).clone())),
        ExecuteError::Admission(e) => (None, Some((*e.facts).clone())),
    };
    let fact = |key: &str| facts.as_ref().and_then(|f| text_of(f.get(key)));
    RunRead {
        ok: false,
        text: error.to_string(),
        failure_code: code,
        run_dir: fact("runDir").map(PathBuf::from),
        pane_id: fact("paneId"),
        terminal_key: fact("terminalKey"),
        herdr_session: fact("herdrSession"),
        ..RunRead::default()
    }
}

// ---- probe-account ------------------------------------------------------------------------------------------

/// Closes the pane a round left open, by its terminal-control key, on the herdr server of the session it was
/// placed in. A run record that carries no key was written before panes were addressed by key: nothing proves
/// which pane it was, so it is left open. A pane a settled round already closed is not "closed by the probe".
fn close_pane(terminal_key: Option<&str>, herdr_session: Option<&str>) -> bool {
    let Some(key) = terminal_key.filter(|key| !key.is_empty()) else {
        return false;
    };
    let process: Map<String, Value> = std::env::vars()
        .map(|(name, value)| (name, Value::String(value)))
        .collect();
    let env = match herdr_session.filter(|s| !s.is_empty()) {
        Some(session) => {
            let base: BTreeMap<String, String> = std::env::vars().collect();
            env_for_session(&base, session)
                .into_iter()
                .map(|(name, value)| (name, Value::String(value)))
                .collect()
        }
        None => process,
    };
    let Ok(parts) = super::terminal::route_parts(herdr_endpoint_env(&env)) else {
        return false;
    };
    let core = parts.core();
    close_live_pane(&SessionHost { panes: &core }, key)
}

/// One account's plan: what it is, and every invocation that runs as it.
struct AccountPlan<'a> {
    cfg: &'a Value,
    repo_root: &'a Path,
    cwd: &'a Path,
    leg: &'a str,
    record: bool,
    timeout_ms: u64,
}

/// Builds and claims one inline read-only Assignment for a probe round.
fn create_assignment(contract: &Value, assignments_dir: &Path) -> Result<Value, String> {
    let writer = fgos_identity::resolve_current().id;
    let params = json!({
        "provenance": { "kind": "inline", "contract": contract, "caller": { "writerId": writer.to_string() } },
    });
    let options = BuildOptions {
        assignments_dir: Some(assignments_dir.to_path_buf()),
        ..BuildOptions::default()
    };
    claim_assignment_id(
        &mut || build_assignment(&params, &options, &ExecutionContract),
        assignments_dir,
    )
    .map_err(|refusal| refusal.message)
}

/// The harness leg of one invocation: the round dispatched through the real door, judged, its pane closed.
fn harness_row(
    plan: &AccountPlan<'_>,
    provider: &str,
    account_id: &str,
    invocation: &Value,
    assignment: Value,
    runner_config: &Value,
) -> Value {
    let started = Instant::now();
    let executor_id = invocation["executorId"].as_str().unwrap_or_default();
    let invocation_id = invocation["invocationId"].as_str().unwrap_or_default();
    let (model, model_source) = probe_model_for(plan.cfg, executor_id, provider);
    let mut cli_override = json!({
        "preferExecutor": executor_id,
        "preferInvocation": invocation_id,
        "leaseAccount": account_id,
    });
    if let Some(model) = &model {
        cli_override["model"] = json!(model);
    }
    let run = match attempt_host().and_then(|host| HostExecution::new(host, &json!({}))) {
        Err(message) => RunRead {
            text: message,
            ..RunRead::default()
        },
        Ok(ports) => {
            let options = ExecuteOptions {
                cwd: Some(plan.cwd.to_path_buf()),
                repo_root: Some(plan.repo_root.to_path_buf()),
                runner_config: Some(runner_config.clone()),
                cli_override: Some(cli_override),
                is_read_only_mode: Some(true),
                ..ExecuteOptions::default()
            };
            let mut on_chunk = |_: &str, _: &str| {};
            match execute_assignment(&assignment, &options, &ports, &mut on_chunk) {
                Ok(interpreted) => read_run_outcome(&interpreted.record, plan.repo_root),
                Err(error) => refused_run(&error),
            }
        }
    };
    let classified = classify_account_probe(&ProbeRun {
        ok: run.ok,
        text: &run.text,
        failure_code: run.failure_code.as_deref(),
        cause: run.cause.as_deref(),
        provider_signal: run.provider_signal.clone(),
        run_dir: run.run_dir.clone(),
    });
    // A lease refused for the account's quarantine says nothing about the harness.
    let quarantined = run.failure_code.as_deref() == Some(LEASE_CONFLICT_FAILURE_CODE);
    let outcome = if quarantined {
        json!("quarantined")
    } else {
        classified.get("outcome").cloned().unwrap_or(Value::Null)
    };
    let pane = run.pane_id.as_ref().map(|_| {
        if close_pane(run.terminal_key.as_deref(), run.herdr_session.as_deref()) {
            "closed-by-probe"
        } else {
            "not-open"
        }
    });
    let confined = invocation.get("confined") == Some(&json!(true));
    let mut row = Map::new();
    row.insert("leg".into(), json!("harness"));
    for (key, from) in [
        ("cli", "cli"),
        ("invocationId", "invocationId"),
        ("executorId", "executorId"),
        ("adapter", "adapter"),
        ("confined", "confined"),
    ] {
        row.insert(
            key.into(),
            invocation.get(from).cloned().unwrap_or(Value::Null),
        );
    }
    row.insert("inVerdict".into(), json!(confined && !quarantined));
    row.insert(
        "account".into(),
        invocation.get("via").cloned().unwrap_or(Value::Null),
    );
    row.insert("model".into(), json!(model));
    row.insert("modelSource".into(), json!(model_source));
    row.insert("outcome".into(), outcome);
    row.insert(
        "evidence".into(),
        classified.get("evidence").cloned().unwrap_or(Value::Null),
    );
    if let Some(rule) = classified.get("matchedRule").filter(|r| !r.is_null()) {
        row.insert("matchedRule".into(), rule.clone());
    }
    row.insert(
        "assignmentId".into(),
        assignment
            .get("assignmentId")
            .cloned()
            .unwrap_or(Value::Null),
    );
    row.insert("runDir".into(), json!(run.run_dir));
    row.insert("paneId".into(), json!(run.pane_id));
    if let Some(pane) = pane {
        row.insert("pane".into(), json!(pane));
    }
    row.insert(
        "elapsedMs".into(),
        json!(started.elapsed().as_millis() as u64),
    );
    Value::Object(row)
}

/// Probes one account: the direct leg first, then every invocation of it at once through the dispatch door, then
/// the verdict, and, with `record`, the direct rows written to the account state.
fn probe_one_account(
    plan: &AccountPlan<'_>,
    provider: &str,
    account_id: &str,
    executor_id: Option<&str>,
    invocation_ids: Option<&[String]>,
) -> Result<Value, String> {
    let inventory = provider_account_inventory(plan.cfg, &HostMachine::new(None, None));
    let home = home_dir();
    let invocations = account_invocations(
        plan.cfg,
        &inventory,
        provider,
        account_id,
        executor_id,
        home.as_deref(),
    );
    let family = invocations["provider"]
        .as_str()
        .unwrap_or(provider)
        .to_owned();
    if invocations.get("account").is_none_or(Value::is_null) {
        return Err(format!("no account \"{account_id}\" for provider \"{family}\" in runner.llmAccounts (~/.fgos/private/accounts.yaml)"));
    }
    let host = SystemHost::new();
    let accounts = Accounts::from_environment(&host).map_err(|e| e.to_string())?;
    let direct_rows = if plan.leg == "harness" {
        Vec::new()
    } else {
        let inherited: BTreeMap<String, String> = std::env::vars().collect();
        let mut call = |cli: Option<&str>, _source: &Value, model: Option<&str>| {
            let started = Instant::now();
            let request = ProbeRequest {
                provider: &family,
                account_id,
                account: &invocations["account"],
                cli,
                model,
            };
            let answer = match accounts.acquire_account_lock(&family, account_id, None) {
                Ok(lock) => {
                    let answer = probe_credential(
                        &request,
                        &lock,
                        DEFAULT_TIMEOUT_MS,
                        home.as_deref(),
                        &inherited,
                    );
                    lock.release();
                    answer
                }
                Err(error) => json!({ "ok": false, "detail": error.to_string() }),
            };
            (answer, started.elapsed().as_millis() as u64)
        };
        run_direct_leg(plan.cfg, &invocations, home.as_deref(), &mut call)
    };
    let wanted: Vec<Value> = if plan.leg == "direct" {
        Vec::new()
    } else {
        invocations["invocations"]
            .as_array()
            .into_iter()
            .flatten()
            .filter(|inv| {
                invocation_ids.is_none_or(|ids| {
                    inv["invocationId"]
                        .as_str()
                        .is_some_and(|id| ids.iter().any(|wanted| wanted == id))
                })
            })
            .cloned()
            .collect()
    };
    let runner_config = config_pinned_to_account(plan.cfg, &family, account_id);
    let assignments_dir = plan.repo_root.join(".fgos").join("assignments");
    // Ids are claimed one after another before anything starts: claiming is check-then-act on disk.
    let contract = probe_contract(ACCOUNT_PROBE_PROMPT, plan.timeout_ms);
    let mut claimed = Vec::new();
    for invocation in wanted {
        let built = create_assignment(&contract, &assignments_dir)?;
        let executor = invocation["executorId"].as_str().unwrap_or_default();
        let id = invocation["invocationId"].as_str().unwrap_or_default();
        claimed.push((invocation.clone(), with_probe_binding(&built, executor, id)));
    }
    let harness_rows: Vec<Value> = std::thread::scope(|scope| {
        let handles: Vec<_> = claimed
            .into_iter()
            .map(|(invocation, assignment)| {
                let runner_config = &runner_config;
                let family = family.as_str();
                scope.spawn(move || {
                    harness_row(
                        plan,
                        family,
                        account_id,
                        &invocation,
                        assignment,
                        runner_config,
                    )
                })
            })
            .collect();
        handles
            .into_iter()
            .map(|handle| {
                handle
                    .join()
                    .unwrap_or_else(|_| json!({ "leg": "harness", "outcome": "other" }))
            })
            .collect()
    });
    let mut results = direct_rows.clone();
    results.extend(harness_rows);
    let verdict = account_probe_verdict(&results);
    let mut report = json!({
        "provider": family,
        "accountId": account_id,
        "verdict": verdict,
        "results": results,
    });
    if let Some(account_dir) = fgos_execution_engine::credentials::credential_store_dir(
        &accounts.runtime_dir,
        &family,
        account_id,
        None,
    ) {
        let owner =
            fgos_execution_engine::credentials::read_renewal_owner(&account_dir).or_else(|| {
                let stores_dir = account_dir.join("stores");
                if let Ok(entries) = std::fs::read_dir(stores_dir) {
                    for entry in entries.flatten() {
                        if let Some(owner) =
                            fgos_execution_engine::credentials::read_renewal_owner(&entry.path())
                        {
                            return Some(owner);
                        }
                    }
                }
                None
            });
        if let Some(owner) = owner {
            report["renewalOwner"] = json!({
                "seat": owner.seat,
                "lastRenewedAt": owner.last_renewed_at,
            });
        }
    }
    if plan.record {
        let direct: Vec<Value> = direct_rows
            .iter()
            .filter(|row| row["outcome"] != json!("no-probe"))
            .map(|row| {
                let mut row = row.clone();
                row["ok"] = json!(row["outcome"] == json!("ok"));
                row
            })
            .collect();
        match accounts.record_account_probe(&ProbeRecord {
            provider: &family,
            account_id,
            direct,
            verdict: Some(verdict),
            source: "probe-account",
            now_ms: now_ms(),
        }) {
            Ok(_) => report["recorded"] = json!(true),
            Err(error) => {
                report["recorded"] = json!(false);
                report["recordError"] = json!(error.to_string());
            }
        }
    }
    Ok(report)
}

pub(crate) fn probe_account(request: &SubRequest, flags: &Flags) -> Answered {
    let raw = Raw::of(flags);
    let provider = raw.value("--provider");
    let account = raw.value("--account");
    let all = raw.has("--all");
    if all {
        let narrowed: Vec<&str> = ["--provider", "--account", "--executor", "--invocation"]
            .into_iter()
            .filter(|name| raw.has(name))
            .collect();
        if !narrowed.is_empty() {
            return Err(validation(format!(
                "dispatch probe-account --all probes every account and cannot be narrowed by {}",
                narrowed.join(", ")
            )));
        }
    } else if provider.as_deref().is_none_or(str::is_empty)
        || account.as_deref().is_none_or(str::is_empty)
    {
        return Err(validation(
            "dispatch probe-account requires --provider <provider> --account <accountId>, or --all",
        ));
    }
    let leg = raw.value("--leg").unwrap_or_else(|| "both".to_owned());
    if !ACCOUNT_PROBE_LEGS.contains(&leg.as_str()) {
        return Err(validation(format!(
            "dispatch probe-account --leg must be one of {}, got {}",
            ACCOUNT_PROBE_LEGS.join(", "),
            Value::String(leg)
        )));
    }
    let (cwd, repo_root) = raw.dirs(&request.process_cwd);
    let timeout_ms = raw
        .positive_int("--timeout-ms")?
        .unwrap_or(DEFAULT_ACCOUNT_PROBE_TIMEOUT_MS);
    let cfg = runner_of(&request.process_cwd, &repo_root)?;
    let plan = AccountPlan {
        cfg: &cfg,
        repo_root: &repo_root,
        cwd: &cwd,
        leg: &leg,
        record: raw.has("--record"),
        timeout_ms,
    };
    if all {
        let mut swept = Vec::new();
        let inventory = provider_account_inventory(&cfg, &HostMachine::new(None, None));
        for (provider, entry) in &inventory {
            for (account_id, account) in entry
                .get("accounts")
                .and_then(Value::as_object)
                .into_iter()
                .flatten()
            {
                if account.get("disabled") == Some(&json!(true)) {
                    swept.push(json!({ "provider": provider, "accountId": account_id, "skipped": "disabled" }));
                    continue;
                }
                swept.push(
                    probe_one_account(&plan, provider, account_id, None, None).unwrap_or_else(
                        |error| json!({ "provider": provider, "accountId": account_id, "error": error }),
                    ),
                );
            }
        }
        return Ok(Answer::Json(json!({ "accounts": swept })));
    }
    let invocation_ids: Option<Vec<String>> = raw.value("--invocation").map(|list| {
        list.split(',')
            .map(str::trim)
            .filter(|id| !id.is_empty())
            .map(str::to_owned)
            .collect()
    });
    probe_one_account(
        &plan,
        provider.as_deref().unwrap_or_default(),
        account.as_deref().unwrap_or_default(),
        raw.value("--executor").as_deref(),
        invocation_ids.as_deref(),
    )
    .map(Answer::Json)
    .map_err(CategorisedRefusal::unexpected)
}

// ---- probe-session ------------------------------------------------------------------------------------------

fn random_hex3() -> String {
    fgos_identity::text::random_bytes::<3>()
        .map(|bytes| bytes.iter().map(|b| format!("{b:02x}")).collect())
        .unwrap_or_else(|_| format!("{:06x}", std::process::id() & 0xff_ffff))
}

/// The probe seat run through the unit run door, as `fgos run` runs a read-only unit: the result of its last seat,
/// or the round that did not run.
fn run_probe_seat(options: &Value, repo_root: &Path) -> (RunRead, Value) {
    let peer = Arc::new(LazyPeer::new(Some(
        repo_root.to_string_lossy().into_owned(),
    )));
    let host = match unit_run_host(options, Some(SharedPort(Arc::clone(&peer)))) {
        Ok(host) => host,
        Err(message) => {
            return (
                RunRead {
                    text: message,
                    ..RunRead::default()
                },
                Value::Null,
            )
        }
    };
    match host.run_unit(options) {
        Err(error) => {
            let document = error.to_json();
            let run_dir = document
                .pointer("/error/runDir")
                .or_else(|| document.get("runDir"))
                .and_then(Value::as_str)
                .map(PathBuf::from);
            (
                RunRead {
                    text: error.message.clone(),
                    run_dir,
                    ..RunRead::default()
                },
                Value::Null,
            )
        }
        Ok(unit) => {
            let last = unit
                .get("results")
                .and_then(Value::as_array)
                .and_then(|results| results.last())
                .cloned()
                .unwrap_or(Value::Null);
            let bound = last.get("binding").cloned().unwrap_or(Value::Null);
            match last.get("runResult").filter(|r| !r.is_null()) {
                Some(run_result) => (read_run_outcome(run_result, repo_root), bound),
                None => {
                    let outcome = unit
                        .get("outcome")
                        .map(|o| o.as_str().map_or_else(|| o.to_string(), str::to_owned))
                        .unwrap_or_else(|| "unknown".to_owned());
                    (
                        RunRead {
                            text: format!("the unit ended as {outcome} with no seat result"),
                            ..RunRead::default()
                        },
                        bound,
                    )
                }
            }
        }
    }
}

/// The session probe's report from the seat's outcome and what its run left.
pub(crate) fn session_report(
    executor_id: &str,
    invocation: &Value,
    run: &RunRead,
    bound: &Value,
) -> Value {
    let keep = describe_session_keep(run.run_dir.as_deref(), invocation, executor_id);
    let category = session_category(run.ok, &keep);
    let mut report = json!({
        "executorId": executor_id,
        "invocationId": invocation.get("id").cloned().unwrap_or(Value::Null),
        "model": bound.get("model").cloned().unwrap_or(Value::Null),
        "outcome": if run.ok { "ok" } else { "failed" },
        "category": category,
        "kept": category == "kept",
        "declaredSessionDir": keep.declared_session_dir,
        "observedSessionPaths": keep.observed_session_paths,
        "transcriptPath": keep.transcript_path,
        "files": keep.files,
        "sizeBytes": keep.bytes,
        "fix": keep.fix,
        "warnings": keep.warnings,
        "runDir": run.run_dir,
    });
    if !run.ok {
        report["evidence"] = run
            .text
            .split('\n')
            .map(|line| line.strip_suffix('\r').unwrap_or(line).trim())
            .find(|line| !line.is_empty())
            .map_or(Value::Null, |line| json!(line));
    }
    report
}

pub(crate) fn probe_session(request: &SubRequest, flags: &Flags) -> Answered {
    let raw = Raw::of(flags);
    let Some(executor_id) = raw.executor_id.clone() else {
        return Err(validation("dispatch probe-session requires an executor id: fgos dispatch probe-session <executorId> [--invocation <id>]"));
    };
    let (cwd, repo_root) = raw.dirs(&request.process_cwd);
    let cfg = runner_of(&request.process_cwd, &repo_root)?;
    let invocation_id = raw.value("--invocation");
    let invocation = session_probe_invocation(&cfg, &executor_id, invocation_id.as_deref())
        .map_err(CategorisedRefusal::unexpected)?
        .clone();
    let cheapest = fgos_execution::hosts::tiers()
        .into_iter()
        .next()
        .unwrap_or_default();
    let options = json!({
        "unitData": {
            "id": format!("probe-session-{}", random_hex3()),
            "objective": SESSION_PROBE_PROMPT,
            "capability": "execute",
            "writes": [],
        },
        "overrides": [{ "executor": executor_id, "invocation": invocation.get("id").cloned().unwrap_or(Value::Null), "tier": cheapest }],
        "raiseAuthorized": false,
        "repoRoot": repo_root,
        "cwd": cwd,
    });
    let (run, bound) = run_probe_seat(&options, &repo_root);
    let report = session_report(&executor_id, &invocation, &run, &bound);
    // The Node CLI's verb exit table has no row for this verb, so the call exits 0 whatever the category says.
    Ok(Answer::Json(report))
}
