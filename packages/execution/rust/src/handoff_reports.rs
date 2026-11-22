//! The reports a unit run's seats left, file side: where a seat's latest settled report lies (only while it keeps
//! the bytes settlement recorded, unless the caller accepts the revision) and its digest. The engine's hand-off
//! and the Workflow both ask here. The rules are `handoff`'s (pure); this module reads the files.
// A refusal is the `run-unit` error document every caller rethrows as it stands.
#![allow(clippy::result_large_err)]

use std::path::{Path, PathBuf};

use serde_json::{json, Value};

use crate::handoff::{
    classify_input, gate_answer_path, report_ref_of_record, settled_report_stands, unit_run_dir,
    unit_run_ref_refusal, Accept, HandoffRefError, InputRef, ReportRef,
};
use crate::run_unit_contract::RunUnitError;
use crate::unit_history::read_seat_directory;

/// The `.fgos` directory of the project at `main_root`.
pub fn fgos_dir(main_root: &Path) -> PathBuf {
    PathBuf::from(crate::runner_config::fgos_dir_from_root(
        &main_root.to_string_lossy(),
    ))
}

/// A `HandoffRefError`: a `RunnerConfigError` carrying its `reason`.
pub fn refusal(error: HandoffRefError) -> RunUnitError {
    let reason = error.reason.clone();
    RunUnitError::config(error.to_string(), None, None).with("reason", json!(reason))
}

pub fn sha256_of_file(file: &Path) -> std::io::Result<String> {
    std::fs::read(file).map(|bytes| crate::handoff::sha256_hex(&bytes))
}

/// `acceptsBytes`' authority as the caller states it: `'any'`, or the digests of the revisions it stands behind.
pub fn accept_of(value: Option<&Value>) -> Accept {
    match value {
        Some(Value::String(s)) if s == "any" => Accept::Any,
        Some(Value::Array(list)) => Accept::Digests(
            list.iter()
                .filter_map(Value::as_str)
                .map(str::to_string)
                .collect(),
        ),
        _ => Accept::Nothing,
    }
}

/// `path.resolve(base, relative)`: `relative` against `base` (an absolute `relative` is itself), with `.` and `..`
/// folded away lexically, never through the disk.
fn resolved(base: &Path, relative: &str) -> PathBuf {
    let mut out = PathBuf::new();
    for part in base.join(relative).components() {
        match part {
            std::path::Component::CurDir => {}
            std::path::Component::ParentDir => {
                out.pop();
            }
            other => out.push(other),
        }
    }
    out
}

/// `reportRefOf(record, { mainRoot, accept })`: the absolute path of the account one seat result left, its settled
/// report only while it still has the bytes settlement recorded (or the caller accepts the revision).
pub fn report_ref_of(
    record: &Value,
    main_root: &Path,
    accept: &Accept,
) -> Result<PathBuf, HandoffRefError> {
    match report_ref_of_record(record)? {
        ReportRef::Settled { path, sha256 } => {
            let file = resolved(main_root, &path);
            let actual = sha256_of_file(&file).ok();
            settled_report_stands(record, sha256.as_deref(), actual.as_deref(), accept)?;
            Ok(file)
        }
        ReportRef::Artifact(artifact) => Ok(resolved(main_root, &artifact)),
    }
}

