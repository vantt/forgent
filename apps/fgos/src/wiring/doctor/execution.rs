//! The execution doctor rows: what the runner config and the machine it names say about readiness. The
//! judgements are `fgos_execution::checks`'; this file reads the effective config through the config door and the
//! machine through the real one, hands both in, and words nothing itself.
//!
//! The config is read once per call (a failure is remembered, not read again per row). Two rows judge the config
//! as the runner loads it, after its semantic check (`executor-confinement`, `invocation-git-write-grants`; the
//! omp row takes its executors from it too): a config that does not load is not their finding, so they pass and
//! say so. The rest read the effective section as the door gives it.

use super::{judged, project_root_refusal, Rows};
use crate::wiring::dispatch_decide::HostWorkspace;
use crate::wiring::process_env;
use crate::wiring::seat_binding::{self, HostMachine, HostProbe};
use fgos_distribution::doctor::FixResult;
use fgos_distribution::doctor::{timed, RowOutcome};
use fgos_execution::accounts::{legacy_state_key, provider_account_inventory, read_llm_accounts};
use fgos_execution::checks::{
    agy_sub_homes_configured, capability_serves_valid, cleaned, executor_confinement,
    invocation_git_write_grants, omp_executors_of, omp_natives_present, runner_generated_paths,
    tool_registry_configured, CheckResult, OmpHost, SubHomes,
};
use fgos_execution::decide::{check_loaded_runner, LoadedRunner, Workspace};
use fgos_execution::executor_model::{
    credential_store_of, family_of, has_own_prefer_pool, FamilySource,
};
use fgos_execution::ports::Machine;
use fgos_execution::tools::tool_posture;
use fgos_execution_engine::accounts::credential::{
    credential_source_for_cli, expand_credential_home,
};
use fgos_execution_engine::accounts::login_homes::default_login_home_stores;
use fgos_execution_engine::accounts::{Accounts, SystemHost as AccountsHost};
use fgos_execution_engine::assignment::tier_cell::parse_tier_cell;
use fgos_execution_engine::contract::templates::{
    discover_project_prompt_templates, Roots as TemplateRoots,
};
use fgos_execution_engine::transport::provider_adapter::extract_policy_shaped_flags;
use serde_json::{json, Value};
use std::cell::OnceCell;
use std::io::ErrorKind;
use std::path::{Path, PathBuf};
use std::time::Duration;

pub const ROWS: &[&str] = &[
    "runner-generated-paths",
    "tool-registry-configured",
    "agy-sub-homes-configured",
    "capability-serves-valid",
    "omp-natives-present",
    "executor-confinement",
    "invocation-git-write-grants",
    "executor-family-unique",
    "executor-skills-installed",
    "tier-fallback",
    "model-policy-pools",
    "llm-accounts-shape",
    "llm-accounts-default-login-home",
    "executor-profile-warnings",
    "session-keep-declared",
    "provider-capacity-state",
    "confined-pane-accounts",
    "operation-prompt-templates-valid",
    "seat-binding-route",
];

pub const FIXES: &[&str] = &[];

pub const GROUP: Rows = Rows {
    rows: ROWS,
    fixes: FIXES,
    judge,
    fix,
};

fn fix(_root: &Path, _ids: &[&str]) -> Vec<FixResult> {
    Vec::new()
}

/// How long `omp --version` may take before the row reads it as not answering.
const OMP_VERSION_TIMEOUT: Duration = Duration::from_secs(10);

fn row(result: CheckResult) -> RowOutcome {
    judged(result.passed, result.message)
}

// ---- the config ------------------------------------------------------------------------------------------

/// The project's runner section with its origins, read through the one door `fgos dispatch decide` reads the
/// config by, or why it cannot be read.
fn read_runner(root: &Path) -> Result<LoadedRunner, String> {
    if let Some(refusal) = project_root_refusal(root) {
        return Err(refusal.to_owned());
    }
    HostWorkspace {
        process_cwd: root.to_path_buf(),
    }
    .load_runner(&root.to_string_lossy())
    .map_err(|failure| failure.message().to_owned())
}

/// The runner section read once; the runner's own checks run on top of it for the rows that need a loadable
/// config.
struct Config<'a> {
    root: &'a Path,
    read: OnceCell<Result<LoadedRunner, String>>,
}

impl<'a> Config<'a> {
    fn new(root: &'a Path) -> Self {
        Config {
            root,
            read: OnceCell::new(),
        }
    }

    fn read(&self) -> &Result<LoadedRunner, String> {
        self.read.get_or_init(|| read_runner(self.root))
    }

    fn raw(&self) -> Result<&Value, &String> {
        self.read().as_ref().map(|loaded| &loaded.runner)
    }

    /// The runner config as the loader returns it, or what it refused with.
    fn loaded(&self) -> Result<Value, String> {
        let loaded = self.read().clone()?;
        check_loaded_runner(loaded, &self.root.to_string_lossy())
            .map(|(runner, _)| runner)
            .map_err(|failure| failure.message().to_owned())
    }
}

// ---- the machine -----------------------------------------------------------------------------------------

/// The person's home through the config door's one rule.
fn home_of(env: &[(String, String)]) -> PathBuf {
    fgos_config::machine::home_dir(|key| {
        env.iter()
            .find(|(k, _)| k == key)
            .map(|(_, value)| value.clone())
    })
    .unwrap_or_default()
}

struct HostOmp {
    env: Vec<(String, String)>,
}

