# Plan — tsk-2sp: remaining citation-format backlog

## Addendum (2026-08-19): scope narrowed, tsk-2sp-3/tsk-2sp-4 retired

Item description updated externally, coordinating with `tsk-56w`
(`docs/history/skill-prose-cleanup/DISCUSSION.md` D1): `tsk-2sp` now
covers only the 12 non-skill baseline files (1019 findings) —
`docs/specs/*.md` (the 11 files below) + `docs/backlog.md`. The
`.agents/skills/**/SKILL.md` + `plugins/fgOS/skills/**/SKILL.md` scope
(660 findings, this plan's original children 3 and 4) is now owned by
`tsk-56w`, which locked a STRICTER rule for those files — remove every
governance id outright (never gloss, never footnote), because
`plugins/fgOS/skills` ships standalone via marketplace with no `docs/`
alongside it. That contradicts children 3/4's own gloss-based `action`
text below, so both are **retired `wontfix`**, not reworked — the correct
fix approach for that scope lives entirely in `tsk-56w` now, not here.

`tsk-2sp-1` (`work-state.md`, 301), `tsk-2sp-2` (`runner.md`, 412), and
`tsk-2sp-5` (remaining `docs/*.md`, 306) are **unaffected** — their
combined scope (301+412+306 = 1019) already matches the narrowed
description exactly, files-for-files, no further re-split needed. No
dependency is required between `tsk-2sp` and `tsk-56w` after this split —
both scopes are now disjoint and can run in parallel per the item's own
updated description.

The rest of this file (Approach/Split/child specs, including the now-
retired children 3/4) is kept as-is below for traceability — it recorded
real evidence and a real gate history (two `need-human` rounds, both
resolved) that produced the three children that ARE still live. Do not
edit the historical numbers/evidence below; this addendum is the current
scope of record.

Mode: **standard**

Lane decided via `fgos-routing`'s Mode-gate direct-entry fallback (no
`CONTEXT.md` exists — discovery verdict was `clear`, which skips
`exploring`, and no lane was handed off in prose along the `/fgOS:pick` →
`fgos-coding-driving` → `fgos-coding-discovering` → this skill path). Flag
count against the hard-gate list (auth, authorization, data model,
audit/security, external systems, public contracts, cross-platform,
existing covered behavior, weak proof, multi-domain): **0** — prose-only
citation-format editing, no runtime/security/contract surface. Same
disqualifying-scale override tsk-2yu's own plan.md already used for the
identical shape of work ("0 flags with disqualifying scale reads as
standard: story-sized cleanup work, not a single mechanical task") — this
item's remaining scope (1679 live findings, 73 files, several load-bearing
spec docs) is the same shape and a comparable scale to tsk-2yu at ITS OWN
discovery time, not the smaller single-bug-fix scale of tsk-352f/tsk-3x8/
tsk-6at (each correctly `tiny`/`small`).

## Locked decisions

None — `CONTEXT.md` does not exist for this item (discovery verdict
`clear` skipped `exploring`). See `RESEARCH.md` round 1 (2026-08-19) for
the grounding evidence this plan cites instead.

## Approach

