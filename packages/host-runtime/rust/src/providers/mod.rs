//! Providers module for `fgos-host-runtime`.
//!
//! Kernel §6: In-process and external operation providers.

pub mod builtin;
pub mod external_process;

pub use builtin::{EchoAction, EchoProvider, ECHO_PROVIDER_DESCRIPTOR};
pub use external_process::{
    parse_contract_ref, ExpectedContracts, ExternalManifest, ExternalOperationDeclaration,
    ExternalProcessLinker, ExternalProcessRegistry, ExternalProviderEntry,
    ExternalProvidesDeclaration, ExternalRuntimeDeclaration, LinkerError, ManifestError,
    DEFAULT_KNOWN_CAPABILITIES, DEFAULT_RESERVED_NAMESPACES, SUPPORTED_MANIFEST_VERSIONS,
    SUPPORTED_PROTOCOLS, SUPPORTED_RUNTIME_KINDS,
};
