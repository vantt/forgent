//! The agent hook table: the fgOS hook entries a project's agent CLIs carry, rendered, checked and
//! removed from one table.
//!
//! Claude Code (`settings.json` in its project directory), Codex and agy (a JSON hook file each) and omp
//! and pi (one generated extension file each) read the same rows. Rules:
//!
//! - Project only: writes stay inside the project root; a person's own agent config is never touched
//!   (that is `agent_config`, run only by `fgos wire-agents`).
//! - One door: every command points at the project's stable shim, an absolute single-quoted path (agy
//!   runs a hook outside the project) or Claude Code's project variable.
//! - Fill only: other keys, custom hooks and unrelated settings stay. A command of an earlier form (an
//!   older keyword list, another project path, a retired script) is recognised as ours and replaced in
//!   place, never duplicated.
//! - A malformed hook file is skipped and reported, never rewritten.
//! - The check also probes that the shim runs, with benign input and a finite timeout.
//!
//! The bytes written equal what the earlier Node module wrote: `tests/goldens/agent-hooks-vectors.json` holds
//! the vectors both owners were proved against, and the run supervisor's trust store hashes hook bytes.
//!
//! The mailbox hook rows follow `mailbox.enabled`, which this module reads (the mailbox limits contract,
//! frozen by content, still names its reader `setup`): a project that opted out gets none and loses the
//! ones an earlier install wrote; a refused config leaves the rows exactly as they are.

use std::collections::{HashMap, HashSet};
use std::ffi::OsStr;
use std::io;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;
use std::time::Duration;

use serde::Serialize;
use serde_json::{json, Map, Value};

/// The environment lookup of a caller: the host passes the process environment, a test its own.
pub type Env<'a> = &'a dyn Fn(&str) -> Option<String>;

/// The CLIs the table serves, in the order an install and a check visit them.
pub const SUPPORTED_AGENTS: [&str; 5] = ["claude", "codex", "agy", "omp", "pi"];

const KIND_DISPATCH: &str = "dispatch-decide";
const KIND_DECISION: &str = "decision-question";
const KIND_MAILBOX: &str = "mailbox";
const KIND_SESSION: &str = "session-register";
const KIND_DELETE_GUARD: &str = "main-checkout-delete-guard";

/// The shim relative to the project root, with forward slashes.
pub fn shim_relative() -> &'static str {
    crate::shim::PROJECT_SHIM_RELATIVE
}

pub use crate::shim::project_shim_path;

const SESSION_REGISTER_ARGS: &str = "identity session --register";
const SESSION_REGISTER_TIMEOUT_SEC: u64 = 10;
const AGY_ALLOW: &str = r#"{"decision":"allow"}"#;

// ---------------------------------------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------------------------------------

/// A failure of the module itself: the file system, or the config door when it fails (a refused config is
/// an answer, never this).
#[derive(Debug, thiserror::Error)]
pub enum AgentHooksError {
    #[error("{path}: {source}")]
    Io {
        path: PathBuf,
        #[source]
        source: io::Error,
    },
    #[error("config read failed: {0}")]
    Config(String),
}

fn io_err(path: &Path) -> impl FnOnce(io::Error) -> AgentHooksError + '_ {
    move |source| AgentHooksError::Io {
        path: path.to_path_buf(),
        source,
    }
}

// ---------------------------------------------------------------------------------------------------------
// The mailbox opt-in and the hook timeout (the readers of `mailbox.*` for the hook rows)
// ---------------------------------------------------------------------------------------------------------

/// The project's mailbox opt-in: `mailbox.enabled` effective, or unknown because the config is refused.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MailboxOptIn {
    On,
    Off,
    /// The config door refused the project's (or the global) config. `reason` is `config:<code>`, `file` the
    /// refused source as the door names it (`project:config.yaml`).
    Refused {
        reason: String,
        code: String,
        file: Option<String>,
    },
}

/// Ids the door itself reports; none says anything about a config file.
const DOOR_IDS: [&str; 4] = [
    "config-request-invalid",
    "config-io",
    "config-trusted-root-unresolved",
    "config-internal-error",
];

/// The project's mailbox opt-in. A refused config is `Refused`; a failure of the door itself is an error.
pub fn mailbox_opt_in(root: &Path, env: Env) -> Result<MailboxOptIn, AgentHooksError> {
    let root = std::fs::canonicalize(root).map_err(io_err(root))?;
    match fgos_config::machine::project_snapshot(&root, |key| env(key)) {
        Ok(snapshot) => {
            let on = snapshot.value["mailbox"]["enabled"] == Value::Bool(true);
            Ok(if on {
                MailboxOptIn::On
            } else {
                MailboxOptIn::Off
            })
        }
        Err(fgos_config::snapshot::SnapshotError::Refused(list)) => {
            let code = list.first().map_or("config-refused", |r| r.code);
            if DOOR_IDS.contains(&code) {
                return Err(AgentHooksError::Config(code.to_string()));
            }
            Ok(MailboxOptIn::Refused {
                reason: format!("config:{code}"),
                code: code.to_string(),
                file: list.iter().find_map(|r| r.file.clone()),
            })
        }
        Err(fgos_config::snapshot::SnapshotError::Io(e)) => {
            Err(AgentHooksError::Config(e.to_string()))
        }
    }
}

/// The refused config of a refused opt-in as a person reads it.
pub fn refused_config_name(file: Option<&str>) -> &'static str {
    match file.and_then(|f| f.split(':').next()) {
        Some("project") => "the project config",
        Some("global") => "the global config",
        _ => "a config file",
    }
}

/// The line printed for a refused opt-in: the reason word and the refused file.
pub fn mailbox_refusal_line(reason: &str, file: Option<&str>) -> String {
    let at = file.map_or(String::new(), |f| format!(" in {f}"));
    format!(
        "mailbox hook rows left as they are: {reason}{at} ({} is refused, so the opt-in is unknown)",
        refused_config_name(file)
    )
}

fn refusal_line(opt_in: &MailboxOptIn) -> Option<String> {
    match opt_in {
        MailboxOptIn::Refused { reason, file, .. } => {
            Some(mailbox_refusal_line(reason, file.as_deref()))
        }
        _ => None,
    }
}

/// Seconds a CLI should allow one mailbox hook call before it cuts it: the hook's own failure ceiling
/// (`mailbox.hook.budgetMs` of the bundled standard), rounded up, plus two seconds, so the CLI never kills
/// the hook before its own watchdog does.
pub fn mailbox_hook_timeout_sec() -> Result<u64, AgentHooksError> {
    static CACHED: OnceLock<Result<u64, String>> = OnceLock::new();
    CACHED
        .get_or_init(|| {
            let context = fgos_config::machine::context(&fgos_config::detect::NoDetectors)
                .map_err(|r| r.code.to_string())?;
            let path = standard_path("mailbox.hook.budgetMs");
            let ms = context
                .standard
                .value_at(&path)
                .and_then(Value::as_u64)
                .ok_or("mailbox.hook.budgetMs is missing from the bundled config standard")?;
            Ok(ms.div_ceil(1000) + 2)
        })
        .clone()
        .map_err(AgentHooksError::Config)
}

fn standard_path(dotted: &str) -> Vec<fgos_config::Segment> {
    dotted
        .split('.')
        .map(|part| fgos_config::Segment::Key(part.to_string()))
        .collect()
}

// ---------------------------------------------------------------------------------------------------------
// The delete guard's prefilter: the one keyword list every renderer reads
// ---------------------------------------------------------------------------------------------------------

/// What the main-checkout delete guard judges, as text a shell or a JavaScript check can find without
/// starting a program. The list is data (`contracts/delete-guard-prefilter.v1.json`).
pub struct Prefilter {
    substrings: Vec<String>,
    words: Vec<String>,
}

impl Prefilter {
    /// The bundled list.
    pub fn bundled() -> &'static Prefilter {
        static BUNDLED: OnceLock<Prefilter> = OnceLock::new();
        BUNDLED.get_or_init(|| {
            let doc: Value = serde_json::from_str(include_str!(
                "../../contracts/delete-guard-prefilter.v1.json"
            ))
            .expect("the prefilter contract parses");
            // A missing or empty list must stop the build of the guard, never silently empty it.
            let list = |key: &str| -> Vec<String> {
                let items: Vec<String> = doc[key]
                    .as_array()
                    .unwrap_or_else(|| panic!("the prefilter contract has no `{key}` list"))
                    .iter()
                    .map(|v| {
                        v.as_str()
                            .unwrap_or_else(|| panic!("a `{key}` entry is not text"))
                            .to_string()
                    })
                    .collect();
                assert!(
                    !items.is_empty(),
                    "the prefilter contract's `{key}` list is empty"
                );
                items
            };
            Prefilter {
                substrings: list("substrings"),
                words: list("words"),
            }
        })
    }

    /// The check as a JavaScript regular expression source, for the generated omp and pi extensions.
    pub fn reg_exp_source(&self) -> String {
        let escaped: Vec<String> = self
            .substrings
            .iter()
            .map(|s| {
                let mut out = String::new();
                for c in s.chars() {
                    if ".*+?^${}()|[]\\-".contains(c) {
                        out.push('\\');
                    }
                    out.push(c);
                }
                out
            })
            .collect();
        format!(
            "{}|(?:^|[^A-Za-z0-9])(?:{})",
            escaped.join("|"),
            self.words.join("|")
        )
    }

    /// Whether a shell command carries a keyword, so the guard has to judge it. A word keyword counts only at
    /// the start of a word (after a character that is not a letter or digit).
    pub fn matches(&self, command: &str) -> bool {
        if self
            .substrings
            .iter()
            .any(|kw| command.contains(kw.as_str()))
        {
            return true;
        }
        self.words.iter().any(|kw| {
            command.match_indices(kw.as_str()).any(|(at, _)| {
                command[..at]
                    .chars()
                    .next_back()
                    .is_none_or(|prev| !prev.is_ascii_alphanumeric())
            })
        })
    }

    /// The same check as `case` patterns over a tool call's JSON payload: a word keyword also follows a JSON
    /// escape (`\n` before a shell on the next line).
    pub fn case_globs(&self) -> String {
        let mut parts: Vec<String> = self
            .substrings
            .iter()
            .map(|kw| format!("*\"{kw}\"*"))
            .collect();
        for kw in &self.words {
            parts.push(format!("*[!A-Za-z0-9]{kw}*"));
            parts.push(format!("*\\\\[bfnrt]{kw}*"));
        }
        parts.join("|")
    }
}

// ---------------------------------------------------------------------------------------------------------
// Shell text
// ---------------------------------------------------------------------------------------------------------

/// The shim as one single-quoted shell word: an absolute path, so the command runs whatever directory the
/// agent starts the hook in.
fn shim_operand(root: &Path) -> String {
    let resolved = std::fs::canonicalize(root).unwrap_or_else(|_| absolute(root));
    let resolved = fgos_process::path::plain_path(&resolved);
    let shim = project_shim_path(&resolved);
    format!("'{}'", shim.to_string_lossy().replace('\'', r"'\''"))
}

fn absolute(path: &Path) -> PathBuf {
    if path.is_absolute() {
        path.to_path_buf()
    } else {
        std::env::current_dir().map_or_else(|_| path.to_path_buf(), |cwd| cwd.join(path))
    }
}

fn shim_command(root: &Path, args: &str) -> String {
    format!("{} {args}", shim_operand(root))
}

fn claude_shim() -> String {
    format!("\"${{CLAUDE_PROJECT_DIR}}/{}\"", shim_relative())
}

/// Claude Code's mailbox command: guarded, so a project without the shim or with a not-ready activation never
/// shows an error, and never `exec`, so the shell stays between Claude Code and the host, where the caller
/// check expects it.
fn claude_mailbox_command(event: &str) -> String {
    format!(
        "S={}; [ -x \"$S\" ] || exit 0; \"$S\" hook mailbox --cli claude --event {event} || true",
        claude_shim()
    )
}

