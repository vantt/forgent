//! The composed machine of one unit run: [`HostUnitRun`] answers every port of engine `unit_run` from the adapters
//! of this module, and dispatches a bound seat through the assignment runner on [`HostExecution`]
//! (`dispatchBound`, `src/runner/execution/run.mjs:994`).

use std::path::{Path, PathBuf};
use std::sync::Mutex;

use fgos_execution::admission::CaseAdmission;
use fgos_execution::bind::BindSession;
use fgos_execution_engine::accounts::rotation::Rotation;
use fgos_execution_engine::assignment::builder::{build_unit_run_assignment, SeatAttempt};
use fgos_execution_engine::assignment_runner::execute::{
    execute_assignment, ExecuteError, ExecuteOptions,
};
use fgos_execution_engine::unit_run::host::{
    AttemptRef, ControlHeld, GitRoots, SeatDispatch, UnitControl, UnitRunHost,
};
use fgos_execution_engine::unit_run::run_unit_contract::RunUnitError;
use fgos_execution_engine::unit_run::verify::Verified;
use fgos_git::{GitDriver, RepoHandle};
use fgos_holder_lock::Handle;
use fgos_run_supervisor::controller::cancel;
use fgos_run_supervisor::controller::config::read_cancel_wait_ms;
use fgos_run_supervisor::controller::launch::AttemptHost;
use serde_json::{json, Value};

use super::execution::HostExecution;
use super::{accounts, checks, handoff, machine, persona, records, verify};

/// A callback of the caller (`onUnitRunCreated`, `onCaseAdmitted`).
pub type Notify = Box<dyn Fn(&str, &str) + Send + Sync>;

/// One unit run's machine: the caller's admission port and callbacks, the session it binds in, the account store
/// it leases from, and the host binary and payload its attempts run with.
pub struct HostUnitRun<A: CaseAdmission> {
    pub admission: Option<A>,
    /// `onUnitRunCreated(unitRunId)`, told with an empty second argument.
    pub on_unit_run_created: Option<Notify>,
    /// `onCaseAdmitted({ caseId, reservationId })`.
    pub on_case_admitted: Option<Notify>,
    /// `options.session`: `{ headless, hasNativeAgent, postureAtLaunch, pathEnv, herdrPresent }`.
    pub session: Value,
    /// `options.providerCapacityRuntimeDir`.
    pub runtime_dir: Option<PathBuf>,
    pub attempt_host: AttemptHost,
    /// The origins of the runner config the run loaded last, for the collaboration's layer names.
    origins: Mutex<Option<Value>>,
}

impl<A: CaseAdmission> HostUnitRun<A> {
    pub fn new(admission: Option<A>, session: Value, attempt_host: AttemptHost) -> Self {
        Self {
            admission,
            on_unit_run_created: None,
            on_case_admitted: None,
            session,
            runtime_dir: None,
            attempt_host,
            origins: Mutex::new(None),
        }
    }

    fn payload_root(&self) -> PathBuf {
        PathBuf::from(&self.attempt_host.payload_root)
    }
}

fn bind_session_of(session: &Value) -> BindSession {
    let flag = |key: &str| session.get(key) == Some(&Value::Bool(true));
    BindSession {
        headless: flag("headless"),
        has_native_agent: flag("hasNativeAgent"),
        posture_at_launch: flag("postureAtLaunch"),
    }
}

/// An assignment runner refusal as the `run-unit` error the caller rethrows.
fn execute_error(error: ExecuteError) -> RunUnitError {
    match error {
        ExecuteError::Config(e) => {
            let mut out = RunUnitError::config(e.message, e.code.as_deref(), e.phase.as_deref());
            for (key, value) in e.facts.iter() {
                out = out.with(key, value.clone());
            }
            out
        }
        ExecuteError::Dispatch(e) => RunUnitError::dispatch(&e),
        ExecuteError::Admission(e) => {
            let mut out = RunUnitError::config(e.message, e.code, e.phase);
            for (key, value) in e.facts.iter() {
                out = out.with(key, value.clone());
            }
            out
        }
    }
}

