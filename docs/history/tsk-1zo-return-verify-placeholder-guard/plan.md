# Plan — tsk-1zo: return refuses a placeholder verify cleanly

Mode: **small** (0-1 flags per fgos-routing's Mode gate — the one flag
that applies is "existing covered behavior", `return` being core,
heavily-tested infra; no auth/data-model/audit/external/public-contract/
cross-platform/multi-domain flag applies, and proof is strong, not weak).

## Approach

**Chosen path:** guard once, at the single choke point both `return`
paths (branch-source and main-source) already share — `bin/fgos.mjs`'s
`case 'return'`, right after the existing `claimRole` pre-flight check and
before the branch/main split (~line 2948). Reuse `hasRealVerify` from
`src/intake/discovery.mjs` (export it; it already exists, unexported,
used by `resolveDiscovery`) instead of writing a second copy of the
placeholder-prefix check.

**Rejected alternative — guard inside `runGoalCheck` itself
(`src/runner/goal-check.mjs`).** GitNexus impact analysis
(`mcp__gitnexus__impact`, upstream, `runGoalCheck`): **HIGH risk, 8
impacted symbols, 4 execution flows** — `startupReap`, `dispatchClaimedItem`,
`runWatch` (`src/runner/loop.mjs`, the async runner), `retargetMember`
(`src/runner/promote-engine.mjs`), plus `src/verbs/merge/approve.mjs` and
`src/runner/merge.mjs`'s own direct calls (confirmed by `rg -n
"runGoalCheck"`, 8 call sites total across 4 files). `runGoalCheck`'s own
header comment (goal-check.mjs:13-19) documents a hard, load-bearing
contract: it **never rejects** — every caller assumes the returned promise
always resolves `{passed, status, timedOut, output}`. Adding a throw there
would break that contract for every one of those 8 callers; returning a
synthetic `{passed:false, ...}` there instead would be a correct-shaped
fix but a far wider change than this item's own repro (item text: "tsk-
1lv's own root item ... when its 6 children finished and return was
attempted" — `return` specifically). An item can only reach
`approve`/`merge` by first passing `return`'s own gate, so guarding
`return` alone closes the real gap end-to-end for the normal lifecycle.

**Files touched:**
- `src/intake/discovery.mjs` — export `hasRealVerify` (1-line change, was
  already correct, just module-private).
- `bin/fgos.mjs` — import `hasRealVerify`; add one
  `if (!hasRealVerify(item.verify)) throw new StoreError('validation', ...)`
  check (matches the exact idiom of the three existing pre-flight
  `StoreError('validation', ...)` checks immediately above it — item not
  found, status !== 'doing', claimRole check).
- `test/cli/fgos-return.test.mjs` — two new tests (main-source,
  branch-source), same pattern as the existing "HEAD has not advanced"/
  "branchHeadAtTake" validation-refusal tests right next to them.

**Order:** export → import + guard → tests. No cross-piece dependency;
`fgos graph --what-if` was not run since this item does not split (see
below) — a single, atomically-provable piece.

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| `hasRealVerify` export | LOW (GitNexus: 1 caller, `resolveDiscovery`, exact) | `test/intake/discovery.test.mjs` unchanged/green |
| `bin/fgos.mjs`'s `return` guard | LOW-MEDIUM (shared choke point for both return paths) | 2 new tests + all 51 existing `fgos-return.test.mjs` tests green |
| `runGoalCheck` (left untouched) | N/A — deliberately out of scope, see rejected alternative above | `test/runner/goal-check.test.mjs` unchanged/green (contract untouched) |

`impact-analysis: full` (GitNexus present, freshly queried this session —
`fgos tool query --capability impact-analysis --status present` returned
provider `gitnexus`, status `present`).

## Shape

One honest piece, no split. Concrete cases proven:
- placeholder verify (`SUBMIT_VERIFY_SENTINEL`/`RETIRED_P14_PLACEHOLDER`,
  `'chưa xác định — ...'`) on a main-source claim → validation refusal,
  exit 4, item stays `doing` (new test).
- same, on a branch-source claim → same refusal (new test, the second
  `return` path that shares the same guard).
- every existing real-verify path (pass, fail, timeout, dirty-tree,
  headAtTake-missing, branch-stale, `--no-new-commits-ok`, session-
  worktree, ad-hoc-worktree refusal, footprint/frozen-judge advisories) —
  all 51 pre-existing tests in `fgos-return.test.mjs` still pass unchanged,
  proving the new guard sits strictly before those paths and never
  interferes with a real verify.
- `hasRealVerify`'s own existing 37 tests (`test/intake/discovery.test.mjs`)
  and `runGoalCheck`'s own 23 (`test/runner/goal-check.test.mjs`,
  "runGoalCheck still runs item.verify through runCommand (unchanged
  contract)") stay green — proves neither shared primitive's own contract
  moved.
- Full `npm test`: 3620 pass / 5 pre-existing skips / 0 fail (whole-suite
  regression check, run once after the change).

No split — this is one self-contained fix + its own regression tests.

## Verify

`npm test` (matches item's `work.verify`, synced already — item was
`clear`-discovered with this exact command per `fgos discover --verdict
clear --verify "npm test"`).

## Outstanding questions

None
