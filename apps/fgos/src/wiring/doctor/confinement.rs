//! The confinement doctor rows: what the runner config, the machine's backend registry and the leftovers of
//! private homes and login copies say about readiness. The judgements are the engine's (`confinement::{policy,
//! driver,cleanup}` and `credentials`); this file reads the config and the machine, hands them in and words the
//! answer. Rows that read the project's config take it as the config door gives it; the login inventory comes from
//! the machine config alone.
//!
//! Three rows have a repair, run only on `--fix`: the machine backend registry's defaults, the orphaned
//! confinement resources, and the held private homes and interrupted login stagings.

use super::{config_refusal_text, judged, project_root_refusal, Rows};
use crate::wiring::dispatch_decide::HostWorkspace;
use crate::wiring::seat_binding::HostMachine;
use fgos_config::detect::PathDetectors;
use fgos_config::machine;
use fgos_config::session::session_class;
use fgos_config::snapshot::SnapshotError;
use fgos_distribution::doctor::{timed, FixResult, RowOutcome, RowResult, Status};
use fgos_execution::accounts::provider_account_inventory;
use fgos_execution::decide::Workspace;
use fgos_execution::runner_config::normalize_legacy_confinement;
use fgos_execution_engine::accounts::{Accounts, SystemHost as AccountsHost};
use fgos_execution_engine::confinement::cleanup::probes::{
    peer_run_hidden, run_all_confinement_probes, ProbePorts,
};
use fgos_execution_engine::confinement::cleanup::{
    canonical_root, default_temp_roots, judge_confinement_orphans, list_kept_credential_homes,
    read_attempt_ownership_marker, remove_confinement_orphans, settle_held_credential_homes,
    CleanupHomes, CleanupHost, CredentialWriteBack, KeptHome, Orphans, SystemHost,
    WriteBackOutcome, CREDENTIAL_KEEP_MAX_ATTEMPTS,
};
use fgos_execution_engine::confinement::driver::bwrap::{BwrapDriver, SmokeProbe, SmokeResult};
use fgos_execution_engine::confinement::driver::registry::{
    ensure_machine_registry_defaults, load_machine_registry, registry_path, validate_registry_shape,
};
use fgos_execution_engine::confinement::driver::{
    BackendDriver, Credentials, DriverError, EnvFn, ErrorKind, ResourceResolver,
};
use fgos_execution_engine::confinement::policy::{
    resolve_confinement_resources, validate_confinement_policy_shape, Grant, ResolveContext,
    ResolveInput, BUILTIN_POLICY_IDS,
};
use fgos_execution_engine::credentials::files::{now_ms, random_hex};
use fgos_execution_engine::credentials::store::{OverLimit, ResolveStore, SweepOptions};
use fgos_execution_engine::credentials::{
    credential_write_back_target, inspect_pending_copies_over_limit,
    inspect_retained_credential_copies, sweep_interrupted_stagings, write_back_renewed_credential,
    AccountInventory, AccountsLocks, CredentialSource, InventoryAccount, Layout, NoLocks, NoSqlite,
    RetainedCopy, StoreJudgement, MAX_PENDING_COPIES, STAGING_MIN_AGE_MS,
};
use fgos_host_runtime::civil_time::parse_rfc3339_millis;
use serde_json::{json, Map, Value};
use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};
use std::sync::Arc;

pub const ROWS: &[&str] = &[
    "confinement-policies-declared",
    "confinement-backend-registry-readable",
    "confinement-orphaned-resources-reaped",
    "credential-copies-retained",
    "confinement-bwrap-platform",
    "confinement-probe-freshness",
    "confinement-blind-read",
    "confinement-strict-readiness",
    "confinement-herdr-maturity",
];

pub const FIXES: &[&str] = &[
    "confinement-backend-registry-readable",
    "confinement-orphaned-resources-reaped",
    "credential-copies-retained",
];

pub const GROUP: Rows = Rows {
    rows: ROWS,
    fixes: FIXES,
    judge,
    fix,
};

/// A login copy that outlives its dispatch is reported once it is this old (it is never deleted for its age).
const RETAINED_COPY_REPORT_AFTER_MS: f64 = 24.0 * 60.0 * 60.0 * 1000.0;

/// How the owner recovers a held home an older release left without its host record. Nothing fgOS reads from the
/// home itself can name the account store (the confined agent wrote it), so the store is looked up in the host's
/// own record of the attempt.
const HELD_HOME_RECOVERY: &str = "It may hold the only valid login of the account its attempt leased, and it has no host record, so nothing settles it by itself. Recover by hand: the attempt that made it ran from a run directory under the .fgos/assignments of its project, whose protected/confinement-finalization/<launch>.json names, on the resource whose pathRef is this home, the account store (credentialWriteBack.home); copy the home's login files (auth.json, or agent.db with any agent.db-wal and agent.db-journal) over that store only if their login expires later, then delete the home. Deleting the home without copying drops the login it holds.";

const UNFINALIZED_HOME_RECOVERY: &str = "It may hold the only valid login of the account its attempt leased. Recover by hand: protected/confinement-finalization/<launch>.json of that run directory, if it is still there, names on the resource whose pathRef is this home the account store (credentialWriteBack.home); copy the home's login files over that store only if their login expires later, then delete the home.";

// ---- JS-shaped facts ---------------------------------------------------------------------------------------

/// The runner config's truthiness: absent, null, false, 0 and the empty text are false.
fn truthy(value: Option<&Value>) -> bool {
    match value {
        None | Some(Value::Null) => false,
        Some(Value::Bool(flag)) => *flag,
        Some(Value::Number(number)) => number.as_f64().is_some_and(|n| n != 0.0),
        Some(Value::String(text)) => !text.is_empty(),
        Some(_) => true,
    }
}

/// A value as a template literal prints it: text as it is, anything else as JSON.
fn text_of(value: &Value) -> String {
    match value {
        Value::String(text) => text.clone(),
        other => other.to_string(),
    }
}

/// An entry of the capability catalog: an own key whose value is an object (an array counts).
fn is_entry(value: &Value) -> bool {
    value.is_object() || value.is_array()
}

/// The declared capabilities, in declared order, each with its value (an entry holds an object or an array).
fn declared_capabilities(runner: &Value) -> Vec<(&str, &Value)> {
    runner
        .get("capabilities")
        .and_then(Value::as_object)
        .into_iter()
        .flatten()
        .map(|(name, entry)| (name.as_str(), entry))
        .collect()
}

/// The declared capability names that hold an entry, with the entry's `confinement`, in declared order.
fn capability_entries(runner: &Value) -> Vec<(&str, Option<&Value>)> {
    declared_capabilities(runner)
        .into_iter()
        .filter(|(_, entry)| is_entry(entry))
        .map(|(name, entry)| (name, entry.get("confinement")))
        .collect()
}

fn capability_name_count(runner: &Value) -> usize {
    runner
        .get("capabilities")
        .and_then(Value::as_object)
        .map_or(0, Map::len)
}

fn is_strict(runner: &Value) -> bool {
    truthy(runner.get("confinement").and_then(|c| c.get("strict")))
}

fn custom_policy_declared(runner: &Value, policy_id: &str) -> bool {
    runner
        .get("confinementPolicies")
        .and_then(Value::as_object)
        .and_then(|policies| policies.get(policy_id))
        .is_some_and(|policy| truthy(Some(policy)))
}

/// The OS name the way the rows word it (`linux`, `darwin`, `win32`).
fn platform() -> &'static str {
    match std::env::consts::OS {
        "macos" => "darwin",
        "windows" => "win32",
        other => other,
    }
}

// ---- the config and the machine ----------------------------------------------------------------------------

/// The project's effective runner section, or why the door cannot give it.
fn read_runner(root: &Path) -> Result<Value, String> {
    if let Some(refusal) = project_root_refusal(root) {
        return Err(refusal.to_owned());
    }
    HostWorkspace {
        process_cwd: root.to_path_buf(),
    }
    .load_runner(&root.to_string_lossy())
    .map(|loaded| loaded.runner)
    .map_err(|failure| failure.message().to_owned())
}

