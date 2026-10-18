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
    /// `Some(Created)` means the final name was installed (or replaced), but durability or
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
pub trait FileSystem {
    fn checkpoint(&self, step: &'static str) -> io::Result<()>;
}
pub struct OsFileSystem;
impl FileSystem for OsFileSystem {
    fn checkpoint(&self, _: &'static str) -> io::Result<()> {
        Ok(())
    }
}
pub fn install_once(dir: &Path, name: &str, bytes: &[u8]) -> Result<Installed, InstallError> {
    install_with(dir, name, bytes, &OsFileSystem)
}
/// Inject failures after each real filesystem boundary; never bypass a write
/// or fsync. Errors retain the same installation evidence as OS failures.
pub fn install_with(
    dir: &Path,
    name: &str,
    bytes: &[u8],
    filesystem: &dyn FileSystem,
) -> Result<Installed, InstallError> {
    install_ordered(dir, name, bytes, filesystem, None, &mut || Ok(()), &[])
}

/// [`install_with`] with additions for a caller that orders other durable
/// effects around one record. `alongside` runs on another thread while the
/// record's bytes are synced when present (`None` starts no worker thread).
/// Other fsyncs that must precede the record can
/// then share the filesystem's journal commit with it; `before_install`
/// runs once both finished and before the name is installed. The record
/// cannot exist until both returned `Ok`; an error leaves only the
/// temporary. `also_sync` are further directories synced together with
/// `dir` after the name is installed (for example the parent of a directory
/// created for this record); the install returns only after all are synced.
pub fn install_ordered(
    dir: &Path,
    name: &str,
    bytes: &[u8],
    filesystem: &dyn FileSystem,
    alongside: Option<&(dyn Fn() -> io::Result<()> + Sync)>,
    before_install: &mut dyn FnMut() -> io::Result<()>,
    also_sync: &[&Path],
) -> Result<Installed, InstallError> {
    write_durably(dir, name, bytes, false, 0o600, &mut |step| match step {
        "file-fsync" => {
            filesystem.checkpoint(step)?;
            before_install()
        }
        _ => filesystem.checkpoint(step),
    }, also_sync, alongside)
}

/// Sync several directories, each with its own fsync, issued concurrently
/// so a journaling filesystem can serve them with one commit. Returns after
/// every fsync finished; the first error wins.
pub fn sync_directories(dirs: &[&Path]) -> io::Result<()> {
    match dirs {
        [] => Ok(()),
        [one] => sync_directory(one),
        [first, rest @ ..] => std::thread::scope(|scope| {
            let others: Vec<_> = rest.iter().map(|dir| scope.spawn(move || sync_directory(dir))).collect();
            let mut result = sync_directory(first);
            for other in others {
                let synced = other.join().unwrap_or_else(|_| Err(io::Error::other("directory sync panicked")));
                if result.is_ok() {
                    result = synced;
                }
            }
            result
        }),
    }
}

/// Install with the caller's historical Unix creation mode (still filtered by
/// umask). Other platforms use their normal creation permissions.
pub fn install_once_with_mode(dir: &Path, name: &str, bytes: &[u8], mode: u32) -> Result<Installed, InstallError> {
    write_durably(dir, name, bytes, false, mode, &mut |_| Ok(()), &[], None)
}

/// Replace a name atomically without opening its old target, then sync its parent.
pub fn replace_durably(dir: &Path, name: &str, bytes: &[u8]) -> Result<Installed, InstallError> {
    replace_durably_observed(dir, name, bytes, |_| Ok(()))
}

/// Replace with a caller-selected Unix creation mode, filtered by umask.
pub fn replace_durably_with_mode(dir: &Path, name: &str, bytes: &[u8], mode: u32) -> Result<Installed, InstallError> {
    write_durably(dir, name, bytes, true, mode, &mut |_| Ok(()), &[], None)
}

#[derive(Debug, Clone, Copy)]
pub enum ReplacePoint {
    Written,
    Synced,
    Renamed,
    DirectorySynced,
}

/// Observe real durability boundaries; observer errors preserve installation effects.
pub fn replace_durably_observed(
    dir: &Path,
    name: &str,
    bytes: &[u8],
    mut observe: impl FnMut(ReplacePoint) -> io::Result<()>,
) -> Result<Installed, InstallError> {
    write_durably(dir, name, bytes, true, 0o600, &mut |step| match step {
        "bytes-written" => observe(ReplacePoint::Written),
        "file-fsync" => observe(ReplacePoint::Synced),
        "name-installed" => observe(ReplacePoint::Renamed),
        "parent-fsync" => observe(ReplacePoint::DirectorySynced),
        _ => Ok(()),
    }, &[], None)
}

/// One write path for both modes. `replace` renames over the name; otherwise the
/// name is installed without replacement. `checkpoint` runs after each real
/// filesystem boundary and its errors carry the effect observed so far.
fn write_durably(
    dir: &Path,
    name: &str,
    bytes: &[u8],
    replace: bool,
    mode: u32,
    checkpoint: &mut dyn FnMut(&'static str) -> io::Result<()>,
    also_sync: &[&Path],
    alongside: Option<&(dyn Fn() -> io::Result<()> + Sync)>,
) -> Result<Installed, InstallError> {
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
        options.mode(mode).custom_flags(libc::O_NOFOLLOW);
    }
    #[cfg(not(unix))]
    let _ = mode;
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
    checkpoint("temp-created").map_err(|e| error(e, None))?;
    // write_all retries short writes and reports WriteZero/EFBIG rather than
    // publishing a truncated record. Keep the temporary on every failure.
    file.write_all(bytes).map_err(|e| error(e, None))?;
    checkpoint("bytes-written").map_err(|e| error(e, None))?;
    #[cfg(target_os = "linux")]
    {
        use std::os::fd::AsRawFd;
        // Start the data writeback first, so the block allocation joins the
        // running journal transaction before `alongside` can commit it; the
        // fsync below stays the durability boundary either way.
        // SAFETY: sync_file_range on a descriptor this call owns.
        unsafe {
            libc::sync_file_range(
                file.as_raw_fd(),
                0,
                0,
                libc::SYNC_FILE_RANGE_WAIT_BEFORE | libc::SYNC_FILE_RANGE_WRITE | libc::SYNC_FILE_RANGE_WAIT_AFTER,
            );
        }
    }
    match alongside {
        Some(alongside) => std::thread::scope(|scope| {
            let other = scope.spawn(alongside);
            let synced = file.sync_all();
            let other = other.join().unwrap_or_else(|_| Err(io::Error::other("concurrent durable step panicked")));
            synced.and(other)
        }),
        None => file.sync_all(),
    }.map_err(|e| error(e, None))?;
    checkpoint("file-fsync").map_err(|e| error(e, None))?;
    drop(file);
    let target = dir.join(name);
    let installed = match if replace {
        fs::rename(&temporary, &target)
    } else {
        install_name(&temporary, &target)
    } {
        Ok(()) => Installed::Created,
        Err(e) if !replace && e.kind() == io::ErrorKind::AlreadyExists => Installed::AlreadyExists,
        Err(e) => return Err(error(e, None)),
    };
    // A rename consumed the temporary; only a no-replace install can leave one.
    let after_install = |source| InstallError {
        source,
        installed: Some(installed),
        temporary: (!replace).then(|| temporary.clone()),
    };
    checkpoint("name-installed").map_err(after_install)?;
    if !replace {
        // Windows moves the temp; Unix links then unlinks. A surviving Unix temp
        // is an orphan, not a second record or permission to overwrite a target.
        #[cfg(not(windows))]
        fs::remove_file(&temporary).map_err(after_install)?;
        #[cfg(windows)]
        if installed == Installed::AlreadyExists {
            fs::remove_file(&temporary).map_err(after_install)?;
        }
        checkpoint("temp-removed").map_err(after_install)?;
    }
    let mut dirs = vec![dir];
    dirs.extend_from_slice(also_sync);
    sync_directories(&dirs).map_err(|source| InstallError {
        source,
        installed: Some(installed),
        temporary: None,
    })?;
    checkpoint("parent-fsync").map_err(|source| InstallError {
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
