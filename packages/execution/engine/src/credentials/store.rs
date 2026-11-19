//! The copies an account holds for its next renewal: pending copies, scratch homes, interrupted stagings, the
//! failure cooldown, and the write-back that stages a private home's login before the home is removed.
//!
//! Layout on disk (read unchanged by the previous Node release): `<runtime>/account-locks/<provider>/<account>/`
//! holds `pending/<15 digits of the staging time>-[agent-]<8 hex>/`, `pending/.tmp-<pid>-<hex>/` (a copy being
//! staged), `scratch-<pid>-<ms>/`, `torn/`, `cooldown.json`, and `stores/<cli>/` with the same shape for a
//! per-CLI store.

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};

use serde_json::{json, Value};
use sha2::{Digest, Sha256};

use super::apply::{
    apply_renewed_credential, copy_is_newer, judge_copy, ApplyOutcome, ApplyRequest, Verdict,
};
use super::files::*;
use super::layout::{sidecar_bytes, Layout};
use super::ports::{AccountLocks, SqliteAdapter};
use super::{
    credential_layout, credential_store_dir, expand_credential_home, CredentialSource,
    MAX_PENDING_COPIES, STAGING_MIN_AGE_MS,
};

pub const COOLDOWN_FILE: &str = "cooldown.json";
pub const PENDING_DIR: &str = "pending";
pub const SCRATCH_PREFIX: &str = "scratch-";
pub const TORN_DIR: &str = "torn";
pub const AGENT_ORIGIN: &str = "agent";
const SWEEP_PREFIX: &str = ".sweep-";

fn digits(text: &str, n: usize) -> bool {
    text.len() == n && text.bytes().all(|b| b.is_ascii_digit())
}

/// `<15 digits>-<8 lowercase hex>`: a scratch copy or a pending copy fgOS itself renewed.
fn is_host_copy_name(name: &str) -> bool {
    name.split_once('-').is_some_and(|(at, id)| {
        digits(at, 15)
            && id.len() == 8
            && id.bytes().all(|b| matches!(b, b'0'..=b'9' | b'a'..=b'f'))
    })
}

/// The pid of `.tmp-<pid>-...` / `.sweep-<pid>-...`, when the name is a staging.
fn staging_pid(name: &str) -> Option<u64> {
    let rest = name
        .strip_prefix(".tmp-")
        .or_else(|| name.strip_prefix(".sweep-"))?;
    let (pid, _) = rest.split_once('-')?;
    pid.bytes()
        .all(|b| b.is_ascii_digit())
        .then(|| pid.parse().ok())
        .flatten()
}

fn is_staging_name(name: &str) -> bool {
    !name.is_empty()
        && name.starts_with('.')
        && (name.starts_with(".tmp-") || name.starts_with(SWEEP_PREFIX))
        && staging_pid(name).is_some()
}

fn base(dir: &Path) -> String {
    dir.file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_default()
}

/// Only fgOS's own copies are applied without the probe gate; every other pending copy came from an agent's home.
pub fn is_agent_copy(dir: &Path) -> bool {
    let name = base(dir);
    !name.starts_with(SCRATCH_PREFIX) && !is_host_copy_name(&name)
}

/// `<15 digits>-[<origin>-]<8 hex>`.
pub fn pending_name(at: f64, origin: Option<&str>) -> String {
    format!(
        "{:0>15}-{}{}",
        at as i64,
        origin.map(|o| format!("{o}-")).unwrap_or_default(),
        random_hex(4)
    )
}

/// Copies renewed elsewhere and waiting for the account lock, and a scratch home a dead runner left behind: scratch
/// homes first, then pending copies (hidden names are stagings and skipped), each sorted.
pub fn list_leftovers(account_dir: &Path) -> Vec<PathBuf> {
    let mut found: Vec<PathBuf> = sorted_names(account_dir)
        .into_iter()
        .filter(|n| n.starts_with(SCRATCH_PREFIX))
        .map(|n| account_dir.join(n))
        .collect();
    let pending = account_dir.join(PENDING_DIR);
    found.extend(
        sorted_names(&pending)
            .into_iter()
            .filter(|n| !n.starts_with('.'))
            .map(|n| pending.join(n)),
    );
    found
}

pub fn has_leftovers(account_dir: &Path) -> bool {
    !list_leftovers(account_dir).is_empty()
}

