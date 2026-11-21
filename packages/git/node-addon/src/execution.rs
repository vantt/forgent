//! The `execution` namespace: the Node door to the Execution Core helpers a layer above the Execution tier calls
//! (the Workflow, setup, the session host, the runner loop). Every entry takes one request object and answers one
//! JSON value. A refusal is a `napi::Error` whose message is the JSON of a `run-unit` error document (`tag`,
//! `errorClass`, `code`, `message`, `phase`, `fields`), which `src/native/execution-door.mjs` rethrows as the class
//! Node threw (`RunnerConfigError`, ...). What each answer means lives in `fgos-execution` (the pure rules) and
//! `fgos-execution-engine` (the reads of the disk and the machine); this file marshals.
use crate::check;
use fgos_execution::hosts::{CrateTables, CrateUnitHost, PlanChecks};
use fgos_execution::patterns::{CollaborationError, ResolveOptions as CollaborationAsk};
use fgos_execution::run_facts::Verdict;
use fgos_execution::runner_config::fgos_dir_from_root;
use fgos_execution::unit::Refusal;
use fgos_execution_engine::unit_run::machine_reads;
use fgos_execution_engine::unit_run::record_facts::{self, Removal};
use fgos_execution_engine::unit_run::run_unit_contract::{ErrorTag, RunUnitError};
use napi::{Error, Result, Status};
use napi_derive::napi;
use serde_json::{json, Map, Value};
use std::path::{Path, PathBuf};

/// The contract version `versions().execution` answers.
pub const CONTRACT_VERSION: u32 = 1;

fn refused(error: RunUnitError) -> Error {
    Error::from_reason(error.to_json().to_string())
}

fn invalid(what: &str) -> Error {
    Error::new(
        Status::InvalidArg,
        format!("execution-request-invalid: {what}"),
    )
}

/// A refusal named by its Node class: a `RunnerConfigError` keeps its tag, any other class rides along as `name`.
fn named(
    name: &str,
    message: impl Into<String>,
    code: Option<&str>,
    phase: Option<&str>,
) -> RunUnitError {
    let mut error = RunUnitError::config(message, code, phase);
    if name != "RunnerConfigError" {
        error.tag = ErrorTag::parse(name).unwrap_or(ErrorTag::Error);
        if error.tag == ErrorTag::Error {
            error.error_class = "error".into();
            error = error.with("name", json!(name));
        }
    }
    error
}

fn from_refusal(r: Refusal) -> Error {
    refused(named(
        r.name,
        r.message,
        r.code.as_deref(),
        r.phase.as_deref(),
    ))
}

fn collaboration_json(e: &CollaborationError) -> Value {
    json!({ "name": "CollaborationError", "code": e.code, "message": e.message, "detail": e.detail, "source": e.source, "path": e.path })
}

fn collaboration_refused(e: CollaborationError) -> Error {
    let mut error = named("CollaborationError", e.message.clone(), Some(&e.code), None);
    for (key, value) in [
        ("detail", json!(e.detail)),
        ("source", json!(e.source)),
        ("path", json!(e.path)),
    ] {
        error = error.with(key, value);
    }
    refused(error)
}

fn text<'a>(request: &'a Value, key: &str) -> Result<&'a str> {
    request
        .get(key)
        .and_then(Value::as_str)
        .ok_or_else(|| invalid(&format!("{key} must be a string")))
}

fn path_of(request: &Value, key: &str) -> Result<PathBuf> {
    text(request, key).map(PathBuf::from)
}

fn present<'a>(request: &'a Value, key: &str) -> Option<&'a Value> {
    request.get(key).filter(|v| !v.is_null())
}

fn fgos_dir_of(main_root: &str) -> PathBuf {
    PathBuf::from(fgos_dir_from_root(main_root))
}

// ---- the case run paths -----------------------------------------------------------------------------------

/// `isCaseId(id)`.
#[napi(namespace = "execution", js_name = "isCaseId")]
pub fn is_case_id(request: Value) -> Result<bool> {
    check()?;
    Ok(request
        .get("id")
        .and_then(Value::as_str)
        .is_some_and(fgos_execution::case_paths::is_case_id))
}

/// `runsRoot(mainRoot)`: the directory that holds every case.
#[napi(namespace = "execution", js_name = "runsRoot")]
pub fn runs_root(request: Value) -> Result<String> {
    check()?;
    let fgos = fgos_dir_of(text(&request, "mainRoot")?);
    Ok(fgos_execution::case_paths::runs_root(&fgos)
        .to_string_lossy()
        .into_owned())
}

