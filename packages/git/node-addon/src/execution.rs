//! The `execution` namespace: the Node door to the Execution Core helpers a layer above the Execution tier calls
//! (the Workflow, setup, the session host, the runner loop). Every entry takes one request object and answers one
//! JSON value. A refusal is a `napi::Error` whose message is the JSON of a `run-unit` error document (`tag`,
//! `errorClass`, `code`, `message`, `phase`, `fields`), which `src/native/execution-door.mjs` rethrows as the class
//! Node threw (`RunnerConfigError`, ...). What each answer means lives in `fgos-execution` (the pure rules and the
//! unit-run reads of the disk, over the run supervisor's `lease` part); this file marshals. The addon never links
//! `fgos-execution-engine` (its supervisor, terminal and secret stores stay out of the Node process).
use crate::check;
use fgos_execution::hosts::{CrateTables, CrateUnitHost, PlanChecks};
use fgos_execution::machine_reads;
use fgos_execution::patterns::{CollaborationError, ResolveOptions as CollaborationAsk};
use fgos_execution::record_facts::{self, Removal};
use fgos_execution::run_facts::Verdict;
use fgos_execution::run_unit_contract::{ErrorTag, RunUnitError};
use fgos_execution::runner_config::fgos_dir_from_root;
use fgos_execution::unit::Refusal;
use napi::{Error, Result, Status};
use napi_derive::napi;
use serde_json::{json, Map, Value};
use std::path::PathBuf;

/// The contract version `versions().execution` answers: 1 is the first with the Execution Core helpers, 2 the first
/// with the outcome, seat, run result, hand-off and Work reads.
pub const CONTRACT_VERSION: u32 = 2;

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
    Ok(fgos_execution::custody::custody_held(
        &path_of(&request, "fgosDir")?,
        &path_of(&request, "worktree")?,
    ))
}

/// `worktreeKey(worktree)`: the identity key of a worktree, or null when it does not exist.
#[napi(namespace = "execution", js_name = "worktreeKey")]
pub fn worktree_key(request: Value) -> Result<Value> {
    check()?;
    Ok(json!(fgos_execution::custody::worktree_key(&path_of(
        &request, "worktree"
    )?)))
}

