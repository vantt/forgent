//! Why a seat lands where it does, read-only (nothing leased, spawned or written): the binding, the crate's ranked
//! candidates and explanation, and the walk a failure would take, one binding per step; and `fgos dispatch explain`,
//! which lays those pieces out beside the config that produced them. The answers are those of
//! `packages/execution/contracts/bind.v1.json`.

use crate::accounts::{
    has_store_for, legacy_state_key, provider_account_inventory, read_llm_accounts,
};
use crate::bind::{bind_step, binding_identity, BindRequest, BindSession};
use crate::executor_model::{
    array_of, credential_store_of, executors_of, family_of, present, str_of, FamilySource,
    ModelError, NULL,
};
use crate::ports::Machine;
use serde_json::{json, Map, Value};

/// A seat explained: its binding (or `{ refused }`), the crate's answer, the launch view, and the walk.
pub struct SeatExplanation {
    pub binding: Value,
    /// The crate's whole answer (`policy`, `ranked`, `explain`, ...); `None` when refused before the crate.
    pub output: Option<Value>,
    pub launch_view: Option<Value>,
    /// The bindings a seat takes when each one fails, first to last; empty when the seat is refused.
    pub walk: Vec<Value>,
}

/// The binding of a seat and the walk its failures would take: each step binds again with every binding before it
/// tried, until a step is refused or names a candidate already on the walk.
pub fn explain_seat(
    request: &BindRequest<'_>,
    machine: &dyn Machine,
    now: u64,
) -> Result<SeatExplanation, ModelError> {
    let first = bind_step(request, machine, now)?;
    let mut walk: Vec<Value> = Vec::new();
    let mut seen: Vec<String> = Vec::new();
    let mut current = first.binding.clone();
    while current.get("refused").is_none() && !seen.contains(&binding_identity(&current)) {
        seen.push(binding_identity(&current));
        walk.push(current);
        let mut tried: Vec<Value> = array_of(request.walk, "tried").to_vec();
        tried.extend(walk.iter().cloned());
        let mut next_walk = request.walk.as_object().cloned().unwrap_or_default();
        next_walk.insert("tried".into(), Value::Array(tried));
        let next_walk = Value::Object(next_walk);
        current = bind_step(
            &BindRequest {
                walk: &next_walk,
                ..*request
            },
            machine,
            now,
        )?
        .binding;
    }
    Ok(SeatExplanation {
        binding: first.binding,
        output: first.output,
        launch_view: first.launch_view,
        walk,
    })
}

/// The login store the bound invocation declares, marked as declared; null when the invocation is not named or
/// declares none.
fn store_of_binding(entry: &Value, invocation: Option<&str>) -> Value {
    let found = invocation.filter(|id| !id.is_empty()).and_then(|id| {
        array_of(entry, "invocations")
            .iter()
            .find(|inv| str_of(inv, "id") == Some(id))
    });
    match found.and_then(credential_store_of) {
        Some(Value::Object(store)) => {
            let mut store = store.clone();
            store.insert("source".into(), json!("declared"));
            Value::Object(store)
        }
        _ => Value::Null,
    }
}

