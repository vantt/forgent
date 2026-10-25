//! The part of the mailbox verbs every platform shares: the sub-verb names,
//! the five operation ids with their provider descriptors, and the answer a
//! verb gives. The unix build serves them from the record (`mailbox_verbs`);
//! any other build answers each with a refusal (`mailbox_verbs_unsupported`).
use fgos_host_runtime::{ContractRef, OperationId, ProviderDescriptor, ProviderLifecycle};
use serde_json::Value;
use std::borrow::Cow;

/// The sub-verbs of `fgos mailbox`.
pub const AVAILABLE_SUBCOMMANDS: &[&str] = &["send", "inbox", "list", "status"];

pub const SEND_OPERATION_ID: &str = "mailbox.send";
pub const INBOX_OPERATION_ID: &str = "mailbox.inbox";
pub const INBOX_CLAIM_OPERATION_ID: &str = "mailbox.inbox.claim";
pub const LIST_OPERATION_ID: &str = "mailbox.list";
pub const STATUS_OPERATION_ID: &str = "mailbox.status";

const fn descriptor(
    id: &'static str,
    request: &'static str,
    outcome: &'static str,
) -> ProviderDescriptor {
    ProviderDescriptor {
        provider_id: Cow::Borrowed(id),
        operation_id: OperationId::from_static(id),
        component_class: Cow::Borrowed("mailbox"),
        mechanism: Cow::Borrowed("builtin"),
        lifecycle: ProviderLifecycle::Singleton,
        request_contract: ContractRef::from_static(request, "1.0.0"),
        outcome_contract: ContractRef::from_static(outcome, "1.0.0"),
        allowed_hosts: &["cli"],
        allowed_modes: &["sync"],
        capabilities: &[],
        replacement: None,
        concurrency: None,
        health: None,
    }
}

pub const SEND_DESCRIPTOR: ProviderDescriptor = descriptor(
    SEND_OPERATION_ID,
    "mailbox.send.request",
    "mailbox.send.outcome",
);
pub const INBOX_DESCRIPTOR: ProviderDescriptor = descriptor(
    INBOX_OPERATION_ID,
    "mailbox.inbox.request",
    "mailbox.inbox.outcome",
);
pub const INBOX_CLAIM_DESCRIPTOR: ProviderDescriptor = descriptor(
    INBOX_CLAIM_OPERATION_ID,
    "mailbox.inbox.claim.request",
    "mailbox.inbox.claim.outcome",
);
pub const LIST_DESCRIPTOR: ProviderDescriptor = descriptor(
    LIST_OPERATION_ID,
    "mailbox.list.request",
    "mailbox.list.outcome",
);
pub const STATUS_DESCRIPTOR: ProviderDescriptor = descriptor(
    STATUS_OPERATION_ID,
    "mailbox.status.request",
    "mailbox.status.outcome",
);

/// What a mailbox verb answers: the text it prints (unless it was written
/// already), the envelope data for `--json`, and the exit status.
#[derive(Debug, Clone, PartialEq)]
pub struct MailboxAnswer {
    pub text: String,
    pub data: Value,
    pub json: bool,
    pub exit: i32,
    /// The frames were written to stdout by the verb itself.
    pub already_written: bool,
    /// A line for stderr (an ignored config key, a usage error).
    pub warning: Option<String>,
}
