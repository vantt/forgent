//! The packaging doctor rows: what the install gave this machine and this project. Hook wiring of the five agent
//! CLIs (`agent_hooks`), the reports on a person's own agent config (`agent_config`; reports only, the one verb
//! that writes it is `wire-agents`), the project launcher, the version the build shows, the tools `fgctl init`
//! and the confinement rely on, and the global `fgos` path cache.
//!
//! Each row calls the packaging module that owns its job and words the answer; none re-derives a fact. The shim
//! probe of the hook rows runs inside `agent_hooks` through the process door (the project's own shim, never Node).

use super::{judged, Rows};
use fgos_distribution::agent_config::{
    check_agy_permissions_configured, check_claude_plugin_marketplace, check_mailbox_claude_accept,
    claude_user_settings, program_on_path,
};
use fgos_distribution::agent_hooks::{
    check_hook, install_hook, install_message, mailbox_opt_in, BoundedRunner, HookCheck, ProbeMemo,
};
use fgos_distribution::bin_cache::refresh_global_bin_cache;
use fgos_distribution::doctor::{FixResult, RowOutcome};
use fgos_distribution::launcher::{
    check_project_launcher, fix_project_launcher, source_checkout, LauncherCheck, SearchPath,
};
use fgos_distribution::{resolve_git_commit, resolve_package_version, resolve_product_root};
use std::io;
use std::path::{Path, PathBuf};
use std::time::Duration;

pub const ROWS: &[&str] = &[
    "cli-version-visible",
    "project-fgos-launcher",
    "dispatch-decide-hook-wired",
    "codex-hook-wired",
    "agy-hook-wired",
    "omp-hook-wired",
    "pi-hook-wired",
    "agy-permissions-configured",
    "curl-available",
    "bwrap-available",
    "mailbox-claude-accept",
    "claude-plugin-marketplace",
];

pub const FIXES: &[&str] = &[
    "project-fgos-launcher",
    "dispatch-decide-hook-wired",
    "codex-hook-wired",
    "agy-hook-wired",
    "omp-hook-wired",
    "pi-hook-wired",
    "bin-discovery-cache",
];

pub const GROUP: Rows = Rows {
    rows: ROWS,
    fixes: FIXES,
    judge,
    fix,
};

/// The process environment as the packaging readers take it. A variable whose name or value is not UTF-8 is left
/// out.
fn process_env() -> Vec<(String, String)> {
    std::env::vars_os()
        .filter_map(|(key, value)| Some((key.into_string().ok()?, value.into_string().ok()?)))
        .collect()
}

fn var(env: &[(String, String)], key: &str) -> Option<String> {
    env.iter().find(|(k, _)| k == key).map(|(_, v)| v.clone())
}

fn home_of(env: &[(String, String)]) -> Option<PathBuf> {
    fgos_config::machine::home_dir(|key| var(env, key))
}

/// What a row says when the agent-config readers have no home directory to read under.
fn no_home(what: &str) -> RowOutcome {
    judged(
        false,
        format!("{}; {what}", fgos_config::machine::home_unset_message()),
    )
}

fn judge(root: &Path, ids: &[&str]) -> Vec<RowOutcome> {
    let env = process_env();
    // The rows of one call share the shim probes of the hook rows: each distinct probe runs once.
    let memo = ProbeMemo::default();
    ids.iter()
        .map(|id| match *id {
            "cli-version-visible" => version_row(),
            "project-fgos-launcher" => launcher_row(&env),
            "dispatch-decide-hook-wired" => agent_hook_row(root, "claude", &env, &memo),
            "codex-hook-wired" => agent_hook_row(root, "codex", &env, &memo),
            "agy-hook-wired" => agent_hook_row(root, "agy", &env, &memo),
            "omp-hook-wired" => agent_hook_row(root, "omp", &env, &memo),
            "pi-hook-wired" => agent_hook_row(root, "pi", &env, &memo),
            "agy-permissions-configured" => agy_permissions_row(&env),
            "curl-available" => curl_row(&env),
            "bwrap-available" => bwrap_row(&env),
            "mailbox-claude-accept" => mailbox_accept_row(root, &env),
            "claude-plugin-marketplace" => {
                let check = check_claude_plugin_marketplace(&env, &BoundedRunner);
                judged(check.passed, check.message)
            }
            other => unreachable!("packaging group asked for row {other}"),
        })
        .collect()
}

