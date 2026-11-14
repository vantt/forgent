use fgos_process::facts::StartTime;
use std::sync::OnceLock;
static MARKER: OnceLock<Result<Marker, String>> = OnceLock::new();
#[cfg(target_os = "linux")]
type Marker = std::os::unix::net::UnixListener;
#[cfg(target_os = "macos")]
type Marker = std::fs::File;
#[cfg(windows)]
type Marker = usize;
#[cfg(not(any(target_os = "linux", target_os = "macos", windows)))]
type Marker = ();

pub fn check() -> Result<(), String> {
    MARKER
        .get_or_init(register)
        .as_ref()
        .map(|_| ())
        .map_err(Clone::clone)
}

/// The name part that tells this process from a reused pid, built from the typed start time so every
/// platform keeps its own form: ticks on Linux, FILETIME high and low words on Windows, seconds and
/// microseconds unpadded on macOS.
fn marker_id(pid: u32, start: StartTime) -> String {
    match start {
        StartTime::Ticks(ticks) => format!("{pid}-{ticks}"),
        StartTime::FileTime(filetime) => {
            format!("{pid}-{}-{}", filetime >> 32, filetime & 0xffff_ffff)
        }
        StartTime::Timeval { sec, usec } => format!("{pid}-{sec}-{usec}"),
    }
}

fn own_marker_id() -> Result<String, String> {
    let start =
        fgos_process::facts::self_start_time().ok_or("git-addon-unavailable: process identity")?;
    Ok(marker_id(std::process::id(), start))
}

#[cfg(target_os = "linux")]
fn register() -> Result<Marker, String> {
    use std::os::linux::net::SocketAddrExt;
    use std::os::unix::net::{SocketAddr, UnixListener};
    let name = format!("fgos-combined-addon-{}", own_marker_id()?);
    let addr = SocketAddr::from_abstract_name(name.as_bytes()).map_err(|e| e.to_string())?;
    // std's socket uses CLOEXEC; no marker can leak into a Git child.
    UnixListener::bind_addr(&addr).map_err(|e| format!("git-addon-second-load: {e}"))
}
#[cfg(not(any(target_os = "linux", target_os = "macos", windows)))]
fn register() -> Result<Marker, String> {
    Err("git-addon-unavailable: unsupported-platform".into())
}

#[cfg(windows)]
fn register() -> Result<Marker, String> {
    use windows_sys::Win32::{
        Foundation::{CloseHandle, GetLastError, ERROR_ALREADY_EXISTS},
        System::Threading::CreateMutexW,
    };
    let name: Vec<u16> = format!("Local\\fgos-combined-addon-{}", own_marker_id()?)
        .encode_utf16()
        .chain(Some(0))
        .collect();
    // Mutex handle is deliberately retained for the process lifetime and is not inheritable.
    unsafe {
        let handle = CreateMutexW(std::ptr::null(), 0, name.as_ptr());
        if handle.is_null() {
            return Err("git-addon-unavailable: marker".into());
        }
        if GetLastError() == ERROR_ALREADY_EXISTS {
            CloseHandle(handle);
            return Err("git-addon-second-load".into());
        }
        Ok(handle as usize)
    }
}

#[cfg(target_os = "macos")]
fn register() -> Result<Marker, String> {
    use std::{
        fs::{DirBuilder, OpenOptions},
        os::{
            fd::AsRawFd,
            unix::fs::{DirBuilderExt, MetadataExt, OpenOptionsExt},
        },
    };
    let root = fgos_holder_lock::state_root().0;
    let root = std::fs::canonicalize(root).map_err(|e| e.to_string())?;
    let run = root.join("run");
    match DirBuilder::new().mode(0o700).create(&run) {
        Ok(()) => (),
        Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => (),
        Err(e) => return Err(e.to_string()),
    }
    let metadata = std::fs::symlink_metadata(&run).map_err(|e| e.to_string())?;
    if !metadata.is_dir()
        || metadata.file_type().is_symlink()
        || metadata.mode() & 0o077 != 0
        || metadata.uid() != unsafe { libc::geteuid() }
    {
        return Err("git-addon-unavailable: unsafe marker directory".into());
    }
    let id = own_marker_id()?;
    let file = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .truncate(false)
        .mode(0o600)
        .custom_flags(libc::O_CLOEXEC | libc::O_NOFOLLOW)
        .open(run.join(format!("combined-addon-{id}.lock")))
        .map_err(|e| e.to_string())?;
    let metadata = file.metadata().map_err(|e| e.to_string())?;
    if !metadata.is_file()
        || metadata.uid() != unsafe { libc::geteuid() }
        || metadata.nlink() != 1
        || metadata.mode() & 0o077 != 0
    {
        return Err("git-addon-unavailable: unsafe marker file".into());
    }
    if unsafe { libc::flock(file.as_raw_fd(), libc::LOCK_EX | libc::LOCK_NB) } != 0 {
        return Err("git-addon-second-load".into());
    }
    Ok(file)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn linux_marker_keeps_the_pid_and_tick_form() {
        assert_eq!(marker_id(42, StartTime::Ticks(9001)), "42-9001");
    }

    #[test]
    fn windows_marker_splits_the_filetime_into_high_and_low_words() {
        let filetime = (0x01db_a1b2_u64 << 32) | 0x0000_00ff;
        assert_eq!(
            marker_id(7, StartTime::FileTime(filetime)),
            format!("7-{}-255", 0x01db_a1b2_u64)
        );
    }

    #[test]
    fn macos_marker_keeps_seconds_and_unpadded_microseconds() {
        assert_eq!(
            marker_id(
                7,
                StartTime::Timeval {
                    sec: 1_700_000_000,
                    usec: 42
                }
            ),
            "7-1700000000-42"
        );
    }

    #[test]
    fn this_process_names_the_same_marker_twice() {
        assert_eq!(own_marker_id(), own_marker_id());
    }
}
