//! Operation catalog for `fgos-host-runtime`.
//!
//! Kernel §5: The catalog is an authority-bearing inventory of `OperationDescriptor`s,
//! authored by owning components.
//!
//! In R1, the catalog is a `const` array holding exactly `distribution.build.show`
//! and one fixture operation `test.fixture.echo`.

use crate::contracts::{
    ContractRef, OperationDescriptor, OperationEffect, OperationId, OperationIdempotency,
    StreamingMode,
};
use std::borrow::Cow;

/// Canonical operation catalog holding exactly `distribution.build.show`
/// and fixture `test.fixture.echo`.
pub const CATALOG: &[OperationDescriptor] = &[
    OperationDescriptor {
        operation_id: OperationId::from_static("distribution.build.show"),
        owning_component_id: Cow::Borrowed("distribution"),
        request_contract: ContractRef::from_static("distribution.build.show.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("distribution.build.show.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("distribution.read"),
        allowed_host_kinds: &["cli", "remote"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("test.fixture.echo"),
        owning_component_id: Cow::Borrowed("test"),
        request_contract: ContractRef::from_static("test.fixture.echo.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("test.fixture.echo.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("test.read"),
        allowed_host_kinds: &["cli", "remote", "test"],
        streaming_mode: StreamingMode::None,
    },
];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn catalog_contains_required_operations() {
        assert_eq!(CATALOG.len(), 2);
        let ids: Vec<&str> = CATALOG.iter().map(|op| op.operation_id.as_str()).collect();
        assert!(ids.contains(&"distribution.build.show"));
        assert!(ids.contains(&"test.fixture.echo"));
    }

    /// `OperationId::from_static` (used by every `CATALOG` entry, for
    /// const-context construction with no runtime allocation) skips
    /// `OperationId::parse`'s validation by design -- it is a trusted
    /// constructor for literals the codebase author already controls, not a
    /// public input boundary. This test is the safety net that catches a
    /// future typo in a `from_static` literal: every id `CATALOG` ships must
    /// still independently re-parse cleanly through the validating path.
    #[test]
    fn every_catalog_operation_id_reparses_through_the_validating_parser() {
        for op in CATALOG {
            let raw = op.operation_id.as_str();
            crate::contracts::OperationId::parse(raw)
                .unwrap_or_else(|e| panic!("CATALOG entry '{raw}' fails validation: {e}"));
        }
    }
}
