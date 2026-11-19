//! The door for files the agent may have written: a link is never followed, a pipe never blocks the open, anything
//! that is not a regular file is refused, and the read is bounded. Also the one symlink-refusal rule.

use super::error::CleanupError;
use std::fs::{self, File, Metadata};
use std::io::Read;
use std::path::Path;

/// Opens `path` for reading without following a link or blocking on a pipe; the file is a regular one or the call
/// is `ENOTREGULAR`. The open's own error (a link is `ELOOP`, a missing file `ENOENT`) otherwise.
pub fn open_agent_file(path: &Path) -> Result<(File, Metadata), CleanupError> {
    let mut options = fs::OpenOptions::new();
    options.read(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK);
    }
    #[cfg(not(unix))]
    if fs::symlink_metadata(path).is_ok_and(|m| m.file_type().is_symlink()) {
        return Err(CleanupError::coded(
            "ELOOP",
            format!(
                "ELOOP: too many symbolic links encountered, open '{}'",
                path.display()
            ),
        ));
    }
    let file = options
        .open(path)
        .map_err(|err| CleanupError::io(&err, "open", path))?;
    let meta = file.metadata()?;
    if !meta.is_file() {
        return Err(CleanupError::coded(
            "ENOTREGULAR",
            format!("not a regular file: {}", path.display()),
        ));
    }
    Ok((file, meta))
}

/// All bytes of an agent-written file, at most `max_bytes`; `E2BIG` past the cap.
pub fn read_agent_file(path: &Path, max_bytes: u64) -> Result<Vec<u8>, CleanupError> {
    let (file, meta) = open_agent_file(path)?;
    if meta.len() > max_bytes {
        return Err(CleanupError::coded(
            "E2BIG",
            format!("file larger than {max_bytes} bytes: {}", path.display()),
        ));
    }
    let mut bytes = Vec::with_capacity(meta.len() as usize);
    file.take(max_bytes).read_to_end(&mut bytes)?;
    Ok(bytes)
}

/// `lstat` the path and refuse a symbolic link by name, never follow it. A missing path is the `lstat` error, or
/// `Ok(None)` when `optional`.
pub fn refuse_symlink(
    path: &Path,
    context: &str,
    optional: bool,
) -> Result<Option<Metadata>, CleanupError> {
    match fs::symlink_metadata(path) {
        Ok(meta) if meta.file_type().is_symlink() => Err(CleanupError::new(format!(
            "Symlink refused in {context}: {}",
            path.display()
        ))),
        Ok(meta) => Ok(Some(meta)),
        Err(err) if optional && err.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(err) => Err(CleanupError::io(&err, "lstat", path)),
    }
}
