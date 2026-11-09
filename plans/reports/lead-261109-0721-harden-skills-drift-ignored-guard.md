# Skills drift guards judge only what the repository owns

Landed 27b2c580c on main.

## Cause
AgentKit's skill directories (`ak-*`) under `.agents/skills/` and `.claude/skills/` are git-ignored and not rendered by fgOS. The project `worktreeSetup` command in config copies them from the main checkout into every new worktree on purpose, so agents there keep the AgentKit skills. Two real-repo guards read the whole directory: the `assembleSkills` drift guard (`test/setup/skill-wrappers.test.mjs`) and `scripts/check-decision-citation-drift.mjs`.

## Fix
- New `ownedFileSet(root)` in `scripts/lib/git-ports.mjs`: tracked plus untracked non-ignored paths through Inspect (`repositoryFiles`, the same set `build-rust-distribution` already uses), null outside a repository. Reused, no new git spawn.
- Citation script: skills-dir files are kept only when owned.
- Drift guard: a committed file counts when owned, or when the render itself produced it.
- Red first: new fixture-repo test in `check-decision-citation-drift.test.mjs` (ignored `ak-foreign` vs untracked `fgos-own`; failed before, passes after). For the drift guard, the real-repo case was already red in this worktree (104 ignored `ak-*` dirs); same test is now green.
- Census regenerated (`--write-census`), 0 undeclared sites.

## Gate
Full `npm test`: 8628 pass, 1 fail (known V7n addendum), no run-tests ERROR lines. Focused set (skill-wrappers, citation drift, architecture, doc-health, decision-relation) green after the rebase.

## Ideas (not changed)
- `worktreeSetup` copying `ak-*` into worktrees is deliberate (project config); left as is. A symlink instead of a copy would avoid 104 duplicated directories per worktree, but is the owner's call.
- `collectWideSourceFiles` (retrospective door, sweeps `.agents/skills`) still reads ignored files; not part of the red tests, so untouched.
