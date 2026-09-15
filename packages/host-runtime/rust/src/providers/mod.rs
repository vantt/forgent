//! Providers module for `fgos-host-runtime`.
//!
//! Kernel §6: In-process and external operation providers.

pub mod builtin;
pub mod external_process;

pub use builtin::{EchoAction, EchoProvider, ECHO_PROVIDER_DESCRIPTOR};
pub use external_process::{
    frame_codec, supervisor, CodecError, ExternalProcessConfig, ExternalProcessOutcome,
    ExternalProcessRequest, ExternalProcessSupervisor, FrameCodec, FrameMessage, JsonRpcError,
    JsonRpcNotification, JsonRpcRequest, JsonRpcResponse, RequestId, COMPONENT_PROTOCOL_VERSION,
    DEFAULT_MAX_FRAME_SIZE, FIXTURE_OPERATION_ID, FIXTURE_OUTCOME_CONTRACT, FIXTURE_PROVIDER_ID,
    FIXTURE_REQUEST_CONTRACT,
};
