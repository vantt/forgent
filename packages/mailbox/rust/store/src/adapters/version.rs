//! The recipient's CLI version for the delivery report (spec §4.1, plan
//! decision 12): Claude Code records it in its session file, keyed by the
//! head's pid; Codex records none, so the installed `codex --version` is
//! asked, with a bound on how long it may take. Any failure is no version,
//! never a refused send.
use crate::head::record_of_head_text;
use crate::record::read_regular_capped;
use fgos_mailbox_core::Cli;
use fgos_process::spawn::{run_bounded_command, Outcome};
use serde_json::Value;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Duration;

/// How long `codex --version` may take before the version counts as
/// unknown (plan decision 12).
pub const CODEX_VERSION_TIMEOUT: Duration = Duration::from_secs(2);

/// Where the recipient's version can be read on this machine.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct VersionSources {
    /// Claude Code's sessions directory (`<config dir>/sessions`), when a
    /// config directory is known.
    pub claude_sessions: Option<PathBuf>,
    /// The Codex program `--version` is asked of.
    pub codex_program: PathBuf,
    /// The read cap of a session file (`mailbox.hook.maxReadBytes`).
    pub max_read_bytes: u64,
}

/// The version of `cli` the head with process identity `head` runs, when it
/// can be read.
pub fn recipient_version(cli: &Cli, head: &str, sources: &VersionSources) -> Option<String> {
    match cli.as_str() {
        "claude" => claude_session_version(
            sources.claude_sessions.as_deref()?,
            head,
            sources.max_read_bytes,
        ),
        "codex" => codex_installed_version(&sources.codex_program, CODEX_VERSION_TIMEOUT),
        _ => None,
    }
}

/// `version` of the session file of the head whose process record is
/// `head`, when that file names the same pid.
pub fn claude_session_version(sessions: &Path, head: &str, cap: u64) -> Option<String> {
    let pid = record_of_head_text(head).pid?.0;
    let bytes = read_regular_capped(&sessions.join(format!("{pid}.json")), cap).ok()?;
    let doc: Value = serde_json::from_slice(&bytes).ok()?;
    (doc["pid"].as_u64() == Some(u64::from(pid)))
        .then(|| doc["version"].as_str().map(String::from))
        .flatten()
}

/// The version `program --version` prints as `codex-cli <version>`, run
/// without a shell; `None` when it fails, prints anything else, or takes
/// longer than `timeout` (it is then killed).
pub fn codex_installed_version(program: &Path, timeout: Duration) -> Option<String> {
    let mut command = Command::new(program);
    command.arg("--version");
    let Outcome::Exited(output) = run_bounded_command(command, None, timeout, |_| ()).ok()? else {
        return None;
    };
    if !output.status.success() {
        return None;
    }
    let out = String::from_utf8(output.stdout).ok()?;
    out.trim()
        .strip_prefix("codex-cli ")
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty() && !v.contains(char::is_whitespace))
}
