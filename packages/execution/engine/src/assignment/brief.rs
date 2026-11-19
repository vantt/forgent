//! The brief: the worker's whole instruction set, as a file.
//!
//! Two things travel to an interactive agent. The work itself goes in a file on disk; only a one-line pointer goes
//! through the terminal. The split is portable (one shape that works for every agent kind), survives size, and is
//! round-scoped (`brief-<round>.md` is the freshness anchor that tells a stale report from a current one).
//!
//! The brief teaches the worker one gesture, write a `.tmp` then rename it, and an order: the report first, the
//! result file last, because the appearance of the result file is what ends the round. It never mentions an fgOS
//! command: the worker is not expected to know what dispatched it.

use std::path::{Component, Path, PathBuf};

use fgos_host_runtime::civil_time::format_unix_millis_rfc3339;
use serde_json::Value;

use super::{js_space, js_str, present};
use crate::run_result::claim::{render_agent_result_claim_instructions, ClaimContext};

/// Where one round's artifacts live, all absolute: a worker's cwd is its own worktree and has no relationship to
/// the run directory.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BriefPaths {
    pub run_dir: String,
    pub outbox: String,
    pub brief_path: String,
    pub ack_path: String,
    pub report_path: String,
    pub result_path: String,
    pub effective_execution_contract_path: String,
}

fn resolve(path: &str) -> PathBuf {
    let base = if Path::new(path).is_absolute() {
        PathBuf::from(path)
    } else {
        std::env::current_dir().unwrap_or_default().join(path)
    };
    let mut out = PathBuf::new();
    for component in base.components() {
        match component {
            Component::ParentDir => {
                out.pop();
            }
            Component::CurDir => {}
            other => out.push(other.as_os_str()),
        }
    }
    out
}

fn text(path: PathBuf) -> String {
    path.to_string_lossy().into_owned()
}

pub fn brief_paths(run_dir: &str, round: u64) -> BriefPaths {
    let dir = resolve(run_dir);
    let outbox = dir.join("outbox");
    BriefPaths {
        run_dir: text(dir.clone()),
        brief_path: text(dir.join(format!("brief-{round}.md"))),
        ack_path: text(outbox.join(format!("ack-{round}.json"))),
        report_path: text(outbox.join(format!("report-{round}.md"))),
        result_path: text(outbox.join(format!("result-{round}.json"))),
        effective_execution_contract_path: text(dir.join("effective-execution-contract.json")),
        outbox: text(outbox),
    }
}

/// `YYYY-MM-DD HH:MM:SS` in the given UTC offset.
fn clock(unix_ms: i64, offset_seconds: i32) -> String {
    format_unix_millis_rfc3339(unix_ms, offset_seconds)
        .map(|stamp| stamp[..19].replace('T', " "))
        .unwrap_or_default()
}

/// `YYYY-MM-DD HH:MM:SS UTC+07:00`.
fn local_clock(unix_ms: i64, offset_seconds: i32) -> String {
    let sign = if offset_seconds < 0 { '-' } else { '+' };
    let minutes = offset_seconds.unsigned_abs() / 60;
    format!(
        "{} UTC{sign}{:02}:{:02}",
        clock(unix_ms, offset_seconds),
        minutes / 60,
        minutes % 60
    )
}

/// The wall-clock moment the round's time budget runs out, as local time and UTC; `None` when no budget is known.
/// `local_offset_seconds` answers the machine's UTC offset (east positive) at a given Unix millisecond.
pub fn deadline_text(
    timeout_ms: Option<&Value>,
    now_ms: i64,
    local_offset_seconds: &dyn Fn(i64) -> i32,
) -> Option<String> {
    let timeout = timeout_ms.and_then(|value| {
        value.as_i64().or_else(|| {
            value
                .as_f64()
                .filter(|f| f.fract() == 0.0 && f.abs() < 9.0e15)
                .map(|f| f as i64)
        })
    })?;
    if timeout <= 0 {
        return None;
    }
    let end = now_ms + timeout;
    Some(format!(
        "{} ({} UTC)",
        local_clock(end, local_offset_seconds(end)),
        clock(end, 0)
    ))
}

