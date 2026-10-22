//! Reading and installing `snapshot.json`; called only by a holder of the
//! mailbox lock.
use super::{open_regular, Paths, RecordError, Step, Warning};
use fgos_durable_file::{replace_durably_observed, ReplacePoint};
use fgos_mailbox_core::{MailboxState, SnapshotVersion};
use std::io::{self, Read};

/// The installed snapshot's bytes and state. A missing snapshot reads as
/// the empty state, with the bytes that state encodes to, so a hold that
/// changes nothing on an empty record creates no file.
///
/// The file is opened without following a symlink and without blocking,
/// and must be a regular file before a byte is read: a planted symlink or
/// FIFO is refused, never followed and never waited on.
pub(super) fn read(paths: &Paths) -> Result<(Vec<u8>, MailboxState), RecordError> {
    let unreadable = |detail: String| RecordError::SnapshotUnreadable { detail };
    let mut file = match open_regular(&paths.snapshot()) {
        Ok(file) => file,
        Err(e) if e.kind() == io::ErrorKind::NotFound => {
            let state = MailboxState::new();
            return Ok((encode(&state)?, state));
        }
        Err(e) => return Err(unreadable(e.to_string())),
    };
    let mut bytes = Vec::new();
    file.read_to_end(&mut bytes)
        .map_err(|e| unreadable(e.to_string()))?;
    let version: SnapshotVersion =
        serde_json::from_slice(&bytes).map_err(|e| unreadable(e.to_string()))?;
    version.check().map_err(RecordError::SnapshotVersion)?;
    let state = serde_json::from_slice(&bytes).map_err(|e| unreadable(e.to_string()))?;
    Ok((bytes, state))
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
