# Plan: commit-time guard against staging a `.fgos/` deletion (tsk-56u)

Mode: **standard** (2 flags: audit/security — this guards the integrity of
the shared event log; existing covered behavior — `.githooks/pre-commit`
already has e2e test coverage, `test/e2e/main-checkout-lock-hook*.test.mjs`,
that must keep passing while this adds new logic to the same file).

No `docs/history/<feature>/CONTEXT.md` exists for this item — discovery
(RESEARCH.md, same folder) came back `clear` and the item skipped
`exploring` entirely (D2 of `fgos-coding-discovering`'s own flow). The
item's own description already carries a locked "Wanted" section from
intake; that description plus `RESEARCH.md`'s findings are this plan's
source of truth.

Impact-analysis posture (CLAUDE.md gate): `fgos tool query --capability
impact-analysis --status present` → **1 provider, `gitnexus`, status
`present`** → **full**. The `impact`/`detect_changes` MUST rules apply as
written once `fgos-coding-implement` starts editing — `impact({target:
"main", direction: "upstream"})` on `.githooks/pre-commit`'s `main()`
before touching it, `detect_changes()` before committing.

`fgos graph --json`: this item sits in its own single-item component (no
other open item shares its footprint or depends on it) — ordering only
matters within this one item's own two changes, not against other backlog
items. No split needed (see below), so `topUnblock`/`criticalPath`
comparisons across candidate split pieces don't apply.

## Approach

**Chosen path:** add one more guard clause to the existing
`.githooks/pre-commit` (`main()`, `/home/vantt/projects/forgentX/.githooks/pre-commit`),
run unconditionally — never behind `hookRunsAtHome(repoRoot)`, unlike the
two existing guards in that file — that inspects the staged diff for a
deletion under `.fgos/` and refuses the commit if found. Mirror the
detection shape `src/runner/merge.mjs`'s `fgos-write-rejected` check
already uses (`git diff --name-only --cached`, filtered for `.fgos`/`.fgos/`
prefix), narrowed to `--diff-filter=D` per the item's own wording ("refuses
to **stage a deletion**") and per RESEARCH.md's finding that a worktree can
only ever produce a staged `.fgos` *deletion* (never an addition/
modification), since `createWorktree` `fs.rmSync`'s `.fgos/` out of the
working tree without ever `git rm`-ing it from the index.

Second half: add a paragraph to `AGENTS.md`, immediately after the existing
`git reset --hard` warning (~line 82-90), naming both real near-misses from
the item description — (a) `git add -A` + commit in a worktree staging the
`.fgos/` deletion (now mechanically blocked by the hook above — the
paragraph documents *why*, for a reader wondering what just refused their
commit), and (b) `git stash` in the shared main checkout sweeping
`.fgos/events.jsonl` into the stash, which has no mechanical guard (git has
no native pre-stash hook that can cleanly refuse a stash) so this stays a
documented hazard only, same as the existing `git reset --hard` entry
right above it.

**Alternatives rejected:**
- *Extend `fgos-write-rejected` itself to also run pre-commit* — rejected:
  that check lives in `src/runner/merge.mjs`, invoked only from the merge
  path (`mergeRunnerItemLocked`), with no existing pre-commit call site;
  wiring a merge-path function into the git hook would be a bigger,
  riskier refactor than adding an equivalent 5-line check directly in the
  hook file that already owns commit-time guards. The two checks stay
  independently simple and easy to reason about, at the cost of the
  detection logic existing twice — an acceptable, already-precedented
  duplication (the merge-time check's own header comment already frames
  itself as "the mechanical, trusted-side wall for the residual case," not
  the only wall).
- *Block ANY staged `.fgos` change at commit time, not just deletions* —
  rejected: the item's own wording scopes this to deletions, and
  RESEARCH.md confirms a worktree can never stage an addition/modification
  under `.fgos/` in practice (it was never re-created after `rmSync`), so
  broader scope would add complexity with no real coverage gain for the
  hazard this item names. A future item can widen this if a real addition/
  modification hazard ever surfaces.
- *Gate the new guard behind `hookRunsAtHome`, like the file's other two
  guards* — rejected: doing so would make the guard silently no-op for
  exactly the worktree-commit case the item describes as the actual
  near-miss (RESEARCH.md's first finding).

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| New pre-commit guard clause | Medium — a bug here could either (a) fail to block a real `.fgos/` deletion (silent, same as today — no regression), or (b) false-positive block a legitimate commit that happens to touch `.fgos/` for a real reason (the fgOS CLI's own commits, made directly against the main checkout — must confirm those are NOT staged via this same `git commit` path in a way that would self-block) | `fgos-coding-validating` must trace how `fgos`'s own state-writing verbs commit `.fgos/` changes (`src/runner/*` — likely direct `git commit` calls against the main checkout) and confirm the new guard only fires on a **deletion**, never on the additions/modifications those verbs make — an ADDITION/modification is never filtered by `--diff-filter=D`, so this should hold structurally, but needs a real trace, not an assumption |
| `hookRunsAtHome` bypass (new guard runs unconditionally) | Low — this only WIDENS when the guard fires (main checkout AND every worktree), never narrows an existing protection | e2e test: `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs`'s existing harness already proves a worktree commit reaches this hook file at all; extend it (or add a sibling test) asserting the new guard specifically fires there |
| AGENTS.md paragraph | Low — documentation only, no executable behavior | Manual read-through in review; no automated verify needed beyond `npm test` not breaking on the file edit |

**Files touched (footprint):**
- `.githooks/pre-commit` — add the guard clause + a helper function
- `AGENTS.md` — add the warning paragraph
- `test/e2e/main-checkout-lock-hook.test.mjs` and/or
  `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs` — extend with
  a case proving the new guard fires (in the main checkout AND in a
  worktree), and a case proving a normal `.fgos`-untouched commit still
  succeeds
- `src/setup/registrations.mjs` — **not touched**, per RESEARCH.md: no new
  config default/env var/infra dependency is introduced (the hook file and
  its wiring check are already registered); the item's own footprint hint
  named this file at intake time, before RESEARCH.md's evidence existed —
  superseded by that evidence, not silently dropped

**Order:** single item, no cross-item ordering to resolve. Within it: (1)
add the guard clause to `.githooks/pre-commit`, (2) extend/add the e2e
test(s) proving it fires and doesn't false-positive, (3) add the AGENTS.md
paragraph — doc last since it references the now-real guard by name.

## Shape

One phase, standard depth:

1. **Guard clause.** In `.githooks/pre-commit`, add a function (e.g.
   `stagedFgosDeletions(repoRoot)`) running
   `git diff --cached --name-only --diff-filter=D` and filtering for paths
   `=== '.fgos'` or starting with `.fgos/'`, mirroring `merge.mjs`'s exact
   filter predicate. Call it unconditionally in `main()` (not gated by
   `hookRunsAtHome`) — refuse with a clear message pointing at the same
   `HOW_TO_DOC` this file already refuses other cases with, naming the
   actual paths that would be deleted.
2. **Tests.** Extend the existing e2e harness (temp repo + copied hook +
   dependencies, same relative nesting) with: staging a `.fgos/` file
   deletion in a fresh worktree-shaped temp repo and asserting the commit
   is refused with a clear message; staging a normal, non-`.fgos` change
   and asserting the commit still succeeds (no false positive); and — the
   proof point from the risk map — a case exercising whatever real code
   path `fgos`'s own CLI verbs use to commit a genuine `.fgos/` change
   directly (additions/modifications, not deletions), asserting THAT case
   is unaffected.
3. **AGENTS.md.** Add the warning paragraph next to the existing
   `git reset --hard` one, naming: the `git add -A` in a worktree hazard
   (now mechanically blocked — say so, and say what the refusal message
   looks like) and the `git stash` in the main checkout hazard (still only
   documented — name the real incident from the item description: an
   `approve` run misread an item's status because `.fgos/events.jsonl` had
   been swept into a stash, recovered by applying the stash back by SHA
   rather than popping it).

Concrete cases to prove (per the risk map, sized for `standard`): a
worktree with `.fgos/` rm'd staging a full `git add -A` → refused; a main
checkout with a manually `git rm`'d `.fgos/events.jsonl` staged → refused
(same guard, no worktree-specific carve-out); a normal commit touching
unrelated files while `.fgos/` sits untouched in the working tree →
succeeds; whatever `fgos`'s own verbs do to legitimately write `.fgos/` →
unaffected (not a deletion, so the filter never matches).

## Outstanding questions

None
