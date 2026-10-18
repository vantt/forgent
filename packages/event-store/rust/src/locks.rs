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
            "locks must be an existing 0700 directory; run setup fix",
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