/// `runDirOf(mainRoot, caseId)`: the directory of one case; an id that is no case id is refused `invalid-case-id`.
#[napi(namespace = "execution", js_name = "runDirOf")]
pub fn run_dir_of(request: Value) -> Result<String> {
    check()?;
    let fgos = fgos_dir_of(text(&request, "mainRoot")?);
    let case_id = request.get("caseId").cloned().unwrap_or(Value::Null);
    let shown = match &case_id {
        Value::String(s) => s.clone(),
        Value::Null => "undefined".into(),
        other => other.to_string(),
    };
    case_id
        .as_str()
        .and_then(|id| fgos_execution::case_paths::run_dir_of(&fgos, id).ok())
        .map(|dir| dir.to_string_lossy().into_owned())
        .ok_or_else(|| {
            refused(RunUnitError::config(
                format!("\"{shown}\" is not a case id (invalid-case-id)"),
                Some("invalid-case-id"),
                None,
            ))
        })
}

/// `gateAnswerFile(mainRoot, caseId, stepId)`: where the owner's answer to one gate is kept, or null.
#[napi(namespace = "execution", js_name = "gateAnswerFile")]
pub fn gate_answer_file(request: Value) -> Result<Value> {
    check()?;
    let fgos = fgos_dir_of(text(&request, "mainRoot")?);
    let (Some(case_id), Some(step_id)) = (
        request.get("caseId").and_then(Value::as_str),
        request.get("stepId").and_then(Value::as_str),
    ) else {
        return Ok(Value::Null);
    };
    Ok(
        fgos_execution::case_paths::gate_answer_file(&fgos, case_id, step_id)
            .map_or(Value::Null, |file| json!(file.to_string_lossy())),
    )
}

// ---- custody and the unit run record ----------------------------------------------------------------------

/// `custodyHeld(fgosDir, worktree)`: whether a dispatch holds custody of the worktree right now.
#[napi(namespace = "execution", js_name = "custodyHeld")]
pub fn custody_held(request: Value) -> Result<bool> {
    check()?;
    Ok(fgos_execution_engine::unit_run::custody::custody_held(
        &path_of(&request, "fgosDir")?,
        &path_of(&request, "worktree")?,
    ))
}

/// `worktreeKey(worktree)`: the identity key of a worktree, or null when it does not exist.
#[napi(namespace = "execution", js_name = "worktreeKey")]
pub fn worktree_key(request: Value) -> Result<Value> {
    check()?;
    Ok(json!(
        fgos_execution_engine::unit_run::custody::worktree_key(&path_of(&request, "worktree")?)
    ))
}

/// The name of the lock scope under which a worktree is added to or removed from a repository.
#[napi(namespace = "execution", js_name = "worktreeAdminScopeName")]
pub fn worktree_admin_scope_name() -> Result<String> {
    check()?;
    Ok(fgos_execution_engine::unit_run::custody::WORKTREE_ADMIN_SCOPE.to_string())
}

/// `unitRunFacts(fgosDir, unitRunId)`.
#[napi(namespace = "execution", js_name = "unitRunFacts")]
pub fn unit_run_facts(request: Value) -> Result<Value> {
    check()?;
    let fgos = path_of(&request, "fgosDir")?;
    let id = request
        .get("unitRunId")
        .and_then(Value::as_str)
        .unwrap_or_default();
    Ok(record_facts::unit_run_facts_at(&fgos, id).to_json())
}

struct Owner {
    fgos: PathBuf,
    unit_run_id: String,
    case_id: String,
    unless: Vec<String>,
}

fn owner_of(request: &Value) -> Result<Owner> {
    Ok(Owner {
        fgos: path_of(request, "fgosDir")?,
        unit_run_id: request
            .get("unitRunId")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string(),
        case_id: request
            .get("caseId")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string(),
        unless: request
            .get("unless")
            .and_then(Value::as_array)
            .map(|list| {
                list.iter()
                    .filter_map(Value::as_str)
                    .map(str::to_string)
                    .collect()
            })
            .unwrap_or_default(),
    })
}

/// `judgeUnitRun(fgosDir, unitRunId, { caseId, unless })`: `{ dir }`, `{ gone: true }` or `{ keep, blocks }`.
#[napi(namespace = "execution", js_name = "judgeUnitRun")]
pub fn judge_unit_run(request: Value) -> Result<Value> {
    check()?;
    let o = owner_of(&request)?;
    Ok(record_facts::judge_unit_run_at(&o.fgos, &o.unit_run_id, &o.case_id, &o.unless).to_json())
}

