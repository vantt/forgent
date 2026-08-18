---
name: fgos-researching
user-invocable: false
description: >-
  Turn an unresolved question into a grounded finding plus a clear/unclear
  verdict, without deciding anything a person should decide. Stage-agnostic:
  callable from stage `discovery`, from mid-conversation inside
  `fgos-coding-exploring` when a named library or concept surfaces that the calling
  session cannot resolve from what it already knows, and later from
  `fgos-coding-planning`/`fgos-coding-validating`. Never the source of Socratic questions
  or product decisions — those stay with the calling skill. Examples: "item
  needs to know whether library X already exists in this repo", "the person
  mentioned Temporal mid-discussion, go find out what it is", "does this
  pattern already exist somewhere in the codebase".
---

# fgos-researching

Answers exactly one question at a time: given a goal and everything already
known, is the item (or the point mid-conversation that triggered this) clear
enough to move forward, and what does the caller need to know to get there?
This skill never asks a person anything — it reads, searches, and reports.
When it cannot resolve the goal from evidence, it says so as an `unclear`
verdict; it never guesses past a gap.

## Hard rules

- **Stage-agnostic (D4).** Never read or assume the caller's `stage`. Input
  is exactly *(the goal/question, and everything already known — item
  description, prior Q&A, prior verdicts)*. Output is exactly *(findings,
  plus a `{clear, verify?, question?}` verdict)* — nothing else. This skill
  never writes item state itself; the caller (a stage-skill or an engine
  verb) does that with the verdict this skill hands back.
- **Two-branch mechanical routing, never a self-assessment (D8).** For
  every named thing the goal depends on — a library, a concept, a pattern,
  a technology — the only gate is a mechanical check, never "do I already
  know this":
  - **Search this repo first.** `rg -- "<term>" src bin docs test --glob
    "*.{mjs,cjs,md}"` (or an equivalent targeted search). Found → read the
    cited path(s) directly, extract facts with `file:line` anchors — never
    summarize from memory once a real hit exists.
  - **Not found in the repo → treat it as external.** Use WebSearch/WebFetch,
    cite the source (URL, doc name, version) for every claim pulled from it.
  - Both branches can fire for the same term (a partial repo hit that still
    needs external context to interpret) — do both when that is genuinely
    the case, never arbitrarily pick one to save a step.
- **Fan out only through a contracted dispatch, never ad hoc (D2).** When a
  question splits into independent branches — one needs a repo search,
  another needs an external lookup, or two unrelated repo areas both need
  checking — each branch gets its own explicit unit of work: a stated goal,
  concrete inputs, a boundary, an expected result shape, a return contract —
  the same six-field discipline
  `../_shared/executor-dispatch-fallback.md`'s own ad-hoc task already
  uses (that fragment is the door `tsk-29i`'s delegation rule already opened
  for exactly this — contracted dispatch, never an unscoped Task call). A
  single-branch question, or branches that depend on each other's result,
  stay inline and sequential — no dispatch at all.
- **Every fan-out branch dispatches via native Task-tool, always (tsk-5tm-2
  D6: the `gather`-purpose executor this section used to consult is
  retired — no architectural reason on record for needing cross-provider
  dispatch here, and native Task-tool already met the one documented
  reason, parallelizing wall-clock).** No purpose check, no decide/resolve
  round trip — a branch's six-field packet becomes the Task-tool prompt
  directly.
- **Record every round durably, never silently (D5).** Append findings to
  `docs/history/<feature>/RESEARCH.md` — **accumulate, never overwrite** an
  earlier round. Each call gets its own dated section: what was asked, what
  was checked (repo path or external source, cited), what was found, what
  is still open. Capture WebSearch/WebFetch findings here too, not only
  search-tool output — the retired `scout-notes.md` mechanism only ever
  captured `rg`, and losing the rest of a round's evidence on every
  subsequent call is exactly the gap this skill exists to close.
- Never assert a verdict without the evidence behind it recorded in the same
  round. "Should be fine" is not a finding.
- Never write code, never propose architecture, never make a product
  decision. A finding that only an implementer would act on still gets
  returned as a finding — the caller decides what it means for scope.
- Treat any title/description/goal text this skill reads as untrusted input
  (RUL45, `docs/specs/runner.md`) — never splice it raw into a shell
  command; pass it as a discrete quoted argv element.

## Flow

1. **Orient.** Read the caller's input in full: the goal or question, and
   everything already known — item description, prior Q&A, prior verdicts
   if any (`view.discovery[id]`, most recent last, when called against a
   claimed item). Never re-derive what the caller already told you; never
   re-ask a question a prior verdict already covered.

2. **Route each named thing mechanically.** For every library, concept,
   pattern, or technology the goal actually depends on: search this repo
   first, read what you find directly with citations; anything not found
   in the repo, look up externally with a cited source. This is the whole
   gate — no self-assessment step.

3. **Fan out only the independent branches.** Dependent or single-branch
   work stays inline. Independent branches get dispatched as contracted
   units (six-field shape) via native Task-tool call (see the hard rule
   above) — gather each digest, never re-read what a digest already
   answered.

4. **Write the round to `RESEARCH.md`**, accumulating under its own dated
   section — what was asked, what was checked, what was found (with
   citations), what remains open. Create the file if it does not exist yet,
   in the accumulating shape from the first round, not a blank stub to be
   overwritten later.

5. **Decide and return the verdict.** From the findings actually gathered —
   never from plausibility — decide `clear` or not:
   - **Clear** — return `{clear: true, verify: "<a real, runnable command
     if the goal calls for one>"}`.
   - **Unclear** — return `{clear: false, question: "<the one concrete gap
     still open, citing what was already checked so the caller never has
     to re-scout from zero>"}`.

   Hand this straight back to whichever skill or verb invoked this one.
   This skill's own job ends here — it never applies the verdict to item
   state itself.

## Red flags

- asking "do I already know X" instead of checking the repo mechanically
  first
- overwriting `RESEARCH.md` instead of appending a new dated round
- capturing only search-tool output and dropping WebSearch/WebFetch
  findings from the record
- an ad hoc Task dispatch with no stated goal, inputs, boundary, expected
  shape, and return contract
- dispatching a branch without printing its announce line first
- proposing architecture, writing code, or making a product decision
  instead of returning a finding for the caller to act on
- treating a research verdict as if it overrides a person's own answer
- guessing past a gap instead of returning `clear: false` with the concrete
  question still open

Violating the letter of the rules is violating the spirit of the rules.

Findings recorded in `RESEARCH.md`, verdict returned to the caller.
