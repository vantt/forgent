//! Settlement: the end of a round. It turns what an attempt left (the worker's claim and report, the checkout
//! before and after, the process facts) into the Run Result and commits it under the run control ledger.
//!
//! The record shapes and the outcome derivation stay in `run_result` (no second writer); the control ledger and
//! the proof publication are the run supervisor's; provider faults go to `accounts`. Golden vectors:
//! `packages/execution/contracts/settlement/`, replayed by `tests/settlement.rs`.

pub mod evidence;
pub mod pipeline;
pub mod ports;

pub use evidence::{
    bound_frictions, classify_evidence_to_outcome_facts, compute_changed_files, declare_report,
    declared_scope_of, find_mutated_dirty_before_files, is_substantive_report_text,
    read_worker_artifacts, with_launch_facts, ChangedFiles, DeclaredScope, EvidenceFacts,
    EvidenceInput, WorkerArtifacts,
};
pub use pipeline::{
    commit_run_settlement, ran_confinement_backend, settle_refused_lease, settle_run_outcome,
    usage_request_of, LeaseRefusal, RefusedLease, SettleInput, Settled, SettlementError,
    SettlementPorts,
};
pub use ports::{
    AccountsFaultSink, FaultRecordInput, FrictionSink, GitDoor, ObserveFrictionSink,
    ProviderFaultSink, SettlementGit,
};
