//! Run result: writing and reading the result a worker leaves, and attributing what a run changed.
//!
//! The record shapes and the outcome derivation live in `fgos-run-result`; this module is the engine's writer and
//! readers over them (no second outcome type), the attribution of stray writes, and the contract of the worker's
//! own claim. Golden vectors: `packages/execution/contracts/run-result/`, replayed by `tests/run_result.rs`.

pub mod attribution;
pub mod claim;
mod js;
pub mod reader;
pub mod vocabulary;
pub mod writer;

pub use attribution::{
    attribute_claim_evidence_refs, attribute_workspace_changes, evaluate_attribution_policy,
    Attribution, AttributionWarning, ClaimRefAttribution, Disposition, FirstObserved, Level,
    PolicyInput, PolicyVerdict, WorkspaceObservation,
};
pub use claim::{
    claim_report_path, is_assessment_required, is_verdict_seat,
    render_agent_result_claim_instructions, validate_agent_result_claim_contract, ClaimContext,
    ClaimValidation,
};
pub use reader::{
    corrupt_classification, interpret_run_result, interpret_run_result_file, legacy_confidence,
    legacy_status, read_settled_result, run_outcome, validate_run_result_v2,
    validate_run_result_v3, InterpretedRunResult, ReadError, RunOutcome, Validation,
};
pub use writer::normalize_run_result_v3;
