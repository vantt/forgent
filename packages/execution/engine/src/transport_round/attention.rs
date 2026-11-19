//! The attention view: the runs of the whole project that need a person. Kept out of `inspection` because it
//! reads the execution outcome table, and the reconcile import closure must not load the execution stack.
//!
//! What the unit-run history and the host own reaches it through injected readers: the outcome of a settled run
//! result, the attempt's unit state, and the host's one `metrics query --def` call.

use std::fs;
use std::path::Path;

use fgos_execution::outcome::ERROR_OUTCOMES;
use fgos_host_runtime::civil_time::{format_unix_millis_rfc3339, parse_rfc3339_millis};
use serde_json::{json, Map, Value};

use super::inspection::{
    all_runs, json_file, parse_attention_since, result_of, workspace, RunLocation, RunsCache,
    Terminal,
};
use crate::transport::visibility_session::{attempt_lock_state, LockState};

/// The attempt's unit state, as the caller's read of it answers: `{ attemptState, unitState, resumeCommand }`.
pub type AttemptView<'a> = &'a dyn Fn(&Path) -> Value;

/// The host's `metrics query --def` call for `(since, now)`.
pub type DefinitionsReader<'a> = &'a dyn Fn(&str, &str) -> Value;

/// What the attention view reads beyond the run records.
pub struct AttentionReaders<'a> {
    pub now: &'a dyn Fn() -> String,
    /// The outcome of an interpreted run result (`pass`, `findings`, `execution-failure`, ...).
    pub outcome_of: &'a dyn Fn(&Value) -> String,
    pub view: AttemptView<'a>,
    /// The host's `metrics query --def` answer for `{ since, now }`, when the caller has one.
    pub definitions: Option<DefinitionsReader<'a>>,
}

fn to_ms(value: Option<&Value>) -> Option<i64> {
    value.and_then(Value::as_str).and_then(parse_rfc3339_millis)
}

/// The group a seat's attempts belong to: the assignment id without its fallback suffix (`-fb<n>`).
fn seat_group(assignment_id: Option<&str>) -> String {
    let id = assignment_id.unwrap_or_default();
    let bytes = id.as_bytes();
    let mut out = String::new();
    let mut i = 0;
    while i < id.len() {
        if id[i..].starts_with("-fb") {
            let digits = id[i + 3..].bytes().take_while(u8::is_ascii_digit).count();
            let end = i + 3 + digits;
            if digits > 0 && (end == id.len() || bytes[end] == b'/') {
                i = end;
                continue;
            }
        }
        let c = id[i..].chars().next().unwrap();
        out.push(c);
        i += c.len_utf8();
    }
    out
}

struct Found {
    kind: &'static str,
    reason: String,
}

// The row a settled attempt earns, or None. Only an attempt that ended in error alerts (the outcome module's
// ERROR_OUTCOMES); `pass` and `findings` are verdicts and belong to the unit's outcome, not to a row of the
// attempt. Early ends name themselves in the receipt reason.
fn settled_attention(l: &RunLocation, terminal: &Terminal, outcome: &str) -> Option<Found> {
    if !ERROR_OUTCOMES.contains(&outcome) {
        return None;
    }
    let receipt = json_file(&l.run_dir.join("receipt.json"));
    let receipt_reason = receipt
        .as_ref()
        .and_then(|r| r.get("reason"))
        .map(|r| match r {
            Value::String(s) => s.clone(),
            Value::Null => String::new(),
            other => other.to_string(),
        })
        .unwrap_or_default();
    let failure = terminal
        .value
        .as_ref()
        .and_then(|v| v.pointer("/classification/failure/code"))
        .and_then(Value::as_str);
    let named = failure.map(|f| format!(" ({f})")).unwrap_or_default();
    if receipt_reason.starts_with("terminal:needs-") {
        return Some(Found {
            kind: "needs-human",
            reason: format!("the run stopped for a person: {receipt_reason}"),
        });
    }
    if outcome == "blocked"
        || outcome == "provider-limit"
        || receipt_reason.starts_with("terminal:blocked")
    {
        let tail = if !receipt_reason.is_empty() {
            format!(": {receipt_reason}")
        } else if !named.is_empty() {
            named
        } else {
            format!(" ({outcome})")
        };
        return Some(Found {
            kind: "blocked",
            reason: format!("blocked{tail}"),
        });
    }
    if outcome == "policy-refusal" {
        return Some(Found {
            kind: "refused",
            reason: format!("refused by policy{named}"),
        });
    }
    Some(Found {
        kind: "failed",
        reason: format!("the run failed{named}"),
    })
}

