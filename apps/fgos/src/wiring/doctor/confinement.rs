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
    driver_over, peer_run_hidden, run_all_confinement_probes, PolicyResolver, ProbePorts,
};
use fgos_execution_engine::confinement::cleanup::{
    canonical_root, credential_scan_roots as cleanup_scan_roots, default_temp_roots,
    judge_confinement_orphans, list_kept_credential_homes, read_attempt_ownership_marker,
    remove_confinement_orphans, settle_held_credential_homes, CleanupHost, CredentialWriteBack,
    KeptHome, Orphans, SystemHost, WriteBackOutcome, CREDENTIAL_KEEP_MAX_ATTEMPTS,
};
use fgos_execution_engine::confinement::driver::bwrap::{SmokeProbe, SmokeResult};
use fgos_execution_engine::confinement::driver::registry::{
    ensure_machine_registry_defaults, load_machine_registry, registry_path, validate_registry_shape,
};
use fgos_execution_engine::confinement::driver::DriverError;
use fgos_execution_engine::confinement::policy::{
    validate_confinement_policy_shape, BUILTIN_POLICY_IDS,
};
use fgos_execution_engine::credentials::files::{make_dir, now_ms, random_hex};
use fgos_execution_engine::credentials::store::{OverLimit, ResolveStore, SweepOptions};
use fgos_execution_engine::credentials::{
    credential_write_back_target, inspect_pending_copies_over_limit,
    inspect_retained_credential_copies, sweep_interrupted_stagings, write_back_renewed_credential,
    AccountInventory, AccountsLocks, BundledSqlite, CredentialSource, InventoryAccount, Layout,
    NoLocks, RetainedCopy, StoreJudgement, MAX_PENDING_COPIES, STAGING_MIN_AGE_MS,
};
use fgos_host_runtime::civil_time::parse_rfc3339_millis;
use serde_json::{json, Map, Value};
use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};

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
pub(crate) fn machine_runner() -> Result<Value, String> {
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
        Err(SnapshotError::Io(io)) => Err(format!("config-io ({:?})", io.kind())),
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
    Ok(Inventory {
        stores: stores_of(&accounts),
        accounts,
    })
}

/// The login store layout of each account of `accounts`: the CLIs it declares a store for, or none for an account
/// with one store.
fn stores_of(accounts: &Map<String, Value>) -> AccountInventory {
    let mut stores = AccountInventory::new();
    for (provider, entry) in accounts {
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
    stores
}

fn runtime_dir() -> Result<PathBuf, String> {
    fgos_execution_engine::accounts::host::default_runtime_dir()
        .ok_or_else(machine::home_unset_message)
}

/// The roots kept logins are looked for under, the machine registry's included.
fn credential_scan_roots() -> Vec<PathBuf> {
    cleanup_scan_roots(machine_registry().ok().as_ref())
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
        write_back_renewed_credential(home, target, self.now, &BundledSqlite, self.locks)
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
    // A store under stores/<cli> is read only by an account that declares that CLI; the account directory itself
    // only by an account with one store.
    let source = account.and_then(|account| match (store, account.get("credentialSources")) {
        (Some(store), Some(sources)) => sources.get(store),
        (None, None) => account.get("credentialSource"),
        _ => None,
    });
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
    fix_copies_in(&CopiesFix {
        runtime: &runtime,
        roots: &credential_scan_roots(),
        retried_roots: &default_temp_roots(),
        inventory: inventory.as_ref().map(|inv| &inv.accounts),
        home_dir: home_dir.as_deref(),
        locks,
    })
}

/// What the login copy repair works on, all of it read from the machine by the caller.
struct CopiesFix<'a> {
    runtime: &'a Path,
    roots: &'a [PathBuf],
    retried_roots: &'a [PathBuf],
    /// The provider inventory; `None` when the machine config cannot be read, and then no staging is judged
    /// against a source login.
    inventory: Option<&'a Map<String, Value>>,
    home_dir: Option<&'a str>,
    locks: &'a dyn fgos_execution_engine::credentials::AccountLocks,
}

