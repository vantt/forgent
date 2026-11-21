//! Where a unit run is and what the machine around it says: the Git roots of its directory, the project's `.fgos`,
//! herdr, the writer id, the bundled pattern catalog, the committed runner config and the sweep of attempts nobody
//! finished. Each answer comes from the door that owns it; nothing is cached across calls.

use std::path::{Path, PathBuf};

use fgos_execution::decide::{CheckoutFacts, Workspace};
use fgos_execution::ports::Machine;
use fgos_execution::runner_config::{
    fgos_dir_from_root, load_runner_config as check_runner, DoorRead,
};
use fgos_execution_engine::unit_run::host::GitRoots;
use fgos_execution_engine::unit_run::run_unit_contract::{ErrorTag, RunUnitError};
use fgos_git::{GitDriver, RepoHandle, ResolveRepo};
use serde_json::{json, Value};

use crate::wiring::dispatch_decide::HostWorkspace;
use crate::wiring::seat_binding::HostMachine;

/// A path as the caller sees it once links are resolved, without Windows' verbatim prefix.
fn real(path: &Path) -> PathBuf {
    let resolved = std::fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf());
    fgos_process::path::plain_path(&resolved)
}

/// The Git door over this machine's state root.
fn driver() -> Result<GitDriver, String> {
    let helper = fgos_holder_lock::HelperExe::current().map_err(|e| e.to_string())?;
    GitDriver::new(&fgos_holder_lock::state_root::state_root().0)
        .map(|driver| driver.with_helper(helper))
        .map_err(|e| e.cause)
}

/// `resolveGitRoots` (`src/runner/execution/run.mjs:71`): the worktree and the trusted main checkout of `cwd`, read
/// through the Git door. A read-only caller in a directory that is no repository gets that directory as its own
/// project root; anything else outside a repository is refused with the sentence Node's `RunnerConfigError` carries.
pub fn git_roots(cwd: &Path, allow_no_repository: bool) -> Result<GitRoots, String> {
    let refused = |why: String| {
        format!(
            "fgos run must run inside a git repository (cwd: {}): {why}",
            cwd.display()
        )
    };
    let driver = driver().map_err(refused)?;
    match driver
        .resolve_repo(cwd, cwd)
        .map_err(|e| refused(e.cause))?
    {
        ResolveRepo::NotARepository if allow_no_repository => {
            let root = real(cwd);
            Ok(GitRoots {
                worktree_root: root.clone(),
                main_checkout_root: root,
                is_linked_worktree: false,
                not_a_repository: true,
            })
        }
        ResolveRepo::NotARepository => Err(refused("not a working repository".into())),
        ResolveRepo::Repository(repo) => {
            let Some(worktree) = repo.work_tree() else {
                return Err(refused("not a working repository".into()));
            };
            let (worktree_root, main_checkout_root) =
                (real(worktree), real(repo.trusted_main_root()));
            Ok(GitRoots {
                is_linked_worktree: worktree_root != main_checkout_root,
                worktree_root,
                main_checkout_root,
                not_a_repository: false,
            })
        }
    }
}

/// `fgosDirFromRoot` (`src/util/fgos-file-registry.mjs`): the project's `.fgos` under its main checkout.
pub fn fgos_dir(main_root: &Path) -> PathBuf {
    PathBuf::from(fgos_dir_from_root(&main_root.to_string_lossy()))
}

/// `detectHerdrPresent` (`src/runner/execution/run.mjs:64`): herdr as the process environment shows it, the
/// machine fact the seat-binding route reads.
pub fn herdr_present() -> bool {
    HostMachine::new(None, None).herdr_present()
}

/// `gitWriter` (`src/git/inspect.mjs:29`): this process's writer identity id, as text.
pub fn git_writer() -> String {
    fgos_identity::resolve_current().id.to_string()
}

/// `process.env.USER || 'system'` (`src/runner/execution/unit-run-start.mjs`, the record's `createdBy`).
pub fn created_by() -> String {
    std::env::var("USER")
        .ok()
        .filter(|user| !user.is_empty())
        .unwrap_or_else(|| "system".into())
}

/// `shippedCatalog` (`src/runner/dispatch/shipped-catalog.mjs:21`): the bundled standard's `runner.patterns` and
/// `runner.loops`, `{}` each when the standard names none.
pub fn shipped_catalog() -> Value {
    let runner = fgos_config::schema::Schemas::bundled()
        .ok()
        .and_then(|(schemas, _)| fgos_config::standard::Standard::bundled(&schemas).ok())
        .and_then(|standard| standard.value().get("runner").cloned())
        .unwrap_or(Value::Null);
    let section = |key: &str| runner.get(key).cloned().unwrap_or_else(|| json!({}));
    json!({ "patterns": section("patterns"), "loops": section("loops") })
}

