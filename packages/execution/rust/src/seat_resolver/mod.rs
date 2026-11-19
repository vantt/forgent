//! Seat resolution for a Unit: the one place that says which seats a Unit's pattern fills (pure: no file, clock
//! or state). Execution, the binding simulation, doctor and admission's launch counting all ask here, so they
//! list the same seats in the same order; it is also the one authority for effective rigor and checker
//! composition. A seat is `{ seat, role, posture }`: its id in one unit run, what it does for the pattern, and
//! how it may run. Records stay `serde_json::Value`: their shape is open and the order of keys is part of them.

mod capability;
mod legacy;
mod resolve;
mod seat_ledger;
pub(crate) mod value;

pub use capability::{
    capability_rigor_of, capability_verify_of, min_checkers_of, own_min_checkers_of,
    resolve_stronger_rigor, rigor_rank,
};
pub use legacy::{
    collaboration_of_record, is_seat_record, is_verdict_result, is_verify_result, legacy_family_of,
    legacy_seats_of, seat_key_of, seats_of_record,
};
pub use resolve::{
    assert_no_seat_tier, assert_no_unit_tier, bind_seat_of, check_declared_seats, checker_plan_of,
    effective_rigor_of, requires_distinct_families, resolve_seats, seat_kind, seat_launches_of,
    seat_of_record, workflow_tier_of, CheckerPlanEntry, PlanOptions, ResolveOptions, CHECKER_SEATS,
    LOOP_NAMES, RESERVED_SEAT_IDS, SEAT_ROLES, SYNC_SEAT, VERIFY_SEAT,
};
pub use seat_ledger::{BindBarrier, SeatLedger};

/// Thrown when a unit's pattern cannot be given a valid seat list; also the `RangeError` Node threw for an
/// unknown rigor (`class` tells them apart, `code` is empty for the latter).
#[derive(Debug, Clone, PartialEq)]
pub struct SeatResolutionError {
    pub class: &'static str,
    pub code: String,
    pub message: String,
    pub at: Option<String>,
    pub detail: Option<String>,
}

impl SeatResolutionError {
    pub fn new(message: impl Into<String>, code: &str) -> Self {
        SeatResolutionError {
            class: "SeatResolutionError",
            code: code.to_string(),
            message: message.into(),
            at: None,
            detail: None,
        }
    }

    /// A plain `Error` that carries a stable `code` (what Node threw for a missing `maxRounds`).
    pub fn plain(message: impl Into<String>, code: &str) -> Self {
        SeatResolutionError {
            class: "Error",
            code: code.to_string(),
            message: message.into(),
            at: None,
            detail: None,
        }
    }

    pub(crate) fn range(message: String) -> Self {
        SeatResolutionError {
            class: "RangeError",
            code: String::new(),
            message,
            at: None,
            detail: None,
        }
    }
}

impl std::fmt::Display for SeatResolutionError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for SeatResolutionError {}