fn fix_copies_in(fix: &CopiesFix<'_>) -> (bool, String) {
    let now = now_ms();
    let resolve = |provider: &str, account: &str, store: Option<&str>| match fix.inventory {
        Some(inventory) => store_judgement(
            inventory,
            fix.runtime,
            fix.home_dir,
            provider,
            account,
            store,
        ),
        None => StoreJudgement::Unjudged,
    };
    let resolve_store: Option<&ResolveStore<'_>> = fix.inventory.map(|_| &resolve as _);
    let stagings = sweep_interrupted_stagings(&SweepOptions {
        runtime_dir: fix.runtime,
        resolve_store,
        now,
        min_age_ms: STAGING_MIN_AGE_MS,
        locks: fix.locks,
        sqlite: &BundledSqlite,
    });
    let retried: BTreeSet<PathBuf> = fix
        .retried_roots
        .iter()
        .map(|r| canonical_root(r))
        .collect();
    let unretried: Vec<PathBuf> = fix
        .roots
        .iter()
        .filter(|root| !retried.contains(&canonical_root(root)))
        .cloned()
        .collect();
    let settled = settle_held_credential_homes(
        fix.roots,
        &unretried,
        &StageLogin {
            now,
            locks: fix.locks,
        },
    );
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

/// Runs `body` with a fresh owner-only scratch directory, removed afterwards.
fn with_scratch<T>(prefix: &str, body: impl FnOnce(&Path) -> T) -> Result<T, String> {
    let suffix = random_hex().map_err(|error| error.to_string())?;
    let dir = std::env::temp_dir().join(format!("{prefix}{}-{suffix}", std::process::id()));
    make_dir(&dir, false).map_err(|error| error.to_string())?;
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
        let unreadable: Result<Value, DriverError> = Err(DriverError::new(
            fgos_execution_engine::confinement::driver::ErrorKind::Registry,
            "bad",
        ));
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
    fn a_policy_the_machine_declares_is_known_and_an_unreadable_config_fails_policies_and_readiness(
    ) {
        let custom = Ok(json!({
            "confinementPolicies": { "custom-isolated": { "contract": "confinement-policy.v1", "controls": { "hostWrite": "deny", "hostRead": "allow", "networkEgress": "deny", "process": "isolated", "home": "private", "session": "isolated", "workspace": "own" }, "grants": [] } },
            "capabilities": { "code:implement": { "confinement": { "mode": "required", "policy": "custom-isolated" } } },
        }));
        assert_eq!(
            policies_declared(&custom),
            (
                true,
                "all capability confinement policies are declared".into()
            )
        );
        let ready = (true, "bwrap backend status: ready (x)".to_owned());
        assert_eq!(
            strict_readiness(&Err("boom".into()), &ready),
            (false, "runner config not readable: boom".into())
        );
    }

    #[test]
    fn the_registry_fix_skips_a_registry_it_cannot_parse_and_leaves_it_in_place() {
        let dir = temp("registry-corrupt");
        let path = dir.join("confinement-backends.json");
        fs::write(&path, "not json").unwrap();
        let (changed, message) = fix_backend_registry(Ok(path.clone()));
        assert!(!changed, "{message}");
        assert!(
            message.starts_with("skipped -- cannot parse machine backend registry"),
            "{message}"
        );
        assert_eq!(fs::read_to_string(&path).unwrap(), "not json");
        let _ = fs::remove_dir_all(dir);
    }

    #[test]
    fn a_home_owned_by_a_dead_process_is_named_by_the_row_and_removed_only_by_the_fix() {
        use std::os::unix::fs::PermissionsExt;
        let root = temp("orphans-dead");
        fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
        let home = root.join("disp_orphan_1/home");
        fs::create_dir_all(&home).unwrap();
        let dead = fs::read_to_string("/proc/sys/kernel/pid_max")
            .ok()
            .and_then(|text| text.trim().parse::<u32>().ok())
            .unwrap_or(4_194_304)
            + 1;
        fgos_execution_engine::confinement::cleanup::write_ownership_marker(
            &home,
            "disp_orphan_1",
            "private-home",
            dead,
        )
        .unwrap();
        let roots = vec![root.clone()];
        let host = SystemHost::default();
        let (ok, message) = orphans_row(
            &roots,
            &judge_confinement_orphans(&roots, now_millis(), &host),
        );
        assert!(
            !ok && message.contains("1 confinement resource dir(s) owned by a dead process"),
            "{message}"
        );
        assert!(home.exists(), "a check never removes");
        let (changed, message) = fix_orphans(&roots, &host);
        assert!(
            changed && message.contains("removed 1 home(s) left by a dead dispatch"),
            "{message}"
        );
        assert!(!home.exists());
        assert!(
            orphans_row(
                &roots,
                &judge_confinement_orphans(&roots, now_millis(), &host)
            )
            .0
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

    /// The login copy row and its repair over a scratch provider runtime and confinement root: what the row says of
    /// each kind of copy, and what the repair removes, settles or leaves.
    mod copies {
        use super::*;
        use fgos_execution_engine::confinement::cleanup::{
            write_attempt_home_record, write_ownership_marker, write_ownership_marker_v2,
            OWNERSHIP_MARKER_FILE,
        };
        use fgos_host_runtime::civil_time::format_unix_millis_rfc3339;
        use std::time::{Duration, SystemTime};

        const HOUR: f64 = 3_600_000.0;
        const DAY: f64 = 24.0 * HOUR;
        const TOKEN: &str = "FAKE-REFRESH-TOKEN-DO-NOT-PRINT";

        struct W {
            tmp: PathBuf,
            runtime: PathBuf,
            temp_root: PathBuf,
        }

        impl W {
            fn new(label: &str) -> W {
                let tmp = temp(label);
                let w = W {
                    runtime: tmp.join("runtime"),
                    temp_root: tmp.join("fgos-confinement"),
                    tmp,
                };
                fs::create_dir_all(&w.runtime).unwrap();
                fs::create_dir_all(&w.temp_root).unwrap();
                w
            }

            fn account(&self, provider: &str, account: &str) -> PathBuf {
                self.runtime
                    .join("account-locks")
                    .join(provider)
                    .join(account)
            }
        }

        impl Drop for W {
            fn drop(&mut self) {
                let _ = fs::remove_dir_all(&self.tmp);
            }
        }

        fn stamp(at: f64) -> String {
            format!("{:015}", at as i64)
        }

        fn iso(at: f64) -> String {
            format_unix_millis_rfc3339(at as i64, 0).unwrap()
        }

        /// A login copy in `pending/` of the store `sub` of an account (`""` for the account directory itself).
        fn add_pending_in(w: &W, provider: &str, account: &str, sub: &str, staged_at: f64) {
            let mut dir = w.account(provider, account);
            if !sub.is_empty() {
                dir = dir.join(sub);
            }
            let dir = dir
                .join("pending")
                .join(format!("{}-abcd0123", stamp(staged_at)));
            fs::create_dir_all(&dir).unwrap();
            fs::write(
                dir.join("auth.json"),
                json!({ "refresh": TOKEN }).to_string(),
            )
            .unwrap();
        }

        fn add_pending(w: &W, provider: &str, account: &str, staged_at: f64) {
            add_pending_in(w, provider, account, "", staged_at);
        }

        fn patch_marker(dir: &Path, fields: Value) {
            let file = dir.join(OWNERSHIP_MARKER_FILE);
            let mut marker: Value =
                serde_json::from_str(&fs::read_to_string(&file).unwrap()).unwrap();
            marker
                .as_object_mut()
                .unwrap()
                .extend(fields.as_object().unwrap().clone());
            fs::write(file, marker.to_string()).unwrap();
        }

        /// A private home an older release kept in its own marker after `attempts` failed stagings, 50 hours ago.
        fn add_kept_home_under(
            w: &W,
            root: &Path,
            dispatch: &str,
            attempts: u64,
            since: f64,
        ) -> PathBuf {
            let dir = root.join(dispatch).join("home");
            fs::create_dir_all(&dir).unwrap();
            write_ownership_marker(&dir, dispatch, "private-home", std::process::id()).unwrap();
            patch_marker(
                &dir,
                json!({
                    "credentialWriteBack": { "provider": "xai", "accountId": "acct", "home": w.tmp.join("secret-source-home"), "layout": "pi-auth-json", "runtimeDir": w.runtime },
                    "credentialKept": { "attempts": attempts, "since": iso(since) },
                }),
            );
            dir
        }

        fn add_kept_home(w: &W, dispatch: &str, attempts: u64) -> PathBuf {
            add_kept_home_under(
                w,
                &w.temp_root.clone(),
                dispatch,
                attempts,
                now_ms() - 50.0 * HOUR,
            )
        }

        fn aged(path: &Path) {
            let then = SystemTime::now() - Duration::from_secs(3 * 3600);
            fs::File::open(path).unwrap().set_modified(then).unwrap();
        }

        /// A process id above the kernel's limit: no process ever has it.
        fn dead_pid() -> u64 {
            fs::read_to_string("/proc/sys/kernel/pid_max")
                .ok()
                .and_then(|text| text.trim().parse::<u64>().ok())
                .unwrap_or(4_194_304)
                + 1
        }

        fn set_owner_only(dir: &Path) {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(dir, fs::Permissions::from_mode(0o700)).unwrap();
        }

        /// An interrupted staging named after a process that cannot be alive, three hours old.
        fn add_staging(store: &Path, tag: &str, content: Option<&str>) -> PathBuf {
            let target = store
                .join("pending")
                .join(format!(".tmp-{}-{tag}", dead_pid()));
            fs::create_dir_all(&target).unwrap();
            if let Some(content) = content {
                fs::write(target.join("auth.json"), content).unwrap();
                aged(&target.join("auth.json"));
            }
            aged(&target);
            target
        }

        /// The inventory that reads every account directory on disk the way its own layout says: one with
        /// `stores/<cli>` declares those CLIs, any other has one store.
        fn inventory_of_disk(w: &W) -> Map<String, Value> {
            let names = |dir: &Path| -> Vec<String> {
                sub_dirs(dir)
                    .into_iter()
                    .map(|d| d.file_name().unwrap().to_string_lossy().into_owned())
                    .collect()
            };
            let root = w.runtime.join("account-locks");
            let mut inventory = Map::new();
            for provider in names(&root) {
                let mut accounts = Map::new();
                for account in names(&root.join(&provider)) {
                    let clis = names(&root.join(&provider).join(&account).join("stores"));
                    let entry = if clis.is_empty() {
                        json!({ "credentialSource": { "kind": "codex-home", "home": "/x" } })
                    } else {
                        let sources: Map<String, Value> = clis
                            .into_iter()
                            .map(|cli| (cli, json!({ "kind": "codex-home", "home": "/x" })))
                            .collect();
                        json!({ "credentialSources": sources })
                    };
                    accounts.insert(account, entry);
                }
                inventory.insert(provider, json!({ "accounts": accounts }));
            }
            inventory
        }

        fn per_cli() -> Value {
            json!({ "credentialSources": { "codex": { "kind": "codex-home", "home": "/x" }, "pi": { "kind": "home-files", "home": "/y" } } })
        }

        fn single() -> Value {
            json!({ "credentialSource": { "kind": "codex-home", "home": "/x" } })
        }

        fn inventory(provider: &str, account: &str, entry: Value) -> Map<String, Value> {
            json!({ provider: { "accounts": { account: entry } } })
                .as_object()
                .unwrap()
                .clone()
        }

        fn row_with(
            w: &W,
            roots: Vec<PathBuf>,
            now: f64,
            inventory: Result<&Map<String, Value>, &str>,
        ) -> Verdict {
            credential_copies_row(&CopiesFacts {
                runtime_dir: w.runtime.clone(),
                roots,
                retried_roots: vec![w.temp_root.clone()],
                now,
                min_age_ms: RETAINED_COPY_REPORT_AFTER_MS,
                inventory: inventory.map(stores_of).map_err(str::to_owned),
            })
        }

        fn run(w: &W, now: f64) -> Verdict {
            row_with(w, vec![w.temp_root.clone()], now, Ok(&inventory_of_disk(w)))
        }

        fn run_inv(w: &W, inv: &Map<String, Value>, now: f64) -> Verdict {
            row_with(w, vec![w.temp_root.clone()], now, Ok(inv))
        }

        fn unreadable(w: &W, now: f64) -> Verdict {
            row_with(
                w,
                vec![w.temp_root.clone()],
                now,
                Err("global config unreadable (test) at /x"),
            )
        }

        /// The repair under the real account lock of a scratch lock directory, as a doctor run takes it.
        fn fix_in(
            w: &W,
            roots: Vec<PathBuf>,
            inventory: Option<&Map<String, Value>>,
        ) -> (bool, String) {
            let host = AccountsHost::new();
            let accounts = Accounts::new(&w.runtime, w.tmp.join("locks"), &host);
            fix_copies_in(&CopiesFix {
                runtime: &w.runtime,
                roots: &roots,
                retried_roots: std::slice::from_ref(&w.temp_root),
                inventory,
                home_dir: None,
                locks: &AccountsLocks(&accounts),
            })
        }

        #[test]
        fn a_clean_machine_passes() {
            let w = W::new("clean");
            assert!(run(&w, now_ms()).0);
        }

        #[test]
        fn a_pending_copy_a_day_old_is_reported_by_provider_account_and_age_and_a_young_one_is_not()
        {
            let w = W::new("pending-age");
            let now = now_ms();
            add_pending(&w, "xai", "acct", now - 3.0 * DAY);
            add_pending(&w, "xai", "acct", now - 30.0 * DAY);
            add_pending(&w, "codex", "young", now - HOUR);
            let (ok, message) = run(&w, now);
            assert!(ok && message.starts_with("warning: "), "{message}");
            assert!(message.contains("xai/acct: 2 pending login copy(ies) waiting for a renewal (a dispatch for that account applies them), oldest 30d"), "{message}");
            assert!(!message.contains("young"));
        }

        #[test]
        fn a_held_home_fails_with_its_hand_recovery_a_retried_one_is_only_noted_and_the_marker_is_never_repeated(
        ) {
            let w = W::new("held");
            let held = add_kept_home(&w, "disp_held", CREDENTIAL_KEEP_MAX_ATTEMPTS);
            let (ok, message) = run(&w, now_ms());
            assert!(!ok, "{message}");
            assert!(
                message.contains("private home held after repeated staging failures, 2d old, at "),
                "{message}"
            );
            assert!(message.contains(&held.display().to_string()));
            assert!(
                message.contains("Recover by hand: ")
                    && message.contains("protected/confinement-finalization/<launch>.json names")
                    && message.contains("then delete the home")
            );
            for agent_word in [TOKEN, "secret-source-home", "xai/acct"] {
                assert!(!message.contains(agent_word), "{agent_word}");
            }
            fs::remove_dir_all(w.temp_root.join("disp_held")).unwrap();
            add_kept_home(&w, "disp_retry", 1);
            let (ok, message) = run(&w, now_ms());
            assert!(ok && message.starts_with("warning: "), "{message}");
            assert!(message.contains("1 private home(s) kept after a staging failure, retried by the finalize-home step of their attempt, oldest 2d"), "{message}");
        }

        #[test]
        fn the_orphan_count_skips_a_held_home_of_a_dead_process_but_counts_one_only_being_retried()
        {
            let w = W::new("orphan-held");
            let roots = vec![w.temp_root.clone()];
            set_owner_only(&w.temp_root);
            let dead = dead_pid();
            let held = add_kept_home(&w, "disp_held", CREDENTIAL_KEEP_MAX_ATTEMPTS);
            patch_marker(&held, json!({ "pid": dead }));
            let found = judge_confinement_orphans(&roots, now_millis(), &SystemHost::default());
            assert!(
                orphans_row(&roots, &found).0,
                "a held home is reported by its own row, not as an orphan"
            );
            let retrying = add_kept_home(&w, "disp_retry", 1);
            patch_marker(&retrying, json!({ "pid": dead }));
            let found = judge_confinement_orphans(&roots, now_millis(), &SystemHost::default());
            let (ok, message) = orphans_row(&roots, &found);
            assert!(
                !ok && message.contains("1 confinement resource dir(s) owned by a dead process"),
                "{message}"
            );
        }

        #[test]
        fn the_fix_settles_a_held_home_from_its_host_record_and_never_one_without_a_record_or_through_a_link(
        ) {
            let w = W::new("settle");
            let now = now_ms();
            let source = w.tmp.join("secret-source-home");
            fs::create_dir_all(&source).unwrap();
            let login = |refresh: &str, expires: f64| {
                json!({ "xai": { "type": "oauth", "refresh": refresh, "expires": expires as i64 } })
                    .to_string()
            };
            fs::write(
                source.join("auth.json"),
                login("FAKE-REFRESH-OLD", now + HOUR),
            )
            .unwrap();
            let before = fs::read_to_string(source.join("auth.json")).unwrap();
            let renewed = login("FAKE-REFRESH-NEW", now + 12.0 * HOUR);
            let gone = add_kept_home(&w, "disp_gone", CREDENTIAL_KEEP_MAX_ATTEMPTS);
            let unrecorded = add_kept_home(&w, "disp_renewed", CREDENTIAL_KEEP_MAX_ATTEMPTS);
            fs::write(unrecorded.join("auth.json"), &renewed).unwrap();
            let recorded = w.temp_root.join("disp_recorded/home");
            fs::create_dir_all(&recorded).unwrap();
            fs::write(recorded.join("auth.json"), &renewed).unwrap();
            let run_dir = w.tmp.join("run");
            fs::create_dir_all(run_dir.join("protected/confinement-finalization")).unwrap();
            fs::write(
                run_dir.join("protected/confinement-finalization/att-recorded.json"),
                json!({
                    "contract": "confinement-finalization.v1", "launchCommandId": "att-recorded",
                    "resources": [{ "pathRef": recorded, "resourceId": "private-home", "credentialWriteBack": { "provider": "xai", "accountId": "acct", "kind": "home-files", "home": source, "layout": "pi-auth-json", "runtimeDir": w.runtime } }],
                })
                .to_string(),
            )
            .unwrap();
            let kept = json!({ "attempts": CREDENTIAL_KEEP_MAX_ATTEMPTS, "since": iso(now - 50.0 * HOUR), "lastCountedAt": now as i64 });
            write_attempt_home_record(&recorded, &json!({ "attemptId": "att-recorded", "runDir": run_dir, "dispatchId": "disp_recorded", "launchCommandId": "att-recorded", "credentialKept": kept })).unwrap();
            let linked = w.temp_root.join("disp_linked/home");
            fs::create_dir_all(&linked).unwrap();
            fs::write(linked.join("auth.json"), &renewed).unwrap();
            let elsewhere = w.tmp.join("elsewhere/disp_linked/home");
            fs::create_dir_all(&elsewhere).unwrap();
            let planted = write_attempt_home_record(&elsewhere, &json!({ "attemptId": "att-recorded", "runDir": run_dir, "dispatchId": "disp_linked", "launchCommandId": "att-recorded", "credentialKept": kept })).unwrap();
            std::os::unix::fs::symlink(&planted, w.temp_root.join("disp_linked/attempt-home.json"))
                .unwrap();
            assert!(run(&w, now).1.contains("disp_recorded/home. Its host record names where its login goes: \"fgos doctor --fix\""));

            let (changed, message) = fix_in(&w, vec![w.temp_root.clone()], None);
            assert!(changed, "{message}");
            assert!(message.contains("held private home(s): 1 settled, 2 still held (one without a host record is recovered by hand)"), "{message}");
            assert!(
                linked.exists(),
                "a home whose record is a link is not settled"
            );
            assert!(
                !w.temp_root.join("disp_recorded").exists(),
                "the recorded home, its record and its dispatch directory are gone"
            );
            let pending = w.account("xai", "acct").join("pending");
            let staged: Vec<String> = sub_dirs(&pending)
                .iter()
                .map(|dir| fs::read_to_string(dir.join("auth.json")).unwrap())
                .collect();
            assert_eq!(
                staged,
                vec![renewed],
                "its login waits beside the store its record names"
            );
            assert_eq!(
                fs::read_to_string(source.join("auth.json")).unwrap(),
                before,
                "nothing is applied by the fix"
            );
            assert!(gone.exists() && unrecorded.exists());
        }

        #[test]
        fn an_account_over_the_pending_limit_is_reported_even_when_its_copies_are_young() {
            let w = W::new("over-limit");
            let now = now_ms();
            for i in 0..6 {
                add_pending(&w, "xai", "acct", now - f64::from(i) * 1000.0);
            }
            add_pending(&w, "codex", "other", now - 1000.0);
            let (ok, message) = run(&w, now);
            assert!(ok && message.starts_with("warning: "), "{message}");
            assert!(message.contains("xai/acct: 6 pending login copies waiting, over the limit of 5 (the limit drops only copies identical to another"), "{message}");
            assert!(!message.contains("codex/other") && !message.contains(TOKEN));
        }

        fn add_torn(store: &Path, name: &str, content: Option<&str>) {
            let dir = store.join("torn").join(name);
            fs::create_dir_all(&dir).unwrap();
            if let Some(content) = content {
                fs::write(dir.join("auth.json"), content).unwrap();
            }
        }

        #[test]
        fn a_half_written_copy_is_reported_for_hand_recovery_at_any_age() {
            let w = W::new("torn");
            let now = now_ms();
            add_torn(
                &w.account("xai", "acct"),
                &format!("{}-abcd0123", stamp(now - 3.0 * DAY)),
                Some(&format!("{{\"refresh\": \"{TOKEN}")),
            );
            let (ok, message) = run(&w, now);
            assert!(ok, "{message}");
            assert!(message.contains("xai/acct: 1 half-written login copy(ies) kept for hand recovery (never applied or dropped automatically), oldest 3d"), "{message}");
            assert!(!message.contains(TOKEN));
            let young = W::new("torn-young");
            add_torn(
                &young.account("xai", "acct"),
                &format!("{}-abcd0123", stamp(now - 1000.0)),
                Some("{\"refresh\""),
            );
            assert!(run(&young, now)
                .1
                .contains("xai/acct: 1 half-written login copy(ies) kept for hand recovery"));
        }

        #[test]
        fn an_agent_copy_set_aside_after_empty_renewals_has_its_own_wording() {
            let w = W::new("set-aside");
            let now = now_ms();
            add_torn(
                &w.account("xai", "acct"),
                &format!("{}-agent-abcd0123", stamp(now - 1000.0)),
                Some(&json!({ "refresh": TOKEN }).to_string()),
            );
            let message = run(&w, now).1;
            assert!(message.contains("xai/acct: 1 login copy(ies) renewed inside a private home and set aside after renewals that returned nothing"), "{message}");
            assert!(!message.contains("half-written") && !message.contains(TOKEN));
        }

        #[test]
        fn copies_in_a_store_the_layout_no_longer_reads_are_named_for_hand_recovery_at_any_age() {
            let now = now_ms();
            // Left at the account root after the account moved to one store per CLI.
            let w = W::new("stranded-root");
            add_pending(&w, "openai", "acct", now - 3.0 * DAY);
            let (ok, message) = run_inv(&w, &inventory("openai", "acct", per_cli()), now);
            assert!(!ok, "{message}");
            assert!(
                message.contains("openai/acct: 1 login copy(ies) that no dispatch applies"),
                "{message}"
            );
            assert!(message.contains(&format!("at {} ", w.account("openai", "acct").display())));
            assert!(message.contains("recover the login from them by hand"));
            assert!(
                !message.contains("a dispatch for that account applies them")
                    && !message.contains(TOKEN)
            );
            // Under stores/<cli> after the account went back to one store, or of a CLI it no longer declares.
            for (label, entry) in [
                ("stranded-single", single()),
                (
                    "stranded-cli",
                    json!({ "credentialSources": { "codex": { "kind": "codex-home", "home": "/x" } } }),
                ),
            ] {
                let w = W::new(label);
                add_pending_in(&w, "openai", "acct", "stores/pi", now - 3.0 * DAY);
                let (ok, message) = run_inv(&w, &inventory("openai", "acct", entry), now);
                assert!(!ok, "{label}: {message}");
                assert!(
                    message.contains(&format!(
                        "at {} ",
                        w.account("openai", "acct").join("stores/pi").display()
                    )),
                    "{label}: {message}"
                );
                assert!(!message.contains("a dispatch for that account applies them"));
            }
            // An account the inventory no longer lists; a young one fails as well.
            let w = W::new("stranded-gone");
            add_pending(&w, "openai", "gone", now - HOUR);
            let (ok, message) = run_inv(&w, &inventory("openai", "acct", single()), now);
            assert!(
                !ok && message
                    .contains("openai/gone: 1 login copy(ies) that no dispatch applies, oldest 1h"),
                "{message}"
            );
        }

        #[test]
        fn copies_in_a_store_the_inventory_still_reads_keep_the_waiting_wording() {
            let now = now_ms();
            let w = W::new("in-store-cli");
            add_pending_in(&w, "openai", "acct", "stores/pi", now - 3.0 * DAY);
            let (ok, message) = run_inv(&w, &inventory("openai", "acct", per_cli()), now);
            assert!(ok && message.contains("openai/acct: 1 pending login copy(ies) waiting for a renewal (a dispatch for that account applies them)"), "{message}");
            let w = W::new("in-store-single");
            add_pending(&w, "openai", "acct", now - 3.0 * DAY);
            let (ok, message) = run_inv(&w, &inventory("openai", "acct", single()), now);
            assert!(
                ok && message
                    .contains("openai/acct: 1 pending login copy(ies) waiting for a renewal"),
                "{message}"
            );
            assert!(!message.contains("not checked"));
        }

        #[test]
        fn without_a_readable_inventory_the_row_fails_lists_every_copy_and_promises_nothing_of_a_dispatch(
        ) {
            let now = now_ms();
            let w = W::new("unread");
            add_pending_in(&w, "openai", "acct", "stores/pi", now - 3.0 * DAY);
            for i in 0..6 {
                add_pending(&w, "openai", "other", now - f64::from(3 + i) * DAY);
            }
            let (ok, message) = unreadable(&w, now);
            assert!(!ok);
            assert!(
                message.contains(
                    "login store layout not checked: global config unreadable (test) at /x"
                ),
                "{message}"
            );
            assert!(
                !message.contains("a dispatch for that account applies them")
                    && !message.contains("a dispatch for that account re-checks them")
            );
            assert!(message.contains("openai/acct: 1 login copy(ies) kept"));
            assert!(message.contains("openai/other: 6 pending login copies, over the limit"));
            let young = W::new("unread-young");
            add_pending(&young, "openai", "acct", now - 60_000.0);
            let (ok, message) = unreadable(&young, now);
            assert!(
                !ok && message.contains("openai/acct: 1 login copy(ies) kept"),
                "{message}"
            );
            assert!(unreadable(&W::new("unread-empty"), now).0);
        }

        #[test]
        fn an_interrupted_staging_is_reported_and_the_fix_removes_only_one_provably_not_needed() {
            let w = W::new("staging");
            let account = w.account("xai", "acct");
            add_pending(&w, "xai", "acct", now_ms() - 3.0 * HOUR);
            let kept = sub_dirs(&account.join("pending")).remove(0);
            fs::write(kept.join("auth.json"), TOKEN).unwrap();
            let same = add_staging(&account, "same", Some(TOKEN));
            let only = add_staging(&account, "only", Some("ONLY-COPY-BYTES"));
            let message = run(&w, now_ms()).1;
            assert!(
                message.contains("xai/acct: 2 interrupted staging(s)"),
                "{message}"
            );
            assert!(!message.contains(TOKEN) && !message.contains("ONLY-COPY-BYTES"));
            let (changed, message) = fix_in(&w, vec![w.temp_root.clone()], None);
            assert!(
                changed && message.contains("interrupted staging(s): 1 removed, 1 kept"),
                "{message}"
            );
            assert!(!same.exists() && only.exists());
            assert!(run(&w, now_ms())
                .1
                .contains("xai/acct: 1 interrupted staging(s)"));
        }

        #[test]
        fn a_staging_in_a_stranded_store_is_reported_once_for_hand_recovery_and_the_fix_leaves_it()
        {
            let w = W::new("staging-stranded");
            let staging = add_staging(&w.account("openai", "acct"), "stranded", None);
            let inv = inventory("openai", "acct", per_cli());
            let (ok, message) = run_inv(&w, &inv, now_ms());
            assert!(
                !ok && message.contains("openai/acct: 1 login copy(ies) that no dispatch applies"),
                "{message}"
            );
            assert!(!message.contains("interrupted staging"));
            assert_eq!(
                message
                    .split(';')
                    .filter(|row| row.contains("openai/acct"))
                    .count(),
                1
            );
            let (changed, _) = fix_in(&w, vec![w.temp_root.clone()], Some(&inv));
            assert!(!changed && staging.exists());
        }

        #[test]
        fn the_fix_judges_a_staging_against_the_source_login_of_its_store_through_the_inventory() {
            let w = W::new("staging-source");
            let now = now_ms();
            let source = w.tmp.join("source-home");
            fs::create_dir_all(&source).unwrap();
            let doc = |expires: f64, refresh: &str| {
                json!({ "xai": { "type": "oauth", "access": "FAKE-ACCESS", "refresh": refresh, "expires": expires as i64 } }).to_string()
            };
            fs::write(
                source.join("auth.json"),
                doc(now + 6.0 * HOUR, "FAKE-REFRESH-A"),
            )
            .unwrap();
            let account = w.account("xai", "acct");
            let older = add_staging(&account, "older", Some(&doc(now + HOUR, "FAKE-REFRESH-A")));
            let no_source = add_staging(
                &w.account("xai", "other"),
                "older",
                Some(&doc(now + HOUR, "FAKE-REFRESH-A")),
            );
            let newer = add_staging(
                &account,
                "newer",
                Some(&doc(now + 12.0 * HOUR, "FAKE-REFRESH-B")),
            );
            let inv = json!({ "xai": { "accounts": {
                "acct": { "credentialSource": { "kind": "home-files", "home": source, "files": ["auth.json"] } },
                "other": { "credentialSource": { "kind": "home-files", "home": source, "files": ["other.json"] } },
            } } });
            let (_, message) = fix_in(&w, vec![w.temp_root.clone()], inv.as_object());
            assert!(!older.exists(), "{message}");
            assert!(
                newer.exists(),
                "a staging the source cannot show to be no newer stays"
            );
            assert!(
                no_source.exists(),
                "a store with no source login to judge by keeps its staging"
            );
        }

        #[test]
        fn the_fix_never_sweeps_a_stores_constructor_staging_the_row_calls_stranded() {
            let w = W::new("staging-constructor");
            let staging = add_staging(
                &w.account("openai", "acct").join("stores/constructor"),
                "proto",
                Some("ONLY-COPY-BYTES"),
            );
            let inv = inventory("openai", "acct", per_cli());
            assert!(run_inv(&w, &inv, now_ms())
                .1
                .contains("that no dispatch applies"));
            fix_in(&w, vec![w.temp_root.clone()], Some(&inv));
            assert!(staging.exists());
        }

        #[test]
        fn an_interrupted_staging_row_offers_no_source_judgement_without_an_inventory() {
            let w = W::new("staging-unread");
            add_staging(&w.account("xai", "acct"), "x", Some("PART"));
            let message = unreadable(&w, now_ms()).1;
            assert!(message.contains("interrupted staging(s)"), "{message}");
            assert!(message.contains("cannot judge one against the source login of the account until the provider inventory can be read"));
            assert!(!message.contains("shown by the source login of the account to be no newer"));
        }

        #[test]
        fn an_over_limit_store_is_named_by_its_cli_and_a_stranded_one_promises_no_re_check() {
            let w = W::new("over-cli");
            let store = w.account("openai", "acct").join("stores/codex/pending");
            for i in 0..6 {
                fs::create_dir_all(store.join(format!("{:015}-copy", 1000 + i))).unwrap();
            }
            assert!(run(&w, now_ms()).1.contains(
                "openai/acct (store codex): 6 pending login copies waiting, over the limit"
            ));
            let w = W::new("over-stranded");
            let now = now_ms();
            for i in 0..7 {
                add_pending(&w, "openai", "acct", now - f64::from(i + 1) * 1000.0);
            }
            let (ok, message) = run_inv(&w, &inventory("openai", "acct", per_cli()), now);
            assert!(!ok, "{message}");
            assert!(message.contains(&format!("openai/acct: 7 pending login copies at {}, over the limit of 5, in a directory the account's login store layout no longer reads (no dispatch re-checks or drops them", w.account("openai", "acct").display())), "{message}");
            assert!(!message.contains("a dispatch for that account re-checks them"));
        }

        #[test]
        fn a_scratch_home_or_a_half_written_copy_in_a_stranded_directory_names_that_directory() {
            let now = now_ms();
            let w = W::new("scratch-stranded");
            let scratch = w.account("openai", "acct").join("scratch-abcd");
            fs::create_dir_all(&scratch).unwrap();
            fs::write(
                scratch.join("auth.json"),
                json!({ "refresh": TOKEN }).to_string(),
            )
            .unwrap();
            let (ok, message) = run_inv(&w, &inventory("openai", "acct", per_cli()), now);
            assert!(
                !ok && message.contains(&format!("at {} ", w.account("openai", "acct").display())),
                "{message}"
            );
            assert!(!message.contains(TOKEN));
            let w = W::new("torn-stranded");
            add_torn(
                &w.account("openai", "acct"),
                &format!("{}-abcd0123", stamp(now - 1000.0)),
                None,
            );
            let (ok, message) = run_inv(&w, &inventory("openai", "acct", per_cli()), now);
            assert!(!ok && message.contains("openai/acct: 1 half-written login copy(ies) kept for hand recovery, oldest 0h, at "), "{message}");
            assert!(message.contains(&format!("at {} ", w.account("openai", "acct").display())));
        }

        #[test]
        fn an_id_that_names_an_object_built_in_is_not_found_in_the_inventory() {
            let w = W::new("builtin-ids");
            let now = now_ms();
            add_pending(&w, "openai", "constructor", now - 3.0 * DAY);
            add_pending(&w, "toString", "acct", now - 3.0 * DAY);
            let (ok, message) = run_inv(&w, &inventory("openai", "acct", single()), now);
            assert!(!ok);
            assert!(
                message.contains("openai/constructor: 1 login copy(ies) that no dispatch applies"),
                "{message}"
            );
            assert!(
                message.contains("toString/acct: 1 login copy(ies) that no dispatch applies"),
                "{message}"
            );
        }

        #[test]
        fn the_fix_leaves_a_stranded_copy_in_place() {
            let w = W::new("fix-stranded");
            let now = now_ms();
            add_pending(&w, "openai", "acct", now - 3.0 * DAY);
            let inv = inventory("openai", "acct", per_cli());
            fix_in(&w, vec![w.temp_root.clone()], Some(&inv));
            assert_eq!(
                sub_dirs(&w.account("openai", "acct").join("pending")).len(),
                1
            );
            assert!(!run_inv(&w, &inv, now).0);
        }

        #[test]
        fn the_inventory_the_machine_config_gives_names_accounts_by_state_key_and_keeps_declared_stores_waiting(
        ) {
            let w = W::new("machine-inventory");
            let runner = json!({ "llmAccounts": { "openai": { "acct": { "credentialStore": { "codex": "/x" } } } } });
            let inv = provider_account_inventory(&runner, &HostMachine::new(None, None));
            let now = now_ms();
            add_pending(&w, "openai-codex", "acct", now - 3.0 * DAY);
            let (ok, message) = run_inv(&w, &inv, now);
            assert!(
                !ok && message
                    .contains("openai-codex/acct: 1 login copy(ies) that no dispatch applies"),
                "{message}"
            );
            add_pending_in(&w, "openai-codex", "acct", "stores/codex", now - 3.0 * DAY);
            let message = run_inv(&w, &inv, now).1;
            assert!(message.contains("openai-codex/acct: 1 pending login copy(ies) waiting for a renewal (a dispatch for that account applies them)"), "{message}");
            assert!(!message.contains(&format!(
                "{} ",
                w.account("openai-codex", "acct")
                    .join("stores/codex")
                    .display()
            )));
        }

        #[test]
        fn a_kept_home_under_a_root_nothing_retries_is_held_at_once() {
            let w = W::new("scan-only");
            let scan_only = w.tmp.join("scan-only");
            let retried = add_kept_home(&w, "disp_retried", 1);
            let dir = add_kept_home_under(&w, &scan_only, "disp_scan_only", 1, now_ms() - HOUR);
            let (ok, message) = row_with(
                &w,
                vec![w.temp_root.clone(), scan_only],
                now_ms(),
                Ok(&Map::new()),
            );
            assert!(
                !ok && message.contains(&dir.display().to_string()),
                "{message}"
            );
            assert!(message.contains("under a root that nothing retries by itself"));
            assert!(!message.contains(&retried.display().to_string()));
            assert!(message.contains("1 private home(s) kept after a staging failure, retried"));
        }

        #[test]
        fn a_home_reached_through_two_spellings_or_a_link_of_one_root_is_counted_once_and_still_retried(
        ) {
            let w = W::new("spellings");
            add_kept_home(&w, "disp_twice", CREDENTIAL_KEEP_MAX_ATTEMPTS);
            let slash = PathBuf::from(format!("{}/", w.temp_root.display()));
            let message = row_with(
                &w,
                vec![w.temp_root.clone(), slash],
                now_ms(),
                Ok(&Map::new()),
            )
            .1;
            assert_eq!(message.matches("private home held").count(), 1, "{message}");
            let w = W::new("alias");
            add_kept_home(&w, "disp_linked", 1);
            let alias = w.tmp.join("alias-of-confinement-root");
            std::os::unix::fs::symlink(&w.temp_root, &alias).unwrap();
            let (ok, message) = row_with(
                &w,
                vec![w.temp_root.clone(), alias.clone()],
                now_ms(),
                Ok(&Map::new()),
            );
            assert!(ok, "{message}");
            assert_eq!(
                message
                    .matches("private home(s) kept after a staging failure")
                    .count(),
                1
            );
            assert!(!message.contains("under a root that nothing retries by itself"));
            assert!(
                row_with(&w, vec![alias], now_ms(), Ok(&Map::new())).0,
                "reached through the link alone it is still a retried root"
            );
        }

        #[test]
        fn an_attempt_home_whose_run_has_neither_envelope_nor_intent_fails_naming_the_attempt() {
            let w = W::new("unfinalized");
            let run_dir = w.tmp.join("runs/01");
            fs::create_dir_all(&run_dir).unwrap();
            let home = w.temp_root.join("disp_orphan/home");
            fs::create_dir_all(&home).unwrap();
            let run_text = run_dir.to_string_lossy().into_owned();
            write_ownership_marker_v2(
                &home,
                Some("att-orphan"),
                Some(&run_text),
                Some("disp_orphan"),
                "private-home",
            )
            .unwrap();
            fs::write(run_dir.join("attempt-intent.json"), "{}").unwrap();
            assert!(
                run(&w, now_ms()).0,
                "the adopt door finalizes a home whose run still has its intent"
            );
            fs::remove_file(run_dir.join("attempt-intent.json")).unwrap();
            let (ok, message) = run(&w, now_ms());
            assert!(!ok, "{message}");
            assert!(
                message.contains("private home of attempt att-orphan at ")
                    && message.contains("disp_orphan")
                    && message.contains("neither envelope.json nor attempt-intent.json"),
                "{message}"
            );
        }
    }
}
