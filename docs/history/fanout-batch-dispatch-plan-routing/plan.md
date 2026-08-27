# Plan: Route fanout-batch dispatch decisions through compileDispatchPlan (tsk-4jo)

Mode: small

Flag count: 1 (existing covered behavior — `fanoutBatchExecutorCli` has
real, passing tests today, and its output shape is consumed by
`fgos-fanout`'s own wave-dispatch loop, so the change must not regress
that consumer). No hard-gate flag applies (no auth, no data model, no
external-provider change, no removed validation) — this is a same-file
internal refactor swapping one inline mechanism-resolution block for a
call to an already-proven canonical helper. 0-1 flags would normally read
`tiny`; `small` chosen over `tiny` because acceptance criterion 2
(governance-blocked candidate) is a genuinely new behavior this code path
does not exercise today and needs its own new test, not just a code
change — that is more than a "couple of files, one direct task" would
imply.

## Approach

**Chosen path.** Replace `fanoutBatchExecutorCli`'s inline mechanism block
(`src/runner/dispatch/cli.mjs:687-701`) with a single call to the existing
`compileDispatchPlan(cfg, { work: candidateId, workItem, hasLiveTaskAccess
})` (already imported into this file at `cli.mjs:29`, already the exact
call the `decide` verb makes at `cli.mjs:626` per RESEARCH.md round 1
finding 2), then read `plan.mechanism` / `plan.executorId` in place of the
two local variables the deleted block used to compute. No new imports
needed (`compileDispatchPlan` is already imported; `executorIdForWork`,
`resolveExecutorAndOverrides`, `decideDispatchMechanism`,
`decideExecutorDispatchMechanism` become dead imports in this function
once the block is deleted — remove any of those four whose only remaining
use in the file was this block; leave any still used elsewhere in
`cli.mjs`).

Concretely:

```js
const plan = compileDispatchPlan(cfg, { work: candidateId, workItem, hasLiveTaskAccess });
const { mechanism, executorId } = plan;

if (mechanism === 'in-process') {
  return { kind: 'mechanismChanged', entry: { id: candidateId, mechanism, executorId } };
}
if (mechanism === 'unavailable') {
  return { kind: 'unavailable', entry: { id: candidateId, executorId } };
}
// mechanism === 'out-of-process': unchanged fall-through to pick/execute/return below
```

This preserves the exact three-way branch and the exact entry shapes
(`{id, mechanism, executorId}` / `{id, executorId}`) the existing tests at
`dispatch.test.mjs:4806-4818` (`mechanismChanged`) and the fall-through
path at `:4860-4990` (`fired`) already assert — RESEARCH.md round 1 finding
4 confirmed no existing assertion reads a field this swap removes or
renames.

**Governance-blocked candidate → `unavailable`.** `compileDispatchPlan`'s
`work` branch already calls `resolveExecutorConfig` (the same gate
`execute` itself uses) whenever `mechanism === 'out-of-process'`, and
returns `mechanism: 'unavailable', blockedReason: <message>` when that
throws (`plan.mjs:196-230`, proven directly at
`dispatch.test.mjs:5386-5410`). Reading `plan.mechanism` instead of the
locally-computed value means a governance-blocked candidate now falls into
the same `if (mechanism === 'unavailable')` branch above — landing in
`unavailable`, never reaching the pick/execute/return chain. This
satisfies acceptance criterion 2 directly, as a consequence of the swap
itself, not a separate code path to add.

