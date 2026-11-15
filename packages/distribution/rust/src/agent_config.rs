//! A person's own agent config, read and planned: the readers behind the doctor rows that report it and
//! the `wire-agents` plan.
//!
//! fgOS changes a person's own agent config (the Claude config directory, `~/.gemini`, ...) only through the
//! opt-in `fgos wire-agents`; `fgos init` and `fgos doctor --fix` write only into the project and `~/.fgos`.
//! Everything here reads. A setting that widens what an agent may do (agy's `toolPermission:
//! always-proceed`, Claude's `crossSessionInbound: accept`) is never written: the plan shows the file, the
//! value and why, and the person decides.
//!
//! `claude` is started through the process door (`ProcessRunner`), with the environment the caller names;
//! on Windows the program is resolved with PATHEXT so `claude.cmd` runs.

use std::path::{Path, PathBuf};
use std::time::Duration;

use serde::Serialize;
use serde_json::{json, Value};

use crate::agent_hooks::{mailbox_opt_in, AgentHooksError, Env, MailboxOptIn, ProcessRunner};

/// The environment key an executor's home is read from.
const HOME_KEY: &str = "HOME";

pub const WIRE_AGENTS_COMMAND: &str = "fgos wire-agents";
pub const CLAUDE_PLUGIN_MARKETPLACE_NAME: &str = "fgos-plugins";
/// The marketplace is added by its GitHub source, never a local path: an installed payload does not ship
/// `plugins/` or `.claude-plugin/`. The check accepts an entry under the marketplace's name from any source.
pub const CLAUDE_PLUGIN_MARKETPLACE_GITHUB_SOURCE: &str = "vantt/forgent";
pub const CLAUDE_PLUGIN_REF: &str = "fgOS@fgos-plugins";

/// The longest a `claude` question may take; the CLI answers in about half a second.
const CLAUDE_TIMEOUT: Duration = Duration::from_secs(30);

/// The caller's environment as a full list, with the lookups the readers need.
fn lookup<'a>(env: &'a [(String, String)]) -> impl Fn(&str) -> Option<String> + 'a {
    move |key| {
        env.iter()
            .find(|(k, _)| {
                if cfg!(windows) {
                    k.eq_ignore_ascii_case(key)
                } else {
                    k == key
                }
            })
            .map(|(_, v)| v.clone())
    }
}

/// The first executable `name` on the `PATH` of `env` (PATHEXT on Windows).
pub fn program_on_path(name: &str, env: &[(String, String)]) -> Option<PathBuf> {
    let get = lookup(env);
    let pathext = get("PATHEXT").unwrap_or_else(|| ".EXE;.CMD;.BAT".to_string());
    fgos_process::spawn::resolve_program(name, &get("PATH")?, &pathext, cfg!(windows))
}

// ---------------------------------------------------------------------------------------------------------
// claude
// ---------------------------------------------------------------------------------------------------------

/// The `claude` binary the checks and the plan run; tests point `FGOS_CLAUDE_COMMAND` at a fake so no suite
/// run ever calls the real one.
fn claude_program(env: &[(String, String)], windows: bool) -> std::ffi::OsString {
    let get = lookup(env);
    let command = get("FGOS_CLAUDE_COMMAND")
        .filter(|c| !c.is_empty())
        .unwrap_or_else(|| "claude".to_string());
    let pathext = get("PATHEXT").unwrap_or_else(|| ".EXE;.CMD;.BAT".to_string());
    let found = get("PATH")
        .and_then(|path| fgos_process::spawn::resolve_program(&command, &path, &pathext, windows));
    found.map_or_else(|| command.into(), PathBuf::into_os_string)
}

/// `claude <args>`'s standard output, or `None` when it cannot start, times out or exits non-zero.
fn run_claude(
    args: &[&str],
    env: &[(String, String)],
    runner: &dyn ProcessRunner,
) -> Option<String> {
    let args: Vec<String> = args.iter().map(|a| (*a).to_string()).collect();
    match runner.run(
        &claude_program(env, cfg!(windows)),
        &args,
        env,
        None,
        None,
        CLAUDE_TIMEOUT,
    ) {
        Ok(fgos_process::spawn::Outcome::Exited(out)) if out.status.success() => {
            Some(String::from_utf8_lossy(&out.stdout).into_owned())
        }
        _ => None,
    }
}

/// The longest a step that changes Claude's state may take: it can fetch a marketplace over the network.
const CLAUDE_STEP_TIMEOUT: Duration = Duration::from_secs(600);

/// Runs one step of a change (`claude <args>`) and says why it failed: the standard error when the program wrote
/// any, else the line the Node CLI gave (`Command failed: <command> <args>`, `spawnSync <command> ENOENT`).
pub fn run_claude_step(
    args: &[String],
    env: &[(String, String)],
    runner: &dyn ProcessRunner,
) -> Result<(), String> {
    let get = lookup(env);
    let name = get("FGOS_CLAUDE_COMMAND")
        .filter(|c| !c.is_empty())
        .unwrap_or_else(|| "claude".to_string());
    let command_line = || format!("{name} {}", args.join(" "));
    match runner.run(
        &claude_program(env, cfg!(windows)),
        args,
        env,
        None,
        None,
        CLAUDE_STEP_TIMEOUT,
    ) {
        Ok(fgos_process::spawn::Outcome::Exited(out)) if out.status.success() => Ok(()),
        Ok(fgos_process::spawn::Outcome::Exited(out)) => {
            let stderr = String::from_utf8_lossy(&out.stderr);
            Err(match stderr.trim() {
                "" => format!("Command failed: {}", command_line()),
                detail => detail.to_string(),
            })
        }
        Ok(fgos_process::spawn::Outcome::TimedOut { .. }) => Err(format!(
            "{} did not finish within {} seconds",
            command_line(),
            CLAUDE_STEP_TIMEOUT.as_secs()
        )),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            Err(format!("spawnSync {name} ENOENT"))
        }
        Err(error) => Err(format!("spawnSync {name} {error}")),
    }
}

/// `claude plugin marketplace list --json` and `claude plugin list --json` print a JSON array; a failed run
/// or unparsable output is `None`.
fn claude_plugin_json(
    args: &[&str],
    env: &[(String, String)],
    runner: &dyn ProcessRunner,
) -> Option<Vec<Value>> {
    match serde_json::from_str::<Value>(&run_claude(args, env, runner)?) {
        Ok(Value::Array(list)) => Some(list),
        _ => None,
    }
}

