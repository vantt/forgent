//! The one hand-off, file side, of the host's unit run: a Unit's `inputs` resolved to the paths its seats read once the run is created, and
//! the digest of the report one attempt left. Ported from `resolveUnitInputs`, `reportRefOf` and `reportDigestOf`
//! (`src/runner/execution/handoff-refs.mjs:59,140,203`); what an input names, the refusal reasons and the copy names
//! are `fgos-execution::handoff`'s, the seats a unit run settled are the engine history's.

use std::path::{Path, PathBuf};

use crate::confinement::cleanup::resolve_confinement_temp_root;
use crate::confinement::policy::{is_inside_root, resolve_blind_hidden_roots};
use crate::unit_run::history::read_seat_directory;
use crate::unit_run::run_unit_contract::RunUnitError;
use fgos_execution::handoff::{
    anonymous_input_name, classify_input, gate_answer_path, is_seat_input, own_previous_name,
    plain_input_name, report_ref_of_record, settled_report_stands, unit_run_dir,
    unit_run_ref_refusal, Accept, HandoffRefError, InputRef, ReportRef,
};
use serde_json::{json, Value};

/// The `.fgos` directory of the project at `main_root`.
fn fgos_dir(main_root: &Path) -> PathBuf {
    PathBuf::from(fgos_execution::runner_config::fgos_dir_from_root(
        &main_root.to_string_lossy(),
    ))
}

/// A `HandoffRefError`: a `RunnerConfigError` carrying its `reason`.
fn refusal(error: HandoffRefError) -> RunUnitError {
    let reason = error.reason.clone();
    RunUnitError::config(error.to_string(), None, None).with("reason", json!(reason))
}

fn sha256_of_file(file: &Path) -> std::io::Result<String> {
    std::fs::read(file).map(|bytes| fgos_execution::handoff::sha256_hex(&bytes))
}

