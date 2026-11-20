//! Observe record contract v2: the record shape, the registry that checks it, and the store it is written to.

pub mod registry;
pub mod store;
pub mod types;

pub use store::{
    parse_retention_duration, prune, prune_with_lock_wait, prune_with_now, Health, PruneError,
    PruneReport, RecordDoor, WriteOutcome,
};
