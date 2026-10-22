//! Reading and installing `snapshot.json`; called only by a holder of the
//! mailbox lock.
use super::{open_regular, Paths, RecordError, Step, Warning};
use fgos_durable_file::{replace_durably_observed, ReplacePoint};
use fgos_mailbox_core::{Header, Limits, MailboxState, SnapshotVersion};
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

/// The most bytes a snapshot is read and parsed at, derived from the limits
/// contract alone: the shared sender's header ceiling
/// (`Limits::sender_header_ceiling`) times the encoded size of the largest
/// header the contract allows (writer keys at `frame.maxHeaderChars`, the
/// body at `maxBodyBytes`, every number at its type's maximum, the largest
/// state). One definition for the store and its tests; no new number.
pub fn snapshot_byte_cap(limits: &Limits) -> u64 {
    limits
        .sender_header_ceiling()
        .saturating_mul(largest_header_bytes(limits))
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
            let header: Header = serde_json::from_value(value).ok()?;
            serde_json::to_vec(&header)
                .ok()
                .map(|bytes| bytes.len() as u64)
        })
        .max()
        .unwrap_or(0)
}
