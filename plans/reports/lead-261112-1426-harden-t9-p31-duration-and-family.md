# HARDEN T9 P31: Execution writes each attempt's wall time; the binding family is the one Workflow reads

Branch `harden/t9-p31-duration-and-family`, rebased onto origin/main after P30 (`b2fc5cf80`) and P33. Contract: `docs/platform/runner/contracts/unit-run-result.md` section 4, rows `binding.family` and `durationMs, usage`.

## What changed

- **`binding.family`.** Nothing to compute: `bind` already writes `family` on the binding (spelled by `familyOf`, P21) and `data.results[].binding` carries the whole binding. The gap was Workflow guessing it: `src/workflow/seat-providers.mjs` took it from `runResult.policy.providerModel` and a `familySpread` field that is not on the binding. It now reads `binding.family`; a result written before the field keeps the policy value through one named legacy reader, `legacyFamilyOf` in `src/runner/execution/legacy-seat-read.mjs` (lead decision). No Rust change.
- **`durationMs`.** `runAttempt` (`src/runner/execution/run.mjs`) times the dispatch of one seat with `performance.now()` (monotonic) and records whole milliseconds on the attempt record in `unit.json`; `finishUnit` writes it as `runResult.durationMs` through `extendedRunResult` (the P30 helper), reading it back from the record, so a resumed run hands up the same value. A seat that never ran, and a record written before this, read `null`. Dispatch's own `durationMs` (null from the supervisor settle) is overwritten by Execution's measure. The span is launch hand-off to settled result, so it includes lease and pane start-up; it is the attempt's wall time as the caller waited for it.
- **Fixtures.** Every golden file gains `runResult.durationMs` (null for the refused and never-started seats) and `binding.family`; README and the Node owner test check both. The Rust fixture test still passes unchanged (`cargo test -p fgos-run-result`).
- **Contract text:** the two "Today" cells say present. CHANGELOG line added. Phase file `phase-31-duration-and-family.md` and the sub-plan row added.

## Proofs

- `test/workflow/seat-evidence.test.mjs`: family read from the binding, legacy policy value for an old result, `null` when neither exists (owner of the legacy reader).
- `test/runner/execution/run-case-admission.test.mjs` "a Unit run hands up its final outcome ...": `durationMs` is a whole number on the result and equals the attempt record's; the seat's binding says `family`.
- `test/runner/execution/unit-run-result-fixtures.test.mjs`: shape of both fields in every golden file.
- Red first: the two last tests failed before the change (`/dev/shm/p31-red.log`).

## Gate

Focused: 83 files (all of `test/workflow`, `test/runner/execution` and every test naming `run.mjs`, `seat-providers`, `legacy-seat-read`, the outcome exit codes) plus architecture, doc-health, git-mutation-census: 1018 pass, 0 fail. Citation drift: known red on the document-identity spec. `node scripts/git-one-door-scan.mjs`: 0 undeclared, census regenerated. `cargo fmt --all --check` clean, `cargo test -p fgos-run-result` green; no crate changed, so no clippy or msvc/darwin check. Real run through the dev host, `fgos run "Reply with the single word ok..." --provider deepseek --rigor low --json --dir <main>`: outcome `pass`, `results[0].binding.family` = `deepseek`, `runResult.durationMs` = 23123. Full `npm test`: see the landing line on the board.

## Not done / found

- `usage` stays `null` (no source; the contract says so).
- `--rigor low` bound the `advanced` tier for deepseek (its cell); not this phase's.
- A first real run with the default gemini pane seat did not settle in 9 minutes and was stopped by my own timeout (the run directory shows a supervisor close); cause not investigated.
- Contract section 3 still says `results[]` is "present except `infrastructure` and `output`"; both are written now (P07, P30). Left for the close phase (P16).

## Authority

- The provider family of a seat is Seat Binding's (`binding.family`). Workflow no longer holds a second source; the one fallback for old records sits in Execution's legacy seat reader. Done.
- The attempt duration is Execution's: measured around the dispatch, recorded on the attempt record. Dispatch's `durationMs` parameter (`settlement.mjs`, null from `settle-attempt.mjs`) is a second slot for the same fact with no writer; whether the supervisor should fill it is T4's call (it observes launch and exit more narrowly than Execution does). Not moved.

## Lessons

- A "new mechanism" cell in a contract can already be half built: reading what `bind` returned and what the result carried turned "bind hands it up" into a one-line Workflow change. Check the real result before scoping.
- Rebasing a branch with several commits over a hot generated file (the census) conflicts at every commit; regenerate once at the end, taking either side during the rebase.
- A pane seat on the default executor can outlast a 9-minute wall; for a real-run acceptance pick a known headless provider with `--provider`, and `--dir <main>` from a worktree.
- run-tests takes files, not directories, and zsh does not word-split `$F`; use `${=F}`.
