//! The provider account an attempt takes.
//!
//! A seat bound to a pool leases from that pool; otherwise the provider family, normalized. Only an account that
//! holds a login store for the store the launch reads is leased. A lease that fails (lock contention, a corrupt
//! state file) is a refusal, never an escape: the Run is already admitted as `running` and the caller settles the
//! refusal. A selected lease is recorded as the Run's provider-capacity evidence (`credentialProvisioned` false
//! until confinement provisions it).

use std::path::Path;

use fgos_execution::accounts::legacy_state_key;
use fgos_execution::accounts::provider_account_inventory;
use fgos_execution::executor_model::{credential_store_of, family_of, FamilySource};
use fgos_execution::ports::Machine;
use serde_json::{json, Map, Value};

use crate::accounts::credential::{command_cli, credential_source_for_cli, redact_selection};
use crate::accounts::{AccountLock, Accounts, NamedLease, ProbeRequest, QuarantineProbe, Reclaim};
use crate::planning::admission::is_supervised_attempt_still_working;

/// The login store key of an invocation: what it declares to use, else the CLI of its command.
fn store_key_of(invocation: &Value) -> Option<String> {
    credential_store_of(invocation)
        .and_then(|store| store.get("use").and_then(Value::as_str))
        .map(str::to_string)
        .or_else(|| {
            command_cli(
                invocation
                    .get("command")
                    .and_then(Value::as_str)
                    .unwrap_or_default(),
            )
        })
}

fn cli_invocations<'a>(cfg: &'a Value, executor_id: &str) -> (Option<&'a Value>, Vec<&'a Value>) {
    let entry = cfg
        .pointer(&format!("/executors/{executor_id}"))
        .filter(|v| !v.is_null())
        .or_else(|| cfg.get("executor"));
    let invocations = entry
        .and_then(|e| e.get("invocations"))
        .and_then(Value::as_array)
        .map(|all| {
            all.iter()
                .filter(|inv| inv.get("via").and_then(Value::as_str) == Some("cli"))
                .collect()
        })
        .unwrap_or_default();
    (entry, invocations)
}

/// The login stores a launch of `executor_id` may read, before the invocation is settled: the store key of the
/// pinned invocation when the caller pinned one, else of the executor's `cli` invocations in declaration order
/// (the first is the one an unpinned launch takes). An invocation that declares no store is keyed by its
/// command's CLI.
pub fn launch_candidate_clis(
    cfg: &Value,
    executor_id: &str,
    pinned_invocation_id: Option<&str>,
) -> Vec<String> {
    let (entry, invocations) = cli_invocations(cfg, executor_id);
    if let Some(pinned) = pinned_invocation_id {
        if let Some(inv) = invocations
            .iter()
            .find(|inv| inv.get("id").and_then(Value::as_str) == Some(pinned))
            .filter(|inv| {
                inv.get("command")
                    .is_some_and(|c| crate::planning::truthy(Some(c)))
            })
        {
            return store_key_of(inv).into_iter().collect();
        }
    }
    let keys: Vec<Option<String>> = if invocations.is_empty() {
        vec![entry.and_then(store_key_of)]
    } else {
        invocations.iter().map(|inv| store_key_of(inv)).collect()
    };
    let mut out: Vec<String> = Vec::new();
    for key in keys.into_iter().flatten().filter(|k| !k.is_empty()) {
        if !out.contains(&key) {
            out.push(key);
        }
    }
    out
}

/// The login store a launch declares: that of the pinned invocation, else of the first `cli` invocation. `None`
/// when the invocation declares none, so a launch that reads no store leases any account of its pool.
pub fn declared_store_cli(
    cfg: &Value,
    executor_id: &str,
    pinned_invocation_id: Option<&str>,
) -> Option<String> {
    let (_, invocations) = cli_invocations(cfg, executor_id);
    let invocation = match pinned_invocation_id {
        Some(pinned) => invocations
            .iter()
            .find(|inv| inv.get("id").and_then(Value::as_str) == Some(pinned)),
        None => invocations.first(),
    }?;
    credential_store_of(invocation)
        .and_then(|store| store.get("use").and_then(Value::as_str))
        .map(str::to_string)
}

/// Whether a run recorded on a lease is dead / its worker alive: `(run_id, lease_record)`.
pub type RunProbe<'a> = &'a dyn Fn(&str, &Value) -> bool;

