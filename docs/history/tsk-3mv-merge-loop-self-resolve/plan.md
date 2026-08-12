---
item: tsk-3mv
timestamp: 2026-07-29T15:57:00.000Z
---

# plan: merge-loop self-resolve for merge blocks

## Mode

**high-risk.** Flags counted against the gate:

- **audit/security-adjacent hard gate** — the mechanical piece (D1a) lands in
  `src/runner/merge.mjs`, which matches the `src/runner/` prefix rule in
  `src/evolve/iron-law.mjs`'s `MODULE_RULES`. This item's own diff will trip
  Iron Law on its own `approve` — real failing-test-first proof required
  before a human runs `--acknowledge-iron-law` (D2, unchanged).
- **existing covered behavior** — `src/runner/merge.mjs` already has a test
  suite (`test/runner/merge.test.mjs`) and a documented outcome contract
  (`conflict`/`verify-fail`/`merged`/`fgos-write-rejected`) that D1a extends
  without breaking; `plugins/fgOS/skills/merge-loop/SKILL.md`'s stop rule is
  similarly already-documented behavior D1b changes.
- **public contract** — `merge-next`'s JSON envelope shape
  (`{picked, approve: {blocked, reason}}`) is read by `merge-loop` today and
  potentially by other automation; D1a must not change that shape, only add
  a new possible path through it.
- **weak proof around the area** — auto-resolving a git conflict is
  inherently risky if the detection is wrong (a false-positive "this is an
  ID collision" could silently keep the wrong content). The mode reflects
  that risk, not a guess.

A `standard` plan would understate the Iron Law exposure on D1a's own
merge and the correctness bar a wrong auto-resolve implies — this item
earns the fuller shape below.

## Graph signal

`fgos graph --json`: `tsk-3mv` is its own size-1 connected component (no
deps, nothing currently depends on it). `topUnblock`/`criticalPath` carry no
signal for this item — there is nothing to unblock by sequencing it
differently against other work. The ordering below is decided by risk and
independence between the two pieces, not by graph leverage.

## Approach

D1 splits cleanly into two independent pieces — different files, different
risk profile, no functional dependency between them:

- **D1a (mechanical)**: `src/runner/merge.mjs` gains a check, run only when
  `mergeRunnerItemLocked`'s `git merge --no-commit --no-ff` conflicts:
  inspect the conflicted paths (`git diff --name-only --diff-filter=U`). If
  every conflicted path is under `docs/decisions/` (the `0000-index.md`
  row-position case and/or an `NNNN-*.md` filename collision) AND the
  conflict is a row-insertion collision, not a same-row content dispute
  (git's own conflict markers show two *different* inserted blocks, not one
  edited block) — attempt the renumber-and-remerge sequence
  `docs/how-to/resolve-a-decision-id-collision-merge-conflict-on-approve.md`
  already documents by hand. Any other conflicted path, or a same-row
  dispute even inside `docs/decisions/`, aborts exactly like today
  (`outcome: 'conflict'`, no new commit) — the pinned "self-resolvable
  merge-conflict" boundary from `CONTEXT.md` D1a stays a hard line in code,
  not a suggestion.
- **D1b (agent-diagnosed)**: `plugins/fgOS/skills/merge-loop/SKILL.md` (and
  `merge-next/SKILL.md` if the diagnosis step belongs there instead — an
  implementation-shape call, not locked here) gains a step: on a
  `verify-fail-post-merge` block, before counting it toward the "same id
  blocked twice" stop rule, walk
  `docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md`'s
  steps directly in the session (read `approve`'s `output`, check whether
  the failing test touches the item's own diff, isolate-rerun, fix as a
  separate commit if it's a genuine pre-existing bug, retry via `fgos move
  <id> --to proposed` + `fgos approve <id>` either way). D3's stop
  condition (no progress, or the block doesn't match this playbook's shape)
  gates whether this step even runs versus falling straight to today's
  stop-and-report.

**Rejected alternative**: doing both in `src/runner/merge.mjs` alone. D1b's
diagnosis (is this failing test related to my diff, is it flake, should I
fix it) needs real judgment over free-text test output — not a pattern a
pure function can safely classify. Keeping it in the skill session (which
already has Read/Bash/Edit and is the same kind of session that did this by
hand on `tsk-2z3`) matches D1 as locked, instead of forcing a fake
mechanical shortcut into code.

## Risk map

| Component | Risk | Proof point (for `fgos-coding-validating` / execution) |
|---|---|---|
| D1a conflict-shape detector (which paths, row-insertion vs same-row edit) | High — a false positive silently keeps wrong content | Unit tests on the detector with a real captured collision case (mirror `tsk-66l`'s actual conflict shape) AND a same-row-edit case that must NOT be treated as self-resolvable |
| D1a renumber-and-remerge sequence | High — git surgery (worktree, `.fgos/*` force-checkout from main) done by code instead of by hand | Integration test: fixture repo with two branches independently claiming the same decision ID, assert the auto-resolve reaches a real merge commit and the real goal-check still runs (matching `isAlreadyMerged`'s existing "never skip the real check" precedent) |
| D1a's own Iron Law exposure | Medium — this item's own `approve` will require `--acknowledge-iron-law` with real failing-test-first proof | Confirmed as an expected, not accidental, consequence (D2) — the failing-test-first proof IS the above two test cases, written red first |
| D1b diagnosis step | Medium — judgment-based, could misclassify a real regression as "unrelated flake" | `fgos-coding-validating` should require a dry-run trace against a captured real case (`tsk-2z3`'s two blocks) showing the step reaches the same conclusion a person already reached |
| D1b's interaction with D3's stop condition | Low-medium — must actually stop on second no-progress block, not loop | Trace through D3's stop condition by hand against a synthetic "fix didn't help" case before relying on it live |

## Split

Two child items, both `parent: tsk-3mv`:

1. **D1b piece** — "merge-loop: agent-diagnose verify-fail-post-merge before
   counting a block toward the stop rule."
   Verify: `test -f plugins/fgOS/skills/merge-loop/SKILL.md && grep -qi
   'verify-fail-post-merge' plugins/fgOS/skills/merge-loop/SKILL.md &&
   grep -qi 'no progress' plugins/fgOS/skills/merge-loop/SKILL.md &&
   grep -qi 'iron-law' plugins/fgOS/skills/merge-loop/SKILL.md && npm test`
2. **D1a piece** — "approve: auto-resolve decision-ID-collision merge
   conflicts in `mergeRunnerItemLocked`."
   Verify: `node --test test/runner/merge.test.mjs && npm test`

**Order**: D1b first, D1a second. Not a graph-leverage call (see Graph
signal above — no unblock difference) — a risk-sequencing call: D1b is
skill-prose only, carries no Iron Law exposure, and is provable faster;
D1a is the higher-risk, Iron-Law-gated piece and benefits from D1b already
being live (so a self-resolve attempt that D1a's own future `approve` runs
into can already lean on D1b's diagnosis step) before it lands.

## Execution note

Per the locked decision that Execute/verify already has a working
mechanical path, this plan names one real verify command per piece and
stops there — it does not redesign how `fgos-coding-implement`/`return`/`approve`
run.
