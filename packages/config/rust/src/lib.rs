//! Config: the effective value of every key, where it came from, whether a file is legal, and the
//! exact bytes after one change. Contract: `docs/platform/config/spec.md`; closed id lists and golden
//! fixtures: `packages/config/contracts/`.
//!
//! # The seal
//!
//! The crate contains no `unsafe` code: the no-follow open lives in Durable File, which owns how
//! fgOS opens files. No public function panics across the API; a refusal carries the failure id,
//! file, path and position, never a value of the input (spec section 9).
#![forbid(unsafe_code)]

/// The contract document `contracts/<name>`, parsed once; null when it does not parse.
macro_rules! contract {
    ($name:literal) => {{
        static CONTRACT: std::sync::OnceLock<serde_json::Value> = std::sync::OnceLock::new();
        CONTRACT.get_or_init(|| {
            serde_json::from_str(include_str!(concat!("../../contracts/", $name)))
                .unwrap_or(serde_json::Value::Null)
        })
    }};
}

pub mod error;
pub mod locks;
// Modules below are stubs; each names the phase that fills it.
pub mod bundle;
pub mod cache;
pub mod detect;
pub mod files;
pub mod grammar;
pub mod lint;
pub mod redact;
pub mod schema;
pub mod scope;
pub mod snapshot;
pub mod standard;
pub mod validate;
// Slice D modules, declared here so later phases never edit this file; each stub names its phase.
pub mod docs;
#[cfg(unix)]
pub mod doctor;
pub mod inspect;
pub mod machine;
/// The migration writes files through the write door, so it is Unix only like it.
#[cfg(unix)]
pub mod migrate;
#[cfg(feature = "host-provider")]
pub mod provider;
pub mod relocate;
#[cfg(unix)]
pub mod repair;
pub mod session;
/// The write door needs the no-follow directory primitives of Durable File, which are Unix only.
#[cfg(unix)]
pub mod write;

pub use error::ConfigRefusal;
/// The path segment type of `Origin` and the inspect verbs, so a reader names it without a second dependency.
pub use fgos_yaml_doc::Segment;
