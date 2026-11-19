//! The lease state of provider accounts: `state.json` (open leases, quarantines, which account an assignment
//! holds) and the `audit.jsonl` history beside it, both under the machine-wide `provider-state` lock. The file
//! shape is the one the Node tier writes, so a Node lease and a Rust lease can meet on one machine.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use fgos_holder_lock::{Acquire, HoldersList, LockScope, Resource, ScopeError, Wait};
use serde_json::{json, Map, Value};

use super::fault::{classify_fault, FaultInput};
use super::host::{Host, Liveness};
use super::time::{iso_from_ms, ms_from_iso};

pub const STATE_CONTRACT: &str = "provider-capacity-state.v1";
pub const SELECTION_CONTRACT: &str = "provider-capacity-selection.v1";
pub const AUDIT_CONTRACT: &str = "provider-capacity-audit.v1";
pub const INSPECT_CONTRACT: &str = "provider-capacity-inspect.v1";
/// Why a lease was refused because the account Seat Binding named was not takeable any more.
pub const LEASE_CONFLICT_REASON: &str = "provider-capacity.lease-conflict";
pub const DEFAULT_QUARANTINE_PROBE_COOLDOWN_MS: i64 = 30 * 60 * 1000;
/// `Number.MAX_SAFE_INTEGER`: a quarantine with no end time.
pub const NEVER_MS: i64 = 9_007_199_254_740_991;
const STATE_LOCK_WAIT_MS: u64 = 30_000;
const ACCOUNT_LOCK_WAIT_MS: u64 = 30_000;

#[derive(Debug, thiserror::Error)]
pub enum AccountsError {
    /// The caller named something the config does not hold, or a confined session asked to lease.
    #[error("{message}")]
    Config {
        message: String,
        code: Option<&'static str>,
    },
    /// A live process keeps the lock past the wait (`provider-capacity-lock-stale`).
    #[error("{message}")]
    LockBusy {
        message: String,
        lock_path: PathBuf,
        holder_pid: Option<u32>,
    },
    #[error("{0}")]
    Io(String),
}

impl AccountsError {
    pub fn config(message: impl Into<String>) -> Self {
        Self::Config {
            message: message.into(),
            code: None,
        }
    }
    /// The machine-readable code a caller branches on.
    pub fn code(&self) -> Option<&'static str> {
        match self {
            Self::Config { code, .. } => *code,
            Self::LockBusy { .. } => Some("provider-capacity-lock-stale"),
            Self::Io(_) => None,
        }
    }
}

pub type Result<T> = std::result::Result<T, AccountsError>;

fn io(error: impl std::fmt::Display) -> AccountsError {
    AccountsError::Io(error.to_string())
}

/// Where the lease state lives: `<runtimeDir>/state.json` and, beside it, the audit log.
pub fn state_paths(runtime_dir: &Path) -> (PathBuf, PathBuf) {
    (
        runtime_dir.join("state.json"),
        runtime_dir.join("audit.jsonl"),
    )
}

fn key_is_safe(value: &str) -> bool {
    let mut chars = value.chars();
    chars.next().is_some_and(|c| c.is_ascii_alphanumeric())
        && chars.all(|c| c.is_ascii_alphanumeric() || matches!(c, '_' | '.' | '-'))
}

/// The directory that holds everything about one account's login; `None` for an unsafe provider or account id.
pub fn provider_account_dir(
    runtime_dir: &Path,
    provider: &str,
    account_id: &str,
) -> Option<PathBuf> {
    (key_is_safe(provider) && key_is_safe(account_id)).then(|| {
        runtime_dir
            .join("account-locks")
            .join(provider)
            .join(account_id)
    })
}

/// Where the copies of one login store wait: the account directory for an account with one store, `stores/<cli>`
/// under it for a store of an account that keeps one per CLI. `None` for an unsafe id or CLI key.
pub fn credential_store_dir(
    runtime_dir: &Path,
    provider: &str,
    account_id: &str,
    cli: Option<&str>,
) -> Option<PathBuf> {
    let account_dir = provider_account_dir(runtime_dir, provider, account_id)?;
    match cli {
        None => Some(account_dir),
        Some(cli) => key_is_safe(cli).then(|| account_dir.join("stores").join(cli)),
    }
}

/// The accounts the lease works on: where the state is, where the locks are, and the machine behind them.
pub struct Accounts<'h> {
    pub runtime_dir: PathBuf,
    pub lock_root: PathBuf,
    pub host: &'h dyn Host,
}

/// The parsed state: the document without its audit field, and the audit records still to append.
struct State {
    doc: Map<String, Value>,
    audit: Vec<Value>,
}

fn empty_state() -> State {
    let mut doc = Map::new();
    doc.insert("contract".into(), json!(STATE_CONTRACT));
    doc.insert("providers".into(), json!({}));
    doc.insert("assignments".into(), json!({}));
    State {
        doc,
        audit: Vec::new(),
    }
}

fn obj_mut<'a>(value: &'a mut Value, key: &str) -> &'a mut Map<String, Value> {
    if !value.get(key).is_some_and(Value::is_object) {
        value[key] = json!({});
    }
    value[key].as_object_mut().expect("just made an object")
}

impl State {
    fn providers(&mut self) -> &mut Map<String, Value> {
        if !self.doc.get("providers").is_some_and(Value::is_object) {
            self.doc.insert("providers".into(), json!({}));
        }
        self.doc
            .get_mut("providers")
            .and_then(Value::as_object_mut)
            .expect("object")
    }
    fn assignments(&mut self) -> &mut Map<String, Value> {
        if !self.doc.get("assignments").is_some_and(Value::is_object) {
            self.doc.insert("assignments".into(), json!({}));
        }
        self.doc
            .get_mut("assignments")
            .and_then(Value::as_object_mut)
            .expect("object")
    }
    fn account(&mut self, provider: &str, account_id: &str) -> &mut Value {
        let entry = self
            .providers()
            .entry(provider)
            .or_insert_with(|| json!({ "accounts": {} }));
        let accounts = obj_mut(entry, "accounts");
        let account = accounts.entry(account_id).or_insert_with(|| json!({}));
        if !account.is_object() {
            *account = json!({});
        }
        obj_mut(account, "leases");
        account
    }
    fn account_ref(&self, provider: &str, account_id: &str) -> Option<&Value> {
        self.doc
            .get("providers")?
            .get(provider)?
            .get("accounts")?
            .get(account_id)
    }
}

/// Whether the quarantine of an account holds at `now_ms`; a record with no readable end fails closed.
pub fn is_quarantined(account_state: Option<&Value>, now_ms: i64) -> bool {
    let Some(quarantine) = account_state
        .and_then(|a| a.get("quarantine"))
        .filter(|q| truthy(q))
    else {
        return false;
    };
    if quarantine.get("kind").and_then(Value::as_str) == Some("manual-clear") {
        return true;
    }
    let Some(until) = quarantine
        .get("until")
        .and_then(Value::as_str)
        .filter(|u| !u.is_empty())
    else {
        return true;
    };
    ms_from_iso(until).is_none_or(|until| until > now_ms)
}