/// The accounts of `pool` in the order the lease takes them, each with whether the CLI `cli` can run on it, and
/// what is wrong with the pool's declaration.
fn accounts_of(runner: &Value, pool: &str, cli: Option<&str>, machine: &dyn Machine) -> Value {
    let key = legacy_state_key(pool);
    let mut problems: Vec<Value> = Vec::new();
    let accounts = match provider_account_inventory(runner, machine) {
        Ok(inventory) => inventory
            .get(&key)
            .and_then(|provider| provider.get("accounts"))
            .and_then(Value::as_object)
            .cloned()
            .unwrap_or_default(),
        Err(error) => {
            problems.push(json!({ "code": "inventory-invalid", "at": "runner.providers", "detail": error.message }));
            Map::new()
        }
    };
    let declared = runner
        .get("llmAccounts")
        .is_some_and(|accounts| accounts.get(pool).is_some());
    let own = format!("runner.llmAccounts.{pool}");
    problems.extend(
        read_llm_accounts(runner, machine)
            .problems
            .into_iter()
            .filter(|problem| problem.at.starts_with(&own) || problem.at == "runner.llmAccounts")
            .map(|problem| json!(problem)),
    );
    let accounts: Vec<Value> = accounts
        .iter()
        .map(|(id, account)| {
            let reason = if account.get("disabled") == Some(&json!(true)) {
                Some("disabled".to_string())
            } else {
                cli.filter(|cli| !has_store_for(account, Some(cli)))
                    .map(|cli| format!("no \"{cli}\" login store"))
            };
            let mut out = json!({ "id": id, "usable": reason.is_none() });
            if let Some(reason) = reason {
                out["reason"] = json!(reason);
            }
            out
        })
        .collect();
    json!({
        "pool": pool,
        "stateKey": key,
        "source": if declared { "llmAccounts" } else { "providers" },
        "accounts": accounts,
        "problems": problems,
    })
}

fn or_null(value: &Value, key: &str) -> Value {
    present(value, key).cloned().unwrap_or(Value::Null)
}

/// The family of an executor of the config, as an entry names it; null when the config has no such executor.
fn entry_family(runner: &Value, executor: Option<&str>) -> Value {
    executor
        .and_then(|id| executors_of(runner)?.get(id))
        .map_or(Value::Null, |entry| {
            json!(family_of(FamilySource::from_json(Some(entry)), None))
        })
}

