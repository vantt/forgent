//! Finalizing an attempt's private homes: give a renewed login back, keep the seat's session, remove the homes.
//!
//! Twin of `finalizeAttemptHome` in `authority.mjs`; the vectors under `finalizeAttemptHome` in
//! `packages/execution/contracts/confinement-request/authority.v1.json` hold both to the same answers. What a home
//! holds and how it goes is the cleanup module's; where a login is staged is credential renewal's, reached through
//! [`CredentialWriteBack`].

use std::path::{Path, PathBuf};

use serde_json::{json, Value};

use super::error::RequestError;
use super::js::{get, truthy};
use super::launch::publish_mutable_projection;
use crate::confinement::cleanup::{
    count_credential_keep, describe_attempt_home, keep_session_transcript, read_agent_file,
    read_attempt_home_record, remove_attempt_home, settle_held_credential_homes,
    CredentialWriteBack, WriteBackOutcome, ATTEMPT_HOME_MARKER_CONTRACT, CREDENTIAL_HOME_HELD,
    CREDENTIAL_HOME_KEPT, CREDENTIAL_KEEP_MAX_ATTEMPTS, MAX_HOME_MARKER_BYTES, OWNERSHIP_CREATOR,
    OWNERSHIP_MARKER_FILE,
};
use crate::credentials::{write_back_renewed_credential, AccountLocks, SqliteAdapter};
use fgos_execution::seat_session::transcript_path_of;

/// How [`finalize_attempt_home`] left an attempt's homes.
#[derive(Debug, Clone, PartialEq)]
pub struct FinalizedAttemptHome {
    /// `cleaned`, `credential-home-kept` or `credential-home-held`.
    pub state: &'static str,
    pub homes: u64,
    /// Relative to the run directory: where the seat's session was kept, `None` when none was.
    pub transcript_path: Option<&'static str>,
    /// What each home held, by name and size only.
    pub home_layout: Vec<Value>,
    pub warnings: Vec<Value>,
}

/// Stages a renewed login through credential renewal's write-back, with the SQLite engine and account locks the
/// host has.
pub struct StageRenewedLogin<'a> {
    pub sqlite: &'a dyn SqliteAdapter,
    pub locks: &'a dyn AccountLocks,
}

impl CredentialWriteBack for StageRenewedLogin<'_> {
    fn write_back(&self, home: &Path, target: Option<&Value>) -> WriteBackOutcome {
        let now = crate::credentials::files::now_ms();
        write_back_renewed_credential(home, target, now, self.sqlite, self.locks)
    }
}

/// A home that does not belong to the attempt, or whose marker cannot be read: nothing is removed.
fn home_error(code: &str, message: String) -> RequestError {
    RequestError::coded(code, format!("{code}: {message}"))
}

struct Descriptor {
    file: PathBuf,
    body: Value,
}

fn attempt_finalization_descriptors(run_dir: &Path) -> Result<Vec<Descriptor>, RequestError> {
    let dir = run_dir.join("protected").join("confinement-finalization");
    let read = match std::fs::read_dir(&dir) {
        Ok(read) => read,
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(err) => {
            let code = crate::confinement::cleanup::CleanupError::io(&err, "scandir", &dir)
                .code
                .unwrap_or_else(|| err.to_string());
            return Err(home_error(
                "finalization-descriptor-unreadable",
                format!("{}: {code}", dir.display()),
            ));
        }
    };
    let mut names: Vec<String> = read
        .filter_map(Result::ok)
        .map(|e| e.file_name().to_string_lossy().into_owned())
        .filter(|n| n.ends_with(".json"))
        .collect();
    names.sort();
    names
        .into_iter()
        .map(|name| {
            let file = dir.join(&name);
            let body = std::fs::read_to_string(&file)
                .ok()
                .and_then(|text| serde_json::from_str(&text).ok())
                .ok_or_else(|| {
                    home_error(
                        "finalization-descriptor-unreadable",
                        format!("{name} cannot be read"),
                    )
                })?;
            Ok(Descriptor { file, body })
        })
        .collect()
}

