//! The checks a new unit run passes before it is admitted: the unit itself, the plan it serves, the collaboration
//! its pattern resolves to, the declared operation it carries and an override's run timeout. Every rule is
//! `fgos-execution`'s or the engine's; this module is the host side of the traits those rules read through: the
//! tier ladder, the seat modules, the loop tables, the Convention plan-name rule and the plan directory on disk.

use std::path::Path;

use fgos_execution::patterns::{
    resolve_collaboration as resolve, CollaborationFailure, DeclaredSeat, LoopTables, ParamDef,
    ResolveOptions as CollaborationAsk, SeatError, Seating,
};
use fgos_execution::run_request::{existing_plan_ref as check_plan, GitRoots, RunRequestHost};
use fgos_execution::seat_resolver::{
    self, checker_plan_of, resolve_seats, seat_launches_of, PlanOptions, ResolveOptions,
    SeatResolutionError, CHECKER_SEATS, LOOP_NAMES,
};
use fgos_execution::unit::{validate_unit as validate, Refusal, UnitHost};
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

/// The tier names of the ladder, weakest first (`MODEL_POLICY_TIERS`, `src/runner/dispatch/config.mjs:403`).
fn tiers() -> Vec<String> {
    fgos_seat_binding::ladder()
        .vocabulary
        .into_iter()
        .map(str::to_string)
        .collect()
}

/// What the unit validation reads of the machine: the tier ladder, the declared-seat check and the run timeout
/// rule.
struct UnitChecks;

impl UnitHost for UnitChecks {
    fn tiers(&self) -> Vec<String> {
        tiers()
    }
    fn check_declared_seats(
        &self,
        raw: &Value,
        label: &str,
        tiers: &[String],
    ) -> Result<Value, String> {
        seat_resolver::check_declared_seats(raw, label, Some(tiers))
            .map(Value::Array)
            .map_err(|e| e.message)
    }
    fn run_timeout_problem(&self, value: &Value, label: &str) -> Option<String> {
        fgos_execution::bind::run_timeout_problem(value, label)
    }
}

