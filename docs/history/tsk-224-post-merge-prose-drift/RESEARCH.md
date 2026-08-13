# RESEARCH.md — tsk-2tk

## Round 1 — 2026-08-13 (fgos-researching, stage discovery)

**Goal:** confirm the 5+3 spots listed in tsk-2tk's description are complete/accurate, propose a verify command, and re-check risk/tier/kind classification.

**Q1 — is the 8-spot list complete?**

Checked: `grep -rln "planApprove\|canAutoApproveValidate" --include="*.md" --include="*.mjs" src bin docs plugins .claude .agents test`, excluding `docs/history/**` (archival by convention).

Found 6 additional files beyond the 8 named in the description:
- `docs/reference/recordgateapprove-contract.md:15,20,66` — describes `GATE_APPROVE_GATES = new Set([...,'planApprove',...])` as it actually still exists in `src/state/store.mjs:818` (kept intentionally for backward-compat replay of historical records, confirmed by the parent cook session's own investigation). Accurate, current. Not drift.
- `docs/explanation/why-decomposes-skip-and-advance-is-narrower-than-discoverys.md`, `events-jsonl-lost-update-race-under-concurrent-session-writes.md`, `why-gate-approval-was-separated-from-move-next.md`, `why-fgos-add-defaulted-new-items-to-stage-executing-with-no-way-back.md`, `discovery-decompose-reporoot-verify-overwrite.md` — all narrate a **specific past incident/decision** using `planApprove` as it existed at that incident's own time. Historical narration, correctly scoped to their own narrative's timeframe — not a live-architecture claim. Not drift.

**Verdict Q1: the original 8-spot list is complete.** No further file needs touching.

**Q2 — verify command**

Ran `node --test test/skills/fgos-mirror.test.mjs test/cli/command-registry.test.mjs` from a clean worktree (`fgw/tsk-2tk`, base `4ab01ec`): 10/10 pass, 0 fail (mirror tests across all 3 roots + registry drift guards).

Real verify: `node --test test/skills/fgos-mirror.test.mjs test/cli/command-registry.test.mjs`, plus a full `npm test` pass before `fgos return` (parent cook session's baseline on main: 3148 pass/0 fail/5 skip at c0cedaa — this item must not regress that).

**Q3 — risk/tier/kind**

Auto-classified `risk: heavy, tier: heavy, kind: bug` at submit time (likely a `HEAVY_KEYWORDS` substring hit from the description's own vocabulary — "logic", "schema", multiple file paths — not from actual change weight). Real change is prose/comment-only across 8 files, 0 lines of executable logic touched; touching 3 mirrored skill roots is mechanical sync, not independent judgment. This matches `standard` risk, not `heavy` — `heavy` in this repo's vocabulary is reserved for changes with real behavioral/schema/hot-path weight, none of which apply here. `kind: bug` is correct (real prose defect, not a chore/task).

**Clear.** Reclassify risk/tier heavy → standard, kind stays bug. Verify: `node --test test/skills/fgos-mirror.test.mjs test/cli/command-registry.test.mjs`.