/// `acceptsBytes`' authority as the caller states it: `'any'`, or the digests of the revisions it stands behind.
fn accept_of(value: Option<&Value>) -> Accept {
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

/// `reportRefOf(record, { mainRoot, accept })`: the absolute path of the account one seat result left, its settled
/// report only while it still has the bytes settlement recorded (or the caller accepts the revision).
fn report_ref_of(
    record: &Value,
    main_root: &Path,
    accept: &Accept,
) -> Result<PathBuf, HandoffRefError> {
    match report_ref_of_record(record)? {
        ReportRef::Settled { path, sha256 } => {
            let file = main_root.join(path);
            let actual = sha256_of_file(&file).ok();
            settled_report_stands(record, sha256.as_deref(), actual.as_deref(), accept)?;
            Ok(file)
        }
        ReportRef::Artifact(artifact) => Ok(main_root.join(artifact)),
    }
}

/// `resolveUnitRunRef`: the report the named (or the receiving) seat of another unit run left in its latest round.
fn unit_run_ref(
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

/// `/^[a-z][a-z0-9+.-]*:/i`: a URL-like ref, never a path that could lie inside a hidden root.
fn has_scheme(text: &str) -> bool {
    let Some((scheme, _)) = text.split_once(':') else {
        return false;
    };
    let mut chars = scheme.chars();
    chars.next().is_some_and(|c| c.is_ascii_alphabetic())
        && chars.all(|c| c.is_ascii_alphanumeric() || matches!(c, '+' | '.' | '-'))
}

fn extension_of(path: &Path) -> String {
    path.extension()
        .map(|e| format!(".{}", e.to_string_lossy()))
        .unwrap_or_default()
}

fn copy_digest_of(subject: &str, source: &Path) -> Result<String, HandoffRefError> {
    sha256_of_file(source).map_err(|e| HandoffRefError::new(subject, format!("copy-failed: {e}")))
}

/// `resolveUnitInputs(inputs, mainRoot, { anonymizeInto, blind, anonymize, seat, accept })`: `{ refs, inputMap }`
/// as the run records them (see the Node doc for each option).
pub fn resolve_inputs(
    inputs: &Value,
    main_root: &Path,
    ask: &Value,
) -> Result<Value, RunUnitError> {
    let list: Vec<String> = inputs
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(Value::as_str)
        .map(str::to_string)
        .collect();
    let accept = accept_of(ask.get("accept"));
    if let Some(seat) = ask.get("seat").and_then(Value::as_str) {
        return seat_inputs(&list, main_root, seat, &accept).map_err(refusal);
    }
    let blind = ask.get("blind") == Some(&Value::Bool(true));
    let anonymize = ask.get("anonymize") == Some(&Value::Bool(true));
    let anonymize_into = ask
        .get("anonymizeInto")
        .and_then(Value::as_str)
        .map(PathBuf::from);
    let fgos = fgos_dir(main_root);
    let hidden = if blind {
        let temp = resolve_confinement_temp_root(&std::env::temp_dir());
        resolve_blind_hidden_roots(&fgos.to_string_lossy(), &temp.to_string_lossy())
            .map_err(|e| RunUnitError::config(e.to_string(), None, None))?
    } else {
        Vec::new()
    };
    let mut refs: Vec<String> = Vec::new();
    let mut sources: Vec<(String, PathBuf)> = Vec::new();
    let mut copies: Vec<(String, PathBuf, bool)> = Vec::new();
    for input in list.iter().filter(|i| !is_seat_input(i)) {
        let kind = classify_input(input);
        let is_unit_run = matches!(kind, InputRef::UnitRun { .. });
        let resolved: PathBuf = match kind {
            InputRef::UnitRun { .. } => {
                let path = unit_run_ref(input, main_root, None, &accept).map_err(refusal)?;
                if anonymize_into.is_some() && !blind {
                    if !sources.iter().any(|(i, _)| i == input) {
                        sources.push((input.clone(), path));
                    }
                    continue;
                }
                path
            }
            InputRef::GateAnswer { .. } => gate_answer_path(input, &fgos).map_err(refusal)?,
            _ => PathBuf::from(input),
        };
        let changed = resolved != Path::new(input);
        if blind {
            let absolute = main_root.join(&resolved);
            let real = std::fs::canonicalize(&absolute).unwrap_or_else(|_| absolute.clone());
            let inside = !has_scheme(&resolved.to_string_lossy())
                && hidden
                    .iter()
                    .any(|root| is_inside_root(&real.to_string_lossy(), root));
            if changed || inside {
                if !copies.iter().any(|(i, _, _)| i == input) {
                    copies.push((input.clone(), absolute, is_unit_run));
                }
                continue;
            }
        }
        let text = resolved.to_string_lossy().into_owned();
        if !refs.contains(&text) {
            refs.push(text);
        }
    }
    let mut input_map: Vec<Value> = Vec::new();
    let mut anonymized = 0;
    for (index, (input, source, is_unit_run)) in copies.iter().enumerate() {
        let sha256 = copy_digest_of(input, source).map_err(refusal)?;
        let base = if anonymize && *is_unit_run {
            anonymized += 1;
            anonymous_input_name(anonymized - 1)
        } else {
            plain_input_name(index, source, &fgos)
        };
        input_map.push(json!({ "name": format!("{base}{}", extension_of(source)), "input": input, "source": source, "sha256": sha256 }));
    }
    if let (false, Some(into)) = (sources.is_empty(), anonymize_into) {
        let mut copy = || -> std::io::Result<()> {
            std::fs::create_dir_all(&into)?;
            for (index, (input, source)) in sources.iter().enumerate() {
                let name = format!("{}{}", anonymous_input_name(index), extension_of(source));
                std::fs::copy(source, into.join(&name))?;
                input_map.push(json!({ "name": name, "input": input, "source": source }));
                refs.push(into.join(&name).to_string_lossy().into_owned());
            }
            Ok(())
        };
        copy().map_err(|e| {
            refusal(HandoffRefError::new(
                "anonymized inputs",
                format!("copy-failed: {e}"),
            ))
        })?;
    }
    Ok(json!({ "refs": refs, "inputMap": input_map }))
}

/// `resolveSeatInputs`: each `unit-run:<id>/{seat}` input resolved to the report the receiving seat left there.
fn seat_inputs(
    inputs: &[String],
    main_root: &Path,
    seat: &str,
    accept: &Accept,
) -> Result<Value, HandoffRefError> {
    let mut input_map: Vec<Value> = Vec::new();
    for input in inputs.iter().filter(|i| is_seat_input(i)) {
        if input_map.iter().any(|e| e["input"] == json!(input)) {
            continue;
        }
        let source = unit_run_ref(input, main_root, Some(seat), accept)?;
        let sha256 = copy_digest_of(input, &source)?;
        let name = own_previous_name(input_map.len(), &extension_of(&source));
        input_map.push(json!({ "name": name, "input": input, "source": source, "sha256": sha256 }));
    }
    Ok(json!({ "refs": [], "inputMap": input_map }))
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
            "sha256": fgos_execution::handoff::sha256_hex(&bytes),
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
        "sha256": fgos_execution::handoff::sha256_hex(&bytes),
    }))
}

