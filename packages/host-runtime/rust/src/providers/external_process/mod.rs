//! External process provider module for `fgos-host-runtime`.
//!
//! Packets R2-P1 / R2-P2: Static manifest parser, validator, and derived registry linker.

pub mod manifest;
pub mod registry;

pub use manifest::{
    parse_contract_ref, ExternalManifest, ExternalOperationDeclaration,
    ExternalProvidesDeclaration, ExternalRuntimeDeclaration, ManifestError,
    SUPPORTED_MANIFEST_VERSIONS, SUPPORTED_PROTOCOLS, SUPPORTED_RUNTIME_KINDS,
};
pub use registry::{
    ExpectedContracts, ExternalProcessLinker, ExternalProcessRegistry, ExternalProviderEntry,
    LinkerError, DEFAULT_KNOWN_CAPABILITIES, DEFAULT_RESERVED_NAMESPACES,
};