/// The cancel handlers this process holds for the unit runs in it, and how many runs hold them.
static CANCEL_HOLD: Mutex<(usize, Option<Box<dyn std::any::Any + Send>>)> = Mutex::new((0, None));

/// One unit run's hold on the cancel handlers; the last one dropped removes them.
pub struct CancelHold(bool);

impl Drop for CancelHold {
    fn drop(&mut self) {
        if !self.0 {
            return;
        }
        let mut held = CANCEL_HOLD.lock().unwrap_or_else(|p| p.into_inner());
        held.0 -= 1;
        if held.0 == 0 {
            held.1 = None;
        }
    }
}

/// `holdCancelOnSignal(options)` (`src/runner/execution/run.mjs:259`): a process that asked for it
/// (`enable_cancel_on_signal`) has Ctrl-C and SIGTERM (Ctrl-Break on a Windows console) cancel every attempt it
/// delivered; one handler serves all its
/// units, installed with the first with the project's `dispatch.cancelWaitMs` and removed with the last.
pub fn hold_cancel_on_signal(options: &Value) -> Result<CancelHold, RunUnitError> {
    if !cancel::cancel_on_signal_enabled() {
        return Ok(CancelHold(false));
    }
    let mut held = CANCEL_HOLD.lock().unwrap_or_else(|p| p.into_inner());
    if held.0 == 0 {
        let project_root = options
            .get("repoRoot")
            .and_then(Value::as_str)
            .map(PathBuf::from)
            .or_else(|| {
                let cwd = options
                    .get("cwd")
                    .and_then(Value::as_str)
                    .map(PathBuf::from)
                    .or_else(|| std::env::current_dir().ok())?;
                machine::git_roots(&cwd, false)
                    .ok()
                    .map(|r| r.main_checkout_root)
            });
        let wait_ms = read_cancel_wait_ms(project_root.as_deref())
            .map_err(|e| RunUnitError::config(e.to_string(), None, None))?;
        held.1 = Some(Box::new(cancel::install_cancel_on_signal(wait_ms)));
    }
    held.0 += 1;
    Ok(CancelHold(true))
}

impl<A: CaseAdmission + Sync> HostUnitRun<A> {
    /// `runUnit(options)` (`src/runner/execution/run.mjs:177`): engine `run_unit` over this host, holding the
    /// cancel handlers for as long as the run lasts.
    pub fn run_unit(&self, options: &Value) -> Result<Value, RunUnitError> {
        // A cancelled controller starts nothing: the engine refuses before any handler is held.
        let _hold = if self.cancelled() {
            None
        } else {
            Some(hold_cancel_on_signal(options)?)
        };
        fgos_execution_engine::unit_run::run::run_unit(options, self)
    }

