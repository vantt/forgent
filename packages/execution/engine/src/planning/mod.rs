//! Dispatch planning: the planners and resolutions a dispatch is planned from, and the facade every seat bind goes
//! through.
//!
//! - [`bind_facade`]: one seat, one answer, over `fgos-execution::bind` in process (`unit_run` and
//!   `assignment_runner` call it); the ask, the walk, the bypass fence, the Work seat, explain, preflight and the
//!   dry bind.
//! - [`policy`]: the effective dispatch policy of an assignment, each field with where it came from
//!   (`fgos-execution::dispatch_policy`, bound through this facade).
//! - [`resolve`]: the capability a dispatch is for, and the executor block a name resolves to with its
//!   cross-provider governance gate (`fgos-execution::executor_config`, the one `decide` judges by).
//! - [`recovery`]: the pure recovery-recommendation planner over an already-read snapshot.
//! - [`admission`]: the atomic admission of one Run attempt and its run directory.
//! - [`reconciliation`]: plan and apply of one narrow guard or projection repair, bound to the facts it was made
//!   from.
//!
//! One door per decision. Which executor a purpose runs on is `fgos-execution`'s (`decide`, `bind`); the executor
//! registry reads, the provider family and the capability catalog reads are `fgos-execution::executor_model`'s; the
//! admission ledger, the control probe and the per-cwd lock are `fgos-run-supervisor`'s; the canonical form of a
//! hashed value is `fgos-canonical-json`'s; the civil-time arithmetic is `fgos_host_runtime::civil_time`'s; a durable
//! file write is `fgos-durable-file`'s. This module adds only what has no other owner.
//!
//! Not here: the selectors of `compileDispatchPlan` (an executor id, a purpose, a Work hint, an assignment) are
//! `fgos_execution::decide`'s, not a second selector; the runtime inspection a reconciliation reads is the
//! transport round's (it arrives through [`reconciliation::RuntimeView`]).
//!
//! Golden vectors: `packages/execution/contracts/planning/`, replayed by `tests/planning.rs`.

pub mod admission;
pub mod bind_facade;
pub mod policy;
pub mod reconciliation;
pub mod recovery;
/// The capability a dispatch is for is pure, in `fgos-execution`.
pub use fgos_execution::capability_resolve as resolve;

/// JavaScript truthiness of a JSON value (`undefined` is `None`).
pub(crate) fn truthy(value: Option<&serde_json::Value>) -> bool {
    crate::assignment::truthy(value)
}