**`blockedReason` on the entry — deliberately not added.** The existing
`unavailable` entry shape is `{id, executorId}` (no `reason` field at
all — RESEARCH.md round 1 finding 4). `fgos-fanout`'s own consumption
(`.agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md:64`)
already treats every `unavailable` entry uniformly ("candidates with no
registered executor... needing a person"), with no code reading a
per-entry reason field today. Adding `blockedReason` to the entry would be
free extra diagnostic value, but Step 5 below (verify/action sync) and the
acceptance criteria only require correct *categorization*, not a richer
entry shape — since no consumer reads it and no acceptance criterion asks
for it, this plan does not add it, to keep the change to exactly what
closes the gap (YAGNI). If a later item wants that visibility, it is a
separate, additive change to the entry shape, not blocked by this one.

**mcp-handback branch — folds into the existing `mechanismChanged`
bucket, not new handling.** RESEARCH.md round 1 finding 5 flagged that
`compileDispatchPlan` can upgrade `mechanism` from `out-of-process` to
`in-process` (with an `mcpTool` field) for an mcp-only executor whose
invocation declares a `tools` map. Decision: no special-case needed — the
`if (mechanism === 'in-process')` branch above already fires for this case
exactly the same as the pre-existing "no explicit executor" in-process
case, producing `{id, mechanism: 'in-process', executorId}`. The `mcpTool`
field on `plan` is simply not read by this entry (same as `agentType` is
never read here either) — `mechanismChanged` already means "hand this id
to a native Agent dispatch instead of the cli chain"
(`wave-dispatch-mechanics.md:63`), which is the correct downstream
treatment for an mcp-handback case too. This is a strict improvement (an
mcp-only executor that used to fall through to the cli
pick/execute/return chain and fail there now correctly reports
`mechanismChanged`), not a regression risk — no existing test exercises an
mcp-only executor through `fanoutBatchExecutorCli`, so nothing currently
passing depends on the old (broken) behavior.

**Alternatives rejected.**
- *Keep the inline block, add a separate governance check after it.*
  Rejected — this is exactly the "fanout-batch không tự reimplement
  selector/mechanism/governance logic" acceptance criterion says not to
  do; it would leave two divergent implementations of the same resolution
  path to keep in sync by hand.
- *Call `decideExecutorCli` (the `decide` verb's own exported function)
  instead of `compileDispatchPlan` directly.* Rejected —
  `decideExecutorCli` re-shapes the plan into a narrower CLI response
  shape (`{mechanism, configured}` / `{mechanism, agentType, configured}`
  / `{mechanism, mcpTool, configured}`) and drops `executorId` unless
  resolved indirectly with a special-cased re-add
  (`resolvedIndirectly && plan.executorId`) — `fanoutBatchExecutorCli`
  needs `executorId` unconditionally for the pick/execute/return chain, so
  calling `compileDispatchPlan` directly (the same thing
  `decideExecutorCli` itself does) avoids fighting that reshaping.

**Risk map.**

| Component | Risk | Proof point |
|---|---|---|
| Three-way mechanism branch (`in-process`/`out-of-process`/`unavailable`) preserves existing entry shapes | Low — direct 1:1 read substitution, existing tests already assert the exact shapes | Existing `dispatch.test.mjs:4806-4818` / `:4860-4990` / `:4791-4805` must still pass unmodified (`fgos-coding-validating`'s reality check: run the suite before touching test file) |
| Governance-blocked candidate now correctly lands in `unavailable` | Medium — new behavior, no existing test covers it in the fanout path (RESEARCH.md round 1 finding 4) | New test: a candidate resolving to a cross-provider executor with no `allowCrossProvider` (mirroring `dispatch.test.mjs:5386-5410`'s own fixture shape) must land in `result.unavailable`, not `result.fired` |
| mcp-handback candidate now correctly lands in `mechanismChanged` instead of falling through to a broken cli attempt | Low — strict improvement over current (broken) behavior, no existing test depends on the old path | Not separately proven (out of this item's acceptance criteria — acceptance criterion 3 only requires in-process/out-of-process/unavailable behavior stay unchanged, and this is a distinct new `in-process` sub-case, not one of those three that must stay identical); left as a documented consequence in this plan.md, not a new required test |
| Dead imports left behind in `cli.mjs` after deleting the inline block | Low — mechanical, caught by lint/typecheck if configured, or a plain `rg` re-check of the four names' remaining uses in the file | `rg -n "executorIdForWork\|resolveExecutorAndOverrides\|decideDispatchMechanism\|decideExecutorDispatchMechanism" src/runner/dispatch/cli.mjs` after the edit — remove only names with zero remaining references in the file |

Impact-analysis posture: **degraded**. `fgos tool query --capability
impact-analysis --status present` reports GitNexus registered and
`present` for this repo (`/home/vantt/projects/forgentX`), but
`list_repos` reports that index is 2140 commits behind HEAD — too stale to
trust for blast-radius here. Cross-checked directly instead
(`rg -rn "fanoutBatchExecutorCli|fanout-batch"` across `src/`, `bin/`,
`.agents/`, `plugins/fgOS/`): the only real caller outside
`cli.mjs`/its own test file is `fgos-fanout`'s `wave-dispatch-mechanics.md`
Step 3, which shells out to `node src/runner/dispatch.mjs fanout-batch
...` and reads exactly the four top-level result keys already covered
above — no other consumer exists. This grep-based cross-check is the
evidence backing the "no other caller" claim in the risk map, not the
stale graph index.

**Files touched, in order:**
1. `src/runner/dispatch/cli.mjs` — delete the inline block
   (`:687-701`), replace with the `compileDispatchPlan` call; drop any of
   the four now-unused imports.
2. `test/runner/dispatch.test.mjs` — add one new test for the
   governance-blocked-candidate case (mirroring the fixture shape at
   `:5386-5410`, adapted to go through `fanoutBatchExecutorCli` instead of
   `compileDispatchPlan` directly); existing fanout tests
   (`:4791-4990`) need no edits, only to keep passing.

`fgos graph --json`'s `criticalPath`/`topUnblock` were read per this
skill's own Approach step; tsk-4jo has no deps/children and does not
appear on the critical path (`topUnblock: []`), so they carry no ordering
constraint here — the two-file order above is dictated by the change
itself (code before its own new test), not by the graph.

## Shape

Single pass-through piece, no split. The whole change is: one function
body edit in one file, plus one new test in the file that already covers
this function. Concrete cases this proves against (per acceptance
criteria):

- **Existing in-process case** (no explicit executor configured) — must
  still land in `mechanismChanged` with the same entry shape. Covered by
  existing `dispatch.test.mjs:4806-4818`.
- **Existing out-of-process fire, single and concurrent** — must still
  reach `fired` with the same entry shape and real
  pick/execute/return side effects. Covered by existing
  `dispatch.test.mjs:4860-4990`.
- **New: governance-blocked candidate** — must land in `unavailable`,
  never reach pick/execute/return. New test required (this plan's own
  Step 4/Risk map).
- **Boundary: worker-slot ceiling trimming (`slotsFull`/`deferred`)** —
  untouched by this change (happens before the per-candidate loop);
  covered by existing `dispatch.test.mjs:4791-4805`, no new proof needed.

## Outstanding questions

None
