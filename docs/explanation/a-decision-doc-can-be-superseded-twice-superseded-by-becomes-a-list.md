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

## The list broke a checker that assumed a scalar (`tsk-18t`)

`0026` becoming the repo's first twice-superseded document exposed a real
bug in `scripts/check-decision-supersession.mjs`, which nobody had
exercised against a list value before:

> `scripts/check-decision-supersession.mjs:77`
> `if (target.meta.superseded_by !== record.id) { ...missing-frontmatter-pointer... }`
> — strict scalar comparison. `[0028, 0029] !== '0029'` is always true,
> so the checker reported BOTH superseding documents as missing their
> frontmatter pointer, even `0028` which had been correctly recorded all
> along.

Real observed output before the fix:

> "0026: superseded by 0028 but its own frontmatter has no
> superseded_by: 0028" / "0026: superseded by 0029 but its own
> frontmatter has no superseded_by: 0029"
> — real `check-decision-supersession.mjs` run, 2026-08-09, after
> `tsk-5wf` landed

`tsk-5wf`'s own description had already flagged this exact risk in
advance — "kiểm xem có code/script nào đọc field này không" (check
whether any code/script reads this field) — but that verification step
hadn't actually been done before choosing the list shape. The list value
itself was correct (as this doc's own resolution above establishes); the
checker's strict-equality read of it was the bug, not the data.

**Fix**: normalize `superseded_by` to an array on read (scalar values get
wrapped in a single-element array) and check membership with `.includes()`
instead of `!==`, so both the pre-existing scalar convention and the new
list convention validate correctly through the same code path — no
special-casing which shape a given document uses. New tests cover all
three cases: a list value that validates clean, a scalar value that still
validates clean, and a list value that's missing a required id (still
correctly flagged).

This is a general lesson beyond this one checker: introducing a new valid
shape for an existing frontmatter field (scalar → scalar-or-list) is a
breaking change for any code that reads that field with strict equality,
not just an additive data change — the field's readers need auditing
alongside the field's writers.

## Related

- `docs/how-to/resolve-a-decision-id-collision-merge-conflict-on-approve.md`
  — the other trap this item's own description named in advance: two
  branches independently minting the same next decision number (`0029`)
  collide at merge time, not before. This item avoided it by checking
  `ls docs/decisions/` immediately before naming the file rather than
  trusting a number recalled from earlier in the session.
