//! The `send`, read-only `inbox` and `inbox --claim` verbs (spec §6.1)
//! and the read-only listing of the record's heads
//! over the record: what a caller is answered comes from the frame
//! contract through the core's renderers. An entry wires the caller's
//! identity, the clock and the output; nothing here prints, and only
//! `inbox --claim` writes, to the stdout it is handed.
use crate::adapters::version::{recipient_version, VersionSources};
use crate::adapters::TestedClis;
use crate::head::stored_liveness;
use crate::hook::shell::{claimed_sizes, emit_and_finish, Emit, WriteGate};
use crate::hook::{claim_inbox, HandleOf, InboxClaim};
use crate::record::{Record, Reported, Wait};
use fgos_mailbox_core::{
    delivery_report, record_error_text, refusal_text, Limits, SendOutcome, SendRequest, Timestamp,
    VersionClause, WriterKey,
};
use fgos_mailbox_core::{inbox_text, Cli, Liveness, MessageId, ShortName};
use std::collections::BTreeMap;
use std::io::Write;

/// The answer to one `send`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SendAnswer {
    pub text: String,
    /// Whether the message was recorded.
    pub recorded: bool,
}

/// Records a message, or answers why not: the delivery report of a
/// recorded send (with the recipient's CLI version read from `versions`
/// after the hold, outside the lock), the refusal text of a refused one,
/// and the record-error text when the hold failed.
pub fn send(
    record: &Record,
    req: SendRequest<'_>,
    wait: Wait,
    now: Timestamp,
    limits: &Limits,
    versions: &VersionSources,
) -> SendAnswer {
    match record.send(req, wait, now, limits) {
        Ok(held) => match held.value {
            Ok(outcome) => SendAnswer {
                text: delivery_report(&outcome, &version_clause(&outcome, versions), limits),
                recorded: true,
            },
            Err(refusal) => SendAnswer {
                text: refusal_text(&refusal, limits),
                recorded: false,
            },
        },
        Err(error) => SendAnswer {
            text: record_error_text(error.code()),
            recorded: false,
        },
    }
}

/// The pending mail of `key`, read in one hold that changes nothing, so it
/// never writes the snapshot; `Err` carries the record-error text.
pub fn inbox(
    record: &Record,
    key: &WriterKey,
    wait: Wait,
    now: Timestamp,
    limits: &Limits,
) -> Result<String, String> {
    let held = record
        .hold(wait, now, limits, |state, _| {
            Reported::unchanged((state.binding(key).is_some(), state.inbox(key)))
        })
        .map_err(|error| record_error_text(error.code()))?;
    let (bound, items) = held.value.value;
    Ok(inbox_text(bound.then_some(items.as_slice()), limits))
}

/// One head of the record, as a caller that addresses heads sees it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HeadView {
    pub key: WriterKey,
    pub name: ShortName,
    pub cli: Cli,
    /// The store's judgement of the head's process; never `Dead` here.
    pub liveness: Liveness,
}

/// Every head of the record whose process the store does not judge dead,
/// ordered by key, read without the lock and creating nothing
/// ([`Record::read_existing`]); empty when there is no record yet. A
/// runner attempt's key is never listed (it is never registered either).
/// `Err` carries the record-error text.
pub fn heads(fgos_dir: &std::path::Path, limits: &Limits) -> Result<Vec<HeadView>, String> {
    let existing =
        Record::read_existing(fgos_dir, limits).map_err(|error| record_error_text(error.code()))?;
    Ok(existing.map_or_else(Vec::new, |existing| live_heads(&existing.state)))
}

/// The one rule of which bindings count as heads, shared by `list` and
/// `status`: not a runner attempt's key, not judged dead.
fn live_heads(state: &fgos_mailbox_core::MailboxState) -> Vec<HeadView> {
    state
        .bindings()
        .filter(|b| !fgos_identity::is_attempt_writer_id(b.key.as_str()))
        .map(|b| HeadView {
            key: b.key.clone(),
            name: b.name.clone(),
            cli: b.cli.clone(),
            liveness: stored_liveness(b),
        })
        .filter(|h| h.liveness != Liveness::Dead)
        .collect()
}

/// What the delivery report says of the recipient's CLI version.
fn version_clause(outcome: &SendOutcome, versions: &VersionSources) -> VersionClause {
    match recipient_version(outcome, versions) {
        Some(v) if TestedClis::embedded().lists_version(outcome.to_cli.as_str(), &v) => {
            VersionClause::Tested
        }
        Some(v) => VersionClause::Untested(v),
        None => VersionClause::Unknown,
    }
}

/// What one `inbox --claim` did.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct InboxClaimed {
    /// The ids of the claimed items, in frame order.
    pub claimed: Vec<MessageId>,
    /// Whether the frames, or the empty or no-address line, were written.
    pub written: bool,
    /// Whether the claim was finished: only after a successful write.
    pub finished: bool,
}

