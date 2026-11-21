//! The execution doctor rows: what the runner config and the machine it names say about readiness. Every row is
//! judged and worded by `fgos_execution::checks` except `seat-binding-route`, which asks this binary's own route
//! and is judged here. This file only reads: the effective config through the config door, the machine, the files,
//! the account stores, the agent tiers and the prompt templates through the real doors, and hands the results to
//! the judgement.
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
use fgos_execution::accounts::provider_account_inventory;
use fgos_execution::checks::{
    agent_type_names_unique, agy_sub_homes_configured, capability_serves_valid, cleaned,
    confined_pane_accounts, executor_confinement, executor_family_unique,
    executor_profile_warnings, executor_skills_installed, invocation_git_write_grants,
    llm_accounts_default_login_home, llm_accounts_shape, model_policy_pools, omp_executors_of,
    omp_natives_present, operation_prompt_templates_valid, provider_capacity_verdict,
    runner_generated_paths, session_keep_declared, tier_fallback, tool_registry_configured,
    CheckResult, HostFiles, OmpHost, SubHomes,
};
use fgos_execution::decide::{check_loaded_runner, LoadedRunner, Workspace};
use fgos_execution::tools::tool_posture;
use fgos_execution_engine::accounts::login_homes::default_login_home_stores;
use fgos_execution_engine::accounts::{Accounts, SystemHost as AccountsHost};
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
    "agent-type-names-unique",
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
                    executor_skills_installed(runner, &checkout, &home_of(&env), &machine, &HostFs)
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
                        default_login_home_row(runner, &home_of(&env), &env)
                    })
                }
                "agent-type-names-unique" => match crate::active_payload_root() {
                    Ok(payload) => row(agent_type_names_row(root, &payload)),
                    Err(cause) => judged(
                        false,
                        format!(
                            "the legacy payload cannot be resolved, so the tiers a project's agent definitions replace are unknown: {cause}"
                        ),
                    ),
                },
                "executor-profile-warnings" => with_loaded(
                    &config,
                    "executor-profile warnings not evaluated",
                    |runner| executor_profile_warnings(runner, &extract_policy_shaped_flags),
                ),
                "session-keep-declared" => with_loaded(
                    &config,
                    "session directories not evaluated",
                    session_keep_declared,
                ),
                "provider-capacity-state" => row(provider_capacity_state()),
                "confined-pane-accounts" => confined_pane_accounts_row(&config, &home_of(&env)),
                "operation-prompt-templates-valid" => row(prompt_templates_row(
                    root,
                    crate::active_payload_root().unwrap_or_else(|_| root.to_path_buf()),
                )),
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

// ---- reading for the rows ---------------------------------------------------------------------------------

/// The files a row reads, from the real file system.
struct HostFs;

impl HostFiles for HostFs {
    fn read_text(&self, file: &Path) -> Option<String> {
        std::fs::read_to_string(file).ok()
    }

    fn exists(&self, path: &Path) -> bool {
        path.exists()
    }
}

/// The stores sitting on a CLI's default login home, read from the real home and environment.
fn default_login_home_row(runner: &Value, home: &Path, env: &[(String, String)]) -> CheckResult {
    let lookup = |key: &str| {
        env.iter()
            .find(|(k, _)| k == key)
            .map(|(_, value)| value.clone())
    };
    llm_accounts_default_login_home(&default_login_home_stores(
        runner,
        &home.to_string_lossy(),
        &lookup,
    ))
}

/// Provider-capacity state of the machine's account inventory, read through the accounts reader.
fn provider_capacity_state() -> CheckResult {
    let runner = match super::confinement::machine_runner() {
        Ok(runner) => runner,
        Err(reason) => {
            return CheckResult {
                passed: false,
                message: format!("provider-capacity state unreadable: {reason}"),
            }
        }
    };
    let inventory = provider_account_inventory(&runner, &HostMachine::new(None, None));
    let host = AccountsHost::new();
    match Accounts::from_environment(&host) {
        Ok(accounts) => {
            provider_capacity_verdict(&accounts.inspect_provider_capacity(&inventory, None, None))
        }
        Err(error) => CheckResult {
            passed: false,
            message: format!("provider-capacity state unreadable: {error}"),
        },
    }
}