/// The runner section of the machine config alone, where the provider account inventory lives.
fn machine_runner() -> Result<Value, String> {
    let lookup = |key: &str| std::env::var(key).ok();
    let global = machine::global_dir(lookup).ok_or_else(machine::home_unset_message)?;
    let detectors = PathDetectors {
        path: std::env::var_os("PATH"),
    };
    let context = machine::context(&detectors).map_err(|error| error.to_string())?;
    match machine::snapshot(&context, &global, session_class(lookup)) {
        Ok(snapshot) => Ok(snapshot
            .value
            .get("runner")
            .cloned()
            .unwrap_or_else(|| json!({}))),
        Err(SnapshotError::Refused(list)) => Err(list
            .iter()
            .map(config_refusal_text)
            .collect::<Vec<_>>()
            .join("; ")),
        Err(other) => Err(format!("{other:?}")),
    }
}

fn env_lookup(key: &str) -> Option<String> {
    std::env::var(key).ok()
}

fn machine_registry_path() -> Result<PathBuf, DriverError> {
    registry_path(&env_lookup)
}

fn machine_registry() -> Result<Value, DriverError> {
    load_machine_registry(&machine_registry_path()?)
}

/// The bwrap instance of the registry: whether it is disabled, and the binary it names (`bwrap` when none).
struct BwrapInstance {
    disabled: bool,
    binary: String,
}

fn bwrap_instance(registry: &Value) -> Option<BwrapInstance> {
    let instance = registry.get("confinementBackends")?.get("bwrap")?;
    if !truthy(Some(instance)) {
        return None;
    }
    let binary = instance
        .get("executable")
        .and_then(Value::as_str)
        .filter(|name| !name.is_empty())
        .unwrap_or("bwrap")
        .to_owned();
    Some(BwrapInstance {
        disabled: instance.get("enabled") == Some(&Value::Bool(false)),
        binary,
    })
}

type Verdict = (bool, String);

// ---- confinement-policies-declared -------------------------------------------------------------------------

fn policies_declared(runner: &Result<Value, String>) -> Verdict {
    let runner = match runner {
        Ok(runner) => runner,
        Err(message) => return (false, format!("runner config not readable: {message}")),
    };
    if !runner
        .get("capabilities")
        .is_some_and(|c| c.is_object() || c.is_array())
    {
        return (
            true,
            "no runner capabilities declared -- nothing to check".to_owned(),
        );
    }
    let custom = match runner.get("confinementPolicies") {
        Some(value) if truthy(Some(value)) => match value.as_object() {
            Some(map) => map.clone(),
            None => {
                return (
                    false,
                    "runner.confinementPolicies must be an object".to_owned(),
                )
            }
        },
        _ => Map::new(),
    };
    for (policy_id, doc) in &custom {
        let mut doc = doc.clone();
        if let Err(error) = validate_confinement_policy_shape(&mut doc, "confinement policy", false)
        {
            return (
                false,
                format!("custom confinement policy \"{policy_id}\" is malformed: {error}"),
            );
        }
    }
    let mut undeclared = Vec::new();
    let mut missing_anchors = Vec::new();
    for (name, confinement) in capability_entries(runner) {
        let Some(confinement) = confinement.filter(|c| truthy(Some(c))) else {
            missing_anchors.push(name);
            continue;
        };
        if confinement.get("mode").and_then(Value::as_str) == Some("unconfined") {
            continue;
        }
        match confinement.get("policy").filter(|p| truthy(Some(p))) {
            Some(policy) => {
                let id = text_of(policy);
                if !BUILTIN_POLICY_IDS.contains(&id.as_str())
                    && !custom_policy_declared(runner, &id)
                {
                    undeclared.push(format!(
                        "capability \"{name}\" references unknown policy \"{id}\""
                    ));
                }
            }
            None => missing_anchors.push(name),
        }
    }
    if !undeclared.is_empty() {
        return (
            false,
            format!("undeclared confinement policies: {}", undeclared.join("; ")),
        );
    }
    if is_strict(runner) && !missing_anchors.is_empty() {
        return (
            false,
            format!(
                "missing confinement anchors in strict mode: {}",
                missing_anchors.join(", ")
            ),
        );
    }
    if !missing_anchors.is_empty() {
        return (
            true,
            format!(
                "all referenced capability confinement policies are declared; {} capability/capabilities have no confinement anchor declared ({})",
                missing_anchors.len(),
                missing_anchors.join(", ")
            ),
        );
    }
    (
        true,
        "all capability confinement policies are declared".to_owned(),
    )
}

// ---- confinement-backend-registry-readable -----------------------------------------------------------------

fn backend_registry_row(path: Result<PathBuf, DriverError>) -> Verdict {
    let path = match path {
        Ok(path) => path,
        Err(error) => return (false, error.message),
    };
    let shown = path.display();
    if !path.exists() {
        return (
            false,
            format!("machine backend registry not found at {shown} -- run fgos doctor --fix"),
        );
    }
    let parsed = std::fs::read_to_string(&path)
        .map_err(|error| error.to_string())
        .and_then(|raw| serde_json::from_str::<Value>(&raw).map_err(|error| error.to_string()));
    let parsed = match parsed {
        Ok(parsed) => parsed,
        Err(error) => {
            return (
                false,
                format!("machine backend registry at {shown} is not valid JSON: {error}"),
            )
        }
    };
    if let Err(error) = validate_registry_shape(&parsed, &path.to_string_lossy()) {
        return (
            false,
            format!(
                "machine backend registry at {shown} is malformed: {}",
                error.message
            ),
        );
    }
    let count = parsed
        .get("confinementBackends")
        .and_then(Value::as_object)
        .map_or(0, Map::len);
    (
        true,
        format!("machine backend registry valid at {shown} ({count} backend(s) configured)"),
    )
}

fn fix_backend_registry(path: Result<PathBuf, DriverError>) -> (bool, String) {
    let path = match path {
        Ok(path) => path,
        Err(error) => return (false, format!("skipped -- {}", error.message)),
    };
    if path.exists() {
        let valid = std::fs::read_to_string(&path)
            .ok()
            .and_then(|raw| serde_json::from_str::<Value>(&raw).ok())
            .is_some_and(|parsed| {
                validate_registry_shape(&parsed, &path.to_string_lossy()).is_ok()
            });
        if valid {
            return (
                false,
                format!(
                    "machine backend registry already valid at {}",
                    path.display()
                ),
            );
        }
    }
    match ensure_machine_registry_defaults(&path) {
        Ok(done) => (done.created || done.changed, done.message),
        Err(error) => (false, format!("skipped -- {}", error.message)),
    }
}

// ---- confinement-orphaned-resources-reaped -----------------------------------------------------------------

fn joined(roots: &[PathBuf]) -> String {
    roots
        .iter()
        .map(|root| root.display().to_string())
        .collect::<Vec<_>>()
        .join(", ")
}

fn now_millis() -> i64 {
    now_ms() as i64
}

fn orphans_row(roots: &[PathBuf], orphans: &Orphans) -> Verdict {
    let Orphans {
        dead_owned,
        empty_shells,
        loose,
    } = orphans;
    if dead_owned.is_empty() && empty_shells.is_empty() && loose.is_empty() {
        return (
            true,
            format!(
                "no orphaned confinement resources found under {}",
                joined(roots)
            ),
        );
    }
    let mut problems = Vec::new();
    if !empty_shells.is_empty() {
        problems.push(format!(
            "{} empty per-dispatch dir(s) left behind across {}",
            empty_shells.len(),
            joined(roots)
        ));
    }
    if !dead_owned.is_empty() {
        problems.push(format!(
            "{} confinement resource dir(s) owned by a dead process across {}",
            dead_owned.len(),
            joined(roots)
        ));
    }
    if !loose.is_empty() {
        problems.push(format!(
            "confinement root(s) readable beyond the owner (should be 0700): {}",
            joined(loose)
        ));
    }
    (
        false,
        format!("{} -- run \"fgos doctor --fix\"", problems.join("; ")),
    )
}

fn fix_orphans(roots: &[PathBuf], host: &dyn CleanupHost) -> (bool, String) {
    let judged = judge_confinement_orphans(roots, now_millis(), host);
    let removed = remove_confinement_orphans(&judged, host);
    let message = [
        (removed.removed_homes > 0).then(|| {
            format!(
                "removed {} home(s) left by a dead dispatch",
                removed.removed_homes
            )
        }),
        Some(if removed.removed_shells > 0 {
            format!(
                "removed {} empty per-dispatch dir(s)",
                removed.removed_shells
            )
        } else {
            "no empty per-dispatch dirs to remove".to_owned()
        }),
        (removed.tightened > 0).then(|| format!("set {} to 0700", joined(&judged.loose))),
    ]
    .into_iter()
    .flatten()
    .collect::<Vec<_>>()
    .join("; ");
    (
        removed.removed_homes > 0 || removed.removed_shells > 0 || removed.tightened > 0,
        message,
    )
}