    /// `contextRefsOf` (`src/runner/execution/run.mjs:973`): the unit's resolved inputs and the reports earlier seats
    /// handed this one; a blind seat gets what lies in the run state as copies in its own directory, and an own-seat
    /// input is copied in whether the unit is blind or not.
    fn context_refs(&self, seat: &SeatDispatch<'_>) -> Result<Vec<String>, RunUnitError> {
        let mut refs: Vec<String> = Vec::new();
        let resolved = seat
            .unit_record
            .get("resolvedInputs")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .filter_map(Value::as_str)
            .map(str::to_string);
        for reference in resolved.chain(handoff::report_refs_of(seat.inputs, seat.main_root)?) {
            if !refs.contains(&reference) {
                refs.push(reference);
            }
        }
        if seat.unit.get("blind") == Some(&Value::Bool(true)) {
            let in_run: Vec<String> = refs
                .iter()
                .filter(|r| handoff::hidden_from_blind(r, seat.main_root))
                .cloned()
                .collect();
            let mut entries: Vec<Value> = seat
                .unit_record
                .get("inputMap")
                .and_then(Value::as_array)
                .cloned()
                .unwrap_or_default();
            let offset = entries.len();
            for (i, source) in in_run.iter().enumerate() {
                entries.push(json!({
                    "name": handoff::plain_name(offset + i, Path::new(source), seat.main_root),
                    "source": source,
                }));
            }
            refs.retain(|r| !in_run.contains(r));
            refs.extend(handoff::copy_handoffs_into(seat.assignment_dir, &entries)?);
        }
        let own_seat = seat
            .unit
            .get("inputs")
            .and_then(Value::as_array)
            .is_some_and(|inputs| {
                inputs
                    .iter()
                    .filter_map(Value::as_str)
                    .any(fgos_execution::handoff::is_seat_input)
            });
        if own_seat {
            let ask = json!({
                "seat": seat.seat.get("seat"),
                "accept": seat.unit_record.get("acceptedReports").cloned().unwrap_or_else(|| json!([])),
            });
            let mine = handoff::resolve_inputs(
                seat.unit.get("inputs").unwrap_or(&Value::Null),
                seat.main_root,
                &ask,
            )?;
            let entries = mine["inputMap"].as_array().cloned().unwrap_or_default();
            refs.extend(handoff::copy_handoffs_into(seat.assignment_dir, &entries)?);
        }
        Ok(refs)
    }
}

impl<A: CaseAdmission + Sync> UnitRunHost for HostUnitRun<A> {
    type Admission = A;
    fn admission(&self) -> Option<&A> {
        self.admission.as_ref()
    }
    fn on_unit_run_created(&self, unit_run_id: &str) {
        if let Some(notify) = &self.on_unit_run_created {
            notify(unit_run_id, "");
        }
    }
    fn on_case_admitted(&self, case_id: &str, reservation_id: &str) {
        if let Some(notify) = &self.on_case_admitted {
            notify(case_id, reservation_id);
        }
    }
    /// `assertNotCancelled` (`src/run-supervisor/cancel-registry.mjs`): a signal asked this controller to cancel.
    fn cancelled(&self) -> bool {
        cancel::assert_not_cancelled().is_err()
    }

    fn git_roots(&self, cwd: &Path, allow_no_repository: bool) -> Result<GitRoots, String> {
        machine::git_roots(cwd, allow_no_repository)
    }
    fn fgos_dir(&self, main_root: &Path) -> PathBuf {
        machine::fgos_dir(main_root)
    }
    fn sweep_attempts(&self, assignments_root: &Path) {
        machine::sweep_attempts(assignments_root);
    }
    fn load_runner_config(&self, main_root: &Path) -> Result<Value, RunUnitError> {
        let (config, origins) = machine::load_runner_config_with_origins(main_root)?;
        if let Ok(mut held) = self.origins.lock() {
            *held = Some(origins);
        }
        Ok(config)
    }
    fn herdr_present(&self) -> bool {
        self.session
            .get("herdrPresent")
            .and_then(Value::as_bool)
            .unwrap_or_else(machine::herdr_present)
    }
    fn git_writer(&self) -> String {
        machine::git_writer()
    }
    fn created_by(&self) -> String {
        machine::created_by()
    }
    fn shipped_catalog(&self) -> Value {
        machine::shipped_catalog()
    }
    fn git(&self, worktree: &Path, main_root: &Path) -> Result<(GitDriver, RepoHandle), String> {
        machine::git(worktree, main_root)
    }

