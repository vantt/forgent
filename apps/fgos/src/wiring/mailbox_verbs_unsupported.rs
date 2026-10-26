//! `fgos mailbox ...` where the record cannot be served (not unix): the store
//! reads process ancestry, file modes and advisory locks that exist only on
//! unix, so every verb answers one refusal and changes nothing. The sub-verb
//! names, operation ids and descriptors are the shared ones, so the route
//! table and the registry look the same on every platform.
pub use super::mailbox_surface::{
    MailboxAnswer, AVAILABLE_SUBCOMMANDS, INBOX_CLAIM_DESCRIPTOR, INBOX_CLAIM_OPERATION_ID,
    INBOX_DESCRIPTOR, INBOX_OPERATION_ID, LIST_DESCRIPTOR, LIST_OPERATION_ID, SEND_DESCRIPTOR,
    SEND_OPERATION_ID, STATUS_DESCRIPTOR, STATUS_OPERATION_ID,
};
use fgos_host_runtime::{
    EventSink, HostInvocation, InvocationControl, OperationProvider, OperationRequest,
    ProviderDescriptor, ProviderError, ProviderOutcome,
};
use serde_json::json;
use std::ffi::OsString;
use std::future::Future;
use std::pin::Pin;

const REFUSAL: &str = "the agent mailbox is not available on this platform (it needs unix process ancestry and file locks)";
const EXIT_REFUSED: i32 = 1;

/// One `fgos mailbox` invocation: only whether `--json` was asked, since every
/// verb gets the same refusal.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MailboxRequest {
    json: bool,
}

impl MailboxRequest {
    pub fn operation_id(&self) -> &'static str {
        INBOX_OPERATION_ID
    }
}

pub fn project_mailbox_request(args: &[OsString]) -> MailboxRequest {
    MailboxRequest {
        json: args.iter().any(|a| a == "--json"),
    }
}

fn answer(request: &MailboxRequest) -> MailboxAnswer {
    MailboxAnswer {
        text: format!("fgos: {REFUSAL}"),
        data: json!({ "ok": false, "error": REFUSAL }),
        json: request.json,
        exit: EXIT_REFUSED,
        already_written: false,
        warning: None,
    }
}

/// The provider of one of the mailbox operations.
pub struct MailboxProvider {
    descriptor: ProviderDescriptor,
}

impl MailboxProvider {
    pub fn for_descriptor(descriptor: ProviderDescriptor) -> Self {
        Self { descriptor }
    }
}

impl OperationProvider for MailboxProvider {
    fn descriptor(&self) -> &ProviderDescriptor {
        &self.descriptor
    }

    fn invoke<'a>(
        &'a self,
        _invocation: &'a HostInvocation,
        request: OperationRequest,
        _control: InvocationControl,
        events: &'a dyn EventSink,
    ) -> Pin<Box<dyn Future<Output = Result<ProviderOutcome, ProviderError>> + Send + 'a>> {
        Box::pin(async move {
            events.record_event(&format!("{}.invoked", self.descriptor.operation_id));
            let request = request
                .input
                .downcast_ref::<MailboxRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not MailboxRequest".into())
                })?;
            Ok(ProviderOutcome::completed(
                self.descriptor.outcome_contract.clone(),
                Box::new(answer(request)),
            ))
        })
    }
}
