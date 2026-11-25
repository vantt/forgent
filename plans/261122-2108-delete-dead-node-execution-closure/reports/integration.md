# Phase 10: integration

The plan is done. Every phase has landed on main. The last land was the e3-bench fix, `19ed722cd`
(ticket `c-42410-1795620548310`), whose gate ran `test/git/scoped-commit.test.mjs` and passed.

## Full suite (run by the supervisor, unconfined, one suite at a time, release `33f462be`)

| Command | Commit | Result |
|---|---|---|
| `npm test` | `87abd4c89` (21:41 to 21:51) | 6617 tests, 6571 pass, 19 fail, 27 skipped |
| `cargo test --workspace --no-fail-fast` | `482ffa59e` (21:51 to 22:00) | 4470 pass, 2 fail |

### What the failures were, and what became of them

- **cargo, 2 in `apps/fgos/tests/authority.rs`. This plan's, fixed.** The component-boundary view drifted from the
  model after the phase 9 docs commit `60a8c30e7`. It was re-rendered in `152946109` (landed `1b2139422`). The
  supervisor's rerun of `cargo test -p fgos --test authority` passed 6 of 6.
- **npm, `test/git/scoped-commit.test.mjs`. This plan's, fixed.** `scripts/git/e3-bench.mjs` loads the old
  `commit-unit-work.mjs` from `512e8cd2a` and pointed its import of `src/runner/dispatch/write-scope.mjs` (deleted in
  phase 11) at the checkout. The bench now loads such a missing import from the same old commit (`3f606efe8`,
  landed `19ed722cd`). Before the fix it was 25 pass and 1 fail on main, and 26 of 26 on `f8974a757`, the commit before the
  first deletion. The land gate passes it now.
- **npm, `test/git/one-door.test.mjs` and `test/rust-host/dev-host.test.mjs`. Not this plan's.** Both fail on
  `inspect-cursor-stale` only while main moves during the run. `dev-host` passed on retry, and `one-door` was also red at
  18:34, before phases 9 to 11.
- **npm, the 16 known failures. Red on main before this plan's lands.** They are terminal-cutover (8),
  provider-per-cli-credential-sources (2), guide-schema (2), install-packaging, terminal-crash-matrix,
  convention-conformance and one-door (2). See `plans/reports/supervisor-261125-1838-npm-test-24-failures-on-main.md`.

Targeted runs before and after the deletion: `reports/supervisor-261125-2213-phase-10-targeted-runs-before-and-after-deletion.md`.

## Acceptance criteria

| # | Result | Evidence |
|---|---|---|
| 1 | Met | All 63 paths of the dead table in `reports/closure.md` are absent from `git ls-files` on main. 23 files remain under the three directories: the live-kept files and the files the frozen mailbox harness reaches. |
| 2 | Met | No `import` or `import()` in `*.mjs` or `*.js` names a dead path. The only textual hits are history notes and pins in contract prose, and two string fixtures in `test/architecture.test.mjs`. |
| 3 | Met | Six `reports/tests-*.md` tables (phases 2 to 7), plus `reports/node-twin-debt.md` for phase 11. |
| 4 | Met | `git grep -c p-24xw2cwdvo -- packages/component-authority/model/ test/architecture.test.mjs` prints nothing. |
| 5 | Met | Phase 8 and phase 11 regenerated the census with `--write-census`. Every land gate since then ran `test/setup/git-mutation-census.test.mjs` and the `0 undeclared` one-door scan, and they passed. |
| 6 | Met for this plan | The three failures this plan caused are fixed, and the rest were red on main before it (above). `npm test` is not green on main overall. |
| 7 | Met as corrected | `decide a dispatch`, `tool lookup by capability` and `the footprint and write-scope overlap rule` are off `NAMED_DOOR_DEBT`. `derive executor facts` stays, because its three twins are live (see the corrected criterion in `plan.md`). |

## Baseline

`test/suite-baseline.json` was rewritten by `node scripts/test-proof-inventory.mjs --write-baseline --wall-seconds 585`
on `482ffa59e`: 504 files, 6143 `test()` calls, 4762 Rust tests and 585 s wall. The CPU figure is still 6199 s, because
the writer takes CPU only from a full run recorded on its own HEAD. The next full run on a recorded commit refreshes it.

## Follow-ups (not in this plan)

- Backlog `p-uojivokdqy`: move the Rust assignment-tree walks onto the engine's layout.
- `src/setup/registrations.mjs:572` still has a comment that names `listAgents`. `apps/fgos/src/wiring/run_dirs.rs` keeps a
  `node_lister_rows` override that is no longer needed.
- Tooling: `fgos run` cuts its commit subjects at about 100 characters, writes no body, and sometimes uses an
  `adhoc-…` scope. A unit skips a path that was already dirty when it started. The run door once refused
  `write-outside-footprint` for a path the trunk already allowed; an identical retry was accepted.
