//! The last hook call that skipped or failed its drain (spec §6.1): one
//! small JSON object in `runtime/mailbox/hook-outcome.json`, beside the
//! record, so an operator or a later `status` sees why mail was not taken
//! (a payload over the read cap, an open breaker, a caller that is not the
//! head, a record error, a panic, a finish that warned, a newly bound head
//! Identity did not take: `ident-handle-in-use` or `ident:<reason>`). A benign call (mail
//! taken, nothing eligible, a subordinate, no head, a runner head) writes
//! nothing, so the no-mail path stays write-free and the doctor probe writes
//! nothing. The file holds one outcome, the latest, so it never grows. It is
//! written like the breaker: only into an existing `runtime/mailbox/` that
//! passed the record's directory trust check (so a call creates no
//! directory), without the mailbox lock, and a failed write changes nothing
//! else.
use super::shell::{Quiet, ShellOutcome};
use super::{Adapter, HookEvent};
use crate::record::{read_regular_capped, trusted_mailbox_dir, Paths, LOCK_BUSY};

/// The largest outcome file read; a line is a few dozen bytes.
const MAX_FILE_BYTES: u64 = 4096;
use fgos_mailbox_core::Timestamp;
use serde::{Deserialize, Serialize};

const SCHEMA: u32 = 1;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Line<'a> {
    schema: u32,
    at_ms: u64,
    cli: &'static str,
    event: &'static str,
    reason: &'a str,
}

/// How many hook calls skipped their drain because the mailbox lock was
/// busy, and when the latest did. The single latest outcome cannot show
/// how often this happens, and the lock is by definition not held, so the
/// total lives in its own small file beside the outcome, written like it
/// (trusted directory only, no lock, a failed write changes nothing).
/// Concurrent skips may lose an increment; the count is a lower bound.
/// An older binary never reads the file, so a downgrade is safe.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LockBusySkips {
    pub count: u64,
    pub last_at_ms: u64,
}

/// The lock-busy skip total, `None` when none was counted or the file is
/// unreadable.
pub fn lock_busy_skips(paths: &Paths) -> Option<LockBusySkips> {
    let dir = trusted_mailbox_dir(paths)?;
    let bytes =
        read_regular_capped(&dir.join(Paths::hook_lock_busy_name()), MAX_FILE_BYTES).ok()?;
    serde_json::from_slice::<LockBusySkips>(&bytes)
        .ok()
        .filter(|skips| skips.count > 0)
}

fn count_lock_busy(paths: &Paths, now: Timestamp) {
    let Some(dir) = trusted_mailbox_dir(paths) else {
        return;
    };
    let next = LockBusySkips {
        count: lock_busy_skips(paths)
            .map_or(0, |s| s.count)
            .saturating_add(1),
        last_at_ms: now.as_millis(),
    };
    if let Ok(bytes) = serde_json::to_vec(&next) {
        let _ = fgos_durable_file::replace_durably(&dir, Paths::hook_lock_busy_name(), &bytes);
    }
}

/// The reason word of a call worth recording, or `None` for a benign one.
fn reason(outcome: &ShellOutcome) -> Option<String> {
    if outcome.panicked {
        return Some("panic".into());
    }
    match &outcome.quiet {
        Some(Quiet::OverReadCap) => Some("over-read-cap".into()),
        Some(Quiet::BreakerOpen) => Some("breaker-open".into()),
        Some(Quiet::NotTheHead) => Some("not-the-head".into()),
        Some(Quiet::NoAncestry) => Some("no-ancestry".into()),
        Some(Quiet::Record(code)) => Some(format!("record:{code}")),
        Some(Quiet::Drain(_) | Quiet::NoHead(_) | Quiet::RunnerHead) | None => {
            (!outcome.warnings.is_empty()).then(|| "warning".into())
        }
    }
}

/// The reason of the latest recorded outcome, when one is there.
pub fn latest_reason(paths: &Paths) -> Option<String> {
    trusted_mailbox_dir(paths)?;
    let bytes = read_regular_capped(&paths.hook_outcome(), MAX_FILE_BYTES).ok()?;
    let line: serde_json::Value = serde_json::from_slice(&bytes).ok()?;
    line["reason"].as_str().map(String::from)
}

/// Removes the latest outcome once what it recorded was repaired, so the
/// file names only a problem that still holds.
pub fn clear(paths: &Paths) {
    if let Some(dir) = trusted_mailbox_dir(paths) {
        let _ = std::fs::remove_file(dir.join(Paths::hook_outcome_name()));
    }
}

/// Records `outcome` when it skipped or failed its drain.
pub fn record(
    paths: &Paths,
    adapter: Adapter,
    event: HookEvent,
    outcome: &ShellOutcome,
    now: Timestamp,
) {
    if !outcome.panicked && matches!(outcome.quiet, Some(Quiet::Record(LOCK_BUSY))) {
        count_lock_busy(paths, now);
    }
    if let Some(reason) = reason(outcome) {
        record_reason(paths, adapter, event, &reason, now);
    }
}

/// Records `reason` as the latest skipped or failed step of a hook call;
/// also used by the entry for a step after the shell (making sure Identity
/// knows a newly bound head).
pub fn record_reason(
    paths: &Paths,
    adapter: Adapter,
    event: HookEvent,
    reason: &str,
    now: Timestamp,
) {
    let Some(dir) = trusted_mailbox_dir(paths) else {
        return;
    };
    let line = Line {
        schema: SCHEMA,
        at_ms: now.as_millis(),
        cli: adapter.word(),
        event: match event {
            HookEvent::Stop => "stop",
            HookEvent::PostToolUse => "post-tool-use",
        },
        reason,
    };
    if let Ok(bytes) = serde_json::to_vec(&line) {
        let _ = fgos_durable_file::replace_durably(&dir, Paths::hook_outcome_name(), &bytes);
    }
}
