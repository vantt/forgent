//! The closed vocabularies of a Run Result and the contract it is written under.

pub const RUN_RESULT_CONTRACT_ID: &str = "assignment-run-result";
/// The one version the writer produces; readers also accept [`RUN_RESULT_CONTRACT_VERSION_V2`].
pub const RUN_RESULT_CONTRACT_VERSION: u64 = 3;
pub const RUN_RESULT_CONTRACT_VERSION_V2: u64 = 2;

pub const EXECUTION_STATUSES: [&str; 4] =
    ["completed", "failed", "cancelled", "completion-unknown"];
pub const ASSESSMENT_VERDICTS: [&str; 5] = [
    "pass",
    "findings",
    "blocked",
    "inconclusive",
    "not-applicable",
];
pub const CONFIDENCE_LEVELS: [&str; 5] =
    ["verified", "reported", "inferred", "no-evidence", "failed"];
pub const FAILURE_FAMILIES: [&str; 6] = [
    "provider",
    "resource",
    "contract",
    "policy",
    "external-interference",
    "unknown",
];
pub const POLICY_DISPOSITIONS: [&str; 4] = ["allow", "refuse", "needs-input", "not-applicable"];
pub const DELIVERY_MODES: [&str; 5] = [
    "fresh",
    "resumed",
    "replayed",
    "recovered",
    "legacy-derived",
];
pub const PROVENANCE_VALUES: [&str; 4] = [
    "native-v2",
    "native-v3",
    "legacy-derived",
    "contract-corrupt",
];
pub const RECOGNIZED_LEGACY_STATUSES: [&str; 4] = ["done", "failed", "blocked", "no-evidence"];

/// The failure code a run settles with when its lease was refused because the account Seat Binding named could not
/// be taken. Any other capacity refusal settles as `provider-capacity-refused`; a record written before this code
/// existed keeps that one.
pub const LEASE_CONFLICT_FAILURE_CODE: &str = "provider-capacity-lease-conflict";
