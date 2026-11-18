# Phase 00: facts, census, port map

Wave 1. Depends on: S5 phases 11 and 12 on `main`. Effort 1.5d. Writes only `reports/`.

## Context

The planner's scan (`plans/reports/planner-261118-1347-s6a-facts-and-design.md`) was read before S5 closed. S5 phases
11 (doctor rows; makes `seat-binding-route` `bridge:S6a`) and 12 (doors rows with `retiredBy: S6a`, twins D7) change
the inputs. Every build phase reads this phase's `reports/facts.md`, not the scan.

## Requirements

Produce `reports/facts.md` with these sections; every row cites `file:line` on the post-S5 `main` sha (record it):

1. **Module port map.** Each of the ~122 Node files under `src/runner/execution`, `src/runner/dispatch`,
   `src/run-supervisor`, `src/verbs/{worktree,dispatch}`, `src/runner/dispatch.mjs`, and the D5 functions of
   `src/runner/worktree.mjs` -> target crate and module (P1, P2: `fgos-execution` pure, `fgos-checkout`,
   `fgos-execution-engine/<module>`, `fgos-run-supervisor/controller`, host wiring) -> the phase that ports it -> the
   phase that deletes it (the one removing its last caller). Any module group over 2 500 Node lines in one phase is
   split here, by file, and the plan lead updates the phase table.
2. **Consumer census (seam).** Every symbol imported from those paths by a file outside them (scan §2 command), each
   classed: `host` (long operation: `fgos run --unit`, `fgos internal execution <op>`), `addon` (pure, engine also
   needs it: `execution` namespace), `move-up` (only one Node layer uses it: `git mv` target named), `row` (dies with a
   doctor row of phase 15 or 17), `config` (switches to the existing config facade under `src/config/`), `script`
   (test-infra script: name its Rust or kept door). Owner phase per row.
3. **Admission port calls.** For a standalone `fgos run` (read-only, `--writes`) and a workflow run: which of
   `resolveBinding|admit|recheckEffect|settle` are asked, from `src/runner/execution/{run,unit-run-start}.mjs`. Decides
   when P5's Node peer is exec'd.
4. **Doctor rows.** The 30 `bridge:S6a` rows plus `seat-binding-route`: Node judge `file:line`, `fixes` entry, the
   Rust module that will judge it, phase 15 or 17. The live Node callers of `src/seat-binding/client.mjs` (P11).
5. **Doors rows.** Every row with S6a in `retiredBy` or a `debt` path under the deleted directories, with the phase that
   closes it (scan §6 plus S5 phase 12's rows).
6. **Tests.** Every Node test file that imports a deleted path: behaviour list, its Rust owner phase, or "behaviour
   removed". Every `apps/fgos/tests/cli_tests.rs` and crate test that already covers a behaviour (no second proof).
7. **Golden recorders.** Per engine module, the Node entry the vectors are recorded from and the recorder script
   location (`.fgos/runtime/tmp/`, never committed).
8. **Prior art.** `git log -S` / `-G` on each moved exported symbol and on renamed ids; anything removed earlier and
   why (AGENTS.md "Prior art before design").
9. **Collisions.** Board rows and open branches of plans 1045 and 0947 touching the footprint; landed shas.
10. **Baselines.** `git-one-door-scan` count, Node line counts per directory, `test/suite-baseline.json` shares of the
    tests to retire.

## Steps

1. `git pull`; read the board rows of S5, 1045, 0947. Record the `main` sha.
2. Re-run the scan commands of the planner report sections 2-6 on that sha.
3. Fill sections 1-10. Use `fgos dispatch decide --for impact-analysis --json`; if full, run GitNexus `impact`
   upstream on `runUnit`, `createWorktree`, `executeAssignment`, `loadRunnerConfigForDir`; cross-check zero results
   with `rg`.
4. Propose phase table edits (splits, footprint corrections) at the end of `facts.md`; the plan lead applies them.

## Validation

`reports/facts.md` exists; every section has rows; every port-map file appears once; the census row count equals the
import hit count of step 2.

## Risk and rollback

Risk: a missed importer surfaces at deletion time (phase 20/21 fails). Mitigation: section 2 count check. Rollback:
delete the report.
