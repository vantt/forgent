//! The bundled section schemas and standard files, listed by hand with `include_str!` (no
//! `build.rs`); `tests/golden_schema.rs` fails when this list and `core/config-schema/` or
//! `core/config-standard/` disagree. Sections are listed alphabetically; the merge order of the standard layer is this order.
use sha2::{Digest, Sha256};

/// `(section, YAML text)` in schema-set order.
pub const SCHEMAS: &[(&str, &str)] = &[
    (
        "bin",
        include_str!("../../../../core/config-schema/bin.schema.yaml"),
    ),
    (
        "checkpoint",
        include_str!("../../../../core/config-schema/checkpoint.schema.yaml"),
    ),
    (
        "cleanup",
        include_str!("../../../../core/config-schema/cleanup.schema.yaml"),
    ),
    (
        "docRegistry",
        include_str!("../../../../core/config-schema/docRegistry.schema.yaml"),
    ),
    (
        "eventStore",
        include_str!("../../../../core/config-schema/eventStore.schema.yaml"),
    ),
    (
        "gateBypass",
        include_str!("../../../../core/config-schema/gateBypass.schema.yaml"),
    ),
    (
        "gateway",
        include_str!("../../../../core/config-schema/gateway.schema.yaml"),
    ),
    (
        "herdrOrchestrator",
        include_str!("../../../../core/config-schema/herdrOrchestrator.schema.yaml"),
    ),
    (
        "herdrWebDashboard",
        include_str!("../../../../core/config-schema/herdrWebDashboard.schema.yaml"),
    ),
    (
        "invariantChecks",
        include_str!("../../../../core/config-schema/invariantChecks.schema.yaml"),
    ),
    (
        "ironLaw",
        include_str!("../../../../core/config-schema/ironLaw.schema.yaml"),
    ),
    (
        "runner",
        include_str!("../../../../core/config-schema/runner.schema.yaml"),
    ),
    (
        "secrets",
        include_str!("../../../../core/config-schema/secrets.schema.yaml"),
    ),
    (
        "terminal",
        include_str!("../../../../core/config-schema/terminal.schema.yaml"),
    ),
    (
        "workerSlots",
        include_str!("../../../../core/config-schema/workerSlots.schema.yaml"),
    ),
    (
        "worktreeSetup",
        include_str!("../../../../core/config-schema/worktreeSetup.schema.yaml"),
    ),
];
/// `(section, YAML text)` in schema-set order.
pub const STANDARD: &[(&str, &str)] = &[
    (
        "checkpoint",
        include_str!("../../../../core/config-standard/checkpoint.yaml"),
    ),
    (
        "cleanup",
        include_str!("../../../../core/config-standard/cleanup.yaml"),
    ),
    (
        "docRegistry",
        include_str!("../../../../core/config-standard/docRegistry.yaml"),
    ),
    (
        "eventStore",
        include_str!("../../../../core/config-standard/eventStore.yaml"),
    ),
    (
        "gateBypass",
        include_str!("../../../../core/config-standard/gateBypass.yaml"),
    ),
    (
        "gateway",
        include_str!("../../../../core/config-standard/gateway.yaml"),
    ),
    (
        "herdrOrchestrator",
        include_str!("../../../../core/config-standard/herdrOrchestrator.yaml"),
    ),
    (
        "herdrWebDashboard",
        include_str!("../../../../core/config-standard/herdrWebDashboard.yaml"),
    ),
    (
        "invariantChecks",
        include_str!("../../../../core/config-standard/invariantChecks.yaml"),
    ),
    (
        "ironLaw",
        include_str!("../../../../core/config-standard/ironLaw.yaml"),
    ),
    (
        "runner",
        include_str!("../../../../core/config-standard/runner.yaml"),
    ),
    (
        "secrets",
        include_str!("../../../../core/config-standard/secrets.yaml"),
    ),
    (
        "terminal",
        include_str!("../../../../core/config-standard/terminal.yaml"),
    ),
    (
        "workerSlots",
        include_str!("../../../../core/config-standard/workerSlots.yaml"),
    ),
    (
        "worktreeSetup",
        include_str!("../../../../core/config-standard/worktreeSetup.yaml"),
    ),
];

/// sha256 over the sorted `(kind, name, bytes)` triples of both sets, as lowercase hex; the key of
/// the snapshot cache. It does not depend on the order the files are listed.
pub fn digest(schemas: &[(&str, &[u8])], standard: &[(&str, &[u8])]) -> String {
    let mut items: Vec<(&str, &str, &[u8])> = schemas
        .iter()
        .map(|(name, bytes)| ("schema", *name, *bytes))
        .chain(
            standard
                .iter()
                .map(|(name, bytes)| ("standard", *name, *bytes)),
        )
        .collect();
    items.sort();
    let mut hash = Sha256::new();
    for (kind, name, bytes) in items {
        for part in [kind.as_bytes(), name.as_bytes(), bytes] {
            hash.update((part.len() as u64).to_be_bytes());
            hash.update(part);
        }
    }
    hash.finalize().iter().map(|b| format!("{b:02x}")).collect()
}

pub(crate) fn as_bytes(
    list: &[(&'static str, &'static str)],
) -> Vec<(&'static str, &'static [u8])> {
    list.iter()
        .map(|(name, text)| (*name, text.as_bytes()))
        .collect()
}
