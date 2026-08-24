---
title: tsk-3tp confirmation round 4 (final)
scope: narrow, review-only — confirm round 3's doc fix (89352d50) and re-run full suite
worktree: /home/vantt/projects/forgentX/.claude/worktrees/tsk-3tp-0YK44Z (branch fgw/tsk-3tp)
---

# tsk-3tp — confirmation round 4

Context: round 1 fixed a real bug (`c784cb9e`), round 2 was clean, round 3
found doc-only staleness fixed in `89352d50`. This round confirms that fix
and re-runs the full suite. No fixes applied by this round.

## 1. Full test suite (`node --test`, bare, no args)

```
ℹ tests 3882
ℹ pass 3875
ℹ fail 2
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 188533.7
```

Both failures are the two known/tracked, pre-existing issues named in the
task brief — no new failures:

1. `herdr-plugin/web/src/api/client.test.ts` — fails on `main` itself
   (unrelated to this branch).
2. `test/runner/claim-port.test.mjs` — `claimWork reads the event log fully
   4 times per call, not 6 or 7` — asserts `4`, actual `6`. Tracked as
   `tsk-3tb`; per the task brief this was already confirmed by round 3 to be
   strictly better on this branch than on `main` (not a regression). This
   round did not re-derive that comparison — took it as already-verified per
   the round-3 report chain — but the failure signature (6, not some new
   value) matches what round 3 recorded, so nothing looks different this
   round.

Verdict: genuinely green modulo the two known/tracked issues.

## 2. Doc fix from `89352d50` — content verification

Read all three touched docs in full.

- `docs/explanation/events-jsonl-lost-update-race-under-concurrent-session-writes.md` —
  now opens with a "Superseded mechanism, current state" block describing
  the real current mechanism: `.fgos/events.jsonl` frozen as baseline
  (tsk-3ve), new events land in per-writer shard files under
  `.fgos/events/<writer-id>-<openTs>.jsonl` with content-hash `h` identity,
  periodically compacted, dirty shards swept into the next merge/approve
  commit with a `checkpoint.fallbackIntervalSec` (3600s) fallback for quiet
  stretches. The old union-merge-driver + `scripts/events-jsonl-contiguity.mjs`
  material is explicitly reframed as historical ("no longer describe the
  live mechanism"), and every place the deleted script is mentioned in the
  body is qualified as historical/no-longer-exists. Links to
  `docs/history/tsk-3tp-worker-write-events-tang-b/` for the full record.
- `docs/how-to/resolve-an-events-jsonl-truncation.md` — correctly states the
  `events-jsonl-contiguous` doctor check/fix pair was retired by `tsk-3tp`
  along with the `.gitattributes` `merge=union` entry and
  `scripts/events-jsonl-contiguity.mjs`, and that it is "no longer part of
  `fgos doctor`'s registry." The truncation-guard check itself (unrelated
  mechanism) is untouched, correctly.
