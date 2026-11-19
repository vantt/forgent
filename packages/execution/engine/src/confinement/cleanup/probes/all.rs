//! Every probe of a sandbox, in order, with the one verdict the doctor rows read.

use super::basic::*;
use super::machine_private::{machine_private_hidden, MachinePrivateFalsifier};
use super::peer::peer_run_hidden;
use super::ProbeResult;
use crate::confinement::driver::{BackendDriver, ResourceResolver};
use std::fs;
use std::path::Path;
use std::sync::Arc;

/// The ports the two driver-backed probes need: the resource resolver, and a driver built over the environment of
/// a given user runtime directory (the driver binds back only a GO socket in that directory).
pub struct ProbePorts<'a> {
    pub resolver: &'a dyn ResourceResolver,
    pub driver_for: &'a dyn Fn(&Path) -> Arc<dyn BackendDriver>,
}

/// The verdict of [`run_all_confinement_probes`].
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProbeRun {
    pub passed: bool,
    pub message: String,
    pub results: Vec<ProbeResult>,
}

/// Runs all 9 probes against a bwrap executable under `scratch`; a blind dispatch adds a tenth,
/// [`peer_run_hidden`], and its machine-private probe also covers `hostRead: blind`. `scratch` is created when
/// absent and left in place for the caller to remove.
pub fn run_all_confinement_probes(
    bwrap: &str,
    scratch: &Path,
    blind: bool,
    ports: &ProbePorts<'_>,
) -> ProbeRun {
    if !cfg!(target_os = "linux") {
        return ProbeRun {
            passed: false,
            message: format!("platform \"{}\" is not Linux", std::env::consts::OS),
            results: Vec::new(),
        };
    }
    let dir = |name: &str| scratch.join(name);
    let names = [
        "rundir",
        "targetdir",
        "wsdir",
        "outsidedir",
        "other-rundir",
        "host-home",
        "private-home",
        "creds",
        "machine-private",
    ];
    if let Some(err) = names.iter().find_map(|n| fs::create_dir_all(dir(n)).err()) {
        return ProbeRun {
            passed: false,
            message: format!("confinement probes could not start: {err}"),
            results: Vec::new(),
        };
    }
    let mut results = vec![
        run_output_writable(bwrap, &dir("rundir"), false),
        host_write_denied(bwrap, &dir("targetdir"), false),
        workspace_writable(
            bwrap,
            &dir("wsdir"),
            &dir("outsidedir"),
            WorkspaceFalsifier::None,
        ),
        other_run_dir_denied(bwrap, &dir("rundir"), &dir("other-rundir"), false),
        private_home_isolated(bwrap, &dir("host-home"), &dir("private-home"), false),
        no_inherited_writable_fd(bwrap, &dir("host-fd-test.txt"), false),
        executor_credentials_read_only(bwrap, &dir("creds"), false),
        host_read_and_network_not_overclaimed(bwrap, false),
        machine_private_hidden(
            bwrap,
            &dir("machine-private"),
            blind,
            ports,
            MachinePrivateFalsifier::None,
        ),
    ];
    if blind {
        let blind_dir = dir("blind");
        if fs::create_dir_all(&blind_dir).is_ok() {
            results.push(peer_run_hidden(
                bwrap,
                &blind_dir,
                std::process::id(),
                ports,
                false,
            ));
        }
    }
    let failed: Vec<String> = results
        .iter()
        .filter(|r| !r.passed)
        .map(|r| format!("{} ({})", r.probe, r.detail))
        .collect();
    let passed = failed.is_empty();
    ProbeRun {
        passed,
        message: if passed {
            format!(
                "all {} local-bwrap-v1 confinement probes passed",
                results.len()
            )
        } else {
            format!("confinement probes failed: {}", failed.join("; "))
        },
        results,
    }
}
