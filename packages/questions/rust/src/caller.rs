//! Who is calling. The asker is never an input: it comes from a [`CallerSource`], filled by Identity for a
//! process (the adapter below) or from the head's envelope for a socket call.

use crate::refusal::Refusal;
use fgos_identity::directory;
use fgos_identity::{current_session, machine_info};
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
        let machine = machine_info(&self.state_root)
            .map_err(|r| unresolved(format!("{}: {}", r.reason, r.detail)))?;
        // A session that never registered holds no role; a refusal here is "no roles", not "no caller".
        let roles = directory::resolve(
            &self.state_root,
            &session.info.id,
            &fgos_process::facts::judge_here,
            None,
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
            pane: self.pane.clone(),
            machine: machine.id,
            is_agent: fgos_identity::resolve::agent_in_ancestry(tree.as_ref(), Some(self.pid))
                .is_some(),
        })
    }
}
