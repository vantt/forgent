use crate::source::{CheckFailure, Lookup, SecretSource, SecretValue};
use std::fs::{File, OpenOptions};
use std::io::{ErrorKind, Read};
use std::os::unix::fs::{MetadataExt, OpenOptionsExt};
use std::path::{Path, PathBuf};

/// A file of `NAME=value` lines. It must be a regular file (never a
/// symlink), owned by the expected user, with no access for group or other.
/// It is never rewritten, and nothing is read from stdin.
///
/// Line rules: blank lines and `#` comments are skipped, an optional
/// `export ` prefix is accepted, one pair of matching surrounding quotes is
/// removed from the value, and for a repeated name the last line wins.
#[derive(Debug, Clone)]
pub struct FileSource {
    path: PathBuf,
    owner: u32,
}

impl FileSource {
    /// A source owned by the current user.
    pub fn new(path: impl Into<PathBuf>) -> Self {
        Self::with_owner(path, current_uid())
    }

    /// A source expected to be owned by `owner`.
    pub fn with_owner(path: impl Into<PathBuf>, owner: u32) -> Self {
        Self {
            path: path.into(),
            owner,
        }
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    /// Open without following a symlink and without blocking on a special
    /// file, then judge the opened file itself so a swap after the check
    /// cannot change what is read.
    fn open_verified(&self) -> Result<File, CheckFailure> {
        let shown = self.path.display().to_string();
        let file = OpenOptions::new()
            .read(true)
            .custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK | libc::O_CLOEXEC)
            .open(&self.path)
            .map_err(|e| match e.raw_os_error() {
                Some(libc::ELOOP) => CheckFailure::Symlink(shown.clone()),
                _ if e.kind() == ErrorKind::NotFound => CheckFailure::Missing(shown.clone()),
                _ => CheckFailure::Io {
                    path: shown.clone(),
                    kind: format!("{:?}", e.kind()),
                },
            })?;
        let meta = file.metadata().map_err(|e| CheckFailure::Io {
            path: shown.clone(),
            kind: format!("{:?}", e.kind()),
        })?;
        if !meta.is_file() {
            return Err(CheckFailure::NotRegularFile(shown));
        }
        if meta.uid() != self.owner {
            return Err(CheckFailure::WrongOwner { path: shown });
        }
        let mode = meta.mode() & 0o777;
        if mode & 0o077 != 0 {
            return Err(CheckFailure::ModeTooWide { path: shown, mode });
        }
        Ok(file)
    }

    /// The file text, or `None` when the file fails verification or is not UTF-8.
    fn read_verified(&self) -> Option<String> {
        let mut file = self.open_verified().ok()?;
        let mut text = String::new();
        file.read_to_string(&mut text).ok()?;
        Some(text)
    }
}

fn current_uid() -> u32 {
    // SAFETY: geteuid takes no arguments, cannot fail and touches no memory.
    // std exposes no safe way to read the effective uid.
    unsafe { libc::geteuid() }
}

fn parse_value(text: &str, name: &str) -> Option<String> {
    let mut found = None;
    for raw in text.lines() {
        let line = raw.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let line = line.strip_prefix("export ").map_or(line, str::trim_start);
        let Some((key, value)) = line.split_once('=') else {
            continue;
        };
        if key.trim() != name {
            continue;
        }
        let value = value.trim();
        let unquoted = ['"', '\'']
            .iter()
            .find_map(|q| value.strip_prefix(*q).and_then(|v| v.strip_suffix(*q)))
            .unwrap_or(value);
        found = Some(unquoted.to_owned());
    }
    found
}

impl SecretSource for FileSource {
    fn get(&self, name: &str) -> Lookup {
        match self.read_verified() {
            None => Lookup::Unavailable,
            Some(text) => parse_value(&text, name)
                .map_or(Lookup::Absent, |v| Lookup::Found(SecretValue::new(v))),
        }
    }

    fn has(&self, name: &str) -> bool {
        matches!(self.get(name), Lookup::Found(_))
    }

    fn describe(&self) -> String {
        format!("file {}", self.path.display())
    }

    fn check(&self) -> Result<(), CheckFailure> {
        self.open_verified().map(|_| ())
    }
}