/// What one lease asks of the attempt.
pub struct LeaseRequest<'a> {
    pub cfg: &'a Value,
    /// `compiledPlan.mechanism`, `.policy` and the executor the plan decided.
    pub mechanism: Option<&'a str>,
    pub effective_policy: &'a Value,
    pub executor_id: &'a str,
    pub pinned_invocation_id: Option<&'a str>,
    /// `launchPinOf(opts)`: the executor, pool, account and digest the binding pinned.
    pub pin: &'a Value,
    pub assignments_dir: &'a Path,
    pub assignment_id: &'a str,
    pub run_id: &'a str,
    pub run_dir: &'a Path,
    pub repo_root: &'a Path,
    pub run_is_dead: Option<RunProbe<'a>>,
    pub is_run_worker_alive: Option<RunProbe<'a>>,
    /// The unit run the attempt belongs to (else the assignment id): a quota lock is tried once per run key.
    pub run_key: &'a str,
    pub now_ms: i64,
}

/// One real call with an account's credential, under the account lock it is handed.
pub type CredentialProbe<'a> = &'a dyn Fn(&ProbeRequest<'_>, &AccountLock) -> Value;

/// The lease of one attempt: the provider it is for, the selection (`selected` or `refused`) and the redacted
/// evidence recorded for a selected one.
#[derive(Debug, Clone, PartialEq)]
pub struct Leased {
    pub provider: String,
    pub selection: Option<Value>,
    pub evidence: Option<Value>,
}

fn text<'a>(value: &'a Value, key: &str) -> Option<&'a str> {
    value
        .get(key)
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty())
}

/// Lease the account the binding named for this attempt, when the executor's provider keeps accounts (an
/// out-of-process agent executor). The lease reclaim sees only the runner that took a lease die; the Run's
/// supervisor and agent outlive it, so a lease is reclaimed once its Run's supervised attempt no longer works (the
/// `run_<assignmentId>_<NN>` id admission gives a Run maps a lease back to its run directory).
pub fn lease_account_for_attempt(
    accounts: &Accounts<'_>,
    machine: &dyn Machine,
    request: &LeaseRequest<'_>,
    probe: Option<CredentialProbe<'_>>,
) -> Result<Leased, std::io::Error> {
    let pin = request.pin;
    let cfg = request.cfg;
    let executor_id = request.executor_id;
    let bound_pool = text(pin, "pool").filter(|_| text(pin, "executor") == Some(executor_id));
    let family = || {
        let entry = cfg
            .pointer(&format!("/executors/{executor_id}"))
            .filter(|v| !v.is_null())
            .or_else(|| cfg.get("executor"));
        family_of(entry.map_or(FamilySource::None, FamilySource::Entry), None)
    };
    let provider = legacy_state_key(&match bound_pool {
        Some(pool) => pool.to_string(),
        None => text(request.effective_policy, "providerModel")
            .map(str::to_string)
            .unwrap_or_else(family),
    });
    let inventory = provider_account_inventory(cfg, machine);
    let has_accounts = inventory
        .get(&provider)
        .and_then(|p| p.get("accounts"))
        .and_then(Value::as_object)
        .is_some_and(|a| !a.is_empty());
    let is_tool = cfg
        .pointer(&format!("/executors/{executor_id}/kind"))
        .and_then(Value::as_str)
        == Some("tool");
    if request.mechanism != Some("out-of-process") || is_tool || !has_accounts {
        return Ok(Leased {
            provider,
            selection: None,
            evidence: None,
        });
    }
    let lease_cli = declared_store_cli(cfg, executor_id, request.pinned_invocation_id);
    // One real call may show a dead login was renewed, or that a quota stop whose end fgOS only guessed is over: the
    // first lease of a unit run checks the account the seat is about to use. A probe problem never blocks the
    // dispatch: the selection below decides.
    if let Some(probe) = probe {
        let candidates = launch_candidate_clis(cfg, executor_id, request.pinned_invocation_id);
        let mut call = |ask: &ProbeRequest<'_>, lock: &AccountLock| probe(ask, lock);
        let _ = accounts.probe_quarantined_accounts(
            &inventory,
            &QuarantineProbe {
                provider: &provider,
                cli: candidates.first().map(String::as_str),
                model: text(pin, "model").or_else(|| text(request.effective_policy, "model")),
                account_id: text(pin, "leaseAccount"),
                run_key: Some(request.run_key),
                now_ms: request.now_ms,
                ..Default::default()
            },
            &mut call,
        );
    }

    let assignments_dir = request.assignments_dir;
    let default_alive = |leased_run_id: &str, held: &Value| -> bool {
        let Some(assignment_id) = text(held, "assignmentId") else {
            return false;
        };
        let prefix = format!("run_{assignment_id}_");
        let Some(attempt) = leased_run_id.strip_prefix(&prefix) else {
            return false;
        };
        is_supervised_attempt_still_working(
            &assignments_dir
                .join(assignment_id)
                .join("runs")
                .join(attempt),
        )
    };
    let never_dead = |_: &str, _: &Value| false;
    let reclaim = Reclaim {
        run_is_dead: request.run_is_dead.unwrap_or(&never_dead),
        is_run_worker_alive: request.is_run_worker_alive.unwrap_or(&default_alive),
    };

    // The account is named by the binding (Seat Binding ranked it); the lease only takes it. A launch with no
    // binding names none and cannot lease.
    let selection = match text(pin, "leaseAccount") {
        Some(account_id) => {
            let ask = NamedLease {
                provider: &provider,
                account_id: Some(account_id),
                assignment_id: Some(request.assignment_id),
                run_id: request.run_id,
                cli: lease_cli.as_deref(),
                account_view_digest: text(pin, "accountViewDigest"),
                lock_wait_ms: None,
            };
            match accounts.acquire_named_account_lease(&inventory, &ask, &reclaim) {
                Ok(Some(selection)) => selection,
                Ok(None) => {
                    return Ok(Leased {
                        provider,
                        selection: None,
                        evidence: None,
                    })
                }
                Err(err) => json!({
                    "status": "refused",
                    "provider": provider,
                    "reason": if err.code() == Some("provider-capacity-lock-stale") { "provider-capacity.lock-stale" } else { "provider-capacity.acquire-failed" },
                    "cause": err.to_string(),
                }),
            }
        }
        None => json!({
            "status": "refused",
            "provider": provider,
            "reason": "provider-capacity.no-named-account",
            "detail": "the launch names no account to lease (it carries no binding)",
        }),
    };
    if selection.get("status").and_then(Value::as_str) != Some("selected") {
        return Ok(Leased {
            provider,
            selection: Some(selection),
            evidence: None,
        });
    }

    let mut evidence = match redact_selection(&selection) {
        Value::Object(map) => map,
        _ => Map::new(),
    };
    evidence.insert("credentialProvisioned".into(), json!(false));
    let evidence = Value::Object(evidence);
    write_pretty(
        &request.run_dir.join("provider-capacity-selection.json"),
        &evidence,
    )?;
    // run.json only points at the selection file: a run.json that cannot be read or written costs the pointer.
    let run_json = request.run_dir.join("run.json");
    if let Some(mut record) = std::fs::read_to_string(&run_json)
        .ok()
        .and_then(|raw| serde_json::from_str::<Value>(&raw).ok())
    {
        let relative = request
            .run_dir
            .join("provider-capacity-selection.json")
            .strip_prefix(request.repo_root)
            .map(|p| p.to_string_lossy().into_owned())
            .unwrap_or_else(|_| "provider-capacity-selection.json".into());
        record["providerCapacitySelectionPath"] = json!(relative);
        let _ = write_pretty(&run_json, &record);
    }
    Ok(Leased {
        provider,
        selection: Some(selection),
        evidence: Some(evidence),
    })
}

