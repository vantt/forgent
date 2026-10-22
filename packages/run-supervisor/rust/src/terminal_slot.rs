//! The supervisor's door to terminal-control: one driver, one core, built the
//! way the `fgos internal terminal-control` route builds them, addressed by the
//! attempt's slot key. The supervisor never allocates (the controller did, with
//! its serialization group); it launches into, reads from, types at and
//! releases the slot it was handed.
//!
//! The herdr endpoint comes from the supervisor's own environment
//! (`FGOS_HERDR_BIN`, `HERDR_SESSION`, `HERDR_SOCKET_PATH`), so the controller
//! that starts the supervisor decides which herdr it talks to.

use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use fgos_terminal_control::core::{Core, CoreConfig};
use fgos_terminal_control::driver::herdr::{HerdrConfig, HerdrDriver};
use fgos_terminal_control::policy::{policy_by_name, PlacementPolicy};
use fgos_terminal_control::port::{Disposition, ReleaseOutcome};
use fgos_terminal_control::route::{DEFAULT_ALLOCATION_GRACE_MS, DEFAULT_LAUNCH_IDENTIFY_TIMEOUT_MS, DEFAULT_SHELL_READY_TIMEOUT_MS, DEFAULT_LIMITS};
use fgos_terminal_control::store::default_state_root;
use serde_json::Value;

/// How long a pane kept for a person stays before terminal-control's reconcile may close it, when the
/// envelope names no setting.
pub const RETAIN_FAILED_PANE_MS: u64 = 24 * 60 * 60 * 1000;

/// The retain window an envelope asks for (`terminal.retainFailedPaneMs`): a number of milliseconds, `null`
/// for "until a person closes it" (`None`), absent for the default.
pub fn retain_window(envelope: &Value) -> Option<u64> {
    match envelope["terminal"].get("retainFailedPaneMs") {
        None => Some(RETAIN_FAILED_PANE_MS),
        Some(Value::Null) => None,
        Some(window) => Some(window.as_u64().unwrap_or(RETAIN_FAILED_PANE_MS)),
    }
}

/// The driver, policy and config a [`Core`] borrows.
pub struct Backend {
    driver: HerdrDriver,
    policy: Box<dyn PlacementPolicy>,
    config: CoreConfig,
}

impl Backend {
    /// The backend of this process's environment; what the environment does not name comes from the
    /// endpoint the supervisor recorded in the attempt directory (adopt runs under another environment).
    pub fn from_env(run_dir: &Path) -> Backend {
        let recorded: Value = std::fs::read_to_string(run_dir.join(ENDPOINT_FILE)).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or(Value::Null);
        let pick = |var: &str, field: &str| std::env::var(var).ok().filter(|v| !v.is_empty()).or_else(|| recorded[field].as_str().filter(|v| !v.is_empty()).map(String::from));
        let mut herdr = HerdrConfig::new(pick("FGOS_HERDR_BIN", "bin").unwrap_or_default());
        herdr.session = pick("HERDR_SESSION", "session");
        herdr.socket_path = pick("HERDR_SOCKET_PATH", "socket");
        let config = CoreConfig {
            state_root: default_state_root(),
            limits: DEFAULT_LIMITS,
            allocation_grace_ms: DEFAULT_ALLOCATION_GRACE_MS,
            launch_identify_timeout_ms: DEFAULT_LAUNCH_IDENTIFY_TIMEOUT_MS,
            shell_ready_timeout_ms: DEFAULT_SHELL_READY_TIMEOUT_MS,
        };
        Backend {
            driver: HerdrDriver::new(herdr),
            policy: policy_by_name(None).expect("the default placement policy always exists"),
            config,
        }
    }

    pub fn core(&self) -> Core<'_> {
        Core::new(&self.driver, self.policy.as_ref(), self.config.clone())
    }
}

/// Where the supervisor records the herdr endpoint it launched into.
pub const ENDPOINT_FILE: &str = "terminal-endpoint.json";

