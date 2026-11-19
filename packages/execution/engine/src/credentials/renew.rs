//! Refresh-ahead: renew a login that is close to expiry once, inside a scratch copy fgOS owns, under the account
//! lock, and apply the renewed entry to the real store; and the probe gate for copies of agent origin.

use std::fs;
use std::path::{Path, PathBuf};

use super::apply::{
    apply_renewed_credential, judge_copy, select_provider_entry, ApplyOutcome, ApplyRequest,
    Verdict,
};
use super::copy::{copy_credential_files, CopyOptions};
use super::files::*;
use super::layout::Layout;
use super::ports::{
    AccountLockGuard, AccountLocks, CredentialProbe, ProbeRequest, ProbeRun, SqliteAdapter,
};
use super::store::*;
use super::{
    credential_layout, credential_store_dir, default_refresh_ahead_threshold_ms,
    expand_credential_home, CredentialSource, DEFAULT_CREDENTIAL_PROBE_TIMEOUT_MS,
    DEFAULT_RENEWAL_COOLDOWN_MS,
};

const LOCK_MARGIN_MS: u64 = 30_000;
/// Calls an agent's copy gets before it is set aside; the count is kept inside the copy's own directory.
const AGENT_COPY_TRIES: u32 = 2;
const TRIES_FILE: &str = ".gate-tries";
/// Written into a copy just before the CLI may redeem its refresh token, and removed when the call renewed
/// nothing. A holder of the account lock that finds it was preceded by a runner that died during the call: the token
/// is spent, and the renewed pair, if any, is in that runner's `.tmp-` staging, which the sweep and doctor report.
const SPENT_FILE: &str = ".gate-spent";

pub struct RefreshOptions<'a> {
    pub locks: &'a dyn AccountLocks,
    pub probe: &'a dyn CredentialProbe,
    pub sqlite: &'a dyn SqliteAdapter,
    pub probe_timeout_ms: u64,
    /// The refresh-ahead window; the default is `default_refresh_ahead_threshold_ms(probe_timeout_ms)`.
    pub threshold_ms: Option<f64>,
    pub cooldown_ms: f64,
    /// How long to wait for the account lock; the default is the probe timeout plus a margin.
    pub lock_wait_ms: Option<u64>,
    pub now: &'a dyn Fn() -> f64,
}

impl<'a> RefreshOptions<'a> {
    pub fn new(
        locks: &'a dyn AccountLocks,
        probe: &'a dyn CredentialProbe,
        sqlite: &'a dyn SqliteAdapter,
        now: &'a dyn Fn() -> f64,
    ) -> Self {
        Self {
            locks,
            probe,
            sqlite,
            probe_timeout_ms: DEFAULT_CREDENTIAL_PROBE_TIMEOUT_MS,
            threshold_ms: None,
            cooldown_ms: DEFAULT_RENEWAL_COOLDOWN_MS,
            lock_wait_ms: None,
            now,
        }
    }
}

/// `status` is `fresh`, `renewed`, `failed`, `cooldown` or `skipped`; `reason` is a fixed word. Never a credential.
#[derive(Debug, Clone, PartialEq)]
pub struct RefreshOutcome {
    pub status: &'static str,
    pub reason: String,
}

fn outcome(status: &'static str, reason: impl Into<String>) -> RefreshOutcome {
    RefreshOutcome {
        status,
        reason: reason.into(),
    }
}

pub struct RefreshRequest<'a> {
    pub provider: &'a str,
    pub account_id: &'a str,
    pub credential_source: &'a CredentialSource,
    pub runtime_dir: &'a Path,
}

