//! CLI projector for `apps/fgos`.
//!
//! Projects command-line arguments and route descriptors into kernel
//! `HostInvocation` and `OperationRequest` structs for native operations.

use fgos_host_runtime::{ContractRef, HostInvocation, OperationId, OperationRequest};
use std::ffi::OsString;

/// Projects a native CLI invocation into a `(HostInvocation, OperationRequest)` pair.
pub fn project_cli_invocation(
    operation_id_str: &str,
    _args: &[OsString],
) -> Result<(HostInvocation, OperationRequest), String> {
    let operation = OperationId::parse(operation_id_str)
        .map_err(|e| format!("invalid operation id '{}': {}", operation_id_str, e))?;

    // In R1, native version maps to distribution.build.show.
    let contract = ContractRef::from_static("distribution.build.show.request", "1.0.0");
    let invocation = HostInvocation::new("cli");
    let request = OperationRequest::new(operation, contract, Box::new(()));
    Ok((invocation, request))
}
