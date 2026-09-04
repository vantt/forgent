---
authoritative_for: fgos preflight verb aggregating 3 already-standalone-runnable checks (mirror-sync-diff, decision-citation-drift, backlog-reconciliation) so they run in seconds before return/merge instead of only surfacing after a full npm test; deliberately a driver-skill-invoked verb, never a blocking pre-commit hook, confirmed live via 2 same-day incidents
---

# Three checks that already ran fast, but only got read after the slow suite finished

`tsk-4e1` added `fgos preflight`, a new verb aggregating three checks that
each already ran standalone in seconds, but were only ever discovered
after `npm test` finished running everything else — a wait of tens of
seconds to minutes, right before merge, when the cost of a caught error is
highest.

## Confirmed live, same day, both instances

- **mirror-sync-diff** — `agy`'s own dispatch for `tsk-3av` synced only
  `.agents/skills/fgos-fanout/SKILL.md`, missing
  `plugins/fgOS/skills/fgos-fanout/SKILL.md` — one of three required
  mirrors. Had to be manually caught and fixed with `build:skills` + a
  manual copy.
- **decision-citation-drift** — the same session bare-cited `"D5"` in skill
  prose, violating the decision-citation-drift rule (decision 0017). This
  was only caught AFTER the full `npm test` run finished, right at the
  point of merge.

`scripts/check-decision-citation-drift.mjs` and
`scripts/check-backlog-reconciliation.mjs` were already independently
runnable — no dependency on the full test suite to invoke them, just no
single door surfacing them earlier.

## What shipped

A new `fgos preflight` verb (`bin/fgos.mjs` `case 'preflight'`,
registered in `src/cli/command-registry.mjs`) runs all three checks —
`mirror-sync-diff`, `decision-citation-drift`, `backlog-reconciliation` —
via `spawnSync` against the current checkout's own git toplevel,
aggregating results the same way the existing `doctor` verb aggregates its
own checks. Any failure throws `StoreError('validation', ...)` for a real
nonzero exit code.

## Deliberately a driver-invoked verb, not a git hook

The item's own description is explicit about this design choice: this
verb is meant to be *called* by the driver skill (`fgos-coding-implement`),
never wired in as a blocking pre-commit hook. A hard-blocking hook creates
pressure to reach for `--no-verify`, which would open a new bypass door for
all 5 `.fgos` invariants the pre-commit hook already protects — a strictly
worse trade-off than an opt-in verb the driving skill calls proactively
before `return`/merge.
