//! The Git rows of `fgos doctor`, the Node-and-Git floor row, the hooks row and the three Git fixes. Every fact
//! comes from `fgos-git` (`repository_facts`, `incidents`, RepositoryConfig); this file only turns them into the
//! sentences a row says. Rows judge readiness: open incidents are `fgos git status` and `fgos git recover`, which
//! `git-incidents` points to.

use super::{Rows, Run};
use crate::wiring::git_incidents::describe_operation_error as describe;
use fgos_config::event_store::EventStoreConfig;
use fgos_distribution::doctor::{FixResult, RowOutcome, RowResult, Status};
use fgos_git::incidents::{FactError, JournalFacts};
use fgos_git::repository_facts::{inspect_repository, Inspection, RepositoryFacts};
use fgos_git::{granted_fetch_mappings, GitDriver, RepositoryConfig, ResolveRepo};
use serde_json::{json, Value};
use std::cell::OnceCell;
use std::path::{Path, PathBuf};

pub const ROW_IDS: &[&str] = &[
    "node-version-and-git",
    "main-checkout-hook-wired",
    "git-component-compatible",
    "git-repository-config",
    "git-operation-journal",
    "git-incidents",
];
pub const FIX_IDS: &[&str] = &[
    "git-driver-directories",
    "git-wal-dir",
    "git-publication-refspecs",
];

pub const GROUP: Rows = Rows {
    rows: ROW_IDS,
    fixes: FIX_IDS,
    judge: judge_rows,
    fix: run_fixes,
};

/// The group's rows over one run: the repository is inspected once for all of them.
fn judge_rows(root: &Path, ids: &[&str]) -> Vec<RowOutcome> {
    let run = Run::new(root);
    ids.iter()
        .map(|id| RowOutcome::Judged(judge(&run, id).expect("the group asked for its own row")))
        .collect()
}

fn run_fixes(root: &Path, ids: &[&str]) -> Vec<FixResult> {
    let run = Run::new(root);
    ids.iter()
        .map(|id| fix(&run, id).expect("the group asked for its own fix"))
        .collect()
}

const NO_REMOTE_FIX: &str = "git remote add origin <url> && fgos doctor --fix";
const TRANSPORT_REMEDY: &str = "For actions/checkout use persist-credentials: false, remove its repo-local http.<url>.extraheader, and configure a trusted global credential helper or GIT_CONFIG_GLOBAL-level setting. Doctor never moves credentials automatically.";
/// A project's own `.githooks/pre-commit` is fgOS's guard when it carries this name (the guard's own header).
const GUARD_MARKER: &str = "str65-worktree-isolation-enforcement";
/// The contract versions the Git row requires of the components built into this release.
const REQUIRED_CONTRACTS: [(&str, u64); 3] = [("gitPort", 1), ("receipt", 1), ("walRecord", 1)];
const RETENTION_CHAINS: u64 = 64;
const RETENTION_DAYS: f64 = 7.0;

/// What one run knows about the repository: the driver, the remote the project publishes to and its inspection.
pub struct Context {
    driver: GitDriver,
    root: PathBuf,
    remote: String,
    inspection: Inspection,
}

pub type Cache = OnceCell<Result<Context, String>>;

fn describe_fact(error: &FactError) -> String {
    match error {
        FactError::Operation(error) => describe(error),
        FactError::Plain(text) => text.clone(),
    }
}

/// The remote the project publishes to. A refused config file is the rows' failure (every Git fact starts here);
/// a value of the `eventStore` section that breaks its own rules is the Event Store rows' business.
fn project_remote(root: &Path) -> Result<String, String> {
    use fgos_config::event_store::ReadError;
    if let Some(refusal) = super::project_root_refusal(root) {
        return Err(refusal.to_owned());
    }
    match EventStoreConfig::read_project(root, |key| std::env::var(key).ok(), true) {
        Ok(config) => Ok(config.remote),
        Err(ReadError::Invalid(_)) => Ok("origin".to_owned()),
        Err(error) => Err(super::config_read_text(error)),
    }
}

fn build_context(root: &Path, state_root: &Path) -> Result<Context, String> {
    let remote = project_remote(root)?;
    let driver = GitDriver::new(state_root).map_err(|e| describe(&e))?;
    let inspection =
        inspect_repository(&driver, root, root, &remote).map_err(|e| describe_fact(&e))?;
    Ok(Context {
        driver,
        root: root.to_path_buf(),
        remote,
        inspection,
    })
}

impl Run<'_> {
    /// The run's one inspection of the repository; a failure is remembered with its message.
    pub fn git(&self) -> Result<&Context, &str> {
        self.git
            .get_or_init(|| build_context(self.root, &self.state_root))
            .as_ref()
            .map_err(String::as_str)
    }
}

fn result(passed: bool, message: impl Into<String>, detail: Option<Value>) -> RowResult {
    RowResult {
        passed,
        status: None,
        message: Some(message.into()),
        fix_command: None,
        detail,
    }
}

/// A row is its problems joined into one sentence, or its passing text; the facts it judged go under detail.
fn row(problems: Vec<Option<String>>, ok: String, detail: Value) -> RowResult {
    let found: Vec<String> = problems.into_iter().flatten().collect();
    if found.is_empty() {
        result(true, ok, Some(detail))
    } else {
        result(false, found.join("; "), Some(detail))
    }
}

fn when(condition: bool, message: impl FnOnce() -> String) -> Option<String> {
    condition.then(message)
}

/// Whether the contract versions of the components in this release are the ones the row requires.
fn contracts_compatible(contracts: &Value) -> bool {
    REQUIRED_CONTRACTS
        .iter()
        .all(|(key, version)| contracts[key] == json!(version))
}

fn component_compatible(facts: &Inspection) -> RowResult {
    let floor = match facts {
        Inspection::NotARepository { floor } => floor,
        Inspection::Repository(found) => &found.floor,
    };
    let contracts = fgos_git::contract_versions();
    let detail = json!({
        "versions": {"git": fgos_git::VERSION, "contracts": contracts},
        "floor": floor,
    });
    let ok = match facts {
        Inspection::NotARepository { .. } => {
            "the Git addon, its contracts and the Git feature floor are compatible".to_owned()
        }
        Inspection::Repository(found) => {
            format!(
                "info: {}: {}; {}",
                found.common_dir, found.layout, found.durability
            )
        }
    };
    row(
        vec![when(
            !(contracts_compatible(&contracts) && floor.supported),
            || {
                "the Git addon, its contract versions or the Git feature floor do not match this release; upgrade the active release or its Git binary".to_owned()
            },
        )],
        ok,
        detail,
    )
}

