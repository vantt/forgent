//! Who is calling. The asker is never an input: it comes from a [`CallerSource`], filled by Identity for a
//! process (the adapter below) or from the head's envelope for a socket call.

use crate::refusal::Refusal;
use fgos_identity::directory;
use fgos_identity::{current_session, machine_info, session_for, CurrentSession, WriterKey};
use std::path::PathBuf;

/// The caller of one verb.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Caller {
    pub session_id: String,
    pub handle: String,
    pub roles: Vec<String>,
    pub persona: Option<String>,
    pub pane: Option<String>,
    pub machine: String,
    /// An agent CLI is among the caller's process ancestors.
    pub is_agent: bool,
}

impl Caller {
    pub fn head_roles(&self) -> impl Iterator<Item = &String> {
        self.roles.iter().filter(|role| role.starts_with("head:"))
    }

    pub fn is_head(&self) -> bool {
        self.head_roles().next().is_some()
    }
}

/// `asker-unresolved` when the caller cannot be told from any other and carries no envelope.
pub trait CallerSource {
    fn caller(&self) -> Result<Caller, Refusal>;
}

/// The caller as Identity knows the process `pid`: session and handle from the writer-id rule, roles from
/// the directory entry, persona from `FGOS_HEAD_PERSONA`, the machine id, and whether an agent CLI is
/// among the process ancestors.
pub struct IdentityCaller {
    pub state_root: PathBuf,
    pub pid: u32,
    /// Display only; the host fills it from Session Host placement when it can be read.
    pub pane: Option<String>,
}

fn unresolved(detail: impl Into<String>) -> Refusal {
    Refusal::new("asker-unresolved", detail)
}

impl CallerSource for IdentityCaller {
    fn caller(&self) -> Result<Caller, Refusal> {
        let session = current_session(&self.state_root, self.pid)
            .map_err(|r| unresolved(format!("{}: {}", r.reason, r.detail)))?;
        build(&self.state_root, session, self.pid, self.pane.clone())
    }
}

/// The caller a hook payload names: the session key the agent CLI put in the payload (`source` is one of the writer-id
/// rule's env variables, such as `CODEX_THREAD_ID`), for a hook process whose own environment does not carry it. Same
/// id, handle and roles as [`IdentityCaller`] gives a process whose environment holds the same key.
pub struct PayloadKeyCaller {
    pub state_root: PathBuf,
    pub pid: u32,
    pub source: &'static str,
    pub value: String,
}

impl CallerSource for PayloadKeyCaller {
    fn caller(&self) -> Result<Caller, Refusal> {
        let key = WriterKey {
            source: self.source,
            value: &self.value,
        };
        let session = session_for(&self.state_root, &key, None)
            .map_err(|r| unresolved(format!("{}: {}", r.reason, r.detail)))?;
        build(&self.state_root, session, self.pid, None)
    }
}

/// The caller of a resolved session: roles from the directory entry, persona from `FGOS_HEAD_PERSONA`, the machine
/// id, and whether an agent CLI is among the ancestors of `pid`.
fn build(
    state_root: &std::path::Path,
    session: CurrentSession,
    pid: u32,
    pane: Option<String>,
) -> Result<Caller, Refusal> {
    let machine =
        machine_info(state_root).map_err(|r| unresolved(format!("{}: {}", r.reason, r.detail)))?;
    // A session that never registered holds no role; a refusal here is "no roles", not "no caller".
    let roles = directory::resolve(
        state_root,
        &session.info.id,
        &fgos_process::facts::judge_here,
        None,
        &directory::NoTerminal,
    )
    .map(|listed| listed.roles)
    .unwrap_or_default();
    let persona = std::env::var("FGOS_HEAD_PERSONA")
        .ok()
        .filter(|value| !value.trim().is_empty());
    let tree = fgos_identity::os_process_tree();
    Ok(Caller {
        session_id: session.info.id,
        handle: session.info.handle,
        roles,
        persona,
        pane,
        machine: machine.id,
        is_agent: fgos_identity::resolve::agent_in_ancestry(tree.as_ref(), Some(pid)).is_some(),
    })
}
