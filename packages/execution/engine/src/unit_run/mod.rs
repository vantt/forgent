//! Unit run: the one door that runs a Unit end to end.
//!
//! What lives here is what the Node `src/runner/execution/` files `commit-unit-work`, `unit-sync`,
//! `custody-door` and `partial-writes` decide, plus the admission peer: the one S6a adapter of the
//! `CaseAdmission` trait of `fgos-execution`. The unit-run record reads (`unit_run_facts`, `judge_unit_run`) and
//! the loops stay in `fgos-execution` (one owner each); this module runs their commands and carries their answers.
//!
//! * [`commit_subject`]: the runner's commit subject and the sync subject.
//! * [`sync`]: what a unit's `syncBase` record says (pure: scope, brief, summary, a sync-only pass).
//! * [`verify`]: the verify command's verdict and what a loop's `verify` hook is told.
//! * [`partial_writes`]: did a seat of a writing unit change the worktree before it stopped.
//! * [`consent`]: the admission consent checked again just before a writing round commits.
//! * [`peer`]: the framed admission peer channel and its `CaseAdmission` adapter.
//! * [`run_unit_contract`]: the `run-unit` request and result and the error type tags.
//!
//! Golden vectors: `packages/execution/contracts/unit-run/`; the peer's contract:
//! `packages/execution/contracts/admission-peer/admission-peer.v1.json`.

pub mod commit_subject;
pub mod consent;
pub mod partial_writes;
pub mod peer;
pub mod run_unit_contract;
pub mod sync;
pub mod verify;