/// `inbox --claim`: claims every pending item of `key`, writes the frames
/// joined by one blank line as plain text to `stdout`, and finishes only
/// after a successful write, in the hook's order. A caller with no
/// address, or a runner attempt's writer (never registered), gets the
/// no-address line; an empty inbox its line. `Err` carries the
/// record-error text, with nothing claimed.
pub fn inbox_claim(
    record: &Record,
    key: &WriterKey,
    wait: Wait,
    clock: &dyn Fn() -> Timestamp,
    limits: &Limits,
    handle_of: &HandleOf<'_>,
    stdout: &mut dyn Write,
) -> Result<InboxClaimed, String> {
    let line = |stdout: &mut dyn Write, text: String| InboxClaimed {
        written: writeln!(stdout, "{text}")
            .and_then(|()| stdout.flush())
            .is_ok(),
        ..InboxClaimed::default()
    };
    if fgos_identity::is_attempt_writer_id(key.as_str()) {
        return Ok(line(stdout, inbox_text(None, limits)));
    }
    let now = clock();
    let held = record
        .hold(wait, now, limits, |state, ids| {
            let (claim, changed) = claim_inbox(state, key, now, limits, ids);
            let sizes = match &claim {
                InboxClaim::Claimed(claimed) => claimed_sizes(state, claimed),
                InboxClaim::NoAddress | InboxClaim::Empty => BTreeMap::new(),
            };
            Reported {
                value: (claim, sizes),
                changed,
            }
        })
        .map_err(|error| record_error_text(error.code()))?;
    let (claim, sizes) = held.value.value;
    let claimed = match claim {
        InboxClaim::NoAddress => return Ok(line(stdout, inbox_text(None, limits))),
        InboxClaim::Empty => return Ok(line(stdout, inbox_text(Some(&[]), limits))),
        InboxClaim::Claimed(claimed) => claimed,
    };
    let gate = WriteGate::new();
    let emitted = emit_and_finish(
        &Emit {
            record,
            wait,
            limits,
            clock,
            gate: &gate,
            handle_of,
        },
        &claimed,
        &sizes,
        stdout,
    );
    Ok(InboxClaimed {
        claimed: claimed.items.iter().map(|item| item.id.clone()).collect(),
        written: emitted.stdout_written,
        finished: emitted.finished,
    })
}

/// What `status` answers (spec §9, report-only): the record's verdict, the
/// signals the snapshot and the hook-outcome file give, as JSON and as text.
/// No signal has a threshold yet, so none fails the answer.
#[derive(Debug, Clone, PartialEq)]
pub struct StatusAnswer {
    pub json: serde_json::Value,
    pub text: String,
    /// `false` only when the record could not be read (its code is in
    /// `json.record`); a missing record is `true`, "none".
    pub record_ok: bool,
}

/// `status`: reads the record without the lock and creates nothing
/// ([`Record::read_existing`]); the latest hook outcome is read only from a
/// trusted `runtime/mailbox/`.
pub fn status(fgos_dir: &std::path::Path, now: Timestamp, limits: &Limits) -> StatusAnswer {
    let existing = match Record::read_existing(fgos_dir, limits) {
        Ok(existing) => existing,
        Err(error) => {
            let json = serde_json::json!({ "record": error.code() });
            return StatusAnswer {
                text: format!("record: {}", error.code()),
                json,
                record_ok: false,
            };
        }
    };
    let Some(existing) = existing else {
        return StatusAnswer {
            json: serde_json::json!({ "record": "none" }),
            text: "record: none (no hook has run in this project yet)".to_string(),
            record_ok: true,
        };
    };
    let outcome = hook_outcome(fgos_dir);
    let signals = signals(&existing.state, now);
    let json = serde_json::json!({
        "record": "ok",
        "recordBytes": existing.snapshot_bytes,
        "heads": live_heads(&existing.state).len(),
        "signals": signals,
        "hookOutcome": outcome,
    });
    StatusAnswer {
        text: status_text(&json),
        json,
        record_ok: true,
    }
}

/// The latest hook outcome line, when one was written.
fn hook_outcome(fgos_dir: &std::path::Path) -> serde_json::Value {
    let paths = crate::record::Paths::new(fgos_dir);
    crate::record::trusted_mailbox_dir(&paths)
        .and_then(|_| crate::record::read_regular_capped(&paths.hook_outcome(), 4096).ok())
        .and_then(|bytes| serde_json::from_slice(&bytes).ok())
        .unwrap_or(serde_json::Value::Null)
}

/// Nearest-rank percentile of sorted `values`.
fn rank(sorted: &[u64], percent: usize) -> u64 {
    let index = (percent * sorted.len())
        .div_ceil(100)
        .clamp(1, sorted.len())
        - 1;
    sorted[index]
}

