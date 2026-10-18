//! Windows: `LockFileEx` on byte 0, length 1, taken in the locking process.
//!
//! The kernel drops the lock when the owning process dies (measured: released
//! 0.1 ms after `TerminateProcess`). A lock is owned by the process and the
//! handle that took it, so it is never shared through an inherited or
//! duplicated handle: borrowing runs through a job instead (`prepare_borrow`
//! and `end_leftovers` land with the job driver). Win32 has no API that lists
//! byte-range lock holders, so `holders` is unlistable.

use std::fs::File;
use std::io;
use std::os::windows::ffi::OsStringExt;
use std::os::windows::io::AsRawHandle;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Duration;

use windows_sys::Win32::Foundation::{CloseHandle, ERROR_LOCK_VIOLATION, HANDLE, INVALID_HANDLE_VALUE};
use windows_sys::Win32::Storage::FileSystem::{
    CreateFileW, FileIdInfo, FileRemoteProtocolInfo, GetDriveTypeW, GetFileInformationByHandleEx, GetFinalPathNameByHandleW, GetVolumePathNameW, LockFileEx, UnlockFileEx, FILE_ATTRIBUTE_NORMAL,
    FILE_ID_INFO, FILE_REMOTE_PROTOCOL_INFO, FILE_SHARE_DELETE, FILE_SHARE_READ, FILE_SHARE_WRITE, LOCKFILE_EXCLUSIVE_LOCK, LOCKFILE_FAIL_IMMEDIATELY, OPEN_EXISTING, VOLUME_NAME_DOS,
};
use windows_sys::Win32::System::IO::OVERLAPPED;

use super::{Leftovers, LockDriver, TryLock};
use crate::port::{Guarantee, HoldersList, Level, Mode};

/// The Windows lock driver.
pub struct LockFileExDriver;

const DRIVER: &str = "lockfileex";

/// `GetDriveTypeW` result for a network volume (winbase.h `DRIVE_REMOTE`).
const DRIVE_REMOTE: u32 = 4;

fn local() -> Guarantee {
    Guarantee {
        driver: DRIVER,
        exclusion: Level::Kernel,
        borrow: Level::JobScoped,
        holders: Level::Unsupported,
        platform: "windows",
        notes: vec!["holders are not listable on Windows".to_string()],
    }
}

fn remote(detail: &str) -> Guarantee {
    Guarantee {
        driver: DRIVER,
        exclusion: Level::None,
        borrow: Level::None,
        holders: Level::None,
        platform: "windows",
        notes: vec![format!("remote volume ({detail}): LockFileEx gives no kernel exclusion here; the lock is refused")],
    }
}

fn wide(path: &Path) -> Vec<u16> {
    use std::os::windows::ffi::OsStrExt;
    path.as_os_str().encode_wide().chain(std::iter::once(0)).collect()
}

fn handle_of(file: &File) -> HANDLE {
    file.as_raw_handle() as HANDLE
}

/// Is the volume that holds `path` a remote one (`GetDriveTypeW`)?
fn volume_is_remote(path: &Path) -> io::Result<bool> {
    let path = wide(path);
    let mut volume = vec![0u16; 1024];
    // SAFETY: path is NUL terminated; volume is writable for its stated length.
    if unsafe { GetVolumePathNameW(path.as_ptr(), volume.as_mut_ptr(), volume.len() as u32) } == 0 {
        return Err(io::Error::last_os_error());
    }
    // SAFETY: GetVolumePathNameW wrote a NUL terminated root path.
    Ok(unsafe { GetDriveTypeW(volume.as_ptr()) } == DRIVE_REMOTE)
}

/// Whether the filesystem of an open file reports remote protocol info.
fn file_is_remote(file: &File) -> bool {
    // SAFETY: the struct is plain data and the size passed is its own.
    let mut info: FILE_REMOTE_PROTOCOL_INFO = unsafe { std::mem::zeroed() };
    let ok = unsafe {
        GetFileInformationByHandleEx(handle_of(file), FileRemoteProtocolInfo, (&mut info as *mut FILE_REMOTE_PROTOCOL_INFO).cast(), std::mem::size_of::<FILE_REMOTE_PROTOCOL_INFO>() as u32)
    };
    ok != 0
}

/// `FILE_ID_INFO` (volume serial + 128-bit file id) of an open handle.
fn file_id(handle: HANDLE) -> io::Result<(u64, [u8; 16])> {
    // SAFETY: plain data, size matches.
    let mut info: FILE_ID_INFO = unsafe { std::mem::zeroed() };
    let ok = unsafe { GetFileInformationByHandleEx(handle, FileIdInfo, (&mut info as *mut FILE_ID_INFO).cast(), std::mem::size_of::<FILE_ID_INFO>() as u32) };
    if ok == 0 {
        return Err(io::Error::last_os_error());
    }
    Ok((info.VolumeSerialNumber, info.FileId.Identifier))
}

