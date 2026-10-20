use std::fmt;

/// A resolved value. It has no `Display`, and `Debug` never shows the text.
#[derive(Clone, PartialEq, Eq)]
pub struct SecretValue(String);

impl SecretValue {
    pub fn new(value: impl Into<String>) -> Self {
        Self(value.into())
    }

    /// The only way to read the text; call it at the point of use.
    pub fn expose(&self) -> &str {
        &self.0
    }
}

impl fmt::Debug for SecretValue {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("SecretValue(<redacted>)")
    }
}

/// Answer of [`SecretSource::get`].
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Lookup {
    Found(SecretValue),
    Absent,
    /// The source cannot answer without a prompt or is unhealthy; the
    /// resolver goes to the next source.
    Unavailable,
}

/// Why a source's own health check failed. Text carries paths and modes
/// only, never a value.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CheckFailure {
    Missing(String),
    Symlink(String),
    NotRegularFile(String),
    /// The file grants access beyond its owner; `mode` is the permission bits.
    ModeTooWide {
        path: String,
        mode: u32,
    },
    WrongOwner {
        path: String,
    },
    Io {
        path: String,
        kind: String,
    },
}

impl fmt::Display for CheckFailure {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Missing(p) => write!(f, "{p}: not found"),
            Self::Symlink(p) => write!(f, "{p}: is a symlink, refused"),
            Self::NotRegularFile(p) => write!(f, "{p}: not a regular file"),
            Self::ModeTooWide { path, mode } => {
                write!(
                    f,
                    "{path}: mode {mode:04o} is readable beyond the owner, expected 0600"
                )
            }
            Self::WrongOwner { path } => write!(f, "{path}: not owned by the current user"),
            Self::Io { path, kind } => write!(f, "{path}: {kind}"),
        }
    }
}

impl std::error::Error for CheckFailure {}

/// Where a value is read from. An implementation never prompts, never reads
/// stdin and never rewrites its backing store.
pub trait SecretSource {
    /// The value, `Absent`, or `Unavailable`. A source that failed `check`
    /// must answer `Unavailable` and read nothing.
    fn get(&self, name: &str) -> Lookup;
    /// Presence only, for status output.
    fn has(&self, name: &str) -> bool;
    /// Where this source looks, in words and paths. Never a value.
    fn describe(&self) -> String;
    /// The source's own health.
    fn check(&self) -> Result<(), CheckFailure>;
}