fn has_marketplace(marketplaces: &[Value]) -> bool {
    marketplaces
        .iter()
        .any(|m| m.get("name").and_then(Value::as_str) == Some(CLAUDE_PLUGIN_MARKETPLACE_NAME))
}

fn plugin_enabled(plugins: &[Value]) -> bool {
    plugins.iter().any(|p| {
        p.get("id")
            .and_then(Value::as_str)
            .is_some_and(|id| id.starts_with("fgOS@"))
            && p.get("enabled") == Some(&Value::Bool(true))
    })
}

/// A doctor verdict that reports and never writes.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Verdict {
    pub passed: bool,
    pub message: String,
}

fn verdict(passed: bool, message: impl Into<String>) -> Verdict {
    Verdict {
        passed,
        message: message.into(),
    }
}

/// Row `claude-plugin-marketplace`: reports, never writes. A missing plugin is a choice the person may make
/// (global agent config is opt-in), so it warns and names `fgos wire-agents`; only a `claude` that cannot
/// answer its own plugin listing fails. The three `claude` questions run together.
pub fn check_claude_plugin_marketplace(
    env: &[(String, String)],
    runner: &(dyn ProcessRunner + Sync),
) -> Verdict {
    let (present, marketplaces, plugins) = std::thread::scope(|scope| {
        let present = scope.spawn(|| run_claude(&["--version"], env, runner).is_some());
        let marketplaces = scope.spawn(|| {
            claude_plugin_json(&["plugin", "marketplace", "list", "--json"], env, runner)
        });
        let plugins =
            scope.spawn(|| claude_plugin_json(&["plugin", "list", "--json"], env, runner));
        (
            present.join().unwrap_or(false),
            marketplaces.join().unwrap_or(None),
            plugins.join().unwrap_or(None),
        )
    });
    if !present {
        return verdict(
            true,
            "claude CLI not found on PATH \u{2014} nothing to check (Claude Code plugin surface not applicable here)",
        );
    }
    let Some(marketplaces) = marketplaces else {
        return verdict(
            false,
            "\"claude plugin marketplace list --json\" failed to run or parse",
        );
    };
    if !has_marketplace(&marketplaces) {
        return verdict(
            true,
            format!("warning: Claude Code marketplace \"{CLAUDE_PLUGIN_MARKETPLACE_NAME}\" not configured, so the /fgOS:* plugin skills are missing; installing it is your choice: run {WIRE_AGENTS_COMMAND} (opt-in: it changes your Claude config, backs it up first)"),
        );
    }
    let Some(plugins) = plugins else {
        return verdict(
            false,
            "\"claude plugin list --json\" failed to run or parse",
        );
    };
    if !plugin_enabled(&plugins) {
        return verdict(
            true,
            format!("warning: fgOS Claude Code plugin not installed/enabled, so the /fgOS:* plugin skills are missing; installing it is your choice: run {WIRE_AGENTS_COMMAND} (opt-in: it changes your Claude config, backs it up first)"),
        );
    }
    verdict(
        true,
        format!("Claude Code marketplace \"{CLAUDE_PLUGIN_MARKETPLACE_NAME}\" configured, fgOS plugin enabled"),
    )
}

// ---------------------------------------------------------------------------------------------------------
// The Claude user settings: whether it accepts cross-session input
// ---------------------------------------------------------------------------------------------------------

const ACCEPT_KEY: &str = "crossSessionInbound";

/// Where Claude Code keeps its user-level settings.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ClaudeSettings {
    pub dir: PathBuf,
    pub file: PathBuf,
}

/// The Claude config directory and its user-level settings file, as Claude Code itself resolves them.
pub fn claude_user_settings(env: &[(String, String)], home: &Path) -> ClaudeSettings {
    let dir = lookup(env)("CLAUDE_CONFIG_DIR")
        .filter(|d| !d.is_empty())
        .map_or_else(|| home.join(".claude"), PathBuf::from);
    let file = dir.join("settings.json");
    ClaudeSettings { dir, file }
}

/// What the settings file says about cross-session input.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Accept {
    /// `accept`.
    Accept,
    /// `hold`: a choice of the person's own.
    Hold,
    /// Another value.
    Other,
    /// No key, or no file.
    Absent,
    /// The file cannot be read as a JSON object.
    Unreadable,
}

pub fn read_accept(file: &Path) -> Accept {
    let Ok(bytes) = std::fs::read(file) else {
        return if file.exists() {
            Accept::Unreadable
        } else {
            Accept::Absent
        };
    };
    let Ok(Value::Object(doc)) = serde_json::from_slice::<Value>(&bytes) else {
        return Accept::Unreadable;
    };
    match doc.get(ACCEPT_KEY) {
        None => Accept::Absent,
        Some(Value::String(s)) if s == "accept" => Accept::Accept,
        Some(Value::String(s)) if s == "hold" => Accept::Hold,
        Some(_) => Accept::Other,
    }
}

/// Row `mailbox-claude-accept`: whether Claude Code accepts cross-session input, the setting a mailbox wake
/// needs. Reports only: accepting widens what may reach a person's session, so fgOS never sets it.
pub fn check_mailbox_claude_accept(location: &ClaudeSettings, opt_in: &MailboxOptIn) -> Verdict {
    if *opt_in != MailboxOptIn::On {
        return verdict(true, "mailbox is not enabled here; no accept needed");
    }
    if !location.dir.exists() {
        return verdict(
            true,
            format!(
                "no Claude Code config dir at {}; nothing to set",
                location.dir.display()
            ),
        );
    }
    let file = location.file.display();
    match read_accept(&location.file) {
        Accept::Accept => verdict(true, format!("{file} accepts cross-session input: an idle Claude session is woken by mail")),
        Accept::Hold => verdict(true, format!("{file} holds cross-session input by your choice: mail reaches a Claude session only at its next tool call")),
        Accept::Unreadable => verdict(false, format!("{file} cannot be read as a JSON object; fix it by hand")),
        Accept::Absent | Accept::Other => verdict(
            true,
            format!("{file} keeps Claude Code's default for cross-session input, so mail reaches a Claude session at its next tool call or stop. Accepting it globally lets any same-user process start a turn in your sessions (docs/platform/agent-mailbox/spec.md section 7.2), so fgOS never sets it; `fgos wire-agents` shows the edit if you want it"),
        ),
    }
}

// ---------------------------------------------------------------------------------------------------------
// agy
// ---------------------------------------------------------------------------------------------------------

