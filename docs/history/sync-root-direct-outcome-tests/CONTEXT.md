# CONTEXT: tsk-n2x — direct `sync-root` tests for Iron Law trip + verify-fail

## Feature boundary

`sync-root` (`bin/fgos.mjs:3235`) has 4 real outcomes: `synced`, `blocked`
(`merge-conflict`), `blocked` (`fgos-write-rejected`), `blocked`
(`verify-fail`/`verify-timeout`), plus an Iron Law refusal (validation,
exit 4, thrown before any git mutation). `test/cli/fgos.test.mjs`'s direct
`sync-root` test block (`// --- sync-root ...`, currently lines 6108-6291)
covers: nonexistent id, no-branch, happy path, decision record, nested
target, merge-conflict, and the main-checkout worktree guard. It does NOT
cover the Iron Law refusal or the verify-fail blocked outcome — confirmed
by grep across the whole file (zero hits for `acknowledge-iron-law` or
`verify-fail`/`verify-timeout` inside the sync-root block).

This item's own boundary, per its description: add exactly the 2 missing
direct tests named there — Iron Law trip and verify-fail. Nothing else.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Scope is exactly 2 new tests: (a) Iron Law trip refusal, (b) verify-fail blocked outcome — both exercised directly against `sync-root`, not through `merge next`. The other 2 untested outcomes (`fgos-write-rejected`, `verify-timeout`) are OUT of scope: grep confirms neither has a direct test anywhere in the file, including for `approve`/`mergeRunnerItem` itself — a pre-existing gap across the whole merge surface, not something this item's own description names or that `tsk-173`'s plan.md risk map (docs/history/merge-next-auto-sync-root/plan.md:35) attributes to this item. |
| D2 | Mirror `approve`'s own existing pattern for the same 2 outcomes, adapted to `sync-root`'s outcome shape and its `makeDriftedRoot` helper (not `approve`'s `makeRunnerProposedItem*` helpers, which move the item to `awaiting-approval` — `sync-root` never touches item status): <br>- Iron Law test mirrors `approve`'s `iron-refuse-item` test (fgos.test.mjs:5944-5963): a drifted root whose branch commit touches a self-modifying-capable path (`src/runner/probe.mjs`) is refused with exit 4, message names the tripped module, root item status stays `doing` (never `awaiting-approval` — sync-root has no such transition), branch survives, no merge attempted (HEAD unchanged). <br>- verify-fail test mirrors `approve`'s `approve-verify-fail-item` test (fgos.test.mjs:5753-5771): `makeDriftedRoot` with a `verify` that never passes (`test -f file-never-produced.txt`) produces `outcome: 'blocked'`, `reason: 'verify-fail'`, HEAD unchanged, produced file absent, root item status stays `doing` (sync-root's own contract — unlike approve's `awaiting-approval` -> `blocked` transition). |
| D3 | Test titles, locked so `verify` can grep them without a vacuous match (`docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md`): <br>- `'sync-root of a root whose diff touches a self-modifying-capable module REFUSES without --acknowledge-iron-law: exit 4, root status untouched, no merge'` <br>- `'sync-root of a root whose staged merge fails its own verify: outcome blocked reason verify-fail, root status untouched'` |
| D4 | `verify` (item's own field, was "chưa xác định — P15 bổ sung"): run `node --test` filtered to these 2 new titles, check both checkmark lines are present AND the real fail count is 0 — not an aggregate pass-count check (the exact vacuous-pass trap the how-to doc above warns about). See `## Verify` below for the literal command. |

## Pinned terms

- "Iron Law trip" = the `classifyIronLaw` refusal path at `bin/fgos.mjs:3266-3273` (validation, exit 4, thrown before any `withLockRetry`/merge attempt).
- "verify-fail" (for this item) = `sync-root`'s own `result.outcome === 'verify-fail'` branch at `bin/fgos.mjs:3304-3317`, specifically the non-timeout sub-case (`reason: 'verify-fail'`) — matching the exact outcome named in the item's own title/description. The sibling `verify-timeout` sub-case is not named by the item and is left out per D1.

## Scout evidence

- `bin/fgos.mjs:3235-3334` — full `sync-root` verb body: Iron Law gate (3266-3273), the 3 `blocked` sub-outcomes (3282-3317), the `synced` success path (3319-3327).
- `test/cli/fgos.test.mjs:6108-6291` — existing direct `sync-root` test block (read in full); confirms the exact 2 gaps named above.
- `test/cli/fgos.test.mjs:5914-6017` — `approve`'s own Iron Law gate tests (`makeRunnerProposedItemTouching` helper + 4 tests) — the pattern D2 mirrors.
- `test/cli/fgos.test.mjs:5753-5771` — `approve`'s own verify-fail-post-merge test — the pattern D2 mirrors for the verify-fail case.
- `docs/history/merge-next-auto-sync-root/plan.md:35` (tsk-173's own plan) — names the exact same 2 direct-`sync-root` gaps (Iron Law trip, verify-fail) in its risk map, misattributing them as already covered by `test/cli/fgos.test.mjs:5287+` — that citation is stale/wrong (5287 is inside the unrelated `evolve` block); this item exists precisely to close the gap tsk-173 assumed was already closed.
- `docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md` — read in full; shapes D3/D4 (locked, greppable test titles + real fail-count check, never an aggregate pass-count check).
- `impact-analysis` posture: **full** (`fgos tool query --capability impact-analysis --status present` → `gitnexus`, `present`). Not load-bearing for this item's own scope check — this item adds tests only, touching no `sync-root` production code — but recorded per the repo's own gate convention.

## Canonical references

- `bin/fgos.mjs` (`sync-root` verb, lines 3226-3334)
- `test/cli/fgos.test.mjs` (sync-root test block, lines 6108-6291; approve's Iron Law/verify-fail tests, lines 5753-5771 and 5914-6017)
- `docs/history/merge-next-auto-sync-root/plan.md` (tsk-173, the item that surfaced this gap)

## Verify

```bash
out=$(node --test --test-name-pattern="sync-root of a root whose" test/cli/fgos.test.mjs 2>&1)
fail=$(echo "$out" | grep -oE "^. fail [0-9]+" | grep -oE "[0-9]+$")
[ "$fail" = "0" ] \
  && echo "$out" | grep -qE "^. .*diff touches a self-modifying-capable module REFUSES" \
  && echo "$out" | grep -qE "^. .*staged merge fails its own verify: outcome blocked reason verify-fail"
```

Checked by hand against the current (pre-fix) file: the pattern matches
zero real tests today, so `fail` is `0` (Node's file-wrapper synthetic
pass) but both `grep -qE` description checks fail — exit non-zero, not a
vacuous pass. Confirmed real once both named tests exist and pass.

## Outstanding questions

None
