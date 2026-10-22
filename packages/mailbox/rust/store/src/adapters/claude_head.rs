//! The Claude Code head finder (spec §5.1, §6.1 shell duties): from the
//! hook entry's ancestry to the head's facts. Claude Code keeps
//! `<sessions dir>/<pid>.json` for its own process while its hooks run
//! (pid, `sessionId`, `procStart`, a derived `name`); the head is the
//! process at the topology's head position whose session file names that
//! pid and the caller's writer key. The head record always comes from
//! process facts, never from fields of the file.
//!
//! The sessions directory is a parameter: the entry passes
//! `$HOME/.claude/sessions` only. `CLAUDE_CONFIG_DIR` is not honoured: its
//! effect on a print-mode session file was not measured, and an
//! environment-chosen directory is one more lever for a same-user process.
use crate::head::{is_complete, Ancestry, NoHead, Topology};
use crate::hook::{HeadFacts, HookCallLimits};
use crate::record::read_regular_capped;
use fgos_mailbox_core::WriterKey;
use serde_json::Value;
use std::io;
use std::path::Path;

/// The head of the calling Claude Code session.
pub fn find_head(
    sessions_dir: &Path,
    ancestry: &Ancestry,
    topology: Topology,
    writer: &WriterKey,
    hook: &HookCallLimits,
) -> Result<HeadFacts, NoHead> {
    let record = topology
        .head_of(ancestry)
        .filter(|r| is_complete(r))
        .ok_or(NoHead::WrongTopology)?;
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
