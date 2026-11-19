//! `/`-separated path strings the way Node's `path` and `fs.realpathSync` treat them on a Linux host. Grants are
//! compared as strings (`startsWith`), so the resolver keeps them as strings rather than `PathBuf`.

use std::fs;
use std::io;

/// `path.normalize` for a path that may be relative; no trailing slash except the root.
pub(super) fn normalize(path: &str) -> String {
    let absolute = path.starts_with('/');
    let mut parts: Vec<&str> = Vec::new();
    for part in path.split('/') {
        match part {
            "" | "." => {}
            ".." => {
                if parts.last().is_some_and(|last| *last != "..") {
                    parts.pop();
                } else if !absolute {
                    parts.push("..");
                }
            }
            other => parts.push(other),
        }
    }
    match (absolute, parts.is_empty()) {
        (true, true) => "/".to_string(),
        (true, false) => format!("/{}", parts.join("/")),
        (false, true) => ".".to_string(),
        (false, false) => parts.join("/"),
    }
}

/// `path.resolve(path)`: absolute and normalized, against the working directory when relative.
pub(super) fn resolve(path: &str) -> String {
    if path.starts_with('/') {
        return normalize(path);
    }
    let cwd = std::env::current_dir()
        .map(|d| d.to_string_lossy().into_owned())
        .unwrap_or_else(|_| "/".to_string());
    normalize(&format!("{cwd}/{path}"))
}

/// `path.join(a, b)`.
pub(super) fn join(a: &str, b: &str) -> String {
    if a.is_empty() {
        return normalize(b);
    }
    normalize(&format!("{a}/{b}"))
}

/// `path.dirname`.
pub(super) fn dirname(path: &str) -> String {
    let trimmed = path.trim_end_matches('/');
    match trimmed.rfind('/') {
        None => ".".to_string(),
        Some(0) => "/".to_string(),
        Some(at) => trimmed[..at].trim_end_matches('/').to_string(),
    }
}

/// `path.basename`.
pub(super) fn basename(path: &str) -> String {
    path.trim_end_matches('/')
        .rsplit('/')
        .next()
        .unwrap_or("")
        .to_string()
}

pub(super) fn is_absolute(path: &str) -> bool {
    path.starts_with('/')
}

/// `fs.realpathSync` or `None`.
pub(super) fn real_or_null(path: &str) -> Option<String> {
    fs::canonicalize(path)
        .ok()
        .map(|p| p.to_string_lossy().into_owned())
}

/// `fs.existsSync`: follows links, a dangling one does not exist.
pub(super) fn exists(path: &str) -> bool {
    fs::metadata(path).is_ok()
}

pub(super) fn is_dir(path: &str) -> bool {
    fs::metadata(path).map(|m| m.is_dir()).unwrap_or(false)
}

/// `lstat` that answers `None` for a missing entry (`throwIfNoEntry: false`: ENOENT only; a path through a plain file
/// is still an error).
pub(super) fn lstat_if_present(path: &str) -> io::Result<Option<fs::Metadata>> {
    match fs::symlink_metadata(path) {
        Ok(meta) => Ok(Some(meta)),
        Err(err) if err.kind() == io::ErrorKind::NotFound => Ok(None),
        Err(err) => Err(err),
    }
}

/// Whether `target` is `root` itself or lies inside it.
pub fn is_inside_root(target: &str, root: &str) -> bool {
    target == root
        || target.starts_with(&if root.ends_with('/') {
            root.to_string()
        } else {
            format!("{root}/")
        })
}
