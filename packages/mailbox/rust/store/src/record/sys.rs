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

/// The entries of the directory `dir` (without `.` and `..`), each with
/// whether it is a regular file, judged without following a symlink. The
/// listing goes through the descriptor, so a directory swapped at the path
/// after `dir` was opened is never listed.
pub(crate) fn list_at(dir: &std::fs::File) -> std::io::Result<Vec<(std::ffi::OsString, bool)>> {
    use std::ffi::{CStr, OsStr};
    use std::io;
    use std::os::fd::AsRawFd;
    use std::os::unix::ffi::OsStrExt;
    // SAFETY: duplicates a descriptor this function borrows; the copy is
    // handed to fdopendir, which owns it from then on.
    let copy = unsafe { libc::dup(dir.as_raw_fd()) };
    if copy < 0 {
        return Err(io::Error::last_os_error());
    }
    // SAFETY: `copy` is an open directory descriptor owned by nobody else.
    let stream = unsafe { libc::fdopendir(copy) };
    if stream.is_null() {
        let error = io::Error::last_os_error();
        // SAFETY: fdopendir failed, so `copy` is still ours to close.
        unsafe { libc::close(copy) };
        return Err(error);
    }
    // SAFETY: `stream` is a valid directory stream; the copy shares the
    // original's offset, so start from the first entry.
    unsafe { libc::rewinddir(stream) };
    let mut entries = Vec::new();
    let result = loop {
        clear_errno();
        // SAFETY: `stream` is valid until closedir below.
        let entry = unsafe { libc::readdir(stream) };
        if entry.is_null() {
            let error = io::Error::last_os_error();
            break match error.raw_os_error() {
                Some(0) | None => Ok(()),
                Some(_) => Err(error),
            };
        }
        // SAFETY: readdir returned a valid entry whose name is a
        // NUL-terminated string, valid until the next readdir.
        let name = unsafe { CStr::from_ptr((*entry).d_name.as_ptr()) };
        let bytes = name.to_bytes();
        if bytes == b"." || bytes == b".." {
            continue;
        }
        let mut stat = std::mem::MaybeUninit::<libc::stat>::uninit();
        // SAFETY: `dir` is an open descriptor, `name` NUL-terminated, and
        // `stat` writable memory of the size fstatat fills.
        let found = unsafe {
            libc::fstatat(
                dir.as_raw_fd(),
                name.as_ptr(),
                stat.as_mut_ptr(),
                libc::AT_SYMLINK_NOFOLLOW,
            )
        };
        let regular = if found == 0 {
            // SAFETY: fstatat returned 0, so it filled `stat`.
            let mode = unsafe { stat.assume_init() }.st_mode;
            mode & libc::S_IFMT == libc::S_IFREG
        } else {
            false
        };
        entries.push((OsStr::from_bytes(bytes).to_os_string(), regular));
    };
    // SAFETY: closes the stream and the copied descriptor it owns.
    unsafe { libc::closedir(stream) };
    result.map(|()| entries)
}

/// Sets errno to 0, so a null readdir can tell the end from an error.
fn clear_errno() {
    // SAFETY: the calling thread's errno location is always valid.
    #[cfg(any(target_os = "linux", target_os = "android"))]
    unsafe {
        *libc::__errno_location() = 0;
    }
    // SAFETY: as above.
    #[cfg(any(target_os = "macos", target_os = "ios", target_os = "freebsd"))]
    unsafe {
        *libc::__error() = 0;
    }
}