// ---- credential-copies-retained ----------------------------------------------------------------------------

fn format_age(ms: f64) -> String {
    if ms >= 48.0 * 3_600_000.0 {
        format!("{}d", (ms / 86_400_000.0).floor())
    } else {
        format!("{}h", (ms / 3_600_000.0).floor().max(0.0))
    }
}

/// `<provider>/<account>: <n> <what>, oldest <age>` for each account, in the order an account first appears.
fn by_account<'a>(items: impl Iterator<Item = &'a RetainedCopy>, what: &str) -> Vec<String> {
    let mut order: Vec<String> = Vec::new();
    let mut groups: BTreeMap<String, (usize, f64)> = BTreeMap::new();
    for item in items {
        let key = format!("{}/{}", item.provider, item.account_id);
        if !groups.contains_key(&key) {
            order.push(key.clone());
        }
        let group = groups.entry(key).or_insert((0, 0.0));
        group.0 += 1;
        group.1 = group.1.max(item.age_ms);
    }
    order
        .into_iter()
        .map(|key| {
            let (count, oldest) = groups[&key];
            format!("{key}: {count} {what}, oldest {}", format_age(oldest))
        })
        .collect()
}

fn by_store<'a>(items: impl Iterator<Item = &'a RetainedCopy>, what: &str) -> Vec<String> {
    let mut order: Vec<PathBuf> = Vec::new();
    let mut groups: BTreeMap<PathBuf, (String, String, usize, f64)> = BTreeMap::new();
    for copy in items {
        if !groups.contains_key(&copy.store_dir) {
            order.push(copy.store_dir.clone());
        }
        let group = groups.entry(copy.store_dir.clone()).or_insert((
            copy.provider.clone(),
            copy.account_id.clone(),
            0,
            0.0,
        ));
        group.2 += 1;
        group.3 = group.3.max(copy.age_ms);
    }
    order
        .into_iter()
        .map(|dir| {
            let (provider, account, count, oldest) = &groups[&dir];
            format!(
                "{provider}/{account}: {count} {what}, oldest {}, at {} (the account's login store layout in the provider inventory no longer reads this directory; recover the login from them by hand, they are never applied or dropped automatically)",
                format_age(*oldest),
                dir.display()
            )
        })
        .collect()
}

/// Attempt homes whose run directory has neither an envelope nor an attempt intent: the finalize-home step runs
/// only from one of the two, so nothing will ever stage such a home's login or remove it.
struct Unfinalized {
    dir: PathBuf,
    attempt_id: String,
    run_dir: String,
}

fn sub_dirs(dir: &Path) -> Vec<PathBuf> {
    let Ok(read) = std::fs::read_dir(dir) else {
        return Vec::new();
    };
    read.filter_map(Result::ok)
        .filter(|entry| entry.file_type().is_ok_and(|kind| kind.is_dir()))
        .map(|entry| entry.path())
        .collect()
}

fn unfinalizable_attempt_homes(temp_root: &Path) -> Vec<Unfinalized> {
    let mut found = Vec::new();
    for dispatch in sub_dirs(temp_root) {
        let mut dirs = vec![dispatch.clone()];
        dirs.extend(sub_dirs(&dispatch));
        for dir in dirs {
            let Some(marker) = read_attempt_ownership_marker(&dir) else {
                continue;
            };
            let (Some(run_dir), Some(attempt_id)) = (
                marker.get("runDir").and_then(Value::as_str),
                marker.get("attemptId").and_then(Value::as_str),
            ) else {
                continue;
            };
            if ["envelope.json", "attempt-intent.json"]
                .iter()
                .any(|name| Path::new(run_dir).join(name).exists())
            {
                continue;
            }
            found.push(Unfinalized {
                dir,
                attempt_id: attempt_id.to_owned(),
                run_dir: run_dir.to_owned(),
            });
        }
    }
    found
}

/// What the login copy row judges, all of it read from the machine by the caller.
struct CopiesFacts {
    runtime_dir: PathBuf,
    roots: Vec<PathBuf>,
    retried_roots: Vec<PathBuf>,
    now: f64,
    min_age_ms: f64,
    /// `None` with the reason when the machine config cannot be read.
    inventory: Result<AccountInventory, String>,
}

fn over_limit_text(over: &OverLimit, unjudged: bool) -> String {
    let store = over
        .store
        .as_ref()
        .map(|store| format!(" (store {store})"))
        .unwrap_or_default();
    let who = format!("{}/{}", over.provider, over.account_id);
    if unjudged {
        format!("{who}{store}: {} pending login copies, over the limit of {MAX_PENDING_COPIES} (whether a dispatch re-checks them is not known until the provider inventory can be read; the limit drops only copies identical to another, never one that may be the only valid login)", over.count)
    } else if over.stranded {
        format!("{who}: {} pending login copies at {}, over the limit of {MAX_PENDING_COPIES}, in a directory the account's login store layout no longer reads (no dispatch re-checks or drops them; recover the logins by hand)", over.count, over.store_dir.display())
    } else {
        format!("{who}{store}: {} pending login copies waiting, over the limit of {MAX_PENDING_COPIES} (the limit drops only copies identical to another, never one that may be the only valid login; a dispatch for that account re-checks them, and if the source stays unreadable recover the logins by hand)", over.count)
    }
}

