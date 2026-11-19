//! What a Unit run has settled so far, read back from its directory under `.fgos/assignments`. Ported from
//! `runner/execution/unit-run-history.mjs`: the outcome a settled Run Result maps to, and the one final settled
//! record per seat and round the loops stand on. The Run Result is read by `run_result::reader` and its outcome
//! derived by `fgos-run-result`; nothing here derives either again.

use std::cmp::Ordering;
use std::path::Path;

use serde_json::{json, Value};

use crate::run_result::reader::interpret_run_result;
use crate::run_result::vocabulary::LEASE_CONFLICT_FAILURE_CODE;

/// The outcome vocabulary of the patterns for one settled Run Result. A provider limit has its own category, so a
/// caller can tell "this provider has no quota" from any other infrastructure failure.
pub fn outcome_of_run_result(run_result: &Value) -> &'static str {
    // A record without a classification is read like any other settled record; one that cannot be interpreted
    // comes back corrupt, which is a failure and never a pass.
    let classification = match run_result.get("classification").filter(|c| !c.is_null()) {
        Some(c) => c.clone(),
        None => interpret_run_result(run_result, None)
            .record
            .get("classification")
            .cloned()
            .unwrap_or(Value::Null),
    };
    let category = match classification
        .pointer("/outcome/category")
        .filter(|c| !c.is_null())
    {
        Some(c) => c.as_str().map(str::to_string).unwrap_or_default(),
        None => fgos_run_result::derive_outcome(&classification).category,
    };
    let failure_code = classification
        .pointer("/failure/code")
        .and_then(Value::as_str);
    match category.as_str() {
        "ok" => "pass",
        "verdict"
            if run_result
                .pointer("/classification/assessment/verdict")
                .and_then(Value::as_str)
                == Some("findings") =>
        {
            "findings"
        }
        "blocked" => "blocked",
        "policy" => "policy-refusal",
        "provider" => "provider-limit",
        "infra"
            if matches!(
                failure_code,
                Some("provider-limit" | "paused-limit" | "provider-capacity-refused")
            ) || failure_code == Some(LEASE_CONFLICT_FAILURE_CODE) =>
        {
            "provider-limit"
        }
        _ => "execution-failure",
    }
}

/// One settled attempt of a seat's round.
#[derive(Debug, Clone, PartialEq)]
pub struct SettledAttempt {
    pub assignment_id: String,
    pub assignment: Option<Value>,
    pub fallback_no: u64,
    pub run_name: String,
    pub run_result: Value,
    pub outcome: &'static str,
}

/// A seat's round: every settled attempt, and the final one the history stands on.
#[derive(Debug, Clone, PartialEq)]
pub struct SeatRound {
    pub seat: String,
    pub round: u64,
    pub attempts: Vec<SettledAttempt>,
    pub final_attempt: Option<SettledAttempt>,
}

/// `Number(a) - Number(b) || a.localeCompare(b)` over run names that are all digits.
fn compare_run_names(a: &str, b: &str) -> Ordering {
    let (x, y) = (
        a.parse::<f64>().unwrap_or(f64::NAN),
        b.parse::<f64>().unwrap_or(f64::NAN),
    );
    match x.partial_cmp(&y) {
        Some(Ordering::Equal) | None => a.cmp(b),
        Some(order) => order,
    }
}

fn is_missing(error: &std::io::Error) -> bool {
    // ENOENT, or ENOTDIR: an entry that is not a directory holds no seat.
    matches!(
        error.kind(),
        std::io::ErrorKind::NotFound | std::io::ErrorKind::NotADirectory
    )
}

fn parse_round_name(name: &str) -> Option<(u64, u64)> {
    let (round, fallback) = match name.split_once("-fb") {
        Some((round, fb)) => (round, Some(fb)),
        None => (name, None),
    };
    let digits = |s: &str| !s.is_empty() && s.bytes().all(|b| b.is_ascii_digit());
    if !digits(round) || fallback.is_some_and(|f| !digits(f)) {
        return None;
    }
    Some((
        round.parse().ok()?,
        fallback.map_or(Some(0), |f| f.parse().ok())?,
    ))
}

fn read_json(path: &Path) -> Option<Value> {
    serde_json::from_slice(&std::fs::read(path).ok()?).ok()
}

fn sorted_dir(dir: &Path) -> std::io::Result<Vec<std::fs::DirEntry>> {
    let mut entries: Vec<_> = std::fs::read_dir(dir)?.collect::<Result<_, _>>()?;
    // `readdir` order is the file system's; Node reads it as given. A sorted walk is the one order both agree on
    // where it matters (the rounds are keyed, the run names sorted below).
    entries.sort_by_key(std::fs::DirEntry::file_name);
    Ok(entries)
}