impl OmpHost for HostOmp {
    fn omp_version_output(&self) -> Result<String, String> {
        match fgos_process::spawn::run_bounded(
            "omp",
            ["--version"],
            &self.env,
            None,
            None,
            OMP_VERSION_TIMEOUT,
        ) {
            Err(error) => Err(match error.kind() {
                ErrorKind::NotFound => "ENOENT".to_owned(),
                ErrorKind::PermissionDenied => "EACCES".to_owned(),
                _ => error.to_string(),
            }),
            Ok(fgos_process::spawn::Outcome::TimedOut { .. }) => Err("ETIMEDOUT".to_owned()),
            Ok(fgos_process::spawn::Outcome::Exited(output)) if output.status.success() => {
                Ok(String::from_utf8_lossy(&output.stdout).into_owned())
            }
            Ok(fgos_process::spawn::Outcome::Exited(_)) => {
                Err("Command failed: omp --version".to_owned())
            }
        }
    }

    fn env(&self, key: &str) -> Option<String> {
        self.env
            .iter()
            .find(|(k, _)| k == key)
            .map(|(_, v)| v.clone())
    }

    fn exists(&self, path: &Path) -> bool {
        path.exists()
    }

    fn home(&self) -> PathBuf {
        home_of(&self.env)
    }

    fn platform(&self) -> &str {
        match std::env::consts::OS {
            "macos" => "darwin",
            "windows" => "win32",
            other => other,
        }
    }

    fn arch(&self) -> &str {
        match std::env::consts::ARCH {
            "x86_64" => "x64",
            "aarch64" => "arm64",
            other => other,
        }
    }
}

struct HostHomes {
    home: String,
}

impl SubHomes for HostHomes {
    fn home(&self) -> String {
        self.home.clone()
    }

    fn resolve(&self, path: &str) -> String {
        let given = Path::new(path);
        let absolute = if given.is_absolute() {
            given.to_path_buf()
        } else {
            std::env::current_dir().unwrap_or_default().join(given)
        };
        cleaned(&absolute).to_string_lossy().into_owned()
    }

    fn is_dir(&self, path: &str) -> bool {
        Path::new(path).is_dir()
    }
}

/// The main checkout of the repository `root` sits in, as the tool probe resolves a tool's scan target; `None`
/// outside a repository.
fn main_checkout(root: &Path) -> Option<PathBuf> {
    let repo = fgos_git::GitDriver::topology_at(root).ok().flatten()?;
    let main = repo.trusted_main_root();
    Some(std::fs::canonicalize(main).unwrap_or_else(|_| main.to_path_buf()))
}

// ---- the rows --------------------------------------------------------------------------------------------

fn judge(root: &Path, ids: &[&str]) -> Vec<RowOutcome> {
    let config = Config::new(root);
    let env = process_env();
    ids.iter()
        .map(|id| {
            timed(|| match *id {
                "runner-generated-paths" => with_raw(&config, runner_generated_paths),
                "capability-serves-valid" => with_raw(&config, capability_serves_valid),
                "executor-confinement" => {
                    with_loaded(&config, "confinement not evaluated", executor_confinement)
                }
                "invocation-git-write-grants" => with_loaded(
                    &config,
                    "git write grants not evaluated",
                    invocation_git_write_grants,
                ),
                "omp-natives-present" => {
                    // An unreadable runner config is its own row's failure; here it only means no executor is
                    // known to run omp.
                    let users = config
                        .loaded()
                        .map(|runner| omp_executors_of(&runner))
                        .unwrap_or_default();
                    row(omp_natives_present(&HostOmp { env: env.clone() }, &users))
                }
                "agy-sub-homes-configured" => {
                    // A config the door refuses names no sub-HOME; the config rows report the refusal itself.
                    let runner = config.raw().cloned().unwrap_or_else(|_| json!({}));
                    row(agy_sub_homes_configured(
                        &runner,
                        &HostHomes {
                            home: home_of(&env).to_string_lossy().into_owned(),
                        },
                    ))
                }
                "tool-registry-configured" => tool_row(root),
                "executor-family-unique" => {
                    with_loaded(&config, "not evaluated", executor_family_unique)
                }
                "executor-skills-installed" => with_loaded(&config, "not evaluated", |runner| {
                    let checkout = main_checkout(root).unwrap_or_else(|| root.to_path_buf());
                    let machine = HostMachine::new(None, None);
                    executor_skills_installed(runner, &checkout, &home_of(&env), &|command| {
                        machine.on_path(command)
                    })
                }),
                "tier-fallback" => with_loaded(&config, "not evaluated", tier_fallback),
                "model-policy-pools" => with_loaded(&config, "not evaluated", |runner| {
                    model_policy_pools(runner, &HostMachine::new(None, None))
                }),
                "llm-accounts-shape" => with_loaded(&config, "not evaluated", |runner| {
                    llm_accounts_shape(runner, &HostMachine::new(None, None))
                }),
                "llm-accounts-default-login-home" => {
                    with_loaded(&config, "not evaluated", |runner| {
                        llm_accounts_default_login_home(runner, &home_of(&env), &env)
                    })
                }
                "executor-profile-warnings" => with_loaded(
                    &config,
                    "executor-profile warnings not evaluated",
                    executor_profile_warnings,
                ),
                "session-keep-declared" => with_loaded(
                    &config,
                    "session directories not evaluated",
                    session_keep_declared,
                ),
                "provider-capacity-state" => row(provider_capacity_state()),
                "confined-pane-accounts" => {
                    row(confined_pane_accounts_row(&config, &home_of(&env)))
                }
                "operation-prompt-templates-valid" => row(operation_prompt_templates_valid(root)),
                "seat-binding-route" => row(seat_binding_route()),
                other => unreachable!("execution group asked for row {other}"),
            })
        })
        .collect()
}

/// A row over the effective section as the door gives it; a config the door refuses fails the row with the
/// refusal.
fn with_raw(config: &Config, judge: fn(&Value) -> CheckResult) -> RowOutcome {
    match config.raw() {
        Ok(runner) => row(judge(runner)),
        Err(message) => judged(false, message.clone()),
    }
}

