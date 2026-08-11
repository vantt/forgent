# Plan — generalize judge-executor.mjs's retry-then-escalate pattern

Item: `tsk-418`. Decisions: `docs/history/agent-executor-retry-escalate-helper/CONTEXT.md` (D1-D4).

## Mode

Flags counted against the mechanical gate:

- **external systems / external provider** (hard-gate) — the whole point of
  escalation is falling back to a *different* executor/backend/provider
  (D2), and D4 already found this branch is missing the capacity-dispatch
  schema (`cfg.capacities`) that the fallback target lives on.
- **existing covered behavior** — `judge-executor.mjs`'s extraction must
  stay byte-identical for its two existing callers (`discovery.mjs`,
  `decompose.mjs`), which real tests (`test/intake/judge-executor.test.mjs`,
  `discovery.test.mjs`, `decompose.test.mjs`) already pin.
- **public contracts** — `runJudgeExecutor`/`JUDGE_STRICT_JSON_SUFFIX` are
  exported and consumed by two call sites; the extraction's new shape must
  keep both working.

One hard-gate flag (external provider) alone forces **high-risk** per the
mode gate's own rule, independent of the count. `plan.md` below is shaped
accordingly: full risk map, explicit split, and a proof point per risk.

## Approach

**Chosen path**: two-piece split (below), sequenced so the risk-free
mechanical piece (extraction) lands first and the schema/escalation piece
(which needs D4's branch integration) lands second, independently
verifiable from the first.

**Rejected alternative**: doing extraction and escalation in one pass.
Rejected because the two pieces have genuinely different risk profiles
(mechanical refactor vs. new external-dispatch capability touching a
schema this branch doesn't have yet) and different prerequisites (piece 2
needs D4's merge; piece 1 doesn't) — bundling them would gate the
zero-risk refactor behind the high-risk integration work for no reason.

`fgos graph --json` was checked: `tsk-418` sits outside both `criticalPath`
and `topUnblock` today (no other item currently declares
`depends: [tsk-418]`), so no cross-item ordering constraint applies beyond
this item's own two pieces — the split below is ordered purely by each
piece's own prerequisites, not by graph unblock pressure.

Impact-analysis gate: `fgos tool query --capability impact-analysis
--status present` → `gitnexus`, `status: present` → posture **full**. Both
pieces' proof points below that lean on blast-radius evidence keep GitNexus
`impact()` as a required step, not weakened to "informational only."

### Risk map

| Component | How risky | What proves it |
|---|---|---|
| `runJudgeExecutor` extraction shape (piece 1) | Low — pure refactor, same file, same two callers, existing tests already pin exact retry/parse/suffix behavior | `node --test test/intake/judge-executor.test.mjs test/intake/discovery.test.mjs test/intake/plan.test.mjs` all green, no test edits needed for the zero-behavior-change claim to hold |
| `cfg.capacities.<id>` escalation field + branch integration (piece 2) | High (hard-gate: external provider) — depends on merging `tsk-62v`'s commit (`1f1788a`) that this branch doesn't have; wrong precedence could silently route real dispatches to an unintended backend | `git merge-base --is-ancestor 1f1788a HEAD` true after integration; new unit test asserting `resolveExecutorConfig` precedence still holds `capacities.<id>` > `executors.<tier>` > `executor` with the new escalation field present but inert when unset |
| Escalation trigger uniformity (D1) | Medium — must fire on both the parse-exhausted path and the immediate spawn-error/timeout/non-zero-exit path without reintroducing a retry loop for the latter | Unit tests: a spawn-error mock and a parse-garbage mock both reach the fallback attempt when one is configured; both return the original `null` behavior when none is configured |
| Non-judge consumer proof (D3, test double) | Low — explicitly scoped to a test double, not real `tsk-5l2` wiring | A test double capacity in the new test file calls the shared helper directly and demonstrates a configured fallback firing |
| GitNexus impact posture on `judge-executor.mjs`'s callers | Low (posture: full) | `impact()` run before touching `resolveExecutorConfig`/`resolveExecutorCommand`/`spawnWorker`/`runJudgeExecutor` per AGENTS.md's gate, risk level reported in the return report |

### Files likely touched

- `src/intake/judge-executor.mjs` — extract + generalize (piece 1), add
  escalation param (piece 2).
- `src/intake/discovery.mjs`, `src/intake/plan.mjs` — call sites,
  touched only if the extracted signature needs a shape change (expected:
  no change, per zero-behavior-change).
- `src/runner/dispatch.mjs` — `cfg.capacities.<id>` schema gains the new
  escalation field once D4's merge lands (piece 2 only).
- `.fgos-runner.json` — no change required for existing behavior (additive
  field); a test-double capacity entry may be added under `test/` fixtures
  instead of the real committed config.
- `test/intake/judge-executor.test.mjs` (extend), plus a new test file for
  the escalation path and the non-judge test-double proof (piece 2).

### Order

1. Piece 1 (extraction) — no prerequisite, start immediately.
2. D4's branch integration (merge `1f1788a` / `fgw/tsk-62v`'s commit into
   `fgw/tsk-418`) — prerequisite for piece 2, done once, not itself a
   separate work item (it is repo-integration mechanics, not product
   work — CONTEXT.md's Deferred section already flagged the *mechanics*
   choice, still open, as fgos-coding-validating's to prove safe).
3. Piece 2 (escalation + schema field + test-double proof) — after 2.

## Split

Two child items, both `parent: tsk-418`:

1. **Title**: "Extract judge-executor.mjs's retry-on-malformed-output shape into a reusable, capacity-agnostic helper"
   **Verify**: `node --test test/intake/judge-executor.test.mjs test/intake/discovery.test.mjs test/intake/plan.test.mjs`
   Scope: pure extraction/generalization per CONTEXT.md's feature boundary
   point 1 — no escalation logic yet, no schema change, zero behavior
   change for judge callers.

2. **Title**: "Add opt-in escalation-to-fallback-capacity step to the retry helper, proven via a test-double capacity"
   **Verify**: `node --test test/intake/judge-executor.test.mjs`
   (extended with the new escalation-path tests written as part of this
   piece; the exact new test file name is this piece's own
   implementation detail, not fixed here)
   Scope: D1/D2/D3/D4 — uniform null-triggered escalation, per-capacity
   opt-in schema field (exact name decided during this piece per
   CONTEXT.md's Deferred section), branch integration with `tsk-62v`'s
   commit, and the test-double proof point. Depends on `tsk-62v` (already
   declared on the parent) plus the branch-integration step in Order
   above.

## Assumptions

- The fallback attempt (once escalation fires) is single-shot, not its own
  bounded retry loop — CONTEXT.md's "escalate" pinned term leaves this open
  as low-materiality; pinned here as an assumption for
  `fgos-coding-validating` to flag as unproven if it turns out to matter.
- D4's branch integration is a merge of `tsk-62v`'s commit (`1f1788a`)
  directly into `fgw/tsk-418`, mirroring `fgw/tsk-5l2`/`fgw/tsk-g18` —
  assumed safe because those two sibling branches already did the
  identical merge without reported conflict; `fgos-coding-validating` should
  confirm no conflict actually arises on this branch specifically before
  treating it as proven.
