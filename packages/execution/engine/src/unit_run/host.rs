//! What the unit run asks of the machine around it: the host wires each port to the door that owns it (phase 19
//! composes them in `apps/fgos`). The loop itself ([`super::run`]) owns no effect but the unit-run record and the
//! doors already on this crate: the Git door ([`super::git_port::UnitGit`]), the custody lease
//! (`fgos-run-supervisor` `cwd_lock`), the durable file, the case admission port and the history reader.
//!
//! A port is named for the Node function it stands for, so the caller can find the door that answers it.

use std::path::{Path, PathBuf};

use fgos_execution::admission::CaseAdmission;
use fgos_git::{GitDriver, RepoHandle};
use fgos_holder_lock::Handle;
use serde_json::Value;

use super::run_unit_contract::RunUnitError;
use super::verify::Verified;
use crate::accounts::rotation::Rotation;

/// Where a run is: the worktree and its main checkout (`resolveGitRoots`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GitRoots {
    pub worktree_root: PathBuf,
    pub main_checkout_root: PathBuf,
    pub is_linked_worktree: bool,
    /// A read-only caller in a directory that is no repository: that directory is its own project root.
    pub not_a_repository: bool,
}

/// The one controller of a unit run (`acquireUnitControl`), released once the run ends.
pub trait UnitControl: Send {
    fn release(&mut self) -> Result<(), String>;
}

/// Why the unit control was not taken: another live controller drives the run.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ControlHeld {
    pub holder_pid: Option<u32>,
}

/// The run directory an assignment's dispatch ended on (`currentAttemptOf`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AttemptRef {
    pub dir: PathBuf,
    pub run_id: String,
}

/// One dispatch of a bound seat: what `dispatchBound` hands the assignment runner.
pub struct SeatDispatch<'a> {
    pub unit_record: &'a Value,
    pub unit: &'a Value,
    pub main_root: &'a Path,
    /// `{ seat, role, posture }` of the seat.
    pub seat: &'a Value,
    /// The unit the seat runs (the loop's own for a checker seat).
    pub seat_unit: &'a Value,
    pub round: u64,
    pub read_only: bool,
    pub bound: &'a Value,
    pub assignment_id: &'a str,
    pub assignment_dir: &'a Path,
    pub objective: &'a str,
    /// What earlier seats handed this one (`role.inputs`).
    pub inputs: &'a [Value],
    /// `{ retryId, predecessorRunId, destination, payloadDigest }`.
    pub admission: &'a Value,
    /// `{ caseId, reservationId }` of the case this launch was admitted into.
    pub case_context: Option<(&'a str, &'a str)>,
    /// The runner config with the live account inventory.
    pub runner_config: &'a Value,
    /// The config read live, which the write gate replays a mutating seat's binding against.
    pub committed_runner_config: &'a Value,
    pub session: &'a Value,
    pub custody: Option<&'a Handle>,
    pub carries_operation: bool,
    /// The operation fields a unit carrying a declared operation stamps on its writer seat (`ctx.declaredOp`).
    pub declared_op: Option<&'a Value>,
    pub write_scope: &'a [Value],
    pub batch_size: Option<usize>,
}

/// The machine around one unit run.
pub trait UnitRunHost {
    /// The case admission port this run was given (`options.caseAdmission`), when any.
    type Admission: CaseAdmission;
    fn admission(&self) -> Option<&Self::Admission>;
    /// `options.onUnitRunCreated`: told once, before any seat starts.
    fn on_unit_run_created(&self, unit_run_id: &str);
    /// `options.onCaseAdmitted`.
    fn on_case_admitted(&self, case_id: &str, reservation_id: &str);
    /// Whether the run was cancelled (`assertNotCancelled`).
    fn cancelled(&self) -> bool {
        false
    }

    // ---- where the run is ---------------------------------------------------------------------------
    fn git_roots(&self, cwd: &Path, allow_no_repository: bool) -> Result<GitRoots, String>;
    fn fgos_dir(&self, main_root: &Path) -> PathBuf;
    /// Reclaim the private homes of earlier runs whose pane has closed (best effort).
    fn sweep_attempts(&self, assignments_root: &Path);
    /// The committed runner config of a project (`loadRunnerConfigForDir`).
    fn load_runner_config(&self, main_root: &Path) -> Result<Value, RunUnitError>;
    fn herdr_present(&self) -> bool;
    /// The Git writer id of this controller (`gitWriter`).
    fn git_writer(&self) -> String;
    /// `process.env.USER || 'system'`.
    fn created_by(&self) -> String;
    fn shipped_catalog(&self) -> Value;
    /// The Git door over a worktree of `main_root`.
    fn git(&self, worktree: &Path, main_root: &Path) -> Result<(GitDriver, RepoHandle), String>;