/// Deny rules mirroring the repository's own incident history plus the other classes of irreversible or
/// exfiltration-prone commands a headless worker should never run unattended. `regex:` is agy's own opt-in
/// syntax. The settings built from them are a denylist (default-allow, explicit-deny), because agy's
/// headless mode has no true allowlist.
pub const AGY_PERMISSIONS_DENYLIST: [&str; 7] = [
    "command(regex:^rm .*-rf)",
    "command(regex:^sudo )",
    "command(regex:^git push .*(--force|-f\\b))",
    "command(regex:^git reset .*--hard)",
    "command(regex:^git stash)",
    "command(regex:^curl )",
    "command(regex:^wget )",
];

/// The settings `fgos wire-agents` shows a person who wants agy to run commands headless; fgOS never writes
/// them into the person's own settings file.
pub fn agy_permissions_default() -> Value {
    json!({ "toolPermission": "always-proceed", "permissions": { "deny": AGY_PERMISSIONS_DENYLIST } })
}

/// agy's one real on-disk settings file under `home`.
pub fn agy_settings_path(home: &Path) -> PathBuf {
    home.join(".gemini")
        .join("antigravity-cli")
        .join("settings.json")
}

/// agy's settings under `home`; never fails: a missing or unparseable file reads as `{}`.
pub fn read_agy_settings(home: &Path) -> Value {
    std::fs::read(agy_settings_path(home))
        .ok()
        .and_then(|bytes| serde_json::from_slice::<Value>(&bytes).ok())
        .filter(Value::is_object)
        .unwrap_or_else(|| json!({}))
}

/// Row `agy-permissions-configured`'s answer.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct AgyPermissions {
    pub passed: bool,
    pub configured: bool,
    pub message: String,
}

/// Passes when agy is not present (nothing of the person's to judge) or when `toolPermission` is
/// `"always-proceed"` with a non-empty `permissions.deny`. Otherwise it warns: agy run under this HOME refuses
/// every command headless, and the only setting that changes that widens agy's permissions.
pub fn check_agy_permissions_configured(home: &Path, agy_present: bool) -> AgyPermissions {
    if !agy_present {
        return AgyPermissions {
            passed: true,
            configured: false,
            message: "agy not found on PATH \u{2014} nothing to check".into(),
        };
    }
    let settings = read_agy_settings(home);
    let deny = settings["permissions"]["deny"].as_array();
    if settings["toolPermission"] == "always-proceed" && deny.is_some_and(|d| !d.is_empty()) {
        return AgyPermissions {
            passed: true,
            configured: true,
            message: format!(
                "agy settings.json: toolPermission=always-proceed, {} deny rule(s) configured",
                deny.map_or(0, Vec::len)
            ),
        };
    }
    AgyPermissions {
        passed: true,
        configured: false,
        message: format!(
            "warning: {} has no toolPermission \"always-proceed\" with a deny list, so agy run under this HOME refuses every command headless (RESEARCH.md Round 4). That setting widens what agy may do, so fgOS never sets it for you; `fgos wire-agents` shows the exact edit",
            agy_settings_path(home).display()
        ),
    }
}

/// Resolves a raw HOME path (`${HOME}/.agy-homes/x`, `$HOME/x` or `~/x`) with `home`.
pub fn resolve_sub_home_path(raw: &str, home: &str) -> String {
    let mut text = raw.replace("${HOME}", home);
    // `$HOME` followed by a word boundary
    let mut out = String::new();
    let mut rest = text.as_str();
    while let Some(at) = rest.find("$HOME") {
        out.push_str(&rest[..at]);
        let after = &rest[at + 5..];
        if after
            .chars()
            .next()
            .is_some_and(|c| c.is_alphanumeric() || c == '_')
        {
            out.push_str("$HOME");
        } else {
            out.push_str(home);
        }
        rest = after;
    }
    out.push_str(rest);
    text = out;
    match text.strip_prefix('~') {
        Some(tail) if tail.is_empty() || tail.starts_with('/') => format!("{home}{tail}"),
        _ => text,
    }
}

/// One agy sub-HOME an executor config names.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AgySubHome {
    pub raw_path: String,
    pub resolved_path: PathBuf,
    pub executor_id: Option<String>,
    pub invocation_id: Option<String>,
}

fn clean(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for part in path.components() {
        match part {
            std::path::Component::ParentDir => {
                out.pop();
            }
            std::path::Component::CurDir => {}
            other => out.push(other),
        }
    }
    out
}

/// The agy sub-HOMEs the `runner` section names: `env.HOME` of agy invocations, or of any executor pointing at
/// `agy-homes`, and the credential homes of the declared gemini accounts. A config the door refuses names no
/// sub-home (`fgos doctor` reports the refusal itself). `config` is a section already read.
pub fn find_agy_sub_homes(
    cwd: &Path,
    home: &str,
    env: Env,
    config: Option<&Value>,
) -> Result<Vec<AgySubHome>, AgentHooksError> {
    let read;
    let config = match config {
        Some(c) => c,
        None => match runner_section(cwd, env)? {
            Some(section) => {
                read = section;
                &read
            }
            None => return Ok(Vec::new()),
        },
    };
    let mut found = SubHomes {
        home,
        results: Vec::new(),
    };
    let Some(runner) = config.get("runner") else {
        return Ok(found.results);
    };
    if let Some(exec) = runner.get("executor").filter(|e| e.is_object()) {
        found.executor(exec, "executor");
    }
    if let Some(Value::Object(executors)) = runner.get("executors") {
        for (id, exec) in executors.iter().filter(|(_, e)| e.is_object()) {
            found.executor(exec, id);
        }
    }
    // The credential homes of the declared gemini accounts: a confined invocation runs as the account the
    // capacity layer picks, so these homes matter as much as the HOME an invocation names.
    let accounts = runner
        .get("providers")
        .and_then(|p| p.get("gemini"))
        .and_then(|g| g.get("accounts"));
    if let Some(Value::Object(accounts)) = accounts {
        for (id, account) in accounts {
            let source = match account.get("credentialSources") {
                Some(sources) if !sources.is_null() => sources.get("agy"),
                _ => account.get("credentialSource"),
            };
            let raw = source
                .and_then(|s| s.get("home"))
                .and_then(Value::as_str)
                .map(str::trim);
            if let Some(raw) = raw.filter(|r| !r.is_empty()) {
                found.add(raw, "gemini", Some(format!("account:{id}")));
            }
        }
    }
    Ok(found.results)
}