fn repository(context: &Context) -> Option<&RepositoryFacts> {
    match &context.inspection {
        Inspection::Repository(found) => Some(found),
        Inspection::NotARepository { .. } => None,
    }
}

/// Whether `origin` carries an obsolete legacy fetch mapping, asked about `origin` itself; a configured remote that is
/// `origin` is the facts' own answer and not asked twice.
fn origin_obsolete(context: &Context) -> Result<bool, String> {
    if context.remote == "origin" {
        return Ok(false);
    }
    match inspect_repository(&context.driver, &context.root, &context.root, "origin")
        .map_err(|e| describe_fact(&e))?
    {
        Inspection::Repository(origin) => Ok(origin.obsolete_fetch_mapping),
        Inspection::NotARepository { .. } => Ok(false),
    }
}

/// What is wrong with the Event Store's Git mappings: an unsafe publication refspec, a missing mapping provenance,
/// a remote that moved since setup. Facts that cannot be read are the Event Store rows' own failure.
fn event_store_mapping_problems(run: &Run) -> Vec<String> {
    let Ok(context) = run.event_store() else {
        return Vec::new();
    };
    let facts = context.facts();
    let strings = |key: &str| -> Vec<&str> {
        facts[key]
            .as_array()
            .map(|all| all.iter().filter_map(Value::as_str).collect())
            .unwrap_or_default()
    };
    let overlaps = |refspec: &str, namespaces: &[&str]| -> bool {
        if refspec.starts_with('^') {
            return false;
        }
        let source = refspec
            .trim_start_matches('+')
            .split(':')
            .next()
            .unwrap_or_default();
        namespaces.iter().any(|namespace| match source.find('*') {
            None => source == *namespace || source.starts_with(&format!("{namespace}/")),
            Some(star) => {
                let prefix = &source[..star];
                namespace.starts_with(prefix) || prefix.starts_with(&format!("{namespace}/"))
            }
        })
    };
    if strings("pushRefspecs")
        .iter()
        .any(|r| overlaps(r, &["refs/fgos"]))
        || strings("fetchRefspecs")
            .iter()
            .any(|r| overlaps(r, &["refs/fgos/local-events", "refs/fgos/branch-events"]))
    {
        return vec![
            "unsafe publication refspec: push mappings or local/branch namespace fetch".into(),
        ];
    }
    if !context.remote_configured() {
        return Vec::new();
    }
    let provenance = &facts["provenance"];
    let provenance_refspecs: Vec<&str> = provenance["refspecs"]
        .as_array()
        .map(|all| all.iter().filter_map(Value::as_str).collect())
        .unwrap_or_default();
    if provenance.is_null()
        || strings("expectedFetchRefspecs")
            .iter()
            .any(|r| !provenance_refspecs.contains(r))
    {
        return vec![
            "event-store-refspec-missing: the mirror fetch mappings are not recorded for this remote: the recorded mappings are missing or differ from the wanted set".into(),
        ];
    }
    if provenance["url"] != facts["remoteFact"]["url"] {
        return vec!["event-store-remote-changed: the fetch mapping provenance records another remote URL than the remote has now".into()];
    }
    Vec::new()
}

fn repository_config(run: &Run, context: &Context, facts: &RepositoryFacts) -> RowResult {
    let keys = &facts.untrusted_transport_config;
    let obsolete =
        match origin_obsolete(context).map(|origin| facts.obsolete_fetch_mapping || origin) {
            Ok(obsolete) => obsolete,
            Err(message) => return result(false, message, None),
        };
    let has_remote = run
        .event_store()
        .map_or(true, |event_store| event_store.remote_configured());
    let missing_mapping = has_remote
        && granted_fetch_mappings(&context.remote)
            .map(|wanted| wanted.iter().any(|w| !facts.fetch_refspecs.contains(w)))
            .unwrap_or(true);
    let mut problems = vec![
        when(!keys.is_empty(), || {
            format!(
                "repository-transport-config-untrusted: {}; Publication/Remote transfers refuse these settings. {TRANSPORT_REMEDY}",
                keys.join(", ")
            )
        }),
        when(missing_mapping, || {
            "the required fetch mapping is missing; run fgos doctor --fix (git-publication-refspecs)".to_owned()
        }),
        when(obsolete, || {
            "obsolete exact legacy mapping breaks plain fetch when the remote has no refs/fgos/legacy; run fgos doctor --fix (git-publication-refspecs)".to_owned()
        }),
        when(!facts.reserved_legacy_refs.is_empty(), || {
            format!(
                "reserved legacy mirror refs detected: {}; inspect and remove the foreign refs at their source and these mirrors",
                facts.reserved_legacy_refs.join(", ")
            )
        }),
    ];
    problems.extend(event_store_mapping_problems(run).into_iter().map(Some));
    let judged = row(
        problems,
        "repository transport settings and fetch mappings are as fgOS expects".to_owned(),
        json!({"fetchRefspecs": facts.fetch_refspecs, "untrustedTransportConfig": keys, "reservedLegacyRefs": facts.reserved_legacy_refs}),
    );
    // Nothing to fetch from: the mappings are installed once a remote exists, so a local-only project is not red for it.
    if has_remote || !judged.passed {
        return judged;
    }
    RowResult {
        status: Some(Status::Skip),
        fix_command: Some(NO_REMOTE_FIX.to_owned()),
        message: Some(format!(
            "no Git remote \"{}\" configured, so there is no fetch mapping to install; add one when the project has a remote",
            context.remote
        )),
        ..judged
    }
}

