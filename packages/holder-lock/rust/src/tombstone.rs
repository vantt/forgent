//! Durable legacy-file fence. The caller must retain the legacy kernel hold
//! and the replacement lock throughout placement and activation publication.
use crate::{validate, Handle};
use std::fs;
#[cfg(target_os = "linux")]
use std::fs::{File, OpenOptions};
use std::io;
#[cfg(target_os = "linux")]
use std::io::Write;
use std::path::Path;

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
    // Exchange a prepared directory with the held file atomically. An old
    // contender sees the held inode or EISDIR, never an unlink/mkdir gap.
    #[cfg(target_os = "linux")]
    {
        use std::os::unix::ffi::OsStrExt;
        let parent = path
            .parent()
            .ok_or_else(|| io::Error::other("missing fence parent"))?;
        let temporary = parent.join(format!(
            ".activation-fence-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map_err(io::Error::other)?
                .as_nanos()
        ));
        fs::create_dir(&temporary)?;
        let mut file = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(temporary.join("TOMBSTONE"))?;
        writeln!(file, "{}", serde_json::json!({"lock":lock,"at":at,"by":by}))?;
        file.sync_all()?;
        File::open(&temporary)?.sync_all()?;
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
            let _ = fs::remove_dir_all(&temporary);
            return Err(error);
        }
        File::open(parent)?.sync_all()?;
        fs::remove_file(temporary)?;
        File::open(parent)?.sync_all()
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = at;
        Err(io::Error::new(
            io::ErrorKind::Unsupported,
            "atomic legacy lock fencing is unavailable on this platform",
        ))
    }
}
