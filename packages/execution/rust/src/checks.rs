//! The doctor judgements over the runner config and the machine facts it names: one pure function per row, each
//! answering the pass/fail and the one sentence the row shows. The host reads the config and the machine, hands
//! them in (through the small traits below where a row reads the machine) and words nothing itself.
//!
//! Rows: `runner-generated-paths`, `executor-confinement`, `invocation-git-write-grants`,
//! `capability-serves-valid`, `omp-natives-present`, `agy-sub-homes-configured`, `tool-registry-configured`,
//! `executor-family-unique`, `executor-skills-installed`, `tier-fallback`, `model-policy-pools`,
//! `llm-accounts-shape`, `llm-accounts-default-login-home`, `agent-type-names-unique`,
//! `executor-profile-warnings`, `session-keep-declared`, `provider-capacity-state`, `confined-pane-accounts`,
//! `operation-prompt-templates-valid`. Every row of the execution doctor group is judged here except
//! `seat-binding-route`, which asks the host's own route and so is judged where that route lives. What a row
//! reads from the machine or from an engine reader (a file, the login homes, the agent tiers, the policy-shaped
//! flags of an argv, the prompt template discovery) arrives as a port or as the reader's result.
//! Every message is the sentence the Node judge printed before it was deleted; the vectors of `packages/execution/contracts/checks.v1.json`
//! state them. A message that starts with `warning:` is a warning, anything else passes; `passed: false` fails.

