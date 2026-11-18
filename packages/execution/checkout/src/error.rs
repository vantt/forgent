use std::fmt;
use std::path::PathBuf;

/// What kind of refusal an operation ended in; a caller maps it to its own exit code or error class.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorKind {
    /// The request itself is wrong (an unknown ref, an unregistered path, a missing branch).
    Invalid,
    /// The Git port refused or failed; `Error::git_cause` carries its text.
    Git,
    /// The worktree-admin hold stayed with another process for the whole wait.
    LockHeld,
    /// A provisioning step failed (dependency install, a setup command, a skill copy). The checkout stays.
    Provision,
    /// A file operation of this crate failed.
    Io,
}

#[derive(Debug)]
pub struct Error {
    pub kind: ErrorKind,
    pub message: String,
    /// The checkout the failing step ran in, when one exists (a failed setup leaves it in place).
    pub worktree_path: Option<PathBuf>,
    /// The setup command that failed.
    pub command: Option<String>,
}

impl Error {
    pub(crate) fn new(kind: ErrorKind, message: impl Into<String>) -> Self {
        Self {
            kind,
            message: message.into(),
            worktree_path: None,
            command: None,
        }
    }
    pub(crate) fn invalid(message: impl Into<String>) -> Self {
        Self::new(ErrorKind::Invalid, message)
    }
    pub(crate) fn io(context: impl fmt::Display, error: &std::io::Error) -> Self {
        Self::new(ErrorKind::Io, format!("{context}: {error}"))
    }
    pub(crate) fn git(error: fgos_git::OperationError) -> Self {
        Self::new(ErrorKind::Git, error.cause)
    }
    pub(crate) fn at(mut self, path: &std::path::Path) -> Self {
        self.worktree_path = Some(path.to_path_buf());
        self
    }
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for Error {}
