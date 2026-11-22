//! The one hand-off, file side, of the host's unit run: a Unit's `inputs` resolved to the paths its seats read once the run is created, and
//! the digest of the report one attempt left. Ported from the Node hand-off (`resolveUnitInputs`, `reportRefOf`,
//! `reportDigestOf`); what an input names, the refusal reasons and the copy names are `fgos-execution::handoff`'s, the seats a unit run settled are the engine history's.

use std::path::{Path, PathBuf};

use crate::confinement::cleanup::resolve_confinement_temp_root;
use crate::confinement::policy::{is_inside_root, resolve_blind_hidden_roots};
use crate::unit_run::run_unit_contract::RunUnitError;
use fgos_execution::handoff::{
    anonymous_input_name, classify_input, is_seat_input, own_previous_name, plain_input_name,
    Accept, HandoffRefError, InputRef,
};
use fgos_execution::handoff_reports::{
    accept_of, fgos_dir, refusal, report_ref_of, resolve_ref, sha256_of_file, unit_run_ref,
};
use serde_json::{json, Value};

// Where a seat's settled report lies and its digest are read in `fgos-execution`, which the Workflow asks too.
pub use fgos_execution::handoff_reports::{report_digest, report_digest_of_seat};

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
        let resolved = resolve_ref(input, main_root, &accept).map_err(refusal)?;
        if is_unit_run && anonymize_into.is_some() && !blind {
            if !sources.iter().any(|(i, _)| i == input) {
                sources.push((input.clone(), resolved));
            }
            continue;
        }
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

/// `reportRefsOf(records, { mainRoot })`: the reports of in-run seat
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

/// `copyHandoffsInto(dir, entries)`: copies of hand-off files
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