/// Claude Code's dispatch and decision-question guards: a project whose shim is gone lets the call through.
fn claude_guarded_hook_command(kind: &str) -> String {
    format!(
        "S={}; [ -x \"$S\" ] || exit 0; \"$S\" hook {kind}",
        claude_shim()
    )
}

/// The guard's shell command: a missing shim lets the call through (doctor reports it); only a payload with
/// a keyword reaches the shim, and its answer and exit code pass through. `allow` is the decision JSON a CLI
/// that reads one on stdout (agy) gets for a call the shell answered itself.
fn delete_guard_script(shim_ref: &str, args: &str, allow: Option<&str>) -> String {
    let pass = allow.map(|a| format!("printf \"%s\\n\" \"{}\"", a.replace('"', "\\\"")));
    let missing = pass
        .as_ref()
        .map_or_else(|| "exit 0".to_string(), |p| format!("{{ {p}; exit 0; }}"));
    let otherwise = pass
        .as_ref()
        .map_or(String::new(), |p| format!(" *) {p};;"));
    format!(
        "S={shim_ref}; [ -x \"$S\" ] || {missing}; P=$(cat); case \"$P\" in {}) printf \"%s\" \"$P\" | \"$S\" hook {args};;{otherwise} esac",
        Prefilter::bundled().case_globs()
    )
}

/// Codex and agy run a hook command through a shell of the user's choosing, so the script runs under `/bin/sh`
/// whatever that is; the shim path is its first argument, which keeps the script free of single quotes.
fn wrapped_delete_guard(root: &Path, args: &str, allow: Option<&str>) -> String {
    let script = delete_guard_script("$1", args, allow);
    debug_assert!(
        !script.contains('\''),
        "the delete guard script must not contain a single quote"
    );
    format!("/bin/sh -c '{script}' sh {}", shim_operand(root))
}

// ---------------------------------------------------------------------------------------------------------
// Recognising our own commands (the earlier Node module used regular expressions here)
// ---------------------------------------------------------------------------------------------------------

/// The offsets at which the shim path part of one of our commands can end: the single-quoted absolute form
/// (`'\''` escapes inside), Claude Code's project variable form, or an older bare path.
fn shim_prefix_ends(command: &str) -> Vec<usize> {
    let rel = shim_relative().to_string();
    let mut ends = Vec::new();
    // 1. '<anything>/REL' with '\'' escapes
    if command.starts_with('\'') {
        let tail = format!("/{rel}");
        let mut i = 1;
        while i < command.len() {
            let rest = &command[i..];
            if rest.starts_with('\'') {
                if command[1..i].ends_with(&tail) {
                    ends.push(i + 1);
                }
                if rest.starts_with(r"'\''") {
                    i += 4;
                    continue;
                }
                break;
            }
            i += rest.chars().next().map_or(1, char::len_utf8);
        }
    }
    // 2. "${CLAUDE_PROJECT_DIR}/REL"
    let variable = format!("\"${{CLAUDE_PROJECT_DIR}}/{rel}\"");
    if command.starts_with(&variable) {
        ends.push(variable.len());
    }
    // 3. an optional run of characters that are no space or quote and end in `/`, then REL
    let run_end = command
        .char_indices()
        .find(|(_, c)| c.is_whitespace() || *c == '\'' || *c == '"')
        .map_or(command.len(), |(i, _)| i);
    let run = &command[..run_end];
    if run == rel || run.ends_with(&format!("/{rel}")) {
        ends.push(run_end);
    }
    ends
}

fn only_whitespace(text: &str) -> bool {
    text.chars().all(|c| c.is_whitespace() || c == '\u{feff}')
}

/// Whether `command` runs the project shim's `hook <kind>` with exactly this row's arguments (agy format,
/// mailbox `--cli`/`--event`), judged from the start of the command, so a user hook that only mentions our
/// arguments or a wrapper with another prefix never reads as ours.
fn command_is_kind(command: &str, row: &HookRow) -> bool {
    let wanted = match row.args {
        Some(args) => format!(" hook {} {args}", row.kind),
        None => format!(" hook {}", row.kind),
    };
    shim_prefix_ends(command).into_iter().any(|end| {
        let Some(rest) = command[end..].strip_prefix(wanted.as_str()) else {
            return false;
        };
        only_whitespace(rest)
            || rest
                .strip_prefix(" --format=agy")
                .is_some_and(only_whitespace)
    })
}

/// A delete guard command of an earlier keyword list or another project path, in the form `form` names.
fn is_owned_form(command: &str, form: OwnedForm) -> bool {
    match form {
        OwnedForm::ClaudeGuard => {
            let head = format!(
                "S=\"${{CLAUDE_PROJECT_DIR}}/{}\"; [ -x \"$S\" ] || exit 0; P=$(cat); case \"$P\" in ",
                shim_relative()
            );
            let tail = format!(" \"$S\" hook {KIND_DELETE_GUARD};; esac");
            command.len() >= head.len() + tail.len()
                && command.starts_with(&head)
                && command.ends_with(&tail)
        }
        OwnedForm::WrappedGuard(suffix) => {
            let Some(after) = command.strip_prefix("/bin/sh -c '") else {
                return false;
            };
            let Some(close) = after.find('\'') else {
                return false;
            };
            let (script, rest) = (&after[..close], &after[close..]);
            if !script.contains(&format!(" hook {KIND_DELETE_GUARD}{suffix};")) {
                return false;
            }
            let Some(rest) = rest.strip_prefix("' sh ") else {
                return false;
            };
            shim_prefix_ends(rest)
                .into_iter()
                .any(|end| only_whitespace(&rest[end..]))
        }
    }
}

#[derive(Debug, Clone, Copy)]
enum OwnedForm {
    ClaudeGuard,
    WrappedGuard(&'static str),
}

// ---------------------------------------------------------------------------------------------------------
// The hook table
// ---------------------------------------------------------------------------------------------------------

/// One fgOS hook a JSON hook file carries: the file's CLI, the kind, the event it lives under, where it
/// lives (a `hooks.<Event>` entry, or an agy named group), its matcher and its command.
#[derive(Debug, Clone)]
pub struct HookRow {
    pub cli: &'static str,
    pub kind: &'static str,
    /// The kind's arguments after `hook <kind>` (the mailbox rows).
    pub args: Option<&'static str>,
    pub event: &'static str,
    /// `None`: the entry has no matcher.
    pub matcher: Option<String>,
    /// The agy group the row lives in.
    pub group: Option<&'static str>,
    /// agy reads the event as a flat hook object, not an entry with a matcher.
    pub flat: bool,
    pub command: String,
    pub timeout: Option<u64>,
    /// Older fgOS commands an install migrates in place.
    legacy_markers: &'static [&'static str],
    owned_form: Option<OwnedForm>,
}

impl HookRow {
    fn new(cli: &'static str, kind: &'static str, event: &'static str, command: String) -> Self {
        HookRow {
            cli,
            kind,
            args: None,
            event,
            matcher: None,
            group: None,
            flat: false,
            command,
            timeout: None,
            legacy_markers: &[],
            owned_form: None,
        }
    }

    fn matcher(mut self, matcher: &str) -> Self {
        self.matcher = Some(matcher.to_string());
        self
    }

    fn args(mut self, args: &'static str) -> Self {
        self.args = Some(args);
        self
    }

    fn timeout(mut self, sec: u64) -> Self {
        self.timeout = Some(sec);
        self
    }

    fn group(mut self, group: &'static str) -> Self {
        self.group = Some(group);
        self
    }

    fn flat(mut self) -> Self {
        self.flat = true;
        self
    }

    fn legacy(mut self, markers: &'static [&'static str]) -> Self {
        self.legacy_markers = markers;
        self
    }

    fn owned(mut self, form: OwnedForm) -> Self {
        self.owned_form = Some(form);
        self
    }

    /// The row as the vector file records it.
    pub fn to_value(&self) -> Value {
        let mut map = Map::new();
        map.insert("cli".into(), json!(self.cli));
        map.insert("kind".into(), json!(self.kind));
        if let Some(args) = self.args {
            map.insert("args".into(), json!(args));
        }
        map.insert("event".into(), json!(self.event));
        if let Some(matcher) = &self.matcher {
            map.insert("matcher".into(), json!(matcher));
        }
        if let Some(group) = self.group {
            map.insert("group".into(), json!(group));
        }
        if self.flat {
            map.insert("flat".into(), json!(true));
        }
        map.insert("command".into(), json!(self.command));
        if let Some(timeout) = self.timeout {
            map.insert("timeout".into(), json!(timeout));
        }
        Value::Object(map)
    }
}

/// Every fgOS hook a JSON hook file carries, one row per (cli, kind, event). The mailbox rows are all
/// listed; `rows_of` withholds them for a project that opted out. `mailbox_timeout` is
/// [`mailbox_hook_timeout_sec`].
pub fn hook_rows(root: &Path, mailbox_timeout: u64) -> Vec<HookRow> {
    let k_claude_mailbox = |event: &'static str,
                            args: &'static str,
                            hook_event: &'static str,
                            matcher: Option<&str>| {
        let row = HookRow::new(
            "claude",
            KIND_MAILBOX,
            hook_event,
            claude_mailbox_command(event),
        )
        .args(args)
        .timeout(mailbox_timeout);
        match matcher {
            Some(m) => row.matcher(m),
            None => row,
        }
    };
    let session = shim_command(root, SESSION_REGISTER_ARGS);
    vec![
        HookRow::new(
            "claude",
            KIND_DISPATCH,
            "PreToolUse",
            claude_guarded_hook_command(KIND_DISPATCH),
        )
        .matcher("Agent|Task")
        .legacy(&["dispatch-decide-hook.mjs"]),
        HookRow::new(
            "claude",
            KIND_DECISION,
            "PreToolUse",
            claude_guarded_hook_command(KIND_DECISION),
        )
        .matcher("AskUserQuestion")
        .legacy(&["decision-question-hook.mjs"]),
        HookRow::new(
            "claude",
            KIND_DELETE_GUARD,
            "PreToolUse",
            delete_guard_script(&claude_shim(), KIND_DELETE_GUARD, None),
        )
        .matcher("Bash")
        .owned(OwnedForm::ClaudeGuard),
        k_claude_mailbox("stop", "--cli claude --event stop", "Stop", None),
        k_claude_mailbox(
            "post-tool-use",
            "--cli claude --event post-tool-use",
            "PostToolUse",
            Some("*"),
        ),
        HookRow::new(
            "claude",
            KIND_SESSION,
            "SessionStart",
            format!(
                "S={}; [ -x \"$S\" ] || exit 0; \"$S\" {SESSION_REGISTER_ARGS} >/dev/null || true",
                claude_shim()
            ),
        )
        .timeout(SESSION_REGISTER_TIMEOUT_SEC),
        HookRow::new(
            "codex",
            KIND_SESSION,
            "SessionStart",
            format!("{session} >/dev/null || true"),
        )
        .timeout(SESSION_REGISTER_TIMEOUT_SEC),
        HookRow::new(
            "agy",
            KIND_SESSION,
            "SessionStart",
            format!("{session} >/dev/null || true"),
        )
        .group("fgos-session-register")
        .flat()
        .timeout(SESSION_REGISTER_TIMEOUT_SEC),
        HookRow::new(
            "codex",
            KIND_DISPATCH,
            "PreToolUse",
            shim_command(root, "hook dispatch-decide"),
        )
        .matcher(".*"),
        HookRow::new(
            "codex",
            KIND_DECISION,
            "PreToolUse",
            shim_command(root, "hook decision-question"),
        )
        .matcher("RequestUserInput|ask.*"),
        HookRow::new(
            "codex",
            KIND_DELETE_GUARD,
            "PreToolUse",
            wrapped_delete_guard(root, KIND_DELETE_GUARD, None),
        )
        .matcher("^(Bash|shell|exec_command|local_shell)$")
        .owned(OwnedForm::WrappedGuard("")),
        // Codex runs a hook command through the user's `$SHELL -c`: the plain form is exec'd into the direct
        // topology the caller check expects; a guarded form would keep the user's login shell at the head.
        HookRow::new(
            "codex",
            KIND_MAILBOX,
            "Stop",
            shim_command(root, "hook mailbox --cli codex --event stop"),
        )
        .args("--cli codex --event stop")
        .timeout(mailbox_timeout),
        HookRow::new(
            "codex",
            KIND_MAILBOX,
            "PostToolUse",
            shim_command(root, "hook mailbox --cli codex --event post-tool-use"),
        )
        .args("--cli codex --event post-tool-use")
        .timeout(mailbox_timeout),
        HookRow::new(
            "agy",
            KIND_DISPATCH,
            "PreToolUse",
            shim_command(root, "hook dispatch-decide --format=agy"),
        )
        .group("fgos-dispatch-guard")
        .matcher(".*")
        .timeout(10),
        HookRow::new(
            "agy",
            KIND_DECISION,
            "PreToolUse",
            shim_command(root, "hook decision-question --format=agy"),
        )
        .group("fgos-decision-guard")
        .matcher("ask.*|AskUserQuestion")
        .timeout(10),
        HookRow::new(
            "agy",
            KIND_DELETE_GUARD,
            "PreToolUse",
            wrapped_delete_guard(
                root,
                &format!("{KIND_DELETE_GUARD} --format=agy"),
                Some(AGY_ALLOW),
            ),
        )
        .group("fgos-delete-guard")
        .matcher("run_command")
        .owned(OwnedForm::WrappedGuard(" --format=agy"))
        .timeout(10),
    ]
}

