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
//! * [`custody`]: a worktree's custody, over the run supervisor's lease.
//! * [`git_port`]: the scoped commit and the sync merge, through the `fgos-git` port.
//! * [`consent`]: the admission consent checked again just before a writing round commits.
//! * [`peer`]: the framed admission peer channel and its `CaseAdmission` adapter.
//! * [`run_unit_contract`]: the `run-unit` request and result and the error type tags.
//! * [`start`]: admission of a new unit run, or the resume of one, refused by name before any seat binds.
//! * [`run`]: the run loop, `run_unit`, over the pure loops and the host's assignment runner.
//! * [`provider_limit`]: what a seat does after a provider limit or a lost brief.
//! * [`history`]: the settled seat rounds read back from a unit run directory.
//! * [`record`]: the `unit.json` bytes, through the durable-file door.
//! * [`host`]: what the run asks of the machine around it.
//!
//! Golden vectors: `packages/execution/contracts/unit-run/`; the peer's contract:
//! `packages/execution/contracts/admission-peer/admission-peer.v1.json`.

// A refusal is the `run-unit` error document a caller reads (tag, class, code, message, phase, refusal), returned
// whole across every port; boxing it would only move the same fields behind a pointer at each call.
#![allow(clippy::result_large_err)]

pub mod commit_subject;
pub mod consent;
pub mod custody;
pub mod git_port;
pub mod history;
pub mod host;
pub mod partial_writes;
pub mod peer;
pub mod provider_limit;
pub mod record;
pub mod run;
pub mod run_unit_contract;
pub mod start;
pub mod sync;
pub mod verify;