fn fix(root: &Path, ids: &[&str]) -> Vec<FixResult> {
    let env = process_env();
    ids.iter()
        .map(|id| match *id {
            "project-fgos-launcher" => launcher_fix(id, &env),
            "dispatch-decide-hook-wired" => agent_hook_fix(root, id, "claude"),
            "codex-hook-wired" => agent_hook_fix(root, id, "codex"),
            "agy-hook-wired" => agent_hook_fix(root, id, "agy"),
            "omp-hook-wired" => agent_hook_fix(root, id, "omp"),
            "pi-hook-wired" => agent_hook_fix(root, id, "pi"),
            "bin-discovery-cache" => bin_cache_fix(id, &env),
            other => unreachable!("packaging group asked for fix {other}"),
        })
        .collect()
}

/// A fix that answers `{ fixed, message }` says nothing about `changed`, as its report entry always did.
fn said(id: &str, message: String) -> FixResult {
    FixResult {
        id: id.to_owned(),
        changed: None,
        message: Some(message),
    }
}

// cli-version-visible ----------------------------------------------------------------------------------------

/// The running build's own version and commit made legible on demand: the first thing to compare when a verb
/// answers differently from what its source says. The commit is read only where the build sits in a checkout.
fn version_row() -> RowOutcome {
    version_text(&resolve_package_version(), resolve_git_commit().as_deref())
}

fn version_text(version: &str, commit: Option<&str>) -> RowOutcome {
    if version.is_empty() {
        return judged(false, "the build did not resolve a package version");
    }
    let commit = commit.map_or(
        " (no git commit -- not a git checkout)".to_owned(),
        |commit| format!(" ({commit})"),
    );
    judged(true, format!("fgos {version}{commit}"))
}

// project-fgos-launcher ---------------------------------------------------------------------------------------

fn pathext_of(env: &[(String, String)]) -> String {
    var(env, "PATHEXT").unwrap_or_else(|| ".EXE;.CMD;.BAT".to_owned())
}

fn launcher_row(env: &[(String, String)]) -> RowOutcome {
    let path = var(env, "PATH").unwrap_or_default();
    let pathext = pathext_of(env);
    let search = SearchPath {
        path: &path,
        pathext: &pathext,
        windows: cfg!(windows),
    };
    let from_source = resolve_product_root().is_some_and(|root| source_checkout(&root));
    let LauncherCheck { passed, message } = check_project_launcher(search, from_source);
    judged(passed, message)
}

fn launcher_fix(id: &str, env: &[(String, String)]) -> FixResult {
    let path = var(env, "PATH").unwrap_or_default();
    let pathext = pathext_of(env);
    let search = SearchPath {
        path: &path,
        pathext: &pathext,
        windows: cfg!(windows),
    };
    match fix_project_launcher(search) {
        Ok(fixed) => said(id, fixed.message),
        Err(failure) => FixResult::done(id, false, failure.to_string()),
    }
}

// The hook rows and their fixes -------------------------------------------------------------------------------

fn agent_hook_row(
    root: &Path,
    cli: &str,
    env: &[(String, String)],
    memo: &ProbeMemo,
) -> RowOutcome {
    match check_hook(
        root,
        cli,
        &|key| std::env::var(key).ok(),
        env,
        &BoundedRunner,
        Some(memo),
    ) {
        Ok(HookCheck { passed, message }) => judged(passed, message),
        Err(failure) => judged(false, failure.to_string()),
    }
}

fn agent_hook_fix(root: &Path, id: &str, cli: &str) -> FixResult {
    match install_hook(root, cli, &|key| std::env::var(key).ok()) {
        Ok(result) => said(id, install_message(cli, &result)),
        Err(failure) => FixResult::done(id, false, failure.to_string()),
    }
}

// The reports on a person's own agent config -----------------------------------------------------------------

fn agy_permissions_row(env: &[(String, String)]) -> RowOutcome {
    let present = program_on_path("agy", env).is_some();
    let home = home_of(env);
    if present && home.is_none() {
        return no_home("agy's settings cannot be read");
    }
    let check = check_agy_permissions_configured(&home.unwrap_or_default(), present);
    judged(check.passed, check.message)
}

