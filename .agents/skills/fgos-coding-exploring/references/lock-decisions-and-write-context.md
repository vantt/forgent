# Lock decisions and write CONTEXT.md — full mechanics

The full detail behind SKILL.md's Step 2 (Lock decisions Socratically)
and Step 3 (Write the decision doc).

## Batching and the three checks

Ask the fewest rounds the dependencies allow: batch every question whose
answer does not change another pending question into one round; ask a
question whose wording depends on a prior answer only after that answer
lands. Every question passes three checks before it is asked:

- **material** — the answer changes scope, behavior, data shape, or
  acceptance criteria;
- **grounded** — it cites scout evidence or a concrete uncertainty, never
  a generic preference;
- **answerable** — the person can pick an option, approve a default, or
  point at a reference.

A question that fails any check is never asked — pin it as a labeled
assumption instead, or hand it to `fgos-coding-planning` if only the
implementer cares.

**Ask as open conversational prose, not via a structured-choice tool.**
These questions exist to discover product decisions the session does not
yet know — a tool that forces the answer into a short pre-set option list
can only ever surface what the session already imagined, defeating that
purpose (a person who wants to answer with a framing the session never
proposed has no box to put it in). "answerable" above does not mean
"multiple-choice" — "point at a reference" is explicitly an open answer
shape. Reach for a structured-choice tool only when scout evidence has
already narrowed the question to a short list of concretely-named real
alternatives (never options invented just to make the question fit the
tool) — the Gate section's own yes/no confirmation is exactly that case,
since by then the decision is already locked and the only remaining
question is a closed approve/reject.

## Logging each decision

After each answer, confirm the decision back and assign it a stable,
incrementing per-item id in the item's own local `D<n>` numbering,
starting at 1 and counting up by one for each new locked decision. Then
run:

```bash
fgos decision --text "<D-ID>: <one-line summary>" --rationale "see CONTEXT.md for the full scout evidence and reasoning" --relation none
```

(or `--relation supersedes:<old-D-ID>` when this D-ID explicitly revises
an earlier one already locked in this same CONTEXT.md — every `fgos
decision` write declares its relation, no default). This additionally
lands the decision in the item's append-only decision log, surfaced
through `view.decisions`/`fgos list` for machine readers — `--rationale`
is required — this call is additive alongside writing CONTEXT.md in Step
3, never a replacement for it: CONTEXT.md stays the source of truth for
the full decision, this just makes its existence visible outside the
prose doc. When an answer settles what a fuzzy term means, pin the term
the same way. If one answer contains several decisions, lock the one the
question asked about and surface the rest as separate candidate
decisions, one at a time. Scope creep — a new feature, adjacent work not
actually asked for — gets one line marking it deferred, then the current
question continues.

## The `ask`/`answer` park round trip

Use the item's `ask`/`answer` round trip for any question that cannot be
settled without a person and the item cannot simply wait in conversation
for: `fgos ask <id> --text "..."` parks the item and records the
question; `fgos answer <id> --text "..."` records the answer and resumes
it. This is the same path whether the answer comes back immediately or
later — there is no separate synchronous shortcut, and an item is only
legitimately blocked on a person while it actually sits in that parked
state.

This is the real `advise` interaction — call `handoff` first, then `ask`:

```bash
node "$root/bin/fgos.mjs" handoff "<id>" --to advisor --reason advise --dir "$root"
```

```bash
node "$root/bin/fgos.mjs" ask "<id>" --text "..." --dir "$root"
```

**When the answer comes back immediately** (same session, `fgos answer`
called right after `fgos ask` with no real gap between them), reclaim
before doing anything else: `holder` is `advisor` the moment the
`handoff` call above lands, and nothing else in this step closes it.
Continuing straight to a second Socratic round (multiple rounds are
explicitly allowed) with `holder` still `advisor` means that
round's own `consult`/`advise` attempt gets refused — `advisor` has
zero outgoing edges at stage `exploring`:

```bash
node "$root/bin/fgos.mjs" handoff-return "<id>" --note "reclaiming after an immediately-answered ask, same session" --dir "$root"
```

When the answer does NOT come back immediately — the item genuinely parks
across sessions — this reclaim is not this session's job to run; it
happens automatically the next time any stage-skill is entered (either
this skill's own Step 1, or `fgos-coding-driving`'s per-iteration
reclaim).

The live conversational questions this step asks the rest of the time
(the common case) get no `handoff` call at all — nothing parks, there is
nothing to track.

## Writing CONTEXT.md

Write `docs/history/<feature>/CONTEXT.md` covering: the feature boundary,
the locked decisions table with D-IDs, pinned terms, the scout paths and
evidence cited, canonical references, and any outstanding questions
deferred to planning. Concrete language only — no placeholders, no TODOs,
no vague preferences.

Put a heading with this exact text (nothing appended on that line, and
not translated) directly above the decisions table:

```markdown
## Locked decisions
```

**Never hand-type the table itself** — every row already exists in
`state.decisions` from the `fgos decision --id` calls above. Leave the
section under the heading empty (or whatever it already holds from an
earlier render), then run, once, after the last decision for this pass
has been logged:

```bash
node "$root/bin/fgos.mjs" context-render "<item-id>" --dir "$root"
```

This replaces whatever sits under the heading with a fresh render from
the log — CONTEXT.md's table becomes a VIEW, never a second, hand-typed
copy that can drift from what `fgos decision` actually recorded. It
refuses if the file does not exist yet, so write the rest of the doc
(this heading included, even with nothing under it yet) before the first
call. Re-run it again any time a later round adds more decisions —
idempotent, a no-op re-run reports `changed: false`.

The engine slices this same section with a literal-text match on the
exact heading above, both to write it and to read a child's cited D-IDs
and extract footprint paths later. Any other wording — a translated
heading, a numbered variant — makes both sides miss the section entirely:
the write refuses (no heading to splice under), and the read silently
comes back empty, disabling the check instead of erroring.

End the doc with a section using this exact heading (nothing appended on
that line), body `None` when every candidate question was locked or
deferred, or a real list of what is still open for `fgos-coding-planning`
otherwise:

```markdown
## Outstanding questions

None
```

This is the section the gate-bypass check reads to decide whether this
skill's own Gate can auto-approve instead of asking a person — a missing
or misworded heading, or a body that doesn't start `None`, fails that
check closed and forces the question every time, even when nothing is
actually outstanding.

## Pointing the item at its doc

Point the claimed item at this doc the same way any item points at its
own decision record: if the item does not yet carry a `docsRef`, record
one at creation time —

```bash
fgos add --title "<title>" --kind <kind> --risk <risk> --verify "<real, runnable command>" --description "<full-text description>" --docs-ref "docs/history/<feature>/"
```

(no positional argument — `fgos add`'s positional/`--id` is the item's
own id, not its title; omitting `--id` entirely auto-generates a
collision-free one from `--title`.)

`--docs-ref` is the item's existing pointer field, not a new one; the doc
itself is what's git-versioned, the field only points at its directory.
An item created earlier without `docsRef` is unaffected — the field is
optional, and this skill does not need every item to already carry it.
