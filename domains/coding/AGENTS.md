## fgOS Workflow

A session opening in this repo to work an item through its lifecycle loads
`fgos-routing` first (`.claude/skills/fgos-routing/SKILL.md`): it orients
on open work, claims one item through the pull door, then points to
`fgos-coding-discovering`, `fgos-coding-exploring`, `fgos-coding-planning`,
or `fgos-coding-validating` based on where that item's `stage` puts it.

**Never run a raw `git reset --hard` on the main checkout without a full
`git status` first** (tsk-3au: `docs/history/main-checkout-destructive-
git-safety-net/CONTEXT.md`) — the main checkout is the one shared working
tree every session's `fgos <verb>` call resolves against; checking only the
files you meant to touch instead of the whole tree can silently discard
another in-flight session's uncommitted work, with no stash/reflog/blob to
recover it. Use `fgos main-checkout-reset --sha <sha> [--confirm]` instead
— it prints the full whole-repo status and refuses without `--confirm`
when the tree is dirty.

**Never `git add -A` inside a linked worktree (`fgos pick`'s `fgw/<id>`
checkout) without checking `git status` first** (tsk-56u:
`docs/history/commit-time-fgos-deletion-guard/`) — a worktree never keeps a
working-tree copy of `.fgos/` (ADR0020 strips it right after `git worktree
add`, without ever `git rm`-ing it from the index), so `-A` stages every
`.fgos/` file as deleted. Committing that silently destroys the live event
log once the branch merges back. `.githooks/pre-commit` now refuses this
commit outright (a staged `.fgos/` deletion, checked unconditionally, not
only "at home" in the main checkout) — if you hit that refusal, `git
restore --staged .fgos` before committing again.

**Never `git stash` in the main checkout to clear a dirty tree without
checking what it swept up** (tsk-56u, same history folder) — the stash
stack is shared across every session and worktree, and stashing
`.fgos/events.jsonl` along with everything else doesn't just hide the
file: it rolls the whole repository's `.fgos` state back to an older
commit for as long as the stash is held. This has already caused a real
incident: an `approve` run misread an item's status as `doing` when it was
really `awaiting-approval`, because the live event log was sitting in a
stash — recovered by applying the stash back by SHA rather than popping
it, but the same move can silently strand another session's reads too.
There is no mechanical guard against this (git has no hook that can
refuse a stash) — stash selectively, or use `fgos main-checkout-reset`
above instead of stash-and-reset as a shortcut.

**Never resolve a `.fgos/` merge conflict on a worker branch by committing a modified `.fgos/*` file** (tsk-5pb: `docs/history/worktree-manual-merge-fgos-blob-safety-net/`) — any `.fgos/*` path staged as changed (Modified or Deleted) on a worker's `fgw/<id>` branch — including one that reappears Modified because git's own merge machinery materialized a blob during a manual conflict resolution — must be restored to that branch's own prior content and dropped from the commit entirely, never resolved toward either side of a conflict. See `docs/how-to/fix-fgos-write-rejected-merge-block.md` (its tsk-3v2 example matches this exact scenario) for how to restore these paths, and `docs/how-to/resolve-an-events-jsonl-merge-conflict.md` for the `events.jsonl`-specific sequence contiguity rules.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **forgent** (19129 symbols, 26811 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/forgent/context` | Codebase overview, check index freshness |
| `gitnexus://repo/forgent/clusters` | All functional areas |
| `gitnexus://repo/forgent/processes` | All execution flows |
| `gitnexus://repo/forgent/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