/// Renew the login of `credential_source` once, in an fgOS-held scratch copy, when it is closer to expiry than the
/// window; apply the renewed entry to the real store.
pub fn refresh_ahead(request: &RefreshRequest<'_>, options: &RefreshOptions<'_>) -> RefreshOutcome {
    let source = request.credential_source;
    let (Some(layout), Some(home)) = (
        credential_layout(source),
        expand_credential_home(&source.home),
    ) else {
        return outcome("skipped", "unsupported-layout");
    };
    // The copies of this store wait in its own directory; the account lock below stays one per account.
    let Some(account_dir) = credential_store_dir(
        request.runtime_dir,
        request.provider,
        request.account_id,
        source.cli.as_deref(),
    ) else {
        return outcome("skipped", "unsupported-layout");
    };
    let now = options.now;
    let threshold = options
        .threshold_ms
        .unwrap_or_else(|| default_refresh_ahead_threshold_ms(options.probe_timeout_ms as f64));
    let lock_wait = options
        .lock_wait_ms
        .unwrap_or(options.probe_timeout_ms + LOCK_MARGIN_MS);
    let in_window = |due: f64| due - now() < threshold;

    // Only the dispatched provider's entry counts, both for the window and for "was it renewed".
    let before = match layout.read(&home, false, options.sqlite) {
        Ok(read) => read,
        Err(code) => return outcome("skipped", code),
    };
    let before_entry = match select_provider_entry(&before.entries, request.provider) {
        Ok(entry) => entry.clone(),
        Err(code) => {
            // Nothing is renewed here, but a copy kept earlier may be identifiable by now.
            if has_leftovers(&account_dir) {
                if let Ok(_held) = options.locks.acquire(
                    request.runtime_dir,
                    request.provider,
                    request.account_id,
                    lock_wait,
                ) {
                    apply_leftovers(
                        &account_dir,
                        layout.name(),
                        request.provider,
                        &home,
                        now(),
                        options.sqlite,
                    );
                }
            }
            return outcome("skipped", code);
        }
    };
    // A copy renewed in a pane may hold the only good pair even while the source still looks fresh.
    if !in_window(before_entry.due_ms) && !has_leftovers(&account_dir) {
        return outcome("fresh", "outside-window");
    }
    let Ok(lock) = options.locks.acquire(
        request.runtime_dir,
        request.provider,
        request.account_id,
        lock_wait,
    ) else {
        return outcome("skipped", "lock-busy");
    };
    apply_agent_copies(&account_dir, layout, request, &home, lock.as_ref(), options);
    apply_leftovers(
        &account_dir,
        layout.name(),
        request.provider,
        &home,
        now(),
        options.sqlite,
    );
    let current = match layout.read(&home, false, options.sqlite) {
        Ok(read) => read,
        Err(code) => return outcome("skipped", code),
    };
    let entry = match select_provider_entry(&current.entries, request.provider) {
        Ok(entry) => entry,
        Err(code) => return outcome("skipped", code),
    };
    if !in_window(entry.due_ms) {
        return outcome("fresh", "outside-window");
    }
    if in_cooldown(&account_dir, options.cooldown_ms, now()) {
        return outcome("cooldown", "recent-failure");
    }
    renew_in_scratch(
        layout,
        request,
        &home,
        &account_dir,
        &entry.key,
        lock.as_ref(),
        options,
    )
}

