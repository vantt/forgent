//! Starts one head session as a supervised terminal attempt.
//!
//! A head session is launched exactly like a terminal worker attempt: run supervisor, sandbox with the herdr
//! socket and the user runtime directory masked, account lease, private home, login write-back when it ends. It
//! differs by a grant keyed by its role (which project paths are writable) and by having no result: no run
//! control, no settle step, no brief contract. The seat is prepared by the one function a worker uses; this module
//! only decides what a session brings to it and never waits for anything to finish.
//!
//! The steps of an attempt that the assignment runner owns (open it, lease an account, prepare the seat, start and
//! bind the supervisor, close it) are behind [`AttemptDriver`], so this module holds the head's own decisions: its
//! requirement, its identity, the single-use key, the order of the steps and what is given back on a refusal.

use std::fs;
use std::path::{Path, PathBuf};

use fgos_run_supervisor::controller::launch::terminal_socket_path;
use serde_json::{json, Map, Value};

use crate::confinement::policy::{
    builtin_policy, MAILBOX_RECORD_RESOURCE, PEER_SESSIONS_RESOURCE, WORKSPACE_PATHS_RESOURCE,
};

/// The environment variable that names a head's request socket.
pub const HEAD_REQUEST_SOCKET_ENV: &str = "FGOS_HEAD_REQUEST_SOCKET";

const ATTEMPT_STR: &str = "01";

/// A refusal of a session launch: `code` is `head-key-used`, `lease-refused` or `launch-unknown` (or the code of
/// the step that failed), with the extra facts the caller acts on.
#[derive(Debug, Clone, PartialEq, thiserror::Error)]
#[error("{message}")]
pub struct SessionLaunchError {
    pub code: String,
    pub message: String,
    pub extra: Map<String, Value>,
}

impl SessionLaunchError {
    pub fn new(code: &str, message: impl Into<String>) -> Self {
        Self {
            code: code.into(),
            message: message.into(),
            extra: Map::new(),
        }
    }

    pub fn with(mut self, key: &str, value: Value) -> Self {
        self.extra.insert(key.into(), value);
        self
    }
}

/// What a role's grant allows a head: the verbs it may call, the project paths it may write, and whether it
/// reads the mailbox record and the peer sessions.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct HeadGrant {
    pub verbs: Vec<String>,
    pub writes: Vec<String>,
    pub mailbox: bool,
    pub peers: bool,
}

/// The sandbox paths of a grant's writes: a `<dir>/*` entry is its directory, and an entry equal to or nested under
/// another is dropped, in order of first appearance.
fn sandbox_paths_of(writes: &[String]) -> Vec<String> {
    let mut mapped: Vec<&str> = Vec::new();
    for entry in writes {
        let dir = entry.strip_suffix("/*").unwrap_or(entry);
        if !mapped.contains(&dir) {
            mapped.push(dir);
        }
    }
    mapped
        .iter()
        .filter(|entry| {
            !mapped
                .iter()
                .any(|other| other != *entry && entry.starts_with(&format!("{other}/")))
        })
        .map(|entry| (*entry).to_string())
        .collect()
}

/// The requirement of a head: the read-only posture plus the writable project paths its grant names, when its
/// grant says `mailbox`, the mailbox record, and when it says `peers`, the peer sessions (the host pid space and
/// the session sockets and registry of the machine, read-write, so the head's own Claude Code registers and
/// listens beside its peers). Every grant is required (`optional: false`): a bind that cannot be made refuses the
/// launch by name, it never starts the head with less. A grant entry ending in `/*` (the head request door's
/// one-level rule) binds its directory, since a sandbox path never holds a glob.
pub fn requirement_of(grant: &HeadGrant) -> Value {
    let base = builtin_policy("host-write-denied").unwrap_or(Value::Null);
    let mut extra = Vec::new();
    if !grant.writes.is_empty() {
        extra.push(json!({
            "resource": WORKSPACE_PATHS_RESOURCE, "access": "read-write", "scope": "dispatch",
            "optional": false, "paths": sandbox_paths_of(&grant.writes),
        }));
    }
    if grant.mailbox {
        extra.push(json!({ "resource": MAILBOX_RECORD_RESOURCE, "access": "read-write", "scope": "dispatch", "optional": false }));
    }
    if grant.peers {
        extra.push(json!({ "resource": PEER_SESSIONS_RESOURCE, "access": "read-write", "scope": "dispatch", "optional": false }));
    }
    let policy = if extra.is_empty() {
        base
    } else {
        let mut policy = base.clone();
        let mut grants = base
            .get("grants")
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();
        grants.extend(extra);
        policy["grants"] = Value::Array(grants);
        policy
    };
    json!({ "mode": "required", "policyId": "host-write-denied", "policy": policy })
}

