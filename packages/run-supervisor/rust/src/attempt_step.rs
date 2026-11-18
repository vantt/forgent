//! Route `fgos internal attempt-step <stepId> --protocol 1 --run-dir <attemptDir>`:
//! the host half of a post-receipt step. It verifies the envelope of the
//! attempt, finds the Node payload of the same release through the envelope's
//! `payloadRoot` (never PATH, never the cwd) and hands over to
//! `src/run-supervisor/attempt-step.mjs`, whose exit code is this route's.

use std::path::{Path, PathBuf};

use crate::envelope;
use crate::route::{
    refuse, report, Flags, EXIT_ENVELOPE_INVALID, EXIT_INTERNAL, EXIT_PAYLOAD_MISSING,
    EXIT_VERSION_MISMATCH,
};

pub(crate) const ENTRY: &str = "src/run-supervisor/attempt-step.mjs";

pub fn run(args: &[String]) -> i32 {
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
    exec_payload(
        "attempt-step",
        &PathBuf::from(run_dir),
        ENTRY,
        std::slice::from_ref(step_id),
        |envelope| {
            envelope["steps"]
                .as_array()
                .is_some_and(|steps| steps.iter().any(|s| s["stepId"] == step_id.as_str()))
                .then_some(())
                .ok_or("the envelope has no such step")
        },
    )
}

/// The host half every route that hands over to the Node payload shares: verify the envelope of the attempt
/// and that it names this host binary, let `require` judge what the route needs of it, find `entry` under the
/// envelope's `payloadRoot` (never PATH, never the cwd) and exec it as `node <entry> <leading...> --run-dir <dir>`.
/// stdin, stdout and stderr pass through; the exit code is the payload's.
pub(crate) fn exec_payload(
    route: &str,
    run_dir: &Path,
    entry: &str,
    leading: &[String],
    require: impl Fn(&serde_json::Value) -> Result<(), &'static str>,
) -> i32 {
    let envelope = match envelope::read_verified(&run_dir.join("envelope.json")) {
        Ok(envelope) => envelope,
        Err(why) => {
            report(route, "envelope-invalid", &why);
            return EXIT_ENVELOPE_INVALID;
        }
    };
    if !envelope::host_bin_is_current(&envelope) {
        report(
            route,
            "host-version-mismatch",
            "the envelope names another host binary",
        );
        return EXIT_VERSION_MISMATCH;
    }
    if let Err(why) = require(&envelope) {
        report(route, "envelope-invalid", why);
        return EXIT_ENVELOPE_INVALID;
    }
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

/// `node` through PATH; a step runner clears the environment, so without a
/// PATH the standard system directories are searched instead (Unix).
fn node_program() -> PathBuf {
    let program = if cfg!(windows) { "node.exe" } else { "node" };
    let path = std::env::var_os("PATH").unwrap_or_else(|| {
        if cfg!(windows) {
            "".into()
        } else {
            "/usr/local/bin:/usr/bin:/bin".into()
        }
    });
    std::env::split_paths(&path)
        .map(|dir| dir.join(program))
        .find(|candidate| candidate.is_file())
        .unwrap_or_else(|| PathBuf::from(program))
}

fn node_command(entry: &Path, leading: &[String], run_dir: &Path) -> std::process::Command {
    let mut cmd = std::process::Command::new(node_program());
    cmd.arg(entry).args(leading).arg("--run-dir").arg(run_dir);
    cmd
}

#[cfg(unix)]
fn hand_over(route: &str, entry: &Path, leading: &[String], run_dir: &Path) -> i32 {
    use std::os::unix::process::CommandExt;
    let err = node_command(entry, leading, run_dir).exec();
    report(route, "internal", &format!("node did not start: {err}"));
    EXIT_INTERNAL
}

#[cfg(not(unix))]
fn hand_over(route: &str, entry: &Path, leading: &[String], run_dir: &Path) -> i32 {
    match node_command(entry, leading, run_dir).status() {
        Ok(status) => status.code().unwrap_or(EXIT_INTERNAL),
        Err(err) => {
            report(route, "internal", &format!("node did not start: {err}"));
            EXIT_INTERNAL
        }
    }
}
