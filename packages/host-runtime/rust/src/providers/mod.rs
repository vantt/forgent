//! Providers module for `fgos-host-runtime`.
//!
//! Kernel §6: In-process and external operation providers.

pub mod builtin;
pub mod external_process;

pub use builtin::{EchoAction, EchoProvider, ECHO_PROVIDER_DESCRIPTOR};
pub use external_process::{
    adapter, frame_codec, parse_contract_ref, supervisor, CodecError, ExpectedContracts,
    ExternalManifest, ExternalOperationDeclaration, ExternalProcessConfig, ExternalProcessLinker,
    ExternalProcessOutcome, ExternalProcessProviderAdapter, ExternalProcessRegistry,
    ExternalProcessRequest, ExternalProcessSupervisor, ExternalProviderEntry,
    ExternalProvidesDeclaration, ExternalRuntimeDeclaration, FrameCodec, FrameMessage,
    JsonRpcError, JsonRpcNotification, JsonRpcRequest, JsonRpcResponse, LinkerError, ManifestError,
    RequestId, COMPONENT_PROTOCOL_VERSION, DEFAULT_KNOWN_CAPABILITIES, DEFAULT_MAX_FRAME_SIZE,
    DEFAULT_RESERVED_NAMESPACES, FIXTURE_OPERATION_ID, FIXTURE_OUTCOME_CONTRACT,
    FIXTURE_PROCESS_DESCRIPTOR, FIXTURE_PROVIDER_ID, FIXTURE_REQUEST_CONTRACT,
    SUPPORTED_MANIFEST_VERSIONS, SUPPORTED_PROTOCOLS, SUPPORTED_RUNTIME_KINDS,
};
