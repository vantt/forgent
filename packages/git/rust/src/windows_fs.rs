//! The Windows file primitives every component shares: open a directory or a
//! plain file as itself (never what a link at the leaf points to) and read the
//! path an open handle really names.

use std::ffi::OsString;
use std::fs::{File, Metadata, OpenOptions};
use std::io;
use std::os::windows::ffi::OsStringExt;
use std::os::windows::fs::{MetadataExt, OpenOptionsExt};
use std::os::windows::io::AsRawHandle;
use std::path::{Path, PathBuf};
use windows_sys::Win32::Foundation::HANDLE;
use windows_sys::Win32::Storage::FileSystem::{
    GetFinalPathNameByHandleW, FILE_ATTRIBUTE_REPARSE_POINT, FILE_FLAG_BACKUP_SEMANTICS,
    FILE_FLAG_OPEN_REPARSE_POINT, FILE_NAME_NORMALIZED, FILE_SHARE_DELETE, FILE_SHARE_READ,
    FILE_SHARE_WRITE, VOLUME_NAME_DOS,
};

/// The share mode every opener gets unless it asks for less.
pub(crate) const SHARE_ALL: u32 = FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE;
/// Share mode that leaves out `FILE_SHARE_DELETE`: while the handle lives the
/// object cannot be renamed or deleted.
pub(crate) const SHARE_NO_DELETE: u32 = FILE_SHARE_READ | FILE_SHARE_WRITE;

/// Why `open_directory` refused.
pub(crate) enum DirectoryRefusal {
    /// The open or the metadata read failed.
    Io(io::Error),
    /// The handle is a reparse point or not a directory.
    NotDirectory,
}

impl From<DirectoryRefusal> for io::Error {
    fn from(refusal: DirectoryRefusal) -> Self {
        match refusal {
            DirectoryRefusal::Io(error) => error,
            DirectoryRefusal::NotDirectory => io::Error::new(
                io::ErrorKind::PermissionDenied,
                "refused: not a directory (link or reparse point)",
            ),
        }
    }
}

/// Opens a directory without following a reparse point at the leaf, with the
/// given share mode, and refuses a handle that is one or is not a directory.
pub(crate) fn open_directory(path: &Path, share: u32) -> Result<File, DirectoryRefusal> {
    let file = OpenOptions::new()
        .read(true)
        .share_mode(share)
        .custom_flags(FILE_FLAG_BACKUP_SEMANTICS | FILE_FLAG_OPEN_REPARSE_POINT)
        .open(path)
        .map_err(DirectoryRefusal::Io)?;
    let metadata = file.metadata().map_err(DirectoryRefusal::Io)?;
    if !metadata.is_dir() || metadata.file_attributes() & FILE_ATTRIBUTE_REPARSE_POINT != 0 {
        return Err(DirectoryRefusal::NotDirectory);
    }
    Ok(file)
}

/// Opens `path` for reading as itself: a reparse point at the leaf is opened,
/// never followed. Callers check the handle with `is_plain_file`.
pub(crate) fn open_no_follow(path: &Path) -> io::Result<File> {
    OpenOptions::new()
        .read(true)
        .custom_flags(FILE_FLAG_OPEN_REPARSE_POINT)
        .open(path)
}

/// Whether the metadata is a regular file and not a reparse point.
pub(crate) fn is_plain_file(metadata: &Metadata) -> bool {
    metadata.is_file() && metadata.file_attributes() & FILE_ATTRIBUTE_REPARSE_POINT == 0
}

/// The normalized DOS path an open handle names.
pub(crate) fn final_path(file: &File) -> io::Result<PathBuf> {
    let mut buffer = vec![0u16; 512];
    loop {
        // SAFETY: the pointer and length describe `buffer`; the handle is open for the call.
        let n = unsafe {
            GetFinalPathNameByHandleW(
                file.as_raw_handle() as HANDLE,
                buffer.as_mut_ptr(),
                buffer.len() as u32,
                FILE_NAME_NORMALIZED | VOLUME_NAME_DOS,
            )
        } as usize;
        if n == 0 {
            return Err(io::Error::last_os_error());
        }
        if n >= buffer.len() {
            buffer.resize(n + 1, 0);
            continue;
        }
        return Ok(PathBuf::from(OsString::from_wide(&buffer[..n])));
    }
}
