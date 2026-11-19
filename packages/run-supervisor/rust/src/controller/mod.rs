//! The controller half of an attempt: what hands a run over to its supervisor, ported from the Node
//! modules of `src/run-supervisor/` with their behaviour unchanged. `lease` (the run control ledger) builds
//! with the `lease` feature alone; every other module needs `supervise`.

pub mod lease;

#[cfg(feature = "supervise")]
pub mod adopt_scan;
#[cfg(feature = "supervise")]
pub mod cancel;
#[cfg(feature = "supervise")]
pub mod config;
#[cfg(feature = "supervise")]
pub mod cwd_lock;
#[cfg(feature = "supervise")]
pub mod error;
#[cfg(feature = "supervise")]
pub mod launch;
#[cfg(feature = "supervise")]
pub mod proof;
#[cfg(feature = "supervise")]
pub mod runtime_dir;
#[cfg(feature = "supervise")]
pub mod sweep;
#[cfg(feature = "supervise")]
pub mod trust_store;
