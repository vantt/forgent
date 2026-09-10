//! Two projector test harnesses driving the same OperationId through InvocationService.
//!
//! Kernel §4 / Phase 06 R7:
//! A CLI-shaped projector harness and an in-memory remote-shaped projector harness
//! both drive `test.fixture.echo` through `InvocationService` and reach the same
//! fixture provider with the same semantic outcome.
//!
//! R8 constraint: The two projector shims never use each other.

pub mod cli_projector {
    use fgos_host_runtime::{
        ContractRef, HostInvocation, InvocationService, OperationId, OperationRequest,
        ProviderOutcome,
    };

    pub struct CliProjectorShim;

    impl CliProjectorShim {
        pub async fn project_and_invoke(
            service: &InvocationService,
            message: &str,
        ) -> Result<String, String> {
            let invocation = HostInvocation::new("cli");
            let request = OperationRequest::new(
                OperationId::from_static("test.fixture.echo"),
                ContractRef::from_static("test.fixture.echo.request", "1.0.0"),
                Box::new(message.to_string()),
            );

            let outcome = service
                .invoke(invocation, request)
                .await
                .map_err(|e| e.to_string())?;

            match outcome {
                ProviderOutcome::Completed { output, .. } => {
                    let text = output
                        .downcast::<String>()
                        .map_err(|_| "failed to downcast output to String".to_string())?;
                    Ok(*text)
                }
                ProviderOutcome::Parked { reason, .. } => Ok(format!("parked: {reason}")),
            }
        }
    }
}

pub mod remote_projector {
    use fgos_host_runtime::{
        ContractRef, HostInvocation, InvocationService, OperationId, OperationRequest,
        ProviderOutcome,
    };

    pub struct RemoteProjectorShim;

    impl RemoteProjectorShim {
        pub async fn project_and_invoke(
            service: &InvocationService,
            message: &str,
        ) -> Result<String, String> {
            let invocation = HostInvocation::new("remote");
            let request = OperationRequest::new(
                OperationId::from_static("test.fixture.echo"),
                ContractRef::from_static("test.fixture.echo.request", "1.0.0"),
                Box::new(message.to_string()),
            );

            let outcome = service
                .invoke(invocation, request)
                .await
                .map_err(|e| e.to_string())?;

            match outcome {
                ProviderOutcome::Completed { output, .. } => {
                    let text = output
                        .downcast::<String>()
                        .map_err(|_| "failed to downcast output to String".to_string())?;
                    Ok(*text)
                }
                ProviderOutcome::Parked { reason, .. } => Ok(format!("parked: {reason}")),
            }
        }
    }
}

use fgos_host_runtime::{
    EchoProvider, InvocationService, RegistrySnapshot, CATALOG, ECHO_PROVIDER_DESCRIPTOR,
};
use std::sync::Arc;

fn build_runtime_service() -> InvocationService {
    static PROVIDERS: &[fgos_host_runtime::ProviderDescriptor] = &[ECHO_PROVIDER_DESCRIPTOR];
    let snapshot = RegistrySnapshot {
        catalog: CATALOG,
        providers: PROVIDERS,
        fingerprint: "snapshot-two-projectors",
    };
    let service = InvocationService::new(snapshot);
    service.register_provider(Arc::new(EchoProvider::new()));
    service
}

#[tokio::test]
async fn two_projectors_same_outcome() {
    let service = build_runtime_service();
    let message = "canonical-payload-test";

    let cli_output = cli_projector::CliProjectorShim::project_and_invoke(&service, message)
        .await
        .expect("cli projector invocation must succeed");

    let remote_output =
        remote_projector::RemoteProjectorShim::project_and_invoke(&service, message)
            .await
            .expect("remote projector invocation must succeed");

    assert_eq!(cli_output, message);
    assert_eq!(remote_output, message);
    assert_eq!(cli_output, remote_output);
}
