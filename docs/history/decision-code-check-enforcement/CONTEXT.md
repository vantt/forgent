# decision-code-check-enforcement — locking how the new check handles the existing backlog

Item: `tsk-3ch`. Deliverable is an automated check that stops the
"decision code in a test name" rule (`review-audit-self-decision.md`,
Stable Code Artifacts: "Do not put plan IDs, phase numbers, audit labels,
or finding codes in code comments, migration names, test names, or commit
messages") from silently recurring — the rule already exists in prose but
nothing in this repo's own verify/CI ever checked it.

## Feature boundary

`tsk-3ch` depends on `tsk-3wr` (the one-time cleanup of test names already
carrying decision codes) "finishing first" specifically so the check does
not go red the instant it is turned on. `tsk-3wr` shows `status: done`.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | The check ships as a **ratchet against a checked-in baseline
      snapshot**, not a strict zero-tolerance gate. It records today's
      known violations in a committed baseline file and only fails on a
      finding NOT already in that baseline — i.e. it hard-blocks any *new*
      decision-code test name from this point forward, while existing
      debt stays visible (the check still reports it) but non-blocking
      until a separate cleanup item shrinks the baseline. Chosen over (a)
      hard-blocking everything immediately — rejected because it would
      turn `npm test` red repo-wide the moment the check lands, on debt
      this item was never scoped to clean up — and (b) warn-only forever —
      rejected because it does not actually block anything, failing the
      item's own core ask ("cơ chế CHẶN", a mechanism that blocks). |

## Pinned terms

- **"Baseline"** — the checked-in snapshot of every currently-known
  decision-code violation (file + matched line text) at the time the
  check was introduced. Not a target to shrink automatically; a
  follow-up cleanup item can regenerate it smaller later.
- **"New violation"** — a finding whose `(file, matched line text)` pair
  is not present in the baseline for that file. A brand-new test file is
  "new" in full (it has no baseline entry at all); an existing baselined
  file gets a new blocking finding only for lines not already recorded.

## Scout evidence

- Re-ran `tsk-3wr`'s own verify regex
  (`grep -rnP "^\s*(test|it|describe)\(\s*['\"].*\b(str[0-9]{2,3}|D[0-9]{1,2}\b|RUL[0-9]{2,3}|STR[0-9]{2,3}|tsk-[0-9a-z]{3})\b" test --include='*.test.mjs' --exclude='next-doc-id.test.mjs'`)
  against the live `test/` tree on `tsk-3ch`'s own branch (forked from
  `main` @ `9bff1bbc`, the commit at claim time, re-verified reproducibly
  across repeated runs at implementation time): **254 matches across 50
  of 117 test files (42.7%)** — essentially the same violation rate as
  `tsk-3wr`'s original baseline (49%, 34/70 files, measured 2026-07-28),
  against a test suite that grew from 70 to 117 files in the ~12 days
  since. `tsk-3wr`'s own friction log (`.fgos/events.jsonl`) shows 5
  straight `blocked` merge attempts (`cross-root integration drift` /
  `merge-conflict`) before a human force-closed it — either the cleanup
  never actually landed cleanly on `main`, or (more likely, given the
  percentage held steady while the file count grew) unrelated ongoing
  work kept reintroducing the same pattern in new files roughly as fast
  as old ones were cleaned. Either way, the "clean baseline before
  turning the check on" precondition this item's own dependency assumed
  does not hold in the live repo right now.
- `scripts/check-decision-citation-drift.mjs` +
  `test/scripts/check-decision-citation-drift.test.mjs`,
  `scripts/check-decision-supersession.mjs` — this repo's existing
  convention for a "check script" of this shape: pure functions exported
  for unit testing, a CLI entry point that exits 1 on findings, 0 on
  none, and a `test/scripts/*.test.mjs` file that both unit-tests the
  pure functions and end-to-end tests the CLI against a tmp fixture dir.
  Neither existing script uses a pre-commit hook or a dedicated
  `package.json` script for a real-repo run; both are proven purely
  through their own `test/scripts/*.test.mjs` file, which `npm test`
  (`"test": "node --test 'test/**/*.test.mjs'"`) already picks up
  automatically. No baseline/ratchet precedent exists yet among these —
  this item introduces that shape new.
- `.githooks/pre-commit` — confirmed this repo's only pre-commit hook is
  the STR65 main-checkout activity lock; it has nothing to do with
  content checks, so there is no existing pre-commit path this item
  could piggyback on even if it wanted to.
- `fgos tool query --capability impact-analysis --status present`: 1
  provider, `gitnexus`, `status: "present"` → posture **full** per
  `CLAUDE.md`'s impact-analysis gate. Informational only — this session
  writes no code, only this decision doc.

## Outstanding questions

None
