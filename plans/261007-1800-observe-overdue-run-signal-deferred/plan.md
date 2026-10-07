---
title: "Observe: overdue run signal (deferred until a real hung run exists)"
description: "Design for flagging a run whose worker never settled, kept ready but not built: no run in the data has died this way, so it would fix no measured number."
status: deferred
priority: P3
branch: main
tags: [observe, run-result, rust, measurement]
created: 2026-10-07
---

# Observe: overdue run signal

## Decision

**Deferred on 2026-10-07 by the owner.** Build it only when the trigger below fires.

## Why deferred

The gap was raised as M4 in the third acceptance round (`plans/reports/opus-third-acceptance-code-261006.md`): a run whose process dies never settles, so Observe does not count it as a failure. A check of the data on 2026-10-07 found no such run:

| What was suspected | What the data shows |
|---|---|
| 46 "undetermined" units are crashes | They are legacy records with no stored pattern (`unit-summary.mjs:77-80`), already excluded from the pass rate (`discussions.rs:85`) |
| About 5 hung units | 2 in forgentX and 3 in mdview, all with pattern empty and **zero run directories**; none has a run without `result.json`. They are leftovers, not workers that died |

So neither the run-level nor the unit-level signal would change a number today. The priority order in `AGENTS.md` (ship faster; polish after the definition of done, without opening scope) points to waiting.

## Trigger

Build it when a real run shows up with no `result.json` after `startedAt + timeoutMs`, found by the manual check below or reported by a person. A dead worker seen once in the wild is enough.

Manual check (read only; prints runs without `result.json` that are past their deadline):

```python
import json, glob, os, time, datetime
now = time.time()
for p in glob.glob(os.path.expanduser('~/projects/*/.fgos/assignments/**/runs/*/run.json'), recursive=True):
    base = os.path.dirname(p)
    if os.path.exists(base + '/result.json'): continue
    try: j = json.load(open(p))
    except Exception: continue
    t, timeout = j.get('startedAt'), j.get('timeoutMs')
    if not t or not isinstance(timeout, (int, float)) or timeout <= 0: continue
    started = datetime.datetime.fromisoformat(t.replace('Z', '+00:00')).timestamp()
    if now > started + timeout / 1000 + max(0.25 * timeout / 1000, 300): print(base)
```

## Design, ready to build (advised by Kongming, 2026-10-07, accept with changes)

Rust run level first, in one phase; no Node change.

- **Rule.** A run is overdue when its directory has no `result.json` **and** a parseable regular sibling `run.json` has an RFC3339 `startedAt` and a numeric `timeoutMs > 0` **and** now is later than `startedAt + timeoutMs + max(25 percent, 5 minutes)`. Do not key on `status === 'running'`: settlement only rewrites it when a caller passes `updateRunJson` (`settlement.mjs:730-737`). The supervisor kills a worker at `timeoutMs` and records a `timeout` receipt (`detached-run-supervisor.mjs:549-571`), so a run past its deadline with no result means the supervisor or controller died.
- **Where.** The scanner skips a directory without `result.json` as `missing-result` before reading anything else (`packages/run-result/rust/src/lib.rs:523-529`) and reads `run.json` only for `settledAt` (`lib.rs:569-580`). The new read happens on that branch, so the contract (`packages/run-result/contracts/run-result.read.v1.json:50-58`) and the spec line (`docs/specs/observe.md:55`) change in place, per the single-user no-compatibility rule.
- **Output.** Additive top-level `runsOverdue: { count, runIds }` (bounded list) in the `metrics coverage` payload. Never a new `skipped` reason: that would break `observed + sum(skipped) = runDirsSeen` and the Node projection. `layoutRule` stays `v2`. Document it as a candidate signal, the same posture as `summariesMissing` (`observe.md:62`).
- **Doctor.** One row that is skipped when the key is absent (older host) and fails only on a malformed shape.
- **Determinism.** Thread an injectable `now` through `scan_runs` (`lib.rs:378-398` already passes `now` to the walker); add fixture entries to `test/fixtures/run-layout/expected.json`, which Node and Rust already share.
- **Headline.** Leave the windowed `passRate` alone: a missing record has no settle time and cannot be placed in a `--since/--until` window (`observe.md:62`).

## Known false positives to document

Resumed attempts (the old `startedAt` stays while the supervisor restarts its clock, `assignment-runner.mjs:1024-1030`, `detached-run-supervisor.mjs:407`); `timeoutMs` of 0 or not a number (the supervisor applies 900000, so treat as no deadline); superseded attempts after `--force-new-attempt` that are never tombstoned.

## Not covered by a run level signal

A unit whose seats all settled but whose `unit-summary.json` never landed (writer crash, failed settlement write), and inline seats (no `run.json`). Add a unit level label only if this happens in practice, and put it with the Node writer that owns the unit summary contract (`observe.md:59`). Clearing a hung unit also needs a way to settle the unit, which `fgos dispatch reconcile` was not found to do; check this when the trigger fires.

## Acceptance criteria (when built)

- A planted run past its deadline with no result appears in `runsOverdue` with the right id; a resumed run, a `timeoutMs` of 0 and a run inside tolerance do not.
- `observed + sum(skipped) = runDirsSeen` still holds; `passRate` is unchanged for the same input.
- Node and Rust agree on the shared fixture; an older host is detected, not failed.
- Spec line and a decision note in `docs/specs/observe.md`; CHANGELOG line.

## Open questions

1. Is the 25 percent / 5 minute tolerance right for the longest runs seen in practice?
2. Should superseded attempts be tombstoned by the writer so they stop counting?
