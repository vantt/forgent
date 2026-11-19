//! Address a worker into a herdr session of its own.
//!
//! WHY. A worker running in a pane of the operator's own herdr session can list and drive every pane the
//! operator has, including one parked waiting for a human answer. This is not fixable with environment
//! variables: herdr injects `HERDR_SOCKET_PATH` into every pane it creates and overwrites any `--env` override.
//! The lever that works is session topology: a worker launched into its own named session is handed THAT
//! session's socket, and from inside it sees only its own panes.
//!
//! WHAT THIS BOUNDARY IS, EXACTLY. Routing, not namespace. A worker that names the operator's absolute socket
//! path still reaches every pane. That is enough for the failure this project has recorded (a worker drifting
//! into the wrong pane, not one deliberately hunting for it); closing the deliberate case needs a mount
//! namespace or a separate OS user, and no observed threat justifies either yet. A boundary described as
//! stronger than it is, is worse than one described honestly.
//!
//! Pure: starting a real herdr server is the caller's business; what belongs here is the addressing and the
//! refusals, because those must be identical on every path.

use std::collections::BTreeMap;

/// An environment, by name.
pub type Env = BTreeMap<String, String>;

/// The session herdr uses when nobody named one. On an operator machine this IS the cockpit, so it is never a
/// legal target for a worker.
const DEFAULT_SESSION: &str = "default";

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
#[error("{message}")]
pub struct WorkerSessionError {
    pub code: &'static str,
    pub message: String,
}

impl WorkerSessionError {
    pub fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }
}

/// herdr's own naming rule for a session directory: `^[a-z][a-z0-9_-]{0,31}$`. Anything outside it could escape
/// the sessions directory or collide with the default session's own files.
fn is_session_name(name: &str) -> bool {
    let mut chars = name.chars();
    chars.next().is_some_and(|c| c.is_ascii_lowercase())
        && name.len() <= 32
        && chars.all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_' || c == '-')
}

fn assert_session_name(name: &str) -> Result<(), WorkerSessionError> {
    if is_session_name(name) {
        return Ok(());
    }
    Err(WorkerSessionError::new(
        "invalid-session-name",
        format!("invalid herdr session name {name:?}: expected a lowercase name matching ^[a-z][a-z0-9_-]{{0,31}}$."),
    ))
}

/// `base` pointed at a session a worker was launched in, so a later caller (the reaper, a recovery) asks the
/// server that owns the worker's pane instead of whichever one its own environment names. The session's socket
/// is the driver's to derive from its name: a socket inherited from another session is dropped.
pub fn env_for_session(base: &Env, name: &str) -> Env {
    let mut env = base.clone();
    env.insert("HERDR_SESSION".into(), name.to_string());
    env.remove("HERDR_SOCKET_PATH");
    env
}

/// Refuse to launch a worker into the operator's own session: the session the caller sits in (`HERDR_SESSION`)
/// or `default`. The second check matters on its own: a caller outside herdr has no `HERDR_SESSION`, and the
/// absence of that variable is not evidence that targeting `default` is safe.
pub fn assert_not_operator_session(target: &str, env: &Env) -> Result<(), WorkerSessionError> {
    assert_session_name(target)?;
    let caller = env.get("HERDR_SESSION").filter(|s| !s.is_empty());
    if target == DEFAULT_SESSION || caller.is_some_and(|c| c == target) {
        return Err(WorkerSessionError::new(
            "operator-session",
            format!(
                "refusing to launch a worker into session \"{target}\": that is the operator's own session, where a stray command would land in a live pane."
            ),
        ));
    }
    Ok(())
}

/// The environment a worker's pane is addressed with: `HERDR_SESSION` at the worker's own session, and the
/// caller's pane, tab and workspace identity and any inherited socket dropped. Those name panes inside the
/// operator's cockpit, which is precisely what the worker must not address.
pub fn isolated_session_env(caller: &Env, target: &str) -> Result<Env, WorkerSessionError> {
    assert_not_operator_session(target, caller)?;
    let mut env = env_for_session(caller, target);
    for name in ["HERDR_PANE_ID", "HERDR_TAB_ID", "HERDR_WORKSPACE_ID"] {
        env.remove(name);
    }
    Ok(env)
}