**Goal (from the item's own description, refined by RESEARCH.md round 1):**
real content fixed for the remainder of tsk-2yu's own backlog, not the
baseline re-stamped to hide it — same standing goal tsk-2yu's own plan.md
stated, carried forward to this follow-on planning round exactly as that
plan's own Split section said it would be.

**Real evidence (RESEARCH.md round 1, 2026-08-19):** live baseline right
now is 1679 findings across 73 files (not the item's own stale "1664" —
drift of +15 in the "other 72 files" bucket since tsk-2yu delivered,
explained by ordinary interim doc traffic, not a tooling bug). Breakdown:

| Bucket | Files | Findings | Kind |
|---|---|---|---|
| `docs/specs/work-state.md` | 1 | 301 | `d-local-outside-home` only |
| `docs/specs/runner.md` | 1 | 412 | 304 `d-local-outside-home` + 108 `bare-citation` |
| `.agents/skills/*` (canonical, 14 dirs) | 14 | 270 | mixed |
| `plugins/fgOS/skills/*` — byte-identical mirrors of the 14 above | 14 | 270 (same content) | mixed |
| `plugins/fgOS/skills/*` — plugin-only, no `.agents` source (33 dirs) | 33 | 120 | mixed |
| Remaining `docs/*.md` (backlog.md + 9 specs) | 10 | 306 | mixed |
| **Total** | **73** | **1679** | |

Fix contract per kind, already proven by tsk-2yu's own delivered child
(`check-decision-citation-drift.mjs:9-20`):
- `bare-citation` — add `"<ID> (<one-line gloss>)"` right after the bare
  `ADR<n>`/`RUL<n>` id. Mechanical shape, needs real understanding to
  write an accurate gloss.
- `d-local-outside-home` — a `D<n>` id cited outside its own home
  `CONTEXT.md`. Not mechanical: inline the content, delete the id
  (decision 0017) — genuine per-occurrence read+rewrite.

**Why this cannot be one pass.** Same reasoning tsk-2yu's own plan.md
used: 1409 distinct-content individually-judged edits (1679 minus the 270
mechanical copy-through duplicates, see leverage point below) across 73
files, several load-bearing (`work-state.md`, `runner.md`), is not
"smallest honest plan" as a single piece.

**Real leverage point found this round (not available to tsk-2yu's own
discovery — new evidence).** 14 `plugins/fgOS/skills/<name>/SKILL.md`
files are byte-identical mirrors of `.agents/skills/<name>/SKILL.md`
(enforced by `test/skills/fgos-mirror.test.mjs`, kept in sync by hand —
no automated regen script touches `plugins/fgOS/skills`). Their 270
findings are literal duplicates of the 270 in `.agents/skills`: fix each
finding ONCE in the canonical `.agents/skills` source, then mechanically
copy the same edit into its `plugins/fgOS/skills` mirror — never
independent research twice for the same content.

**Split shape, informed by tsk-2yu's own precedent (single-kind/single-
file-first) plus this round's real per-bucket counts (not available
before this planning round):** five natural fault lines, none
overlapping in footprint, none needing to guess an estimate the
description asked not to invent — each bucket's own real count IS the
scope, no rounding.

**Risk map:**

