//! The machine's LLM accounts and the per-state-key inventory the lease reads. Two sources feed it:
//! `runner.llmAccounts.<pool>.<account>` (each account names, per agent CLI, the directory where that CLI keeps
//! the account's login); the older `runner.providers.<provider>.accounts` is retired and refused by name when it
//! lists accounts. `read_llm_accounts` only reports: what is wrong is listed in `problems`.
//! The semantics are `executor-model.md` ("account inventory"); the vectors of `executor-model.v1.json` prove them.

use crate::executor_model::{credential_store_of, family_of, FamilySource, ModelError};
use crate::ports::Machine;
use serde::Serialize;
use serde_json::{json, Map, Value};

const LLM_ACCOUNT_KEYS: [&str; 3] = ["credentialStore", "label", "disabled"];

/// The key lease state uses for a pool while it reads the old inventory: the family, except `openai` is
/// `openai-codex`. The only place that spelling is made.
pub fn legacy_state_key(pool: &str) -> String {
    let family = family_of(FamilySource::Spelling(pool), None);
    match family.as_str() {
        "openai" => "openai-codex".to_string(),
        "" => pool.to_string(),
        _ => family,
    }
}

fn is_absolute(path: &str) -> bool {
    path.starts_with('/')
        || (cfg!(windows)
            && (path.starts_with('\\')
                || path
                    .as_bytes()
                    .get(1..3)
                    .is_some_and(|rest| rest[0] == b':' && (rest[1] == b'/' || rest[1] == b'\\'))))
}

/// A path that stays inside a directory: relative, and with no `..` part.
pub(crate) fn is_inside(path: &str) -> bool {
    !is_absolute(path) && !path.split(['/', '\\']).any(|part| part == "..")
}

/// An account's credential home as an absolute path: a leading `~`, `${HOME}` or `$HOME` is the user's home
/// directory. `None` when the value is empty, not absolute once expanded, or the home is not known.
fn expand_credential_home(home: &str, machine: &dyn Machine) -> Option<String> {
    if home.trim().is_empty() {
        return None;
    }
    let mut expanded = home.to_string();
    for prefix in ["${HOME}", "$HOME", "~"] {
        if let Some(rest) = home
            .strip_prefix(prefix)
            .filter(|rest| rest.is_empty() || rest.starts_with('/'))
        {
            expanded = format!("{}{rest}", machine.home_dir()?);
            break;
        }
    }
    is_absolute(&expanded).then_some(expanded)
}

pub(crate) fn is_cli_key(key: &str) -> bool {
    let mut chars = key.chars();
    chars
        .next()
        .is_some_and(|c| c.is_ascii_lowercase() || c.is_ascii_digit())
        && chars.all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_' || c == '-')
}

fn is_safe_key(key: &str) -> bool {
    let mut chars = key.chars();
    chars.next().is_some_and(|c| c.is_ascii_alphanumeric())
        && chars.all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '.' || c == '-')
}

fn digits_only(key: &str) -> bool {
    !key.is_empty() && key.chars().all(|c| c.is_ascii_digit())
}

// ---- runner.providers.<provider>.accounts (retired) ------------------------------------------------------

/// `runner.providers.<provider>.accounts` was retired: accounts are declared in `runner.llmAccounts`. A provider that
/// still lists accounts is refused by name. An empty list is a leftover shell and loads; `fgos doctor --fix`
/// removes it (the config repair `remove-empty-provider-accounts`).
pub fn refuse_retired_provider_accounts(runner: &Value, label: &str) -> Result<(), ModelError> {
    let Some(providers) = runner.get("providers").and_then(Value::as_object) else {
        return Ok(());
    };
    let messages: Vec<String> = providers
        .iter()
        .filter(|(_, entry)| {
            entry
                .get("accounts")
                .and_then(Value::as_object)
                .is_some_and(|accounts| !accounts.is_empty())
        })
        .map(|(provider, _)| {
            format!("runner config ({label}): runner.providers.{provider}.accounts was retired; declare the accounts in runner.llmAccounts.<pool>.<account>.credentialStore instead.")
        })
        .collect();
    if messages.is_empty() {
        return Ok(());
    }
    Err(ModelError::coded("config-key-retired", messages.join("\n")))
}

// ---- runner.llmAccounts ----------------------------------------------------------------------------------

