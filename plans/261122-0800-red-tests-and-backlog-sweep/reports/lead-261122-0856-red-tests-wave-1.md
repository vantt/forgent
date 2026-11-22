# Wave 1 of the red-tests sweep: five phases landed, phase 4 parked

Lead: `head:lead-forgent-261122-0800-red-te-96f0f`. Date: 2026-11-22.

## Outcome

Phases 1, 2, 3, 5 and 6 are on main, each through `fgos land` with its named tests in the gate. Phase 4 is parked on
owner question `q-4qtu54bnxz` because its green needs one fixture outside the plan footprint. Phase 7 (integration
gate) depends on phase 4 and has not started.

| Phase | Main commit | Gate tests | Review |
|---|---|---|---|
| 1 confinement portfolio paths | f25ab4c9a | the three `test/runner/dispatch-confinement-*` files | two blocking findings fixed in 4aa0a7e81, re-reviewed clean |
| 2 convention portfolio names | eb3378b49 | `test/scripts/convention-conformance.test.mjs` | fmt and missing risk-bullet test fixed in f12cbbe8c, re-reviewed clean; reviewer ran `cargo test -p fgos-convention` green |
| 3 colon tab label | c831999d4 | `test/plugins/terminal-skill-attach.test.mjs` | clean |
| 5 portfolio sample paths | bb9675c8d | `test/scripts/check-decision-citation-drift.test.mjs` | clean; first land refused by `cargo fmt --all --check` on `dir_replace.rs`, fixed in 8d48c1fbb |
| 6 environmental four | 1fee82c55 | none (report only) | lead review; invented backlog id and overstated verdicts corrected in db2b50b14 |

## Phase 4: parked

The unit's two edits are correct (reviewer ran `cargo test -p fgos-config`: 33 binaries green, `golden_schema` and the
scrub test fixed). `authoring_equivalence.rs:181` then fails because `["secretary"]` becomes a standard-only path that
`packages/config/contracts/fixtures/repo-differences.v1.json` does not record. The fixture has no recorder; a750637d3 is
the hand-edit precedent. Branch `red-tests-and-backlog-sweep/p04` (ceb38f145) waits in its worktree; on a yes, one unit
appends the row and the branch lands.

## Phase 6 verdicts

- `test/git/one-door.test.mjs:58`: code cause. The scan pages the whole live repository for a fixture subdirectory;
  reproduced `inspect-cursor-stale` by changing untracked files between status pages. Needs a new backlog row.
- `test/install-packaging.test.mjs:71`: code cause, deterministic in the main checkout while its `.fgos` holds the two
  directory symlinks. Owner S6a.
- `apps/fgos/tests/cli_tests.rs:3666` and `supervise_portable.rs:274`: environmental by elimination, not reproduced
  under one parallel `cargo test`. The second has a single unretried probe; hardening candidate, new backlog row.

## Follow-ups routed in plan.md "Handed to other plans"

The two new backlog rows above, the install-packaging fix for S6a, and one owner decision from the phase 1 review:
since a1022572a the secretary and supervisor can write `plans/backlog*` directly through the read-write `plans` bind,
around the `session write` door and its validation.

## Not verified, and frictions

- The rewritten secretary case in `dispatch-confinement-backend-p03.test.mjs` skips without bwrap. Every unit and reviewer
  sandbox lacked it, and a passing land keeps no gate log, so its first observed run with bwrap is phase 7's full gate.
- Phase 2 non-blocking: the launch cutoff falls back to any rule's cutoff if the `report` rule ever loses its cutoff
  (could loosen), and an unused `Array.isArray(cutoffResolver)` branch remains in `scripts/convention-conformance.mjs`.
- `fgos request result <id> --wait 50` is refused as `bad-args`, and `--wait=50` is ignored; tickets were polled instead.
- The lead's confinement makes worktrees and `target/` read-only and a checkout cannot load the git addon, so the lead
  cannot run tests itself; the first phase 6 unit (claude, bwrap) could not run tests either and was rerun on gemini.
- A scratch question file left in the plan directory made one land refuse `main-checkout-dirty-overlap`.

## Unresolved questions

- `q-4qtu54bnxz`: widen the footprint by `repo-differences.v1.json` for phase 4?
