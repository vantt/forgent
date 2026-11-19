//! The login directories this machine names, read from config values the caller already holds: which account
//! stores sit on their CLI's own default login home (a doctor row's finding), and every login directory a confined
//! launch must keep visible. Reads paths only, never a login file.

use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

use serde_json::{json, Value};

use super::credential::expand_credential_home;

/// Each agent CLI's login home: the variable that moves it and its default under the user's home.
const CLI_LOGIN_HOMES: [(&str, Option<&str>, &str); 5] = [
    ("codex", Some("CODEX_HOME"), ".codex"),
    ("pi", Some("PI_CODING_AGENT_DIR"), ".pi/agent"),
    ("omp", Some("PI_CODING_AGENT_DIR"), ".omp/agent"),
    ("claude", Some("CLAUDE_CONFIG_DIR"), ".claude"),
    ("agy", None, ".gemini"),
];

/// The real path of a directory (a link to it is the same directory), else its absolute lexical form.
fn real(value: &str) -> String {
    std::fs::canonicalize(value)
        .unwrap_or_else(|_| lexical_absolute(Path::new(value)))
        .to_string_lossy()
        .into_owned()
}

fn lexical_absolute(path: &Path) -> PathBuf {
    let joined = if path.is_absolute() {
        path.to_path_buf()
    } else {
        std::env::current_dir().unwrap_or_default().join(path)
    };
    let mut out = PathBuf::new();
    for part in joined.components() {
        match part {
            std::path::Component::ParentDir => {
                out.pop();
            }
            std::path::Component::CurDir => {}
            other => out.push(other.as_os_str()),
        }
    }
    out
}

fn plain_values(value: Option<&Value>) -> Vec<&Value> {
    value
        .and_then(Value::as_object)
        .map(|m| m.values().collect())
        .unwrap_or_default()
}

fn homes_of(cli: &str, home_dir: &str, env: &dyn Fn(&str) -> Option<String>) -> Vec<String> {
    CLI_LOGIN_HOMES
        .iter()
        .filter(|(c, _, _)| *c == cli)
        .flat_map(|(_, name, dir)| {
            [
                Some(Path::new(home_dir).join(dir).to_string_lossy().into_owned()),
                name.and_then(env),
            ]
        })
        .flatten()
        .filter_map(|value| expand_credential_home(Some(&value), Some(home_dir)))
        .map(|value| real(&value))
        .collect()
}

/// The account stores that sit on their CLI's own default login home: `runner.llmAccounts.<pool>.<account>
/// .credentialStore.<cli>` whose expanded real path equals that CLI's login home under `home_dir` or the value of
/// its home variable in `env`. A store that does not expand is not a hit. `[{pool, account, cli, key}]`.
pub fn default_login_home_stores(
    runner: &Value,
    home_dir: &str,
    env: &dyn Fn(&str) -> Option<String>,
) -> Vec<Value> {
    let mut hits = Vec::new();
    for (pool, accounts) in runner
        .get("llmAccounts")
        .and_then(Value::as_object)
        .into_iter()
        .flatten()
    {
        for (account, entry) in accounts.as_object().into_iter().flatten() {
            for (cli, store) in entry
                .get("credentialStore")
                .and_then(Value::as_object)
                .into_iter()
                .flatten()
            {
                let Some(expanded) = expand_credential_home(store.as_str(), Some(home_dir)) else {
                    continue;
                };
                if homes_of(cli, home_dir, env).contains(&real(&expanded)) {
                    hits.push(json!({
                        "pool": pool, "account": account, "cli": cli,
                        "key": format!("runner.llmAccounts.{pool}.{account}.credentialStore.{cli}"),
                    }));
                }
            }
        }
    }
    hits
}

/// Every login directory this machine names: each store of the account inventory expanded as the lease expands it,
/// each agent CLI's default login home and the value of its home variable in `env`, and each executor's
/// `credentialStore.homeEnv` value. `in_place_cli` is the CLI of a launch that reads its own login in place: its
/// homes stay visible to that launch alone. A value that does not expand stays as written, for the confinement
/// resolver to refuse by name. `runner` is the machine's (or project's) `runner` section, read by the caller.
pub fn machine_login_stores(
    runner: &Value,
    home_dir: &str,
    env: &dyn Fn(&str) -> Option<String>,
    in_place_cli: Option<&str>,
) -> Vec<String> {
    let own: BTreeSet<String> = in_place_cli
        .map(|cli| homes_of(cli, home_dir, env))
        .unwrap_or_default()
        .into_iter()
        .collect();
    let mut stores: Vec<String> = Vec::new();
    let mut add = |value: &str| {
        if value.trim().is_empty() {
            return;
        }
        let expanded = expand_credential_home(Some(value), Some(home_dir));
        if expanded.as_ref().is_none_or(|e| !own.contains(&real(e))) {
            let kept = expanded.unwrap_or_else(|| value.to_string());
            if !stores.contains(&kept) {
                stores.push(kept);
            }
        }
    };
    for pool in plain_values(runner.get("llmAccounts")) {
        for account in plain_values(Some(pool)) {
            for store in plain_values(account.get("credentialStore")) {
                if let Some(text) = store.as_str() {
                    add(text);
                }
            }
        }
    }
    for (_, name, dir) in CLI_LOGIN_HOMES {
        add(&Path::new(home_dir).join(dir).to_string_lossy());
        if let Some(value) = name.and_then(env) {
            add(&value);
        }
    }
    for executor in plain_values(runner.get("executors")) {
        for invocation in executor
            .get("invocations")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
        {
            let home_env = fgos_execution::executor_model::credential_store_of(invocation)
                .and_then(|s| s.get("homeEnv"))
                .and_then(Value::as_str);
            // `HOME` names the user's home, not a login directory: the CLI's own login home under it is listed above.
            if let Some(value) = home_env.filter(|n| *n != "HOME").and_then(env) {
                add(&value);
            }
        }
    }
    stores
}
