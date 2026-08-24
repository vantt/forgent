# plan.md — tsk-67o

Mode: small

(1 flag: "existing covered behavior" — this touches `footprintDiffHits`'s
existing call sites and its existing test suite. No auth, authorization,
data model, audit/security, external system, public contract,
cross-platform, weak-proof-area, or multi-domain flag applies — a
standard/high-risk lane would not honestly fit a two-file, mechanical,
precedent-mirroring change.)

impact-analysis posture: **degraded** — GitNexus is registered and
`present` (`fgos tool query --capability impact-analysis --status
present`), but this session's environment reported its index as stale
(`last indexed: 7bb3231`, pre-dating this worktree's HEAD). Not required
here regardless: the risk map below has no medium/high entry that leans
on blast-radius evidence — the change is two additive, mechanically
precedent-mirrored edits inside already-covered code, verified by the
existing `frozen-judge`/`fgos-return` test suites rather than by graph
analysis.

## Approach

**Chosen path:** add a third path-exemption helper,
`excludeDocsRefResearch(files, item)`, alongside the two existing
precedents already living in `bin/fgos.mjs` — `excludeIronLawEvidence`
(tsk-4hl) and `excludeFgosPaths` (tsk-x5r/tsk-5iv) — and wire it into
both `footprintDiffHits` call sites (`bin/fgos.mjs` ~3189 and ~3320),
inside the same `excludeFgosPaths(excludeIronLawEvidence(...))`
composition chain those two calls already use.

```js
function excludeDocsRefResearch(files, item) {
  if (typeof item?.docsRef !== 'string' || !item.docsRef.trim()) return files;
  const researchPath = normalizePath(path.posix.join(item.docsRef.replace(/\/+$/, ''), 'RESEARCH.md'));
  return files.filter((f) => normalizePath(f) !== researchPath);
}
```

Call sites become:

```js
const footprintDiff = footprintDiffHits(
  excludeDocsRefResearch(excludeFgosPaths(excludeIronLawEvidence(changed, id)), item),
  item.footprint,
);
```

(and the mirror at the main-source `return` path, using `ownDiff` in
place of `changed`).

**Why this shape, not the alternative the item's own description raised**
(rewriting `fgos-coding-planning`'s footprint-sync convention so every
item's `footprint` always includes its own `RESEARCH.md`): that
alternative pushes a mechanical fact (a doc every researched item
predictably produces) into a human/session-followed convention every
future item would have to remember to apply correctly, the exact failure
mode that produced this bug in the first place (the convention already
documents syncing `plan.md`, and RESEARCH.md was still missed). A code-
level exemption, same as the two precedents it mirrors, cannot be
forgotten by a future planning pass.

**Why `docsRef`, not `id`** (the item's own description flagged this as
the blocker keeping it from a straight `excludeIronLawEvidence`-style
fix): `iron-law-evidence.md` lives at `docs/history/<id>/`, keyed on `id`
directly, because that convention is hard-coded (D-ref:
`docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md`).
`RESEARCH.md` instead lives at `docs/history/<feature>/`, where
`<feature>` is a free-form slug picked once by whichever stage first
creates the feature dir (discovery's own `fgos-researching` call,
`fgos-coding-exploring`'s CONTEXT.md step, or this skill's own Bootstrap)
— NOT guaranteed to equal `id`. `work.docsRef` is the item's own stored,
validated pointer at that exact directory
(`src/state/store.mjs` `EDITABLE_FIELDS`; `src/state/work.mjs:600-602`
validation), already used for the identical join with `plan.md`
(`src/state/store.mjs:622-623`:
`path.posix.join(work.docsRef.replace(/\/+$/, ''), 'plan.md')`). Both
`footprintDiffHits` call sites already have `item` in scope (used for
`item.footprint` on the same line), so `item.docsRef` costs nothing extra
to reach — see `RESEARCH.md` Round 1 for the full evidence trail,
including an empirical scan of the real `docs/history/` corpus (211/217
`RESEARCH.md` dirs also carry a `plan.md` in the same directory,
confirming `docsRef` reliably lands on the same feature dir `RESEARCH.md`
was written into, for the population that reaches `planning` — every
item does, per the coding domain's own stage graph).

**Alternatives rejected:**
- Blanket `docs/history/**/RESEARCH.md` exemption (any feature dir, not
  just the item's own `docsRef`) — rejected: would also swallow a
  DIFFERENT item's `RESEARCH.md` that a real item's diff picks up as a
  genuinely out-of-footprint concurrent change (the same over-broad
  failure `.fgos/**` hit before tsk-5iv narrowed it) — narrower,
  `docsRef`-scoped exemption avoids that regression class entirely.
- Rewriting the footprint-sync convention (see "why this shape" above) —
  rejected as a convention-only fix for a mechanical, forgettable gap.

**Risk map:**

| Component | How risky | What would prove it |
|---|---|---|
| `excludeDocsRefResearch` helper | Low — pure function, mirrors two existing tested precedents | Unit-shape test in `test/cli/fgos-return.test.mjs`, matching the existing `iron-law-evidence.md` exemption test's shape (commit the file, assert exempt; commit an unrelated file, assert still flagged) |
| Two call-site wiring edits | Low — additive composition, same pattern as the two precedents already chained there | Existing `frozen-judge`/`fgos-return` regression suite stays green; new test above exercises both branch and main-source return paths already covered by that suite's existing structure |
| `docsRef` absent on some items | Low — falls through unexempted (same as before this fix), never breaks | Existing `footprintDiffHits: empty when NO footprint declared (D5)` test already covers the absent-footprint case unaffected by this change; no new absent-`docsRef` test needed since the fallback is a plain early-return, not new logic to break |

No medium/high-risk entries — no proof point beyond the test suite above
is needed.

**Files touched, in order:**
1. `bin/fgos.mjs` — add `excludeDocsRefResearch`, wire both call sites.
2. `test/cli/fgos-return.test.mjs` — add the exemption test.

(`fgos graph --json`'s `criticalPath`/`topUnblock` do not list tsk-67o —
standalone, no dependency ordering to honor.)

## Shape

Single pass-through piece, no split — both edits are two small, related
changes to the same advisory mechanism, honestly one unit of work.

Concrete cases to prove against (small-lane depth):
- `RESEARCH.md` at the item's own `docsRef` path is exempt from
  `footprintDiffHits` when it appears in the diff.
- An unrelated file outside the declared footprint is still flagged
  (never accidentally over-broadened by the new exemption).
- An item with no `docsRef` set behaves exactly as before (no exemption
  applies, same as today) — covered by the existing D5 absent-footprint
  test already in the suite; no new test needed for this case since nothing
  new executes when `docsRef` is absent.

## Outstanding questions

None
