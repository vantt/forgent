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

/// The head-request-only handover: verify the immutable envelope, then accept either its pinned host or the
/// project's current activated host. Only the latter uses that release's manifest payload; attempt steps still
/// go exclusively through [`verified_envelope`].
/// stdin, stdout and stderr pass through; the exit code is the payload's.
#[cfg(unix)]
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
    if let Err(why) = require(&envelope) {
        report(route, "envelope-invalid", why);
        return EXIT_ENVELOPE_INVALID;
    }
    let (root, release) = if envelope::host_bin_is_current(&envelope) {
        let Some(root) = envelope["payloadRoot"].as_str().map(PathBuf::from) else {
            report(route, "envelope-invalid", "payloadRoot missing");
            return EXIT_ENVELOPE_INVALID;
        };
        (root, None)
    } else {
        match active_request_payload(&envelope) {
            Ok((root, release)) => (root, Some(release)),
            Err(why) => {
                report(route, "host-version-mismatch", &why);
                return EXIT_VERSION_MISMATCH;
            }
        }
    };
    let entry = root.join(entry);
    if release.is_some() && !std::fs::canonicalize(&entry).is_ok_and(|path| path.starts_with(&root))
    {
        report(
            route,
            "payload-missing",
            "the request entry is not inside the release payload",
        );
        return EXIT_PAYLOAD_MISSING;
    }
    if !entry.is_file() {
        report(
            route,
            "payload-missing",
            &format!("{} does not exist", entry.display()),
        );
        return EXIT_PAYLOAD_MISSING;
    }
    hand_over(route, &entry, leading, run_dir, release.as_deref())
}

/// The new host must be the activated host, and its payload must be a manifest-relative directory inside that
/// same release. No request argument or attempt-envelope rewrite supplies either path.
#[cfg(unix)]
fn active_request_payload(envelope: &serde_json::Value) -> Result<(PathBuf, PathBuf), String> {
    let resolve = || {
        let project = Path::new(envelope["cwd"].as_str()?);
        let host = fgos_host_runtime::activation::activated_host_bin(project)?;
        let current = std::fs::canonicalize(std::env::current_exe().ok()?).ok()?;
        if std::fs::canonicalize(&host).ok()? != current {
            return None;
        }
        let release = std::fs::canonicalize(host.parent()?.parent()?).ok()?;
        let manifest: serde_json::Value =
            serde_json::from_slice(&std::fs::read(release.join("manifest.json")).ok()?).ok()?;
        let relative = Path::new(manifest["components"]["legacyNode"]["root"].as_str()?);
        if relative.as_os_str().is_empty()
            || !relative
                .components()
                .all(|c| matches!(c, std::path::Component::Normal(_)))
        {
            return None;
        }
        let root = std::fs::canonicalize(release.join(relative)).ok()?;
        (root.starts_with(&release) && root.is_dir()).then_some((root, release))
    };
    resolve().ok_or_else(|| "the running host is neither the envelope host nor a ready activated release with a confined manifest payload".into())
}

/// `node` through PATH; a route started with a cleared environment searches the standard system directories.
#[cfg(unix)]
fn node_program() -> PathBuf {
    let path = std::env::var_os("PATH").unwrap_or_else(|| "/usr/local/bin:/usr/bin:/bin".into());
    fgos_process::spawn::resolve_program("node", &path.to_string_lossy(), "", false)
        .unwrap_or_else(|| PathBuf::from("node"))
}

#[cfg(unix)]
fn hand_over(
    route: &str,
    entry: &Path,
    leading: &[String],
    run_dir: &Path,
    release: Option<&Path>,
) -> i32 {
    use std::os::unix::process::CommandExt;
    let mut command = std::process::Command::new(node_program());
    if let Ok(host) = std::env::current_exe() {
        command
            .env("FGOS_HEAD_REQUEST_HOST_BIN", &host)
            .env("FGOS_HOST_BIN", host);
    }
    if let Some(release) = release {
        command
            .env("FGOS_ACTIVE_RELEASE_PATH", release)
            .env("FGOS_ACTIVE_MANIFEST_PATH", release.join("manifest.json"));
    }
    let err = command
        .arg(entry)
        .args(leading)
        .arg("--run-dir")
        .arg(run_dir)
        .exec();
    report(route, "internal", &format!("node did not start: {err}"));
    EXIT_INTERNAL
}
