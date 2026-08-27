# tsk-1ck — Research

## Round 1 (2026-08-26, discovery)

**Asked:** Does `assertSafeMainCheckoutReset` (or the `main-checkout-reset`
CLI verb wrapping it) check anything beyond dirty-tree state before
permitting `git reset --hard <sha>` on the shared main checkout —
specifically an ancestor/commit-loss check? Is there a prior decision that
deliberately scoped tsk-3au's guard to dirty-check only, or is the missing
ancestor-check an undiscussed gap? Does this repo have git-hook
infrastructure that could catch a raw `git reset --hard` outside the
`fgos` CLI? Is there existing precedent for the ancestor-check mechanism a
fix would need?

**Checked (repo):**
- `src/runner/main-checkout-reset-guard.mjs:21-28` (`assertSafeMainCheckoutReset`) —
  read directly: `if (dirty && !confirmed) throw ...`. No other branch, no
  `sha`/`HEAD` comparison at all — the function only ever sees `{dirty,
  confirmed}` booleans, never a sha or repo handle.
- `bin/fgos.mjs:4391-4414` (`case 'main-checkout-reset':`) — the CLI verb
  wrapping it: `const dirty = !isMainTreeClean(repoRoot); ... gitAt(repoRoot,
  ['reset', '--hard', sha]);` runs unconditionally once
  `assertSafeMainCheckoutReset` doesn't throw. No `merge-base`/ancestor call
  anywhere in this verb. Confirms the item description's own
  `bin/fgos.mjs:4402-4414` citation exactly.
- `docs/history/main-checkout-destructive-git-safety-net/CONTEXT.md` (tsk-3au,
  the item that built this guard) — Feature boundary and D1/D2 scope this
  guard entirely around **uncommitted work** loss ("a full-tree status check
  plus explicit human confirmation before the reset proceeds"). Its own
  Scout evidence section never discusses already-committed work being lost
  via reset to a stale/behind sha — the ancestor-check gap tsk-1ck reports
  was never in scope or discussed, not a deliberate cut.
- Same CONTEXT.md's Scout evidence, verbatim: "Git has no native hook for
  `reset`, so this precedent's hook mechanism does not directly extend to
  this item's gap; the new guard has to be an explicit call in the flow
  that would otherwise run `reset --hard`, not a git hook." — this directly
  answers tsk-1ck's own "Suggested direction" second idea (a git hook
  catching raw `git reset --hard`): **not feasible**, git has no pre-reset
  hook to attach to. The existing `.githooks/pre-commit` +
  `src/runner/main-checkout-lock.mjs` infra (`docs/decisions/0021-...md`)
  guards concurrent **commits**, a different git lifecycle event.
- `bin/fgos.mjs:160` and `src/state/drift-status.mjs:59-76` — existing,
  already-used precedent in this repo for exactly the check a fix needs:
  `git merge-base --is-ancestor <a> <b>` (wrapped as `isAncestor(repoRoot,
  branch, from)` in `drift-status.mjs`). A fix can follow this same pattern
  (`git merge-base --is-ancestor <sha> HEAD`, plus `git rev-list
  <sha>..HEAD` for the commit list to show) rather than inventing new git
  plumbing.
- `docs/history/worktree-manual-merge-fgos-blob-safety-net/RESEARCH.md:64-66` —
  classification precedent: tsk-3au itself is `kind: bug, risk: heavy, tier:
  heavy` (real data loss, shared main-checkout blast radius). tsk-1ck's own
  failure mode (real committed work discarded, confirmed by the item's own
  2026-08-26 incident writeup) matches that severity; its fix scope is
  narrower than tsk-3au's (extending one existing guard function + one call
  site, no new skill-layer doc rollout), closer to `tsk-56u`'s shape
  (`risk: standard, tier: standard`, "extend an existing mechanical guard").

**Found:** Bug confirmed exactly as described, with file:line citations
matching the item's own. The gap is a genuine, never-discussed scope hole
in tsk-3au's guard (not an intentional cut). The item's own "hook" idea is
refuted by evidence already on record in this repo (tsk-3au's Scout
section). The item's own "ancestor check" idea has a direct, already-used
precedent (`git merge-base --is-ancestor`) — no new mechanism needs
inventing, closing the one open design question ("how would we even check
this") that would otherwise need a person's call.

**Still open (for planning, not discovery):** exact refuse-vs-stronger-
confirm shape for the ancestor-violation case (symmetric extension of the
existing dirty-case pattern — `--confirm` already gates the dirty case;
planning decides the analogous flag/message for the ancestor case) — an
implementation-shape decision with a clear existing pattern to extend, not
a product-scope question.
