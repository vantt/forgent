//! The seams credential renewal reaches the machine through. The account lock and the credential probe belong
//! to the accounts module, which serves them here ([`AccountsLocks`], [`AccountsProbe`]); SQLite is an adapter.
//! Each is a replaceable driver behind a port.

use std::collections::BTreeMap;
use std::path::Path;

use serde_json::json;

use super::files::path_str;
use super::CredentialSource;
use crate::accounts::credential_probe::{credential_probe_command, run_credential_probe};
use crate::accounts::{AccountLock, Accounts};

/// One held account lock; the lock is released when the guard is dropped.
pub trait AccountLockGuard {
    /// The account directory the lock guards.
    fn account_dir(&self) -> &Path;
    /// The concrete lock, so a probe driver from the same accounts module can lend it to the call it runs.
    fn as_any(&self) -> &dyn std::any::Any;
}

/// The account lock is held elsewhere and did not free within the wait.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LockBusy;

/// The per-account lock: one per provider account, separate from the state lock.
pub trait AccountLocks {
    /// Wait up to `wait_ms` for the lock; `Err` is "busy".
    fn acquire(
        &self,
        runtime_dir: &Path,
        provider: &str,
        account_id: &str,
        wait_ms: u64,
    ) -> Result<Box<dyn AccountLockGuard>, LockBusy>;
    /// Try once, never wait.
    fn try_acquire(
        &self,
        runtime_dir: &Path,
        provider: &str,
        account_id: &str,
    ) -> Option<Box<dyn AccountLockGuard>>;
}

/// Never grants a lock: every wait is "busy" and every try is "held elsewhere".
pub struct NoLocks;

impl AccountLocks for NoLocks {
    fn acquire(
        &self,
        _: &Path,
        _: &str,
        _: &str,
        _: u64,
    ) -> Result<Box<dyn AccountLockGuard>, LockBusy> {
        Err(LockBusy)
    }
    fn try_acquire(&self, _: &Path, _: &str, _: &str) -> Option<Box<dyn AccountLockGuard>> {
        None
    }
}

impl AccountLockGuard for AccountLock {
    fn account_dir(&self) -> &Path {
        &self.dir
    }
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }
}

/// The accounts module's per-account lock behind the port. Any failure to take it reads as "busy", as the Node
/// module's callers read it; a runtime directory other than the one the accounts live in is never locked.
pub struct AccountsLocks<'a, 'h>(pub &'a Accounts<'h>);

impl AccountLocks for AccountsLocks<'_, '_> {
    fn acquire(
        &self,
        runtime_dir: &Path,
        provider: &str,
        account_id: &str,
        wait_ms: u64,
    ) -> Result<Box<dyn AccountLockGuard>, LockBusy> {
        if runtime_dir != self.0.runtime_dir {
            return Err(LockBusy);
        }
        self.0
            .acquire_account_lock(provider, account_id, Some(wait_ms))
            .map(|lock| Box::new(lock) as Box<dyn AccountLockGuard>)
            .map_err(|_| LockBusy)
    }
    fn try_acquire(
        &self,
        runtime_dir: &Path,
        provider: &str,
        account_id: &str,
    ) -> Option<Box<dyn AccountLockGuard>> {
        if runtime_dir != self.0.runtime_dir {
            return None;
        }
        self.0
            .try_acquire_account_lock(provider, account_id)
            .ok()
            .flatten()
            .map(|lock| Box::new(lock) as Box<dyn AccountLockGuard>)
    }
}

/// The accounts module's credential probe behind the port: the CLI is pointed at the copy, and on unix the call
/// holds the account lock the caller took for as long as it and what it left behind live. A lock that is not the
/// accounts module's own is never lent, so no call runs on unix without it.
pub struct AccountsProbe {
    /// The user's home directory a leading `~` of a credential home stands for.
    pub home_dir: Option<String>,
    /// The environment the call's shell basics are taken from.
    pub inherited: BTreeMap<String, String>,
}

