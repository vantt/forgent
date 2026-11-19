//! `path.resolve` for the paths this module compares as text: made absolute against the working directory and
//! normalised without touching the file system.

use std::path::{Path, PathBuf};

/// `path.resolve(path)` against the working directory: the driver's one `path.resolve`.
pub fn resolve(path: &Path) -> PathBuf {
    crate::confinement::driver::js::resolve_path(Path::new(""), path)
}

/// The uid of this process where the platform has one.
pub fn current_uid() -> Option<u32> {
    #[cfg(unix)]
    {
        // SAFETY: getuid has no failure mode and touches no memory.
        Some(unsafe { libc::getuid() })
    }
    #[cfg(not(unix))]
    {
        None
    }
}