/// A row over the config as the runner loads it; a config that does not load is not this row's finding.
fn with_loaded(
    config: &Config,
    not_evaluated: &str,
    judge: impl FnOnce(&Value) -> CheckResult,
) -> RowOutcome {
    match config.loaded() {
        Ok(runner) => row(judge(&runner)),
        Err(message) => judged(
            true,
            format!("runner config not loadable here, {not_evaluated}: {message}"),
        ),
    }
}

/// The posture of the tools the main checkout's config declares, probed live on this machine.
fn tool_row(root: &Path) -> RowOutcome {
    let Some(main) = main_checkout(root) else {
        return judged(true, "not inside a git checkout \u{2014} nothing to check");
    };
    let runner = match read_runner(&main) {
        Ok(loaded) => loaded.runner,
        Err(message) => return judged(false, message),
    };
    let machine = HostMachine::new(None, None);
    let probe = HostProbe::new(&machine, Some(main));
    row(tool_registry_configured(&tool_posture(&runner, &probe)))
}

// ---- executor families, tiers and accounts -----------------------------------------------------------------

fn pass(message: impl Into<String>) -> CheckResult {
    CheckResult {
        passed: true,
        message: message.into(),
    }
}

fn fail(message: impl Into<String>) -> CheckResult {
    CheckResult {
        passed: false,
        message: message.into(),
    }
}

fn entries(value: Option<&Value>) -> impl Iterator<Item = (&String, &Value)> {
    value.and_then(Value::as_object).into_iter().flatten()
}

fn items(value: Option<&Value>) -> impl Iterator<Item = &Value> {
    value.and_then(Value::as_array).into_iter().flatten()
}

fn is_agent(entry: &Value) -> bool {
    entry.get("kind").and_then(Value::as_str) == Some("agent")
}

fn family_of_entry(entry: &Value) -> String {
    family_of(FamilySource::Entry(entry), None)
}

fn family_of_spelling(spelling: &str) -> String {
    family_of(FamilySource::Spelling(spelling), None)
}

/// Two agent executors of one family split its pool: which one runs then depends on the session.
fn executor_family_unique(runner: &Value) -> CheckResult {
    let mut by_family: Vec<(String, Vec<&str>)> = Vec::new();
    for (id, entry) in entries(runner.get("executors")).filter(|(_, entry)| is_agent(entry)) {
        let family = family_of_entry(entry);
        match by_family.iter_mut().find(|(known, _)| *known == family) {
            Some((_, ids)) => ids.push(id),
            None => by_family.push((family, vec![id])),
        }
    }
    let shared: Vec<String> = by_family
        .iter()
        .filter(|(_, ids)| ids.len() > 1)
        .map(|(family, ids)| format!("{family} ({})", ids.join(", ")))
        .collect();
    if !shared.is_empty() {
        return fail(format!(
            "one family, several executors: {} -- merge them into one executor and keep each transport as one of its invocations",
            shared.join("; ")
        ));
    }
    pass(format!(
        "each of {} agent families has one executor",
        by_family.len()
    ))
}

/// Where each agent CLI reads project skills from, keyed by the invocation's command name. The checkout door keeps
/// the same directories as an unkeyed list for provisioning.
const AGENT_SKILL_DIRS: [(&str, &str); 5] = [
    ("claude", ".claude/skills"),
    ("codex", ".agents/skills"),
    ("omp", ".omp/skills"),
    ("pi", ".pi/skills"),
    ("grok", ".grok/skills"),
];

/// The CLIs that also read the same directory name from the user's home.
const CLI_USER_SKILL_DIRS: [(&str, &str); 2] =
    [("claude", ".claude/skills"), ("codex", ".agents/skills")];

fn skill_file_state(file: &Path) -> &'static str {
    match std::fs::read_to_string(file) {
        Err(_) => "missing",
        Ok(text) if text.trim().is_empty() => "empty",
        Ok(_) => "ok",
    }
}

/// An executor that declares `supports.skills` is only truthful when the skill is installed in its runtime's skill
/// directory, at project level or (for the CLIs that read one) the user's home, with content. Judges the main
/// checkout only: a linked worktree gets skills from worktreeSetup provisioning alone.
fn executor_skills_installed(
    runner: &Value,
    root: &Path,
    home: &Path,
    on_path: &dyn Fn(&str) -> bool,
) -> CheckResult {
    let mut missing: Vec<String> = Vec::new();
    let mut unchecked: Vec<String> = Vec::new();
    let mut not_installed: Vec<String> = Vec::new();
    let mut checked = 0usize;
    for (id, entry) in entries(runner.get("executors")) {
        let Some(skills) = entry
            .pointer("/supports/skills")
            .and_then(Value::as_array)
            .filter(|_| is_agent(entry))
        else {
            continue;
        };
        let mut commands: Vec<&str> = Vec::new();
        for command in items(entry.get("invocations"))
            .filter_map(|inv| inv.get("command").and_then(Value::as_str))
            .filter(|command| !command.is_empty())
        {
            if !commands.contains(&command) {
                commands.push(command);
            }
        }
        for command in commands {
            let cli = Path::new(command)
                .file_name()
                .map_or(command.to_owned(), |name| {
                    name.to_string_lossy().into_owned()
                });
            if !on_path(command) {
                not_installed.push(format!("{id} (cli {cli})"));
                continue;
            }
            let Some((_, dir)) = AGENT_SKILL_DIRS.iter().find(|(name, _)| *name == cli) else {
                unchecked.push(format!("{id} (cli {cli})"));
                continue;
            };
            for skill in skills.iter().filter_map(Value::as_str) {
                checked += 1;
                let folder = skill.replace(':', "-");
                let rel = format!("{dir}/{folder}/SKILL.md");
                let mut candidates = vec![root.join(&rel)];
                if let Some((_, user_dir)) =
                    CLI_USER_SKILL_DIRS.iter().find(|(name, _)| *name == cli)
                {
                    candidates.push(home.join(user_dir).join(&folder).join("SKILL.md"));
                }
                let states: Vec<&str> = candidates
                    .iter()
                    .map(|file| skill_file_state(file))
                    .collect();
                if states.contains(&"ok") {
                    continue;
                }
                let where_ = if candidates.len() > 1 {
                    format!("{} or {}", root.display(), home.display())
                } else {
                    root.display().to_string()
                };
                let problem = if states.contains(&"empty") {
                    "is empty"
                } else {
                    "is missing"
                };
                missing.push(format!(
                    "{id} declares {skill} but {rel} {problem} in {where_} -- install the skill for the {cli} CLI, or remove it from executors.{id}.supports.skills; a linked worktree gets skills only from worktreeSetup provisioning, so a pass in the main checkout is not a pass in a worktree"
                ));
            }
        }
    }
    if !missing.is_empty() {
        return fail(missing.join("; "));
    }
    let mut note = String::new();
    if !unchecked.is_empty() {
        note.push_str(&format!(
            "; not checked, no known skill directory: {}",
            unchecked.join(", ")
        ));
    }
    if !not_installed.is_empty() {
        let mut once: Vec<&String> = Vec::new();
        for name in &not_installed {
            if !once.contains(&name) {
                once.push(name);
            }
        }
        note.push_str(&format!(
            "; skipped, CLI not installed: {}",
            once.iter()
                .map(|s| s.as_str())
                .collect::<Vec<_>>()
                .join(", ")
        ));
    }
    pass(format!(
        "{checked} declared executor skill(s) installed in the main checkout (a linked worktree gets skills only from worktreeSetup provisioning){note}"
    ))
}

