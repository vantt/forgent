//! The head finder of the CLIs whose hook names its session only in the
//! payload (spec §5.1, §6.1 shell duties; review M4): Codex, and pi and omp
//! through the generated extension. None keeps a session file, so the head
//! is the process at the direct head position, accepted only when it runs
//! one of the adapter's head executables (`codex`; pi runs `node`; `omp`):
//! a subreaper (`systemd --user`) or a pane process that adopted the entry
//! never registers. The caller check compares that position again just
//! before hold 1. A tool process also sits directly under its CLI
//! (measured for Codex, plans/reports/research-261023-0148-mailbox-v5-measurements.md
//! table c; pi's and omp's bash tool likewise), so this is no guard against
//! the head's own tools.
//!
//! The writer key is the payload's `session_id`: none of these hook
//! processes sees a session variable. An entry whose own environment does
//! carry one that names another session is a tool process piping someone
//! else's payload, and is refused.
use crate::adapters::AdapterFacts;
use crate::head::{head_position, is_complete, Ancestry, NoHead};
use crate::hook::HeadFacts;
use fgos_mailbox_core::WriterKey;
use serde_json::Value;

/// The head of the calling session. These CLIs name no head, so there is
/// no own suffix; Codex's handle comes from the payload in the drain.
pub fn find_head(ancestry: &Ancestry, facts: &AdapterFacts) -> Result<HeadFacts, NoHead> {
    let record = head_position(ancestry, facts)?;
    if !is_complete(record) {
        return Err(NoHead::WrongTopology);
    }
    Ok(HeadFacts {
        record: record.clone(),
        own_suffix: None,
        handle: None,
    })
}

/// The writer key: the payload's `session_id`, in session identity's
/// alphabet and length; refused when `env_writer` (the session variable of
/// the entry's own environment, if any) names another session.
pub fn payload_writer(payload: &[u8], env_writer: Option<&str>) -> Result<WriterKey, NoHead> {
    let session = serde_json::from_slice::<Value>(payload)
        .ok()
        .and_then(|v| v["session_id"].as_str().map(String::from))
        .and_then(|id| WriterKey::new(id).ok())
        .ok_or(NoHead::NoWriter)?;
    match env_writer {
        Some(env) if env != session.as_str() => Err(NoHead::WriterMismatch),
        _ => Ok(session),
    }
}
