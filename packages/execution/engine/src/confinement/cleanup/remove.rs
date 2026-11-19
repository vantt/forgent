//! Removal of a confinement directory and the two small readers an attempt's finalization uses before it: the
//! session transcript copy and the layout of a home.

use super::agent_file::refuse_symlink;
use super::error::CleanupError;
use super::host::CleanupHost;
use super::marker::{
    ensure_private_dir, read_attempt_ownership_marker, read_marker_text, read_ownership_marker,
    remove_empty_dispatch_parent, OWNERSHIP_MARKER_FILE,
};
use super::record::remove_tree;
use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};

const HOME_LAYOUT_LIMIT: usize = 60;

/// A marker file that is not recognisable as a marker of any fgOS contract (not JSON, not an object, no contract
/// name) proves nothing about whether the home holds a login. One that names a contract but is not this module's
/// own is the caller's ownership question.
fn marker_is_unrecognisable(dir: &Path) -> bool {
    let raw = match read_marker_text(dir) {
        Ok(raw) => raw,
        // A link, a pipe or an oversized file in the marker's place says nothing about the login.
        Err(err) => return matches!(err.code.as_deref(), Some("ELOOP" | "ENOTREGULAR" | "E2BIG")),
    };
    match serde_json::from_str::<Value>(&raw) {
        Ok(Value::Object(map)) => !map.get("contract").is_some_and(Value::is_string),
        _ => true,
    }
}

/// Deletes a confinement directory of a dispatch outside the assignment door. Such a home is never written back,
/// and an attempt home is removed only by adopt's finalize-home step, never through this door. `host`: end
/// whatever still runs from inside first.
pub fn remove_confinement_dir(
    dir: &Path,
    host: Option<&dyn CleanupHost>,
) -> Result<(), CleanupError> {
    if read_attempt_ownership_marker(dir).is_some() {
        return Err(CleanupError::new("attempt-home-owned-by-adopt"));
    }
    if let Some(host) = host {
        let left = host.stop_inside(dir);
        if !left.is_empty() {
            let pids = left
                .iter()
                .map(u32::to_string)
                .collect::<Vec<_>>()
                .join(", ");
            return Err(CleanupError::new(format!("confinement-dir-in-use: pid {pids} still runs from the directory or has no readable identity")));
        }
    }
    // A marker file that is there but cannot be recognised does not prove the home holds no login: leave it alone.
    if read_ownership_marker(dir).is_none() && marker_is_unrecognisable(dir) {
        return Err(CleanupError::new("ownership-marker-unreadable"));
    }
    remove_tree(dir)
}

/// The outcome of [`cleanup_confinement_resource`].
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Cleaned {
    Removed {
        path: PathBuf,
        dispatch_id: String,
    },
    Kept {
        reason: &'static str,
        error: Option<String>,
    },
}

impl Cleaned {
    pub fn is_cleaned(&self) -> bool {
        matches!(self, Self::Removed { .. })
    }

    fn kept(reason: &'static str) -> Self {
        Self::Kept {
            reason,
            error: None,
        }
    }
}

/// Cleans up a single confinement resource safely: only when its ownership marker matches `dispatch_id` (any
/// when none is given).
pub fn cleanup_confinement_resource(
    dir: &Path,
    dispatch_id: Option<&str>,
    host: &dyn CleanupHost,
) -> Cleaned {
    if dir.as_os_str().is_empty() || !dir.exists() {
        return Cleaned::kept("not-found");
    }
    let Some(marker) = read_ownership_marker(dir) else {
        return Cleaned::kept("missing-or-invalid-marker");
    };
    let owner = marker
        .get("dispatchId")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string();
    if dispatch_id.is_some_and(|id| !id.is_empty() && owner != id) {
        return Cleaned::kept("dispatch-id-mismatch");
    }
    // Whatever still runs from inside a resource that is being deleted is a leftover of its dispatch.
    match remove_confinement_dir(dir, Some(host)) {
        Ok(()) => {
            remove_empty_dispatch_parent(dir, &owner);
            Cleaned::Removed {
                path: dir.to_path_buf(),
                dispatch_id: owner,
            }
        }
        Err(err) => Cleaned::Kept {
            reason: "removal-failed",
            error: Some(err.message),
        },
    }
}

/// What `keep_session_transcript` copied; `found` is false when the home has no such directory.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Transcript {
    pub found: bool,
    pub files: u64,
    pub bytes: u64,
}

/// Copies the session directory of an attempt home into `dest` (0700 directories, 0600 files) before the home is
/// removed. `session_dir` is a relative path inside the home; no part of it, nor any entry under it, may be a
/// symbolic link, so a link the agent planted cannot pull a file from outside the home. A file already in `dest`
/// is never overwritten. When the copy fails, what this call created is removed again.
pub fn keep_session_transcript(
    home: &Path,
    session_dir: &str,
    dest: &Path,
    root: Option<&Path>,
) -> Result<Transcript, CleanupError> {
    let parts: Vec<&str> = session_dir.split(['/', '\\']).collect();
    if session_dir.is_empty() || Path::new(session_dir).is_absolute() || parts.contains(&"..") {
        return Err(CleanupError::new(format!(
            "session directory \"{session_dir}\" must be a relative path without \"..\""
        )));
    }
    let root = root.unwrap_or(dest);
    let mut source = home.to_path_buf();
    for part in parts.iter().filter(|p| !p.is_empty()) {
        source.push(part);
        if refuse_symlink(&source, "the session directory of the attempt home", true)?.is_none() {
            return Ok(Transcript {
                found: false,
                files: 0,
                bytes: 0,
            });
        }
    }
    let meta = fs::symlink_metadata(&source).map_err(|e| CleanupError::io(&e, "lstat", &source))?;
    if !meta.is_dir() {
        return Err(CleanupError::new(format!(
            "{session_dir} in the attempt home is not a directory"
        )));
    }
    let mut created_files: Vec<PathBuf> = Vec::new();
    let mut created_dirs: Vec<PathBuf> = Vec::new();
    let mut bytes = 0u64;
    let copied = copy_dir(
        &source,
        dest,
        root,
        &mut created_files,
        &mut created_dirs,
        &mut bytes,
    );
    if let Err(err) = copied {
        for file in &created_files {
            let _ = fs::remove_file(file);
        }
        for dir in created_dirs.iter().rev() {
            let _ = fs::remove_dir(dir);
        }
        return Err(err);
    }
    Ok(Transcript {
        found: true,
        files: created_files.len() as u64,
        bytes,
    })
}

