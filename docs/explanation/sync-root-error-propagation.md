---
authoritative_for: sync-root's generic "merge-failed-unclassified" fallback discarding the real underlying git error (result.error) before it ever reached the CLI response or friction detail, confirmed live during tsk-1vc's own incident
---

# `sync-root`'s unclassified-outcome guard knew the real git error and dropped it anyway

`tsk-3tv` fixed a bug in `src/verbs/merge/sync-root.mjs`'s `runAndReport`
generic fallback branch. That branch exists to catch any `mergeRunnerItem`
outcome not already handled by name — its own comment says it deliberately
"catch[es] whatever this call site does not already handle by name." When
it fired, it reported `{ outcome: 'blocked', reason: result.outcome, ... }`
to the CLI caller, with no `error` field at all.

## The information was already there — just never read

`mergeRunnerItem` (`src/runner/merge.mjs`) already captures the real error
when its own try/catch around the initial `git merge --no-commit --no-ff`
call fires: `{ outcome: 'merge-failed-unclassified', branch, error: {
message, stderr, status } }`. The generic fallback guard never read
`result.error` — it only wrote `result.outcome` (the bare label
`"merge-failed-unclassified"`) into the friction record's detail text,
never the actual git stderr/exit status underneath it.

## Confirmed live, not theoretical

Driving `tsk-1vc` on 2026-08-21: `fgos sync-root`'s CLI output, `fgos check
<id>`'s friction summary, and every other read-only verb gave no more than
the bare label `"merge-failed-unclassified"` — no actionable detail. Only
calling `mergeRunnerItem(repoRoot, item, opts)` directly, bypassing the CLI
entirely, revealed the real cause: `"Command failed: git merge --no-commit
--no-ff fgw/tsk-1vc\nYour local changes to the following files would be
overwritten by merge:\n  .fgos/events.jsonl"`, exit 128 — a one-line,
immediately actionable diagnosis the tool had already captured internally.
This forced roughly 30 minutes of ad hoc reproduction scripts to rediscover
a cause the code already knew.

## What shipped

The fallback guard now threads `result.error` (when present) into both
channels that previously dropped it:

- the friction record's `detail` text gains an `errText` suffix —
  `` (exit ${status}): ${stderr || message}`` — appended after the bare
  outcome label,
- the CLI response object spreads `...(result.error ? { error: result.error
  } : {})`, so a caller reading the JSON response directly also sees the
  real error, not just the outcome name.

`test/cli/fgos-merge.test.mjs`'s existing `tsk-12o` test was extended to
assert the real error text now surfaces; the adjacent `tsk-3df` case stays
green unchanged.

## Same class of gap as `tsk-1cp`, different half

`tsk-1cp` (done, not detailed here) already guarded this same code path
against silently reporting false success on an unrecognized outcome. That
item never addressed error-detail propagation — only the false-success
risk. `tsk-3tv` closes the other half: once the guard correctly refuses to
report success, it now also reports *why*, instead of forcing a caller to
reproduce the failure by hand to find out.
