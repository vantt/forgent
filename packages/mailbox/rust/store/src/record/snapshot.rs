//! Reading and installing `snapshot.json`; called only by a holder of the
//! mailbox lock.
use super::{open_regular, Paths, RecordError, Step, Warning};
use fgos_durable_file::{replace_durably_observed, ReplacePoint};
use fgos_mailbox_core::{Header, Limits, MailboxState, Notice, SnapshotVersion};
use std::io::{self, Read};

/// The installed snapshot's state; a missing snapshot reads as the empty
/// state. A snapshot over `cap` bytes is never parsed.
///
/// The file is opened without following a symlink and without blocking,
/// and must be a regular file before a byte is read: a planted symlink or
/// FIFO is refused, never followed and never waited on.
pub(super) fn read(paths: &Paths, cap: u64) -> Result<MailboxState, RecordError> {
    let unreadable = |detail: String| RecordError::SnapshotUnreadable { detail };
    let file = match open_regular(&paths.snapshot()) {
        Ok(file) => file,
        Err(e) if e.kind() == io::ErrorKind::NotFound => {
            return Ok(MailboxState::new());
        }
        Err(e) => return Err(unreadable(e.to_string())),
    };
    // At most one byte past the cap is read, so a larger file (or one that
    // grows while it is read) is refused without being read whole.
    let mut bytes = Vec::new();
    file.take(cap.saturating_add(1))
        .read_to_end(&mut bytes)
        .map_err(|e| unreadable(e.to_string()))?;
    if bytes.len() as u64 > cap {
        return Err(RecordError::SnapshotTooLarge {
            bytes: bytes.len() as u64,
            cap,
        });
    }
    let version: SnapshotVersion =
        serde_json::from_slice(&bytes).map_err(|e| unreadable(e.to_string()))?;
    version.check().map_err(RecordError::SnapshotVersion)?;
    let state = serde_json::from_slice(&bytes).map_err(|e| unreadable(e.to_string()))?;
    Ok(state)
}

/// The bytes a snapshot of `state` is installed as.
pub(super) fn encode(state: &MailboxState) -> Result<Vec<u8>, RecordError> {
    serde_json::to_vec(state).map_err(|e| RecordError::io("encode")(io::Error::other(e)))
}

/// Installs `bytes` as the snapshot. `Err` only before the rename; from the
/// rename on, a failure is the returned warning.
pub(super) fn install(
    paths: &Paths,
    bytes: &[u8],
    observe: &mut impl FnMut(Step) -> io::Result<()>,
) -> Result<Option<Warning>, RecordError> {
    let mut stopped_at = None;
    let installed = replace_durably_observed(
        &paths.record_dir(),
        Paths::snapshot_name(),
        bytes,
        |point| {
            let step = match point {
                ReplacePoint::Written => Step::Written,
                ReplacePoint::Synced => Step::Synced,
                ReplacePoint::Renamed => Step::Renamed,
                ReplacePoint::DirectorySynced => Step::DirectorySynced,
            };
            observe(step).inspect_err(|_| stopped_at = Some(step))
        },
    );
    match installed {
        Ok(_) => Ok(None),
        Err(e) if e.installed.is_some() => Ok(Some(Warning {
            step: stopped_at.unwrap_or(match e.step {
                "parent-fsync" => Step::DirectorySynced,
                _ => Step::Renamed,
            }),
            detail: e.to_string(),
        })),
        Err(e) => Err(match stopped_at {
            Some(step) => RecordError::Observer {
                step,
                detail: e.source.to_string(),
            },
            None => RecordError::Io {
                at: e.step,
                source: e.source,
            },
        }),
    }
}

/// The most bytes a send may leave the snapshot at, derived from the
/// limits contract alone: the shared sender's header ceiling
/// (`Limits::sender_header_ceiling`) times the encoded size of the largest
/// header the contract allows (writer keys at `frame.maxHeaderChars`, the
/// body at `maxBodyBytes`, every number at its type's maximum, the largest
/// state). A send past it is refused as `record-full`; every other hold
/// still writes. One definition for the store and its tests; no new number.
pub fn snapshot_write_cap(limits: &Limits) -> u64 {
    limits
        .sender_header_ceiling()
        .saturating_mul(largest_header_bytes(limits))
}

