//! The doctor judgements over the runner config and the machine facts it names: one pure function per row, each
//! answering the pass/fail and the one sentence the row shows. The host reads the config and the machine, hands
//! them in (through the small traits below where a row reads the machine) and words nothing itself.
//!
//! Rows: `runner-generated-paths`, `executor-confinement`, `invocation-git-write-grants`,
//! `capability-serves-valid`, `omp-natives-present`, `agy-sub-homes-configured`, `tool-registry-configured`.
//! Every message is the sentence the Node judge printed; the vectors of `packages/execution/contracts/checks.v1.json`
//! state them. A message that starts with `warning:` is a warning, anything else passes; `passed: false` fails.

use crate::runner_check::validate_generated_paths_shape;
use crate::tools::ToolPosture;
use serde_json::{json, Map, Value};
use std::path::{Component, Path, PathBuf};

/// What a row judged.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CheckResult {
    pub passed: bool,
    pub message: String,
}

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

fn present(value: Option<&Value>) -> Option<&Value> {
    value.filter(|v| !v.is_null())
}

fn entries_of(value: Option<&Value>) -> impl Iterator<Item = (&String, &Value)> {
    value.and_then(Value::as_object).into_iter().flatten()
}

fn list_of(value: Option<&Value>) -> impl Iterator<Item = &Value> {
    value.and_then(Value::as_array).into_iter().flatten()
}

fn is_word(c: char) -> bool {
    c.is_ascii_alphanumeric() || c == '_'
}

// ---- runner-generated-paths -------------------------------------------------------------------------------

/// `runner.generatedPaths` maps generated sources to render targets with well-formed write-scope entries.
pub fn runner_generated_paths(runner: &Value) -> CheckResult {
    let empty = Value::Array(Vec::new());
    let generated = present(runner.get("generatedPaths")).unwrap_or(&empty);
    match validate_generated_paths_shape(generated, "runner") {
        Err(refusal) => fail(refusal.error.message),
        Ok(()) => pass(format!(
            "runner.generatedPaths is valid ({} mapping(s))",
            generated.as_array().map_or(0, Vec::len)
        )),
    }
}

// ---- executor-confinement ---------------------------------------------------------------------------------

/// The confinement flag a bypass invocation needs, read as the loaded config holds it. An executor's own
/// `confinement` is normalized when the config loads (the legacy flags and `home`/`session`/`workspace` spellings
/// become `controls`), so at that level every spelling counts; an invocation's own `confinement` is read as written.
fn confined(
    c: &Value,
    flag: &str,
    legacy: &str,
    control: &str,
    own: &str,
    executor_level: bool,
) -> bool {
    let controls = c.get("controls").and_then(|controls| controls.get(control));
    let by_control = controls.and_then(Value::as_str) == Some(own);
    let by_flag = c.get(flag) == Some(&Value::Bool(true));
    let by_legacy = executor_level && c.get(legacy).and_then(Value::as_str) == Some(own);
    by_flag || by_control || by_legacy
}

/// Every invocation that declares `permissionMode: "bypass"` also declares full confinement. `runner` is the
/// config as the Node loader returns it.
pub fn executor_confinement(runner: &Value) -> CheckResult {
    let empty = json!({});
    let mut offenders: Vec<String> = Vec::new();
    for (id, executor) in entries_of(runner.get("executors")) {
        for inv in list_of(executor.get("invocations")) {
            if inv.get("permissionMode").and_then(Value::as_str) != Some("bypass") {
                continue;
            }
            let (c, executor_level) = match present(inv.get("confinement")) {
                Some(own) => (own, false),
                None => (present(executor.get("confinement")).unwrap_or(&empty), true),
            };
            let mut missing = Vec::new();
            if !confined(c, "privateHome", "home", "home", "private", executor_level) {
                missing.push("privateHome");
            }
            if !confined(
                c,
                "isolatedSession",
                "session",
                "session",
                "isolated",
                executor_level,
            ) {
                missing.push("isolatedSession");
            }
            if !confined(
                c,
                "ownWorktree",
                "workspace",
                "workspace",
                "own",
                executor_level,
            ) {
                missing.push("ownWorktree");
            }
            if !missing.is_empty() {
                let inv_id = inv.get("id").and_then(Value::as_str).unwrap_or("?");
                offenders.push(format!("{id}/{inv_id} (missing {})", missing.join(", ")));
            }
        }
    }
    if offenders.is_empty() {
        pass("every invocation declaring bypass also declares full confinement")
    } else {
        fail(format!(
            "invocations declare \"permissionMode\": \"bypass\" without full confinement: {}",
            offenders.join("; ")
        ))
    }
}

