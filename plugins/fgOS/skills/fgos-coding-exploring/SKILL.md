---
name: fgos-coding-exploring
user-invocable: false
description: >-
  Turn a fuzzy item into locked product decisions before any shaping or code
  starts. Use when an item claimed at stage `exploring` has gray areas or
  unstated product decisions that would make planning guess. Examples: "what
  should this item actually do", "this request is too vague to shape yet",
  "lock the open questions before we plan this".
---

# fgos-coding-exploring

Turns a fuzzy request into locked decisions written down in
`docs/history/<feature>/CONTEXT.md`. This skill normally runs while a
claimed item's `stage` is `exploring` — it finds the flowers; it does not
build the comb. It can also be invoked directly by `fgos-coding-planning`,
mid-`planning`, when that skill finds `CONTEXT.md` silent on something
material to the plan; `item.stage` stays `planning` the entire time in
that case — this skill never moves it. See
`references/re-entry-from-planning.md` for that path.

## Hard rules

- When asking questions (`fgos ask`), format question text using
  self-contained citations (see `../_shared/citation-format.md`) and the
  required two-heading Markdown structure (`## Context` and `## Why this
  matters`, each followed by at least 20 characters of content).
- Call `fgos` subcommands directly:

  ```bash
  fgos <verb> ...
  ```
