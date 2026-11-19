//! Falsification probes of the local bwrap sandbox: each one runs a real sandbox and proves one thing the
//! confinement policy promises, and each has a RED FALSIFIER, a deliberately broken sandbox the same probe must
//! catch and fail on.
//!
//! Twin of `src/runner/dispatch/confinement/probes/harness.mjs`. The programs that run inside the sandbox are
//! POSIX `sh` scripts (the Node twin ran `node -e`), so a probe needs nothing on the machine but the sandbox and
//! a shell. Process runs go through `fgos-process`.
//!
//! The probes that need the driver's own argv (`peer_run_hidden`, `machine_private_hidden`) take the driver and
//! the resource resolver as ports, so they cannot pass on a shape the driver would never emit.

mod all;
mod basic;
mod fingerprint;
mod machine_private;
mod peer;
mod sandbox;

pub use all::{run_all_confinement_probes, ProbePorts, ProbeRun};
pub use basic::{
    executor_credentials_read_only, host_read_and_network_not_overclaimed, host_write_denied,
    no_inherited_writable_fd, other_run_dir_denied, private_home_isolated, run_output_writable,
    workspace_writable, WorkspaceFalsifier,
};
pub use fingerprint::{
    compute_platform_digest, compute_probe_fingerprint, platform_payload, FingerprintInput,
    PROOF_PROFILE,
};
pub use machine_private::{
    machine_private_hidden, MachinePrivateFalsifier, MACHINE_PRIVATE_FALSIFIERS,
};
pub use peer::peer_run_hidden;

use serde_json::{json, Value};

/// What one probe proved or failed to.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProbeResult {
    pub probe: &'static str,
    pub passed: bool,
    pub detail: String,
}

impl ProbeResult {
    pub(crate) fn new(probe: &'static str, passed: bool, ok: &str, failed: String) -> Self {
        Self {
            probe,
            passed,
            detail: if passed { ok.to_string() } else { failed },
        }
    }

    pub fn to_json(&self) -> Value {
        json!({ "probe": self.probe, "passed": self.passed, "detail": self.detail })
    }
}