/// Record the herdr endpoint of this process's environment next to the attempt, once.
pub fn record_endpoint(run_dir: &Path) {
    let get = |var: &str| std::env::var(var).ok().filter(|v| !v.is_empty());
    let body = serde_json::json!({"v": 1, "bin": get("FGOS_HERDR_BIN"), "session": get("HERDR_SESSION"), "socket": get("HERDR_SOCKET_PATH")});
    if let Ok(bytes) = serde_json::to_vec(&body) {
        let _ = crate::publish::publish_once(run_dir, ENDPOINT_FILE, &bytes);
    }
}

pub fn now_ms() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis() as u64).unwrap_or(0)
}

/// Close for a recognized gate exit with both captured streams; the step runner asks only once every
/// settlement step has its receipt. Missing facts or a lost gate/carrier retain the live diagnostics.
pub fn disposition_for(receipt: Option<&Value>) -> Disposition {
    let captured_exit = receipt.is_some_and(|r| {
        let exit = &r["gateExit"];
        let ended = match r["outcome"].as_str() {
            Some("exited") => exit["stoppedBy"] == "agent"
                || (exit["stoppedBy"] == "orphan" && exit["cause"] == "orphan-result" && r["outboxPresent"] == true),
            Some("cancelled") => exit["stoppedBy"] == "cancel",
            Some("timeout") => matches!(exit["stoppedBy"].as_str(), Some("soft-deadline" | "idle" | "hard-ceiling")),
            Some("output-limit") => exit["stoppedBy"] == "output-limit",
            _ => false,
        };
        let captured = ["stdout", "stderr"].iter().all(|stream| {
            r["captureDigests"][stream].as_str().is_some_and(|digest| {
                digest.strip_prefix("sha256:").is_some_and(|hex| hex.len() == 64 && hex.bytes().all(|b| b.is_ascii_hexdigit()))
            })
        });
        ended && captured
    });
    if captured_exit { Disposition::Close } else { Disposition::Retain }
}

/// Why `release-slot` has no receipt.
#[derive(Debug, PartialEq, Eq)]
pub enum ReleaseFailure {
    /// Terminal-control could not prove it may act: adopt tries again.
    Retry(String),
    /// This machine cannot release the slot at all.
    Unsupported(String),
}

/// `release(key, disposition)`; `Ok` carries the detail the step receipt records.
pub fn release(backend: &Backend, key: &str, disposition: Disposition, retain_window: Option<u64>) -> Result<Value, ReleaseFailure> {
    use fgos_terminal_control::port::Refusal;
    // A retained pane with no window stays until a person closes it.
    let until = if disposition == Disposition::Retain { retain_window.map(|window| now_ms() + window) } else { None };
    match backend.core().release(key, disposition, until) {
        Ok(ReleaseOutcome::Released { disposition }) => Ok(serde_json::json!({"disposition": disposition, "key": key})),
        Ok(ReleaseOutcome::KeptUnknown { reason }) => Err(ReleaseFailure::Retry(reason)),
        Err(Refusal::Unknown { reason }) => Err(ReleaseFailure::Retry(reason)),
        Err(Refusal::Unsupported { capability, detail }) => Err(ReleaseFailure::Unsupported(format!("{capability}: {detail}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn the_envelope_sets_how_long_a_retained_pane_stays() {
        assert_eq!(retain_window(&json!({"terminal": {}})), Some(RETAIN_FAILED_PANE_MS), "absent means the default");
        assert_eq!(retain_window(&json!({"terminal": {"retainFailedPaneMs": null}})), None, "null keeps it until a person closes it");
        assert_eq!(retain_window(&json!({"terminal": {"retainFailedPaneMs": 90000}})), Some(90000));
    }

    #[test]
    fn missing_receipt_or_missing_facts_retain() {
        assert_eq!(disposition_for(None), Disposition::Retain);
        assert_eq!(disposition_for(Some(&json!({"outcome": "exited", "outboxPresent": true}))), Disposition::Retain);
    }
}
