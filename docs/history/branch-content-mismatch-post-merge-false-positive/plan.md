# Plan — tsk-107

Mode: tiny

## Approach

`CONTEXT.md` D1 already establishes the fix and its regression test are
both committed and present on this branch (commit `42eef0fa8`, an ancestor
of `branchHeadAtTake` `725c292a`). There is no code left to write. The
lane-decision flags (auth, authorization, data model, audit/security,
external systems, public contracts, cross-platform, existing covered
behavior, weak proof, multi-domain) score exactly one — "existing covered
behavior" (`test/runner/merge.test.mjs`'s pre-existing tsk-107 regression
test) — which lands this at `tiny`, not `small`/`standard`: a couple of
files, one direct task (confirm + verify, no edit).

Rejected alternative: re-implement `branchContentMismatch` from the item's
own description as if starting fresh. Rejected because it would either
produce a no-op diff (the logic already matches) or, worse, risk
regressing the already-passing fix/test pair for no benefit — `CONTEXT.md`
D1 already forecloses this path.

Impact-analysis posture (`CLAUDE.md`'s gate, `fgos tool query --capability
impact-analysis --status present`, checked fresh in `fgos-coding-exploring`'s
CONTEXT.md step): **full** (`gitnexus`, `status: present`). No edit is
planned, so this is recorded for the audit trail only — GitNexus's own
`branchContentMismatch` lookup already confirmed its only caller is
`mergeRunnerItemLocked` and its only callee is the local `git` shell-out
helper, matching the direct source read.

## Files touched

None. This item's own scope, per `CONTEXT.md` D1, is confirm-and-verify —
no edit to `src/runner/merge.mjs`, `test/runner/merge.test.mjs`, or any
other file.

## Proof point

**Revised at `fgos-coding-validating` (round 2):** a bare `npm test` run on this
branch was actually executed and does NOT pass clean — 2 of 2852 tests
fail, both confirmed pre-existing at this branch's own base commit
(`git show 725c292a:<path>`, i.e. present before this item's own branch
ever forked), and both unrelated to `src/runner/merge.mjs` or
`test/runner/merge.test.mjs`:

- `test/docs/launcher-vocabulary-guard.test.mjs` — pinned term
  "orchestrator" already present in
  `docs/history/fgos-coding-driving-item-display/CONTEXT.md` at `725c292a`.
- `test/skills/fgos-mirror.test.mjs` — `.claude/skills/fgos-coding-driving/
  SKILL.md` already differs from its `.agents/skills` mirror at `725c292a`.

`runGoalCheck` (`src/runner/goal-check.mjs:33-36`) spawns `item.verify`
literally and requires its exit code to be 0 — a bare `npm test` verify
would therefore block this item's own `return` on unrelated pre-existing
breakage, even though tsk-107's own scope is already satisfied. Scoping
the verify to this item's own concern follows this repo's own established
precedent (`docs/history/add-stage-default-gap/plan.md`,
`docs/history/agent-executor-retry-escalate-helper/plan.md`,
`docs/history/cli-invocation-fault-provenance/plan.md`, among others, all
use a scoped `node --test <file(s)>` verify rather than bare `npm test`):

```bash
node --test test/runner/merge.test.mjs
```

Confirmed live: 63/63 pass, 0 fail, including "mergeRunnerItem does not
false-flag an already-merged branch just because a later unrelated
already-merged branch also touched the same file" by name. A green run of
this scoped command is this item's own done-signal — nothing else is
required, and it is immune to the two unrelated pre-existing failures
above.

## Split

None. This is one honest piece of work (confirm-only), not a candidate
for decomposition into children.

## Outstanding questions

None
