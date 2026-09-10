//! `fgos-host-runtime` crate.
//!
//! Kernel types, pure router, authority gate, and invocation pipeline.

pub mod catalog;
pub mod contracts;
pub mod operation_provider_router;
pub mod registry;

pub use catalog::CATALOG;
pub use contracts::*;
pub use operation_provider_router::{select, RouterPolicy, SelectionInput, SelectionRefused};
pub use registry::build_snapshot;