fn credential_copies_row(facts: &CopiesFacts) -> Verdict {
    // Without the provider inventory no store layout can be judged: every copy is listed at any age, and none is
    // said to wait for a dispatch, which could not run on a config that cannot be read either.
    let inventory = facts.inventory.as_ref().ok();
    let unjudged = inventory.is_none();
    let copies = inspect_retained_credential_copies(
        &facts.runtime_dir,
        facts.now,
        if unjudged { 0.0 } else { facts.min_age_ms },
        inventory,
    );
    let stranded: Vec<&RetainedCopy> = copies.iter().filter(|c| c.stranded).collect();
    // A kept home under a root no reaper or dispatch retries (a registered backend's own root) never counts its
    // own attempts up, so it is held from the start. A root nested inside another lists a home twice; it counts
    // once.
    let retried: BTreeSet<PathBuf> = facts
        .retried_roots
        .iter()
        .map(|r| canonical_root(r))
        .collect();
    let mut seen: BTreeSet<PathBuf> = BTreeSet::new();
    let mut first_sight = |dir: &Path| {
        let parent = canonical_root(dir.parent().unwrap_or(Path::new(".")));
        seen.insert(parent.join(dir.file_name().unwrap_or_default()))
    };
    let mut homes: Vec<(KeptHome, bool, f64)> = Vec::new();
    for root in &facts.roots {
        let unretried = !retried.contains(&canonical_root(root));
        for home in list_kept_credential_homes(root) {
            if !first_sight(&home.dir) {
                continue;
            }
            let held = home.held || unretried;
            let age = home
                .since
                .as_deref()
                .and_then(parse_rfc3339_millis)
                .map_or(0.0, |since| facts.now - since as f64);
            homes.push((home, held, age));
        }
    }
    let unfinalized: Vec<Unfinalized> = facts
        .roots
        .iter()
        .flat_map(|root| unfinalizable_attempt_homes(root))
        .filter(|home| first_sight(&home.dir))
        .collect();
    let over_limit = inspect_pending_copies_over_limit(&facts.runtime_dir, inventory);
    if copies.is_empty() && homes.is_empty() && unfinalized.is_empty() && over_limit.is_empty() {
        return (
            true,
            "no login copy is being retained past its dispatch".to_owned(),
        );
    }
    let unjudged_copies = unjudged && copies.len() + over_limit.len() > 0;
    let in_store = |c: &&RetainedCopy| !c.stranded;
    let plain = |c: &&RetainedCopy| {
        !c.stranded && !matches!(c.kind, "torn" | "set-aside" | "staging" | "agent")
    };
    let mut problems: Vec<String> = Vec::new();
    if unjudged_copies {
        let reason = facts
            .inventory
            .as_ref()
            .err()
            .cloned()
            .unwrap_or_else(|| "no provider account inventory was read".to_owned());
        problems.push(format!("login store layout not checked: {reason}"));
        problems.extend(over_limit.iter().map(|o| over_limit_text(o, true)));
        problems.extend(by_account(
            copies.iter().filter(|c| !matches!(c.kind, "torn" | "staging")),
            "login copy(ies) kept (whether a dispatch applies them is not known until the provider inventory can be read)",
        ));
    } else {
        problems.extend(over_limit.iter().map(|o| over_limit_text(o, false)));
    }
    problems.extend(by_store(
        stranded.iter().copied().filter(|c| c.kind != "torn"),
        "login copy(ies) that no dispatch applies",
    ));
    problems.extend(by_store(
        stranded.iter().copied().filter(|c| c.kind == "torn"),
        "half-written login copy(ies) kept for hand recovery",
    ));
    if !unjudged_copies {
        problems.extend(by_account(
            copies.iter().filter(|c| plain(c)),
            "pending login copy(ies) waiting for a renewal (a dispatch for that account applies them)",
        ));
        problems.extend(by_account(
            copies.iter().filter(|c| in_store(c) && c.kind == "agent"),
            "login copy(ies) renewed inside a private home (a dispatch for that account applies one once a renewal with its own refresh token returns a token signed for the leased account; one whose tokens name no signed account is never applied: recover it by hand or let it go)",
        ));
    }
    problems.extend(by_account(
        copies.iter().filter(|c| in_store(c) && c.kind == "staging"),
        if unjudged {
            "interrupted staging(s) of a login copy (a crash cut the copy short; \"fgos doctor --fix\" removes one that is empty or identical to a copy already kept, and cannot judge one against the source login of the account until the provider inventory can be read, any other stays for hand recovery)"
        } else {
            "interrupted staging(s) of a login copy (a crash cut the copy short; \"fgos doctor --fix\" removes one that is empty, identical to a copy already kept, or shown by the source login of the account to be no newer, any other stays for hand recovery)"
        },
    ));
    problems.extend(by_account(
        copies.iter().filter(|c| in_store(c) && c.kind == "torn"),
        "half-written login copy(ies) kept for hand recovery (never applied or dropped automatically)",
    ));
    problems.extend(by_account(
        copies.iter().filter(|c| in_store(c) && c.kind == "set-aside"),
        "login copy(ies) renewed inside a private home and set aside after renewals that returned nothing (never applied or retried: recover by hand or let it go)",
    ));
    let held: Vec<&(KeptHome, bool, f64)> = homes.iter().filter(|(_, held, _)| *held).collect();
    let retrying: Vec<&(KeptHome, bool, f64)> =
        homes.iter().filter(|(_, held, _)| !*held).collect();
    for (home, _, age) in &held {
        let why = if home.attempts >= CREDENTIAL_KEEP_MAX_ATTEMPTS {
            "after repeated staging failures"
        } else {
            "under a root that nothing retries by itself"
        };
        let recovery = if home.record.is_some() {
            "Its host record names where its login goes: \"fgos doctor --fix\", or the next attempt that ends under the same root, stages the login beside the account store and removes the home once that works."
        } else {
            HELD_HOME_RECOVERY
        };
        problems.push(format!(
            "private home held {why}, {} old, at {}. {recovery}",
            format_age(*age),
            home.dir.display()
        ));
    }
    if !retrying.is_empty() {
        let oldest = retrying
            .iter()
            .map(|(_, _, age)| *age)
            .fold(f64::MIN, f64::max);
        problems.push(format!(
            "{} private home(s) kept after a staging failure, retried by the finalize-home step of their attempt, oldest {}",
            retrying.len(),
            format_age(oldest)
        ));
    }
    for home in &unfinalized {
        problems.push(format!(
            "private home of attempt {} at {}: its run directory {} has neither envelope.json nor attempt-intent.json, so no step will ever finalize it. {UNFINALIZED_HOME_RECOVERY}",
            home.attempt_id,
            home.dir.display(),
            home.run_dir
        ));
    }
    let text = problems.join("; ");
    let failed = !held.is_empty()
        || !unfinalized.is_empty()
        || !stranded.is_empty()
        || over_limit.iter().any(|o| o.stranded)
        || unjudged_copies;
    if failed {
        (false, text)
    } else {
        (true, format!("warning: {text}"))
    }
}

/// The accounts of the machine config as the stores read them, with the inventory the machine gave (kept whole for
/// the source of each store).
struct Inventory {
    stores: AccountInventory,
    accounts: Map<String, Value>,
}

fn read_inventory() -> Result<Inventory, String> {
    let runner =
        machine_runner().map_err(|reason| format!("machine config unreadable ({reason})"))?;
    let accounts = provider_account_inventory(&runner, &HostMachine::new(None, None));
    let mut stores = AccountInventory::new();
    for (provider, entry) in &accounts {
        let per_account = stores.entry(provider.clone()).or_default();
        for (id, account) in entry
            .get("accounts")
            .and_then(Value::as_object)
            .into_iter()
            .flatten()
        {
            per_account.insert(
                id.clone(),
                InventoryAccount {
                    credential_source_clis: account
                        .get("credentialSources")
                        .and_then(Value::as_object)
                        .map(|sources| sources.keys().cloned().collect()),
                },
            );
        }
    }
    Ok(Inventory { stores, accounts })
}

fn runtime_dir() -> Result<PathBuf, String> {
    fgos_execution_engine::accounts::host::default_runtime_dir()
        .ok_or_else(machine::home_unset_message)
}

/// The roots private homes live under: the default temp roots and the temp and private-home roots of the
/// registered backends. Kept logins only.
fn credential_scan_roots() -> Vec<PathBuf> {
    let mut roots: Vec<PathBuf> = Vec::new();
    let mut add = |root: PathBuf| {
        let root = canonical_root(&root);
        if !roots.contains(&root) {
            roots.push(root);
        }
    };
    default_temp_roots().into_iter().for_each(&mut add);
    if let Ok(registry) = machine_registry() {
        for instance in registry
            .get("confinementBackends")
            .and_then(Value::as_object)
            .into_iter()
            .flatten()
            .map(|(_, instance)| instance)
        {
            for key in ["tempRoot", "privateHomeRoot"] {
                if let Some(root) = instance.get(key).and_then(Value::as_str) {
                    if !root.trim().is_empty() {
                        add(PathBuf::from(root));
                    }
                }
            }
        }
    }
    roots
}

fn copies_verdict() -> Verdict {
    let runtime = match runtime_dir() {
        Ok(dir) => dir,
        Err(message) => return (false, message),
    };
    let inventory = read_inventory().map(|inv| inv.stores);
    credential_copies_row(&CopiesFacts {
        runtime_dir: runtime,
        roots: credential_scan_roots(),
        retried_roots: default_temp_roots(),
        now: now_ms(),
        min_age_ms: RETAINED_COPY_REPORT_AFTER_MS,
        inventory,
    })
}

/// Stages the login a held home renewed beside its account store.
struct StageLogin<'a> {
    now: f64,
    locks: &'a dyn fgos_execution_engine::credentials::AccountLocks,
}

impl CredentialWriteBack for StageLogin<'_> {
    fn write_back(&self, home: &Path, target: Option<&Value>) -> WriteBackOutcome {
        write_back_renewed_credential(home, target, self.now, &NoSqlite, self.locks)
    }
}

/// What a store's source login is judged by: the source the account's inventory names for it, `Stranded` when the
/// account's layout no longer reads that store, `Unjudged` when its layout cannot be told.
fn store_judgement(
    inventory: &Map<String, Value>,
    runtime: &Path,
    home_dir: Option<&str>,
    provider: &str,
    account_id: &str,
    store: Option<&str>,
) -> StoreJudgement {
    let account = inventory
        .get(provider)
        .and_then(|entry| entry.get("accounts"))
        .and_then(|accounts| accounts.get(account_id));
    let source = account
        .zip(store)
        .and_then(|(account, store)| account.get("credentialSources")?.get(store));
    let Some(source) = source.filter(|s| truthy(Some(s))) else {
        return StoreJudgement::Stranded;
    };
    let text = |key: &str| source.get(key).and_then(Value::as_str).map(str::to_owned);
    let credential = CredentialSource {
        kind: text("kind").unwrap_or_default(),
        home: text("home").unwrap_or_default(),
        files: source
            .get("files")
            .and_then(Value::as_array)
            .map(|files| {
                files
                    .iter()
                    .filter_map(|f| f.as_str().map(str::to_owned))
                    .collect()
            })
            .unwrap_or_default(),
        cli: text("cli"),
    };
    let target = credential_write_back_target(provider, account_id, &credential, runtime, home_dir);
    match target.as_ref().and_then(|t| {
        Some((
            Layout::from_name(t.get("layout")?.as_str()?)?,
            PathBuf::from(t.get("home")?.as_str()?),
        ))
    }) {
        Some((layout, source_home)) => StoreJudgement::Judge {
            layout,
            source_home,
        },
        None => StoreJudgement::Unjudged,
    }
}

