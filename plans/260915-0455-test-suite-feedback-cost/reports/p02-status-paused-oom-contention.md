# P02 Status - Paused On Machine Memory Contention

**Cell:** test-suite-feedback-cost--p02 @ `/home/vantt/projects/test-suite-feedback-cost-p02`
**Status:** infra implemented and tested; baseline sample collection BLOCKED and PAUSED per user decision (2026-09-15).

## What's done

`scripts/test-timing.mjs` + `test/scripts/test-timing.test.mjs` (25 tests, all
green), committed on this cell branch (`e1c8513e`, `d5932af0`, `6c903f70` on
top of the P01-merged track HEAD `8814c248`):

- Environment capture (SHA, Node, OS/arch, CPU count, loadavg).
- GNU `time -v` wrapping when present, explicitly labeled "process-tree CPU"
  (wait4 rusage over reaped descendants) per the Measurement Contract; graceful
  wall-clock-only degrade with an explicit "unavailable" label when absent.
- File-descriptor-redirected child stdout/stderr (fixed a real bug caught by a
  2MB-stdout integration test: `spawnSync`'s default 1MB `maxBuffer` would have
  silently truncated/errored a real ~6500-test run).
- Dirty-before/dirty-after git-clean gating, with an exact-match exclusion for
  the two symlinked build-artifact directories this track's worktrees use
  (`node_modules`, `target` -- both real-repo `.gitignore` entries are
  directory-only patterns that don't match a symlink, so `git status
  --porcelain` reports them as bare untracked entries; excluded by exact string
  match only, so a real dirty file nested under either name is unaffected).
- `summarizeSamples` refuses to average over any invalid sample.

## What's blocked

Real baseline sample collection (R2: 3 green full-suite samples; R3: 1
separate profile). Attempts:

1. Sample 1 (agent-session env, default concurrency): **succeeded** --
   status 0, wall 356.45s, user 2567.33s, system 601.33s, valid. (Later
   discarded for consistency once concurrency had to change -- see below.)
2. Sample 2 (ordinary-shell env, default concurrency): failed --
   `test/runner/coordination-research-fan-out.test.mjs`'s "R5 concurrency"
   timing-window assertion flaked under ambient load; confirmed a real flake
   (passes standalone), discarded per the Measurement Contract, not a
   regression.
3. Sample 2 retry (ordinary-shell, default concurrency): **process killed by
   an OOM-protection watchdog** -- system memory: ~1.5GB free, swap 2GB/2GB
   fully exhausted.
4. Sample 2 retry at `--test-concurrency=4`: succeeded -- status 0, wall
   752.17s, valid.
5. Sample 1 redo at `--test-concurrency=4` (for a consistent, comparable
   3-sample set): **killed again** (same OOM watchdog).
6. Sample 1 redo at `--test-concurrency=2`: **killed again.**

`ps` at the time of kills 3/5/6 showed several OTHER, unrelated Claude Code
and Codex agent sessions on this same shared machine concurrently running
their own heavy work (including at least one other track's own full `npm
test` run) -- this is genuine cross-session machine contention, not
something this cell's own `--test-concurrency` tuning can fix, since
reducing MY OWN concurrency from 16->4->2 did not stop the kills.

## Decision

Presented the blocker + options to the user; **user chose to pause this
whole track** rather than keep retrying, accept a caveated baseline, or ask
the user to free up the machine themselves.

## Resume checklist (when un-paused)

1. Re-check `free -h` / `ps` for ambient contention before retrying.
2. This cell's `scripts/test-timing.mjs` needs no further changes -- rerun
   `node scripts/test-timing.mjs sample --log-dir <dir>` (add
   `--test-concurrency=N` only if memory is still tight; keep it IDENTICAL
   across all 3 samples for comparability, and record whichever value was
   used in the final baseline report per the Measurement Contract).
3. Collect: 3 valid green full-suite samples (>=1 under inherited
   CLAUDE_CODE_SESSION_ID / agent-session env, >=1 under `env -u
   CLAUDE_CODE_SESSION_ID -u FGOS_SESSION_ID` ordinary-shell env, per R5),
   plus 1 separate green profile run (not yet designed -- P02's `test-timing.mjs`
   currently only has a `sample` mode; a `profile` mode forwarding
   `--test-reporter=junit --test-reporter-destination=<path>` to get
   per-test/file timing data for R6's "top files/tests and directory
   totals" is still to be written).
4. Write `reports/green-baseline.md` (median/min/max wall, labeled
   process-tree CPU, environment, retained artifacts) per the Handoff
   section of phase-02's own brief.
5. Do not merge this cell into the track until R1-R5 hold (Risk And
   Rollback: "do not open P03 until R1-R5 hold").

## Track state at pause

- Track branch `test-suite-feedback-cost` @ `4149bd31`: P00 + P01 merged,
  checkpoint 1 (full suite on the integrated branch) recorded green (zero
  regressions attributable to this track).
- Main unchanged at `bc989a66` since last sync (no re-sync needed on resume
  unless main has since moved).
- This P02 cell branch (`test-suite-feedback-cost--p02`) is NOT merged into
  track yet -- correctly so, since its own phase acceptance isn't met.
