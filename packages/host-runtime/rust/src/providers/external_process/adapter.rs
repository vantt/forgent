//! External process provider adapter for `fgos-host-runtime`.
//!
//! Packet R2-P5: Adapts an external process provider to the [`OperationProvider`] trait,
//! bridging typed host runtime requests with framed process supervisor invocations.

use std::borrow::Cow;
use std::future::Future;
use std::path::PathBuf;
use std::pin::Pin;

use crate::contracts::{
    ContractRef, HostInvocation, OperationId, OperationRequest, ProviderDescriptor, ProviderError,
    ProviderLifecycle, ProviderOutcome,
};
use crate::invocation_service::{EventSink, InvocationControl, OperationProvider};
use super::frame_codec::RequestId;
use super::supervisor::{
    ExternalProcessConfig, ExternalProcessRequest, ExternalProcessSupervisor,
};
use super::{
    FIXTURE_OPERATION_ID, FIXTURE_PROVIDER_ID,
};

/// Private representation of an encoded message used strictly within the adapter boundary.
///
/// Encapsulates contract identity, version, content type, and raw payload bytes.
/// Must never leak past the adapter boundary.
#[derive(Debug, Clone, PartialEq, Eq)]
struct EncodedMessage {
    #[allow(dead_code)]
    contract_id: String,
    #[allow(dead_code)]
    contract_version: String,
    content_type: String,
    bytes: Vec<u8>,
}

impl EncodedMessage {
    fn from_request(request: &OperationRequest) -> Result<Self, ProviderError> {
        let contract_id = request.contract.id().to_string();
        let contract_version = request.contract.version().to_string();

        if let Some(val) = request.input.downcast_ref::<serde_json::Value>() {
            let bytes = serde_json::to_vec(val).map_err(|e| {
                ProviderError::SemanticValidation(format!("failed to serialize JSON payload: {e}"))
            })?;
            Ok(Self {
                contract_id,
                contract_version,
                content_type: "application/json".to_string(),
                bytes,
            })
        } else if let Some(s) = request.input.downcast_ref::<String>() {
            let content_type = if serde_json::from_str::<serde_json::Value>(s).is_ok() {
                "application/json".to_string()
            } else {
                "text/plain".to_string()
            };
            Ok(Self {
                contract_id,
                contract_version,
                content_type,
                bytes: s.as_bytes().to_vec(),
            })
        } else if let Some(b) = request.input.downcast_ref::<Vec<u8>>() {
            Ok(Self {
                contract_id,
                contract_version,
                content_type: "application/octet-stream".to_string(),
                bytes: b.clone(),
            })
        } else if let Some(action) = request.input.downcast_ref::<crate::providers::builtin::EchoAction>() {
            let val = match action {
                crate::providers::builtin::EchoAction::Echo(msg) => serde_json::json!({ "message": msg }),
                crate::providers::builtin::EchoAction::Delay { duration, message } => serde_json::json!({
                    "delay_ms": duration.as_millis(),
                    "message": message,
                }),
                crate::providers::builtin::EchoAction::Panic(msg) => serde_json::json!({
                    "crash": "before_response",
                    "message": msg,
                }),
                crate::providers::builtin::EchoAction::Park(reason) => serde_json::json!({
                    "park": reason,
                }),
                crate::providers::builtin::EchoAction::Fail(msg) => serde_json::json!({
                    "action": "fail",
                    "message": msg,
                }),
            };
            let bytes = serde_json::to_vec(&val).map_err(|e| {
                ProviderError::SemanticValidation(format!("failed to serialize EchoAction: {e}"))
            })?;
            Ok(Self {
                contract_id,
                contract_version,
                content_type: "application/json".to_string(),
                bytes,
            })
        } else {
            let bytes = serde_json::to_vec(&serde_json::Value::Null).unwrap();
            Ok(Self {
                contract_id,
                contract_version,
                content_type: "application/json".to_string(),
                bytes,
            })
        }
    }

    fn to_json_payload(&self) -> Result<serde_json::Value, ProviderError> {
        if self.content_type == "application/json" {
            serde_json::from_slice(&self.bytes).map_err(|e| {
                ProviderError::SemanticValidation(format!("failed to deserialize JSON payload: {e}"))
            })
        } else if let Ok(s) = std::str::from_utf8(&self.bytes) {
            Ok(serde_json::json!({ "text": s }))
        } else {
            Ok(serde_json::json!({ "bytes": self.bytes }))
        }
    }
}

/// Provider descriptor for the frozen fixture external process provider (`fixture.echo.process`).
pub const FIXTURE_PROCESS_DESCRIPTOR: ProviderDescriptor = ProviderDescriptor {
    provider_id: Cow::Borrowed(FIXTURE_PROVIDER_ID),
    operation_id: OperationId::from_static(FIXTURE_OPERATION_ID),
    component_class: Cow::Borrowed("test"),
    mechanism: Cow::Borrowed("external-process"),
    lifecycle: ProviderLifecycle::PerInvocation,
    request_contract: ContractRef::from_static("fixture.echo.echo.request", "1.0.0"),
    outcome_contract: ContractRef::from_static("fixture.echo.echo.outcome", "1.0.0"),
    allowed_hosts: &["cli", "remote", "test"],
    allowed_modes: &["sync", "test"],
    capabilities: &[],
    replacement: None,
    concurrency: Some(1),
    health: None,
};

/// Adapter implementing [`OperationProvider`] for external process providers.
///
/// Encapsulates process supervision and protocol framing, mapping typed host
/// requests into supervised process calls and outcomes back into [`ProviderOutcome`].
#[derive(Debug, Clone)]
pub struct ExternalProcessProviderAdapter {
    descriptor: ProviderDescriptor,
    supervisor: ExternalProcessSupervisor,
}