/// Something wrong with `runner.llmAccounts`, for doctor and `fgos dispatch explain`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Problem {
    pub code: &'static str,
    pub at: String,
    pub detail: String,
}

/// One account of a pool: its label, whether it is disabled, and per CLI the directory of its login.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LlmAccount {
    pub id: String,
    pub label: String,
    pub disabled: bool,
    pub stores: Vec<(String, String)>,
}

/// A pool, the service provider that bills the call, and its accounts in the declared order.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LlmPool {
    pub name: String,
    pub accounts: Vec<LlmAccount>,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct LlmAccounts {
    pub pools: Vec<LlmPool>,
    pub problems: Vec<Problem>,
}

impl LlmAccounts {
    /// `{ pools: { <pool>: { accounts: { <id>: { label, disabled, stores } } } }, problems }`.
    pub fn to_json(&self) -> Value {
        let pools: Map<String, Value> = self
            .pools
            .iter()
            .map(|pool| {
                let accounts: Map<String, Value> = pool
                    .accounts
                    .iter()
                    .map(|account| {
                        let stores: Map<String, Value> = account.stores.iter().map(|(cli, dir)| (cli.clone(), json!(dir))).collect();
                        (account.id.clone(), json!({ "label": account.label, "disabled": account.disabled, "stores": stores }))
                    })
                    .collect();
                (pool.name.clone(), json!({ "accounts": accounts }))
            })
            .collect();
        json!({ "pools": pools, "problems": self.problems })
    }
}

/// The families this config runs: every `modelPolicies` key and every executor's `providerModel`.
fn configured_families(runner: &Value) -> Vec<String> {
    let mut families: Vec<String> = runner
        .get("modelPolicies")
        .and_then(Value::as_object)
        .into_iter()
        .flatten()
        .map(|(key, _)| key.clone())
        .collect();
    for entry in runner
        .get("executors")
        .and_then(Value::as_object)
        .into_iter()
        .flatten()
        .map(|(_, entry)| entry)
    {
        if let Some(name) = entry
            .get("providerModel")
            .and_then(Value::as_str)
            .filter(|name| !name.is_empty())
        {
            if !families.iter().any(|family| family == name) {
                families.push(name.to_string());
            }
        }
    }
    families
}

/// The family a pool name is another spelling of, or `None`: a pool is named once, by the family name, so state
/// and leases never split one pool across two keys.
fn alias_of(pool: &str, families: &[String]) -> Option<String> {
    if families.iter().any(|family| family == pool) {
        return None;
    }
    let canonical = family_of(FamilySource::Spelling(pool), None);
    if canonical.is_empty() {
        return None;
    }
    families
        .iter()
        .find(|family| family_of(FamilySource::Spelling(family), None) == canonical)
        .cloned()
}

fn is_account_id(id: &str) -> bool {
    is_safe_key(id) && !digits_only(id)
}

