//! Observe declarations wiring: the declarations each crate embeds travel inside the binary, because an installed
//! host has no `packages/` tree. The composition root injects the list the same way `metrics_sources` injects sources.

use fgos_observe::record::registry::{load_registry, EmbeddedDeclaration, Registry, RegistryError};
use std::path::Path;

/// Every declaration a crate embeds with `include_str!`. Each owner adds its own entry next to its kinds.
pub fn embedded_declarations() -> Vec<EmbeddedDeclaration> {
    vec![
        fgos_observe::record::store::HEALTH_DECLARATION,
        fgos_observe::sources::transcript_records::TRANSCRIPT_DECLARATION,
    ]
}

/// The merged registry: the embedded list, the payload's `observe/kinds` files and the project's own.
#[allow(dead_code)] // The query and write verbs that call it arrive in later phases.
pub fn build_registry(
    payload_root: Option<&Path>,
    project_root: Option<&Path>,
) -> Result<Registry, RegistryError> {
    load_registry(&embedded_declarations(), payload_root, project_root)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn embedded_list_merges_with_the_shared_names() {
        let registry = build_registry(None, None).expect("embedded declarations must merge");
        assert!(registry.has_subject_kind("plan"));
        assert!(registry
            .kind(fgos_observe::record::store::HEALTH_KIND)
            .is_some());
    }
}
