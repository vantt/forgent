# Lifecycle Sync Exercise: Three Silent Gate Failures, All Triggered by Walking Real Items End-to-End

**Date**: 2026-07-28 22:45  
**Severity**: Critical (all three fix release-blocking gates)  
**Component**: fgOS lifecycle gates, `judgeDecompose`, `claim-port.mjs`, `src/intake/plan.mjs`  
**Status**: Resolved (merged to main, 525eae8)

## What Happened

After landing the real code fixes for tsk-1an and tsk-3w8 (previous sessions), this session attempted to sync fgOS's own work-item state to match reality: both items were code-done and merged, but fgOS still showed them at `todo`/`proposed`. Walking them through the discovery/decompose/gates workflow by hand to advance their state surfaced three latent bugs that had *never been triggered before* because these code paths had never been driven end-to-end outside test fixtures.

1. **`claim-port.mjs` never passed `ttlMs` to `acquireMainCheckoutLock`** (commit de852ff)  
   Once the D5 hook was wired live on this actual repo, the next `take`/`pick` after any `git commit` read the lock identity as permanently AMBIGUOUS — the fail-closed default when no TTL is specified. This is a complete deadlock: the gate can never release, so no work can be claimed. Hit it live mid-session while trying to commit lifecycle changes.

2. **`judgeDecompose` never consulted `view.gates[id]`** (commit e86bcb0, part 1)  
   Unlike `discovery.mjs`'s working `buildDiscoveryPrompt`, the decompose version silently ignored prior human answers recorded in `view.gates[id]`. A human answering a parked decompose-stage `need-human` verdict via `fgos answer` never changed the next judgment — re-running `discover` asked the byte-identical question every time (confirmed via identical `data_hash` across 3 separate calls on tsk-3w8). Modeled the fix exactly on the proven discovery pattern, including matching test suite.

3. **D3(b) heavy-risk gate fired unconditionally, permanently** (commit e86bcb0, part 2)  
   The `work.risk === 'heavy'` check in `resolveDecompose` executed regardless of the model's own verdict or any human answer on record. Completely separate from bug #2 — this gate runs before/independent of the LLM. A risk-heavy root could never actually release through this path at all. Fixed by only bypassing the gate when the MOST RECENT gate answer's reason matches `DEFAULT_RISK_GATE_REASON` exactly — never a stale answer left over from an unrelated `clarify`-stage question.

## The Brutal Truth

This is enraging. The entire decompose/gates machinery exists to handle human feedback and move items through the FSM. But the pathway where a human answers a parked gate and that answer *actually changes the next judgment* had been thoroughly tested in `discovery.mjs` and was completely broken in `decompose.mjs` — the code just never had to prove it worked end-to-end before. Same with the heavy-risk gate — it was a complete release deadlock that nobody discovered because nobody had tried to actually release a risk-heavy item through this path in production.

The claim-port TTL bug is even more direct: the code to pass it existed, the test fixtures for it existed, but the actual call site was the wrong one and had zero passing tests exercising it live against a real worktree-lock scenario with a real git hook.

Also hit two pre-existing flaky tests that burned cycles before being correctly ID'd as pre-existing (events.test.mjs concurrent-process test, dispatch.test.mjs maxBuffer test — both pass in isolation, both already tracked as tsk-3ld). And discovered a self-inflicted verify bug: tsk-3w8's verify command grepped for `main-checkout-hook-wired` in `bin/fgos.mjs`, but that string actually lives in `src/setup/checks.mjs` — a copy-paste error in the command itself.

## Technical Details

**Bug #1 — TTL deadlock (de852ff):**
- `claim-port.mjs`'s `claimWork` called `acquireMainCheckoutLock(repoRoot, lockId)` with no TTL argument.
- D5's fail-closed logic: if no TTL, the lock read as permanently AMBIGUOUS (per spec, not a bug in D5).
- Fixed by moving `DEFAULT_TTL_MS = 30_000` into `main-checkout-lock.mjs` and passing it explicitly: `acquireMainCheckoutLock(repoRoot, lockId, DEFAULT_TTL_MS)`.

