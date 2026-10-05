# Hand-off unification, slice 1 (2026-10-05)

Implements steps 1-6 of `advisor-handoff-unification-design-261005.md`. Branch `worktree-agent-accfff695a6111ce0`.

## What changed, per step

1. **Store.** `src/workflow/store.mjs`: `unit.complete` now sets `units[unitId].unitRunId`; the dead `unitRunId: p.unitRunId` on `unit.scheduled` is gone (a scheduled unit has no id yet).
2. **History module.** `src/runner/execution/unit-run-history.mjs` holds `readUnitRunHistory(unitDir)` (the old `history()` body, unchanged) and `outcomeOfRunResult` (moved out of `run.mjs`; nothing else imported it, so no re-export).
3. **Resolver.** `src/runner/execution/handoff-refs.mjs`: `reportRefOf(record, {mainRoot, worktree})`, `reportRefsOf(records, where)`, `resolveUnitInputs(inputs, mainRoot)`, `HandoffRefError` (carries `reason`). Order for one record: `settleReports[0]` re-hashed (mismatch gives `report-changed-after-settle`), else the first `evidence.artifacts` entry (settlement keeps only a valid report and the claim, so without a report that is the claim; no file-name regex), else the inline record's `evidenceRefs` against the unit worktree, else `no-report`. `unit-run:` refs: highest round, history already keeps the latest fallback attempt; `no-such-run` (also for an id that escapes `.fgos/assignments`), `no-such-role`. `role-input-refs.mjs` and its test deleted; manifest row replaced and `unit-run-history.mjs` added.
4. **Wiring.** `run.mjs`: on a new run `resolveUnitInputs` runs after `validateUnit` and before the unit directory is created, stored as `unit.json` `resolvedInputs`; resume throws `no resolvedInputs` if absent; `dispatchBound` uses `[...new Set([...resolvedInputs, ...reportRefsOf(inputs)])]`; `history` calls the new module.
5. **Workflow.** `src/workflow/runner.mjs`: `buildUnitObjective` replaced by `buildUnitHandoff` returning `{objective, inputs}`. Objective = template objective + `Owner request:` + an index with one `### step / unit (unit run <id>)` heading and `Summary:` line per earlier unit. `inputs` = `unit-run:<id>/<role>` for each distinct role of every unit of every transitive dependency step (same `collect()` walk, visibility unchanged). Removed the 6000-char limit, the report read, the `endsWith('agent-report.md')` lookup and the false ".fgos is closed to workers" comment.
6. **Docs.** `docs/specs/runner.md`: the paragraph "Truyền kết quả giữa các vai..." rewritten (Vietnamese, includes the `unit-run:` grammar, resolver, `resolvedInputs`, the `/tmp` and remote-host notes, and the human-gate gap) plus a new decision entry 0053. `docs/routing-handoff-contract.md`: one bullet in "Ranh giới tin cậy". `CHANGELOG.md` `[Unreleased]` / Changed: one line.

**No component-boundary change.** The Workflow still calls `runUnit`; the resolver only reads Execution Core storage.

## Tests

Added: `test/runner/execution/handoff-refs.test.mjs` (10 tests: settled report, edited report, claim, inline, empty, ordering/dedupe, unit-run resolve, pass-through, three named failures, rounds and fallback). `run.test.mjs` (2): contextRefs and `resolvedInputs` equal `['docs/a.md', <abs report>]`, resume reuses the list even after the earlier report was edited, resume without `resolvedInputs` is refused, bad ref throws before any new unit dir exists; the existing panel/reviewed tests still pass. `workflow-runner.test.mjs` (3): "request flows through" rewritten (prompt 2 has the summary and `unit run unit-run-`, not the report text; the one path to the first run's report holds the text); panel step then solo step gives 4 context refs; store keeps `unitRunId`.

Guard grep for the removed names over `src test docs bin core` returns nothing.

Narrow runs, all green: handoff-refs 10/10, run.test 32/32, workflow-runner 16/16, architecture test green.

Full suite: 6542 pass, 52 fail (all rust-host, see the last section).

## Deviations from the design

- Error text is `handoff-ref-unresolved: <subject>: <reason>` for both in-run and `unit-run:` refs (design wrote `unit-run-ref-unresolved`); one prefix for one error class.
- The "read the full reports" sentence appears once in the index header rather than once per unit.
- The claim fallback takes the first `evidence.artifacts` entry rather than a typed claim field (none exists); correct only because settlement lists nothing else, which the resolver comment states.
- An inline record contributes only its first evidence ref.
- Not done, as instructed: gate answers reaching later units; per-role `rUnit.inputs`; YAML persona/params; anonymized copies; the live cheap-executor check (maintainer).

## Open questions

- Several evidence refs on an inline record: first only is handed over. Say if all should be.
- Environment note: the sandbox hook blocks bash text containing `node_modules`/`target`, and refuses `env ... test` in worktree agents; the suite was run with `unset CLAUDE_CODE_SESSION_ID; npm test`.

## Full suite

`npm test` (session id unset): 6667 tests, 6542 pass, 52 fail, 8 skipped. All 52 failures are in `test/rust-host/` (fgctl-init 20, fgctl-stage 13, fgctl-upgrade 16, release-tree 3), none in runner, workflow or architecture tests. They need the Rust fgctl build and a staged legacy-node payload; in this worktree `target` is a symlink to the main checkout and node_modules is symlinked, so I take them as an environment limit, not a regression, but did not re-run them on a clean main to prove it.