/// A family a tier's fallback list names but that has no cell at that tier, or no agent executor, is skipped by the
/// walk and recorded; a declared `tierFallback` names every tier of the ladder. Warns, never fails.
fn tier_fallback(runner: &Value) -> CheckResult {
    let declared: Vec<(&String, &Value)> = entries(runner.get("tierFallback")).collect();
    if declared.is_empty() {
        return pass("runner.tierFallback not declared; every tier walks its capability prefer order after a failure");
    }
    let served: Vec<String> = entries(runner.get("executors"))
        .filter(|(_, entry)| is_agent(entry))
        .map(|(_, entry)| family_of_entry(entry))
        .collect();
    let mut problems: Vec<String> = fgos_seat_binding::tier_ladder()
        .iter()
        .filter(|tier| {
            runner
                .pointer(&format!("/tierFallback/{}", tier.name))
                .is_none()
        })
        .map(|tier| {
            format!(
                "{0}: no list, so a seat at {0} has no walk after a failure",
                tier.name
            )
        })
        .collect();
    for (tier, families) in &declared {
        for family in families
            .as_array()
            .into_iter()
            .flatten()
            .filter_map(Value::as_str)
        {
            let cell = runner
                .get("modelPolicies")
                .and_then(|policies| policies.get(family))
                .and_then(|tiers| tiers.get(tier.as_str()));
            if cell.is_none() {
                problems.push(format!(
                    "{tier}: {family} has no modelPolicies cell at {tier}"
                ));
            } else if !served.contains(&family_of_spelling(family)) {
                problems.push(format!("{tier}: no agent executor serves {family}"));
            }
        }
    }
    if !problems.is_empty() {
        return pass(format!(
            "warning: tier fallback entries the walk skips: {}",
            problems.join("; ")
        ));
    }
    pass(format!(
        "runner.tierFallback declares the walk order of {} tier(s): {}",
        declared.len(),
        declared
            .iter()
            .map(|(tier, _)| tier.as_str())
            .collect::<Vec<_>>()
            .join(", ")
    ))
}

/// A tier cell entry served by a pool runner.llmAccounts does not declare cannot run once pools route.
fn model_policy_pools(runner: &Value, machine: &dyn Machine) -> CheckResult {
    let mut explicit: Vec<(String, String)> = Vec::new();
    for (family, tiers) in entries(runner.get("modelPolicies")) {
        for (tier, cell) in entries(Some(tiers)) {
            match parse_tier_cell(cell, family) {
                Ok(parsed) => explicit.extend(
                    parsed
                        .into_iter()
                        .filter(|entry| entry.explicit_pool)
                        .map(|entry| (format!("{family}.{tier}"), entry.pool)),
                ),
                Err(message) => return fail(format!("{family}.{tier}: {message}")),
            }
        }
    }
    if explicit.is_empty() {
        return pass("no tier cell names a pool");
    }
    let pools = read_llm_accounts(runner, machine).pools;
    let missing: Vec<String> = explicit
        .iter()
        .filter(|(_, pool)| !pools.iter().any(|known| known.name == *pool))
        .map(|(cell, pool)| format!("{cell}@{pool}"))
        .collect();
    if !missing.is_empty() {
        return pass(format!(
            "warning: tier cells name pools runner.llmAccounts does not declare: {}; the walk skips these entries until the pool has an enabled account holding a login store for the CLI of the invocation (fgos dispatch explain shows each)",
            missing.join(", ")
        ));
    }
    pass(format!(
        "{} tier cell entries name a pool declared in runner.llmAccounts",
        explicit.len()
    ))
}