fn operation_journal(facts: &RepositoryFacts) -> RowResult {
    let journal = &facts.journal;
    let fence_missing = journal.initialized && !facts.activation_fence;
    // Without the fence no `fgos` fix can help: opening a missing WAL needs it, and a WAL that exists refuses every
    // write without it. Only an activation places it, so the row's command is `fgctl upgrade` for a project that has a
    // WAL (it was activated once) and `fgctl init` for one that has none.
    let activation_command = (!facts.activation_fence).then_some(if journal.initialized {
        "fgctl upgrade"
    } else {
        "fgctl init"
    });
    // Every WAL-writing door refuses without the controller's activation fence, so a WAL without it is a hard stop.
    let mut verdict = row(
        vec![
            when(fence_missing, || {
                "git-fence-missing: the Git WAL exists but the controller activation fence does not, so every Git write refuses; run `fgctl upgrade` for the active release (it places the fence)".to_owned()
            }),
            when(!journal.initialized, || {
                if facts.activation_fence {
                    "the Git WAL is not initialized; run `fgos doctor --fix` (git-wal-dir)"
                        .to_owned()
                } else {
                    // The fix opens the WAL, and opening it needs the fence: only an activation places it.
                    "the Git WAL is not initialized and the controller activation fence is missing, so `fgos doctor --fix` cannot create it; run `fgctl init` (or `fgctl upgrade`) in this project to place the fence".to_owned()
                }
            }),
            when(journal.initialized && !journal.complete, || {
                "the Git WAL listing is incomplete; inspect it with `fgos git status`".to_owned()
            }),
            when(!journal.errors.is_empty(), || {
                format!(
                    "{} Git WAL error(s); inspect them with `fgos git status`",
                    journal.errors.len()
                )
            }),
        ],
        "the Git WAL is readable".to_owned(),
        json!({"journal": journal}),
    );
    if let Some(command) = activation_command {
        verdict.fix_command = Some(command.to_owned());
    }
    verdict
}

/// The journal row's retention sentence: pure, so the row's thresholds are testable without a repository.
/// Finished chains no door compacts yet stay on disk: their count and oldest age show one kind growing unbounded.
fn retention_note(journal: &JournalFacts, now_ms: u64) -> Option<String> {
    let chains = journal.retained_chains as u64;
    let days = journal
        .oldest_retained_at_ms
        .map(|at| now_ms.saturating_sub(at) as f64 / 86_400_000.0);
    let kib = journal.retained_bytes.div_ceil(1024);
    let age = days.map_or_else(|| "age unknown".to_owned(), |d| format!("{d:.1} days"));
    let facts = format!("{chains} finished Git operation(s) retained ({kib} KiB, oldest {age})");
    if journal.ledger_capacity_warning {
        return Some("warning: the Git WAL id ledger is at capacity (ids are never deleted); report this row".to_owned());
    }
    if chains == 0 {
        return None;
    }
    Some(
        if chains > RETENTION_CHAINS || days.is_some_and(|d| d > RETENTION_DAYS) {
            format!("warning: {facts}, past {RETENTION_CHAINS} operations or {} days; Worktree and Refs chains are not compacted yet, so report this row to schedule it", RETENTION_DAYS as u64)
        } else {
            format!("info: {facts}")
        },
    )
}

/// The commit a merge in the checkout stopped at, or none when no merge is in progress or it cannot be read.
fn merge_head(context: &Context) -> Option<String> {
    let ResolveRepo::Repository(repo) = context
        .driver
        .resolve_repo(&context.root, &context.root)
        .ok()?
    else {
        return None;
    };
    context
        .driver
        .resolve_commit_ref(&repo, "MERGE_HEAD")
        .ok()
        .flatten()
        .map(|oid| oid.as_str().to_owned())
}

fn incidents(context: &Context, facts: &RepositoryFacts, now_ms: u64) -> RowResult {
    incidents_of(
        &facts.journal,
        &facts.native_locks,
        merge_head(context).as_deref(),
        now_ms,
    )
}

/// The git-incidents pointer over what it reads: the journal, the native locks and the merge head. Pure; it never fails.
fn incidents_of(
    journal: &JournalFacts,
    native_locks: &[String],
    merge: Option<&str>,
    now_ms: u64,
) -> RowResult {
    let note = retention_note(journal, now_ms);
    let mut open = Vec::new();
    if journal.pending_count > 0 {
        open.push(format!(
            "{} pending Git operation(s)",
            journal.pending_count
        ));
    }
    if !native_locks.is_empty() {
        open.push(format!("{} native lock(s)", native_locks.len()));
    }
    if merge.is_some() {
        open.push("a merge in progress".to_owned());
    }
    let retention = note
        .filter(|note| note.starts_with("warning:"))
        .map_or_else(String::new, |note| format!("; {note}"));
    let message = if open.is_empty() {
        format!("no pending Git operation, native lock or merge in progress; worktree and retained-Land findings: `fgos git status`{retention}")
    } else {
        format!(
            "warning: {}; run `fgos git status` (`fgos git recover` settles interrupted operations){retention}",
            open.join(", ")
        )
    };
    result(
        true,
        message,
        Some(
            json!({"pendingCount": journal.pending_count, "nativeLocks": native_locks.len(), "mergeInProgress": merge}),
        ),
    )
}

/// The Git floor: the Git binary the driver runs is there and meets the floor. The Node half of the row is judged
/// by the owner that composes the report, from the version the bridge's Node reports (`NativeOwner::judge_rows`):
/// this module starts no Node process.
fn node_and_git(run: &Run) -> RowResult {
    let floor = match run.git() {
        Ok(context) => match &context.inspection {
            Inspection::NotARepository { floor } => floor,
            Inspection::Repository(found) => &found.floor,
        },
        Err(message) => return result(false, format!("git not available: {message}"), None),
    };
    if floor.version.is_empty() {
        return result(
            false,
            "git not available: fgos-git found no Git binary",
            None,
        );
    }
    result(true, "git available", None)
}

/// The row of `main-checkout-hook-wired`: it applies only to a project whose `.githooks/pre-commit` is fgOS's own
/// guard; any other project's hooks directory is its own business and never fails here.
fn hook_wired(run: &Run) -> RowResult {
    let owned = run.root.join(".githooks");
    if !owned.exists() {
        return result(
            true,
            "not applicable -- this project ships no .githooks/ directory",
            None,
        );
    }
    let ships_guard = std::fs::read_to_string(owned.join("pre-commit"))
        .is_ok_and(|text| text.contains(GUARD_MARKER));
    if !ships_guard {
        return result(
            true,
            "not applicable -- this project's .githooks/pre-commit is not fgOS's guard",
            None,
        );
    }
    let wired = run.git().ok().is_some_and(|context| {
        let Ok(ResolveRepo::Repository(repo)) =
            context.driver.resolve_repo(&context.root, &context.root)
        else {
            return false;
        };
        let owned = repo.trusted_main_root().join(".githooks");
        context
            .driver
            .inspect_hooks(&repo, &owned)
            .is_ok_and(|report| report.wired)
    });
    if wired {
        result(true, "core.hooksPath = .githooks — the hook checks the main-checkout kernel lock on every commit here (a fgOS child borrows it through its description)", None)
    } else {
        result(false, "core.hooksPath not wired to .githooks — commits here are NOT guarded against concurrent-writer clobbering (str65) — run npm run setup:hooks", None)
    }
}

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |elapsed| elapsed.as_millis() as u64)
}