fn truthy(value: &Value) -> bool {
    !(value.is_null() || *value == json!(false) || *value == json!("") || *value == json!(0))
}

fn str_of<'a>(value: &'a Value, key: &str) -> Option<&'a str> {
    value.get(key).and_then(Value::as_str)
}

/// `{ provider, accountId, reason, detail, cli? }`, the refusal an account that cannot be taken answers with.
fn conflict(provider: &str, account_id: Option<&str>, detail: String, cli: Option<&str>) -> Value {
    let mut out = Map::new();
    out.insert("status".into(), json!("refused"));
    out.insert("provider".into(), json!(provider));
    out.insert(
        "accountId".into(),
        account_id.map_or(Value::Null, |a| json!(a)),
    );
    out.insert("reason".into(), json!(LEASE_CONFLICT_REASON));
    out.insert("detail".into(), json!(detail));
    if let Some(cli) = cli {
        out.insert("cli".into(), json!(cli));
    }
    Value::Object(out)
}

/// What one lease asks for: the account Seat Binding named, for the run that will hold it.
#[derive(Debug, Clone, Default)]
pub struct NamedLease<'a> {
    pub provider: &'a str,
    pub account_id: Option<&'a str>,
    pub assignment_id: Option<&'a str>,
    pub run_id: &'a str,
    /// The CLI the launch runs: only an account that declares a login store for it can be leased.
    pub cli: Option<&'a str>,
    /// Digest of the account view Seat Binding ranked from, kept in the receipt.
    pub account_view_digest: Option<&'a str>,
    pub lock_wait_ms: Option<u64>,
}

/// Proof a run is dead through evidence other than its recorded pid, and proof its worker lives on.
pub struct Reclaim<'a> {
    pub run_is_dead: &'a dyn Fn(&str, &Value) -> bool,
    pub is_run_worker_alive: &'a dyn Fn(&str, &Value) -> bool,
}

impl Reclaim<'_> {
    pub const NONE: Reclaim<'static> = Reclaim {
        run_is_dead: &|_, _| false,
        is_run_worker_alive: &|_, _| false,
    };
}

/// A held account lock. The lock is released when this is dropped or `release` is called.
pub struct AccountLock {
    pub dir: PathBuf,
    scope: Option<LockScope<'static>>,
}

impl std::fmt::Debug for AccountLock {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("AccountLock")
            .field("dir", &self.dir)
            .field("held", &self.scope.is_some())
            .finish()
    }
}

impl AccountLock {
    #[cfg(unix)]
    fn handle(&self) -> Option<&fgos_holder_lock::Handle> {
        self.scope.as_ref()?.handle("provider-account")
    }

    /// Run a child that holds the account lock for the whole call, bounded by `deadline`; the lock stays held
    /// until the child and what it left behind are gone. Unix only.
    #[cfg(unix)]
    pub fn run_holding(
        &self,
        spec: &fgos_holder_lock::BorrowSpec,
        io: &fgos_holder_lock::BorrowIo,
    ) -> Result<fgos_holder_lock::BorrowIoOutcome> {
        let handle = self
            .handle()
            .ok_or_else(|| io_error("the account lock is released"))?;
        fgos_holder_lock::run_borrowed_io(&handle, spec, io).map_err(|e| io_error(format!("{e:?}")))
    }

    pub fn release(mut self) {
        self.scope = None;
    }
}

#[cfg(unix)]
fn io_error(message: impl std::fmt::Display) -> AccountsError {
    AccountsError::Io(message.to_string())
}

impl<'h> Accounts<'h> {
    pub fn new(
        runtime_dir: impl Into<PathBuf>,
        lock_root: impl Into<PathBuf>,
        host: &'h dyn Host,
    ) -> Self {
        Self {
            runtime_dir: runtime_dir.into(),
            lock_root: lock_root.into(),
            host,
        }
    }

    /// The machine's own runtime directory (through the global directory door) and lock root.
    pub fn from_environment(host: &'h dyn Host) -> Result<Self> {
        let runtime_dir = super::host::default_runtime_dir().ok_or_else(|| {
            AccountsError::config("HOME is not set; the global directory is ~/.fgos")
        })?;
        Ok(Self::new(runtime_dir, fgos_holder_lock::lock_root(), host))
    }

    fn now(&self) -> i64 {
        self.host.now_ms()
    }

    // ---- locks ------------------------------------------------------------------------------------------

    fn busy(&self, lock: &str, path: PathBuf, text: &str) -> AccountsError {
        let holder_pid = match fgos_holder_lock::holders(&Resource::new(lock, path.clone())) {
            Ok(HoldersList::List(list)) => list.first().map(|t| t.pid.0),
            _ => None,
        };
        let suffix = holder_pid.map_or(String::new(), |pid| format!(" (pid {pid})"));
        AccountsError::LockBusy {
            message: format!("{text}{suffix}."),
            lock_path: path,
            holder_pid,
        }
    }