/// Every problem the account inventory reader finds.
fn llm_accounts_shape(runner: &Value, machine: &dyn Machine) -> CheckResult {
    let read = read_llm_accounts(runner, machine);
    if !read.problems.is_empty() {
        return fail(
            read.problems
                .iter()
                .map(|problem| format!("{}: {}", problem.at, problem.detail))
                .collect::<Vec<_>>()
                .join("; "),
        );
    }
    if runner.get("llmAccounts").is_none() {
        return pass("runner.llmAccounts not declared; accounts come from runner.providers");
    }
    let inventory = provider_account_inventory(runner, machine);
    let mut unusable: Vec<String> = Vec::new();
    for pool in &read.pools {
        let accounts = inventory
            .get(&legacy_state_key(&pool.name))
            .and_then(|entry| entry.get("accounts"));
        for account in &pool.accounts {
            for gap in items(
                accounts
                    .and_then(|accounts| accounts.get(&account.id))
                    .and_then(|account| account.get("unusableFor")),
            ) {
                let cli = gap.get("cli").and_then(Value::as_str).unwrap_or_default();
                unusable.push(format!("{}/{} ({cli})", pool.name, account.id));
            }
        }
    }
    if !unusable.is_empty() {
        return pass(format!(
            "warning: login stores no invocation declares files for, so those accounts cannot run on that CLI: {}",
            unusable.join(", ")
        ));
    }
    let count: usize = read.pools.iter().map(|pool| pool.accounts.len()).sum();
    pass(format!(
        "runner.llmAccounts declares {count} accounts in {} pools",
        read.pools.len()
    ))
}

/// A store on a CLI's own default login home can be renewed by a pane and make the provider revoke the real
/// refresh token. Warns, never refuses, so a single-account user still runs.
fn llm_accounts_default_login_home(
    runner: &Value,
    home: &Path,
    env: &[(String, String)],
) -> CheckResult {
    let lookup = |key: &str| {
        env.iter()
            .find(|(k, _)| k == key)
            .map(|(_, value)| value.clone())
    };
    let hits = default_login_home_stores(runner, &home.to_string_lossy(), &lookup);
    if hits.is_empty() {
        return pass("no runner.llmAccounts store sits on its CLI default login home");
    }
    let keys: Vec<&str> = hits
        .iter()
        .filter_map(|hit| hit.get("key").and_then(Value::as_str))
        .collect();
    pass(format!(
        "warning: stores on a default login home: {}; a pane renewing a copy of that login can make the provider revoke the real refresh token and log out your own sessions -- log in a second directory (CLAUDE_CONFIG_DIR=<own dir> claude /login, or the CLI's own home variable) and point the key at it",
        keys.join(", ")
    ))
}

/// Env var names that look like executor-owned account or credential-pool selection.
fn looks_like_account_pool_env(name: &str) -> bool {
    let upper = name.to_ascii_uppercase();
    [
        "_CREDENTIAL_HOME",
        "_CREDENTIAL_HOMES",
        "_ACCOUNT_POOL",
        "_ACCOUNTS",
    ]
    .iter()
    .any(|suffix| upper.ends_with(suffix))
}

fn for_entries_of(executor: &Value) -> Vec<&Value> {
    items(executor.get("for")).collect()
}

fn for_text(value: &Value) -> String {
    value
        .as_str()
        .map_or_else(|| value.to_string(), str::to_owned)
}

/// Legacy executor entries hardcoding policy-shaped behaviour, each named with its migration target. Warns only.
fn executor_profile_warnings(runner: &Value) -> CheckResult {
    let mut warnings: Vec<(String, String)> = Vec::new();
    for (executor_id, executor) in entries(runner.get("executors")) {
        let cli = items(executor.get("invocations"))
            .find(|inv| inv.get("via").and_then(Value::as_str) == Some("cli"));
        let for_list = for_entries_of(executor);
        if executor.get("kind").and_then(Value::as_str) != Some("tool") && !for_list.is_empty() {
            warnings.push((
                format!("executor.{executor_id}.agent-for-inert"),
                "the dispatch names its capability (execute <id> --for <capability>); remove \"for\" from this executor".to_owned(),
            ));
        }
        if executor.get("kind").and_then(Value::as_str) == Some("tool") {
            let mut served: Vec<String> = Vec::new();
            for capability in for_list.iter().filter_map(|value| value.as_str()) {
                if !served.iter().any(|known| known == capability) {
                    served.push(capability.to_owned());
                }
            }
            for capability in served {
                if has_own_prefer_pool(runner, &capability) {
                    warnings.push((
                        format!("executor.{executor_id}.tool-purpose-prefer-ignored.{capability}"),
                        format!("remove runner.capabilities.{capability}.prefer; the tool executor's \"for\" is what serves it"),
                    ));
                }
            }
        }
        let args: Vec<String> = items(cli.and_then(|inv| inv.get("args")))
            .filter_map(|arg| arg.as_str().map(str::to_owned))
            .collect();
        let flags = extract_policy_shaped_flags(&args);
        if !flags.is_empty() {
            warnings.push((
                format!("executor.{executor_id}.policy-shaped-flags"),
                "ProviderAdapter runtime option (design.md §3.5)".to_owned(),
            ));
        }
        for (name, _) in entries(cli.and_then(|inv| inv.get("env"))) {
            if looks_like_account_pool_env(name) {
                warnings.push((
                    format!("executor.{executor_id}.account-pool-env.{name}"),
                    "Provider Capacity Rotator global account inventory (plans/260916-account-rotator/, runner.llmAccounts.<pool>)".to_owned(),
                ));
            }
        }
    }
    if warnings.is_empty() {
        return pass("no legacy policy-shaped executor/capability entries found");
    }
    let summary: Vec<String> = warnings
        .iter()
        .map(|(id, target)| format!("{id} -> {target}"))
        .collect();
    pass(format!(
        "warning: {} legacy executor-profile warning(s): {}",
        warnings.len(),
        summary.join("; ")
    ))
}

