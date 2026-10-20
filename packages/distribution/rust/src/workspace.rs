//! Workspace root, workspaceId, and workStateId resolution.
//!
//! Follows `docs/specs/distribution.md:297` for workspace root discovery: the
//! main checkout of the repository holding the start directory, as the Git
//! component resolves it (never the linked worktree's own top level).
//!
//! Per R2:
//! - `workspaceId` = first 16 hex chars of `sha256(realpath(workspace root))`
//! - `workStateId` = `workspaceId` in V1

use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};

#[derive(Debug, thiserror::Error)]
pub enum WorkspaceError {
    #[error("not a git repository (refusing outside git repository)")]
    NotGitRepository,
    #[error("git repository read refused: {0}")]
    GitCommand(String),
    #[error("failed to resolve workspace root path: {0}")]
    Io(#[from] std::io::Error),
}

/// Resolves the workspace root: the trusted main checkout of the repository
/// holding `start_dir`, read through the Git component, which creates its own
/// state root when absent (`fgos init` may run before one exists).
/// Refuses outside a git repository with `WorkspaceError::NotGitRepository`.
pub fn resolve_workspace_root(start_dir: &Path) -> Result<PathBuf, WorkspaceError> {
    let (_, repo) = fgos_git::GitDriver::open_at(start_dir)
        .map_err(|e| WorkspaceError::GitCommand(e.cause))?
        .ok_or(WorkspaceError::NotGitRepository)?;
    let canonical = std::fs::canonicalize(repo.trusted_main_root())?;
    let clean = {
        let s = canonical.to_string_lossy();
        if let Some(stripped) = s.strip_prefix(r"\\?\") {
            PathBuf::from(stripped)
        } else {
            canonical
        }
    };
    Ok(clean)
}

/// Computes `workspaceId` as the first 16 hex chars of `sha256(realpath(workspace root))`.
///
/// Matches R2 and `runtime-identity-and-activation.md` §3/§15.1.
pub fn compute_workspace_id(canonical_root: &Path) -> String {
    let mut hasher = Sha256::new();
    hasher.update(canonical_root.to_string_lossy().as_bytes());
    let hex = format!("{:x}", hasher.finalize());
    hex[..16].to_string()
}

/// In V1, `workStateId = workspaceId` (Decisions table, R2).
pub fn compute_work_state_id(workspace_id: &str) -> String {
    workspace_id.to_string()
}

/// Resolves the default `repositoryId` for V1.
pub fn compute_repository_id(workspace_id: &str) -> String {
    format!("repo_{}", workspace_id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_workspace_id_length_and_determinism() {
        let p = Path::new("/some/canonical/path");
        let id1 = compute_workspace_id(p);
        let id2 = compute_workspace_id(p);
        assert_eq!(id1.len(), 16);
        assert_eq!(id1, id2);
        assert!(id1.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn test_compute_work_state_id_equals_workspace_id() {
        let ws_id = "0123456789abcdef";
        assert_eq!(compute_work_state_id(ws_id), ws_id);
    }

    #[test]
    fn test_resolve_workspace_root_in_current_repo() {
        let cwd = std::env::current_dir().expect("cwd must succeed");
        let root = resolve_workspace_root(&cwd).expect("current repo must resolve root");
        assert!(root.exists());
        assert!(root.join(".git").exists() || root.join("package.json").exists());
    }

    #[test]
    fn test_resolve_workspace_root_non_git_refused() {
        let temp = std::env::temp_dir().join(format!("test_non_git_{}", std::process::id()));
        let _ = std::fs::create_dir_all(&temp);
        let res = resolve_workspace_root(&temp);
        assert!(matches!(res, Err(WorkspaceError::NotGitRepository)));
        let _ = std::fs::remove_dir_all(&temp);
    }
}