fn renew_in_scratch(
    layout: Layout,
    request: &RefreshRequest<'_>,
    home: &Path,
    account_dir: &Path,
    key: &str,
    lock: &dyn AccountLockGuard,
    options: &RefreshOptions<'_>,
) -> RefreshOutcome {
    let (now, sqlite, source) = (options.now, options.sqlite, request.credential_source);
    // The name a kept scratch copy moves to is drawn before any token is spent: without it nothing is renewed.
    let Ok(kept_suffix) = random_hex() else {
        return outcome("failed", "unexpected-error");
    };
    let scratch = account_dir.join(format!(
        "{SCRATCH_PREFIX}{}-{}",
        std::process::id(),
        now() as i64
    ));
    let files: Vec<String> = if source.kind == "codex-home" {
        layout.files().iter().map(|f| (*f).to_owned()).collect()
    } else {
        source.files.clone()
    };
    let prepared = make_dir(&scratch, true)
        .map_err(|_| ())
        .and_then(|()| {
            copy_credential_files(
                &scratch,
                home,
                &files,
                &CopyOptions {
                    sqlite,
                    skip_missing: false,
                },
            )
            .map_err(|_| ())
        })
        .and_then(|_| {
            layout
                .mark_due(&scratch, &[key.to_owned()], now(), sqlite)
                .map_err(|_| ())
        });
    if prepared.is_err() {
        remove_all(&scratch);
        return outcome("failed", "scratch-copy-failed");
    }
    // The call holds the account lock with this holder: if this process dies mid-call, nobody else redeems the same
    // single-use refresh token until the call has ended too.
    let probe_ok = match options.probe.run(
        &ProbeRequest {
            source,
            home: &scratch,
            no_tools: false,
            timeout_ms: options.probe_timeout_ms,
        },
        lock,
    ) {
        ProbeRun::Ran { ok } => ok,
        ProbeRun::NoProbe => false,
    };
    // Applied even when the call was judged a failure: a call killed at its time limit may already have redeemed the
    // refresh token, and the scratch copy then holds the only good pair.
    let apply = ApplyRequest {
        layout_name: layout.name(),
        source_home: home,
        copy_home: &scratch,
        provider: Some(request.provider),
        require_future: true,
        now: now(),
        sqlite,
    };
    let applied = match apply_renewed_credential(&apply) {
        Ok(applied) => applied,
        // The scratch copy may be the only good pair: it stays for the next holder of the lock.
        Err(_) => return outcome("failed", "apply-failed"),
    };
    match applied {
        ApplyOutcome::ApplyDeferred(_) => {
            // The source could not say whether the copy is newer: it may hold the only good pair, so it moves to the
            // pending copies and the next holder of the account lock decides.
            let pending = account_dir.join(PENDING_DIR);
            if make_dir(&pending, true).is_ok()
                && fs::rename(
                    &scratch,
                    pending.join(pending_name(now(), None, &kept_suffix)),
                )
                .is_ok()
            {
                cap_pending_copies(account_dir, layout, sqlite);
            }
            record_failure(account_dir, "apply-deferred", now());
            outcome("failed", "apply-deferred")
        }
        ApplyOutcome::Unreadable("unreadable-json") => {
            // The CLI's store write was cut off (pi truncates and rewrites its file in place): the half-written file
            // may hold part of a renewed login, so it is kept for hand recovery, outside the copies that are applied
            // or dropped automatically, and reported by `fgos doctor`.
            let torn = account_dir.join(TORN_DIR);
            if make_dir(&torn, true).is_ok() {
                let _ = fs::rename(&scratch, torn.join(pending_name(now(), None, &kept_suffix)));
            }
            record_failure(account_dir, "torn-copy", now());
            outcome("failed", "torn-copy-kept")
        }
        other => {
            remove_all(&scratch);
            if matches!(other, ApplyOutcome::Applied(_)) {
                clear_failure(account_dir);
                return outcome("renewed", "applied");
            }
            let reason = if probe_ok {
                "not-renewed"
            } else {
                "probe-failed"
            };
            record_failure(account_dir, reason, now());
            outcome("failed", reason)
        }
    }
}

// ------------------------------------------------------------------------------------------ probe gate

// Whether the copy's login is the source's account by the provider-signed claim of each: true or false, `None` when
// either names none.
fn same_account(
    layout: Layout,
    provider: &str,
    source_home: &Path,
    copy_home: &Path,
    sqlite: &dyn SqliteAdapter,
) -> Option<bool> {
    let (source, copy) = (
        layout.read(source_home, false, sqlite).ok()?,
        layout.read(copy_home, true, sqlite).ok()?,
    );
    let selected = select_provider_entry(&source.entries, provider).ok()?;
    let want = layout.identity(selected)?;
    let got = layout.identity(copy.entries.iter().find(|e| e.key == selected.key)?)?;
    Some(want == got)
}

fn drop_copy(dir: &Path) {
    remove_all(dir);
}

fn count_agent_try(dir: &Path) -> u32 {
    let file = dir.join(TRIES_FILE);
    let tries: u32 = fs::read_to_string(&file)
        .ok()
        .and_then(|t| t.trim().parse().ok())
        .unwrap_or(0);
    if write_plain(&file, (tries + 1).to_string().as_bytes()).is_err() {
        return AGENT_COPY_TRIES;
    }
    tries + 1
}

