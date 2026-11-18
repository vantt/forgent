//! The registry: shared names plus every declaration, merged at run time.
//!
//! Observe owns the shared names (`observe-names.json`) and the machinery. Every other kind, attr and measure is
//! declared where it is used, from three sources the loader merges: declarations a crate embeds and the composition
//! root injects, files under `core/**/observe/kinds` and `domains/**/observe/kinds` of the payload, and the project's
//! own `.fgos/observe/kinds`. Observe keeps no list of consumer kinds.

mod declaration;
mod discover;
mod merge;
mod validate;

pub use declaration::{
    AttrDef, Declaration, DeclarationSource, KindDef, MeasureDef, EMBEDDED_NAMES,
};
pub use discover::{discover_payload_declarations, discover_project_declarations, load_registry};
pub use merge::{EmbeddedDeclaration, Registry, RegistryError};
pub use validate::RecordError;

/// Aggregations a measure may declare as valid.
pub const AGGREGATIONS: &[&str] = &["sum", "min", "max", "avg", "p50", "p90"];
