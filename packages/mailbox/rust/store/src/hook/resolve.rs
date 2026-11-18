//! The one resolver of the hook entry (spec §6.1): from a payload and the
//! entry's ancestry to the writer key and the head, per CLI. The entry
//! reads its environment once into [`HookEnv`]; the test entry and the
//! host both call [`resolver_for`], so it exists once.
//!
//! - Claude Code: the writer is session identity's (from the environment
//!   only, never a pid fallback), and the head comes from
//!   the session file under the shared config-directory resolver; a head
//!   session attempt whose session file is missing takes the head position
//!   when the payload names its writer.
//! - Codex, pi and omp: the writer is the payload's `session_id` (their
//!   hooks see no session variable), and the head is the direct head
//!   position whose executable the adapter names.
//! - agy: deferred, so no head.
use super::shell::Resolved;
use super::{Adapter, HookCallLimits};
use crate::adapters::{claude_head, payload_head, AdapterFacts};
use crate::head::{Ancestry, NoHead};
use fgos_identity::cli_dirs::claude_config_dir;
use fgos_identity::resolve::{
    env_identity, resolve_current, HeadRef, Source, WriterId, WriterKey as IdentityKey, ENV_ORDER,
};
use fgos_mailbox_core::WriterKey;
use std::ffi::OsString;

/// What the entry read of its environment, once.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HookEnv {
    pub home: Option<OsString>,
    pub claude_config_dir: Option<OsString>,
    /// Session identity's writer of this process, when it came from the
    /// environment (never one derived from a pid).
    pub session_writer: Option<WriterKey>,
    /// The session id the entry's own environment names, if any
    /// (`FGOS_SESSION_ID`, `CODEX_THREAD_ID`, `CLAUDE_CODE_SESSION_ID`).
    pub session_env: Option<String>,
    /// For a head session attempt (`FGOS_HEAD_REQUEST_SOCKET` and a runner
    /// attempt id): its gate as Identity holds it, the process its head must
    /// be the direct child of when the head has no session file.
    pub head_gate: Option<HeadRef>,
}

/// The variable a confined head's sandbox names its request socket by
/// (set by the head launch, `src/session-host/head-grants.mjs`): only a
/// head session attempt carries it.
pub const HEAD_REQUEST_SOCKET_ENV: &str = "FGOS_HEAD_REQUEST_SOCKET";

/// The agent CLI's own session id of a head session attempt: its env names a
/// runner attempt in `FGOS_SESSION_ID`, carries the head request socket and
/// the CLI's own session variable (the first usable one after
/// `FGOS_SESSION_ID` in Identity's order). A head is the CLI session the
/// owner talks to, so the mailbox binds and drains it under that id, as it
/// does an unconfined head; every other runner attempt (a worker) stays its
/// attempt id and is never registered.
pub fn head_cli_session(lookup: &dyn Fn(&str) -> Option<String>) -> Option<String> {
    if !is_head_attempt(lookup) {
        return None;
    }
    ENV_ORDER[1..].iter().find_map(|source| {
        let value = lookup(source)?;
        IdentityKey {
            source,
            value: &value,
        }
        .checked()
        .map(|(_, id)| id.to_string())
    })
}

/// Whether `lookup` is the environment of a head session attempt: it carries
/// the head request socket and names a runner attempt in `FGOS_SESSION_ID`.
fn is_head_attempt(lookup: &dyn Fn(&str) -> Option<String>) -> bool {
    lookup(HEAD_REQUEST_SOCKET_ENV).is_some_and(|socket| !socket.is_empty())
        && lookup(ENV_ORDER[0]).is_some_and(|id| fgos_identity::is_attempt_writer_id(id.trim()))
}

impl HookEnv {
    /// The calling process's environment; `gate_of` answers the gate of the runner attempt it is given by id,
    /// from Identity's directory (asked only for a head session attempt).
    pub fn from_process(gate_of: &dyn Fn(&str) -> Option<HeadRef>) -> Self {
        Self::from_lookup(&|name: &str| std::env::var(name).ok(), gate_of)
    }

    /// [`HookEnv::from_process`] over `lookup`. A head session attempt
    /// whose CLI names its session only in the hook payload (a Codex hook
    /// sees no session variable) has no session of its environment: the
    /// attempt id is never its writer, so the payload's `session_id` is the
    /// head's CLI session.
    fn from_lookup(
        lookup: &dyn Fn(&str) -> Option<String>,
        gate_of: &dyn Fn(&str) -> Option<HeadRef>,
    ) -> Self {
        let head_attempt = is_head_attempt(lookup);
        let (session_writer, session_env) = match head_cli_session(lookup) {
            Some(id) => (WriterKey::new(id.clone()).ok(), Some(id)),
            None if head_attempt => (None, None),
            None => {
                let identity = resolve_current();
                let writer = match (identity.id, identity.source) {
                    (WriterId::Session(id), Source::Env) => WriterKey::new(id).ok(),
                    _ => None,
                };
                (
                    writer,
                    env_identity(lookup).map(|identity| identity.id.to_string()),
                )
            }
        };
        Self {
            home: lookup("HOME").map(OsString::from),
            claude_config_dir: lookup("CLAUDE_CONFIG_DIR").map(OsString::from),
            session_writer,
            session_env,
            head_gate: head_attempt
                .then(|| lookup(ENV_ORDER[0]))
                .flatten()
                .and_then(|attempt| gate_of(attempt.trim())),
        }
    }
}

