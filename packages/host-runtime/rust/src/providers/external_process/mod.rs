//! External process provider module for `fgos-host-runtime`.
//!
//! Packets R2-P1 / R2-P2: Static manifest parser, validator, and derived registry linker.
//! Packets R2-P3 / R2-P4: Frame codec and process supervisor.

pub mod manifest;
pub mod registry;

pub mod frame_codec;
pub mod supervisor;

pub use manifest::{
    parse_contract_ref, ExternalManifest, ExternalOperationDeclaration,
    ExternalProvidesDeclaration, ExternalRuntimeDeclaration, ManifestError,
    SUPPORTED_MANIFEST_VERSIONS, SUPPORTED_PROTOCOLS, SUPPORTED_RUNTIME_KINDS,
};
pub use registry::{
    ExpectedContracts, ExternalProcessLinker, ExternalProcessRegistry, ExternalProviderEntry,
    LinkerError, DEFAULT_KNOWN_CAPABILITIES, DEFAULT_RESERVED_NAMESPACES,
};

pub use frame_codec::{
    CodecError, FrameCodec, FrameMessage, JsonRpcError, JsonRpcNotification, JsonRpcRequest,
    JsonRpcResponse, RequestId, DEFAULT_MAX_FRAME_SIZE,
};
pub use supervisor::{
    ExternalProcessConfig, ExternalProcessOutcome, ExternalProcessRequest, ExternalProcessSupervisor,
};

/// Frozen fixture contract constants (R2-P0 / docs/platform/host-invocation-routing/verification/r2-external-process-proof.md#2)
pub const FIXTURE_PROVIDER_ID: &str = "fixture.echo.process";
pub const FIXTURE_OPERATION_ID: &str = "fixture.echo.echo";
pub const FIXTURE_REQUEST_CONTRACT: &str = "fixture.echo.echo.request@1.0.0";
pub const FIXTURE_OUTCOME_CONTRACT: &str = "fixture.echo.echo.outcome@1.0.0";
pub const COMPONENT_PROTOCOL_VERSION: &str = "fgos.component.v1";