    fn take(
        &self,
        name: &'static str,
        params: BTreeMap<String, String>,
        wait: Wait,
        path: PathBuf,
        text: String,
    ) -> Result<Option<LockScope<'static>>> {
        let mut scope = LockScope::seeded(Vec::new()).map_err(io)?;
        match scope.acquire(name, &params, wait) {
            Ok(_) => Ok(Some(scope)),
            Err(ScopeError::Acquire(why)) => match *why {
                Acquire::Held { .. } | Acquire::Timeout { .. } => {
                    if matches!(wait, Wait::Try) {
                        Ok(None)
                    } else {
                        Err(self.busy(name, path, &text))
                    }
                }
                other => Err(io(format!("lock {name} unavailable: {other:?}"))),
            },
            Err(other) => Err(io(other)),
        }
    }

    /// Run `f` under the machine-wide state lock. No host program may start inside `f`.
    pub fn with_state_lock<T>(
        &self,
        wait_ms: Option<u64>,
        f: impl FnOnce() -> Result<T>,
    ) -> Result<T> {
        let wait = wait_ms.unwrap_or(STATE_LOCK_WAIT_MS);
        let path = self.lock_root.join("provider-state.lock");
        let params = BTreeMap::from([(
            "lockRoot".to_string(),
            self.lock_root.to_string_lossy().into_owned(),
        )]);
        let text = format!(
            "provider-capacity lock at \"{}\" is still held by a live process after waiting {wait}ms",
            path.display()
        );
        let scope = self.take("provider-state", params, Wait::Ms(wait), path, text)?;
        let result = f();
        drop(scope);
        result
    }

    fn account_lock_target(
        &self,
        provider: &str,
        account_id: &str,
    ) -> Result<(PathBuf, BTreeMap<String, String>, PathBuf)> {
        let Some(dir) = provider_account_dir(&self.runtime_dir, provider, account_id) else {
            return Err(AccountsError::config(format!(
                "provider-capacity account lock refused: unsafe provider/account {provider:?}/{account_id:?}"
            )));
        };
        std::fs::create_dir_all(&dir).map_err(io)?;
        let params = BTreeMap::from([
            (
                "lockRoot".to_string(),
                self.lock_root.to_string_lossy().into_owned(),
            ),
            ("provider".to_string(), provider.to_string()),
            ("account".to_string(), account_id.to_string()),
        ]);
        let path = self
            .lock_root
            .join("provider-account")
            .join(provider)
            .join(format!("{account_id}.lock"));
        Ok((dir, params, path))
    }

    /// Take the account lock without waiting; `None` when a live holder (or a child it lent the lock to) has it.
    pub fn try_acquire_account_lock(
        &self,
        provider: &str,
        account_id: &str,
    ) -> Result<Option<AccountLock>> {
        let (dir, params, path) = self.account_lock_target(provider, account_id)?;
        Ok(self
            .take("provider-account", params, Wait::Try, path, String::new())?
            .map(|scope| AccountLock {
                dir,
                scope: Some(scope),
            }))
    }

    /// Take the account lock, waiting up to `wait_ms`; a live holder past that is `LockBusy`.
    pub fn acquire_account_lock(
        &self,
        provider: &str,
        account_id: &str,
        wait_ms: Option<u64>,
    ) -> Result<AccountLock> {
        let (dir, params, path) = self.account_lock_target(provider, account_id)?;
        let text = format!(
            "provider-capacity account lock at \"{}\" is still held by a live process after waiting",
            path.display()
        );
        let scope = self
            .take(
                "provider-account",
                params,
                Wait::Ms(wait_ms.unwrap_or(ACCOUNT_LOCK_WAIT_MS)),
                path,
                text,
            )?
            .ok_or_else(|| io("account lock not taken"))?;
        Ok(AccountLock {
            dir,
            scope: Some(scope),
        })
    }

    // ---- the state file ---------------------------------------------------------------------------------

    fn reset_record(&self, reason: &str, extra: Option<(&str, String)>) -> Value {
        let mut record = json!({
            "contract": AUDIT_CONTRACT,
            "action": "state-reset",
            "status": "corrupt-state-reset",
            "resetAt": iso_from_ms(self.now()),
            "reason": reason,
        });
        if let Some((key, value)) = extra {
            record[key] = json!(value);
        }
        record
    }

    /// Reads the state. A corrupt file is renamed aside (never deleted) and an audit entry for the reset is carried
    /// by the fresh state, so one torn write cannot break every provider of the host.
    fn read_state(&self, state_path: &Path) -> State {
        let Ok(raw) = std::fs::read_to_string(state_path) else {
            return empty_state();
        };
        if raw.trim().is_empty() {
            return empty_state();
        }
        match serde_json::from_str::<Value>(&raw) {
            Err(error) => {
                let aside = format!("{}.corrupt-{}", state_path.display(), self.now());
                let _ = std::fs::rename(state_path, &aside);
                let mut fresh = empty_state();
                fresh.audit.push(self.reset_record(
                    &js_parse_message(&error),
                    Some(("corruptStateRenamedTo", aside)),
                ));
                fresh
            }
            Ok(Value::Object(parsed)) => {
                let mut state = empty_state();
                for (key, value) in parsed {
                    if key == "audit" {
                        if let Value::Array(list) = value {
                            state.audit = list;
                        }
                    } else {
                        state.doc.insert(key, value);
                    }
                }
                for key in ["providers", "assignments"] {
                    if !state.doc.get(key).is_some_and(Value::is_object) {
                        state.doc.insert(key.into(), json!({}));
                    }
                }
                state
            }
            Ok(_) => {
                let mut fresh = empty_state();
                fresh
                    .audit
                    .push(self.reset_record("state.json parsed but is not an object", None));
                fresh
            }
        }
    }

    /// Writes the state under the state lock (every caller holds it). The audit records go to the log first; a
    /// record the log refuses is dropped with one warning and the state is written either way.
    fn write_state(&self, state_path: &Path, state: &mut State) -> Result<()> {
        let dir = state_path.parent().unwrap_or_else(|| Path::new("."));
        std::fs::create_dir_all(dir).map_err(io)?;
        let (_, audit_path) = state_paths(dir);
        let appended: std::io::Result<()> = state.audit.iter().try_for_each(|record| {
            fgos_observe::invocation_fault::append_capped(&audit_path, record)
        });
        if let Err(error) = appended {
            eprintln!("fgos: warning: provider-capacity audit log not written ({error}); its unwritten records are dropped");
        }
        state.audit.clear();
        let mut text =
            serde_json::to_string_pretty(&Value::Object(state.doc.clone())).map_err(io)?;
        text.push('\n');
        fgos_durable_file::replace_durably_with_mode(dir, "state.json", text.as_bytes(), 0o644)
            .map_err(io)?;
        Ok(())
    }

    fn state_path(&self) -> PathBuf {
        state_paths(&self.runtime_dir).0
    }

    // ---- reading ----------------------------------------------------------------------------------------

    /// The account facts of one provider's pool, read without the state lock: whether the assignment already holds
    /// an account (sticky), until when an account is quarantined, and whether a quarantine one real call may lift.
    pub fn read_account_states(
        &self,
        provider: &str,
        assignment_id: Option<&str>,
        now_ms: i64,
        cooldown_ms: Option<i64>,
    ) -> Map<String, Value> {
        let state = self.read_state(&self.state_path());
        self.account_states_of(
            &state,
            provider,
            assignment_id,
            now_ms,
            cooldown_ms.unwrap_or(DEFAULT_QUARANTINE_PROBE_COOLDOWN_MS),
        )
    }

    fn account_states_of(
        &self,
        state: &State,
        provider: &str,
        assignment_id: Option<&str>,
        now: i64,
        cooldown: i64,
    ) -> Map<String, Value> {
        let sticky_id = assignment_id.and_then(|id| {
            state
                .doc
                .get("assignments")?
                .get(format!("{provider}:{id}"))?
                .get("accountId")?
                .as_str()
        });
        let mut out = Map::new();
        let accounts = state
            .doc
            .get("providers")
            .and_then(|p| p.get(provider))
            .and_then(|p| p.get("accounts"))
            .and_then(Value::as_object);
        for (account_id, acct) in accounts.into_iter().flatten() {
            let quarantine = acct.get("quarantine").filter(|q| truthy(q));
            let until = quarantine
                .and_then(|q| str_of(q, "until"))
                .and_then(ms_from_iso);
            let never = quarantine.is_some_and(|q| str_of(q, "until").is_none_or(str::is_empty))
                || (quarantine.is_some() && until.is_none());
            let last_probe = quarantine
                .and_then(|q| q.get("probe"))
                .and_then(|p| str_of(p, "attemptedAt"))
                .and_then(ms_from_iso);
            let kind = quarantine.and_then(|q| str_of(q, "kind"));
            let reason = quarantine.and_then(|q| str_of(q, "reasonCode"));
            let probeable_login = kind == Some("manual-clear")
                && reason == Some("auth-token")
                && !last_probe.is_some_and(|at| now - at < cooldown);
            let probeable_quota = reason == Some("quota-limit")
                && quarantine.and_then(|q| q.get("resetKnown")) == Some(&json!(false))
                && !never
                && until.is_some_and(|u| u > now);
            let quarantined_until = match (quarantine, until) {
                (None, _) => Value::Null,
                (Some(_), _) if kind == Some("manual-clear") || never => json!(NEVER_MS),
                (Some(_), Some(until)) => json!(until),
                _ => json!(NEVER_MS),
            };
            out.insert(
                account_id.clone(),
                json!({
                    "sticky": sticky_id == Some(account_id.as_str()),
                    "quarantinedUntil": quarantined_until,
                    "probeable": probeable_login || probeable_quota,
                    "probeFailed": quarantine.and_then(|q| q.get("probe")).and_then(|p| str_of(p, "status")) == Some("failed"),
                }),
            );
        }
        if let Some(sticky) = sticky_id {
            out.entry(sticky.to_string()).or_insert_with(|| json!({ "sticky": true, "quarantinedUntil": null, "probeable": false, "probeFailed": false }));
        }
        out
    }

    /// The account state Seat Binding overlays on the declared accounts, keyed by the lease document's own provider
    /// keys: every provider the document lists and the one an assignment of `assignment_id` holds an account of.
    pub fn read_account_state_overlay(
        &self,
        assignment_id: Option<&str>,
        now_ms: i64,
        cooldown_ms: Option<i64>,
    ) -> Map<String, Value> {
        let state = self.read_state(&self.state_path());
        let mut keys: Vec<String> = state
            .doc
            .get("providers")
            .and_then(Value::as_object)
            .map(|p| p.keys().cloned().collect())
            .unwrap_or_default();
        if let Some(id) = assignment_id {
            let suffix = format!(":{id}");
            for held in state
                .doc
                .get("assignments")
                .and_then(Value::as_object)
                .into_iter()
                .flat_map(Map::keys)
            {
                if let Some(provider) = held.strip_suffix(&suffix) {
                    if !keys.iter().any(|k| k == provider) {
                        keys.push(provider.to_string());
                    }
                }
            }
        }
        let cooldown = cooldown_ms.unwrap_or(DEFAULT_QUARANTINE_PROBE_COOLDOWN_MS);
        keys.into_iter()
            .map(|key| {
                let states = self.account_states_of(&state, &key, assignment_id, now_ms, cooldown);
                (key, Value::Object(states))
            })
            .collect()
    }

    // ---- leases -----------------------------------------------------------------------------------------

    fn reclaim_dead_leases(&self, provider_state: &mut Value, reclaim: &Reclaim, now_iso: &str) {
        let Some(accounts) = provider_state
            .get_mut("accounts")
            .and_then(Value::as_object_mut)
        else {
            return;
        };
        for acct in accounts.values_mut() {
            let mut dead = Vec::new();
            let mut reclaimed = false;
            for (run_id, lease) in acct
                .get("leases")
                .and_then(Value::as_object)
                .into_iter()
                .flatten()
            {
                let has_pid = lease.get("pid").is_some_and(|p| !p.is_null());
                let record = lease
                    .get("record")
                    .filter(|r| truthy(r))
                    .cloned()
                    .unwrap_or_else(|| json!({ "pid": lease.get("pid"), "processStartTime": lease.get("processStartTime") }));
                let pid_dead = has_pid && self.host.liveness_of(&record) == Liveness::Dead;
                if (pid_dead && !(reclaim.is_run_worker_alive)(run_id, lease))
                    || (reclaim.run_is_dead)(run_id, lease)
                {
                    dead.push(run_id.clone());
                }
            }
            if let Some(leases) = acct.get_mut("leases").and_then(Value::as_object_mut) {
                for run_id in dead {
                    leases.shift_remove(&run_id);
                    reclaimed = true;
                }
            }
            if reclaimed {
                acct["lastReclaimedAt"] = json!(now_iso);
            }
        }
    }

    /// Lease exactly the account Seat Binding named. The ranking was done before the lock; under the lock this only
    /// re-checks that the account can still be taken and writes the lease. An account that cannot be taken is a
    /// `lease-conflict` (never replaced by another one). `None` when the provider is not managed; otherwise the
    /// selection (`status: selected`) or the refusal (`status: refused`).
    pub fn acquire_named_account_lease(
        &self,
        inventory: &Map<String, Value>,
        ask: &NamedLease,
        reclaim: &Reclaim,
    ) -> Result<Option<Value>> {
        if ask.provider.is_empty() || ask.run_id.is_empty() {
            return Ok(None);
        }
        if self.host.confined() {
            return Err(AccountsError::Config {
                message: "config-accounts-unavailable-confined: a confined session cannot lease an account; the runner, which runs outside the sandbox, leases one and hands the worker its credential".into(),
                code: Some("config-accounts-unavailable-confined"),
            });
        }
        let accounts = inventory
            .get(ask.provider)
            .and_then(|p| p.get("accounts"))
            .and_then(Value::as_object);
        let Some(accounts) = accounts.filter(|a| !a.is_empty()) else {
            return Ok(None);
        };
        let label =
            |id: Option<&str>| format!("\"{}/{}\"", ask.provider, id.unwrap_or("undefined"));
        let refuse = |detail: String| {
            Ok(Some(conflict(
                ask.provider,
                ask.account_id,
                detail,
                ask.cli,
            )))
        };
        let Some(account_id) = ask.account_id else {
            return refuse(format!("account {} is not in the inventory", label(None)));
        };
        let Some(account) = accounts.get(account_id) else {
            return refuse(format!(
                "account {} is not in the inventory",
                label(Some(account_id))
            ));
        };
        if account.get("disabled") == Some(&json!(true)) {
            return refuse(format!("account {} is disabled", label(Some(account_id))));
        }
        if ask.cli.is_some()
            && super::credential::credential_source_for_cli(account, ask.cli).is_none()
        {
            return refuse(format!(
                "account {} holds no \"{}\" login store",
                label(Some(account_id)),
                ask.cli.unwrap_or_default()
            ));
        }
        let state_path = self.state_path();
        self.with_state_lock(ask.lock_wait_ms, || {
            let mut state = self.read_state(&state_path);
            let now = self.now();
            let now_iso = iso_from_ms(now);
            state.providers().entry(ask.provider).or_insert_with(|| json!({ "accounts": {} }));
            {
                let provider_state = state.providers().get_mut(ask.provider).expect("just inserted");
                self.reclaim_dead_leases(provider_state, reclaim, &now_iso);
            }
            let acct = state.account(ask.provider, account_id);
            if is_quarantined(Some(acct), now) {
                return refuse(format!("account {} is quarantined", label(Some(account_id))));
            }
            acct["lastSelectedAt"] = json!(now_iso);
            let record = self.host.self_record();
            let start_time = record.get("startTime").cloned().unwrap_or(Value::Null);
            obj_mut(acct, "leases").insert(
                ask.run_id.to_string(),
                json!({
                    "runId": ask.run_id,
                    "assignmentId": ask.assignment_id,
                    "pid": self.host.pid(),
                    "processStartTime": start_time,
                    "record": record,
                    "acquiredAt": now_iso,
                }),
            );
            if let Some(assignment) = ask.assignment_id {
                state.assignments().insert(
                    format!("{}:{assignment}", ask.provider),
                    json!({ "accountId": account_id, "selectedAt": now_iso }),
                );
            }
            self.write_state(&state_path, &mut state)?;
            let mut selection = Map::new();
            selection.insert("contract".into(), json!(SELECTION_CONTRACT));
            selection.insert("status".into(), json!("selected"));
            selection.insert("provider".into(), json!(ask.provider));
            selection.insert("accountId".into(), json!(account_id));
            if let Some(label) = account.get("label") {
                selection.insert("accountLabel".into(), label.clone());
            }
            selection.insert("selectedAt".into(), json!(now_iso));
            selection.insert("lease".into(), json!({ "runId": ask.run_id, "assignmentId": ask.assignment_id, "pid": self.host.pid() }));
            selection.insert(
                "leaseReceipt".into(),
                json!({ "provider": ask.provider, "accountId": account_id, "runId": ask.run_id, "acquiredAt": now_iso, "accountViewDigest": ask.account_view_digest }),
            );
            let source = super::credential::credential_source_for_cli(account, ask.cli);
            selection.insert("credentialSource".into(), source.cloned().unwrap_or(Value::Null));
            if let Some(sources) = account.get("credentialSources").filter(|s| truthy(s)) {
                selection.insert("credentialSources".into(), sources.clone());
            }
            Ok(Some(Value::Object(selection)))
        })
    }

    /// Audit a lease receipt against the provider's own record of the lease it granted: `None` when they agree
    /// (or neither exists), and what differs when they do not.
    pub fn audit_lease_receipt(
        &self,
        receipt: Option<&Value>,
        assignment_id: &str,
    ) -> Option<String> {
        let state = self.read_state(&self.state_path());
        let assignments = state.doc.get("assignments").and_then(Value::as_object);
        let suffix = format!(":{assignment_id}");
        let Some(receipt) = receipt.filter(|r| truthy(r)) else {
            let held = assignments?.keys().find(|key| key.ends_with(&suffix))?;
            return Some(format!(
                "the provider record names a lease for this assignment ({}), the attempt has no readable receipt",
                &held[..held.len() - suffix.len()]
            ));
        };
        let provider = str_of(receipt, "provider").unwrap_or("undefined");
        let held = assignments.and_then(|a| a.get(&format!("{provider}{suffix}")));
        let (account, acquired) = (str_of(receipt, "accountId"), str_of(receipt, "acquiredAt"));
        if held.is_some_and(|h| {
            str_of(h, "accountId") == account && str_of(h, "selectedAt") == acquired
        }) && account.is_some()
        {
            return None;
        }
        let said = held.map_or("no lease for this assignment".to_string(), |h| {
            format!(
                "{} selected {}",
                str_of(h, "accountId").unwrap_or("undefined"),
                str_of(h, "selectedAt").unwrap_or("undefined")
            )
        });
        Some(format!(
            "the receipt names {provider}/{} acquired {}, the provider record names {said}",
            account.unwrap_or("undefined"),
            acquired.unwrap_or("undefined")
        ))
    }

    /// Drop the lease `run_id` holds on an account; whether there was one.
    pub fn release_account_lease(
        &self,
        provider: &str,
        account_id: &str,
        run_id: &str,
    ) -> Result<bool> {
        if provider.is_empty() || account_id.is_empty() || run_id.is_empty() {
            return Ok(false);
        }
        let state_path = self.state_path();
        self.with_state_lock(None, || {
            let mut state = self.read_state(&state_path);
            let leases = state
                .doc
                .get_mut("providers")
                .and_then(|p| p.get_mut(provider))
                .and_then(|p| p.get_mut("accounts"))
                .and_then(|a| a.get_mut(account_id))
                .and_then(|a| a.get_mut("leases"))
                .and_then(Value::as_object_mut);
            if !leases.is_some_and(|leases| leases.shift_remove(run_id).is_some()) {
                return Ok(false);
            }
            self.write_state(&state_path, &mut state)?;
            Ok(true)
        })
    }

    /// Forget which account an attempt's assignment held, once the controller recorded the attempt's outcome.
    pub fn drop_assignment_record(&self, assignment_id: &str) -> Result<bool> {
        if assignment_id.is_empty() {
            return Ok(false);
        }
        let state_path = self.state_path();
        let suffix = format!(":{assignment_id}");
        self.with_state_lock(None, || {
            let mut state = self.read_state(&state_path);
            let keys: Vec<String> = state
                .assignments()
                .keys()
                .filter(|k| k.ends_with(&suffix))
                .cloned()
                .collect();
            if keys.is_empty() {
                return Ok(false);
            }
            for key in keys {
                state.assignments().shift_remove(&key);
            }
            self.write_state(&state_path, &mut state)?;
            Ok(true)
        })
    }

    // ---- quarantine -------------------------------------------------------------------------------------

    fn set_quarantine(&self, state: &mut State, q: &QuarantineSet) -> Value {
        let now_iso = iso_from_ms(self.now());
        let acct = state.account(q.provider, q.account_id);
        acct["lastFaultAt"] = json!(now_iso);
        let mut quarantine = Map::new();
        quarantine.insert("kind".into(), json!(q.kind));
        quarantine.insert("reasonCode".into(), json!(q.reason_code));
        if let Some(until) = q.until.filter(|u| !u.is_empty()) {
            quarantine.insert("until".into(), json!(until));
        }
        if let Some(known) = q.reset_known {
            quarantine.insert("resetKnown".into(), json!(known));
        }
        if let Some(detail) = q.detail.as_ref().filter(|d| truthy(d)) {
            quarantine.insert("detail".into(), detail.clone());
        }
        quarantine.insert("quarantinedAt".into(), json!(now_iso));
        let quarantine = Value::Object(quarantine);
        acct["quarantine"] = quarantine.clone();
        quarantine
    }

    /// Quarantine an account by hand or by rule.
    pub fn quarantine_account(&self, q: &QuarantineSet) -> Result<Value> {
        let state_path = self.state_path();
        self.with_state_lock(None, || {
            let mut state = self.read_state(&state_path);
            let quarantine = self.set_quarantine(&mut state, q);
            self.write_state(&state_path, &mut state)?;
            Ok(quarantine)
        })
    }

    /// Records one classified provider fault on the account that ran the attempt: quarantines it when the classifier
    /// says so and appends one `fault` line to the audit log, both under the state lock. `None` for a fault that is
    /// no provider stop.
    pub fn record_account_fault(&self, ask: &FaultRecord) -> Result<Option<Value>> {
        let action = ask.fault.get("action").and_then(Value::as_str);
        let reason = str_of(&ask.fault, "reasonCode");
        if action != Some("quarantine")
            && !matches!(
                reason,
                Some("quota-limit" | "auth-token" | "provider-error")
            )
        {
            return Ok(None);
        }
        let state_path = self.state_path();
        self.with_state_lock(None, || {
            let mut state = self.read_state(&state_path);
            let quarantine = self.apply_fault(&mut state, ask);
            self.write_state(&state_path, &mut state)?;
            Ok(quarantine)
        })
    }

    fn apply_fault(&self, state: &mut State, ask: &FaultRecord) -> Option<Value> {
        let quarantine = (ask.fault.get("action").and_then(Value::as_str) == Some("quarantine")).then(|| {
            self.set_quarantine(
                state,
                &QuarantineSet {
                    provider: ask.provider,
                    account_id: ask.account_id,
                    reason_code: str_of(&ask.fault, "reasonCode").unwrap_or("undefined"),
                    kind: str_of(&ask.fault, "quarantineKind").unwrap_or("temporary"),
                    until: str_of(&ask.fault, "until"),
                    reset_known: ask.fault.get("resetKnown").and_then(Value::as_bool),
                    detail: Some(json!({ "kind": "provider-stop", "runId": ask.run_id, "assignmentId": ask.assignment_id })),
                },
            )
        });
        let summary = quarantine.as_ref().map_or(Value::Null, |q| {
            let mut out = Map::new();
            out.insert("kind".into(), q["kind"].clone());
            if let Some(until) = q.get("until") {
                out.insert("until".into(), until.clone());
            }
            if let Some(known) = q.get("resetKnown").filter(|k| k.is_boolean()) {
                out.insert("resetKnown".into(), known.clone());
            }
            Value::Object(out)
        });
        let mut record = Map::new();
        record.insert("contract".into(), json!(AUDIT_CONTRACT));
        record.insert("action".into(), json!("fault"));
        record.insert("at".into(), json!(iso_from_ms(self.now())));
        record.insert("provider".into(), json!(ask.provider));
        record.insert("accountId".into(), json!(ask.account_id));
        record.insert(
            "reasonCode".into(),
            ask.fault.get("reasonCode").cloned().unwrap_or(Value::Null),
        );
        record.insert("quarantine".into(), summary);
        record.insert(
            "providerSignal".into(),
            ask.provider_signal
                .clone()
                .filter(|s| !s.is_null())
                .unwrap_or(Value::Null),
        );
        record.insert("runId".into(), ask.run_id.map_or(Value::Null, |r| json!(r)));
        record.insert(
            "assignmentId".into(),
            ask.assignment_id.map_or(Value::Null, |r| json!(r)),
        );
        if ask.source == "probe" {
            record.insert("source".into(), json!("probe"));
        }
        state.audit.push(Value::Object(record));
        quarantine
    }

    fn apply_clear(
        &self,
        state: &mut State,
        provider: &str,
        account_id: &str,
        reason: Option<&str>,
        caller: Option<&str>,
    ) -> Value {
        let previous = state
            .account_ref(provider, account_id)
            .and_then(|a| a.get("quarantine"))
            .cloned()
            .filter(truthy);
        state.account(provider, account_id)["quarantine"] = Value::Null;
        let caller = caller.map_or(Value::Null, |c| json!(c));
        let record = json!({
            "contract": AUDIT_CONTRACT,
            "action": "clear-quarantine",
            "status": "cleared",
            "clearedAt": iso_from_ms(self.now()),
            "provider": provider,
            "accountId": account_id,
            "previousQuarantine": previous.unwrap_or(Value::Null),
            "reason": reason.filter(|r| !r.is_empty()).map_or(Value::Null, |r| json!(r)),
            "caller": caller,
            "actor": caller,
        });
        state.audit.push(record.clone());
        record
    }

    /// Lift a quarantine by hand; refused for an account the inventory does not list, and for one that is not
    /// quarantined unless `force`.
    pub fn clear_account_quarantine(
        &self,
        inventory: &Map<String, Value>,
        provider: &str,
        account_id: &str,
        reason: Option<&str>,
        force: bool,
        caller: Option<&str>,
    ) -> Result<Value> {
        if inventory
            .get(provider)
            .and_then(|p| p.get("accounts"))
            .and_then(|a| a.get(account_id))
            .is_none()
        {
            return Err(AccountsError::config(format!(
                "provider-capacity clear-quarantine refused: unknown provider/account {provider}/{account_id}"
            )));
        }
        let state_path = self.state_path();
        let fallback = self.host.user();
        self.with_state_lock(None, || {
            let mut state = self.read_state(&state_path);
            let held = state.account_ref(provider, account_id).and_then(|a| a.get("quarantine")).is_some_and(truthy);
            if !held && !force {
                return Err(AccountsError::config(format!(
                    "provider-capacity clear-quarantine refused: account {provider}/{account_id} is not quarantined"
                )));
            }
            let record = self.apply_clear(&mut state, provider, account_id, reason, caller.or(fallback.as_deref()));
            self.write_state(&state_path, &mut state)?;
            Ok(record)
        })
    }

    // ---- probes -----------------------------------------------------------------------------------------

    fn apply_account_probe(&self, state: &mut State, probe: &ProbeRecord) {
        let direct: Vec<Value> = probe
            .direct
            .iter()
            .map(|row| {
                json!({
                    "cli": row.get("cli").filter(|v| !v.is_null()).cloned().unwrap_or(Value::Null),
                    "ok": row.get("ok") == Some(&json!(true)),
                    "reason": row.get("reason").cloned().unwrap_or(Value::Null),
                    "providerSignal": row.get("providerSignal").cloned().unwrap_or(Value::Null),
                    "elapsedMs": row.get("elapsedMs").cloned().unwrap_or(Value::Null),
                })
            })
            .collect();
        state.audit.push(json!({
            "contract": AUDIT_CONTRACT,
            "action": "probe",
            "at": iso_from_ms(probe.now_ms),
            "provider": probe.provider,
            "accountId": probe.account_id,
            "verdict": probe.verdict.map_or(Value::Null, |v| json!(v)),
            "direct": direct,
            "source": probe.source,
        }));
        if let Some(row) = probe.direct.iter().find(|row| is_account_fault_row(row)) {
            let cause = if str_of(row, "reason") == Some("login") {
                "credential"
            } else {
                "quota"
            };
            let signal = row.get("providerSignal").cloned().unwrap_or(Value::Null);
            let fault = classify_fault(&FaultInput {
                provider: probe.provider,
                adapter_outcome: Some("provider-limit"),
                stop_cause: Some(cause),
                provider_signal: signal.clone(),
                now_ms: probe.now_ms,
                utc_offset_min: self.host.utc_offset_min(probe.now_ms),
                ..FaultInput::default()
            });
            self.apply_fault(
                state,
                &FaultRecord {
                    provider: probe.provider,
                    account_id: probe.account_id,
                    fault,
                    provider_signal: Some(signal),
                    run_id: None,
                    assignment_id: None,
                    source: "probe",
                },
            );
            return;
        }
        let held = state
            .account_ref(probe.provider, probe.account_id)
            .and_then(|a| a.get("quarantine"))
            .filter(|q| truthy(q));
        let clearable = held
            .is_some_and(|q| matches!(str_of(q, "reasonCode"), Some("quota-limit" | "auth-token")));
        if !probe.direct.is_empty()
            && probe
                .direct
                .iter()
                .all(|row| row.get("ok") == Some(&json!(true)))
            && clearable
        {
            let caller = if probe.source == "self" {
                "fgos provider-capacity probe"
            } else {
                "fgos dispatch probe-account"
            };
            self.apply_clear(
                state,
                probe.provider,
                probe.account_id,
                Some("a direct call answered"),
                Some(caller),
            );
        }
    }

    /// Records what a direct call to an account found, in one state-lock section: a login or quota stop quarantines
    /// the account through the fault door, a call that answered on every login store lifts a quota or login
    /// quarantine, and one `probe` line says what was seen either way. Returns the quarantine left.
    pub fn record_account_probe(&self, probe: &ProbeRecord) -> Result<Option<Value>> {
        if probe.provider.is_empty() || probe.account_id.is_empty() {
            return Err(AccountsError::config(
                "provider-capacity record-account-probe refused: provider, accountId and a direct row list are required",
            ));
        }
        if !matches!(probe.source, "probe-account" | "self") {
            return Err(AccountsError::config(format!(
                "provider-capacity record-account-probe refused: unknown source {}",
                probe.source
            )));
        }
        let state_path = self.state_path();
        self.with_state_lock(None, || {
            let mut state = self.read_state(&state_path);
            self.apply_account_probe(&mut state, probe);
            let left = state
                .account_ref(probe.provider, probe.account_id)
                .and_then(|a| a.get("quarantine"))
                .cloned()
                .filter(truthy);
            self.write_state(&state_path, &mut state)?;
            Ok(left)
        })
    }

    /// Try the quarantined accounts of `provider` with one real call each, and stop at the first that answers. Two
    /// kinds are tried: an `auth-token` lock when no account of the provider is usable (at most once per cooldown),
    /// and a `quota-limit` lock whose reset the provider never named (once per `run_key`). A failed probe never
    /// throws: the answer goes through [`Accounts::record_account_probe`] and the attempt is stamped on the lock.
    /// `probe` makes one real call with the account's credential, under the account lock it is handed.
    pub fn probe_quarantined_accounts(
        &self,
        inventory: &Map<String, Value>,
        ask: &QuarantineProbe,
        probe: &mut dyn FnMut(&ProbeRequest, &AccountLock) -> Value,
    ) -> Result<Vec<Value>> {
        let Some(accounts) = inventory
            .get(ask.provider)
            .and_then(|p| p.get("accounts"))
            .and_then(Value::as_object)
        else {
            return Ok(Vec::new());
        };
        let cooldown = ask
            .cooldown_ms
            .unwrap_or(DEFAULT_QUARANTINE_PROBE_COOLDOWN_MS);
        let now = ask.now_ms;
        let attempted_at = iso_from_ms(now);
        let state_path = self.state_path();
        let claimed: Vec<(String, Option<String>)> = self.with_state_lock(None, || {
            let mut state = self.read_state(&state_path);
            let enabled: Vec<&String> = accounts
                .iter()
                .filter(|(_, a)| a.get("disabled") != Some(&json!(true)))
                .map(|(id, _)| id)
                .collect();
            let none_usable = !enabled
                .iter()
                .any(|id| !is_quarantined(state.account_ref(ask.provider, id), now));
            let mut picked = Vec::new();
            for id in enabled {
                let Some(quarantine) = state
                    .account_ref(ask.provider, id)
                    .and_then(|a| a.get("quarantine"))
                    .filter(|q| truthy(q))
                    .cloned()
                else {
                    continue;
                };
                let active = is_quarantined(state.account_ref(ask.provider, id), now);
                if str_of(&quarantine, "kind") == Some("manual-clear")
                    && str_of(&quarantine, "reasonCode") == Some("auth-token")
                {
                    let last = quarantine
                        .get("probe")
                        .and_then(|p| str_of(p, "attemptedAt"))
                        .and_then(ms_from_iso);
                    if !none_usable || last.is_some_and(|at| now - at < cooldown) {
                        continue;
                    }
                } else if str_of(&quarantine, "reasonCode") == Some("quota-limit")
                    && quarantine.get("resetKnown") == Some(&json!(false))
                {
                    let Some(run_key) = ask.run_key.filter(|k| !k.is_empty()) else {
                        continue;
                    };
                    if quarantine.get("probe").and_then(|p| str_of(p, "runKey")) == Some(run_key) {
                        continue;
                    }
                    if if active {
                        !none_usable
                    } else {
                        ask.account_id != Some(id.as_str())
                    } {
                        continue;
                    }
                } else {
                    continue;
                }
                let mut stamp = json!({ "attemptedAt": attempted_at, "status": "running" });
                if let Some(run_key) = ask.run_key.filter(|k| !k.is_empty()) {
                    stamp["runKey"] = json!(run_key);
                }
                state.account(ask.provider, id)["quarantine"]["probe"] = stamp;
                picked.push((
                    id.clone(),
                    str_of(&quarantine, "quarantinedAt").map(String::from),
                ));
            }
            if !picked.is_empty() {
                self.write_state(&state_path, &mut state)?;
            }
            Ok(picked)
        })?;

        let mut tried = Vec::new();
        for (account_id, quarantined_at) in claimed {
            let request = ProbeRequest {
                provider: ask.provider,
                account_id: &account_id,
                account: &accounts[&account_id],
                cli: ask.cli,
                model: ask.model,
            };
            let result = match self.acquire_account_lock(
                ask.provider,
                &account_id,
                Some(ask.account_lock_wait_ms.unwrap_or(120_000)),
            ) {
                Ok(lock) => {
                    let answer = probe(&request, &lock);
                    lock.release();
                    answer
                }
                Err(error) => json!({ "ok": false, "detail": error.to_string() }),
            };
            let ok = result.get("ok") == Some(&json!(true));
            let detail = result
                .get("detail")
                .and_then(Value::as_str)
                .filter(|d| !d.is_empty())
                .map(|d| d.chars().take(300).collect::<String>());
            let row = json!({
                "cli": ask.cli, "ok": ok,
                "reason": result.get("reason").cloned().unwrap_or(Value::Null),
                "providerSignal": result.get("providerSignal").cloned().unwrap_or(Value::Null),
                "exitCode": result.get("exitCode").cloned().unwrap_or(Value::Null),
                "elapsedMs": result.get("elapsedMs").cloned().unwrap_or(Value::Null),
            });
            self.with_state_lock(None, || {
                let mut state = self.read_state(&state_path);
                let target = state
                    .account_ref(ask.provider, &account_id)
                    .and_then(|a| a.get("quarantine"))
                    .filter(|q| truthy(q));
                // A person may have cleared or replaced the quarantine while the call ran: leave that alone.
                if target.is_none_or(|q| str_of(q, "quarantinedAt") != quarantined_at.as_deref()) {
                    return Ok(());
                }
                let verdict = direct_verdict(std::slice::from_ref(&row));
                self.apply_account_probe(
                    &mut state,
                    &ProbeRecord {
                        provider: ask.provider,
                        account_id: &account_id,
                        direct: vec![row.clone()],
                        verdict,
                        source: "self",
                        now_ms: now,
                    },
                );
                let still = state
                    .account_ref(ask.provider, &account_id)
                    .and_then(|a| a.get("quarantine"))
                    .is_some_and(truthy);
                if !ok && still {
                    let mut stamp = json!({ "attemptedAt": attempted_at, "status": "failed" });
                    if let Some(detail) = &detail {
                        stamp["detail"] = json!(detail);
                    }
                    if let Some(run_key) = ask.run_key.filter(|k| !k.is_empty()) {
                        stamp["runKey"] = json!(run_key);
                    }
                    state.account(ask.provider, &account_id)["quarantine"]["probe"] = stamp;
                }
                self.write_state(&state_path, &mut state)
            })?;
            tried.push(json!({ "accountId": account_id, "unlocked": ok, "detail": detail }));
            if ok {
                break;
            }
        }
        Ok(tried)
    }

    // ---- inspection -------------------------------------------------------------------------------------

    /// What `fgos dispatch` shows for the accounts: per provider and account, whether it is healthy, its quarantine
    /// and its open leases.
    pub fn inspect_provider_capacity(
        &self,
        inventory: &Map<String, Value>,
        provider: Option<&str>,
        account_id: Option<&str>,
    ) -> Value {
        let state = self.read_state(&self.state_path());
        let now = self.now();
        let mut providers = Map::new();
        for (provider_id, entry) in inventory {
            if provider.is_some_and(|p| p != provider_id) {
                continue;
            }
            let mut accounts_out = Map::new();
            for (id, account) in entry
                .get("accounts")
                .and_then(Value::as_object)
                .into_iter()
                .flatten()
            {
                if account_id.is_some_and(|a| a != id) {
                    continue;
                }
                let acct = state.account_ref(provider_id, id);
                let mut out = Map::new();
                out.insert("accountId".into(), json!(id));
                out.insert(
                    "label".into(),
                    account.get("label").cloned().unwrap_or(Value::Null),
                );
                if account.get("disabled") == Some(&json!(true)) {
                    out.insert("disabled".into(), json!(true));
                }
                if let Some(unusable) = account.get("unusableFor").filter(|u| truthy(u)) {
                    out.insert("unusableFor".into(), unusable.clone());
                }
                out.insert("healthy".into(), json!(!is_quarantined(acct, now)));
                out.insert(
                    "quarantine".into(),
                    acct.and_then(|a| a.get("quarantine"))
                        .cloned()
                        .unwrap_or(Value::Null),
                );
                let leases: Vec<Value> = acct
                    .and_then(|a| a.get("leases"))
                    .and_then(Value::as_object)
                    .into_iter()
                    .flat_map(Map::values)
                    .map(|lease| {
                        json!({
                            "runId": lease.get("runId").cloned().unwrap_or(Value::Null),
                            "assignmentId": lease.get("assignmentId").filter(|v| !v.is_null()).cloned().unwrap_or(Value::Null),
                            "pid": lease.get("pid").filter(|v| !v.is_null()).cloned().unwrap_or(Value::Null),
                            "acquiredAt": lease.get("acquiredAt").cloned().unwrap_or(Value::Null),
                        })
                    })
                    .collect();
                out.insert("openLeases".into(), Value::Array(leases));
                out.insert(
                    "lastSelectedAt".into(),
                    acct.and_then(|a| a.get("lastSelectedAt"))
                        .filter(|v| !v.is_null())
                        .cloned()
                        .unwrap_or(Value::Null),
                );
                out.insert(
                    "lastFaultAt".into(),
                    acct.and_then(|a| a.get("lastFaultAt"))
                        .filter(|v| !v.is_null())
                        .cloned()
                        .unwrap_or(Value::Null),
                );
                accounts_out.insert(id.clone(), Value::Object(out));
            }
            providers.insert(provider_id.clone(), json!({ "accounts": accounts_out }));
        }
        json!({ "contract": INSPECT_CONTRACT, "providers": providers })
    }
}