/// `removeUnitRun(fgosDir, unitRunId, { caseId, unless })`: `{ removed: true }`, `{ gone: true }` or `{ keep, blocks }`.
#[napi(namespace = "execution", js_name = "removeUnitRun")]
pub fn remove_unit_run(request: Value) -> Result<Value> {
    check()?;
    let o = owner_of(&request)?;
    match record_facts::remove_unit_run_at(&o.fgos, &o.unit_run_id, &o.case_id, &o.unless) {
        Ok(Removal::Removed) => Ok(json!({ "removed": true })),
        Ok(Removal::Kept(verdict @ (Verdict::Gone | Verdict::Keep { .. } | Verdict::Dir(_)))) => {
            Ok(verdict.to_json())
        }
        Err(e) => Err(refused(RunUnitError::other("error", e.to_string()))),
    }
}

/// `readStoredUnitSummary(unitDir)`: the stored summary text, or null when there is none.
#[napi(namespace = "execution", js_name = "readStoredUnitSummary")]
pub fn read_stored_unit_summary(request: Value) -> Result<Value> {
    check()?;
    record_facts::read_stored_unit_summary(&path_of(&request, "unitDir")?)
        .map(|text| json!(text))
        .map_err(|e| refused(RunUnitError::other("error", e.to_string())))
}

/// `releasedUnitRunSettle(caseId)`: the settle of a reservation whose unit run can no longer run and never reported.
#[napi(namespace = "execution", js_name = "releasedUnitRunSettle")]
pub fn released_unit_run_settle(request: Value) -> Result<Value> {
    check()?;
    Ok(fgos_execution::admission::released_unit_run_settle(text(
        &request, "caseId",
    )?))
}

// ---- the runner config ------------------------------------------------------------------------------------

/// `loadRunnerConfigForDir(dir)`: `{ config, origins, warnings }` of the project's checked runner section, or the
/// refusal (a `RunnerConfigError` with the door's code, or the class of the rule that refused with its `path`,
/// `paths` and `detail`).
#[napi(namespace = "execution", js_name = "loadRunnerConfig")]
pub fn load_runner_config(request: Value) -> Result<Value> {
    check()?;
    let dir = text(&request, "dir")?;
    let door = crate::config::runner_door_read(dir);
    match fgos_execution::runner_config::load_runner_config(dir, door) {
        Ok(loaded) => Ok(
            json!({ "config": loaded.config, "origins": loaded.origins, "warnings": loaded.warnings }),
        ),
        Err(refusal) => {
            let doc = refusal.to_json();
            let str_at = |key: &str| doc.get(key).and_then(Value::as_str);
            let mut error = named(
                str_at("name").unwrap_or("Error"),
                str_at("message").unwrap_or_default(),
                str_at("code"),
                None,
            );
            for key in ["path", "paths", "detail"] {
                if let Some(value) = present(&doc, key) {
                    error = error.with(key, value.clone());
                }
            }
            Err(refused(error))
        }
    }
}

/// `snapshotRunnerConfig(mainRoot, runnerConfig)` over a loaded config: `{ hash, runner }`.
#[napi(namespace = "execution", js_name = "snapshotRunnerConfig")]
pub fn snapshot_runner_config(request: Value) -> Result<Value> {
    check()?;
    let cfg =
        present(&request, "runnerConfig").ok_or_else(|| invalid("runnerConfig is required"))?;
    Ok(fgos_execution_engine::unit_run::start::snapshot_runner_config(cfg))
}

// ---- patterns, the unit and the plan ----------------------------------------------------------------------

/// `loopOf(name, options)`: the loop a pattern name runs, or null.
#[napi(namespace = "execution", js_name = "loopOf")]
pub fn loop_of(request: Value) -> Result<Value> {
    check()?;
    Ok(json!(fgos_execution::patterns::loop_of(
        request.get("name"),
        request.get("options")
    )))
}

/// `resolveCollaboration({ unit, selectors, request, inCase, reason, runnerConfig, shipped, origins })`.
#[napi(namespace = "execution", js_name = "resolveCollaboration")]
pub fn resolve_collaboration(request: Value) -> Result<Value> {
    check()?;
    let reason = present(&request, "reason").map(|r| match r {
        Value::String(s) => s.clone(),
        other => other.to_string(),
    });
    let ask = CollaborationAsk {
        unit: present(&request, "unit"),
        selectors: present(&request, "selectors"),
        request: present(&request, "request"),
        in_case: request.get("inCase") == Some(&Value::Bool(true)),
        reason: reason.as_deref(),
        runner_config: present(&request, "runnerConfig"),
        shipped: present(&request, "shipped"),
        origins: present(&request, "origins"),
    };
    fgos_execution::patterns::resolve_collaboration(
        &ask,
        &CrateTables,
        &fgos_execution::hosts::CrateSeating,
    )
    .map(|c| c.to_json())
    .map_err(|failure| match failure {
        fgos_execution::patterns::CollaborationFailure::Collaboration(e) => {
            collaboration_refused(e)
        }
        fgos_execution::patterns::CollaborationFailure::Seat(e) => {
            refused(named("RunnerConfigError", e.message, Some(&e.code), None))
        }
    })
}

