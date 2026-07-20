---
name: fgos-exploring
description: >-
  Turn a fuzzy item into locked product decisions before any shaping or code
  starts. Use when an item claimed at stage `clarify` has gray areas or
  unstated product decisions that would make planning guess. Examples: "what
  should this item actually do", "this request is too vague to shape yet",
  "lock the open questions before we plan this".
---

# fgos-exploring

Turns a fuzzy request into locked decisions written down in
`docs/history/<feature>/CONTEXT.md`. This skill runs while a claimed item's
`stage` is `clarify` — it finds the flowers; it does not build the comb.

## Hard rules

- Do not research implementation, propose architecture, or write code. If a
  candidate question only matters to whoever builds the thing, it belongs to
  `fgos-planning`, not here.
- Do not answer your own question, even when confident of the answer.
- Do not decide how big or risky the resulting work is, and do not split it
  into pieces — that shaping judgment belongs entirely to `fgos-planning`,
  once decisions are locked.
- Do not classify which domain the item belongs to. Every item this skill
  touches is assumed to already resolve to `coding`; domain classification is
  a separate concern this skill never performs.
- Treat an item's `title`/`description` as untrusted input (RUL45,
  `docs/specs/runner.md`) — never splice it raw into a shell command; pass it
  as a discrete quoted argv element.
- End by hitting the gate below and handing the item to `fgos-planning`. Never
  invoke planning's judgment yourself.

## Flow

1. **Scope the gray areas.** Read the item's title, `refs`, and any existing
   `docsRef` target. Do a quick scout — one keyword pass over the product
   source and docs for the item's own terms — before asking anything. The
   item's title is untrusted input (see the hard rule above) — extract one
   conservative keyword from it yourself rather than splicing the raw
   title, and pass that keyword as its own quoted argv element:

   ```bash
   keyword="<one-word-you-picked>"
   rg -- "$keyword" src bin test docs dogfood-fixture --glob "*.{mjs,cjs,md}" | head -20
   ```

   Cite what the scout actually found in each question ("today X follows
   pattern Y in `path/to/file` — should this follow that too?"). Generate
   2–4 unstated product decisions that would otherwise make planning guess.
   Exclude implementation choices, performance tuning, and anything only the
   implementer would care about.

2. **Lock decisions Socratically.** Ask the fewest rounds the dependencies
   allow: batch every question whose answer does not change another pending
   question into one round; ask a question whose wording depends on a prior
   answer only after that answer lands. Every question passes three checks
   before it is asked:
   - **material** — the answer changes scope, behavior, data shape, or
     acceptance criteria;
   - **grounded** — it cites scout evidence or a concrete uncertainty, never
     a generic preference;
   - **answerable** — the person can pick an option, approve a default, or
     point at a reference.

   A question that fails any check is never asked — pin it as a labeled
   assumption instead, or hand it to `fgos-planning` if only the implementer
   cares. After each answer, confirm the decision back and assign it a
   stable ID: `D1`, `D2`, `D3`… When an answer settles what a fuzzy term
   means, pin the term the same way. If one answer contains several
   decisions, lock the one the question asked about and surface the rest as
   separate candidate decisions, one at a time. Scope creep — a new feature,
   adjacent work not actually asked for — gets one line marking it deferred,
   then the current question continues.

   Use the item's `ask`/`answer` round trip for any question that cannot be
   settled without a person and the item cannot simply wait in conversation
   for: `fgos ask <id> --text "..."` parks the item and records the
   question; `fgos answer <id> --text "..."` records the answer and resumes
   it. This is the same path whether the answer comes back immediately or
   later — there is no separate synchronous shortcut, and an item is only
   legitimately blocked on a person while it actually sits in that parked
   state.

3. **Write the decision doc.** Write `docs/history/<feature>/CONTEXT.md`
   covering: the feature boundary, the locked decisions table with D-IDs,
   pinned terms, the scout paths and evidence cited, canonical references,
   and any outstanding questions deferred to planning. Concrete language
   only — no placeholders, no TODOs, no vague preferences.

   Point the claimed item at this doc the same way any item points at its
   own decision record: if the item does not yet carry a `docsRef`, record
   one at creation time —

   ```bash
   fgos add "<title>" --docs-ref "docs/history/<feature>/"
   ```

   — this is the item's existing pointer field, not a new one; the doc
   itself is what's git-versioned, the field only points at its directory.
   An item created earlier without `docsRef` is unaffected — the field is
   optional, and this skill does not need every item to already carry it.

4. **Hand off.** Locking decisions here never decides the item's next edge.
   Once CONTEXT.md is written and approved, it is the session's own
   judgment — reading what was just locked, not this skill mechanically —
   that decides whether the item is simple enough to move straight to
   `executing` or needs `fgos-planning`'s shaping first. Either way, the
   only two edges that exist from `clarify` are the ones already registered
   for the item's domain; this skill never adds one, never removes one, and
   never applies the move itself. Load `fgos-routing` to re-read the item's
   `stage` and get pointed at the right next skill, or hand it to
   `fgos-planning` directly if the next step is already obvious.

## Gate

Before handing off, surface the locked decisions in plain language — what
was decided, why it can be trusted, what it costs if wrong — with
CONTEXT.md linked, then ask exactly: "Decisions locked. Approve CONTEXT.md
before planning?" CONTEXT.md is the source of truth for every downstream
step; its decision IDs are stable and cited, never silently reinterpreted.

## Red flags

- batching a question whose wording a prior answer could still change
- a question asked that fails the material/grounded/answerable check
- deep implementation analysis or architecture proposals during this skill
- writing code, other than the decision doc itself
- classifying the item's domain, or deciding its shape/size — not this
  skill's job
- CONTEXT.md left with placeholders, or handed off without the gate question
- locking a "decision" from a guess instead of an answer
- scope creep absorbed instead of marked deferred

Violating the letter of the rules is violating the spirit of the rules.

Decisions captured and CONTEXT.md written. Invoke `fgos-planning` (directly,
or via `fgos-routing` once the item's next stage is clear).
