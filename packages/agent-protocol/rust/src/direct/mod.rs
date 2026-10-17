//! Adapters for the `direct` launch mode: the agent runs headless, its output
//! lands in capture files, and the supervisor learns the end from the exit
//! gate. Each adapter is a pure state machine over what that CLI left behind.
//! Wordings below are the ones the Node runner already classifies at run
//! settlement (`provider-auth-failure.mjs`), reduced to what a live round needs.

use std::path::{Path, PathBuf};

use crate::outcome::{Activity, BlockedReason, ExitInfo, Outcome, StdinPolicy};

mod agy;
mod claude;
mod codex;
mod generic;
mod omp;
mod pi;

/// Trailing non-empty lines that count as a process's final words; a wording
/// far up a long capture is only something the agent said or ran.
pub const TAIL_LINES: usize = 5;

pub trait DirectAdapter {
    fn cli(&self) -> &'static str;

    fn stdin_policy(&self) -> StdinPolicy {
        StdinPolicy::NullDevice
    }

    /// Does this CLI's output name a dead login or a used-up quota?
    fn names_blocks(&self) -> bool {
        true
    }

    fn activity_from(&self, capture_delta: &str) -> Activity {
        activity_of(capture_delta)
    }

    /// `result_path` is the newest `outbox/result-<N>.json`, when one exists.
    fn classify(&self, exit: ExitInfo, capture_tail: &str, result_path: Option<&Path>) -> Outcome {
        if let Some(path) = result_path {
            return Outcome::Completed {
                result_path: path.to_path_buf(),
            };
        }
        if self.names_blocks() {
            if let Some(reason) = blocked_reason(capture_tail) {
                return Outcome::Blocked(reason);
            }
        }
        Outcome::Exited { code: exit.code }
    }
}

/// The adapter for an envelope's `agentProtocol.cli`; an unknown name gets the
/// generic adapter (exit and outbox only).
pub fn adapter_for(cli: &str) -> &'static dyn DirectAdapter {
    match cli.trim().to_ascii_lowercase().as_str() {
        "claude" => &claude::Claude,
        "codex" => &codex::Codex,
        "agy" => &agy::Agy,
        "pi" => &pi::Pi,
        "omp" => &omp::Omp,
        _ => &generic::Generic,
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
            let number: u64 = number.parse().ok().filter(|_| !number.starts_with('+'))?;
            Some((number, name))
        })
        .max_by_key(|(number, _)| *number)
        .map(|(_, name)| outbox_dir.join(name))
}

fn activity_of(delta: &str) -> Activity {
    let mut seen_text = false;
    for line in delta.lines().map(str::trim).filter(|line| !line.is_empty()) {
        if line.starts_with('{') && line.ends_with('}') {
            return Activity::Event;
        }
        seen_text = true;
    }
    if seen_text {
        Activity::Output
    } else {
        Activity::Quiet
    }
}

fn tail(text: &str) -> Vec<&str> {
    let lines: Vec<&str> = text
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .collect();
    lines[lines.len().saturating_sub(TAIL_LINES)..].to_vec()
}

fn blocked_reason(capture_tail: &str) -> Option<BlockedReason> {
    let lines = tail(capture_tail);
    if lines.iter().any(|line| is_auth_failure(line)) {
        return Some(BlockedReason::Login);
    }
    if lines.iter().any(|line| is_quota_limit(line)) {
        return Some(BlockedReason::UsageLimit);
    }
    None
}

fn is_auth_failure(line: &str) -> bool {
    let line = line.to_lowercase();
    const SUBSTRINGS: [&str; 8] = [
        "oauth refresh failed",
        "oauth token refresh failed",
        "invalid_grant",
        "run /login",
        "authentication failed",
        "authentication required",
        "login required",
        "not logged in",
    ];
    if SUBSTRINGS.iter().any(|needle| line.contains(needle)) {
        return true;
    }
    for (at, _) in line.match_indices("api key") {
        let after: String = line[at + "api key".len()..]
            .chars()
            .take(20 + "expired".len())
            .collect();
        if ["missing", "invalid", "expired"]
            .iter()
            .any(|word| after.contains(word))
        {
            return true;
        }
    }
    let rest = strip_error_prefix(&line);
    rest.strip_prefix("no api key found for ")
        .is_some_and(|name| !name.trim().is_empty())
}

fn is_quota_limit(line: &str) -> bool {
    let line = line.to_lowercase().replace('’', "'");
    let rest = strip_error_prefix(&line);
    rest.starts_with("you've hit your usage limit")
        || rest.starts_with("usage limit has been reached")
        || rest.starts_with("individual quota reached")
}

/// Drops a leading `error:` / `error ` so a pattern anchors to the message.
fn strip_error_prefix(line: &str) -> &str {
    match line.strip_prefix("error") {
        Some(rest) => rest.trim_start_matches(':').trim_start(),
        None => line,
    }
}