/// The spec §9 signals one snapshot gives: 1 recorded to offered, 2
/// refusals per reason, 3 offers per message, 5 queue depth and oldest
/// age, 9 heads with mail pending and no drain since it arrived, 10
/// offered and never answered.
fn signals(state: &fgos_mailbox_core::MailboxState, now: Timestamp) -> serde_json::Value {
    use fgos_mailbox_core::MessageState;
    let age = |at: Timestamp| now.as_millis().saturating_sub(at.as_millis());
    let mut latency: Vec<u64> = state
        .messages()
        .filter_map(|h| match h.state {
            MessageState::Offered { at } => {
                Some(at.as_millis().saturating_sub(h.recorded_at.as_millis()))
            }
            _ => None,
        })
        .collect();
    latency.sort_unstable();
    let latency = if latency.is_empty() {
        serde_json::json!({ "n": 0 })
    } else {
        serde_json::json!({
            "n": latency.len(),
            "p50": rank(&latency, 50),
            "p95": rank(&latency, 95),
            "max": latency[latency.len() - 1],
        })
    };
    let refusals: serde_json::Map<String, serde_json::Value> = state
        .counters()
        .totals()
        .map(|(reason, count)| (reason.code().to_string(), count.into()))
        .collect();
    let pending = |h: &&fgos_mailbox_core::Header| {
        matches!(
            h.state,
            MessageState::Recorded | MessageState::InFlight { .. }
        )
    };
    let oldest_pending = state
        .messages()
        .filter(pending)
        .map(|h| h.recorded_at)
        .min();
    let undrained: Vec<serde_json::Value> = state
        .bindings()
        .filter_map(|b| {
            let mine: Vec<&fgos_mailbox_core::Header> = state
                .messages()
                .filter(pending)
                .filter(|h| h.to == b.key && h.to_generation == b.generation)
                .collect();
            let oldest = mine.iter().map(|h| h.recorded_at).min()?;
            let drained_since = b.last_drain_at.is_some_and(|at| at >= oldest);
            (!drained_since).then(|| {
                serde_json::json!({
                    "name": b.name.as_str(),
                    "pending": mine.len(),
                    "lastDrainAgeMs": b.last_drain_at.map(age),
                })
            })
        })
        .collect();
    let offered: Vec<&fgos_mailbox_core::Header> = state
        .messages()
        .filter(|h| matches!(h.state, MessageState::Offered { .. }))
        .collect();
    serde_json::json!({
        "offerLatencyMs": latency,
        "refusals": refusals,
        "offers": {
            "max": state.messages().map(|h| h.offers).max().unwrap_or(0),
            "repeated": state.messages().filter(|h| h.offers > 1).count(),
        },
        "queue": {
            "pending": state.messages().filter(pending).count(),
            "oldestAgeMs": oldest_pending.map(age),
        },
        "undrained": undrained,
        "offeredUnanswered": {
            "offered": offered.len(),
            "unanswered": offered.iter().filter(|h| !h.answered).count(),
        },
    })
}

/// The status JSON as operator lines.
fn status_text(json: &serde_json::Value) -> String {
    let s = &json["signals"];
    let refusals = s["refusals"]
        .as_object()
        .filter(|m| !m.is_empty())
        .map_or_else(
            || "none".to_string(),
            |m| {
                m.iter()
                    .map(|(k, v)| format!("{k}={v}"))
                    .collect::<Vec<_>>()
                    .join(", ")
            },
        );
    let latency = &s["offerLatencyMs"];
    let undrained = s["undrained"]
        .as_array()
        .filter(|a| !a.is_empty())
        .map_or_else(
            || "none".to_string(),
            |a| {
                a.iter()
                    .map(|u| {
                        format!(
                            "{} pending={} last_drain_age_ms={}",
                            u["name"].as_str().unwrap_or(""),
                            u["pending"],
                            u["lastDrainAgeMs"]
                        )
                    })
                    .collect::<Vec<_>>()
                    .join("; ")
            },
        );
    let outcome = &json["hookOutcome"];
    [
        "record: ok".to_string(),
        format!("record bytes: {}", json["recordBytes"]),
        format!("heads: {}", json["heads"]),
        format!(
            "recorded to offered (ms): n={} p50={} p95={} max={}",
            latency["n"], latency["p50"], latency["p95"], latency["max"]
        ),
        format!("refusals: {refusals}"),
        format!(
            "offers per message: max={} repeated={}",
            s["offers"]["max"], s["offers"]["repeated"]
        ),
        format!(
            "queue: pending={} oldest_age_ms={}",
            s["queue"]["pending"], s["queue"]["oldestAgeMs"]
        ),
        format!("pending with no drain since: {undrained}"),
        format!(
            "offered and never answered: {} of {}",
            s["offeredUnanswered"]["unanswered"], s["offeredUnanswered"]["offered"]
        ),
        format!(
            "last hook outcome: {}",
            outcome["reason"].as_str().unwrap_or("none")
        ),
    ]
    .join("\n")
}
