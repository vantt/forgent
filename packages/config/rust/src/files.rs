//! File rules (spec sections 3 and 9): a config file is opened beneath the root it belongs to
//! without following a symlink, read once with its revision, and chosen as the one source of its
//! scope. The no-follow open itself lives in Durable File; this module maps its refusals to failure
//! ids and applies the selection and mode rules.
use crate::error::ConfigRefusal;
use std::io;
use std::path::Path;

pub const YAML_NAME: &str = "config.yaml";
pub const JSON_NAME: &str = "config.json";
/// The text a migrated project's `config.json` holds; it is not a source (section 13).
pub const TOMBSTONE: &str = "moved to .fgos/config.yaml; upgrade fgOS";
/// Modes a write creates and keeps: the global, accounts and token files, and `~/.fgos/private`.
pub const PRIVATE_FILE_MODE: u32 = 0o600;
pub const PRIVATE_DIR_MODE: u32 = 0o700;

/// A refusal by id, or an operating-system error that has no failure id (a permission problem).
#[derive(Debug)]
pub enum FileError {
    Refused(Box<ConfigRefusal>),
    Io(io::Error),
}

/// One file read through the descriptor that was opened: bytes, their revision, the permission bits
/// and the identity of the directory holding it.
#[derive(Debug)]
pub struct LoadedFile {
    pub bytes: Vec<u8>,
    pub revision: String,
    pub mode: u32,
    pub parent: (u64, u64),
}

/// The one source of a scope.
#[derive(Debug)]
pub enum Source {
    Absent,
    Yaml(LoadedFile),
    LegacyJson(LoadedFile),
}

/// A mode that differs from the expected one. A read still succeeds; fixing it is doctor's.
#[derive(Debug, PartialEq, Eq)]
pub struct ModeFinding {
    pub file: String,
    pub expected: u32,
    pub actual: u32,
}

pub fn check_mode(file: &str, actual: u32, expected: u32) -> Option<ModeFinding> {
    (actual != expected).then(|| ModeFinding {
        file: file.to_string(),
        expected,
        actual,
    })
}

fn refusal(code: &'static str, file: &str) -> FileError {
    FileError::Refused(Box::new(ConfigRefusal::new(code).in_file(file)))
}

/// Read `relative` beneath `root`. `Ok(None)` when the file or a directory above it is missing;
/// a symlink anywhere, a path leaving the root or a non-regular file is `config-path-symlink`; a
/// file over `max` bytes is `config-parse` (rule `input-too-large`).
#[cfg(unix)]
pub fn read_beneath(
    root: &Path,
    relative: &Path,
    max: usize,
) -> Result<Option<LoadedFile>, FileError> {
    use fgos_durable_file::{open_beneath, BeneathError, BeneathRefusal};
    let name = relative.to_string_lossy();
    let map = |error: BeneathError| match error {
        BeneathError::Refused(BeneathRefusal::TooLarge) => {
            let yaml = fgos_yaml_doc::Refusal::new("input-too-large").with_file(&name);
            FileError::Refused(Box::new(ConfigRefusal {
                yaml: Some(Box::new(yaml)),
                ..ConfigRefusal::new("config-parse").in_file(&name)
            }))
        }
        BeneathError::Refused(_) => refusal("config-path-symlink", &name),
        BeneathError::Io(error) => FileError::Io(error),
    };
    let Some(opened) = open_beneath(root, relative).map_err(map)? else {
        return Ok(None);
    };
    let mode = opened.mode().map_err(map)?;
    let identity = opened.parent_identity();
    let read = opened.read(max).map_err(map)?;
    Ok(Some(LoadedFile {
        bytes: read.bytes,
        revision: read.revision,
        mode,
        parent: (identity.dev, identity.ino),
    }))
}

/// No no-follow open exists here, so a file rule cannot be enforced.
#[cfg(not(unix))]
pub fn read_beneath(
    _root: &Path,
    relative: &Path,
    _max: usize,
) -> Result<Option<LoadedFile>, FileError> {
    Err(refusal(
        "config-platform-unsupported",
        &relative.to_string_lossy(),
    ))
}

/// A `config.json` whose whole content is the tombstone (with or without one final newline).
fn is_tombstone(bytes: &[u8]) -> bool {
    let text = TOMBSTONE.as_bytes();
    bytes == text
        || (bytes.len() == text.len() + 1 && bytes.starts_with(text) && bytes.ends_with(b"\n"))
}

/// Choose the one source of the scope whose directory is `dir` beneath `root` (`.fgos` for a
/// project; the directory must be named, not `.`).
/// Both files present is `config-legacy-shadowed`; a tombstone alone is no source.
pub fn select_source(root: &Path, dir: &Path, max: usize) -> Result<Source, FileError> {
    let yaml = read_beneath(root, &dir.join(YAML_NAME), max)?;
    let json =
        read_beneath(root, &dir.join(JSON_NAME), max)?.filter(|json| !is_tombstone(&json.bytes));
    match (yaml, json) {
        (Some(_), Some(_)) => Err(refusal(
            "config-legacy-shadowed",
            &dir.join(JSON_NAME).to_string_lossy(),
        )),
        (Some(yaml), None) => Ok(Source::Yaml(yaml)),
        (None, Some(json)) => Ok(Source::LegacyJson(json)),
        (None, None) => Ok(Source::Absent),
    }
}
