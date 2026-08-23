# RESEARCH — tsk-5k1

## Round 1 — 2026-08-21T04:20Z (discovery stage)

**Asked:** Confirm the exact wiring/root-cause and fix-shape for the
opportunistic main-checkout checks regression tsk-5k1 describes (7 tests
failing with hardcoded-SHA / clean-tree assumptions after tsk-1ji landed).

**Checked:**

- `src/state/events-jsonl-truncation-guard.mjs:208-280`
  (`runOpportunisticMainCheckoutChecks`) — read directly.
- `src/runner/claim-port.mjs:123` — call site inside `claimWork`.
- `src/runner/merge.mjs:788` and `:911` — two call sites inside the merge
  lock-acquisition paths.
- `rg -n "FGOS_DISABLE_OPPORTUNISTIC_CHECKS"` across the repo.
- `package.json:27` — the `test` npm script.
- `git log --oneline -- src/state/events-jsonl-truncation-guard.mjs
  package.json` and `git log --oneline --all | grep tsk-oet`.
- Ran the exact 7 previously-failing tests two ways.

**Found:**

1. `runOpportunisticMainCheckoutChecks` (`src/state/events-jsonl-
   truncation-guard.mjs:209`) starts with `if
   (process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS === "1") return;` — an
   opt-out gate. `claim-port.mjs:123` and `merge.mjs:788`/`:911` all call
   it unconditionally (no test/CI branch of their own — the only gate is
   this env var, inside the function).
2. `git log` shows `8607438e fix(state): add opt-out gate for
   opportunistic main checkout checks (tsk-oet)`, landed on `main`
   directly on top of `5439eaa2 feat(state): add opportunistic truncation
   guard and periodic commit for events.jsonl (tsk-1ji)` — i.e. tsk-oet is
   exactly the fix-of-the-fix this item's own description hypothesizes is
   still missing. `plans/reports/investigation-260821-1050-eventlog-loss-
   merge-speed-root-cause-report.md:26` documents it explicitly: "Fix-của-
   fix: thêm `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` opt-out — vì chính
   guard tsk-1ji gây friction cho 1 luồng khác trong vòng 4 giờ sau khi
   ship."
3. `package.json:27`: `"test": "FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node
   --test 'test/**/*.test.mjs'"` — the real `npm test` entrypoint already
   sets the opt-out for every test run, not just the files tsk-oet's own
   verify scope touched.
4. `tsk-5k1`'s own branch (`fgw/tsk-5k1`, `branchHeadAtTake ==
   c6f486d6`) already contains `8607438e` — the fix predates this item's
   own claim.
5. Reran the exact 7 tests tsk-5k1's description lists as failing:
   - **Without** the env var (`node --test test/cli/fgos-claim.test.mjs
     test/cli/fgos-read.test.mjs test/cli/fgos-return.test.mjs` — i.e.
     bypassing `package.json`'s own `test` script wrapper): reproduces
     failures matching tsk-5k1's description exactly — e.g.
     `fgos-return.test.mjs:238` gets `actual: [{ file:
     '.fgos/events-jsonl.truncation-guard.json' }]` vs `expected: []`;
     `fgos-return.test.mjs:397` gets `3 !== 1` dirty paths;
     `fgos-return.test.mjs:762` gets a SHA mismatch. Confirms causation,
     not coincidence.
   - **With** `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` set (i.e. running the
     tests the same way `npm test` actually invokes them today):
     `test/cli/fgos-claim.test.mjs` + `test/cli/fgos-read.test.mjs` +
     `test/cli/fgos-return.test.mjs` together — **218/218 pass, 0 fail**.
     `test/e2e/runner-loop.test.mjs` (includes the "S2-pull" case tsk-5k1
     names) — **15/15 pass, 0 fail**.

**Still open:** none — the described regression does not reproduce under
the repo's actual `npm test` invocation as it stands today. No further
ambiguity to resolve at this stage.