fn fix_credential_copies() -> (bool, String) {
    let runtime = match runtime_dir() {
        Ok(dir) => dir,
        Err(message) => return (false, format!("skipped -- {message}")),
    };
    let inventory = read_inventory().ok();
    let home_dir = std::env::var(machine::HOME_VAR)
        .ok()
        .filter(|h| !h.is_empty());
    let host = AccountsHost::new();
    let accounts = Accounts::from_environment(&host).ok();
    let accounts_locks = accounts.as_ref().map(AccountsLocks);
    let no_locks = NoLocks;
    let locks: &dyn fgos_execution_engine::credentials::AccountLocks = match &accounts_locks {
        Some(locks) => locks,
        None => &no_locks,
    };
    let now = now_ms();
    let resolve = |provider: &str, account: &str, store: Option<&str>| match &inventory {
        Some(inv) => store_judgement(
            &inv.accounts,
            &runtime,
            home_dir.as_deref(),
            provider,
            account,
            store,
        ),
        None => StoreJudgement::Unjudged,
    };
    let resolve_store: Option<&ResolveStore<'_>> = inventory.as_ref().map(|_| &resolve as _);
    let stagings = sweep_interrupted_stagings(&SweepOptions {
        runtime_dir: &runtime,
        resolve_store,
        now,
        min_age_ms: STAGING_MIN_AGE_MS,
        locks,
        sqlite: &NoSqlite,
    });
    let roots = credential_scan_roots();
    let retried: BTreeSet<PathBuf> = default_temp_roots()
        .iter()
        .map(|r| canonical_root(r))
        .collect();
    let unretried: Vec<PathBuf> = roots
        .iter()
        .filter(|root| !retried.contains(&canonical_root(root)))
        .cloned()
        .collect();
    let settled = settle_held_credential_homes(&roots, &unretried, &StageLogin { now, locks });
    let homes = if settled.settled + settled.held == 0 {
        "no held private home to settle".to_owned()
    } else {
        format!(
            "held private home(s): {} settled, {} still held (one without a host record is recovered by hand)",
            settled.settled, settled.held
        )
    };
    let staged = if stagings.removed + stagings.kept == 0 {
        String::new()
    } else {
        format!(
            "; interrupted staging(s): {} removed, {} kept for hand recovery",
            stagings.removed, stagings.kept
        )
    };
    (
        settled.settled > 0 || stagings.removed > 0,
        format!("{homes}{staged}"),
    )
}

// ---- the bwrap rows ----------------------------------------------------------------------------------------

fn smoke_of(binary: &str) -> SmokeResult {
    SmokeProbe::new().check(binary, &std::env::var("PATH").unwrap_or_default())
}

fn bwrap_platform(
    registry: &Result<Value, DriverError>,
    platform: &str,
    smoke: &dyn Fn(&str) -> SmokeResult,
) -> Verdict {
    let registry = match registry {
        Ok(registry) => registry,
        Err(error) => {
            return (
                false,
                format!(
                    "bwrap backend status: machine registry not readable or malformed ({})",
                    error.message
                ),
            )
        }
    };
    let Some(bwrap) = bwrap_instance(registry) else {
        return (
            false,
            "bwrap backend status: not configured in machine registry".to_owned(),
        );
    };
    if bwrap.disabled {
        return (
            true,
            "bwrap backend status: disabled in machine registry".to_owned(),
        );
    }
    if platform != "linux" {
        return (
            false,
            format!("bwrap backend status: unavailable (platform \"{platform}\" is not Linux)"),
        );
    }
    let probe = smoke(&bwrap.binary);
    if !probe.passed {
        return (
            false,
            format!(
                "bwrap backend status: unavailable (binary \"{}\" failed smoke test: {})",
                bwrap.binary, probe.message
            ),
        );
    }
    (
        true,
        format!(
            "bwrap backend status: ready (Linux, binary \"{}\" working, enabled)",
            bwrap.binary
        ),
    )
}

/// One probe run's verdict: whether it passed, its message, how many probes ran.
type ProbeVerdict = (bool, String, usize);

fn probe_freshness(
    registry: &Result<Value, DriverError>,
    platform: &str,
    run: &dyn Fn(&str) -> ProbeVerdict,
) -> RowOutcome {
    let registry = match registry {
        Ok(registry) => registry,
        Err(error) => {
            return judged(
                false,
                format!(
                    "confinement probe freshness: machine registry not readable ({})",
                    error.message
                ),
            )
        }
    };
    let Some(bwrap) = bwrap_instance(registry).filter(|b| !b.disabled) else {
        return judged(
            true,
            "confinement probe freshness: bwrap backend is disabled or not configured in machine registry",
        );
    };
    if platform != "linux" {
        return skipped(format!(
            "confinement probe freshness: platform \"{platform}\" is not Linux (bwrap probes skipped)"
        ));
    }
    let (passed, message, count) = run(&bwrap.binary);
    if !passed {
        return judged(
            false,
            format!("confinement probe freshness: failing or stale probe detected: {message}"),
        );
    }
    judged(
        true,
        format!("confinement probe freshness: all {count} local-bwrap-v1 probes passed (fresh)"),
    )
}

fn skipped(message: String) -> RowOutcome {
    RowOutcome::Judged(RowResult {
        elapsed_ms: None,
        passed: true,
        status: Some(Status::Skip),
        message: Some(message),
        fix_command: None,
        detail: None,
    })
}

/// A blind unit is refused, never run unblind, when its backend cannot keep a worker from reading peer run state.
/// This row says which of those a machine is in: pass, fail (the probe ran and failed), or backend-unsupported.
fn blind_read(
    registry: &Result<Value, DriverError>,
    platform: &str,
    smoke: &dyn Fn(&str) -> SmokeResult,
    probe: &dyn Fn(&str) -> Verdict,
) -> Verdict {
    let registry = match registry {
        Ok(registry) => registry,
        Err(error) => {
            return (
                false,
                format!(
                    "blind-read: fail (machine registry not readable: {})",
                    error.message
                ),
            )
        }
    };
    let Some(bwrap) = bwrap_instance(registry).filter(|b| !b.disabled) else {
        return (
            true,
            "blind-read: backend-unsupported (no enabled bwrap backend; blind units are refused)"
                .to_owned(),
        );
    };
    if platform != "linux" {
        return (
            true,
            format!("blind-read: backend-unsupported (platform \"{platform}\" is not Linux; blind units are refused)"),
        );
    }
    let available = smoke(&bwrap.binary);
    if !available.passed {
        return (
            true,
            format!(
                "blind-read: backend-unsupported (bwrap \"{}\" is not usable: {}; blind units are refused)",
                bwrap.binary, available.message
            ),
        );
    }
    let (passed, detail) = probe(&bwrap.binary);
    if passed {
        (
            true,
            "blind-read: pass (a blind worker cannot read a peer run, home or process)".to_owned(),
        )
    } else {
        (false, format!("blind-read: fail ({detail})"))
    }
}

// ---- the probe ports ---------------------------------------------------------------------------------------

/// The resource resolver behind the probe's driver: a request's JSON in, the resolved resources as JSON out.
struct PolicyResolver;

