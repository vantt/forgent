//! Rust-owned registry paths and in-process append exclusion.
use crate::{
    errors::{Error, ErrorCode},
    fsio::FileSystem,
    layout::Layout,
};
use fgos_holder_lock::{Acquire, Handle, Mode, Resource, Wait, DEFAULT_KILL_WAIT_MS};
use std::{
    fs,
    path::{Path, PathBuf},
};
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

/// The one rule for a lock directory: a real directory (never a link) with mode 0700. Where modes do not exist
/// nothing can be shown to be private, so it never holds.
fn is_private_directory(meta: &fs::Metadata) -> bool {
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
}

fn validate_directory(
    layout: &Layout,
    fs: &dyn FileSystem,
) -> Result<fgos_holder_lock::Guarantee, Error> {
    let dir = layout.root.join("locks");
    let valid = fs::symlink_metadata(&dir).is_ok_and(|meta| is_private_directory(&meta));
    if !valid {
        return Err(Error::new(
            ErrorCode::EventStoreLockDirInvalid,
            format!(
                "{} must be an existing 0700 directory; run fgos doctor --fix (event-store-lock-dirs)",
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

fn unsafe_directory(path: &Path) -> Error {
    Error::new(
        ErrorCode::EventStoreLockDirInvalid,
        format!("unsafe directory: {}", path.display()),
    )
}

fn io_failure(error: std::io::Error) -> Error {
    Error::new(ErrorCode::EventStoreIo, error.to_string())
}

/// `path` and every parent are real directories (created 0700 when absent), never a link.
fn real_directory(path: &Path) -> Result<(), Error> {
    if let Some(parent) = path.parent() {
        if parent != path && !parent.as_os_str().is_empty() {
            real_directory(parent)?;
        }
    }
    #[cfg_attr(not(unix), allow(unused_mut))]
    let mut builder = fs::DirBuilder::new();
    #[cfg(unix)]
    {
        use std::os::unix::fs::DirBuilderExt;
        builder.mode(0o700);
    }
    match builder.create(path) {
        Err(error) if error.kind() != std::io::ErrorKind::AlreadyExists => {
            return Err(io_failure(error))
        }
        _ => {}
    }
    let meta = fs::symlink_metadata(path).map_err(io_failure)?;
    if !meta.is_dir() || meta.file_type().is_symlink() {
        return Err(unsafe_directory(path));
    }
    Ok(())
}

/// Makes the directories `validate_directory` requires: the open root, its parent and its `locks` directory are real
/// 0700 directories (Git's WAL refuses a group- or world-writable parent in the Git common dir). A link is refused,
/// never followed. Returns whether any of them was created or held another mode.
pub fn prepare_directories(open_root: &Path) -> Result<bool, Error> {
    let dirs = [
        open_root.parent().unwrap_or(open_root).to_path_buf(),
        open_root.to_path_buf(),
        open_root.join("locks"),
    ];
    let mut changed = false;
    for dir in &dirs {
        match fs::symlink_metadata(dir) {
            Ok(meta) => changed = changed || !is_private_directory(&meta),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => changed = true,
            Err(error) => return Err(io_failure(error)),
        }
    }
    real_directory(&dirs[2])?;
    #[cfg(unix)]
    for dir in &dirs {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(dir, fs::Permissions::from_mode(0o700)).map_err(io_failure)?;
    }
    Ok(changed)
}

#[cfg(test)]
mod prepare_tests {
    use super::*;

    fn scratch(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "fgos-event-store-locks-{name}-{}",
            std::process::id()
        ));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn the_directories_are_made_then_left_alone_and_a_loose_mode_is_repaired() {
        let git = scratch("dirs");
        let open_root = git.join("fgos/events");
        assert!(prepare_directories(&open_root).unwrap());
        assert!(!prepare_directories(&open_root).unwrap());
        let locks = open_root.join("locks");
        assert!(is_private_directory(&fs::symlink_metadata(&locks).unwrap()));
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&locks, fs::Permissions::from_mode(0o755)).unwrap();
            assert!(!is_private_directory(
                &fs::symlink_metadata(&locks).unwrap()
            ));
            assert!(prepare_directories(&open_root).unwrap());
            assert!(is_private_directory(&fs::symlink_metadata(&locks).unwrap()));
        }
    }

    #[cfg(unix)]
    #[test]
    fn a_symlinked_locks_directory_is_refused_not_followed() {
        let git = scratch("link");
        let open_root = git.join("fgos/events");
        fs::create_dir_all(&open_root).unwrap();
        let elsewhere = git.join("elsewhere");
        fs::create_dir_all(&elsewhere).unwrap();
        std::os::unix::fs::symlink(&elsewhere, open_root.join("locks")).unwrap();
        let error = prepare_directories(&open_root).unwrap_err();
        assert_eq!(error.code, ErrorCode::EventStoreLockDirInvalid);
        assert!(
            error.detail.starts_with("unsafe directory:"),
            "{}",
            error.detail
        );
    }
}