/// Reads `runner.llmAccounts` from the merged runner section. Never refuses: what is wrong is in `problems`.
pub fn read_llm_accounts(runner: &Value, machine: &dyn Machine) -> LlmAccounts {
    let mut out = LlmAccounts::default();
    let mut problem = |code: &'static str, at: &str, detail: &str| {
        out.problems.push(Problem {
            code,
            at: at.to_string(),
            detail: detail.to_string(),
        })
    };
    let Some(inventory) = runner.get("llmAccounts") else {
        return out;
    };
    let Some(inventory) = inventory.as_object() else {
        problem(
            "llm-accounts-shape",
            "runner.llmAccounts",
            "must be an object mapping pool -> account -> { credentialStore }",
        );
        return out;
    };
    let families = configured_families(runner);
    let mut pools = Vec::new();
    for (pool, accounts) in inventory {
        let at = format!("runner.llmAccounts.{pool}");
        if pool.contains('@') {
            problem(
                "pool-name-at",
                &at,
                "a pool name cannot contain \"@\", which separates model and pool in a tier cell",
            );
            continue;
        }
        if let Some(alias) = alias_of(pool, &families) {
            problem("pool-name-alias", &at, &format!("\"{pool}\" is another spelling of the family \"{alias}\"; name the pool \"{alias}\""));
            continue;
        }
        let Some(accounts) = accounts.as_object() else {
            problem(
                "llm-accounts-shape",
                &at,
                "must be an object mapping account -> { credentialStore }",
            );
            continue;
        };
        let mut read = LlmPool {
            name: pool.clone(),
            accounts: Vec::new(),
        };
        for (account_id, account) in accounts {
            let where_ = format!("{at}.{account_id}");
            if !is_account_id(account_id) {
                problem("account-id", &where_, "an account id is letters, digits, \".\", \"_\" or \"-\", starting with a letter or digit, and not digits only (a digits-only key sorts before the others and would break the declared account order)");
                continue;
            }
            let Some(fields) = account.as_object() else {
                problem(
                    "llm-accounts-shape",
                    &where_,
                    "must be an object with credentialStore",
                );
                continue;
            };
            let unknown: Vec<&str> = fields
                .keys()
                .map(String::as_str)
                .filter(|key| !LLM_ACCOUNT_KEYS.contains(key))
                .collect();
            if !unknown.is_empty() {
                problem(
                    "account-unknown-key",
                    &where_,
                    &format!(
                        "unknown key(s) {}; allowed: {}",
                        unknown.join(", "),
                        LLM_ACCOUNT_KEYS.join(", ")
                    ),
                );
            }
            let declared = fields.get("credentialStore").and_then(Value::as_object);
            if fields.contains_key("credentialStore") && declared.is_none() {
                problem(
                    "llm-accounts-shape",
                    &format!("{where_}.credentialStore"),
                    "must be an object mapping a CLI name to its login directory",
                );
            }
            let mut stores = Vec::new();
            for (cli, store) in declared.into_iter().flatten() {
                let store_at = format!("{where_}.credentialStore.{cli}");
                if !is_cli_key(cli) {
                    problem(
                        "store-cli",
                        &store_at,
                        "a CLI name is lower-case letters, digits, \"-\" or \"_\"",
                    );
                    continue;
                }
                let Some(text) = store.as_str().filter(|text| !text.trim().is_empty()) else {
                    problem("store-path", &store_at, "must be a directory path");
                    continue;
                };
                let Some(expanded) = expand_credential_home(text, machine) else {
                    problem(
                        "store-path",
                        &store_at,
                        "must be absolute, or start with ~ or ${HOME}",
                    );
                    continue;
                };
                stores.push((cli.clone(), expanded));
            }
            if stores.is_empty() {
                problem(
                    "account-no-store",
                    &where_,
                    "names no credentialStore, so no CLI can run on it",
                );
                continue;
            }
            let label = fields.get("label");
            if label
                .is_some_and(|label| !label.as_str().is_some_and(|text| !text.trim().is_empty()))
            {
                problem(
                    "account-label",
                    &format!("{where_}.label"),
                    "must be a non-empty string when present",
                );
            }
            let disabled = fields.get("disabled");
            if disabled.is_some_and(|flag| !flag.is_boolean()) {
                problem(
                    "account-disabled",
                    &format!("{where_}.disabled"),
                    "must be true or false when present",
                );
            }
            read.accounts.push(LlmAccount {
                id: account_id.clone(),
                label: label
                    .and_then(Value::as_str)
                    .filter(|text| !text.trim().is_empty())
                    .unwrap_or(account_id)
                    .to_string(),
                disabled: disabled == Some(&Value::Bool(true)),
                stores,
            });
        }
        pools.push(read);
    }
    out.pools = pools;
    out
}

// ---- the inventory the lease reads -----------------------------------------------------------------------

/// Login files per CLI, from the stores the invocations declare, those of the pool's own family first.
fn declared_store_files(runner: &Value, state_key: &str, cli: &str) -> Option<Vec<Value>> {
    let (mut own, mut all): (Vec<Value>, Vec<Value>) = (Vec::new(), Vec::new());
    let (mut own_found, mut all_found) = (false, false);
    for executor in runner
        .get("executors")
        .and_then(Value::as_object)
        .into_iter()
        .flatten()
        .map(|(_, entry)| entry)
    {
        let family = executor
            .get("providerModel")
            .or_else(|| executor.get("provider"))
            .and_then(Value::as_str)
            .unwrap_or_default();
        let own_family = legacy_state_key(family) == state_key;
        for invocation in executor
            .get("invocations")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
        {
            let Some(store) = credential_store_of(invocation) else {
                continue;
            };
            let Some(files) = store.get("files").and_then(Value::as_array) else {
                continue;
            };
            if store.get("use").and_then(Value::as_str) != Some(cli) {
                continue;
            }
            all_found = true;
            all.extend(
                files
                    .iter()
                    .filter(|file| !all.contains(file))
                    .cloned()
                    .collect::<Vec<_>>(),
            );
            if own_family {
                own_found = true;
                own.extend(
                    files
                        .iter()
                        .filter(|file| !own.contains(file))
                        .cloned()
                        .collect::<Vec<_>>(),
                );
            }
        }
    }
    if own_found {
        Some(own)
    } else if all_found {
        Some(all)
    } else {
        None
    }
}