**Bug #2 — Gate answer never consulted (e86bcb0, part 1):**
- `judgeDecompose` called `buildDecomposePrompt(model, work)` with no `view` argument.
- `buildDiscoveryPrompt` already had the pattern: thread `view` through, pass `view.gates[id]` to the prompt builder.
- Fixed by adding `view` parameter to `buildDecomposePrompt`, matching discovery exactly, and wrote matching test suite (`test/intake/plan.test.mjs` with gate-answer/prior-verdict regression).

**Bug #3 — Heavy-risk gate unconditional (e86bcb0, part 2):**
- `resolveDecompose`'s check `if (work.risk === 'heavy') { throw D3_GATE_ERROR }` was unconditional.
- WRONG: a human could answer the D3(b) gate (recorded in `view.gates`), but the next call would still throw without ever checking the answer.
- Fixed by consulting the most recent gate ask: `const lastGateAsk = view.gates[D3_GATE_ID]?.lastAsked; if (work.risk === 'heavy' && !(lastGateAsk && lastGateAsk.reason === DEFAULT_RISK_GATE_REASON)) { throw }` — only bypass if THIS gate's own most recent ask is on record, never a stale answer from a different gate.

**Verification:** Tests that were red against pre-fix code, green against fix. Full `npm test`: 1533/1538 pass, 0 fail, 5 pre-existing skips.

## Root Cause Analysis

All three bugs share the same root: code paths that exist and are tested in isolation, but were never exercised end-to-end with real user input in the actual workflow they're meant to support.

- **Bug #1**: The TTL-passing code existed. The test fixtures for TTL existed. But the live call site was never tested against a real worktree-lock hook in a real repo.
- **Bugs #2 & #3**: The gate-consultation pattern was fully proven in `discovery.mjs`. The decompose version was written from scratch without copying that pattern, and gate-advancing workflows were never exercised live outside test mocks.

None of these are obscure edge cases. They're core to the feature: claiming work after a hook is wired, human answering a decompose-stage gate, releasing a high-risk item. They just were never driven all the way through with real data before.

## Lessons Learned

1. **Gate machinery must be tested end-to-end with human feedback loops, not just in isolation.** When a feature involves "human answers question, next run changes behavior as a result," that round-trip must pass through the full workflow (answer → save → retrieve → act) at least once with a real test item. Test fixtures alone are insufficient.

2. **Copy proven patterns wholesale, don't rewrite them.** The discovery-stage gate pattern was correct and tested. Decompose should have imported/reused that code, not reimplemented it. When you find yourself writing "the same logic but for a different stage," stop and refactor to the shared path.

3. **Live dogfood beats all review.** None of these bugs would have surfaced in code review. They only surfaced because an actual agent tried to use the mechanism as designed on real items. Reserve time in every session for end-to-end walkthrough of the actual user journey, not just test matrices.

4. **Permanent gates need a release path.** D3(b) was designed as a stop condition with no documented way out. If a gate can fire, it must either (a) have a bypass condition, or (b) have an explicit "this item will never pass" path. A gate that can silently trap items forever is a bug, not a feature.

## Next Steps

- [x] Merged to main (525eae8); all tests passing.
- [x] fgOS state for tsk-1an + 4 children and tsk-3w8 advanced to `done`/`compound-learn`, matching reality.
- [ ] Add to platform-foundations or ADR: "End-to-end gate workflows (human answer → state change) must be exercised live, not just in test fixtures. When in doubt, walk it through by hand with real items."
- [ ] tsk-3ld (flaky tests) remains open; both tests pass in isolation, both flake intermittently in full suite. Not addressed in this session.

---

**For the next developer working on gates or decompose machinery:**  
If you add a new gate or change how gates are answered, verify that a human answer to that gate actually changes the next judgment by walking a real item through the full cycle: `discover` → `answer` → `discover` again → `decompose` → check state. Do not trust the test matrix to catch behavioral breaks in gate feedback loops. The feedback loops are the only thing that matter; everything else is just condition-checking.
