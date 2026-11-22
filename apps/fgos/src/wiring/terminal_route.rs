//! The terminal-control route asked in process: its core built from the same envelope the route process reads,
//! through the one door the `terminal-control` route builds its core by (`CoreParts`). One place for the doctor's
//! terminal rows, the dispatch reads that scan allocations and the probe that closes the pane a round left open.

use fgos_execution_engine::transport::terminal_slot::resolve_herdr_bin;
use fgos_terminal_control::port::{Finding, Refusal};
use fgos_terminal_control::route::{ConfigRefusal, CoreParts};
use serde_json::{json, Map, Value};
use std::path::Path;
use std::time::Instant;

/// The whole budget of one route question, as the Node client gave it.
pub(crate) const ROUTE_TIMEOUT_MS: u64 = 15_000;

/// The herdr endpoint and binary a route is asked through.
pub(crate) struct HostRoute {
    herdr_bin: String,
    env: Map<String, Value>,
}

impl HostRoute {
    /// The route for the herdr endpoint `env` names (its `HERDR_*` or anchor variables; empty is the caller's own
    /// endpoint), with the herdr binary found through `lookup`.
    pub(crate) fn new(env: Map<String, Value>, lookup: &dyn Fn(&str) -> Option<String>) -> Self {
        HostRoute {
            herdr_bin: resolve_herdr_bin(None, lookup),
            env,
        }
    }

    /// The route for `env`, with the herdr binary found through this process's environment.
    pub(crate) fn from_process(env: Map<String, Value>) -> Self {
        Self::new(env, &|key: &str| std::env::var(key).ok())
    }

    /// The herdr binary this route asks through.
    pub(crate) fn herdr_bin(&self) -> &str {
        &self.herdr_bin
    }

    /// The route's core parts under the `terminal` settings `config`, or why the core cannot be built.
    pub(crate) fn parts(&self, config: &Value) -> Result<CoreParts, ConfigRefusal> {
        let envelope = json!({
            "herdrBin": self.herdr_bin,
            "env": self.env,
            "config": config,
            "timeoutMs": ROUTE_TIMEOUT_MS,
        });
        CoreParts::from_envelope(&envelope, Instant::now())
    }

    /// The allocation scan past `older_than_ms`, or why the route gave none.
    pub(crate) fn reconcile_scan(&self, older_than_ms: u64) -> Result<Vec<Finding>, ScanFault> {
        let parts = self
            .parts(&json!({}))
            .map_err(|refusal| ScanFault::NotAnswered(refusal.message))?;
        let scan = parts.core().reconcile_scan(older_than_ms);
        scan.map_err(ScanFault::Refused)
    }
}

/// Why an allocation scan has no findings to give.
#[derive(Debug, Clone)]
pub enum ScanFault {
    /// The route could not be built or did not answer.
    NotAnswered(String),
    /// The route answered with a refusal.
    Refused(Refusal),
}

/// Why the allocations were not scanned, and how loud that is (`warning` or `info`).
#[derive(Debug, PartialEq, Eq)]
pub struct NotScanned {
    pub level: &'static str,
    pub reason: String,
}

impl NotScanned {
    fn warning(reason: String) -> Self {
        NotScanned {
            level: "warning",
            reason,
        }
    }
}

/// `terminal.allocationGraceMs` of the project at `root`, read through the config provider (project over global
/// over the standard), the one reader the doctor row and `fgos dispatch inspect --terminal` share; it reads on
/// every platform.
pub(crate) fn allocation_grace(root: &Path) -> Result<u64, NotScanned> {
    grace_of(
        fgos_config::provider::effective_value(root, "terminal.allocationGraceMs")
            .map_err(|refusal| format!("{}: {}", refusal.reason, refusal.detail)),
    )
}

/// The grace in milliseconds a read setting gives, or why the allocations cannot be scanned with it.
pub(crate) fn grace_of(read: Result<Option<Value>, String>) -> Result<u64, NotScanned> {
    let value = read.map_err(|why| {
        NotScanned::warning(format!(
            "terminal.* unreadable, allocations not scanned: {why}"
        ))
    })?;
    value.as_ref().and_then(Value::as_u64).ok_or_else(|| {
        NotScanned::warning(
            "terminal.allocationGraceMs is invalid (see terminal-control), allocations not scanned"
                .to_owned(),
        )
    })
}

/// The allocations past `grace`, scanned by `scan`, or why they were not: the one ladder the doctor row and
/// `fgos dispatch inspect --terminal` report.
pub(crate) fn scan_allocations(
    grace: Result<u64, NotScanned>,
    scan: impl FnOnce(u64) -> Result<Vec<Finding>, ScanFault>,
) -> Result<(u64, Vec<Finding>), NotScanned> {
    let grace = grace?;
    match scan(grace) {
        Ok(findings) => Ok((grace, findings)),
        Err(ScanFault::NotAnswered(why)) => Err(NotScanned::warning(format!(
            "the terminal-control route did not answer, allocations not scanned ({why})"
        ))),
        Err(ScanFault::Refused(Refusal::Unsupported { capability, detail })) => Err(NotScanned {
            level: "info",
            reason: format!(
                "allocations not scanned: terminal mode is unsupported here ({})",
                if detail.is_empty() {
                    capability
                } else {
                    detail
                }
            ),
        }),
        Err(ScanFault::Refused(Refusal::Unknown { reason })) => {
            Err(NotScanned::warning(if reason.is_empty() {
                "allocation scan answered unknown".to_owned()
            } else {
                format!("allocation scan answered unknown ({reason})")
            }))
        }
    }
}