fn mailbox_accept_row(root: &Path, env: &[(String, String)]) -> RowOutcome {
    let opt_in = match mailbox_opt_in(root, &|key| std::env::var(key).ok()) {
        Ok(opt_in) => opt_in,
        Err(failure) => return judged(false, failure.to_string()),
    };
    // Where Claude Code keeps its settings is read from the environment alone; with no home and no
    // CLAUDE_CONFIG_DIR the row has nowhere to look, which only matters once the project opted in.
    let home = home_of(env);
    if home.is_none() && var(env, "CLAUDE_CONFIG_DIR").is_none_or(|dir| dir.is_empty()) {
        if opt_in != fgos_distribution::agent_hooks::MailboxOptIn::On {
            return judged(true, "mailbox is not enabled here; no accept needed");
        }
        return no_home("Claude Code's settings cannot be read");
    }
    let location = claude_user_settings(env, &home.unwrap_or_default());
    let check = check_mailbox_claude_accept(&location, &opt_in);
    judged(check.passed, check.message)
}

// curl-available and bwrap-available ------------------------------------------------------------------------

const TOOL_TIMEOUT: Duration = Duration::from_secs(15);

/// How one run of a tool on the search path ended, as the rows word it.
enum Ran {
    Ok,
    /// The name an OS error carries (`ENOENT`) or the line the Node CLI gave (`Command failed: ...`).
    Failed(String),
}

fn run_tool(program: &str, args: &[&str], env: &[(String, String)]) -> Ran {
    let command_line = format!("{program} {}", args.join(" "));
    let args: Vec<String> = args.iter().map(|a| (*a).to_owned()).collect();
    match fgos_process::spawn::run_bounded(program, &args, env, None, None, TOOL_TIMEOUT) {
        Ok(fgos_process::spawn::Outcome::Exited(out)) if out.status.success() => Ran::Ok,
        Ok(fgos_process::spawn::Outcome::Exited(_)) => {
            Ran::Failed(format!("Command failed: {command_line}"))
        }
        Ok(fgos_process::spawn::Outcome::TimedOut { .. }) => Ran::Failed(format!(
            "{command_line} did not finish within {} seconds",
            TOOL_TIMEOUT.as_secs()
        )),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ran::Failed("ENOENT".to_owned()),
        Err(error) => Ran::Failed(error.to_string()),
    }
}

/// `fgctl init` shells out to the system `curl` when it downloads a release. A machine that only ever installs
/// from a local path never needs it, so a missing curl is a warning, not a failure.
fn curl_row(env: &[(String, String)]) -> RowOutcome {
    match run_tool("curl", &["--version"], env) {
        Ran::Ok => judged(true, "curl is available on PATH"),
        Ran::Failed(cause) => judged(true, format!("warning: curl is not usable on PATH ({cause}); fgctl init cannot download a release -- install curl or pass a local --from path")),
    }
}

fn bwrap_row(env: &[(String, String)]) -> RowOutcome {
    match run_tool("bwrap", &["--ro-bind", "/", "/", "--", "true"], env) {
        Ran::Ok => judged(
            true,
            "bwrap is available on PATH and smoke test (bwrap --ro-bind / / -- true) passed",
        ),
        Ran::Failed(cause) => {
            let cause = if cause == "ENOENT" {
                "spawnSync bwrap ENOENT".to_owned()
            } else {
                cause
            };
            judged(
                false,
                format!("bwrap is unavailable or failed smoke test: {cause}"),
            )
        }
    }
}

// bin-discovery-cache (fix) -----------------------------------------------------------------------------------

/// The cache of the global `fgos` path is filled and refreshed only here, from `fgos doctor --fix`, never on
/// every lookup: it caches a `PATH` probe so the probe is not run again. Idempotent and always safe to re-run.
fn bin_cache_fix(id: &str, env: &[(String, String)]) -> FixResult {
    let Some(global) = fgos_config::machine::global_dir(|key| var(env, key)) else {
        return FixResult::done(id, false, fgos_config::machine::home_unset_message());
    };
    let path = var(env, "PATH").unwrap_or_default();
    match refresh_global_bin_cache(&global, &path, &pathext_of(env), cfg!(windows)) {
        Ok(done) => FixResult::done(id, done.changed, bin_cache_message(&done)),
        Err(failure) => FixResult::done(id, false, failure.to_string()),
    }
}