    fn read_unit_source(&self, options: &Value) -> Result<Value, RunUnitError> {
        records::read_unit_source(options)
    }
    fn check_unit_file(&self, raw: &Value) -> Result<(), RunUnitError> {
        records::check_unit_file(raw)
    }
    fn validate_unit(&self, raw: &Value) -> Result<Value, RunUnitError> {
        checks::validate_unit(raw)
    }
    fn existing_plan_ref(
        &self,
        plan: Option<&Value>,
        main_root: &Path,
    ) -> Result<(), RunUnitError> {
        checks::existing_plan_ref(plan, main_root)
    }
    fn resolve_collaboration(&self, ask: &Value) -> Result<Value, RunUnitError> {
        let origins = self.origins.lock().ok().and_then(|held| held.clone());
        checks::resolve_collaboration(ask, &machine::shipped_catalog(), origins.as_ref())
    }
    fn declared_operation_fields(
        &self,
        declared: &Value,
        task_spec_root: Option<&Path>,
    ) -> Result<Value, RunUnitError> {
        checks::declared_operation_fields(declared, task_spec_root)
    }
    fn is_main_checkout(&self, worktree: &Path) -> bool {
        machine::is_main_checkout(worktree)
    }
    fn assert_run_timeout(&self, value: &Value) -> Result<(), RunUnitError> {
        checks::assert_run_timeout(value)
    }
    fn door_choices(
        &self,
        unit: &Value,
        runner: &Value,
        options: &Value,
        collaboration: &Value,
    ) -> Result<(), RunUnitError> {
        accounts::door_choices(unit, runner, options, collaboration)
    }
    fn persona_pin(
        &self,
        persona: &str,
        main_root: &Path,
        scope: Option<&Value>,
    ) -> Result<Option<Value>, RunUnitError> {
        persona::persona_pin(persona, main_root, &self.payload_root(), scope)
    }
    fn resolve_inputs(
        &self,
        inputs: &Value,
        main_root: &Path,
        ask: &Value,
    ) -> Result<Value, RunUnitError> {
        handoff::resolve_inputs(inputs, main_root, ask)
    }
    fn expand_generated(&self, writes: &Value, generated: &Value) -> Value {
        records::expand_generated(writes, generated)
    }
    fn acquire_unit_control(
        &self,
        unit_dir: &Path,
        unit_run_id: &str,
    ) -> Result<Box<dyn UnitControl>, ControlHeld> {
        records::acquire_unit_control(unit_dir, unit_run_id)
    }

    fn is_seat_record(&self, record: &Value) -> bool {
        records::is_seat_record(record)
    }
    fn collaboration_of_record(&self, record: &Value) -> Result<(Value, Value), RunUnitError> {
        Ok(records::collaboration_of_record(
            record,
            &machine::shipped_catalog(),
        ))
    }
    fn adopt_state(&self, run_dir: &Path) -> String {
        records::adopt_state(run_dir)
    }
    fn current_attempt(
        &self,
        assignments_dir: &Path,
        assignment_id: &str,
    ) -> Result<Option<AttemptRef>, RunUnitError> {
        records::current_attempt(assignments_dir, assignment_id)
    }
    fn pinned_accounts_usable(
        &self,
        seats: &[Value],
        runner: &Value,
        what: &str,
    ) -> Result<(), RunUnitError> {
        accounts::pinned_accounts_usable(seats, runner, what, self.runtime_dir.as_deref())
    }

    fn bind(
        &self,
        ask: &Value,
        runner: &Value,
        session: &Value,
        accounts_ask: &Value,
        walk: &Value,
    ) -> Result<Value, RunUnitError> {
        accounts::bind(ask, runner, session, accounts_ask, walk)
    }
    fn runner_config_for_binding(&self, runner: &Value, bound: &Value) -> Value {
        accounts::runner_config_for_binding(runner, bound)
    }

