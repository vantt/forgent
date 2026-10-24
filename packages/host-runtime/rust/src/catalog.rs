//! Operation catalog for `fgos-host-runtime`.
//!
//! Kernel §5: The catalog is an authority-bearing inventory of `OperationDescriptor`s,
//! authored by owning components.
//!
//! In R1, the catalog is a `const` array holding native production reads
//! plus one fixture operation `test.fixture.echo`.

use crate::contracts::{
    ContractRef, OperationDescriptor, OperationEffect, OperationId, OperationIdempotency,
    StreamingMode,
};
use std::borrow::Cow;

/// Canonical operation catalog holding native production reads
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
        operation_id: OperationId::from_static("work.gate-bypass.show"),
        owning_component_id: Cow::Borrowed("work"),
        request_contract: ContractRef::from_static("work.gate-bypass.show.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("work.gate-bypass.show.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("work.read"),
        allowed_host_kinds: &["cli", "remote"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("convention.query"),
        owning_component_id: Cow::Borrowed("convention"),
        request_contract: ContractRef::from_static("convention.query.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("convention.query.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("convention.read"),
        allowed_host_kinds: &["cli", "remote"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("identity.writer"),
        owning_component_id: Cow::Borrowed("identity"),
        request_contract: ContractRef::from_static("identity.writer.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("identity.writer.outcome", "1.1.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("identity.read"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("identity.read"),
        owning_component_id: Cow::Borrowed("identity"),
        request_contract: ContractRef::from_static("identity.read.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("identity.read.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("identity.read"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("identity.write"),
        owning_component_id: Cow::Borrowed("identity"),
        request_contract: ContractRef::from_static("identity.write.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("identity.write.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("identity.write"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("config.read"),
        owning_component_id: Cow::Borrowed("config"),
        request_contract: ContractRef::from_static("config.read.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("config.read.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("config.read"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("config.write"),
        owning_component_id: Cow::Borrowed("config"),
        request_contract: ContractRef::from_static("config.write.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("config.write.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("config.write"),
        allowed_host_kinds: &["cli"],
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
    OperationDescriptor {
        operation_id: OperationId::from_static("observe.metrics"),
        owning_component_id: Cow::Borrowed("observe"),
        request_contract: ContractRef::from_static("observe.metrics.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("observe.metrics.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("observe.read"),
        allowed_host_kinds: &["cli", "remote"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("observe.friction"),
        owning_component_id: Cow::Borrowed("observe"),
        request_contract: ContractRef::from_static("observe.friction.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("observe.friction.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("observe.write"),
        allowed_host_kinds: &["cli", "remote"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("mailbox.send"),
        owning_component_id: Cow::Borrowed("mailbox"),
        request_contract: ContractRef::from_static("mailbox.send.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("mailbox.send.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("mailbox.write"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("mailbox.inbox"),
        owning_component_id: Cow::Borrowed("mailbox"),
        request_contract: ContractRef::from_static("mailbox.inbox.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("mailbox.inbox.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("mailbox.read"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("mailbox.inbox.claim"),
        owning_component_id: Cow::Borrowed("mailbox"),
        request_contract: ContractRef::from_static("mailbox.inbox.claim.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("mailbox.inbox.claim.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("mailbox.write"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("mailbox.list"),
        owning_component_id: Cow::Borrowed("mailbox"),
        request_contract: ContractRef::from_static("mailbox.list.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("mailbox.list.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("mailbox.read"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("mailbox.status"),
        owning_component_id: Cow::Borrowed("mailbox"),
        request_contract: ContractRef::from_static("mailbox.status.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("mailbox.status.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("mailbox.read"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn catalog_contains_required_operations() {
        // Eleven operations, plus the mailbox's send, inbox, inbox claim, list
        // and status.
        assert_eq!(CATALOG.len(), 16);
        let ids: Vec<&str> = CATALOG.iter().map(|op| op.operation_id.as_str()).collect();
        assert!(ids.contains(&"distribution.build.show"));
        assert!(ids.contains(&"work.gate-bypass.show"));
        assert!(ids.contains(&"test.fixture.echo"));
        assert!(ids.contains(&"observe.metrics"));
        assert!(ids.contains(&"observe.friction"));
        assert!(ids.contains(&"convention.query"));
        assert!(ids.contains(&"identity.writer"));
        assert!(ids.contains(&"identity.read"));
        assert!(ids.contains(&"identity.write"));
        assert!(ids.contains(&"mailbox.send"));
        assert!(ids.contains(&"mailbox.inbox"));
        assert!(ids.contains(&"mailbox.inbox.claim"));
        assert!(ids.contains(&"mailbox.list"));
        assert!(ids.contains(&"mailbox.status"));
        assert!(ids.contains(&"config.read"));
        assert!(ids.contains(&"config.write"));
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
