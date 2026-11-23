//! The component authority model and the `locate` lookup over it.
//!
//! The model is the set of YAML files under `packages/component-authority/model/`; `model` loads them through
//! `fgos-yaml-doc` into typed rows and `locate` ranks rows against a sentence describing work.

pub mod locate;
pub mod model;

pub use locate::{fold, locate, Match, MatchKind, MatchedOn};
pub use model::{
    Component, Contract, DecisionKind, Door, DoorPath, Layers, Model, ModelError, TierException,
    MODEL_DIR,
};