/// The sub-HOMEs found so far, each resolved path once.
struct SubHomes<'a> {
    home: &'a str,
    results: Vec<AgySubHome>,
}

impl SubHomes<'_> {
    fn add(&mut self, raw: &str, executor: &str, invocation: Option<String>) {
        let resolved = clean(&absolute(Path::new(&resolve_sub_home_path(raw, self.home))));
        if self.results.iter().all(|r| r.resolved_path != resolved) {
            self.results.push(AgySubHome {
                raw_path: raw.to_string(),
                resolved_path: resolved,
                executor_id: Some(executor.to_string()),
                invocation_id: invocation,
            });
        }
    }

    /// One `env.HOME`: an agy one when the command, the executor, the invocation or the path says so.
    fn env_home(
        &mut self,
        env_value: &Value,
        executor: &str,
        invocation: Option<&str>,
        command: Option<&str>,
    ) {
        let Some(raw) = env_value
            .get(HOME_KEY)
            .and_then(Value::as_str)
            .map(str::trim)
        else {
            return;
        };
        let is_agy = command == Some("agy")
            || executor == "agy"
            || invocation.is_some_and(|i| i.contains("agy"))
            || raw.contains("agy-homes");
        if !raw.is_empty() && is_agy {
            self.add(raw, executor, invocation.map(str::to_string));
        }
    }

    fn executor(&mut self, exec: &Value, executor: &str) {
        let command = exec.get("command").and_then(Value::as_str);
        if let Some(env_value) = exec.get("env") {
            self.env_home(env_value, executor, None, command);
        }
        let Some(Value::Array(invocations)) = exec.get("invocations") else {
            return;
        };
        for inv in invocations.iter().filter(|i| i.is_object()) {
            if let Some(env_value) = inv.get("env") {
                let id = inv.get("id").and_then(Value::as_str);
                let cmd = inv.get("command").and_then(Value::as_str).or(command);
                self.env_home(env_value, executor, id, cmd);
            }
        }
    }
}

fn absolute(path: &Path) -> PathBuf {
    if path.is_absolute() {
        path.to_path_buf()
    } else {
        std::env::current_dir().map_or_else(|_| path.to_path_buf(), |cwd| cwd.join(path))
    }
}

/// The project's effective config (every section; the caller reads `runner`), or `None` when the door refuses it.
fn runner_section(cwd: &Path, env: Env) -> Result<Option<Value>, AgentHooksError> {
    let root = std::fs::canonicalize(cwd).map_err(|source| AgentHooksError::Io {
        path: cwd.to_path_buf(),
        source,
    })?;
    match fgos_config::machine::project_snapshot(&root, |key| env(key)) {
        Ok(snapshot) => Ok(Some(snapshot.value)),
        Err(fgos_config::snapshot::SnapshotError::Refused(list)) => {
            let code = list.first().map_or("config-refused", |r| r.code);
            if [
                "config-request-invalid",
                "config-io",
                "config-trusted-root-unresolved",
                "config-internal-error",
            ]
            .contains(&code)
            {
                return Err(AgentHooksError::Config(code.to_string()));
            }
            Ok(None)
        }
        Err(fgos_config::snapshot::SnapshotError::Io(e)) => {
            Err(AgentHooksError::Config(e.to_string()))
        }
    }
}

/// Row `agy-sub-homes-configured`: each agy sub-HOME the executor config names has its own settings file with
/// `toolPermission: "always-proceed"`.
pub fn check_agy_sub_homes_configured(
    cwd: &Path,
    home: &str,
    env: Env,
    config: Option<&Value>,
) -> Result<Verdict, AgentHooksError> {
    let sub_homes = find_agy_sub_homes(cwd, home, env, config)?;
    if sub_homes.is_empty() {
        return Ok(verdict(
            true,
            "no agy sub-HOMEs referenced in executor configs \u{2014} nothing to check",
        ));
    }
    let (mut missing, mut misconfigured, mut passed) = (Vec::new(), Vec::new(), Vec::new());
    for sub in &sub_homes {
        let settings_path = agy_settings_path(&sub.resolved_path);
        if !settings_path.exists() {
            missing.push(format!(
                "{} ({} not found)",
                sub.raw_path,
                settings_path.display()
            ));
            continue;
        }
        let settings = read_agy_settings(&sub.resolved_path);
        if settings["toolPermission"] != "always-proceed" {
            let seen = settings["toolPermission"].as_str().unwrap_or("missing");
            misconfigured.push(format!(
                "{} ({}: toolPermission is \"{seen}\", must be \"always-proceed\")",
                sub.raw_path,
                settings_path.display()
            ));
            continue;
        }
        passed.push(sub.raw_path.clone());
    }
    if !missing.is_empty() || !misconfigured.is_empty() {
        let mut problems = Vec::new();
        if !missing.is_empty() {
            problems.push(format!("missing settings.json: {}", missing.join(", ")));
        }
        if !misconfigured.is_empty() {
            problems.push(format!(
                "misconfigured settings.json: {}",
                misconfigured.join(", ")
            ));
        }
        return Ok(verdict(
            false,
            format!(
                "agy sub-HOME check failed ({}) \u{2014} each sub-HOME must have .gemini/antigravity-cli/settings.json with toolPermission: \"always-proceed\"",
                problems.join("; ")
            ),
        ));
    }
    Ok(verdict(
        true,
        format!(
            "all {} agy sub-HOME(s) configured ({}) with toolPermission=always-proceed",
            sub_homes.len(),
            passed.join(", ")
        ),
    ))
}

// ---------------------------------------------------------------------------------------------------------
// The wire-agents plan
// ---------------------------------------------------------------------------------------------------------

/// One change `wire-agents` would make: the `claude` calls it runs and the files they touch.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Change {
    pub id: String,
    pub what: String,
    pub commands: Vec<String>,
    pub steps: Vec<Vec<String>>,
    pub files: Vec<PathBuf>,
}

/// A setting fgOS shows and never writes.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Permission {
    pub file: PathBuf,
    pub set: Value,
    pub why: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct AgentEntry {
    pub agent: String,
    pub changes: Vec<Change>,
    pub permissions: Vec<Permission>,
}

/// What `fgos wire-agents` would change for the agents present on this machine, and the permissions it
/// leaves to the person.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct WiringPlan {
    pub agents: Vec<AgentEntry>,
    pub absent: Vec<String>,
    pub files: Vec<PathBuf>,
}