impl ResourceResolver for PolicyResolver {
    fn resolve(&self, input: &Value) -> Result<Vec<Value>, DriverError> {
        let text = |path: &[&str]| {
            path.iter()
                .try_fold(input, |value, key| value.get(*key))
                .and_then(Value::as_str)
                .map(str::to_owned)
        };
        let context = &input["context"];
        let ctx = |key: &str| context.get(key).and_then(Value::as_str).map(str::to_owned);
        let temp = std::env::temp_dir();
        let resolve_input = ResolveInput {
            dispatch_id: text(&["dispatchId"]).unwrap_or_default(),
            context: ResolveContext {
                run_dir: ctx("runDir"),
                fgos_dir: ctx("fgosDir"),
                repo_root: ctx("repoRoot"),
                cwd: ctx("cwd"),
                assignment_launch_context: context.get("assignmentLaunchContext").is_some(),
                ..Default::default()
            },
            grants: input["grants"]
                .as_array()
                .map(|list| {
                    list.iter()
                        .map(|grant| Grant {
                            resource: grant["resource"].as_str().unwrap_or_default().into(),
                            access: grant["access"].as_str().unwrap_or_default().into(),
                            ..Default::default()
                        })
                        .collect()
                })
                .unwrap_or_default(),
            temp_root: text(&["backendConfig", "tempRoot"]),
            default_temp_root:
                fgos_execution_engine::confinement::cleanup::resolve_confinement_temp_root(&temp)
                    .to_string_lossy()
                    .into_owned(),
            credentials_path: text(&["providerSources", "credentialsPath"]),
            default_credentials_dir: temp.join("fgos-credentials").to_string_lossy().into_owned(),
            blind: input["blind"].as_bool().unwrap_or(false),
            home_dir: text(&["homeDir"])
                .unwrap_or_else(|| std::env::var("HOME").unwrap_or_default()),
            claude_socket_base: text(&["claudeSocketBase"])
                .unwrap_or_else(|| temp.to_string_lossy().into_owned()),
            xdg_runtime_dir: text(&["xdgRuntimeDir"]),
            xdg_config_home: text(&["xdgConfigHome"]),
            herdr_socket_path: text(&["herdrSocketPath"]),
            login_stores: input["loginStores"]
                .as_array()
                .map(|list| {
                    list.iter()
                        .filter_map(|store| store.as_str().map(str::to_owned))
                        .collect()
                })
                .unwrap_or_default(),
            ..Default::default()
        };
        let resolved = resolve_confinement_resources(&resolve_input)
            .map_err(|error| DriverError::new(ErrorKind::Port, error.to_string()))?;
        Ok(resolved
            .iter()
            .map(|resource| {
                serde_json::to_value(resource).expect("a resolved resource is plain data")
            })
            .collect())
    }
}

/// A probe holds no account login: nothing is ever copied into its home.
struct NoLogin;

impl Credentials for NoLogin {
    fn login_life_problem(&self, _source: &Value, _timeout_ms: u64) -> Option<String> {
        None
    }

    fn copy_files(
        &self,
        _private_home: &Path,
        _source_home: &Path,
        _files: &[String],
    ) -> Result<Vec<String>, DriverError> {
        Ok(Vec::new())
    }

    fn write_back_target(&self, _capacity: &Value) -> Option<Value> {
        None
    }
}

fn driver_over(runtime_dir: &Path) -> Arc<dyn BackendDriver> {
    let runtime = runtime_dir.to_string_lossy().into_owned();
    let env: EnvFn = Arc::new(move |name| match name {
        "XDG_RUNTIME_DIR" if !runtime.is_empty() => Some(runtime.clone()),
        "HOME" => std::env::var("HOME").ok(),
        _ => None,
    });
    #[cfg(unix)]
    // SAFETY: getuid has no failure mode and touches no memory.
    let uid = unsafe { libc::getuid() };
    #[cfg(not(unix))]
    let uid = 0;
    Arc::new(BwrapDriver::new(
        Arc::new(PolicyResolver),
        Arc::new(CleanupHomes::<SystemHost>::default()),
        Arc::new(NoLogin),
        env,
        uid,
    ))
}

/// Runs `body` with a fresh owner-only scratch directory, removed afterwards.
fn with_scratch<T>(prefix: &str, body: impl FnOnce(&Path) -> T) -> Result<T, String> {
    let suffix = random_hex().map_err(|error| error.to_string())?;
    let dir = std::env::temp_dir().join(format!("{prefix}{}-{suffix}", std::process::id()));
    let mut builder = std::fs::DirBuilder::new();
    #[cfg(unix)]
    std::os::unix::fs::DirBuilderExt::mode(&mut builder, 0o700);
    builder.create(&dir).map_err(|error| error.to_string())?;
    let out = body(&dir);
    let _ = std::fs::remove_dir_all(&dir);
    Ok(out)
}

fn run_all_probes(binary: &str) -> ProbeVerdict {
    let ran = with_scratch("fgos-probe-", |scratch| {
        let ports = ProbePorts {
            resolver: &PolicyResolver,
            driver_for: &driver_over,
        };
        run_all_confinement_probes(binary, scratch, false, &ports)
    });
    match ran {
        Ok(run) => (run.passed, run.message, run.results.len()),
        Err(error) => (
            false,
            format!("confinement probes could not start: {error}"),
            0,
        ),
    }
}

fn peer_probe(binary: &str) -> Verdict {
    let ran = with_scratch("fgos-blind-probe-", |scratch| {
        let ports = ProbePorts {
            resolver: &PolicyResolver,
            driver_for: &driver_over,
        };
        let result = peer_run_hidden(binary, scratch, std::process::id(), &ports, false);
        (result.passed, result.detail)
    });
    ran.unwrap_or_else(|error| (false, format!("blind read probe failed: {error}")))
}

// ---- strict readiness and herdr maturity ---------------------------------------------------------------------

fn strict_readiness(runner: &Result<Value, String>, bwrap: &Verdict) -> Verdict {
    let runner = match runner {
        Ok(runner) => runner,
        Err(message) => return (false, format!("runner config not readable: {message}")),
    };
    let strict = is_strict(runner);
    let mut missing: Vec<String> = Vec::new();
    let mut invalid: Vec<String> = Vec::new();
    if !runner
        .get("capabilities")
        .is_some_and(|c| c.is_object() || c.is_array())
        || capability_name_count(runner) == 0
    {
        missing.push("no capabilities declared".to_owned());
    } else {
        for (name, entry) in declared_capabilities(runner) {
            if !is_entry(entry) {
                invalid.push(format!("capability \"{name}\" is malformed"));
                continue;
            }
            let confinement = entry.get("confinement");
            if confinement
                .and_then(|c| c.get("mode"))
                .and_then(Value::as_str)
                == Some("unconfined")
            {
                continue;
            }
            match confinement
                .and_then(|c| c.get("policy"))
                .filter(|p| truthy(Some(p)))
            {
                None => missing.push(format!("capability \"{name}\" missing confinement policy")),
                Some(policy) => {
                    let id = text_of(policy);
                    if !BUILTIN_POLICY_IDS.contains(&id.as_str())
                        && !custom_policy_declared(runner, &id)
                    {
                        invalid.push(format!(
                            "capability \"{name}\" references unknown policy \"{id}\""
                        ));
                    }
                }
            }
        }
    }
    let bwrap_ready = bwrap.0 && bwrap.1.contains("ready");
    if !invalid.is_empty() {
        let all: Vec<String> = missing.iter().chain(invalid.iter()).cloned().collect();
        return (
            false,
            format!("strict confinement not ready: {}", all.join("; ")),
        );
    }
    if !missing.is_empty() {
        return if strict {
            (
                false,
                format!("strict confinement not ready: {}", missing.join("; ")),
            )
        } else {
            (
                true,
                format!(
                    "warning: strict confinement disabled ({})",
                    missing.join("; ")
                ),
            )
        };
    }
    if !bwrap_ready {
        return if strict {
            (
                false,
                format!(
                    "strict confinement not ready: bwrap not ready ({})",
                    bwrap.1
                ),
            )
        } else {
            (
                true,
                format!(
                    "warning: strict confinement disabled; bwrap not ready ({})",
                    bwrap.1
                ),
            )
        };
    }
    (
        true,
        "strict confinement readiness satisfied (all capabilities declare valid policies and bwrap backend is ready)"
            .to_owned(),
    )
}

