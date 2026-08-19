# Research — tsk-2sp: remaining citation-format backlog

## Round 1 — 2026-08-19

**Asked:** verify the current state of the citation-format violation
backlog tsk-2sp's own description claims (1664 = 301 `d-local-outside-home`
in `docs/specs/work-state.md` + 1363 across 72 other files); confirm the
fix tooling/contract; check whether the number has drifted since tsk-2yu
delivered, and whether any prior identity/pattern already reduces the real
remaining effort.

**Checked:**

- `scripts/check-decision-citation-drift.baseline.json` (live, current HEAD)
  — counted programmatically (`node -e` reading the JSON directly).
- `scripts/check-decision-citation-drift.mjs:1-45` — header comment (fix
  contract per finding kind), `WIDE_SWEEP_ROOTS` (`:320`,
  `['docs', 'src', 'plugins', '.agents/skills']` — `.claude/skills` is NOT
  scanned).
- `docs/history/tsk-2yu-citation-baseline-cleanup/plan.md` — where the
  "1664" figure originates (1788 total at tsk-2yu's own discovery, minus
  the 124 `bare-citation` findings its one delivered child fixed in
  `work-state.md`).
- `docs/history/tsk-3x8-citation-drift-baseline-line-keying/plan.md` — the
  baseline was re-keyed by content (not line number) after tsk-2yu, real
  count at that point: 1645 (pure format migration, same count before/after
  the re-key).
