# plan.md — tsk-3tp-1

Mode: standard (single child of `tsk-3tp`; decisions already locked at the
parent — see `docs/history/tsk-3tp-worker-write-events-tang-b/CONTEXT.md`
D1-D4 and `docs/history/tsk-3tp-worker-write-events-tang-b/plan.md`, whose
`## Split decision` JSON names this item's own `action`/`footprint`/
`verify` verbatim as the first of the two D4 children).

## Approach

Per D2/D4: retire the dedicated periodic-commit branch in
`src/state/events-jsonl-truncation-guard.mjs` (`PERIODIC_CHECKPOINT_INTERVAL_SEC
= 900`, `DEFAULT_CHECKPOINT_EVENT_THRESHOLD = 50`, its own eager "no prior
commit yet -> commit immediately" trigger, and its dedicated
`chore(.fgos): periodic events.jsonl checkpoint` commit message), and
replace it with a single sparse fallback keyed on the oldest dirty shard
file's mtime under `.fgos/events.jsonl`/`.fgos/events/`
(`checkpoint.fallbackIntervalSec`, default 3600s, committing as
`chore(.fgos): fallback events checkpoint` — a deliberately different
message so a grep for the old literal string is real proof the eager
mechanism is gone). `src/runner/merge.mjs`'s `mergeRunnerItemLocked` now
sweeps whatever is dirty/untracked under `.fgos/events.jsonl`/
`.fgos/events/` into its own staged merge commit, right before that
commit lands — the common case (a merge happens before the fallback
interval elapses) never needs the fallback commit at all.
`src/setup/registrations.mjs`'s `checkpoint` config default follows
(`fallbackIntervalSec` replacing `eventThreshold`), and `bin/fgos.mjs`'s
`FGOS_NOISE_ONLY_PATHS` is extended to exempt the truncation guard's own
sidecar mark and warnings log from `footprintDiffHits`, same as
`events.jsonl` already was.

P0 (mandatory re-verify at claim, per the parent plan.md): confirmed
Tầng A (`tsk-3ve`) landed on `main` in the shape the parent plan.md
assumed — shard dir `.fgos/events/` active, multi-file replay
(`replay.mjs`'s `readAllEventsFromDir`, dedupe-by-hash), compaction
(`events-compaction.mjs`). No plan-shape mismatch; this branch was simply
cut before `tsk-3ve` merged, so it needed `git merge main` (already done,
clean, no conflicts) before implementing on top of the real current
shape.

| Site | Risk | Proof point |
|---|---|---|
| `src/state/events-jsonl-truncation-guard.mjs` (checkpoint trigger) | heavy | `node --test test/state/events-jsonl-truncation-guard.test.mjs` |
| `src/runner/merge.mjs` (sweep-at-merge) | heavy | `node --test test/runner/merge.test.mjs` (new: shard-in-merge-commit + no-separate-checkpoint-commit tests) |
| `src/setup/registrations.mjs` / `bin/fgos.mjs` (config default + noise-path exemption) | standard | `node --test test/setup/checks.test.mjs test/cli/fgos-return.test.mjs` (new: sidecar/warnings exemption test) |

No proof point leans on blast-radius/impact-analysis evidence beyond
what's already recorded in the parent plan.md's own Validation section
(GitNexus posture at plan time: `present` but index stale — Degraded;
blast radius confirmed by direct grep of the guard's call sites
(`merge.mjs:793,920`, `claim-port.mjs:140`), all already
`commitEnv`-only and forward-compatible with the new signature).

## Shape

One piece, no further split — the declared footprint from the parent
plan.md's own `## Split decision` JSON: `src/state/events-jsonl-truncation-guard.mjs`,
`src/runner/merge.mjs`, `src/runner/claim-port.mjs`, `src/setup/checks.mjs`,
`CHANGELOG.md`, `test/state/events-jsonl-truncation-guard.test.mjs`,
`test/setup/checks.test.mjs`.

`src/runner/claim-port.mjs` and `src/setup/checks.mjs` needed zero edits:
`claim-port.mjs`'s existing call to `runOpportunisticMainCheckoutChecks`
already only passed `commitEnv`, already forward-compatible with the new
signature; the actual `registerConfigDefault` call for `checkpoint` lives
in `src/setup/registrations.mjs` (which `checks.mjs` imports from), so
that file carried the real edit instead. `test/runner/merge.test.mjs` and
`test/cli/fgos-return.test.mjs` gained new tests outside the declared
list — a necessary consequence of proving `merge.mjs`'s own change and
`bin/fgos.mjs`'s own noise-path fix, not scope creep.

## Known gaps (not fixed here, out of this task's declared footprint)

`test/runner/claim-port.test.mjs`'s "claimWork reads the event log fully
4 times per call, not 6 or 7" assertion was red at this branch's own
baseline (8 reads, not 4) before this item touched anything, and stays
red after (6 reads, not 4) — a separate, pre-existing over-read
regression from Tầng A's multi-file read path, unrelated to
checkpoint-commit timing. See `docs/history/tsk-3tp-1/iron-law-evidence.md`
for the full failing-before/passing-after transcript this item's own
change produced, and this remaining gap's own detail.

## Outstanding questions

None.
