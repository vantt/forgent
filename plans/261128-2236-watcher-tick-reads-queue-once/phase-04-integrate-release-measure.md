# Phase 4: Integrate, release and measure live

Honors D4 (done is measured live: three consecutive full ticks on fg-server2 at most 60 s wall) and D3's live figure.
Criteria 3 and 4.

## Inputs

- `reports/measure-before.md` (phase 1).
- The landed branches of phases 2 and 3.
- `plan.md` § Unattended run, host steps marked phase 4.

## Files it may write

- `plans/261128-2236-watcher-tick-reads-queue-once/reports/measure-after.md`

## Steps

1. Lead: on the integrated tree (phase 2 and phase 3 commits together), run `fgos release check --worktree <path>`;
   a red check is an answer: fix in the owning phase, never here. Land.
2. Lead asks the supervisor (`fgos supervisor raise --kind coordination-help`, naming the argv) to run
   `fgos release run` on fg-server2 and to report the activation time.
3. Supervisor, after activation: run `fgos supervisor queue --json` three times and record each wall time (the
   checkpointed fold; the first run may write the checkpoint and be slower, report all three).
4. Supervisor, at least five minutes after activation: run
   `fgos metrics query --kind fgos.watcher.tick --since <activation time> --json` (answers `ask`). Take three
   consecutive full ticks: each followed by the next tick about one interval later with no `skipped-busy` tick between
   them means each finished inside the 60 s interval; record raised, duplicate, outcome and spacing per tick.
5. Lead: write `reports/measure-after.md`: the three ticks with their figures and the before figures from
   `reports/measure-before.md` side by side; the fold time before (phase 1, F) and after (step 3) for criterion 4.
6. Criterion 3 fails (a full tick over 60 s): that is a `core` deviation. Record the figures and raise it to the
   supervisor under the run-time ask rule; do not mark the plan done. Criterion 4 not met: record as named debt in
   the closing report and ask the secretary for a backlog row; the plan still reaches `done`.

## Verify

`reports/measure-after.md` shows three consecutive full ticks within 60 s each, with the source command for every
figure, and the fold cost before and after. `cargo test --workspace` and `npm test` green on the integrated tree
(inside `fgos release check`).

## Rollback

`git revert` the phase 3 and phase 2 commits on main, then `fgos release run` by the supervisor (or
`fgos release run --rollback` while a release step is in flight). The store is unchanged by the plan: the same
envelopes are appended, and the checkpoint file is a cache the store overrides.