/// The fallback number and the attempt a round selected so far.
type Selected = Option<(u64, Option<SettledAttempt>)>;

fn read_seat_directory(unit_dir: &Path, seat_id: &str) -> std::io::Result<Vec<SeatRound>> {
    let seat_dir = unit_dir.join(seat_id);
    let unit_run_id = unit_dir
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_default();
    let mut rounds: Vec<(SeatRound, Selected)> = Vec::new();
    for entry in sorted_dir(&seat_dir)? {
        if !entry.file_type()?.is_dir() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().into_owned();
        let Some((round, fallback_no)) = parse_round_name(&name) else {
            continue;
        };
        let assignment_dir = seat_dir.join(&name);
        let runs_dir = assignment_dir.join("runs");
        let mut run_names: Vec<String> = match std::fs::read_dir(&runs_dir) {
            Ok(read) => read
                .filter_map(Result::ok)
                .map(|e| e.file_name().to_string_lossy().into_owned())
                .filter(|n| !n.is_empty() && n.bytes().all(|b| b.is_ascii_digit()))
                .collect(),
            Err(_) => Vec::new(),
        };
        run_names.sort_by(|a, b| compare_run_names(a, b));
        let settled: Vec<String> = run_names
            .into_iter()
            .filter(|n| runs_dir.join(n).join("result.json").exists())
            .collect();
        if settled.is_empty() {
            continue;
        }
        let at = match rounds.iter().position(|(r, _)| r.round == round) {
            Some(at) => at,
            None => {
                rounds.push((
                    SeatRound {
                        seat: seat_id.to_string(),
                        round,
                        attempts: Vec::new(),
                        final_attempt: None,
                    },
                    None,
                ));
                rounds.len() - 1
            }
        };
        let assignment = read_json(&assignment_dir.join("assignment.json"));
        let last = settled.last().cloned();
        for run_name in &settled {
            let attempt =
                read_json(&runs_dir.join(run_name).join("result.json")).map(|run_result| {
                    SettledAttempt {
                        assignment_id: format!("{unit_run_id}/{seat_id}/{name}"),
                        assignment: assignment.clone(),
                        fallback_no,
                        run_name: run_name.clone(),
                        outcome: outcome_of_run_result(&run_result),
                        run_result,
                    }
                });
            let (record, selected) = &mut rounds[at];
            if let Some(a) = &attempt {
                record.attempts.push(a.clone());
            }
            if Some(run_name) == last.as_ref()
                && selected.as_ref().is_none_or(|(fb, _)| fallback_no > *fb)
            {
                *selected = Some((fallback_no, attempt));
            }
        }
    }
    Ok(rounds
        .into_iter()
        .map(|(mut record, selected)| {
            record.attempts.sort_by(|a, b| {
                a.fallback_no
                    .cmp(&b.fallback_no)
                    .then_with(|| compare_run_names(&a.run_name, &b.run_name))
            });
            record.final_attempt = selected.and_then(|(_, a)| a);
            record
        })
        .collect())
}

/// Every seat round of a unit run directory with its settled attempts. A seat directory that vanishes mid-walk
/// holds nothing to read; any other failure is not "the seat never ran" and is returned.
pub fn read_unit_run_seats(unit_dir: &Path) -> std::io::Result<Vec<SeatRound>> {
    let mut seats = Vec::new();
    if !unit_dir.exists() {
        return Ok(seats);
    }
    for entry in sorted_dir(unit_dir)? {
        if !entry.file_type()?.is_dir() {
            continue;
        }
        match read_seat_directory(unit_dir, &entry.file_name().to_string_lossy()) {
            Ok(rounds) => seats.extend(rounds),
            Err(e) if is_missing(&e) => {}
            Err(e) => return Err(e),
        }
    }
    Ok(seats)
}

/// One final settled record per seat and round: `{ seat, round, outcome, runResult }`, the history vocabulary
/// of the patterns.
pub fn read_unit_run_history(unit_dir: &Path) -> std::io::Result<Vec<Value>> {
    Ok(read_unit_run_seats(unit_dir)?
        .into_iter()
        .filter_map(|r| {
            r.final_attempt.map(|f| {
                json!({ "seat": r.seat, "round": r.round, "outcome": f.outcome, "runResult": f.run_result })
            })
        })
        .collect())
}
