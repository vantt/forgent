//! The one resolver of the hook entry (spec §6.1): from a payload and the
//! entry's ancestry to the writer key and the head, per CLI. The entry
//! reads its environment once into [`HookEnv`]; the test entry and the
//! host both call [`resolver_for`], so it exists once.
//!
//! - Claude Code: the writer is session identity's (from the environment
//!   or the registry only, never a pid fallback), and the head comes from
//!   the session file under the shared config-directory resolver.
//! - Codex: the writer is the payload's `session_id` (its hook sees no
//!   session variable), and the head is the direct head position whose
//!   executable the adapter names.
//! - agy: deferred, so no head.
use super::shell::Resolved;
use super::{Adapter, HookCallLimits};
use crate::adapters::{claude_head, codex_head, AdapterFacts};
use crate::head::{Ancestry, NoHead};
use fgos_identity::cli_dirs::claude_config_dir;
use fgos_identity::resolve::{env_identity, resolve_current, Source, WriterId};
use fgos_mailbox_core::WriterKey;
use std::ffi::OsString;
use std::path::Path;

/// What the entry read of its environment, once.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HookEnv {
    pub home: Option<OsString>,
    pub claude_config_dir: Option<OsString>,
    /// Session identity's writer of this process, when it came from the
    /// environment or the registry (never one derived from a pid).
    pub session_writer: Option<WriterKey>,
    /// The session id the entry's own environment names, if any
    /// (`FGOS_SESSION_ID`, `CODEX_THREAD_ID`, `CLAUDE_CODE_SESSION_ID`).
    pub session_env: Option<String>,
}

impl HookEnv {
    /// The calling process's environment; `fgos_dir` is the record's
    /// `.fgos` directory, where session identity's registry lives.
    pub fn from_process(fgos_dir: &Path) -> Self {
        let lookup = |name: &str| std::env::var(name).ok();
        let identity = resolve_current(Some(fgos_dir));
        let session_writer = match (identity.id, identity.source) {
            (WriterId::Session(id), Source::Env | Source::Registry) => WriterKey::new(id).ok(),
            _ => None,
        };
        Self {
            home: std::env::var_os("HOME"),
            claude_config_dir: std::env::var_os("CLAUDE_CONFIG_DIR"),
            session_writer,
            session_env: env_identity(&lookup, None).map(|identity| identity.id.to_string()),
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
                .ok_or(NoHead::NoSessionFile)?
                .join("sessions");
            let head = claude_head::find_head(&sessions, ancestry, facts, &writer, hook)?;
            Ok(Resolved { writer, head })
        }
        Adapter::Codex => {
            let writer = codex_head::codex_writer(payload, env.session_env.as_deref())?;
            let head = codex_head::find_head(ancestry, facts)?;
            Ok(Resolved { writer, head })
        }
        Adapter::Agy => Err(NoHead::WrongTopology),
    }
}
