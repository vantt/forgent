//! Credential renewal for a leased provider account.
//!
//! Dispatch copies an account's credential files into a private home that is deleted afterwards. A login whose
//! refresh token is single use (pi, omp and Codex all are; a Claude Code login is kept the same way) breaks if the
//! renewal happens inside such a copy: the provider retires the source's refresh token and the new pair goes away
//! with the home. Two halves keep the source usable:
//!
//! * **refresh-ahead** ([`renew`]): before a private home is built from an account whose login is close to
//!   expiry, renew it once inside a scratch copy fgOS owns, under the account lock, and apply the new entry to
//!   the real store. The real store is never made to look expired, and a failed renewal leaves it untouched.
//! * **write-back** ([`store::write_back_renewed_credential`]): when a private home is removed, a login a pane
//!   renewed inside it is staged beside the source as a copy of agent origin. The next refresh-ahead applies it
//!   only once a renewal made with its own refresh token returns a token of the leased account.
//!
//! Applying is always compare-before-write: only an entry whose expiry is strictly later than the source's and
//! whose refresh token is a different one replaces it, and a copy that cannot be read, has an unexpected shape
//! or lacks a refresh token the source has never touches the source. A copy is removed only when the source was
//! read and proves the copy is not newer, or when the copy itself is unusable; otherwise it is kept for the next
//! holder of the account lock. Nothing here prints, logs or returns a token value; results carry fixed codes.
//!
//! The account lock, the credential probe and the SQLite engine are ports ([`ports`]); the accounts module serves the
//! first two ([`ports::AccountsLocks`], [`ports::AccountsProbe`]), the account directories and the home reading are
//! its own. The files and directory names are the ones the previous Node release reads, byte for byte.

pub mod apply;
pub mod copy;
pub mod files;
pub mod layout;
pub mod ports;
pub mod renew;
pub mod store;

use std::path::{Path, PathBuf};

pub use apply::{apply_renewed_credential, ApplyOutcome, ApplyRequest};
pub use copy::{copy_credential_files, CopyOptions};
pub use files::Code;
pub use layout::{Entry, Layout, CODEX_REFRESH_INTERVAL_MS};
pub use ports::{
    AccountLockGuard, AccountLocks, AccountsLocks, AccountsProbe, CredentialProbe, LockBusy,
    NoLocks, NoSqlite, ProbeRequest, ProbeRun, SqliteAdapter,
};
pub use renew::{refresh_ahead, RefreshOptions, RefreshOutcome, RefreshRequest};
pub use store::{
    credential_write_back_target, inspect_pending_copies_over_limit,
    inspect_retained_credential_copies, sweep_interrupted_stagings, write_back_renewed_credential,
    AccountInventory, InventoryAccount, RetainedCopy, StoreJudgement, WriteBackOutcome,
};

pub(crate) use crate::accounts::state::credential_store_dir;
use files::MINUTE_MS;

pub const DEFAULT_REFRESH_AHEAD_MIN_THRESHOLD_MS: f64 = 60.0 * MINUTE_MS;
pub const DEFAULT_RENEWAL_COOLDOWN_MS: f64 = 30.0 * MINUTE_MS;
pub const DEFAULT_CREDENTIAL_PROBE_TIMEOUT_MS: u64 = 120_000;
pub const MAX_PENDING_COPIES: usize = 5;
/// A staging is a few file copies and syncs; one that has not changed for this long is not being written.
pub const STAGING_MIN_AGE_MS: f64 = 10.0 * MINUTE_MS;

const THRESHOLD_MARGIN_MS: f64 = 5.0 * MINUTE_MS;

/// A credential source of a provider account: `kind` is `codex-home` or `home-files` (with `files`), `cli` names
/// the login store of an account that keeps one per CLI.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct CredentialSource {
    pub kind: String,
    pub home: String,
    pub files: Vec<String>,
    pub cli: Option<String>,
}

/// The refresh-ahead window: at least an hour, and always longer than one renewal call plus a margin.
pub fn default_refresh_ahead_threshold_ms(probe_timeout_ms: f64) -> f64 {
    DEFAULT_REFRESH_AHEAD_MIN_THRESHOLD_MS.max(probe_timeout_ms + THRESHOLD_MARGIN_MS)
}

/// The layout of a credential source (the same order the probe command uses), or `None`.
pub fn credential_layout(source: &CredentialSource) -> Option<Layout> {
    match source.kind.as_str() {
        "codex-home" => Some(Layout::CodexAuthJson),
        "home-files" => {
            let has = |name: &str| source.files.iter().any(|f| f == name);
            if has("agent.db") {
                Some(Layout::OmpAgentDb)
            } else if has("auth.json") {
                Some(Layout::PiAuthJson)
            } else if has(Layout::ClaudeConfig.files()[0]) {
                Some(Layout::ClaudeConfig)
            } else if has(Layout::ClaudeHome.files()[0]) {
                Some(Layout::ClaudeHome)
            } else {
                None
            }
        }
        _ => None,
    }
}

/// A credential home as a path, read through the execution rules' one reading of it (a leading `~`, `$HOME` or
/// `${HOME}` is `home_dir`); `None` when it is empty or not absolute once expanded.
pub(crate) fn credential_home(home: &str, home_dir: Option<&str>) -> Option<PathBuf> {
    fgos_execution::accounts::expand_credential_home(home, home_dir).map(PathBuf::from)
}

/// One expiry entry of a credential home; values are never part of it.
#[derive(Debug, Clone, PartialEq)]
pub struct ExpiryEntry {
    pub key: String,
    pub expires_ms: f64,
    pub due_ms: f64,
}

/// The expiry entries of a credential home, or a fixed code (`missing-file`, `unreadable-file`, `unreadable-json`,
/// `unreadable-db`, `unexpected-shape`, `sqlite-unavailable`, `unknown-layout`).
pub fn read_credential_expiry(
    layout_name: &str,
    home: &Path,
    sqlite: &dyn SqliteAdapter,
) -> Result<Vec<ExpiryEntry>, Code> {
    let layout = Layout::from_name(layout_name).ok_or("unknown-layout")?;
    let read = layout.read(home, false, sqlite)?;
    Ok(read
        .entries
        .iter()
        .map(|e| ExpiryEntry {
            key: e.key.clone(),
            expires_ms: e.expires_ms,
            due_ms: e.due_ms,
        })
        .collect())
}

/// Why a seat may not start on a copy of this login, or `None`. A login whose layout must never refresh inside a
/// seat needs more access-token life than the seat's timeout; otherwise the CLI would refresh in the home and spend
/// the source's token. Unreadable is the copy step's business, not a refusal here. Names and numbers only.
pub fn login_life_problem(
    source: &CredentialSource,
    home_dir: Option<&str>,
    timeout_ms: Option<f64>,
    now: f64,
    sqlite: &dyn SqliteAdapter,
) -> Option<String> {
    let layout = credential_layout(source)?;
    let home = credential_home(&source.home, home_dir)?;
    let timeout = timeout_ms.filter(|t| t.is_finite())?;
    if !layout.seat_must_not_refresh() {
        return None;
    }
    let read = layout.read(&home, false, sqlite).ok()?;
    let left = read
        .entries
        .iter()
        .map(|e| e.expires_ms)
        .fold(f64::INFINITY, f64::min)
        - now;
    (left < timeout).then(|| {
        format!(
            "login-expires-before-seat-timeout: the login has {} min of access-token life left and the seat may run {} min, so the seat would refresh it inside its home",
            (left / 60_000.0).round().max(0.0),
            (timeout / 60_000.0).round()
        )
    })
}
