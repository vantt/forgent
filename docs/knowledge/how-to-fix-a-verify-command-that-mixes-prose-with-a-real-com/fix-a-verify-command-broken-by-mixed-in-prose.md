---
type: how-to
title: How to fix a verify command that mixes prose with a real command
tags: []
timestamp: 2026-07-29T10:44:23.697Z
source_capture_ids: [tsk-34y, tsk-45u]
framework: diataxis
mode: how-to
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

## Recurrence: the same item hit this a second time

`tsk-34y` tripped this exact defect twice, on two separate execution
rounds of the same work item — not a one-off. The item's real capture
(`fgos check tsk-34y`, second round) shows the identical friction shape:

> `"friction":{"count":1,"byLayer":{"verification":1},"recent":[{"id":"tsk-34y","disposition":"blocked","errorClass":"verify-miss","layer":"verification","attempts":1,"detail":"goal-check failed on branch \"fgw/tsk-34y\" (exit 2)","ts":"2026-07-29T13:14:17.383Z"}]}`
> — real `fgos check` output, second round

Between the two rounds, the item cycled back through `clarify`/`decompose`
(a fresh `fgos discover` run), which re-generated the same
prose-mixed `verify` string from scratch — the fix from the first round
(`fgos edit <id> --verify "npm test"`) does not persist across a
re-discover, because `judgeDecompose` derives the field again each time
rather than reading back what a human already corrected. The same
steps 3-4 above fixed it again, with no code change in between, confirming
this is purely a recurring verify-field defect, not a regression.

## A second shape: an apostrophe, and a command that proves nothing

Item `tsk-45u` (making the herdr cockpit open agent panes in its project
root) hit the same defect through a different door, and it is worth
recognising both halves separately.

**The syntax half.** This item's `verify` was auto-generated at the
*clarify* pass, not the decompose one — its settlement record reads:

> `{"kind":"clarify-pass","role":"session","ts":"2026-07-30T11:13:38.378Z","detail":"npm test — full suite green, plus new/updated test asserting that opening a task sets cwd to the herdr cockpit's project root (per locked decision in commit 85a2945)","id":"tsk-45u"}`
> — real `fgos check tsk-45u` settlement entry

There is no `(` problem here at all. The break is the apostrophe in
`cockpit's`: the string is executed through `/bin/sh`, which reads that
quote as opening a quoted section that never closes.

> `{"id":"tsk-45u","from":"doing","to":"blocked","source":"branch","branch":"fgw/tsk-45u","aheadCount":5,"passed":false,"exitStatus":2,"output":"/bin/sh: 1: Syntax error: Unterminated quoted string\n"}`
> — real `return` output for the first, failing attempt

The friction it recorded is the identical shape step 1 above describes:

> `"friction":{"count":1,"byLayer":{"verification":1},"recent":[{"id":"tsk-45u","disposition":"blocked","errorClass":"verify-miss","layer":"verification","attempts":1,"detail":"goal-check failed on branch \"fgw/tsk-45u\" (exit 2)","ts":"2026-07-30T11:30:57.063Z"}]}`
> — real `fgos check tsk-45u` output

So when you read `return`'s `output` at step 1, expect either wording:
`Syntax error: "(" unexpected` **or** `Syntax error: Unterminated quoted
string`. Both mean the same thing — prose stored where a command belongs.

**The half that survives fixing the syntax.** Deleting the apostrophe
would have made this item's `verify` run and pass while proving nothing.
`npm test` in this repo is `node --test 'test/**/*.test.mjs'`
(`package.json`), and `tsk-45u` changed only Rust sources under
`herdr-plugin/`. A green `npm test` there is a check that never touches
the changed code at all.

So when you rewrite the field at step 3, do not just make it parse — check
it actually exercises what changed. For this item the real command was the
one every `herdr-plugin` item already uses:

```
fgos edit tsk-45u --verify 'cargo test --manifest-path herdr-plugin/Cargo.toml && cargo build --release --manifest-path herdr-plugin/Cargo.toml'
```

Then steps 4's `fgos move <id> --to doing` and `fgos return <id>` as
written above, with no code change in between, produced
`{"from":"doing","to":"awaiting-approval","passed":true}` — the engine
re-running the corrected command itself, in its own clean checkout, on 33
tests plus a release compile.

**What this adds to "Why this exists".** The section above attributes the
defect to `judgeDecompose`. This capture shows the clarify-stage judgment
produces it too, so the exposure is not limited to one judge. It also
shows the failure is not only syntactic: a model-authored `verify` can name
the wrong test suite entirely for the change at hand, and no shell error
will ever tell you that — only reading the command against the diff will.

## Related

- `fgos check <id>` — full outcome/friction history for an item, including
  the entries quoted above (`friction.recent[].errorClass: "verify-miss"`).
- `diagnose-a-blocked-return-from-an-unrelated-verify-failure.md` — the
  companion how-to for when `return`'s verify actually runs but fails due
  to unrelated flakiness, rather than never running at all.