/// `executor/invocation` of every confined `cli` invocation with no session directory declared.
fn invocations_keeping_no_session(runner: &Value) -> Vec<String> {
    let mut found = Vec::new();
    for (executor_id, executor) in entries(runner.get("executors")) {
        if executor
            .get("kind")
            .and_then(Value::as_str)
            .unwrap_or("agent")
            != "agent"
        {
            continue;
        }
        for invocation in items(executor.get("invocations")) {
            if invocation.get("via").and_then(Value::as_str) != Some("cli") {
                continue;
            }
            let confinement = invocation
                .get("confinement")
                .filter(|value| !value.is_null())
                .or_else(|| executor.get("confinement"));
            let confined = confinement
                .and_then(|value| value.get("backend"))
                .is_some_and(|backend| !backend.is_null() && backend != &json!(""));
            if !confined {
                continue;
            }
            let session_dir =
                credential_store_of(invocation).and_then(|store| store.get("sessionDir"));
            let declared = session_dir.is_some_and(|dir| !dir.is_null() && dir != &json!(""));
            if !declared {
                let id = invocation
                    .get("id")
                    .map_or_else(|| "undefined".to_owned(), for_text);
                found.push(format!("{executor_id}/{id}"));
            }
        }
    }
    found
}

fn session_keep_declared(runner: &Value) -> CheckResult {
    let missing = invocations_keeping_no_session(runner);
    if missing.is_empty() {
        return pass(
            "every confined agent invocation declares the session directory Execution keeps",
        );
    }
    let mut executors: Vec<&str> = Vec::new();
    for entry in &missing {
        let id = entry.split('/').next().unwrap_or_default();
        if !executors.contains(&id) {
            executors.push(id);
        }
    }
    let target = if executors.len() == 1 {
        executors[0]
    } else {
        "<executorId>"
    };
    pass(format!(
        "warning: {} confined invocation(s) keep no session transcript ({}); run fgos dispatch probe-session {target} to see where that CLI writes its session, then declare it as credentialStore.sessionDir",
        missing.len(),
        missing.join(", ")
    ))
}

/// Provider-capacity state of the machine's account inventory: reportable, never auto-cleared.
fn provider_capacity_state() -> CheckResult {
    let runner = match super::confinement::machine_runner() {
        Ok(runner) => runner,
        Err(reason) => return fail(format!("provider-capacity state unreadable: {reason}")),
    };
    let inventory = provider_account_inventory(&runner, &HostMachine::new(None, None));
    let host = AccountsHost::new();
    let accounts = match Accounts::from_environment(&host) {
        Ok(accounts) => accounts,
        Err(error) => return fail(format!("provider-capacity state unreadable: {error}")),
    };
    provider_capacity_verdict(&accounts.inspect_provider_capacity(&inventory, None, None))
}

fn provider_capacity_verdict(report: &Value) -> CheckResult {
    let accounts: Vec<&Value> = entries(report.get("providers"))
        .flat_map(|(_, provider)| entries(provider.get("accounts")).map(|(_, account)| account))
        .collect();
    if accounts.is_empty() {
        return pass("inactive — no global runner.llmAccounts inventory configured");
    }
    let quarantined: Vec<&Value> = accounts
        .iter()
        .copied()
        .filter(|account| account.get("quarantine").is_some_and(|q| !q.is_null()))
        .collect();
    if quarantined.is_empty() {
        return pass(format!(
            "provider-capacity healthy — {} account(s), no quarantine",
            accounts.len()
        ));
    }
    let summary: Vec<String> = quarantined
        .iter()
        .map(|account| {
            let quarantine = &account["quarantine"];
            let reason = quarantine
                .get("reasonCode")
                .and_then(Value::as_str)
                .filter(|reason| !reason.is_empty())
                .unwrap_or("quarantined");
            let manual = if quarantine.get("kind").and_then(Value::as_str) == Some("manual-clear") {
                ":manual-clear"
            } else {
                ""
            };
            let until = quarantine
                .get("until")
                .filter(|until| !until.is_null())
                .map_or_else(String::new, |until| format!(":until={}", for_text(until)));
            format!(
                "{}:{reason}{manual}{until}",
                account
                    .get("accountId")
                    .map_or_else(|| "undefined".to_owned(), for_text)
            )
        })
        .collect();
    fail(format!(
        "provider-capacity quarantine present ({}) — inspect with \"fgos dispatch inspect --provider-capacity\"; clear manually with \"fgos dispatch reconcile provider-capacity clear-quarantine\" after the operator fix",
        summary.join(", ")
    ))
}

/// The executors a confined-pane row judges: the project's loaded config, else the machine's own executors.
fn confined_pane_accounts_row(config: &Config, home: &Path) -> CheckResult {
    let machine = HostMachine::new(None, None);
    let global = super::confinement::machine_runner();
    let inventory = match &global {
        Ok(runner) => provider_account_inventory(runner, &machine),
        Err(reason) => {
            return fail(format!(
                "provider account inventory is unreadable: {reason}"
            ))
        }
    };
    let runner = match config.loaded() {
        Ok(runner) => runner,
        Err(message) => match global
            .as_ref()
            .ok()
            .and_then(|g| g.get("executors"))
            .filter(|e| e.is_object())
        {
            Some(executors) => json!({ "executors": executors }),
            None => {
                return pass(format!(
                "runner config not loadable here, confined pane accounts not evaluated: {message}"
            ))
            }
        },
    };
    confined_pane_accounts(&runner, &inventory, home, &|command| {
        machine.on_path(command)
    })
}