/// Judges `id` when it is a Git row.
pub fn judge(run: &Run, id: &str) -> Option<RowResult> {
    if !ROW_IDS.contains(&id) {
        return None;
    }
    match id {
        "node-version-and-git" => return Some(node_and_git(run)),
        "main-checkout-hook-wired" => return Some(hook_wired(run)),
        _ => {}
    }
    let context = match run.git() {
        Ok(context) => context,
        Err(message) => return Some(unreadable(id, message)),
    };
    let Some(facts) = repository(context) else {
        return Some(if id == "git-component-compatible" {
            component_compatible(&context.inspection)
        } else {
            result(true, "info: not a Git repository", None)
        });
    };
    Some(match id {
        "git-component-compatible" => component_compatible(&context.inspection),
        "git-repository-config" => repository_config(run, context, facts),
        "git-operation-journal" => operation_journal(facts),
        _ => incidents(context, facts, now_ms()),
    })
}

/// A Git row whose facts could not be read; an untrusted credential helper names its remedy.
fn unreadable(id: &str, message: &str) -> RowResult {
    if id == "git-repository-config"
        && message.contains("repository-config-untrusted: credential.helper")
    {
        return result(false, format!("{message}; {TRANSPORT_REMEDY}"), None);
    }
    // The incidents row is a pointer and never fails: facts it cannot read are a warning.
    if id == "git-incidents" {
        return result(true, format!("warning: {message}"), None);
    }
    result(false, message, None)
}

const NOT_A_REPOSITORY: &str = "not a Git repository";

/// A fix that refused is a warning, never a failure of the doctor.
fn refused(error: &str) -> (bool, String) {
    (false, format!("warning: Git setup refused: {error}"))
}

fn driver_directories(state_root: &Path) -> (bool, String) {
    // No config read here: the door refuses while these directories are unsafe, and this is what makes them safe.
    match GitDriver::prepare_directories(state_root) {
        Ok(changed) => (
            changed,
            "fgOS Git driver directories are current-user-owned and safely permissioned".to_owned(),
        ),
        Err(error) => refused(&describe(&error)),
    }
}

/// The repository as a fix found it, or none when there is nothing to fix.
fn read_before(run: &Run) -> Result<Option<Context>, String> {
    let context = build_context(run.root, &run.state_root)?;
    Ok(repository(&context).is_some().then_some(context))
}

fn initialize_wal(run: &Run) -> Result<(bool, String), String> {
    let Some(context) = read_before(run)? else {
        return Ok((false, NOT_A_REPOSITORY.to_owned()));
    };
    let facts = repository(&context).expect("read_before keeps a repository");
    let initialized_before = facts.journal.initialized;
    if !crate::wiring::git_incidents::open_wal(&context.driver, &context.root)
        .map_err(|error| error.to_string())?
    {
        return Ok((false, NOT_A_REPOSITORY.to_owned()));
    }
    Ok((
        !initialized_before,
        "Git WAL initialized and trusted".to_owned(),
    ))
}

fn operation_id() -> String {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |elapsed| elapsed.as_nanos());
    format!("doctor-{nanos:x}-{:x}", std::process::id())
}

fn install_fetch_mapping(run: &Run) -> Result<(bool, String), String> {
    let Some(context) = read_before(run)? else {
        return Ok((false, NOT_A_REPOSITORY.to_owned()));
    };
    let facts = repository(&context).expect("read_before keeps a repository");
    let remote = &context.remote;
    let has_remote = build_event_store_remote(run);
    let mut repairs: Vec<&str> = Vec::new();
    let mapped = granted_fetch_mappings(remote)
        .map_err(|e| describe(&e))?
        .iter()
        .all(|wanted| facts.fetch_refspecs.contains(wanted));
    if has_remote && (!mapped || facts.obsolete_fetch_mapping) {
        repairs.push(remote);
    }
    if origin_obsolete(&context)? {
        repairs.push("origin");
    }
    let ResolveRepo::Repository(repo) = context
        .driver
        .resolve_repo(&context.root, &context.root)
        .map_err(|e| describe(&e))?
    else {
        return Ok((false, NOT_A_REPOSITORY.to_owned()));
    };
    for target in &repairs {
        let mappings = granted_fetch_mappings(target).map_err(|e| describe(&e))?;
        context
            .driver
            .ensure_fetch_mapping(&repo, target, &mappings, &operation_id())
            .map_err(|e| describe(&e))?;
    }
    let message = if !repairs.is_empty() {
        format!(
            "installed fgOS fetch mappings and repaired obsolete legacy mapping: {}",
            repairs.join(", ")
        )
    } else if has_remote {
        "no fetch mapping change needed".to_owned()
    } else {
        format!("no Git remote \"{remote}\" configured, so there is no fetch mapping to install")
    };
    Ok((!repairs.is_empty(), message))
}

/// Whether the configured remote exists; facts that cannot be read count as configured, so the rows keep judging.
fn build_event_store_remote(run: &Run) -> bool {
    run.event_store()
        .map_or(true, |context| context.remote_configured())
}

/// Runs `id` when it is a Git fix. Each repair first makes the driver directories safe.
pub fn fix(run: &Run, id: &str) -> Option<FixResult> {
    if !FIX_IDS.contains(&id) {
        return None;
    }
    let (prepared_changed, prepared_message) = driver_directories(&run.state_root);
    if id == "git-driver-directories" {
        return Some(FixResult::done(id, prepared_changed, prepared_message));
    }
    let repair = if id == "git-wal-dir" {
        initialize_wal(run)
    } else {
        install_fetch_mapping(run)
    };
    let (changed, message) = repair.unwrap_or_else(|error| refused(&error));
    Some(FixResult::done(id, prepared_changed || changed, message))
}

#[cfg(test)]
mod tests {
    use super::*;
    use fgos_git::OperationError;

    fn journal(
        chains: usize,
        bytes: u64,
        oldest: Option<u64>,
        ledger_warning: bool,
    ) -> JournalFacts {
        JournalFacts {
            initialized: true,
            complete: true,
            pending_count: 0,
            retained_bytes: bytes,
            retained_chains: chains,
            oldest_retained_at_ms: oldest,
            ledger_entries: 0,
            ledger_capacity_warning: ledger_warning,
            ledger_bytes: None,
            oldest_unresolved: None,
            errors: Vec::new(),
        }
    }

    const DAY: u64 = 86_400_000;