/// What a claim's instructions need to know about the assignment (role, operation, posture verdict).
pub fn claim_context_of(assignment: &Value) -> ClaimContext {
    let pick = |key: &str| present(assignment.get(key));
    ClaimContext {
        role: pick("role").and_then(Value::as_str).map(str::to_string),
        operation: pick("operation")
            .and_then(Value::as_str)
            .map(str::to_string),
        posture_verdict: pick("posture").map(|p| p.get("verdict") == Some(&Value::Bool(true))),
    }
}

fn is_blank(c: char) -> bool {
    c == ' ' || c == '\t'
}

/// Splits `text` after the `\n` ending a line, keeping the terminator with the line.
fn lines_keep(text: &str) -> Vec<&str> {
    text.split_inclusive('\n').collect()
}

/// `$1` + `target` for every `[ \t]*-[ \t]*Claim path:[ \t]*[^\n]+` in `text`.
fn unify_claim_path(text: &str, target: &str) -> String {
    const PHRASE: &str = "Claim path:";
    let mut out = String::with_capacity(text.len());
    for line in lines_keep(text) {
        let (body, end) = match line.strip_suffix('\n') {
            Some(body) => (body, "\n"),
            None => (line, ""),
        };
        let mut done = String::new();
        let mut rest = body;
        let mut replaced = false;
        while let Some(dash) = rest.find('-') {
            let after = &rest[dash + 1..];
            let skip = after.len() - after.trim_start_matches(is_blank).len();
            if after[skip..].starts_with(PHRASE) {
                let tail = &after[skip + PHRASE.len()..];
                if tail.is_empty() {
                    done.push_str(&rest[..dash + 1 + skip + PHRASE.len()]);
                    rest = "";
                    break;
                }
                let ws = tail.len() - tail.trim_start_matches(is_blank).len();
                let keep = if ws == tail.len() { ws - 1 } else { ws };
                done.push_str(&rest[..dash + 1 + skip + PHRASE.len() + keep]);
                done.push_str(target);
                rest = "";
                replaced = true;
                break;
            }
            done.push_str(&rest[..dash + 1]);
            rest = &rest[dash + 1..];
        }
        let _ = replaced;
        done.push_str(rest);
        out.push_str(&done);
        out.push_str(end);
    }
    out
}

/// Removes `[ \t]*- Write structured JSON to [^\n]+(?:\n[ \t]+[^\n]+)*`.
fn remove_structured_json(text: &str) -> String {
    const PHRASE: &str = "- Write structured JSON to ";
    let mut out = String::new();
    let mut rest = text;
    while let Some(at) = rest.find(PHRASE) {
        let head = &rest[..at];
        let after = &rest[at + PHRASE.len()..];
        let line_end = after.find('\n').unwrap_or(after.len());
        if line_end == 0 {
            // `[^\n]+` needs a character: no match here.
            out.push_str(&rest[..at + PHRASE.len()]);
            rest = after;
            continue;
        }
        out.push_str(head.trim_end_matches(is_blank));
        let mut cursor = line_end;
        // `(?:\n[ \t]+[^\n]+)*`: each continuation is indented and at least two characters long.
        while after[cursor..].starts_with('\n') {
            let next = &after[cursor + 1..];
            let next_end = next.find('\n').unwrap_or(next.len());
            let line = &next[..next_end];
            let indent = line.len() - line.trim_start_matches(is_blank).len();
            if indent >= 1 && line.len() >= 2 {
                cursor += 1 + next_end;
            } else {
                break;
            }
        }
        rest = &after[cursor..];
    }
    out.push_str(rest);
    out
}