// ------------------------------------------------------------------------------------------ cooldown

pub fn in_cooldown(account_dir: &Path, cooldown_ms: f64, now: f64) -> bool {
    let failed_at = read_json_file(&account_dir.join(COOLDOWN_FILE), false)
        .ok()
        .and_then(|p| {
            p.doc
                .get("failedAt")
                .and_then(Value::as_str)
                .and_then(parse_date_ms)
        });
    failed_at.is_some_and(|at| now - at < cooldown_ms)
}

pub fn record_failure(account_dir: &Path, reason: &str, now: f64) {
    // A missing cooldown only means an earlier retry.
    let _ = write_file_atomic(
        &account_dir.join(COOLDOWN_FILE),
        &format!(
            "{}\n",
            json!({ "failedAt": iso_from_ms(now), "reason": reason })
        ),
    );
}

pub fn clear_failure(account_dir: &Path) {
    let _ = fs::remove_file(account_dir.join(COOLDOWN_FILE));
}

// ------------------------------------------------------------------------------------------ capping

fn copy_fingerprint(layout: Layout, dir: &Path, sqlite: &dyn SqliteAdapter) -> Option<String> {
    match layout.read(dir, false, sqlite) {
        Ok(read) => {
            let mut parts: Vec<String> = read
                .entries
                .iter()
                .map(|e| {
                    format!(
                        "{}\u{0}{}\u{0}{}",
                        e.key,
                        e.refresh.as_deref().unwrap_or(""),
                        e.expires_ms
                    )
                })
                .collect();
            parts.sort();
            Some(hex(&Sha256::digest(parts.join("\u{1}").as_bytes())))
        }
        Err(_) => raw_fingerprint(layout, dir),
    }
}

// A copy that cannot be parsed is compared by the bytes of its store files; `None` when a file is missing.
fn raw_fingerprint(layout: Layout, dir: &Path) -> Option<String> {
    let mut hash = Sha256::new();
    for name in layout.files() {
        hash.update(name.as_bytes());
        hash.update([0]);
        hash.update(fs::read(dir.join(name)).ok()?);
        hash.update([1]);
    }
    let (found, unreadable) = sidecar_bytes(layout, dir, false);
    if unreadable {
        return None;
    }
    for (name, bytes) in found {
        hash.update(name.as_bytes());
        hash.update([0]);
        hash.update(bytes);
        hash.update([1]);
    }
    Some(format!("raw:{}", hex(&hash.finalize())))
}

/// Keep the pending copies of an account within `MAX_PENDING_COPIES` by dropping redundant ones only: a copy whose
/// logins are identical to those of another pending copy (the newest of each identical group stays). Called under
/// the account lock after the pending copies were applied. When the limit is still exceeded afterwards nothing is
/// removed: a copy that may hold the only valid login is never dropped to make room.
pub fn cap_pending_copies(account_dir: &Path, layout: Layout, sqlite: &dyn SqliteAdapter) {
    let pending = account_dir.join(PENDING_DIR);
    let names: Vec<String> = sorted_names(&pending)
        .into_iter()
        .filter(|n| !n.starts_with('.'))
        .collect();
    let Some(mut surplus) = names
        .len()
        .checked_sub(MAX_PENDING_COPIES)
        .filter(|s| *s > 0)
    else {
        return;
    };
    let (mut seen, mut redundant) = (BTreeSet::new(), Vec::new());
    for name in names.iter().rev() {
        let Some(fingerprint) = copy_fingerprint(layout, &pending.join(name), sqlite) else {
            continue;
        };
        if !seen.insert(fingerprint) {
            redundant.push(name.clone());
        }
    }
    let mut dropped = 0;
    for name in redundant.iter().rev() {
        if surplus == 0 {
            break;
        }
        remove_all(&pending.join(name));
        if !pending.join(name).exists() {
            dropped += 1;
            surplus -= 1;
        }
    }
    if dropped > 0 {
        eprintln!("fgos: credential-pending-dropped ({dropped})");
    }
}

