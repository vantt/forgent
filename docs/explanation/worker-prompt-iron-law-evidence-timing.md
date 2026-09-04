---
authoritative_for: worker-prompt-skill-pointer.txt never mentioning Iron Law/evidence for out-of-process dispatch, forcing retroactive evidence reconstruction; fix adds a dedicated "Iron Law evidence" section, confirmed live across 3 incidents (tsk-3ti's 10-child batch, tsk-3hks, tsk-2ewi)
---

# Out-of-process worker prompts never mentioned Iron Law evidence — so it never got produced when it was cheapest

`tsk-3ys` fixed a gap in `src/runner/prompt-templates/worker-prompt-skill-pointer.txt`,
the real prompt template a dispatched out-of-process worker (`agy`) receives.
It told the worker to satisfy `{verify}` and pointed it at the domain's own
skill file, but never mentioned Iron Law, `classifyIronLaw`, self-modifying
modules, or `docs/history/<id>/iron-law-evidence.md` at all — even though
`fgos-coding-implement`'s own `SKILL.md` already describes exactly this
obligation for a live driver session.

## The cost this created, confirmed live 3 times

Because the worker never saw this obligation, failing-test-first proof
(required whenever `classifyIronLaw` returns `required: true` for a
self-modifying-module diff) was never produced at implement time — the one
moment the worker had full context (it had just written the fix and knew
exactly which test proved the bug). Instead the gap surfaced only later, at
`fgos approve` time, forcing someone to reconstruct the evidence after the
fact: re-checkout the parent commit's implementation files, keep the shipped
tests, rerun to confirm red, restore the fix, rerun to confirm green — the
exact costly fallback recipe
`docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`'s
own "Watch out for" section warns about.

This was not a hypothetical risk — it was directly observed three times
before the fix landed:

- **`tsk-3ti`'s 10-children batch** — 3 of 4 items that touched a
  self-modifying module (`tsk-3ti-1`, `tsk-3ti-3`, `tsk-3ti-7`) reached
  `approve` at the root with no `iron-law-evidence.md` at all; all three had
  to be reconstructed by hand during rollup.
- **`tsk-3hks`** — the rendered worker prompt (`buildPrompt`,
  `src/runner/dispatch/prepare.mjs`) carried no Iron Law mention; a custom
  addendum had to be appended manually before dispatch, and the worker's
  commit still landed with no evidence file even though `classifyIronLaw`
  came back `required: true` after the fact.
- **`tsk-2ewi`** — an out-of-process worker (`agy`/gemini) committed to a
  self-modifying module and returned an `iron-law-evidence.md` with only the
  passing-after transcript, no failing-before — despite the dispatch prompt
  already pointing it at `fgos-coding-implement/SKILL.md`. The driver had to
  reproduce the real before/after recipe by hand afterward.

## What shipped

A new `# Iron Law evidence` section was added to
`worker-prompt-skill-pointer.txt`, between `# Worktree boundary` and `# How
to finish`. It tells the worker directly, in its own dispatch prompt:

- run `classifyIronLaw` itself, on its own committed diff (AFTER committing —
  running it before commit reads an empty diff and gives a false
  "not required"),
- if `required` is `true`, follow the same failing-test-first recipe the
  how-to doc already describes (stash the implementation files only, run
  the shipped test red, restore, confirm green, write
  `docs/history/<id>/iron-law-evidence.md`, commit it as a follow-up commit)
  — before reporting `[DONE]`,
- skipping or fabricating this evidence when `required` is `true` is named
  explicitly as not a valid way to finish.

The golden byte-for-byte test in `test/runner/prompt-templates.test.mjs` was
updated to match. This closes the gap for the out-of-process dispatch path
specifically — the in-process driver-session path already had this covered
by `fgos-coding-implement`'s own `SKILL.md`.