/// A confined invocation that reads a login store starts in an empty private home: the account's login only gets
/// there when the machine-global provider account inventory names it. Names, per invocation, what would leave an
/// agent logged out.
fn confined_pane_accounts(
    runner: &Value,
    inventory: &serde_json::Map<String, Value>,
    home: &Path,
    on_path: &dyn Fn(&str) -> bool,
) -> CheckResult {
    let mut problems: Vec<String> = Vec::new();
    let mut notes: Vec<String> = Vec::new();
    for (id, executor) in entries(runner.get("executors")) {
        for inv in items(executor.get("invocations")) {
            let Some(store) = credential_store_of(inv) else {
                continue;
            };
            let label = format!(
                "executor \"{id}\" invocation \"{}\"",
                inv.get("id").map_or_else(|| "?".to_owned(), for_text)
            );
            let command = inv.get("command").and_then(Value::as_str);
            if !command.is_some_and(on_path) {
                let program = command
                    .and_then(|c| Path::new(c).file_name())
                    .map(|name| name.to_string_lossy().into_owned())
                    .unwrap_or_default();
                notes.push(format!("{label}: {program} is not installed, not checked"));
                continue;
            }
            let provider = legacy_state_key(
                executor
                    .get("providerModel")
                    .or_else(|| executor.get("provider"))
                    .and_then(Value::as_str)
                    .unwrap_or_default(),
            );
            let accounts: Vec<&Value> = entries(
                inventory
                    .get(&provider)
                    .and_then(|entry| entry.get("accounts")),
            )
            .map(|(_, account)| account)
            .collect();
            if accounts.is_empty() {
                problems.push(format!(
                    "{label}: no runner.llmAccounts pool for {provider} in the global config, so its pane starts in an empty private home, logged out"
                ));
                continue;
            }
            let cli = store.get("use").and_then(Value::as_str);
            for account in accounts {
                let account_id = account
                    .get("id")
                    .map_or_else(|| "undefined".to_owned(), for_text);
                let Some(source) = credential_source_for_cli(account, cli) else {
                    problems.push(format!(
                        "{label}: account \"{account_id}\" declares no credential source for store \"{}\", so an agent leased to it starts logged out",
                        cli.unwrap_or("undefined")
                    ));
                    continue;
                };
                let source_home = source
                    .get("home")
                    .and_then(Value::as_str)
                    .unwrap_or_default();
                let home_dir =
                    expand_credential_home(Some(source_home), Some(&home.to_string_lossy()))
                        .unwrap_or_else(|| source_home.to_owned());
                let files: Vec<String> = match store.get("files").and_then(Value::as_array) {
                    Some(files) => files
                        .iter()
                        .filter_map(Value::as_str)
                        .map(str::to_owned)
                        .collect(),
                    None if source.get("kind").and_then(Value::as_str) == Some("home-files") => {
                        items(source.get("files"))
                            .filter_map(Value::as_str)
                            .map(str::to_owned)
                            .collect()
                    }
                    None => vec!["auth.json".to_owned()],
                };
                let missing: Vec<&String> = files
                    .iter()
                    .filter(|rel| !Path::new(&home_dir).join(rel).exists())
                    .collect();
                if missing.len() == files.len() {
                    problems.push(format!(
                        "{label}: account \"{account_id}\" has none of {} under {home_dir}, so nothing is copied and its agent starts logged out",
                        files.join(", ")
                    ));
                } else if !missing.is_empty() {
                    notes.push(format!(
                        "{label}: account \"{account_id}\" has {} of {} credential file(s); absent: {}",
                        files.len() - missing.len(),
                        files.len(),
                        missing.iter().map(|f| f.as_str()).collect::<Vec<_>>().join(", ")
                    ));
                } else {
                    notes.push(format!(
                        "{label}: account \"{account_id}\" has its {} credential file(s)",
                        files.len()
                    ));
                }
            }
        }
    }
    if !problems.is_empty() {
        return fail(problems.join("; "));
    }
    pass(if notes.is_empty() {
        "no confined invocation reads a login store".to_owned()
    } else {
        notes.join("; ")
    })
}

/// Every operation prompt template of the project tier validates against the bounded variables and schema.
fn operation_prompt_templates_valid(root: &Path) -> CheckResult {
    let roots = TemplateRoots {
        cwd: root.to_path_buf(),
        package_root: crate::active_payload_root().unwrap_or_else(|_| root.to_path_buf()),
    };
    match discover_project_prompt_templates(&roots) {
        Ok(found) => pass(format!(
            "{} project operation prompt template(s) discovered and validated cleanly",
            found.len()
        )),
        Err(error) => fail(format!(
            "malformed operation prompt template -- {}",
            error.message
        )),
    }
}

/// The host answers `ladder` on the seat-binding route at the protocol the client speaks. The host is this very
/// binary, so the route is asked in process.
fn seat_binding_route() -> CheckResult {
    let exe = std::env::current_exe()
        .map_or_else(|_| "fgos".to_owned(), |path| path.display().to_string());
    let protocol = seat_binding::PROTOCOL;
    let (code, answer) = seat_binding::run(
        &[
            "ladder".to_owned(),
            "--protocol".to_owned(),
            protocol.to_string(),
        ],
        &json!({ "v": protocol }).to_string(),
    );
    if code != 0 || answer.get("result").and_then(Value::as_str) != Some("ok") {
        let code_name = answer
            .get("code")
            .and_then(Value::as_str)
            .unwrap_or("error");
        let message = answer
            .get("message")
            .and_then(Value::as_str)
            .unwrap_or_default();
        return fail(format!("{exe} -> {code_name}: {message}"));
    }
    let tiers = answer
        .pointer("/ladder/vocabulary")
        .and_then(Value::as_array)
        .map_or(0, Vec::len);
    pass(format!(
        "{exe} (host in reach) answers ladder at protocol {protocol}, hostVersion {}, {tiers} tiers",
        answer.get("hostVersion").and_then(Value::as_str).unwrap_or_default()
    ))
}

#[cfg(test)]
mod row_tests {
    use super::*;

    struct NoMachine;
    impl Machine for NoMachine {
        fn on_path(&self, _: &str) -> bool {
            true
        }
        fn posture_backend(&self, _: &str) -> Option<fgos_execution::ports::Backend> {
            None
        }
        fn herdr_present(&self) -> bool {
            false
        }
        fn home_dir(&self) -> Option<String> {
            Some("/home/u".to_owned())
        }
    }

