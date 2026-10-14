# Review: lane guard (feat/rununit-guard, 357c01288 + 674468fdd)

Reviewer: independent code-reviewer (not the author). Scope: phase-11 Requirements 1-5 plus design r3 sections 3 and 5. G-M2 is out of scope.

## Verification run

- Focused tests, run with `env -u CLAUDE_CODE_SESSION_ID node --test`, all exit 0: `test/architecture.test.mjs`, `test/runner/assignment-policy.test.mjs`, `test/runner/assignment-provenance.test.mjs`, `test/runner/dispatch-confinement-authority.test.mjs`, `test/runner/operation-choice.test.mjs`, `test/state/work-size-rigor.test.mjs`, `test/runner/dispatch.test.mjs` (333/333).
- Missed callers: `rg` over `src bin scripts domains core` found no remaining caller that passes `work`/`workItem`/`workExecutorId` into `buildAssignment`, `compileDispatchPlan`, `decideExecutorCli`, `executeExecutorCli`, `executeAssignment` or `resolveAssignmentDispatchPolicy`. `bin/fgos.mjs:2602` passes `resolveWork: resolveWorkForDispatch`, which now returns the hint. `scripts/dispatch-decide-hook.mjs:52` and the agy branch at `bin/fgos.mjs:4799` use `--for` only. `fanout-batch.mjs:75` uses `workDispatchHint`.

## Parity checks (no regression found)

- **Rigor monotonicity for `decide --work` and fan-out.** On main the policy read `work.rigor`, or `work.risk === 'heavy'` read as high, after the synthetic opPolicy. Now `workRigorFor(work)`, called with no opPolicy, gives the same value, and `assignment.rigor` goes through the same branch: "default selects, otherwise raise". The results match for rigor/no-rigor and heavy/non-heavy. The capability floor and CLI rigor come after it and are unchanged.
- **Real execution path.** `run.mjs:577` still carries the unit's rigor as `policy.rigor` (opPolicy), not as `assignment.rigor`. No production path sets top-level `assignment.rigor`, so execution rigor does not change.
- **Executor resolution for `decide --work`.** `workExecutorId = executorIdForWork(work, stage) ?? null`, the same as `resolved.executorId ?? null` on main. The agentType field reaches `resolveExecutorConfig` unchanged, and it only affects governance.
- **Removed `!work &&` in `executeExecutorCli` (cli.mjs:521) and the `openRunnerRun` id.** On main, `opts.work` reached `executeExecutorCli` only from tests: `run.mjs` never passed `work` to `executeAssignment` (checked with `git grep` on main). Production behaviour is unchanged. The only test that relied on the tolerance (`dispatch-confinement-authority.test.mjs:531`) was switched to a registered `agy-cli` with `allowCrossProvider: true`. It still asserts `err.capability === 'code:implement'`, so the assertion was not weakened.
- **Harness seam.** On main, no production caller ever passed `work` into an inline `buildAssignment`. The only one is `cli.mjs:1203`, the probe-account path, and it passes no Work. So the seam was unreachable in production before and still is after (see M1). `domainHarnessFor` limits the domain name to `DOMAINS` keys, and traversal is tested.

## High

None.

## Medium

### M1 — The spec and CHANGELOG say the Work layer hands the harness to dispatch, but no production code does

- Where: `src/runner/work-dispatch.mjs:295-321` (`loadHarnessModule`, `domainHarnessFor`), `CHANGELOG.md` ("A domain's contract harness ... is loaded by the Work layer and handed to dispatch"), and `docs/specs/runner.md` decision 0063 point 4.
- Evidence: `rg -n "domainHarnessFor|domainHarness" src bin scripts` finds only the definition, plus the `options.domainHarness` read at `assignment.mjs:487`. The only callers are in `test/runner/assignment-provenance.test.mjs`.
- Failure scenario: a maintainer reads 0063 or the CHANGELOG and assumes inline Work contracts are enriched and validated by the domain harness, including the ADR-007 §3 `contract.supports` legality check. They are not, on any production path. The `contract.supports` check is the trust-boundary piece here. The behaviour is the same as on main, but the docs now claim a live wiring that does not exist, and `src/` ships two exported functions that only tests use.
- Fix: pick one.
  - (a) State plainly in 0063 and the CHANGELOG that the seam has no production caller today ("available to a Work-layer inline caller; none exists"), and drop the CHANGELOG line, because users see no change.
  - (b) Wire it into the real inline Work caller, if one is planned.
  - Do not leave the claim as written.

