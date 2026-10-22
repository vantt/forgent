//! The `send`, read-only `inbox` and `inbox --claim` verbs (spec §6.1)
//! over the record: what a caller is answered comes from the frame
//! contract through the core's renderers. An entry wires the caller's
//! identity, the clock and the output; nothing here prints, and only
//! `inbox --claim` writes, to the stdout it is handed.
use crate::adapters::version::{recipient_version, VersionSources};
use crate::adapters::TestedClis;
use crate::hook::shell::{claimed_sizes, emit_and_finish, Emit, WriteGate};
use crate::hook::{claim_inbox, InboxClaim};
use crate::record::{Record, Reported, Wait};
use fgos_mailbox_core::{
    delivery_report, record_error_text, refusal_text, Limits, SendOutcome, SendRequest, Timestamp,
    VersionClause, WriterKey,
};
use fgos_mailbox_core::{inbox_text, MessageId};
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
