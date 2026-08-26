# Research: fanout-batch dispatch decisions through compileDispatchPlan (tsk-4jo)

## Round 1 — 2026-08-26 (discovery)

**Asked:** Does `compileDispatchPlan` exist, what does it take/return, which
caller already uses it as "the same planner `decide` uses", what does
`fanoutBatchExecutorCli` currently reimplement, and what does
`test/runner/dispatch.test.mjs` already assert about `fanoutBatchExecutorCli`'s
output shape and governance handling.

**Checked:**
- `rg -- "compileDispatchPlan" src bin test --glob "*.{mjs,cjs,md}"`
- `src/runner/dispatch/plan.mjs` (full read)
- `src/runner/dispatch/cli.mjs:604-651` (`decideExecutorCli`, the `decide`
  verb's own call site) and `:652-792` (`fanoutBatchExecutorCli`, full body)
- `src/runner/dispatch/resolve.mjs:39-43` (`executorIdForWork`)
- `test/runner/dispatch.test.mjs:4791-4990` (every `fanoutBatchExecutorCli`
  test currently in the suite)

**Found:**

1. `compileDispatchPlan` exists at `src/runner/dispatch/plan.mjs:28`.
   Signature: `compileDispatchPlan(cfg, { executorId?, for?, work?, stage?,
   needsSoul?, hasLiveTaskAccess?, caller?, workItem? })`. Its `work` selector
   branch (`plan.mjs:77-100`) is the one relevant here: given `work` +
   `workItem`, it resolves `executorId = executorIdForWork(workItem, stage)`,
   checks `resolveExecutorAndOverrides(cfg, executorId).configured`, and if
   not configured returns `{ mechanism: <native-first fallback>, executorId,
   configured: false, ... }` early — otherwise falls through to the shared
   tail (`plan.mjs:138-250`) that computes `decideExecutorDispatchMechanism`,
   applies mcp-handback upgrade, and — the part `fanoutBatchExecutorCli` is
   currently missing entirely — for `mechanism === 'out-of-process'` actually
   calls `resolveExecutorConfig` (the same governance gate `execute` itself
   uses) and returns `mechanism: 'unavailable', blockedReason` when that
   throws (`plan.mjs:196-230`).

2. `decideExecutorCli` (`cli.mjs:604-651`, the `decide` verb) is the existing
   canonical caller: it builds `workItem` itself when only `work` was passed,
   then calls `compileDispatchPlan(cfg, { executorId, for, work, stage,
   needsSoul, hasLiveTaskAccess, caller, workItem })` once and reshapes the
   returned `plan` into its own CLI response (`mcpTool` / `agentType` /
   plain `{mechanism, configured}`, plus `executorId` when resolved
   indirectly). This is the exact call shape a per-candidate call inside the
   batch loop should mirror, adapted to `work: candidateId` +
   `workItem: workItem` (already available in the loop) — no `for`,
   `needsSoul`, `stage`, or `executorId` args needed for this path.

3. `fanoutBatchExecutorCli` (`cli.mjs:652-792`) currently reimplements the
   selector/mechanism logic inline at `cli.mjs:687-694`:
   ```js
   const executorId = executorIdForWork(workItem);
   const hasExplicitExecutor = resolveExecutorAndOverrides(cfg, executorId).configured;
   let mechanism;
   if (!hasExplicitExecutor) {
     mechanism = decideDispatchMechanism({ hasNativeMechanism: true, hasLiveTaskAccess, forceCliSpawn: false });
   } else {
     mechanism = decideExecutorDispatchMechanism(cfg, executorId, { hasLiveTaskAccess });
   }
   ```
   then branches: `mechanism === 'in-process'` → `mechanismChanged` entry
   `{id, mechanism, executorId}`; `mechanism === 'unavailable'` → `unavailable`
   entry `{id, executorId}`; otherwise (implicitly `out-of-process`) falls
   through to the real pick/execute/return chain. **This inline
   reimplementation never calls `resolveExecutorConfig` / checks governance
   at all** — a governance-blocked executor (cross-provider, no
   `allowCrossProvider`, the same case `plan.mjs:196-230`/
   `dispatch.test.mjs:5386` proves `compileDispatchPlan` refuses) is
   currently treated as plain `out-of-process` and the batch loop proceeds
   straight into `pick`/`executeExecutorCli`/`return` for it — i.e. today's
   code does NOT satisfy this item's acceptance criterion #2
   ("Governance-blocked candidate không bị báo dispatchable"); that gate
   exists in `compileDispatchPlan` already but the fanout path never reaches
   it. This is exactly the gap the item exists to close, not a design
   question — swapping the inline block for a `compileDispatchPlan(cfg, {
   work: candidateId, workItem, hasLiveTaskAccess })` call, then reading
   `plan.mechanism`/`plan.executorId` instead of the two local vars, closes
   it directly.

4. `test/runner/dispatch.test.mjs`'s existing `fanoutBatchExecutorCli` tests
   (4791-4990) assert: `slotsFull`/`deferred` shape when the worker-slot
   ceiling is full (4791); `mechanismChanged[0] === {id: 'c1', ...}` when
   ceiling trims candidates and `hasLiveTaskAccess: true` makes mechanism
   resolve `in-process` (4806-4818 — no `executors` config at all in this
   fixture, so `executorIdForWork` still resolves an id but
   `resolveExecutorAndOverrides(...).configured` is `false`, taking the
   "no explicit executor" branch); a real end-to-end out-of-process fire
   with `fired[0] === {id, status: 0, errorClass: null}` and independently
   re-reading `view.work.cand1.status === 'awaiting-approval'` (4860-4895);
   and a concurrency/overlap test (4897-4990, separately flagged flaky under
   full-suite load by tsk-5o1, unrelated to this change). **No existing test
   covers a governance-blocked candidate inside `fanoutBatchExecutorCli`** —
   `compileDispatchPlan`'s own governance-blocked coverage lives in its own
   direct unit tests (`dispatch.test.mjs:5386-5410`), not through the fanout
   path. Adding that coverage (a candidate whose resolved executor config
   throws in `resolveExecutorConfig`, landing in `unavailable` with
   `blockedReason` instead of proceeding to pick/execute) is new test
   surface this item's acceptance criterion #2 requires, not something
   already asserted that risks breaking.

5. One real behavior-shape question surfaced, not a blocker: `compileDispatchPlan`'s
   tail (`plan.mjs:152-163`) can upgrade `mechanism` from `out-of-process` to
   `in-process` with an `mcpTool` field when the resolved executor declares an
   mcp invocation whose `tools` map has an entry keyed by `purpose` (or,
   absent an explicit `purpose`, by `executor.for[0]` when `executor.for`
   has exactly one entry). The current inline fanout logic has no equivalent
   mcp-handback branch at all — it always proceeds straight to
   `execFileSync(... 'pick' ...)`/`executeExecutorCli` for anything not
   already caught by the two early returns. Routing through
   `compileDispatchPlan` therefore adds mcp-handback coverage to the fanout
   path for free (fixing a second latent gap, not introducing a regression —
   an mcp-only executor with no `via:"cli"` invocation would previously have
   been misrouted into the cli pick/execute chain and failed there). This is
   implementation-shape detail for planning (does the batch loop need to
   *act* on an `in-process`/`mcpTool` result the same way `mechanismChanged`
   already does, or is folding it into the existing `mechanismChanged`
   bucket sufficient — the entry shape `{id, mechanism, executorId}` already
   generalizes to `mechanism: 'in-process'` regardless of whether the cause
   was "no explicit executor" or "mcp-handback"), not a discovery-stage
   ambiguity — no new evidence needed to resolve it, only a shaping choice.

**Verdict:** `compileDispatchPlan` is a real, already-proven canonical
planner (used today by the `decide` verb, unit-tested directly at
`dispatch.test.mjs:5297-5431` for exactly the selector/governance/invocation
shapes this item needs), the exact reimplemented block in
`fanoutBatchExecutorCli` is identified and bounded (`cli.mjs:687-701`), and
the item's own three acceptance criteria map onto concrete, checkable
outcomes: (1) delete the inline `executorIdForWork` +
`decideDispatchMechanism`/`decideExecutorDispatchMechanism` block, replace
with one `compileDispatchPlan` call; (2) a governance-blocked candidate now
naturally lands in `unavailable` via `plan.mechanism === 'unavailable'` +
`blockedReason`, which the current code cannot produce at all; (3) the three
non-blocked mechanism outcomes (`in-process`/`out-of-process`/`unavailable`
from a genuinely unconfigured executor) map onto the exact same
`fired`/`mechanismChanged`/`unavailable`/`deferred` buckets and entry shapes
already asserted by the existing passing tests. No unresolved question
remains that blocks planning.