/// The executors a confined-pane row judges: the project's loaded config, else the machine's own executors.
fn confined_pane_accounts_row(config: &Config, home: &Path) -> RowOutcome {
    let machine = HostMachine::new(None, None);
    let global = super::confinement::machine_runner();
    let inventory = match &global {
        Ok(runner) => provider_account_inventory(runner, &machine),
        Err(reason) => {
            return judged(
                false,
                format!("provider account inventory is unreadable: {reason}"),
            )
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
                return judged(
                    true,
                    format!(
                        "runner config not loadable here, confined pane accounts not evaluated: {message}"
                    ),
                )
            }
        },
    };
    row(confined_pane_accounts(
        &runner, &inventory, home, &machine, &HostFs,
    ))
}

/// The agent tiers of the project and the installed release, read from disk and judged.
fn agent_type_names_row(project: &Path, payload: &Path) -> CheckResult {
    use crate::wiring::dispatch_decide::resolve_path;
    let (tiers, shipped) = crate::wiring::agents::tiers_of(project, payload);
    // A tier is the project's when its folder is not inside the installed release.
    let inside_install = resolve_path(&project.to_string_lossy(), Path::new("/"))
        .starts_with(resolve_path(&payload.to_string_lossy(), Path::new("/")));
    agent_type_names_unique(&tiers, shipped.as_deref(), !inside_install)
}

/// The project's operation prompt templates, discovered by the engine and judged.
fn prompt_templates_row(root: &Path, package_root: PathBuf) -> CheckResult {
    let roots = TemplateRoots {
        cwd: root.to_path_buf(),
        package_root,
    };
    match discover_project_prompt_templates(&roots) {
        Ok(found) => operation_prompt_templates_valid(Ok(found.len())),
        Err(error) => operation_prompt_templates_valid(Err(&error.message)),
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
        return CheckResult {
            passed: false,
            message: format!("{exe} -> {code_name}: {message}"),
        };
    }
    let tiers = answer
        .pointer("/ladder/vocabulary")
        .and_then(Value::as_array)
        .map_or(0, Vec::len);
    CheckResult {
        passed: true,
        message: format!(
            "{exe} (host in reach) answers ladder at protocol {protocol}, hostVersion {}, {tiers} tiers",
            answer.get("hostVersion").and_then(Value::as_str).unwrap_or_default()
        ),
    }
}

#[cfg(test)]
mod row_tests {
    use super::*;

    /// A fresh directory with `files` (relative path, text) written under it.
    fn tree(name: &str, files: &[(&str, &str)]) -> PathBuf {
        let dir =
            std::env::temp_dir().join(format!("fgos-agent-row-{name}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        for (rel, text) in files {
            let file = dir.join(rel);
            std::fs::create_dir_all(file.parent().unwrap()).unwrap();
            std::fs::write(file, text).unwrap();
        }
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn a_project_template_with_a_forbidden_variable_fails_and_a_broken_packaged_one_is_not_read() {
        let package = tree(
            "templates-package",
            &[(
                "core/prompt-templates/broken.md",
                "Forbidden: {forbiddenVar}",
            )],
        );
        let plain = tree("templates-plain", &[]);
        let clean = prompt_templates_row(&plain, package.clone());
        assert!(clean.passed, "{}", clean.message);
        assert!(
            clean
                .message
                .starts_with("0 project operation prompt template"),
            "{}",
            clean.message
        );
        let project = tree(
            "templates-project",
            &[(
                ".fgos/prompt-templates/invalid-tmpl.md",
                "Forbidden: {forbiddenVar}",
            )],
        );
        let broken = prompt_templates_row(&project, package.clone());
        assert!(!broken.passed);
        assert!(
            broken
                .message
                .starts_with("malformed operation prompt template -- ")
                && broken.message.contains("forbiddenVar"),
            "{}",
            broken.message
        );
        for dir in [package, plain, project] {
            let _ = std::fs::remove_dir_all(dir);
        }
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
