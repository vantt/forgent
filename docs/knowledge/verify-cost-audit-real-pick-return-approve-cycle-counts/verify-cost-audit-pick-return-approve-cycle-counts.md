---
framework: diataxis
mode: reference
---
# Verify-cost audit: real pick/return/approve cycle counts

`tsk-vms` measured the real cost of an item's `verify` cycle directly
from `.fgos/events.jsonl` — a deliberately data-only item: no behavior
changed, no conclusions drawn about what to do with the numbers. It
exists to replace impression-based claims about "verify is too
expensive" with real counts, and to serve as input for two separate,
still-open decisions (named below) rather than deciding either one
itself.

Source: `.fgos/events.jsonl`, 9331 lines at the time of the run. Full
methodology: `docs/history/tsk-vms-verify-cost-audit/`. Full report:
`plans/reports/verify-cost-empirical-260807-1540-pick-return-approve-audit-report.md`.

## (1) Pick rounds per item, through `delivered`

| Metric | Value |
|---|---|
| Items ever delivered | 181 |
| Mean pick rounds | 3.10 |
| Median | 3 |
| Min / Max | 1 / 25 |
| First picks (from `todo`) | 316 |
| Re-picks (after `blocked`/other) | 246 |

Distribution: 1 pick — 63 items; 2 picks — 24 items; 3+ picks — 94 items.

Items **not yet** delivered (open/blocked/wontfix, excluded from the
mean above): 188, averaging 2.16 pick rounds so far.

`role: 'runner'` claims found in the log: **0** — confirms empirically
that every claim in this data is a real pull-door claim, not an
automated runner claim.

## (2) Return rounds, and how many resolve to `blocked`

| Metric | Value |
|---|---|
| Total return rounds (`doing` → `blocked`/`awaiting-approval`) | 425 |
| → `blocked` | 59 (13.9%) |
| → `awaiting-approval` | 366 (86.1%) |
| Mean return rounds per item that had any | 1.23 |
| Median | 1 |

### Approve rounds (a separate lifecycle step, same audit)

| Metric | Value |
|---|---|
| Total approve rounds | 256 |
| → `delivered` | 175 |
| → `blocked` | 81 (31.6%) |

Approve-blocked reasons (from the `reason` field): `merge-conflict` 32,
`verify-fail` 7, `verify-fail-post-merge` 22, `integration-drift` 10,
`fgos-write-rejected` 3, `merge-failed-unclassified` 7.

## (3) Real failure-cause distribution (`work.friction.errorClass`)

Total friction records: 138.

| errorClass | Count | Share |
|---|---|---|
| `verify-miss` | 85 | 61.6% |
| `merge-conflict` | 41 | 29.7% |
| `merge-failed-unclassified` | 7 | 5.1% |
| `fgos-write-blocked` | 4 | 2.9% |
| `worker-timeout` | 1 | 0.7% |

Disposition: `blocked` 134, `parked` 4.

**Splitting timeout from real verify-fail inside `verify-miss`** — this
split is a heuristic inferred from the `detail` string, **not** a
distinct original field (see the doc-history CONTEXT.md for the caveat):
suspected timeout (`detail` matching `"(exit null)"`) — **1**; genuine
verify-fail (`detail` carries a concrete exit code) — **84**. These two
numbers sum exactly to the `verify-miss` total above, an internal
consistency check.

`worker-timeout` is a genuinely distinct `errorClass` — no inference
needed, read directly: 1 record, sourced from a different dispatch
executor, not from `return`.

"Worktree drift" (`tsk-2cd`) has **no mechanical signal** in the event
log at all — not countable from data, only cross-referenced
qualitatively by id/timing against known bugs (`tsk-2cd`, `tsk-53o`).

## (4) Full-verify (`npm test`) run count — total and estimate

- Total full-verify runs across the whole log: **681** (425 from
  `return`, 256 from `approve`).
- The `approve`-sourced count assumes every approve re-runs verify
  locally (true when `--github` isn't used) — the log can't distinguish
  a `--github` approve (no local verify run) from an internal approve at
  the `to: delivered` transition, so this figure may run slightly
  **high** if any `--github` approves occurred; it is not a lower bound.
- Per-run duration is **not** inferred from timestamp gaps in the log
  (too noisy — includes human thinking time between steps) — the
  already-known 161–370s range (from the originating item's own
  description) is used as a qualitative multiplier, not a direct
  measurement.

## Data limitations, stated plainly

- The timeout-split heuristic in (3) depends on the `detail` string's
  current format — if that format changed in an older code version, the
  split could be slightly off.
- The count of approve rounds that ran verify locally may run slightly
  high if any historical approve used `--github`, which the log can't
  distinguish from an internal approve.
- "Worktree drift" isn't mechanically countable from this log at all —
  only listed qualitatively above.

## What this report deliberately does not conclude

This report draws **no conclusion** on either of the two decisions it
was gathered to inform:

- **Whether `discovery`-stage items should carry the full
  worktree/commit/full-suite-verify/merge ritual `executing` items
  currently carry** — the open D7 question named in
  `docs/history/fanout-and-delegation-rubric/DISCUSSION.md`.
- **Whether the `.fgos-runner.json` parallel-dispatch configuration**
  (`parallel.maxRoots: 4` × `maxLeavesPerRoot: 4` — up to 16 full test
  suites running concurrently) **is actually reasonable**, given the
  real per-run cost measured above.

Both remain open for a separate decision session to resolve, using
these real numbers as input rather than impression.
