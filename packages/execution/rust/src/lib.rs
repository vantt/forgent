//! `fgos-execution`: Execution's read door.
//!
//! The crate says what an executor entry of `runner.executors` means and which facts follow from it (the
//! contract is `docs/platform/runner/contracts/executor-model.md`, proven by the vectors of
//! `packages/execution/contracts/executor-model.v1.json`). Later modules compose those facts into the bind, the
//! dispatch decision, the agents listing and the doctor judgements.
//!
//! What it decides: what an executor is, which family, mechanism, login store, effort levels and posture it has,
//! whether governance or a missing program rules it out. What it never decides: which executor, model, tier or
//! account a seat takes (Seat Binding ranks, `fgos-seat-binding`), nor how a Unit is launched, leased or settled
//! (Dispatch). The crate is pure: no file, clock, environment or process. The machine facts a derivation needs
//! come through the one trait the host implements, [`ports::Machine`].

pub mod accounts;
pub mod agents;
pub mod decide;
pub mod executor_model;
pub mod hook;
pub mod ports;
pub mod runner_check;
pub mod tools;
