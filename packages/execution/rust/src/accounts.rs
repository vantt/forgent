//! The machine's LLM accounts and the per-state-key inventory the lease reads. Two sources feed it:
//! `runner.llmAccounts.<pool>.<account>` (each account names, per agent CLI, the directory where that CLI keeps
//! the account's login) and the older `runner.providers.<provider>.accounts`, which stays the source for every
//! pool `llmAccounts` does not declare. `read_llm_accounts` only reports: what is wrong is listed in `problems`.
//! The semantics are `executor-model.md` ("account inventory"); the vectors of `executor-model.v1.json` prove them.

use crate::executor_model::{credential_store_of, family_of, FamilySource, ModelError};
use crate::ports::Machine;
use serde::Serialize;
use serde_json::{json, Map, Value};

const FORBIDDEN_ACCOUNT_KEYS: [&str; 17] = [
    "executor",
    "executors",
    "capability",
    "capabilities",
    "model",
    "models",
    "modelTier",
    "mutation",
    "confinement",
    "tool",
    "tools",
    "fallback",
    "providerFallback",
    "runtime",
    "runtimeClass",
    "providerRuntime",
    "providerRuntimes",
];
const ACCOUNT_ENTRY_KEYS: [&str; 3] = ["label", "credentialSource", "credentialSources"];
const CREDENTIAL_SOURCE_KEYS: [&str; 3] = ["kind", "home", "files"];
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

// ---- runner.providers.<provider>.accounts ----------------------------------------------------------------

fn normalize_credential_source(source: &Value, label: &str) -> Result<Value, ModelError> {
    let refuse =
        |text: String| ModelError::provider_capacity(format!("runner config ({label}{text}"));
    let Some(fields) = source.as_object() else {
        return Err(refuse(") must be an object.".into()));
    };
    if let Some(key) = fields
        .keys()
        .find(|key| !CREDENTIAL_SOURCE_KEYS.contains(&key.as_str()))
    {
        return Err(refuse(format!(
            ") contains unknown key \"{key}\". Allowed keys: {}.",
            CREDENTIAL_SOURCE_KEYS.join(", ")
        )));
    }
    let kind = fields
        .get("kind")
        .and_then(Value::as_str)
        .filter(|kind| ["codex-home", "home-files"].contains(kind));
    let Some(kind) = kind else {
        return Err(refuse(
            ".kind) must be one of codex-home, home-files.".into(),
        ));
    };
    if !fields
        .get("home")
        .and_then(Value::as_str)
        .is_some_and(|home| !home.trim().is_empty())
    {
        return Err(refuse(".home) must be a non-empty string.".into()));
    }
    let mut out = Map::new();
    out.insert("kind".into(), json!(kind));
    out.insert("home".into(), fields["home"].clone());
    if kind == "home-files" {
        let files = fields
            .get("files")
            .and_then(Value::as_array)
            .filter(|list| !list.is_empty());
        let valid = files.filter(|list| {
            list.iter().all(|file| {
                file.as_str()
                    .is_some_and(|f| !f.trim().is_empty() && is_inside(f))
            })
        });
        let Some(files) = valid else {
            return Err(refuse(
                ".files) must be a non-empty list of relative paths without \"..\".".into(),
            ));
        };
        out.insert("files".into(), Value::Array(files.clone()));
    } else if fields.contains_key("files") {
        return Err(refuse(
            ".files) is only valid for kind \"home-files\".".into(),
        ));
    }
    Ok(Value::Object(out))
}

