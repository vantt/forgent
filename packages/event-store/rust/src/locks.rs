//! Rust-owned registry paths and in-process append exclusion.
use crate::{
    errors::{Error, ErrorCode},
    fsio::FileSystem,
    layout::Layout,
};
use fgos_holder_lock::{Acquire, Handle, Mode, Resource, Wait, DEFAULT_KILL_WAIT_MS};
use std::{fs, path::PathBuf};
pub const APPEND_NAME: &str = "event-append";
pub const SEAL_NAME: &str = "event-seal";
pub const APPEND_RANK: u32 = 70;
pub const SEAL_RANK: u32 = 58;
pub const APPEND_WAIT_MS: u64 = 5000;
pub fn lock_path(layout: &Layout, seal: bool) -> PathBuf {
    if seal {
        layout.seal_lock()
    } else {
        layout.append_lock()
    }
}
pub struct AppendGuard {
    _handle: Handle,
    pub guarantee: fgos_holder_lock::Guarantee,
}
pub fn acquire_append(
    layout: &Layout,
    held_ranks: &[u32],
    fs: &dyn FileSystem,
) -> Result<AppendGuard, Error> {
    if held_ranks.iter().any(|rank| *rank >= APPEND_RANK) {
        return Err(Error::new(
            ErrorCode::LockOrderViolation,
            "event-append requires all held ranks below 70",
        ));
    }
    let guarantee = validate_directory(layout, fs)?;
    match fgos_holder_lock::acquire(
        &Resource::new(APPEND_NAME, lock_path(layout, false)),
        Mode::Ex,
        Wait::Ms(APPEND_WAIT_MS),
        DEFAULT_KILL_WAIT_MS,
    ) {
        Acquire::Acquired(handle) => Ok(AppendGuard {
            _handle: handle,
            guarantee,
        }),
        Acquire::Held { .. } | Acquire::Timeout { .. } => Err(Error::new(
            ErrorCode::EventStoreLockTimeout,
            "event-append wait exhausted or predecessor not empty",
        )),
        Acquire::Unavailable { reason, detail } => Err(Error::new(
            ErrorCode::EventStoreIo,
            format!("{}: {detail}", reason.as_str()),
        )),
    }
}

/// Owns the event-seal description for rotation and Publication borrowing.
pub struct SealGuard {
    pub(crate) handle: Handle,
    path: PathBuf,
}
impl SealGuard {
    pub(crate) fn validate(&self, layout: &Layout) -> Result<(), Error> {
        if self.path != layout.seal_lock() {
            return Err(Error::new(
                ErrorCode::LockOrderViolation,
                "seal guard belongs to another store",
            ));
        }
        fgos_holder_lock::validate(&self.handle)
            .map_err(|e| Error::new(ErrorCode::EventStoreIo, e.to_string()))
    }
}
pub fn acquire_seal(
    layout: &Layout,
    held_ranks: &[u32],
    hot_lock_depth: u32,
    opportunistic: bool,
) -> Result<Option<SealGuard>, Error> {
    validate_seal_context(held_ranks, hot_lock_depth)?;
    validate_directory(layout, &crate::fsio::OsFileSystem)?;
    match fgos_holder_lock::acquire(
        &Resource::new(SEAL_NAME, layout.seal_lock()),
        Mode::Ex,
        if opportunistic {
            Wait::Try
        } else {
            Wait::Ms(APPEND_WAIT_MS)
        },
        DEFAULT_KILL_WAIT_MS,
    ) {
        Acquire::Acquired(handle) => Ok(Some(SealGuard {
            handle,
            path: layout.seal_lock(),
        })),
        Acquire::Held { .. } | Acquire::Timeout { .. } if opportunistic => Ok(None),
        Acquire::Held { .. } | Acquire::Timeout { .. } => Err(Error::new(
            ErrorCode::EventStoreLockTimeout,
            "event-seal wait exhausted",
        )),
        Acquire::Unavailable { reason, detail } => Err(Error::new(
            ErrorCode::EventStoreIo,
            format!("{}: {detail}", reason.as_str()),
        )),
    }
}

fn validate_directory(
    layout: &Layout,
    fs: &dyn FileSystem,
) -> Result<fgos_holder_lock::Guarantee, Error> {
    let dir = layout.root.join("locks");
    let valid = fs::symlink_metadata(&dir).is_ok_and(|meta| {
        if !meta.is_dir() || meta.file_type().is_symlink() {
            return false;
        }
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            meta.permissions().mode() & 0o777 == 0o700
        }
        #[cfg(not(unix))]
        {
            false
        }
    });
    if !valid {
        return Err(Error::new(
            ErrorCode::EventStoreLockDirInvalid,
            format!(
                "{} must be an existing 0700 directory; run fgos setup",
                dir.display()
            ),
        ));
    }
    let guarantee = fs.guarantee(&dir);
    if guarantee.exclusion == fgos_holder_lock::Level::None {
        return Err(Error::new(
            ErrorCode::EventStoreUnsupportedFilesystem,
            "holder-lock guarantee is none",
        ));
    }
    if !guarantee.usable() {
        return Err(Error::new(
            ErrorCode::EventStoreUnsupportedPlatform,
            "holder-lock unavailable",
        ));
    }
    Ok(guarantee)
}

pub fn validate_seal_context(held_ranks: &[u32], hot_lock_depth: u32) -> Result<(), Error> {
    if hot_lock_depth > 0 || held_ranks.contains(&60) {
        return Err(Error::new(
            ErrorCode::EventStoreSealUnderState,
            "seal must run outside state",
        ));
    }
    if held_ranks.iter().any(|r| *r >= SEAL_RANK) {
        return Err(Error::new(
            ErrorCode::LockOrderViolation,
            "event-seal requires held ranks below 58",
        ));
    }
    Ok(())
}
