//! The bundled section schemas and standard files, listed by hand with `include_str!` (no
//! `build.rs`); `tests/golden_schema.rs` fails when this list and `core/config-schema/` or
//! `core/config-standard/` disagree. Sections are listed alphabetically; the merge order of the standard layer is this order.
use sha2::{Digest, Sha256};

/// Expands section names into `(name, include_str!(dir/name.suffix))` pairs.
macro_rules! sections {
    ($dir:literal, $suffix:literal; $($name:ident),+ $(,)?) => {
        &[$((
            stringify!($name),
            include_str!(concat!("../../../../core/", $dir, "/", stringify!($name), $suffix)),
        )),+]
    };
}

/// `(section, YAML text)` in schema-set order.
pub const SCHEMAS: &[(&str, &str)] = sections!("config-schema", ".schema.yaml";
    checkpoint, cleanup, docRegistry, eventStore, gateBypass, gateway, herdrOrchestrator,
    herdrWebDashboard, invariantChecks, ironLaw, runner, secrets, terminal, workerSlots,
    worktreeSetup);
/// `(section, YAML text)` in schema-set order.
pub const STANDARD: &[(&str, &str)] = sections!("config-standard", ".yaml";
    checkpoint, cleanup, docRegistry, eventStore, gateBypass, gateway, herdrOrchestrator,
    herdrWebDashboard, invariantChecks, ironLaw, runner, secrets, terminal, workerSlots,
    worktreeSetup);

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