struct HookFile {
    /// Path parts below the project root.
    file: &'static [&'static str],
    label: &'static str,
    name: &'static str,
    /// Hooks not required when the CLI's directory is absent.
    dir: Option<&'static str>,
}

fn hook_file(cli: &str) -> &'static HookFile {
    const CLAUDE: HookFile = HookFile {
        file: &[".claude", "settings.json"],
        label: ".claude/settings.json",
        name: "Claude Code",
        dir: None,
    };
    const CODEX: HookFile = HookFile {
        file: &[".codex", "hooks.json"],
        label: ".codex/hooks.json",
        name: "Codex CLI",
        dir: Some(".codex"),
    };
    const AGY: HookFile = HookFile {
        file: &[".agents", "hooks.json"],
        label: ".agents/hooks.json",
        name: "AGY",
        dir: Some(".agents"),
    };
    match cli {
        "claude" => &CLAUDE,
        "codex" => &CODEX,
        _ => &AGY,
    }
}

fn join_parts(root: &Path, parts: &[&str]) -> PathBuf {
    parts
        .iter()
        .fold(root.to_path_buf(), |p, part| p.join(part))
}

/// The rows a project gets for one CLI: the mailbox rows only when the project opted in.
fn rows_of(rows: &[HookRow], cli: &str, opt_in: &MailboxOptIn) -> Vec<HookRow> {
    rows.iter()
        .filter(|row| row.cli == cli && (*opt_in == MailboxOptIn::On || row.kind != KIND_MAILBOX))
        .cloned()
        .collect()
}

/// The table's rows a project does not get: the mailbox rows of a project that opted out. A refused config
/// withholds nothing, so the rows it has stay.
fn withheld_rows_of(rows: &[HookRow], cli: &str, opt_in: &MailboxOptIn) -> Vec<HookRow> {
    if *opt_in != MailboxOptIn::Off {
        return Vec::new();
    }
    rows.iter()
        .filter(|row| row.cli == cli && row.kind == KIND_MAILBOX)
        .cloned()
        .collect()
}

// ---------------------------------------------------------------------------------------------------------
// JSON file helpers
// ---------------------------------------------------------------------------------------------------------

enum Read {
    /// No file: an empty object, as if the file were `{}`.
    Absent,
    Object(Map<String, Value>),
    /// Anything that is not a JSON object: unparsable text, `null`, a number, a string, an array.
    Malformed,
    /// A JSON array root: only a reversal reads it (as holding nothing of ours).
    Array(Value),
}

fn read_json(path: &Path) -> Result<Read, AgentHooksError> {
    let text = match std::fs::read(path) {
        Ok(bytes) => String::from_utf8_lossy(&bytes).into_owned(),
        Err(e) if e.kind() == io::ErrorKind::NotFound => return Ok(Read::Absent),
        Err(e) if path.is_dir() => return Err(io_err(path)(e)),
        Err(e) => return Err(io_err(path)(e)),
    };
    Ok(match serde_json::from_str::<Value>(&text) {
        Ok(Value::Object(map)) => Read::Object(map),
        Ok(array @ Value::Array(_)) => Read::Array(array),
        _ => Read::Malformed,
    })
}

/// The path a write goes to: the file itself, or the target of a link in its place (the earlier module wrote
/// in place, so a settings file a dotfile manager links stays a link).
fn write_target(path: &Path) -> PathBuf {
    match std::fs::symlink_metadata(path) {
        Ok(meta) if meta.file_type().is_symlink() => {
            std::fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf())
        }
        _ => path.to_path_buf(),
    }
}

/// The mode a file this process creates in `dir` gets: `0666` minus the umask, as the earlier module's plain
/// write gave. Learned from a probe file the kernel masks, since the umask can only be read by changing it.
#[cfg(unix)]
fn creation_mode(dir: &Path) -> u32 {
    use std::os::unix::fs::{OpenOptionsExt, PermissionsExt};
    use std::sync::atomic::{AtomicUsize, Ordering};
    static PROBES: AtomicUsize = AtomicUsize::new(0);
    let probe = dir.join(format!(
        ".fgos-mode-probe-{}-{}",
        std::process::id(),
        PROBES.fetch_add(1, Ordering::SeqCst)
    ));
    let opened = std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .mode(0o666)
        .open(&probe);
    let mode = opened
        .and_then(|file| file.metadata())
        .map_or(0o644, |m| m.permissions().mode() & 0o7777);
    let _ = std::fs::remove_file(&probe);
    mode
}

/// The first link on the way to the hook file at `relative` below `root` that leaves the canonical project
/// root or points nowhere: a write there would land outside the project. A link that stays inside is no
/// reason to refuse; install and reversal both follow it.
fn escaping_link(root: &Path, relative: &[&str]) -> Result<Option<PathBuf>, AgentHooksError> {
    crate::path_links::first_link_under(root, relative, crate::path_links::LinkPolicy::Escaping)
        .map_err(io_err(root))
}

fn leaves_project(root: &Path, relative: &[&str]) -> Result<bool, AgentHooksError> {
    Ok(escaping_link(root, relative)?.is_some())
}

const OUTSIDE_PROJECT: &str = "outside-project";

fn write_file(path: &Path, bytes: &[u8]) -> Result<(), AgentHooksError> {
    let target = write_target(path);
    let dir = target.parent().unwrap_or_else(|| Path::new("."));
    std::fs::create_dir_all(dir).map_err(io_err(dir))?;
    let name = target
        .file_name()
        .and_then(OsStr::to_str)
        .ok_or_else(|| io_err(&target)(io::Error::other("file name is not text")))?;
    #[cfg(unix)]
    let mode = {
        use std::os::unix::fs::PermissionsExt;
        std::fs::metadata(&target)
            .map_or_else(|_| creation_mode(dir), |m| m.permissions().mode() & 0o7777)
    };
    #[cfg(not(unix))]
    let mode = 0o644;
    fgos_durable_file::replace_durably_with_mode(dir, name, bytes, mode)
        .map_err(|e| io_err(&target)(io::Error::other(e)))?;
    Ok(())
}

fn write_json_pretty(path: &Path, value: &Value) -> Result<(), AgentHooksError> {
    let mut text =
        serde_json::to_string_pretty(value).map_err(|e| io_err(path)(io::Error::other(e)))?;
    text.push('\n');
    write_file(path, text.as_bytes())
}

fn hooks_of(entry: &Value) -> Option<&Vec<Value>> {
    entry.get("hooks").and_then(Value::as_array)
}

fn command_of(hook: &Value) -> Option<&str> {
    hook.get("command").and_then(Value::as_str)
}

fn to_text(value: &Value) -> String {
    serde_json::to_string(value).unwrap_or_default()
}

/// Whether a hook object is this row's: its exact command, an older fgOS command (legacy marker), or the shim
/// running exactly this row's kind and arguments.
fn is_owned_hook(hook: &Value, row: &HookRow) -> bool {
    let Some(command) = command_of(hook) else {
        return false;
    };
    command == row.command
        || row
            .legacy_markers
            .iter()
            .any(|marker| command.contains(marker))
        || row
            .owned_form
            .is_some_and(|form| is_owned_form(command, form))
        || command_is_kind(command, row)
}

fn hook_object(row: &HookRow) -> Value {
    let mut map = Map::new();
    map.insert("type".into(), json!("command"));
    map.insert("command".into(), json!(row.command));
    if let Some(timeout) = row.timeout.filter(|t| *t != 0) {
        map.insert("timeout".into(), json!(timeout));
    }
    Value::Object(map)
}

fn entry_for(row: &HookRow) -> Value {
    let mut map = Map::new();
    if let Some(matcher) = &row.matcher {
        map.insert("matcher".into(), json!(matcher));
    }
    map.insert("hooks".into(), Value::Array(vec![hook_object(row)]));
    Value::Object(map)
}

fn same_matcher(entry: &Value, row: &HookRow) -> bool {
    match &row.matcher {
        None => entry.get("matcher").is_none(),
        Some(m) => entry.get("matcher").and_then(Value::as_str) == Some(m.as_str()),
    }
}

/// Takes out the hook objects `owns` names, never a user's lookalike; an entry or event they leave empty goes
/// with them. Returns whether anything changed.
fn remove_nested_row(
    hooks: &mut Map<String, Value>,
    row: &HookRow,
    owns: &dyn Fn(&Value) -> bool,
) -> bool {
    let Some(Value::Array(entries)) = hooks.get_mut(row.event) else {
        return false;
    };
    let mut changed = false;
    for entry in entries.iter_mut() {
        let Some(Value::Array(list)) = entry.get_mut("hooks") else {
            continue;
        };
        let before = list.len();
        list.retain(|h| !owns(h));
        changed |= list.len() != before;
    }
    if !changed {
        return false;
    }
    entries.retain(|e| hooks_of(e).is_none_or(|h| !h.is_empty()));
    if entries.is_empty() {
        hooks.shift_remove(row.event);
    }
    true
}

/// Puts one nested row into `hooks.<Event>`. Only our hook object is replaced, never the entry it sits in, so
/// a user hook beside it stays. Returns whether anything changed.
fn install_nested_row(hooks: &mut Map<String, Value>, row: &HookRow) -> bool {
    if !matches!(hooks.get(row.event), Some(Value::Array(_))) {
        hooks.insert(row.event.to_string(), Value::Array(Vec::new()));
    }
    let Some(Value::Array(entries)) = hooks.get_mut(row.event) else {
        return false;
    };
    let wanted = hook_object(row);
    let at = entries
        .iter()
        .position(|e| hooks_of(e).is_some_and(|h| h.iter().any(|h| is_owned_hook(h, row))));
    if let Some(at) = at {
        let same = same_matcher(&entries[at], row);
        let Some(Value::Array(list)) = entries[at].get_mut("hooks") else {
            return false;
        };
        let index = list.iter().position(|h| is_owned_hook(h, row)).unwrap_or(0);
        if same {
            if to_text(&list[index]) == to_text(&wanted) {
                return false;
            }
            list[index] = wanted;
            return true;
        }
        list.remove(index);
        if list.is_empty() {
            entries[at] = entry_for(row);
            return true;
        }
    }
    entries.push(entry_for(row));
    true
}

/// An agy group's entry: the hook object itself for an event agy reads flat, else a matcher entry.
fn group_entry(row: &HookRow) -> Value {
    if row.flat {
        hook_object(row)
    } else {
        json!({ "matcher": row.matcher, "hooks": [hook_object(row)] })
    }
}