- `docs/how-to/resolve-an-events-jsonl-merge-conflict.md` — now opens with a
  "Superseded" note stating `.fgos/events.jsonl` is a frozen baseline, new
  events land in per-writer shards (content-hash `h`, not `seq`), dirty
  shards are swept into merge/approve commits rather than hand-merged, and
  that both `scripts/check-events-seq-contiguity.mjs` and
  `scripts/events-jsonl-contiguity.mjs` were deleted and are wired into
  neither `npm test` nor `fgos doctor` any more. Body steps are kept as
  explicit historical record ("Historical — these entry points no longer
  exist").

Cross-checked against the actual repo state:

- `scripts/events-jsonl-contiguity.mjs` and `scripts/check-events-seq-contiguity.mjs`:
  confirmed absent (`ls` → No such file or directory for both).
- `.gitattributes`: confirmed only the `tsk-2xg` entries remain
  (`approve-post-success-faults.jsonl`, `invocation-faults.jsonl`,
  `main-checkout-guard-warnings.jsonl`, all `merge=union`) — no
  `.fgos/events.jsonl merge=union` entry present.
- `src/runner/merge.mjs:1356` carries a live comment naming the tsk-3tp D2
  sweep of `.fgos/events/` + `.fgos/events.jsonl` into the staged merge
  commit — matches what the docs now describe as current.

All three docs accurately describe the current mechanism and no longer
present the deleted tooling as current/wired-in.

## 3. Grep for other docs referencing the same deleted tooling

```
grep -rln "events-jsonl-contiguity.mjs" docs/
grep -rln "check-events-seq-contiguity" docs/
```

Every hit outside the three docs fixed in `89352d50` is under
`docs/history/**` (point-in-time investigation/decision records — e.g.
`tsk-24e`, `tsk-1lv-4`, `events-jsonl-merge-driver-recurring-write-loss`,
`tsk-49e-incremental-read-snapshot`, `tsk-3tp-worker-write-events-tang-b`,
`tsk-1vc-silent-eventlog-loss-detection`, `tsk-4te-partial-claim-event-loss`,
`eventlog-tier-a-multifile-content-hash`, `tsk-5nj-state-json-write-only-cost`,
`tsk-3ve-3`, `catchup-manual-merge-fgos-write-rejected-deadlock`,
`events-jsonl-git-tracked-truncation`, `live-events-seq-corruption`,
`decision-code-check-enforcement`, `tsk-vms-verify-cost-audit`,
`storytelling-material-probe`, `tsk-18t`). These are historical narrative by
design — they record what was true/decided at the time — not
current-mechanism docs, so referencing deleted tooling there is correct, not
staleness.

One additional hit checked outside `docs/history/`: `CHANGELOG.md` line 13,
under `## [Unreleased]`:

> "Retired the `.fgos/events.jsonl` seq-contiguity band-aid: removed
> `.gitattributes`'s `merge=union` entry for it,
> `src/state/events-jsonl-contiguity.mjs`,
> `scripts/events-jsonl-contiguity.mjs`,
> `scripts/check-events-seq-contiguity.mjs` ... and the `fgos doctor`
> `events-jsonl-contiguous` check/fix pair."

This is a changelog entry describing the retirement itself, correctly in
past tense — it does not present the deleted tooling as current. Not a
finding.

`docs/specs/` and `README.md` had no hits.

No other doc was missed by the `89352d50` fix.

## 4. Commit `89352d50` scope check

```
git show 89352d50 --stat
```

```
 .../events-jsonl-lost-update-race-under-concurrent-session-writes.md | 58 ++++++++++++++++++----
 .../resolve-an-events-jsonl-merge-conflict.md                        | 24 ++++++++-
 docs/how-to/resolve-an-events-jsonl-truncation.md                    | 17 +++++--
 3 files changed, 83 insertions(+), 16 deletions(-)
```

Doc-only, exactly the three files named in the task brief. No `src/`,
`scripts/`, `test/`, or config files touched. Confirmed the doc-only fix did
not accidentally touch or break anything else.

## Note (out of scope, not a finding)

`git status --short` in this worktree shows 16 locally-modified/deleted
`.fgos/*` entries (state files, event shards) relative to the worktree's own
git index. This is local worktree runtime state divergence, unrelated to
commit `89352d50`'s diff (confirmed doc-only above) and unrelated to the doc
content being reviewed. Not investigated further as it is outside this
round's scope (doc-fix confirmation + test suite), and the task explicitly
says not to fix anything this round.

## Verdict

CLEAN. Test suite green modulo the two known/tracked issues. All three docs
touched by `89352d50` now accurately describe the current mechanism
(tsk-3ve sharded `.fgos/events/` + tsk-3tp merge-time sweep/fallback) and
correctly mark the deleted tooling as historical, not current. No other
current-facing doc was missed. The fix commit is doc-only, scoped exactly
to the three files it claims.