/// `$1` + `report` for the human-readable report line.
fn align_report_path(text: &str, report: &str) -> String {
    const PHRASES: [&str; 2] = [
        "- Also write a human-readable report to",
        "- Optional human-readable report:",
    ];
    const REQUIRED: &str = " -- REQUIRED";
    let mut out = String::new();
    let mut rest = text;
    'scan: loop {
        let hit = PHRASES
            .iter()
            .filter_map(|p| rest.find(p).map(|at| (at, p.len())))
            .min_by_key(|(at, _)| *at);
        let Some((at, len)) = hit else {
            break;
        };
        let after = &rest[at + len..];
        let line_end = after.find('\n').unwrap_or(after.len());
        let line = &after[..line_end];
        let ws = line.len() - line.trim_start_matches(is_blank).len();
        let body = &line[ws..];
        // Lazy `[^\n]+?` up to a lookahead of " -- REQUIRED", a newline or the end.
        let mut stop = body.len();
        for (idx, _) in body.char_indices().skip(1) {
            if body[idx..].starts_with(REQUIRED) {
                stop = idx;
                break;
            }
        }
        let (keep, consumed) = if body.is_empty() {
            if ws == 0 {
                out.push_str(&rest[..at + len]);
                rest = after;
                continue 'scan;
            }
            (ws - 1, line.len())
        } else {
            (ws, ws + stop)
        };
        // A leading `[ \t]*` before the dash is part of the kept group; it stays in `rest[..at]`.
        out.push_str(&rest[..at + len + keep]);
        out.push_str(report);
        rest = &after[consumed..];
    }
    out.push_str(rest);
    out
}

/// Drops a `Result artifact:` header left with no bullets: `\n*Result artifact:\s*(?=\n\s*(?:Effective execution contract:|$))`.
fn drop_empty_result_artifact(text: &str) -> String {
    const PHRASE: &str = "Result artifact:";
    const NEXT: &str = "Effective execution contract:";
    let mut out = String::new();
    let mut rest = text;
    while let Some(at) = rest.find(PHRASE) {
        let head = &rest[..at];
        let after = &rest[at + PHRASE.len()..];
        let space_len: usize = after
            .chars()
            .take_while(|c| js_space(*c))
            .map(char::len_utf8)
            .sum();
        // `\s*` is greedy but gives characters back until the lookahead holds.
        let mut j = space_len;
        let mut found = None;
        loop {
            let tail = &after[j..];
            if let Some(next) = tail.strip_prefix('\n') {
                let trimmed = next.trim_start_matches(js_space);
                if trimmed.is_empty() || trimmed.starts_with(NEXT) {
                    found = Some(j);
                    break;
                }
            }
            if j == 0 {
                break;
            }
            j -= after[..j].chars().next_back().map_or(1, char::len_utf8);
        }
        match found {
            Some(j) => {
                out.push_str(head.trim_end_matches('\n'));
                out.push('\n');
                rest = &after[j..];
            }
            None => {
                out.push_str(&rest[..at + PHRASE.len()]);
                rest = after;
            }
        }
    }
    out.push_str(rest);
    out
}

