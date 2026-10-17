//! Route `fgos internal attempt-step <stepId> --protocol 1 --run-dir <attemptDir>`:
//! the host half of a post-receipt step. It verifies the envelope of the
//! attempt, finds the Node payload of the same release through the envelope's
//! `payloadRoot` (never PATH, never the cwd) and hands over to
//! `src/run-supervisor/attempt-step.mjs`, whose exit code is this route's.

use std::path::{Path, PathBuf};

use crate::envelope;
use crate::route::{refuse, report, Flags, EXIT_ENVELOPE_INVALID, EXIT_INTERNAL, EXIT_PAYLOAD_MISSING, EXIT_VERSION_MISMATCH};

const ENTRY: &str = "src/run-supervisor/attempt-step.mjs";

pub fn run(args: &[String]) -> i32 {
    let flags = match Flags::parse(args, &["run-dir"], 1) {
        Ok(flags) => flags,
        Err(err) => return refuse("attempt-step", err),
    };
    let (Some(step_id), Ok(run_dir)) = (flags.positional.first(), flags.require("run-dir")) else {
        return refuse("attempt-step", crate::route::ArgsError::Usage("<stepId> and --run-dir are required".into()));
    };
    let run_dir = PathBuf::from(run_dir);
    let envelope = match envelope::read_verified(&run_dir.join("envelope.json")) {
        Ok(envelope) => envelope,
        Err(why) => {
            report("attempt-step", "envelope-invalid", &why);
            return EXIT_ENVELOPE_INVALID;
        }
    };
    if !envelope::host_bin_is_current(&envelope) {
        report("attempt-step", "host-version-mismatch", "the envelope names another host binary");
        return EXIT_VERSION_MISMATCH;
    }
    if !envelope["steps"].as_array().is_some_and(|steps| steps.iter().any(|s| s["stepId"] == step_id.as_str())) {
        report("attempt-step", "envelope-invalid", "the envelope has no such step");
        return EXIT_ENVELOPE_INVALID;
    }
    let Some(root) = envelope["payloadRoot"].as_str().map(PathBuf::from) else {
        report("attempt-step", "envelope-invalid", "payloadRoot missing");
        return EXIT_ENVELOPE_INVALID;
    };
    let entry = root.join(ENTRY);
    if !entry.is_file() {
        report("attempt-step", "payload-missing", &format!("{} does not exist", entry.display()));
        return EXIT_PAYLOAD_MISSING;
    }
    hand_over(&entry, step_id, &run_dir)
}

/// `node` through PATH; a step runner clears the environment, so without a
/// PATH the standard system directories are searched instead.
fn node_program() -> PathBuf {
    let path = std::env::var_os("PATH").unwrap_or_else(|| "/usr/local/bin:/usr/bin:/bin".into());
    std::env::split_paths(&path).map(|dir| dir.join("node")).find(|candidate| candidate.is_file()).unwrap_or_else(|| PathBuf::from("node"))
}

#[cfg(unix)]
fn hand_over(entry: &Path, step_id: &str, run_dir: &Path) -> i32 {
    use std::os::unix::process::CommandExt;
    let err = std::process::Command::new(node_program()).arg(entry).arg(step_id).arg("--run-dir").arg(run_dir).exec();
    report("attempt-step", "internal", &format!("node did not start: {err}"));
    EXIT_INTERNAL
}

#[cfg(not(unix))]
fn hand_over(entry: &Path, step_id: &str, run_dir: &Path) -> i32 {
    match std::process::Command::new("node").arg(entry).arg(step_id).arg("--run-dir").arg(run_dir).status() {
        Ok(status) => status.code().unwrap_or(EXIT_INTERNAL),
        Err(err) => {
            report("attempt-step", "internal", &format!("node did not start: {err}"));
            EXIT_INTERNAL
        }
    }
}