    #[test]
    fn two_agent_executors_of_one_family_fail_naming_both() {
        let runner = json!({"executors": {
            "a": {"kind": "agent", "providerModel": "claude"},
            "b": {"kind": "agent", "providerModel": "claude"},
            "t": {"kind": "tool"}}});
        let result = executor_family_unique(&runner);
        assert!(!result.passed);
        assert!(
            result.message.contains("claude (a, b)"),
            "{}",
            result.message
        );
    }

    #[test]
    fn one_executor_per_family_passes() {
        let runner = json!({"executors": {"a": {"kind": "agent", "providerModel": "claude"}}});
        assert!(executor_family_unique(&runner).passed);
    }

    #[test]
    fn a_declared_skill_missing_from_the_skill_directory_fails() {
        let dir = std::env::temp_dir().join(format!("fgos-skill-row-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let runner = json!({"executors": {"e": {"kind": "agent",
            "supports": {"skills": ["ak:plan"]},
            "invocations": [{"command": "claude"}]}}});
        let result = executor_skills_installed(&runner, &dir, &dir, &|_| true);
        assert!(!result.passed);
        assert!(result.message.contains("ak:plan"), "{}", result.message);
        let skill = dir.join(".claude/skills/ak-plan");
        std::fs::create_dir_all(&skill).unwrap();
        std::fs::write(skill.join("SKILL.md"), "body").unwrap();
        assert!(executor_skills_installed(&runner, &dir, &dir, &|_| true).passed);
        let absent = executor_skills_installed(&runner, &dir, &dir, &|_| false);
        assert!(absent.message.contains("CLI not installed"));
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn a_tier_fallback_naming_a_family_without_a_cell_warns_and_passes() {
        let runner = json!({"tierFallback": {"max": ["claude"]}, "executors": {}});
        let result = tier_fallback(&runner);
        assert!(result.passed);
        assert!(result.message.starts_with("warning:"), "{}", result.message);
    }

    #[test]
    fn an_undeclared_tier_fallback_passes_quietly() {
        assert!(tier_fallback(&json!({})).message.contains("not declared"));
    }

    #[test]
    fn a_tier_cell_naming_an_undeclared_pool_warns() {
        let runner = json!({"modelPolicies": {"claude": {"max": "opus@vertex"}}});
        let result = model_policy_pools(&runner, &NoMachine);
        assert!(result.passed);
        assert!(
            result.message.contains("claude.max@vertex"),
            "{}",
            result.message
        );
    }

    #[test]
    fn no_pool_in_any_cell_passes() {
        let runner = json!({"modelPolicies": {"claude": {"max": "opus"}}});
        assert_eq!(
            model_policy_pools(&runner, &NoMachine).message,
            "no tier cell names a pool"
        );
    }

    #[test]
    fn llm_accounts_not_declared_passes_with_the_providers_note() {
        let result = llm_accounts_shape(&json!({}), &NoMachine);
        assert!(result.passed && result.message.contains("not declared"));
    }

    #[test]
    fn a_confined_cli_invocation_without_a_session_dir_is_named() {
        let runner = json!({"executors": {"e": {"invocations": [
            {"id": "i", "via": "cli", "confinement": {"backend": "bwrap"}}]}}});
        let result = session_keep_declared(&runner);
        assert!(
            result.passed && result.message.contains("e/i"),
            "{}",
            result.message
        );
        let declared = json!({"executors": {"e": {"invocations": [
            {"id": "i", "via": "cli", "confinement": {"backend": "bwrap"},
             "credentialStore": {"use": "claude", "sessionDir": "x"}}]}}});
        assert!(session_keep_declared(&declared)
            .message
            .starts_with("every confined"));
    }

    #[test]
    fn an_account_pool_env_name_and_policy_flags_are_warned() {
        let runner = json!({"executors": {"e": {"kind": "agent", "invocations": [
            {"via": "cli", "args": ["--model", "x"], "env": {"X_ACCOUNT_POOL": "1"}}]}}});
        let result = executor_profile_warnings(&runner);
        assert!(result.passed);
        assert!(result.message.contains("executor.e.policy-shaped-flags"));
        assert!(result.message.contains("account-pool-env.X_ACCOUNT_POOL"));
    }

    #[test]
    fn a_quarantined_account_fails_the_capacity_row_and_a_healthy_one_passes() {
        let healthy = json!({"providers": {"p": {"accounts": {"a": {"accountId": "a", "quarantine": null}}}}});
        assert!(provider_capacity_verdict(&healthy).passed);
        let held = json!({"providers": {"p": {"accounts": {"a": {"accountId": "a",
            "quarantine": {"reasonCode": "rate", "kind": "manual-clear"}}}}}});
        let result = provider_capacity_verdict(&held);
        assert!(!result.passed && result.message.contains("a:rate:manual-clear"));
        assert!(provider_capacity_verdict(&json!({"providers": {}})).passed);
    }

    #[test]
    fn a_confined_pane_without_an_account_pool_fails() {
        let runner = json!({"executors": {"e": {"providerModel": "claude", "invocations": [
            {"id": "i", "command": "claude", "credentialStore": {"use": "claude"}}]}}});
        let result =
            confined_pane_accounts(&runner, &serde_json::Map::new(), Path::new("/h"), &|_| true);
        assert!(
            !result.passed
                && result
                    .message
                    .contains("no runner.llmAccounts pool for claude")
        );
        let skipped =
            confined_pane_accounts(&runner, &serde_json::Map::new(), Path::new("/h"), &|_| {
                false
            });
        assert!(skipped.passed && skipped.message.contains("not installed"));
    }

    #[test]
    fn the_seat_binding_route_answers_ladder_at_its_protocol() {
        let result = seat_binding_route();
        assert!(result.passed, "{}", result.message);
        assert!(
            result.message.contains("protocol 2, hostVersion"),
            "{}",
            result.message
        );
    }
}