/// `reportRefsOf(records, { mainRoot })` (`src/runner/execution/handoff-refs.mjs:78`): the reports of in-run seat
/// results, in input order, each listed once.
pub fn report_refs_of(records: &[Value], main_root: &Path) -> Result<Vec<String>, RunUnitError> {
    let mut refs: Vec<String> = Vec::new();
    for record in records {
        let path = report_ref_of(record, main_root, &Accept::Nothing).map_err(refusal)?;
        let text = path.to_string_lossy().into_owned();
        if !refs.contains(&text) {
            refs.push(text);
        }
    }
    Ok(refs)
}

/// `copyHandoffsInto(dir, entries)` (`src/runner/execution/handoff-refs.mjs:265`): copies of hand-off files
/// (`{ name, source, sha256? }`) as `<dir>/inputs/<name>`, paths in entry order. A source whose bytes changed from
/// `sha256` is refused; a copy already in place with those bytes is kept, so a resume reads the same files.
pub fn copy_handoffs_into(dir: &Path, entries: &[Value]) -> Result<Vec<String>, RunUnitError> {
    let target = dir.join("inputs");
    let mut copies = Vec::new();
    for entry in entries {
        let text = |key: &str| entry.get(key).and_then(Value::as_str).unwrap_or_default();
        let (name, source) = (text("name"), PathBuf::from(text("source")));
        let sha256 = entry.get("sha256").and_then(Value::as_str);
        let dest = target.join(name);
        let failed =
            |e: std::io::Error| refusal(HandoffRefError::new(name, format!("copy-failed: {e}")));
        std::fs::create_dir_all(&target).map_err(failed)?;
        let in_place = sha256.is_some() && sha256_of_file(&dest).ok().as_deref() == sha256;
        if !in_place {
            let bytes = std::fs::read(&source).map_err(failed)?;
            if sha256.is_some_and(|want| fgos_execution::handoff::sha256_hex(&bytes) != want) {
                return Err(refusal(HandoffRefError::new(
                    name,
                    "report-changed-after-settle",
                )));
            }
            std::fs::write(&dest, bytes).map_err(failed)?;
        }
        copies.push(dest.to_string_lossy().into_owned());
    }
    Ok(copies)
}

/// `refIsHiddenFromBlind(ref, mainRoot)`: whether `reference` lies inside a root `hostRead: blind` hides.
pub fn hidden_from_blind(reference: &str, main_root: &Path) -> bool {
    if has_scheme(reference) {
        return false;
    }
    let absolute = main_root.join(reference);
    let real = std::fs::canonicalize(&absolute).unwrap_or(absolute);
    let temp = resolve_confinement_temp_root(&std::env::temp_dir());
    resolve_blind_hidden_roots(
        &fgos_dir(main_root).to_string_lossy(),
        &temp.to_string_lossy(),
    )
    .unwrap_or_default()
    .iter()
    .any(|root| is_inside_root(&real.to_string_lossy(), root))
}

/// `plainInputName` over this module's `.fgos`, for a copy the run names.
pub fn plain_name(index: usize, source: &Path, main_root: &Path) -> String {
    format!(
        "{}{}",
        plain_input_name(index, source, &fgos_dir(main_root)),
        extension_of(source)
    )
}