// ---- invocation-git-write-grants --------------------------------------------------------------------------

/// Whether the text holds `git add` or `git commit` as whole words (`\bgit (add|commit)\b`).
fn mentions_git_write(text: &str) -> bool {
    ["git add", "git commit"].iter().any(|needle| {
        text.match_indices(needle).any(|(at, _)| {
            let before = text[..at].chars().next_back();
            let after = text[at + needle.len()..].chars().next();
            !before.is_some_and(is_word) && !after.is_some_and(is_word)
        })
    })
}

fn grants_git_write(args: Option<&Value>) -> bool {
    let Some(list) = args.and_then(Value::as_array) else {
        return false;
    };
    list.iter()
        .position(|a| a.as_str() == Some("--allowedTools"))
        .and_then(|at| list.get(at + 1))
        .and_then(Value::as_str)
        .is_some_and(mentions_git_write)
}

/// A worker holds no git write grant: the runner commits what it leaves in the worktree. A config that still
/// grants `git add` or `git commit` through an allowlist is named per executor and invocation, as a warning.
pub fn invocation_git_write_grants(runner: &Value) -> CheckResult {
    let mut offenders: Vec<String> = Vec::new();
    if grants_git_write(runner.get("executor").and_then(|e| e.get("args"))) {
        offenders.push("executor".to_owned());
    }
    for (id, executor) in entries_of(runner.get("executors")) {
        for inv in list_of(executor.get("invocations")) {
            if grants_git_write(inv.get("args")) {
                let inv_id = inv.get("id").and_then(Value::as_str).unwrap_or("?");
                offenders.push(format!("executors.{id}.invocations.{inv_id}"));
            }
        }
    }
    if offenders.is_empty() {
        pass("no executor or invocation grants git add/git commit to a worker")
    } else {
        pass(format!(
            "warning: {} still grant git add/git commit in --allowedTools; workers no longer commit (the runner does) -- remove the grant",
            offenders.join(", ")
        ))
    }
}

// ---- capability-serves-valid ------------------------------------------------------------------------------

/// Locale order of two attribute names: letters compare without regard to case first, a lower-case letter before
/// its upper-case twin on a tie.
fn locale_order(a: &str, b: &str) -> std::cmp::Ordering {
    a.to_lowercase()
        .cmp(&b.to_lowercase())
        .then_with(|| b.cmp(a))
}

/// A `serves` value as the comparison reads it: its entries sorted by name, as compact JSON.
fn serves_signature(serves: &Value) -> String {
    let mut pairs: Vec<(String, Value)> = match serves {
        Value::Object(map) => map.iter().map(|(k, v)| (k.clone(), v.clone())).collect(),
        Value::Array(items) => items
            .iter()
            .enumerate()
            .map(|(i, v)| (i.to_string(), v.clone()))
            .collect(),
        Value::String(text) => text
            .chars()
            .enumerate()
            .map(|(i, c)| (i.to_string(), Value::String(c.to_string())))
            .collect(),
        _ => Vec::new(),
    };
    pairs.sort_by(|(a, _), (b, _)| locale_order(a, b));
    Value::Object(pairs.into_iter().collect::<Map<_, _>>()).to_string()
}

