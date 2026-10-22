//! The operating-system calls the record needs that the standard library
//! does not offer. Nothing else in the crate uses `unsafe`.
//!
//! Copies of these calls live in other crates too; item `tsk-1lx` (one
//! shared leaf for euid and dirfd syscalls) moves them into one low layer.
//! Until it lands, this module is the mailbox's only `unsafe`.
#![allow(unsafe_code)]

/// The effective user id of this process.
pub(crate) fn current_uid() -> u32 {
    // SAFETY: geteuid takes no arguments, cannot fail and touches no memory.
    unsafe { libc::geteuid() }
}

/// Deletes `name` inside the directory `dir`. `unlinkat` without flags
/// never follows a symlink (it removes the link itself) and refuses a
/// directory. `Ok(false)` when the name is already gone.
pub(crate) fn unlink_at(dir: &std::fs::File, name: &std::ffi::OsStr) -> std::io::Result<bool> {
    use std::io;
    use std::os::fd::AsRawFd;
    use std::os::unix::ffi::OsStrExt;
    let name = std::ffi::CString::new(name.as_bytes())
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidInput, e))?;
    // SAFETY: `dir` is an open descriptor and `name` a NUL-terminated
    // string that outlives the call.
    if unsafe { libc::unlinkat(dir.as_raw_fd(), name.as_ptr(), 0) } == 0 {
        return Ok(true);
    }
    match io::Error::last_os_error() {
        e if e.kind() == io::ErrorKind::NotFound => Ok(false),
        e => Err(e),
    }
}