/// `resolveUnitRunRef`: the report the named (or the receiving) seat of another unit run left in its latest round.
pub fn unit_run_ref(
    input: &str,
    main_root: &Path,
    seat: Option<&str>,
    accept: &Accept,
) -> Result<PathBuf, HandoffRefError> {
    // An own-seat input (`unit-run:<id>/{seat}`) names the run the same way; the seat is the receiving one.
    let (unit_run_id, named) = match classify_input(input) {
        InputRef::UnitRun { unit_run_id, seat } => (unit_run_id, seat),
        InputRef::OwnSeat => {
            let rest = input.strip_prefix("unit-run:").unwrap_or_default();
            (rest.split('/').next().unwrap_or_default().to_string(), None)
        }
        _ => return Err(unit_run_ref_refusal(input, "no-such-run", seat.is_some())),
    };
    let own = seat.is_some();
    let fail = |reason: &str| unit_run_ref_refusal(input, reason, own);
    let wanted = seat.map(str::to_string).or(named).unwrap_or_default();
    let seat_rule = fgos_convention::rules::packaged_rules().identifier("seat-id");
    if seat_rule.is_some_and(|rule| rule.check(&wanted) == Err("invalid-identifier")) {
        return Err(fail("no-such-role"));
    }
    let assignments = fgos_dir(main_root).join("assignments");
    let Some(unit_dir) = unit_run_dir(&assignments, &unit_run_id).filter(|d| d.exists()) else {
        return Err(fail("no-such-run"));
    };
    let rounds = match read_seat_directory(&unit_dir, &wanted) {
        Ok(rounds) => rounds,
        Err(e)
            if matches!(
                e.kind(),
                std::io::ErrorKind::NotFound | std::io::ErrorKind::NotADirectory
            ) =>
        {
            Vec::new()
        }
        Err(e) => return Err(HandoffRefError::new(input, format!("unreadable: {e}"))),
    };
    let latest = rounds
        .into_iter()
        .filter_map(|r| r.final_attempt.map(|f| (r.round, r.seat, f)))
        .reduce(|a, b| if b.0 > a.0 { b } else { a });
    let Some((round, seat_id, final_attempt)) = latest else {
        return Err(fail("no-such-role"));
    };
    let record = json!({ "seat": seat_id, "round": round, "outcome": final_attempt.outcome, "runResult": final_attempt.run_result });
    report_ref_of(&record, main_root, accept).map_err(|e| fail(&e.reason))
}

/// `reportDigestOf(record, mainRoot)`: `{ path, bytes, sha256 }` of the report one attempt record left, or `null`
/// when it left none or it cannot be read.
pub fn report_digest(result: &Value, main_root: &Path) -> Value {
    let Ok(file) = report_ref_of(result, main_root, &Accept::Any) else {
        return Value::Null;
    };
    match std::fs::read(&file) {
        Ok(bytes) => json!({
            "path": file,
            "bytes": bytes.len(),
            "sha256": crate::handoff::sha256_hex(&bytes),
        }),
        Err(_) => Value::Null,
    }
}

/// `reportDigest(unitRunId, seat, mainRoot)`: `{ path, bytes, sha256 }` of the report `seat` of another unit run
/// left in its latest round, as its bytes lie now; a report that cannot be resolved or read is refused.
pub fn report_digest_of_seat(
    unit_run_id: &str,
    seat: &str,
    main_root: &Path,
) -> Result<Value, RunUnitError> {
    let subject = format!("unit-run:{unit_run_id}/{seat}");
    let file = unit_run_ref(&subject, main_root, None, &Accept::Any).map_err(refusal)?;
    let bytes = std::fs::read(&file)
        .map_err(|e| refusal(HandoffRefError::new(&subject, format!("unreadable: {e}"))))?;
    Ok(json!({
        "path": file,
        "bytes": bytes.len(),
        "sha256": crate::handoff::sha256_hex(&bytes),
    }))
}

/// The path one input names: a `unit-run:` input the report it hands over (under `accept`), a `gate-answer:` input
/// the owner's answer file (refused `no-such-answer` when none was recorded), any other input itself.
pub fn resolve_ref(
    input: &str,
    main_root: &Path,
    accept: &Accept,
) -> Result<PathBuf, HandoffRefError> {
    match classify_input(input) {
        InputRef::UnitRun { .. } => unit_run_ref(input, main_root, None, accept),
        // The answer must have been recorded: a path to no file is no answer.
        InputRef::GateAnswer { .. } => {
            gate_answer_path(input, &fgos_dir(main_root)).and_then(|file| {
                if file.exists() {
                    Ok(file)
                } else {
                    Err(HandoffRefError::new(input, "no-such-answer"))
                }
            })
        }
        _ => Ok(PathBuf::from(input)),
    }
}
