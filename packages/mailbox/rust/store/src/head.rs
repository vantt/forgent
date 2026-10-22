//! The registering head against the stored one (spec §5.1): the mailbox
//! compares no pid or start time itself. The binding keeps the head's
//! process record as opaque text, and liveness comes from the process-facts
//! judge.
use fgos_mailbox_core::{Binding, Liveness, StoredHead};
use fgos_process::facts::{judge_here, Record, Verdict};

/// Whether `record` names a process at all: a pid and a start time. A
/// default or partial record never stands for a head.
pub fn is_complete(record: &Record) -> bool {
    record.pid.is_some() && record.start_time.is_some()
}

/// The text a binding keeps as its head; the only writer of `Binding.head`.
pub fn head_text(record: &Record) -> String {
    record.to_json().to_string()
}

/// The store's judgement of `stored` against the registering head. An
/// unreadable or incomplete stored head is never the same head, and the
/// judge reads it as `Unknown`, so nothing is guessed.
pub fn judge_stored(stored: &Binding, registering: &Record) -> StoredHead {
    let stored_record = serde_json::from_str(&stored.head)
        .map(|value| Record::from_json(&value))
        .unwrap_or_default();
    let same_head =
        is_complete(registering) && is_complete(&stored_record) && stored_record == *registering;
    let liveness = if same_head {
        // The registering record is the running head itself.
        Liveness::Alive
    } else {
        match judge_here(&stored_record) {
            Verdict::Alive => Liveness::Alive,
            Verdict::Dead => Liveness::Dead,
            Verdict::Unknown => Liveness::Unknown,
        }
    };
    StoredHead {
        same_head,
        liveness,
    }
}