/// Apply (without the future-expiry rule) and remove every leftover fgOS renewed itself that the source proves is
/// not newer or that is unusable itself. A leftover is kept when the source could not answer. A copy of agent
/// origin is left to the probe gate. Returns each leftover with its status.
pub fn apply_leftovers(
    account_dir: &Path,
    layout_name: &str,
    provider: &str,
    source_home: &Path,
    now: f64,
    sqlite: &dyn SqliteAdapter,
) -> Vec<(PathBuf, String)> {
    let mut outcomes = Vec::new();
    for dir in list_leftovers(account_dir)
        .into_iter()
        .filter(|d| !is_agent_copy(d))
    {
        let request = ApplyRequest {
            layout_name,
            source_home,
            copy_home: &dir,
            provider: Some(provider),
            require_future: false,
            now,
            sqlite,
        };
        let (keep, status) = match apply_renewed_credential(&request) {
            Ok(outcome) => (
                matches!(outcome, ApplyOutcome::ApplyDeferred(_)),
                outcome.status().to_owned(),
            ),
            Err(_) => (true, "failed".to_owned()),
        };
        if !keep {
            remove_all(&dir);
        }
        outcomes.push((dir, status));
    }
    if let Some(layout) = Layout::from_name(layout_name) {
        cap_pending_copies(account_dir, layout, sqlite);
    }
    outcomes
}

// ------------------------------------------------------------------------------------------ inventory

/// What the provider account inventory says of one account: the CLIs it keeps a login store for, or `None` for
/// an account with a single store.
#[derive(Debug, Clone, Default)]
pub struct InventoryAccount {
    pub credential_source_clis: Option<Vec<String>>,
}

pub type AccountInventory = BTreeMap<String, BTreeMap<String, InventoryAccount>>;

fn inventory_account<'a>(
    inventory: &'a AccountInventory,
    provider: &str,
    account_id: &str,
) -> Option<&'a InventoryAccount> {
    inventory.get(provider)?.get(account_id)
}

struct StoreDir {
    provider: String,
    account_id: String,
    store: Option<String>,
    store_dir: PathBuf,
    stranded: bool,
}

// Every store directory under the runtime's account locks: the account directory, and `stores/<cli>` under it.
// With an inventory each says whether the account's current layout reads it; without one nothing is stranded.
fn list_credential_store_dirs(
    runtime_dir: &Path,
    inventory: Option<&AccountInventory>,
) -> Vec<StoreDir> {
    let mut found = Vec::new();
    let root = runtime_dir.join("account-locks");
    for provider in sub_dirs(&root) {
        for account_id in sub_dirs(&root.join(&provider)) {
            let account_dir = root.join(&provider).join(&account_id);
            let mut stores = vec![(None, account_dir.clone())];
            stores.extend(
                sub_dirs(&account_dir.join("stores"))
                    .into_iter()
                    .map(|cli| (Some(cli.clone()), account_dir.join("stores").join(cli))),
            );
            let read: Option<BTreeSet<PathBuf>> =
                inventory.map(|inv| match inventory_account(inv, &provider, &account_id) {
                    None => BTreeSet::new(),
                    Some(InventoryAccount {
                        credential_source_clis: Some(clis),
                    }) => clis
                        .iter()
                        .map(|c| account_dir.join("stores").join(c))
                        .collect(),
                    Some(_) => BTreeSet::from([account_dir.clone()]),
                });
            for (store, store_dir) in stores {
                let stranded = read.as_ref().is_some_and(|set| !set.contains(&store_dir));
                found.push(StoreDir {
                    provider: provider.clone(),
                    account_id: account_id.clone(),
                    store,
                    store_dir,
                    stranded,
                });
            }
        }
    }
    found
}

#[derive(Debug, Clone, PartialEq)]
pub struct OverLimit {
    pub provider: String,
    pub account_id: String,
    pub store: Option<String>,
    pub count: usize,
    pub store_dir: PathBuf,
    pub stranded: bool,
}

/// Login stores whose pending copies exceed `MAX_PENDING_COPIES`. Nothing is dropped to get back under the limit
/// unless it is a redundant duplicate, so an account can stay over it.
pub fn inspect_pending_copies_over_limit(
    runtime_dir: &Path,
    inventory: Option<&AccountInventory>,
) -> Vec<OverLimit> {
    list_credential_store_dirs(runtime_dir, inventory)
        .into_iter()
        .filter_map(|s| {
            let count = sorted_names(&s.store_dir.join(PENDING_DIR))
                .iter()
                .filter(|n| !n.starts_with('.'))
                .count();
            (count > MAX_PENDING_COPIES).then_some(OverLimit {
                provider: s.provider,
                account_id: s.account_id,
                store: s.store,
                count,
                store_dir: s.store_dir,
                stranded: s.stranded,
            })
        })
        .collect()
}

