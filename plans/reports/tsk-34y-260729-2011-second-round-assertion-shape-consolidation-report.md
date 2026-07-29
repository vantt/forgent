# tsk-34y — second round: remaining assertion-shape duplication in `fgos.test.mjs`

Plan: `docs/history/test-suite-dry-consolidation/plan.md` (D1/D2:
`docs/history/test-suite-dry-consolidation/CONTEXT.md`)

Continues the first pass (`plans/reports/tsk-34y-260729-1735-test-assertion-shape-consolidation-report.md`,
commit `38062f9`, already merged into `main`), which consolidated the
`add`/`submit`/`move` bad-flag-value clusters (19 tests -> 3 loops) but
left `edit`'s equivalent cluster untouched, and did not weigh the
cross-verb "id-not-found" single-assertion tests.

## Scope actually done

Re-scanned `test/cli/fgos.test.mjs` (378 source-level `test(` sites, 6312
lines, grown back from the first pass's 361 via unrelated merges from
`main` in the interim) plus a lighter structural pass over the other 75
test files, looking specifically for what the first pass missed or for
new clusters introduced since.

Confirmed and merged 1 new cluster, same pattern as the first pass
(matching `ADD_BAD_FLAG_CASES`/`SUBMIT_BAD_FLAG_CASES`/`MOVE_BAD_FLAG_CASES`):

| Cluster (verb) | Individual tests before | Rows in merged table |
|---|---|---|
| `edit` bad-flag-value (`--priority`, `--intent`, `--docs-ref`) | 5 | 5 |

The 5th row (`--docs-ref` empty string) previously lived ~500 lines away
from the other 4 (`--priority`/`--intent`), next to `edit`'s other
`--docs-ref` tests — moved into the same table since it is the identical
invariant, just a different flag name.

Net source-level `test(` call sites removed: 5 individual tests replaced
by 1 loop construct = **-4 call sites**.

Rest of the suite (75 other files): checked the files the first pass's
plan named, plus the next tier by test count. No file shows an
independently-confirmed >=5-test structurally-identical cluster — this
matches the first pass's own finding and holds after the intervening
merges from `main`.

## Rejected as NOT worth merging (D1's "same invariant" bar, applied to structure not just assertion shape)

- **Cross-verb "`<verb> on a nonexistent id` / `<verb> with no id at all`
  is rejected as validation, exit 4"** (`review`, `approve`, `reject`,
  `catchup`, `move`, `discover`, `take --id`, `return`, `rollup` — 9
  single-assertion tests total). The assertion body IS the same shape
  (one `assert.equal(result.status, 4)`), but each test already sits
  directly next to that same verb's other error-path tests (e.g. `review`
  on a nonexistent id sits one line above `review` on a non-proposed item,
  exit 2) — moving them into one distant shared table would trade away
  per-verb locality for a saving of only ~5 net call sites, on tests that
  are already minimal (3-4 lines, single assertion). Per dev-rules
  ("split code only when it reduces real complexity"), this merge does
  not reduce real complexity, only relocates it — left unmerged, unlike
  the genuinely multi-line, multi-assertion flag-value clusters that were
  merged.
- **`inspectMainCheckoutLock reports "free"/"live"/"stale"/"ambiguous"`**
  (`test/runner/main-checkout-lock.test.mjs`, 5 tests) and the equivalent
  `lock-status` tests in `fgos.test.mjs` — looks like a textbook cluster
  (same function repeated) but each asserts a *different* classification
  outcome from different fixture state (missing file / live pid / dead
  pid / unparseable content) — different invariants, correctly left
  separate (reconfirmed, same conclusion as the first pass's report).
- The `--acceptance` malformed-JSON-shape tests (`add`/`edit`/`submit`)
  remain untouched, same reasoning as the first pass (JSON-shape
  validation is a different invariant from a scalar bad-flag value); their
  sub-case-count asymmetry (5/4/1) is a completeness gap, not a
  duplication problem, and out of this item's scope.

## Before / after (verify per D2)

| | Before this round | After this round |
|---|---|---|
| `test/cli/fgos.test.mjs` source-level `test(` call sites | 378 | 374 |
| `test/cli/fgos.test.mjs` lines | 6336 | 6312 |
| Full suite runtime test count (`npm test`) | 1701 (1696 pass, 5 skip, 0 fail) | 1701 (1696 pass, 5 skip, 0 fail) |
| Full suite run time | 114826ms (~114.8s), 1:55 wall | 87950ms (~88.0s), 1:28 wall |

Runtime test count unchanged by design (D1: preserve every edge case).
The ~27s run-time delta is background-load variance (this run happened
solo, no other test invocation concurrent), not a claimed optimization —
same conclusion the first pass's report already drew about its own
smaller delta.

Combined with the first pass (already in `main`): `fgos.test.mjs` source
sites are down from the original 377 to 374 net across both rounds (-3,
since 16 unrelated new tests landed via other merges in between), with
-20 tests actually consolidated into 4 parameterized tables and zero
coverage lost.

## Verify

`npm test` — full suite, 1701/1696/0/5, green. `detect_changes` (GitNexus,
scope=all): 0 changed symbols, 0 affected processes, risk low (test-only
edit, no source symbol touched).
