//! Repo observation source and helpers (Lane A2 - Phase F2).

use std::path::Path;
use std::process::Command;

/// Counts commits between two revisions using `git rev-list --count`.
/// If `head_at_open` is None, counts all commits up to `head_at_close`.
/// If `head_at_close` is None, defaults to "HEAD".
pub fn count_commits_in_range(
    root: &Path,
    head_at_open: Option<&str>,
    head_at_close: Option<&str>,
) -> Result<u64, String> {
    let close = head_at_close.unwrap_or("HEAD");
    let range = match head_at_open {
        Some(open) if !open.is_empty() => format!("{open}..{close}"),
        _ => close.to_string(),
    };

    let output = Command::new("git")
        .arg("-C")
        .arg(root)
        .args(["rev-list", "--count", &range])
        .output()
        .map_err(|e| format!("failed to execute git rev-list: {e}"))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let text = String::from_utf8_lossy(&output.stdout);
    text.trim()
        .parse::<u64>()
        .map_err(|e| format!("failed to parse commit count '{text}': {e}"))
}

/// Counts lines of code in tracked files matching `git ls-files :/`.
pub fn count_lines_of_code(root: &Path) -> Result<u64, String> {
    let top_output = Command::new("git")
        .arg("-C")
        .arg(root)
        .args(["rev-parse", "--show-toplevel"])
        .output()
        .map_err(|e| format!("failed to find git root: {e}"))?;

    let git_top = if top_output.status.success() {
        let s = String::from_utf8_lossy(&top_output.stdout);
        std::path::PathBuf::from(s.trim())
    } else {
        root.to_path_buf()
    };

    let output = Command::new("git")
        .arg("-C")
        .arg(&git_top)
        .args(["ls-files", ":/"])
        .output()
        .map_err(|e| format!("failed to execute git ls-files: {e}"))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let files_text = String::from_utf8_lossy(&output.stdout);
    let mut total_lines = 0u64;

    for line in files_text.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let full_path = git_top.join(trimmed);
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