// ------------------------------------------------------------------------------------------ interrupted stagings

fn list_interrupted_stagings(store_dir: &Path) -> Vec<PathBuf> {
    let pending = store_dir.join(PENDING_DIR);
    sorted_names(&pending)
        .into_iter()
        .filter(|n| is_staging_name(n))
        .map(|n| pending.join(n))
        .collect()
}

// A staging whose writer is still running is being written, not left behind. One that cannot be looked up counts
// as alive, so an unclear case is kept.
fn staging_writer_alive(dir: &Path) -> bool {
    let Some(pid) = staging_pid(&base(dir)).filter(|p| *p > 0) else {
        return true;
    };
    #[cfg(target_os = "linux")]
    {
        Path::new(&format!("/proc/{pid}")).exists()
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = pid;
        true
    }
}

fn mtime_ms(path: &Path) -> Option<f64> {
    let modified = fs::symlink_metadata(path).ok()?.modified().ok()?;
    modified
        .duration_since(std::time::UNIX_EPOCH)
        .ok()
        .map(|d| d.as_secs_f64() * 1000.0)
}

// How long a staging has been unchanged: its own change time and that of what it holds.
fn staging_age_ms(dir: &Path, now: f64) -> f64 {
    let Ok(entries) = fs::read_dir(dir) else {
        return f64::NEG_INFINITY;
    };
    let mut newest = mtime_ms(dir);
    for entry in entries.flatten() {
        newest = newest
            .into_iter()
            .chain(mtime_ms(&entry.path()))
            .reduce(f64::max);
    }
    newest.map_or(f64::NEG_INFINITY, |t| now - t)
}

fn is_durable_temp(name: &str) -> bool {
    name.strip_prefix(".durable-file-")
        .and_then(|n| n.strip_suffix(".tmp"))
        .and_then(|n| n.split_once('-'))
        .is_some_and(|(a, b)| {
            !a.is_empty() && !b.is_empty() && a.bytes().chain(b.bytes()).all(|c| c.is_ascii_digit())
        })
}

// Digest of every file under `dir` (names and bytes), or `None` when anything cannot be read or is not a plain file.
// The shared-memory index and a temporary the durable-file crate left behind are left out. In memory only.
fn tree_digest(dir: &Path) -> Option<String> {
    fn walk(root: &Path, current: &Path, hash: &mut Sha256) -> Option<()> {
        for name in sorted_names(current) {
            let full = current.join(&name);
            let meta = fs::symlink_metadata(&full).ok()?;
            if meta.is_dir() {
                walk(root, &full, hash)?;
                continue;
            }
            if !meta.is_file() {
                return None;
            }
            if name.ends_with("-shm") || is_durable_temp(&name) {
                continue;
            }
            hash.update(full.strip_prefix(root).ok()?.to_string_lossy().as_bytes());
            hash.update([0]);
            hash.update(fs::read(&full).ok()?);
            hash.update([1]);
        }
        Some(())
    }
    let mut hash = Sha256::new();
    walk(dir, dir, &mut hash)?;
    Some(hex(&hash.finalize()))
}

/// What a store's source login is judged by.
pub enum StoreJudgement {
    Judge {
        layout: Layout,
        source_home: PathBuf,
    },
    /// The account's layout no longer reads that store: nothing there is touched.
    Stranded,
    /// The store cannot be judged by its source.
    Unjudged,
}

/// `(provider, account_id, store)` to what the store's source login is judged by.
pub type ResolveStore<'a> = dyn Fn(&str, &str, Option<&str>) -> StoreJudgement + 'a;

pub struct SweepOptions<'a> {
    pub runtime_dir: &'a Path,
    /// `(provider, account_id, store)` to what the store's source login is judged by; `None` judges nothing.
    pub resolve_store: Option<&'a ResolveStore<'a>>,
    pub now: f64,
    pub min_age_ms: f64,
    pub locks: &'a dyn AccountLocks,
    pub sqlite: &'a dyn SqliteAdapter,
}

#[derive(Debug, Default, PartialEq, Eq)]
pub struct SweepResult {
    pub removed: usize,
    pub kept: usize,
}

