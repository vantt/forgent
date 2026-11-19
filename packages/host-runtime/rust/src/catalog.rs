//! Operation catalog for `fgos-host-runtime`.
//!
//! Kernel §5: The catalog is an authority-bearing inventory of `OperationDescriptor`s,
//! authored by owning components.
//!
//! The catalog is a `const` array holding native production reads.

use crate::contracts::{
    ContractRef, OperationDescriptor, OperationEffect, OperationId, OperationIdempotency,
    StreamingMode,
};
use std::borrow::Cow;

/// Canonical operation catalog holding native production reads.
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
        operation_id: OperationId::from_static("holder-lock.fence"),
        owning_component_id: Cow::Borrowed("holder-lock"),
        request_contract: ContractRef::from_static("holder-lock.fence.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("holder-lock.fence.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("holder-lock.write"),
        allowed_host_kinds: &["cli"],
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
    OperationDescriptor {
        operation_id: OperationId::from_static("gateway.start"),
        owning_component_id: Cow::Borrowed("gateway"),
        request_contract: ContractRef::from_static("gateway.start.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("gateway.start.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("gateway.write"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("gateway.stop"),
        owning_component_id: Cow::Borrowed("gateway"),
        request_contract: ContractRef::from_static("gateway.stop.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("gateway.stop.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("gateway.write"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("gateway.status"),
        owning_component_id: Cow::Borrowed("gateway"),
        request_contract: ContractRef::from_static("gateway.status.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("gateway.status.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("gateway.read"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("git.status"),
        owning_component_id: Cow::Borrowed("git"),
        request_contract: ContractRef::from_static("git.status.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("git.status.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("git.read"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("event-store.sync"),
        owning_component_id: Cow::Borrowed("event-store"),
        request_contract: ContractRef::from_static("event-store.sync.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("event-store.sync.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("event-store.write"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("git.recover"),
        owning_component_id: Cow::Borrowed("git"),
        request_contract: ContractRef::from_static("git.recover.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("git.recover.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("git.write"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("event-store.status"),
        owning_component_id: Cow::Borrowed("event-store"),
        request_contract: ContractRef::from_static("event-store.status.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("event-store.status.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("event-store.read"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("event-store.seal"),
        owning_component_id: Cow::Borrowed("event-store"),
        request_contract: ContractRef::from_static("event-store.seal.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("event-store.seal.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("event-store.write"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("event-store.export"),
        owning_component_id: Cow::Borrowed("event-store"),
        request_contract: ContractRef::from_static("event-store.export.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("event-store.export.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("event-store.read"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("worktree.create"),
        owning_component_id: Cow::Borrowed("worktree"),
        request_contract: ContractRef::from_static("worktree.create.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("worktree.create.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("worktree.write"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("worktree.remove"),
        owning_component_id: Cow::Borrowed("worktree"),
        request_contract: ContractRef::from_static("worktree.remove.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("worktree.remove.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("worktree.write"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("worktree.resync"),
        owning_component_id: Cow::Borrowed("worktree"),
        request_contract: ContractRef::from_static("worktree.resync.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("worktree.resync.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("worktree.write"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("questions.read"),
        owning_component_id: Cow::Borrowed("questions"),
        request_contract: ContractRef::from_static("questions.read.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("questions.read.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("questions.read"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("questions.write"),
        owning_component_id: Cow::Borrowed("questions"),
        request_contract: ContractRef::from_static("questions.write.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("questions.write.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("questions.write"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("doctor.run"),
        owning_component_id: Cow::Borrowed("packaging"),
        request_contract: ContractRef::from_static("doctor.run.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("doctor.run.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("doctor.write"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("wire-agents.run"),
        owning_component_id: Cow::Borrowed("packaging"),
        request_contract: ContractRef::from_static("wire-agents.run.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("wire-agents.run.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("wire-agents.write"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("uninstall.run"),
        owning_component_id: Cow::Borrowed("packaging"),
        request_contract: ContractRef::from_static("uninstall.run.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("uninstall.run.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("uninstall.write"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("init.run"),
        owning_component_id: Cow::Borrowed("packaging"),
        request_contract: ContractRef::from_static("init.run.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("init.run.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("init.write"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("resource-check.run"),
        owning_component_id: Cow::Borrowed("resource-check"),
        request_contract: ContractRef::from_static("resource-check.run.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("resource-check.run.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("resource-check.read"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("holder-lock.status"),
        owning_component_id: Cow::Borrowed("holder-lock"),
        request_contract: ContractRef::from_static("holder-lock.status.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("holder-lock.status.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("holder-lock.read"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("dispatch.decide"),
        owning_component_id: Cow::Borrowed("execution"),
        request_contract: ContractRef::from_static("dispatch.decide.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("dispatch.decide.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("execution.read"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("dispatch.explain"),
        owning_component_id: Cow::Borrowed("execution"),
        request_contract: ContractRef::from_static("dispatch.explain.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("dispatch.explain.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("execution.read"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("agents.list"),
        owning_component_id: Cow::Borrowed("execution"),
        request_contract: ContractRef::from_static("agents.list.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("agents.list.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("execution.read"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("watcher.tick"),
        owning_component_id: Cow::Borrowed("supervision"),
        request_contract: ContractRef::from_static("watcher.tick.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("watcher.tick.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("supervision.write"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("supervisor.read"),
        owning_component_id: Cow::Borrowed("supervision"),
        request_contract: ContractRef::from_static("supervisor.read.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("supervisor.read.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("supervision.read"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("supervisor.write"),
        owning_component_id: Cow::Borrowed("supervision"),
        request_contract: ContractRef::from_static("supervisor.write.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("supervisor.write.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("supervision.write"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("land.run"),
        owning_component_id: Cow::Borrowed("supervision"),
        request_contract: ContractRef::from_static("land.run.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("land.run.outcome", "1.0.0"),
        effect: OperationEffect::Write,
        idempotency: OperationIdempotency::None,
        authority_policy_id: Cow::Borrowed("supervision.write"),
        allowed_host_kinds: &["cli"],
        streaming_mode: StreamingMode::None,
    },
    OperationDescriptor {
        operation_id: OperationId::from_static("slots.read"),
        owning_component_id: Cow::Borrowed("supervision"),
        request_contract: ContractRef::from_static("slots.read.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("slots.read.outcome", "1.0.0"),
        effect: OperationEffect::Read,
        idempotency: OperationIdempotency::Safe,
        authority_policy_id: Cow::Borrowed("supervision.read"),
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
        // and status, the gateway start, stop and status, the git status and recover, the lock status, the lock fence, the doctor run, the wire-agents run, the uninstall run and the init run, the dispatch decide and explain, the agents list, the supervision tick, supervisor read and write, land and slots, and the resource-check run.
        assert_eq!(CATALOG.len(), 44);
        let ids: Vec<&str> = CATALOG.iter().map(|op| op.operation_id.as_str()).collect();
        assert!(ids.contains(&"distribution.build.show"));
        assert!(ids.contains(&"work.gate-bypass.show"));
        assert!(!ids.iter().any(|id| id.starts_with("test.")));
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
        for op in ["sync", "status", "seal", "export"] {
            assert!(ids.contains(&format!("event-store.{op}").as_str()));
        }
        assert!(ids.contains(&"gateway.start"));
        assert!(ids.contains(&"gateway.stop"));
        assert!(ids.contains(&"gateway.status"));
        assert!(ids.contains(&"git.status"));
        assert!(ids.contains(&"git.recover"));
        assert!(ids.contains(&"worktree.create"));
        assert!(ids.contains(&"worktree.remove"));
        assert!(ids.contains(&"worktree.resync"));
        assert!(ids.contains(&"resource-check.run"));
        assert!(ids.contains(&"holder-lock.status"));
        assert!(ids.contains(&"holder-lock.fence"));
        assert!(ids.contains(&"doctor.run"));
        assert!(ids.contains(&"wire-agents.run"));
        assert!(ids.contains(&"uninstall.run"));
        assert!(ids.contains(&"init.run"));
        assert!(ids.contains(&"dispatch.decide"));
        assert!(ids.contains(&"dispatch.explain"));
        assert!(ids.contains(&"agents.list"));
        assert!(ids.contains(&"questions.read"));
        assert!(ids.contains(&"questions.write"));
        for id in [
            "watcher.tick",
            "supervisor.read",
            "supervisor.write",
            "land.run",
            "slots.read",
        ] {
            assert!(ids.contains(&id));
        }
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
