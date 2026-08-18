# plan.md — tsk-3u8-retrospective-synthesis-instance-audit (tsk-3u8)

Mode: tiny

Lane decided directly (no prior handoff — this session entered via
`fgos-coding-driving` after `fgos-coding-discovering`'s own `clear` verdict,
which skipped `exploring`, so no earlier `plan.md` round exists). No
`CONTEXT.md` exists for this item — it never entered `exploring` — so this
plan's decisions trace to `fgos-researching`'s own recorded finding
instead: `docs/history/retrospective-synthesis-merge-corruption/
RESEARCH.md` Round 2 (2026-08-18). Flags counted per `fgos-routing`'s own
Mode-gate table: **zero** apply — no file will be touched, no existing
covered behavior changes, no new surface. `tiny` is the honest lane: a
one-item audit whose own investigation is already complete and whose
conclusion is "no code fix needed."

## Approach

**Chosen path:** close the item as a verified non-issue. No source, test,
or doc-content change is required — the item's own two open questions
(is `docs/history/tsk-66t-sync-root-clean-tree-gate/iron-law-evidence.md`
intact on `main`; did `tsk-1vi`'s own retrospective-synthesis write survive
and get tagged via `fgos compound`) are both answered **yes** by direct
git evidence, recorded in
`docs/history/retrospective-synthesis-merge-corruption/RESEARCH.md`
Round 2:

- `docs/history/tsk-66t-sync-root-clean-tree-gate/iron-law-evidence.md` on
  `main` today is byte-identical (`git diff` empty) to the original
  `8dd4b5be72751c50396cceef367c25ce27b0f51b` commit version. Its
  functional code (the sync-root dirty-tree gate + `dirty-tree` blocked
  shape the merge also carried in `bin/fgos.mjs`) is present today too,
  relocated by a later, unrelated verb-extraction refactor into
  `src/verbs/merge/sync-root.mjs:249-251` and
  `src/verbs/merge/merge.mjs:139-146` — not corruption, a routine module
  move.
- `docs/explanation/gate-bypass-design.md`'s `## A mechanical check is
  only as live as the branch importing it (D7/D8, tsk-1vi)` section (and
  the `tsk-1vi` tag in its frontmatter `source_capture_ids`) — `tsk-1vi`'s
  own retrospective-synthesis write — is present verbatim on `main`
  today, and matches `fgos show tsk-1vi --json`'s own recorded
  `outcome.docType: "explanation"` / `outcome.docPath:
  "docs/explanation/gate-bypass-design.md"`: properly tagged via `fgos
  compound`, not silently dropped.

**Rejected alternative — treat the suspicious 2-parent merge shape as
proof of loss and start restoring content anyway:** rejected because
restoring content that is already present and byte-identical would be
pure churn with no real deliverable — the two files this item names are
not damaged. This is the honest difference from `tsk-2oy`'s own findings
(`tsk-4v6`/`687abfb8` and `tsk-2x9`/`tsk-1r3`, confirmed REAL losses in
the same RESEARCH.md, Round 1): the same suspicious commit shape does not
mean every instance lost content, and this item's own job was to check
this one instance individually rather than assume the pattern generalized.

### Risk map

| # | Component | How risky | Proof point (for `fgos-coding-validating`) |
|---|---|---|---|
| 1 | Conclusion "no content lost" | LOW — already proven by direct `git diff`/`git show` evidence against the real commit SHAs, not inference. | `RESEARCH.md` Round 2's own citations (empty-diff checks, `fgos show` outcome fields) are the proof; re-runnable by any later reader. |

Impact-analysis capability gate (`CLAUDE.md`): not applicable — this item
makes no code change, so no proof point leans on blast-radius evidence.

### Files touched

None. This item closes with no source/test/doc-content edits — the
`fgos-researching` round already wrote its findings into the existing
`docs/history/retrospective-synthesis-merge-corruption/RESEARCH.md`
(Round 2), which is the deliverable evidence trail, not a code change.

### Order

Single item, no split, no ordering decision needed (`fgos graph --json`:
0 deps).

## Shape

**Close as verified non-issue.** No implementation piece exists to shape.
The proof surface below re-runs the same checks Round 2 already performed,
so a stranger reviewing this item later can reproduce the verdict without
trusting prose alone.

## Decide the split

One honest piece: **no split.** The item is a single audit conclusion;
`fgos-coding-validating` reads this as the `pass-through` verdict.

## Leave execution alone

No execution piece exists — `fgos-coding-implement` will find nothing to
implement, only `npm test` to confirm the repo is still green (the
item's own pre-existing `verify`, already a real command, left
unchanged).

### Proof surface (verify)

Item's `verify` stays `npm test` (already a real, runnable command set at
intake — no placeholder to sync per step 5's `FALLBACK_VERIFY`/
`RETIRED_P14_PLACEHOLDER` check). The evidence for the audit conclusion
itself is reproducible independently of `npm test`, via:

```
git diff 8dd4b5be72751c50396cceef367c25ce27b0f51b:docs/history/tsk-66t-sync-root-clean-tree-gate/iron-law-evidence.md main:docs/history/tsk-66t-sync-root-clean-tree-gate/iron-law-evidence.md
git diff 93a9859bbcb7b6150cc7634cb3c687f0e8556851 d984e9edfd2f0ddfc9d7bff6907d3c4f3497052d -- docs/explanation/gate-bypass-design.md
```

Both expected to be empty/identical to the commit content, per RESEARCH.md
Round 2's own citations.

## Outstanding questions

None