fn herdr_maturity(runner: &Result<Value, String>) -> RowOutcome {
    let runner = match runner {
        Ok(runner) => runner,
        Err(message) => {
            return skipped(format!(
                "runner config not readable, herdr maturity check skipped: {message}"
            ))
        }
    };
    let empty = Map::new();
    let executors = runner
        .get("executors")
        .and_then(Value::as_object)
        .unwrap_or(&empty);
    let mut herdr_ids: Vec<&str> = Vec::new();
    let mut invalid: Vec<String> = Vec::new();
    for (id, exec) in executors {
        if !exec.is_object() {
            continue;
        }
        let invocations = exec
            .get("invocations")
            .and_then(Value::as_array)
            .into_iter()
            .flatten();
        for invocation in invocations {
            let is_herdr = invocation.get("via").and_then(Value::as_str) == Some("cli")
                && invocation.get("adapter").and_then(Value::as_str) == Some("herdr-spawn");
            if !is_herdr {
                continue;
            }
            if !herdr_ids.contains(&id.as_str()) {
                herdr_ids.push(id);
            }
            if invocation.get("permissionMode").and_then(Value::as_str) != Some("bypass") {
                continue;
            }
            let conf = invocation
                .get("confinement")
                .filter(|c| !c.is_null())
                .or_else(|| exec.get("confinement").filter(|c| !c.is_null()));
            let normalized = conf
                .filter(|c| truthy(Some(c)))
                .and_then(normalize_legacy_confinement);
            let control = |axis: &str, wanted: &str, flag: &str| {
                normalized
                    .as_ref()
                    .and_then(|n| n.get("controls")?.get(axis)?.as_str().map(|v| v == wanted))
                    .unwrap_or(false)
                    || truthy(conf.and_then(|c| c.get(flag)))
            };
            if !(control("workspace", "own", "ownWorktree")
                && control("home", "private", "privateHome")
                && control("session", "isolated", "isolatedSession"))
            {
                let invocation_id = invocation
                    .get("id")
                    .filter(|v| !v.is_null())
                    .map_or_else(|| "?".to_owned(), text_of);
                invalid.push(format!("{id}/{invocation_id}"));
            }
        }
    }
    if herdr_ids.is_empty() {
        return judged(
            true,
            "herdr confinement maturity: not applicable (no herdr-spawn executors configured)",
        );
    }
    if !invalid.is_empty() {
        return judged(
            false,
            format!(
                "herdr confinement maturity check failed: executors declare bypass without full confinement ({})",
                invalid.join(", ")
            ),
        );
    }
    judged(
        true,
        format!(
            "herdr confinement maturity: partial ({} herdr-spawn executor(s); pre-adapter validation under Authority, session/home lifecycle in adapter)",
            herdr_ids.len()
        ),
    )
}

// ---- the group ---------------------------------------------------------------------------------------------

fn verdict(outcome: Verdict) -> RowOutcome {
    judged(outcome.0, outcome.1)
}

fn judge(root: &Path, ids: &[&str]) -> Vec<RowOutcome> {
    let runner = read_runner(root);
    ids.iter()
        .map(|id| {
            timed(|| match *id {
                "confinement-policies-declared" => verdict(policies_declared(&runner)),
                "confinement-backend-registry-readable" => {
                    verdict(backend_registry_row(machine_registry_path()))
                }
                "confinement-orphaned-resources-reaped" => {
                    let roots = default_temp_roots();
                    let found =
                        judge_confinement_orphans(&roots, now_millis(), &SystemHost::default());
                    verdict(orphans_row(&roots, &found))
                }
                "credential-copies-retained" => verdict(copies_verdict()),
                "confinement-bwrap-platform" => {
                    verdict(bwrap_platform(&machine_registry(), platform(), &smoke_of))
                }
                "confinement-probe-freshness" => {
                    probe_freshness(&machine_registry(), platform(), &run_all_probes)
                }
                "confinement-blind-read" => verdict(blind_read(
                    &machine_registry(),
                    platform(),
                    &smoke_of,
                    &peer_probe,
                )),
                "confinement-strict-readiness" => {
                    let bwrap = bwrap_platform(&machine_registry(), platform(), &smoke_of);
                    verdict(strict_readiness(&runner, &bwrap))
                }
                "confinement-herdr-maturity" => herdr_maturity(&runner),
                other => unreachable!("confinement group asked for row {other}"),
            })
        })
        .collect()
}

