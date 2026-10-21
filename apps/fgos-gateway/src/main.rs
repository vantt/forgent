use std::io;

use fgos_git::GitDriver;

/// Serve the main fgOS checkout (never a linked worktree's own checkout --
/// ADR0020), resolved from the cwd through the Git component's Inspect
/// topology.
fn main() -> io::Result<()> {
    let cwd = std::env::current_dir()?;
    let (_, repo) = GitDriver::open_at(&cwd)
        .map_err(|e| io::Error::other(format!("git repository read refused: {}", e.cause)))?
        .ok_or_else(|| io::Error::other(format!("not a git repository: {}", cwd.display())))?;
    fgos_gateway::gateway::run(repo.trusted_main_root().to_path_buf())
}
