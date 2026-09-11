//! CLI projector for `apps/fgos`.
//!
//! Projects command-line arguments and route descriptors into kernel
//! `HostInvocation` and `OperationRequest` structs for native operations.

use fgos_host_runtime::{ContractRef, HostInvocation, OperationId, OperationRequest};
use std::ffi::OsString;

/// Projects a native CLI invocation into a `(HostInvocation, OperationRequest)` pair.
pub fn project_cli_invocation(
    operation_id_str: &str,
    args: &[OsString],
) -> Result<(HostInvocation, OperationRequest), String> {
    let operation = OperationId::parse(operation_id_str)
        .map_err(|e| format!("invalid operation id '{}': {}", operation_id_str, e))?;

    let include_runtime = args.iter().any(|a| a == "--runtime-json");

    // In R1, native version maps to distribution.build.show.
    let contract = ContractRef::from_static("distribution.build.show.request", "1.0.0");
    let invocation = HostInvocation::new("cli");
    let request = OperationRequest::new(
        operation,
        contract,
        Box::new(fgos_distribution::BuildShowRequest { include_runtime }),
    );
    Ok((invocation, request))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_project_cli_invocation_for_version() {
        let (invocation, request) = project_cli_invocation("distribution.build.show", &[]).unwrap();
        assert_eq!(invocation.host_kind, "cli");
        assert_eq!(request.operation.as_str(), "distribution.build.show");
        assert_eq!(request.contract.id(), "distribution.build.show.request");
        assert_eq!(request.contract.version(), "1.0.0");
        assert!(request
            .input
            .downcast_ref::<fgos_distribution::BuildShowRequest>()
            .is_some());
    }
}
