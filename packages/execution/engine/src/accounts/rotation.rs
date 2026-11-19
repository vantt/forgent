//! May a failed seat run again on another account of the same pool, and what a retried walk resumes from.
//! The answer comes from the same inventory and quarantine state the lease ranks from, never a second ranking.

use fgos_execution::accounts::legacy_state_key;
use serde_json::{json, Map, Value};

use super::state::Accounts;

/// What an account rotation in `pool` has to work with.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Rotation {
    pub pool: String,
    pub total: usize,
    pub healthy: usize,
}

/// What rotation in `pool` has to work with, read after the failed attempt was settled. `None` when the pool has
/// no enabled account (nothing to rotate).
pub fn inspect_account_rotation(
    accounts: &Accounts,
    inventory: &Map<String, Value>,
    pool: &str,
) -> Option<Rotation> {
    let key = legacy_state_key(pool);
    let view = accounts.inspect_provider_capacity(inventory, Some(&key), None);
    let list: Vec<&Value> = view["providers"][&key]["accounts"]
        .as_object()
        .into_iter()
        .flat_map(Map::values)
        .filter(|a| a.get("disabled") != Some(&json!(true)))
        .collect();
    (!list.is_empty()).then(|| Rotation {
        pool: pool.to_string(),
        total: list.len(),
        healthy: list.iter().filter(|a| a["healthy"] == json!(true)).count(),
    })
}

/// Whether the seat may retry the same candidate now: another usable account exists, and the retries already
/// spent on this candidate stay below the number of accounts it has.
pub fn may_rotate_account(rotation: Option<&Rotation>, rotations_spent: usize) -> bool {
    rotation.is_some_and(|r| r.healthy > 0 && rotations_spent + 1 < r.total)
}

/// What names one candidate of a seat's walk: executor, invocation, pool, model and effort.
pub fn binding_identity(binding: &Value) -> String {
    ["executor", "invocation", "pool", "model", "reasoningEffort"]
        .iter()
        .map(|key| match binding.get(*key) {
            None | Some(Value::Null) => String::new(),
            Some(Value::String(text)) => text.clone(),
            Some(other) => other.to_string(),
        })
        .collect::<Vec<_>>()
        .join("\u{0}")
}

fn attempts_of<'a>(unit: &'a Value, key: &str) -> Option<&'a Vec<Value>> {
    unit.get("bindings")?.get(key)?.as_array()
}

/// The seat's earlier bindings a walk resumes from when attempt `at` is bound: every binding recorded before it,
/// oldest first. A binding recorded before bindings carried a pool, an attempt that never launched, and the
/// attempts a retry on another account of the same candidate repeats are left out.
pub fn tried_bindings_of(attempts: &[Value], at: usize) -> Vec<Value> {
    if at == 0 {
        return Vec::new();
    }
    let own = attempts
        .get(at)
        .and_then(|a| a.get("binding"))
        .filter(|b| !b.is_null())
        .map(binding_identity);
    attempts[..at.min(attempts.len())]
        .iter()
        .filter(|a| a.get("leaseConflict") != Some(&json!(true)))
        .filter_map(|a| a.get("binding"))
        .filter(|b| {
            b.as_object().is_some_and(|o| o.contains_key("pool"))
                && Some(binding_identity(b)) != own
        })
        .cloned()
        .collect()
}

/// The accounts a seat's earlier attempts failed on (a provider limit, or a lease that could not be taken): a bind
/// that goes on from them never names one of these again. `[{pool, account}]`, first occurrence first.
pub fn failed_accounts_of(attempts: &[Value]) -> Vec<Value> {
    let mut seen: Vec<(String, String)> = Vec::new();
    for attempt in attempts {
        let binding = attempt.get("binding");
        let pool = binding
            .and_then(|b| b.get("pool"))
            .and_then(Value::as_str)
            .filter(|p| !p.is_empty());
        let account = binding
            .and_then(|b| b.get("leaseAccount"))
            .and_then(Value::as_str)
            .filter(|a| !a.is_empty());
        let (Some(pool), Some(account)) = (pool, account) else {
            continue;
        };
        let outcome = attempt.get("outcome").and_then(Value::as_str);
        if outcome != Some("provider-limit") && attempt.get("leaseConflict") != Some(&json!(true)) {
            continue;
        }
        if !seen.iter().any(|(p, a)| p == pool && a == account) {
            seen.push((pool.to_string(), account.to_string()));
        }
    }
    seen.into_iter()
        .map(|(pool, account)| json!({ "pool": pool, "account": account }))
        .collect()
}