/// `runner.capabilities`' `serves` attribute sets are mutually distinct: matching can tell any two apart.
pub fn capability_serves_valid(runner: &Value) -> CheckResult {
    let mut declared: Vec<(&str, &Value)> = Vec::new();
    for (name, entry) in entries_of(runner.get("capabilities")) {
        if !(entry.is_object() || entry.is_array()) {
            continue;
        }
        if let Some(serves) = entry.get("serves") {
            declared.push((name, serves));
        }
    }
    let mut seen: Vec<(String, &str)> = Vec::new();
    for (name, serves) in &declared {
        let signature = serves_signature(serves);
        if let Some((_, prior)) = seen.iter().find(|(s, _)| *s == signature) {
            return fail(format!(
                "\"{prior}\" and \"{name}\" declare the identical \"serves\" attribute set -- capability matching can never distinguish them"
            ));
        }
        seen.push((signature, name));
    }
    let n = declared.len();
    pass(format!(
        "{n} capability entr{} a valid \"serves\" attribute set, none identical",
        if n == 1 { "y declares" } else { "ies declare" }
    ))
}

// ---- omp-natives-present ----------------------------------------------------------------------------------

/// What the omp row reads of the machine. The names are the ones Node spells: `platform` is `linux`, `darwin` or
/// `win32`; `arch` is `x64` or `arm64`.
pub trait OmpHost {
    /// What `omp --version` printed. The error is the failure as Node worded it: the error code (`ENOENT`,
    /// `ETIMEDOUT`) or, without one, its message.
    fn omp_version_output(&self) -> Result<String, String>;
    fn env(&self, key: &str) -> Option<String>;
    fn exists(&self, path: &Path) -> bool;
    fn home(&self) -> PathBuf;
    fn platform(&self) -> &str;
    fn arch(&self) -> &str;
}

const FIX_HINT: &str = "run omp once outside the sandbox after every update";

/// The ids of the executors that run omp (an invocation whose command's file name is `omp`).
pub fn omp_executors_of(runner: &Value) -> Vec<String> {
    let runs_omp = |command: Option<&Value>| {
        command
            .and_then(Value::as_str)
            .is_some_and(|c| c.trim_end_matches('/').rsplit('/').next() == Some("omp"))
    };
    entries_of(runner.get("executors"))
        .filter(|(_, executor)| {
            list_of(executor.get("invocations")).any(|inv| runs_omp(inv.get("command")))
        })
        .map(|(id, _)| id.clone())
        .collect()
}

/// A path with its `.` and `..` steps and repeated separators resolved, without reading the disk.
pub fn cleaned(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for part in path.components() {
        match part {
            Component::CurDir => {}
            Component::ParentDir => {
                if !out.pop() {
                    out.push("..");
                }
            }
            other => out.push(other.as_os_str()),
        }
    }
    out
}

/// omp's own natives directory rule: `PI_NATIVES_DIR` (absolute, `~` expanded), else
/// `$XDG_DATA_HOME/omp/natives` once `$XDG_DATA_HOME/omp` exists, else `~/.omp/natives`.
fn omp_natives_dir(host: &dyn OmpHost) -> PathBuf {
    let home = host.home();
    if let Some(pinned) = host.env("PI_NATIVES_DIR") {
        let pinned = pinned.trim();
        if !pinned.is_empty() {
            let expanded = if pinned == "~" {
                home.clone()
            } else if let Some(rest) = pinned
                .strip_prefix("~/")
                .or_else(|| pinned.strip_prefix("~\\"))
            {
                home.join(rest)
            } else {
                PathBuf::from(pinned)
            };
            if expanded.is_absolute() {
                return cleaned(&expanded);
            }
        }
    }
    if let Some(xdg) = host.env("XDG_DATA_HOME").filter(|x| !x.is_empty()) {
        if host.exists(&Path::new(&xdg).join("omp")) {
            return Path::new(&xdg).join("omp").join("natives");
        }
    }
    home.join(".omp").join("natives")
}

/// The addon file names omp loads for this platform, in omp's own order (x64 has CPU variants).
fn addon_names(platform: &str, arch: &str) -> Vec<String> {
    let tag = format!("{platform}-{arch}");
    let plain = format!("pi_natives.{tag}.node");
    if arch == "x64" {
        vec![
            format!("pi_natives.{tag}-modern.node"),
            format!("pi_natives.{tag}-baseline.node"),
            plain,
        ]
    } else {
        vec![plain]
    }
}