/// The most bytes a snapshot is read and parsed at: the write cap plus the
/// most that a snapshot of that size can still grow without a send. Only a
/// send adds a header; after the last one, drains and the sweep can move
/// each header from its smallest encoded size to its largest and refuse it
/// with one notice and one notice mark. So the growth is at most
/// `write cap / smallest header` headers, each by
/// `largest header - smallest header + largest notice + largest mark`. A
/// registration adds a binding, which this does not cover: only many new
/// heads registering into a full record can pass it. A larger snapshot was
/// written by someone else and is refused, never parsed.
pub fn snapshot_read_cap(limits: &Limits) -> u64 {
    let write = snapshot_write_cap(limits);
    let smallest = smallest_header_bytes().max(1);
    let growth = largest_header_bytes(limits).saturating_sub(smallest)
        + largest_notice_bytes(limits)
        + largest_mark_bytes(limits);
    write.saturating_add((write / smallest).saturating_mul(growth))
}

/// The encoded size of the smallest header: one-character keys, short ids,
/// zero numbers, no optional field, the smallest state.
fn smallest_header_bytes() -> u64 {
    let value = serde_json::json!({
        "answered": false,
        "body_bytes": 0,
        "body_kept": false,
        "changed_at": 0,
        "depth": 0,
        "effective_wake": false,
        "from": "k",
        "from_generation": null,
        "id": "0",
        "offers": 0,
        "recorded_at": 0,
        "reply_to": null,
        "reply_to_hint": null,
        "state": "recorded",
        "to": "k",
        "to_generation": 1,
        "wake": false,
    });
    encoded_len::<Header>(value).unwrap_or(1)
}

/// The encoded size of the largest notice the contract allows.
fn largest_notice_bytes(limits: &Limits) -> u64 {
    let id = "f".repeat(16);
    let key = "k".repeat(limits.frame.max_header_chars as usize);
    let value = serde_json::json!({
        "about": id,
        "about_to": key,
        "created_at": u64::MAX,
        "id": id,
        "reason": "record-ttl",
        "state": { "in-flight": { "deadline": u64::MAX, "generation": u32::MAX, "token": id } },
        "to": key,
        "to_generation": u32::MAX,
    });
    encoded_len::<Notice>(value).unwrap_or(0)
}

/// The encoded size of the largest notice mark entry, `"<key>|<reason>":
/// <time>,`, in the snapshot's map.
fn largest_mark_bytes(limits: &Limits) -> u64 {
    let key = "k".repeat(limits.frame.max_header_chars as usize);
    let entry = serde_json::json!({ format!("{key}|record-ttl"): u64::MAX });
    // The entry inside its braces, plus the comma that separates entries.
    serde_json::to_vec(&entry).map_or(0, |bytes| bytes.len() as u64 - 1)
}

/// `value` read as a `T` and encoded again; `None` when the shape is not
/// `T`'s, so a shape change fails loudly instead of measuring the wrong
/// thing.
fn encoded_len<T: serde::de::DeserializeOwned + serde::Serialize>(
    value: serde_json::Value,
) -> Option<u64> {
    let typed: T = serde_json::from_value(value).ok()?;
    serde_json::to_vec(&typed)
        .ok()
        .map(|bytes| bytes.len() as u64)
}

/// The encoded size of the largest header the contract allows, built in
/// the header's own shape (deserialized into `Header`, so a shape change
/// that this misses fails loudly instead of measuring the wrong thing).
fn largest_header_bytes(limits: &Limits) -> u64 {
    let id = "f".repeat(16);
    let key = "k".repeat(limits.frame.max_header_chars as usize);
    let states = [
        serde_json::json!("recorded"),
        serde_json::json!({ "offered": { "at": u64::MAX } }),
        serde_json::json!({ "refused": { "at": u64::MAX, "reason": "record-ttl" } }),
        serde_json::json!({ "refused": { "at": u64::MAX, "reason": "offer-cap" } }),
        serde_json::json!({ "in-flight": { "deadline": u64::MAX, "generation": u32::MAX, "token": id } }),
    ];
    states
        .into_iter()
        .filter_map(|state| {
            let value = serde_json::json!({
                "answered": true,
                "body_bytes": limits.max_body_bytes,
                "body_kept": true,
                "body_rendered_bytes": u64::MAX,
                "changed_at": u64::MAX,
                "depth": limits.chain.max_depth,
                "effective_wake": true,
                "from": key,
                "from_generation": u32::MAX,
                "id": id,
                "offers": limits.max_offers,
                "recorded_at": u64::MAX,
                "reply_to": id,
                "reply_to_hint": id,
                "state": state,
                "to": key,
                "to_generation": u32::MAX,
                "wake": true,
            });
            encoded_len::<Header>(value)
        })
        .max()
        .unwrap_or(0)
}
