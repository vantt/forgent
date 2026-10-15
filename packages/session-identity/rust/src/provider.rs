//! Native host provider for `fgos identity`.

use crate::proc_tree::os_process_tree;
use crate::resolve::resolve;
use fgos_host_runtime::{
    ContractRef, EventSink, HostInvocation, InvocationControl, JsonOutcome, OperationId,
    OperationProvider, OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle,
    ProviderOutcome,
};
use std::borrow::Cow;
use std::future::Future;
use std::path::PathBuf;
use std::pin::Pin;

pub const IDENTITY_OPERATION_ID: &str = "session-identity.resolve";

pub const IDENTITY_DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed("session-identity.resolve"),
    operation_id: OperationId::from_static("session-identity.resolve"),
    component_class: Cow::Borrowed("session-identity"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("session-identity.resolve.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("session-identity.resolve.outcome", "1.0.0"),
    allowed_hosts: &["cli"],
    allowed_modes: &["sync"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

/// `pid`: the process asking. When absent, the process that started this
/// one (unix) or this process itself (elsewhere). `fgos_dir`: whose
/// registry may confirm an env id; absent skips that confirmation.
#[derive(Debug, Clone, Default)]
pub struct IdentityRequest {
    pub pid: Option<u32>,
    pub fgos_dir: Option<PathBuf>,
}

fn default_caller_pid() -> u32 {
    #[cfg(unix)]
    {
        // SAFETY: getppid has no preconditions.
        unsafe { libc::getppid() as u32 }
    }
    #[cfg(not(unix))]
    {
        std::process::id()
    }
}

/// Resolves for the request against the real env and OS process tree.
pub fn resolve_request(request: &IdentityRequest) -> serde_json::Value {
    let tree = os_process_tree();
    let identity = resolve(
        &|key| std::env::var(key).ok(),
        tree.as_ref(),
        request.pid.unwrap_or_else(default_caller_pid),
        request.fgos_dir.as_deref(),
    );
    serde_json::to_value(identity).expect("WriterIdentity always serializes")
}

#[derive(Debug, Clone)]
pub struct IdentityProvider {
    descriptor: ProviderDescriptor,
}

impl IdentityProvider {
    pub fn new() -> Self {
        Self {
            descriptor: IDENTITY_DESCRIPTOR,
        }
    }
}

impl Default for IdentityProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl OperationProvider for IdentityProvider {
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
            events.record_event("session-identity.resolve.invoked");
            let request = request
                .input
                .downcast_ref::<IdentityRequest>()
                .ok_or_else(|| {
                    ProviderError::SemanticValidation("input is not IdentityRequest".into())
                })?;
            Ok(ProviderOutcome::completed(
                self.descriptor().outcome_contract.clone(),
                Box::new(JsonOutcome(resolve_request(request))),
            ))
        })
    }
}