/// The first `\d+\.\d+\.\d+\S*` of the text.
fn first_version(text: &str) -> Option<String> {
    let chars: Vec<(usize, char)> = text.char_indices().collect();
    let digits = |from: usize| {
        chars[from..]
            .iter()
            .take_while(|(_, c)| c.is_ascii_digit())
            .count()
    };
    for start in 0..chars.len() {
        let mut at = start;
        let mut ok = true;
        for part in 0..3 {
            let run = digits(at);
            if run == 0 {
                ok = false;
                break;
            }
            at += run;
            if part < 2 {
                if chars.get(at).map(|(_, c)| *c) != Some('.') {
                    ok = false;
                    break;
                }
                at += 1;
            }
        }
        if ok {
            let tail = chars[at..]
                .iter()
                .take_while(|(_, c)| !c.is_whitespace())
                .count();
            let from = chars[start].0;
            let to = chars.get(at + tail).map_or(text.len(), |(i, _)| *i);
            return Some(text[from..to].to_owned());
        }
    }
    None
}

/// omp extracts its native addon on first start into `<natives dir>/<version>/`; a confined seat sees that
/// directory read-only, so an omp updated and never started outside the sandbox cannot load its addon. The row
/// reads only. `users` are the executors that run omp.
pub fn omp_natives_present(host: &dyn OmpHost, users: &[String]) -> CheckResult {
    let output = match host.omp_version_output() {
        Ok(output) => output,
        Err(why) => {
            let used = if users.is_empty() {
                String::new()
            } else {
                format!(", but executor(s) {} run it", users.join(", "))
            };
            return pass(format!(
                "warning: omp is not installed or did not answer --version ({why}){used}"
            ));
        }
    };
    let Some(version) = first_version(&output) else {
        return pass(
            "warning: omp --version printed no version, so its native addon cannot be located",
        );
    };
    let dir = omp_natives_dir(host).join(&version);
    let names = addon_names(host.platform(), host.arch());
    if let Some(found) = names.iter().find(|name| host.exists(&dir.join(name))) {
        return pass(format!(
            "omp {version} has its native addon {}",
            dir.join(found).display()
        ));
    }
    let missing = format!(
        "omp {version} has no native addon in {} (looked for {})",
        dir.display(),
        names.join(", ")
    );
    if users.is_empty() {
        pass(format!(
            "warning: {missing}; no executor runs omp; {FIX_HINT}"
        ))
    } else {
        fail(format!(
            "{missing}; executor(s) {} run omp, and a confined omp cannot extract it: {FIX_HINT}",
            users.join(", ")
        ))
    }
}

// ---- agy-sub-homes-configured -----------------------------------------------------------------------------

/// What the agy sub-HOME row reads of the machine.
pub trait SubHomes {
    /// The home directory a `~`, `${HOME}` or `$HOME` stands for.
    fn home(&self) -> String;
    /// The absolute form of a path (a relative one against the working directory).
    fn resolve(&self, path: &str) -> String;
    /// Whether the path exists and is a directory.
    fn is_dir(&self, path: &str) -> bool;
}

/// A raw sub-HOME path with `${HOME}`, `$HOME` (whole word) and a leading `~` replaced by the home directory.
fn expand_home(raw: &str, home: &str) -> String {
    let braced = raw.replace("${HOME}", home);
    let mut out = String::new();
    let mut rest = braced.as_str();
    while let Some(at) = rest.find("$HOME") {
        out.push_str(&rest[..at]);
        let after = &rest[at + "$HOME".len()..];
        if after.chars().next().is_some_and(is_word) {
            out.push_str("$HOME");
        } else {
            out.push_str(home);
        }
        rest = after;
    }
    out.push_str(rest);
    if out == "~" || out.starts_with("~/") {
        out.replace_range(..1, home);
    }
    out
}

/// The environment variable an invocation's `env` sets to give its agent its own home.
const ENV_HOME_KEY: &str = "HOME";

struct SubHome {
    raw: String,
    resolved: String,
}