    // ---- a new unit run -----------------------------------------------------------------------------
    /// A unit given as data, or read from a file or stdin (JSON first, else YAML).
    fn read_unit_source(&self, options: &Value) -> Result<Value, RunUnitError>;
    /// A unit file names no seat or unit tier.
    fn check_unit_file(&self, raw: &Value) -> Result<(), RunUnitError>;
    fn validate_unit(&self, raw: &Value) -> Result<Value, RunUnitError>;
    /// A unit file's plan gets the check `--plan` gets.
    fn existing_plan_ref(&self, plan: Option<&Value>, main_root: &Path)
        -> Result<(), RunUnitError>;
    /// `resolveCollaboration`: `{ pin, seats, launchBound, entry }`.
    fn resolve_collaboration(&self, ask: &Value) -> Result<Value, RunUnitError>;
    /// `declaredOperationFields`: `{ dispatch, mutation, ... }`.
    fn declared_operation_fields(
        &self,
        declared: &Value,
        task_spec_root: Option<&Path>,
    ) -> Result<Value, RunUnitError>;
    /// Whether a mutating run in `worktree` would run in the main checkout.
    fn is_main_checkout(&self, worktree: &Path) -> bool;
    fn assert_run_timeout(&self, value: &Value) -> Result<(), RunUnitError>;
    /// `assertDoorChoicesBeforeRun`.
    fn door_choices(
        &self,
        unit: &Value,
        runner: &Value,
        options: &Value,
        collaboration: &Value,
    ) -> Result<(), RunUnitError>;
    /// `pinPersona`; `None` for a name no tier defines.
    fn persona_pin(
        &self,
        persona: &str,
        main_root: &Path,
        scope: Option<&Value>,
    ) -> Result<Option<Value>, RunUnitError>;
    /// `resolveUnitInputs`: `{ refs, inputMap }`.
    fn resolve_inputs(
        &self,
        inputs: &Value,
        main_root: &Path,
        ask: &Value,
    ) -> Result<Value, RunUnitError>;
    /// `expandGenerated`.
    fn expand_generated(&self, writes: &Value, generated: &Value) -> Value;
    fn acquire_unit_control(
        &self,
        unit_dir: &Path,
        unit_run_id: &str,
    ) -> Result<Box<dyn UnitControl>, ControlHeld>;

    // ---- a resumed unit run -------------------------------------------------------------------------
    /// Whether a record is keyed by seat (`isSeatRecord`).
    fn is_seat_record(&self, record: &Value) -> bool;
    /// `collaborationOfRecord`: the pin and runner config a record written before the pin decodes to.
    fn collaboration_of_record(&self, record: &Value) -> Result<(Value, Value), RunUnitError>;
    /// The state the adopt door judges a run directory in (`closed`, `legacy-run`, ...), read-only.
    fn adopt_state(&self, run_dir: &Path) -> String;
    fn current_attempt(&self, assignments_dir: &Path, assignment_id: &str) -> Option<AttemptRef>;
    /// `assertPinnedAccountsUsable`.
    fn pinned_accounts_usable(
        &self,
        seats: &[Value],
        runner: &Value,
        what: &str,
    ) -> Result<(), RunUnitError>;

    // ---- the seats ----------------------------------------------------------------------------------
    /// `bind(ask, ctx, walk)`: the binding, or `{ refused }`. `accounts` is `{ runtimeDir, assignmentId }`.
    fn bind(
        &self,
        ask: &Value,
        runner: &Value,
        session: &Value,
        accounts: &Value,
        walk: &Value,
    ) -> Result<Value, RunUnitError>;
    /// `runnerConfigForBinding`: a pinned account leases from an inventory holding only that account.
    fn runner_config_for_binding(&self, runner: &Value, bound: &Value) -> Value;
    /// Build the seat's assignment and execute it through the assignment runner; the settled Run Result.
    fn dispatch_seat(&self, seat: &SeatDispatch<'_>) -> Result<Value, RunUnitError>;
    fn account_rotation(&self, runner: &Value, pool: &str) -> Option<Rotation>;
    /// Why the receipt a passing attempt left differs from what the provider record granted, or `None`.
    fn audit_lease_receipt(&self, receipt: Option<&Value>, assignment_id: &str) -> Option<String>;
    fn drop_assignment_record(&self, assignment_id: &str);
    /// The records of an admission ledger's generations, oldest first.
    fn admission_generations(&self, dir: &Path) -> Vec<Value>;
    /// The digest of the report a result names (`reportDigestOf`).
    fn report_digest(&self, result: &Value, main_root: &Path) -> Value;
    /// The verify command run under the unit's custody.
    fn verify(
        &self,
        command: &str,
        cwd: &Path,
        timeout_ms: Option<u64>,
        custody: Option<&Handle>,
    ) -> Verified;
    /// `writeUnitSummary`.
    fn publish_unit_summary(&self, unit_dir: &Path) -> Result<(), String>;
}
