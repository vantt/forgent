//! Observe record contract v2: the record shape, the registry that checks it, and the store it is written to.

pub mod registry;
pub mod store;
pub mod types;

pub use store::{Health, RecordDoor, WriteOutcome};
