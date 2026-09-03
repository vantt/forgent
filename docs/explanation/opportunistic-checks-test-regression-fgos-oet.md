---
authoritative_for: tsk-1ji opportunistic checks broke 7 tests, FGOS_DISABLE_OPPORTUNISTIC_CHECKS opt-out, tsk-5k1 verified already-fixed by tsk-oet
---

# A real 7-test regression from `tsk-1ji` — already fixed by the time this item ran

`tsk-5k1` reported a real, confirmed regression:
[`tsk-1ji`'s own opportunistic main-checkout checks](events-jsonl-opportunistic-truncation-check.md)
(`runOpportunisticMainCheckoutChecks`, wired into `claim-port.mjs` and
two sites in `merge.mjs`) caused unexpected extra commits/writes on the
main checkout that broke 7 pre-existing tests' hardcoded-SHA and
clean-tree assumptions — confirmed via a full `npm test` run on `main`
right after `tsk-1ji` + `tsk-3of` landed: 3768 tests, 3756 pass, **7
fail**, 5 skipped.

## The mechanism

`runOpportunisticMainCheckoutChecks` runs unconditionally on every claim/
merge-lock acquisition — no test/CI branch of its own, guarded only by
an internal `FGOS_DISABLE_OPPORTUNISTIC_CHECKS` env check. `tsk-1ji`'s
own verify scope (`claim-port.test.mjs` + `merge.test.mjs` only) never
ran the 7 affected files, so it shipped without catching this. The
clearest single signal: `tsk-1ji` wrote a new `.fgos/*` file
(`events-jsonl.truncation-guard.json`) that `fgos-return.test.mjs`'s
existing self-change exemption list (from `tsk-x5r`) didn't know about,
so it got flagged as an unexpected footprint hit.

## What discovery found: already fixed before this item was even claimed

Discovery research (not implementation) confirmed a separate item,
`tsk-oet`, had already shipped the fix directly on top of `tsk-1ji`:
`8607438e fix(state): add opt-out gate for opportunistic main checkout
checks (tsk-oet)`. `package.json`'s real `test` script already sets
`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` for every test run, not just the
files `tsk-oet`'s own verify scope happened to touch. `tsk-5k1`'s own
branch, at its own claim time, already contained that fix commit.

## Verified directly, not assumed

The exact 7 previously-failing tests were re-run two ways: **without**
the env var (bypassing `package.json`'s own wrapper) — reproduced the
failures exactly as `tsk-5k1`'s own description listed them, confirming
causation, not coincidence; **with** `FGOS_DISABLE_OPPORTUNISTIC_
CHECKS=1` set (the way `npm test` actually invokes them today) — **218/
218 pass, 0 fail.** This item's own contribution was verification and
documentation, not a new code fix — the real fix belongs to `tsk-oet`
(its own separate retrospective item).
