//! The current session as an in-process caller sees it: this machine, and the
//! session the calling process is, named by the writer-id rule. Nothing here
//! needs the host runtime, so a Rust hook can ask who it is without the
//! `provider` feature.

use crate::errors::Error;
use crate::machine;
use crate::refusal::Refusal;
use crate::resolve::{resolve, WriterIdentity, WriterKey};
use crate::session::{self, Local, PidFacts};
use fgos_process::facts::Record;
use serde::Serialize;
use std::path::Path;

/// This machine as `identity machine` prints it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct MachineInfo {
    pub id: String,
    pub handle: String,
    pub alias: Option<String>,
}

/// The alias only counts when it follows the Convention `machine-handle` rule;
/// a hand-edited alias that does not is ignored and the derived handle shows.
fn checked_alias(state_root: &Path) -> Option<String> {
    let alias = machine::read_alias(state_root).ok().flatten()?;
    alias_problem(&alias).is_none().then_some(alias)
}

fn alias_problem(alias: &str) -> Option<&'static str> {
    let rule = fgos_convention::rules::packaged_rules().identifier("machine-handle");
    rule.expect("the Convention contract carries the machine-handle kind")
        .check(alias)
        .err()
}

pub fn machine_info(state_root: &Path) -> Result<MachineInfo, Refusal> {
    let id = machine::read(state_root).map_err(|e| match e {
        Error::Missing(_) => Refusal {
            candidates: Vec::new(),
            reason: "machine-id-missing",
            detail: "no machine id yet; run `fgos doctor --fix` to mint it".into(),
        },
        e => Refusal {
            candidates: Vec::new(),
            reason: "machine-id-unreadable",
            detail: e.to_string(),
        },
    })?;
    let alias = checked_alias(state_root);
    Ok(MachineInfo {
        handle: machine::handle(&id, alias.as_deref()),
        id,
        alias,
    })
}

/// `identity machine --alias <name>`: the alias changes the handle only.
pub fn set_alias(state_root: &Path, alias: &str) -> Result<MachineInfo, Refusal> {
    if let Some(code) = alias_problem(alias) {
        return Err(Refusal {
            candidates: Vec::new(),
            reason: "invalid-alias",
            detail: format!("alias {alias:?} is not a machine handle ({code})"),
        });
    }
    let info = machine_info(state_root)?;
    machine::write_alias(state_root, alias).map_err(|e| Refusal {
        candidates: Vec::new(),
        reason: "alias-write-failed",
        detail: e.to_string(),
    })?;
    Ok(MachineInfo {
        handle: alias.to_owned(),
        alias: Some(alias.to_owned()),
        ..info
    })
}

/// A session as `identity session` prints it, and as bare `identity` embeds it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct SessionInfo {
    pub id: String,
    pub handle: String,
}

pub fn os_pid_facts(pid: u32) -> Option<PidFacts> {
    let tuple = fgos_process::facts::identity_of(fgos_process::ProcId(pid))?;
    Some(PidFacts {
        boot_id: tuple.boot_id,
        start_time: tuple.start_time,
    })
}

pub fn info_of(local: &session::Local, machine: &MachineInfo) -> SessionInfo {
    SessionInfo {
        id: session::full_id(&machine.id, local),
        handle: session::handle(local, &machine.handle),
    }
}

/// The session of a resolved writer on this machine; `None` when the caller
/// cannot be told from any other.
pub fn session_info(
    identity: &WriterIdentity,
    machine: &MachineInfo,
    facts: &dyn Fn(u32) -> Option<PidFacts>,
) -> Option<SessionInfo> {
    Some(info_of(&session::local(identity, facts)?, machine))
}

/// The process facts of `pid` as a liveness record.
pub fn os_record(pid: u32) -> Option<Record> {
    fgos_process::facts::identity_of(fgos_process::ProcId(pid)).map(|tuple| tuple.to_record())
}


/// The session the calling process is, with its full id and handle.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CurrentSession {
    pub local: Local,
    pub info: SessionInfo,
}

/// Who the process `caller_pid` is on this machine: the real env, the real
/// OS process tree and the machine id under `state_root`. Reads only (one
/// small file and `/proc`), no network, no lock; refused `machine-id-*` when
/// the machine id is missing and `unresolved` when the caller cannot be told
/// from any other.
pub fn current_session(
    state_root: &Path,
    caller_pid: u32,
    fgos_dir: Option<&Path>,
) -> Result<CurrentSession, Refusal> {
    let machine = machine_info(state_root)?;
    let tree = crate::proc_tree::os_process_tree();
    let identity = resolve(&|key| std::env::var(key).ok(), tree.as_ref(), caller_pid, fgos_dir);
    let local = session::local(&identity, &os_pid_facts).ok_or_else(|| Refusal {
        reason: "unresolved",
        detail: "this session cannot be told from any other: no session id in the environment and no process holding a terminal".into(),
        candidates: Vec::new(),
    })?;
    Ok(named(&machine, local))
}

fn named(machine: &MachineInfo, local: Local) -> CurrentSession {
    let info = info_of(&local, machine);
    CurrentSession { local, info }
}

/// The session a hook-carried key names on this machine, for a caller whose
/// own env does not carry it (`invalid-writer-key` when `key.source` is not
/// one of the writer-id rule's env variables or the value is not a usable id).
/// Same id, handle and CLI as [`current_session`] gives a process whose env
/// holds the same key. `head_pid` is the process the CLI label of a shared
/// variable ([`crate::resolve::PI_SESSION_VAR`]) is read from, upward and
/// itself included; the other keys ignore it, and `None` gives the neutral
/// label.
pub fn session_for(
    state_root: &Path,
    key: &WriterKey,
    head_pid: Option<u32>,
) -> Result<CurrentSession, Refusal> {
    let local = session::key_local(key).ok_or_else(|| Refusal {
        reason: "invalid-writer-key",
        detail: format!(
            "{:?} is not a writer key: the source must be one of {} and the value a non-empty id of at most {} characters of letters, digits, '.', '_' or '-'",
            key.source,
            crate::resolve::ENV_ORDER.join(", "),
            crate::resolve::MAX_ID_LENGTH,
        ),
        candidates: Vec::new(),
    })?;
    let tree = crate::proc_tree::os_process_tree();
    let cli = crate::resolve::ancestry_cli(key.source, tree.as_ref(), head_pid);
    let local = Local { cli: cli.unwrap_or(local.cli), ..local };
    Ok(named(&machine_info(state_root)?, local))
}
