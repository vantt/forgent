//! The mailbox's record directory, for the hook kind and the verbs alike:
//! `<main checkout>/.fgos` (spec §6.4). The start directory is
//! `CLAUDE_PROJECT_DIR` when it is set and names a directory (Claude Code's
//! hook cwd follows the model's `cd`, while that variable stays on the
//! project; measured at V5), else the process's cwd (Codex runs each tool
//! in a fresh shell, so its hook keeps the session directory). The main
//! checkout comes from the Git component's disk-only read, so no `git`
//! process runs and nothing is written; a linked worktree resolves to its
//! main checkout. The root a native request carries (`--dir`, the nearest
//! `.fgos`) is never used.
use std::ffi::OsStr;
use std::path::{Path, PathBuf};

/// Why there is no record directory.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RootError {
    /// The start directory is in no repository.
    NoRepository,
    /// The main checkout has no `.fgos` directory.
    NoFgosDir(PathBuf),
    /// The checkout is one the main-checkout read refuses for good (a
    /// submodule, a separate git directory, a worktree whose links do not
    /// name each other), with the Git component's cause.
    UnsupportedCheckout(String),
    /// The repository could not be read (an unreadable directory).
    Unreadable(String),
}

impl RootError {
    /// The fixed word the verbs' record-error text names.
    pub fn code(&self) -> &'static str {
        match self {
            Self::NoRepository => "no-repository",
            Self::NoFgosDir(_) => "no-fgos-dir",
            Self::UnsupportedCheckout(_) => "unsupported-checkout",
            Self::Unreadable(_) => "repository-unreadable",
        }
    }

    /// Whether trying again cannot change the answer.
    pub fn is_permanent(&self) -> bool {
        !matches!(self, Self::Unreadable(_))
    }
}

/// The Git component's causes for a checkout it will not read as trusted.
const UNSUPPORTED_CAUSES: [&str; 2] = ["untrusted-worktree", "trusted-main-gitfile-unsupported"];

/// `<main checkout>/.fgos` for a process whose `CLAUDE_PROJECT_DIR` is
/// `claude_project_dir` and whose cwd is `cwd`.
pub fn mailbox_fgos_dir(
    claude_project_dir: Option<&OsStr>,
    cwd: &Path,
) -> Result<PathBuf, RootError> {
    let start = claude_project_dir
        .filter(|dir| !dir.is_empty())
        .map(Path::new)
        .filter(|dir| dir.is_dir())
        .unwrap_or(cwd);
    let main = fgos_git::main_checkout_root(start)
        .map_err(|error| {
            if UNSUPPORTED_CAUSES.contains(&error.cause.as_str()) {
                RootError::UnsupportedCheckout(error.cause)
            } else {
                RootError::Unreadable(error.cause)
            }
        })?
        .ok_or(RootError::NoRepository)?;
    let fgos_dir = main.join(".fgos");
    if fgos_dir.is_dir() {
        Ok(fgos_dir)
    } else {
        Err(RootError::NoFgosDir(fgos_dir))
    }
}

/// The project name a binding carries: the main checkout's folder name.
pub fn project_name(fgos_dir: &Path) -> String {
    fgos_dir
        .parent()
        .and_then(Path::file_name)
        .map(|name| name.to_string_lossy().into_owned())
        .unwrap_or_default()
}
