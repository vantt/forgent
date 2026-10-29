//! YAML Document: one authority for what a YAML text means and what its bytes are after one change.
//! Contract: `docs/platform/yaml-document/spec.md`; golden fixtures: `packages/yaml-doc/contracts/`.
//!
//! # The seal
//!
//! No public function panics out of the crate. Every fallible entry runs inside [`guard::guard`],
//! which turns a panic into the refusal `yaml-internal-error` (a synchronous N-API call that
//! panics aborts the Node process); the infallible ones are total and listed as such in
//! `tests/api_seal.rs`, which fails when a public function is added without a row. A panic caught
//! there prints nothing: the default hook would write the panic message to stderr, and the
//! message of a failed string slice can quote input text, so the first guard installs one hook
//! that is silent inside a guard and delegates every other panic to the hook that was there
//! before. The cost is that a host which installs its own hook later replaces ours; the refusal
//! text is value-free either way. Release builds must keep `panic = "unwind"` (the test checks
//! the manifests), or `catch_unwind` catches nothing.
//!
//! A refusal and `Document`'s `Debug` carry the rule, file, path and position, never a value of
//! the input. The crate contains no `unsafe` code (the vendored parser's is covered by the upgrade
//! record) and spawns no threads.
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
pub use edit::{CommentLoss, Comments};
pub use model::{rule, Limits, Profile, Refusal, Segment, Span, Value};
