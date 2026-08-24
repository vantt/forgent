# RESEARCH.md — tsk-67o

## Round 1 (2026-08-24, discovery stage)

**Asked:** Is a narrow `docsRef`-keyed path exemption for
`docs/history/<feature>/RESEARCH.md` (mirroring the existing
`excludeIronLawEvidence`/`excludeFgosPaths` precedents) mechanically
feasible in `footprintDiffHits`'s two call sites, given the item's own
description flagged a blocker: "RESEARCH.md lives under
`docs/history/<feature>/` where `<feature>` is a free-form slug, NOT
guaranteed to equal the item id, unlike `iron-law-evidence.md`'s
`docs/history/<id>/` path"?

**Checked:**

- `bin/fgos.mjs:194-224` — `excludeIronLawEvidence(files, id)` derives its
  exempt path from the item `id` directly (`docs/history/${id}/iron-law-
  evidence.md`), which is why the item's description called out that
  `RESEARCH.md`'s path can't reuse this exact same id-keyed pattern.
- `bin/fgos.mjs:3189` and `bin/fgos.mjs:3320` — both `footprintDiffHits`
  call sites already have `item` in scope (used for `item.footprint`
  right next to the call), so `item.docsRef` is equally reachable at both
  sites — no plumbing gap blocks a `docsRef`-keyed exemption.
- `src/state/store.mjs:339` — `docsRef` is a real, stored, editable field
  (`EDITABLE_FIELDS`), not derived from `id`; `src/state/work.mjs:600-602`
  validates it as a non-empty string when present.
- `src/state/store.mjs:622-623` — the SAME join pattern already exists for
  `plan.md`: `path.posix.join(work.docsRef.replace(/\/+$/, ''), 'plan.md')`.
  The identical join with `'RESEARCH.md'` instead of `'plan.md'` gives the
  exact exempt path `fgos-researching`'s own convention writes to
  (`.agents/skills/fgos-researching/SKILL.md:66`: "Append findings to
  `docs/history/<feature>/RESEARCH.md`").
- `.agents/skills/fgos-coding-discovering/SKILL.md` (full file read) — has
  NO docsRef-registration step of its own before calling the
  `fgos-researching` helper; a fresh item's first `docsRef` write, when it
  happens at all, is either `fgos-coding-exploring`'s CONTEXT.md step
  (`.agents/skills/fgos-coding-exploring/references/lock-decisions-and-
  write-context.md`, "Pointing the item at its doc") or
  `fgos-coding-planning`'s own bootstrap step
  (`.agents/skills/fgos-coding-planning/references/bootstrap-and-
  lane.md`, "Register a freshly-created feature dir's docsRef
  immediately"). Neither of those two registration points contains code
  or documented logic that detects/reuses an EXISTING
  `docs/history/<feature>/` directory already created by an earlier
  discovery-stage `fgos-researching` call for the same item — the slug
  reuse across stages is a human/session-followed convention (the same
  session picks the same descriptive name), never a code-enforced
  invariant. No `docsRef` read-back or directory-existence check exists
  in `src/intake/plan.mjs`, `src/intake/discovery.mjs`, or
  `bin/fgos.mjs` that would auto-detect this.
- Empirical check across the real `docs/history/` corpus (777 feature
  dirs, 217 with `RESEARCH.md`, 531 with `plan.md`): **211 of 217
  `RESEARCH.md` dirs (97%) also have a `plan.md` in the SAME directory**
  (`agy-cwd-fidelity/`, `data-dictionary-no-stuck-merge-abort-drift/`
  — the item's own cited confirmed-live example — and 209 others). Only 6
  dirs have `RESEARCH.md` with no `plan.md` (e.g.
  `cli-data-work-field-shape-ambiguity/`,
  `tsk-13r-validateapprove-tier-ceiling-friction/`), consistent with
  items that never reached (or haven't yet reached) `planning`'s own
  footprint-sync step, not with `docsRef` pointing somewhere else than
  where `RESEARCH.md` landed.
- `test/cli/fgos-return.test.mjs:303-323` — the existing test shape for
  `excludeIronLawEvidence` (`docs/history/${id}/iron-law-evidence.md`
  exempt, `random-outside.txt` still flagged) is a direct template for a
  new `docsRef`-keyed test: commit `docs/history/<feature>/RESEARCH.md`
  under an item with `docsRef` set to that same `<feature>/`, assert it
  is exempt while an unrelated outside file still surfaces.

**Found:** `docsRef` reliably ends up pointing at the same feature dir
`RESEARCH.md` was written into by the time `fgos return` runs, for the
overwhelming majority (97%, empirically) of items that reach `planning`
(which every item must, per the coding domain's stage graph — a `clear`
discovery verdict skips `exploring` but never `planning`). This is a
convention kept consistent by session behavior (same descriptive slug
reused across stages), not a code-enforced link, but the population where
it could diverge (an item using two different feature-dir names across
stages) is not what the 6 `RESEARCH.md`-only exceptions found above show
— those are items that simply never reached `planning`'s own footprint
sync, which is a separate, pre-existing condition (`footprintDiffHits`'s
own D5 exemption already returns `[]` for any item with no declared
footprint, so those items were never going to surface this noise in the
first place regardless of any `RESEARCH.md` exemption).

**What remains open:** none for a docsRef-keyed narrow exemption — the
mechanism is fully wireable with `item` already in scope at both call
sites and `item.docsRef` a real, validated field. A convention-vs-code-
enforced gap exists in principle (a session could theoretically pick two
different feature-dir names across discovery and planning for the same
item), but no real evidence in the current corpus shows this happening,
and closing that gap (e.g., having `fgos-coding-discovering` itself
register `docsRef` before its first `fgos-researching` call) is a
separate, optional hardening step — not a blocker for shipping the narrow
`docsRef`-keyed exemption itself, since an item with NO `docsRef` set at
all simply falls through unexempted (same graceful-degrade shape
`excludeIronLawEvidence` already has none of, and `excludeFgosPaths`
doesn't need, but is a natural early-return: `if (!item.docsRef) return
files;`).

**Verdict:** `{clear: true, verify: "node --test test/cli/fgos-return.test.mjs test/runner/frozen-judge.test.mjs"}`
