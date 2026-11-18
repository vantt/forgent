use crate::context::Context;
use crate::{git, Error, Result};

#[derive(Debug, PartialEq, Eq)]
pub struct Leftover {
    pub branch: String,
    /// Commits on the branch that are not on its merge-base with `base`: 0 means it never got a commit.
    pub ahead_count: u64,
    pub tip: Option<String>,
}

/// Every `fgw/*` branch with its commits ahead of `base` (`HEAD` when `None`). Policy stays the caller's: 0 ahead is
/// an orphan its prune loop may delete; more is a proposal to keep.
pub fn list_leftovers(
    ctx: &Context,
    base: Option<&str>,
    include_tip: bool,
) -> Result<Vec<Leftover>> {
    let failed =
        |cause: String| Error::worktree(format!("listing \"fgw/\" branches failed: {cause}"));
    let driver = ctx.driver()?;
    let main = ctx.main(&driver)?;
    let base = git::resolve_commit(&driver, &main, base.unwrap_or("HEAD"))
        .map_err(|e| failed(e.message))?;
    driver
        .list_branches(&main, "refs/heads/fgw/")
        .map_err(|e| failed(e.cause))?
        .into_iter()
        .map(|name| {
            let tip = git::resolve_commit(&driver, &main, &name).map_err(|e| failed(e.message))?;
            let cmp = driver
                .compare_commits(&main, &base, &tip)
                .map_err(|e| failed(e.cause))?;
            Ok(Leftover {
                branch: name.trim_start_matches("refs/heads/").to_owned(),
                ahead_count: cmp["right"].as_u64().unwrap_or(0),
                tip: include_tip.then(|| tip.as_str().to_owned()),
            })
        })
        .collect()
}