    #[test]
    fn the_retention_sentence_warns_when_finished_operations_keep_piling_up_and_only_informs_below_the_line(
    ) {
        let now = 100 * DAY;
        assert_eq!(retention_note(&journal(0, 0, None, false), now), None);
        assert_eq!(
            retention_note(&journal(3, 2048, Some(now - DAY), false), now).unwrap(),
            "info: 3 finished Git operation(s) retained (2 KiB, oldest 1.0 days)"
        );
        let many = retention_note(&journal(65, 1, Some(now), false), now).unwrap();
        assert!(
            many.starts_with("warning: 65 finished Git operation(s) retained"),
            "{many}"
        );
        let old = retention_note(&journal(1, 1, Some(now - 8 * DAY), false), now).unwrap();
        assert!(
            old.starts_with("warning: ") && old.contains("past 64 operations or 7 days"),
            "{old}"
        );
        assert!(retention_note(&journal(1, 1, None, true), now)
            .unwrap()
            .contains("ledger is at capacity"));
        assert!(retention_note(&journal(2, 1, None, false), now)
            .unwrap()
            .contains("age unknown"));
    }

    #[test]
    fn the_contract_versions_must_equal_the_ones_the_row_requires() {
        let good = fgos_git::contract_versions();
        assert!(contracts_compatible(&good));
        assert!(!contracts_compatible(
            &json!({"gitPort": 2, "receipt": 1, "walRecord": 1})
        ));
        assert!(!contracts_compatible(&json!({"gitPort": 1, "receipt": 1})));
    }

    #[test]
    fn a_git_error_reads_as_its_cause_plus_the_decoded_stderr_text() {
        let mut error = OperationError {
            code: fgos_git::ResultCode::Failed,
            cause: "cause".into(),
            retryable: false,
            operation_id: None,
            receipt: None,
            exit_code: None,
            signal: None,
            stderr: Vec::new(),
            detail: None,
        };
        assert_eq!(describe(&error), "cause");
        error.stderr = b"fatal: nope\n".to_vec();
        assert_eq!(describe(&error), "cause: fatal: nope");
    }

    #[test]
    fn the_incidents_pointer_never_fails_even_when_its_facts_cannot_be_read() {
        let row = unreadable("git-incidents", "git-spawn-failed");
        assert!(row.passed);
        assert_eq!(row.message.as_deref(), Some("warning: git-spawn-failed"));
    }

    #[test]
    fn an_untrusted_credential_helper_names_its_remedy_and_other_failures_do_not() {
        let named = unreadable(
            "git-repository-config",
            "x repository-config-untrusted: credential.helper y",
        );
        assert!(named.message.unwrap().ends_with(TRANSPORT_REMEDY));
        let other = unreadable("git-repository-config", "plain");
        assert_eq!(other.message.as_deref(), Some("plain"));
        assert!(!other.passed);
    }

    use crate::wiring::doctor::testkit::Fixture;

    fn row_of(f: &Fixture, id: &str) -> RowResult {
        judge(&f.run(), id).unwrap()
    }

    fn message(row: &RowResult) -> String {
        row.message.clone().unwrap_or_default()
    }

    fn fixed(f: &Fixture, id: &str) -> FixResult {
        fix(&f.run(), id).unwrap()
    }

    // The Git door keeps its operation journal on Linux only; elsewhere it refuses by name.
    #[cfg(target_os = "linux")]
    #[test]
    fn the_journal_row_fails_with_git_fence_missing_when_a_git_wal_has_lost_the_controller_activation_fence(
    ) {
        let f = Fixture::new("fence");
        assert_eq!(fixed(&f, "git-wal-dir").changed, Some(true));
        assert!(row_of(&f, "git-operation-journal").passed);
        std::fs::remove_dir_all(f.repo.join(".fgos/locks/activation.lock")).unwrap();
        let row = row_of(&f, "git-operation-journal");
        assert!(!row.passed);
        let text = message(&row);
        assert!(
            text.starts_with("git-fence-missing: ") && text.contains("fgctl upgrade"),
            "{text}"
        );
        // A failing row's fix command is the report's `fix` and one entry of `next` (the engine owns that rule).
        assert_eq!(row.level().as_str(), "fail");
        assert_eq!(row.fix_command.as_deref(), Some("fgctl upgrade"));
    }

    // The Git door's repository driver is Unix only; elsewhere it refuses by name.
    #[cfg(unix)]
    #[test]
    fn without_the_activation_fence_the_missing_wal_row_names_fgctl_and_not_a_fix_that_cannot_run()
    {
        let f = Fixture::new("nowal-nofence");
        std::fs::remove_dir_all(f.repo.join(".fgos/locks/activation.lock")).unwrap();
        let row = row_of(&f, "git-operation-journal");
        assert!(!row.passed);
        let text = message(&row);
        assert!(
            text.contains("fgctl init") && !text.contains("git-wal-dir"),
            "{text}"
        );
        assert_eq!(row.level().as_str(), "fail");
        assert_eq!(row.fix_command.as_deref(), Some("fgctl init"));
    }

    // The Git door's repository driver is Unix only; elsewhere it refuses by name.
    #[cfg(unix)]
    #[test]
    fn the_journal_row_fails_and_names_the_fix_while_no_git_wal_exists() {
        let f = Fixture::new("nowal");
        let row = row_of(&f, "git-operation-journal");
        assert!(!row.passed);
        let text = message(&row);
        assert!(
            text.contains("not initialized")
                && text.contains("fgos doctor --fix")
                && text.contains("git-wal-dir"),
            "{text}"
        );
        assert_eq!(row.detail.unwrap()["journal"]["initialized"], json!(false));
    }

    // The Git door keeps its operation journal on Linux only; elsewhere it refuses by name.
    #[cfg(target_os = "linux")]
    #[test]
    fn the_wal_fix_initializes_once_and_reports_nothing_changed_the_second_time() {
        let f = Fixture::new("walfix");
        assert_eq!(fixed(&f, "git-wal-dir").changed, Some(true));
        let again = fixed(&f, "git-wal-dir");
        assert_eq!(again.changed, Some(false));
        assert_eq!(
            again.message.as_deref(),
            Some("Git WAL initialized and trusted")
        );
        assert!(row_of(&f, "git-operation-journal").passed);
    }

    #[cfg(all(unix, not(target_os = "linux")))]
    #[test]
    fn without_a_git_journal_on_this_platform_the_wal_fix_refuses_by_name_once_the_directories_exist(
    ) {
        let f = Fixture::new("walfix-refused");
        fixed(&f, "git-wal-dir");
        let again = fixed(&f, "git-wal-dir");
        assert_eq!(again.changed, Some(false));
        assert_eq!(
            again.message.as_deref(),
            Some("warning: Git setup refused: git-wal-unsupported")
        );
    }

