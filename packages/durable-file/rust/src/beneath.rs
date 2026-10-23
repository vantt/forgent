//! Open a regular file beneath a trusted root without following a symlink at any position.
//!
//! Every directory component and the leaf are opened no-follow, relative to a descriptor of the
//! directory before it. The caller-supplied root is opened once, no-follow, so a symlinked root is
//! refused as well. The bytes and the revision come from the one descriptor returned here.
use rustix::fs::{
    fstat, mkdirat, openat, statat, AtFlags, FileType, Mode, OFlags, CWD,
};
use rustix::io::Errno;
use sha2::{Digest, Sha256};
use std::ffi::OsStr;
use std::fs::File;
use std::io::{self, Read as _};
use std::os::fd::{AsFd, BorrowedFd, OwnedFd};
use std::path::{Component, Path};

/// A named reason the path may not be opened. None of them carries file content.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BeneathRefusal {
    /// The root, a directory component or the leaf is a symlink.
    Symlink,
    /// The relative path is absolute, empty or has `..`, or resolution left the root.
    Escape,
    /// The leaf is not a regular file, or a directory component is not a directory.
    NotRegular,
    /// The file is longer than the bound given to [`OpenedFile::read`].
    TooLarge,
}

#[derive(Debug)]
pub enum BeneathError {
    Refused(BeneathRefusal),
    Io(io::Error),
}
impl std::fmt::Display for BeneathError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Refused(why) => write!(f, "refused: {why:?}"),
            Self::Io(error) => write!(f, "{error}"),
        }
    }
}
impl std::error::Error for BeneathError {}
impl From<Errno> for BeneathError {
    fn from(errno: Errno) -> Self {
        Self::Io(errno.into())
    }
}

/// How directory components are resolved. [`open_beneath`] picks one; both give the same answers.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Strategy {
    /// One `openat2` with `RESOLVE_BENEATH | RESOLVE_NO_SYMLINKS | RESOLVE_NO_MAGICLINKS`.
    #[cfg(any(target_os = "linux", target_os = "android"))]
    Openat2,
    /// One `openat` per component with `O_NOFOLLOW | O_DIRECTORY`.
    Walk,
}

/// Device and inode of a directory, for a re-check that a path still names the same directory.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DirIdentity {
    pub dev: u64,
    pub ino: u64,
}

fn identity_of(fd: BorrowedFd<'_>) -> Result<DirIdentity, BeneathError> {
    let stat = fstat(fd)?;
    #[allow(clippy::unnecessary_cast)] // the field widths differ between platforms
    Ok(DirIdentity {
        dev: stat.st_dev as u64,
        ino: stat.st_ino as u64,
    })
}

/// A directory opened no-follow; keep it to re-check the identity before a replace.
#[derive(Debug)]
pub struct Dir(OwnedFd);
impl Dir {
    pub fn identity(&self) -> Result<DirIdentity, BeneathError> {
        identity_of(self.0.as_fd())
    }
}

/// The bytes read from an [`OpenedFile`] and their revision (sha256, lowercase hex).
#[derive(Debug)]
pub struct Read {
    pub bytes: Vec<u8>,
    pub revision: String,
}

/// A regular file opened beneath a root, with the identity of the directory that holds it.
#[derive(Debug)]
pub struct OpenedFile {
    file: File,
    parent: DirIdentity,
}
impl OpenedFile {
    pub fn parent_identity(&self) -> DirIdentity {
        self.parent
    }
    /// The permission bits (`0o777` mask) of the open file.
    pub fn mode(&self) -> Result<u32, BeneathError> {
        Ok(fstat(&self.file)?.st_mode as u32 & 0o777)
    }
    /// Read to the end from this descriptor, refusing a file longer than `max` bytes. The revision
    /// is of exactly the bytes returned, whatever the path names by now.
    pub fn read(mut self, max: usize) -> Result<Read, BeneathError> {
        let mut bytes = Vec::new();
        (&mut self.file)
            .take(max as u64 + 1)
            .read_to_end(&mut bytes)
            .map_err(BeneathError::Io)?;
        if bytes.len() > max {
            return Err(BeneathError::Refused(BeneathRefusal::TooLarge));
        }
        let revision = format!("{:x}", Sha256::digest(&bytes));
        Ok(Read { bytes, revision })
    }
}

fn refused(why: BeneathRefusal) -> BeneathError {
    BeneathError::Refused(why)
}

/// Split a relative path into plain names; anything that is not a plain downward path is an escape.
fn names(relative: &Path) -> Result<Vec<&OsStr>, BeneathError> {
    let mut out = Vec::new();
    for component in relative.components() {
        match component {
            Component::Normal(name) => out.push(name),
            Component::CurDir => {}
            _ => return Err(refused(BeneathRefusal::Escape)),
        }
    }
    if out.is_empty() {
        return Err(refused(BeneathRefusal::Escape));
    }
    Ok(out)
}

/// What a failed no-follow open of `name` under `dirfd` means. `None` is "does not exist".
fn classify(errno: Errno, dirfd: BorrowedFd<'_>, name: &Path) -> Result<(), BeneathError> {
    match errno {
        Errno::NOENT => Ok(()),
        Errno::LOOP => Err(refused(BeneathRefusal::Symlink)),
        Errno::XDEV => Err(refused(BeneathRefusal::Escape)),
        Errno::NOTDIR => match statat(dirfd, name, AtFlags::SYMLINK_NOFOLLOW) {
            Ok(stat) if FileType::from_raw_mode(stat.st_mode) == FileType::Symlink => {
                Err(refused(BeneathRefusal::Symlink))
            }
            Ok(_) => Err(refused(BeneathRefusal::NotRegular)),
            Err(Errno::NOENT) => Ok(()),
            Err(other) => Err(other.into()),
        },
        other => Err(other.into()),
    }
}

