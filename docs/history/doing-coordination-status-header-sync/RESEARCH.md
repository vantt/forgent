# RESEARCH — tsk-1sl: cập nhật status header doing-coordination-redesign.md

Accumulating research log for tsk-1sl (discovery-stage premise verification).
Each round is its own dated section, appended, never overwritten.

## 2026-08-26 — Round 1: verify description's stated premises

**Asked:** Before judging clear/unclear at stage `discovery`, are the factual
premises the item description makes actually true? (Not the full §17
audit-sweep itself — that is the item's own execution-stage deliverable.)

**Checked and found:**

1. `docs/architect/doing-coordination-redesign.md:3` — read directly. Line 3
   reads exactly `Status: design target`. Confirmed as described.
2. Same doc — section headers listed via `grep -n "^## "`. `## 15. Acceptance
   Criteria` (docs/architect/doing-coordination-redesign.md:770) contains
   exactly 14 numbered items (lines 774-789). `## 17. Review Checklist`
   (docs/architect/doing-coordination-redesign.md:857) lists 8 literal grep
   patterns (lines 861-870) that collapse to the 6 distinct patterns named in
   the item description once single/double-quote variants of `to:` and
   `expectedStatus:` are merged — not a discrepancy, the doc lists both quote
   styles for grep robustness. Confirmed as described.
3. `fgos list --id tsk-40m --json --dir /home/vantt/projects/forgentX` —
   real state is `status: "delivered"`, `mergedInto: "main"`, `mergedSha:
   "401a2282ee381b5c2831e6f4d7538e834ada6503"`. Matches the description
   exactly.
4. `docs/history/runtime-claim-doing-separation/CONTEXT.md:1-9` — read
   directly. Carries a `> **SUPERSEDED (2026-08-25)**` banner at the top
   pointing readers to `docs/architect/doing-coordination-redesign.md`
   before implementing anything from the superseded file, and states D1-D6
   of the "Locked decisions" table still hold. Confirmed as described.
5. Code citations — all four exist at the stated locations:
   - `src/intake/plan.mjs:537` — `const releaseClaimOnExecuting = () => {};`
     with an adjacent comment citing tsk-40m D5 (retired to no-op).
   - `src/runner/anti-loop.mjs:65` — counts `event.type === 'work.attempt'`
     with `payload.phase === 'execute'`, replacing the old
     `work.move->doing` count per the adjacent comment.
   - `src/runner/claim-liveness.mjs` — exists (5385 bytes).
   - `src/state/runtime-coordination.mjs` — exists (12128 bytes).

**What remains open:** the item's own §17 audit sweep (grep the 6 patterns
across all of `src/`, classify every hit into one of the 5 buckets) and the
full evidence-backed pass/fail check against all 14 `## 15. Acceptance
Criteria` items have NOT been run by this research round — that sweep is the
item's own execution-stage deliverable (steps 1-2 of "Việc cần làm"), not a
discovery-stage ambiguity to resolve here. No premise checked above came back
false or contradicted; no gap in the item's own framing was found.

**Verdict:** `clear` — verify: re-run the §17 grep sweep on `src/` for the 6
listed patterns and cross-check the 14-item `## 15. Acceptance Criteria`
list, then confirm the resulting classification/pass-fail table is fully
resolved (no unclassified hit, no unverified criterion) before editing the
doc's status header.
