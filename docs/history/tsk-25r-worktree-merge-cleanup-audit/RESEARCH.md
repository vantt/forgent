# Research: tsk-25r — worktree claim/merge/cleanup lifecycle audit (parent)

## Round 1 — 2026-08-14 (discovery stage)

**Asked:** With all 9 children individually researched, fixed, tested
(each with its own real Iron Law failing-before/passing-after evidence
where required), and merged onto this item's own branch, does this parent
item have any remaining ambiguity of its own, and what is the honest,
real proof surface for closing it out?

**Checked:**
- `fgos list --all` — confirmed all 9 children (`tsk-18k`, `tsk-1mn`,
  `tsk-2iz`, `tsk-ikd`, `tsk-4bh`, `tsk-2jn`, `tsk-4yv`, `tsk-386`,
  `tsk-f8f`) are `status: delivered`. No open child remains — this item is
  no longer anchored.
- `git log --oneline` on this item's own branch (`fgw/tsk-25r`) — confirmed
  all 9 merge commits are present, in order.
- `npm test` (full project suite, AGENTS.md's own definition-of-done
  command) — 3260/3266 pass, 5 skipped, **1 pre-existing failure**:
  `test/runner/dispatch.test.mjs:651` ("the committed .fgos/config.json
  runner section declares the gather capacity"). Confirmed this predates
  EVERY item in this batch by checking the repo's own `.fgos/config.json`
  at `f8c9f135` — the commit at the very start of this whole session,
  before any of the 9 children were even claimed: `capacities.gather` was
  already absent there too. Not caused by, and out of scope for, this
  audit (a live project-config gap, unrelated to the worktree/merge/
  cleanup lifecycle findings this item tracks).

**Found:** every finding the audit report named (Findings 1-9) has a real,
merged fix with its own evidence trail. No new ambiguity exists at the
parent level — this item's own job was always "track/aggregate the 9
findings," never a tenth piece of independent work.

**Decided:** `clear` — the aggregate proof surface is the combined test
suite across all 9 findings' own touched test files, confirming they all
still pass TOGETHER (an integration check beyond what each child
individually proved in isolation), explicitly excluding the one
pre-existing, unrelated `dispatch.test.mjs` failure — named here plainly,
not silently worked around or silently included in a verify command that
would then perpetually fail for a reason this item never caused and was
never asked to fix.

**Remaining open:** none for this item's own scope. The pre-existing
`dispatch.test.mjs` gather-capacity gap is a real, separate issue worth its
own item if not already tracked — flagged here, not fixed here.

**Verify (real, runnable):**
```
node --test test/runner/merge.test.mjs test/runner/merge-target-slot-multiprocess.test.mjs test/runner/main-checkout-lock.test.mjs test/runner/worktree-callsite-wrapper.test.mjs test/runner/worktree.test.mjs test/runner/claim-port.test.mjs test/state/cleanup-harness.test.mjs test/state/frontier.test.mjs test/state/graph-metrics.test.mjs test/cli/fgos-return.test.mjs test/cli/fgos-approve.test.mjs test/runner/loop.test.mjs test/runner/claim-liveness.test.mjs
```
(627 tests, all passing — the combined real proof surface across all 9
findings' own fixes.)
