---
type: explanation
title: A decision doc can be superseded twice — superseded_by becomes a list
source_capture_ids: [tsk-5wf, tsk-18t, tsk-55h]
framework: diataxis
mode: explanation
---

# A decision doc can be superseded twice — superseded_by becomes a list

## The trap (tsk-5wf)

STR72 requires a superseded decision doc to carry a `superseded_by: <N>`
field in its frontmatter (precedent: `0023` got `superseded_by: 0025`;
`0028` documents this same convention). `docs/decisions/0026-...md` had
already been superseded once — it carried `superseded_by: 0028` (the
orchestrator→launcher rename). Then a second, unrelated set of
corrections to 0026 (three vocabulary fixes: dropping `rootTask`/`subTask`
from the dispatch vocabulary, redefining `executor`, and splitting T1 into
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
`executor`, splitting T1) live entirely in the new `0029` document, which
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

## The twice-superseded record's own index row was still missing (`tsk-55h`)

`tsk-18t` fixed the checker's *code* to read `superseded_by` as a list.
Running the checker for real afterward still reported findings — not new
bugs, but two distinct, still-unresolved data gaps `tsk-18t` had
explicitly deferred rather than folded into its own scope:

> `check-decision-supersession: 3 finding(s):`
> `  - 0027: supersedes frontmatter is not a clean list of ids -- check by hand`
> `  - 0026: no row found in 0000-index.md (expected a "[0026]" anchor)  x2`
> — real checker output, `docs/history/tsk-55h/CONTEXT.md`

The checker only scans supersession *targets*, not the whole
`docs/decisions/` directory, so it surfaced 0026's missing index row twice
(once per supersede event) without ever mentioning 0027, 0028, or 0029 —
making the visible finding count ("1 doc missing") a real undercount of
the actual gap (4 docs missing their row):

> "the apparent '1 doc missing' is really 4 ... 0026's row must state it
> was superseded TWICE — by 0028 (pinned-term rename to `launcher`, STR72)
> and by 0029 (three vocabulary clauses)."
> — real `docs/history/tsk-55h/CONTEXT.md`

Fixed with 4 additive rows in `0000-index.md`, following the file's own
existing "**Đã supersede bởi [00MM](...)**" convention — no code change,
a pure data-completeness fix once the real gap was scanned for directly
rather than trusted from the checker's own (narrower-than-it-looked)
finding count.

## A `supersedes:` target can be a capture hash, not just a decision id (`tsk-55h`)

The same run's third finding was a genuinely different problem, not
another instance of the first: `0027`'s frontmatter carried
`supersedes: [2ae492d8]` — an 8-char capture hash referencing a real
compound-learning capture record (`base-workflow-model` D1-D3), not a
4-digit `docs/decisions/NNNN-*.md` id. Semantically correct (0027 really
does supersede that capture), but `classifySupersedes()` only recognizes
`supersedes:` as a clean id-list, empty, or unparseable "prose" — a
capture-hash array falls into "prose", producing the checker's
deliberately-honest "not a clean list of ids -- check by hand" finding
rather than a false pass or a false failure.

Two shapes were possible: (a) teach the checker to recognize a
capture-hash as a second valid target kind, or (b) give capture-hash
supersession its own field, keeping `supersedes:` scoped to decision ids
only. The locked choice was (b) — a new `supersedes_capture:` field,
`supersedes:`'s existing meaning left untouched:

> "User chose this (option B) over teaching the checker a second
> 'capture-hash' target kind (option A, rejected): a capture has no
> frontmatter of its own to verify a back-pointer against, so the checker
> would gain nothing by recognizing it as a valid target — keeping
> `supersedes:` single-purpose (decision ids only) is simpler and matches
> YAGNI."
> — real locked decision D1, `docs/history/tsk-55h/CONTEXT.md`

The reasoning matters beyond this one field: a checker's value comes from
verifying a *bidirectional* pointer (a decision id target must itself
carry a matching `superseded_by` back-reference) — recognizing a target
kind that structurally can't carry that back-reference wouldn't add real
verification, only a wider "valid" classification for the same
unverifiable data. Confirmed as a one-file migration (a repo-wide scan
found `0027` as the only record using a capture-hash in `supersedes:`
today), with a known second instance (`tsk-5jb`, still open at the time)
expected to follow the same `supersedes_capture:` shape once it lands.

## Related

- `docs/how-to/resolve-a-decision-id-collision-merge-conflict-on-approve.md`
  — the other trap this item's own description named in advance: two
  branches independently minting the same next decision number (`0029`)
  collide at merge time, not before. This item avoided it by checking
  `ls docs/decisions/` immediately before naming the file rather than
  trusting a number recalled from earlier in the session.
