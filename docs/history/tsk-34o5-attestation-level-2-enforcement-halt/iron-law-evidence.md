# tsk-34o5 — Iron Law failing-test-first evidence

`classifyIronLaw` result (against the real committed diff, `601156f0`):
`required: true`, `matchedModules: ["bin/fgos.mjs",
"src/runner/attestation-guard.mjs", "src/runner/loop.mjs"]`,
`matchedFlags: []`.

## Test command

Item's own verify: `node --test test/runner/loop.test.mjs
test/cli/fgos-return.test.mjs test/cli/fgos-approve.test.mjs
test/verbs/merge/approve.test.mjs`

## Failing-before (real transcript excerpt, new tests run with
`bin/fgos.mjs`/`src/runner/loop.mjs`/`src/verbs/merge/approve.mjs`
temporarily reverted to the parent commit `0064140f` — the plan-only
commit, before any of this item's wiring landed)

```
✖ approve of a runner item halts with attestation-mismatch when baseCommit/headRef diverges (709.365003ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + 'delivered'
  - 'blocked'

✖ tsk-34o5: return halts and parks item blocked when attestation diverges (646.000181ms)
  AssertionError [ERR_ASSERTION]: return should exit non-zero
  actual: 0, expected: 0, operator: 'notStrictEqual'

✖ tsk-34o5: startupReap parks a stale doing item with attestation-mismatch when baseCommit/headRef diverges (66.58602ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + 'runner-crash-reclaim'
  - 'attestation-mismatch'

ℹ tests 199
ℹ pass 196
ℹ fail 3
```

All 3 new halt-path tests fail against the pre-fix wiring — each for the
exact reason the guard exists: `approve` merges the diverged item straight
to `delivered` instead of halting; `return` exits `0` instead of refusing;
`startupReap` reclaims the stale item under the pre-existing
`runner-crash-reclaim` reason instead of the new `attestation-mismatch`
one. The sibling false-positive test ("does NOT halt a legitimate retry")
passes even pre-fix, as expected — with no guard wired in, nothing ever
halts, so that assertion does not by itself distinguish pre/post-fix; the
three failures above are the ones that do.

`src/runner/attestation-guard.mjs` itself was left in place during this
revert (it is additive, imported by nothing pre-fix once the three call
sites are reverted) — its own 6 unit tests in
`test/runner/attestation-guard.test.mjs` are unaffected either way and are
not part of this item's own `verify` command; run separately, all 6 pass
under both states since they call `checkDispatchAttestation` directly.

## Passing-after (real transcript excerpt, after the real fix, commit
`601156f0`)

```
✔ approve of a runner item halts with attestation-mismatch when baseCommit/headRef diverges (570.695563ms)
✔ tsk-34o5: return halts and parks item blocked when attestation diverges (559.824757ms)
✔ tsk-34o5: startupReap parks a stale doing item with attestation-mismatch when baseCommit/headRef diverges (44.560267ms)
✔ tsk-34o5: startupReap does NOT halt a legitimate retry on a branch with previous commits if latest attestation baseCommit is ancestor (78.714296ms)

ℹ tests 199
ℹ pass 199
ℹ fail 0
```

Full verify command (all four files): `tests 199 / pass 199 / fail 0`, run
twice for confirmation (both real, bare `node --test` invocations, exit
code `0` both times — never piped, per this repo's own verification
caveat for this Node version).

`test/runner/attestation-guard.test.mjs` (the new unit suite, not part of
the item's own `verify` string but part of its footprint): `tests 6 / pass
6 / fail 0`.

## What changed

- `src/runner/attestation-guard.mjs` (new): `checkDispatchAttestation(dir,
  repoRoot, id, branch)` — reads the LAST `executor.dispatch` event for
  `id` from `.fgos/events.jsonl` (`readEvents`), returns `{ok:true,
  skipped:true}` when no event exists or `baseCommit`/`headRef` is
  null/absent (in-session dispatch, never enforced). Otherwise halts
  (`{ok:false, reason:'attestation-mismatch', detail}`) when the recorded
  `headRef` does not match the branch name, or when the branch tip is not
  a git-ancestor descendant of the recorded `baseCommit`
  (`git merge-base --is-ancestor`).
- `src/runner/loop.mjs`: `startupReap` calls the guard before treating a
  stale `doing` item's branch commit as real progress; a halt parks the
  item `blocked` with the typed reason instead of reclaiming it normally.
- `bin/fgos.mjs`: `return`'s branch-source path calls the guard before
  trusting `branchAheadCount`; a halt records friction and throws
  `StoreError('validation', ...)` after parking the item `blocked`.
- `src/verbs/merge/approve.mjs`: one guard call, gated on `source ===
  'runner'`, placed before the `rootId !== id` branch — covers both
  downstream `mergeRunnerItem` call sites (leaf-into-root and
  root/leaf-into-main) with a single check, since both live inside the
  same enclosing `source === 'runner'` block. A halt records friction and
  returns `{..., to:'blocked', reason:'attestation-mismatch'}` without
  merging.
- `test/runner/attestation-guard.test.mjs` (new): 6 unit tests — no event,
  null attestation, green path, retry picks LAST event, headRef mismatch
  halt (the exact `tsk-43z` shape), non-ancestor-tip halt.
- `test/runner/loop.test.mjs`: 2 new tests — `startupReap` halts on
  divergence, and does NOT halt a legitimate retry (branch reset to
  `dispatchBaseline` before each retry, per `RESEARCH.md` Round 4).
- `test/cli/fgos-return.test.mjs`: 1 new test — `return` halts and parks
  `blocked` on divergence.
- `test/cli/fgos-approve.test.mjs`: 1 new test — `approve` halts and parks
  `blocked` on divergence, main HEAD unchanged, no merge commit created.
- `docs/explanation/worktree-dispatch-attestation-level-1-advisory-only.md`:
  appended a Level 2 follow-up section, same style as the existing
  tsk-4hl/tsk-x5r/tsk-5iv sections.
- `CHANGELOG.md`: one line under `## [Unreleased]` — a merge can now halt
  on a new failure mode (`attestation-mismatch`).

Scope held to identity divergence only, per the item's own "phạm vi giữ
hẹp" line — `footprintDiffHits`/`frozenJudgeHits` stay advisory-only,
untouched by this item.
