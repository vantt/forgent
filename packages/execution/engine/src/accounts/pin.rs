//! A person may pin the account a seat runs on, written `pool/account`. A pin never bypasses the lease: the
//! dispatch still leases from an inventory narrowed to the one account, so a quarantine, the lease record and
//! governance all apply exactly as for an unpinned seat.

use fgos_execution::accounts::legacy_state_key;
use serde_json::{json, Map, Value};

/// `{pool, id}` of a pinned account.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AccountPin {
    pub pool: String,
    pub id: String,
}

/// A pin the seat refuses, with the reason code and the wording to show.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PinRefused {
    pub reason: &'static str,
    pub detail: String,
}

/// Split `pool/account` at the first `/`. A bare id names no pool and is refused with the form to write.
pub fn parse_account_pin(value: &str) -> Result<AccountPin, PinRefused> {
    let text = value.trim();
    let form = |shown: String| PinRefused {
        reason: "account-pin-invalid",
        detail: format!(
            "a pinned account must be written pool/account (for example openai/work), got {shown}"
        ),
    };
    if text.is_empty() {
        return Err(form(format!("{value:?}")));
    }
    match text.find('/') {
        Some(slash) if slash > 0 && slash + 1 < text.len() => Ok(AccountPin { pool: text[..slash].to_string(), id: text[slash + 1..].to_string() }),
        _ => Err(PinRefused {
            reason: "account-pin-invalid",
            detail: format!("a pinned account must be written pool/account (for example openai/work), got \"{text}\": name the pool the account belongs to"),
        }),
    }
}

/// The runner config narrowed to one account of the provider's pool; nothing else changes.
pub fn config_pinned_to_account(cfg: &Value, provider: &str, account_id: &str) -> Value {
    let family = legacy_state_key(provider);
    let mut out = cfg.clone();
    if let Some(accounts) = cfg.get("llmAccounts") {
        let mut narrowed = Map::new();
        for (pool, pool_accounts) in accounts.as_object().into_iter().flatten() {
            if legacy_state_key(pool) != family {
                narrowed.insert(pool.clone(), pool_accounts.clone());
            } else if let Some(account) = pool_accounts
                .get(account_id)
                .filter(|a| !a.is_null() && **a != json!(false))
            {
                narrowed.insert(pool.clone(), json!({ account_id: account }));
            }
        }
        out["llmAccounts"] = Value::Object(narrowed);
    }
    out
}

/// The runner config a binding is dispatched with: a pinned one leases from its one account only.
pub fn runner_config_for_binding(cfg: &Value, bound: &Value) -> Value {
    let Some(account) = bound.get("account").filter(|a| a.is_object()) else {
        return cfg.clone();
    };
    let pool = account
        .get("pool")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let id = account
        .get("id")
        .and_then(Value::as_str)
        .unwrap_or_default();
    config_pinned_to_account(cfg, &legacy_state_key(pool), id)
}

/// Refuse a pinned account that is quarantined now, naming until when it waits. `pin_quarantined_until` is Seat
/// Binding's own judgment (its preflight over the account view): epoch ms, `NEVER_MS` for no end, `None` for usable.
pub fn assert_pinned_accounts_usable(
    pins: &[AccountPin],
    what: &str,
    pin_quarantined_until: &dyn Fn(&AccountPin) -> Option<i64>,
) -> Result<(), String> {
    for pin in pins {
        let Some(until) = pin_quarantined_until(pin) else {
            continue;
        };
        let waits = if until == super::state::NEVER_MS {
            "with no end time (cleared by hand)".to_string()
        } else {
            format!("until {}", super::time::iso_from_ms(until))
        };
        return Err(format!(
            "{what}: account \"{}/{}\" is quarantined {waits}; pin another account, or wait",
            pin.pool, pin.id
        ));
    }
    Ok(())
}