const DIR_FLAGS: OFlags = OFlags::RDONLY
    .union(OFlags::DIRECTORY)
    .union(OFlags::NOFOLLOW)
    .union(OFlags::CLOEXEC);

fn open_root(root: &Path) -> Result<Option<OwnedFd>, BeneathError> {
    match rustix::fs::open(root, DIR_FLAGS, Mode::empty()) {
        Ok(fd) => Ok(Some(fd)),
        Err(errno) => classify(errno, CWD.as_fd(), root).map(|()| None),
    }
}

/// Resolve `dirs` (plain names) below `root`; `None` when a directory is missing.
fn resolve_dir(
    strategy: Strategy,
    root: BorrowedFd<'_>,
    dirs: &[&OsStr],
) -> Result<Option<OwnedFd>, BeneathError> {
    match strategy {
        #[cfg(any(target_os = "linux", target_os = "android"))]
        Strategy::Openat2 => {
            let joined: std::path::PathBuf = dirs.iter().collect();
            let resolve =
                rustix::fs::ResolveFlags::BENEATH
                    | rustix::fs::ResolveFlags::NO_SYMLINKS
                    | rustix::fs::ResolveFlags::NO_MAGICLINKS;
            match rustix::fs::openat2(root, &joined, DIR_FLAGS, Mode::empty(), resolve) {
                Ok(fd) => Ok(Some(fd)),
                Err(errno) => classify(errno, root, &joined).map(|()| None),
            }
        }
        Strategy::Walk => {
            let mut current = root.try_clone_to_owned().map_err(BeneathError::Io)?;
            for name in dirs {
                match openat(&current, *name, DIR_FLAGS, Mode::empty()) {
                    Ok(fd) => current = fd,
                    Err(errno) => {
                        return classify(errno, current.as_fd(), Path::new(name)).map(|()| None)
                    }
                }
            }
            Ok(Some(current))
        }
    }
}

/// [`open_beneath`] with a chosen strategy; tests run both over the same tree.
pub fn open_beneath_with(
    strategy: Strategy,
    root: &Path,
    relative: &Path,
) -> Result<Option<OpenedFile>, BeneathError> {
    let mut names = names(relative)?;
    let leaf = names.pop().ok_or_else(|| refused(BeneathRefusal::Escape))?;
    let Some(root_fd) = open_root(root)? else {
        return Ok(None);
    };
    let dir = if names.is_empty() {
        Some(root_fd)
    } else {
        resolve_dir(strategy, root_fd.as_fd(), &names)?
    };
    let Some(dir) = dir else {
        return Ok(None);
    };
    // NONBLOCK so a FIFO leaf cannot hang the open; it is refused by type right below.
    let flags = OFlags::RDONLY | OFlags::NOFOLLOW | OFlags::NONBLOCK | OFlags::CLOEXEC;
    let fd = match openat(&dir, leaf, flags, Mode::empty()) {
        Ok(fd) => fd,
        Err(errno) => return classify(errno, dir.as_fd(), Path::new(leaf)).map(|()| None),
    };
    if FileType::from_raw_mode(fstat(&fd)?.st_mode) != FileType::RegularFile {
        return Err(refused(BeneathRefusal::NotRegular));
    }
    Ok(Some(OpenedFile {
        file: File::from(fd),
        parent: identity_of(dir.as_fd())?,
    }))
}

/// Open `relative` (a plain downward path) beneath `root` for reading. A missing root, directory
/// or file is `Ok(None)`; a symlink anywhere, an escape or a non-regular leaf is a refusal.
/// Uses `openat2` where the kernel has it and the per-component walk otherwise.
pub fn open_beneath(root: &Path, relative: &Path) -> Result<Option<OpenedFile>, BeneathError> {
    #[cfg(any(target_os = "linux", target_os = "android"))]
    match open_beneath_with(Strategy::Openat2, root, relative) {
        // ENOSYS: no openat2; EPERM: a sandbox filter that does not know the syscall.
        Err(BeneathError::Io(error)) if matches!(error.raw_os_error(), Some(code) if code == Errno::NOSYS.raw_os_error() || code == Errno::PERM.raw_os_error()) =>
            {}
        outcome => return outcome,
    }
    open_beneath_with(Strategy::Walk, root, relative)
}

/// Create the directories of `relative` beneath `root` that are missing (`mode`, filtered by the
/// umask) and return the last one, every step no-follow. Existing directories keep their mode.
pub fn ensure_dir_beneath(root: &Path, relative: &Path, mode: u32) -> Result<Dir, BeneathError> {
    let names = names(relative)?;
    let Some(mut current) = open_root(root)? else {
        return Err(BeneathError::Io(io::ErrorKind::NotFound.into()));
    };
    for name in names {
        match mkdirat(&current, name, Mode::from_raw_mode(mode as _)) {
            Ok(()) | Err(Errno::EXIST) => {}
            Err(errno) => return Err(errno.into()),
        }
        current = match openat(&current, name, DIR_FLAGS, Mode::empty()) {
            Ok(fd) => fd,
            Err(errno) => {
                classify(errno, current.as_fd(), Path::new(name))?;
                return Err(BeneathError::Io(io::ErrorKind::NotFound.into()));
            }
        };
    }
    Ok(Dir(current))
}