/// The Git door over `worktree` with `main_root` as its trusted main checkout (`gitPortOptions`,
/// `src/git/inspect.mjs:35`).
pub fn git(worktree: &Path, main_root: &Path) -> Result<(GitDriver, RepoHandle), String> {
    let driver = driver()?;
    match driver
        .resolve_repo(worktree, main_root)
        .map_err(|e| e.cause)?
    {
        ResolveRepo::Repository(repo) => Ok((driver, repo)),
        ResolveRepo::NotARepository => Err(format!(
            "{} is not a working repository",
            worktree.display()
        )),
    }
}

/// `resolveMutatingCwdPosture(cwd).reason === 'main-checkout'` (`src/runner/dispatch/execution-contract.mjs:149`):
/// the repository root of `worktree` is its main checkout. Outside a repository, or a root that does not resolve,
/// is not the main checkout (the run refuses those elsewhere).
pub fn is_main_checkout(worktree: &Path) -> bool {
    let facts = HostWorkspace {
        process_cwd: worktree.to_path_buf(),
    };
    let dir = worktree.to_string_lossy();
    match (facts.main_checkout_root(&dir), facts.repo_root(&dir)) {
        (Some(main), Ok(root)) => main == root,
        _ => false,
    }
}

/// `sweepAttempts` (`src/run-supervisor/client.mjs:118`) as `run.mjs:303` calls it: adopt judges every attempt
/// directory under `assignments_root` that is not closed and finishes what a dead supervisor left, then the attempt
/// sockets no supervisor holds are removed. Best effort: what adopt judged comes back (the `sweep-attempts`
/// internal op reports it; a unit run ignores it).
pub fn sweep_attempts(assignments_root: &Path) -> fgos_run_supervisor::controller::sweep::Swept {
    use fgos_run_supervisor::controller::runtime_dir::{
        current_uid, process_env, remove_orphan_attempt_sockets,
    };
    let uid = cfg!(unix).then(current_uid);
    fgos_run_supervisor::controller::sweep::sweep_attempts(
        Some(assignments_root),
        false,
        None,
        || {
            remove_orphan_attempt_sockets(
                &process_env,
                uid,
                fgos_process::facts::bound_unix_socket_paths,
            );
        },
    )
}

/// A refusal of the runner config loader as the `run-unit` error the caller rethrows: its class tag, code and
/// message, and the `path`, `paths` and `detail` it carries.
fn runner_refusal(refusal: &Value) -> RunUnitError {
    let text = |key: &str| refusal.get(key).and_then(Value::as_str);
    let name = text("name").unwrap_or("Error");
    let mut error = RunUnitError::config(text("message").unwrap_or_default(), text("code"), None);
    error.tag = ErrorTag::parse(name).unwrap_or(ErrorTag::Error);
    if error.tag == ErrorTag::Error {
        error.error_class = "error".into();
        error = error.with("name", json!(name));
    }
    for key in ["path", "paths", "detail"] {
        if let Some(value) = refusal.get(key) {
            error = error.with(key, value.clone());
        }
    }
    error
}

/// `loadRunnerConfigForDir` (`src/runner/dispatch/config.mjs:316`): the project's runner section through the config
/// door (project over global over the standard, the detected executor filled in, nothing written), checked and its
/// confinement normalised by `fgos-execution`'s one composition. A refusal keeps the door's code.
pub fn load_runner_config(main_root: &Path) -> Result<Value, RunUnitError> {
    load_runner_config_with_origins(main_root).map(|(config, _)| config)
}

/// [`load_runner_config`] with the origins of its values (`runnerOriginsOf`, `src/runner/dispatch/config.mjs:82`),
/// which name the config layer a collaboration's pattern came from.
pub fn load_runner_config_with_origins(main_root: &Path) -> Result<(Value, Value), RunUnitError> {
    let root = main_root.to_string_lossy();
    let loaded = HostWorkspace {
        process_cwd: main_root.to_path_buf(),
    }
    .load_runner(&root)
    .map_err(|failure| match failure {
        fgos_execution::decide::DecideFailure::ConfigDoor { code, message } => {
            RunUnitError::config(message, Some(&code), None)
        }
        other => RunUnitError::config(other.message(), None, None),
    })?;
    let origins: Vec<Value> = loaded.origins.iter().map(|o| o.to_json()).collect();
    let door = DoorRead::Read {
        runner: loaded.runner,
        origins: origins.clone(),
    };
    check_runner(&root, door)
        .map(|checked| (checked.config, Value::Array(origins)))
        .map_err(|refused| runner_refusal(&refused.to_json()))
}