- `docs/history/tsk-352f-generated-wrapper-d-local-citation-cleanup/plan.md`
  — fixed a bare D-local citation in `.claude/skills/**/SKILL.md`'s
  generator template (`src/setup/skill-wrappers.mjs:45`); confirmed (via
  that item's own grep cross-check) `.claude/skills`/`plugins/fgOS/skills`/
  `.agents/skills` did NOT contain that specific string, so this fix did
  not touch the citation-drift baseline count at all.
- `fgos list --all --json` — confirmed tsk-352f/tsk-3x8/tsk-6at/tsk-2yu are
  all `delivered`, and read their `tier`/`kind`/`risk` for classification
  precedent.
- `.agents/skills/` vs `plugins/fgOS/skills/` directory listing +
  baseline-key comparison — confirmed which `plugins/fgOS/skills/<name>/`
  files are byte-identical mirrors of an `.agents/skills/<name>/` source
  (the 14 `fgos-*`/`_shared`/`distill` dev-skills, per
  `test/skills/fgos-mirror.test.mjs:115-137`'s own enforced contract) vs
  which are plugin-only CLI-wrapper skills with no `.agents/skills` source.

**Found:**

1. **The "1664" figure in tsk-2sp's own description is stale.** Live
   baseline right now: **1679** total findings across 73 files
   (`d-local-outside-home`: 1417, `bare-citation`: 262).
   `docs/specs/work-state.md` still shows exactly 301
   `d-local-outside-home` (matches the description). The other 72 files
   show **1378**, not 1363 — a real drift of +15 since tsk-2yu delivered,
   consistent with ordinary interim doc edits across other work items
   citing ADR/RUL/D ids (no single culprit commit checked; the delta is
   small and explained by normal traffic, not a tooling bug — tsk-3x8's
   re-keying fix already landed and is a pure format migration, confirmed
   count-stable at 1645 at that point, so the +34 growth from 1645→1679
   post-dates tsk-3x8/tsk-6at too).

2. **Fix contract per kind is already established (`check-decision-
   citation-drift.mjs:9-20`, executed once already by tsk-2yu's own
   delivered child):**
   - `bare-citation` — add `"<ID> (<one-line gloss>)"` right after the
     bare `ADR<n>`/`RUL<n>` id. Mechanical shape, needs real understanding
     to write an accurate gloss.
   - `d-local-outside-home` — a `D<n>` id cited outside its own home
     `CONTEXT.md`. Not mechanical: "the only correct fix is inlining the
     content and deleting the id" (script's own comment, decision 0017) —
     genuine per-occurrence read + rewrite.

3. **Real leverage point: `.agents/skills` ↔ `plugins/fgOS/skills` mirror
   duplication.** 14 `plugins/fgOS/skills/<name>/SKILL.md` files are
   byte-identical mirrors of `.agents/skills/<name>/SKILL.md` (enforced by
   `test/skills/fgos-mirror.test.mjs`, no automated regen script — kept in
   sync by hand-copy today, confirmed no `build:skills`-equivalent script
   touches `plugins/fgOS/skills`). Their findings are literal duplicates:

   | Bucket | Files | Findings |
   |---|---|---|
   | `docs/specs/work-state.md` | 1 | 301 (all `d-local-outside-home`) |
   | `.agents/skills/*` (canonical) | 14 | 270 |
   | `plugins/fgOS/skills/*` — mirrors of the 14 above | 14 | 270 (same content, same findings) |
   | `plugins/fgOS/skills/*` — plugin-only, no `.agents` source | 33 | 120 |
   | other `docs/*.md` (backlog + 10 specs) | 11 | 718 |
   | **Total** | **73** | **1679** |

   Fixing a finding inside one of the 14 mirrored files needs real
   research+rewrite ONCE (in `.agents/skills/<name>/SKILL.md`), then a
   mechanical hand-copy into `plugins/fgOS/skills/<name>/SKILL.md` —
   never independent research twice. Real distinct-content findings
   needing independent research+rewrite: 301 + 270 + 120 + 718 =
   **1409** (not 1679); the remaining 270 are copy-through.

4. **Classification precedent.** tsk-2yu (the original 1788-finding item,
   before any split) was classified `tier: heavy, risk: heavy` — its own
   plan.md reasoning: "1788 individually-judged content fixes across 73
   files, several of them load-bearing spec docs" is standard-or-bigger
   scale, not tiny/small. tsk-2sp's remaining backlog (1679 findings /
   1409 distinct-content, same 73-file footprint, same load-bearing spec
   docs) is the same shape and a comparable scale to tsk-2yu at ITS OWN
   discovery time — not comparable to tsk-352f/tsk-3x8/tsk-6at (each a
   single narrow bug-fix slice of a handful to a few hundred findings,
   correctly classified `light`). tsk-2sp currently carries `tier: light,
   risk: light` on the item — inconsistent with this evidence.

**Still open:** none — every point above is resolved from real evidence
(the live baseline file, the checker's own header contract, delivered
sibling items' plan.md content, and the mirror test's own enforced
contract). No gap needs a person before planning can start.

**Verdict:** `clear`. Verify (real, runnable — same CLI shape tsk-2yu's/
tsk-3x8's own children already used):

```bash
node scripts/check-decision-citation-drift.mjs --decisions-dir docs/decisions --backlog docs/backlog.md --specs-dir docs/specs --skills-dir .agents/skills --skills-dir plugins/fgOS/skills --write-baseline
```

followed by re-reading `scripts/check-decision-citation-drift.baseline.json`'s
total finding count and confirming it dropped from today's real baseline
(1679), the same "regenerate, then assert a real count change" shape every
delivered sibling item in this feature already used.

## Round 2 — 2026-08-19 (scope narrowed after materialization)

**Asked:** user reported tsk-2sp's own description was updated externally
to narrow scope; re-read the item to find what changed and reconcile it
against the 5 children already materialized in round 1.

**Checked:** `fgos list --id tsk-2sp --json` (fresh read) — description
now reads: scope is the 12 non-skill baseline files (1019 findings) only;
the `.agents/skills`/`plugins/fgOS/skills` scope (660 findings) moved to
`tsk-56w`, citing a stricter fix rule locked at
`docs/history/skill-prose-cleanup/DISCUSSION.md` D1 (remove governance
ids outright, never gloss — `plugins/fgOS/skills` ships standalone via
marketplace with no `docs/` alongside it, so even a glossed citation is
dead on arrival there). Also checked `fgos list --id tsk-56w --json`:
real item, `status: doing`, `stage: discovery` — mid-flight elsewhere,
not something this session should touch beyond confirming it exists.

**Found:** the narrowed scope (1019 findings, 12 files) is EXACTLY the
sum of this round 1 plan's children 1+2+5 (301+412+306), file-for-file
(`work-state.md` + `runner.md` + the same 10-file remaining-docs bucket).
Children 3 and 4 (the skill-prose mirror + plugin-only children, 660
findings) are the exact set that moved to `tsk-56w`. No re-slicing
needed — the original natural fault lines already drew this exact
boundary, coincidentally (or not: skill-prose files were always a
structurally distinct bucket from doc-prose files in this plan).

**Verdict:** children 3/4 retired `wontfix` (their gloss-based `action`
text now contradicts `tsk-56w`'s locked stricter rule); a decision was
recorded on `tsk-2sp` explaining why; children 1/2/5 need no changes.