// Rows of the named detections (`core/attention/definitions`), as the host's one `metrics query --def` call
// answers them. The definition file owns the kind, the reason and the next command (its `row` template); the group
// names the subject. A row is a detection made now, so its instant is the observation, never the record time it
// grouped. A definition the host could not measure, or that errored, yields no row and is listed in `unmeasured`
// so a silent gap never reads as "nothing needs a person".
fn definition_rows(answer: &Value, now_ms: i64) -> (Vec<(i64, Value)>, Vec<Value>) {
    let (mut rows, mut unmeasured) = (Vec::new(), Vec::new());
    for def in answer
        .get("definitions")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
    {
        let name = def.get("name").cloned().unwrap_or(Value::Null);
        let truthy = |k: &str| {
            def.get(k).filter(|v| {
                !v.is_null() && **v != json!(false) && **v != json!("") && **v != json!(0)
            })
        };
        if let Some(reason) = truthy("unmeasured").or_else(|| truthy("error")) {
            unmeasured.push(json!({ "name": name, "reason": reason }));
            continue;
        }
        let Some(row) = def.get("row").filter(|r| !r.is_null()) else {
            continue;
        };
        for r in def
            .get("rows")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
        {
            if r.get("insufficient")
                .is_some_and(|v| !v.is_null() && v.as_bool() != Some(false))
            {
                continue;
            }
            let subject = r
                .pointer("/group/subject.id")
                .cloned()
                .unwrap_or_else(|| name.clone());
            let subject_text = subject
                .as_str()
                .map(String::from)
                .unwrap_or_else(|| subject.to_string());
            let text = |k: &str| row.get(k).and_then(Value::as_str).unwrap_or("").to_string();
            let (kind, reason, next) = (text("kind"), text("reason"), text("nextCommand"));
            rows.push((
                now_ms,
                json!({
                    "subject": subject_text, "assignmentId": null, "worktree": null,
                    "kind": kind, "reason": reason, "nextCommand": next,
                    "line": format!("{kind} {subject_text} {reason} -> {next}"),
                }),
            ));
        }
    }
    (rows, unmeasured)
}

fn settled_at_ms(l: &RunLocation, terminal: &Terminal) -> Option<i64> {
    to_ms(terminal.value.as_ref().and_then(|v| v.get("settledAt"))).or_else(|| {
        let modified = fs::metadata(l.run_dir.join("result.json"))
            .ok()?
            .modified()
            .ok()?;
        modified
            .duration_since(std::time::UNIX_EPOCH)
            .ok()
            .map(|d| d.as_millis() as i64)
    })
}

