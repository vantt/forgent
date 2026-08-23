# tsk-1zo — return's runGoalCheck shells out to a placeholder verify

## Round 1 (260817, discovery)

**Asked:** confirm the exact fix location for "fgos return shells out to a
placeholder verify with no guard" and find/propose a real verify command.

**Checked (repo search, `rg`):**

1. `src/intake/discovery.mjs:93-100` — `PLACEHOLDER_VERIFY_PREFIX = 'chưa
   xác định —'`, `hasRealVerify(verify)` returns
   `typeof verify === 'string' && verify.trim() &&
   !verify.startsWith(PLACEHOLDER_VERIFY_PREFIX)`. Confirmed to exist
   exactly as the item described, but **not exported** — a local `function`,
   not `export function`. `FALLBACK_VERIFY` (line 74) and
   `RETIRED_P14_PLACEHOLDER` (line 84, == `bin/fgos.mjs`'s own
   `SUBMIT_VERIFY_SENTINEL`, line 105) are the two canonical placeholder
   strings, both sharing the prefix.

2. `src/runner/goal-check.mjs:131-133` — confirmed:
   ```js
   export function runGoalCheck(item, cwd, timeoutMs) {
     return runCommand(item.verify, cwd, timeoutMs);
   }
   ```
   No placeholder check. `runCommand` (line 39) has a hard, heavily-commented
   contract: it **never rejects** — every branch (exit, spawn-error, timeout)
   resolves `{passed, status, timedOut, output}`. Every caller (merge.mjs,
   loop.mjs, approve.mjs, bin/fgos.mjs) is written assuming this promise
   never rejects (goal-check.mjs's own header comment, lines 13-19).

3. Callers of `runGoalCheck` (`rg -n "runGoalCheck"`): `bin/fgos.mjs`
   (`return`, both branch-source ~3005 and main-source ~3152),
   `src/verbs/merge/approve.mjs:823`, `src/runner/merge.mjs` (4 call sites),
   `src/runner/loop.mjs` (2 call sites, the async runner's own dispatch).
   Putting the guard *inside* `runGoalCheck` would mean either (a) breaking
   the documented never-reject contract for every one of those callers, or
   (b) returning a synthetic `{passed:false, ...}` for all of them — a wider
   change than this item's own repro, which is scoped to `return`
   specifically (item's own text: "tsk-1lv's own root item ... when its 6
   children finished and return was attempted"). An item can only reach
   `approve`/`merge` by first passing `return`'s own gate, so guarding
   `return` alone already closes the real gap end-to-end for the normal
   lifecycle — `approve`/`merge`'s own re-verify is out of scope here (new
   evidence would be a separate item, not assumed here).

4. `bin/fgos.mjs`'s `case 'return'` (~2917-2948): three existing
   `throw new StoreError('validation', ...)` pre-flight checks run BEFORE
   the branch-source/main-source split (item not found, status !== 'doing',
   claimRole not human/session) — this is the single choke point both
   downstream paths share, and the exact idiom (`StoreError('validation',
   ...)`, exit code 4, item stays `doing`) the item's own description asked
   for. Test convention confirmed via `test/cli/fgos-return.test.mjs`'s
   existing validation-refusal tests (e.g. "return refuses when HEAD has
   not advanced past headAtTake ... exit 4, item stays doing").

**Verdict: clear.** Fix point: export `hasRealVerify` from
`src/intake/discovery.mjs`, import it in `bin/fgos.mjs`, and add one
`if (!hasRealVerify(item.verify)) throw new StoreError('validation', ...)`
check right after the existing `claimRole` check (before the branch/main
split) — covers both return paths with a single call site, matches the
existing idiom exactly, and never touches `runGoalCheck`'s never-reject
contract used by every other caller.

**Verify:** `npm test -- test/cli/fgos-return.test.mjs test/intake/discovery.test.mjs test/runner/goal-check.test.mjs` covers the new guard directly (added two
tests: main-source and branch-source placeholder-verify refusal) plus the
unchanged `hasRealVerify`/`runGoalCheck` contracts around it. Full `npm
test` also run once as a whole-suite regression check (3620 pass / 5
pre-existing skips / 0 fail).
