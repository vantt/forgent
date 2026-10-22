//! The one place that names the mailbox's runtime files and their layout
//! (spec §6.4, option A). Everything else, tests included, asks `Paths`.
//!
//! - `<fgosDir>/runtime/mailbox/`: kept for files written without the
//!   mailbox lock (the breaker file of spec §4.1). The record never lists it.
//! - `<fgosDir>/runtime/mailbox/record/`: written only by a holder of the
//!   mailbox lock: `snapshot.json` and `bodies/<id>.body`.
//!
//! The lock file's path is the holder-lock registry's (`v3Path` of the
//! `mailbox` row); this module only fills its `<fgosDir>` parameter.
use fgos_mailbox_core::MessageId;
use std::collections::BTreeMap;
use std::ffi::OsStr;
use std::path::{Path, PathBuf};

const RUNTIME_DIR: &str = "runtime";
const MAILBOX_DIR: &str = "mailbox";
const RECORD_DIR: &str = "record";
const SNAPSHOT_FILE: &str = "snapshot.json";
const BODIES_DIR: &str = "bodies";
const BODY_SUFFIX: &str = ".body";
/// The holder-lock registry row the record takes.
const LOCK_NAME: &str = "mailbox";
/// The registry's template parameter for the `.fgos` directory.
const FGOS_DIR_PARAM: &str = "fgosDir";

/// The mailbox's paths under one `.fgos` directory, which the caller
/// resolves; the store never looks for it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Paths {
    fgos_dir: PathBuf,
}

impl Paths {
    pub fn new(fgos_dir: impl Into<PathBuf>) -> Self {
        Self {
            fgos_dir: fgos_dir.into(),
        }
    }

    pub fn fgos_dir(&self) -> &Path {
        &self.fgos_dir
    }

    /// For files written without the mailbox lock; never swept.
    pub fn mailbox_dir(&self) -> PathBuf {
        self.fgos_dir.join(RUNTIME_DIR).join(MAILBOX_DIR)
    }

    /// Written only by a holder of the mailbox lock.
    pub fn record_dir(&self) -> PathBuf {
        self.mailbox_dir().join(RECORD_DIR)
    }

    pub fn snapshot(&self) -> PathBuf {
        self.record_dir().join(SNAPSHOT_FILE)
    }

    pub fn bodies_dir(&self) -> PathBuf {
        self.record_dir().join(BODIES_DIR)
    }

    /// The body file of `id`; `None` for an id that is not lowercase hex,
    /// so no id can name a path outside `bodies/`.
    pub fn body(&self, id: &MessageId) -> Option<PathBuf> {
        Self::body_name(id).map(|name| self.bodies_dir().join(name))
    }

    /// The registry name of the lock every mutation takes.
    pub const fn lock_name() -> &'static str {
        LOCK_NAME
    }

    /// The parameters that fill the lock row's path template; `None` when
    /// the `.fgos` directory is not valid UTF-8 and so cannot fill it.
    pub fn lock_params(&self) -> Option<BTreeMap<String, String>> {
        let fgos_dir = self.fgos_dir.to_str()?;
        Some(BTreeMap::from([(
            FGOS_DIR_PARAM.to_string(),
            fgos_dir.to_string(),
        )]))
    }

    /// Whether `name`, an entry of the record directory, is one the record
    /// keeps there itself: the snapshot or the bodies directory.
    pub fn is_known(&self, name: &OsStr) -> bool {
        name == SNAPSHOT_FILE || name == BODIES_DIR
    }

    /// The directories the record creates, parents first.
    pub(crate) fn owned_dirs(&self) -> [PathBuf; 3] {
        [self.mailbox_dir(), self.record_dir(), self.bodies_dir()]
    }

    /// The snapshot's file name inside [`Paths::record_dir`].
    pub(crate) const fn snapshot_name() -> &'static str {
        SNAPSHOT_FILE
    }

    /// The body's file name inside [`Paths::bodies_dir`].
    pub(crate) fn body_name(id: &MessageId) -> Option<String> {
        let id = id.as_str();
        let hex = !id.is_empty()
            && id
                .chars()
                .all(|c| c.is_ascii_digit() || ('a'..='f').contains(&c));
        hex.then(|| format!("{id}{BODY_SUFFIX}"))
    }
}