/// The runs of the whole project (every worktree) that need a person, started or settled at or after `since`.
/// Computed from the run records on each call; nothing is stored. Idle is not reported: the supervisor keeps its
/// idle clock in memory and writes no readable record of the last real screen activity, and a file time is not
/// that.
///
/// A run with no result is judged by its attempt lock. Held and past its declared timeout: `past-deadline`, timed
/// at the observation. Not held: `controller-dead`, unless a resume already replaced the attempt or its unit
/// settled.
pub fn attention_view(
    root: &Path,
    since: &str,
    readers: &AttentionReaders<'_>,
    runs_cache: Option<&mut RunsCache>,
) -> Result<Value, String> {
    let since_ms = parse_attention_since(since)?;
    let observed_at = (readers.now)();
    let now_ms = parse_rfc3339_millis(&observed_at).unwrap_or(0);
    let valid: Vec<RunLocation> = all_runs(root, false, runs_cache)
        .into_iter()
        .filter(|l| {
            !l.malformed
                && l.run
                    .as_ref()
                    .and_then(|r| r.get("runId"))
                    .is_some_and(|v| v.as_str().is_some_and(|s| !s.is_empty()))
        })
        .collect();
    let settled: Vec<(&RunLocation, Terminal)> = valid.iter().map(|l| (l, result_of(l))).collect();
    let outcomes: Vec<Option<String>> = settled
        .iter()
        .map(|(_, t)| {
            (t.present && !t.corrupt)
                .then(|| t.value.as_ref().map(|v| (readers.outcome_of)(v)))
                .flatten()
        })
        .collect();
    // A failed attempt that a later attempt or fallback of the same seat settled as a pass is a measure, not an alert.
    let passed_at: Vec<(usize, i64)> = settled
        .iter()
        .enumerate()
        .filter(|(i, _)| outcomes[*i].as_deref() == Some("pass"))
        .map(|(i, (l, t))| (i, settled_at_ms(l, t).unwrap_or(0)))
        .collect();
    let recovered = |index: usize, at_ms: i64| {
        passed_at.iter().any(|(o, passed)| {
            *o != index
                && seat_group(settled[*o].0.assignment_id.as_deref())
                    == seat_group(settled[index].0.assignment_id.as_deref())
                && *passed >= at_ms
        })
    };
    let mut rows: Vec<(i64, Value)> = Vec::new();
    for (index, (l, terminal)) in settled.iter().enumerate() {
        let started_ms = to_ms(l.run.as_ref().and_then(|r| r.get("startedAt")));
        let (mut found, mut at_ms, mut attempt): (Option<Found>, Option<i64>, Option<Value>) =
            (None, started_ms, None);
        if terminal.present {
            at_ms = settled_at_ms(l, terminal).or(started_ms);
            found = if terminal.corrupt {
                Some(Found {
                    kind: "failed",
                    reason: "the run result is unreadable".into(),
                })
            } else {
                outcomes[index]
                    .as_deref()
                    .and_then(|o| settled_attention(l, terminal, o))
            };
            if found.is_some() && !terminal.corrupt && recovered(index, at_ms.unwrap_or(0)) {
                found = None;
            }
        } else if l
            .run
            .as_ref()
            .and_then(|r| r.get("settlement"))
            .and_then(Value::as_str)
            != Some("abandoned-legacy")
        {
            let lock = attempt_lock_state(&l.run_dir);
            let timeout = l
                .run
                .as_ref()
                .and_then(|r| r.get("timeoutMs"))
                .and_then(Value::as_f64)
                .filter(|t| t.is_finite());
            if let (LockState::Held, Some(started), Some(timeout)) = (lock, started_ms, timeout) {
                if (now_ms - started) as f64 > timeout {
                    found = Some(Found {
                        kind: "past-deadline",
                        reason: format!(
                            "still running {}s after its declared timeout of {}s (from the run record, not the supervisor's clock)",
                            js_round((now_ms - started) as f64 / 1000.0),
                            js_round(timeout / 1000.0)
                        ),
                    });
                    at_ms = Some(now_ms);
                }
            }
            if found.is_none() && lock == LockState::Free && at_ms.is_some_and(|at| at >= since_ms)
            {
                let view = (readers.view)(&l.run_dir);
                let state = |k: &str| view.get(k).and_then(Value::as_str).map(String::from);
                let gone_on = state("attemptState").as_deref() == Some("superseded")
                    || matches!(
                        state("unitState").as_deref(),
                        Some("completed") | Some("failed")
                    );
                attempt = Some(view);
                if !gone_on {
                    found = Some(Found {
                        kind: "controller-dead",
                        reason: "no result and nobody holds the attempt lock: its controller died"
                            .into(),
                    });
                }
            }
        }
        let (Some(found), Some(at_ms)) = (found, at_ms) else {
            continue;
        };
        if at_ms < since_ms {
            continue;
        }
        let attempt = attempt.unwrap_or_else(|| (readers.view)(&l.run_dir));
        let run_id = l
            .run
            .as_ref()
            .and_then(|r| r.get("runId"))
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string();
        let live = found.kind == "past-deadline";
        let next_command = attempt
            .get("resumeCommand")
            .and_then(Value::as_str)
            .filter(|c| !c.is_empty())
            .map(String::from)
            .unwrap_or_else(|| {
                if live {
                    format!("fgos dispatch watch {run_id}")
                } else {
                    format!("fgos dispatch inspect --run {run_id}")
                }
            });
        let worktree = l
            .run
            .as_ref()
            .and_then(|r| r.get("cwd"))
            .and_then(Value::as_str)
            .filter(|c| !c.is_empty())
            .map(|c| workspace(Path::new(c)).root.to_string_lossy().into_owned());
        rows.push((at_ms, json!({
            "runId": run_id, "subject": run_id, "assignmentId": l.assignment_id, "worktree": worktree,
            "kind": found.kind, "reason": found.reason, "nextCommand": next_command,
            "line": format!("{} {run_id} {} {} -> {next_command}", found.kind, worktree.as_deref().unwrap_or("-"), found.reason),
        })));
    }
    let (detected, unmeasured) = match readers.definitions {
        Some(definitions) => {
            let since_iso = format_unix_millis_rfc3339(since_ms, 0).unwrap_or_default();
            definition_rows(&definitions(&since_iso, &observed_at), now_ms)
        }
        None => (Vec::new(), Vec::new()),
    };
    rows.extend(detected);
    rows.sort_by(|a, b| {
        let subject = |v: &Value| v["subject"].as_str().unwrap_or_default().to_string();
        a.0.cmp(&b.0)
            .then_with(|| subject(&a.1).cmp(&subject(&b.1)))
    });
    let out: Vec<Value> = rows.into_iter().map(|(_, row)| row).collect();
    let lines: Vec<Value> = out.iter().map(|r| r["line"].clone()).collect();
    let mut view = Map::new();
    view.insert(
        "contract".into(),
        json!({ "id": "attention-view", "version": 2 }),
    );
    view.insert("since".into(), json!(since));
    view.insert("observedAt".into(), json!(observed_at));
    view.insert("rows".into(), Value::Array(out));
    view.insert("unmeasured".into(), Value::Array(unmeasured));
    view.insert("idle".into(), json!({ "state": "not-readable", "reason": "the supervisor keeps its idle clock in memory; no readable record, so no idle rows" }));
    view.insert("lines".into(), Value::Array(lines));
    Ok(Value::Object(view))
}

/// `Math.round`: halves go up.
fn js_round(value: f64) -> i64 {
    (value + 0.5).floor() as i64
}
