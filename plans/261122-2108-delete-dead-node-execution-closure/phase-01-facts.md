# Phase 1: Facts — recompute the dead closure and the test dispositions

Capability: `code:test` (an evidence read; changes no code).

## Inputs

- `plan.md` of this plan, sections Decisions and Non-goals.
- The landed tree of plan `261122-0118-heads-stable-and-able` (check that its `plan.md` says `status: done`).
- `docs/architecture-manifest.json`: every row whose `retiredBy` or entry reason names `p-24xw2cwdvo`
  (`git grep -n p-24xw2cwdvo -- docs/architecture-manifest.json test/architecture.test.mjs`).
- `plans/261118-1341-s6a-execution-tier-rust/reports/close.md` section 1 (the rows and their owners).
- The `"recorded from src/runner/…"` and `"src/run-supervisor/…"` notes in `packages/execution/contracts/**` and
  `packages/run-supervisor/contracts/**`, which map a Node module to the corpus fixture its Rust test reads.

## Footprint

`plans/261122-2108-delete-dead-node-execution-closure/reports/closure.md` only. Keep any helper script under `.fgos/runtime/tmp/`, never in the repository.

## Steps

1. Record the base: `git rev-parse HEAD` of `main` at the time this phase starts.
2. Build the import graph over `git ls-files '*.mjs' '*.js' '*.cjs'` (excluding `.agents/`, `plugins/`, and
   `node_modules`). Count static `import … from`, `export … from`, bare `import '…'`, `import('…')`, and
   `new URL('….mjs')` with relative specifiers. Live roots are all files outside `test/` and outside the three
   directories `src/runner/dispatch/`, `src/runner/execution/` and `src/run-supervisor/`. A file in the three
   directories is **live** if a live root reaches it, directly or through other files in the three directories.
   Otherwise it is **dead**. On base `4dffbaad4` this method gives 89 files, 27 live and 62 dead.
3. For every dead candidate, run `git grep -n '<basename without .mjs>' -- src bin scripts domains packages apps` and
   explain each hit that is not an import from a dead file or a comment. A hit that loads the file by a string path
   moves it to live.
4. Write the **live-kept table**: each live file, its first live importer, and its owner step. The owners are the
   frozen mailbox harness (mailbox lane re-measure), S6b (`src/workflow/definition.mjs` twins), S7
   (`src/setup/seat-binding-checks.mjs` bind facade, session-head callers), and whatever `261122-0118` left.
5. Write the **dead table**: path and line count.
6. Write the **test-importer table**: every file under `test/` that imports a dead file, the dead files it imports,
   the number of other product modules it imports, and how many files import it. Give each row a provisional
   disposition (`retire` when it imports no other product module and nothing imports it, `rewire` otherwise)
   and its owning phase (2 to 7, by the footprints in `plan.md`). A row that falls outside every footprint goes to a
   list headed **Outside every footprint**. The lead turns that list into a footprint-widen question before wave 2
   starts.
7. List the non-test, non-doc files that name a dead path as text (manifest rows, contract notes, Rust comments,
   skills) and assign each to phase 8 or phase 9.

## Verify

`plans/261122-2108-delete-dead-node-execution-closure/reports/closure.md` exists and names the base commit and the method. Its dead-table and live-table counts add up
to the number of files in the three directories (`git ls-files src/runner/dispatch src/runner/execution
src/run-supervisor | wc -l`). Its **Outside every footprint** list is empty, or the lead has raised it as a question.

## Rollback

Delete the report.
