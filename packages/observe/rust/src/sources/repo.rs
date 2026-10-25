//! Repo observation source and helpers (Lane A2 - Phase F2).

use fgos_git::{GitDriver, RepoHandle};
use std::path::Path;

/// The repository holding `root`, opened for the Git component's typed reads;
/// `None` outside a repository or when the driver refuses it.
pub(crate) fn open_repository(root: &Path) -> Option<(GitDriver, RepoHandle)> {
    GitDriver::open_at(root).ok()?
}

/// Counts commits between two revisions through the Git component.
/// If `head_at_open` is None, counts all commits up to `head_at_close`.
/// If `head_at_close` is None, defaults to "HEAD".
pub fn count_commits_in_range(
    root: &Path,
    head_at_open: Option<&str>,
    head_at_close: Option<&str>,
) -> Result<u64, String> {
    let (driver, repo) = open_repository(root).ok_or("not a git repository")?;
    let resolve = |name: &str| {
        driver
            .resolve_commit_ref(&repo, name)
            .map_err(|e| e.cause)?
            .ok_or_else(|| format!("unknown revision {name}"))
    };
    let close = resolve(head_at_close.unwrap_or("HEAD"))?;
    let open = match head_at_open {
        Some(open) if !open.is_empty() => Some(resolve(open)?),
        _ => None,
    };
    driver
        .count_commits(&repo, &close, open.as_ref())
        .map_err(|e| e.cause)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_repo_helpers() {
        let root = Path::new(".");
        // count commits for HEAD should succeed in this git repo
        let res = count_commits_in_range(root, None, Some("HEAD"));
        assert!(res.is_ok());
        assert!(res.unwrap() > 0);
    }
}