fn copy_dir(
    from: &Path,
    to: &Path,
    root: &Path,
    files: &mut Vec<PathBuf>,
    dirs: &mut Vec<PathBuf>,
    bytes: &mut u64,
) -> Result<(), CleanupError> {
    if !to.exists() {
        ensure_private_dir(to, Some(root))?;
        dirs.push(to.to_path_buf());
    }
    let read = fs::read_dir(from).map_err(|e| CleanupError::io(&e, "scandir", from))?;
    let mut names: Vec<_> = read.filter_map(Result::ok).map(|e| e.file_name()).collect();
    names.sort();
    for name in names {
        let entry = from.join(&name);
        let meta = refuse_symlink(&entry, "the session directory of the attempt home", false)?
            .expect("a required lstat is Some");
        let target = to.join(&name);
        if meta.is_dir() {
            copy_dir(&entry, &target, root, files, dirs, bytes)?;
            continue;
        }
        if !meta.is_file() {
            return Err(CleanupError::new(format!(
                "{} is not a regular file",
                entry.display()
            )));
        }
        copy_exclusive(&entry, &target)?;
        files.push(target.clone());
        set_private_file(&target)?;
        *bytes += meta.len();
    }
    Ok(())
}

/// `COPYFILE_EXCL`: an existing destination is `EEXIST`, never overwritten.
fn copy_exclusive(from: &Path, to: &Path) -> Result<(), CleanupError> {
    let fail = |err: std::io::Error| {
        let base = CleanupError::io(&err, "copyfile", from);
        CleanupError {
            message: format!("{} -> '{}'", base.message, to.display()),
            ..base
        }
    };
    let mut source = fs::File::open(from).map_err(fail)?;
    let mut dest = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(to)
        .map_err(fail)?;
    std::io::copy(&mut source, &mut dest).map_err(fail)?;
    Ok(())
}

fn set_private_file(path: &Path) -> Result<(), CleanupError> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(path, fs::Permissions::from_mode(0o600))
            .map_err(|e| CleanupError::io(&e, "chmod", path))?;
    }
    let _ = path;
    Ok(())
}

/// One entry of [`describe_attempt_home`]: a path inside the home, its kind, and the files and bytes under it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HomeEntry {
    pub path: String,
    pub kind: &'static str,
    pub files: u64,
    pub bytes: u64,
}

fn measure_tree(dir: &Path) -> (u64, u64) {
    let (mut files, mut bytes) = (0, 0);
    let Ok(read) = fs::read_dir(dir) else {
        return (0, 0);
    };
    for entry in read.filter_map(Result::ok) {
        let Ok(kind) = entry.file_type() else {
            continue;
        };
        if kind.is_dir() {
            let (f, b) = measure_tree(&entry.path());
            files += f;
            bytes += b;
        } else if kind.is_file() {
            files += 1;
            bytes += fs::symlink_metadata(entry.path()).map_or(0, |m| m.len());
        }
    }
    (files, bytes)
}

/// What an attempt home holds, by name and size only (never content): its top-level entries and the entries one
/// level into each directory, at most 60. The ownership marker is left out.
pub fn describe_attempt_home(home: &Path) -> Vec<HomeEntry> {
    let mut layout = Vec::new();
    visit(home, "", 0, &mut layout);
    layout
}

fn visit(dir: &Path, prefix: &str, depth: u8, layout: &mut Vec<HomeEntry>) {
    let Ok(read) = fs::read_dir(dir) else { return };
    let mut entries: Vec<_> = read.filter_map(Result::ok).collect();
    entries.sort_by_key(|e| e.file_name());
    for entry in entries {
        if layout.len() >= HOME_LAYOUT_LIMIT {
            return;
        }
        let name = entry.file_name().to_string_lossy().into_owned();
        if prefix.is_empty() && name == OWNERSHIP_MARKER_FILE {
            continue;
        }
        let rel = if prefix.is_empty() {
            name
        } else {
            format!("{prefix}/{name}")
        };
        let Ok(kind) = entry.file_type() else {
            continue;
        };
        let path = entry.path();
        if kind.is_dir() {
            let (files, bytes) = measure_tree(&path);
            layout.push(HomeEntry {
                path: rel.clone(),
                kind: "dir",
                files,
                bytes,
            });
            if depth < 1 {
                visit(&path, &rel, depth + 1, layout);
            }
        } else if kind.is_file() {
            let bytes = fs::symlink_metadata(&path).map_or(0, |m| m.len());
            layout.push(HomeEntry {
                path: rel,
                kind: "file",
                files: 1,
                bytes,
            });
        } else {
            let kind = if kind.is_symlink() { "link" } else { "other" };
            layout.push(HomeEntry {
                path: rel,
                kind,
                files: 0,
                bytes: 0,
            });
        }
    }
}
