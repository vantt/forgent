//! The login stores of an account and the call that tests one: which store a CLI reads, where its home is, and
//! the command that makes one cheap call with it. Account inventory, the legacy state key and `credentialStoreOf`
//! are `fgos-execution`'s and are not copied here.

use serde_json::{json, Map, Value};

/// The CLI an invocation runs: the basename of its command, lower-cased; `None` when there is none.
pub fn command_cli(command: &str) -> Option<String> {
    // `path.basename` of the platform: a backslash separates only where the platform's paths use one.
    let separators: &[char] = if cfg!(windows) { &['/', '\\'] } else { &['/'] };
    let name = command
        .rsplit(separators)
        .next()
        .unwrap_or_default()
        .to_lowercase();
    (!name.is_empty()).then_some(name)
}

fn truthy(value: Option<&Value>) -> Option<&Value> {
    value.filter(|v| !v.is_null() && **v != json!(false) && **v != json!("") && **v != json!(0))
}

/// The login store of `account` that the CLI `cli` reads: an account with one `credentialSource` gives it to every
/// CLI; an account with `credentialSources` gives the CLI's own entry, or `None` when it declares none for it.
pub fn credential_source_for_cli<'a>(account: &'a Value, cli: Option<&str>) -> Option<&'a Value> {
    if let Some(sources) = truthy(account.get("credentialSources")) {
        return cli.and_then(|cli| truthy(sources.get(cli)));
    }
    truthy(account.get("credentialSource"))
}

/// Every login store an account declares, the single one or each per-CLI one in declared order.
pub fn account_credential_sources(account: &Value) -> Vec<&Value> {
    if let Some(sources) = truthy(account.get("credentialSources")) {
        return sources
            .as_object()
            .map(|map| map.values().collect())
            .unwrap_or_default();
    }
    truthy(account.get("credentialSource"))
        .into_iter()
        .collect()
}

/// An account's credential home as an absolute path (`fgos-execution`'s reading): a leading `~`, `${HOME}` or
/// `$HOME` is `home_dir`. `None` when the value is absent, empty, not absolute once expanded, or names the home
/// while `home_dir` is unknown.
pub fn expand_credential_home(home: Option<&str>, home_dir: Option<&str>) -> Option<String> {
    fgos_execution::accounts::expand_credential_home(home?, home_dir)
}

/// Why `store` is not a valid `credentialStore` declaration, or `None` when it is: the config check's own reading.
pub use fgos_execution::runner_check::credential_store_problem;

/// A capacity selection made ready for the invocation that is launched: the store the invocation reads picks the
/// account's login store as `credentialSource` (null when the account declares none for it). An invocation that
/// reads no store gets none, so a lease never puts a login into a home that did not ask for one.
pub fn provider_capacity_for_invocation(selection: &Value, invocation: &Value) -> Value {
    let mut out = selection.clone();
    let Some(map) = out.as_object_mut() else {
        return out;
    };
    let store = fgos_execution::executor_model::credential_store_of(invocation);
    match store {
        None => {
            map.insert("credentialCli".into(), Value::Null);
            map.insert("credentialSource".into(), Value::Null);
        }
        Some(store) => {
            let cli = store.get("use").and_then(Value::as_str);
            map.insert(
                "credentialCli".into(),
                cli.map_or(Value::Null, |c| json!(c)),
            );
            map.insert(
                "credentialSource".into(),
                credential_source_for_cli(selection, cli)
                    .cloned()
                    .unwrap_or(Value::Null),
            );
        }
    }
    out
}

/// The account object `redact_selection` and callers keep: only the facts a record may carry, never a login path.
pub fn redact_selection(selection: &Value) -> Value {
    if selection.get("status").and_then(Value::as_str) != Some("selected") {
        return selection.clone();
    }
    let mut out = Map::new();
    for key in [
        "contract",
        "status",
        "provider",
        "accountId",
        "accountLabel",
        "selectedAt",
        "lease",
    ] {
        if let Some(value) = selection.get(key) {
            out.insert(key.into(), value.clone());
        }
    }
    if let Some(receipt) = selection
        .get("leaseReceipt")
        .filter(|r| truthy(Some(r)).is_some())
    {
        out.insert("leaseReceipt".into(), receipt.clone());
    }
    Value::Object(out)
}
