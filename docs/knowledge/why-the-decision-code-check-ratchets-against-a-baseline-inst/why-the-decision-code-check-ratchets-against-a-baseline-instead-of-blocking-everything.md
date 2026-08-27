---
type: explanation
title: Why the decision-code check ratchets against a baseline instead of blocking everything
tags: [decision-codes, verify, test-conventions, ratchet]
source_capture_ids: [tsk-3ch]
framework: diataxis
mode: explanation
---
# Why the decision-code check ratchets against a baseline instead of blocking everything

`review-audit-self-decision.md`'s Stable Code Artifacts rule already said
"do not put plan IDs, phase numbers, audit labels, or finding codes in
code comments, migration names, test names, or commit messages" — but
nothing in this repo's own verify/CI ever checked it. The rule existed
only as prose a person had to remember, not a mechanism. `tsk-3ch` built
`scripts/check-decision-codes.mjs`: it scans `test`/`it`/`describe` names
for a decision-code pattern (`str##`, `D#`, `RUL##`, `STR##`, `tsk-xxx`)
and reports each match, wired in through
`test/scripts/check-decision-codes.test.mjs`, which `npm test` already
picks up automatically — the same shape this repo's other check scripts
(`check-decision-citation-drift.mjs`, `check-decision-supersession.mjs`)
already use: pure functions exported for unit testing, a CLI entry point
that exits 1 on findings, proven through its own test file rather than a
pre-commit hook or dedicated `package.json` script.

## Why not hard-block every match immediately

A companion cleanup item, `tsk-3wr`, was supposed to finish first so this
check would not go red the instant it was turned on. Re-running `tsk-3wr`'s
own detection regex against the live `test/` tree on `tsk-3ch`'s own
branch found **254 matches across 50 of 117 test files (42.7%)** —
essentially the same violation rate as `tsk-3wr`'s original baseline
(49%, 34/70 files), even though the test suite had grown from 70 to 117
files in the twelve days between. `tsk-3wr`'s own friction log shows 5
straight blocked merge attempts before a human force-closed it: either
the cleanup never landed cleanly on `main`, or — more likely, given the
percentage held steady while the file count grew — unrelated ongoing
work kept reintroducing the same pattern in new files about as fast as
old ones were cleaned. Either way, the "clean baseline before turning the
check on" precondition `tsk-3ch`'s own dependency on `tsk-3wr` assumed
did not hold in the live repo.

## The chosen design: ratchet against a checked-in baseline

The check records today's known violations in a committed baseline file
(`scripts/check-decision-codes.baseline.json`) and only fails on a
finding *not already in that baseline* — it hard-blocks any brand-new
decision-code test name from this point forward, while existing debt
stays visible (still reported) but non-blocking until a separate cleanup
item shrinks the baseline. A "new violation" is a finding whose
`(file, matched line text)` pair is not already present in the baseline
for that file; a brand-new test file has no baseline entry at all, so
every match in it counts as new.

Two alternatives were rejected: hard-blocking everything immediately
would have turned `npm test` red repo-wide the moment the check landed,
on debt this item was never scoped to clean up. Warn-only forever was
rejected too — it doesn't actually block anything, failing the item's
own core ask (a mechanism that blocks new occurrences, not just reports
them).

## Related

- `docs/history/decision-code-check-enforcement/CONTEXT.md` — the full
  decision record (D1: ratchet-against-baseline) and the scout evidence
  behind it.
- `scripts/check-decision-codes.mjs` — the check itself.
