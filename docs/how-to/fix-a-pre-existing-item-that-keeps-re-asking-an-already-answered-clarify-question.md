# Fix a pre-existing item that keeps re-asking an already-answered clarify question

`fgos-coding-exploring`'s trust-skip mechanism (see
`docs/explanation/fgos-discover-trusts-a-locked-context-instead-of-blind-rejudging.md`)
only kicks in when the item's own `docsRef` field is set and points at a
real, non-empty `CONTEXT.md`. If an item was created before you ever ran
`fgos-coding-exploring` on it — or before this field existed on the item at all —
`docsRef` can be empty even after you've written and committed a
`CONTEXT.md` for it. When that happens, `fgos discover <id>` has nothing
to trust, falls back to a full re-judgment, and can ask a brand-new
question that ignores the decisions you already locked.

This has happened twice, independently, on real items:

- **`tsk-2cs`**: "docsRef was missing on this item when discover first ran
  (pre-existing item, field never set) -- now set via `fgos edit
  --docs-ref`, so the committed CONTEXT.md is discoverable going
  forward." (recorded settlement, human answer, 2026-08-01)
- **`tsk-2ta`**: the same symptom — `fgos-coding-exploring` locked D1/D2 in
  `CONTEXT.md`, `fgos discover tsk-2ta` was called next, and it came back
  `unclear` with a fresh restatement of the exact question `CONTEXT.md`
  had already answered. The item's `docsRef` was empty; the committed
  `CONTEXT.md` existed on disk but nothing on the item record pointed at
  it.

## The fix

1. Confirm the symptom: `fgos discover <id>` returns `outcome: "unclear"`
   with a `verdict.question` that restates something your `CONTEXT.md`
   already locked, and the item gets parked in `awaiting-human`.
2. Check whether `docsRef` is actually set:
   ```
   fgos list --id <id> --json
   ```
   Look at `data.work["<id>"].docsRef`. If it's `null` or empty despite a
   real `docs/history/<feature>/CONTEXT.md` existing and being committed,
   that's the cause.
3. Answer the parked question (it's already been answered in
   `CONTEXT.md` — cite the D-ID directly rather than re-deriving it):
   ```
   fgos answer <id> --text "Already locked as D1/D2/... in docs/history/<feature>/CONTEXT.md: <one-line summary>."
   ```
4. Set `docsRef` so the trust-skip has something to find next time:
   ```
   fgos edit <id> --docs-ref "docs/history/<feature>/"
   ```
5. Call `fgos discover <id>` again. With `docsRef` now set and
   `CONTEXT.md` present and non-empty, `resolveDiscovery` trusts it and
   advances the stage instead of re-judging from scratch.

## Why this isn't a bug in the trust-skip mechanism itself

The trust-skip check (`docsRef` set + `CONTEXT.md` non-empty) is doing
exactly what it was designed to do — refuse to trust a pointer that isn't
there. The actual gap is upstream: nothing automatically backfills
`docsRef` onto an item that existed before the field did, or that never
had `fgos add --docs-ref` / `fgos edit --docs-ref` run on it. Writing
`CONTEXT.md` and committing it is necessary but not sufficient — the item
record itself still needs the pointer set explicitly, once, before
`discover` can trust it.