fn is_group_entry_of(entry: &Value, row: &HookRow) -> bool {
    if row.flat {
        return command_of(entry) == Some(row.command.as_str());
    }
    entry.get("matcher").and_then(Value::as_str) == row.matcher.as_deref()
        && hooks_of(entry).is_some_and(|h| {
            h.iter()
                .any(|h| command_of(h) == Some(row.command.as_str()))
        })
}

fn group_entries<'a>(config: &'a Map<String, Value>, row: &HookRow) -> Option<&'a Vec<Value>> {
    config
        .get(row.group?)
        .and_then(|g| g.get(row.event))
        .and_then(Value::as_array)
}

fn install_group_row(config: &mut Map<String, Value>, row: &HookRow) -> bool {
    let Some(group) = row.group else {
        return false;
    };
    let matching = config.get(group).is_some_and(|existing| {
        existing.get("enabled") != Some(&Value::Bool(false))
            && existing
                .get(row.event)
                .and_then(Value::as_array)
                .is_some_and(|list| list.iter().any(|g| is_group_entry_of(g, row)))
    });
    if matching {
        return false;
    }
    let mut value = Map::new();
    value.insert("enabled".into(), Value::Bool(true));
    value.insert(row.event.to_string(), Value::Array(vec![group_entry(row)]));
    config.insert(group.to_string(), Value::Object(value));
    true
}

// ---------------------------------------------------------------------------------------------------------
// Install
// ---------------------------------------------------------------------------------------------------------

/// What an install of one CLI's hooks did.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallResult {
    pub wired: bool,
    /// `Some("malformed")` when an existing file was skipped.
    pub skipped_existing: Option<&'static str>,
    /// The line naming a refused mailbox opt-in.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mailbox: Option<String>,
}

fn table(root: &Path) -> Result<Vec<HookRow>, AgentHooksError> {
    Ok(hook_rows(root, mailbox_hook_timeout_sec()?))
}

/// The mailbox notice for a CLI the table gives mailbox rows (the three JSON-file CLIs; the extension
/// installer builds its own).
fn mailbox_notice(rows: &[HookRow], cli: &str, opt_in: &MailboxOptIn) -> Option<String> {
    rows.iter()
        .any(|r| r.cli == cli && r.kind == KIND_MAILBOX)
        .then(|| refusal_line(opt_in))
        .flatten()
}

fn install_rows(root: &Path, cli: &str, env: Env) -> Result<InstallResult, AgentHooksError> {
    let spec = hook_file(cli);
    let path = join_parts(root, spec.file);
    if leaves_project(root, spec.file)? {
        return Ok(InstallResult {
            wired: false,
            skipped_existing: Some(OUTSIDE_PROJECT),
            mailbox: None,
        });
    }
    let mut config = match read_json(&path)? {
        Read::Absent => Map::new(),
        Read::Object(map) => map,
        Read::Malformed | Read::Array(_) => {
            return Ok(InstallResult {
                wired: false,
                skipped_existing: Some("malformed"),
                mailbox: None,
            })
        }
    };
    let opt_in = mailbox_opt_in(root, env)?;
    let rows = table(root)?;
    let mut changed = false;
    if let Some(Value::Object(hooks)) = config.get_mut("hooks") {
        for row in withheld_rows_of(&rows, cli, &opt_in) {
            changed |= remove_nested_row(hooks, &row, &|h| {
                command_of(h) == Some(row.command.as_str())
            });
        }
    }
    for row in rows_of(&rows, cli, &opt_in) {
        if row.group.is_some() {
            changed |= install_group_row(&mut config, &row);
        } else {
            if !matches!(config.get("hooks"), Some(Value::Object(_))) {
                config.insert("hooks".into(), Value::Object(Map::new()));
            }
            if let Some(Value::Object(hooks)) = config.get_mut("hooks") {
                changed |= install_nested_row(hooks, &row);
            }
        }
    }
    if changed {
        write_json_pretty(&path, &Value::Object(config))?;
    }
    Ok(InstallResult {
        wired: true,
        skipped_existing: None,
        mailbox: mailbox_notice(&rows, cli, &opt_in),
    })
}

/// Wires Claude Code, Codex or agy (`cli`) into the project, filling only what is missing.
pub fn install_json_hooks(
    root: &Path,
    cli: &str,
    env: Env,
) -> Result<InstallResult, AgentHooksError> {
    debug_assert!(matches!(cli, "claude" | "codex" | "agy"));
    install_rows(root, cli, env)
}

/// Wires omp or pi (`cli`): one generated extension file. A refused config keeps an existing file as it is,
/// whichever mailbox handlers it carries; a missing one is written without them.
pub fn install_extension_hook(
    root: &Path,
    cli: &str,
    env: Env,
) -> Result<InstallResult, AgentHooksError> {
    let path = extension_path(root, cli);
    if leaves_project(root, &[&format!(".{cli}"), "extensions", "fgos-hooks.ts"])? {
        return Ok(InstallResult {
            wired: false,
            skipped_existing: Some(OUTSIDE_PROJECT),
            mailbox: None,
        });
    }
    let opt_in = mailbox_opt_in(root, env)?;
    let mailbox = refusal_line(&opt_in);
    if mailbox.is_some() && path.exists() {
        return Ok(InstallResult {
            wired: true,
            skipped_existing: None,
            mailbox,
        });
    }
    let source = extension_source(cli, opt_in == MailboxOptIn::On)?;
    write_file(&path, source.as_bytes())?;
    Ok(InstallResult {
        wired: true,
        skipped_existing: None,
        mailbox,
    })
}

/// Wires one CLI of [`SUPPORTED_AGENTS`].
pub fn install_hook(root: &Path, cli: &str, env: Env) -> Result<InstallResult, AgentHooksError> {
    match cli {
        "omp" | "pi" => install_extension_hook(root, cli, env),
        _ => install_json_hooks(root, cli, env),
    }
}

/// What a fix says of an install of `cli`'s hooks: what it wired and where, with the mailbox notice for the CLIs
/// whose table has mailbox rows, or why it left the file alone.
pub fn install_message(cli: &str, result: &InstallResult) -> String {
    let (what, with_mailbox) = match cli {
        "claude" => ("Claude Code hooks in .claude/settings.json", true),
        "codex" => ("Codex CLI hooks in .codex/hooks.json", true),
        "agy" => ("AGY hooks in .agents/hooks.json", false),
        "omp" => ("OMP extension hook in .omp/extensions/fgos-hooks.ts", true),
        "pi" => ("Pi extension hook in .pi/extensions/fgos-hooks.ts", true),
        other => unreachable!("no hook of {other}"),
    };
    if !result.wired {
        return format!(
            "skipped: {}",
            result.skipped_existing.unwrap_or("undefined")
        );
    }
    match result
        .mailbox
        .as_deref()
        .filter(|notice| with_mailbox && !notice.is_empty())
    {
        Some(notice) => format!("wired {what}; {notice}"),
        None => format!("wired {what}"),
    }
}

/// Wires every supported CLI, in table order.
pub fn install_all(
    root: &Path,
    env: Env,
) -> Result<Vec<(&'static str, InstallResult)>, AgentHooksError> {
    SUPPORTED_AGENTS
        .iter()
        .map(|cli| Ok((*cli, install_hook(root, cli, env)?)))
        .collect()
}

// ---------------------------------------------------------------------------------------------------------
// The generated extension of omp and pi
// ---------------------------------------------------------------------------------------------------------

fn extension_path(root: &Path, cli: &str) -> PathBuf {
    root.join(format!(".{cli}"))
        .join("extensions")
        .join("fgos-hooks.ts")
}

const EXTENSION_HEAD: &str = "// @ts-nocheck\n// fgos-hooks.ts \u{2014} managed fgOS guard extension\nimport { spawnSync } from 'node:child_process';\n";

const MAILBOX_PART: &str = r#"
const MAILBOX_CLI = '@CLI@';
const MAILBOX_TIMEOUT_MS = @TIMEOUT_MS@;

function mailboxShim(dir: string): string | null {
  for (let at = path.resolve(dir); ; at = path.dirname(at)) {
    const shim = path.join(at, @SHIM_ARGS@);
    const st = lstatSync(shim, { throwIfNoEntry: false });
    if (st) return st.isFile() && st.uid === process.getuid?.() && (st.mode & 0o022) === 0 ? shim : null;
    if (path.dirname(at) === at) return null;
  }
}

function mailboxHook(event: string, ctx: any): string | null {
  if ((process.env.FGOS_SESSION_ID || '').startsWith('@ATTEMPT_PREFIX@')) return null;
  const session = ctx?.sessionManager?.getSessionId?.();
  if (typeof session !== 'string' || !session) return null;
  const cwd = ctx?.cwd || process.cwd();
  const shim = mailboxShim(cwd);
  if (!shim) return null;
  let subagent = false;
  try {
    subagent = typeof ctx.sessionManager.getHeader?.()?.parentSession === 'string';
  } catch {
    // no header: the head's own session
  }
  const res = spawnSync(shim, ['hook', 'mailbox', '--cli', MAILBOX_CLI, '--event', event], {
    input: JSON.stringify({ session_id: session, hook_event_name: event === 'stop' ? 'Stop' : 'PostToolUse', cwd, subagent }),
    cwd,
    encoding: 'utf8',
    timeout: MAILBOX_TIMEOUT_MS,
    stdio: ['pipe', 'pipe', 'ignore'],
  });
  if (res.status !== 0 || !res.stdout) return null;
  const answer = JSON.parse(res.stdout);
  return answer?.method === 'tool-result' && typeof answer.inject === 'string' && answer.inject ? answer.inject : null;
}
"#;

const MAILBOX_HANDLERS: &str = r#"
  api.on('tool_result', async (event: any, ctx: any) => {
    try {
      const text = mailboxHook('post-tool-use', ctx);
      if (text) return { content: [...(event?.content || []), { type: 'text', text }] };
    } catch {
      // fail-open per fgOS hook policy
    }
  });
  api.on('agent_end', async (_event: any, ctx: any) => {
    try {
      mailboxHook('stop', ctx);
    } catch {
      // fail-open per fgOS hook policy
    }
  });
"#;

const EXTENSION_BODY: &str = r#"
// A bash command with none of these keywords cannot be refused by the delete guard, so it never starts the shim.
const DELETE_GUARD_PREFILTER = /@PREFILTER@/;

export default function (api: any) {
  api.on('tool_call', async (event: any, ctx: any) => {
    try {
      const toolName = event?.toolName || '';
      const cwd = ctx?.cwd || process.cwd();
      const shim = path.join(cwd, @SHIM_ARGS@);

      if (toolName === 'task') {
        const res = spawnSync(shim, ['hook', 'dispatch-decide'], {
          input: JSON.stringify({
            tool_name: 'Task',
            tool_input: event?.input || {},
            cwd,
          }),
          encoding: 'utf8',
          timeout: 5000,
        });
        if (res.status === 2) {
          return { block: true, reason: res.stderr || 'Blocked by fgOS dispatch-decide guard' };
        }
      } else if (toolName === 'ask' || toolName === 'ask_question') {
        const res = spawnSync(shim, ['hook', 'decision-question'], {
          input: JSON.stringify({
            tool_name: 'AskUserQuestion',
            tool_input: {
              questions: [{ question: event?.input?.question, options: event?.input?.options }],
            },
            cwd,
          }),
          encoding: 'utf8',
          timeout: 5000,
        });
        if (res.status === 2) {
          return { block: true, reason: res.stderr || 'Blocked by fgOS decision-question guard' };
        }
      } else if (toolName === 'bash' && !(typeof event?.input?.command === 'string' && !DELETE_GUARD_PREFILTER.test(event.input.command))) {
        const res = spawnSync(shim, ['hook', 'main-checkout-delete-guard'], {
          input: JSON.stringify({ tool_name: 'Bash', tool_input: { command: event?.input?.command }, cwd }),
          encoding: 'utf8',
          timeout: 5000,
        });
        if (res.status === 2) {
          return { block: true, reason: res.stderr || 'Blocked by fgOS main-checkout delete guard' };
        }
      }
    } catch {
      // fail-open per fgOS hook policy
    }
  });@TAIL@}
