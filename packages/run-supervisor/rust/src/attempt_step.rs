//! Route `fgos internal attempt-step <stepId> --protocol 1 --run-dir <attemptDir>`:
//! the host half of a post-receipt step. It verifies the envelope of the
//! attempt (digest, that it names this host binary, that it lists the step) and
//! hands the step to the [`StepRunner`] the composition root fills with the
//! Execution engine's steps; the runner prints the step's one result line and
//! its exit code is this route's. This crate runs no step itself.
//!
//! Also here: [`exec_payload`], the hand-over to a Node payload entry that the
//! head request route still uses.

use std::path::{Path, PathBuf};

use crate::envelope;
use crate::route::{
    refuse, report, Flags, StepRunner, EXIT_ENVELOPE_INVALID, EXIT_VERSION_MISMATCH,
};
#[cfg(unix)]
use crate::route::{EXIT_INTERNAL, EXIT_PAYLOAD_MISSING};

pub fn run(args: &[String], steps: &StepRunner) -> i32 {
    let flags = match Flags::parse(args, &["run-dir"], 1) {
        Ok(flags) => flags,
        Err(err) => return refuse("attempt-step", err),
    };
    let (Some(step_id), Ok(run_dir)) = (flags.positional.first(), flags.require("run-dir")) else {
        return refuse(
            "attempt-step",
            crate::route::ArgsError::Usage("<stepId> and --run-dir are required".into()),
        );
    };
    let run_dir = PathBuf::from(run_dir);
    let listed = |envelope: &serde_json::Value| {
        envelope["steps"]
            .as_array()
            .is_some_and(|steps| steps.iter().any(|s| s["stepId"] == step_id.as_str()))
            .then_some(())
            .ok_or("the envelope has no such step")
    };
    match verified_envelope("attempt-step", &run_dir, listed) {
        Ok(_) => steps(step_id, &run_dir),
        Err(exit) => exit,
    }
}

/// The host checks every route that acts on an attempt's envelope shares: the envelope verifies against its
/// digest, names this host binary, and `require` accepts it. `Err` is the exit code after the refusal was
/// reported.
pub(crate) fn verified_envelope(
    route: &str,
    run_dir: &Path,
    require: impl Fn(&serde_json::Value) -> Result<(), &'static str>,
) -> Result<serde_json::Value, i32> {
    let envelope = match envelope::read_verified(&run_dir.join("envelope.json")) {
        Ok(envelope) => envelope,
        Err(why) => {
            report(route, "envelope-invalid", &why);
            return Err(EXIT_ENVELOPE_INVALID);
        }
    };
    if !envelope::host_bin_is_current(&envelope) {
        report(
            route,
            "host-version-mismatch",
            "the envelope names another host binary",
        );
        return Err(EXIT_VERSION_MISMATCH);
    }
    if let Err(why) = require(&envelope) {
        report(route, "envelope-invalid", why);
        return Err(EXIT_ENVELOPE_INVALID);
    }
    Ok(envelope)
}

/// The head request route's hand-over to the Node payload: [`verified_envelope`], then find `entry` under the
/// envelope's `payloadRoot` (never PATH, never the cwd) and exec it as `node <entry> <leading...> --run-dir <dir>`.
/// stdin, stdout and stderr pass through; the exit code is the payload's.
#[cfg(unix)]
pub(crate) fn exec_payload(
    route: &str,
    run_dir: &Path,
    entry: &str,
    leading: &[String],
    require: impl Fn(&serde_json::Value) -> Result<(), &'static str>,
) -> i32 {
    let envelope = match verified_envelope(route, run_dir, require) {
        Ok(envelope) => envelope,
        Err(exit) => return exit,
    };
    let Some(root) = envelope["payloadRoot"].as_str().map(PathBuf::from) else {
        report(route, "envelope-invalid", "payloadRoot missing");
        return EXIT_ENVELOPE_INVALID;
    };
    let entry = root.join(entry);
    if !entry.is_file() {
        report(
            route,
            "payload-missing",
            &format!("{} does not exist", entry.display()),
        );
        return EXIT_PAYLOAD_MISSING;
    }
    hand_over(route, &entry, leading, run_dir)
}

/// `node` through PATH; a route started with a cleared environment searches the standard system directories.
#[cfg(unix)]
fn node_program() -> PathBuf {
    let path = std::env::var_os("PATH").unwrap_or_else(|| "/usr/local/bin:/usr/bin:/bin".into());
    std::env::split_paths(&path)
        .map(|dir| dir.join("node"))
        .find(|candidate| candidate.is_file())
        .unwrap_or_else(|| PathBuf::from("node"))
}

#[cfg(unix)]
fn hand_over(route: &str, entry: &Path, leading: &[String], run_dir: &Path) -> i32 {
    use std::os::unix::process::CommandExt;
    let err = std::process::Command::new(node_program())
        .arg(entry)
        .args(leading)
        .arg("--run-dir")
        .arg(run_dir)
        .exec();
    report(route, "internal", &format!("node did not start: {err}"));
    EXIT_INTERNAL
}