fn read_attempt_home_marker(
    home: &Path,
    attempt_id: &str,
    run_dir: &str,
) -> Result<Value, RequestError> {
    let marker: Value = read_agent_file(&home.join(OWNERSHIP_MARKER_FILE), MAX_HOME_MARKER_BYTES)
        .ok()
        .and_then(|bytes| serde_json::from_slice(&bytes).ok())
        .ok_or_else(|| {
            home_error(
                "home-marker-unreadable",
                format!("{} has no readable ownership marker", home.display()),
            )
        })?;
    let text = |key: &str| get(&marker, key).and_then(Value::as_str);
    if text("contract") != Some(ATTEMPT_HOME_MARKER_CONTRACT)
        || text("creator") != Some(OWNERSHIP_CREATOR)
        || text("attemptId") != Some(attempt_id)
        || text("runDir") != Some(run_dir)
    {
        return Err(home_error(
            "home-marker-mismatch",
            format!(
                "{} is not a version 2 home of attempt {attempt_id} in {run_dir}",
                home.display()
            ),
        ));
    }
    Ok(marker)
}

struct Home<'a> {
    target: PathBuf,
    marker: Value,
    write_back: Option<&'a Value>,
    session_dir: Option<&'a Value>,
    launch_command_id: String,
}

#[derive(Default)]
struct Keeping {
    warnings: Vec<Value>,
    home_layout: Vec<Value>,
}

// Copy the session of one home into the run directory and note what the home held, by name only. Nothing here can
// stop the removal: a refused or failed copy becomes a structured warning.
fn keep_session_before_removal(home: &Home<'_>, run_dir: &Path, keeping: &mut Keeping) {
    let id = home.launch_command_id.as_str();
    keeping
        .home_layout
        .extend(describe_attempt_home(&home.target).into_iter().map(|e| {
            json!({ "path": e.path, "kind": e.kind, "files": e.files, "bytes": e.bytes, "launchCommandId": id })
        }));
    let mut warn = |code: &str, message: String| {
        eprintln!("fgos: session transcript not kept ({code}): {message}");
        keeping
            .warnings
            .push(json!({ "code": code, "message": message, "launchCommandId": id }));
    };
    if !truthy(home.session_dir) {
        return warn(
            "session-dir-undeclared",
            "the executor declares no session directory".into(),
        );
    }
    let Some(session_dir) = home.session_dir.and_then(Value::as_str) else {
        return warn(
            "session-copy-failed",
            "the session directory must be a string".into(),
        );
    };
    let protected = run_dir.join("protected");
    match keep_session_transcript(
        &home.target,
        session_dir,
        &protected.join("session"),
        Some(&protected),
    ) {
        Ok(kept) if !kept.found => warn(
            "session-not-written",
            format!("the CLI wrote nothing under \"{session_dir}\" in its home"),
        ),
        Ok(_) => {}
        Err(err) => warn("session-copy-failed", err.message),
    }
}