"#;

/// The attempt-id prefix of a runner worker's writer id. The extension runs in the agent process and cannot
/// ask the identity crate, so the literal travels as data in `agent-hooks.v1.json`, which a test in the identity
/// crate (`attempt_writer_id.rs`) pins to the crate's prefix.
fn attempt_prefix() -> &'static str {
    static PREFIX: OnceLock<String> = OnceLock::new();
    PREFIX.get_or_init(|| {
        let doc: Value = serde_json::from_str(include_str!("../../contracts/agent-hooks.v1.json"))
            .expect("the hook table contract parses");
        doc["attemptIdPrefix"]
            .as_str()
            .expect("the hook table contract names attemptIdPrefix")
            .to_string()
    })
}

/// The generated extension of `cli` (`omp` or `pi`): the dispatch, decision and delete guards, and the
/// mailbox handlers only when `mailbox` (the project opted in).
pub fn extension_source(cli: &str, mailbox: bool) -> Result<String, AgentHooksError> {
    let shim_args = shim_relative()
        .split('/')
        .map(|p| format!("'{p}'"))
        .collect::<Vec<_>>()
        .join(", ");
    let mut out = String::from(EXTENSION_HEAD);
    if mailbox {
        out.push_str("import { lstatSync } from 'node:fs';\n");
    }
    out.push_str("import path from 'node:path';\n");
    if mailbox {
        let timeout_ms = mailbox_hook_timeout_sec()? * 1000;
        out.push_str(
            &MAILBOX_PART
                .replace("@CLI@", cli)
                .replace("@TIMEOUT_MS@", &timeout_ms.to_string())
                .replace("@SHIM_ARGS@", &shim_args)
                .replace("@ATTEMPT_PREFIX@", attempt_prefix()),
        );
    }
    let tail = if mailbox { MAILBOX_HANDLERS } else { "\n" };
    out.push_str(
        &EXTENSION_BODY
            .replace("@PREFILTER@", &Prefilter::bundled().reg_exp_source())
            .replace("@SHIM_ARGS@", &shim_args)
            .replace("@TAIL@", tail),
    );
    Ok(out)
}

/// The text the installer writes for a project under `env`'s config: the one form, or for a refused config
/// either form is ours.
fn accepted_extensions(
    root: &Path,
    cli: &str,
    env: Env,
) -> Result<(Vec<String>, MailboxOptIn), AgentHooksError> {
    let opt_in = mailbox_opt_in(root, env)?;
    let accepted = match opt_in {
        MailboxOptIn::Refused { .. } => {
            vec![extension_source(cli, true)?, extension_source(cli, false)?]
        }
        _ => vec![extension_source(cli, opt_in == MailboxOptIn::On)?],
    };
    Ok((accepted, opt_in))
}

// ---------------------------------------------------------------------------------------------------------
// Running the shim: the probe of a check
// ---------------------------------------------------------------------------------------------------------

/// How a bounded run ended, as the probe needs it.
pub enum ProbeOutcome {
    Exited {
        code: Option<i32>,
        stdout_empty: bool,
    },
    TimedOut,
    NotStarted,
}

/// The seam through which a probe runs a program; the default is the process door.
pub trait ProcessRunner {
    fn run(
        &self,
        program: &OsStr,
        args: &[String],
        env: &[(String, String)],
        cwd: Option<&Path>,
        input: Option<&[u8]>,
        timeout: Duration,
    ) -> io::Result<fgos_process::spawn::Outcome>;
}

/// Starts programs through `fgos_process::spawn::run_bounded`.
pub struct BoundedRunner;

impl ProcessRunner for BoundedRunner {
    fn run(
        &self,
        program: &OsStr,
        args: &[String],
        env: &[(String, String)],
        cwd: Option<&Path>,
        input: Option<&[u8]>,
        timeout: Duration,
    ) -> io::Result<fgos_process::spawn::Outcome> {
        fgos_process::spawn::run_bounded(program, args, env, cwd, input, timeout)
    }
}

/// The verdict of the shim probe.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ShimVerdict {
    pub runnable: bool,
    pub reason: Option<String>,
}

/// Memo of probe verdicts for one doctor run: each distinct probe of one shim runs once however many rows ask.
#[derive(Default)]
pub struct ProbeMemo(std::cell::RefCell<HashMap<String, ShimVerdict>>);

/// The environment a probe runs in: the caller's, without the host's recursion guard. The probe calls the
/// shim the way an agent does, from a fresh process; the guard would make the nested shim refuse and every
/// probe read as broken.
fn probe_env(env: &[(String, String)]) -> Vec<(String, String)> {
    env.iter()
        .filter(|(k, _)| k != "FGOS_RUST_HOST_RECURSION_GUARD")
        .cloned()
        .collect()
}

/// Whether the project's shim runs with benign input: the dispatch and delete-guard kinds, and with
/// `mailbox_cli` the mailbox kind, which must exit 0 with nothing on stdout.
pub fn is_shim_runnable(
    root: &Path,
    mailbox_cli: Option<&str>,
    env: &[(String, String)],
    runner: &dyn ProcessRunner,
    memo: Option<&ProbeMemo>,
) -> ShimVerdict {
    let shim = project_shim_path(root);
    if !shim.exists() {
        return ShimVerdict {
            runnable: false,
            reason: Some("shim-missing".into()),
        };
    }
    let env = probe_env(env);
    let mut probes: Vec<(String, Vec<String>, bool)> = vec![
        (
            KIND_DISPATCH.into(),
            vec!["hook".into(), KIND_DISPATCH.into()],
            false,
        ),
        (
            KIND_DELETE_GUARD.into(),
            vec!["hook".into(), KIND_DELETE_GUARD.into()],
            true,
        ),
    ];
    if let Some(cli) = mailbox_cli {
        let args = ["hook", "mailbox", "--cli", cli, "--event", "post-tool-use"]
            .map(String::from)
            .to_vec();
        probes.push((format!("{KIND_MAILBOX} ({cli})"), args, true));
    }
    for (kind, args, quiet_stdout) in probes {
        let key = format!("shim-probe:{}:{}", shim.display(), args.join(" "));
        if let Some(found) = memo.and_then(|m| m.0.borrow().get(&key).cloned()) {
            if !found.runnable {
                return found;
            }
            continue;
        }
        let verdict = probe_once(&shim, root, &kind, &args, quiet_stdout, &env, runner);
        if let Some(m) = memo {
            m.0.borrow_mut().insert(key, verdict.clone());
        }
        if !verdict.runnable {
            return verdict;
        }
    }
    ShimVerdict {
        runnable: true,
        reason: None,
    }
}

fn probe_once(
    shim: &Path,
    root: &Path,
    kind: &str,
    args: &[String],
    quiet_stdout: bool,
    env: &[(String, String)],
    runner: &dyn ProcessRunner,
) -> ShimVerdict {
    let outcome = match runner.run(
        shim.as_os_str(),
        args,
        env,
        Some(root),
        Some(b"{}"),
        Duration::from_secs(3),
    ) {
        Ok(fgos_process::spawn::Outcome::Exited(out)) => ProbeOutcome::Exited {
            code: out.status.code(),
            stdout_empty: out.stdout.is_empty(),
        },
        Ok(fgos_process::spawn::Outcome::TimedOut { .. }) => ProbeOutcome::TimedOut,
        Err(_) => ProbeOutcome::NotStarted,
    };
    let bad = |reason: String| ShimVerdict {
        runnable: false,
        reason: Some(format!("{kind}: {reason}")),
    };
    match outcome {
        ProbeOutcome::Exited {
            code: Some(0),
            stdout_empty,
        } => {
            if quiet_stdout && !stdout_empty {
                bad("printed on stdout".into())
            } else {
                ShimVerdict {
                    runnable: true,
                    reason: None,
                }
            }
        }
        ProbeOutcome::Exited {
            code: Some(code), ..
        } => bad(format!("exit-{code}")),
        // A child that was killed (by a signal or by the timeout) or never started has no exit status.
        ProbeOutcome::Exited { code: None, .. }
        | ProbeOutcome::TimedOut
        | ProbeOutcome::NotStarted => bad("exit-null".into()),
    }
}

#[cfg(test)]
pub(crate) mod test_runner {
    use super::*;

    /// A runner for tests that start a script written a moment earlier: another test's fork can still hold the
    /// script's write descriptor, and the kernel then refuses the start as "text file busy" (ETXTBSY, 26).
    pub(crate) struct RetryOnBusy;

    impl ProcessRunner for RetryOnBusy {
        fn run(
            &self,
            program: &OsStr,
            args: &[String],
            env: &[(String, String)],
            cwd: Option<&Path>,
            input: Option<&[u8]>,
            timeout: Duration,
        ) -> io::Result<fgos_process::spawn::Outcome> {
            for _ in 0..50 {
                match BoundedRunner.run(program, args, env, cwd, input, timeout) {
                    Err(e) if e.raw_os_error() == Some(26) => {
                        std::thread::sleep(Duration::from_millis(20))
                    }
                    other => return other,
                }
            }
            BoundedRunner.run(program, args, env, cwd, input, timeout)
        }
    }
}

// ---------------------------------------------------------------------------------------------------------
// Check
// ---------------------------------------------------------------------------------------------------------

/// A doctor verdict of one CLI's hooks.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct HookCheck {
    pub passed: bool,
    pub message: String,
}

fn verdict(passed: bool, message: String) -> HookCheck {
    HookCheck { passed, message }
}

fn row_present(config: &Map<String, Value>, row: &HookRow) -> bool {
    if row.group.is_some() {
        let Some(group) = row.group.and_then(|g| config.get(g)) else {
            return false;
        };
        return group.get("enabled") != Some(&Value::Bool(false))
            && group_entries(config, row)
                .is_some_and(|list| list.iter().any(|g| is_group_entry_of(g, row)));
    }
    config
        .get("hooks")
        .and_then(|h| h.get(row.event))
        .and_then(Value::as_array)
        .is_some_and(|entries| {
            entries.iter().any(|e| {
                same_matcher(e, row)
                    && hooks_of(e).is_some_and(|h| {
                        h.iter().any(|h| {
                            h.get("type").and_then(Value::as_str) == Some("command")
                                && command_of(h) == Some(row.command.as_str())
                        })
                    })
            })
        })
}

/// Whether a row's command sits in its event in a shape the CLI does not read: such a hook never runs.
fn row_in_wrong_shape(config: &Map<String, Value>, row: &HookRow) -> bool {
    let entries = match row.group {
        Some(_) => group_entries(config, row),
        None => config
            .get("hooks")
            .and_then(|h| h.get(row.event))
            .and_then(Value::as_array),
    };
    let Some(entries) = entries else {
        return false;
    };
    if row.flat {
        return entries.iter().any(|e| {
            hooks_of(e).is_some_and(|h| {
                h.iter()
                    .any(|h| command_of(h) == Some(row.command.as_str()))
            })
        });
    }
    entries
        .iter()
        .any(|e| hooks_of(e).is_none() && command_of(e) == Some(row.command.as_str()))
}