/// `fgos dispatch explain`: why a capability lands where it does. It binds the capability's producer seat exactly
/// as a run would and lays the pieces out: the candidates with the reason one is out, the cell entries of the bound
/// executor, the walk, the crate's explanation, and the accounts of every pool on the walk in lease order.
pub fn explain_capability(
    runner: &Value,
    capability: &str,
    rigor: Option<&str>,
    session: &BindSession,
    machine: &dyn Machine,
    now: u64,
) -> Result<Value, ModelError> {
    if capability.is_empty() {
        return Err(ModelError::of_class(
            "Error",
            None,
            "dispatch explain requires --for <capability>".into(),
        ));
    }
    let mut unit = json!({ "id": "explain", "capability": capability, "writes": [] });
    if let Some(rigor) = rigor {
        unit["rigor"] = json!(rigor);
    }
    let ask = json!({ "unit": unit, "role": "producer" });
    let seat = explain_seat(
        &BindRequest {
            ask: &ask,
            runner,
            session: *session,
            walk: &NULL,
            account_state: None,
        },
        machine,
        now,
    )?;
    let ask = json!({
        "capability": capability,
        "rigor": rigor,
        "session": { "herdrPresent": machine.herdr_present() },
    });
    let output = seat.output.unwrap_or(Value::Null);
    let explanation = output
        .get("explain")
        .and_then(|explain| explain.get("lines"))
        .cloned()
        .unwrap_or(json!([]));
    let binding = &seat.binding;
    if let Some(refused) = binding.get("refused") {
        return Ok(json!({ "ask": ask, "refused": refused, "explanation": explanation }));
    }

    let executor = str_of(binding, "executor");
    let entry = executor
        .and_then(|id| executors_of(runner)?.get(id))
        .unwrap_or(&NULL);
    let family = entry_family(runner, executor);
    let provenance = &binding["provenance"];
    let source = |part: &str| or_null(&provenance[part], "source");
    let store = |executor: Option<&str>, invocation: Option<&str>| {
        let entry = executor
            .and_then(|id| executors_of(runner)?.get(id))
            .unwrap_or(&NULL);
        store_of_binding(entry, invocation)
    };
    let ranked = &output["ranked"];
    let mut candidates: Vec<Value> = array_of(ranked, "candidates")
        .iter()
        .map(|c| {
            json!({ "family": c["family"], "executor": c["executor"], "invocation": or_null(c, "invocation"),
                    "pool": or_null(c, "pool"), "model": or_null(c, "model"), "state": "in" })
        })
        .collect();
    candidates.extend(
        array_of(ranked, "skipped")
            .iter()
            .filter(|c| str_of(c, "family").is_some_and(|f| !f.is_empty()))
            .map(|c| {
                json!({ "family": c["family"], "executor": c["executor"], "invocation": null, "pool": or_null(c, "pool"),
                        "model": or_null(c, "model"), "state": "out", "reason": c["reason"], "detail": c["detail"] })
            }),
    );
    // The entries of the bound executor's cell at the tier it ran at, in cell order, each used, kept for the walk,
    // or out for the reason the crate gave.
    let cell_entries: Vec<Value> = if binding["pool"].is_null() {
        Vec::new()
    } else {
        family
            .as_str()
            .and_then(|family| output["policy"]["cells"].get(family))
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .map(|cell| {
                let model = cell["model"].clone();
                let pool = present(cell, "pool")
                    .cloned()
                    .unwrap_or_else(|| family.clone());
                let found = candidates.iter().find(|c| {
                    c["executor"] == binding["executor"] && c["model"] == model && c["pool"] == pool
                });
                let out = found.is_some_and(|c| c["state"] == "out");
                let status = if model == binding["model"] && pool == binding["pool"] {
                    "used"
                } else if out {
                    "unusable"
                } else {
                    "fallback"
                };
                let mut entry = json!({ "model": model, "pool": pool, "status": status });
                if out {
                    entry["reason"] = found.map_or(Value::Null, |c| c["detail"].clone());
                }
                entry
            })
            .collect()
    };
    let mut pools: Vec<(String, Option<String>)> = Vec::new();
    for step in seat.walk.iter() {
        let Some(pool) = str_of(step, "pool").filter(|p| !p.is_empty()) else {
            continue;
        };
        let cli = store(str_of(step, "executor"), str_of(step, "invocation"))
            .get("use")
            .and_then(Value::as_str)
            .map(str::to_string);
        match pools.iter_mut().find(|(known, _)| known == pool) {
            Some(known) => known.1 = cli,
            None => pools.push((pool.to_string(), cli)),
        }
    }
    let walk: Vec<Value> = seat
        .walk
        .iter()
        .enumerate()
        .map(|(position, step)| {
            let executor = str_of(step, "executor");
            let empty = json!({});
            let step_entry = executor
                .and_then(|id| executors_of(runner)?.get(id))
                .unwrap_or(&empty);
            let step_family = family_of(FamilySource::Entry(step_entry), None);
            json!({
                "position": position,
                "family": step_family,
                "executor": step["executor"],
                "invocation": step["invocation"],
                "pool": step["pool"],
                "model": step["model"],
                "store": store(executor, str_of(step, "invocation")).get("use").cloned().unwrap_or(Value::Null),
            })
        })
        .collect();
    let accounts: Vec<Value> = pools
        .iter()
        .map(|(pool, cli)| accounts_of(runner, pool, cli.as_deref(), machine))
        .collect();

    Ok(json!({
        "ask": ask,
        "family": family,
        "executor": { "id": binding["executor"], "source": source("executor") },
        "invocation": binding["invocation"],
        "credentialStore": store_of_binding(entry, str_of(binding, "invocation")),
        "transport": binding["transport"],
        "tier": {
            "value": binding["tier"],
            "source": source("tier"),
            "definition": or_null(&output["policy"], "definition"),
            "recommendation": or_null(&provenance["tier"], "recommendation"),
            "loweredFrom": or_null(&provenance["tier"], "loweredFrom"),
            "maxTier": or_null(&provenance["tier"], "maxTier"),
        },
        "model": { "value": binding["model"], "source": source("model") },
        "effort": { "value": binding["reasoningEffort"], "source": source("reasoningEffort") },
        "pool": binding["pool"],
        "cell": { "entries": cell_entries },
        "candidates": candidates,
        "walk": walk,
        "accounts": accounts,
        "explanation": explanation,
    }))
}