    #[cfg(not(unix))]
    #[test]
    fn without_a_git_driver_on_this_platform_the_rows_that_read_it_fail_naming_the_platform() {
        let f = Fixture::new("driver-refused");
        let row = row_of(&f, "git-component-compatible");
        assert!(!row.passed);
        assert!(
            message(&row).contains("config-platform-unsupported"),
            "{}",
            message(&row)
        );
    }

    #[test]
    fn the_driver_directories_fix_is_current_after_the_first_call() {
        let f = Fixture::new("dirs");
        fixed(&f, "git-driver-directories");
        let again = fixed(&f, "git-driver-directories");
        assert_eq!(again.changed, Some(false));
        assert!(again
            .message
            .unwrap()
            .starts_with("fgOS Git driver directories"));
    }

    // The Git door's repository driver is Unix only; elsewhere it refuses by name.
    #[cfg(unix)]
    #[test]
    fn the_repository_rows_report_information_not_a_failure_outside_a_git_repository() {
        let f = Fixture::plain("norepo");
        for id in [
            "git-repository-config",
            "git-operation-journal",
            "git-incidents",
        ] {
            let row = row_of(&f, id);
            assert!(row.passed, "{id}");
            assert_eq!(message(&row), "info: not a Git repository", "{id}");
            assert!(row.detail.is_none() && row.status.is_none());
        }
        let compat = row_of(&f, "git-component-compatible");
        assert!(compat.passed);
        assert_eq!(
            message(&compat),
            "the Git addon, its contracts and the Git feature floor are compatible"
        );
    }

    #[test]
    fn pending_git_operations_make_the_incidents_pointer_warn_and_name_the_recover_command() {
        let mut pending = journal(0, 0, None, false);
        pending.pending_count = 1;
        let row = incidents_of(&pending, &[], None, 0);
        assert!(row.passed);
        assert_eq!(
            message(&row),
            "warning: 1 pending Git operation(s); run `fgos git status` (`fgos git recover` settles interrupted operations)"
        );
        assert_eq!(
            row.detail.unwrap(),
            json!({"pendingCount": 1, "nativeLocks": 0, "mergeInProgress": null})
        );
    }

    #[cfg(unix)]
    #[test]
    fn the_incidents_row_never_fails_it_counts_native_locks_and_a_merge_in_progress_and_points_to_fgos_git_status(
    ) {
        let f = Fixture::new("incidents");
        f.git(&["commit", "-q", "--allow-empty", "-m", "seed"]);
        let clean = row_of(&f, "git-incidents");
        assert!(clean.passed);
        let text = message(&clean);
        assert!(
            text.starts_with("no pending Git operation, native lock or merge in progress; ")
                && text.ends_with("`fgos git status`"),
            "{text}"
        );
        std::fs::write(f.repo.join(".git/index.lock"), "").unwrap();
        let head = f.git(&["rev-parse", "HEAD"]);
        std::fs::write(f.repo.join(".git/MERGE_HEAD"), format!("{head}\n")).unwrap();
        let open = row_of(&f, "git-incidents");
        assert!(open.passed);
        assert_eq!(
            message(&open),
            "warning: 1 native lock(s), a merge in progress; run `fgos git status` (`fgos git recover` settles interrupted operations)"
        );
        assert_eq!(
            open.detail.unwrap(),
            json!({"pendingCount": 0, "nativeLocks": 1, "mergeInProgress": head})
        );
    }

    // The Git door keeps its operation journal on Linux only; elsewhere it refuses by name.
    #[cfg(target_os = "linux")]
    #[test]
    fn the_repository_config_row_skips_naming_the_command_that_adds_a_remote_while_there_is_no_remote(
    ) {
        let f = Fixture::new("noremote");
        let row = row_of(&f, "git-repository-config");
        assert!(row.passed, "{}", message(&row));
        assert_eq!(row.status, Some(Status::Skip));
        assert_eq!(
            row.fix_command.as_deref(),
            Some("git remote add origin <url> && fgos doctor --fix")
        );
        assert!(message(&row).contains("no Git remote \"origin\""));
    }