/// Remove the interrupted stagings that are provably not needed. A staging is considered only when its writer is
/// gone and it has not changed for `min_age_ms`; it is claimed by rename first, so a writer still running fails its
/// own rename and keeps its private home. It goes when it is empty, or has the same files as a copy the store
/// already keeps in `pending/` or `torn/`, or, under the account lock, the account's source login proves it is not
/// newer or it is malformed. Anything else stays for hand recovery. Counts only; no names, no values.
pub fn sweep_interrupted_stagings(options: &SweepOptions<'_>) -> SweepResult {
    let mut result = SweepResult::default();
    let root = options.runtime_dir.join("account-locks");
    for provider in sub_dirs(&root) {
        for account_id in sub_dirs(&root.join(&provider)) {
            let account_dir = root.join(&provider).join(&account_id);
            let mut stores = vec![(None, account_dir.clone())];
            stores.extend(
                sub_dirs(&account_dir.join("stores"))
                    .into_iter()
                    .map(|cli| (Some(cli.clone()), account_dir.join("stores").join(cli))),
            );
            for (store, store_dir) in stores {
                let stagings = list_interrupted_stagings(&store_dir);
                if stagings.is_empty() {
                    continue;
                }
                let judgement = options.resolve_store.map_or(StoreJudgement::Unjudged, |f| {
                    f(&provider, &account_id, store.as_deref())
                });
                if matches!(judgement, StoreJudgement::Stranded) {
                    continue;
                }
                let mut kept: Option<BTreeSet<String>> = None;
                for staging in stagings {
                    if staging_writer_alive(&staging)
                        || staging_age_ms(&staging, options.now) < options.min_age_ms
                    {
                        continue;
                    }
                    let digests = kept.get_or_insert_with(|| {
                        [PENDING_DIR, TORN_DIR]
                            .iter()
                            .flat_map(|sub| {
                                sorted_names(&store_dir.join(sub))
                                    .into_iter()
                                    .filter(|n| !n.starts_with('.'))
                                    .filter_map(|n| tree_digest(&store_dir.join(sub).join(n)))
                                    .collect::<Vec<_>>()
                            })
                            .collect()
                    });
                    if sweep_one_staging(
                        &staging,
                        digests,
                        &judgement,
                        &provider,
                        &account_id,
                        options,
                    ) {
                        result.removed += 1;
                    } else {
                        result.kept += 1;
                    }
                }
            }
        }
    }
    result
}

fn sweep_one_staging(
    staging: &Path,
    kept: &BTreeSet<String>,
    judgement: &StoreJudgement,
    provider: &str,
    account_id: &str,
    options: &SweepOptions<'_>,
) -> bool {
    let claimed = staging.with_file_name(format!(
        "{SWEEP_PREFIX}{}-{}",
        std::process::id(),
        random_hex(4)
    ));
    if fs::rename(staging, &claimed).is_err() {
        return false;
    }
    let restore = || {
        let _ = fs::rename(&claimed, staging);
        false
    };
    let mut removable = fs::symlink_metadata(&claimed).is_ok_and(|m| m.is_dir())
        && sorted_names(&claimed).is_empty();
    if !removable {
        removable = tree_digest(&claimed).is_some_and(|d| kept.contains(&d));
    }
    if !removable {
        if let StoreJudgement::Judge {
            layout,
            source_home,
        } = judgement
        {
            // The source's verdict is read under the account lock, like every other judgement of a copy against it.
            if let Some(_lock) =
                options
                    .locks
                    .try_acquire(options.runtime_dir, provider, account_id)
            {
                removable = judge_copy(
                    *layout,
                    provider,
                    source_home,
                    &claimed,
                    options.now,
                    options.sqlite,
                ) == Verdict::NotNewer;
            }
        }
    }
    if !removable {
        return restore();
    }
    remove_all(&claimed);
    if claimed.exists() {
        return restore();
    }
    true
}

// ------------------------------------------------------------------------------------------ retained copies

#[derive(Debug, Clone, PartialEq)]
pub struct RetainedCopy {
    pub provider: String,
    pub account_id: String,
    /// `pending`, `agent`, `scratch`, `staging`, `torn` or `set-aside`.
    pub kind: &'static str,
    pub age_ms: f64,
    pub store_dir: PathBuf,
    pub stranded: bool,
}

