//! The sibling answers the crate's own rules read through their traits, composed from the crate and its pure
//! dependencies: the tier ladder of Seat Binding, the seat and loop modules, the run timeout rule and the Convention
//! plan-name rule. Every door that validates a Unit, checks a plan or resolves a collaboration (the host's unit run,
//! the Node addon) uses these, so the answers cannot drift between doors. The one fact read from the disk (whether a
//! plan directory exists) is the caller's, passed in.

use serde_json::{json, Value};

use crate::patterns::{DeclaredSeat, LoopTables, ParamDef, SeatError, Seating};
use crate::run_request::{GitRoots, RunRequestHost};
use crate::seat_resolver::{
    self, checker_plan_of, resolve_seats, seat_launches_of, PlanOptions, ResolveOptions,
    SeatResolutionError, CHECKER_SEATS, LOOP_NAMES,
};
use crate::unit::{Refusal, UnitHost};

/// The tier names of the ladder, weakest first (`MODEL_POLICY_TIERS`).
pub fn tiers() -> Vec<String> {
    fgos_seat_binding::ladder()
        .vocabulary
        .into_iter()
        .map(str::to_string)
        .collect()
}

/// What the unit validation reads: the tier ladder, the declared-seat check and the run timeout rule.
pub struct CrateUnitHost;

impl UnitHost for CrateUnitHost {
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
        crate::bind::run_timeout_problem(value, label)
    }
}

/// The two facts `existingPlanRef` asks: the Convention plan-name rule and whether the plan is a real directory
/// under the main checkout (`is_plan_directory(main_root, plan_dir)`, the caller's read). The request's other
/// questions belong to the `fgos run` route, which builds the request; the plan check never asks them.
pub struct PlanChecks<'a> {
    pub is_plan_directory: &'a dyn Fn(&str, &str) -> bool,
}

const PLAN_CHECK_ONLY: &str = "the plan check asks only the plan-name rule and the plan directory";

/// `planDirNameProblem`: the Convention path rule for a report of the plan answers `invalid-plan-dir` for a name that
/// is no plan directory.
pub fn plan_dir_problem(name: &str) -> Result<Option<String>, String> {
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

impl RunRequestHost for PlanChecks<'_> {
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
    fn plan_dir_problem(&self, name: &str, _main_root: &str) -> Result<Option<String>, String> {
        plan_dir_problem(name)
    }
    fn is_plan_directory(&self, main_root: &str, plan_dir: &str) -> bool {
        (self.is_plan_directory)(main_root, plan_dir)
    }
}

fn seat_error(e: SeatResolutionError) -> SeatError {
    SeatError {
        code: e.code,
        at: e.at,
        message: e.message,
    }
}

/// The loop and seat modules of the crate as the pattern catalog reads them.
pub struct CrateTables;

impl LoopTables for CrateTables {
    fn loop_names(&self) -> Vec<String> {
        LOOP_NAMES.iter().map(|n| n.to_string()).collect()
    }
    fn param_table_keys(&self, loop_name: &str) -> Option<Vec<String>> {
        crate::loops::param_table_of(loop_name)
            .map(|table| table.iter().map(|p| p.name.to_string()).collect())
    }
    fn param_defs(&self, loop_name: &str) -> Option<Vec<(String, ParamDef)>> {
        crate::loops::param_table_of(loop_name).map(|table| {
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
        crate::loops::DEFAULT_REBUTTAL
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

/// The seat modules as the collaboration resolution asks them (`resolveSeats`, `seatLaunchesOf`, `checkerPlanOf`).
pub struct CrateSeating;

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
