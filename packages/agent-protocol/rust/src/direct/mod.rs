//! Adapters for the `direct` launch mode: the agent runs headless, its output
//! lands in capture files, and the supervisor learns the end from the exit
//! gate. Each adapter is a pure state machine over what that CLI left behind.
//! Wordings below are the ones a live round needs: a dead login, a used-up
//! quota, a provider's API error.

use std::path::{Path, PathBuf};

use crate::outcome::{Activity, BlockedReason, ExitInfo, Outcome, ProviderSignal, RESET_HINT_MAX};

/// Trailing non-empty lines that count as a process's final words; a wording
/// far up a long capture is only something the agent said or ran.
pub const TAIL_LINES: usize = 5;

/// The adapter for one CLI's headless mode.
#[derive(Debug, Clone, Copy)]
pub struct Direct {
    cli: &'static str,
}

/// The adapter for an envelope's `agentProtocol.cli`. Every CLI's last words are read for a dead login or a
/// used-up quota (an executor can wrap any program); an unknown name is only reported as `generic`.
pub fn adapter_for(cli: &str) -> Direct {
    let known = ["claude", "codex", "agy", "pi", "omp"];
    let wanted = cli.trim().to_ascii_lowercase();
    match known.iter().find(|name| **name == wanted) {
        Some(cli) => Direct { cli },
        None => Direct { cli: "generic" },
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

    /// `result_path` is the newest `outbox/result-<N>.json`, when one exists. `stderr_tail` is read
    /// for a login or quota wording; `stdout_tail` only for the CLI's last JSON event.
    pub fn classify(
        &self,
        exit: ExitInfo,
        stderr_tail: &str,
        stdout_tail: &str,
        result_path: Option<&Path>,
    ) -> Outcome {
        if let Some(path) = result_path {
            return Outcome::Completed {
                result_path: path.to_path_buf(),
            };
        }
        if let Some(reason) = blocked_reason(stderr_tail) {
            return Outcome::Blocked(reason);
        }
        if let Some(reason) = last_event_stop(stdout_tail) {
            return Outcome::Blocked(reason);
        }
        Outcome::Exited { code: exit.code }
    }

    /// The provider's own signal in the same words `classify` reads: the stderr tail's lines and the
    /// last JSON event of the stdout tail when it is an error.
    pub fn provider_signal(&self, stderr_tail: &str, stdout_tail: &str) -> Option<ProviderSignal> {
        let mut lines = tail(stderr_tail);
        let event = last_error_message(stdout_tail);
        let body = event
            .as_ref()
            .and_then(|message| message["errorMessage"].as_str())
            .unwrap_or_default();
        lines.extend(body.lines().map(str::trim).filter(|line| !line.is_empty()));
        let mut signal = provider_signal(&lines)?;
        signal.status = event
            .as_ref()
            .and_then(|message| message["errorStatus"].as_u64())
            .and_then(|status| u16::try_from(status).ok())
            .filter(|status| (100..600).contains(status))
            .or(signal.status);
        Some(signal)
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
            let plain = number.bytes().all(|b| b.is_ascii_digit())
                && (number == "0" || !number.starts_with('0'));
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
    ["missing", "invalid", "expired"]
        .iter()
        .any(|word| window.contains(word))
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
    if LOGIN_PHRASES
        .iter()
        .chain(&["invalid_grant", "run /login"])
        .any(|needle| line.contains(needle))
    {
        return true;
    }
    if line
        .match_indices("api key")
        .any(|(at, _)| api_key_trouble(&line[at + "api key".len()..]))
    {
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
    LOGIN_PHRASES
        .iter()
        .any(|phrase| message.starts_with(phrase))
        || message.strip_prefix("api key").is_some_and(api_key_trouble)
        || no_key_found(message)
}

pub(crate) fn is_quota_limit(line: &str) -> bool {
    let line = line.to_lowercase().replace('’', "'");
    let rest = strip_label(strip_marker(&line), &["error"]);
    rest.starts_with("you've hit your usage limit")
        || rest.starts_with("usage limit has been reached")
        || rest.starts_with("individual quota reached")
        || out_of_credits(rest)
        || api_error_status(rest) == Some(429)
        || retry_gave_up(rest).is_some_and(|why| {
            why.starts_with("provider requested") || api_error_status(why) == Some(429)
        })
}

/// omp's last words when its retry loop ends: `Error: Retry failed after <n> attempts: <why>`, with the
/// text after the colon. The CLI itself says it gave up, so a screen that ends on it is a stop and not a
/// wait. A provider that asked for a longer pause than omp's `retry.maxDelayMs` allows is a quota stop
/// (`is_quota_limit`), and so is one whose reason is an `api error (429)`; any other give-up is the
/// provider's fault (`is_provider_error`). `rest` is the
/// lowercased line after its marker and `error` label, so a sentence that merely quotes the wording does
/// not match.
fn retry_gave_up(rest: &str) -> Option<&str> {
    let (count, why) = rest
        .strip_prefix("retry failed after ")?
        .split_once(" attempt")?;
    let why = why.trim_start_matches('s').strip_prefix(':')?;
    (!count.is_empty() && count.bytes().all(|b| b.is_ascii_digit())).then(|| why.trim_start())
}

/// The CLI's last JSON event when it is an error message: a pi-family event (`message_end`, `turn_end`)
/// whose message has `stopReason: error`, or an `agent_end` whose last message does. The newest line that
/// parses is the last event: a capture tail can start inside a longer line.
fn last_error_message(stdout_tail: &str) -> Option<serde_json::Value> {
    let event = tail(stdout_tail)
        .iter()
        .rev()
        .find_map(|line| serde_json::from_str::<serde_json::Value>(line).ok())?;
    let message = match &event["messages"] {
        serde_json::Value::Array(messages) => messages.last().unwrap_or(&serde_json::Value::Null),
        _ => &event["message"],
    };
    (message["stopReason"] == "error").then(|| message.clone())
}

/// Why the provider refused the round, as the last JSON event says: a 429 or an error body whose status
/// is `RESOURCE_EXHAUSTED` is a used-up quota; any other 4xx or 5xx is the provider's fault. 401 and 403
/// are a login, never this.
fn last_event_stop(stdout_tail: &str) -> Option<BlockedReason> {
    let message = last_error_message(stdout_tail)?;
    let status = message["errorStatus"].as_u64();
    let exhausted = message["errorMessage"].as_str().is_some_and(|text| {
        text.lines()
            .any(|line| status_word(line).as_deref() == Some("RESOURCE_EXHAUSTED"))
    });
    match status {
        Some(401 | 403) => None,
        Some(429) => Some(BlockedReason::UsageLimit),
        _ if exhausted => Some(BlockedReason::UsageLimit),
        Some(400..=599) => Some(BlockedReason::ProviderError),
        _ => None,
    }
}

/// The status of an anchored `<api> api error (<status>)` at the start of `rest` (a lowercased line after
/// its marker and `error` label): at most four words name the API, so the agent's own sentence that
/// mentions one is not the CLI speaking.
fn api_error_status(rest: &str) -> Option<u16> {
    let (api, after) = rest.split_once("api error (")?;
    let words_ok = api.split_whitespace().count() <= 4
        && api
            .split_whitespace()
            .all(|word| word.chars().all(|c| c.is_alphanumeric() || c == '-'));
    let digits = after.get(..4)?.strip_suffix(')')?;
    (words_ok && digits.bytes().all(|b| b.is_ascii_digit()))
        .then(|| digits.parse().ok())
        .flatten()
}

/// A provider's API error on a terminal screen, as omp draws it: `✘ Cloud Code Assist API error (404): {...`,
/// or the line that ends its retries (`retry_gave_up`). The line is the CLI speaking (`api_error_status`).
/// 401 and 403 are a login and 429 a used-up quota (`is_quota_limit`), never this.
pub(crate) fn is_provider_error(line: &str) -> bool {
    let line = line.to_lowercase();
    let rest = strip_label(strip_marker(&line), &["error"]);
    retry_gave_up(rest).is_some()
        || api_error_status(rest)
            .is_some_and(|status| matches!(status, 400..=599) && !matches!(status, 401 | 403 | 429))
}

/// Drops one leading symbol a TUI draws before an error line (`■ `, `⚠ `): a non-ASCII character that is
/// neither a letter nor a digit. Plain punctuation stays, so a quoted line (`> ...`) is still a quote.
fn strip_marker(line: &str) -> &str {
    let line = line.trim_start();
    match line.chars().next() {
        Some(mark) if !mark.is_ascii() && !mark.is_alphanumeric() => {
            line[mark.len_utf8()..].trim_start()
        }
        _ => line,
    }
}

/// pi on an OpenRouter 402 prints `Error: 402: {"message":"This request requires more credits, ...`;
/// the status and the JSON opening are optional so the plain-message form matches too.
fn out_of_credits(rest: &str) -> bool {
    let rest = rest
        .strip_prefix("402")
        .map_or(rest, |r| r.trim_start_matches(':').trim_start());
    let rest = rest.strip_prefix("{\"message\":\"").unwrap_or(rest);
    rest.strip_prefix("this request ")
        .unwrap_or(rest)
        .starts_with("requires more credits")
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

/// The provider's own signal in some lines of CLI output (the newest line that carries a field wins):
/// the HTTP status of an `api error (<n>)`, the error body's `"status": "<WORD>"`, the wait a provider
/// asked for (`provider requested <n>ms wait`) and the CLI's reset phrase (`resets in <dur>`,
/// `try again at <h:mm am|pm>`). `None` when no field is found.
pub fn provider_signal(lines: &[&str]) -> Option<ProviderSignal> {
    let mut signal = ProviderSignal::default();
    for line in lines.iter().rev() {
        let lowered = line.to_ascii_lowercase();
        signal.status = signal.status.or_else(|| status_in(&lowered));
        signal.status_word = signal.status_word.take().or_else(|| status_word(line));
        signal.requested_wait_ms = signal
            .requested_wait_ms
            .or_else(|| requested_wait_ms(&lowered));
        signal.reset_hint = signal
            .reset_hint
            .take()
            .or_else(|| reset_hint(line, &lowered));
    }
    (!signal.is_empty()).then_some(signal)
}

/// `api error (<n>)` anywhere on the line, `n` a status of 100-599.
fn status_in(lowered: &str) -> Option<u16> {
    let after = &lowered[lowered.find("api error (")? + "api error (".len()..];
    let digits = after
        .get(..3)
        .filter(|d| d.bytes().all(|b| b.is_ascii_digit()))?;
    after[3..]
        .starts_with(')')
        .then(|| digits.parse::<u16>().ok())
        .flatten()
        .filter(|status| (100..600).contains(status))
}

/// `"status": "<WORD>"` (a JSON error body's status), `WORD` of `[A-Z_]{1,64}`.
fn status_word(line: &str) -> Option<String> {
    let mut rest = line;
    while let Some(at) = rest.find("\"status\"") {
        rest = &rest[at + "\"status\"".len()..];
        let Some(value) = rest
            .trim_start()
            .strip_prefix(':')
            .and_then(|r| r.trim_start().strip_prefix('"'))
        else {
            continue;
        };
        if let Some((word, _)) = value.split_once('"') {
            if (1..=64).contains(&word.len())
                && word.bytes().all(|b| b.is_ascii_uppercase() || b == b'_')
            {
                return Some(word.to_string());
            }
        }
    }
    None
}

/// `provider requested <n>ms wait`.
fn requested_wait_ms(lowered: &str) -> Option<u64> {
    let after = &lowered[lowered.find("provider requested ")? + "provider requested ".len()..];
    let (digits, rest) = after.split_at(after.find(|c: char| !c.is_ascii_digit())?);
    rest.starts_with("ms wait")
        .then(|| digits.parse().ok())
        .flatten()
}

/// The phrase `resets in <dur>` / `reset in <dur>` or `try again at <h:mm am|pm>`, as the line wrote it.
/// `lowered` is `line` in ASCII lowercase, so byte offsets agree.
fn reset_hint(line: &str, lowered: &str) -> Option<String> {
    let hint = reset_in(line, lowered).or_else(|| try_again_at(line, lowered))?;
    (hint.chars().count() <= RESET_HINT_MAX).then_some(hint)
}

fn try_again_at(line: &str, lowered: &str) -> Option<String> {
    const LEAD: &str = "try again at ";
    let start = lowered.find(LEAD)?;
    let time = &lowered[start + LEAD.len()..];
    let (hours, rest) = time.split_once(':')?;
    let minutes = rest.get(..2)?;
    let meridiem = rest[2..].trim_start_matches(' ');
    let digits =
        |s: &str, max: usize| (1..=max).contains(&s.len()) && s.bytes().all(|b| b.is_ascii_digit());
    let kept = rest[2..].len() - meridiem.len();
    (digits(hours, 2)
        && digits(minutes, 2)
        && (meridiem.starts_with("am") || meridiem.starts_with("pm")))
    .then(|| line[start..start + LEAD.len() + hours.len() + 1 + 2 + kept + 2].to_string())
}

fn reset_in(line: &str, lowered: &str) -> Option<String> {
    const UNITS: [&str; 17] = [
        "d", "day", "days", "h", "hr", "hrs", "hour", "hours", "m", "min", "mins", "minute",
        "minutes", "s", "sec", "secs", "seconds",
    ];
    let (start, lead) = ["resets in ", "reset in "]
        .iter()
        .find_map(|lead| lowered.find(lead).map(|at| (at, lead.len())))?;
    let mut cursor = start + lead;
    let mut end = None;
    for token in lowered[cursor..].split(' ') {
        let word = token.trim_end_matches(['.', ',', ';', ')']);
        let letters = word.trim_start_matches(|c: char| c.is_ascii_digit());
        let has_digits = letters.len() < word.len();
        let accepted = if has_digits {
            letters.is_empty() || UNITS.contains(&letters)
        } else {
            word == "and" || UNITS.contains(&word)
        };
        if !accepted {
            break;
        }
        cursor += word.len();
        if word != "and" && (has_digits || end.is_some()) {
            end = Some(cursor);
        }
        if word.len() != token.len() {
            break;
        }
        cursor += 1;
    }
    end.map(|end| line[start..end].to_string())
}