/// The binding a seat keeps into round `round`: the last binding the unit recorded for the same seat in its latest
/// earlier round; `None` in its first round.
pub fn kept_binding_of(unit: &Value, seat: &str, round: f64) -> Option<Value> {
    let mut latest: Option<(f64, Value)> = None;
    for (key, attempts) in unit
        .get("bindings")
        .and_then(Value::as_object)
        .into_iter()
        .flatten()
    {
        let Some(slash) = key.rfind('/') else {
            continue;
        };
        let (key_seat, key_round) = (&key[..slash], key[slash + 1..].parse::<f64>().ok());
        let Some(key_round) = key_round.filter(|r| {
            r.is_finite()
                && !matches!(
                    r.partial_cmp(&round),
                    Some(std::cmp::Ordering::Greater | std::cmp::Ordering::Equal)
                )
        }) else {
            continue;
        };
        let Some(binding) = attempts
            .as_array()
            .and_then(|a| a.last())
            .and_then(|a| a.get("binding"))
            .filter(|b| truthy(b))
        else {
            continue;
        };
        if key_seat != seat || binding.get("refused").is_some_and(truthy) {
            continue;
        }
        if latest.as_ref().is_none_or(|(r, _)| key_round > *r) {
            latest = Some((key_round, binding.clone()));
        }
    }
    latest.map(|(_, binding)| binding)
}

fn truthy(value: &Value) -> bool {
    !(value.is_null() || *value == json!(false) || *value == json!("") || *value == json!(0))
}

/// Pools whose login failed in this unit and that a seat then walked away from. `bound_before` (epoch ms) keeps
/// only walks made no later than that instant.
pub fn credential_fault_pools(unit: &Value, bound_before: Option<i64>) -> Vec<String> {
    let mut pools: Vec<String> = Vec::new();
    for attempts in unit
        .get("bindings")
        .and_then(Value::as_object)
        .into_iter()
        .flat_map(Map::values)
    {
        let Some(attempts) = attempts.as_array() else {
            continue;
        };
        for (index, attempt) in attempts.iter().enumerate() {
            let walked = attempts.get(index + 1);
            let pool = attempt
                .get("binding")
                .and_then(|b| b.get("pool"))
                .and_then(Value::as_str)
                .filter(|p| !p.is_empty());
            let walked_next = walked
                .and_then(|w| w.get("fallbackFrom"))
                .and_then(|f| f.get("kind"))
                .and_then(Value::as_str)
                == Some("next-candidate");
            let (Some(pool), true) = (
                pool,
                attempt.get("failureCause").and_then(Value::as_str) == Some("credential")
                    && walked_next,
            ) else {
                continue;
            };
            if let Some(limit) = bound_before {
                let bound = walked
                    .and_then(|w| w.get("boundAt"))
                    .and_then(Value::as_str)
                    .and_then(super::time::ms_from_iso);
                if !bound.is_some_and(|at| at <= limit) {
                    continue;
                }
            }
            if !pools.iter().any(|p| p == pool) {
                pools.push(pool.to_string());
            }
        }
    }
    pools
}

/// The walk state a recomputed binding of one recorded attempt needs, read from the attempt chain the runner
/// persisted in `unit.json`: `{ tried, failedAccounts, excludePools, continuity? }`.
pub fn walk_state_of(unit: &Value, seat: &str, round: &str, assignment_id: &str) -> Value {
    let attempts = attempts_of(unit, &format!("{seat}/{round}"));
    let at = attempts.and_then(|a| {
        a.iter()
            .position(|x| x.get("assignmentId").and_then(Value::as_str) == Some(assignment_id))
    });
    let bound_at = at
        .and_then(|i| attempts?.get(i)?.get("boundAt")?.as_str())
        .and_then(super::time::ms_from_iso);
    let kept = kept_binding_of(unit, seat, round.parse::<f64>().unwrap_or(f64::NAN));
    let index = at.unwrap_or(usize::MAX);
    // An attempt not found sits at -1 in the recorded chain: nothing was tried before it.
    let tried = attempts.map_or_else(Vec::new, |a| {
        if at.is_some() {
            tried_bindings_of(a, index)
        } else {
            Vec::new()
        }
    });
    let failed = attempts.map_or_else(Vec::new, |a| match at {
        Some(i) if i > 0 => failed_accounts_of(&a[..i]),
        _ => Vec::new(),
    });
    let mut out = json!({
        "tried": tried,
        "failedAccounts": failed,
        "excludePools": credential_fault_pools(unit, Some(bound_at.unwrap_or(i64::MIN))),
    });
    if let Some(kept) = kept {
        out["continuity"] = kept;
    }
    out
}