/// Login copies an account is holding for its next renewal: staged `pending/` copies (their name starts with the
/// staging time) and scratch homes a dead runner left (age by modification time). Read-only; names, kinds and ages
/// only. Only copies at least `min_age_ms` old are listed; torn copies, stagings and stranded copies at any age.
/// With the inventory, each copy also says whether it is `stranded`: it sits in a store directory the account's
/// current layout never reads.
pub fn inspect_retained_credential_copies(
    runtime_dir: &Path,
    now: f64,
    min_age_ms: f64,
    inventory: Option<&AccountInventory>,
) -> Vec<RetainedCopy> {
    let mut found = Vec::new();
    for s in list_credential_store_dirs(runtime_dir, inventory) {
        let torn_dir = s.store_dir.join(TORN_DIR);
        let torn_in: Vec<PathBuf> = sorted_names(&torn_dir)
            .into_iter()
            .filter(|n| !n.starts_with('.'))
            .map(|n| torn_dir.join(n))
            .collect();
        let interrupted = list_interrupted_stagings(&s.store_dir)
            .into_iter()
            .filter(|d| !staging_writer_alive(d) && staging_age_ms(d, now) >= STAGING_MIN_AGE_MS);
        let all: Vec<PathBuf> = list_leftovers(&s.store_dir)
            .into_iter()
            .chain(torn_in)
            .chain(interrupted)
            .collect();
        for dir in all {
            let name = base(&dir);
            let staged_at = name
                .split_once('-')
                .filter(|(at, _)| digits(at, 15))
                .and_then(|(at, _)| at.parse::<f64>().ok());
            let Some(at) = staged_at.or_else(|| mtime_ms(&dir)) else {
                continue;
            };
            let age_ms = now - at;
            let torn = dir.parent().is_some_and(|p| base(p) == TORN_DIR);
            let staging = is_staging_name(&name);
            let kind = if torn {
                if name.contains(&format!("-{AGENT_ORIGIN}-")) {
                    "set-aside"
                } else {
                    "torn"
                }
            } else if staging {
                "staging"
            } else if is_agent_copy(&dir) {
                "agent"
            } else if staged_at.is_some() {
                "pending"
            } else {
                "scratch"
            };
            if age_ms >= min_age_ms || torn || staging || s.stranded {
                found.push(RetainedCopy {
                    provider: s.provider.clone(),
                    account_id: s.account_id.clone(),
                    kind,
                    age_ms,
                    store_dir: s.store_dir.clone(),
                    stranded: s.stranded,
                });
            }
        }
    }
    found
}

// ------------------------------------------------------------------------------------------ write-back

/// Where a login renewed inside a private home is written back: the account's store and its pending copies. Only
/// the host records it (the attempt's finalization descriptor, outside every grant of the sandbox); nothing inside
/// the home ever names it. `None` for an unsupported layout, a relative home or runtime directory, or an unsafe id.
pub fn credential_write_back_target(
    provider: &str,
    account_id: &str,
    source: &CredentialSource,
    runtime_dir: &Path,
) -> Option<Value> {
    let layout = credential_layout(source)?;
    let home = expand_credential_home(&source.home)?;
    if !runtime_dir.is_absolute() {
        return None;
    }
    credential_store_dir(runtime_dir, provider, account_id, source.cli.as_deref())?;
    let mut target = json!({
        "provider": provider, "accountId": account_id, "kind": source.kind, "home": path_str(&home),
        "layout": layout.name(), "runtimeDir": path_str(runtime_dir),
    });
    if let Some(cli) = &source.cli {
        target["store"] = Value::from(cli.as_str());
    }
    Some(target)
}

/// The result of [`write_back_renewed_credential`]: `status` is `none`, `unchanged`, `staged` or `failed`; `code` is
/// a fixed word; `keep_home` says no copy is safe in the pending copies yet and the home may hold the only good
/// pair, so it must not be removed.
#[derive(Debug, Clone, PartialEq)]
pub struct WriteBackOutcome {
    pub status: &'static str,
    pub code: Option<&'static str>,
    pub keep_home: bool,
}

impl WriteBackOutcome {
    fn status(status: &'static str) -> Self {
        Self {
            status,
            code: None,
            keep_home: false,
        }
    }
    fn failed(code: &'static str, keep_home: bool) -> Self {
        Self {
            status: "failed",
            code: Some(code),
            keep_home,
        }
    }
}

struct ValidTarget<'a> {
    layout: Layout,
    provider: &'a str,
    account_id: &'a str,
    home: &'a Path,
    runtime_dir: &'a Path,
    store: Option<&'a str>,
}

