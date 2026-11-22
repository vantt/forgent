//! Where a worker's own claim and report are, under either name a worker may have been told to use.
//!
//! Every worker is told the agent protocol's names: `result-<round>.json` and `report-<round>.md` in its attempt's
//! outbox (`worker-output/outbox/` for a headless worker, `outbox/` for an interactive one). Run directories
//! written before that carry `agent-result.json` and `agent-report.md` flat in the run directory or under
//! `worker-output/outbox/`; the readers still find those so a historical run reads as it always did. The
//! collector and reconciliation both ask here, so they can never disagree about which file is the claim.

use std::path::{Path, PathBuf};

/// The path a worker's artifact would be at, outbox first.
///
/// Directories are tried in order: `worker-output/outbox`, `worker-output`, then `outbox`. Within a directory the
/// highest round wins, ordered by number (`result-9` never beats `result-11`). A directory without a round file
/// but holding the legacy name yields that name. When no directory holds anything the legacy flat path is
/// returned, whether or not it exists: a caller that needs to know it is there checks.
pub fn resolve_worker_artifact_path(
    run_dir: &Path,
    round_prefix: &str,
    round_suffix: &str,
    legacy_name: &str,
) -> PathBuf {
    let dirs = [
        run_dir.join("worker-output").join("outbox"),
        run_dir.join("worker-output"),
        run_dir.join("outbox"),
    ];
    for dir in dirs {
        let Ok(read) = std::fs::read_dir(&dir) else {
            continue;
        };
        let mut names: Vec<String> = Vec::new();
        let mut any_names: Vec<String> = Vec::new();
        for entry in read.flatten() {
            let Some(name) = entry.file_name().to_str().map(str::to_string) else {
                continue;
            };
            // A link planted among the results is never the newest result.
            if entry.file_type().is_ok_and(|t| t.is_file()) {
                names.push(name.clone());
            }
            any_names.push(name);
        }
        let latest = names
            .iter()
            .filter_map(|name| {
                let digits = name
                    .strip_prefix(round_prefix)?
                    .strip_suffix(round_suffix)?;
                // The agent protocol's rule: plain decimal, no sign and no leading zero.
                let plain = !digits.is_empty()
                    && digits.chars().all(|c| c.is_ascii_digit())
                    && (digits == "0" || !digits.starts_with('0'));
                plain.then(|| (digits.len(), digits.to_string(), name.clone()))
            })
            .max_by(|a, b| (a.0, &a.1).cmp(&(b.0, &b.1)));
        if let Some((_, _, name)) = latest {
            return dir.join(name);
        }
        if any_names.iter().any(|n| n == legacy_name) {
            return dir.join(legacy_name);
        }
    }
    run_dir.join(legacy_name)
}

/// The worker's own structured claim, or `None` if it never wrote one. Present means something is there, a link
/// or a pipe included: the reader refuses what it cannot trust, and an attempt that left such a thing failed
/// instead of leaving nothing.
pub fn find_worker_claim(run_dir: &Path) -> Option<PathBuf> {
    let claim = resolve_worker_artifact_path(run_dir, "result-", ".json", "agent-result.json");
    std::fs::symlink_metadata(&claim).is_ok().then_some(claim)
}
