# tsk-34y — test-suite assertion-shape duplication: quantify + consolidate

Plan: `docs/history/test-suite-dry-consolidation/plan.md` (D1/D2:
`docs/history/test-suite-dry-consolidation/CONTEXT.md`)

## Scope actually done

Scanned `test/cli/fgos.test.mjs` (the dominant file, 6149 lines / 377
source-level `test(` call sites, next-biggest file only 1497 lines) for
assertion-shape clusters where multiple hand-written tests assert the same
invariant (bad/bare/empty value on one flag of an otherwise-valid CLI
invocation -> exit 4, no event written), differing only by which flag/value
is plugged in.

Confirmed and merged 3 clusters into parameterized (data-table + one test
body) form, matching this repo's own existing table-driven pattern
(`test/runner/session-identity.test.mjs`'s `for (const [label, x] of TABLE)
{ test(...) }` shape — reused, not invented):

| Cluster (verb) | Individual tests before | Rows in merged table |
|---|---|---|
| `add` bad-flag-value | 9 | 9 |
| `submit` bad-flag-value | 8 | 8 |
| `move` bad-flag-value | 2 | 2 |
| **Total merged** | **19** | **19** |

Net source-level `test(` call sites removed: 19 individual tests replaced
by 3 loop constructs = **-16 call sites** (19 - 3).

Also checked the other 6 test files the plan named as scan targets
(`test/state/replay.test.mjs`, `test/runner/dispatch.test.mjs`,
`test/runner/loop.test.mjs`, `test/intake/plan.test.mjs`,
`test/intake/discovery.test.mjs`, `test/state/store.test.mjs`) for the same
kind of duplication — none dominate the way `fgos.test.mjs` does (34-63
tests each) and none showed a comparable repeated-shape cluster worth
merging in this pass.

## Rejected as NOT the same invariant (D1's "read the assertion, don't
guess from the name" clause)

- `move` "proposed -> todo with an empty --reason" (was line 1399) needs a
  `toProposed()` setup precondition, unlike the generic `addOk()`-only
  precondition the merged move cluster uses — different setup shape, kept
  separate.
- The three "malformed `--acceptance`" tests (`add`/`edit`/`submit`, each
  already internally looping several bad-JSON-shape sub-cases in one test
  body) were NOT folded into the flag-value tables above: they test JSON
  *shape* validation (not-JSON / not-array / missing-text / empty-text),
  a materially different invariant from a single bad/bare scalar flag
  value. Left as-is.
- `take`/`return`/`reject`/`goal` each had 2-3 "exit 4" tests originally
  counted in the item's 54-hit grep, but on inspection each asserts a
  *different* trigger (e.g. `take`: invalid --role value vs. empty
  frontier vs. id-not-found) rather than the same invariant repeated
  across inputs — correctly left unmerged.

## Before / after (verify per D2)

| | Before | After |
|---|---|---|
| `test/cli/fgos.test.mjs` source-level `test(` call sites | 377 | 361 |
| `test/cli/fgos.test.mjs` lines | 6149 | 6064 |
| Full suite runtime test count (`npm test`) | 1655 (1650 pass, 5 skip, 0 fail) | 1655 (1650 pass, 5 skip, 0 fail) |
| Full suite run time | 96999ms (~97.0s) | 86959ms (~87.0s) |

Runtime test count is **unchanged by design** — D1 requires preserving
every edge case's coverage, so merging duplicate-shape tests into a
parameterized table does not remove any executed test case, only the
duplicated hand-written source shape. The real, provable reduction is in
source call sites (-16, -4.2%) and file lines (-85). The ~10s run-time
delta is within normal variance for this suite, not a claimed optimization
target.

## Verify

`npm test` — full suite, 1655/1650/0/5, green. Matches D2's acceptance bar
exactly (no fixed numeric quota; quality-based, only confirmed
same-invariant duplicates merged).
