//! YAML Document: one authority for what a YAML text means and what its bytes are after one change.
//! Contract: `docs/platform/yaml-document/spec.md`; golden fixtures: `packages/yaml-doc/contracts/`.
#![forbid(unsafe_code)]

mod backend;
pub mod comment;
pub mod document;
pub mod edit;
mod expand;
pub mod guard;
pub mod merge;
pub mod model;
pub mod path;
pub mod prescan;
mod profile;

pub use document::{parse, Document, NodeSpans};
pub use model::{rule, Limits, Profile, Refusal, Segment, Span, Value};