fn claude_entry(
    cwd: &Path,
    env: &[(String, String)],
    home: &Path,
    env_lookup: Env,
    runner: &dyn ProcessRunner,
) -> Result<AgentEntry, AgentHooksError> {
    let settings = claude_user_settings(env, home);
    let mut changes = Vec::new();
    let marketplaces =
        claude_plugin_json(&["plugin", "marketplace", "list", "--json"], env, runner)
            .unwrap_or_default();
    let plugins =
        claude_plugin_json(&["plugin", "list", "--json"], env, runner).unwrap_or_default();
    let mut steps: Vec<Vec<String>> = Vec::new();
    if !has_marketplace(&marketplaces) {
        steps.push(
            [
                "plugin",
                "marketplace",
                "add",
                CLAUDE_PLUGIN_MARKETPLACE_GITHUB_SOURCE,
            ]
            .map(String::from)
            .to_vec(),
        );
    }
    if !plugin_enabled(&plugins) {
        steps.push(
            ["plugin", "install", CLAUDE_PLUGIN_REF]
                .map(String::from)
                .to_vec(),
        );
    }
    if !steps.is_empty() {
        let plugins_dir = settings.dir.join("plugins");
        changes.push(Change {
            id: "claude-plugin".into(),
            what: format!(
                "register the \"{CLAUDE_PLUGIN_MARKETPLACE_NAME}\" plugin marketplace and install the fgOS plugin (the claude CLI also adds the plugin under {})",
                plugins_dir.display()
            ),
            commands: steps.iter().map(|s| format!("claude {}", s.join(" "))).collect(),
            steps,
            files: vec![
                settings.file.clone(),
                plugins_dir.join("known_marketplaces.json"),
                plugins_dir.join("installed_plugins.json"),
            ],
        });
    }
    let mut permissions = Vec::new();
    if mailbox_opt_in(cwd, env_lookup)? == MailboxOptIn::On {
        let state = read_accept(&settings.file);
        if state != Accept::Accept && state != Accept::Hold {
            permissions.push(Permission {
                file: settings.file.clone(),
                set: json!({ "crossSessionInbound": "accept" }),
                why: "the mailbox wakes an idle Claude session only when it accepts cross-session input; without it, mail waits for the session's next tool call or stop. Accepting it in this file lets any same-user process start a turn in every one of your Claude sessions; docs/platform/agent-mailbox/spec.md section 7.2 advises scoping it to one session with --settings instead".into(),
                note: (state == Accept::Unreadable).then(|| "the file cannot be read as a JSON object; fix it by hand first".to_string()),
            });
        }
    }
    Ok(AgentEntry {
        agent: "claude".into(),
        changes,
        permissions,
    })
}

fn agy_entry(home: &Path) -> AgentEntry {
    let permissions = if check_agy_permissions_configured(home, true).configured {
        Vec::new()
    } else {
        vec![Permission {
            file: agy_settings_path(home),
            set: agy_permissions_default(),
            why: "agy run by fgOS under this HOME refuses every command in headless mode unless toolPermission is \"always-proceed\"; the deny list then refuses the listed commands. That lets agy run any other command without review, in your own agy sessions too".into(),
            note: None,
        }]
    };
    AgentEntry {
        agent: "agy".into(),
        changes: Vec::new(),
        permissions,
    }
}

/// What `wire-agents` would change for the agents present on this machine. Reads only. `env` is the process
/// environment as a full list (`PATH`, `FGOS_CLAUDE_COMMAND`, `CLAUDE_CONFIG_DIR`, the home variables).
pub fn plan_agent_wiring(
    cwd: &Path,
    env: &[(String, String)],
    home: &Path,
    runner: &dyn ProcessRunner,
) -> Result<WiringPlan, AgentHooksError> {
    let env_lookup = lookup(env);
    let mut agents = Vec::new();
    let mut absent = Vec::new();
    if run_claude(&["--version"], env, runner).is_some() {
        agents.push(claude_entry(cwd, env, home, &env_lookup, runner)?);
    } else {
        absent.push("claude".to_string());
    }
    if program_on_path("agy", env).is_some() {
        agents.push(agy_entry(home));
    } else {
        absent.push("agy".to_string());
    }
    let mut files: Vec<PathBuf> = Vec::new();
    for file in agents
        .iter()
        .flat_map(|a| a.changes.iter().flat_map(|c| c.files.iter()))
    {
        if !files.contains(file) {
            files.push(file.clone());
        }
    }
    Ok(WiringPlan {
        agents,
        absent,
        files,
    })
}

#[cfg(test)]
mod windows_resolution_tests {
    use super::*;

    #[test]
    fn on_windows_claude_resolves_to_its_batch_file_through_pathext_and_a_named_command_is_taken_as_given(
    ) {
        let dir = std::env::temp_dir().join(format!("fgos-claude-cmd-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("claude.CMD"), "@exit /b 0\r\n").unwrap();
        let env = vec![
            (
                "PATH".to_string(),
                format!("{};{}", dir.display(), "/nowhere"),
            ),
            ("PATHEXT".to_string(), ".EXE;.CMD;.BAT".to_string()),
        ];
        assert_eq!(
            claude_program(&env, true),
            dir.join("claude.CMD").into_os_string()
        );
        // the same environment on another host finds no executable `claude`, so the bare name stays
        assert_eq!(
            claude_program(&env, false),
            std::ffi::OsString::from("claude")
        );
        let named = [
            env.clone(),
            vec![(
                "FGOS_CLAUDE_COMMAND".to_string(),
                "/nonexistent/fgos-test-claude".to_string(),
            )],
        ]
        .concat();
        assert_eq!(
            claude_program(&named, true),
            std::ffi::OsString::from("/nonexistent/fgos-test-claude")
        );
        let _ = std::fs::remove_dir_all(dir);
    }
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;
    use crate::agent_hooks::test_runner::RetryOnBusy as BoundedRunner;
    use std::os::unix::fs::PermissionsExt;

    struct Sandbox {
        dir: PathBuf,
        home: PathBuf,
        project: PathBuf,
    }

    impl Sandbox {
        fn new(label: &str) -> Sandbox {
            static COUNTER: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);
            let n = COUNTER.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
            let dir = std::fs::canonicalize(std::env::temp_dir())
                .unwrap()
                .join(format!(
                    "fgos-agent-config-{}-{n}-{label}",
                    std::process::id()
                ));
            let _ = std::fs::remove_dir_all(&dir);
            let (home, project) = (dir.join("home"), dir.join("project"));
            std::fs::create_dir_all(&home).unwrap();
            std::fs::create_dir_all(project.join(".git")).unwrap();
            Sandbox { dir, home, project }
        }

        fn env(&self, extra: &[(&str, String)]) -> Vec<(String, String)> {
            let mut env = vec![
                ("HOME".to_string(), self.home.to_string_lossy().into_owned()),
                (
                    "PATH".to_string(),
                    self.dir.join("bin").to_string_lossy().into_owned(),
                ),
                (
                    "FGOS_CLAUDE_COMMAND".to_string(),
                    "fgos-test-claude".to_string(),
                ),
            ];
            env.extend(extra.iter().map(|(k, v)| ((*k).to_string(), v.clone())));
            env
        }

        fn script(&self, name: &str, body: &str) -> PathBuf {
            let bin = self.dir.join("bin");
            std::fs::create_dir_all(&bin).unwrap();
            let path = bin.join(name);
            std::fs::write(&path, format!("#!/bin/sh\n{body}\n")).unwrap();
            std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o755)).unwrap();
            path
        }

