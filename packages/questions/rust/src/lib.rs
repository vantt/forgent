//! Owner questions: the store behind `fgos questions`. A question is asked, answered, acknowledged or
//! cancelled by four events of one Event Store stream; every list is a fold over a read of that stream.
//!
//! The crate reaches the store only through the [`store::QuestionLog`] port (the host wires it to the
//! Event Store), the caller only through [`caller::CallerSource`], and writes nothing but the per-machine
//! view `.fgos/cache/questions.json`. Spec: `docs/platform/questions/spec.md`; contracts:
//! `packages/questions/contracts/`.

pub mod caller;
pub mod record;
pub mod refcheck;
pub mod refusal;
pub mod shape;
pub mod source;
pub mod store;
pub mod usecase;

pub use refusal::Refusal;
