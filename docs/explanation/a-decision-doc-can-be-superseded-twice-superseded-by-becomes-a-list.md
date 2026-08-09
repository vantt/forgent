---
title: A decision doc can be superseded twice — superseded_by becomes a list
---

# A decision doc can be superseded twice — superseded_by becomes a list

## The trap (tsk-5wf)

STR72 requires a superseded decision doc to carry a `superseded_by: <N>`
field in its frontmatter (precedent: `0023` got `superseded_by: 0025`;
`0028` documents this same convention). `docs/decisions/0026-...md` had
already been superseded once — it carried `superseded_by: 0028` (the
orchestrator→launcher rename). Then a second, unrelated set of
corrections to 0026 (three vocabulary fixes: dropping `rootTask`/`subTask`
from the dispatch vocabulary, redefining `capacity`, and splitting T1 into
`launcher`/`driver`) needed to supersede 0026 *again*, in a new doc
(`0029`).

No document in the repo had ever been superseded twice before this, so
there was no precedent for what shape a second `superseded_by` value
should take. This was flagged explicitly as something to lock at
`clarify`, not guess at during implementation — a real ambiguity, not a
mechanical fill-in.

## The resolution

`superseded_by` becomes a **list** when more than one document supersedes
the same original: `0026`'s frontmatter now reads
`superseded_by: [0028, 0029]` — both superseding documents named, neither
overwriting the other's record of having done so.

## Why not just overwrite it with the newest one

Overwriting `superseded_by: 0028` with `superseded_by: 0029` would erase
the historical fact that `0028` also superseded part of `0026` (the
orchestrator→launcher rename) — a real, separate decision that stays true
regardless of what `0029` later corrects. A single scalar field can't
represent "superseded by two different documents for two different
reasons" without losing one of them. The list preserves both.

## The other hard rule this item enforced: never edit the superseded doc's body

Per `AGENTS.md`'s "Changing a locked law" rule and `0028`'s own line 73
("changing this decision means superseding it with a new record, not
editing it in place"), `0026`'s own content was never touched — only its
frontmatter's `superseded_by` field changed, from a scalar to a list. All
three actual corrections (dropping `rootTask`/`subTask`, redefining
`capacity`, splitting T1) live entirely in the new `0029` document, which
declares `supersedes: [0026]` and cites exactly which of 0026's original
claims each correction replaces.

## Related

- `docs/how-to/resolve-a-decision-id-collision-merge-conflict-on-approve.md`
  — the other trap this item's own description named in advance: two
  branches independently minting the same next decision number (`0029`)
  collide at merge time, not before. This item avoided it by checking
  `ls docs/decisions/` immediately before naming the file rather than
  trusting a number recalled from earlier in the session.
