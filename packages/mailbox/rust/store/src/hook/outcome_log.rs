//! The last hook call that skipped or failed its drain (spec §6.1): one
//! small JSON object in `runtime/mailbox/hook-outcome.json`, beside the
//! record, so an operator or a later `status` sees why mail was not taken
//! (a payload over the read cap, an open breaker, a caller that is not the
//! head, a record error, a panic, a finish that warned). A benign call (mail
//! taken, nothing eligible, a subordinate, no head, a runner head) writes
//! nothing, so the no-mail path stays write-free and the doctor probe writes
//! nothing. The file holds one outcome, the latest, so it never grows. It is
//! written like the breaker: only into an existing `runtime/mailbox/` that
//! passed the record's directory trust check (so a call creates no
//! directory), without the mailbox lock, and a failed write changes nothing
//! else.
use super::shell::{Quiet, ShellOutcome};
use super::{Adapter, HookEvent};
use crate::record::{trusted_mailbox_dir, Paths};
use fgos_mailbox_core::Timestamp;
use serde::Serialize;

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

/// Records `outcome` when it skipped or failed its drain.
pub fn record(
    paths: &Paths,
    adapter: Adapter,
    event: HookEvent,
    outcome: &ShellOutcome,
    now: Timestamp,
) {
    let Some(reason) = reason(outcome) else {
        return;
    };
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
        reason: &reason,
    };
    if let Ok(bytes) = serde_json::to_vec(&line) {
        let _ = fgos_durable_file::replace_durably(&dir, Paths::hook_outcome_name(), &bytes);
    }
}
