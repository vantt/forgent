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
    /// A checkout lifecycle step the caller must see as a worktree failure (Node: `WorktreeError`, class
    /// `worktree-fail`); `Error::details` carries the fields the Node error carries.
    Worktree,
}

#[derive(Debug)]
pub struct Error {
    pub kind: ErrorKind,
    pub message: String,
    /// The checkout the failing step ran in, when one exists (a failed setup leaves it in place).
    pub worktree_path: Option<PathBuf>,
    /// The setup command that failed.
    pub command: Option<String>,
    /// Extra fields the Node error carries, keyed as Node names them: `branch`, `worktreePath`, `orphanPath`,
    /// `targetPath`, `retainedRef`, `snapshot`, `lastSynced`, `branchTip`, and for `LockHeld` `lock`, `label`,
    /// `holders` (pids) and `timedOut`.
    pub details: Box<serde_json::Map<String, serde_json::Value>>,
}

impl Error {
    pub(crate) fn new(kind: ErrorKind, message: impl Into<String>) -> Self {
        Self {
            kind,
            message: message.into(),
            worktree_path: None,
            command: None,
            details: Box::default(),
        }
    }
    pub(crate) fn worktree(message: impl Into<String>) -> Self {
        Self::new(ErrorKind::Worktree, message)
    }
    /// Add one field the Node error carries.
    pub(crate) fn detail(mut self, key: &str, value: impl Into<serde_json::Value>) -> Self {
        self.details.insert(key.to_owned(), value.into());
        self
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