    fn dispatch_seat(&self, seat: &SeatDispatch<'_>) -> Result<Value, RunUnitError> {
        let context_refs = self.context_refs(seat)?;
        let unit_run_id = seat
            .unit_record
            .get("unitRunId")
            .and_then(Value::as_str)
            .map(str::to_string)
            .or_else(|| seat.assignment_id.split('/').next().map(str::to_string))
            .unwrap_or_default();
        let round = json!(seat.round);
        let writes = Value::Array(seat.write_scope.to_vec());
        let assignment = build_unit_run_assignment(
            seat.unit_record,
            &unit_run_id,
            seat.declared_op.unwrap_or(&Value::Null),
            seat.seat_unit,
            &SeatAttempt {
                seat: seat.seat,
                round: &round,
                read_only: seat.read_only,
                bound: seat.bound,
                assignment_id: seat.assignment_id,
                objective: seat.objective,
                context_refs: &json!(context_refs),
                carries_operation: seat.carries_operation,
                writes: &writes,
            },
        );
        let admission_text = |key: &str| {
            seat.admission
                .get(key)
                .and_then(Value::as_str)
                .map(str::to_string)
        };
        let worktree = seat
            .unit_record
            .get("worktree")
            .and_then(Value::as_str)
            .map(PathBuf::from);
        let options = ExecuteOptions {
            cwd: worktree,
            repo_root: Some(seat.main_root.to_path_buf()),
            runner_config: Some(seat.runner_config.clone()),
            binding: Some(seat.bound.clone()),
            timeout_ms: seat.bound.get("timeoutMs").and_then(Value::as_u64),
            is_read_only_mode: Some(seat.read_only),
            operations: seat
                .carries_operation
                .then(|| seat.unit_record.pointer("/declared/operations"))
                .flatten()
                .and_then(Value::as_array)
                .cloned(),
            pin_inputs: if seat.carries_operation {
                seat.unit_record
                    .get("pinInputs")
                    .and_then(Value::as_array)
                    .into_iter()
                    .flatten()
                    .filter_map(Value::as_str)
                    .map(str::to_string)
                    .collect()
            } else {
                Vec::new()
            },
            retry_id: admission_text("retryId"),
            predecessor_run_id: admission_text("predecessorRunId"),
            destination: admission_text("destination"),
            payload_digest: admission_text("payloadDigest"),
            custody: seat.custody,
            provider_capacity_runtime_dir: self.runtime_dir.clone(),
            committed_runner_config: Some(seat.committed_runner_config.clone()),
            session: bind_session_of(seat.session),
            case_context: seat
                .case_context
                .map(|(case, reservation)| (case.to_string(), reservation.to_string())),
            blind: seat.unit.get("blind") == Some(&Value::Bool(true)),
            // Seats launched together as one group: their panes share the tab in equal parts.
            dispatch_batch_size: seat
                .batch_size
                .filter(|size| *size > 1)
                .and_then(|size| u32::try_from(size).ok()),
            ..ExecuteOptions::default()
        };
        let mut stage_session = self.session.clone();
        if let (Some(target), Some(stated)) =
            (stage_session.as_object_mut(), seat.session.as_object())
        {
            target.extend(stated.clone());
        }
        let ports = HostExecution::new(self.attempt_host.clone(), &stage_session)
            .map_err(|e| RunUnitError::other("git-error", e))?;
        let mut on_chunk = |_: &str, _: &str| {};
        execute_assignment(&assignment, &options, &ports, &mut on_chunk)
            .map(|interpreted| interpreted.record)
            .map_err(execute_error)
    }
    fn account_rotation(&self, runner: &Value, pool: &str) -> Option<Rotation> {
        accounts::account_rotation(runner, pool, self.runtime_dir.as_deref())
    }
    fn audit_lease_receipt(&self, receipt: Option<&Value>, assignment_id: &str) -> Option<String> {
        accounts::audit_lease_receipt(receipt, assignment_id, self.runtime_dir.as_deref())
    }
    fn drop_assignment_record(&self, assignment_id: &str) {
        accounts::drop_assignment_record(assignment_id, self.runtime_dir.as_deref());
    }
    fn admission_generations(&self, dir: &Path) -> Result<Vec<Value>, RunUnitError> {
        records::admission_generations(dir)
    }
    fn report_digest(&self, result: &Value, main_root: &Path) -> Value {
        handoff::report_digest(result, main_root)
    }
    fn verify(
        &self,
        command: &str,
        cwd: &Path,
        timeout_ms: Option<u64>,
        custody: Option<&Handle>,
    ) -> Verified {
        verify::verify(command, cwd, timeout_ms, custody)
    }
    fn publish_unit_summary(&self, unit_dir: &Path) -> Result<(), String> {
        records::publish_unit_summary(unit_dir, &machine::shipped_catalog())
    }
}
