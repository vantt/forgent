//! Process facts and process control: the single authority for "is this
//! process tuple alive, dead or unknown" and for signalling a process by
//! identity.
//!
//! `facts` judges a normalized `{host, bootId, pidNs, pid, startTime}` tuple;
//! `control` signals by identity without a pid-reuse window. Judge vectors:
//! `packages/process/contracts/process-facts.judge.v1.json`.

/// Liveness judgment over a process tuple.
pub mod facts {}

/// Signalling and termination by process identity.
pub mod control {}
