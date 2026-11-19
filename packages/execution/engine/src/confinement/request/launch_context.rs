//! The launch context of an assignment or a head session: its own shape, and its agreement with what the run
//! directory already holds.

use std::path::Path;

use serde_json::Value;

use super::error::RequestError;
use super::js::{
    display, get, is_object, json_text, non_blank, positive_integer, strict_eq, truthy,
};

const INVALID: &str = "confinement-launch-context-invalid";

const CONTRACTS: [&str; 3] = [
    "assignment-cli-spawn-launch-context.v1",
    "assignment-herdr-spawn-launch-context.v1",
    "assignment-launch-context.v1",
];

const KINDS: [&str; 2] = ["assignment", "session"];

/// What a session launch context may not carry: the evidence of a run control. A session (a head session) is not
/// a unit of work, so nothing settles it and no control epoch is taken for it; the one live head of a persona and
/// name is fenced by Identity's role registration. A context that carries these fields is an assignment context in
/// disguise and is refused rather than read leniently.
const SESSION_FORBIDDEN: [(&str, &str); 4] = [
    ("run", "dispatchPlanDigest"),
    ("run", "evaluatorBaselineDigest"),
    ("command", "controlEpoch"),
    ("command", "controlTokenDigest"),
];

fn invalid(message: impl Into<String>) -> RequestError {
    RequestError::coded(INVALID, message)
}

fn sha256_text(value: Option<&Value>) -> bool {
    matches!(value, Some(Value::String(s)) if s.starts_with("sha256:"))
}

/// A record in the run directory, parsed; `None` when absent or not JSON (a file that cannot be read is ignored).
fn record(path: &Path) -> Option<Value> {
    serde_json::from_str(&std::fs::read_to_string(path).ok()?).ok()
}

/// Both sides present and different: the one comparison every cross-check makes.
fn differs(recorded: Option<&Value>, launched: Option<&Value>) -> bool {
    match (recorded, launched) {
        (Some(a), Some(b)) => !strict_eq(a, b),
        _ => false,
    }
}

/// Both sides truthy and different (a blank or missing field on either side is not checked).
fn truthy_differs(recorded: Option<&Value>, launched: Option<&Value>) -> bool {
    truthy(recorded) && truthy(launched) && differs(recorded, launched)
}

fn field<'a>(side: Option<&'a Value>, key: &str) -> Option<&'a Value> {
    side.and_then(|s| get(s, key))
}

/// Refuses a launch context that disagrees with the run record, the evaluator baseline or the command record the
/// controller already wrote under `run_dir`.
pub fn cross_check_assignment_launch_context(
    launch: &Value,
    context: Option<&Value>,
) -> Result<(), RequestError> {
    let Some(run_dir) = context
        .and_then(|c| get(c, "runDir"))
        .filter(|dir| truthy(Some(dir)))
        .and_then(Value::as_str)
    else {
        return Ok(());
    };
    let run_dir = Path::new(run_dir);
    let run = get(launch, "run");
    let command = get(launch, "command");

    if let Some(meta) = record(&run_dir.join("run.json")).filter(|m| m.is_object()) {
        let mismatch = |what: &str, ours: Option<&Value>, theirs: Option<&Value>| {
            invalid(format!(
                "assignmentLaunchContext {what} \"{}\" mismatches run.json {what} \"{}\".",
                display(ours),
                display(theirs)
            ))
        };
        for key in ["runId", "assignmentId", "dispatchPlanDigest"] {
            let (ours, theirs) = (field(run, key), get(&meta, key));
            if truthy_differs(theirs, ours) {
                return Err(mismatch(key, ours, theirs));
            }
        }
        let (ours, theirs) = (field(run, "attempt"), get(&meta, "attempt"));
        if differs(theirs, ours) {
            return Err(mismatch("attempt", ours, theirs));
        }
    }

    let baseline = run_dir.join("controller").join("evaluator-baseline.json");
    if let Some(found) = record(&baseline).filter(|r| r.is_object()) {
        let (ours, theirs) = (field(run, "evaluatorBaselineDigest"), get(&found, "digest"));
        if truthy_differs(theirs, ours) {
            return Err(invalid(format!(
                "assignmentLaunchContext evaluatorBaselineDigest \"{}\" mismatches evaluator-baseline digest \"{}\".",
                display(ours),
                display(theirs)
            )));
        }
    }

    if let Some(id) = field(command, "launchCommandId").filter(|id| truthy(Some(id))) {
        let file = format!("{}.json", display(Some(id)));
        let path = run_dir.join("controller").join("commands").join(file);
        if let Some(found) = record(&path).filter(|r| r.is_object()) {
            let (ours, theirs) = (field(run, "runId"), get(&found, "runId"));
            if truthy_differs(theirs, ours) {
                return Err(invalid(format!(
                    "assignmentLaunchContext runId \"{}\" mismatches command file runId \"{}\".",
                    display(ours),
                    display(theirs)
                )));
            }
            let (ours, theirs) = (field(command, "controlEpoch"), get(&found, "controlEpoch"));
            if differs(theirs, ours) {
                return Err(invalid(format!(
                    "assignmentLaunchContext controlEpoch \"{}\" mismatches command file controlEpoch \"{}\".",
                    display(ours),
                    display(theirs)
                )));
            }
            let (ours, theirs) = (
                field(command, "controlTokenDigest"),
                get(&found, "controlTokenDigest"),
            );
            if truthy_differs(theirs, ours) {
                return Err(invalid(
                    "assignmentLaunchContext controlTokenDigest mismatches command file controlTokenDigest.",
                ));
            }
        }
    }
    Ok(())
}

