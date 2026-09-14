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

    let (contract, input): (ContractRef, Box<dyn std::any::Any + Send>) = match operation.as_str() {
        "distribution.build.show" => {
            let include_runtime = args.iter().any(|a| a == "--runtime-json");
            (
                ContractRef::from_static("distribution.build.show.request", "1.0.0"),
                Box::new(fgos_distribution::BuildShowRequest { include_runtime }),
            )
        }
        "work.gate-bypass.show" => (
            ContractRef::from_static("work.gate-bypass.show.request", "1.0.0"),
            Box::new(fgos_work_state::GateBypassShowRequest::default()),
        ),
        other => {
            return Err(format!(
                "native CLI projector has no request mapping for '{}'",
                other
            ));
        }
    };

    let invocation = HostInvocation::new("cli");
    let request = OperationRequest::new(operation, contract, input);
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

    #[test]
    fn test_project_cli_invocation_for_gate_bypass() {
        let (invocation, request) = project_cli_invocation("work.gate-bypass.show", &[]).unwrap();
        assert_eq!(invocation.host_kind, "cli");
        assert_eq!(request.operation.as_str(), "work.gate-bypass.show");
        assert_eq!(request.contract.id(), "work.gate-bypass.show.request");
        assert_eq!(request.contract.version(), "1.0.0");
        assert!(request
            .input
            .downcast_ref::<fgos_work_state::GateBypassShowRequest>()
            .is_some());
    }
}