/// The accounts of `runner.llmAccounts` in the shape the lease reads: per state key, each account with one
/// credential source per CLI, in the declared order. A `codex` store is a `codex-home`; any other store is
/// `home-files` with the files the invocations of that store declare. A store no invocation declares files for
/// cannot be copied into a private home, so that CLI is left out of the account and named in `unusableFor`.
pub fn provider_account_inventory(runner: &Value, machine: &dyn Machine) -> Map<String, Value> {
    let mut inventory = Map::new();
    for pool in read_llm_accounts(runner, machine).pools {
        let state_key = legacy_state_key(&pool.name);
        let mut accounts = Map::new();
        for account in pool.accounts {
            let mut sources = Map::new();
            let mut unusable = Vec::new();
            for (cli, home) in &account.stores {
                if cli == "codex" {
                    sources.insert(
                        cli.clone(),
                        json!({ "kind": "codex-home", "home": home, "cli": cli }),
                    );
                    continue;
                }
                match declared_store_files(runner, &state_key, cli) {
                    Some(files) => {
                        sources.insert(cli.clone(), json!({ "kind": "home-files", "home": home, "files": files, "cli": cli }));
                    }
                    None => unusable.push(json!({
                        "cli": cli,
                        "reason": format!("no invocation declares the login files of store \"{cli}\", so nothing can be copied into a private home"),
                    })),
                }
            }
            let mut entry = json!({ "id": account.id, "label": account.label, "disabled": account.disabled, "credentialSources": sources });
            if !unusable.is_empty() {
                entry["unusableFor"] = Value::Array(unusable);
            }
            accounts.insert(account.id, entry);
        }
        inventory.insert(state_key, json!({ "accounts": accounts }));
    }
    inventory
}

// ---- the account view Seat Binding ranks from -----------------------------------------------------------

/// Whether an account of the inventory holds a login store for `cli`: its store for that CLI when it declares one
/// per CLI, else its one store.
pub(crate) fn has_store_for(account: &Value, cli: Option<&str>) -> bool {
    let truthy = |value: Option<&Value>| {
        value.is_some_and(|v| {
            !v.is_null() && v != &json!(false) && v != &json!("") && v != &json!(0)
        })
    };
    match account
        .get("credentialSources")
        .filter(|sources| truthy(Some(sources)))
    {
        Some(sources) => cli.is_some_and(|cli| truthy(sources.get(cli))),
        None => truthy(account.get("credentialSource")),
    }
}

/// The cells' pools of one `modelPolicies` cell, as the tier cell reader names them; `None` for a cell it would
/// refuse (the config validator reports that one).
fn cell_pools(cell: &Value, family: &str) -> Option<Vec<String>> {
    const EFFORTS: [&str; 4] = ["low", "medium", "high", "max"];
    let entries: Vec<&Value> = match cell {
        Value::Array(list) if list.is_empty() => return None,
        Value::Array(list) => list.iter().collect(),
        one => vec![one],
    };
    entries
        .into_iter()
        .map(|entry| match entry {
            Value::Object(fields) => {
                let model_ok = fields
                    .get("model")
                    .and_then(Value::as_str)
                    .is_some_and(|model| !model.trim().is_empty());
                let effort_ok = fields
                    .get("effort")
                    .is_none_or(|effort| effort.as_str().is_some_and(|e| EFFORTS.contains(&e)));
                let keys_ok = fields
                    .keys()
                    .all(|key| ["model", "pool", "effort"].contains(&key.as_str()));
                match fields.get("pool") {
                    _ if !(model_ok && effort_ok && keys_ok) => None,
                    None => Some(family.to_string()),
                    Some(Value::String(pool)) if !pool.trim().is_empty() => Some(pool.clone()),
                    Some(_) => None,
                }
            }
            Value::String(text) if !text.trim().is_empty() => match text.rfind('@') {
                None => Some(family.to_string()),
                Some(at) => {
                    let (model, pool) = (text[..at].trim(), text[at + 1..].trim());
                    (!model.is_empty() && !pool.is_empty()).then(|| pool.to_string())
                }
            },
            _ => None,
        })
        .collect()
}