use crate::accounts::{
    credential_source_for_cli, expand_credential_home, legacy_state_key,
    provider_account_inventory, read_llm_accounts,
};
use crate::agents::{self, ShippedCore, TierFiles};
use crate::executor_model::{credential_store_of, family_of, has_own_prefer_pool, FamilySource};
use crate::ports::Machine;
use crate::runner_check::validate_generated_paths_shape;
use crate::tier_cell::parse_tier_cell;
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
        command.and_then(Value::as_str).is_some_and(|c| {
            c.trim_end_matches(['/', '\\']).rsplit(['/', '\\']).next() == Some("omp")
        })
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
                // Above a root there is nothing to pop and nothing to keep: `/../x` is `/x`.
                if !out.pop() && !out.has_root() {
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

// ---- executor families, skills and tier fallback ----------------------------------------------------------

/// The files a row reads from the machine: a file's text (`None` when it is missing or unreadable) and whether a
/// path exists.
pub trait HostFiles {
    fn read_text(&self, file: &Path) -> Option<String>;
    fn exists(&self, path: &Path) -> bool;
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

/// A string as the doctor prints it: its text, or the JSON of anything else.
fn text_of(value: &Value) -> String {
    value
        .as_str()
        .map_or_else(|| value.to_string(), str::to_owned)
}

/// Two agent executors of one family split its pool: which one runs then depends on the session.
pub fn executor_family_unique(runner: &Value) -> CheckResult {
    let mut by_family: Vec<(String, Vec<&str>)> = Vec::new();
    for (id, entry) in entries_of(runner.get("executors")).filter(|(_, entry)| is_agent(entry)) {
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

fn skill_file_state(files: &dyn HostFiles, file: &Path) -> &'static str {
    match files.read_text(file) {
        None => "missing",
        Some(text) if text.trim().is_empty() => "empty",
        Some(_) => "ok",
    }
}

/// An executor that declares `supports.skills` is only truthful when the skill is installed in its runtime's skill
/// directory, at project level or (for the CLIs that read one) the user's home, with content. Judges the main
/// checkout only: a linked worktree gets skills from worktreeSetup provisioning alone.
pub fn executor_skills_installed(
    runner: &Value,
    root: &Path,
    home: &Path,
    machine: &dyn Machine,
    files: &dyn HostFiles,
) -> CheckResult {
    let mut missing: Vec<String> = Vec::new();
    let mut unchecked: Vec<String> = Vec::new();
    let mut not_installed: Vec<String> = Vec::new();
    let mut checked = 0usize;
    for (id, entry) in entries_of(runner.get("executors")) {
        let Some(skills) = entry
            .pointer("/supports/skills")
            .and_then(Value::as_array)
            .filter(|_| is_agent(entry))
        else {
            continue;
        };
        let mut commands: Vec<&str> = Vec::new();
        for command in list_of(entry.get("invocations"))
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
            if !machine.on_path(command) {
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
                    .map(|file| skill_file_state(files, file))
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
pub fn tier_fallback(runner: &Value) -> CheckResult {
    let declared: Vec<(&String, &Value)> = entries_of(runner.get("tierFallback")).collect();
    if declared.is_empty() {
        return pass("runner.tierFallback not declared; every tier walks its capability prefer order after a failure");
    }
    let served: Vec<String> = entries_of(runner.get("executors"))
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

// ---- accounts ---------------------------------------------------------------------------------------------

/// A tier cell entry served by a pool runner.llmAccounts does not declare cannot run once pools route.
pub fn model_policy_pools(runner: &Value, machine: &dyn Machine) -> CheckResult {
    let mut explicit: Vec<(String, String)> = Vec::new();
    for (family, tiers) in entries_of(runner.get("modelPolicies")) {
        for (tier, cell) in entries_of(Some(tiers)) {
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
pub fn llm_accounts_shape(runner: &Value, machine: &dyn Machine) -> CheckResult {
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
            for gap in list_of(
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
/// refresh token. Warns, never refuses, so a single-account user still runs. `hits` are the stores the engine's
/// login-home reader found on a default login home, each `{pool, account, cli, key}`.
pub fn llm_accounts_default_login_home(hits: &[Value]) -> CheckResult {
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

/// The login-home stores a pane starts from: the declared files, or those of a `home-files` source, or the
/// CLI's `auth.json`.
fn pane_store_files(store: &Value, source: &Value) -> Vec<String> {
    match store.get("files").and_then(Value::as_array) {
        Some(files) => files
            .iter()
            .filter_map(Value::as_str)
            .map(str::to_owned)
            .collect(),
        None if source.get("kind").and_then(Value::as_str) == Some("home-files") => {
            list_of(source.get("files"))
                .filter_map(Value::as_str)
                .map(str::to_owned)
                .collect()
        }
        None => vec!["auth.json".to_owned()],
    }
}

/// A confined invocation that reads a login store starts in an empty private home: the account's login only gets
/// there when the machine-global provider account inventory names it. Names, per invocation, what would leave an
/// agent logged out.
pub fn confined_pane_accounts(
    runner: &Value,
    inventory: &Map<String, Value>,
    home: &Path,
    machine: &dyn Machine,
    files: &dyn HostFiles,
) -> CheckResult {
    let mut problems: Vec<String> = Vec::new();
    let mut notes: Vec<String> = Vec::new();
    for (id, executor) in entries_of(runner.get("executors")) {
        for inv in list_of(executor.get("invocations")) {
            let Some(store) = credential_store_of(inv) else {
                continue;
            };
            let label = format!(
                "executor \"{id}\" invocation \"{}\"",
                inv.get("id").map_or_else(|| "?".to_owned(), text_of)
            );
            let command = inv.get("command").and_then(Value::as_str);
            if !command.is_some_and(|command| machine.on_path(command)) {
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
            let accounts: Vec<&Value> = entries_of(
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
                    .map_or_else(|| "undefined".to_owned(), text_of);
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
                let home_dir = expand_credential_home(source_home, Some(&home.to_string_lossy()))
                    .unwrap_or_else(|| source_home.to_owned());
                let store_files = pane_store_files(store, source);
                let missing: Vec<&String> = store_files
                    .iter()
                    .filter(|rel| !files.exists(&Path::new(&home_dir).join(rel)))
                    .collect();
                if missing.len() == store_files.len() {
                    problems.push(format!(
                        "{label}: account \"{account_id}\" has none of {} under {home_dir}, so nothing is copied and its agent starts logged out",
                        store_files.join(", ")
                    ));
                } else if !missing.is_empty() {
                    notes.push(format!(
                        "{label}: account \"{account_id}\" has {} of {} credential file(s); absent: {}",
                        store_files.len() - missing.len(),
                        store_files.len(),
                        missing.iter().map(|f| f.as_str()).collect::<Vec<_>>().join(", ")
                    ));
                } else {
                    notes.push(format!(
                        "{label}: account \"{account_id}\" has its {} credential file(s)",
                        store_files.len()
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

/// Provider-capacity state of the machine's account inventory: reportable, never auto-cleared. `report` is the
/// engine's inspection of that inventory.
pub fn provider_capacity_verdict(report: &Value) -> CheckResult {
    let accounts: Vec<&Value> = entries_of(report.get("providers"))
        .flat_map(|(_, provider)| entries_of(provider.get("accounts")).map(|(_, account)| account))
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
                .map_or_else(String::new, |until| format!(":until={}", text_of(until)));
            format!(
                "{}:{reason}{manual}{until}",
                account
                    .get("accountId")
                    .map_or_else(|| "undefined".to_owned(), text_of)
            )
        })
        .collect();
    fail(format!(
        "provider-capacity quarantine present ({}) — inspect with \"fgos dispatch inspect --provider-capacity\"; clear manually with \"fgos dispatch reconcile provider-capacity clear-quarantine\" after the operator fix",
        summary.join(", ")
    ))
}

// ---- executor profile and session warnings ----------------------------------------------------------------

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

/// Legacy executor entries hardcoding policy-shaped behaviour, each named with its migration target. Warns only.
/// `policy_shaped_flags` is the provider adapter's reading of which flags of an argv encode runtime policy.
pub fn executor_profile_warnings(
    runner: &Value,
    policy_shaped_flags: &dyn Fn(&[String]) -> Vec<String>,
) -> CheckResult {
    let mut warnings: Vec<(String, String)> = Vec::new();
    for (executor_id, executor) in entries_of(runner.get("executors")) {
        let cli = list_of(executor.get("invocations"))
            .find(|inv| inv.get("via").and_then(Value::as_str) == Some("cli"));
        let for_list: Vec<&Value> = list_of(executor.get("for")).collect();
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
        let args: Vec<String> = list_of(cli.and_then(|inv| inv.get("args")))
            .filter_map(|arg| arg.as_str().map(str::to_owned))
            .collect();
        if !policy_shaped_flags(&args).is_empty() {
            warnings.push((
                format!("executor.{executor_id}.policy-shaped-flags"),
                "ProviderAdapter runtime option (design.md §3.5)".to_owned(),
            ));
        }
        for (name, _) in entries_of(cli.and_then(|inv| inv.get("env"))) {
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
    for (executor_id, executor) in entries_of(runner.get("executors")) {
        if executor
            .get("kind")
            .and_then(Value::as_str)
            .unwrap_or("agent")
            != "agent"
        {
            continue;
        }
        for invocation in list_of(executor.get("invocations")) {
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
                    .map_or_else(|| "undefined".to_owned(), text_of);
                found.push(format!("{executor_id}/{id}"));
            }
        }
    }
    found
}

pub fn session_keep_declared(runner: &Value) -> CheckResult {
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

// ---- agent definitions and prompt templates ---------------------------------------------------------------

/// Agent definition names are unique within each tier the project supplies (`fgos/agents`, and `core/agents` when
/// the project carries its own), and every `fgos/agents` file has the shape the renderer needs. The tiers read from
/// the installed release are judged by `npm test`, never here. A higher tier replacing a lower one is a
/// customization, named; render warnings and installed personas the project's own `core/agents` hides are warnings
/// in the message, never a failure. The listing is `fgos agents list`'s. `tiers` and `shipped` are what the host's
/// tier reader found; `project_owns_tiers` is false when the project folder is the installed release itself.
pub fn agent_type_names_unique(
    tiers: &[TierFiles],
    shipped: Option<&[ShippedCore]>,
    project_owns_tiers: bool,
) -> CheckResult {
    let listing = agents::list(tiers, shipped);
    // The core tier is the project's own exactly when the tier reader found shipped personas it can hide.
    let project_tier = |tier: &str| {
        project_owns_tiers && (tier == "workspace" || (tier == "core" && shipped.is_some()))
    };
    let mut problems: Vec<String> = listing
        .duplicates
        .iter()
        .filter(|duplicate| project_tier(&duplicate.tier))
        .map(|duplicate| {
            format!(
                "duplicate agent-type name \"{}\" in {} ({})",
                duplicate.name,
                duplicate.label,
                duplicate.files.join(", ")
            )
        })
        .collect();
    let mut notes: Vec<String> = Vec::new();
    let mut customizations: Vec<String> = Vec::new();
    if project_tier("workspace") {
        for agent in listing
            .agents
            .iter()
            .filter(|agent| agent.tier == "workspace")
        {
            problems.extend(
                agent
                    .problems
                    .iter()
                    .map(|problem| format!("{}: {problem}", agent.source)),
            );
            notes.extend(
                agent
                    .warnings
                    .iter()
                    .map(|warning| format!("{}: {warning}", agent.source)),
            );
            customizations.push(match agent.shadows.first() {
                Some(lower) => format!("{} (replaces {lower})", agent.name),
                None => agent.name.clone(),
            });
        }
        problems.extend(
            tiers
                .iter()
                .filter(|tier| tier.tier == "workspace")
                .flat_map(|tier| tier.ignored.iter())
                .map(|rel| format!("{rel} is ignored: only .yaml files are read")),
        );
    }
    let workspace_label = tiers
        .iter()
        .find(|tier| tier.tier == "workspace")
        .map_or("", |tier| tier.label.as_str());
    notes.extend(listing.masked.iter().map(|hidden| {
        format!(
            "installed persona \"{}\" ({}) is hidden by {}; copy it there or into {workspace_label} to seat it",
            hidden.name, hidden.source, hidden.hidden_by
        )
    }));
    if !problems.is_empty() {
        return fail(format!("agent definitions: {}", problems.join("; ")));
    }
    let tail = if notes.is_empty() {
        String::new()
    } else {
        format!("; warning: {}", notes.join("; "))
    };
    pass(if customizations.is_empty() {
        format!(
            "agent-type names are unique within each tier ({}){tail}",
            tiers
                .iter()
                .map(|tier| tier.label.as_str())
                .collect::<Vec<_>>()
                .join(", ")
        )
    } else {
        format!(
            "agent-type names are unique within each tier; {workspace_label} holds {}{tail}",
            customizations.join(", ")
        )
    })
}

/// Every operation prompt template of the project tier validates against the bounded variables and schema.
/// `discovered` is the engine's discovery: how many templates it found, or the message of the one it refused.
pub fn operation_prompt_templates_valid(discovered: Result<usize, &str>) -> CheckResult {
    match discovered {
        Ok(found) => pass(format!(
            "{found} project operation prompt template(s) discovered and validated cleanly"
        )),
        Err(message) => fail(format!("malformed operation prompt template -- {message}")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agents::{AgentFile, Content};
    use crate::ports::Backend;
    use std::collections::BTreeMap;

    /// A machine whose person's home is `/home/u`, where every program is on PATH or none is, and whose files are
    /// the ones put in `files`.
    struct World {
        on_path: bool,
        home: String,
        files: BTreeMap<PathBuf, String>,
    }

    impl World {
        fn new() -> Self {
            World {
                on_path: true,
                home: "/home/u".to_owned(),
                files: BTreeMap::new(),
            }
        }

        fn with_file(mut self, file: &str, text: &str) -> Self {
            self.files.insert(PathBuf::from(file), text.to_owned());
            self
        }
    }

    impl Machine for World {
        fn on_path(&self, _: &str) -> bool {
            self.on_path
        }
        fn posture_backend(&self, _: &str) -> Option<Backend> {
            None
        }
        fn herdr_present(&self) -> bool {
            false
        }
        fn home_dir(&self) -> Option<String> {
            Some(self.home.clone())
        }
    }

    impl HostFiles for World {
        fn read_text(&self, file: &Path) -> Option<String> {
            self.files.get(file).cloned()
        }
        fn exists(&self, path: &Path) -> bool {
            self.files.contains_key(path)
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
        let dir = Path::new("/p");
        let runner = json!({"executors": {"e": {"kind": "agent",
            "supports": {"skills": ["ak:plan"]},
            "invocations": [{"command": "claude"}]}}});
        let mut world = World::new();
        let result = executor_skills_installed(&runner, dir, dir, &world, &world);
        assert!(!result.passed);
        assert!(result.message.contains("ak:plan"), "{}", result.message);
        world = world.with_file("/p/.claude/skills/ak-plan/SKILL.md", "body");
        assert!(executor_skills_installed(&runner, dir, dir, &world, &world).passed);
        world.on_path = false;
        let absent = executor_skills_installed(&runner, dir, dir, &world, &world);
        assert!(absent.message.contains("CLI not installed"));
    }

    #[test]
    fn a_user_level_skill_counts_an_empty_one_does_not_and_an_unknown_cli_is_not_checked() {
        let (root, home) = (Path::new("/r"), Path::new("/h"));
        let runner = json!({"executors": {"e": {"kind": "agent",
            "supports": {"skills": ["ak:plan"]},
            "invocations": [{"command": "claude"}]}}});
        let mut world = World::new().with_file("/h/.claude/skills/ak-plan/SKILL.md", "body");
        assert!(executor_skills_installed(&runner, root, home, &world, &world).passed);
        world = world.with_file("/h/.claude/skills/ak-plan/SKILL.md", "  \n");
        let empty = executor_skills_installed(&runner, root, home, &world, &world);
        assert!(
            !empty.passed && empty.message.contains("is empty"),
            "{}",
            empty.message
        );
        let other = json!({"executors": {"e": {"kind": "agent",
            "supports": {"skills": ["ak:plan"]},
            "invocations": [{"command": "/opt/bin/mystery"}]}}});
        let unchecked = executor_skills_installed(&other, root, home, &world, &world);
        assert!(
            unchecked.passed
                && unchecked
                    .message
                    .contains("not checked, no known skill directory: e (cli mystery)"),
            "{}",
            unchecked.message
        );
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
        let result = model_policy_pools(&runner, &World::new());
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
            model_policy_pools(&runner, &World::new()).message,
            "no tier cell names a pool"
        );
    }

    #[test]
    fn llm_accounts_not_declared_passes_with_the_providers_note() {
        let result = llm_accounts_shape(&json!({}), &World::new());
        assert!(result.passed && result.message.contains("not declared"));
    }

    #[test]
    fn an_inventory_problem_fails_llm_accounts_shape_and_a_valid_one_counts_its_accounts() {
        let bad = json!({"llmAccounts": {"bad@pool": {"one": {"credentialStore": {"claude": "/tmp/one"}}}}});
        let result = llm_accounts_shape(&bad, &World::new());
        assert!(!result.passed, "{}", result.message);
        assert!(result.message.contains("bad@pool"), "{}", result.message);
        let good = json!({"llmAccounts": {"claude": {"one": {"credentialStore": {"claude": "/tmp/one"}}}}});
        let ok = llm_accounts_shape(&good, &World::new());
        assert!(ok.passed, "{}", ok.message);
    }

    #[test]
    fn a_store_on_a_default_login_home_warns_and_a_private_one_does_not() {
        let hit = json!({"pool": "claude", "account": "one", "cli": "claude",
            "key": "runner.llmAccounts.claude.one.credentialStore.claude"});
        let warned = llm_accounts_default_login_home(&[hit]);
        assert!(
            warned.passed
                && warned
                    .message
                    .starts_with("warning: stores on a default login home: "),
            "{}",
            warned.message
        );
        assert_eq!(
            llm_accounts_default_login_home(&[]).message,
            "no runner.llmAccounts store sits on its CLI default login home"
        );
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

    /// Reads every long option as policy-shaped, which is all these rows need of the provider adapter's reading.
    fn long_flags(args: &[String]) -> Vec<String> {
        args.iter()
            .filter(|arg| arg.starts_with("--"))
            .cloned()
            .collect()
    }

    #[test]
    fn an_account_pool_env_name_and_policy_flags_are_warned() {
        let runner = json!({"executors": {"e": {"kind": "agent", "invocations": [
            {"via": "cli", "args": ["--model", "x"], "env": {"X_ACCOUNT_POOL": "1"}}]}}});
        let result = executor_profile_warnings(&runner, &long_flags);
        assert!(result.passed);
        assert!(result.message.contains("executor.e.policy-shaped-flags"));
        assert!(result.message.contains("account-pool-env.X_ACCOUNT_POOL"));
    }

    #[test]
    fn a_for_on_an_agent_executor_and_a_prefer_on_a_tool_served_capability_are_warned_and_a_clean_config_is_not(
    ) {
        let runner = json!({
            "executors": {
                "a": {"kind": "agent", "for": ["review"]},
                "t": {"kind": "tool", "for": ["impact-analysis"]}},
            "capabilities": {"impact-analysis": {"prefer": ["t"]}}
        });
        let result = executor_profile_warnings(&runner, &long_flags);
        assert!(result.passed);
        assert!(
            result.message.contains("executor.a.agent-for-inert"),
            "{}",
            result.message
        );
        assert!(
            result
                .message
                .contains("executor.t.tool-purpose-prefer-ignored.impact-analysis"),
            "{}",
            result.message
        );
        let clean = json!({"executors": {"a": {"kind": "agent", "invocations": [
            {"via": "cli", "args": [], "env": {"PATH": "/bin"}}]}}});
        assert_eq!(
            executor_profile_warnings(&clean, &long_flags).message,
            "no legacy policy-shaped executor/capability entries found"
        );
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
        let mut world = World::new();
        let result = confined_pane_accounts(&runner, &Map::new(), Path::new("/h"), &world, &world);
        assert!(
            !result.passed
                && result
                    .message
                    .contains("no runner.llmAccounts pool for claude")
        );
        world.on_path = false;
        let skipped = confined_pane_accounts(&runner, &Map::new(), Path::new("/h"), &world, &world);
        assert!(skipped.passed && skipped.message.contains("not installed"));
    }

    fn pane_runner(files: Option<&[&str]>, store_home: &str) -> Value {
        let mut store = json!({"use": "codex", "homeEnv": "CODEX_HOME"});
        if let Some(files) = files {
            store["files"] = json!(files);
        }
        json!({
            "executors": {"openai": {"providerModel": "openai", "invocations": [
                {"id": "codex-pane", "command": "codex", "credentialStore": store}]}},
            "llmAccounts": {"openai": {"acct": {"credentialStore": {"codex": store_home}}}}
        })
    }

    fn pane_check(runner: &Value, world: &World) -> CheckResult {
        let inventory = provider_account_inventory(runner, world);
        confined_pane_accounts(runner, &inventory, Path::new(&world.home), world, world)
    }

    #[test]
    fn a_confined_pane_store_passes_while_some_declared_file_exists_and_fails_when_none_does() {
        let mut world = World::new().with_file("/h/auth.json", "{}");
        world.home = "/h".to_owned();
        assert!(
            pane_check(&pane_runner(None, "/h"), &world).passed,
            "an undeclared codex store is its auth.json"
        );
        let partial = pane_check(
            &pane_runner(Some(&["auth.json", "models.json"]), "/h"),
            &world,
        );
        assert!(partial.passed, "{}", partial.message);
        assert!(
            partial
                .message
                .contains("account \"acct\" has 1 of 2 credential file(s); absent: models.json"),
            "{}",
            partial.message
        );
        let none = pane_check(
            &pane_runner(Some(&["models.json", "settings.json"]), "/h"),
            &world,
        );
        assert!(!none.passed);
        assert!(
            none.message
                .contains("account \"acct\" has none of models.json, settings.json under "),
            "{}",
            none.message
        );
        assert!(
            none.message.contains("nothing is copied"),
            "{}",
            none.message
        );
        let all = pane_check(&pane_runner(Some(&["auth.json"]), "/h"), &world);
        assert!(
            all.message.contains("has its 1 credential file(s)"),
            "{}",
            all.message
        );
    }

    #[test]
    fn a_confined_pane_store_under_tilde_or_home_variables_is_read_in_the_persons_home() {
        let mut world = World::new().with_file("/h/creds/auth.json", "{}");
        world.home = "/h".to_owned();
        for prefix in ["$HOME", "${HOME}", "~"] {
            let result = pane_check(&pane_runner(None, &format!("{prefix}/creds")), &world);
            assert!(result.passed, "{prefix}: {}", result.message);
        }
    }

    #[test]
    fn no_invocation_reading_a_login_store_leaves_the_pane_row_nothing_to_say() {
        let runner =
            json!({"executors": {"a": {"invocations": [{"id": "x", "adapter": "herdr-spawn"}]}}});
        let world = World::new();
        let result = confined_pane_accounts(&runner, &Map::new(), Path::new("/h"), &world, &world);
        assert_eq!(result.message, "no confined invocation reads a login store");
    }

    /// One agent definition file of a tier: `(name, project-relative path, text)`.
    fn tier(name: &str, label: &str, files: &[(&str, &str, &str)], ignored: &[&str]) -> TierFiles {
        TierFiles {
            tier: name.to_owned(),
            label: label.to_owned(),
            files: files
                .iter()
                .map(|(file, rel, text)| AgentFile {
                    name: (*file).to_owned(),
                    rel: (*rel).to_owned(),
                    content: Content::Bytes(text.as_bytes().to_vec()),
                })
                .collect(),
            ignored: ignored.iter().map(|rel| (*rel).to_owned()).collect(),
        }
    }

    const PERSONA: &str = "description: a persona\n";

    #[test]
    fn a_workspace_definition_of_the_wrong_shape_or_extension_or_unparsable_fails_the_agent_row() {
        let workspace = tier(
            "workspace",
            "fgos/agents",
            &[
                (
                    "wrong-name",
                    "fgos/agents/wrong-name.yaml",
                    "name: other\ndescription: a persona\n",
                ),
                (
                    "no-description",
                    "fgos/agents/no-description.yaml",
                    "name: no-description\n",
                ),
                (
                    "broken",
                    "fgos/agents/broken.yaml",
                    "name: broken\ndescription: a: b\n",
                ),
            ],
            &["fgos/agents/typo.yml"],
        );
        let tiers = [
            workspace,
            tier("domain", "domains/*/agents", &[], &[]),
            tier("core", "core/agents", &[], &[]),
        ];
        let result = agent_type_names_unique(&tiers, None, true);
        assert!(!result.passed, "{}", result.message);
        for expected in [
            "fgos/agents/wrong-name.yaml: must declare name: wrong-name",
            "fgos/agents/no-description.yaml: must declare a non-empty description",
            "fgos/agents/typo.yml is ignored: only .yaml files are read",
            "fgos/agents/broken.yaml: cannot be parsed: ",
        ] {
            assert!(
                result.message.contains(expected),
                "{expected} in {}",
                result.message
            );
        }
        assert!(
            result.message.contains("(line 2, column "),
            "{}",
            result.message
        );
    }

    #[test]
    fn a_workspace_persona_replacing_an_installed_one_is_named_and_installed_duplicates_are_not_judged(
    ) {
        let dup = format!("name: dup-agent\n{PERSONA}");
        let installed = |workspace: &[(&str, &str, &str)]| {
            [
                tier("workspace", "fgos/agents", workspace, &[]),
                tier(
                    "domain",
                    "domains/*/agents",
                    &[
                        (
                            "dup-agent",
                            "domains/coding/agents/dup-agent.yaml",
                            dup.as_str(),
                        ),
                        // Two domains defining one name is a duplicate of the installed release: npm test
                        // judges it.
                        (
                            "dup-agent",
                            "domains/finance/agents/dup-agent.yaml",
                            dup.as_str(),
                        ),
                    ],
                    &[],
                ),
                tier(
                    "core",
                    "core/agents",
                    &[("dup-agent", "core/agents/dup-agent.yaml", dup.as_str())],
                    &[],
                ),
            ]
        };
        let tiers = installed(&[("dup-agent", "fgos/agents/dup-agent.yaml", dup.as_str())]);
        let result = agent_type_names_unique(&tiers, None, true);
        assert!(result.passed, "{}", result.message);
        assert!(
            result.message.contains(
                "fgos/agents holds dup-agent (replaces domains/coding/agents/dup-agent.yaml)"
            ),
            "{}",
            result.message
        );
        let quiet = agent_type_names_unique(&installed(&[]), None, true);
        assert_eq!(
            quiet.message,
            "agent-type names are unique within each tier (fgos/agents, domains/*/agents, core/agents)"
        );
    }

    #[test]
    fn an_installed_persona_hidden_by_the_projects_own_core_folder_is_a_warning_not_a_failure() {
        let own = format!("name: own\n{PERSONA}");
        let shipped_text = format!("name: shipped\n{PERSONA}");
        let shipped = [ShippedCore {
            name: "shipped".to_owned(),
            rel: "core/agents/shipped.yaml".to_owned(),
        }];
        let tiers = [
            tier("workspace", "fgos/agents", &[], &[]),
            tier("domain", "domains/*/agents", &[], &[]),
            tier(
                "core",
                "core/agents",
                &[("own", "core/agents/own.yaml", own.as_str())],
                &[],
            ),
        ];
        let result = agent_type_names_unique(&tiers, Some(&shipped), true);
        assert!(result.passed, "{}", result.message);
        assert!(
            result.message.contains("; warning: installed persona \"shipped\" (core/agents/shipped.yaml) is hidden by core/agents/ of this project; copy it there or into fgos/agents to seat it"),
            "{}",
            result.message
        );
        // The release itself, judged as a project, has no tier of its own here.
        let release = [
            tier("workspace", "fgos/agents", &[], &[]),
            tier("domain", "domains/*/agents", &[], &[]),
            tier(
                "core",
                "core/agents",
                &[("shipped", "core/agents/shipped.yaml", shipped_text.as_str())],
                &[],
            ),
        ];
        let own = agent_type_names_unique(&release, None, false);
        assert!(
            own.passed && !own.message.contains("warning"),
            "{}",
            own.message
        );
    }

    #[test]
    fn a_prompt_template_discovery_result_is_worded_as_found_or_malformed() {
        assert!(operation_prompt_templates_valid(Ok(0))
            .message
            .starts_with("0 project operation prompt template"));
        let broken = operation_prompt_templates_valid(Err("forbiddenVar"));
        assert!(
            !broken.passed
                && broken.message == "malformed operation prompt template -- forbiddenVar"
        );
    }
}