/// The doctor verdict of Claude Code, Codex or agy hooks in `cwd`.
pub fn check_json_hooks(
    cwd: &Path,
    cli: &str,
    env: Env,
    process_env: &[(String, String)],
    runner: &dyn ProcessRunner,
    memo: Option<&ProbeMemo>,
) -> Result<HookCheck, AgentHooksError> {
    let spec = hook_file(cli);
    let path = join_parts(cwd, spec.file);
    if let Some(dir) = spec.dir {
        if !cwd.join(dir).exists() && !path.exists() {
            return Ok(verdict(
                true,
                format!("{} hooks not required (no {dir}/ directory)", spec.name),
            ));
        }
    }
    let config = match read_json(&path)? {
        Read::Absent => Map::new(),
        Read::Object(map) => map,
        Read::Malformed | Read::Array(_) => {
            return Ok(verdict(
                false,
                format!("{} exists but is malformed JSON", spec.label),
            ))
        }
    };
    let opt_in = mailbox_opt_in(cwd, env)?;
    let all = table(cwd)?;
    let rows = rows_of(&all, cli, &opt_in);
    let missing: Vec<&HookRow> = rows
        .iter()
        .filter(|row| !row_present(&config, row))
        .collect();
    if !missing.is_empty() {
        let mut seen = HashSet::new();
        let names: Vec<String> = missing
            .iter()
            .map(|row| match (row.group, row.args) {
                (Some(group), _) => group.to_string(),
                (None, Some(_)) => format!("{} {}", row.kind, row.event),
                (None, None) => row.kind.to_string(),
            })
            .filter(|n| seen.insert(n.clone()))
            .collect();
        let shape: Vec<String> = missing
            .iter()
            .filter(|row| row_in_wrong_shape(&config, row))
            .map(|row| format!("{} {}", row.kind, row.event))
            .collect();
        let wrong_shape = if shape.is_empty() {
            String::new()
        } else {
            format!(
                " (in a shape {} does not read: {})",
                spec.name,
                shape.join(", ")
            )
        };
        return Ok(verdict(
            false,
            format!(
                "{} missing canonical hook(s): {}{wrong_shape} \u{2014} run fgos doctor --fix",
                spec.label,
                names.join(", ")
            ),
        ));
    }
    let mailbox_cli = rows.iter().any(|r| r.kind == KIND_MAILBOX).then_some(cli);
    let probe = is_shim_runnable(cwd, mailbox_cli, process_env, runner, memo);
    if !probe.runnable {
        return Ok(verdict(
            false,
            format!(
                "{} hooks wired but local shim not runnable ({})",
                spec.name,
                probe.reason.unwrap_or_default()
            ),
        ));
    }
    Ok(verdict(
        true,
        format!("{} hooks wired and verified runnable", spec.name),
    ))
}

/// The doctor verdict of omp or pi: the extension is ours only byte for byte, so an edited or stale file (one
/// that no longer loads) fails here instead of passing on its guard names.
pub fn check_extension_hook(
    cwd: &Path,
    cli: &str,
    env: Env,
    process_env: &[(String, String)],
    runner: &dyn ProcessRunner,
    memo: Option<&ProbeMemo>,
) -> Result<HookCheck, AgentHooksError> {
    let label = if cli == "omp" { "OMP" } else { "Pi" };
    let dir = format!(".{cli}");
    let path = extension_path(cwd, cli);
    let shown = format!("{dir}/extensions/fgos-hooks.ts");
    if !cwd.join(&dir).exists() && !path.exists() {
        return Ok(verdict(
            true,
            format!("{label} hooks not required (no {dir}/ directory)"),
        ));
    }
    if !path.exists() {
        return Ok(verdict(
            false,
            format!("{shown} not found \u{2014} run fgos doctor --fix"),
        ));
    }
    let (accepted, opt_in) = accepted_extensions(cwd, cli, env)?;
    let found = String::from_utf8_lossy(&std::fs::read(&path).map_err(io_err(&path))?).into_owned();
    if !accepted.contains(&found) {
        return Ok(verdict(
            false,
            format!("{shown} differs from the generated extension \u{2014} run fgos doctor --fix"),
        ));
    }
    let mailbox_cli = (opt_in == MailboxOptIn::On).then_some(cli);
    let probe = is_shim_runnable(cwd, mailbox_cli, process_env, runner, memo);
    if !probe.runnable {
        return Ok(verdict(
            false,
            format!(
                "{label} extension present but local shim not runnable ({})",
                probe.reason.unwrap_or_default()
            ),
        ));
    }
    Ok(verdict(
        true,
        format!("{label} extension hook wired and verified runnable"),
    ))
}

/// The doctor verdict of one CLI of [`SUPPORTED_AGENTS`].
pub fn check_hook(
    cwd: &Path,
    cli: &str,
    env: Env,
    process_env: &[(String, String)],
    runner: &dyn ProcessRunner,
    memo: Option<&ProbeMemo>,
) -> Result<HookCheck, AgentHooksError> {
    match cli {
        "omp" | "pi" => check_extension_hook(cwd, cli, env, process_env, runner, memo),
        _ => check_json_hooks(cwd, cli, env, process_env, runner, memo),
    }
}

/// Whether every Claude Code `PreToolUse` guard is present, in its canonical or an older fgOS form.
pub fn is_claude_hook_configured(cwd: &Path, env: Env) -> Result<bool, AgentHooksError> {
    let path = join_parts(cwd, hook_file("claude").file);
    let config = match read_json(&path)? {
        Read::Absent => Map::new(),
        Read::Object(map) => map,
        Read::Malformed | Read::Array(_) => return Ok(false),
    };
    let Some(pre) = config
        .get("hooks")
        .and_then(|h| h.get("PreToolUse"))
        .and_then(Value::as_array)
    else {
        return Ok(false);
    };
    let opt_in = mailbox_opt_in(cwd, env)?;
    let rows = rows_of(&table(cwd)?, "claude", &opt_in);
    Ok(rows.iter().filter(|r| r.event == "PreToolUse").all(|row| {
        pre.iter().any(|entry| {
            entry.get("matcher").and_then(Value::as_str) == row.matcher.as_deref()
                && hooks_of(entry).is_some_and(|h| {
                    h.iter().any(|h| {
                        h.get("type").and_then(Value::as_str) == Some("command")
                            && is_owned_hook(h, row)
                    })
                })
        })
    }))
}

// ---------------------------------------------------------------------------------------------------------
// Reversal: what an install wrote, taken out again
// ---------------------------------------------------------------------------------------------------------

/// How a reversal found one agent file.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum UninstallState {
    Clean,
    Changed,
    Symlink,
    Malformed,
    Edited,
}

/// One agent file's reversal.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct UninstallResult {
    pub cli: String,
    pub file: PathBuf,
    pub label: String,
    pub removed: Vec<String>,
    pub kept: Vec<String>,
    pub state: UninstallState,
}

/// Every command string a hook file still carries (nested `hooks.<Event>` entries, agy groups).
fn remaining_commands(node: &Value, found: &mut Vec<String>) {
    match node {
        Value::Array(list) => list.iter().for_each(|v| remaining_commands(v, found)),
        Value::Object(map) => {
            for (key, value) in map {
                match (key.as_str(), value) {
                    ("command", Value::String(s)) => found.push(s.clone()),
                    _ => remaining_commands(value, found),
                }
            }
        }
        _ => {}
    }
}

fn truncate_chars(text: &str, n: usize) -> String {
    text.chars().take(n).collect()
}

fn uninstall_json_rows(
    root: &Path,
    cli: &str,
    apply: bool,
) -> Result<Option<UninstallResult>, AgentHooksError> {
    let spec = hook_file(cli);
    let file = join_parts(root, spec.file);
    if !file.exists() {
        return Ok(None);
    }
    let mut base = UninstallResult {
        cli: cli.to_string(),
        file: file.clone(),
        label: spec.label.to_string(),
        removed: Vec::new(),
        kept: Vec::new(),
        state: UninstallState::Clean,
    };
    if let Some(link) = escaping_link(root, spec.file)? {
        base.state = UninstallState::Symlink;
        base.kept = vec![format!(
            "{} is reached through a symbolic link ({}): left as it is",
            spec.label,
            link.display()
        )];
        return Ok(Some(base));
    }
    let mut config = match read_json(&file)? {
        Read::Absent => Map::new(),
        Read::Object(map) => map,
        Read::Array(array) => {
            // An array root holds none of our entries; whatever commands it carries are reported as kept.
            let mut commands = Vec::new();
            remaining_commands(&array, &mut commands);
            base.kept = shim_mentions(spec.label, &commands);
            return Ok(Some(base));
        }
        Read::Malformed => {
            base.state = UninstallState::Malformed;
            base.kept = vec![format!("{} is not valid JSON: left as it is", spec.label)];
            return Ok(Some(base));
        }
    };
    for row in table(root)?.into_iter().filter(|r| r.cli == cli) {
        let name = row.group.map_or_else(
            || {
                let args = row.args.map_or(String::new(), |a| format!(" {a}"));
                format!("{}{args} ({})", row.kind, row.event)
            },
            str::to_string,
        );
        if let Some(group) = row.group {
            let owned = group_entries(&config, &row).is_some_and(|entries| {
                entries.iter().any(|e| {
                    is_owned_hook(e, &row)
                        || hooks_of(e).is_some_and(|h| h.iter().any(|h| is_owned_hook(h, &row)))
                })
            });
            if owned {
                config.shift_remove(group);
                base.removed.push(name);
            }
        } else if let Some(Value::Object(hooks)) = config.get_mut("hooks") {
            if remove_nested_row(hooks, &row, &|h| is_owned_hook(h, &row)) {
                base.removed.push(name);
            }
        }
    }
    if matches!(config.get("hooks"), Some(Value::Object(h)) if h.is_empty()) {
        config.shift_remove("hooks");
    }
    let mut commands = Vec::new();
    remaining_commands(&Value::Object(config.clone()), &mut commands);
    base.kept = shim_mentions(spec.label, &commands);
    if base.removed.is_empty() {
        return Ok(Some(base));
    }
    if apply {
        write_json_pretty(&file, &Value::Object(config))?;
    }
    base.state = UninstallState::Changed;
    Ok(Some(base))
}

fn shim_mentions(label: &str, commands: &[String]) -> Vec<String> {
    let mention = shim_relative();
    commands
        .iter()
        .filter(|c| c.contains(mention))
        .map(|c| {
            format!(
                "{label}: a hook of yours names the fgOS shim and stays: {}",
                truncate_chars(c, 100)
            )
        })
        .collect()
}

/// The generated omp or pi extension, removed only when it is byte for byte what the installer writes (either
/// mailbox form); an edited file is the person's and stays.
fn uninstall_extension(
    root: &Path,
    cli: &str,
    apply: bool,
) -> Result<Option<UninstallResult>, AgentHooksError> {
    let file = extension_path(root, cli);
    if !file.exists() {
        return Ok(None);
    }
    let dir = format!(".{cli}");
    let label = format!("{dir}/extensions/fgos-hooks.ts");
    let mut base = UninstallResult {
        cli: cli.to_string(),
        file: file.clone(),
        label: label.clone(),
        removed: Vec::new(),
        kept: Vec::new(),
        state: UninstallState::Clean,
    };
    if let Some(link) = escaping_link(root, &[&dir, "extensions", "fgos-hooks.ts"])? {
        base.state = UninstallState::Symlink;
        base.kept = vec![format!(
            "{label} is reached through a symbolic link ({}): left as it is",
            link.display()
        )];
        return Ok(Some(base));
    }
    let generated = [extension_source(cli, true)?, extension_source(cli, false)?];
    let found = String::from_utf8_lossy(&std::fs::read(&file).map_err(io_err(&file))?).into_owned();
    if !generated.contains(&found) {
        base.state = UninstallState::Edited;
        base.kept = vec![format!(
            "{label} differs from the generated extension: left as it is"
        )];
        return Ok(Some(base));
    }
    if apply {
        std::fs::remove_file(&file).map_err(io_err(&file))?;
        // The directories it sat in go only when empty: removing a directory refuses anything else.
        let parents = [file.parent().map(Path::to_path_buf), Some(root.join(&dir))];
        for parent in parents.into_iter().flatten() {
            let empty = std::fs::read_dir(&parent)
                .map_err(io_err(&parent))?
                .next()
                .is_none();
            if empty {
                std::fs::remove_dir(&parent).map_err(io_err(&parent))?;
            }
        }
    }
    base.state = UninstallState::Changed;
    base.removed = vec!["extension".into()];
    Ok(Some(base))
}

/// What an install wrote into the project's agent configs, taken out: one result per agent file that exists.
/// `apply: false` only describes; the files a change touches are named in `file` so the caller can back them
/// up first.
pub fn uninstall_agent_hooks(
    root: &Path,
    apply: bool,
) -> Result<Vec<UninstallResult>, AgentHooksError> {
    let mut out = Vec::new();
    for cli in ["claude", "codex", "agy"] {
        out.extend(uninstall_json_rows(root, cli, apply)?);
    }
    for cli in ["omp", "pi"] {
        out.extend(uninstall_extension(root, cli, apply)?);
    }
    Ok(out)
}