### M2 — The dynamic-load allowlist works per file, so it hides any new computed load in that file

- Where: `test/architecture.test.mjs`, `DYNAMIC_LOAD_ALLOWLIST` and the guard loop (`if (Object.hasOwn(DYNAMIC_LOAD_ALLOWLIST, file)) allowedSeen.add(file); else violations.push(...hits)`).
- Failure scenario: someone adds `const load = createRequire(import.meta.url); load(name)`, or a `require(spec)` with a computed `spec`, to `src/runner/dispatch/provider-credential-renewal.mjs`. The guard stays green, because every hit in an allowlisted file is discarded. The lead asked for a *named* allowlist. This one names the file, not the load.
- Fix: pin the exact expected hits for the allowlisted file, for example `{ file: [':27 imports node:module', ':38: createRequire'] }` (or the hit strings without line numbers), and assert `deepEqual(hits, expected)`. Any extra hit then fails. The existing `require('node:sqlite')` at line 63 is a literal and is not a hit, so the pinned set is small.

### M3 — `assignment.domain` now reaches the capability floor for every declared assignment, including old ones on disk, but 0063's "Giới hạn đã biết" says otherwise

- Where: `src/runner/dispatch/assignment-policy.mjs:277-279`, and the 0063 sentence "Assignment cũ trên đĩa không có `rigor`/`domain` ở cấp ngoài thì chạy lại với rigor từ policy/capability như trước".
- Evidence: `buildDeclaredAssignment` always stamps top-level `domain` (`assignment.mjs:340-342` requires it, and `declaredOperationFields` returns it). `run.mjs:536` also puts `domain` on the operation-carrying seat.
- Failure scenario: a declared assignment persisted before this change gets reconciled or resumed in a repo whose config has a `coding:review` (or `marketing:review`) capability with `rigor`. A non-work-product operation without `policy.capability` now derives `coding:review` instead of `review`, and gets that floor. This only raises rigor, so it does not violate monotonicity. The default registry has neither `coding:review` nor `marketing:review` (only `code:review`, and `code` is not a domain), so the effect is opt-in. But the spec's description of old data is wrong: old declared assignments do carry `domain` and do change.
- Fix: correct the sentence. Old declared assignments always carry `domain`, so a configured `<domain>:review` rigor now applies to them too (raise only). Keep the CHANGELOG line, which is accurate.

## Low

### L1 — Rigor provenance does not follow the approved design

- `assignment-policy.mjs:270` stamps `{ scope: 'assignment', id: assignmentId ?? workId ?? null }`. Design r3 §5 says `{scope:'work-hint'}`.
- No production code reads `provenance.rigor.source.scope` (`rg` finds 0 outside tests), so nothing breaks.
- RUL95 documents `assignment`, so the spec matches the code but not the design. Note the deviation in the lane report, or align it.

### L2 — The hint omits fields the design listed

- Design §5 lists `{ workExecutorId, agentType, rigor, domain, capabilityHints, stage }`. `workDispatchHint` returns only `{workExecutorId, agentType, rigor?, domain?}`.
- The decide path never used `capabilityHints` or `stage`, so this does not regress anything. It is a design deviation; mention it in the lane report.

### L3 — Malformed rigor on an old item now fails the whole `decide --work` call