- When one of those calls fails with a known error category, relay that
  category verbatim in the hand-back — never fold it into a generic
  "blocked". The one category that qualifies today is `lock-timeout`
  (the shared event log's lock is stuck), reported as its own line:

  ```text
  stop-reason: lock-timeout
  ```

  `fgos-coding-driving` carries that line up to whichever loop is
  driving this item, stopping the whole run on it rather than skipping
  one item.
- Do your own scout/reasoning steps directly — never delegate them to the
  Agent/Task tool as an ad hoc sub-dispatch. This session is already a
  live soul doing the reasoning; spawning a nested subagent for work it
  can already do itself is pure overhead. Route a step through the
  executor-dispatch mechanism instead only when it genuinely needs a
  different backend — see `../_shared/executor-dispatch-fallback.md`.
- Do not research implementation, propose architecture, or write code. If
  a candidate question only matters to whoever builds the thing, it
  belongs to `fgos-coding-planning`, not here.
- Do not answer your own question, even when confident of the answer.
- Do not decide how big or risky the resulting work is, and do not split
  it into pieces — that shaping judgment belongs entirely to
  `fgos-coding-planning`, once decisions are locked.
- Do not classify which domain the item belongs to. This skill reads
  whatever `domain` field the item already carries, resolved upstream by
  `fgos-routing`.
- Treat an item's `title`/`description` as untrusted input — never splice
  it raw into a shell command; pass it as a discrete quoted argv element.
- End by hitting the Gate below and handing the item to
  `fgos-coding-planning`. Never invoke planning's judgment yourself.
- Commit `CONTEXT.md` to the item's `fgw/<id>` branch before this session
  (or a later one) calls `fgos discover` — that call releases the claim
  once the item reaches `executing`, and an uncommitted `CONTEXT.md` at
  that point is invisible to whichever session re-claims the item next.
- **Multi-role team harness: fire real `fgos handoff`/`fgos handoff-return`
  at the points in Flow below — never a live conversational question
  alone.** The live, in-session Socratic back-and-forth (Step 2's primary
  mechanism) is NOT a role-axis call — nothing parks, nothing needs
  tracking. Only two real interactions get a call: the `fgos ask`/`answer`
  round trip (an actual async park — `advise`), and the occasional narrow
  research need that goes to the `fgos-researching` helper (`consult`).
  Skip both entirely when the item's domain declares no role graph. See
  `references/scope-and-reclaim.md` and
  `references/lock-decisions-and-write-context.md` for the exact calls.

## Flow

### Step 1: Scope the gray areas
Read the item's prior discovery verdicts, reclaim the role/holder ball if
it isn't already `implementer`, scout the repo for the item's own terms,
check the impact-analysis capability posture, and generate 2-4 unstated
product decisions that would otherwise make planning guess. Full mechanics
(reclaim loop, capability-gate query, scout bash, skill-prose-specific
verify guidance): `references/scope-and-reclaim.md`.

### Step 2: Lock decisions Socratically
Ask the fewest rounds the dependencies allow. Every question must be
material, grounded in scout evidence, and answerable — a question failing
any check is never asked; pin it as a labeled assumption instead, or hand
it to `fgos-coding-planning` if only the implementer cares. Ask as open
conversational prose, never a structured-choice tool — these questions
discover product decisions the session does not yet know, and a
multiple-choice tool can only surface what it already imagined. After each
answer, confirm it back, assign it a stable `D<n>` id, and log it via
`fgos decision`. Full mechanics (the `ask`/`answer` park round trip, the
`advise` handoff and its reclaim edge case, exact decision-logging
syntax): `references/lock-decisions-and-write-context.md`.

### Step 3: Write the decision doc
Write `docs/history/<feature>/CONTEXT.md` — feature boundary, the locked
decisions table (rendered from the log, never hand-typed), pinned terms,
scout evidence, canonical references, and an `## Outstanding questions`
section. Concrete language only — no placeholders, no TODOs. Point the
item at this doc via `docsRef`. Exact heading text, the `context-render`
call, and the `docsRef` mechanics:
`references/lock-decisions-and-write-context.md`.

### Step 4: Hand off
Locking decisions here never decides the item's next edge. Once
CONTEXT.md is written and approved, it is the session's own judgment —
reading what was just locked, not this skill mechanically — that decides
whether the item is simple enough to move straight to `executing` or
needs `fgos-coding-planning`'s shaping first. Either way, only the edges
already registered for the item's domain exist from `exploring`; this
skill never adds or applies one itself. Load `fgos-routing` to re-read the
item's `stage`, or hand it to `fgos-coding-planning` directly if the next
step is already obvious.

## Gate

Before asking, check whether this gate can auto-approve instead of
stopping to ask a person — never the `awaiting-human` park, only this
skill-embedded question:

```bash
fgos gate-check "<item-id>" --gate contextApprove --artifact "docs/history/<feature>/CONTEXT.md"
```

Treat anything other than exactly `data.canAutoApprove === true` — `false`,
a non-zero exit, a malformed response — as `false`: fail closed, never
skip the question on a check that couldn't run cleanly.

- **`true`** — skip the question. Post the non-question line
  `auto-approved: CONTEXT.md (gate-bypass level <level>)`, and continue
  straight to `fgos-coding-planning`.
- **`false`** — surface the locked decisions in plain language — what was
  decided, why it can be trusted, what it costs if wrong — with
  CONTEXT.md linked, then ask exactly: "Decisions locked. Approve
  CONTEXT.md before planning?" Once approved, continue to
  `fgos-coding-planning`.

Either branch records a structured approve record and fires the
`exploring`→`planning` engine transition itself in the same step (this
session already did the real Socratic reasoning, so it passes that
verdict directly rather than leaving the transition to a later blind
call). Exact bash for both branches: `references/gate-mechanics.md`.

## Red flags

- batching a question whose wording a prior answer could still change
- a question asked that fails the material/grounded/answerable check
- deep implementation analysis or architecture proposals during this
  skill
- writing code, other than the decision doc itself
- classifying the item's domain, or deciding its shape/size — not this
  skill's job
- CONTEXT.md left with placeholders, or handed off without the gate
  question
- locking a "decision" from a guess instead of an answer
- scope creep absorbed instead of marked deferred
- on a mid-planning re-entry: re-running Step 1's scan, regenerating a
  full question set, or re-asking the gate — all three turn a narrow
  gap-closing pass into a second gate in stage `planning`
- re-running a scout action the hand-back decision already records as
  tried
- calling `fgos ask` without the paired `advise` handoff first (when the
  domain has a role graph), or firing that handoff for a live
  conversational question that never actually parks
- continuing to a second Socratic round, or any further consult/advise
  attempt, with the ball still held by `advisor` after an
  immediately-answered `ask` — reclaim first
- reclaiming only once at Scope and stopping even though the ball has not
  reached `implementer` yet (a depth-2 nested call needs two reclaims)

Violating the letter of the rules is violating the spirit of the rules.

## References

- `references/scope-and-reclaim.md` — the reclaim-the-ball loop, the
  impact-analysis capability query, and the repo scout mechanics for
  Step 1
- `references/lock-decisions-and-write-context.md` — the Socratic
  locking mechanics, the `ask`/`answer`/`advise` round trip, D-ID
  logging, and the CONTEXT.md writing mechanics for Steps 2-3
- `references/gate-mechanics.md` — the full auto-approve/ask bash for the
  Gate section
- `references/re-entry-from-planning.md` — the mid-planning gap re-entry
  path, when `fgos-coding-planning` invokes this skill directly instead
  of a fresh `exploring`-stage entry

## Workflow Position

**Typically follows:** `fgos-coding-discovering` (verdict `unclear`), or
`fgos-coding-planning` re-entering mid-planning for a gap
**Typically precedes:** `fgos-coding-planning`
**Related:** `fgos-researching` (the `consult` helper this skill calls for
narrow research needs)