| Component | How risky | What proves it |
|---|---|---|
| `docs/specs/work-state.md` d-local-outside-home (301) | Low runtime risk (prose only) but real correctness risk per-occurrence (a wrong inlining silently misinforms a future reader) — same profile tsk-2yu's own bare-citation child already carried for this same file | Checker re-run with `--write-baseline`, assert this file's `d-local-outside-home` count is 0 |
| `docs/specs/runner.md` (412, both kinds) | Low-medium — this is a heavily-cross-referenced platform-priority doc (`AGENTS.md` cites it directly for D-ADR0030); a bad inlining here has more downstream readers than an average spec | Checker re-run, assert this file's total finding count is 0; a human/agent spot-read of a sample of the actual glosses/inlines against the real id they describe (checker only detects *absence* of the format defect, never *correctness* of the content — same caveat tsk-2yu's own risk map already named) |
| `.agents/skills` (14 files) + `plugins/fgOS/skills` mirrors (14 files) | Low-medium — touches skill-prose paths; `docs/how-to/write-verify-for-a-skill-prose-change.md` read per plan step 5 (below) | `npm test` (re-validates `fgos-mirror.test.mjs` byte-identity is preserved after the hand-copy) + checker re-run asserting all 28 files' finding counts are 0 |
| `plugins/fgOS/skills` plugin-only (33 files, 120) | Low-medium — same skill-prose path caveat, no mirror counterpart to keep in sync | `npm test` + checker re-run, assert these 33 files' finding counts are 0 |
| Remaining `docs/*.md` (10 files, 306) | Low — smaller specs, no single file dominates | Checker re-run, assert these 10 files' combined finding count is 0 |
| Baseline ratchet (`scripts/check-decision-citation-drift.baseline.json`) | Low — `--write-baseline` mechanically re-snapshots current findings | `git diff --stat` on the baseline file after each child's own regen should show only that child's own bucket's findings removed, no additions elsewhere |
| Cross-child footprint on `scripts/check-decision-citation-drift.baseline.json` | Real (all five children regenerate this one shared, derived file) — and, found empirically at the Gate below (`resolvePlan`'s own decompose-time `footprintOverlapAmong` check, `src/intake/plan.mjs:956-958` / `src/state/graph-metrics.mjs:599-623`), this is a HARD park (`need-human`), not merely advisory. Hoisted out of every child's `footprint` array instead (the tool's own suggested resolution — "hoist"): the file needs no per-child ownership since it is fully re-derived from real repo state by each child's own `--write-baseline` re-run, never partially patched, so no child actually depends on which sibling wrote it last | Each child's own verify independently regenerates the baseline from live source truth and asserts its own bucket's count, regardless of dispatch order — confirmed by re-running all five verify assertions against the current, unfixed baseline (RESEARCH.md round 1 follow-up): each correctly reports its real non-zero count today |

Impact-analysis capability gate (`CLAUDE.md`): checked live — `fgos tool
query --capability impact-analysis --status present` reports GitNexus
registered and `present`. `impact-analysis: full (unused — no
code-symbol change in any of these five slices, prose-only edits to
Markdown/`SKILL.md` files, no GitNexus symbol index applies)`.

**Files touched (five children, disjoint footprints):**
1. `docs/specs/work-state.md`
2. `docs/specs/runner.md`
3. The 14 `.agents/skills/<name>/` sources that actually carry findings — `_shared/executor-dispatch-fallback.md` plus 13 `{fgos-clarifying,fgos-coding-compounding,fgos-coding-discovering,fgos-coding-driving,fgos-coding-exploring,fgos-coding-implement,fgos-coding-planning,fgos-coding-validating,fgos-fanout,fgos-indexing,fgos-researching,fgos-routing,fgos-unlock}/SKILL.md` — plus their matching `plugins/fgOS/skills/<name>/` mirror files (`distill/` and `fgos-coding-shaping/` carry zero findings today, correctly excluded from this child's real scope — see the exact per-file footprint in the child spec below, never the bare directory string, which would exact-match-collide with child 4's own footprint under `footprintOverlapAmong`)
4. `plugins/fgOS/skills/**/SKILL.md` — the 33 plugin-only files with no `.agents/skills` counterpart
5. `docs/backlog.md`, `docs/specs/{decision-citation-drift,distillery,distribution,enduser-docs-authoring,enduser-docs-index,herdr-web-dashboard,platform-foundations,reading-map,system-overview}.md`

Plus `scripts/check-decision-citation-drift.baseline.json`, regenerated
via `--write-baseline` after each child's own fixes land (five separate
regens, one per child, same "one commit per item" convention every
sibling item in this feature has already followed).

## Split

Five children this round, one per natural fault line found in RESEARCH.md
round 1 (no overlapping footprint, so no cross-child collision risk, and
each sized close to the sibling items already delivered in this feature —
tsk-2yu's own child fixed 124, tsk-3x8/tsk-6at/tsk-352f each fixed a
narrower slice; these five range 120–412):

```json
[
  {
    "title": "Fix d-local-outside-home findings in docs/specs/work-state.md",
    "verify": "node scripts/check-decision-citation-drift.mjs --decisions-dir docs/decisions --backlog docs/backlog.md --specs-dir docs/specs --skills-dir .agents/skills --skills-dir plugins/fgOS/skills --write-baseline && node -e \"const d=require('./scripts/check-decision-citation-drift.baseline.json'); const r=(d['docs/specs/work-state.md']||[]).filter(e=>e.startsWith('d-local-outside-home:')); if(r.length!==0){console.error('still',r.length,'d-local-outside-home findings in work-state.md');process.exit(1);} console.log('work-state.md d-local-outside-home: 0');\"",
    "action": "Fix the 301 d-local-outside-home findings in docs/specs/work-state.md per check-decision-citation-drift.mjs's own documented fix contract (script header, lines 9-20): inline each cited D-local id's real content and delete the id. This is the deferred remainder of tsk-2yu's own calibration file, same file, single remaining kind, per tsk-2yu's own plan.md Split section which explicitly deferred exactly this set to this follow-on planning round.",
    "footprint": ["docs/specs/work-state.md"],
    "kind": "chore",
    "risk": "light"
  },
  {
    "title": "Fix citation-format findings in docs/specs/runner.md",
    "verify": "node scripts/check-decision-citation-drift.mjs --decisions-dir docs/decisions --backlog docs/backlog.md --specs-dir docs/specs --skills-dir .agents/skills --skills-dir plugins/fgOS/skills --write-baseline && node -e \"const d=require('./scripts/check-decision-citation-drift.baseline.json'); const r=(d['docs/specs/runner.md']||[]); if(r.length!==0){console.error('still',r.length,'findings in runner.md');process.exit(1);} console.log('runner.md findings: 0');\"",
    "action": "Fix the 412 findings in docs/specs/runner.md (304 d-local-outside-home + 108 bare-citation) per check-decision-citation-drift.mjs's own documented fix contract (script header, lines 9-20): add a one-line gloss after each bare ADR<n>/RUL<n> id, and inline+delete each D-local id cited outside its home CONTEXT.md. Isolated into its own child (largest single remaining file, load-bearing per AGENTS.md's own D-ADR0030 citation) rather than batched with the smaller docs/*.md files, so a bad edit here does not ride along with nine unrelated files in one commit.",
    "footprint": ["docs/specs/runner.md"],
    "kind": "chore",
    "risk": "light"
  },
  {
    "title": "Fix citation-format findings in .agents/skills canonical sources and sync their plugins/fgOS/skills mirrors",
    "verify": "npm test && node scripts/check-decision-citation-drift.mjs --decisions-dir docs/decisions --backlog docs/backlog.md --specs-dir docs/specs --skills-dir .agents/skills --skills-dir plugins/fgOS/skills --write-baseline && node -e \"const d=require('./scripts/check-decision-citation-drift.baseline.json'); const names=['_shared','fgos-clarifying','fgos-coding-compounding','fgos-coding-discovering','fgos-coding-driving','fgos-coding-exploring','fgos-coding-implement','fgos-coding-planning','fgos-coding-validating','fgos-fanout','fgos-indexing','fgos-researching','fgos-routing','fgos-unlock']; const fileFor=n=>n==='_shared'?'executor-dispatch-fallback.md':'SKILL.md'; let bad=[]; for (const n of names){ for (const root of ['.agents/skills/','plugins/fgOS/skills/']){ const f=root+n+'/'+fileFor(n); const arr=d[f]; if (arr && arr.length) bad.push(f+':'+arr.length); } } if(bad.length){console.error('still findings:',bad.join(', '));process.exit(1);} console.log('agents+plugin mirror skill findings: 0');\"",
    "action": "Fix the 270 findings in the 14 .agents/skills canonical dev-skill sources (13 SKILL.md files plus .agents/skills/_shared/executor-dispatch-fallback.md) per check-decision-citation-drift.mjs's own documented fix contract (script header, lines 9-20), then hand-copy each same edit into the matching plugins/fgOS/skills/<name>/ mirror file (byte-identical contract enforced by test/skills/fgos-mirror.test.mjs) rather than re-researching the same 270 findings a second time in the mirror copy. distill/ and fgos-coding-shaping/ carry zero findings today and are out of this child's real scope. Read docs/how-to/write-verify-for-a-skill-prose-change.md first (plan step 5's own trigger: this touches SKILL.md/skill-prose paths) -- the checker's own baseline assertion plus npm test's fgos-mirror byte-identity re-check together serve as this doc's POSITIVE (new content present, mirror still consistent) and NEGATIVE (old bare-citation/d-local pattern gone) proof, more precise here than a generic grep since the checker is a purpose-built prose-citation validator.",
    "footprint": [".agents/skills/_shared/executor-dispatch-fallback.md", ".agents/skills/fgos-clarifying/SKILL.md", ".agents/skills/fgos-coding-compounding/SKILL.md", ".agents/skills/fgos-coding-discovering/SKILL.md", ".agents/skills/fgos-coding-driving/SKILL.md", ".agents/skills/fgos-coding-exploring/SKILL.md", ".agents/skills/fgos-coding-implement/SKILL.md", ".agents/skills/fgos-coding-planning/SKILL.md", ".agents/skills/fgos-coding-validating/SKILL.md", ".agents/skills/fgos-fanout/SKILL.md", ".agents/skills/fgos-indexing/SKILL.md", ".agents/skills/fgos-researching/SKILL.md", ".agents/skills/fgos-routing/SKILL.md", ".agents/skills/fgos-unlock/SKILL.md", "plugins/fgOS/skills/_shared/executor-dispatch-fallback.md", "plugins/fgOS/skills/fgos-clarifying/SKILL.md", "plugins/fgOS/skills/fgos-coding-compounding/SKILL.md", "plugins/fgOS/skills/fgos-coding-discovering/SKILL.md", "plugins/fgOS/skills/fgos-coding-driving/SKILL.md", "plugins/fgOS/skills/fgos-coding-exploring/SKILL.md", "plugins/fgOS/skills/fgos-coding-implement/SKILL.md", "plugins/fgOS/skills/fgos-coding-planning/SKILL.md", "plugins/fgOS/skills/fgos-coding-validating/SKILL.md", "plugins/fgOS/skills/fgos-fanout/SKILL.md", "plugins/fgOS/skills/fgos-indexing/SKILL.md", "plugins/fgOS/skills/fgos-researching/SKILL.md", "plugins/fgOS/skills/fgos-routing/SKILL.md", "plugins/fgOS/skills/fgos-unlock/SKILL.md"],
    "kind": "chore",
    "risk": "light"
  },
  {
    "title": "Fix citation-format findings in plugin-only skills under plugins/fgOS/skills",
    "verify": "npm test && node scripts/check-decision-citation-drift.mjs --decisions-dir docs/decisions --backlog docs/backlog.md --specs-dir docs/specs --skills-dir .agents/skills --skills-dir plugins/fgOS/skills --write-baseline && node -e \"const d=require('./scripts/check-decision-citation-drift.baseline.json'); const mirroredNames=new Set(['_shared','distill','fgos-clarifying','fgos-coding-compounding','fgos-coding-discovering','fgos-coding-driving','fgos-coding-exploring','fgos-coding-implement','fgos-coding-planning','fgos-coding-shaping','fgos-coding-validating','fgos-fanout','fgos-indexing','fgos-researching','fgos-routing','fgos-unlock']); let total=0; for (const [f,arr] of Object.entries(d)){ if(!f.startsWith('plugins/fgOS/skills/')) continue; const name=f.slice('plugins/fgOS/skills/'.length).split('/')[0]; if (mirroredNames.has(name)) continue; total+=arr.length; } if(total!==0){console.error('still',total,'plugin-only findings');process.exit(1);} console.log('plugin-only skill findings: 0');\"",
    "action": "Fix the 120 findings across the 33 plugins/fgOS/skills/<name>/SKILL.md files listed in this child's own footprint (CLI-wrapper skills with no .agents/skills counterpart, standalone content), per check-decision-citation-drift.mjs's own documented fix contract (script header, lines 9-20). Read docs/how-to/write-verify-for-a-skill-prose-change.md first (same SKILL.md-path trigger as the sibling child above) -- same checker-assertion-as-POSITIVE/NEGATIVE reasoning applies, no mirror-sync step needed here since these files have no .agents/skills source to keep in lockstep with. Footprint is the exact 33-file list, disjoint by construction from the sibling child's 14-name mirror-pair footprint above (verified: zero shared literal path strings, RESEARCH.md round 1) -- never widen it back to the bare plugins/fgOS/skills directory string, which would collide with that child's own footprint entries under footprintOverlapAmong's exact-path-match check (src/state/graph-metrics.mjs:599-623).",
    "footprint": ["plugins/fgOS/skills/answer/SKILL.md", "plugins/fgOS/skills/approve/SKILL.md", "plugins/fgOS/skills/ask/SKILL.md", "plugins/fgOS/skills/check/SKILL.md", "plugins/fgOS/skills/cleanup-loop/SKILL.md", "plugins/fgOS/skills/cleanup-next/SKILL.md", "plugins/fgOS/skills/conflicts/SKILL.md", "plugins/fgOS/skills/cook/SKILL.md", "plugins/fgOS/skills/discover/SKILL.md", "plugins/fgOS/skills/discover-loop/SKILL.md", "plugins/fgOS/skills/discover-next/SKILL.md", "plugins/fgOS/skills/goal/SKILL.md", "plugins/fgOS/skills/graph/SKILL.md", "plugins/fgOS/skills/list/SKILL.md", "plugins/fgOS/skills/merge-list/SKILL.md", "plugins/fgOS/skills/merge-loop/SKILL.md", "plugins/fgOS/skills/merge-next/SKILL.md", "plugins/fgOS/skills/move/SKILL.md", "plugins/fgOS/skills/pick/SKILL.md", "plugins/fgOS/skills/plan/SKILL.md", "plugins/fgOS/skills/plan-loop/SKILL.md", "plugins/fgOS/skills/plan-next/SKILL.md", "plugins/fgOS/skills/ready/SKILL.md", "plugins/fgOS/skills/retro-loop/SKILL.md", "plugins/fgOS/skills/retro-next/SKILL.md", "plugins/fgOS/skills/return/SKILL.md", "plugins/fgOS/skills/rollup/SKILL.md", "plugins/fgOS/skills/show/SKILL.md", "plugins/fgOS/skills/stale/SKILL.md", "plugins/fgOS/skills/submit/SKILL.md", "plugins/fgOS/skills/terminal/SKILL.md", "plugins/fgOS/skills/triage/SKILL.md", "plugins/fgOS/skills/unlock/SKILL.md"],
    "kind": "chore",
    "risk": "light"
  },
  {
    "title": "Fix citation-format findings in the remaining docs/*.md files",
    "verify": "node scripts/check-decision-citation-drift.mjs --decisions-dir docs/decisions --backlog docs/backlog.md --specs-dir docs/specs --skills-dir .agents/skills --skills-dir plugins/fgOS/skills --write-baseline && node -e \"const d=require('./scripts/check-decision-citation-drift.baseline.json'); const files=['docs/backlog.md','docs/specs/decision-citation-drift.md','docs/specs/distillery.md','docs/specs/distribution.md','docs/specs/enduser-docs-authoring.md','docs/specs/enduser-docs-index.md','docs/specs/herdr-web-dashboard.md','docs/specs/platform-foundations.md','docs/specs/reading-map.md','docs/specs/system-overview.md']; let total=0; for (const f of files){ total += (d[f]||[]).length; } if(total!==0){console.error('still',total,'findings across remaining docs files');process.exit(1);} console.log('remaining docs findings: 0');\"",
    "action": "Fix the 306 findings across docs/backlog.md and the 9 remaining docs/specs/*.md files (decision-citation-drift, distillery, distribution, enduser-docs-authoring, enduser-docs-index, herdr-web-dashboard, platform-foundations, reading-map, system-overview), per check-decision-citation-drift.mjs's own documented fix contract (script header, lines 9-20): add a one-line gloss after each bare ADR<n>/RUL<n> id, inline+delete each D-local id cited outside its home CONTEXT.md. Batched into one child since no single file here is large enough to warrant its own isolation the way work-state.md/runner.md do, and none of these 10 files overlap with any other child's footprint.",
    "footprint": ["docs/backlog.md", "docs/specs/decision-citation-drift.md", "docs/specs/distillery.md", "docs/specs/distribution.md", "docs/specs/enduser-docs-authoring.md", "docs/specs/enduser-docs-index.md", "docs/specs/herdr-web-dashboard.md", "docs/specs/platform-foundations.md", "docs/specs/reading-map.md", "docs/specs/system-overview.md"],
    "kind": "chore",
    "risk": "light"
  }
]
```

## Outstanding questions

None
