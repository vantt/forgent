//! The Claude Code head finder (spec §5.1, §6.1 shell duties): from the
//! hook entry's ancestry to the head's facts. Claude Code keeps
//! `<sessions dir>/<pid>.json` for its own process while its hooks run
//! (pid, `sessionId`, `procStart`, a derived `name`); the head is the
//! process at the topology's head position whose session file names that
//! pid and the caller's writer key. The head record always comes from
//! process facts, never from fields of the file.
//!
//! The sessions directory is a parameter: the entry passes
//! `<config dir>/sessions`, the config directory coming from session
//! identity's one resolver (`CLAUDE_CONFIG_DIR`, else `$HOME/.claude`),
//! shared with Observe. The directory is chosen by the environment, but the
//! head is bound by the caller check and by the session file's `pid`,
//! `sessionId` and `procStart` matching process facts, never by the
//! directory; a same-user process is outside the guard anyway (spec §6.1).
//! Whether Claude Code writes its session file under a custom
//! `CLAUDE_CONFIG_DIR` was not measured.
//!
//! A confined head (a head session attempt, spec §6.1) can have no session
//! file at all: its sandbox mounts the host's sessions directory read-only
//! over its own, so Claude Code's write of `<pid>.json` fails. For that head
//! only, [`find_confined_head`] takes the head position without the file:
//! the payload's `session_id` must name the writer its environment gave, and
//! the process there must be the attempt's gate's direct child, so an agent
//! a tool of the head started (it inherits the head's environment) is never
//! taken for the head.
use crate::adapters::{payload_head, AdapterFacts};
use crate::head::{head_position, is_complete, Ancestry, NoHead};
use crate::hook::{HeadFacts, HookCallLimits};
use crate::record::read_regular_capped;
use fgos_identity::proc_tree::os_process_tree;
use fgos_identity::resolve::HeadRef;
use fgos_mailbox_core::WriterKey;
use serde_json::Value;
use std::io;
use std::path::Path;

/// The head of the calling Claude Code session.
pub fn find_head(
    sessions_dir: &Path,
    ancestry: &Ancestry,
    facts: &AdapterFacts,
    writer: &WriterKey,
    hook: &HookCallLimits,
) -> Result<HeadFacts, NoHead> {
    let record = head_position(ancestry, facts)?;
    if !is_complete(record) {
        return Err(NoHead::WrongTopology);
    }
    let pid = record.pid.ok_or(NoHead::WrongTopology)?.0;
    let file = read_session_file(&sessions_dir.join(format!("{pid}.json")), hook)?;
    if file.get("pid").and_then(Value::as_u64) != Some(u64::from(pid)) {
        return Err(NoHead::OtherProcess);
    }
    if file.get("sessionId").and_then(Value::as_str) != Some(writer.as_str()) {
        return Err(NoHead::OtherSession);
    }
    // Measured equal to /proc/<pid>/stat starttime on 2.1.308, which is
    // the start time process facts read.
    let proc_start = match file.get("procStart") {
        Some(Value::String(text)) => Some(text.clone()),
        Some(Value::Number(n)) => Some(n.to_string()),
        _ => None,
    };
    if proc_start.as_deref() != record.start_time.as_deref() {
        return Err(NoHead::StartTimeMismatch);
    }
    let own_suffix = (file.get("nameSource").and_then(Value::as_str) == Some("derived"))
        .then(|| file.get("name").and_then(Value::as_str))
        .flatten()
        .and_then(|name| name.rsplit_once('-'))
        .map(|(_, suffix)| suffix.to_string());
    Ok(HeadFacts {
        record: record.clone(),
        own_suffix,
        handle: None,
    })
}

/// The head of a confined head session attempt whose session file cannot
/// exist: the record at the topology's head position, accepted only when the
/// hook payload names `writer` (the CLI session its environment gave) and the
/// process is the direct child of `gate`, the attempt's gate as Identity
/// holds it (`WrongTopology` otherwise: an agent nested under the head). The
/// head names no own suffix, so its short name draws one.
pub fn find_confined_head(
    payload: &[u8],
    ancestry: &Ancestry,
    facts: &AdapterFacts,
    writer: &WriterKey,
    gate: &HeadRef,
) -> Result<HeadFacts, NoHead> {
    payload_head::payload_writer(payload, Some(writer.as_str()))?;
    let head = payload_head::find_head(ancestry, facts)?;
    let pid = head.record.pid.ok_or(NoHead::WrongTopology)?.0;
    let parent = os_process_tree().stat(pid).map(|stat| stat.ppid);
    if parent != Some(gate.pid) {
        return Err(NoHead::WrongTopology);
    }
    Ok(head)
}

fn read_session_file(path: &Path, hook: &HookCallLimits) -> Result<Value, NoHead> {
    let bytes = read_regular_capped(path, hook.max_read_bytes).map_err(|e| match e.kind() {
        io::ErrorKind::NotFound => NoHead::NoSessionFile,
        _ => NoHead::Unreadable,
    })?;
    match serde_json::from_slice(&bytes) {
        Ok(value @ Value::Object(_)) => Ok(value),
        _ => Err(NoHead::Unreadable),
    }
}
