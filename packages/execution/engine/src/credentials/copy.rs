//! Copy an explicit allow-list of login files from a credential home into a private home.

use std::fs;
use std::path::{Component, Path};

use super::files::{make_dir, set_mode};
use super::ports::SqliteAdapter;

pub struct CopyOptions<'a> {
    pub sqlite: &'a dyn SqliteAdapter,
    /// A listed path that does not exist at all is left out instead of failing (a dangling link, a link out of
    /// the home or a non-file still fails).
    pub skip_missing: bool,
}

/// Copy `files` of `source_home` into `destination_root`, at the same relative paths, and return those copied.
/// A missing, escaping or non-regular entry is an `Err(message)`. A listed `agent.db` is copied as a SQLite
/// snapshot (consistent, WAL included) when an engine is available, and as a plain file otherwise.
pub fn copy_credential_files(
    destination_root: &Path,
    source_home: &Path,
    files: &[String],
    options: &CopyOptions<'_>,
) -> Result<Vec<String>, String> {
    let real_home = fs::canonicalize(source_home)
        .map_err(|e| format!("selected credential home is not readable: {}", e.kind()))?;
    let mut copied = Vec::new();
    for rel in files {
        let path = Path::new(rel);
        if rel.trim().is_empty()
            || path.is_absolute()
            || rel.split(['/', '\\']).any(|s| s == "..")
            || path
                .components()
                .any(|c| matches!(c, Component::ParentDir | Component::Prefix(_)))
        {
            return Err(format!(
                "credential file {rel:?} must be a relative path without \"..\"."
            ));
        }
        if options.skip_missing
            && matches!(fs::symlink_metadata(real_home.join(rel)), Err(e) if e.kind() == std::io::ErrorKind::NotFound)
        {
            continue;
        }
        let real_source = fs::canonicalize(real_home.join(rel))
            .map_err(|_| format!("selected credential file \"{rel}\" is missing"))?;
        if !real_source.starts_with(&real_home)
            || real_source == real_home
            || !fs::metadata(&real_source).is_ok_and(|m| m.is_file())
        {
            return Err(format!("selected credential file \"{rel}\" is not a regular file inside the credential home"));
        }
        let destination = destination_root.join(rel);
        let copy_err = |e: std::io::Error| {
            format!(
                "selected credential file \"{rel}\" could not be copied: {}",
                e.kind()
            )
        };
        if let Some(parent) = destination.parent() {
            make_dir(parent, true)
                .or_else(|e| if parent.is_dir() { Ok(()) } else { Err(e) })
                .map_err(copy_err)?;
        }
        let is_store = path.file_name().is_some_and(|n| n == "agent.db");
        if !(is_store && options.sqlite.snapshot(&real_source, &destination)) {
            // With an engine, a failed snapshot means the copy may lack what is still in the write-ahead log:
            // say so (the name only, no value) and go on.
            if is_store && options.sqlite.available() {
                eprintln!("fgos: credential snapshot of agent.db failed (credential-snapshot-failed); copying the file as it is");
            }
            fs::copy(&real_source, &destination).map_err(copy_err)?;
        }
        // Credentials stay owner-only; a listed helper binary keeps its exec bit.
        let exec = executable(&real_source);
        set_mode(&destination, if exec { 0o700 } else { 0o600 }).map_err(copy_err)?;
        copied.push(rel.clone());
    }
    Ok(copied)
}

fn executable(file: &Path) -> bool {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::metadata(file).is_ok_and(|m| m.permissions().mode() & 0o100 != 0)
    }
    #[cfg(not(unix))]
    {
        let _ = file;
        false
    }
}
