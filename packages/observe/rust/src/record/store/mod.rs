//! The v2 record store: a fail-open, time-bounded write door, per-writer health counters, and the read side.
//!
//! Records live in `.fgos/observe/records/<writerId>.jsonl` through the shard door, under the shared observe lock;
//! each writer's counters live in `.fgos/observe/records/health/<writerId>.json`, written under the same lock.

mod door;
mod health;
mod source;

pub use door::{new_record_id, RecordDoor, WriteOutcome, DEFAULT_LOCK_WAIT};
pub use health::{Health, HealthSource, HEALTH_DECLARATION, HEALTH_KIND};
pub use source::{RecordStoreSource, RECORDS_STORE};
