//! The component authority model and the `locate` lookup over it.
//!
//! The model is the set of files under `packages/component-authority/model/`; `model` loads them into typed rows
//! and `locate` ranks rows against a sentence describing work.

pub mod locate;
pub mod model;

pub use locate::{fold, locate, Match, MatchKind, MatchedOn};
pub use model::{
    Component, Contract, DecisionKind, Door, DoorPath, Layers, Model, ModelError, MODEL_DIR,
};
