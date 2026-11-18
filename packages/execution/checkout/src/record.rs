//! The provisioning record: what `provision` placed in one checkout, so `remove` can take back exactly those bytes.
//!
//! One file per checkout under `<state root>/worktree-provisioning/`, named by the sha256 of the checkout's real
//! path text. The file name, the identity numbers and the JSON layout are the ones Node wrote: a record written
//! here is read by Node and the reverse while both exist.

use crate::{Error, ErrorKind, Result};
use serde::Serialize;
use serde_json::{value::RawValue, Value};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};

pub const CONTRACT: &str = "worktree-provisioning.v1";
const DIRECTORY: &str = "worktree-provisioning";

/// One path the record names.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Placed {
    Dir { path: String },
    File { path: String, sha256: String },
    Symlink { path: String, target: String },
}

impl Placed {
    pub fn path(&self) -> &str {
        match self {
            Self::Dir { path } | Self::File { path, .. } | Self::Symlink { path, .. } => path,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Record {
    pub worktree: String,
    pub dev: u64,
    pub ino: u64,
    pub regenerable: Vec<String>,
    pub placed: Vec<Placed>,
    pub disposable: bool,
}

// ---- the path Node calls realpathOrSelf -------------------------------------------------------------------

/// `\\?\UNC\srv\share` becomes `\\srv\share`, `\\?\C:\x` becomes `C:\x`; anything else is unchanged.
pub fn strip_extended_prefix(p: &str) -> String {
    if let Some(rest) = p.strip_prefix("\\\\?\\UNC\\") {
        return format!("\\\\{rest}");
    }
    if let Some(rest) = p.strip_prefix("\\\\?\\") {
        return rest.to_owned();
    }
    p.to_owned()
}

fn normalize_segments<'a>(
    segments: impl Iterator<Item = &'a str>,
    allow_above_root: bool,
) -> Vec<&'a str> {
    let mut out: Vec<&str> = Vec::new();
    for segment in segments {
        match segment {
            "" | "." => {}
            ".." => {
                if matches!(out.last(), Some(last) if *last != "..") {
                    out.pop();
                } else if allow_above_root {
                    out.push("..");
                }
            }
            other => out.push(other),
        }
    }
    out
}

/// Node's `path.posix.normalize`.
pub fn normalize_posix(p: &str) -> String {
    if p.is_empty() {
        return ".".into();
    }
    let absolute = p.starts_with('/');
    let trailing = p.ends_with('/');
    let tail = normalize_segments(p.split('/'), !absolute).join("/");
    if tail.is_empty() {
        if absolute {
            return "/".into();
        }
        return if trailing { "./".into() } else { ".".into() };
    }
    let tail = if trailing { format!("{tail}/") } else { tail };
    if absolute {
        format!("/{tail}")
    } else {
        tail
    }
}

/// Node's `path.win32.normalize`: separators become `\`, a drive or UNC root is kept, `.` and `..` fold.
pub fn normalize_win32(p: &str) -> String {
    if p.is_empty() {
        return ".".into();
    }
    let s = p.replace('/', "\\");
    let trailing = s.ends_with('\\');
    let (device, rest, absolute): (Option<String>, &str, bool) =
        if let Some(unc) = s.strip_prefix("\\\\") {
            let mut parts = unc.splitn(3, '\\');
            let (server, share, rest) = (
                parts.next().unwrap_or(""),
                parts.next(),
                parts.next().unwrap_or(""),
            );
            match share {
                Some(share) if !server.is_empty() && !share.is_empty() => {
                    (Some(format!("\\\\{server}\\{share}")), rest, true)
                }
                _ => (None, &s[1..], true),
            }
        } else if let Some(rooted) = s.strip_prefix('\\') {
            (None, rooted, true)
        } else if s.len() >= 2 && s.as_bytes()[1] == b':' && s.as_bytes()[0].is_ascii_alphabetic() {
            let rest = &s[2..];
            match rest.strip_prefix('\\') {
                Some(after) => (Some(s[..2].to_owned()), after, true),
                None => (Some(s[..2].to_owned()), rest, false),
            }
        } else {
            (None, &s[..], false)
        };
    let tail = normalize_segments(rest.split('\\'), !absolute).join("\\");
    let tail = if !tail.is_empty() && trailing {
        format!("{tail}\\")
    } else {
        tail
    };
    match (device, absolute) {
        (Some(device), true) => format!("{device}\\{tail}"),
        (Some(device), false) => {
            if tail.is_empty() {
                device
            } else {
                format!("{device}{tail}")
            }
        }
        (None, true) => format!("\\{tail}"),
        (None, false) => {
            if tail.is_empty() {
                ".".into()
            } else {
                tail
            }
        }
    }
}

/// The text Node's `realpathOrSelf` gives for an already resolved path.
pub fn canonical_text(resolved: &str, windows: bool) -> String {
    let stripped = strip_extended_prefix(resolved);
    if windows {
        normalize_win32(&stripped)
    } else {
        normalize_posix(&stripped)
    }
}

/// Node's `realpathOrSelf`: the real path with the `\\?\` prefix stripped and separators normalized, or the
/// normalized absolute path when `p` does not exist. Never Rust's raw `canonicalize` result.
pub fn realpath_or_self(p: &Path) -> String {
    let windows = cfg!(windows);
    match fs::canonicalize(p) {
        Ok(real) => canonical_text(&real.to_string_lossy(), windows),
        Err(_) => {
            let absolute = if p.is_absolute() {
                p.to_path_buf()
            } else {
                std::env::current_dir().map_or_else(|_| p.to_path_buf(), |cwd| cwd.join(p))
            };
            canonical_text(&absolute.to_string_lossy(), windows)
        }
    }
}

/// The record file name stem: sha256 of the checkout's real path text.
pub fn record_key(real_path_text: &str) -> String {
    Sha256::digest(real_path_text.as_bytes())
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect()
}

pub fn record_path(state_root: &Path, worktree: &Path) -> PathBuf {
    state_root
        .join(DIRECTORY)
        .join(format!("{}.json", record_key(&realpath_or_self(worktree))))
}

// ---- the identity numbers ---------------------------------------------------------------------------------

/// A device or inode as Node holds it: the integer rounded to the nearest f64 (`fs.statSync` returns JS numbers).
pub fn js_number(value: u64) -> f64 {
    value as f64
}

/// The digits `JSON.stringify` prints for that number: shortest round-trip digits, zero-padded, no exponent.
pub fn js_number_text(value: u64) -> String {
    format!("{}", js_number(value))
}

/// The `{dev, ino}` of the directory at `path`, following links, as `fs.statSync` reports them on this OS.
pub fn stat_identity(path: &Path) -> std::io::Result<(u64, u64)> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        let m = fs::metadata(path)?;
        Ok((m.dev(), m.ino()))
    }
    #[cfg(windows)]
    {
        use std::os::windows::{fs::OpenOptionsExt, io::AsRawHandle};
        use windows_sys::Win32::Storage::FileSystem::{
            GetFileInformationByHandle, BY_HANDLE_FILE_INFORMATION, FILE_FLAG_BACKUP_SEMANTICS,
        };
        let file = fs::OpenOptions::new()
            .read(true)
            .custom_flags(FILE_FLAG_BACKUP_SEMANTICS)
            .open(path)?;
        // SAFETY: the handle is open for the duration of the call and the struct is plain data.
        let mut info: BY_HANDLE_FILE_INFORMATION = unsafe { std::mem::zeroed() };
        if unsafe { GetFileInformationByHandle(file.as_raw_handle() as _, &mut info) } == 0 {
            return Err(std::io::Error::last_os_error());
        }
        Ok((
            u64::from(info.dwVolumeSerialNumber),
            (u64::from(info.nFileIndexHigh) << 32) | u64::from(info.nFileIndexLow),
        ))
    }
}