        /// A fake `claude`: answers from the state files in `state/` (marketplaces, plugins), one call per line in `calls.log`.
        fn fake_claude(&self, marketplaces: &str, plugins: &str) -> PathBuf {
            let state = self.dir.join("state");
            std::fs::create_dir_all(&state).unwrap();
            std::fs::write(state.join("marketplaces"), marketplaces).unwrap();
            std::fs::write(state.join("plugins"), plugins).unwrap();
            let calls = self.dir.join("calls.log");
            self.script(
                "fgos-test-claude",
                &format!(
                    "echo \"$*\" >> '{calls}'\ncase \"$*\" in\n  '--version') echo '1.0 (fake)';;\n  'plugin marketplace list --json') IFS= read -r l < '{m}'; printf '%s' \"$l\";;\n  'plugin list --json') IFS= read -r l < '{p}'; printf '%s' \"$l\";;\n  *) echo 'unrecognized' >&2; exit 1;;\nesac",
                    calls = calls.display(),
                    m = state.join("marketplaces").display(),
                    p = state.join("plugins").display()
                ),
            )
        }

        fn calls(&self) -> Vec<String> {
            std::fs::read_to_string(self.dir.join("calls.log"))
                .unwrap_or_default()
                .lines()
                .map(str::to_string)
                .collect()
        }
    }

    impl Drop for Sandbox {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.dir);
        }
    }

    fn mailbox_config(sb: &Sandbox, enabled: bool) {
        std::fs::create_dir_all(sb.project.join(".fgos")).unwrap();
        std::fs::write(
            sb.project.join(".fgos").join("config.yaml"),
            format!("# @fgos:v1\n\n{{\"mailbox\": {{\"enabled\": {enabled}}}}}\n"),
        )
        .unwrap();
    }

    #[test]
    fn the_marketplace_row_reports_each_state_of_the_claude_plugin_surface_and_never_writes() {
        let sb = Sandbox::new("marketplace");
        let env = sb.env(&[]);
        let absent = check_claude_plugin_marketplace(&env, &BoundedRunner);
        assert_eq!(
            absent,
            verdict(true, "claude CLI not found on PATH \u{2014} nothing to check (Claude Code plugin surface not applicable here)")
        );
        sb.fake_claude("not json", "[]");
        let broken = check_claude_plugin_marketplace(&env, &BoundedRunner);
        assert_eq!(
            broken,
            verdict(
                false,
                "\"claude plugin marketplace list --json\" failed to run or parse"
            )
        );
        sb.fake_claude("[]", "[]");
        let none = check_claude_plugin_marketplace(&env, &BoundedRunner);
        assert!(
            none.passed
                && none.message.starts_with(
                    "warning: Claude Code marketplace \"fgos-plugins\" not configured"
                ),
            "{none:?}"
        );
        assert!(none.message.contains(
            "run fgos wire-agents (opt-in: it changes your Claude config, backs it up first)"
        ));
        sb.fake_claude(r#"[{"name":"fgos-plugins"}]"#, "garbage");
        assert_eq!(
            check_claude_plugin_marketplace(&env, &BoundedRunner),
            verdict(
                false,
                "\"claude plugin list --json\" failed to run or parse"
            )
        );
        sb.fake_claude(
            r#"[{"name":"fgos-plugins"}]"#,
            r#"[{"id":"fgOS@fgos-plugins","enabled":false}]"#,
        );
        assert!(check_claude_plugin_marketplace(&env, &BoundedRunner)
            .message
            .starts_with("warning: fgOS Claude Code plugin not installed/enabled"));
        sb.fake_claude(
            r#"[{"name":"fgos-plugins"}]"#,
            r#"[{"id":"fgOS@fgos-plugins","enabled":true}]"#,
        );
        assert_eq!(
            check_claude_plugin_marketplace(&env, &BoundedRunner),
            verdict(
                true,
                "Claude Code marketplace \"fgos-plugins\" configured, fgOS plugin enabled"
            )
        );
        let calls = sb.calls();
        assert!(
            calls
                .iter()
                .all(|c| !c.contains("install") && !c.contains(" add ")),
            "the row only asks: {calls:?}"
        );
        assert!(!sb.home.join(".claude").exists(), "HOME is untouched");
    }

    #[test]
    fn the_plan_holds_only_present_agents_lists_the_steps_and_files_and_shows_permissions_it_never_writes(
    ) {
        let sb = Sandbox::new("plan");
        mailbox_config(&sb, true);
        let env = sb.env(&[]);
        let get = lookup(&env);
        let _ = get;
        let none = plan_agent_wiring(&sb.project, &env, &sb.home, &BoundedRunner).unwrap();
        assert_eq!(
            (none.agents.len(), none.absent.clone()),
            (0, vec!["claude".to_string(), "agy".to_string()])
        );
        sb.fake_claude("[]", "[]");
        sb.script("agy", "exit 0");
        let plan = plan_agent_wiring(&sb.project, &env, &sb.home, &BoundedRunner).unwrap();
        assert_eq!(plan.absent, Vec::<String>::new());
        let claude = &plan.agents[0];
        assert_eq!(claude.agent, "claude");
        assert_eq!(claude.changes.len(), 1);
        assert_eq!(
            claude.changes[0].commands,
            vec![
                "claude plugin marketplace add vantt/forgent".to_string(),
                "claude plugin install fgOS@fgos-plugins".to_string()
            ]
        );
        let plugins = sb.home.join(".claude").join("plugins");
        assert_eq!(
            plan.files,
            vec![
                sb.home.join(".claude").join("settings.json"),
                plugins.join("known_marketplaces.json"),
                plugins.join("installed_plugins.json")
            ]
        );
        assert_eq!(
            claude.permissions.len(),
            1,
            "the mailbox is on and accept is not set"
        );
        assert_eq!(
            claude.permissions[0].set,
            json!({ "crossSessionInbound": "accept" })
        );
        let agy = &plan.agents[1];
        assert_eq!(agy.agent, "agy");
        assert_eq!(agy.permissions[0].set, agy_permissions_default());
        assert_eq!(agy.permissions[0].file, agy_settings_path(&sb.home));
        // a plugin already installed and accept already held leave nothing to plan for claude
        sb.fake_claude(
            r#"[{"name":"fgos-plugins"}]"#,
            r#"[{"id":"fgOS@x","enabled":true}]"#,
        );
        let claude_dir = sb.home.join(".claude");
        std::fs::create_dir_all(&claude_dir).unwrap();
        std::fs::write(
            claude_dir.join("settings.json"),
            r#"{"crossSessionInbound":"hold"}"#,
        )
        .unwrap();
        let settled = plan_agent_wiring(&sb.project, &env, &sb.home, &BoundedRunner).unwrap();
        assert!(settled.agents[0].changes.is_empty() && settled.agents[0].permissions.is_empty());
        assert!(settled.files.is_empty());
        // an unreadable settings file is noted, and a project that did not opt in is asked for nothing
        std::fs::write(claude_dir.join("settings.json"), "[").unwrap();
        let noted = plan_agent_wiring(&sb.project, &env, &sb.home, &BoundedRunner).unwrap();
        assert_eq!(
            noted.agents[0].permissions[0].note.as_deref(),
            Some("the file cannot be read as a JSON object; fix it by hand first")
        );
        mailbox_config(&sb, false);
        let off = plan_agent_wiring(&sb.project, &env, &sb.home, &BoundedRunner).unwrap();
        assert!(off.agents[0].permissions.is_empty());
        // the plan serialises with the keys `wire-agents` answers
        let value = serde_json::to_value(&plan).unwrap();
        assert!(value["agents"][0]["changes"][0]["steps"].is_array() && value["absent"].is_array());
    }

    #[test]
    fn claude_user_settings_follow_the_config_dir_variable_then_the_home() {
        let home = Path::new("/h");
        let with_dir = vec![("CLAUDE_CONFIG_DIR".to_string(), "/cfg".to_string())];
        assert_eq!(
            claude_user_settings(&with_dir, home).file,
            PathBuf::from("/cfg/settings.json")
        );
        assert_eq!(
            claude_user_settings(&[], home).dir,
            PathBuf::from("/h/.claude")
        );
        let blank = vec![("CLAUDE_CONFIG_DIR".to_string(), String::new())];
        assert_eq!(
            claude_user_settings(&blank, home).dir,
            PathBuf::from("/h/.claude")
        );
    }

    #[test]
    fn the_accept_row_says_what_the_settings_file_holds_and_when_nothing_is_needed() {
        let sb = Sandbox::new("accept");
        let location = claude_user_settings(&sb.env(&[]), &sb.home);
        let off = check_mailbox_claude_accept(&location, &MailboxOptIn::Off);
        assert_eq!(
            off,
            verdict(true, "mailbox is not enabled here; no accept needed")
        );
        let no_dir = check_mailbox_claude_accept(&location, &MailboxOptIn::On);
        assert_eq!(
            no_dir.message,
            format!(
                "no Claude Code config dir at {}; nothing to set",
                location.dir.display()
            )
        );
        std::fs::create_dir_all(&location.dir).unwrap();
        let file = location.file.display().to_string();
        let cases = [
            (r#"{"crossSessionInbound":"accept"}"#, true, format!("{file} accepts cross-session input: an idle Claude session is woken by mail")),
            (r#"{"crossSessionInbound":"hold"}"#, true, format!("{file} holds cross-session input by your choice: mail reaches a Claude session only at its next tool call")),
            ("[1]", false, format!("{file} cannot be read as a JSON object; fix it by hand")),
            ("nope", false, format!("{file} cannot be read as a JSON object; fix it by hand")),
        ];
        for (text, passed, message) in cases {
            std::fs::write(&location.file, text).unwrap();
            assert_eq!(
                check_mailbox_claude_accept(&location, &MailboxOptIn::On),
                verdict(passed, message),
                "{text}"
            );
        }
        for text in ["{}", r#"{"crossSessionInbound":"always"}"#] {
            std::fs::write(&location.file, text).unwrap();
            let v = check_mailbox_claude_accept(&location, &MailboxOptIn::On);
            assert!(
                v.passed
                    && v.message.starts_with(&format!(
                        "{file} keeps Claude Code's default for cross-session input"
                    )),
                "{v:?}"
            );
        }
        assert_eq!(
            read_accept(&location.dir.join("absent.json")),
            Accept::Absent
        );
    }

    #[test]
    fn the_agy_permission_row_warns_without_always_proceed_and_a_deny_list_and_passes_with_both() {
        let sb = Sandbox::new("agy");
        let none = check_agy_permissions_configured(&sb.home, false);
        assert_eq!(
            none.message,
            "agy not found on PATH \u{2014} nothing to check"
        );
        let missing = check_agy_permissions_configured(&sb.home, true);
        assert!(missing.passed && !missing.configured);
        assert!(missing.message.starts_with(&format!(
            "warning: {} has no toolPermission",
            agy_settings_path(&sb.home).display()
        )));
        std::fs::create_dir_all(agy_settings_path(&sb.home).parent().unwrap()).unwrap();
        std::fs::write(
            agy_settings_path(&sb.home),
            serde_json::to_string(&agy_permissions_default()).unwrap(),
        )
        .unwrap();
        let ok = check_agy_permissions_configured(&sb.home, true);
        assert!(ok.configured);
        assert_eq!(
            ok.message,
            "agy settings.json: toolPermission=always-proceed, 7 deny rule(s) configured"
        );
        std::fs::write(
            agy_settings_path(&sb.home),
            r#"{"toolPermission":"always-proceed","permissions":{"deny":[]}}"#,
        )
        .unwrap();
        assert!(
            !check_agy_permissions_configured(&sb.home, true).configured,
            "an empty deny list is not configured"
        );
        std::fs::write(agy_settings_path(&sb.home), "[]").unwrap();
        assert_eq!(
            read_agy_settings(&sb.home),
            json!({}),
            "an unparseable or non-object file reads as nothing configured"
        );
    }

    #[test]
    fn sub_home_paths_expand_the_home_forms() {
        assert_eq!(
            resolve_sub_home_path("${HOME}/.agy-homes/a", "/h"),
            "/h/.agy-homes/a"
        );
        assert_eq!(resolve_sub_home_path("$HOME/x", "/h"), "/h/x");
        assert_eq!(resolve_sub_home_path("$HOMEWORK/x", "/h"), "$HOMEWORK/x");
        assert_eq!(resolve_sub_home_path("~/x", "/h"), "/h/x");
        assert_eq!(resolve_sub_home_path("~", "/h"), "/h");
        assert_eq!(resolve_sub_home_path("~other/x", "/h"), "~other/x");
    }

    #[test]
    fn sub_homes_come_from_agy_invocations_and_gemini_accounts_and_are_checked_one_by_one() {
        let sb = Sandbox::new("subhomes");
        let home = sb.home.to_string_lossy().into_owned();
        let env = |k: &str| (k == "HOME").then(|| home.clone());
        let config = json!({ "runner": {
            "executor": { "command": "agy", "env": { "HOME": "${HOME}/.agy-homes/one" } },
            "executors": {
                "other": { "command": "x", "env": { "HOME": "/not/agy" }, "invocations": [
                    { "id": "agy-fast", "env": { "HOME": "~/.agy-homes/two" } },
                    { "id": "plain", "env": { "HOME": "/plain" } } ] },
                "agy": { "env": { "HOME": "${HOME}/.agy-homes/one" } }
            },
            "providers": { "gemini": { "accounts": {
                "a1": { "credentialSource": { "home": "~/gem/one" } },
                "a2": { "credentialSources": { "agy": { "home": "~/gem/two" } } } } } }
        }});
        let found = find_agy_sub_homes(&sb.project, &home, &env, Some(&config)).unwrap();
        let resolved: Vec<_> = found.iter().map(|s| s.resolved_path.clone()).collect();
        assert_eq!(
            resolved,
            vec![
                sb.home.join(".agy-homes/one"),
                sb.home.join(".agy-homes/two"),
                sb.home.join("gem/one"),
                sb.home.join("gem/two")
            ]
        );
        assert_eq!(found[2].invocation_id.as_deref(), Some("account:a1"));
        let verdict_missing =
            check_agy_sub_homes_configured(&sb.project, &home, &env, Some(&config)).unwrap();
        assert!(!verdict_missing.passed);
        assert!(
            verdict_missing
                .message
                .starts_with("agy sub-HOME check failed (missing settings.json: "),
            "{verdict_missing:?}"
        );
        for sub in &found {
            let file = agy_settings_path(&sub.resolved_path);
            std::fs::create_dir_all(file.parent().unwrap()).unwrap();
            std::fs::write(&file, r#"{"toolPermission":"request-review"}"#).unwrap();
        }
        let wrong =
            check_agy_sub_homes_configured(&sb.project, &home, &env, Some(&config)).unwrap();
        assert!(
            wrong
                .message
                .contains("toolPermission is \"request-review\", must be \"always-proceed\""),
            "{wrong:?}"
        );
        for sub in &found {
            std::fs::write(
                agy_settings_path(&sub.resolved_path),
                r#"{"toolPermission":"always-proceed"}"#,
            )
            .unwrap();
        }
        let ok = check_agy_sub_homes_configured(&sb.project, &home, &env, Some(&config)).unwrap();
        assert!(
            ok.passed
                && ok
                    .message
                    .starts_with("all 4 agy sub-HOME(s) configured (${HOME}/.agy-homes/one, "),
            "{ok:?}"
        );
        let none =
            check_agy_sub_homes_configured(&sb.project, &home, &env, Some(&json!({}))).unwrap();
        assert_eq!(
            none.message,
            "no agy sub-HOMEs referenced in executor configs \u{2014} nothing to check"
        );
    }

    #[test]
    fn a_project_config_the_door_refuses_names_no_sub_home() {
        let sb = Sandbox::new("refused");
        std::fs::create_dir_all(sb.project.join(".fgos")).unwrap();
        std::fs::write(
            sb.project.join(".fgos").join("config.yaml"),
            "# @fgos:v1\n\n{\"mailbox\": {\"enabled\": \"yes\"}}\n",
        )
        .unwrap();
        let home = sb.home.to_string_lossy().into_owned();
        let env = |k: &str| (k == "HOME").then(|| home.clone());
        assert!(find_agy_sub_homes(&sb.project, &home, &env, None)
            .unwrap()
            .is_empty());
        let none = find_agy_sub_homes(&sb.dir.join("missing"), &home, &env, None);
        assert!(
            none.is_err(),
            "a root that cannot be read is the module's failure, not a refusal"
        );
    }

    #[test]
    fn a_step_that_changes_claude_runs_with_its_argv_and_says_why_it_failed() {
        let sb = Sandbox::new("step");
        let env = sb.env(&[]);
        let args: Vec<String> = ["plugin", "install", "fgOS@fgos-plugins"]
            .map(String::from)
            .to_vec();
        assert_eq!(
            run_claude_step(&args, &env, &BoundedRunner),
            Err("spawnSync fgos-test-claude ENOENT".to_string()),
            "a program that cannot start"
        );
        sb.fake_claude("[]", "[]");
        // the fake answers an install with `unrecognized` on stderr and a non-zero exit
        assert_eq!(
            run_claude_step(&args, &env, &BoundedRunner),
            Err("unrecognized".to_string())
        );
        assert_eq!(sb.calls(), vec!["plugin install fgOS@fgos-plugins"]);
        sb.script("fgos-test-claude", "exit 3");
        assert_eq!(
            run_claude_step(&args, &env, &BoundedRunner),
            Err("Command failed: fgos-test-claude plugin install fgOS@fgos-plugins".to_string()),
            "no standard error: the command line"
        );
        sb.script("fgos-test-claude", "exit 0");
        assert_eq!(run_claude_step(&args, &env, &BoundedRunner), Ok(()));
    }
}