/// `checkCatalog({ shipped, effective, origins, throwOnError })`: `{ entries, merged, problems }`.
#[napi(namespace = "execution", js_name = "checkCatalog")]
pub fn check_catalog(request: Value) -> Result<Value> {
    check()?;
    let throw_on_error = request.get("throwOnError") == Some(&Value::Bool(true));
    let checked = fgos_execution::patterns::catalog_entries::check_catalog(
        present(&request, "shipped"),
        present(&request, "effective"),
        present(&request, "origins"),
        throw_on_error,
        &CrateTables,
    )
    .map_err(collaboration_refused)?;
    let entries = Value::Object(checked.entries);
    let problems: Vec<Value> = checked.problems.iter().map(collaboration_json).collect();
    Ok(json!({ "entries": entries, "merged": entries, "problems": problems }))
}

/// `deepEqual(a, b)`: structural equality as the catalog compares entries.
#[napi(namespace = "execution", js_name = "deepEqual")]
pub fn deep_equal(request: Value) -> Result<bool> {
    check()?;
    let null = Value::Null;
    Ok(fgos_execution::patterns::catalog_entries::deep_equal(
        request.get("a").unwrap_or(&null),
        request.get("b").unwrap_or(&null),
    ))
}

/// `validateUnit(raw)`: the normalized unit, or the refusal that names what is wrong with it.
#[napi(namespace = "execution", js_name = "validateUnit")]
pub fn validate_unit(request: Value) -> Result<Value> {
    check()?;
    let raw = request.get("unit").cloned().unwrap_or(Value::Null);
    fgos_execution::unit::validate_unit(&raw, &CrateUnitHost)
        .map(|unit| unit.to_json())
        .map_err(from_refusal)
}

/// `normalizeStanceOptions(value)`.
#[napi(namespace = "execution", js_name = "normalizeStanceOptions")]
pub fn normalize_stance_options(request: Value) -> Result<Value> {
    check()?;
    fgos_execution::unit::normalize_stance_options(present(&request, "value"))
        .map(|options| json!(options))
        .map_err(from_refusal)
}

/// `foldRunSetting(overrides, key, value)`.
#[napi(namespace = "execution", js_name = "foldRunSetting")]
pub fn fold_run_setting(request: Value) -> Result<Value> {
    check()?;
    let overrides: Vec<Value> = request
        .get("overrides")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let null = Value::Null;
    Ok(json!(fgos_execution::run_request::fold_run_setting(
        &overrides,
        text(&request, "key")?,
        request.get("value").unwrap_or(&null),
    )))
}

fn plan_checks() -> PlanChecks<'static> {
    PlanChecks {
        is_plan_directory: &machine_reads::is_plan_directory,
    }
}

/// `existingPlanRef(value, mainRoot)`: the plan reference a unit file names, checked as `--plan` is; null for none.
#[napi(namespace = "execution", js_name = "existingPlanRef")]
pub fn existing_plan_ref(request: Value) -> Result<Value> {
    check()?;
    let Some(plan) = present(&request, "value") else {
        return Ok(Value::Null);
    };
    fgos_execution::run_request::existing_plan_ref(
        plan,
        text(&request, "mainRoot")?,
        &plan_checks(),
    )
    .map(|plan| plan.map_or(Value::Null, |p| p.to_json()))
    .map_err(from_refusal)
}

/// `planFromFlags({ plan, phase }, mainRoot)`: the plan reference the flags name, or null.
#[napi(namespace = "execution", js_name = "planFromFlags")]
pub fn plan_from_flags(request: Value) -> Result<Value> {
    check()?;
    let flags: Map<String, Value> = request
        .get("flags")
        .and_then(Value::as_object)
        .map(|f| {
            f.iter()
                .filter(|(_, v)| !v.is_null())
                .map(|(k, v)| (k.clone(), v.clone()))
                .collect()
        })
        .unwrap_or_default();
    fgos_execution::run_request::plan_from_flags(
        &flags,
        text(&request, "mainRoot")?,
        &plan_checks(),
    )
    .map(|plan| plan.map_or(Value::Null, |p| p.to_json()))
    .map_err(from_refusal)
}