pub use fgos_execution::seat_session::head_of;

/// What the account lease answered.
#[derive(Debug, Clone, PartialEq)]
pub enum Lease {
    Selected,
    /// `reason` and `detail` of the refusal, and the whole selection for the caller.
    Refused {
        reason: String,
        detail: Option<String>,
        selection: Value,
    },
}

/// How the supervisor answered the start.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Bound {
    pub state: String,
    pub exit: Option<i64>,
}

/// What the seat of a session is prepared with, beyond what the driver already holds.
#[derive(Debug, Clone, PartialEq)]
pub struct SessionSeat {
    pub role: String,
    pub attempt_id: String,
    pub run_id: String,
    pub key: String,
    pub confinement_requirement: Value,
    /// `{ role, verbs, writes, requestSocketPath?, persona?, name?, gen? }`.
    pub session: Value,
    pub request_socket: Option<PathBuf>,
    pub ceiling_ms: u64,
    pub opening: String,
    pub display: Option<Value>,
    pub beside: Option<String>,
    pub dispatch_batch_key: String,
    pub launch_env: std::collections::BTreeMap<String, String>,
}

/// The steps the assignment runner owns, in the order this module calls them. A driver keeps the attempt it
/// opened; `handed_over` and `lease_selected` tell this module what a refusal has to give back.
pub trait AttemptDriver {
    /// Open the attempt of `key` (terminal, session, no custody) in `run_dir`.
    fn open_attempt(
        &mut self,
        run_dir: &Path,
        run_id: &str,
        attempt_id: &str,
        key: &str,
    ) -> Result<(), SessionLaunchError>;
    /// Take the attempt lock (read-only, no dispatch-cwd lease: a head writes only the paths its grant binds).
    fn acquire_locks(&mut self) -> Result<(), SessionLaunchError>;
    /// Write the attempt intent so a controller that dies from here on leaves a record.
    fn publish_intent(&mut self) -> Result<(), SessionLaunchError>;
    fn lease_account(&mut self) -> Result<Lease, SessionLaunchError>;
    /// Renew the leased login and return what the seat needs of it.
    fn renew_leased_login(&mut self, requirement: &Value) -> Result<(), SessionLaunchError>;
    fn prepare_seat(&mut self, seat: &SessionSeat) -> Result<(), SessionLaunchError>;
    fn start_and_bind(&mut self) -> Result<Bound, SessionLaunchError>;
    /// The supervisor may have ended the attempt in the same breath: adopt judges what is on disk.
    fn adopt(&mut self, run_dir: &Path);
    fn handed_over(&self) -> bool;
    fn lease_selected(&self) -> bool;
    fn release_lease(&mut self, run_id: &str);
    fn close(&mut self);
}

/// What the caller supplies for one session.
#[derive(Debug, Clone)]
pub struct SessionLaunch<'a> {
    pub key: &'a str,
    pub role: &'a str,
    pub grant: &'a HeadGrant,
    pub opening: &'a str,
    pub ceiling_ms: u64,
    pub env: std::collections::BTreeMap<String, String>,
    pub fgos_dir: &'a Path,
    pub beside: Option<&'a str>,
    pub display: Option<Value>,
    /// `cmd_<ms>_<8 hex>`, minted by the caller's clock and entropy.
    pub attempt_id: &'a str,
}

/// Where a started session lives.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SessionPlacement {
    pub host: &'static str,
    pub key: String,
    pub run_dir: PathBuf,
    pub attempt_id: String,
}

/// `cmd_<ms>_<8 hex>`: the attempt id of a command, from the caller's clock and the host's entropy.
pub fn mint_attempt_id(now_ms: u128) -> std::io::Result<String> {
    let bytes = fgos_identity::text::random_bytes::<4>()?;
    let hex: String = bytes.iter().map(|b| format!("{b:02x}")).collect();
    Ok(format!("cmd_{now_ms}_{hex}"))
}

