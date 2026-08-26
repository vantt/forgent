# plan.md — tsk-1sl: sync doing-coordination-redesign.md status header

Mode: tiny

Flag count: 0/10 (auth, authorization, data model, audit/security, external
systems, public contracts, cross-platform, existing covered behavior, weak
proof around the area, multi-domain — none apply: this is a docs-only status
header correction, gated on an audit sweep that must not touch code in this
item per the item's own "Việc cần làm" step 5). 0–1 flags → tiny/small per
`fgos-routing`'s Mode gate; picked tiny over small because the footprint is a
couple of files and one direct, non-branching task once the audit resolves.

No `CONTEXT.md` exists for this item — discovery verdict was `clear`
(RESEARCH.md round 1, same feature dir), which skips `exploring` by design.
This plan is written directly from the item's own description plus that
research round, per `fgos-coding-planning`'s direct-entry Bootstrap fallback.

## Approach

`fgos graph --json` reports this item's own component as size 1 (no other
work item shares or blocks it) — no ordering decision needed, there is only
one piece.

Chosen path: run the item's own described audit sweep exactly as specified
(no alternative considered — the item's "Việc cần làm" already names the
exact 6 grep patterns from `docs/architect/doing-coordination-redesign.md`'s
own §17 Review Checklist and the 14-item §15 Acceptance Criteria list; there
is no smaller honest version of "confirm nothing is left unclassified before
flipping a status label"), then take exactly one of two branches:

- **Clean** (every §17 hit classified into one of the 5 buckets, all 14 §15
  criteria pass with cited evidence): edit line 3 of the doc from `Status:
  design target` to a status reflecting reality, citing tsk-40m's
  `mergedSha 401a2282ee381b5c2831e6f4d7538e834ada6503` (already confirmed
  real in RESEARCH.md round 1), and add the two-way cross-reference between
  this doc and `docs/history/runtime-claim-doing-separation/CONTEXT.md`
  (whose SUPERSEDED banner is already confirmed correct and needs no edit).
- **Gap found** (an unclassifiable §17 hit, or a failing §15 criterion): do
  NOT edit the status header and do NOT touch any code in this item — per
  the item's own explicit instruction, record the finding and submit a
  separate child item to track the gap.

Risk map:

| Component | How risky | What would prove it |
|---|---|---|
| Doc line 3 edit | light — one line, reversible, no code touched | The diff shows exactly the header line + the cross-reference addition changed, `git diff --stat` on nothing else |
| Audit-sweep completeness | the only real risk: missing a hit or misclassifying one | Every one of the 8 literal grep occurrences (6 distinct patterns once quote variants merge, confirmed in RESEARCH.md round 1) has a named classification bucket in the return report; every one of the 14 §15 criteria has a cited pass/fail line |

No proof point needed beyond the verify command below — this is `light`/
`standard` risk (tier synced to `standard` at discovery, not `heavy`), not a
hard-gate flag (no auth/data-loss/audit-security/external-provider/
validation-removal in play).

Impact-analysis posture: not invoked — this item touches no code (the
gap-found branch explicitly forbids code edits within this item's own
scope), so no blast-radius evidence is needed for the doc-only branch.

## Shape

Single piece, no split (see Step 4 below). Concrete cases to prove against,
scaled to `tiny`:

- All 8 literal §17 grep occurrences (6 distinct patterns) get a
  classification bucket — no hit silently dropped.
- All 14 §15 Acceptance Criteria get an explicit pass/fail line with a
  citation (`file:line` or a named test) — no criterion silently skipped.
- The gap-found branch is exercised honestly: if step 1-2 surfaces even one
  unclassified hit or one failing criterion, the header must NOT be edited
  in this item, and a child item must be submitted for the gap instead of
  silently absorbing it into this item's own scope.
- Doc content outside the header + cross-reference stays byte-identical
  (per the item's own Acceptance criteria) — no drive-by edits to the rest
  of the doc's technical content.

## Split decision (Step 4)

No split. This is one honest, indivisible piece: the audit sweep and the
conditional header edit are the same unit of work (the edit's correctness
depends entirely on the sweep's outcome — splitting them would leave a
child item whose own "proof" is just trusting the parent's sweep result
instead of re-deriving it).

## Verify (synced to `work.verify`, see fgos edit below)

```bash
rg -n "to: \"doing\"|to:'doing'|expectedStatus: \"doing\"|expectedStatus:'doing'|awaiting-human -> doing|status === \"doing\"|statusCategory === \"doing\"|releaseClaimOnExecuting" src/
```

Runs the exact §17 sweep. The implementer classifies every hit into one of
the 5 buckets §17 names, cross-checks the 14 `## 15. Acceptance Criteria`
items against real evidence, and only then takes the clean-branch or
gap-found branch above. This is a docs-audit task — per the item's own
Verify note, no fresh test-suite run is required unless the gap-found branch
is taken and a separate child item with its own verify is spun off (out of
this item's scope).

## Action / Footprint (synced to `work.action`/`work.footprint`, see fgos
edit below)

Action: run the §17 grep sweep and the §15 criteria cross-check per this
plan's Approach/Shape sections above; on a clean result, edit
`docs/architect/doing-coordination-redesign.md`'s line 3 status header and
add the two-way cross-reference; on any gap, leave the header untouched and
submit a child item for the gap instead.

Footprint: `docs/history/doing-coordination-status-header-sync/plan.md`,
`docs/architect/doing-coordination-redesign.md` (header line + optional
cross-reference addition only).

## Outstanding questions

None
