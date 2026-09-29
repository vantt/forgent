//! `fgos-observe` crate.
//!
//! Provides observation contracts, stores (tracked, sharded by writer),
//! store locking, and native CLI dispatch for `fgos metrics` and `fgos friction`.

pub mod case_journal;
pub mod contract;
pub mod friction;
pub mod friction_cli;
pub mod metrics_cli;
pub mod scorecard;
pub mod provider;
pub mod shard;
pub mod sources;
pub mod store_lock;

pub use contract::*;
pub use provider::{
    ObserveFrictionProvider, ObserveMetricsProvider, OBSERVE_FRICTION_DESCRIPTOR,
    OBSERVE_METRICS_DESCRIPTOR,
};
pub use shard::{read_all_json, resolve_writer_id, shard_path};
pub use store_lock::{acquire_store_lock, ObserveLockError, StoreLockGuard};
