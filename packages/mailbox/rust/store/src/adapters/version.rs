//! The recipient's CLI version (spec §4.1, plan decision 12): Claude Code
//! records it in its session file, keyed by the head's pid, and a head whose
//! file the caller cannot see — a confined head
//! has its own config directory and its own pid namespace — names it by the
//! executable it runs, a versioned binary under `versions/`; Codex records
//! none, so the installed `codex --version` is asked, with a bound on how
//! long it may take. Any failure is no version, never a refused send. The
//! mailbox delivery report, the mailbox typed wake and `fgos session type`
//! all read the version here.
use crate::head::record_of_head_text;
use crate::record::read_regular_capped;
use fgos_mailbox_core::Cli;
use fgos_process::facts::{view_of, ScanFilter};
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
        "claude" => claude_version(head, sources),
        "codex" => codex_installed_version(&sources.codex_program, CODEX_VERSION_TIMEOUT),
        "agy" => agy_installed_version(),
        _ => None,
    }
}

/// Claude Code's version for the head `head`: what its session file records,
/// else what the executable of the head process itself names.
fn claude_version(head: &str, sources: &VersionSources) -> Option<String> {
    sources
        .claude_sessions
        .as_deref()
        .and_then(|sessions| claude_session_version(sessions, head, sources.max_read_bytes))
        .or_else(|| claude_process_version(head))
}

/// agy's installed version, bounded like Codex's; an unrecognised output stays unknown.
fn agy_installed_version() -> Option<String> {
    let mut command = Command::new("agy");
    command.arg("--version");
    let Outcome::Exited(output) =
        run_bounded_command(command, None, CODEX_VERSION_TIMEOUT, |_| ()).ok()?
    else {
        return None;
    };
    if !output.status.success() {
        return None;
    }
    let output = String::from_utf8(output.stdout).ok()?;
    let version = output.trim().strip_prefix("agy ").unwrap_or(output.trim());
    plain_version(version).then(|| version.to_string())
}

/// The version a head runs where its session file is out of the caller's
/// reach: Claude Code runs a versioned binary, so the head process's own
/// executable names its version ([`version_of_exe`]). Read only while the
/// process is still the head the record names — a pid the system has since
/// given to another process would otherwise lend its executable here.
fn claude_process_version(head: &str) -> Option<String> {
    let record = record_of_head_text(head);
    let pid = record.pid?;
    let wanted = record.start_time?;
    let view = view_of(pid, &ScanFilter::default())?;
    let same_process = view
        .tuple
        .as_ref()
        .is_some_and(|tuple| tuple.start_time == wanted);
    same_process
        .then(|| view.exe.as_deref().and_then(version_of_exe))
        .flatten()
}

/// The version an executable path names: its parent directory is `versions`
/// and its own name is that version, a plain `MAJOR.MINOR.PATCH`.
fn version_of_exe(exe: &Path) -> Option<String> {
    let in_versions = exe
        .parent()
        .and_then(Path::file_name)
        .and_then(|dir| dir.to_str())
        == Some("versions");
    let name = exe.file_name()?.to_str()?;
    (in_versions && plain_version(name)).then(|| name.to_string())
}

/// Whether `text` is `MAJOR.MINOR.PATCH` in digits only.
fn plain_version(text: &str) -> bool {
    let parts: Vec<&str> = text.split('.').collect();
    parts.len() == 3
        && parts
            .iter()
            .all(|part| !part.is_empty() && part.bytes().all(|b| b.is_ascii_digit()))
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