// ---------------------------------------------------------------------------------------------------------
// Tests: the vectors recorded from the earlier Node module, and the shapes they cannot hold
// ---------------------------------------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::BTreeMap;

    /// The small contract: prefix, shim path, hook timeout, rows.
    fn contract() -> &'static Value {
        static DOC: OnceLock<Value> = OnceLock::new();
        DOC.get_or_init(|| {
            serde_json::from_str(include_str!("../../contracts/agent-hooks.v1.json")).unwrap()
        })
    }

    /// The replay vectors recorded from the earlier Node module.
    // Only the Unix-only recorded-case test uses it.
    #[cfg_attr(not(unix), allow(dead_code))]
    fn vectors() -> &'static Value {
        static DOC: OnceLock<Value> = OnceLock::new();
        DOC.get_or_init(|| {
            serde_json::from_str(include_str!("../tests/goldens/agent-hooks-vectors.json")).unwrap()
        })
    }

    // Only the Unix-only recorded-case test uses it.
    #[cfg_attr(not(unix), allow(dead_code))]
    struct Fixture {
        base: PathBuf,
        root: PathBuf,
        home: PathBuf,
    }

    // Only the Unix-only recorded-case test uses it.
    #[cfg_attr(not(unix), allow(dead_code))]
    impl Fixture {
        fn new(label: &str, sub: &str) -> Fixture {
            static COUNTER: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);
            let n = COUNTER.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
            let base = crate::test_scratch::canonical(&std::env::temp_dir()).join(format!(
                "fgos-agent-hooks-{}-{n}-{label}",
                std::process::id()
            ));
            let _ = std::fs::remove_dir_all(&base);
            let root = base.join(sub);
            let home = base.join("home");
            std::fs::create_dir_all(&root).unwrap();
            std::fs::create_dir_all(&home).unwrap();
            // each fixture is its own repository root
            std::fs::create_dir_all(root.join(".git")).unwrap();
            Fixture { base, root, home }
        }

        fn lay(&self, files: &Map<String, Value>) {
            for (rel, text) in files {
                let file = self.root.join(rel);
                std::fs::create_dir_all(file.parent().unwrap()).unwrap();
                let text = text
                    .as_str()
                    .unwrap()
                    .replace("<ROOT>", &self.root.to_string_lossy())
                    .replace("<BASE>", &self.base.to_string_lossy());
                std::fs::write(file, text).unwrap();
            }
        }

        /// Every file under the root as the vectors list them: no `.git`, no installation, the root as `<ROOT>`.
        fn tree(&self) -> BTreeMap<String, String> {
            let mut out = BTreeMap::new();
            let mut stack = vec![self.root.clone()];
            while let Some(dir) = stack.pop() {
                for entry in std::fs::read_dir(&dir).unwrap() {
                    let path = entry.unwrap().path();
                    let rel = path
                        .strip_prefix(&self.root)
                        .unwrap()
                        .to_string_lossy()
                        .replace('\\', "/");
                    if rel == ".git" || rel == ".fgos/installation" {
                        continue;
                    }
                    if path.is_dir() {
                        stack.push(path);
                    } else {
                        let text = std::fs::read_to_string(&path).unwrap();
                        out.insert(rel, self.placeholders(&text));
                    }
                }
            }
            out
        }

        /// The text with the root as `<ROOT>` and what is left of the base directory as `<BASE>` (a root whose
        /// name needs quoting appears quoted, so only the base is left to name).
        fn placeholders(&self, text: &str) -> String {
            text.replace(&*self.root.to_string_lossy(), "<ROOT>")
                .replace(&*self.base.to_string_lossy(), "<BASE>")
        }

        fn with_shim(&self, on: bool) {
            let shim = project_shim_path(&self.root);
            if !on {
                let _ = std::fs::remove_dir_all(self.root.join(".fgos").join("installation"));
                return;
            }
            std::fs::create_dir_all(shim.parent().unwrap()).unwrap();
            std::fs::write(&shim, "#!/bin/sh\nexit 0\n").unwrap();
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                std::fs::set_permissions(&shim, std::fs::Permissions::from_mode(0o755)).unwrap();
            }
        }

        fn env(&self) -> impl Fn(&str) -> Option<String> + '_ {
            move |key| {
                matches!(key, "HOME" | "USERPROFILE")
                    .then(|| self.home.to_string_lossy().into_owned())
            }
        }

        fn process_env(&self) -> Vec<(String, String)> {
            vec![("PATH".into(), "/usr/bin:/bin".into())]
        }
    }

    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.base);
        }
    }

    // Only the Unix-only recorded-case test uses it.
    #[cfg_attr(not(unix), allow(dead_code))]
    fn tree_of(value: &Value) -> BTreeMap<String, String> {
        value
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| (k.clone(), v.as_str().unwrap().to_string()))
            .collect()
    }

    fn norm(value: Value, fx: &Fixture) -> Value {
        let escaped = |text: String| text.replace('\\', "\\\\");
        let text = value
            .to_string()
            .replace(&escaped(fx.root.to_string_lossy().into_owned()), "<ROOT>")
            .replace(&escaped(fx.base.to_string_lossy().into_owned()), "<BASE>")
            // the shim a command names sits below the root with the platform's separators
            .replace(
                r"<ROOT>\\.fgos\\installation\\bin\\fgos",
                "<ROOT>/.fgos/installation/bin/fgos",
            );
        serde_json::from_str(&text).unwrap()
    }

    #[test]
    fn the_prefilter_data_renders_the_regular_expression_the_case_globs_and_the_matches_of_the_vectors(
    ) {
        let doc: Value = serde_json::from_str(include_str!(
            "../../contracts/delete-guard-prefilter.v1.json"
        ))
        .unwrap();
        let p = Prefilter::bundled();
        assert_eq!(p.reg_exp_source(), doc["regExpSource"].as_str().unwrap());
        assert_eq!(p.case_globs(), doc["caseGlobs"].as_str().unwrap());
        for v in doc["vectors"].as_array().unwrap() {
            let command = v["command"].as_str().unwrap();
            assert_eq!(
                p.matches(command),
                v["matches"].as_bool().unwrap(),
                "{command}"
            );
        }
    }

    #[test]
    fn the_hook_table_equals_the_recorded_rows_for_a_project_that_opted_in() {
        let fx = Fixture::new("rows", "project");
        let rows = hook_rows(&fx.root, mailbox_hook_timeout_sec().unwrap());
        assert_eq!(
            mailbox_hook_timeout_sec().unwrap(),
            contract()["mailboxHookTimeoutSec"].as_u64().unwrap()
        );
        let mut got: Map<String, Value> = Map::new();
        for row in &rows {
            got.entry(row.cli.to_string())
                .or_insert_with(|| Value::Array(Vec::new()))
                .as_array_mut()
                .unwrap()
                .push(norm(row.to_value(), &fx));
        }
        // the earlier module recorded a null matcher where an entry has none
        let mut want = contract()["rowsMailboxOn"].clone();
        for rows in want.as_object_mut().unwrap().values_mut() {
            for row in rows.as_array_mut().unwrap() {
                if row["matcher"].is_null() {
                    row.as_object_mut().unwrap().remove("matcher");
                }
            }
        }
        for (cli, rows) in want.as_object().unwrap() {
            let rows = rows.as_array().unwrap();
            let got_rows = got[cli].as_array().unwrap();
            assert_eq!(got_rows.len(), rows.len(), "{cli} row count");
            for (at, row) in rows.iter().enumerate() {
                assert_eq!(&got_rows[at], row, "{cli} row {at}");
            }
        }
        assert_eq!(got.len(), want.as_object().unwrap().len());
    }

    // Only the Unix-only recorded-case test uses it.
    #[cfg_attr(not(unix), allow(dead_code))]
    fn run_case(case: &Value) {
        let id = case["id"].as_str().unwrap();
        let cli = case["cli"].as_str().unwrap();
        let fx = Fixture::new(id, case["rootName"].as_str().unwrap_or("project"));
        let env = fx.env();
        fx.lay(case["before"].as_object().unwrap());
        let process_env = fx.process_env();
        let runner = test_runner::RetryOnBusy;
        if case["kind"].as_str() != Some("uninstall-only") {
            let installed = install_hook(&fx.root, cli, &env).unwrap();
            let want = &case["install"];
            assert_eq!(
                serde_json::to_value(&installed).unwrap(),
                want["result"],
                "{id}: install result"
            );
            assert_eq!(
                fx.tree(),
                tree_of(&want["files"]),
                "{id}: files after install"
            );
            let again = install_hook(&fx.root, cli, &env).unwrap();
            assert_eq!(
                serde_json::to_value(&again).unwrap(),
                case["reinstall"]["result"],
                "{id}: second install"
            );
            assert_eq!(
                fx.tree(),
                tree_of(&case["reinstall"]["files"]),
                "{id}: files after second install"
            );
            fx.with_shim(false);
            let no_shim = check_hook(&fx.root, cli, &env, &process_env, &runner, None).unwrap();
            assert_eq!(
                serde_json::to_value(&no_shim).unwrap(),
                case["checkNoShim"],
                "{id}: check without shim"
            );
            #[cfg(unix)]
            {
                fx.with_shim(true);
                let with = check_hook(&fx.root, cli, &env, &process_env, &runner, None).unwrap();
                assert_eq!(
                    serde_json::to_value(&with).unwrap(),
                    case["checkWithShim"],
                    "{id}: check with shim"
                );
                fx.with_shim(false);
            }
        }
        let described = norm(
            serde_json::to_value(
                uninstall_agent_hooks(&fx.root, false)
                    .unwrap()
                    .into_iter()
                    .filter(|r| r.cli == cli)
                    .collect::<Vec<_>>(),
            )
            .unwrap(),
            &fx,
        );
        assert_eq!(described, case["uninstallDescribe"], "{id}: describe");
        let applied = norm(
            serde_json::to_value(
                uninstall_agent_hooks(&fx.root, true)
                    .unwrap()
                    .into_iter()
                    .filter(|r| r.cli == cli)
                    .collect::<Vec<_>>(),
            )
            .unwrap(),
            &fx,
        );
        assert_eq!(
            applied, case["uninstall"]["results"],
            "{id}: uninstall results"
        );
        assert_eq!(
            fx.tree(),
            tree_of(&case["uninstall"]["files"]),
            "{id}: files after uninstall"
        );
    }

    // The recorded cases hold a readable mailbox opt-in; the config door refuses Windows, so the opt-in is unknown there
    // and the mailbox rows are left as they are.
    #[cfg(unix)]
    #[test]
    fn every_recorded_case_installs_checks_and_uninstalls_byte_for_byte_as_the_earlier_module_did()
    {
        for case in vectors()["cases"].as_array().unwrap() {
            run_case(case);
        }
    }

    #[test]
    fn a_hook_file_reached_through_a_link_is_reported_and_left_alone_by_a_reversal() {
        #[cfg(unix)]
        {
            let fx = Fixture::new("link", "project");
            let target = fx.base.join("elsewhere.json");
            std::fs::write(&target, "{}").unwrap();
            std::fs::create_dir_all(fx.root.join(".claude")).unwrap();
            std::os::unix::fs::symlink(&target, fx.root.join(".claude").join("settings.json"))
                .unwrap();
            let results = uninstall_agent_hooks(&fx.root, true).unwrap();
            assert_eq!(results.len(), 1);
            assert_eq!(results[0].state, UninstallState::Symlink);
            assert_eq!(std::fs::read_to_string(&target).unwrap(), "{}");
        }
    }

    #[cfg(unix)]
    #[test]
    fn an_install_keeps_the_mode_of_a_file_and_follows_a_link_that_stays_inside_the_project() {
        use std::os::unix::fs::PermissionsExt;
        let fx = Fixture::new("mode", "project");
        let lookup = fx.env();
        let target = fx.root.join("dotfiles").join("settings.json");
        std::fs::create_dir_all(target.parent().unwrap()).unwrap();
        std::fs::write(&target, "{}").unwrap();
        std::fs::set_permissions(&target, std::fs::Permissions::from_mode(0o600)).unwrap();
        std::fs::create_dir_all(fx.root.join(".claude")).unwrap();
        let link = fx.root.join(".claude").join("settings.json");
        std::os::unix::fs::symlink(&target, &link).unwrap();
        assert!(
            install_json_hooks(&fx.root, "claude", &lookup)
                .unwrap()
                .wired
        );
        assert!(
            std::fs::symlink_metadata(&link)
                .unwrap()
                .file_type()
                .is_symlink(),
            "the link stays"
        );
        assert!(std::fs::read_to_string(&target)
            .unwrap()
            .contains("hook dispatch-decide"));
        assert_eq!(
            std::fs::metadata(&target).unwrap().permissions().mode() & 0o777,
            0o600
        );
    }

    #[cfg(unix)]
    #[test]
    fn a_reversal_follows_a_link_that_stays_inside_the_project_and_refuses_one_that_leaves_it() {
        let fx = Fixture::new("reversal-link", "project");
        let lookup = fx.env();
        let target = fx.root.join("dotfiles").join("settings.json");
        std::fs::create_dir_all(target.parent().unwrap()).unwrap();
        std::fs::write(&target, "{}").unwrap();
        std::fs::create_dir_all(fx.root.join(".claude")).unwrap();
        std::os::unix::fs::symlink(&target, fx.root.join(".claude").join("settings.json")).unwrap();
        assert!(
            install_json_hooks(&fx.root, "claude", &lookup)
                .unwrap()
                .wired
        );
        let results = uninstall_agent_hooks(&fx.root, true).unwrap();
        assert_eq!(
            results[0].state,
            UninstallState::Changed,
            "install and reversal agree on an inner link"
        );
        assert_eq!(std::fs::read_to_string(&target).unwrap().trim(), "{}");
        // a link that leaves the project is refused by both
        let outside = fx.base.join("elsewhere.json");
        std::fs::write(&outside, "{}").unwrap();
        std::fs::remove_file(fx.root.join(".claude").join("settings.json")).unwrap();
        std::os::unix::fs::symlink(&outside, fx.root.join(".claude").join("settings.json"))
            .unwrap();
        assert_eq!(
            install_json_hooks(&fx.root, "claude", &lookup)
                .unwrap()
                .skipped_existing,
            Some("outside-project")
        );
        assert_eq!(
            uninstall_agent_hooks(&fx.root, true).unwrap()[0].state,
            UninstallState::Symlink
        );
        assert_eq!(std::fs::read_to_string(&outside).unwrap(), "{}");
    }

    #[cfg(unix)]
    #[test]
    fn a_new_hook_file_gets_the_mode_a_plain_create_gets_under_the_umask() {
        use std::os::unix::fs::PermissionsExt;
        let fx = Fixture::new("umask", "project");
        let lookup = fx.env();
        install_json_hooks(&fx.root, "claude", &lookup).unwrap();
        let plain = fx.root.join("plain-create");
        std::fs::File::create(&plain).unwrap();
        let mode = |p: &Path| std::fs::metadata(p).unwrap().permissions().mode() & 0o777;
        assert_eq!(
            mode(&fx.root.join(".claude").join("settings.json")),
            mode(&plain)
        );
        let left: Vec<_> = std::fs::read_dir(fx.root.join(".claude"))
            .unwrap()
            .map(|e| e.unwrap().file_name())
            .collect();
        assert!(
            left.iter().all(|n| !n.to_string_lossy().contains("probe")),
            "no probe file is left: {left:?}"
        );
    }

    #[cfg(unix)]
    #[test]
    fn an_install_refuses_a_hook_file_that_resolves_outside_the_project_and_writes_nothing_there() {
        let fx = Fixture::new("escape", "project");
        let lookup = fx.env();
        let elsewhere = fx.base.join("elsewhere");
        std::fs::create_dir_all(&elsewhere).unwrap();
        let refused = |cli: &str| {
            let result = install_hook(&fx.root, cli, &lookup).unwrap();
            assert_eq!(result.skipped_existing, Some("outside-project"), "{cli}");
            assert!(!result.wired, "{cli}");
        };
        // a link in place of the file, pointing outside
        let outside_file = elsewhere.join("settings.json");
        std::fs::write(&outside_file, "{}").unwrap();
        std::fs::create_dir_all(fx.root.join(".claude")).unwrap();
        std::os::unix::fs::symlink(&outside_file, fx.root.join(".claude").join("settings.json"))
            .unwrap();
        refused("claude");
        assert_eq!(std::fs::read_to_string(&outside_file).unwrap(), "{}");
        // a dangling link
        std::fs::create_dir_all(fx.root.join(".codex")).unwrap();
        std::os::unix::fs::symlink(
            elsewhere.join("absent.json"),
            fx.root.join(".codex").join("hooks.json"),
        )
        .unwrap();
        refused("codex");
        assert!(!elsewhere.join("absent.json").exists());
        // a linked parent directory
        std::os::unix::fs::symlink(&elsewhere, fx.root.join(".agents")).unwrap();
        refused("agy");
        // the extension, through a linked directory
        std::os::unix::fs::symlink(&elsewhere, fx.root.join(".pi")).unwrap();
        refused("pi");
        assert!(!elsewhere.join("hooks.json").exists() && !elsewhere.join("extensions").exists());
    }

    struct Scripted(
        std::cell::RefCell<Vec<fgos_process::spawn::Outcome>>,
        std::cell::RefCell<usize>,
    );

    impl ProcessRunner for Scripted {
        fn run(
            &self,
            _: &OsStr,
            _: &[String],
            env: &[(String, String)],
            _: Option<&Path>,
            input: Option<&[u8]>,
            _: Duration,
        ) -> io::Result<fgos_process::spawn::Outcome> {
            *self.1.borrow_mut() += 1;
            assert!(
                env.iter()
                    .all(|(k, _)| k != "FGOS_RUST_HOST_RECURSION_GUARD"),
                "the probe drops the guard"
            );
            assert_eq!(input, Some(&b"{}"[..]));
            let mut queue = self.0.borrow_mut();
            if queue.is_empty() {
                return Err(io::Error::from(io::ErrorKind::NotFound));
            }
            Ok(queue.remove(0))
        }
    }

    fn exited(code: i32, stdout: &[u8]) -> fgos_process::spawn::Outcome {
        #[cfg(unix)]
        let status = {
            use std::os::unix::process::ExitStatusExt;
            std::process::ExitStatus::from_raw(code << 8)
        };
        #[cfg(windows)]
        let status = {
            use std::os::windows::process::ExitStatusExt;
            std::process::ExitStatus::from_raw(code as u32)
        };
        fgos_process::spawn::Outcome::Exited(std::process::Output {
            status,
            stdout: stdout.to_vec(),
            stderr: Vec::new(),
        })
    }

    #[test]
    fn the_shim_probe_names_why_a_shim_is_not_runnable_and_asks_each_probe_once_per_memo() {
        let fx = Fixture::new("probe", "project");
        fx.with_shim(true);
        let env = vec![
            ("PATH".to_string(), "/usr/bin".to_string()),
            (
                "FGOS_RUST_HOST_RECURSION_GUARD".to_string(),
                "1".to_string(),
            ),
        ];
        let run = |outcomes: Vec<fgos_process::spawn::Outcome>, memo: Option<&ProbeMemo>| {
            let runner = Scripted(
                std::cell::RefCell::new(outcomes),
                std::cell::RefCell::new(0),
            );
            let v = is_shim_runnable(&fx.root, Some("claude"), &env, &runner, memo);
            let calls = *runner.1.borrow();
            (v, calls)
        };
        let (ok, calls) = run(vec![exited(0, b""), exited(0, b""), exited(0, b"")], None);
        assert!(ok.runnable);
        assert_eq!(calls, 3);
        let (bad, _) = run(vec![exited(0, b""), exited(1, b"")], None);
        assert_eq!(
            bad.reason.as_deref(),
            Some("main-checkout-delete-guard: exit-1")
        );
        let (loud, _) = run(
            vec![exited(0, b""), exited(0, b""), exited(0, b"text")],
            None,
        );
        assert_eq!(
            loud.reason.as_deref(),
            Some("mailbox (claude): printed on stdout")
        );
        let (timed, _) = run(
            vec![fgos_process::spawn::Outcome::TimedOut {
                stdout: vec![],
                stderr: vec![],
            }],
            None,
        );
        assert_eq!(timed.reason.as_deref(), Some("dispatch-decide: exit-null"));
        let (missing_binary, _) = run(vec![], None);
        assert_eq!(
            missing_binary.reason.as_deref(),
            Some("dispatch-decide: exit-null")
        );
        let memo = ProbeMemo::default();
        let (first, c1) = run(
            vec![exited(0, b""), exited(0, b""), exited(0, b"")],
            Some(&memo),
        );
        let (second, c2) = run(vec![], Some(&memo));
        assert!(first.runnable && second.runnable);
        assert_eq!(
            (c1, c2),
            (3, 0),
            "a second ask of the same probes starts nothing"
        );
        fx.with_shim(false);
        let (gone, calls) = run(vec![], None);
        assert_eq!(gone.reason.as_deref(), Some("shim-missing"));
        assert_eq!(calls, 0);
    }

    #[test]
    fn our_own_commands_are_recognised_by_kind_and_a_lookalike_never_is() {
        let row = HookRow::new("codex", KIND_MAILBOX, "Stop", String::new())
            .args("--cli codex --event stop");
        let shim = shim_relative();
        let ours = [
            format!("'/p/{shim}' hook mailbox --cli codex --event stop"),
            format!("\"${{CLAUDE_PROJECT_DIR}}/{shim}\" hook mailbox --cli codex --event stop"),
            format!("/p/{shim} hook mailbox --cli codex --event stop --format=agy  "),
            format!("{shim} hook mailbox --cli codex --event stop"),
            format!("'/it'\\''s/{shim}' hook mailbox --cli codex --event stop"),
        ];
        for command in &ours {
            assert!(command_is_kind(command, &row), "{command}");
        }
        let foreign = [
            format!("bash -c '{shim} hook mailbox --cli codex --event stop'"),
            format!("'/p/{shim}' hook mailbox --cli codex --event stop; echo more"),
            format!("'/p/{shim}' hook mailbox --cli codex --event post-tool-use"),
            format!("'/p/{shim}-other' hook mailbox --cli codex --event stop"),
            "echo hook mailbox --cli codex --event stop".to_string(),
        ];
        for command in &foreign {
            assert!(!command_is_kind(command, &row), "{command}");
        }
    }

    #[test]
    fn a_fix_that_wired_a_hook_names_the_file_and_the_mailbox_notice_where_the_cli_has_mailbox_rows(
    ) {
        let wired = |mailbox: Option<&str>| InstallResult {
            wired: true,
            skipped_existing: None,
            mailbox: mailbox.map(str::to_owned),
        };
        assert_eq!(
            install_message("claude", &wired(None)),
            "wired Claude Code hooks in .claude/settings.json"
        );
        assert_eq!(
            install_message("codex", &wired(Some("the mailbox opt-in is refused"))),
            "wired Codex CLI hooks in .codex/hooks.json; the mailbox opt-in is refused"
        );
        assert_eq!(
            install_message("agy", &wired(Some("never shown for agy"))),
            "wired AGY hooks in .agents/hooks.json"
        );
        assert_eq!(
            install_message("omp", &wired(Some(""))),
            "wired OMP extension hook in .omp/extensions/fgos-hooks.ts"
        );
        assert_eq!(
            install_message("pi", &wired(Some("n"))),
            "wired Pi extension hook in .pi/extensions/fgos-hooks.ts; n"
        );
        let skipped = InstallResult {
            wired: false,
            skipped_existing: Some("malformed"),
            mailbox: None,
        };
        assert_eq!(install_message("pi", &skipped), "skipped: malformed");
    }
}
