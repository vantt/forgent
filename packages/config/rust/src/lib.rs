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

pub mod error;
pub mod locks;
// Modules below are stubs; each names the phase that fills it.
pub mod bundle;
pub mod cache;
pub mod detect;
pub mod files;
pub mod grammar;
pub mod lint;
mod redact;
pub mod schema;
pub mod scope;
pub mod snapshot;
pub mod standard;
pub mod validate;
mod write;

pub use error::ConfigRefusal;
