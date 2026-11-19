//! What a seat does after an attempt that ended on a provider limit, or whose brief surely never reached its agent.
//! Pure: the run loop performs the answer. Ported from `answerProviderLimit` (`runner/execution/run.mjs`); the
//! account facts (`failed_accounts_of`, `tried_bindings_of`, `may_rotate_account`) are `accounts::rotation`'s.
//!
//! - A lease that could not take the named account (nothing ran): `{ rebind }` from a fresh account view, unless the
//!   account was pinned or lost more than [`MAX_LEASE_CONFLICTS`] times in a row (`{ stop }`).
//! - A writing seat that changed the worktree (`changed`) is never run again on top of that work.
//! - A lost brief: `{ rebind }` on the same candidate, at most [`MAX_BRIEF_RETRIES`] times per round.
//! - A pinned account is never answered with another account or executor.
//! - Else `{ walk }`: another account of the same candidate first (`rotation`), then the next candidate (`step`);
//!   `faultPool` names a pool whose login failed.

use serde_json::{json, Map, Value};

use crate::accounts::rotation::{
    failed_accounts_of, may_rotate_account, tried_bindings_of, Rotation,
};
use crate::run_result::vocabulary::LEASE_CONFLICT_FAILURE_CODE;

/// How many times in a row a seat's named account may be taken from it before the seat is refused.
pub const MAX_LEASE_CONFLICTS: usize = 8;
/// How many times a seat whose brief never reached its agent is launched again on the same candidate.
pub const MAX_BRIEF_RETRIES: usize = 1;

/// Whether an attempt ended because the lease refused the account Seat Binding named (nothing ran).
pub fn is_lease_conflict(run_result: Option<&Value>) -> bool {
    run_result
        .and_then(|r| r.pointer("/classification/failure/code"))
        .and_then(Value::as_str)
        == Some(LEASE_CONFLICT_FAILURE_CODE)
}

/// The fields of `value` named by `keys` that it has, in that order (a JavaScript `{ a: v.a, ... }` whose
/// undefined members a JSON write drops).
pub fn present(value: &Value, keys: &[&str]) -> Value {
    let mut out = Map::new();
    for key in keys {
        if let Some(v) = value.get(*key) {
            out.insert((*key).to_string(), v.clone());
        }
    }
    Value::Object(out)
}

/// What a binding launched from: its executor, invocation and transport.
pub fn launched_from(bound: &Value) -> Value {
    present(bound, &["executor", "invocation", "transport"])
}

fn truthy(value: Option<&Value>) -> bool {
    match value {
        None | Some(Value::Null) => false,
        Some(Value::Bool(b)) => *b,
        Some(Value::String(s)) => !s.is_empty(),
        Some(Value::Number(n)) => n.as_f64().is_some_and(|f| f != 0.0),
        Some(_) => true,
    }
}

fn js_text(value: Option<&Value>) -> String {
    match value {
        None => "undefined".into(),
        Some(Value::String(s)) => s.clone(),
        Some(Value::Null) => "null".into(),
        Some(other) => other.to_string(),
    }
}

fn merge(into: &mut Map<String, Value>, from: &Value) {
    if let Some(object) = from.as_object() {
        for (k, v) in object {
            into.insert(k.clone(), v.clone());
        }
    }
}

/// What the loop knows when it asks.
pub struct LimitAsk<'a> {
    /// The seat result of the attempt (its `runResult` carries the classification).
    pub result: &'a Value,
    /// The binding the attempt launched on.
    pub bound: &'a Value,
    /// The seat's attempts of this round.
    pub attempts: &'a [Value],
    pub attempt_no: usize,
    pub brief_not_delivered: bool,
    /// What rotation in the binding's pool has to work with (`inspect_account_rotation`).
    pub rotation: Option<&'a Rotation>,
    /// What the writing seat changed since its launch: `{ paths, headMoved }` or `{ error }`.
    pub changed: Option<&'a Value>,
}

