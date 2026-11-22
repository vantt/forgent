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

pub mod account_pin;
pub mod accounts;
pub mod admission;
pub mod agents;
pub mod bind;
pub mod case_paths;
pub mod checks;
pub mod custody;
pub mod decide;
pub mod dispatch_policy;
pub mod executor_config;
pub mod executor_model;
pub mod explain;
pub mod handoff;
pub mod hook;
pub mod hosts;
mod js;
pub mod loops;
pub mod machine_reads;
pub mod outcome;
pub mod patterns;
pub mod ports;
pub mod record_facts;
pub mod run_facts;
pub mod run_request;
pub mod run_unit_contract;
pub mod runner_check;
pub mod runner_config;
pub mod seat_resolver;
pub mod tier_cell;
pub mod tools;
pub mod unit;
pub mod unit_record;
