//! The session full id and handle: `<machine-id>/<local id>` and
//! `<cli>-<suffix>@<machine-handle>`. The local id is the writer-id rule's
//! answer ([`crate::resolve`]); this module only names it. The OS is reached
//! through an injected facts lookup, so every rule here is a pure function.

use crate::resolve::{WriterId, WriterIdentity, WriterKey};
use crate::text::base32_prefix;
use sha2::{Digest, Sha256};

/// Characters of the handle's suffix: 20 bits of the local id's hash.
pub const SUFFIX_LENGTH: usize = 4;
/// Hex characters of the hash inside a pid local id.
const PID_HASH_LENGTH: usize = 24;

/// What the OS says about one process, enough to tell it from a later
/// process that reuses its pid, or the same pid after a reboot.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PidFacts {
    pub boot_id: Option<String>,
    pub start_time: String,
}

/// The local part of a session id, with the CLI that names it in the handle.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Local {
    pub id: String,
    pub cli: &'static str,
}

/// `pid-<24 hex>` of sha256(boot id, pid, start time): a reboot or a reused
/// pid gives a new id, the same process always the same one.
pub fn pid_local_id(facts: &PidFacts, pid: u32) -> String {
    let mut hasher = Sha256::new();
    for part in [
        facts.boot_id.as_deref().unwrap_or(""),
        &pid.to_string(),
        &facts.start_time,
    ] {
        hasher.update(part.as_bytes());
        hasher.update([0]);
    }
    let digest = hasher.finalize();
    let hex: String = digest.iter().map(|b| format!("{b:02x}")).collect();
    format!("pid-{}", &hex[..PID_HASH_LENGTH])
}

/// The CLI named in a handle, from the env variable that gave the id.
pub fn cli_of(env_var: &str, local_id: &str) -> &'static str {
    match env_var {
        "CLAUDE_CODE_SESSION_ID" => "claude",
        "CODEX_THREAD_ID" => "codex",
        // The neutral label; the process ancestry may say `omp` instead.
        crate::resolve::PI_SESSION_VAR => "pi",
        _ if crate::attempt::is_attempt_writer_id(local_id) => "worker",
        _ => "fgos",
    }
}

/// The local session of a writer id that came from the env variable `env_var`.
fn env_local(env_var: &str, id: &str) -> Local {
    Local {
        cli: cli_of(env_var, id),
        id: id.to_owned(),
    }
}

/// The local session a hook-carried key names, by the same validity rule and
/// CLI mapping as the env path; `None` when the key is not a writer id.
pub fn key_local(key: &WriterKey) -> Option<Local> {
    key.checked().map(|(source, id)| env_local(source, id))
}

/// The local session id of a resolved writer, or `None` when the caller
/// cannot be told from any other (`unresolved`, or a pid whose process facts
/// cannot be read).
pub fn local(
    identity: &WriterIdentity,
    facts: &dyn Fn(u32) -> Option<PidFacts>,
) -> Option<Local> {
    match &identity.id {
        WriterId::Session(id) => {
            let mut local = env_local(identity.env_var?, id);
            if let Some(cli) = identity.cli {
                local.cli = cli;
            }
            Some(local)
        }
        WriterId::Pid(pid) if identity.source == crate::resolve::Source::Pid => Some(Local {
            id: pid_local_id(&facts(*pid)?, *pid),
            cli: "shell",
        }),
        WriterId::Pid(_) => None,
    }
}

/// First [`SUFFIX_LENGTH`] base32 characters of sha256(local id).
pub fn suffix(local_id: &str) -> String {
    base32_prefix(&Sha256::digest(local_id.as_bytes()), SUFFIX_LENGTH)
}

/// `<machine-id>/<local id>`.
pub fn full_id(machine_id: &str, local: &Local) -> String {
    format!("{machine_id}/{}", local.id)
}

/// `<cli>-<suffix>@<machine-handle>`.
pub fn handle(local: &Local, machine_handle: &str) -> String {
    format!("{}-{}@{machine_handle}", local.cli, suffix(&local.id))
}