/// Give the credential back and remove every private home of one attempt, whatever way the attempt ended. The caller
/// (supervisor or adopt step) holds the attempt lock and the process domain is empty, so no agent still uses a home.
/// A home is kept only when its renewed login is not safe anywhere else yet.
///
/// Every marker is checked before anything is removed: a marker that is not version 2 or names another attempt is an
/// error (`home-marker-mismatch` / `home-marker-unreadable`) and leaves all homes in place. Where a renewed login
/// goes back to is taken only from the descriptor's resource entry (`credentialWriteBack`), and how often its staging
/// failed only from the home's host record. Once its own homes are done, the held homes of other attempts under the
/// same temp roots are settled when their record allows it. `now_ms` is the clock of the host record and the
/// descriptor's `updatedAt`.
pub fn finalize_attempt_home(
    run_dir: &Path,
    attempt_id: &str,
    stage: &dyn CredentialWriteBack,
    now_ms: i64,
) -> Result<FinalizedAttemptHome, RequestError> {
    let run_text = run_dir.to_str().unwrap_or_default();
    if run_text.is_empty() || attempt_id.is_empty() {
        return Err(home_error(
            "invalid-arguments",
            "runDir and attemptId are required".into(),
        ));
    }
    let descriptors = attempt_finalization_descriptors(run_dir)?;
    let mut homes: Vec<Home<'_>> = Vec::new();
    for Descriptor { file, body } in &descriptors {
        let resources = get(body, "resources")
            .filter(|v| truthy(Some(v)))
            .or_else(|| get(body, "temporaryDirectories").filter(|v| truthy(Some(v))))
            .and_then(Value::as_array);
        for res in resources.into_iter().flatten() {
            let target = get(res, "pathRef")
                .filter(|v| truthy(Some(v)))
                .or_else(|| get(res, "path"))
                .filter(|v| truthy(Some(v)))
                .and_then(Value::as_str);
            let Some(target) = target.map(PathBuf::from) else {
                continue;
            };
            if homes.iter().any(|h| h.target == target) || !target.exists() {
                continue;
            }
            let marker = read_attempt_home_marker(&target, attempt_id, run_text)?;
            homes.push(Home {
                target,
                marker,
                write_back: get(res, "credentialWriteBack"),
                session_dir: get(res, "sessionDir"),
                launch_command_id: file
                    .file_stem()
                    .map(|s| s.to_string_lossy().into_owned())
                    .unwrap_or_default(),
            });
        }
    }
    let (mut kept, mut held) = (0u64, 0u64);
    let mut keeping = Keeping::default();
    for home in &homes {
        let dispatch_id = get(&home.marker, "dispatchId").cloned();
        let mut record = json!({ "attemptId": attempt_id, "runDir": run_text });
        if let Some(dispatch) = &dispatch_id {
            record["dispatchId"] = dispatch.clone();
        }
        record["launchCommandId"] = json!(home.launch_command_id);
        // A home whose staging failed the allowed number of times is left to a later settle; doctor reports it.
        let attempts = read_attempt_home_record(&home.target, Some(attempt_id), Some(run_text))
            .and_then(|r| r.get("credentialKept")?.get("attempts")?.as_u64())
            .unwrap_or(0);
        if attempts >= CREDENTIAL_KEEP_MAX_ATTEMPTS {
            held += 1;
            continue;
        }
        let result = stage.write_back(&home.target, home.write_back.filter(|v| !v.is_null()));
        let code = result.code.unwrap_or_default();
        if result.status == "failed" && result.keep_home {
            let is_held = count_credential_keep(&home.target, &record, now_ms)
                >= CREDENTIAL_KEEP_MAX_ATTEMPTS;
            if is_held {
                held += 1;
            } else {
                kept += 1;
            }
            eprintln!(
                "fgos: credential write-back not done ({code}); private home {}",
                if is_held {
                    "held for a later settle"
                } else {
                    "kept for a later retry"
                }
            );
            continue;
        }
        if result.status == "failed" {
            eprintln!("fgos: credential write-back not done ({code})");
        }
        keep_session_before_removal(home, run_dir, &mut keeping);
        let dispatch = dispatch_id
            .as_ref()
            .and_then(Value::as_str)
            .unwrap_or_default();
        remove_attempt_home(&home.target, dispatch).map_err(|err| RequestError {
            message: err.message,
            code: err.code,
            error_class: None,
            data: None,
        })?;
    }
    // Homes held by other attempts under the same roots: whatever kept them may be gone by now.
    let mut roots: Vec<PathBuf> = Vec::new();
    for home in &homes {
        let root = home
            .target
            .parent()
            .and_then(Path::parent)
            .map(Path::to_path_buf)
            .unwrap_or_default();
        if !roots.contains(&root) {
            roots.push(root);
        }
    }
    settle_held_credential_homes(&roots, &[], stage);
    let reported = |state: &'static str, keeping: Keeping| FinalizedAttemptHome {
        state,
        homes: homes.len() as u64,
        transcript_path: transcript_path_of(run_dir),
        home_layout: keeping.home_layout,
        warnings: keeping.warnings,
    };
    if kept > 0 {
        return Ok(reported(CREDENTIAL_HOME_KEPT, keeping));
    }
    let cleanup_state = if held > 0 { "retained" } else { "cleaned" };
    let updated_at =
        fgos_host_runtime::civil_time::format_unix_millis_rfc3339(now_ms, 0).unwrap_or_default();
    for Descriptor { file, body } in &descriptors {
        if get(body, "cleanupState").and_then(Value::as_str) == Some(cleanup_state) {
            continue;
        }
        let mut next = body.clone();
        if let Some(map) = next.as_object_mut() {
            map.insert("cleanupState".into(), json!(cleanup_state));
            map.insert("cleanupResult".into(), json!({ "kind": cleanup_state }));
            map.insert("updatedAt".into(), json!(updated_at));
        }
        publish_mutable_projection(file, &next)?;
    }
    Ok(reported(
        if held > 0 {
            CREDENTIAL_HOME_HELD
        } else {
            "cleaned"
        },
        keeping,
    ))
}
