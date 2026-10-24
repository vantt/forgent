//! Adapters for the `direct` launch mode: the agent runs headless, its output
//! lands in capture files, and the supervisor learns the end from the exit
//! gate. Each adapter is a pure state machine over what that CLI left behind.
//! Wordings below are the ones the Node runner already classifies at run
//! settlement (`provider-auth-failure.mjs`), reduced to what a live round needs.

use std::path::{Path, PathBuf};

use crate::outcome::{Activity, BlockedReason, ExitInfo, Outcome};

/// Trailing non-empty lines that count as a process's final words; a wording
/// far up a long capture is only something the agent said or ran.
pub const TAIL_LINES: usize = 5;

/// The adapter for one CLI's headless mode.
#[derive(Debug, Clone, Copy)]
pub struct Direct {
    cli: &'static str,
    /// Does this CLI's output name a dead login or a used-up quota?
    names_blocks: bool,
}

/// The adapter for an envelope's `agentProtocol.cli`; an unknown name gets the
/// generic adapter (exit and outbox only).
pub fn adapter_for(cli: &str) -> Direct {
    let known = ["claude", "codex", "agy", "pi", "omp"];
    let wanted = cli.trim().to_ascii_lowercase();
    match known.iter().find(|name| **name == wanted) {
        Some(cli) => Direct { cli, names_blocks: true },
        None => Direct { cli: "generic", names_blocks: false },
    }
}

impl Direct {
    pub fn cli(&self) -> &'static str {
        self.cli
    }

    pub fn activity_from(&self, capture_delta: &str) -> Activity {
        if capture_delta.trim().is_empty() {
            Activity::Quiet
        } else {
            Activity::Output
        }
    }

    /// `result_path` is the newest `outbox/result-<N>.json`, when one exists.
    pub fn classify(&self, exit: ExitInfo, capture_tail: &str, result_path: Option<&Path>) -> Outcome {
        if let Some(path) = result_path {
            return Outcome::Completed {
                result_path: path.to_path_buf(),
            };
        }
        if self.names_blocks {
            if let Some(reason) = blocked_reason(capture_tail) {
                return Outcome::Blocked(reason);
            }
        }
        Outcome::Exited { code: exit.code }
    }
}

/// The newest result file among `names` (the outbox listing), by its number.
pub fn newest_result<'a>(
    outbox_dir: &Path,
    names: impl IntoIterator<Item = &'a str>,
) -> Option<PathBuf> {
    names
        .into_iter()
        .filter_map(|name| {
            let number = name.strip_prefix("result-")?.strip_suffix(".json")?;
            // Plain decimal only: `+5` and `007` parse as numbers but are not names the agent protocol issues.
            let plain = number.bytes().all(|b| b.is_ascii_digit()) && (number == "0" || !number.starts_with('0'));
            let number: u64 = number.parse().ok().filter(|_| plain)?;
            Some((number, name))
        })
        .max_by_key(|(number, _)| *number)
        .map(|(_, name)| outbox_dir.join(name))
}

pub(crate) fn tail(text: &str) -> Vec<&str> {
    let lines: Vec<&str> = text
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .collect();
    lines[lines.len().saturating_sub(TAIL_LINES)..].to_vec()
}

fn blocked_reason(capture_tail: &str) -> Option<BlockedReason> {
    let lines = tail(capture_tail);
    if lines.iter().any(|line| capture_login(line)) {
        return Some(BlockedReason::Login);
    }
    if lines.iter().any(|line| is_quota_limit(line)) {
        return Some(BlockedReason::UsageLimit);
    }
    None
}

/// Wordings of a dead login that every CLI's own error text shares; the two matchers below decide
/// where on a line one may stand.
const LOGIN_PHRASES: [&str; 8] = [
    "oauth refresh failed",
    "oauth token refresh failed",
    "authentication failed",
    "authentication required",
    "login required",
    "not logged in",
    "no default model selected",
    "invalid api key",
];

/// `api key` then, within 20 characters, one of the words that name a key problem.
fn api_key_trouble(after_api_key: &str) -> bool {
    let window: String = after_api_key.chars().take(20 + "expired".len()).collect();
    ["missing", "invalid", "expired"].iter().any(|word| window.contains(word))
}

/// `no api key found for <name>`, at the start of the message.
fn no_key_found(message: &str) -> bool {
    message
        .strip_prefix("no api key found for ")
        .is_some_and(|name| !name.trim().is_empty())
}

/// A dead login in a capture tail (direct mode): the wording anywhere on one of the last
/// `TAIL_LINES` lines, the CLI's own error region (a glog line carries it mid-line).
pub(crate) fn capture_login(line: &str) -> bool {
    let line = line.to_lowercase();
    if LOGIN_PHRASES.iter().chain(&["invalid_grant", "run /login"]).any(|needle| line.contains(needle)) {
        return true;
    }
    if line.match_indices("api key").any(|(at, _)| api_key_trouble(&line[at + "api key".len()..])) {
        return true;
    }
    no_key_found(strip_label(&line, &["error"]))
}

/// A dead login on a terminal screen: the line itself, after an optional `error` / `warning` /
/// `fatal` label, starts with the wording. The screen also carries the agent's own text, so a
/// wording in the middle of a sentence (`run /login if ...`) is not the CLI speaking.
pub(crate) fn screen_login(line: &str) -> bool {
    let line = line.to_lowercase();
    let message = strip_label(&line, &["error", "warning", "fatal"]);
    LOGIN_PHRASES.iter().any(|phrase| message.starts_with(phrase))
        || message.strip_prefix("api key").is_some_and(api_key_trouble)
        || no_key_found(message)
}

pub(crate) fn is_quota_limit(line: &str) -> bool {
    let line = line.to_lowercase().replace('’', "'");
    let rest = strip_label(&line, &["error"]);
    rest.starts_with("you've hit your usage limit")
        || rest.starts_with("usage limit has been reached")
        || rest.starts_with("individual quota reached")
}

/// Drops a leading label (`error:`, `warning `) so a pattern anchors to the message.
fn strip_label<'a>(line: &'a str, labels: &[&str]) -> &'a str {
    let line = line.trim_start();
    for label in labels {
        if let Some(rest) = line.strip_prefix(label) {
            if rest.starts_with(':') || rest.starts_with(char::is_whitespace) {
                return rest.trim_start_matches(':').trim_start();
            }
        }
    }
    line
}
