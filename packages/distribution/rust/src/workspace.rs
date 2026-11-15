//! Workspace root, workspaceId, and workStateId resolution.
//!
//! Follows the Git Common Directory Discovery contract in
//! `docs/platform/packaging-distribution/contracts/activation-binding.md`
//! (under Init Pipeline And Root Binding) for workspace root discovery: the
//! main checkout of the repository holding the start directory, as the Git
//! component resolves it (never the linked worktree's own top level).
//!
//! Per R2:
//! - `workspaceId` = first 16 hex chars of `sha256(realpath(workspace root))`
//! - `workStateId` = `workspaceId` in V1

use fgos_git::invocation_root::{
    read_repo_facts, resolve_invocation_root_with, RepoFacts, RootPolicy, RootRequest,
};
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

/// Resolves the workspace root: the trusted main checkout of the repository holding `start_dir`, asked of the
/// root door in `fgos-git` under its destructive-verb policy (main checkout only, no `--dir`), so a linked
/// worktree answers with its main checkout and the repository is read from disk with no Git child.
/// Refuses outside a git repository with `WorkspaceError::NotGitRepository`; a repository Git cannot trust is
/// `WorkspaceError::GitCommand` with the door's own text.
pub fn workspace_root_of(start_dir: &Path) -> Result<PathBuf, WorkspaceError> {
    let outside_repository = std::cell::Cell::new(false);
    let read = |path: &Path| {
        let facts = read_repo_facts(path);
        if matches!(facts, Ok(RepoFacts::NotARepository)) {
            outside_repository.set(true);
        }
        facts
    };
    let request = RootRequest {
        cwd: start_dir,
        dir: None,
        policy: RootPolicy::MainCheckoutOnly,
        home: None,
    };
    let root = resolve_invocation_root_with(&request, &read).map_err(|refusal| {
        if outside_repository.get() {
            WorkspaceError::NotGitRepository
        } else {
            WorkspaceError::GitCommand(refusal.message)
        }
    })?;
    let canonical = std::fs::canonicalize(root.root)?;
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
    fn test_workspace_root_of_current_repo() {
        let cwd = std::env::current_dir().expect("cwd must succeed");
        let root = workspace_root_of(&cwd).expect("current repo must resolve root");
        assert!(root.exists());
        assert!(root.join(".git").exists() || root.join("package.json").exists());
    }

    #[test]
    fn test_workspace_root_of_non_git_refused() {
        let temp = crate::test_scratch::scratch("non-git");
        let res = workspace_root_of(&temp);
        assert!(matches!(res, Err(WorkspaceError::NotGitRepository)));
    }

    fn git(dir: &Path, args: &[&str]) {
        let status = std::process::Command::new("git")
            .arg("-C")
            .arg(dir)
            .args(["-c", "user.name=t", "-c", "user.email=t@t"])
            .args(args)
            .status()
            .expect("git runs");
        assert!(status.success(), "git {args:?}");
    }

    #[test]
    fn test_workspace_root_of_subdirectory_and_linked_worktree_is_the_main_checkout() {
        let scratch_dir = crate::test_scratch::scratch("fgctl-root");
        let base = std::fs::canonicalize(&*scratch_dir).unwrap();
        let main = base.join("main");
        std::fs::create_dir_all(main.join("docs")).unwrap();
        git(&main, &["init", "-q", "-b", "main"]);
        std::fs::write(main.join("docs").join("a.md"), "x").unwrap();
        git(&main, &["add", "."]);
        git(&main, &["commit", "-q", "-m", "seed"]);
        let linked = base.join("linked");
        git(
            &main,
            &[
                "worktree",
                "add",
                "-q",
                linked.to_str().unwrap(),
                "-b",
                "wt",
            ],
        );

        assert_eq!(workspace_root_of(&main).unwrap(), main);
        assert_eq!(workspace_root_of(&main.join("docs")).unwrap(), main);
        assert_eq!(workspace_root_of(&linked).unwrap(), main);
    }
}