/// The pools a seat may be served by and the accounts each declares, each with the CLIs it holds a login store for
/// (never where it is kept): the pools are every family of the launch view and every pool a `modelPolicies` cell
/// names. An unreadable inventory is no accounts. `account_state` is Dispatch's read of the lease state keyed by the
/// lease document's provider keys (a pool reads the key `legacy_state_key` gives it): the account held (sticky), a
/// quarantine still running at `now`, a failed probe, and a quarantine one real call may lift, which the view offers
/// only when no account of the pool is healthy. Without it the view is the config alone.
pub fn account_view(
    runner: &Value,
    launch_view: &Map<String, Value>,
    account_state: Option<&Value>,
    now: u64,
    machine: &dyn Machine,
) -> Value {
    let inventory = provider_account_inventory(runner, machine);
    let mut clis: Vec<&str> = Vec::new();
    let mut pools: Vec<String> = Vec::new();
    for facts in launch_view.values() {
        for cli in facts
            .get("invocations")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .filter_map(|inv| inv.get("cli").and_then(Value::as_str))
        {
            if !clis.contains(&cli) {
                clis.push(cli);
            }
        }
        if let Some(family) = facts.get("family").and_then(Value::as_str) {
            if !pools.iter().any(|pool| pool == family) {
                pools.push(family.to_string());
            }
        }
    }
    for (family, tiers) in runner
        .get("modelPolicies")
        .and_then(Value::as_object)
        .into_iter()
        .flatten()
    {
        for cell in tiers
            .as_object()
            .into_iter()
            .flat_map(|tiers| tiers.values())
        {
            for pool in cell_pools(cell, family).unwrap_or_default() {
                if !pools.contains(&pool) {
                    pools.push(pool);
                }
            }
        }
    }
    let empty = Map::new();
    let view: Map<String, Value> = pools
        .into_iter()
        .map(|pool| {
            let key = legacy_state_key(&pool);
            let states = account_state
                .and_then(|overlay| overlay.get(&key))
                .and_then(Value::as_object)
                .unwrap_or(&empty);
            let out = |id: &str| {
                states
                    .get(id)
                    .and_then(|state| state.get("quarantinedUntil"))
                    .and_then(Value::as_u64)
                    .filter(|until| *until > now)
            };
            let declared = inventory
                .get(&key)
                .and_then(|provider| provider.get("accounts"))
                .and_then(Value::as_object)
                .unwrap_or(&empty);
            let healthy = declared.iter().any(|(id, account)| {
                account.get("disabled") != Some(&json!(true)) && out(id).is_none()
            });
            let accounts: Vec<Value> = declared
                .iter()
                .map(|(id, account)| {
                    let state = states.get(id).unwrap_or(&Value::Null);
                    let flag = |key: &str| state.get(key) == Some(&json!(true));
                    let until = out(id);
                    let liftable = until.is_some() && flag("probeable") && !healthy;
                    let mut entry = Map::new();
                    entry.insert("id".into(), json!(id));
                    entry.insert(
                        "clis".into(),
                        json!(clis
                            .iter()
                            .filter(|cli| has_store_for(account, Some(cli)))
                            .collect::<Vec<_>>()),
                    );
                    if account.get("disabled") == Some(&json!(true)) {
                        entry.insert("disabled".into(), json!(true));
                    }
                    if flag("sticky") {
                        entry.insert("sticky".into(), json!(true));
                    }
                    if let Some(until) = until.filter(|_| !liftable) {
                        entry.insert("quarantinedUntil".into(), json!(until));
                    }
                    if until.is_some() && flag("probeFailed") {
                        entry.insert("probe".into(), json!("failed"));
                    }
                    Value::Object(entry)
                })
                .collect();
            (pool, Value::Array(accounts))
        })
        .collect();
    json!({ "pools": view })
}
