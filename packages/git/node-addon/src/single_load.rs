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
#[cfg(target_os = "linux")]
fn register() -> Result<Marker, String> {
    use std::os::linux::net::SocketAddrExt;
    use std::os::unix::net::{SocketAddr, UnixListener};
    // /proc/self/stat starttime survives exec but is different for a reused pid.
    let stat = std::fs::read_to_string("/proc/self/stat").map_err(|e| e.to_string())?;
    let start = stat
        .rsplit_once(')')
        .and_then(|(_, s)| s.split_whitespace().nth(19))
        .ok_or("git-addon-unavailable: process identity")?;
    let name = format!("fgos-combined-addon-{}-{start}", std::process::id());
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
        Foundation::{CloseHandle, GetLastError, ERROR_ALREADY_EXISTS, FILETIME},
        System::Threading::{CreateMutexW, GetCurrentProcess, GetProcessTimes},
    };
    // Mutex handle is deliberately retained for the process lifetime and is not inheritable.
    unsafe {
        let mut created = FILETIME {
            dwLowDateTime: 0,
            dwHighDateTime: 0,
        };
        let mut exit = created;
        let mut kernel = created;
        let mut user = created;
        if GetProcessTimes(
            GetCurrentProcess(),
            &mut created,
            &mut exit,
            &mut kernel,
            &mut user,
        ) == 0
        {
            return Err("git-addon-unavailable: process identity".into());
        }
        let name: Vec<u16> = format!(
            "Local\\fgos-combined-addon-{}-{}-{}",
            std::process::id(),
            created.dwHighDateTime,
            created.dwLowDateTime
        )
        .encode_utf16()
        .chain(Some(0))
        .collect();
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
    let root = std::env::var_os("FGOS_STATE_ROOT")
        .ok_or("git-addon-unavailable: state root required for marker")?;
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
    let mut info = std::mem::MaybeUninit::<libc::proc_bsdinfo>::uninit();
    let size = std::mem::size_of::<libc::proc_bsdinfo>() as i32;
    let pid = std::process::id();
    if unsafe {
        libc::proc_pidinfo(
            pid as i32,
            libc::PROC_PIDTBSDINFO,
            0,
            info.as_mut_ptr().cast(),
            size,
        )
    } != size
    {
        return Err("git-addon-unavailable: process identity".into());
    }
    let info = unsafe { info.assume_init() };
    let file = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .truncate(false)
        .mode(0o600)
        .custom_flags(libc::O_CLOEXEC | libc::O_NOFOLLOW)
        .open(run.join(format!(
            "combined-addon-{pid}-{}-{}.lock",
            info.pbi_start_tvsec, info.pbi_start_tvusec
        )))
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
