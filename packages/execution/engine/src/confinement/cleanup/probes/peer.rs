//! Probe: a worker under `hostRead: blind` cannot see a peer's run state, a peer's private home or a peer's
//! process, and still reads its own directory (read-only) and writes its outbox.

use super::sandbox::{parse_lines, run, CODE_FN};
use super::{ProbePorts, ProbeResult};
use fgos_execution::runner_config::fgos_dir_from_root;
use serde_json::{json, Value};
use std::fs;
use std::path::Path;

/// RED FALSIFIER (`broken`): the same plan without its hidden-root masks must let the worker read the planted
/// peer file. `peer_pid` is a live process of this machine the sandbox must not see (any other process of the
/// machine will do).
pub fn peer_run_hidden(
    bwrap: &str,
    scratch: &Path,
    peer_pid: u32,
    ports: &ProbePorts<'_>,
    broken: bool,
) -> ProbeResult {
    let name = "peer-run-hidden";
    let fail = |why: String| ProbeResult::new(name, false, "", why);
    let root = match fs::canonicalize(scratch) {
        Ok(root) => root,
        Err(err) => return fail(format!("blind read probe failed: {err}")),
    };
    let project = root.join("project");
    let fgos_dir = fgos_dir_from_root(&project.to_string_lossy());
    let fgos = Path::new(&fgos_dir);
    let peer_report = fgos.join("assignments/probe-unit/peer/1/outbox/report-1.md");
    let own_dir = fgos.join("assignments/probe-unit/self/1");
    let own_brief = own_dir.join("brief.md");
    let run_dir = own_dir.join("runs/01");
    let outbox = run_dir.join("worker-output/outbox/probe-out.txt");
    let temp_root = root.join("confinement-temp");
    let peer_home_file = temp_root.join("peer-dispatch/home/transcript.txt");
    for file in [&peer_report, &own_brief, &peer_home_file] {
        let planted = file
            .parent()
            .map(fs::create_dir_all)
            .transpose()
            .and_then(|_| fs::write(file, "PLANTED"));
        if let Err(err) = planted {
            return fail(format!("blind read probe failed: {err}"));
        }
    }
    if let Err(err) = fs::create_dir_all(outbox.parent().expect("an outbox file has a parent")) {
        return fail(format!("blind read probe failed: {err}"));
    }

    let text = |p: &Path| p.to_string_lossy().into_owned();
    let context = json!({ "cwd": text(&project), "repoRoot": text(&project), "runDir": text(&run_dir), "fgosDir": fgos_dir });
    let mut resolve_context = context.clone();
    resolve_context["assignmentLaunchContext"] = json!({});
    let resolved = ports.resolver.resolve(&json!({
        "dispatchId": "probe-peer-run-hidden",
        "context": resolve_context,
        "grants": [
            { "resource": "run-output", "access": "write", "scope": "dispatch" },
            { "resource": "workspace", "access": "read", "scope": "dispatch" },
        ],
        "backendConfig": { "tempRoot": text(&temp_root) },
        "blind": true,
    }));
    let resources: Vec<Value> = match resolved {
        Ok(list) => list
            .into_iter()
            .filter(|res| {
                !(broken && res.get("resource").and_then(Value::as_str) == Some("hidden-root"))
            })
            .collect(),
        Err(err) => return fail(format!("blind read probe failed: {err}")),
    };
    let script = format!(
        "{CODE_FN}echo \"peerReport=$(code cat \"$1\")\"; echo \"peerHome=$(code cat \"$2\")\"; echo \"peerProcess=$(code cat /proc/$3/cmdline)\"; echo \"ownBrief=$(code cat \"$4\")\"; echo \"ownBriefWrite=$(code sh -c 'printf EDIT > \"$1\"' x \"$4\")\"; echo \"outbox=$(code sh -c 'printf WRITTEN > \"$1\"' x \"$5\")\""
    );
    let request = json!({
        "dispatchId": "probe-peer-run-hidden",
        "override": { "controls": { "hostRead": "blind" } },
        "invocation": {
            "command": "sh",
            "args": ["-c", script, "sh", text(&peer_report), text(&peer_home_file), peer_pid.to_string(), text(&own_brief), text(&outbox)],
            "env": {},
        },
        "context": context,
    });
    let driver = (ports.driver_for)(Path::new(""));
    let prepared = match driver.prepare(
        &json!({ "resources": resources }),
        &request,
        &json!({ "id": "bwrap", "config": { "executable": bwrap } }),
    ) {
        Ok(prepared) => prepared,
        Err(err) => return fail(format!("blind read probe failed: {err}")),
    };
    let command = prepared
        .invocation
        .get("command")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let args: Vec<String> = prepared
        .invocation
        .get("args")
        .and_then(Value::as_array)
        .map(|list| {
            list.iter()
                .filter_map(|a| a.as_str().map(str::to_string))
                .collect()
        })
        .unwrap_or_default();
    let ran = run(command, &args);
    let seen = parse_lines(&ran.stdout);
    let outbox_host_side = fs::read_to_string(&outbox).is_ok_and(|c| c == "WRITTEN");
    let is = |key: &str, want: &str| seen.get(key).is_some_and(|v| v == want);
    let passed = !seen.is_empty()
        && is("peerReport", "ENOENT")
        && is("peerHome", "ENOENT")
        && is("peerProcess", "ENOENT")
        && is("ownBrief", "ok")
        && is("ownBriefWrite", "EROFS")
        && is("outbox", "ok")
        && outbox_host_side;
    let shown = if seen.is_empty() {
        if ran.stderr.is_empty() {
            "worker reported nothing".to_string()
        } else {
            ran.stderr.clone()
        }
    } else {
        ran.stdout.trim().replace('\n', ", ")
    };
    ProbeResult::new(
        name,
        passed,
        "a blind worker cannot read a peer run, a peer home or a peer process, and keeps its own directory and outbox",
        format!("blind read probe failed: {shown}"),
    )
}