/// Render the brief the worker reads. Wraps the prompt, renders the execution contract, harmonizes the claim path
/// to the brief's result path and aligns the report requirements.
pub fn render_brief(
    prompt: &str,
    round: u64,
    run_dir: &str,
    agent_name: Option<&str>,
    effective_contract: Option<&Value>,
    now_ms: i64,
    local_offset_seconds: &dyn Fn(i64) -> i32,
) -> String {
    let p = brief_paths(run_dir, round);
    let contract = effective_contract.filter(|c| super::truthy(Some(c)));
    let limit = |key: &str| {
        contract
            .and_then(|c| c.get("limits"))
            .and_then(|l| l.get(key))
    };
    let timeout = present(limit("executorTimeoutMs")).or_else(|| limit("timeoutMs"));
    let target_result_path = contract
        .and_then(|c| c.get("resultClaim"))
        .and_then(|r| r.get("path"))
        .and_then(Value::as_str)
        .filter(|path| !path.is_empty())
        .map(str::to_string)
        .unwrap_or_else(|| p.result_path.clone());
    let deadline = deadline_text(timeout, now_ms, local_offset_seconds);
    let contract_section = match contract {
        Some(c) => format!(
            "\n## Execution contract\n\n- Mutation: {}\n- Result claim path: {}\n- Timeout: {}ms\n- Persisted contract: {}\n",
            js_str(c.get("mutation")),
            target_result_path,
            js_str(timeout),
            p.effective_execution_contract_path
        ),
        None => String::new(),
    };

    let clean = unify_claim_path(prompt, &target_result_path);
    let clean = remove_structured_json(&clean);
    let clean = align_report_path(&clean, &p.report_path);
    let clean = drop_empty_result_artifact(&clean);
    let clean = clean.trim_matches(js_space);

    let agent = match agent_name {
        Some(name) => serde_json::to_string(name).unwrap_or_default(),
        None => "null".to_string(),
    };
    let context = claim_context_of(
        contract
            .and_then(|c| c.get("assignment"))
            .unwrap_or(&Value::Null),
    );
    let instructions = render_agent_result_claim_instructions(&context);
    let deadline_block = match &deadline {
        Some(deadline) => format!(
            "\n\nYour time for this round ends at {deadline}. The moment the report is saved, write the\nresult file; improve the report afterwards only if time remains (the round may be read\nas soon as the result file exists). A round whose result file is missing when time runs\nout is scored as not finished, however complete the report is."
        ),
        None => String::new(),
    };

    format!(
        "# Brief {round}\n\n- Brief file on disk (re-read after compaction or restart): {brief}\n{contract_section}\n## Acknowledge first\n\nBefore you start, write this file:\n\n    {ack}\n\nwith exactly:\n\n    {{\"round\": {round}, \"agent\": {agent}, \"receivedAt\": \"<ISO 8601 timestamp>\"}}\n\nWrite it as `{ack}.tmp` first, then rename it into place. Never write\na file in this directory in any other way -- a reader may look at it at any\nmoment, and a rename is the only step that is either done or not done.\n\n## Your task\n\n{clean}\n\n## When you finish\n\nWrite these two files, in this order, each one `.tmp`-then-rename:\n\n1. `{report}` -- what you did, in prose. Anything a reader needs to\n   understand or check your work belongs here.\n2. `{target_result_path}` -- a JSON object:\n\n       {{\"contract\":{{\"id\":\"agent-result-claim\",\"version\":2}},\n        \"status\": \"done\" | \"blocked\" | \"failed\" | \"no-evidence\",\n        \"summary\": \"<one or two sentences>\", \"evidenceRefs\": []}}\n\n   Claim requirements:\n{instructions}\n\n   \"settled\" is not a valid status here -- that word names the run reaching\n   its end, not whether the work succeeded; a worker that writes \"settled\"\n   in this file fails schema validation and the round is scored failed.\n\nThe second file is what ends this round, so write it last and only once the\nfirst one is on disk.{deadline_block}\n\nNothing you write is treated as proof on its own; it is\nyour account of the work, and it is read alongside the repository itself.\n\nWrite only inside `{outbox}`. Everything else under\n`{run_dir}` belongs to whoever is watching you.\n",
        brief = p.brief_path,
        ack = p.ack_path,
        report = p.report_path,
        outbox = p.outbox,
        run_dir = p.run_dir,
    )
}

/// The single line typed at the agent. Everything else is on disk; one line, so a TUI takes it as one submission.
pub fn render_pointer(run_dir: &str, round: u64) -> String {
    format!(
        "Read {} and do what it says.",
        brief_paths(run_dir, round).brief_path
    )
}
