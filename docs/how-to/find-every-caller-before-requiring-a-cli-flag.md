---
type: how-to
title: How to find every caller before making a CLI flag required
tags: []
timestamp: 2026-07-29T13:44:00.000Z
source_capture_ids: [tsk-63c]
---
# How to find every caller before making a CLI flag required

Use this when a plan makes a previously-optional CLI flag required (a
breaking change to a command's contract), and you need to know exactly
which existing callers will start failing once it lands.

## Before you start

- You need the exact command name whose flag is becoming required (e.g.
  `fgos decision`), and the flag's exact spelling (e.g. `--rationale`).
- This is a `fgos-coding-validating`-stage check, not a `fgos-coding-planning` one: the
  plan proposes the change, validating proves the plan's own claim about
  blast radius against the real repo.

## The mistake this guards against

A plan's risk map can honestly claim "only one caller" while actually
meaning "only one caller of the underlying *function*" — missing every
*test* that invokes the command from the outside. `tsk-63c` (extending
`addDecision` with a required `rationale` field) hit this exactly:

> "one real caller today (`bin/fgos.mjs:1025`, grep-confirmed), updated in
> the same change"
> — real `plan.md` risk-map row, before the fix, `docs/history/decision-schema-rationale-alternatives-source/plan.md`

That grep was scoped to `addDecision`'s direct code caller and was
correct as far as it went — `bin/fgos.mjs:1025` genuinely is the only
place in the codebase that *calls the function*. But a second, separate
CLI-level test caller existed and was missed:

> `test/e2e/rebuild-determinism.test.mjs:94`:
> `assert.equal(run(cwd, ['decision', '--text', 'locked D3: event log is truth, view is rebuilt']).status, 0);`
> — real test assertion, found only after re-grepping for the CLI
> invocation shape itself, not the function name

That assertion expects exit status `0` from a `decision --text` call with
no `--rationale`. Once the flag became required, this call would have
started returning a validation error (exit `4`) instead — a real, silent
test break the narrower grep never surfaced.

## Steps

1. Grep for the function's direct code callers first (this is still
   correct and necessary, just not sufficient on its own):

   ```
   grep -rn "addDecision" src bin test
   ```

2. **Separately**, grep the whole repo for the *CLI command's own
   invocation shape* — every place that shells out to or constructs an
   argv array for the command, not just callers of the underlying
   function:

   ```
   grep -rn "decision --text\|decision', '--text" src bin test scripts docs dogfood-fixture
   ```

   Run this from the repo root, across every directory that could
   plausibly invoke a CLI command in a test or script — `src`, `bin`,
   `test`, `scripts`, `docs` (for `--help` example strings), and any
   dogfood/fixture directory the repo has. A grep scoped only to `test/`
   or only to the module implementing the verb will miss e2e tests and
   `--help` examples living elsewhere.

3. Read every hit, not just the ones in the file you already expected.
   The real run against `tsk-63c` surfaced four hits beyond the two
   already known: `src/cli/command-registry.mjs:271`'s `--help` example
   string, `test/e2e/rebuild-determinism.test.mjs:94`'s CLI assertion,
   and two prose-doc mentions (`docs/specs/work-state.md`,
   `docs/how-to/fgos-terminal-pane-rename.md`) that were non-executable
   and safe to leave alone. Sort real breakage (an assertion that checks
   an exit code or return value) from cosmetic staleness (a doc example
   that just reads oddly) — both are worth listing, but only the former
   blocks the plan.

4. Add every real breakage found to the plan's files-touched list before
   treating the plan as `READY`. `tsk-63c`'s own fix, quoted verbatim from
   the corrected plan:

   > "`test/e2e/rebuild-determinism.test.mjs` | Update the
   > `run(cwd, ['decision', '--text', 'locked D3: ...'])` call (line 94)
   > to also pass `--rationale` — found by a full-repo grep at
   > `fgos-coding-validating` time, missed by the original single-caller check
   > (that check only covered `addDecision`'s direct code caller, not
   > every test invoking the CLI command)."
   > — real `plan.md` files-touched row, post-fix,
   > `docs/history/decision-schema-rationale-alternatives-source/plan.md`

## Why this matters at the validating stage specifically

`fgos-coding-validating`'s own hard rule is that a matrix row needs "a file
actually read, a command actually run with its real output" — never
plausibility language. The first grep (function callers) is exactly this
kind of concrete evidence, and it is still wrong to stop there: it proves
a narrower claim ("no other code calls this function") than the one the
risk map actually needs ("no other caller of this CLI command breaks").
Re-running the full-repo grep against the command's own invocation shape
is what turns a plausible-sounding risk row into a genuinely checked one.

## Related

- `fgos-coding-validating`'s reality gate (`.claude/skills/fgos-coding-validating/SKILL.md`)
  — the stage this check belongs to; a `FAIL` here returns the item to
  `fgos-coding-planning` with the missing caller named, never softened into a
  pass.
- `docs/history/decision-schema-rationale-alternatives-source/{CONTEXT.md,plan.md}`
  — the full decision record and plan this example is drawn from.

## Document history (compound-learn capture linkage)

This doc's path
(`docs/how-to/find-every-caller-before-requiring-a-cli-flag.md`) is
linked to a real compound-learn capture, gathered via `fgos doc-sources
docs/how-to/find-every-caller-before-requiring-a-cli-flag.md`:

> ```json
> {
>   "id": "tsk-63c",
>   "predicted": {"tier": "heavy", "deps": 0, "priorVisits": 0, "role": "session", "headAtTake": "4ecad51219b8994149bed8779cc91e7a3c62a550"},
>   "actual": {"outcome": "proposed", "passed": true, "attempts": 1, "errorClass": null, "aheadCount": 4},
>   "docType": "how-to",
>   "docPath": "docs/how-to/find-every-caller-before-requiring-a-cli-flag.md"
> }
> ```
> — real `work.outcome` capture, id `tsk-63c`

That item's own settlement history shows the real work behind this
lesson: a `clarify-pass` verified by `npm test`, then a human confirming
the pass-through (no-split) call for the underlying schema change:

> `{"kind":"clarify-pass","role":"session", ...}`, `{"kind":"answer","role":"human", ...}`
> — real settlement capture, id `tsk-63c`

If a later capture links to this same docPath, the export skill
accumulates it here too, additively, without losing this section or
anything above it.
