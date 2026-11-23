//! The component authority model, the `locate` lookup over it and the `render` of its ownership views.
//!
//! The model is the set of YAML files under `packages/component-authority/model/`; `model` loads them through
//! `fgos-yaml-doc` into typed rows, `locate` ranks rows against a sentence describing work and `render` writes
//! the generated blocks of the platform docs.

pub mod declare;
pub mod locate;
pub mod model;
pub mod render;

pub use declare::{declare, Approvals, DeclareRequest, Declared, Kind, QuestionState, Refusal};
pub use locate::{fold, locate, Match, MatchKind, MatchedOn};
pub use model::{
    Component, Contract, DecisionKind, Door, DoorPath, Layers, Model, ModelError, TierException,
    MODEL_DIR,
};