/// A quarantine to write.
#[derive(Debug, Clone)]
pub struct QuarantineSet<'a> {
    pub provider: &'a str,
    pub account_id: &'a str,
    pub reason_code: &'a str,
    pub kind: &'a str,
    pub until: Option<&'a str>,
    pub reset_known: Option<bool>,
    pub detail: Option<Value>,
}

/// One classified provider fault on an account.
#[derive(Debug, Clone)]
pub struct FaultRecord<'a> {
    pub provider: &'a str,
    pub account_id: &'a str,
    /// The [`classify_fault`] answer.
    pub fault: Value,
    pub provider_signal: Option<Value>,
    pub run_id: Option<&'a str>,
    pub assignment_id: Option<&'a str>,
    /// `run` (the default, carries no marker) or `probe`.
    pub source: &'a str,
}

/// What a direct call to an account found.
#[derive(Debug, Clone)]
pub struct ProbeRecord<'a> {
    pub provider: &'a str,
    pub account_id: &'a str,
    pub direct: Vec<Value>,
    pub verdict: Option<&'a str>,
    /// `probe-account` or `self`.
    pub source: &'a str,
    pub now_ms: i64,
}

/// What the unlock probe is asked.
#[derive(Debug, Clone, Default)]
pub struct QuarantineProbe<'a> {
    pub provider: &'a str,
    pub cli: Option<&'a str>,
    pub model: Option<&'a str>,
    /// The account the caller is about to use (an expired quota lock is only tried for it).
    pub account_id: Option<&'a str>,
    /// The run asking; a quota lock already tried by this run is not tried again.
    pub run_key: Option<&'a str>,
    pub now_ms: i64,
    pub cooldown_ms: Option<i64>,
    pub account_lock_wait_ms: Option<u64>,
}