fn bin_cache_message(done: &fgos_distribution::bin_cache::Refreshed) -> String {
    let found = done
        .resolved
        .as_ref()
        .map(|path| path.display().to_string());
    match (done.changed, found) {
        (false, Some(path)) => format!("global bin-discovery cache already up to date: {path}"),
        (false, None) => "global bin-discovery cache already empty (no fgos on PATH)".to_owned(),
        (true, Some(path)) => format!("global bin-discovery cache refreshed: {path}"),
        (true, None) => "global bin-discovery cache cleared (no fgos on PATH)".to_owned(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn said_by(outcome: RowOutcome) -> (bool, String) {
        match outcome {
            RowOutcome::Judged(row) => (row.passed, row.message.unwrap()),
            RowOutcome::Unavailable { message, .. } => panic!("{message}"),
        }
    }

    #[test]
    fn the_version_row_names_the_version_and_the_commit_of_a_checkout_or_says_there_is_none() {
        assert_eq!(
            said_by(version_text("1.2.3", Some("0123456789ab"))),
            (true, "fgos 1.2.3 (0123456789ab)".to_owned())
        );
        assert_eq!(
            said_by(version_text("1.2.3", None)),
            (
                true,
                "fgos 1.2.3 (no git commit -- not a git checkout)".to_owned()
            )
        );
        assert!(!said_by(version_text("", None)).0);
    }

    #[test]
    fn a_missing_tool_is_the_os_error_name_and_a_failing_one_the_command_line() {
        let env: Vec<(String, String)> = vec![("PATH".to_owned(), String::new())];
        match run_tool("fgos-no-such-tool", &["--version"], &env) {
            Ran::Failed(cause) => assert_eq!(cause, "ENOENT"),
            Ran::Ok => panic!("a tool that does not exist ran"),
        }
        let (passed, message) = said_by(curl_row(&env));
        assert!(passed, "a missing curl is a warning, never a failure");
        assert!(
            message.starts_with("warning: curl is not usable on PATH (ENOENT); fgctl init cannot download a release"),
            "{message}"
        );
        let (passed, message) = said_by(bwrap_row(&env));
        assert!(!passed);
        assert_eq!(
            message,
            "bwrap is unavailable or failed smoke test: spawnSync bwrap ENOENT"
        );
    }

    #[cfg(unix)]
    #[test]
    fn a_tool_that_runs_passes_and_one_that_exits_non_zero_names_what_it_ran() {
        let env: Vec<(String, String)> = vec![("PATH".to_owned(), "/usr/bin:/bin".to_owned())];
        assert!(matches!(run_tool("true", &[], &env), Ran::Ok));
        match run_tool("false", &["--version"], &env) {
            Ran::Failed(cause) => assert_eq!(cause, "Command failed: false --version"),
            Ran::Ok => panic!("false succeeded"),
        }
    }

    #[test]
    fn the_cache_fix_words_each_of_its_four_outcomes() {
        use fgos_distribution::bin_cache::Refreshed;
        let found = Some(PathBuf::from("/opt/fgos/bin/fgos"));
        let say = |changed, resolved| bin_cache_message(&Refreshed { resolved, changed });
        assert_eq!(
            say(false, found.clone()),
            "global bin-discovery cache already up to date: /opt/fgos/bin/fgos"
        );
        assert_eq!(
            say(false, None),
            "global bin-discovery cache already empty (no fgos on PATH)"
        );
        assert_eq!(
            say(true, found),
            "global bin-discovery cache refreshed: /opt/fgos/bin/fgos"
        );
        assert_eq!(
            say(true, None),
            "global bin-discovery cache cleared (no fgos on PATH)"
        );
    }

    #[test]
    fn the_group_names_exactly_the_rows_and_fixes_the_registry_gives_to_packaging_in_run_order() {
        let registry = crate::wiring::doctor::registry().unwrap();
        let mine = |id: &str| ROWS.contains(&id) || FIXES.contains(&id);
        let rows: Vec<&str> = registry
            .rows
            .iter()
            .map(|r| r.id.as_str())
            .filter(|id| ROWS.contains(id))
            .collect();
        assert_eq!(
            rows, ROWS,
            "the registry runs the rows in the order the group lists them"
        );
        let fixes: Vec<&str> = registry
            .fixes
            .iter()
            .map(|f| f.id.as_str())
            .filter(|id| FIXES.contains(id))
            .collect();
        assert_eq!(fixes, FIXES);
        assert!(mine("curl-available"));
        for id in ROWS {
            let row = registry.rows.iter().find(|r| r.id == *id).unwrap();
            assert_eq!(row.owner.label, "packaging", "{id}");
        }
    }
}
