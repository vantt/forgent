//! The verify command: what one run proves, and what a loop's `verify` hook is told.
//!
//! A verdict (the check ran and passed or found something) is its own outcome; a check that did not run to an
//! end (timed out, or could not start) proves nothing and runs again, so it is `infrastructure`.

use std::time::{Duration, Instant};

use fgos_process::spawn::{run_bounded, Outcome};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};

const TAIL_LINES: usize = 20;

/// How a verify run ended.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Verdict {
    Pass,
    Findings,
    /// `timeout` or `not-run`.
    Infrastructure(&'static str),
}

/// What one verify run proves.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Verified {
    pub verdict: Verdict,
    pub status: Option<i32>,
    pub how: String,
    pub tail: String,
    pub duration_ms: u64,
    pub output_digest: String,
}

/// The raw end of a command, whoever ran it (the custody borrow is the caller's wiring).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ran {
    pub passed: bool,
    pub status: Option<i32>,
    pub timed_out: bool,
    pub output: String,
}

/// Classify a finished command.
pub fn classify(ran: &Ran, timeout_ms: Option<u64>, duration_ms: u64) -> Verified {
    let how = if ran.timed_out {
        format!("timed out after {}ms", timeout_ms.unwrap_or(0))
    } else if let Some(status) = ran.status {
        format!("exited {status}")
    } else {
        "could not run".to_string()
    };
    let lines: Vec<&str> = ran.output.trim().split('\n').collect();
    let tail = lines[lines.len().saturating_sub(TAIL_LINES)..].join("\n");
    let digest = Sha256::digest(ran.output.as_bytes());
    let verdict = if ran.passed {
        Verdict::Pass
    } else if ran.timed_out {
        Verdict::Infrastructure("timeout")
    } else if ran.status.is_none() {
        Verdict::Infrastructure("not-run")
    } else {
        Verdict::Findings
    };
    Verified {
        verdict,
        status: ran.status,
        how,
        tail,
        duration_ms,
        output_digest: format!(
            "sha256:{}",
            digest
                .iter()
                .map(|b| format!("{b:02x}"))
                .collect::<String>()
        ),
    }
}

#[cfg(windows)]
fn run_shell(
    command: &str,
    env: &[(String, String)],
    cwd: &std::path::Path,
    timeout: Duration,
) -> std::io::Result<Outcome> {
    run_bounded("cmd", ["/C", command], env, Some(cwd), None, timeout)
}

#[cfg(not(windows))]
fn run_shell(
    command: &str,
    env: &[(String, String)],
    cwd: &std::path::Path,
    timeout: Duration,
) -> std::io::Result<Outcome> {
    run_bounded("sh", ["-c", command], env, Some(cwd), None, timeout)
}

/// Run `command` in `cwd` through the platform shell, bounded by `timeout`, and classify it. Never fails: a
/// command that cannot start is `not-run`.
pub fn run_verify(command: &str, cwd: &std::path::Path, timeout: Duration) -> Verified {
    let started = Instant::now();
    let env: Vec<(String, String)> = std::env::vars().collect();
    let ran = match run_shell(command, &env, cwd, timeout) {
        Ok(Outcome::Exited(out)) => Ran {
            passed: out.status.success(),
            status: out.status.code(),
            timed_out: false,
            output: format!(
                "{}{}",
                String::from_utf8_lossy(&out.stdout),
                String::from_utf8_lossy(&out.stderr)
            ),
        },
        Ok(Outcome::TimedOut { stdout, stderr }) => Ran {
            passed: false,
            status: None,
            timed_out: true,
            output: format!(
                "{}{}",
                String::from_utf8_lossy(&stdout),
                String::from_utf8_lossy(&stderr)
            ),
        },
        Err(error) => Ran {
            passed: false,
            status: None,
            timed_out: false,
            output: error.to_string(),
        },
    };
    classify(
        &ran,
        u64::try_from(timeout.as_millis()).ok(),
        u64::try_from(started.elapsed().as_millis()).unwrap_or(u64::MAX),
    )
}

/// The Execution outcome of a verify answer: a verdict is its own outcome, an infrastructure failure is
/// `execution-failure`, so a run that stops on it is rerun by `resume`.
pub fn outcome_of_verify(verified: &Verified) -> &'static str {
    match verified.verdict {
        Verdict::Pass => "pass",
        Verdict::Findings => "findings",
        Verdict::Infrastructure(_) => "execution-failure",
    }
}

/// What a verify answer tells a loop's `verify` hook: a pass; findings; or the infrastructure kind with the text
/// that says why.
pub fn answer_of_verify(verified: &Verified, subject: &str, command: &str) -> Value {
    if verified.verdict == Verdict::Pass {
        return json!({ "pass": true });
    }
    let tail = if verified.tail.is_empty() {
        String::new()
    } else {
        format!("\n{}", verified.tail)
    };
    let text = format!("{subject} {}: {command}{tail}", verified.how);
    match &verified.verdict {
        Verdict::Infrastructure(kind) => {
            json!({ "pass": false, "infrastructure": kind, "error": text })
        }
        _ => json!({ "pass": false, "findings": [text] }),
    }
}
