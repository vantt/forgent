//! What the post-receipt steps read through the host: the screen a terminal attempt's pane showed when it ended,
//! and the homes finalizer that gives a renewed login back with the bundled SQLite engine and the accounts
//! module's per-account locks.

use std::path::Path;

use fgos_execution_engine::accounts::{Accounts, SystemHost};
use fgos_execution_engine::confinement::request::StageRenewedLogin;
use fgos_execution_engine::credentials::{
    AccountLockGuard, AccountLocks, AccountsLocks, BundledSqlite, LockBusy,
};
use fgos_execution_engine::steps::{
    AttemptHomeFinalizer, ConfinementHomes, FinalizedHome, PaneScreen, StepError,
};
use fgos_run_supervisor::terminal_slot::Backend;
use serde_json::Value;

/// `paneScreenOf` (`src/run-supervisor/steps/settle-attempt.mjs:73`): the visible screen of a terminal attempt's
/// pane through the terminal control over the herdr endpoint the supervisor recorded beside the attempt; empty for
/// a direct attempt and for a screen that cannot be read (no evidence, never a failure of the settlement).
pub struct HostPaneScreen;

impl PaneScreen for HostPaneScreen {
    fn visible_screen(&self, run_dir: &Path, envelope: &Value) -> String {
        // A record written before placement went through the Session Host names it `mode`.
        let host = envelope.get("host").or_else(|| envelope.get("mode"));
        if host.and_then(Value::as_str) != Some("terminal") {
            return String::new();
        }
        let Some(key) = envelope.pointer("/slot/key").and_then(Value::as_str) else {
            return String::new();
        };
        let backend = Backend::from_env(run_dir);
        let core = backend.core();
        core.read(key, None, Some("visible")).unwrap_or_default()
    }
}

/// The accounts module's per-account lock over the runtime directory the write-back target names
/// (`tryAcquireAccountLock({ runtimeDir, provider, accountId })`, `src/runner/dispatch/provider-capacity.mjs`): a
/// renewed login is staged under the lock of the account store it belongs to, whichever runtime directory that is.
pub struct TargetAccountLocks;

impl AccountLocks for TargetAccountLocks {
    fn acquire(
        &self,
        runtime_dir: &Path,
        provider: &str,
        account_id: &str,
        wait_ms: u64,
    ) -> Result<Box<dyn AccountLockGuard>, LockBusy> {
        let host = SystemHost::new();
        let accounts = Accounts::new(runtime_dir, fgos_holder_lock::lock_root(), &host);
        AccountsLocks(&accounts).acquire(runtime_dir, provider, account_id, wait_ms)
    }

    fn try_acquire(
        &self,
        runtime_dir: &Path,
        provider: &str,
        account_id: &str,
    ) -> Option<Box<dyn AccountLockGuard>> {
        let host = SystemHost::new();
        let accounts = Accounts::new(runtime_dir, fgos_holder_lock::lock_root(), &host);
        AccountsLocks(&accounts).try_acquire(runtime_dir, provider, account_id)
    }
}

/// `finalizeAttemptHome({ runDir, attemptId })` (`src/run-supervisor/steps/finalize-home.mjs:9`): the Confinement
/// Authority's finalization with credential renewal's write-back over the bundled SQLite engine and the account
/// locks of the target's store.
pub struct HostHomes;

impl AttemptHomeFinalizer for HostHomes {
    fn finalize(&self, run_dir: &Path, attempt_id: &str) -> Result<FinalizedHome, StepError> {
        let stage = StageRenewedLogin {
            sqlite: &BundledSqlite,
            locks: &TargetAccountLocks,
        };
        ConfinementHomes { stage: &stage }.finalize(run_dir, attempt_id)
    }
}