/// Starts the session attempt of `key` and returns once the supervisor has bound it; it never waits for the
/// session to end. The attempt directory is `.fgos/assignments/<key>/runs/01`, so the account lease lives exactly
/// as long as the attempt. A refusal before the handover gives back what was taken (pane, private home, lease,
/// locks) and returns the error.
pub fn launch_session_attempt(
    driver: &mut dyn AttemptDriver,
    launch: &SessionLaunch<'_>,
) -> Result<SessionPlacement, SessionLaunchError> {
    let run_dir = launch
        .fgos_dir
        .join("assignments")
        .join(launch.key)
        .join("runs")
        .join(ATTEMPT_STR);
    let run_id = format!("run_{}_{ATTEMPT_STR}", launch.key);
    // A head key is used once. Checked before anything is made and again under the attempt lock, where a second
    // start of the same key can no longer slip in between the check and the intent.
    let refuse_used_key = || {
        if run_dir.join("envelope.json").exists() || run_dir.join("attempt-intent.json").exists() {
            return Err(SessionLaunchError::new(
                "head-key-used",
                format!("{} already holds an attempt; a head key is used once, start the next generation", run_dir.display()),
            ));
        }
        Ok(())
    };
    refuse_used_key()?;
    fs::create_dir_all(&run_dir)
        .map_err(|e| SessionLaunchError::new("run-dir-unwritable", e.to_string()))?;

    driver.open_attempt(&run_dir, &run_id, launch.attempt_id, launch.key)?;
    let result = (|| -> Result<(), SessionLaunchError> {
        driver.acquire_locks()?;
        refuse_used_key()?;
        driver.publish_intent()?;
        if let Lease::Refused {
            reason,
            detail,
            selection,
        } = driver.lease_account()?
        {
            let tail = detail.map(|d| format!(" ({d})")).unwrap_or_default();
            return Err(SessionLaunchError::new(
                "lease-refused",
                format!(
                    "no account could be leased for {}: {reason}{tail}",
                    launch.role
                ),
            )
            .with("refusal", selection));
        }
        // A role whose grant has no verbs gets no socket at all; one with verbs gets the socket its supervisor
        // listens on.
        let request_socket = if launch.grant.verbs.is_empty() {
            None
        } else {
            Some(
                terminal_socket_path(&format!("{}-req", launch.attempt_id)).map_err(|e| {
                    SessionLaunchError::new("request-socket-unavailable", e.to_string())
                })?,
            )
        };
        let requirement = requirement_of(launch.grant);
        driver.renew_leased_login(&requirement)?;
        let mut session = json!({
            "role": launch.role, "verbs": launch.grant.verbs, "writes": launch.grant.writes,
        });
        if let Some(socket) = &request_socket {
            session["requestSocketPath"] = json!(socket.to_string_lossy());
        }
        for (name, value) in head_of(&launch.env) {
            session[name] = value;
        }
        let mut launch_env = launch.env.clone();
        if let Some(socket) = &request_socket {
            launch_env.insert(
                HEAD_REQUEST_SOCKET_ENV.into(),
                socket.to_string_lossy().into_owned(),
            );
        }
        driver.prepare_seat(&SessionSeat {
            role: launch.role.into(),
            attempt_id: launch.attempt_id.into(),
            run_id: run_id.clone(),
            key: launch.key.into(),
            confinement_requirement: requirement,
            session,
            request_socket,
            ceiling_ms: launch.ceiling_ms,
            opening: launch.opening.into(),
            display: launch.display.clone(),
            beside: launch.beside.map(String::from),
            dispatch_batch_key: launch.beside.unwrap_or(launch.attempt_id).into(),
            launch_env,
        })?;
        let bound = driver.start_and_bind()?;
        if bound.state != "bound" {
            if bound.state == "exited" {
                driver.adopt(&run_dir);
            }
            let exit = bound
                .exit
                .map(|code| format!(", exit {code}"))
                .unwrap_or_default();
            return Err(SessionLaunchError::new(
                "launch-unknown",
                format!(
                    "the supervisor did not bind {} ({}{exit}); see {}",
                    launch.role,
                    bound.state,
                    run_dir.join("supervisor.log").display()
                ),
            )
            .with("launchState", json!(bound.state)));
        }
        Ok(())
    })();
    if result.is_err() && !driver.handed_over() && driver.lease_selected() {
        // Before the handover the lease is this controller's to give back; after it, the attempt's own end
        // reclaims it.
        driver.release_lease(&run_id);
    }
    driver.close();
    result?;
    Ok(SessionPlacement {
        host: "terminal",
        key: launch.attempt_id.into(),
        run_dir,
        attempt_id: launch.attempt_id.into(),
    })
}