/// The resolver of `adapter`'s hook calls.
pub fn resolver_for<'a>(
    adapter: Adapter,
    facts: &'a AdapterFacts,
    env: &'a HookEnv,
    hook: &'a HookCallLimits,
) -> impl Fn(&[u8], &Ancestry) -> Result<Resolved, NoHead> + 'a {
    move |payload: &[u8], ancestry: &Ancestry| match adapter {
        Adapter::Claude => {
            let writer = env.session_writer.clone().ok_or(NoHead::NoWriter)?;
            let sessions = claude_config_dir(env.home.as_deref(), env.claude_config_dir.as_deref())
                .map(|dir| dir.join("sessions"));
            let found = match sessions {
                Some(dir) => claude_head::find_head(&dir, ancestry, facts, &writer, hook),
                None => Err(NoHead::NoSessionFile),
            };
            // A confined head's sandbox keeps Claude Code from writing its
            // session file; only such a head falls back to its payload.
            let head = match (found, &env.head_gate) {
                (Err(NoHead::NoSessionFile), Some(gate)) => {
                    claude_head::find_confined_head(payload, ancestry, facts, &writer, gate)?
                }
                (found, _) => found?,
            };
            Ok(Resolved { writer, head })
        }
        Adapter::Codex | Adapter::Pi | Adapter::Omp => {
            let writer = payload_head::payload_writer(payload, env.session_env.as_deref())?;
            let head = payload_head::find_head(ancestry, facts)?;
            Ok(Resolved { writer, head })
        }
        Adapter::Agy => Err(NoHead::WrongTopology),
    }
}

#[cfg(test)]
mod tests {
    use super::{head_cli_session, HookEnv, HEAD_REQUEST_SOCKET_ENV};
    use crate::adapters::payload_head::payload_writer;

    fn env<'a>(pairs: &'a [(&'static str, &'static str)]) -> impl Fn(&str) -> Option<String> + 'a {
        move |key| {
            pairs
                .iter()
                .find(|(k, _)| *k == key)
                .map(|(_, v)| v.to_string())
        }
    }

    #[test]
    fn a_head_session_attempt_is_its_clis_session_and_any_other_runner_attempt_stays_its_attempt() {
        let head = [
            ("FGOS_SESSION_ID", "att-cmd_1"),
            ("CLAUDE_CODE_SESSION_ID", "uuid-1"),
            (HEAD_REQUEST_SOCKET_ENV, "/run/user/1/s.sock"),
        ];
        assert_eq!(head_cli_session(&env(&head)).as_deref(), Some("uuid-1"));
        // A worker: no head request socket, so it stays a runner attempt (never registered).
        assert_eq!(head_cli_session(&env(&head[..2])), None);
        // Not a runner attempt, or no CLI session variable: nothing to swap.
        let own = [
            ("FGOS_SESSION_ID", "my-session"),
            ("CLAUDE_CODE_SESSION_ID", "uuid-1"),
            (HEAD_REQUEST_SOCKET_ENV, "/s"),
        ];
        assert_eq!(head_cli_session(&env(&own)), None);
        let bare = [
            ("FGOS_SESSION_ID", "att-cmd_1"),
            (HEAD_REQUEST_SOCKET_ENV, "/s"),
        ];
        assert_eq!(head_cli_session(&env(&bare)), None);
    }

    #[test]
    fn a_head_session_attempt_whose_cli_names_its_session_only_in_the_payload_takes_the_payloads_session(
    ) {
        let codex = [
            ("FGOS_SESSION_ID", "att-cmd_1"),
            (HEAD_REQUEST_SOCKET_ENV, "/run/user/1/s.sock"),
        ];
        let gate = |attempt: &str| {
            (attempt == "att-cmd_1").then(|| fgos_identity::resolve::HeadRef {
                pid: 7,
                start_time: "70".into(),
            })
        };
        let head = HookEnv::from_lookup(&env(&codex), &gate);
        assert_eq!(
            (head.session_writer.clone(), head.session_env.clone()),
            (None, None)
        );
        assert_eq!(head.head_gate.map(|gate| gate.pid), Some(7));
        let payload = br#"{"session_id":"codex-thread-1"}"#;
        assert_eq!(
            payload_writer(payload, head.session_env.as_deref())
                .ok()
                .as_ref()
                .map(|writer| writer.as_str()),
            Some("codex-thread-1")
        );
        // The falsifier: a worker attempt (no head request socket) keeps its attempt id as its session, so the
        // payload's session is refused as another writer's.
        let worker = HookEnv::from_lookup(&env(&codex[..1]), &gate);
        assert_eq!(worker.session_env.as_deref(), Some("att-cmd_1"));
        assert_eq!(worker.head_gate, None, "a worker never asks for its gate");
        assert!(payload_writer(payload, worker.session_env.as_deref()).is_err());
    }
}
