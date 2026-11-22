//! The checks a new unit run passes before it is admitted: the unit itself, the plan it serves, the collaboration
//! its pattern resolves to, the declared operation it carries and an override's run timeout. Every rule is
//! `fgos-execution`'s or the engine's; this module is the host side of the traits those rules read through: the
//! tier ladder, the seat modules, the loop tables, the Convention plan-name rule and the plan directory on disk.

use std::path::Path;

use fgos_execution::hosts::{CrateSeating, CrateTables, CrateUnitHost, PlanChecks};
use fgos_execution::patterns::{
    resolve_collaboration as resolve, CollaborationFailure, ResolveOptions as CollaborationAsk,
};
use fgos_execution::run_request::existing_plan_ref as check_plan;
use fgos_execution::unit::{validate_unit as validate, Refusal};
use fgos_execution_engine::assignment::builder::{
    declared_operation_fields as fields_of, DeclaredRequest,
};
use fgos_execution_engine::unit_run::run_unit_contract::{ErrorTag, RunUnitError};
use serde_json::{json, Value};

/// A refusal of `fgos-execution` under the class Node threw it as.
fn refused(name: &str, message: String, code: Option<&str>, phase: Option<&str>) -> RunUnitError {
    let mut error = RunUnitError::config(message, code, phase);
    error.tag = ErrorTag::parse(name).unwrap_or(ErrorTag::Error);
    if error.tag == ErrorTag::Error {
        error.error_class = "error".into();
        error = error.with("name", json!(name));
    }
    error
}

fn from_refusal(r: Refusal) -> RunUnitError {
    refused(r.name, r.message, r.code.as_deref(), r.phase.as_deref())
}

/// `validateUnit` (`src/runner/execution/unit.mjs:168`): the normalized unit, or the refusal that names what is
/// wrong with it.
pub fn validate_unit(raw: &Value) -> Result<Value, RunUnitError> {
    validate(raw, &CrateUnitHost)
        .map(|unit| unit.to_json())
        .map_err(from_refusal)
}

/// `assertRunTimeoutMs(value, 'override timeoutMs')` (`src/runner/execution/unit-run-start.mjs:419`).
pub fn assert_run_timeout(value: &Value) -> Result<(), RunUnitError> {
    match fgos_execution::bind::run_timeout_problem(value, "override timeoutMs") {
        Some(problem) => Err(RunUnitError::config(problem, None, None)),
        None => Ok(()),
    }
}

// ---- the plan ---------------------------------------------------------------------------------------------

/// Whether `plan_dir` is a real directory under the main checkout (never through a link).
pub(crate) fn is_plan_directory(main_root: &str, plan_dir: &str) -> bool {
    std::fs::symlink_metadata(Path::new(main_root).join(plan_dir)).is_ok_and(|m| m.is_dir())
}

/// `existingPlanRef` (`src/runner/execution/run-request.mjs:174`): a unit file's plan gets the check `--plan` gets.
pub fn existing_plan_ref(plan: Option<&Value>, main_root: &Path) -> Result<(), RunUnitError> {
    let Some(plan) = plan.filter(|p| !p.is_null()) else {
        return Ok(());
    };
    check_plan(
        plan,
        &main_root.to_string_lossy(),
        &PlanChecks {
            is_plan_directory: &is_plan_directory,
        },
    )
    .map(|_| ())
    .map_err(from_refusal)
}

// ---- the collaboration ------------------------------------------------------------------------------------

/// `resolveCollaboration` as `unit-run-start.mjs:380-399` calls it: the collaboration of a new unit run over the
/// live runner config, the bundled catalog and, when the config was loaded from the project, the origins of its
/// values. A refusal of the catalog or of the seats is a `RunnerConfigError` of the pre-admission phase.
pub fn resolve_collaboration(
    ask: &Value,
    shipped: &Value,
    origins: Option<&Value>,
) -> Result<Value, RunUnitError> {
    let text = |key: &str| ask.get(key).filter(|v| !v.is_null());
    let reason = text("reason").map(|r| match r {
        Value::String(s) => s.clone(),
        other => other.to_string(),
    });
    let options = CollaborationAsk {
        unit: text("unit"),
        selectors: text("selectors"),
        request: text("request"),
        in_case: ask.get("inCase") == Some(&Value::Bool(true)),
        reason: reason.as_deref(),
        runner_config: text("runnerConfig"),
        shipped: Some(shipped),
        origins: if ask.get("origins") == Some(&Value::Bool(true)) {
            origins
        } else {
            None
        },
    };
    resolve(&options, &CrateTables, &CrateSeating)
        .map(|c| c.to_json())
        .map_err(|failure| {
            let (code, message) = match failure {
                CollaborationFailure::Collaboration(e) => (e.code, e.message),
                CollaborationFailure::Seat(e) => (e.code, e.message),
            };
            RunUnitError::config(message, Some(&code), Some("pre-admission"))
        })
}

// ---- the declared operation -------------------------------------------------------------------------------

/// `declaredOperationFields({ domain, workflow, stage, operation, operations, taskSpecRoot })`
/// (`src/runner/dispatch/assignment.mjs:259`): the operation fields a unit carrying a declared operation stamps on
/// its producer assignment, refused when the step does not declare the operation or its task spec is missing.
pub fn declared_operation_fields(
    declared: &Value,
    task_spec_root: Option<&Path>,
) -> Result<Value, RunUnitError> {
    let text = |key: &str| {
        declared
            .get(key)
            .and_then(Value::as_str)
            .unwrap_or_default()
    };
    let operations: Vec<Value> = declared
        .get("operations")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    fields_of(&DeclaredRequest {
        domain: text("domain"),
        workflow: declared.get("workflow").and_then(Value::as_str),
        stage: text("stage"),
        operation: text("operation"),
        operations: &operations,
        role: None,
        contract_template: None,
        task_spec_root,
    })
    .map(|declared| Value::Object(declared.fields))
    .map_err(|r| RunUnitError::config(r.message, r.code.as_deref(), None))
}
