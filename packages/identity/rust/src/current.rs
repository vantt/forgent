//! The current session as an in-process caller sees it: this machine, and the
//! session the calling process is, named by the writer-id rule. Nothing here
//! needs the host runtime, so a Rust hook can ask who it is without the
//! `provider` feature.

use crate::errors::Error;
use crate::machine;
use crate::refusal::Refusal;
use crate::resolve::{resolve, HeadRef, WriterIdentity, WriterKey};
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

/// The record of the process `head` names, or why it is not that process: not
/// readable or not running, or running with another start time (its pid was
/// reused). The one place that judges a head reference.
pub(crate) fn read_head(head: &HeadRef) -> Result<Record, String> {
    let record = os_record(head.pid)
        .filter(|record| {
            fgos_process::facts::judge_here(record) == fgos_process::facts::Verdict::Alive
        })
        .ok_or_else(|| {
            format!(
                "process {} cannot be read or is not running, so it cannot be a session's head",
                head.pid
            )
        })?;
    match record.start_time.as_deref() {
        Some(now) if now == head.start_time => Ok(record),
        now => Err(format!(
            "process {} started at {:?}, not {:?}: the pid was reused, so it is not the head",
            head.pid,
            now.unwrap_or("unknown"),
            head.start_time
        )),
    }
}

/// The session the calling process is, with its full id and handle.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CurrentSession {
    pub local: Local,
    pub info: SessionInfo,
}

/// Who the process `caller_pid` is on this machine: the real env, the real
/// OS process tree and the machine id under `state_root`. Reads only (one
/// small file and `/proc`, and for a runner attempt two directory entries),
/// no network, no lock; refused `machine-id-*` when the machine id is
/// missing and `unresolved` when the caller cannot be told from any other.
/// A runner attempt whose agent session its supervisor bound is that agent
/// session (`directory::bind_agent_session`).
pub fn current_session(
    state_root: &Path,
    caller_pid: u32,
    fgos_dir: Option<&Path>,
) -> Result<CurrentSession, Refusal> {
    current_from(state_root, caller_pid, fgos_dir, &|key| {
        std::env::var(key).ok()
    })
}

fn current_from(
    state_root: &Path,
    caller_pid: u32,
    fgos_dir: Option<&Path>,
    lookup: &dyn Fn(&str) -> Option<String>,
) -> Result<CurrentSession, Refusal> {
    let machine = machine_info(state_root)?;
    let tree = crate::proc_tree::os_process_tree();
    let identity = resolve(lookup, tree.as_ref(), caller_pid, fgos_dir);
    let local = session::local(&identity, &os_pid_facts).ok_or_else(|| Refusal {
        reason: "unresolved",
        detail: "this session cannot be told from any other: no session id in the environment and no process holding a terminal".into(),
        candidates: Vec::new(),
    })?;
    let local = bound_agent_local(state_root, &machine, &identity, &local, lookup).unwrap_or(local);
    Ok(named(&machine, local))
}

/// The agent session a runner attempt runs as, when its supervisor bound one
/// (`directory::bind_agent_session`): the caller resolved to an attempt id
/// from `FGOS_SESSION_ID`, its env also carries the agent CLI's own session
/// variable, and the directory holds that session live on the attempt's own
/// head. A CLI variable alone never moves the caller off the attempt id: an
/// unbound attempt (every worker) stays itself.
fn bound_agent_local(
    state_root: &Path,
    machine: &MachineInfo,
    identity: &WriterIdentity,
    attempt: &Local,
    lookup: &dyn Fn(&str) -> Option<String>,
) -> Option<Local> {
    if identity.env_var != Some(crate::resolve::ENV_ORDER[0])
        || !crate::attempt::is_attempt_writer_id(&attempt.id)
    {
        return None;
    }
    let agent = crate::resolve::ENV_ORDER[1..].iter().find_map(|source| {
        let value = lookup(source)?;
        session::key_local(&WriterKey {
            source,
            value: &value,
        })
    })?;
    // pi and omp share one variable, so the handle may carry either label.
    let labels: &[&'static str] = if agent.cli == "pi" {
        &["pi", "omp"]
    } else {
        std::slice::from_ref(&agent.cli)
    };
    let handles: Vec<String> = labels
        .iter()
        .map(|cli| {
            session::handle(
                &Local {
                    id: agent.id.clone(),
                    cli,
                },
                &machine.handle,
            )
        })
        .collect();
    let (id, cli) = crate::directory::bound_agent(
        state_root,
        &session::handle(attempt, &machine.handle),
        &handles,
        &fgos_process::facts::judge_here,
    )?;
    let cli = labels.iter().copied().find(|label| *label == cli)?;
    (id == session::full_id(&machine.id, &agent)).then_some(Local { id: agent.id, cli })
}