/// A JSON file with a trailing newline, replaced durably.
pub fn write_pretty(path: &Path, value: &Value) -> std::io::Result<()> {
    let (Some(dir), Some(name)) = (path.parent(), path.file_name().and_then(|n| n.to_str())) else {
        return Err(std::io::Error::other("a file path is required"));
    };
    let body = format!(
        "{}\n",
        serde_json::to_string_pretty(value).unwrap_or_default()
    );
    fgos_durable_file::replace_durably(dir, name, body.as_bytes())
        .map(|_| ())
        .map_err(|e| e.source)
}

/// A renewal of a leased login that is close to expiry.
pub struct RenewAsk<'a> {
    pub provider: &'a str,
    pub account_id: &'a str,
    pub credential_source: &'a Value,
    pub runtime_dir: &'a Path,
    /// How long the seat the login is copied into may run: the renewal window covers it, so a login that cannot
    /// outlive the seat is renewed before the seat's life check.
    pub seat_timeout_ms: u64,
}

/// The caller's opt-in to renewing a login ahead of its expiry: one renewal in a copy fgOS holds, applied to the
/// account's real store before the private home is copied from it, so no pane renews in a throwaway copy and uses up
/// the source's single-use refresh token. The renewal reads the live seat homes of the account itself (a seat still
/// running on it may hold the only good login).
pub trait CredentialRenewal {
    /// `{ status, reason }` of the renewal; `None` when it answered nothing.
    fn renew(&self, ask: &RenewAsk<'_>) -> Result<Option<Value>, String>;
}

fn is_confined(entry: Option<&Value>) -> bool {
    entry
        .and_then(|e| e.get("confinement"))
        .and_then(Value::as_object)
        .is_some_and(|c| !c.is_empty())
}

/// The lease as the launch carries it. Opted in with a renewal, a login close to expiry is renewed once; the lease
/// then carries the write-back opt-in, so a home whose login a pane renewed anyway is offered back to the source.
/// Only a confined launch copies a login, and which invocation is confined is settled later, so any executor that
/// can be confined (by posture, executor config or a confined invocation) counts. The renewal is given the seat's
/// timeout (`timeout_ms`, the default one when none is named), and each store's outcome (`refreshAhead`: cli, status
/// and reason, never a credential) rides on the lease, so a life-check refusal names it. Renewal never blocks the
/// dispatch.
#[allow(clippy::too_many_arguments)]
pub fn renew_leased_login(
    selection: &Value,
    renewal: Option<&dyn CredentialRenewal>,
    cfg: &Value,
    executor_id: &str,
    pinned_invocation_id: Option<&str>,
    confinement_mode: Option<&str>,
    runtime_dir: Option<&Path>,
    timeout_ms: Option<u64>,
) -> Value {
    let launch_executor = cfg
        .pointer(&format!("/executors/{executor_id}"))
        .filter(|v| !v.is_null())
        .or_else(|| cfg.get("executor"));
    let may_copy_credential = confinement_mode != Some("unconfined")
        || is_confined(launch_executor)
        || launch_executor
            .and_then(|e| e.get("invocations"))
            .and_then(Value::as_array)
            .is_some_and(|all| all.iter().any(|inv| is_confined(Some(inv))));
    let Some(renewal) = renewal.filter(|_| {
        selection.get("status").and_then(Value::as_str) == Some("selected") && may_copy_credential
    }) else {
        return selection.clone();
    };
    let default_dir = crate::accounts::host::default_runtime_dir();
    let credential_runtime_dir = runtime_dir
        .map(Path::to_path_buf)
        .or(default_dir)
        .unwrap_or_default();
    // An account with one login store per CLI renews the store of each CLI this launch may still run.
    let sources: Vec<&Value> = if selection
        .get("credentialSources")
        .is_some_and(|s| !s.is_null())
    {
        launch_candidate_clis(cfg, executor_id, pinned_invocation_id)
            .iter()
            .filter_map(|cli| credential_source_for_cli(selection, Some(cli)))
            .collect()
    } else {
        selection.get("credentialSource").into_iter().collect()
    };
    let provider = selection
        .get("provider")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let account_id = selection
        .get("accountId")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let seat_timeout_ms = timeout_ms
        .filter(|t| *t > 0)
        .unwrap_or(crate::confinement::policy::DEFAULT_SEAT_TIMEOUT_MS);
    let mut outcomes = Vec::new();
    for source in sources {
        let outcome = renewal.renew(&RenewAsk {
            provider,
            account_id,
            credential_source: source,
            runtime_dir: &credential_runtime_dir,
            seat_timeout_ms,
        });
        let cli = source.get("cli").cloned().unwrap_or(Value::Null);
        match &outcome {
            Ok(Some(renewed)) => outcomes.push(json!({
                "cli": cli,
                "status": renewed.get("status").cloned().unwrap_or(Value::Null),
                "reason": renewed.get("reason").cloned().unwrap_or(Value::Null),
            })),
            Ok(None) => {}
            Err(_) => outcomes
                .push(json!({ "cli": cli, "status": "failed", "reason": "unexpected-error" })),
        }
        // Anything but "nothing was due" is visible, so a renewal that keeps failing is not mistaken for success; a
        // renewal that throws lets the launch go on with the login as it is.
        if let Ok(Some(renewed)) = outcome {
            let status = renewed.get("status").and_then(Value::as_str);
            let reason = renewed.get("reason").and_then(Value::as_str);
            let quiet = status == Some("fresh")
                || (status == Some("skipped") && reason == Some("unsupported-layout"));
            if !quiet {
                let store = source
                    .get("cli")
                    .and_then(Value::as_str)
                    .map(|cli| format!(" ({cli})"))
                    .unwrap_or_default();
                eprintln!(
                    "fgos: credential refresh-ahead for {provider}/{account_id}{store}: {} ({})",
                    status.unwrap_or("undefined"),
                    reason.unwrap_or("undefined")
                );
            }
        }
    }
    let mut out = selection.clone();
    out["credentialWriteBack"] = json!({ "runtimeDir": credential_runtime_dir });
    out["refreshAhead"] = Value::Array(outcomes);
    out
}
