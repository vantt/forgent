//! The execution doctor rows: what the runner config and the machine it names say about readiness. The
//! judgements are `fgos_execution::checks`'; this file reads the effective config through the config door and the
//! machine through the real one, hands both in, and words nothing itself.
//!
//! The config is read once per call (a failure is remembered, not read again per row). Two rows judge the config
//! as the runner loads it, after its semantic check (`executor-confinement`, `invocation-git-write-grants`; the
//! omp row takes its executors from it too): a config that does not load is not their finding, so they pass and
//! say so. The rest read the effective section as the door gives it.

use super::{config_refusal_text, judged, project_root_refusal, Rows};
use crate::wiring::process_env;
use crate::wiring::seat_binding::{HostMachine, HostProbe};
use fgos_config::detect::PathDetectors;
use fgos_config::snapshot::SnapshotError;
use fgos_distribution::doctor::FixResult;
use fgos_distribution::doctor::RowOutcome;
use fgos_execution::checks::{
    agy_sub_homes_configured, capability_serves_valid, cleaned, executor_confinement,
    invocation_git_write_grants, omp_executors_of, omp_natives_present, runner_generated_paths,
    tool_registry_configured, CheckResult, OmpHost, SubHomes,
};
use fgos_execution::decide::{load_checked_runner, DecideFailure, LoadedRunner, Workspace};
use fgos_execution::tools::tool_posture;
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

/// The effective runner section of the project at `root` as the config door gives it, or why it cannot.
fn effective_runner(root: &Path) -> Result<Value, String> {
    if let Some(refusal) = project_root_refusal(root) {
        return Err(refusal.to_owned());
    }
    let detectors = PathDetectors {
        path: std::env::var_os("PATH"),
    };
    let ctx = fgos_config::machine::context(&detectors)
        .map_err(|refusal| config_refusal_text(&refusal))?;
    let roots = fgos_config::provider::roots(root).map_err(|refusal| match refusal.reason {
        "git-read-failed" => format!("config-trusted-root-unresolved ({})", refusal.detail),
        _ => refusal.detail,
    })?;
    let snapshot = fgos_config::snapshot::snapshot(&ctx, &roots).map_err(|error| match error {
        SnapshotError::Refused(list) => list
            .iter()
            .map(config_refusal_text)
            .collect::<Vec<_>>()
            .join("; "),
        SnapshotError::Io(io) => format!("config-io ({:?})", io.kind()),
    })?;
    Ok(snapshot
        .value
        .get("runner")
        .cloned()
        .unwrap_or_else(|| json!({})))
}

/// The runner section read once; the runner's own semantic check runs on top of it for the rows that need a
/// loadable config.
struct Config<'a> {
    root: &'a Path,
    raw: OnceCell<Result<Value, String>>,
}

impl<'a> Config<'a> {
    fn new(root: &'a Path) -> Self {
        Config {
            root,
            raw: OnceCell::new(),
        }
    }

    fn raw(&self) -> &Result<Value, String> {
        self.raw.get_or_init(|| effective_runner(self.root))
    }

    /// The runner config as the loader returns it, or what it refused with.
    fn loaded(&self) -> Result<Value, String> {
        let door = LoadedDoor { config: self };
        load_checked_runner(&door, &self.root.to_string_lossy())
            .map(|(runner, _)| runner)
            .map_err(|failure| failure.message().to_owned())
    }
}

/// The part of the decision's `Workspace` the runner check reads: the project's effective runner section. Nothing
/// else of the workspace is asked of it.
struct LoadedDoor<'a, 'b> {
    config: &'b Config<'a>,
}

impl Workspace for LoadedDoor<'_, '_> {
    fn repo_root(&self, dir: &str) -> Result<String, String> {
        Ok(dir.to_owned())
    }
    fn main_checkout_root(&self, dir: &str) -> Option<String> {
        Some(dir.to_owned())
    }
    fn process_main_checkout_root(&self) -> Option<String> {
        None
    }
    fn project_config_present(&self, _root: &str) -> bool {
        true
    }
    fn load_runner(&self, _root: &str) -> Result<LoadedRunner, DecideFailure> {
        match self.config.raw() {
            Ok(runner) => Ok(LoadedRunner {
                runner: runner.clone(),
                origins: Vec::new(),
            }),
            Err(message) => Err(DecideFailure::ConfigDoor {
                code: "config-io".to_owned(),
                message: message.clone(),
            }),
        }
    }
    fn fgos_dir(&self, root: &str) -> String {
        Path::new(root).join(".fgos").to_string_lossy().into_owned()
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
        .map(|id| match *id {
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
                let runner = config.raw().as_ref().cloned().unwrap_or_else(|_| json!({}));
                row(agy_sub_homes_configured(
                    &runner,
                    &HostHomes {
                        home: home_of(&env).to_string_lossy().into_owned(),
                    },
                ))
            }
            "tool-registry-configured" => tool_row(root),
            other => unreachable!("execution group asked for row {other}"),
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
    judge: fn(&Value) -> CheckResult,
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
    let runner = match effective_runner(&main) {
        Ok(runner) => runner,
        Err(message) => return judged(false, message),
    };
    let machine = HostMachine::new(None, None);
    let probe = HostProbe::new(&machine, Some(main));
    row(tool_registry_configured(&tool_posture(&runner, &probe)))
}