/// `parseAccountPin(value)`: `{ pool, id }`, or `{ refused: { reason, detail } }`.
#[napi(namespace = "execution", js_name = "parseAccountPin")]
pub fn parse_account_pin(request: Value) -> Result<Value> {
    check()?;
    // A value that is not text reads as the empty pin, named in the refusal as Node printed it.
    let value = request.get("value");
    let given = value.and_then(Value::as_str).unwrap_or_default();
    Ok(
        match fgos_execution_engine::accounts::pin::parse_account_pin(given) {
            Ok(pin) => json!({ "pool": pin.pool, "id": pin.id }),
            Err(refusal) => {
                let detail = match value {
                Some(Value::String(_)) => refusal.detail,
                other => format!(
                    "a pinned account must be written pool/account (for example openai/work), got {}",
                    other.map_or("undefined".into(), Value::to_string)
                ),
            };
                json!({ "refused": { "reason": refusal.reason, "detail": detail } })
            }
        },
    )
}

// ---- hand-offs --------------------------------------------------------------------------------------------

/// The names an own-seat hand-off is written with: `{ seatPlaceholder, ownPreviousName }`.
#[napi(namespace = "execution", js_name = "handoffNames")]
pub fn handoff_names() -> Result<Value> {
    check()?;
    Ok(json!({
        "seatPlaceholder": fgos_execution::handoff::SEAT_PLACEHOLDER,
        "ownPreviousName": fgos_execution::handoff::OWN_PREVIOUS_NAME,
    }))
}

/// `anonymousInputName(index)`: `seat-A` ... `seat-Z`, `seat-AA`, ...
#[napi(namespace = "execution", js_name = "anonymousInputName")]
pub fn anonymous_input_name(request: Value) -> Result<String> {
    check()?;
    let index = request
        .get("index")
        .and_then(Value::as_u64)
        .ok_or_else(|| invalid("index must be a count"))?;
    Ok(fgos_execution::handoff::anonymous_input_name(
        index as usize,
    ))
}

/// `reportDigest(unitRunId, seat, mainRoot)`: `{ path, bytes, sha256 }` of the report one seat of a unit run left.
#[napi(namespace = "execution", js_name = "reportDigest")]
pub fn report_digest(request: Value) -> Result<Value> {
    check()?;
    fgos_execution_engine::unit_run::handoff::report_digest_of_seat(
        text(&request, "unitRunId")?,
        text(&request, "seat")?,
        Path::new(text(&request, "mainRoot")?),
    )
    .map_err(refused)
}

/// `resolveUnitInputs(inputs, mainRoot, options)`: `{ refs, inputMap }` as a unit run records them.
#[napi(namespace = "execution", js_name = "resolveUnitInputs")]
pub fn resolve_unit_inputs(request: Value) -> Result<Value> {
    check()?;
    let empty = json!({});
    fgos_execution_engine::unit_run::handoff::resolve_inputs(
        request.get("inputs").unwrap_or(&Value::Null),
        Path::new(text(&request, "mainRoot")?),
        present(&request, "options").unwrap_or(&empty),
    )
    .map_err(refused)
}

// ---- the machine ------------------------------------------------------------------------------------------

/// `detectHerdrPresent()`: whether this process runs inside a live herdr session.
#[napi(namespace = "execution", js_name = "detectHerdrPresent")]
pub fn herdr_present() -> Result<bool> {
    check()?;
    Ok(machine_reads::herdr_present())
}

/// `requestCancel(runDir, signal)`: publish the cancel request of one attempt; true when one is on disk afterwards.
#[napi(namespace = "execution", js_name = "requestCancel")]
pub fn request_cancel(request: Value) -> Result<bool> {
    check()?;
    Ok(fgos_run_supervisor::controller::cancel::request_cancel(
        &path_of(&request, "runDir")?,
        text(&request, "signal")?,
    ))
}

/// `sweepAttempts({ assignmentsRoot })`: `{ adopt, adoptError }`, what adopt judged of the attempts a dead
/// supervisor left.
#[napi(namespace = "execution", js_name = "sweepAttempts")]
pub fn sweep_attempts(request: Value) -> Result<Value> {
    check()?;
    let swept = machine_reads::sweep_attempts(&path_of(&request, "assignmentsRoot")?);
    let adopt = swept.adopt.map(|verdicts| {
        verdicts
            .iter()
            .map(|(dir, verdict)| verdict.line(dir))
            .collect::<Vec<_>>()
    });
    Ok(json!({ "adopt": adopt, "adoptError": swept.adopt_error }))
}
