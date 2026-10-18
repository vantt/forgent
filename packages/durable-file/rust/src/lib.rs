//! Immutable, no-overwrite file installation in a caller-owned directory.
//!
//! The directory must already exist and remain trusted for the duration of the
//! call. This leaf does not establish directory ownership or create ancestors.
//! A successful install syncs both bytes and the parent directory. That is an OS
//! acknowledgement, not a claim that a particular device survives power loss.
use std::fs::{self, OpenOptions};
use std::io::{self, Write};
use std::path::{Component, Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};

static NEXT_TEMP: AtomicU64 = AtomicU64::new(0);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Installed {
    Created,
    AlreadyExists,
}

/// Distinguishes errors before installation from errors after the name exists.
#[derive(Debug)]
pub struct InstallError {
    pub source: io::Error,
    /// `Some(Created)` means the final name was installed, but durability or
    /// cleanup failed. Never retry assuming that no effect occurred.
    pub installed: Option<Installed>,
    /// A failed checked write is retained here for diagnosis, never installed.
    pub temporary: Option<PathBuf>,
}
impl std::fmt::Display for InstallError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "durable install ({:?}): {}", self.installed, self.source)
    }
}
impl std::error::Error for InstallError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        Some(&self.source)
    }
}

/// Write all bytes, sync the file, install without replacement, remove the
/// temporary link and sync the parent. Errors preserve the observed effect.
/// Existing targets (including symlinks) are never opened or overwritten.
pub fn install_once(dir: &Path, name: &str, bytes: &[u8]) -> Result<Installed, InstallError> {
    let mut components = Path::new(name).components();
    if name.is_empty()
        || !matches!(components.next(), Some(Component::Normal(_)))
        || components.next().is_some()
        || name.contains(['/', '\\', '\0'])
    {
        return Err(InstallError {
            source: io::Error::new(io::ErrorKind::InvalidInput, "expected one literal filename"),
            installed: None,
            temporary: None,
        });
    }
    let mut options = OpenOptions::new();
    options.create_new(true).write(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600).custom_flags(libc::O_NOFOLLOW);
    }
    let (temporary, mut file) = loop {
        let seq = NEXT_TEMP.fetch_add(1, Ordering::Relaxed);
        let path = dir.join(format!(".durable-file-{}-{seq}.tmp", std::process::id()));
        if path == dir.join(name) {
            continue;
        }
        match options.open(&path) {
            Ok(file) => break (path, file),
            Err(e) if e.kind() == io::ErrorKind::AlreadyExists => continue,
            Err(source) => {
                return Err(InstallError {
                    source,
                    installed: None,
                    temporary: None,
                })
            }
        }
    };
    let error = |source, installed| InstallError {
        source,
        installed,
        temporary: Some(temporary.clone()),
    };
    // write_all retries short writes and reports WriteZero/EFBIG rather than
    // publishing a truncated record. Keep the temporary on every failure.
    file.write_all(bytes).map_err(|e| error(e, None))?;
    file.sync_all().map_err(|e| error(e, None))?;
    drop(file);
    let installed = match install_name(&temporary, &dir.join(name)) {
        Ok(()) => Installed::Created,
        Err(e) if e.kind() == io::ErrorKind::AlreadyExists => Installed::AlreadyExists,
        Err(e) => return Err(error(e, None)),
    };
    // Windows moves the temp; Unix links then unlinks. A surviving Unix temp
    // is an orphan, not a second record or permission to overwrite a target.
    #[cfg(not(windows))]
    fs::remove_file(&temporary).map_err(|e| error(e, Some(installed)))?;
    #[cfg(windows)]
    if installed == Installed::AlreadyExists {
        fs::remove_file(&temporary).map_err(|e| error(e, Some(installed)))?;
    }
    sync_directory(dir).map_err(|source| InstallError {
        source,
        installed: Some(installed),
        temporary: None,
    })?;
    Ok(installed)
}

#[cfg(not(windows))]
fn install_name(from: &Path, to: &Path) -> io::Result<()> {
    fs::hard_link(from, to)
}

#[cfg(windows)]
fn install_name(from: &Path, to: &Path) -> io::Result<()> {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::{MoveFileExW, MOVEFILE_WRITE_THROUGH};
    let from: Vec<u16> = from.as_os_str().encode_wide().chain(Some(0)).collect();
    let to: Vec<u16> = to.as_os_str().encode_wide().chain(Some(0)).collect();
    // No MOVEFILE_REPLACE_EXISTING: an existing destination must win.
    if unsafe { MoveFileExW(from.as_ptr(), to.as_ptr(), MOVEFILE_WRITE_THROUGH) } == 0 {
        Err(io::Error::last_os_error())
    } else {
        Ok(())
    }
}

/// Sync a directory explicitly. Unsupported filesystems/platforms return an
/// error; callers must not silently upgrade this to stable-media durability.
pub fn sync_directory(dir: &Path) -> io::Result<()> {
    #[cfg(windows)]
    let file = {
        use std::os::windows::fs::OpenOptionsExt;
        use windows_sys::Win32::Storage::FileSystem::FILE_FLAG_BACKUP_SEMANTICS;
        OpenOptions::new()
            .read(true)
            .write(true)
            .custom_flags(FILE_FLAG_BACKUP_SEMANTICS)
            .open(dir)?
    };
    #[cfg(not(windows))]
    let file = fs::File::open(dir)?;
    file.sync_all()
}