fn move_to_torn(account_dir: &Path, dir: &Path, at: f64) {
    // Without a name the copy stays where it is for the next holder; it is never dropped for want of one.
    let Ok(suffix) = random_hex() else {
        return;
    };
    let torn = account_dir.join(TORN_DIR);
    if make_dir(&torn, true).is_err()
        || fs::rename(
            dir,
            torn.join(pending_name(at, Some(AGENT_ORIGIN), &suffix)),
        )
        .is_err()
    {
        drop_copy(dir);
    }
}

fn refuse_copy(dir: &Path) {
    drop_copy(dir);
    eprintln!("fgos: credential-copy-refused (account-mismatch)");
}

// What the probe CLI is given of a copy: its login file alone, and for omp a fresh database that holds only the
// `auth_credentials` rows, never the agent's other tables or settings.
fn isolate_login(
    layout: Layout,
    from: &Path,
    to: &Path,
    sqlite: &dyn SqliteAdapter,
) -> Result<(), ()> {
    make_dir(to, false).map_err(|_| ())?;
    if layout == Layout::OmpAgentDb {
        sqlite
            .isolate_login(&from.join("agent.db"), &to.join("agent.db"))
            .map_err(|_| ())?;
        return set_mode(&to.join("agent.db"), 0o600).map_err(|_| ());
    }
    for name in layout.files() {
        let target = to.join(name);
        if let Some(parent) = target.parent() {
            make_dir(parent, true)
                .or_else(|e| if parent.is_dir() { Ok(()) } else { Err(e) })
                .map_err(|_| ())?;
        }
        let bytes = read_agent_file(&from.join(name), MAX_COPY_FILE_BYTES).map_err(|_| ())?;
        create_new(&target, &bytes).map_err(|_| ())?;
    }
    Ok(())
}

/// Apply the copies staged from agents' private homes, under the account lock the caller holds. A copy the source
/// proves no newer goes; one whose token names another account goes unapplied; one that names no account, or that
/// the source cannot judge, stays for the owner. Any other copy is proven by a renewal: an isolated copy of its login
/// is marked due and the credential probe runs on it (given no tools), so the CLI redeems the copy's own refresh
/// token. Only when that returns a new pair whose token names the leased account is the renewed pair applied; a pair
/// of another account is dropped, and a copy whose calls renew nothing is set aside under `torn/` after
/// `AGENT_COPY_TRIES` calls, never cooling the account.
fn apply_agent_copies(
    account_dir: &Path,
    layout: Layout,
    request: &RefreshRequest<'_>,
    home: &Path,
    lock: &dyn AccountLockGuard,
    options: &RefreshOptions<'_>,
) {
    let (now, sqlite, provider) = (options.now, options.sqlite, request.provider);
    for dir in list_leftovers(account_dir)
        .into_iter()
        .filter(|d| is_agent_copy(d))
    {
        if dir.join(SPENT_FILE).exists() {
            drop_copy(&dir);
            eprintln!("fgos: credential-copy-dropped (spent by a renewal that did not finish)");
            continue;
        }
        match judge_copy(layout, provider, home, &dir, now(), sqlite) {
            Verdict::NotNewer => {
                drop_copy(&dir);
                continue;
            }
            Verdict::Undetermined => continue,
            Verdict::Newer => {}
        }
        match same_account(layout, provider, home, &dir, sqlite) {
            Some(false) => {
                refuse_copy(&dir);
                continue;
            }
            None => continue,
            Some(true) => {}
        }
        if in_cooldown(account_dir, options.cooldown_ms, now()) {
            continue;
        }
        // A staging name under pending/: a runner killed after the CLI spent the copy's refresh token leaves the
        // renewed pair where the sweep and doctor find it.
        // Both names are drawn before the call: a renewed pair is never left without a place to go.
        let (Ok(probe_suffix), Ok(deferred_suffix)) = (random_hex(), random_hex()) else {
            continue;
        };
        let probe_home = account_dir
            .join(PENDING_DIR)
            .join(format!(".tmp-{}-{probe_suffix}", std::process::id()));
        let mut called = false;
        let gate = gate_one_copy(
            &dir,
            &probe_home,
            layout,
            request,
            home,
            lock,
            options,
            &deferred_suffix,
            &mut called,
        );
        if gate.is_err() && !called && count_agent_try(&dir) >= AGENT_COPY_TRIES {
            // Before the call a copy that cannot be prepared counts as a try like one that renews nothing; after it,
            // the spent mark stays and the next holder drops the copy.
            move_to_torn(account_dir, &dir, now());
        }
        drop_copy(&probe_home);
    }
}