/// The name of the lock scope under which a worktree is added to or removed from a repository.
#[napi(namespace = "execution", js_name = "worktreeAdminScopeName")]
pub fn worktree_admin_scope_name() -> Result<String> {
    check()?;
    Ok(fgos_execution::custody::WORKTREE_ADMIN_SCOPE.to_string())
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
    Ok(fgos_execution::runner_config::snapshot_runner_config(cfg))
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
        match fgos_execution::account_pin::parse_account_pin(given) {
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

// ---- the machine ------------------------------------------------------------------------------------------

/// `detectHerdrPresent()`: whether this process runs inside a live herdr session.
#[napi(namespace = "execution", js_name = "detectHerdrPresent")]
pub fn herdr_present() -> Result<bool> {
    check()?;
    Ok(machine_reads::herdr_present())
}

// ---- outcomes, seats and the loop checks ------------------------------------------------------------------

/// The named values a caller above the tier compares with: `{ NOT_STARTED_OUTCOME, RESERVED_PATTERN_NAMES,
/// SEAT_BINDING_MARKER_PATH, MODEL_POLICY_TIERS, CASE_ID_ENV, CASE_RESERVATION_ENV, SEAT_PLACEHOLDER,
/// OWN_PREVIOUS_NAME }`.
#[napi(namespace = "execution", js_name = "vocabulary")]
pub fn vocabulary() -> Result<Value> {
    check()?;
    Ok(json!({
        "NOT_STARTED_OUTCOME": fgos_execution::outcome::NOT_STARTED_OUTCOME,
        "RESERVED_PATTERN_NAMES": fgos_execution::patterns::RESERVED_PATTERN_NAMES,
        "SEAT_BINDING_MARKER_PATH": fgos_execution::patterns::SEAT_BINDING_MARKER_PATH,
        "MODEL_POLICY_TIERS": fgos_execution::hosts::tiers(),
        "CASE_ID_ENV": fgos_execution::dispatch_env::CASE_ID_ENV,
        "CASE_RESERVATION_ENV": fgos_execution::dispatch_env::CASE_RESERVATION_ENV,
        "SEAT_PLACEHOLDER": fgos_execution::handoff::SEAT_PLACEHOLDER,
        "OWN_PREVIOUS_NAME": fgos_execution::handoff::OWN_PREVIOUS_NAME,
    }))
}

/// `currentDispatchDepth()`: how deep in a chain of dispatches this process runs (`FGOS_DISPATCH_DEPTH`, else 0).
#[napi(namespace = "execution", js_name = "currentDispatchDepth")]
pub fn current_dispatch_depth() -> Result<f64> {
    check()?;
    Ok(fgos_execution::dispatch_env::current_dispatch_depth())
}

fn outcome_text(request: &Value) -> &str {
    request
        .get("outcome")
        .and_then(Value::as_str)
        .unwrap_or_default()
}

/// `isVerdict(outcome)`: whether the outcome is a completed judgment of the work.
#[napi(namespace = "execution", js_name = "isVerdict")]
pub fn is_verdict(request: Value) -> Result<bool> {
    check()?;
    Ok(fgos_execution::outcome::is_verdict(outcome_text(&request)))
}

/// `exitCodeForOutcome(outcome)`: the process exit code of an execution outcome (1 for a value that is no text).
#[napi(namespace = "execution", js_name = "exitCodeForOutcome")]
pub fn exit_code_for_outcome(request: Value) -> Result<i32> {
    check()?;
    Ok(match request.get("outcome").and_then(Value::as_str) {
        Some(outcome) => fgos_execution::outcome::exit_code_for_outcome(outcome),
        None => 1,
    })
}

/// `infrastructure(unitResult)`: whether a unit ended on infrastructure, so a rerun can still produce the verdict.
#[napi(namespace = "execution", js_name = "infrastructure")]
pub fn infrastructure(request: Value) -> Result<bool> {
    check()?;
    let null = Value::Null;
    Ok(fgos_execution::outcome::infrastructure(
        request.get("unitResult").unwrap_or(&null),
    ))
}

/// `evaluationsOf(results)`: one entry per evaluator result that reached a verdict.
#[napi(namespace = "execution", js_name = "evaluationsOf")]
pub fn evaluations_of(request: Value) -> Result<Value> {
    check()?;
    let results = request
        .get("results")
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .unwrap_or_default();
    Ok(json!(fgos_execution::outcome::evaluations_of(results)))
}

/// `seatKeyOf(result)`: the seat a recorded result belongs to (`seat`, or the legacy `role`), or null.
#[napi(namespace = "execution", js_name = "seatKeyOf")]
pub fn seat_key_of(request: Value) -> Result<Value> {
    check()?;
    let null = Value::Null;
    Ok(
        fgos_execution::seat_resolver::seat_key_of(request.get("result").unwrap_or(&null))
            .cloned()
            .unwrap_or(Value::Null),
    )
}

/// `legacyFamilyOf(result)`: the provider family an old result recorded, or null.
#[napi(namespace = "execution", js_name = "legacyFamilyOf")]
pub fn legacy_family_of(request: Value) -> Result<Value> {
    check()?;
    let null = Value::Null;
    Ok(
        fgos_execution::seat_resolver::legacy_family_of(request.get("result").unwrap_or(&null))
            .cloned()
            .unwrap_or(Value::Null),
    )
}

fn seat_refused(e: fgos_execution::seat_resolver::SeatResolutionError) -> Error {
    let mut error = named(e.class, e.message, Some(&e.code), None);
    for (key, value) in [("at", e.at), ("detail", e.detail)] {
        if let Some(value) = value {
            error = error.with(key, json!(value));
        }
    }
    refused(error)
}

/// `checkDeclaredSeats(raw, label, { tiers })`: the declared seats as plain entries, or the refusal.
#[napi(namespace = "execution", js_name = "checkDeclaredSeats")]
pub fn check_declared_seats(request: Value) -> Result<Value> {
    check()?;
    let null = Value::Null;
    let tiers: Option<Vec<String>> = request.get("tiers").and_then(Value::as_array).map(|list| {
        list.iter()
            .filter_map(Value::as_str)
            .map(str::to_string)
            .collect()
    });
    fgos_execution::seat_resolver::check_declared_seats(
        request.get("raw").unwrap_or(&null),
        text(&request, "label")?,
        tiers.as_deref(),
    )
    .map(|seats| json!(seats))
    .map_err(seat_refused)
}

/// `assertNoSeatTier(seats, source)`: refuses a seat list that carries a tier.
#[napi(namespace = "execution", js_name = "assertNoSeatTier")]
pub fn assert_no_seat_tier(request: Value) -> Result<()> {
    check()?;
    let null = Value::Null;
    fgos_execution::seat_resolver::assert_no_seat_tier(
        request.get("raw").unwrap_or(&null),
        text(&request, "source")?,
    )
    .map_err(seat_refused)
}

/// `assertNoUnitTier(unit, source)`: refuses a unit that carries a tier.
#[napi(namespace = "execution", js_name = "assertNoUnitTier")]
pub fn assert_no_unit_tier(request: Value) -> Result<()> {
    check()?;
    let null = Value::Null;
    fgos_execution::seat_resolver::assert_no_unit_tier(
        request.get("raw").unwrap_or(&null),
        text(&request, "source")?,
    )
    .map_err(seat_refused)
}

/// `verifyCommandOf(unit, cfg)`: the verify command a unit runs (its own, else its capability's), or null.
#[napi(namespace = "execution", js_name = "verifyCommandOf")]
pub fn verify_command_of(request: Value) -> Result<Value> {
    check()?;
    let null = Value::Null;
    Ok(json!(fgos_execution::loops::verify_command_of(
        request.get("unit").unwrap_or(&null),
        request.get("cfg").unwrap_or(&null),
    )))
}

/// `verifySeatResult(answer, round)`: the verify seat's result for one answer of the verify command.
#[napi(namespace = "execution", js_name = "verifySeatResult")]
pub fn verify_seat_result(request: Value) -> Result<Value> {
    check()?;
    // A round the caller did not give stays absent from the result, as Node left it undefined.
    let round = request.get("round").and_then(Value::as_u64);
    let mut result =
        fgos_execution::loops::verify_seat_result(present(&request, "answer"), round.unwrap_or(0));
    if round.is_none() {
        if let Some(map) = result.as_object_mut() {
            map.remove("round");
        }
    }
    Ok(result)
}

// ---- the runner config rules ------------------------------------------------------------------------------

/// `detectRetiredPatternKeys(input)`: the retired keys a dotted path or a pattern map carries.
#[napi(namespace = "execution", js_name = "detectRetiredPatternKeys")]
pub fn detect_retired_pattern_keys(request: Value) -> Result<Value> {
    check()?;
    Ok(json!(
        fgos_execution::patterns::detect_retired_pattern_keys(present(&request, "input"))
            .iter()
            .map(|finding| finding.to_json())
            .collect::<Vec<_>>()
    ))
}

/// `formatRetiredKeySentence(item, instruction)`: `<key> was retired; <instruction>`.
#[napi(namespace = "execution", js_name = "formatRetiredKeySentence")]
pub fn format_retired_key_sentence(request: Value) -> Result<String> {
    check()?;
    Ok(fgos_execution::patterns::format_retired_key_sentence(
        present(&request, "item"),
        request.get("instruction").and_then(Value::as_str),
    ))
}

/// `runTimeoutProblem(value, label)`: why a value is not a usable run timeout, or null.
#[napi(namespace = "execution", js_name = "runTimeoutProblem")]
pub fn run_timeout_problem(request: Value) -> Result<Value> {
    check()?;
    let null = Value::Null;
    Ok(json!(fgos_execution::bind::run_timeout_problem(
        request.get("value").unwrap_or(&null),
        text(&request, "label")?,
    )))
}

/// `parseRunTimeout(text, label)`: `90m`, `5400s`, `2h` or `600000ms` as milliseconds, or a `RunnerConfigError`.
#[napi(namespace = "execution", js_name = "parseRunTimeout")]
pub fn parse_run_timeout(request: Value) -> Result<f64> {
    check()?;
    let label = text(&request, "label")?;
    // A value that is not text is refused with the sentence that names it, as Node printed it.
    fgos_execution::bind::parse_run_timeout_value(request.get("text"), label)
        .map(|ms| ms as f64)
        .map_err(|message| refused(RunUnitError::config(message, None, None)))
}

/// `assertReasoningEffort(value, { supported, executorId })`: the value when the vocabulary and the executor's own
/// list allow it, else a `RunnerConfigError`.
#[napi(namespace = "execution", js_name = "assertReasoningEffort")]
pub fn assert_reasoning_effort(request: Value) -> Result<Value> {
    check()?;
    let value = request.get("value").cloned().unwrap_or(Value::Null);
    let shown = match &value {
        Value::String(s) => s.clone(),
        Value::Null => "undefined".into(),
        other => other.to_string(),
    };
    fgos_execution::tier_cell::assert_reasoning_effort(
        &shown,
        request
            .get("supported")
            .and_then(Value::as_array)
            .map(Vec::as_slice),
        request.get("executorId").and_then(Value::as_str),
    )
    .map(|()| value)
    .map_err(|e| refused(named(e.name, e.message, e.code, None)))
}

/// `validateRunnerLoopsShape(loops, label)`: the rules of `runner.loops` that read beyond its own fields; a
/// refusal is a `RunnerConfigError` naming its `path`, `paths` and `detail`.
#[napi(namespace = "execution", js_name = "validateRunnerLoopsShape")]
pub fn validate_runner_loops_shape(request: Value) -> Result<()> {
    check()?;
    let null = Value::Null;
    fgos_execution::runner_check::validate_runner_loops_shape(
        request.get("loops").unwrap_or(&null),
        text(&request, "label")?,
    )
    .map_err(|failure| {
        let mut error = named(
            failure.error.name,
            failure.error.message,
            failure.error.code,
            None,
        );
        if let Some(path) = failure.path {
            error = error.with("path", json!(path));
        }
        if !failure.paths.is_empty() {
            error = error.with("paths", json!(failure.paths));
        }
        if let Some(detail) = failure.detail {
            error = error.with("detail", json!(detail));
        }
        refused(error)
    })
}

/// `attributeRunnerConfigError`'s message: a refusal about `paths` attributed to the files and lines its values
/// came from, or null when no origin names them.
#[napi(namespace = "execution", js_name = "attributedRefusal")]
pub fn attributed_refusal(request: Value) -> Result<Value> {
    check()?;
    let strings = |key: &str| -> Vec<String> {
        request
            .get(key)
            .and_then(Value::as_array)
            .map(|list| {
                list.iter()
                    .filter_map(Value::as_str)
                    .map(str::to_string)
                    .collect()
            })
            .unwrap_or_default()
    };
    let origins = request
        .get("origins")
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .unwrap_or_default();
    Ok(json!(fgos_execution::runner_config::attributed_message(
        &strings("paths"),
        text(&request, "detail")?,
        origins,
        text(&request, "projectDir")?,
    )))
}

// ---- the accounts ------------------------------------------------------------------------------------------

/// The machine an account read sees from the Node process. The inventory reads only the home directory a login
/// store names; the PATH and herdr answers are the real ones, and the confinement backend registry, which no
/// account read asks, answers none.
struct AccountsMachine;

impl fgos_execution::ports::Machine for AccountsMachine {
    fn on_path(&self, program: &str) -> bool {
        let path_env = std::env::var("PATH").unwrap_or_default();
        let pathext = std::env::var("PATHEXT").unwrap_or_default();
        fgos_process::spawn::resolve_program(program, &path_env, &pathext, cfg!(windows)).is_some()
    }

    fn posture_backend(&self, _id: &str) -> Option<fgos_execution::ports::Backend> {
        None
    }

    fn herdr_present(&self) -> bool {
        machine_reads::herdr_present()
    }

    fn home_dir(&self) -> Option<String> {
        let var = if cfg!(unix) { "HOME" } else { "USERPROFILE" };
        std::env::var(var).ok().filter(|home| !home.is_empty())
    }
}

/// `providerAccountInventory(runnerConfig)`: the accounts of `runner.llmAccounts` per state key, as the lease reads
/// them (a config with a `runner` section is read through it).
#[napi(namespace = "execution", js_name = "providerAccountInventory")]
pub fn provider_account_inventory(request: Value) -> Result<Value> {
    check()?;
    let null = Value::Null;
    let config = request.get("runnerConfig").unwrap_or(&null);
    let runner = config
        .get("runner")
        .filter(|r| r.is_object())
        .unwrap_or(config);
    Ok(Value::Object(
        fgos_execution::accounts::provider_account_inventory(runner, &AccountsMachine),
    ))
}

/// `legacyStateKey(pool)`: the provider-capacity state key of an account pool.
#[napi(namespace = "execution", js_name = "legacyStateKey")]
pub fn legacy_state_key(request: Value) -> Result<String> {
    check()?;
    Ok(fgos_execution::accounts::legacy_state_key(text(
        &request, "pool",
    )?))
}

// ---- the run result, the worker's claim and the assignment stamp -------------------------------------------

/// `interpretRunResult(input, { expectedRunId })`: `{ record, status, confidence, corrupt }`, the deterministic
/// reading of a Run Result of any version (a record that cannot be read soundly reads as `contract-corrupt`).
#[napi(namespace = "execution", js_name = "interpretRunResult")]
pub fn interpret_run_result(request: Value) -> Result<Value> {
    check()?;
    let null = Value::Null;
    let read = fgos_execution::run_result::interpret_run_result(
        request.get("input").unwrap_or(&null),
        request.get("expectedRunId").and_then(Value::as_str),
    );
    Ok(
        json!({ "record": read.record, "status": read.status, "confidence": read.confidence, "corrupt": read.corrupt }),
    )
}

/// `runOutcome(result, { evidenceFloor })`: the one outcome every dispatch, loop and legality decision reads.
#[napi(namespace = "execution", js_name = "runOutcome")]
pub fn run_outcome(request: Value) -> Result<Value> {
    check()?;
    let null = Value::Null;
    Ok(fgos_execution::run_result::run_outcome(
        request.get("result").unwrap_or(&null),
        present(&request, "evidenceFloor").filter(|floor| floor.is_object()),
    )
    .to_json())
}

/// `validateAgentResultClaim(value, { role, operation, posture })`: `{ valid, reason? }` of an untrusted claim.
#[napi(namespace = "execution", js_name = "validateAgentResultClaim")]
pub fn validate_agent_result_claim(request: Value) -> Result<Value> {
    check()?;
    let null = Value::Null;
    let context = fgos_execution::run_result::claim::claim_context_of(
        request.get("context").unwrap_or(&null),
    );
    let checked = fgos_execution::run_result::validate_agent_result_claim_contract(
        request.get("value").unwrap_or(&null),
        &context,
    );
    Ok(match checked.reason {
        Some(reason) => json!({ "valid": checked.valid, "reason": reason }),
        None => json!({ "valid": checked.valid }),
    })
}

/// `isSubstantiveReportText(text)`: whether a report says something beyond placeholders and headings.
#[napi(namespace = "execution", js_name = "isSubstantiveReportText")]
pub fn is_substantive_report_text(request: Value) -> Result<bool> {
    check()?;
    Ok(request
        .get("text")
        .and_then(Value::as_str)
        .is_some_and(fgos_execution::run_result::claim::is_substantive_report_text))
}

/// `isReadOnlyAssignment(assignment)`: read-only or mutating, from the `mutation` stamped at build time.
#[napi(namespace = "execution", js_name = "isReadOnlyAssignment")]
pub fn is_read_only_assignment(request: Value) -> Result<bool> {
    check()?;
    let null = Value::Null;
    Ok(fgos_execution::dispatch_policy::is_read_only_assignment(
        request.get("assignment").unwrap_or(&null),
    ))
}

/// `stampDeclaredAssignment({ role, operation })`: `{ mutation, evidence: { required }, resultKind, onAdvance? }`.
#[napi(namespace = "execution", js_name = "stampDeclaredAssignment")]
pub fn stamp_declared_assignment(request: Value) -> Result<Value> {
    check()?;
    Ok(fgos_execution::declared_stamp::stamp_declared_assignment(
        request.get("role").and_then(Value::as_str),
        request
            .get("operation")
            .and_then(Value::as_str)
            .unwrap_or_default(),
    )
    .to_json())
}

/// `resolveWorkerArtifactPath(runDir, roundPrefix, roundSuffix, legacyName)`: where a worker's claim or report is,
/// outbox first and the highest round winning; the legacy flat path when no directory holds one.
#[napi(namespace = "execution", js_name = "resolveWorkerArtifactPath")]
pub fn resolve_worker_artifact_path(request: Value) -> Result<String> {
    check()?;
    Ok(
        fgos_execution::worker_artifacts::resolve_worker_artifact_path(
            &path_of(&request, "runDir")?,
            text(&request, "roundPrefix")?,
            text(&request, "roundSuffix")?,
            text(&request, "legacyName")?,
        )
        .to_string_lossy()
        .into_owned(),
    )
}

/// `assignmentDir(fgosDir, assignmentId)`: the directory of an assignment, or null for an id that is no safe nested
/// path under `assignments/`.
#[napi(namespace = "execution", js_name = "assignmentDir")]
pub fn assignment_dir(request: Value) -> Result<Value> {
    check()?;
    let fgos = path_of(&request, "fgosDir")?;
    Ok(request
        .get("assignmentId")
        .and_then(Value::as_str)
        .and_then(|id| fgos_execution::assignment_layout::assignment_dir(&fgos, id))
        .map_or(Value::Null, |dir| json!(dir.to_string_lossy())))
}

/// `listAssignmentRuns(fgosDir)`: every attempt directory under `assignments/`, `{ assignmentId, attempt, runDir,
/// hasAssignmentJson }`, a symlink or a too-deep directory never followed.
#[napi(namespace = "execution", js_name = "listAssignmentRuns")]
pub fn list_assignment_runs(request: Value) -> Result<Value> {
    check()?;
    Ok(json!(
        fgos_execution::assignment_layout::list_assignment_runs(&path_of(&request, "fgosDir")?)
            .iter()
            .map(|run| json!({
                "assignmentId": run.assignment_id,
                "attempt": run.attempt,
                "runDir": run.run_dir.to_string_lossy(),
                "hasAssignmentJson": run.has_assignment_json,
            }))
            .collect::<Vec<_>>()
    ))
}

/// `seatSessionDir(runDir, launchCommandId)`: the folder a seat's session is in while its run settles (the copy
/// finalize-home kept, else the private home's session folder), or null when the launch declared none.
#[napi(namespace = "execution", js_name = "seatSessionDir")]
pub fn seat_session_dir(request: Value) -> Result<Value> {
    check()?;
    let launch = request.get("launchCommandId").and_then(Value::as_str);
    Ok(
        fgos_execution::seat_session::seat_session_dir(&path_of(&request, "runDir")?, launch)
            .map_or(Value::Null, |dir| json!(dir.to_string_lossy())),
    )
}

/// `headOf(env)`: the head a launch environment names, `{ persona, name, gen }`, or `{}` when it does not name all
/// three. A value that is no string reads as its JSON text, as `Number()` would read a number.
#[napi(namespace = "execution", js_name = "headOf")]
pub fn head_of(request: Value) -> Result<Value> {
    check()?;
    let env = request
        .get("env")
        .and_then(Value::as_object)
        .map(|env| {
            env.iter()
                .filter_map(|(name, value)| match value {
                    Value::String(text) => Some((name.clone(), text.clone())),
                    Value::Number(number) => Some((name.clone(), number.to_string())),
                    _ => None,
                })
                .collect()
        })
        .unwrap_or_default();
    Ok(Value::Object(fgos_execution::seat_session::head_of(&env)))
}

/// `shippedCatalog()`: the bundled standard's `{ patterns, loops }` (the Config crate's shipped catalog).
#[napi(namespace = "execution", js_name = "shippedCatalog")]
pub fn shipped_catalog() -> Result<Value> {
    check()?;
    Ok(fgos_config::standard::shipped_runner_catalog())
}

// ---- the hand-off -------------------------------------------------------------------------------------------

/// `anonymousInputName(index)`: the neutral name of the nth anonymized input (`seat-A` ... `seat-Z`, `seat-AA`).
#[napi(namespace = "execution", js_name = "anonymousInputName")]
pub fn anonymous_input_name(request: Value) -> Result<String> {
    check()?;
    let index = request
        .get("index")
        .and_then(Value::as_u64)
        .ok_or_else(|| invalid("index must be a whole number"))?;
    Ok(fgos_execution::handoff::anonymous_input_name(
        usize::try_from(index).map_err(|_| invalid("index is too large"))?,
    ))
}

/// `reportDigest(unitRunId, seat, mainRoot)`: `{ path, bytes, sha256 }` of the report a seat of a unit run left in
/// its latest round, as its bytes lie now; a report that cannot be resolved or read is refused (`reason`).
#[napi(namespace = "execution", js_name = "reportDigest")]
pub fn report_digest(request: Value) -> Result<Value> {
    check()?;
    fgos_execution::handoff_reports::report_digest_of_seat(
        text(&request, "unitRunId")?,
        text(&request, "seat")?,
        &path_of(&request, "mainRoot")?,
    )
    .map_err(refused)
}

/// `handoffRef(input, mainRoot, { accept })`: the path one input names (a `unit-run:` input the report it hands
/// over, only while it keeps the bytes settlement recorded unless `accept` covers the revision; a `gate-answer:`
/// input the owner's answer file; any other input itself). One that cannot be handed over is refused (`reason`).
#[napi(namespace = "execution", js_name = "handoffRef")]
pub fn handoff_ref(request: Value) -> Result<String> {
    check()?;
    use fgos_execution::handoff_reports;
    handoff_reports::resolve_ref(
        text(&request, "input")?,
        &path_of(&request, "mainRoot")?,
        &handoff_reports::accept_of(request.get("accept")),
    )
    .map(|file| file.to_string_lossy().into_owned())
    .map_err(|e| refused(handoff_reports::refusal(e)))
}

// ---- executor facts a Work caller reads ---------------------------------------------------------------------

/// `resolveExecutorConfig(runnerConfig, executorId, { contentCarries, resolvedAgentType, invocationId })`: the
/// executor block a name resolves to (`command`, `provider`, `governance`, ...), or the refusal.
#[napi(namespace = "execution", js_name = "resolveExecutorConfig")]
pub fn resolve_executor_config(request: Value) -> Result<Value> {
    check()?;
    let null = Value::Null;
    let str_at = |key: &str| request.get(key).and_then(Value::as_str);
    fgos_execution::executor_config::resolve_executor_config(
        request.get("runnerConfig").unwrap_or(&null),
        str_at("executorId"),
        str_at("contentCarries"),
        str_at("resolvedAgentType"),
        str_at("invocationId"),
    )
    .map_err(|e| refused(named(e.name, e.message, e.code, None)))
}

/// `resolveCapabilityDetailsFromHints({ runnerConfig, executorId, resolvedExecutor, purpose, hints })`:
/// `{ capability, anchorCapability }`, the canonical capability of a dispatch independent of any Work item.
#[napi(namespace = "execution", js_name = "resolveCapabilityDetailsFromHints")]
pub fn resolve_capability_details_from_hints(request: Value) -> Result<Value> {
    check()?;
    let null = Value::Null;
    let hints = request.get("hints").unwrap_or(&null);
    let strings = |key: &str| -> Vec<String> {
        hints
            .get(key)
            .and_then(Value::as_array)
            .map(|list| {
                list.iter()
                    .filter_map(Value::as_str)
                    .map(str::to_string)
                    .collect()
            })
            .unwrap_or_default()
    };
    let text_of = |key: &str| hints.get(key).and_then(Value::as_str).map(str::to_string);
    let asked = fgos_execution::capability_resolve::CapabilityHints {
        candidates: strings("candidates"),
        preferred: text_of("preferred"),
        fallback_label: text_of("fallbackLabel"),
    };
    Ok(
        fgos_execution::capability_resolve::resolve_capability_details_from_hints(
            request.get("runnerConfig").unwrap_or(&null),
            request.get("executorId").and_then(Value::as_str),
            present(&request, "resolvedExecutor"),
            request.get("purpose").and_then(Value::as_str),
            &asked,
        )
        .to_json(),
    )
}