- `workDispatchHint`, through `workRigorFor`, throws `RunnerConfigError` on an invalid `work.rigor`.
- On main, the same invalid value threw inside `resolveAssignmentDispatchPolicy`, inside the synthetic-assignment `try` at `plan.mjs:427-440`, and decide degraded (policy fields null) instead of failing.
- `work.mjs:390` validates rigor only on touch, so an old item with a bad value is possible. In fan-out, `Promise.allSettled` turns it into `fired` with `execution-failure`, even though nothing ran.
- Fix: accept fail-closed (arguably better) and mention it, or catch it in `resolveWorkForDispatch`/fan-out and report `unavailable` with a reason.

### L4 — A resolver that returns the old shape is misrouted silently instead of being refused

- `cli.mjs:1042` builds `workHint = { ...resolved, workExecutorId: resolved.workExecutorId ?? null }`, and the old `!resolved?.workItem` check became `!resolved`.
- A `resolveWork` that still returns `{workItem, executorId}`, or `{}`, gets `workExecutorId: null` and a default-executor decision.
- `refuseWorkItemInput` checks only top-level option keys, not the hint.
- Fix: call `refuseWorkItemInput(resolved, 'resolveWork result')` and require `Object.hasOwn(resolved, 'workExecutorId')`.

### L5 — The dynamic-load guard misses some code-loading primitives

- `findDynamicLoads` misses:
  - `Function('...')` without `new` (only `new\s+Function` matches);
  - `globalThis['eval']` (the quoted key is stripped);
  - `node:vm` (`vm.runInThisContext`), whose literal import passes;
  - `new Worker(computedPath)` from `worker_threads`.
- None of these exist in the guarded set today.
- Fix: add `Function\s*\(` and treat `vm`/`node:vm`/`worker_threads` imports like `node:module`. Also add 0063's "Giới hạn đã biết" to the list.

### L6 — Dangling evidence link

- 0063 cites `plans/261014-1400-two-doors-one-rununit/reports/lane-guard-*.md`, which does not exist in the reports directory.
- Write it before the gate, or fix the reference.

### L7 — The agentType test does not compare against the behaviour before the change

- `dispatch.test.mjs`, "decide --work: an item with its own agentType ...". The test injects `agentType` through a wrapped resolver and asserts `own == plain`. That is self-consistency, not "the same as before".
- It does not go through the real store field either; the last line checks `workDispatchHint` separately.
- It is acceptable as the red-team #4 check, because main also used agentType only for governance. Add a governance-affecting case (an executor whose agentType changes `providerFamily`) if that path matters.

## Guard false positives / negatives (summary)

- `findWorkShapedInputs` catches every red-team #1 form except runtime-computed keys and string concatenation (`opts['wo'+'rk']`, `k='work'; opts[k]`). 0063 documents that limit. It flags any identifier named `work` in `src/workflow/**`, which is deliberate and strict, and green today.
- Re-export through a file outside the guarded set: covered by the existing transitive import guard, not by this one.

## Plan follow-ups (Requirements 1-5)

- R1: done. No Work parameter is left in `dispatch/**`.
- R2: done. The hint comes from `resolveWorkForDispatch`, and `workDispatchContext` no longer returns `work`. `bin` needed no change because it passes the Work-layer function.
- R3: done, with M2 and L5 as hardening.
- R4: done. Absolute equality plus a reverse check that every named caller still calls.
- R5: mostly done. Fix M1, M3 and L6 in the text. Per the lead, `docs/decisions/index.md` is deliberately not updated.

## Unresolved questions

- Is an inline Work caller planned that would make `domainHarnessFor` live? If not, should the seam export stay in `src/` at all (YAGNI)?

Status: DONE_WITH_CONCERNS
Summary: No High-severity or behavioural regression: rigor monotonicity, `decide --work` executor resolution and the removed `!work` branch are at parity with main, and no caller still passes Work into dispatch. Three Medium items need text or guard fixes before the gate: the spec and CHANGELOG claim harness wiring that no production code does, the dynamic-load allowlist is per file, and the spec's statement about old on-disk assignments and `domain` is wrong.