/// `validateUnit` (`src/runner/execution/unit.mjs:168`): the normalized unit, or the refusal that names what is
/// wrong with it.
pub fn validate_unit(raw: &Value) -> Result<Value, RunUnitError> {
    validate(raw, &UnitChecks)
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

/// The two facts `existingPlanRef` asks of the machine: the Convention plan-name rule and whether the plan is a
/// real directory under the main checkout. The request's other questions belong to the `fgos run` route, which
/// builds the request; the plan check never asks them.
pub(crate) struct PlanChecks;

const PLAN_CHECK_ONLY: &str = "the plan check asks only the plan-name rule and the plan directory";

impl RunRequestHost for PlanChecks {
    fn cwd(&self) -> String {
        unreachable!("{PLAN_CHECK_ONLY}")
    }
    fn process_cwd(&self) -> String {
        unreachable!("{PLAN_CHECK_ONLY}")
    }
    fn git_roots(&self, _: &str) -> Result<GitRoots, Refusal> {
        unreachable!("{PLAN_CHECK_ONLY}")
    }
    fn confined_write_refusal(&self, _: &str, _: Option<&str>) -> Option<String> {
        unreachable!("{PLAN_CHECK_ONLY}")
    }
    fn activity_unit_of(&self, _: Option<&str>, _: &str, _: &str) -> Option<Value> {
        unreachable!("{PLAN_CHECK_ONLY}")
    }
    fn dispatch_depth(&self) -> f64 {
        unreachable!("{PLAN_CHECK_ONLY}")
    }
    fn random_hex4(&self) -> String {
        unreachable!("{PLAN_CHECK_ONLY}")
    }
    fn parse_run_timeout(&self, _: &str) -> Result<u64, String> {
        unreachable!("{PLAN_CHECK_ONLY}")
    }
    fn provider_ids(&self, _: &str) -> Result<Vec<String>, Refusal> {
        unreachable!("{PLAN_CHECK_ONLY}")
    }
    fn check_agent_definition(&self, _: &str, _: &str) -> Result<(), String> {
        unreachable!("{PLAN_CHECK_ONLY}")
    }
    /// `planDirNameProblem` (`src/convention/convention-client.mjs:33`): the Convention path rule for a report of
    /// the plan answers `invalid-plan-dir` for a name that is no plan directory.
    fn plan_dir_problem(&self, name: &str, _main_root: &str) -> Result<Option<String>, String> {
        let input = fgos_convention::NameInput {
            kind: "report",
            artifact_type: Some("check"),
            slug: "plan-check",
            at: None,
            now_millis: 0,
            local_offset_seconds: 0,
        };
        match fgos_convention::convention_path(&input, Some(name)) {
            Ok(_) => Ok(None),
            Err(error @ fgos_convention::ConventionError::InvalidPlanDir) => {
                Ok(Some(error.to_string()))
            }
            Err(other) => Err(other.to_string()),
        }
    }
    fn is_plan_directory(&self, main_root: &str, plan_dir: &str) -> bool {
        std::fs::symlink_metadata(Path::new(main_root).join(plan_dir)).is_ok_and(|m| m.is_dir())
    }
}

/// `existingPlanRef` (`src/runner/execution/run-request.mjs:174`): a unit file's plan gets the check `--plan` gets.
pub fn existing_plan_ref(plan: Option<&Value>, main_root: &Path) -> Result<(), RunUnitError> {
    let Some(plan) = plan.filter(|p| !p.is_null()) else {
        return Ok(());
    };
    check_plan(plan, &main_root.to_string_lossy(), &PlanChecks)
        .map(|_| ())
        .map_err(from_refusal)
}

// ---- the collaboration ------------------------------------------------------------------------------------

fn seat_error(e: SeatResolutionError) -> SeatError {
    SeatError {
        code: e.code,
        at: e.at,
        message: e.message,
    }
}

/// The loop and seat modules of `fgos-execution` as the catalog reads them (`patterns/catalog.mjs` imports).
struct CrateTables;

impl LoopTables for CrateTables {
    fn loop_names(&self) -> Vec<String> {
        LOOP_NAMES.iter().map(|n| n.to_string()).collect()
    }
    fn param_table_keys(&self, loop_name: &str) -> Option<Vec<String>> {
        fgos_execution::loops::param_table_of(loop_name)
            .map(|table| table.iter().map(|p| p.name.to_string()).collect())
    }
    fn param_defs(&self, loop_name: &str) -> Option<Vec<(String, ParamDef)>> {
        fgos_execution::loops::param_table_of(loop_name).map(|table| {
            table
                .iter()
                .map(|p| {
                    (
                        p.name.to_string(),
                        ParamDef {
                            kind: p.kind.to_string(),
                            scalar: p.scalar,
                        },
                    )
                })
                .collect()
        })
    }
    fn default_rebuttal(&self) -> bool {
        fgos_execution::loops::DEFAULT_REBUTTAL
    }
    fn checker_seats(&self) -> Vec<(String, String)> {
        CHECKER_SEATS
            .iter()
            .map(|(seat, role, _)| (seat.to_string(), role.to_string()))
            .collect()
    }
    fn check_declared_seats(
        &self,
        raw: &Value,
        label: &str,
    ) -> Result<Vec<DeclaredSeat>, SeatError> {
        let seats = seat_resolver::check_declared_seats(raw, label, None).map_err(seat_error)?;
        Ok(seats
            .iter()
            .map(|s| DeclaredSeat {
                seat: s
                    .get("seat")
                    .and_then(Value::as_str)
                    .unwrap_or_default()
                    .into(),
                role: s
                    .get("role")
                    .and_then(Value::as_str)
                    .unwrap_or_default()
                    .into(),
            })
            .collect())
    }
}

fn field(input: &Value, key: &str) -> Option<Value> {
    input.get(key).filter(|v| !v.is_null()).cloned()
}

/// The seat input `{ loop, params, floors?, unit, runnerConfig, slot?, shippedCheckersByRigor? }` as the seat
/// resolver reads it.
fn seat_options(input: &Value) -> ResolveOptions {
    ResolveOptions {
        loop_name: input
            .get("loop")
            .and_then(Value::as_str)
            .map(str::to_string),
        pattern: None,
        params: field(input, "params"),
        floors: field(input, "floors"),
        unit: field(input, "unit").unwrap_or_else(|| json!({})),
        runner_config: field(input, "runnerConfig").unwrap_or_else(|| json!({})),
        shipped_checkers_by_rigor: field(input, "shippedCheckersByRigor"),
        slot: input
            .get("slot")
            .and_then(Value::as_str)
            .map(str::to_string),
    }
}

/// The seat modules as the resolution asks them (`resolveSeats`, `seatLaunchesOf`, `checkerPlanOf`).
struct CrateSeating;

impl Seating for CrateSeating {
    fn resolve_seats(&self, input: &Value) -> Result<Vec<Value>, SeatError> {
        resolve_seats(&seat_options(input)).map_err(seat_error)
    }
    fn seat_launches(&self, input: &Value) -> Result<Option<Value>, SeatError> {
        seat_launches_of(&seat_options(input))
            .map(|bound| bound.map(|b| json!(b)))
            .map_err(seat_error)
    }
    fn checker_plan(
        &self,
        unit: &Value,
        runner: &Value,
        options: &Value,
    ) -> Result<Vec<Value>, SeatError> {
        let plan = PlanOptions {
            requested: options.get("requested").filter(|v| !v.is_null()),
            floors: options.get("floors").filter(|v| !v.is_null()),
            slot: options.get("slot").and_then(Value::as_str),
            shipped_checkers_by_rigor: options
                .get("shippedCheckersByRigor")
                .filter(|v| !v.is_null()),
        };
        checker_plan_of(unit, runner, &plan)
            .map(|entries| {
                entries
                    .into_iter()
                    .map(|e| json!({ "seat": e.seat, "contributions": e.contributions }))
                    .collect()
            })
            .map_err(seat_error)
    }
}

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
