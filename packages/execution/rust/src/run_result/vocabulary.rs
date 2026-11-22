//! The closed vocabularies of a Run Result and the contract it is written under: owned by `fgos-run-result`.

pub use fgos_run_result::{
    ASSESSMENT_VERDICTS, CONFIDENCE_LEVELS, DELIVERY_MODES, EXECUTION_STATUSES, FAILURE_FAMILIES,
    POLICY_DISPOSITIONS, PROVENANCE_VALUES, RECOGNIZED_LEGACY_STATUSES, RUN_RESULT_CONTRACT_ID,
    RUN_RESULT_CONTRACT_VERSION, RUN_RESULT_CONTRACT_VERSION_V2,
};

/// The failure code a run settles with when its lease was refused because the account Seat Binding named could not
/// be taken. Any other capacity refusal settles as `provider-capacity-refused`; a record written before this code
/// existed keeps that one.
pub const LEASE_CONFLICT_FAILURE_CODE: &str = "provider-capacity-lease-conflict";
