//! The `send` and read-only `inbox` verbs (spec §6.1) over the record: what
//! a caller is answered comes from the frame contract through the core's
//! renderers. An entry wires the caller's identity, the clock and the
//! output; nothing here prints.
use crate::record::{Record, Reported, Wait};
use fgos_mailbox_core::{
    delivery_report, inbox_text, record_error_text, refusal_text, Limits, SendRequest, Timestamp,
    WriterKey,
};

/// The answer to one `send`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SendAnswer {
    pub text: String,
    /// Whether the message was recorded.
    pub recorded: bool,
}

/// Records a message, or answers why not: the delivery report of a
/// recorded send, the refusal text of a refused one, and the record-error
/// text when the hold failed.
pub fn send(
    record: &Record,
    req: SendRequest<'_>,
    wait: Wait,
    now: Timestamp,
    limits: &Limits,
) -> SendAnswer {
    match record.send(req, wait, now, limits) {
        Ok(held) => match held.value {
            Ok(outcome) => SendAnswer {
                text: delivery_report(&outcome, limits),
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
