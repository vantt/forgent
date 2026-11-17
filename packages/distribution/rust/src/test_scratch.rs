//! A scratch directory for unit tests that is removed when it goes out of scope, so no test leaves files in
//! the OS temporary directory.

use std::ops::Deref;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU32, Ordering};

pub(crate) struct Scratch(PathBuf);

impl Deref for Scratch {
    type Target = Path;
    fn deref(&self) -> &Path {
        &self.0
    }
}

impl AsRef<Path> for Scratch {
    fn as_ref(&self) -> &Path {
        &self.0
    }
}

impl Drop for Scratch {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}

/// A fresh, empty directory unique to this process and call: `create_dir` fails on an existing name, and
/// the next counter value is tried.
pub(crate) fn scratch(label: &str) -> Scratch {
    static NEXT: AtomicU32 = AtomicU32::new(0);
    loop {
        let dir = std::env::temp_dir().join(format!(
            "fgos-{label}-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        match std::fs::create_dir(&dir) {
            Ok(()) => return Scratch(canonical(&dir)),
            Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(e) => panic!("scratch directory {}: {e}", dir.display()),
        }
    }
}

/// The directory as the OS itself spells it: no symbolic link in the path (the temporary directory of macOS
/// sits behind one, and the code under test refuses a linked ancestor), no short `RUNNER~1` name, and none of
/// the `\\?\` form Windows gives a canonical path, which Git and the shell reject.
pub(crate) fn canonical(dir: &Path) -> PathBuf {
    let real = std::fs::canonicalize(dir).unwrap_or_else(|_| dir.to_path_buf());
    match real.to_str().and_then(|text| text.strip_prefix(r"\\?\")) {
        Some(plain) if !plain.starts_with("UNC\\") => PathBuf::from(plain),
        _ => real,
    }
}
