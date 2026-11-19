//! `path.resolve` for the paths this module compares as text: made absolute against the working directory and
//! normalised without touching the file system.

use std::path::{Component, Path, PathBuf};

pub fn resolve(path: &Path) -> PathBuf {
    let absolute = if path.is_absolute() {
        path.to_path_buf()
    } else {
        std::env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("/"))
            .join(path)
    };
    let mut out = PathBuf::new();
    for part in absolute.components() {
        match part {
            Component::ParentDir => {
                out.pop();
            }
            Component::CurDir => {}
            other => out.push(other.as_os_str()),
        }
    }
    out
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