fn fix(_root: &Path, ids: &[&str]) -> Vec<FixResult> {
    ids.iter()
        .map(|id| {
            let (changed, message) = match *id {
                "confinement-backend-registry-readable" => {
                    fix_backend_registry(machine_registry_path())
                }
                "confinement-orphaned-resources-reaped" => {
                    fix_orphans(&default_temp_roots(), &SystemHost::default())
                }
                "credential-copies-retained" => fix_credential_copies(),
                other => unreachable!("confinement group asked for fix {other}"),
            };
            FixResult::done(id, changed, message)
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn passed(outcome: RowOutcome) -> (bool, Option<Status>, String) {
        match outcome {
            RowOutcome::Judged(result) => (
                result.passed,
                result.status,
                result.message.unwrap_or_default(),
            ),
            RowOutcome::Unavailable { message, .. } => (false, None, message),
        }
    }

    fn temp(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "fgos-doctor-confinement-{name}-{}-{}",
            std::process::id(),
            random_hex().unwrap()
        ));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn ok_registry() -> Result<Value, DriverError> {
        Ok(
            json!({"contract": "confinement-backend-registry.v1", "confinementBackends": {"bwrap": {"type": "bwrap", "enabled": true}}}),
        )
    }

    fn smoke_ok(binary: &str) -> SmokeResult {
        SmokeResult {
            passed: true,
            message: format!("{binary} ok"),
        }
    }

    fn smoke_bad(_: &str) -> SmokeResult {
        SmokeResult {
            passed: false,
            message: "no sandbox".into(),
        }
    }

    #[test]
    fn a_capability_naming_an_unknown_policy_fails_and_declared_or_builtin_policies_pass() {
        let runner = |confinement: Value| {
            Ok(json!({"capabilities": {"code:write": {"confinement": confinement}}}))
        };
        let builtin = policies_declared(&runner(json!({"policy": "workspace-write"})));
        assert_eq!(
            builtin,
            (
                true,
                "all capability confinement policies are declared".into()
            )
        );
        let unknown = policies_declared(&runner(json!({"policy": "nope"})));
        assert_eq!(unknown, (false, "undeclared confinement policies: capability \"code:write\" references unknown policy \"nope\"".into()));
        let anchorless = policies_declared(&runner(json!({"mode": "preferred"})));
        assert!(
            anchorless.0
                && anchorless.1.contains(
                    "1 capability/capabilities have no confinement anchor declared (code:write)"
                ),
            "{anchorless:?}"
        );
        let strict = policies_declared(&Ok(
            json!({"confinement": {"strict": true}, "capabilities": {"a": {}}}),
        ));
        assert_eq!(
            strict,
            (
                false,
                "missing confinement anchors in strict mode: a".into()
            )
        );
        assert_eq!(
            policies_declared(&Ok(json!({}))),
            (
                true,
                "no runner capabilities declared -- nothing to check".into()
            )
        );
        assert_eq!(
            policies_declared(&Err("boom".into())),
            (false, "runner config not readable: boom".into())
        );
    }

    #[test]
    fn a_malformed_custom_policy_names_its_id() {
        let runner = Ok(json!({"capabilities": {"a": {}}, "confinementPolicies": {"mine": 3}}));
        let (passed, message) = policies_declared(&runner);
        assert!(!passed);
        assert!(
            message.starts_with("custom confinement policy \"mine\" is malformed: "),
            "{message}"
        );
    }

    #[test]
    fn the_backend_registry_row_tells_missing_invalid_malformed_and_valid_apart() {
        let dir = temp("registry");
        let path = dir.join("confinement-backends.json");
        let (ok, message) = backend_registry_row(Ok(path.clone()));
        assert!(
            !ok && message.contains("not found at")
                && message.ends_with("-- run fgos doctor --fix"),
            "{message}"
        );
        fs::write(&path, "{").unwrap();
        assert!(backend_registry_row(Ok(path.clone()))
            .1
            .contains("is not valid JSON"));
        fs::write(&path, "{\"contract\":\"x\",\"confinementBackends\":{}}").unwrap();
        assert!(backend_registry_row(Ok(path.clone()))
            .1
            .contains("is malformed"));
        let (changed, _) = fix_backend_registry(Ok(path.clone()));
        let (ok, message) = backend_registry_row(Ok(path.clone()));
        assert!(
            changed && ok && message.contains("backend(s) configured"),
            "{message}"
        );
        let (changed, message) = fix_backend_registry(Ok(path));
        assert!(!changed && message.contains("already valid"), "{message}");
        let _ = fs::remove_dir_all(dir);
    }

    #[test]
    fn the_orphans_row_counts_what_confinement_left_and_the_fix_removes_empty_shells() {
        let root = temp("orphans");
        let roots = vec![root.clone()];
        let found = Orphans::default();
        assert!(orphans_row(&roots, &found).0);
        let found = Orphans {
            empty_shells: vec![root.join("d1")],
            ..Orphans::default()
        };
        let (ok, message) = orphans_row(&roots, &found);
        assert!(
            !ok && message.contains("1 empty per-dispatch dir(s) left behind across")
                && message.ends_with("-- run \"fgos doctor --fix\""),
            "{message}"
        );
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn the_bwrap_rows_follow_the_registry_the_platform_and_the_smoke_test() {
        let missing: Result<Value, DriverError> = Ok(json!({"confinementBackends": {}}));
        assert_eq!(
            bwrap_platform(&missing, "linux", &smoke_ok),
            (
                false,
                "bwrap backend status: not configured in machine registry".into()
            )
        );
        let disabled: Result<Value, DriverError> =
            Ok(json!({"confinementBackends": {"bwrap": {"enabled": false}}}));
        assert!(bwrap_platform(&disabled, "linux", &smoke_ok).0);
        assert!(bwrap_platform(&ok_registry(), "darwin", &smoke_ok)
            .1
            .contains("is not Linux"));
        assert!(bwrap_platform(&ok_registry(), "linux", &smoke_bad)
            .1
            .contains("failed smoke test: no sandbox"));
        assert_eq!(
            bwrap_platform(&ok_registry(), "linux", &smoke_ok),
            (
                true,
                "bwrap backend status: ready (Linux, binary \"bwrap\" working, enabled)".into()
            )
        );
        let unreadable: Result<Value, DriverError> =
            Err(DriverError::new(ErrorKind::Registry, "bad"));
        assert!(bwrap_platform(&unreadable, "linux", &smoke_ok)
            .1
            .contains("not readable or malformed (bad)"));
    }

    #[test]
    fn probe_freshness_skips_off_linux_and_reports_a_failing_probe() {
        let ran = |_: &str| (true, "m".to_owned(), 10);
        let off = passed(probe_freshness(&ok_registry(), "darwin", &ran));
        assert_eq!((off.0, off.1), (true, Some(Status::Skip)));
        let failing = |_: &str| (false, "probe x (why)".to_owned(), 0);
        assert!(passed(probe_freshness(&ok_registry(), "linux", &failing))
            .2
            .ends_with("failing or stale probe detected: probe x (why)"));
        assert!(passed(probe_freshness(&ok_registry(), "linux", &ran))
            .2
            .contains("all 10 local-bwrap-v1 probes passed (fresh)"));
        let none: Result<Value, DriverError> = Ok(json!({"confinementBackends": {}}));
        assert!(passed(probe_freshness(&none, "linux", &ran))
            .2
            .contains("disabled or not configured"));
    }

    #[test]
    fn blind_read_is_backend_unsupported_without_a_usable_backend_and_pass_or_fail_by_the_probe() {
        let probe_ok = |_: &str| (true, String::new());
        let probe_bad = |_: &str| (false, "leaked".to_owned());
        let none: Result<Value, DriverError> = Ok(json!({"confinementBackends": {}}));
        assert!(blind_read(&none, "linux", &smoke_ok, &probe_ok)
            .1
            .starts_with("blind-read: backend-unsupported (no enabled bwrap backend"));
        assert!(blind_read(&ok_registry(), "darwin", &smoke_ok, &probe_ok)
            .1
            .contains("is not Linux"));
        assert!(blind_read(&ok_registry(), "linux", &smoke_bad, &probe_ok)
            .1
            .contains("is not usable: no sandbox"));
        assert_eq!(
            blind_read(&ok_registry(), "linux", &smoke_ok, &probe_bad),
            (false, "blind-read: fail (leaked)".into())
        );
        assert!(blind_read(&ok_registry(), "linux", &smoke_ok, &probe_ok).0);
    }

    #[test]
    fn strict_readiness_warns_unless_the_config_is_strict() {
        let ready = (true, "bwrap backend status: ready (x)".to_owned());
        let not_ready = (false, "bwrap backend status: unavailable (x)".to_owned());
        let declared =
            Ok(json!({"capabilities": {"a": {"confinement": {"policy": "workspace-write"}}}}));
        assert!(strict_readiness(&declared, &ready)
            .1
            .starts_with("strict confinement readiness satisfied"));
        assert!(strict_readiness(&declared, &not_ready)
            .1
            .starts_with("warning: strict confinement disabled; bwrap not ready"));
        let strict = Ok(
            json!({"confinement": {"strict": true}, "capabilities": {"a": {"confinement": {"policy": "workspace-write"}}}}),
        );
        assert!(!strict_readiness(&strict, &not_ready).0);
        let none = Ok(json!({}));
        assert_eq!(
            strict_readiness(&none, &ready),
            (
                true,
                "warning: strict confinement disabled (no capabilities declared)".into()
            )
        );
        let unknown = Ok(json!({"capabilities": {"a": {"confinement": {"policy": "nope"}}}}));
        assert_eq!(
            strict_readiness(&unknown, &ready),
            (
                false,
                "strict confinement not ready: capability \"a\" references unknown policy \"nope\""
                    .into()
            )
        );
    }

    #[test]
    fn herdr_maturity_names_bypass_executors_without_full_confinement() {
        let herdr = |extra: Value| {
            let mut invocation = json!({"id": "i1", "via": "cli", "adapter": "herdr-spawn"});
            invocation
                .as_object_mut()
                .unwrap()
                .extend(extra.as_object().unwrap().clone());
            Ok(json!({"executors": {"e": {"invocations": [invocation]}}}))
        };
        assert!(passed(herdr_maturity(&Ok(json!({}))))
            .2
            .contains("not applicable"));
        let partial = passed(herdr_maturity(&herdr(json!({}))));
        assert!(
            partial.0 && partial.2.contains("partial (1 herdr-spawn executor(s)"),
            "{partial:?}"
        );
        let bypass = passed(herdr_maturity(&herdr(json!({"permissionMode": "bypass"}))));
        assert!(!bypass.0 && bypass.2.ends_with("(e/i1)"), "{bypass:?}");
        let full = herdr(
            json!({"permissionMode": "bypass", "confinement": {"ownWorktree": true, "privateHome": true, "isolatedSession": true}}),
        );
        assert!(passed(herdr_maturity(&full)).0);
        let skipped = passed(herdr_maturity(&Err("x".into())));
        assert_eq!((skipped.0, skipped.1), (true, Some(Status::Skip)));
    }

    #[test]
    fn the_login_copy_row_passes_when_nothing_is_kept_and_fails_on_a_stranded_copy() {
        let root = temp("copies");
        let runtime = root.join("runtime");
        fs::create_dir_all(&runtime).unwrap();
        let facts = |inventory: Result<AccountInventory, String>| CopiesFacts {
            runtime_dir: runtime.clone(),
            roots: vec![root.join("roots")],
            retried_roots: vec![root.join("roots")],
            now: now_ms(),
            min_age_ms: RETAINED_COPY_REPORT_AFTER_MS,
            inventory,
        };
        assert_eq!(
            credential_copies_row(&facts(Ok(AccountInventory::new()))),
            (
                true,
                "no login copy is being retained past its dispatch".into()
            )
        );
        let pending = runtime.join("account-locks/p/a/pending/000001577836800-x");
        fs::create_dir_all(&pending).unwrap();
        fs::write(pending.join("auth.json"), "{}").unwrap();
        let (ok, message) =
            credential_copies_row(&facts(Err("machine config unreadable (x)".into())));
        assert!(
            !ok && message
                .starts_with("login store layout not checked: machine config unreadable (x)"),
            "{message}"
        );
        let (ok, message) = credential_copies_row(&facts(Ok(AccountInventory::new())));
        assert!(
            !ok && message.contains("login copy(ies) that no dispatch applies"),
            "{message}"
        );
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn the_group_lists_the_rows_and_fixes_the_registry_names() {
        assert_eq!(ROWS.len(), 9);
        assert!(FIXES.iter().all(|fix| ROWS.contains(fix)));
        assert_eq!(format_age(5.0 * 3_600_000.0), "5h");
        assert_eq!(format_age(72.0 * 3_600_000.0), "3d");
    }
}
