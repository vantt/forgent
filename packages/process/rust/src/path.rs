//! The plain spelling of a path. `fs::canonicalize` returns a Windows verbatim drive path (`\\?\D:\...`) that Git,
//! `ssh-keygen`, `cmd.exe` and a shell all reject; every path that leaves for such a program passes through here.

use std::path::{Path, PathBuf};

/// The path with a verbatim drive prefix written plainly; any other path is returned as it is.
pub fn plain_path(path: &Path) -> PathBuf {
    path.to_str()
        .and_then(plain_drive_path)
        .map_or_else(|| path.to_path_buf(), PathBuf::from)
}

/// The plain spelling of a verbatim drive path, `None` for any other path. A verbatim UNC path
/// (`\\?\UNC\host\share`) stays as it is: it has no plain drive spelling.
pub fn plain_drive_path(path: &str) -> Option<&str> {
    let rest = path.strip_prefix(r"\\?\")?;
    let bytes = rest.as_bytes();
    (bytes.len() >= 3 && bytes[0].is_ascii_alphabetic() && bytes[1] == b':' && bytes[2] == b'\\')
        .then_some(rest)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn verbatim_drive_paths_are_written_plainly_and_nothing_else_changes() {
        assert_eq!(
            plain_drive_path(r"\\?\D:\a\forgent\repo"),
            Some(r"D:\a\forgent\repo")
        );
        assert_eq!(plain_drive_path(r"\\?\d:\"), Some(r"d:\"));
        assert_eq!(plain_drive_path(r"\\?\UNC\host\share\repo"), None);
        assert_eq!(plain_drive_path(r"\\?\D:"), None);
        assert_eq!(plain_drive_path(r"D:\a\forgent"), None);
        assert_eq!(plain_drive_path("/tmp/forgent"), None);
        assert_eq!(
            plain_path(Path::new(r"\\?\UNC\h\s")),
            PathBuf::from(r"\\?\UNC\h\s")
        );
    }
}