fn named(machine: &MachineInfo, local: Local) -> CurrentSession {
    let info = info_of(&local, machine);
    CurrentSession { local, info }
}

/// The session a hook-carried key names on this machine, for a caller whose
/// own env does not carry it (`invalid-writer-key` when `key.source` is not
/// one of the writer-id rule's env variables or the value is not a usable id).
/// Same id, handle and CLI as [`current_session`] gives a process whose env
/// holds the same key. `head` is the process the CLI label of a shared
/// variable ([`crate::resolve::PI_SESSION_VAR`]) is read from, upward and
/// itself included; the other keys ignore it, and `None` gives the neutral
/// label. A head that is not running with the given start time (its pid was
/// reused) is not trusted: the label is the neutral one, never a refusal.
pub fn session_for(
    state_root: &Path,
    key: &WriterKey,
    head: Option<&HeadRef>,
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
    // Only the shared variable's label needs the ancestry, so only it pays for
    // the process-tree handle and the head read.
    let cli = (key.source == crate::resolve::PI_SESSION_VAR)
        .then(|| {
            let trusted = head
                .filter(|head| read_head(head).is_ok())
                .map(|head| head.pid);
            crate::resolve::ancestry_cli(
                key.source,
                crate::proc_tree::os_process_tree().as_ref(),
                trusted,
            )
        })
        .flatten();
    let local = Local {
        cli: cli.unwrap_or(local.cli),
        ..local
    };
    Ok(named(&machine_info(state_root)?, local))
}

#[cfg(test)]
mod tests {
    use super::current_from;
    use crate::directory;
    use crate::resolve::{HeadRef, WriterKey};

    fn env(pairs: &'static [(&'static str, &'static str)]) -> impl Fn(&str) -> Option<String> {
        move |key| {
            pairs
                .iter()
                .find(|(k, _)| *k == key)
                .map(|(_, v)| v.to_string())
        }
    }

    #[test]
    fn an_attempt_whose_supervisor_bound_its_agent_session_is_that_session_and_an_unbound_one_stays_itself(
    ) {
        let root = std::env::temp_dir().join(format!("fgos-identity-bound-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(&root).unwrap();
        crate::machine::mint(&root, "testhost").unwrap();
        let pid = std::process::id();
        let gate = HeadRef {
            pid,
            start_time: fgos_process::facts::identity_of(fgos_process::ProcId(pid))
                .unwrap()
                .start_time,
        };
        let attempt = WriterKey {
            source: "FGOS_SESSION_ID",
            value: "att-cmd_9",
        };
        let lookup = env(&[
            ("FGOS_SESSION_ID", "att-cmd_9"),
            ("CLAUDE_CODE_SESSION_ID", "uuid-9"),
        ]);
        directory::register_writer(&root, None, &attempt, &gate, &[], false).unwrap();
        // Registered but not bound: the CLI variable alone never moves the caller off its attempt id.
        let unbound = current_from(&root, pid, None, &lookup).unwrap();
        assert!(
            unbound.info.id.ends_with("/att-cmd_9"),
            "{}",
            unbound.info.id
        );
        assert!(unbound.info.handle.starts_with("worker-"));

        let claude = WriterKey {
            source: "CLAUDE_CODE_SESSION_ID",
            value: "uuid-9",
        };
        directory::bind_agent_session(&root, None, &attempt, &claude, &gate, pid).unwrap();
        let bound = current_from(&root, pid, None, &lookup).unwrap();
        assert!(bound.info.id.ends_with("/uuid-9"), "{}", bound.info.id);
        assert!(
            bound.info.handle.starts_with("claude-"),
            "{}",
            bound.info.handle
        );
        assert_eq!(bound.local.cli, "claude");
        // Another attempt carrying the same CLI variable is not the bound one: it stays itself.
        let stranger = current_from(
            &root,
            pid,
            None,
            &env(&[
                ("FGOS_SESSION_ID", "att-cmd_other"),
                ("CLAUDE_CODE_SESSION_ID", "uuid-9"),
            ]),
        )
        .unwrap();
        assert!(stranger.info.id.ends_with("/att-cmd_other"));
        let _ = std::fs::remove_dir_all(root);
    }
}