/// What the probe function is handed for one account.
#[derive(Debug, Clone, Copy)]
pub struct ProbeRequest<'a> {
    pub provider: &'a str,
    pub account_id: &'a str,
    pub account: &'a Value,
    pub cli: Option<&'a str>,
    pub model: Option<&'a str>,
}

/// A direct row that proves the account itself is at fault: the CLI named a login or quota stop and exited non-zero.
fn is_account_fault_row(row: &Value) -> bool {
    row.get("ok") != Some(&json!(true))
        && matches!(str_of(row, "reason"), Some("login" | "usage-limit"))
        && row
            .get("exitCode")
            .and_then(Value::as_f64)
            .is_some_and(|code| code != 0.0)
}

/// The account-side verdict one leg alone can give: `healthy`, `account-fault`, or `None` when inconclusive.
pub fn direct_verdict(rows: &[Value]) -> Option<&'static str> {
    if !rows.is_empty() && rows.iter().all(|r| r.get("ok") == Some(&json!(true))) {
        return Some("healthy");
    }
    (!rows.is_empty() && rows.iter().all(is_account_fault_row)).then_some("account-fault")
}

/// The text JSON.parse would give for a parse error, for the reset record (Node keeps its own wording; the
/// detail is evidence, not a contract).
fn js_parse_message(error: &serde_json::Error) -> String {
    error.to_string()
}
