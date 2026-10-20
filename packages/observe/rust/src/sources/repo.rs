//! Repo observation source and helpers (Lane A2 - Phase F2).

use fgos_git::{GitDriver, RepoHandle};
use std::path::{Path, PathBuf};

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

/// The work tree root and every path its index tracks, repository-relative.
pub(crate) fn tracked_files(root: &Path) -> Result<(PathBuf, Vec<String>), String> {
    let (driver, repo) = open_repository(root).ok_or("not a git repository")?;
    let top = repo.work_tree().ok_or("no work tree")?.to_path_buf();
    let mut files = vec![];
    let mut cursor = None;
    loop {
        let page = driver
            .tracked_paths(&repo, cursor, 4096)
            .map_err(|e| e.cause)?;
        files.extend(page.entries.iter().map(|p| String::from_utf8_lossy(p).into_owned()));
        if page.complete {
            return Ok((top, files));
        }
        cursor = page.next_cursor;
    }
}

/// Counts lines of code in the files the repository's index tracks.
pub fn count_lines_of_code(root: &Path) -> Result<u64, String> {
    let (top, files) = tracked_files(root)?;
    let mut total_lines = 0u64;
    for file in files {
        let full_path = top.join(file);
        if full_path.is_file() {
            if let Ok(content) = std::fs::read(&full_path) {
                total_lines += content.iter().filter(|&&b| b == b'\n').count() as u64;
            }
        }
    }
    Ok(total_lines)
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

        let lines = count_lines_of_code(root);
        assert!(lines.is_ok());
        assert!(lines.unwrap() > 0);
    }
}
