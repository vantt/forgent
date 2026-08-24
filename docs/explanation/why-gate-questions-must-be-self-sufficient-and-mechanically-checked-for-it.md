---
type: explanation
title: Why gate questions must be self-sufficient, and mechanically checked for it
tags: [gate, ask, question-quality, markdown, STR71]
source_capture_ids: [tsk-539]
authoritative_for: why fgOS requires a gate/ask question to restate its own context and problem, why that requirement got real machine enforcement, and why the enforcement targets structural completeness rather than citation format
---
# Why gate questions must be self-sufficient, and mechanically checked for it

`tsk-539` (STR71). Full design: `docs/history/tsk-539/CONTEXT.md`.

## The measured problem

A real audit of 152 `gates.ask` questions found the pattern was
routine, not occasional: only 21% (32/152) offered clear options, only
45% (68/152) restated which item was even under discussion, 13% forced
the reader to cross-reference two or more other task ids just to
understand the question, and one case (`tsk-42i`) asked about a file
that didn't exist in the checkout at all. `tsk-1an` was the counter-example
proving it was achievable: a 222-character question naming two clear
options, answerable in 10 seconds with no other file open.

## What the requirement actually locks

- **D4** — the real yes/no operator burden lives mostly in the
  `work.gate-approve` channel (the three skill-embedded gates
  `contextApprove`/`planApprove`/`validateApprove`), not `gates.ask` —
  useful context for where quality pressure matters most, even though
  this item's own enforcement targets `ask` questions directly.
- **D6** — `validateApprove` bypasses only when the reality gate produces
  no constraints at all; any real constraint still asks a person.
- **D7** — two storage areas serve two different readers:
  `state.decisions` is the short, evidence-dense source an agent reads;
  `CONTEXT.md` stays free to optimize for a human narrative reader. The
  skill layer is deliberately not folded into `state.decisions` until a
  real check can prove that merge is clean.
- **D8, superseded by D11** — the original framing wanted machine
  enforcement of *citation format*. Real machine enforcement was locked
  as new (nothing existing reached event-log text at all), but D11
  redirected what it actually checks.
- **D9** — the Markdown mandate applies to every paragraph-shaped
  free-text field on a work item, not narrowly to ask/gate questions —
  `description`, `decision.text`/`rationale`/`alternatives`, and
  ask/gate-approve question text all get the same bar.
- **D11 (supersedes D8)** — real machine enforcement targets
  **structural completeness**, not citation-format correctness: does the
  question include a context/background summary, *and* an explanation of
  why that context leads to the problem being asked. A perfectly
  formatted citation with no real context still fails; a question with
  real context and no citation still needs the substance check to pass,
  because substance — not format — was the actual measured problem
  (only 45% even restated which item was under discussion; a citation
  format rule alone would never have caught that).
- **D10** — the item's own description was rewritten before planning to
  reflect the real, expanded scope (D8/D9 plus two later scope
  expansions), replacing a stale, narrower framing from the item's
  original submission.

## Why format-only enforcement would have missed the actual finding

The measured failure modes were about substance — no restated item, no
clear options, references to nonexistent files — not malformed
citations. Enforcing citation format alone would have been a
mechanically checkable proxy that didn't actually measure the thing that
was broken. D11's structural-completeness check (context summary present
+ context-to-problem link stated) targets what the audit actually found
wrong, even though it is a harder property to check mechanically than a
citation regex would have been.
