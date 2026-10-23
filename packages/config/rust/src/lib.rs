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
mod bundle;
mod cache;
mod detect;
mod files;
mod grammar;
mod lint;
mod redact;
mod schema;
mod scope;
mod snapshot;
mod standard;
mod validate;
mod write;

pub use error::ConfigRefusal;
