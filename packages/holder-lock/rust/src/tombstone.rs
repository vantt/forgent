//! Durable legacy-file fence. The caller must retain the legacy kernel hold
//! and the replacement lock throughout placement and activation publication.
use crate::{validate, Handle};
use std::fs;
#[cfg(target_os = "linux")]
use std::fs::File;
#[cfg(any(target_os = "linux", windows))]
use std::fs::OpenOptions;
use std::io;
#[cfg(any(target_os = "linux", windows))]
use std::io::Write;
use std::path::{Path, PathBuf};

/// The error text, up to its first colon, of a placement that lost the race
/// to an old contender on Windows (nothing was published; retry later).
pub const FENCE_CONTENDED: &str = "legacy-fence-contended";

pub fn is_tombstone(path: &Path, lock: &str, by: &str) -> bool {
    let read = || -> Option<bool> {
        if !fs::symlink_metadata(path).ok()?.file_type().is_dir() {
            return Some(false);
        }
        let record = path.join("TOMBSTONE");
        if !fs::symlink_metadata(&record).ok()?.file_type().is_file() {
            return Some(false);
        }
        let v: serde_json::Value = serde_json::from_slice(&fs::read(record).ok()?).ok()?;
        Some(v["lock"] == lock && v["by"] == by && v["at"].is_string())
    };
    read() == Some(true)
}

pub fn replace_held_file(handle: &Handle, lock: &str, by: &str, at: &str) -> io::Result<()> {
    validate(handle).map_err(|e| io::Error::other(format!("tombstone authority: {e}")))?;
    let path = handle.path();
    if is_tombstone(path, lock, by) {
        return Ok(());
    }
    let metadata = fs::symlink_metadata(path)?;
    if !metadata.file_type().is_file() {
        return Err(io::Error::other("tombstone requires a regular held file"));
    }
    let parent = path
        .parent()
        .ok_or_else(|| io::Error::other("missing fence parent"))?;
    let temporary = prepare_tombstone_dir(parent, lock, by, at)?;
    place(path, parent, &temporary)
}

/// A sibling directory holding the flushed TOMBSTONE record, ready to be
/// published at the legacy path.
#[cfg(any(target_os = "linux", windows))]
fn prepare_tombstone_dir(parent: &Path, lock: &str, by: &str, at: &str) -> io::Result<PathBuf> {
    let temporary = parent.join(format!(
        ".activation-fence-{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(io::Error::other)?
            .as_nanos()
    ));
    fs::create_dir(&temporary)?;
    let written = (|| {
        let mut file = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(temporary.join("TOMBSTONE"))?;
        writeln!(file, "{}", serde_json::json!({"lock":lock,"at":at,"by":by}))?;
        file.sync_all()?;
        #[cfg(target_os = "linux")]
        File::open(&temporary)?.sync_all()?;
        Ok(())
    })();
    if let Err(error) = written {
        let _ = fs::remove_dir_all(&temporary);
        return Err(error);
    }
    Ok(temporary)
}

/// Linux: exchange the prepared directory with the held file atomically. An
/// old contender sees the held inode or EISDIR, never an unlink/mkdir gap.
#[cfg(target_os = "linux")]
fn place(path: &Path, parent: &Path, temporary: &Path) -> io::Result<()> {
    use std::os::unix::ffi::OsStrExt;
    let old = std::ffi::CString::new(path.as_os_str().as_bytes())?;
    let new = std::ffi::CString::new(temporary.as_os_str().as_bytes())?;
    // SAFETY: both C paths remain alive; flags request an atomic exchange.
    let exchanged = unsafe {
        libc::renameat2(
            libc::AT_FDCWD,
            old.as_ptr(),
            libc::AT_FDCWD,
            new.as_ptr(),
            libc::RENAME_EXCHANGE,
        )
    };
    if exchanged != 0 {
        let error = io::Error::last_os_error();
        let _ = fs::remove_dir_all(temporary);
        return Err(error);
    }
    File::open(parent)?.sync_all()?;
    fs::remove_file(temporary)?;
    File::open(parent)?.sync_all()
}

/// Windows: Win32 cannot replace a file with a directory atomically, so
/// placement is two renames that fail closed. The held file moves aside
/// while its lock stays held (the lock file is opened with
/// `FILE_SHARE_DELETE`, and the handle keeps its lock across the rename);
/// then the prepared directory is renamed onto the original path without
/// replace-existing. In the gap an old contender either creates a file at
/// the path, and then the second rename fails and placement refuses with
/// `legacy-fence-contended` (the contender won, nothing was published, the
/// caller retries later; its file is never deleted), or it arrives after
/// the second rename and finds a directory. A contender already blocked on
/// the held file stands where it does on Linux after the exchange: it holds
/// the moved file, and its relock-on-replace check finds a directory at the
/// path.
#[cfg(windows)]
fn place(path: &Path, parent: &Path, temporary: &Path) -> io::Result<()> {
    place_with_gap(path, parent, temporary, || ())
}

