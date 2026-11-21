# Progress: phases 3 and 4 parked on owner questions

Lead: head:lead-forgent-261120-0625-work-d-ce9f6 (took over from the agy lead, whose Gemini account ran out of quota). Date: 2026-11-21, Asia/Saigon.

## Phase 3: claim test written, green, and parked on `q-fvulgjz2iz`

- The agy unit `c-22698-1795226101844` stopped on a provider limit and left an untracked draft at `apps/fgos/tests/concurrent_plan_claim.rs` in worktree `261120-0625-work-data-model-p03`.
- A claude unit (`unit-run-1795228746738-9abb2406`) could not run `cargo test`, because its sandbox refuses it. It left the draft unchanged. The runner then excluded the draft from the commit because the file existed before launch.
- The lead ran `cargo test -p fgos --test concurrent_plan_claim` on the draft: 2 passed.
- A unit in a fresh worktree `261120-0625-work-data-model-p03b` wrote the same content as a new file (`unit-run-1795228908372-d107d1d6`, outcome `pass`). The runner committed it as `2123353c1` on branch `work-data-model/p03b`. Its sha256 (`92740c14…`) is identical to the verified draft.
- Code review blocked the merge. Both tests duplicate owning proofs that already exist, which design principle 8 forbids:
  - `packages/supervision/rust/tests/land.rs:345` proves a branch conflict is refused with `land-conflict-aborted` and the remote tip is unchanged.
  - `land.rs:687` and `land.rs:824` prove the merge slot serializes concurrent lands.
  - `packages/identity/rust/tests/directory.rs:299` proves `role-held`.
- The lead read and confirmed each of these tests.
- Non-blocking review findings, which matter only if the file is kept:
  - The role test picks its role at runtime.
  - The test checks the local branch instead of `origin/main`.
  - The test names say "concurrent", but the two lands run one after the other.
  - The temp directory leaks if the test panics.
- Asked as `q-fvulgjz2iz`. Recommended: close the phase by citing the existing proofs and drop the file.

## Phase 4: edits made, uncommitted, and parked on `q-y3ypxlucin`

- The unit `unit-run-1795228751196-c4864eae` (outcome `blocked`) edited the four footprint files, 115 lines added and 7 removed, all uncommitted in worktree `261120-0625-work-data-model-p04`:
  - The grants now name `plans/backlog/*` and `plans/discussions/*`.
  - Publishing a backlog item validates it with `parse_backlog_item`.
  - The commit regenerates `plans/backlog.md` alongside the item.
- `fgos session write` still cannot create a new item file. In `packages/run-supervisor/rust/src/head_request.rs`, `granted_write` accepts only exact path matches and `open_granted` requires the file to already exist. That file is outside the plan footprint.
- Asked as `q-y3ypxlucin`. Recommended: add `head_request.rs` and its test to the footprint.
- Phases 5, 6 and 7 depend on phase 4 and wait for it.

## Runner frictions seen

- The claude worker sandbox refuses `cargo test` and `node --test`, so units cannot run their own verify.
- `fgos request result <id> --wait 50` is refused as `bad-args`, and `--wait=50` is accepted but returns at once without blocking. An earlier version of this report read the elapsed time from loops of such calls and wrongly said a ticket lagged its unit by about 35 minutes; the real lag was seconds. Wait on the run record (`unit-summary.json`) instead.
- `fgos run` dropped `--verify`, `--plan` and `--phase` from the ticket argv.
- The supervisor session `forgent-1d` was not listed in `ListAgents`, so the report could not be sent to it.

## Unresolved questions

- `q-fvulgjz2iz` (phase 3) and `q-y3ypxlucin` (phase 4) are open for the owner.
