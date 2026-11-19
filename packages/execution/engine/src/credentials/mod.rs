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
//! The account lock, the credential probe and the SQLite engine are ports ([`ports`]); the files and directory
//! names are the ones the previous Node release reads, byte for byte.

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
    AccountLockGuard, AccountLocks, CredentialProbe, LockBusy, NoLocks, NoSqlite, ProbeRequest,
    ProbeRun, SqliteAdapter,
};
pub use renew::{refresh_ahead, RefreshOptions, RefreshOutcome, RefreshRequest};
pub use store::{
    credential_write_back_target, inspect_pending_copies_over_limit,
    inspect_retained_credential_copies, sweep_interrupted_stagings, write_back_renewed_credential,
    AccountInventory, InventoryAccount, RetainedCopy, StoreJudgement, WriteBackOutcome,
};

use files::{path_str, MINUTE_MS};

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

/// An absolute credential home: `$HOME`, `${HOME}` and `~` expand to the user's home; relative is `None`.
pub fn expand_credential_home(home: &str) -> Option<PathBuf> {
    if home.trim().is_empty() {
        return None;
    }
    let user = std::env::var_os("HOME")
        .or_else(|| std::env::var_os("USERPROFILE"))
        .map(|h| path_str(Path::new(&h)));
    let rest = ["${HOME}", "$HOME", "~"].iter().find_map(|p| {
        let tail = home.strip_prefix(p)?;
        (tail.is_empty() || tail.starts_with('/')).then_some(tail)
    });
    let expanded = match (rest, user) {
        (Some(tail), Some(user)) => format!("{user}{tail}"),
        _ => home.to_owned(),
    };
    Path::new(&expanded)
        .is_absolute()
        .then(|| PathBuf::from(expanded))
}

fn account_key_is_safe(value: &str) -> bool {
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
    (account_key_is_safe(provider) && account_key_is_safe(account_id)).then(|| {
        runtime_dir
            .join("account-locks")
            .join(provider)
            .join(account_id)
    })
}

/// Where the copies of one login store wait: the account directory for an account with one store;
/// `stores/<cli>` under it for a store of an account that keeps one per CLI. `None` for an unsafe id or key.
pub fn credential_store_dir(
    runtime_dir: &Path,
    provider: &str,
    account_id: &str,
    cli: Option<&str>,
) -> Option<PathBuf> {
    let account = provider_account_dir(runtime_dir, provider, account_id)?;
    match cli {
        None => Some(account),
        Some(cli) if account_key_is_safe(cli) => Some(account.join("stores").join(cli)),
        Some(_) => None,
    }
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
    timeout_ms: Option<f64>,
    now: f64,
    sqlite: &dyn SqliteAdapter,
) -> Option<String> {
    let layout = credential_layout(source)?;
    let home = expand_credential_home(&source.home)?;
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
