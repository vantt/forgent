---
type: how-to
title: How to fix a verify command that mixes prose with a real command
tags: []
timestamp: 2026-07-29T10:44:23.697Z
source_capture_ids: [tsk-34y]
---
# How to fix a verify command that mixes prose with a real command

Use this when `fgos return <id>` reports `blocked` and the `output` field
shows a shell syntax error (e.g. `Syntax error: "(" unexpected`), not an
actual test failure — the item's own `verify` field is not valid,
executable shell, so the shell chokes on it before any real check runs.

## Before you start

- This is a different problem from an unrelated flaky test breaking
  `return` (see `diagnose-a-blocked-return-from-an-unrelated-verify-failure.md`
  for that case). Here, the shell itself refuses to parse the command at
  all — no test ever actually ran.
- Read the item's current `verify` field first: `fgos list --json` or
  `fgos check <id>`.

## Steps

1. **Confirm it's a syntax error, not a test failure.** `return`'s JSON
   response's `output` field for a broken verify command looks like a
   shell error, not `node --test` output:

   ```
   "output": "/bin/sh: 1: Syntax error: \"(\" unexpected\n"
   ```

   A real test failure instead shows `node --test`'s own `not ok` / `✖`
   lines. If you see a bare shell syntax error like the above, the command
   string itself is broken.

2. **Read the actual `verify` string and spot the mixed-in prose.** An
   engine-auto-judged verify (written by `judgeDecompose` during `fgos
   discover`) can end up as a real command followed by a parenthetical
   explanation appended as if it were still shell:

   ```
   npm test -- --grep fgos 2>&1 | tail -5 (before/after: count `it(` in
   test/cli/fgos.test.mjs before change vs after; before/after wall-time
   via `time npm test`); require final report state test count reduced
   and all tests still green
   ```

   The trailing `(...)` is prose meant for a human reading the item, not
   for a shell — but since it's stored as one string, the shell tries to
   execute the whole thing and trips on the first unescaped `(`.

3. **Replace it with the real, runnable command only.** Move any
   human-facing acceptance detail (report requirements, before/after
   numbers) into the item's decision doc or a written report instead of
   the `verify` field — `verify` must stay a bare, executable command:

   ```
   fgos edit <id> --verify "npm test"
   ```

4. **Move the item back to `doing` and retry `return`.** A failed `return`
   leaves the item `blocked`, and `blocked` items can't take a normal
   `fgos take` — move status directly instead:

   ```
   fgos move <id> --to doing
   fgos return <id>
   ```

## Why this exists

`fgos discover`'s decompose-stage judgment (`judgeDecompose`) can
auto-generate a `verify` string that reads fine to a person but is not
actually executable shell — it is model-authored text, not a human
double-checking the command runs. Nothing downstream validates that a
freshly-judged `verify` string is syntactically valid shell before it's
stored, so the break only surfaces later, at `return` time, when the shell
actually tries to run it.

## Real example

Item `tsk-34y` (consolidating duplicate assertion-shape tests in
`test/cli/fgos.test.mjs`) had its `verify` field auto-set by `fgos
discover` to:

> `"npm test -- --grep fgos 2>&1 | tail -5 (before/after: count \`it(\` in test/cli/fgos.test.mjs before change vs after; before/after wall-time via \`time npm test\`); require final report state test count reduced and all tests still green"`
> — real `verdict.verify` field from `fgos discover`'s own output

Its first `fgos return` came back:

> `{"id":"tsk-34y","from":"doing","to":"blocked","source":"branch","branch":"fgw/tsk-34y","aheadCount":3,"passed":false,"exitStatus":2,"output":"/bin/sh: 1: Syntax error: \"(\" unexpected\n"}`
> — real `return` output for the first, failing attempt

The actual test consolidation work was already correct and fully green
(`npm test` run manually beforehand: 1655 tests, 1650 pass, 5 skip, 0
fail) — the block was purely the unparseable verify string. Running
`fgos edit tsk-34y --verify "npm test"`, then `fgos move tsk-34y --to
doing` and `fgos return tsk-34y` again produced a clean pass with no code
change in between, confirming the first block was a verify-field defect,
not a regression in the work.

## Related

- `fgos check <id>` — full outcome/friction history for an item, including
  the entries quoted above (`friction.recent[].errorClass: "verify-miss"`).
- `diagnose-a-blocked-return-from-an-unrelated-verify-failure.md` — the
  companion how-to for when `return`'s verify actually runs but fails due
  to unrelated flakiness, rather than never running at all.