/// The answer: `{ stop: { refused?, fallbackExhausted?, retryStopped? } }`, `{ rebind }` or
/// `{ walk: { rotation?, step, faultPool?, accountRotations? } }`, as Node's object.
pub fn answer_provider_limit(ask: &LimitAsk<'_>) -> Value {
    let bound = ask.bound;
    let from = launched_from(bound);
    let pinned_account = truthy(bound.get("account")).then(|| {
        format!(
            "{}/{}",
            js_text(bound.pointer("/account/pool")),
            js_text(bound.pointer("/account/id"))
        )
    });
    if is_lease_conflict(ask.result.get("runResult")) {
        if let Some(pinned) = &pinned_account {
            return json!({ "stop": { "fallbackExhausted": {
                "from": from, "reason": "account-pinned",
                "detail": format!("account \"{pinned}\" was pinned, but it cannot be leased now; pin another account or wait for this one"),
            } } });
        }
        let conflicts = ask
            .attempts
            .iter()
            .filter(|a| a.get("leaseConflict") == Some(&json!(true)))
            .count();
        if conflicts > MAX_LEASE_CONFLICTS {
            return json!({ "stop": { "refused": {
                "reason": "lease-conflict",
                "detail": format!("the seat's account could not be leased {} times in a row", MAX_LEASE_CONFLICTS + 1),
            } } });
        }
        return json!({ "rebind": { "from": bound, "reason": "lease-conflict", "failedAccounts": failed_accounts_of(ask.attempts) } });
    }
    let mut rotations_spent = 0usize;
    let mut at = ask.attempt_no;
    while at > 0
        && ask
            .attempts
            .get(at)
            .and_then(|a| a.pointer("/fallbackFrom/kind"))
            .and_then(Value::as_str)
            == Some("account-rotation")
    {
        rotations_spent += 1;
        at -= 1;
    }
    let account_rotations = if rotations_spent > 0 {
        json!({ "accountRotations": rotations_spent })
    } else {
        json!({})
    };
    let stop = |reason: &str, detail: String, extra: Value| {
        let mut retry = Map::new();
        retry.insert("reason".into(), json!(reason));
        merge(&mut retry, &extra);
        let mut exhausted = Map::new();
        exhausted.insert("from".into(), from.clone());
        exhausted.insert("reason".into(), json!(reason));
        exhausted.insert("detail".into(), json!(detail));
        merge(&mut exhausted, &extra);
        merge(&mut exhausted, &account_rotations);
        json!({ "stop": { "retryStopped": retry, "fallbackExhausted": exhausted } })
    };
    let lost_briefs = ask
        .attempts
        .iter()
        .filter(|a| a.get("briefNotDelivered") == Some(&json!(true)))
        .count();
    if ask.brief_not_delivered && lost_briefs > MAX_BRIEF_RETRIES {
        return json!({ "stop": { "fallbackExhausted": {
            "from": from, "reason": "brief-not-delivered",
            "detail": format!("the agent never received its brief in {} launches in a row", MAX_BRIEF_RETRIES + 1),
        } } });
    }
    let pinned = pinned_account
        .as_ref()
        .map_or_else(|| json!({}), |p| json!({ "accountPinned": p }));
    let ending = if ask.brief_not_delivered {
        "its brief was lost"
    } else {
        "its provider limit"
    };
    if let Some(changed) = ask.changed {
        if let Some(error) = changed.get("error") {
            let mut extra = json!({ "paths": [] });
            merge(extra.as_object_mut().expect("object"), &pinned);
            return stop(
                "partial-writes",
                format!(
                    "could not tell whether the seat changed the worktree ({}), so it is not run again by itself",
                    js_text(Some(error))
                ),
                extra,
            );
        }
        let paths: Vec<String> = changed
            .get("paths")
            .and_then(Value::as_array)
            .map(|a| a.iter().map(|p| js_text(Some(p))).collect())
            .unwrap_or_default();
        let head_moved = truthy(changed.get("headMoved"));
        if !paths.is_empty() || head_moved {
            let what: Vec<String> = [
                paths.join(", "),
                if head_moved {
                    "HEAD moved".into()
                } else {
                    String::new()
                },
            ]
            .into_iter()
            .filter(|s| !s.is_empty())
            .collect();
            let mut extra = Map::new();
            extra.insert(
                "paths".into(),
                changed.get("paths").cloned().unwrap_or_else(|| json!([])),
            );
            if let Some(moved) = changed.get("headMoved") {
                extra.insert("headMoved".into(), moved.clone());
            }
            merge(&mut extra, &pinned);
            return stop(
                "partial-writes",
                format!(
                    "the seat changed the worktree before {ending} ({}); it is not run again on top of that work: keep, finish or undo the changes, then resume",
                    what.join("; ")
                ),
                Value::Object(extra),
            );
        }
    }
    if ask.brief_not_delivered {
        return json!({ "rebind": { "continuity": bound, "from": bound, "reason": "brief-not-delivered" } });
    }
    if let Some(pinned) = &pinned_account {
        return stop(
            "account-pinned",
            format!("account \"{pinned}\" was pinned, so the seat is not moved to another account or executor; pin another account or wait for this one"),
            json!({}),
        );
    }
    let credential_fault = ask
        .result
        .pointer("/runResult/classification/failure/cause")
        .and_then(Value::as_str)
        == Some("credential");
    let mut walk = Map::new();
    if may_rotate_account(ask.rotation, rotations_spent) {
        walk.insert(
            "rotation".into(),
            json!({
                "continuity": bound, "from": bound, "rotation": true,
                "failedAccounts": failed_accounts_of(ask.attempts),
                "detail": { "accountsHealthy": ask.rotation.map(|r| r.healthy) },
            }),
        );
    }
    walk.insert(
        "step".into(),
        json!({ "from": bound, "tried": tried_bindings_of(ask.attempts, ask.attempt_no + 1) }),
    );
    if credential_fault && truthy(bound.get("pool")) {
        walk.insert("faultPool".into(), bound["pool"].clone());
    }
    merge(&mut walk, &account_rotations);
    json!({ "walk": walk })
}
