//! In-memory builtin providers for `fgos-host-runtime`.
//!
//! Kernel §6: Builtin providers receive typed Rust requests and return typed outcomes.
//! R6: Implements one in-memory `test.fixture.echo` `OperationProvider` used only by this crate's tests.

use crate::contracts::{
    ContractRef, HostInvocation, OperationId, OperationRequest, ProviderDescriptor, ProviderError,
    ProviderLifecycle, ProviderOutcome,
};
use crate::invocation_service::{EventSink, InvocationControl, OperationProvider};
use std::borrow::Cow;
use std::future::Future;
use std::pin::Pin;

/// Provider descriptor for `test.fixture.echo.builtin`.
pub const ECHO_PROVIDER_DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed("test.fixture.echo.builtin"),
    operation_id: OperationId::from_static("test.fixture.echo"),
    component_class: Cow::Borrowed("test"),
    mechanism: Cow::Borrowed("builtin"),
    lifecycle: ProviderLifecycle::Singleton,
    request_contract: ContractRef::from_static("test.fixture.echo.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("test.fixture.echo.outcome", "1.0.0"),
    allowed_hosts: &["cli", "remote", "test"],
    allowed_modes: &["sync", "test"],
    capabilities: &[],
    replacement: None,
    concurrency: None,
    health: None,
};

/// Actions supported by [`EchoProvider`] for exercising pipeline execution.
#[derive(Debug, Clone)]
pub enum EchoAction {
    Echo(String),
    Delay {
        duration: std::time::Duration,
        message: String,
    },
    Panic(String),
    Park(String),
    Fail(String),
}

/// In-memory echo operation provider for testing.
#[derive(Debug, Clone)]
pub struct EchoProvider {
    descriptor: ProviderDescriptor,
}

impl EchoProvider {
    pub fn new() -> Self {
        Self {
            descriptor: ECHO_PROVIDER_DESCRIPTOR,
        }
    }

    pub fn with_descriptor(descriptor: ProviderDescriptor) -> Self {
        Self { descriptor }
    }
}

impl Default for EchoProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl OperationProvider for EchoProvider {
    fn descriptor(&self) -> &ProviderDescriptor {
        &self.descriptor
    }

    fn invoke<'a>(
        &'a self,
        _invocation: &'a HostInvocation,
        request: OperationRequest,
        control: InvocationControl,
        events: &'a dyn EventSink,
    ) -> Pin<Box<dyn Future<Output = Result<ProviderOutcome, ProviderError>> + Send + 'a>> {
        Box::pin(async move {
            events.record_event("echo.invoked");

            if let Some(action) = request.input.downcast_ref::<EchoAction>() {
                match action {
                    EchoAction::Echo(msg) => {
                        events.record_progress("echoing message");
                        Ok(ProviderOutcome::completed(
                            self.descriptor.outcome_contract.clone(),
                            Box::new(msg.clone()),
                        ))
                    }
                    EchoAction::Delay { duration, message } => {
                        events.record_progress("echo delaying");
                        let step = std::time::Duration::from_millis(5);
                        let mut elapsed = std::time::Duration::from_millis(0);
                        while elapsed < *duration {
                            if control.is_cancelled() {
                                events.record_event("echo.cancelled");
                                return Err(ProviderError::CallerCancelled(
                                    "cancelled mid-invoke".to_string(),
                                ));
                            }
                            if control.is_deadline_exceeded() {
                                events.record_event("echo.deadline_exceeded");
                                return Err(ProviderError::DeadlineExceeded(
                                    "deadline exceeded mid-invoke".to_string(),
                                ));
                            }
                            tokio::time::sleep(step).await;
                            elapsed += step;
                        }
                        Ok(ProviderOutcome::completed(
                            self.descriptor.outcome_contract.clone(),
                            Box::new(message.clone()),
                        ))
                    }
                    EchoAction::Panic(msg) => {
                        panic!("echo provider panic: {msg}");
                    }
                    EchoAction::Park(reason) => {
                        events.record_progress("echo parking for human input");
                        Ok(ProviderOutcome::parked(
                            self.descriptor.outcome_contract.clone(),
                            reason.clone(),
                        ))
                    }
                    EchoAction::Fail(msg) => {
                        events.record_progress("echo failing semantically");
                        Err(ProviderError::SemanticValidation(msg.clone()))
                    }
                }
            } else if let Some(s) = request.input.downcast_ref::<String>() {
                if s == "panic" {
                    panic!("echo provider panic: simulated crash");
                } else if s == "park" {
                    events.record_progress("echo parking for human input");
                    Ok(ProviderOutcome::parked(
                        self.descriptor.outcome_contract.clone(),
                        "simulated park",
                    ))
                } else if s == "fail" {
                    events.record_progress("echo failing semantically");
                    Err(ProviderError::SemanticValidation(
                        "simulated semantic validation error".to_string(),
                    ))
                } else {
                    events.record_progress("echoing string");
                    Ok(ProviderOutcome::completed(
                        self.descriptor.outcome_contract.clone(),
                        Box::new(s.clone()),
                    ))
                }
            } else if let Some(s) = request.input.downcast_ref::<&str>() {
                events.record_progress("echoing str");
                Ok(ProviderOutcome::completed(
                    self.descriptor.outcome_contract.clone(),
                    Box::new((*s).to_string()),
                ))
            } else {
                events.record_progress("echoing default");
                Ok(ProviderOutcome::completed(
                    self.descriptor.outcome_contract.clone(),
                    Box::new("echo".to_string()),
                ))
            }
        })
    }
}