/// The accounts `runner.providers` declares, keyed by the lease-state key of the provider, in the declared order.
/// Each account has one login store for every CLI (`credentialSource`) or one per CLI (`credentialSources`).
/// Refuses the config where it would split one provider across two keys or carry placement policy.
pub fn validate_provider_account_inventory(
    runner: &Value,
    label: &str,
) -> Result<Map<String, Value>, ModelError> {
    let label_text = label;
    let Some(providers) = runner.get("providers") else {
        return Ok(Map::new());
    };
    let refuse = |text: String| ModelError::provider_capacity(text);
    let Some(providers) = providers.as_object() else {
        return Err(refuse(format!("runner config ({label_text}.providers) must be an object mapping provider -> {{ accounts }} when present.")));
    };
    let mut raw_names: Vec<(String, String)> = Vec::new();
    let mut normalized = Map::new();
    for (provider, entry) in providers {
        if provider.is_empty() {
            return Err(refuse(format!(
                "runner config ({label_text}.providers) provider id must be a non-empty string."
            )));
        }
        let canonical = legacy_state_key(provider);
        if let Some((_, first)) = raw_names.iter().find(|(key, _)| *key == canonical) {
            return Err(refuse(format!(
                "runner config ({label_text}.providers) declares both \"{first}\" and \"{provider}\", which normalize to the same provider family \"{canonical}\" -- consolidate their accounts under one key."
            )));
        }
        raw_names.push((canonical.clone(), provider.clone()));
        let Some(entry_fields) = entry.as_object() else {
            return Err(refuse(format!(
                "runner config ({label_text}.providers.{provider}) must be an object."
            )));
        };
        if let Some(key) = entry_fields.keys().find(|key| key.as_str() != "accounts") {
            return Err(refuse(format!("runner config ({label_text}.providers.{provider}) contains unknown key \"{key}\". Slice 1 only allows: accounts.")));
        }
        let Some(accounts) = entry_fields.get("accounts") else {
            continue;
        };
        let Some(accounts) = accounts.as_object() else {
            return Err(refuse(format!("runner config ({label_text}.providers.{provider}.accounts) must be a keyed object, not an array.")));
        };
        let mut inventory = Map::new();
        for (account_id, account) in accounts {
            let at = format!("{label_text}.providers.{provider}.accounts");
            if !is_safe_key(account_id) {
                return Err(refuse(format!(
                    "runner config ({at}) account id must be a non-empty safe key, got {}.",
                    json!(account_id)
                )));
            }
            if digits_only(account_id) {
                return Err(refuse(format!(
                    "runner config ({at}) account id {} is digits only; such a key sorts before the others and would break the declared account order. Add a letter.",
                    json!(account_id)
                )));
            }
            let Some(fields) = account.as_object() else {
                return Err(refuse(format!(
                    "runner config ({at}.{account_id}) must be an object."
                )));
            };
            for key in fields.keys() {
                if FORBIDDEN_ACCOUNT_KEYS.contains(&key.as_str()) {
                    return Err(refuse(format!(
                        "runner config ({at}.{account_id}) must not declare \"{key}\"; accounts may only describe credentials/capacity, not placement policy."
                    )));
                }
                if !ACCOUNT_ENTRY_KEYS.contains(&key.as_str()) {
                    return Err(refuse(format!(
                        "runner config ({at}.{account_id}) contains unknown key \"{key}\". Allowed keys: {}.",
                        ACCOUNT_ENTRY_KEYS.join(", ")
                    )));
                }
            }
            if fields
                .get("label")
                .is_some_and(|label| !label.as_str().is_some_and(|text| !text.trim().is_empty()))
            {
                return Err(refuse(format!("runner config ({at}.{account_id}.label) must be a non-empty string when present.")));
            }
            let where_ = format!("{at}.{account_id}");
            let (single, per_cli) = (
                fields.contains_key("credentialSource"),
                fields.contains_key("credentialSources"),
            );
            if single == per_cli {
                return Err(refuse(format!(
                    "runner config ({where_}) must declare exactly one of \"credentialSource\" (one login store for every CLI) or \"credentialSources\" (one login store per CLI, keyed by the CLI command name)."
                )));
            }
            let mut out = Map::new();
            out.insert("id".into(), json!(account_id));
            out.insert(
                "label".into(),
                fields
                    .get("label")
                    .cloned()
                    .unwrap_or_else(|| json!(account_id)),
            );
            if single {
                out.insert(
                    "credentialSource".into(),
                    normalize_credential_source(
                        &fields["credentialSource"],
                        &format!("{where_}.credentialSource"),
                    )?,
                );
            } else {
                let sources = fields["credentialSources"].as_object().filter(|map| !map.is_empty()).ok_or_else(|| {
                    refuse(format!("runner config ({where_}.credentialSources) must be a non-empty object mapping a CLI command name (codex, pi, omp, agy, ...) to a credential source."))
                })?;
                let mut per = Map::new();
                for (cli, source) in sources {
                    if !is_cli_key(cli) {
                        return Err(refuse(format!(
                            "runner config ({where_}.credentialSources) key {} must be a CLI command name (lower-case letters, digits, \"-\" or \"_\").",
                            json!(cli)
                        )));
                    }
                    let mut normalized_source = normalize_credential_source(
                        source,
                        &format!("{where_}.credentialSources.{cli}"),
                    )?;
                    normalized_source["cli"] = json!(cli);
                    per.insert(cli.clone(), normalized_source);
                }
                out.insert("credentialSources".into(), Value::Object(per));
            }
            inventory.insert(account_id.clone(), Value::Object(out));
        }
        normalized.insert(canonical, json!({ "accounts": Value::Object(inventory) }));
    }
    Ok(normalized)
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
fn derive_legacy_inventory(runner: &Value, machine: &dyn Machine) -> Map<String, Value> {
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

/// The accounts the lease, probe, pin and renewal read, per state key. A pool declared in `runner.llmAccounts`
/// supplies its own accounts; a pool it does not declare keeps reading `runner.providers.<provider>.accounts`.
pub fn provider_account_inventory(
    runner: &Value,
    machine: &dyn Machine,
) -> Result<Map<String, Value>, ModelError> {
    let mut inventory = validate_provider_account_inventory(runner, "runner config")?;
    if runner.get("llmAccounts").is_some() {
        inventory.extend(derive_legacy_inventory(runner, machine));
    }
    Ok(inventory)
}