/// The session shape: ids of the run and command, the head's role, and none of the run-control fields.
fn validate_session(launch: &Value) -> Result<(), RequestError> {
    for (section, name) in SESSION_FORBIDDEN {
        if let Some(found) = get(launch, section) {
            if truthy(Some(found)) && get(found, name).is_some() {
                return Err(invalid(format!(
                    "session assignmentLaunchContext.{section}.{name} is a run-control field; a session has no run control."
                )));
            }
        }
    }
    let run = get(launch, "run");
    let command = get(launch, "command");
    let session = get(launch, "session");
    let Some(run) = run.filter(|r| is_object(Some(r))) else {
        return Err(invalid(
            "session assignmentLaunchContext.run must be an object.",
        ));
    };
    if !non_blank(get(run, "runId")) {
        return Err(invalid(
            "session assignmentLaunchContext.run.runId must be a non-empty string.",
        ));
    }
    if !non_blank(get(run, "assignmentId")) {
        return Err(invalid("session assignmentLaunchContext.run.assignmentId (the head key) must be a non-empty string."));
    }
    if !positive_integer(get(run, "attempt")) {
        return Err(invalid(
            "session assignmentLaunchContext.run.attempt must be a positive integer.",
        ));
    }
    let Some(command) = command.filter(|c| is_object(Some(c))) else {
        return Err(invalid(
            "session assignmentLaunchContext.command must be an object.",
        ));
    };
    if !non_blank(get(command, "launchCommandId")) {
        return Err(invalid(
            "session assignmentLaunchContext.command.launchCommandId must be a non-empty string.",
        ));
    }
    let role_ok = session
        .filter(|s| s.is_object())
        .is_some_and(|s| non_blank(get(s, "role")));
    if !role_ok {
        return Err(invalid(
            "session assignmentLaunchContext.session.role must be a non-empty string.",
        ));
    }
    Ok(())
}

/// Judges a launch context; with `context` (the request's own) it is also checked against the run directory.
pub fn validate_assignment_launch_context(
    launch: &Value,
    context: Option<&Value>,
) -> Result<(), RequestError> {
    if !is_object(Some(launch)) {
        return Err(invalid("assignmentLaunchContext must be an object."));
    }
    let contract = get(launch, "contract");
    if !contract
        .and_then(Value::as_str)
        .is_some_and(|c| CONTRACTS.contains(&c))
    {
        return Err(invalid(format!(
            "assignmentLaunchContext contract must be \"assignment-cli-spawn-launch-context.v1\" or \"assignment-herdr-spawn-launch-context.v1\", got \"{}\".",
            display(contract)
        )));
    }
    // `kind` is the one discriminator; a context without it is an assignment, whose fields stay required as ever.
    let kind = match get(launch, "kind") {
        None | Some(Value::Null) => Value::String("assignment".into()),
        Some(kind) => kind.clone(),
    };
    if !kind.as_str().is_some_and(|k| KINDS.contains(&k)) {
        return Err(invalid(format!(
            "assignmentLaunchContext kind must be one of {}, got: {}.",
            KINDS.join("/"),
            json_text(Some(&kind))
        )));
    }
    if kind.as_str() == Some("session") {
        validate_session(launch)?;
        if context.is_some() {
            cross_check_assignment_launch_context(launch, context)?;
        }
        return Ok(());
    }
    if get(launch, "session").is_some() {
        return Err(invalid(
            "assignmentLaunchContext.session belongs to kind \"session\".",
        ));
    }
    let run = get(launch, "run").filter(|r| is_object(Some(r)));
    let command = get(launch, "command").filter(|c| is_object(Some(c)));
    let Some(run) = run else {
        return Err(invalid("assignmentLaunchContext.run must be an object."));
    };
    if !non_blank(get(run, "runId")) {
        return Err(invalid(
            "assignmentLaunchContext.run.runId must be a non-empty string.",
        ));
    }
    if !non_blank(get(run, "assignmentId")) {
        return Err(invalid(
            "assignmentLaunchContext.run.assignmentId must be a non-empty string.",
        ));
    }
    if !positive_integer(get(run, "attempt")) {
        return Err(invalid(
            "assignmentLaunchContext.run.attempt must be a positive integer.",
        ));
    }
    if !sha256_text(get(run, "dispatchPlanDigest")) {
        return Err(invalid(
            "assignmentLaunchContext.run.dispatchPlanDigest must be a non-empty sha256 string.",
        ));
    }
    if !sha256_text(get(run, "evaluatorBaselineDigest")) {
        return Err(invalid("assignmentLaunchContext.run.evaluatorBaselineDigest must be a non-empty sha256 string."));
    }
    let Some(command) = command else {
        return Err(invalid(
            "assignmentLaunchContext.command must be an object.",
        ));
    };
    if !non_blank(get(command, "launchCommandId")) {
        return Err(invalid(
            "assignmentLaunchContext.command.launchCommandId must be a non-empty string.",
        ));
    }
    if !positive_integer(get(command, "controlEpoch")) {
        return Err(invalid(
            "assignmentLaunchContext.command.controlEpoch must be a positive integer.",
        ));
    }
    if !sha256_text(get(command, "controlTokenDigest")) {
        return Err(invalid(
            "assignmentLaunchContext.command.controlTokenDigest must be a non-empty sha256 string.",
        ));
    }
    if context.is_some() {
        cross_check_assignment_launch_context(launch, context)?;
    }
    Ok(())
}
