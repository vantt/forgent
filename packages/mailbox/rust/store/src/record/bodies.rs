//! Message bodies: one immutable file per accepted message under
//! `record/bodies/`, and the deletion of those no installed snapshot
//! references.
//!
//! Deleting every unnamed file in `record/` is safe only because every
//! writer of `record/` holds the mailbox lock, so no other writer can be
//! between its temporary file and its rename. A new file kept beside the
//! snapshot must be named by `Paths::is_known` in the same change, or the
//! sweep deletes it.
use super::{sys, Collected, DirId, Paths, RecordError, Sweep, TrustedDirs};
use fgos_durable_file::{install_once, Installed};
use fgos_mailbox_core::{MailboxState, MessageId};
use std::collections::BTreeSet;
use std::ffi::{OsStr, OsString};
use std::fs::{File, OpenOptions};
use std::io;
use std::os::unix::fs::{MetadataExt, OpenOptionsExt};
use std::path::Path;

/// Installs the body of `id`, never over an existing file. Only a holder
/// of the mailbox lock may call it; the send hold is its one caller.
pub fn install(paths: &Paths, id: &MessageId, bytes: &[u8]) -> Result<(), RecordError> {
    let name = Paths::body_name(id).ok_or_else(|| RecordError::Io {
        at: "body-name",
        source: io::Error::new(io::ErrorKind::InvalidInput, "message id is not hex"),
    })?;
    match install_once(&paths.bodies_dir(), &name, bytes) {
        Ok(Installed::Created) => Ok(()),
        Ok(Installed::AlreadyExists) => Err(RecordError::BodyExists { id: id.clone() }),
        Err(e) => Err(RecordError::Io {
            at: e.step,
            source: e.source,
        }),
    }
}

/// The ids whose body the state still references.
pub(super) fn referenced(state: &MailboxState) -> BTreeSet<MessageId> {
    state
        .messages()
        .filter(|header| header.body_kept)
        .map(|header| header.id.clone())
        .collect()
}

/// After an install: deletes the `dropped` bodies (no listing), and in a
/// send also every regular file of the record directories that neither
/// `Paths::is_known` nor a `kept` body names. An entry that is not a
/// regular file stops the sweep before it deletes anything. Deletions go
/// through descriptors of the directories the hold checked, and never
/// follow a symlink.
pub(super) fn collect(
    paths: &Paths,
    dirs: &TrustedDirs,
    dropped: &BTreeSet<MessageId>,
    sweep: Sweep,
    kept: &BTreeSet<MessageId>,
    collected: &mut Collected,
) -> Result<(), String> {
    let bodies = open_dir(&paths.bodies_dir(), dirs.bodies)?;
    for name in dropped.iter().filter_map(Paths::body_name) {
        tally(sys::unlink_at(&bodies, OsStr::new(&name)), collected);
    }
    if sweep == Sweep::No {
        return Ok(());
    }
    let kept: BTreeSet<OsString> = kept
        .iter()
        .filter_map(Paths::body_name)
        .map(OsString::from)
        .collect();
    let in_record = unnamed(&paths.record_dir(), |name| paths.is_known(name))?;
    let in_bodies = unnamed(&paths.bodies_dir(), |name| kept.contains(name))?;
    let record = open_dir(&paths.record_dir(), dirs.record)?;
    for name in &in_record {
        tally(sys::unlink_at(&record, name), collected);
    }
    for name in &in_bodies {
        tally(sys::unlink_at(&bodies, name), collected);
    }
    Ok(())
}

fn tally(result: io::Result<bool>, collected: &mut Collected) {
    match result {
        Ok(true) => collected.deleted += 1,
        Ok(false) => {}
        Err(_) => collected.failed += 1,
    }
}

/// The entries of `dir` that `keep` does not name; all must be regular
/// files, judged without following a symlink.
fn unnamed(dir: &Path, keep: impl Fn(&OsStr) -> bool) -> Result<Vec<OsString>, String> {
    let fail = |e: io::Error| format!("{}: {e}", dir.display());
    let mut names = Vec::new();
    for entry in std::fs::read_dir(dir).map_err(fail)? {
        let entry = entry.map_err(fail)?;
        let name = entry.file_name();
        if keep(&name) {
            continue;
        }
        if !entry.file_type().map_err(fail)?.is_file() {
            return Err(format!(
                "{}: {} is not a regular file; nothing was swept",
                dir.display(),
                name.to_string_lossy()
            ));
        }
        names.push(name);
    }
    Ok(names)
}

/// A descriptor of `path`, which must still be the directory the hold
/// checked.
fn open_dir(path: &Path, checked: DirId) -> Result<File, String> {
    let fail = |e: io::Error| format!("{}: {e}", path.display());
    let dir = OpenOptions::new()
        .read(true)
        .custom_flags(libc::O_DIRECTORY | libc::O_NOFOLLOW)
        .open(path)
        .map_err(fail)?;
    let meta = dir.metadata().map_err(fail)?;
    if (DirId {
        dev: meta.dev(),
        ino: meta.ino(),
    }) != checked
    {
        return Err(format!(
            "{}: changed since the hold checked it; nothing was deleted",
            path.display()
        ));
    }
    Ok(dir)
}
