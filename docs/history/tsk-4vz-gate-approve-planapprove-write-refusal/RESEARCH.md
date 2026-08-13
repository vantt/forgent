# RESEARCH.md — tsk-4vz

## Round 1 — 2026-08-13 (fgos-researching, stage discovery)

**Goal:** confirm the item's own proposed fix (remove `'planApprove'` from
`GATE_APPROVE_GATES` in `src/state/store.mjs:818`) is safe, and find the
real blast radius before touching anything.

**Impact-analysis posture:** `fgos tool query --capability impact-analysis
--status present` → GitNexus registered and `present`. Repeated
`PostToolUse` warnings this session ("GitNexus index is stale, last
indexed: c0cedaa") mean the index predates many since-merged commits —
posture is **degraded**, not full; cross-checked with `grep` per
`CLAUDE.md`'s own gate instruction. `impact({target:
'recordGateApprove', direction: 'upstream'})` returned `impactedCount: 0,
epistemic: 'exact'` — confidently wrong. `grep -rn 'recordGateApprove'
src/ bin/` found the real caller: `bin/fgos.mjs:1964` (the `gate-approve`
CLI verb). Matches the known GitNexus-unreliability pattern the parent
cook session already flagged (tsk-fxp) — not re-investigated here, just
worked around with a direct grep cross-check as the gate instructs.

**Material finding that changes scope:** the item's own proposed fix
(remove `'planApprove'` from the Set at the storage layer) would break
real, legitimate test usage. `grep -rn planApprove test/` found
`recordGateApprove(..., gate: 'planApprove', ...)` called directly as a
**fixture helper** in 6+ places across `test/state/store.test.mjs:986`
and `test/intake/plan.test.mjs:1036,1084,1139,1189` — these tests
simulate a pre-`tsk-224` item that already carries a historical
`planApprove` record, to prove `plan.mjs`'s own `planApproveVerify`
fallback (found during the parent `tsk-2tk` audit) still reads it
correctly. Removing the value at the storage layer would make these
tests throw, since they use the low-level write API to seed state, not
to represent "a live skill creating a new record today."

**Revised fix: restrict at the CLI verb, not the storage layer.**
`bin/fgos.mjs`'s `case 'gate-approve':` handler (~line 1958) is the
actual user-facing surface a confused live session would hit (the
concrete risk the item names: "một phiên nhầm lẫn... vẫn gọi được `fgos
gate-approve --gate planApprove`"). Added a check there refusing
`gate === 'planApprove'` with a `StoreError('validation', ...)` before
`recordGateApprove` is ever called — leaves `GATE_APPROVE_GATES`/
`recordGateApprove` itself untouched, so `replay.mjs`'s unconditional
generic fold (confirmed no gate-name check exists there either) and every
existing test's fixture usage keep working byte-for-byte. Verified:
`node --test test/state/store.test.mjs test/intake/plan.test.mjs` — 138/138
pass unchanged after the fix (proves the storage layer really is
untouched).

## Verify / classification

New test `test/cli/fgos-gate-approve.test.mjs` (3 cases: rejects
`planApprove` at CLI, accepts `validateApprove`, accepts
`contextApprove`) — 3/3 pass. Real verify:
`node --test test/cli/fgos-gate-approve.test.mjs test/state/store.test.mjs
test/intake/plan.test.mjs` plus a full `npm test` before return.

Item auto-classified `risk: heavy, tier: heavy` at submit — likely a
`HEAVY_KEYWORDS` hit from the description's own vocabulary (mentions
"validation", possibly others). Real change: one CLI-layer guard clause +
one new test file, zero storage/schema/replay logic touched. Matches
`standard`, the same weight class as `tsk-2tk`/`tsk-3rg`.

**Clear.**