    // The Git door keeps its operation journal on Linux only; elsewhere it refuses by name.
    #[cfg(target_os = "linux")]
    #[test]
    fn the_fetch_mapping_fix_has_nothing_to_repair_and_says_so_without_a_failure_while_there_is_no_remote(
    ) {
        let f = Fixture::new("noremotefix");
        let outcome = fixed(&f, "git-publication-refspecs");
        let text = outcome.message.unwrap();
        assert!(
            !text.contains("warning") && !text.contains("refused"),
            "{text}"
        );
        assert!(text.contains("no Git remote \"origin\""), "{text}");
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn the_repository_config_row_fails_a_missing_fetch_mapping_an_unsafe_refspec_and_a_remote_that_moved_since_setup(
    ) {
        let f = Fixture::new("mapping");
        f.with_remote();
        assert!(message(&row_of(&f, "git-repository-config"))
            .contains("the required fetch mapping is missing"));
        // A clone set up before the mail-body mirror existed carries only the event and legacy mappings.
        f.git(&[
            "config",
            "--add",
            "remote.origin.fetch",
            "+refs/fgos/events/*:refs/fgos/remotes/origin/events/*",
        ]);
        f.git(&[
            "config",
            "--add",
            "remote.origin.fetch",
            "+refs/fgos/legacy*:refs/fgos/remotes/origin/legacy*",
        ]);
        assert!(message(&row_of(&f, "git-repository-config"))
            .contains("the required fetch mapping is missing"));
        f.git(&["config", "--unset-all", "remote.origin.fetch"]);
        let installed = fixed(&f, "git-publication-refspecs");
        assert_eq!(installed.changed, Some(true), "{:?}", installed.message);
        let row = row_of(&f, "git-repository-config");
        assert!(row.passed, "{}", message(&row));
        assert!(f
            .git(&["config", "--get-all", "remote.origin.fetch"])
            .contains("+refs/fgos/mail-bodies/*:refs/fgos/remotes/origin/mail-bodies/*"));
        assert_eq!(
            fixed(&f, "git-publication-refspecs").message.as_deref(),
            Some("no fetch mapping change needed")
        );
        f.git(&[
            "config",
            "--add",
            "remote.origin.fetch",
            "+refs/*:refs/unsafe/*",
        ]);
        assert!(
            message(&row_of(&f, "git-repository-config")).contains("unsafe publication refspec")
        );
        f.git(&["config", "--unset-all", "remote.origin.fetch"]);
        fixed(&f, "git-publication-refspecs");
        f.git(&[
            "config",
            "--add",
            "remote.origin.push",
            "refs/fgos/events/*:refs/fgos/events/*",
        ]);
        assert!(
            message(&row_of(&f, "git-repository-config")).contains("unsafe publication refspec")
        );
        f.git(&["config", "--unset-all", "remote.origin.push"]);
        f.git(&[
            "remote",
            "set-url",
            "origin",
            f.temp.join("other").to_str().unwrap(),
        ]);
        assert!(
            message(&row_of(&f, "git-repository-config")).contains("event-store-remote-changed")
        );
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn the_repository_config_row_allows_ordinary_pushes_and_protective_negative_fetches_but_refuses_event_store_pushes(
    ) {
        let f = Fixture::new("pushes");
        f.with_remote();
        fixed(&f, "git-publication-refspecs");
        f.git(&[
            "config",
            "--add",
            "remote.origin.fetch",
            "^refs/fgos/local-events/*",
        ]);
        for refspec in [
            "HEAD",
            ":",
            "+:",
            "refs/heads/*:refs/heads/*",
            ":refs/fgos/events/old",
        ] {
            f.git(&["config", "remote.origin.push", refspec]);
            assert!(row_of(&f, "git-repository-config").passed, "{refspec}");
        }
        for refspec in [
            "refs/*:refs/*",
            "+refs/fgos/*:refs/fgos/*",
            "refs/fgos/events/machine",
        ] {
            f.git(&["config", "remote.origin.push", refspec]);
            assert!(!row_of(&f, "git-repository-config").passed, "{refspec}");
        }
    }

    // The Git door's repository driver is Unix only; elsewhere it refuses by name.
    #[cfg(unix)]
    #[test]
    fn the_git_half_of_the_floor_row_passes_where_git_is_available_and_starts_no_node() {
        let f = Fixture::new("floor");
        let row = row_of(&f, "node-version-and-git");
        assert!(row.passed, "{}", message(&row));
        assert_eq!(message(&row), "git available");
    }

    #[cfg(unix)]
    #[test]
    fn the_hook_row_applies_only_to_a_project_whose_pre_commit_is_the_fgos_guard() {
        let f = Fixture::new("hooks");
        assert_eq!(
            message(&row_of(&f, "main-checkout-hook-wired")),
            "not applicable -- this project ships no .githooks/ directory"
        );
        std::fs::create_dir_all(f.repo.join(".githooks")).unwrap();
        std::fs::write(f.repo.join(".githooks/pre-commit"), "#!/bin/sh\nexit 0\n").unwrap();
        let foreign = row_of(&f, "main-checkout-hook-wired");
        assert!(foreign.passed);
        assert!(message(&foreign).starts_with(
            "not applicable -- this project's .githooks/pre-commit is not fgOS's guard"
        ));
        let guard = format!("#!/bin/sh\n# {GUARD_MARKER}\nexit 0\n");
        std::fs::write(f.repo.join(".githooks/pre-commit"), guard).unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(
                f.repo.join(".githooks/pre-commit"),
                std::fs::Permissions::from_mode(0o755),
            )
            .unwrap();
        }
        let unwired = row_of(&f, "main-checkout-hook-wired");
        assert!(!unwired.passed);
        assert!(
            message(&unwired).ends_with("run npm run setup:hooks"),
            "{}",
            message(&unwired)
        );
        f.git(&["config", "core.hooksPath", ".githooks"]);
        let wired = row_of(&f, "main-checkout-hook-wired");
        assert!(wired.passed, "{}", message(&wired));
        assert!(message(&wired).starts_with("core.hooksPath = .githooks"));
    }

    #[cfg(unix)]
    #[test]
    fn a_group_writable_driver_directory_fails_the_compatibility_row_naming_the_fix_and_the_fix_repairs_it(
    ) {
        use std::os::unix::fs::PermissionsExt;
        let f = Fixture::new("umask");
        let old = f.temp.join("fgos");
        std::fs::create_dir_all(old.join("git-empty-hooks")).unwrap();
        std::fs::set_permissions(&old, std::fs::Permissions::from_mode(0o775)).unwrap();
        let mode = |path: &Path| std::fs::metadata(path).unwrap().permissions().mode() & 0o777;
        let at = || Run::with_state_root(&f.repo, old.clone());
        let before = judge(&at(), "git-component-compatible").unwrap();
        assert!(!before.passed);
        let text = message(&before);
        assert!(
            text.contains("mode 0775")
                && text.contains("fgos doctor --fix")
                && text.contains("git-driver-directories"),
            "{text}"
        );
        assert_eq!(mode(&old), 0o775, "a row never changes a mode");
        let outcome = fix(&at(), "git-driver-directories").unwrap();
        assert_eq!(outcome.changed, Some(true), "{:?}", outcome.message);
        assert_eq!(mode(&old), 0o755);
        assert_eq!(mode(&old.join("git-empty-hooks")), 0o500);
        let after = judge(&at(), "git-component-compatible").unwrap();
        assert!(after.passed, "{}", message(&after));
    }

    // The Git door keeps its operation journal on Linux only; elsewhere it refuses by name.
    #[cfg(target_os = "linux")]
    #[test]
    fn the_repository_config_row_names_an_untrusted_transport_setting_without_echoing_its_value() {
        let f = Fixture::new("transport");
        f.git(&["remote", "add", "upstream", "/fixture/remote"]);
        f.git(&["remote", "add", "origin", "/fixture/origin"]);
        assert_eq!(fixed(&f, "git-publication-refspecs").changed, Some(true));
        f.git(&[
            "config",
            "http.https://github.com/.extraheader",
            "AUTHORIZATION: secret",
        ]);
        let row = row_of(&f, "git-repository-config");
        assert!(!row.passed);
        let text = message(&row);
        assert!(text.contains("persist-credentials: false"), "{text}");
        assert!(
            text.contains("trusted global credential helper or GIT_CONFIG_GLOBAL"),
            "{text}"
        );
        assert!(!text.contains("AUTHORIZATION: secret"), "{text}");
        assert_eq!(
            f.git(&["config", "--get", "http.https://github.com/.extraheader"]),
            "AUTHORIZATION: secret"
        );
        f.git(&["config", "--unset", "http.https://github.com/.extraheader"]);
        assert!(row_of(&f, "git-repository-config").passed);
        f.git(&["config", "credential.helper", "untrusted-helper"]);
        let helper = row_of(&f, "git-repository-config");
        assert!(!helper.passed);
        assert!(message(&helper).contains("persist-credentials: false"));
    }

    // The Git door keeps its operation journal on Linux only; elsewhere it refuses by name.
    #[cfg(target_os = "linux")]
    #[test]
    fn an_obsolete_legacy_mapping_on_the_origin_or_the_configured_remote_fails_the_row_and_the_fix_repairs_each(
    ) {
        let f = Fixture::new("obsolete");
        f.git(&["remote", "add", "upstream", "/fixture/remote"]);
        f.git(&["remote", "add", "origin", "/fixture/origin"]);
        assert_eq!(fixed(&f, "git-publication-refspecs").changed, Some(true));
        let legacy = |remote: &str| {
            granted_fetch_mappings(remote)
                .unwrap()
                .into_iter()
                .find(|mapping| mapping.contains("legacy*"))
                .unwrap()
                .replace('*', "")
        };
        let (old_origin, obsolete) = (legacy("origin"), legacy("upstream"));
        f.git(&["config", "--add", "remote.origin.fetch", &old_origin]);
        std::fs::create_dir_all(f.repo.join(".fgos")).unwrap();
        std::fs::write(
            f.repo.join(".fgos/config.yaml"),
            "eventStore:\n  remote: upstream\n",
        )
        .unwrap();
        f.git(&["config", "--add", "remote.upstream.fetch", &obsolete]);
        assert!(!row_of(&f, "git-repository-config").passed);
        assert_eq!(fixed(&f, "git-publication-refspecs").changed, Some(true));
        let repaired = row_of(&f, "git-repository-config");
        assert!(repaired.passed, "{}", message(&repaired));
        assert!(!f
            .git(&["config", "--get-all", "remote.origin.fetch"])
            .contains(&old_origin));
        f.git(&["config", "--add", "remote.origin.fetch", &old_origin]);
        let origin = row_of(&f, "git-repository-config");
        assert!(!origin.passed);
        assert!(
            message(&origin).contains("obsolete exact legacy mapping"),
            "{}",
            message(&origin)
        );
        assert_eq!(fixed(&f, "git-publication-refspecs").changed, Some(true));
        assert!(!f
            .git(&["config", "--get-all", "remote.upstream.fetch"])
            .lines()
            .any(|line| line == obsolete));
        assert_eq!(fixed(&f, "git-publication-refspecs").changed, Some(false));
        f.git(&["config", "--add", "remote.upstream.fetch", &obsolete]);
        assert!(!row_of(&f, "git-repository-config").passed);
        let last = fixed(&f, "git-publication-refspecs");
        assert_eq!(last.changed, Some(true));
        let text = last.message.unwrap();
        assert!(
            text.contains("upstream") && !text.contains("origin"),
            "{text}"
        );
        assert!(row_of(&f, "git-repository-config").passed);
    }

    // The Git door keeps its operation journal on Linux only; elsewhere it refuses by name.
    #[cfg(target_os = "linux")]
    #[test]
    fn an_obsolete_mapping_on_only_the_configured_remote_is_repaired_there_and_never_on_an_origin_that_does_not_exist(
    ) {
        let f = Fixture::new("obsoleteupstream");
        f.git(&["remote", "add", "upstream", "/fixture/remote"]);
        std::fs::create_dir_all(f.repo.join(".fgos")).unwrap();
        std::fs::write(
            f.repo.join(".fgos/config.yaml"),
            "eventStore:\n  remote: upstream\n",
        )
        .unwrap();
        let obsolete = granted_fetch_mappings("upstream")
            .unwrap()
            .into_iter()
            .find(|mapping| mapping.contains("legacy*"))
            .unwrap()
            .replace('*', "");
        f.git(&["config", "--add", "remote.upstream.fetch", &obsolete]);
        let outcome = fixed(&f, "git-publication-refspecs");
        assert_eq!(outcome.changed, Some(true), "{:?}", outcome.message);
        let text = outcome.message.unwrap();
        assert!(text.contains("upstream"), "{text}");
        assert!(!text.contains("origin"), "{text}");
        assert!(!f
            .git(&["config", "--get-all", "remote.upstream.fetch"])
            .lines()
            .any(|line| line == obsolete));
    }

    // The Git door's repository driver is Unix only; elsewhere it refuses by name.
    #[cfg(unix)]
    #[test]
    fn reserved_legacy_mirror_refs_are_named_by_the_repository_config_row() {
        let f = Fixture::new("reserved");
        f.git(&["remote", "add", "origin", "/fixture/origin"]);
        fixed(&f, "git-publication-refspecs");
        f.git(&["commit", "--allow-empty", "-qm", "fixture"]);
        let bad = "refs/fgos/remotes/origin/legacy/events/m";
        f.git(&["update-ref", bad, "HEAD"]);
        let row = row_of(&f, "git-repository-config");
        assert!(!row.passed);
        assert!(message(&row).contains(bad), "{}", message(&row));
    }

    // The Git door's repository driver is Unix only; elsewhere it refuses by name.
    #[cfg(unix)]
    #[test]
    fn the_compatibility_row_keeps_its_facts_under_detail_so_its_message_stays_one_sentence() {
        let f = Fixture::new("detail");
        let row = row_of(&f, "git-component-compatible");
        assert!(row.passed, "{}", message(&row));
        let detail = row.detail.clone().unwrap();
        assert_eq!(
            detail["versions"]["contracts"],
            fgos_git::contract_versions()
        );
        assert_eq!(detail["floor"]["supported"], json!(true));
        assert!(!message(&row).contains("{\""), "a message carries no JSON");
    }

    #[test]
    fn a_git_below_the_feature_floor_fails_the_compatibility_row() {
        use fgos_git::repository_facts::{FloorFacts, ProbeFacts};
        let floor = |supported| Inspection::NotARepository {
            floor: FloorFacts {
                version: "2.30.0".into(),
                minimum: "2.40.0".into(),
                supported,
                probes: vec![ProbeFacts {
                    name: "probe".into(),
                    passed: supported,
                    evidence: String::new(),
                }],
            },
        };
        assert!(component_compatible(&floor(true)).passed);
        let below = component_compatible(&floor(false));
        assert!(!below.passed);
        assert!(message(&below).contains("do not match this release"));
    }

    #[test]
    fn a_row_or_fix_is_handled_only_when_it_is_a_git_one() {
        let root = std::env::temp_dir();
        let run = Run::new(&root);
        assert!(judge(&run, "event-store-open-root").is_none());
        assert!(fix(&run, "event-store-lock-dirs").is_none());
    }
}