/// Compare the full file identity of `file` with the file now at `path`.
/// The 64-bit file index is not unique on ReFS or a Dev Drive, so the
/// 128-bit id and the volume serial are compared whole.
fn same_file_id(file: &File, path: &Path) -> bool {
    let Ok(locked) = file_id(handle_of(file)) else { return false };
    let wide_path = wide(path);
    // SAFETY: wide_path is NUL terminated; the handle is closed below.
    let fresh = unsafe {
        CreateFileW(
            wide_path.as_ptr(),
            0,
            FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
            std::ptr::null(),
            OPEN_EXISTING,
            FILE_ATTRIBUTE_NORMAL,
            std::ptr::null_mut(),
        )
    };
    if fresh == INVALID_HANDLE_VALUE {
        return false;
    }
    let other = file_id(fresh);
    // SAFETY: fresh is a handle this function opened.
    unsafe { CloseHandle(fresh) };
    other.is_ok_and(|other| other == locked)
}

fn nearest_existing(dir: &Path) -> PathBuf {
    let mut probe = dir.to_path_buf();
    while !probe.exists() {
        match probe.parent() {
            Some(parent) if parent != probe && !parent.as_os_str().is_empty() => probe = parent.to_path_buf(),
            _ => break,
        }
    }
    probe
}

impl LockDriver for LockFileExDriver {
    fn supported(&self) -> bool {
        true
    }

    fn unsupported_detail(&self) -> &'static str {
        ""
    }

    fn try_lock(&self, file: &File, mode: Mode) -> io::Result<TryLock> {
        let flags = LOCKFILE_FAIL_IMMEDIATELY
            | match mode {
                Mode::Ex => LOCKFILE_EXCLUSIVE_LOCK,
                Mode::Sh => 0,
            };
        // SAFETY: LockFileEx on a handle this File owns, with a zeroed
        // OVERLAPPED that lives for the call (the call never goes async).
        let mut overlapped: OVERLAPPED = unsafe { std::mem::zeroed() };
        if unsafe { LockFileEx(handle_of(file), flags, 0, 1, 0, &mut overlapped) } != 0 {
            return Ok(TryLock::Locked);
        }
        let err = io::Error::last_os_error();
        match err.raw_os_error().map(|code| code as u32) {
            Some(ERROR_LOCK_VIOLATION) => Ok(TryLock::WouldBlock),
            // ERROR_IO_PENDING and everything else is an error, never "held".
            _ => Err(err),
        }
    }

    fn guarantee(&self, dir: &Path) -> Guarantee {
        match volume_is_remote(&nearest_existing(dir)) {
            Ok(true) => remote("GetDriveTypeW reports DRIVE_REMOTE"),
            // An unreadable volume is measured later on the open file.
            Ok(false) | Err(_) => local(),
        }
    }

    fn file_guarantee(&self, file: &File) -> io::Result<Guarantee> {
        if file_is_remote(file) {
            return Ok(remote("the file reports remote protocol info"));
        }
        if let Ok(path) = self.description_path(file) {
            if volume_is_remote(&path).unwrap_or(false) {
                return Ok(remote("GetDriveTypeW reports DRIVE_REMOTE"));
            }
        }
        Ok(local())
    }

    fn description_path(&self, file: &File) -> io::Result<PathBuf> {
        let mut buf = vec![0u16; 1024];
        loop {
            // SAFETY: buf is writable for its stated length.
            let len = unsafe { GetFinalPathNameByHandleW(handle_of(file), buf.as_mut_ptr(), buf.len() as u32, VOLUME_NAME_DOS) } as usize;
            if len == 0 {
                return Err(io::Error::last_os_error());
            }
            if len < buf.len() {
                buf.truncate(len);
                break;
            }
            buf.resize(len + 1, 0);
        }
        let path = std::ffi::OsString::from_wide(&buf);
        let text = path.to_string_lossy();
        // `\\?\UNC\server\share` -> `\\server\share`; `\\?\C:\x` -> `C:\x`.
        Ok(match text.strip_prefix(r"\\?\UNC\") {
            Some(rest) => PathBuf::from(format!(r"\\{rest}")),
            None => match text.strip_prefix(r"\\?\") {
                Some(rest) => PathBuf::from(rest),
                None => PathBuf::from(path),
            },
        })
    }

    fn holders(&self, _file: &File) -> HoldersList {
        HoldersList::Unlistable("Windows has no API that lists byte-range lock holders".to_string())
    }

    fn prepare_borrow(&self, _cmd: &mut Command) {}

    fn end_leftovers(&self, _file: &File, _child_pid: u32, _kill_wait: Duration) -> Result<u32, Leftovers> {
        Err(Leftovers { killed: 0, pids: Vec::new(), foreign: false })
    }

    fn before_close(&self, file: &File) {
        // On Windows no other process can share this lock, so an explicit
        // unlock is deterministic where unlock-on-close "depends upon
        // available system resources". A failure (NOT_LOCKED: nothing to
        // undo) is ignored; the close that follows releases the lock anyway.
        // SAFETY: UnlockFileEx on a handle this File owns; zeroed OVERLAPPED.
        let mut overlapped: OVERLAPPED = unsafe { std::mem::zeroed() };
        unsafe { UnlockFileEx(handle_of(file), 0, 1, 0, &mut overlapped) };
    }

    fn same_file(&self, file: &File, path: &Path) -> bool {
        same_file_id(file, path)
    }
}