impl ExternalProcessProviderAdapter {
    /// Creates a new adapter with default fixture descriptor and the given supervisor configuration.
    pub fn new(config: ExternalProcessConfig) -> Self {
        Self {
            descriptor: FIXTURE_PROCESS_DESCRIPTOR,
            supervisor: ExternalProcessSupervisor::new(config),
        }
    }

    /// Creates a new adapter with a custom descriptor and supervisor configuration.
    pub fn with_descriptor(descriptor: ProviderDescriptor, config: ExternalProcessConfig) -> Self {
        Self {
            descriptor,
            supervisor: ExternalProcessSupervisor::new(config),
        }
    }

    /// Creates an adapter configured for the fixture binary with default settings.
    pub fn for_fixture(executable_path: impl Into<PathBuf>) -> Self {
        let config = ExternalProcessConfig::new(FIXTURE_PROVIDER_ID, executable_path);
        Self::new(config)
    }

    /// Attempts to locate the `fixture-echo-process` binary from standard build locations.
    pub fn find_fixture_binary() -> Option<PathBuf> {
        if let Ok(path) = std::env::var("CARGO_BIN_EXE_fixture-echo-process") {
            let p = PathBuf::from(path);
            if p.exists() {
                return Some(p);
            }
        }
        if let Ok(current) = std::env::current_exe() {
            if let Some(dir) = current.parent() {
                let candidate = dir.join("fixture-echo-process");
                if candidate.exists() {
                    return Some(candidate);
                }
                if let Some(grandparent) = dir.parent() {
                    let candidate = grandparent.join("fixture-echo-process");
                    if candidate.exists() {
                        return Some(candidate);
                    }
                }
            }
        }
        if let Ok(manifest_dir) = std::env::var("CARGO_MANIFEST_DIR") {
            let root = PathBuf::from(manifest_dir);
            let target_debug = root.join("../../target/debug/fixture-echo-process");
            if target_debug.exists() {
                return Some(target_debug);
            }
        }
        None
    }

    /// Returns a reference to the underlying supervisor.
    pub fn supervisor(&self) -> &ExternalProcessSupervisor {
        &self.supervisor
    }
}

impl OperationProvider for ExternalProcessProviderAdapter {
    fn descriptor(&self) -> &ProviderDescriptor {
        &self.descriptor
    }

    fn invoke<'a>(
        &'a self,
        invocation: &'a HostInvocation,
        request: OperationRequest,
        control: InvocationControl,
        events: &'a dyn EventSink,
    ) -> Pin<Box<dyn Future<Output = Result<ProviderOutcome, ProviderError>> + Send + 'a>> {
        Box::pin(async move {
            events.record_event("external_process.invoked");
            events.record_progress("external process adapter: encoding request");

            // 1. Encode request into private EncodedMessage
            let encoded = EncodedMessage::from_request(&request)?;
            let payload = encoded.to_json_payload()?;

            // 2. Resolve request ID
            let request_id = if let Some(ref inv_id) = invocation.invocation_id {
                if let Ok(num) = inv_id.parse::<i64>() {
                    RequestId::Number(num)
                } else {
                    RequestId::String(inv_id.clone())
                }
            } else if let Some(id_num) = payload.get("id").and_then(|v| v.as_i64()) {
                RequestId::Number(id_num)
            } else if let Some(id_str) = payload.get("id").and_then(|v| v.as_str()) {
                RequestId::String(id_str.to_string())
            } else {
                RequestId::Number(1)
            };

            let ext_request = ExternalProcessRequest::new(
                request.operation.as_str(),
                format!("{}@{}", request.contract.id(), request.contract.version()),
                payload,
            )
            .with_request_id(request_id.clone());

            events.record_progress("external process adapter: supervising child process");

            // 3. Dispatch to supervisor with cancellation receiver
            let cancellation_rx = control.cancellation_receiver();
            let outcome = self
                .supervisor
                .invoke_with_cancellation(&ext_request, cancellation_rx)
                .await?;

            events.record_event("external_process.completed");
            events.record_progress("external process adapter: decoding outcome");

            // 4. Map outcome contract
            let (id, version) = outcome.outcome_contract.split_once('@').ok_or_else(|| {
                ProviderError::ProtocolViolation(format!(
                    "outcome_contract '{}' missing version delimiter '@'",
                    outcome.outcome_contract
                ))
            })?;
            if id.is_empty() || version.is_empty() {
                return Err(ProviderError::ProtocolViolation(format!(
                    "outcome_contract '{}' has empty id or version",
                    outcome.outcome_contract
                )));
            }

            // 5. Build ProviderOutcome with diagnostics and round-tripped attributes
            let req_id_str = match &request_id {
                RequestId::Number(n) => n.to_string(),
                RequestId::String(s) => s.clone(),
            };

            let diagnostics = vec![
                format!("provider_id:{}", outcome.provider_id),
                format!("operation_id:{}", outcome.operation_id),
                format!("protocol_version:{}", outcome.protocol_version),
                format!("request_id:{}", req_id_str),
            ];

            let mut echo_val = outcome.echo.clone();
            if let serde_json::Value::Object(ref mut map) = echo_val {
                map.entry("protocol_version")
                    .or_insert_with(|| serde_json::Value::String(outcome.protocol_version.clone()));
                map.entry("request_id")
                    .or_insert_with(|| match &request_id {
                        RequestId::Number(n) => serde_json::json!(n),
                        RequestId::String(s) => serde_json::json!(s),
                    });
            }

            Ok(ProviderOutcome::completed_with_diagnostics(
                ContractRef::new(id, version),
                Box::new(echo_val),
                diagnostics,
            ))
        })
    }
}