// ---- reading and writing the file -------------------------------------------------------------------------

#[derive(Serialize)]
struct PlacedOut<'a> {
    path: &'a str,
    kind: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    target: Option<&'a str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    sha256: Option<&'a str>,
}

#[derive(Serialize)]
struct IdentityOut {
    dev: Box<RawValue>,
    ino: Box<RawValue>,
}

#[derive(Serialize)]
struct RecordOut<'a> {
    contract: &'static str,
    worktree: &'a str,
    identity: IdentityOut,
    regenerable: &'a [String],
    placed: Vec<PlacedOut<'a>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    disposable: Option<bool>,
}

impl Record {
    /// The file text Node's `JSON.stringify(record, null, 2)` plus a newline would give.
    pub fn to_text(&self) -> Result<String> {
        let raw = |value: u64| {
            RawValue::from_string(js_number_text(value))
                .map_err(|e| Error::new(ErrorKind::Io, e.to_string()))
        };
        let out = RecordOut {
            contract: CONTRACT,
            worktree: &self.worktree,
            identity: IdentityOut {
                dev: raw(self.dev)?,
                ino: raw(self.ino)?,
            },
            regenerable: &self.regenerable,
            placed: self
                .placed
                .iter()
                .map(|p| match p {
                    Placed::Dir { path } => PlacedOut {
                        path,
                        kind: "dir",
                        target: None,
                        sha256: None,
                    },
                    Placed::File { path, sha256 } => PlacedOut {
                        path,
                        kind: "file",
                        target: None,
                        sha256: Some(sha256),
                    },
                    Placed::Symlink { path, target } => PlacedOut {
                        path,
                        kind: "symlink",
                        target: Some(target),
                        sha256: None,
                    },
                })
                .collect(),
            disposable: self.disposable.then_some(true),
        };
        let mut text = serde_json::to_string_pretty(&out)
            .map_err(|e| Error::new(ErrorKind::Io, e.to_string()))?;
        text.push('\n');
        Ok(text)
    }