impl CredentialProbe for AccountsProbe {
    fn run(&self, request: &ProbeRequest<'_>, lock: &dyn AccountLockGuard) -> ProbeRun {
        let source = json!({
            "kind": request.source.kind,
            "home": path_str(request.home),
            "files": request.source.files,
        });
        let Some(plan) =
            credential_probe_command(&source, request.no_tools, None, self.home_dir.as_deref())
        else {
            return ProbeRun::NoProbe;
        };
        let held = lock.as_any().downcast_ref::<AccountLock>();
        #[cfg(unix)]
        let judged = match held {
            Some(held) => run_credential_probe(
                &plan,
                &crate::accounts::credential_probe::HoldingRunner(held),
                request.timeout_ms,
                &self.inherited,
            ),
            None => return ProbeRun::Ran { ok: false },
        };
        #[cfg(not(unix))]
        let judged = {
            let _ = held;
            run_credential_probe(
                &plan,
                &crate::accounts::credential_probe::ProcessRunner,
                request.timeout_ms,
                &self.inherited,
            )
        };
        ProbeRun::Ran {
            ok: judged["ok"] == true,
        }
    }
}

/// One call of the provider CLI made on a login copy so the CLI redeems the copy's refresh token.
pub struct ProbeRequest<'a> {
    pub source: &'a CredentialSource,
    /// The home the CLI is pointed at (a scratch copy fgOS owns).
    pub home: &'a Path,
    /// Only the renewal is wanted: the call is given no tools.
    pub no_tools: bool,
    pub timeout_ms: u64,
}

pub enum ProbeRun {
    /// No probe exists for this credential layout.
    NoProbe,
    /// The call ran; `ok` says whether it was judged a success.
    Ran { ok: bool },
}

/// Runs the credential probe while the account lock stays held by the caller.
pub trait CredentialProbe {
    fn run(&self, request: &ProbeRequest<'_>, lock: &dyn AccountLockGuard) -> ProbeRun;
}

/// One `auth_credentials` row of an omp store.
#[derive(Debug, Clone, PartialEq)]
pub struct OmpRow {
    pub id: String,
    pub provider: String,
    pub data: String,
    pub updated_at: Option<String>,
}

/// A row's new `data`; `updated_at` is set too (to the value, `None` meaning null) when the column exists and
/// the field is `Some`.
#[derive(Debug, Clone)]
pub struct RowUpdate {
    pub id: String,
    pub provider: String,
    pub data: String,
    pub updated_at: Option<Option<String>>,
}

/// What a transaction body chooses: the row updates, or a failure code that rolls it back.
pub type RowEdit<'a> = dyn FnMut(&[OmpRow]) -> Result<Vec<RowUpdate>, String> + 'a;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SqliteFailure {
    Unavailable,
    Unreadable,
}

/// The SQLite engine behind the omp store. The engine is an adapter; without one every omp read answers
/// `sqlite-unavailable`, as the Node module does without `node:sqlite`.
pub trait SqliteAdapter {
    fn available(&self) -> bool;
    /// The oauth rows that are not disabled, read-only.
    fn oauth_rows(&self, file: &Path) -> Result<Vec<OmpRow>, SqliteFailure>;
    /// One transaction (`BEGIN IMMEDIATE`): select the oauth rows, let `edit` choose updates (it may fail, which
    /// rolls back), apply them, commit, then checkpoint passively when anything changed.
    fn update_rows(&self, file: &Path, edit: &mut RowEdit<'_>) -> Result<Vec<RowUpdate>, String>;
    /// A consistent snapshot of the file including its write-ahead log, synced to disk before it returns `true`
    /// (a write-back renames the staging that holds it into `pending/` next); `false` leaves nothing behind.
    fn snapshot(&self, source: &Path, destination: &Path) -> bool;
    /// A fresh database at `to` holding only the `auth_credentials` rows of `from`.
    fn isolate_login(&self, from: &Path, to: &Path) -> Result<(), SqliteFailure>;
}

/// No SQLite engine.
pub struct NoSqlite;

impl SqliteAdapter for NoSqlite {
    fn available(&self) -> bool {
        false
    }
    fn oauth_rows(&self, _: &Path) -> Result<Vec<OmpRow>, SqliteFailure> {
        Err(SqliteFailure::Unavailable)
    }
    fn update_rows(&self, _: &Path, _: &mut RowEdit<'_>) -> Result<Vec<RowUpdate>, String> {
        Err("sqlite-unavailable".into())
    }
    fn snapshot(&self, _: &Path, _: &Path) -> bool {
        false
    }
    fn isolate_login(&self, _: &Path, _: &Path) -> Result<(), SqliteFailure> {
        Err(SqliteFailure::Unavailable)
    }
}