fn valid_write_back(value: &Value) -> Option<ValidTarget<'_>> {
    let text = |name: &str| value.get(name).and_then(Value::as_str);
    let (home, runtime_dir) = (Path::new(text("home")?), Path::new(text("runtimeDir")?));
    let store = match value.get("store") {
        None => None,
        Some(s) => Some(s.as_str()?),
    };
    (home.is_absolute() && runtime_dir.is_absolute()).then_some(())?;
    Some(ValidTarget {
        layout: Layout::from_name(text("layout")?)?,
        provider: text("provider").unwrap_or(""),
        account_id: text("accountId").unwrap_or(""),
        home,
        runtime_dir,
        store,
    })
}

// A login file that is a link, a pipe or a device is already no login; any other read error on it, and any error but
// absence on a sidecar, would otherwise keep the home for a login that cannot be copied.
fn home_files_readable(layout: Layout, home: &Path) -> bool {
    layout.files().iter().chain(layout.sidecars()).all(|name| {
        match read_agent_file(&home.join(name), MAX_COPY_FILE_BYTES) {
            Ok(_) => true,
            Err(e) => {
                e.kind() == std::io::ErrorKind::NotFound
                    || (layout.files().contains(name)
                        && e.kind() == std::io::ErrorKind::InvalidData)
            }
        }
    })
}

/// Called just before a private home is deleted. `write_back` is the target the host recorded for the home
/// ([`credential_write_back_target`]), never anything read from inside the home; the home's own files are read only
/// through the agent-file door. When the home holds a login newer than the source's, stage a copy of agent origin
/// beside the source; it is never applied here (the next refresh-ahead applies it after the probe). When the account
/// lock is free (tried once, never waited for), redundant pending copies are dropped. Never fails.
pub fn write_back_renewed_credential(
    home_dir: &Path,
    write_back: Option<&Value>,
    now: f64,
    sqlite: &dyn SqliteAdapter,
    locks: &dyn AccountLocks,
) -> WriteBackOutcome {
    let Some(write_back) = write_back.filter(|v| !v.is_null()) else {
        return WriteBackOutcome::status("none");
    };
    let Some(target) = valid_write_back(write_back) else {
        return WriteBackOutcome::failed("invalid-target", false);
    };
    let Some(account_dir) = credential_store_dir(
        target.runtime_dir,
        target.provider,
        target.account_id,
        target.store,
    ) else {
        return WriteBackOutcome::failed("invalid-target", false);
    };
    // A home is written back once its attempt's processes are gone: a login file it left that cannot be read is no
    // login, and must not keep the home forever.
    if !home_files_readable(target.layout, home_dir) {
        return WriteBackOutcome::failed("home-unreadable", false);
    }
    if copy_is_newer(
        target.layout,
        target.provider,
        target.home,
        home_dir,
        now,
        sqlite,
    ) == Verdict::NotNewer
    {
        return WriteBackOutcome::status("unchanged");
    }
    let pending = account_dir.join(PENDING_DIR);
    let staging = pending.join(format!(".tmp-{}-{}", std::process::id(), random_hex(4)));
    // Until a copy is safe in pending/, the private home may hold the only good pair.
    if make_dir(&staging, true).is_err() {
        remove_all(&staging);
        return WriteBackOutcome::failed("write-back-failed", true);
    }
    let final_dir = pending.join(pending_name(now, Some(AGENT_ORIGIN)));
    let staged = target
        .layout
        .stage(home_dir, &staging, sqlite)
        .and_then(|()| {
            // On disk before the rename, and the rename on disk before the home may go.
            sync_tree(&staging).map_err(|_| "stage-failed".to_owned())?;
            fs::rename(&staging, &final_dir).map_err(|_| "stage-failed".to_owned())?;
            sync_path(&pending).map_err(|_| "stage-failed".to_owned())
        });
    if let Err(message) = staged {
        remove_all(&staging);
        return WriteBackOutcome::failed(
            if message == "sqlite-unavailable" {
                "sqlite-unavailable"
            } else {
                "stage-failed"
            },
            true,
        );
    }
    if let Some(_lock) = locks.try_acquire(target.runtime_dir, target.provider, target.account_id) {
        cap_pending_copies(&account_dir, target.layout, sqlite);
    }
    WriteBackOutcome::status("staged")
}