#[allow(clippy::too_many_arguments)]
fn gate_one_copy(
    dir: &Path,
    probe_home: &PathBuf,
    layout: Layout,
    request: &RefreshRequest<'_>,
    home: &Path,
    lock: &dyn AccountLockGuard,
    options: &RefreshOptions<'_>,
    deferred_suffix: &str,
    called: &mut bool,
) -> Result<(), ()> {
    let (now, sqlite, provider) = (options.now, options.sqlite, request.provider);
    let account_dir = credential_store_dir(
        request.runtime_dir,
        provider,
        request.account_id,
        request.credential_source.cli.as_deref(),
    )
    .ok_or(())?;
    let source = layout.read(home, false, sqlite).map_err(|_| ())?;
    let key = select_provider_entry(&source.entries, provider)
        .map_err(|_| ())?
        .key
        .clone();
    let refresh_in = |at: &Path| {
        layout
            .read(at, true, sqlite)
            .ok()
            .and_then(|r| r.entries.into_iter().find(|e| e.key == key))
            .and_then(|e| e.refresh)
    };
    isolate_login(layout, dir, probe_home, sqlite)?;
    let spent = refresh_in(probe_home);
    layout
        .mark_due(probe_home, std::slice::from_ref(&key), now(), sqlite)
        .map_err(|_| ())?;
    // Only the renewal is wanted: the call is given no tools.
    write_plain(&dir.join(SPENT_FILE), b"").map_err(|_| ())?;
    *called = true;
    options.probe.run(
        &ProbeRequest {
            source: request.credential_source,
            home: probe_home,
            no_tools: true,
            timeout_ms: options.probe_timeout_ms,
        },
        lock,
    );
    let renewed = refresh_in(probe_home);
    if renewed.is_none() || renewed == spent {
        let _ = fs::remove_file(dir.join(SPENT_FILE));
        // Never the account's cooldown: an agent's copy must not stop the account's own renewal. After
        // AGENT_COPY_TRIES calls that renew nothing it goes to torn/, for the owner, and is not called again.
        if count_agent_try(dir) >= AGENT_COPY_TRIES {
            move_to_torn(&account_dir, dir, now());
        }
        return Ok(());
    }
    // The copy's refresh token is spent now: the renewed pair is all that is left of it.
    let proven = same_account(layout, provider, home, probe_home, sqlite);
    if proven == Some(false) {
        refuse_copy(dir);
        return Ok(());
    }
    let mut deferred = true;
    if proven == Some(true) {
        let apply = ApplyRequest {
            layout_name: layout.name(),
            source_home: home,
            copy_home: probe_home,
            provider: Some(provider),
            require_future: true,
            now: now(),
            sqlite,
        };
        deferred = !matches!(
            apply_renewed_credential(&apply),
            Ok(ApplyOutcome::Applied(_) | ApplyOutcome::Unchanged | ApplyOutcome::Unreadable(_))
        );
    }
    if deferred {
        fs::rename(
            probe_home,
            account_dir.join(PENDING_DIR).join(pending_name(
                now(),
                if proven == Some(true) {
                    None
                } else {
                    Some(AGENT_ORIGIN)
                },
                deferred_suffix,
            )),
        )
        .map_err(|_| ())?;
    }
    drop_copy(dir);
    Ok(())
}
