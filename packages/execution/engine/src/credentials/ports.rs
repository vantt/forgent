//! The seams credential renewal reaches the machine through. The account lock and the credential probe belong
//! to the accounts module; SQLite is an adapter. Each is a replaceable driver behind a port.

use std::path::Path;

use super::CredentialSource;

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
