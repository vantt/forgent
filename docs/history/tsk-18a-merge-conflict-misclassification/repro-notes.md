# tsk-18a D2 — concurrency reproduction attempt, real result

Per `CONTEXT.md` D2: recorded before `fgos return`, regardless of outcome.
Scripts used (scratchpad, not committed):
`tsk-18a-repro-worker.mjs` + `tsk-18a-repro-orchestrator.mjs` — two
genuinely separate OS processes (`child_process.spawn`, not two async
tasks in one process), each calling `mergeRunnerItem` against the SAME
real scratch git checkout at the same time, matching the root→main
`approve` call site's own shape (`bin/fgos.mjs:2363`, no ephemeral
worktree for a root merge — two concurrent root approvals really do share
one checkout).

## Attempt 1 (accidental confound, kept because it's a real finding)

First run spawned both workers with no env override, inheriting this
session's own `CLAUDE_CODE_SESSION_ID`. `resolveWriterIdentity`
(`src/runner/session-identity.mjs`) resolved BOTH workers to the identical
writer identity — main-checkout-lock.mjs's D6 self-recognition then let
the second worker "refresh" the first's own lock instead of contending,
so both processes ran real `git` operations on the same checkout at the
same time with no serialization at all.

Result (1/1): the SECOND worker crashed with the item's exact original
symptom — `"merge of \"fgw/item-b\" failed and \"git merge --abort\"
itself failed: ... fatal: There is no merge to abort (MERGE_HEAD
missing)."` — even running against this item's own D1-fixed code. Not the
scenario D2 set out to test (the real incident was two DIFFERENT
sessions), but a genuine, separate bug surface: `abortMergeIfPossible`
had its own TOCTOU between checking `mergeHeadExists()` and calling
`git merge --abort` — a concurrent process sharing the SAME resolved
identity can clear `MERGE_HEAD` in that exact window.

## Attempt 2 — the real question: two genuinely different identities

Re-ran forcing two distinct `CLAUDE_CODE_SESSION_ID` values per worker
(`fake-session-AAAA…` / `fake-session-BBBB…`), matching the original
incident's actual shape (two different sessions/terminal panes, not
siblings sharing one shell's env) — 5/5 runs:

- One worker always won the lock cleanly and merged (`outcome: "merged"`).
- The other always got a clean, structured `MergeError` —
  `"cannot merge ... main checkout is locked by another live session
  (fake-session-…, held 0s, expires in …)"`, `code: "lock-held"` —
  thrown BEFORE any `git merge` call even started.
- Zero instances of the original misclassification, zero crashes, zero
  corrupted checkout state, across all 5 runs.

**Conclusion for the actual incident shape**: `tsk-2eq`'s lock-scope fix
(already delivered) DOES close the race for two genuinely separate
sessions/identities — the scenario the original incident's own
description names. The misclassification does not reproduce under this
condition anymore.

## A real residual gap found along the way — fixed in this item

Attempt 1's crash, while not the primary scenario, was real and
reproducible on the D1-fixed code, and sits in the exact function D1
already touches. Fixed here too: `abortMergeIfPossible` now re-checks
`mergeHeadExists()` if its own `git merge --abort` call fails — if
`MERGE_HEAD` is gone by THEN (whatever cleared it), the abort's own goal
is already satisfied, so this is treated as a no-op success instead of a
fatal, uncaught crash. Any OTHER abort failure (`MERGE_HEAD` still
present) still propagates exactly as before.

Re-ran attempt 1's same-identity confound 5 more times against this
second fix: **zero crashes** (down from 1/1 reproducing every time
before). Outcomes were always one of `merged`, `conflict`, or a
structured `MergeError` ("git commit failed") — never an uncaught,
unstructured exit. `test/runner/merge.test.mjs` and `test/cli/fgos.test.mjs`
both stay green (521 tests, 0 fail) after this second fix.

## What's still open (explicitly out of this item's scope)

Two processes that resolve to the SAME writer identity (e.g. a
background retry-loop sharing environment with a live session — the
item's own description names "a background take tsk-3wr-1 retry-loop" as
correlated timing, which plausibly matches this shape) can still bypass
`tsk-2eq`'s lock entirely via D6's self-recognition "refresh" logic and
race real git operations against each other. This item's fix makes that
race fail SAFELY (a structured outcome or a typed `MergeError`, never an
uncaught crash) — it does not make the race SERIALIZED. Fully closing
that requires revisiting `main-checkout-lock.mjs`'s self-recognition
semantics (D6, owned by `tsk-2eq`/`tsk-45z`, a different file/item), not
a change this item's own scope (`docs/history/tsk-18a-merge-conflict-misclassification/CONTEXT.md`
D1) covers. Flagged here for whoever next touches that lock design, not
filed as a new item by this session (a scope decision, not an
implementation detail — left for a person to decide is worth its own
ticket).