/// The agy sub-HOMEs the executor config and the `gemini` accounts of `runner.llmAccounts` name, first one per
/// resolved path, in the order the config declares them.
fn find_sub_homes(runner: &Value, host: &dyn SubHomes) -> Vec<SubHome> {
    let home = host.home();
    let mut found: Vec<SubHome> = Vec::new();
    let mut add = |raw: &str| {
        let resolved = host.resolve(&expand_home(raw, &home));
        if !found.iter().any(|f| f.resolved == resolved) {
            found.push(SubHome {
                raw: raw.to_owned(),
                resolved,
            });
        }
    };
    let mut from_env = |env: Option<&Value>,
                        executor_id: &str,
                        invocation_id: Option<&str>,
                        command: Option<&str>| {
        let Some(raw) = env
            .and_then(|e| e.get(ENV_HOME_KEY))
            .and_then(Value::as_str)
        else {
            return;
        };
        let raw = raw.trim();
        if raw.is_empty() {
            return;
        }
        let is_agy = command == Some("agy")
            || executor_id == "agy"
            || invocation_id.is_some_and(|id| id.contains("agy"))
            || raw.contains("agy-homes");
        if is_agy {
            add(raw);
        }
    };
    if let Some(executor) = runner.get("executor").filter(|e| e.is_object()) {
        let default_command = executor.get("command").and_then(Value::as_str);
        from_env(executor.get("env"), "executor", None, default_command);
        for inv in list_of(executor.get("invocations")).filter(|i| i.is_object()) {
            let command = inv
                .get("command")
                .and_then(Value::as_str)
                .or(default_command);
            from_env(
                inv.get("env"),
                "executor",
                inv.get("id").and_then(Value::as_str),
                command,
            );
        }
    }
    for (id, executor) in entries_of(runner.get("executors")).filter(|(_, e)| e.is_object()) {
        for inv in list_of(executor.get("invocations")).filter(|i| i.is_object()) {
            from_env(
                inv.get("env"),
                id,
                inv.get("id").and_then(Value::as_str),
                inv.get("command").and_then(Value::as_str),
            );
        }
    }
    for (_, account) in entries_of(runner.get("llmAccounts").and_then(|a| a.get("gemini"))) {
        let raw = account
            .get("credentialStore")
            .and_then(|s| s.get("agy"))
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|raw| !raw.is_empty());
        if let Some(raw) = raw {
            add(raw);
        }
    }
    found
}

/// Each agy sub-HOME an executor config or a gemini account of `runner.llmAccounts` names exists as a
/// directory. The settings a run needs travel with the invocation, so no sub-HOME's own file is read.
pub fn agy_sub_homes_configured(runner: &Value, host: &dyn SubHomes) -> CheckResult {
    let homes = find_sub_homes(runner, host);
    if homes.is_empty() {
        return pass("no agy sub-HOMEs referenced in executor configs or the gemini accounts \u{2014} nothing to check");
    }
    let missing: Vec<String> = homes
        .iter()
        .filter(|h| !host.is_dir(&h.resolved))
        .map(|h| format!("{} ({})", h.raw, h.resolved))
        .collect();
    if !missing.is_empty() {
        return fail(format!(
            "agy sub-HOME check failed (not a directory: {}) \u{2014} each sub-HOME an executor or a gemini account names must exist",
            missing.join(", ")
        ));
    }
    pass(format!(
        "all {} agy sub-HOME(s) exist ({})",
        homes.len(),
        homes
            .iter()
            .map(|h| h.raw.as_str())
            .collect::<Vec<_>>()
            .join(", ")
    ))
}

// ---- tool-registry-configured -----------------------------------------------------------------------------

/// The tool registry posture: inactive when no tool is declared, full when every one is present, degraded (a
/// failure) when any is stale, missing or cannot be probed.
pub fn tool_registry_configured(posture: &ToolPosture) -> CheckResult {
    match posture {
        ToolPosture::Inactive => pass(
            "inactive \u{2014} no tool-capable executors declared (declare one under runner.executors with fgos config set)",
        ),
        ToolPosture::Full { present } => {
            pass(format!("full \u{2014} {present}/{present} tool(s) present"))
        }
        ToolPosture::Degraded {
            present,
            total,
            stale,
            missing,
            unknown,
        } => fail(format!(
            "degraded \u{2014} {present}/{total} tool(s) present ({stale} stale, {missing} missing, {unknown} cannot be probed) \u{2014} install the missing tool, or reindex the stale one; fgos dispatch decide --for <capability> shows the answer a dispatch gets"
        )),
    }
}