#[cfg(windows)]
fn place_with_gap(
    path: &Path,
    parent: &Path,
    temporary: &Path,
    gap: impl FnOnce(),
) -> io::Result<()> {
    let aside = parent.join(format!(
        ".activation-fence-aside-{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(io::Error::other)?
            .as_nanos()
    ));
    if let Err(error) = move_no_replace(path, &aside) {
        let _ = fs::remove_dir_all(temporary);
        return Err(error);
    }
    gap();
    if let Err(error) = move_no_replace(temporary, path) {
        if error.raw_os_error() == Some(windows_sys::Win32::Foundation::ERROR_ALREADY_EXISTS as i32)
        {
            // The aside file and the prepared directory stay for cleanup.
            return Err(io::Error::new(
                io::ErrorKind::AlreadyExists,
                format!("{FENCE_CONTENDED}: an old contender created {} while the held file was moved aside; nothing was published", path.display()),
            ));
        }
        // Not a contention: put the held file back if the path is still free.
        let _ = move_no_replace(&aside, path);
        let _ = fs::remove_dir_all(temporary);
        return Err(error);
    }
    // The held file is still open and locked; deletion completes when it closes.
    let _ = fs::remove_file(&aside);
    Ok(())
}

/// `MoveFileExW` without `MOVEFILE_REPLACE_EXISTING`, written through.
#[cfg(windows)]
fn move_no_replace(from: &Path, to: &Path) -> io::Result<()> {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::{MoveFileExW, MOVEFILE_WRITE_THROUGH};
    let wide = |p: &Path| -> Vec<u16> { p.as_os_str().encode_wide().chain(Some(0)).collect() };
    let (from, to) = (wide(from), wide(to));
    // SAFETY: both buffers are NUL-terminated and outlive the call.
    if unsafe { MoveFileExW(from.as_ptr(), to.as_ptr(), MOVEFILE_WRITE_THROUGH) } == 0 {
        return Err(io::Error::last_os_error());
    }
    Ok(())
}

#[cfg(not(any(target_os = "linux", windows)))]
fn prepare_tombstone_dir(_: &Path, _: &str, _: &str, _: &str) -> io::Result<PathBuf> {
    Err(io::Error::new(
        io::ErrorKind::Unsupported,
        "atomic legacy lock fencing is unavailable on this platform",
    ))
}

#[cfg(not(any(target_os = "linux", windows)))]
fn place(_path: &Path, _parent: &Path, _temporary: &Path) -> io::Result<()> {
    Err(io::Error::new(
        io::ErrorKind::Unsupported,
        "atomic legacy lock fencing is unavailable on this platform",
    ))
}

#[cfg(all(test, windows))]
mod windows_tests {
    use super::*;
    use crate::{acquire, Acquire, Mode, Resource, Wait};

    fn scratch(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "fgos-tombstone-{tag}-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn a_held_legacy_file_becomes_a_tombstone_directory_no_old_contender_can_open() {
        let dir = scratch("placed");
        let old = dir.join("activation.lock");
        let handle = match acquire(
            &Resource::new("activation", &old),
            Mode::Ex,
            Wait::Try,
            2000,
        ) {
            Acquire::Acquired(h) => h,
            other => panic!("{other:?}"),
        };
        replace_held_file(&handle, "activation", "fgos git", "2026-10-18T00:00:00Z").unwrap();
        assert!(is_tombstone(&old, "activation", "fgos git"));
        assert!(fs::OpenOptions::new()
            .read(true)
            .write(true)
            .open(&old)
            .is_err());
        drop(handle);
        assert!(is_tombstone(&old, "activation", "fgos git"));
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn an_old_contender_that_creates_the_path_in_the_gap_wins_and_placement_refuses() {
        let dir = scratch("lost-race");
        let old = dir.join("activation.lock");
        fs::write(&old, b"held").unwrap();
        let temporary = prepare_tombstone_dir(&dir, "activation", "fgos git", "t").unwrap();
        let error = place_with_gap(&old, &dir, &temporary, || {
            fs::write(&old, b"contender").unwrap();
        })
        .unwrap_err();
        assert!(error.to_string().starts_with(FENCE_CONTENDED));
        assert_eq!(fs::read(&old).unwrap(), b"contender");
        assert!(!is_tombstone(&old, "activation", "fgos git"));
        fs::remove_dir_all(dir).unwrap();
    }
}