    /// Parse record text; `None` when it is not a record of this contract. Identity is not judged here.
    pub fn from_text(text: &str) -> Option<Self> {
        let value: Value = serde_json::from_str(text).ok()?;
        if value.get("contract")?.as_str()? != CONTRACT {
            return None;
        }
        let strings = |key: &str| -> Vec<String> {
            value
                .get(key)
                .and_then(Value::as_array)
                .map(|a| {
                    a.iter()
                        .filter_map(|v| v.as_str().map(str::to_owned))
                        .collect()
                })
                .unwrap_or_default()
        };
        let placed = value
            .get("placed")
            .and_then(Value::as_array)
            .map(|rows| {
                rows.iter()
                    .filter_map(|row| {
                        let path = row.get("path")?.as_str()?.to_owned();
                        match row.get("kind")?.as_str()? {
                            "dir" => Some(Placed::Dir { path }),
                            "file" => Some(Placed::File {
                                path,
                                sha256: row.get("sha256")?.as_str()?.to_owned(),
                            }),
                            "symlink" => Some(Placed::Symlink {
                                path,
                                target: row.get("target")?.as_str()?.to_owned(),
                            }),
                            _ => None,
                        }
                    })
                    .collect()
            })
            .unwrap_or_default();
        let identity = value.get("identity");
        let number = |key: &str| identity.and_then(|i| i.get(key)).and_then(Value::as_f64);
        // The numbers are kept as Node compares them: as f64. A raw u64 is recovered only for the f64 value.
        let dev = number("dev")? as u64;
        let ino = number("ino")? as u64;
        Some(Self {
            worktree: value.get("worktree")?.as_str()?.to_owned(),
            dev,
            ino,
            regenerable: strings("regenerable"),
            placed,
            disposable: value
                .get("disposable")
                .and_then(Value::as_bool)
                .unwrap_or(false),
        })
    }
}

/// Write `record` for `worktree` under `state_root`, atomically, creating the directory.
pub fn write(state_root: &Path, worktree: &Path, record: &Record) -> Result<()> {
    let file = record_path(state_root, worktree);
    let dir = file
        .parent()
        .ok_or_else(|| Error::new(ErrorKind::Io, "record path has no parent"))?;
    fs::create_dir_all(dir).map_err(|e| Error::io(format!("creating {}", dir.display()), &e))?;
    let name = file
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or_default();
    fgos_durable_file::replace_durably(dir, name, record.to_text()?.as_bytes())
        .map_err(|e| Error::new(ErrorKind::Io, format!("writing {}: {}", file.display(), e)))?;
    Ok(())
}

/// The record of `worktree`, when one exists, parses, names this contract, and was written for the directory now
/// at that path: `dev` and `ino` compared as f64, exactly as Node compared them. A record left by another
/// directory once at this path is not this checkout's.
pub fn read(state_root: &Path, worktree: &Path) -> Option<Record> {
    let text = fs::read_to_string(record_path(state_root, worktree)).ok()?;
    read_text(&text, worktree)
}

pub fn read_text(text: &str, worktree: &Path) -> Option<Record> {
    let record = Record::from_text(text)?;
    let (dev, ino) = stat_identity(worktree).ok()?;
    let value: Value = serde_json::from_str(text).ok()?;
    let same = |key: &str, now: u64| {
        value["identity"].get(key).and_then(Value::as_f64) == Some(js_number(now))
    };
    (same("dev", dev) && same("ino", ino)).then_some(record)
}

pub fn delete(state_root: &Path, worktree: &Path) {
    let _ = fs::remove_file(record_path(state_root, worktree));
}
