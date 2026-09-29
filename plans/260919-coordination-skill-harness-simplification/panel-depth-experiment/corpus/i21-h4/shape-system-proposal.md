# shape-system-proposal (real, asgn_i27_driver_op_007)

## Dispatched objective (verbatim)

Propose ONE architecture for closing the H4 exposure class durably: harden `deriveOperationCapability` itself so that ANY capability with no `.prefer` NEVER falls through to an unconfined executor, structurally, regardless of which future capability is added (e.g., require every capability declaration to mark itself `confinementSensitive: true/false`, and refuse the reverse-mapping fallback whenever that flag is true or absent). Read /home/vantt/projects/forgentX/src/verbs/coordination/binding.mjs first (absolute path). Write your structured result as JSON with exactly this shape: {"status": one of "done"|"blocked"|"failed"|"no-evidence" (lowercase, no other values), "summary": a non-empty string}.

## Real agent-result.json

```json
{
  "contract": {
    "id": "agent-result-claim",
    "version": 2
  },
  "status": "done",
  "summary": "Proposal: do NOT add a new confinementSensitive flag or move the guard into deriveOperationCapability. deriveOperationCapability only names a capability; the H4 reverse-map fallback lives in resolveExecutorAndOverrides branch 3 and is ALREADY refused for every capability, unconditionally, at binding.mjs:268 (only bindingSource 'capability.prefer' binds), which is stricter than a per-capability flag. The config already marks confinement sensitivity via capabilities.<name>.confinement.mode='required' (review/advise/code:review/code:debug), so a second flag would duplicate it. The real residual is different: a bare-string prefer binds preferExecutor with no preferInvocation (binding.mjs:311), and resolveExecutorConfig then picks the FIRST cli invocation (resolve.mjs:391-393), which for xai/claude is unconfined. Architecture: make bindOperations' acceptance predicate confinement-aware, keyed on the existing confinement.mode field. For required capabilities, filter prefer candidates to explicit invocations with non-empty effective confinement before diversity picking, always emit preferInvocation, and otherwise return unbound. Add a doctor config check and 4 fixture tests. First reversible step: predicate plus tests in binding.mjs only. Load-bearing ASSUMPTION (unverified; grep denied): binding is the only portable-capability-name to executor resolution point. If dispatch re-resolves the capability name downstream (F1), the guard must move into resolve.mjs as a caller opt-in. Falsification criteria F1-F4 are in the report.",
  "evidenceRefs": [
    "src/verbs/coordination/binding.mjs:89-109",
    "src/verbs/coordination/binding.mjs:268",
    "src/verbs/coordination/binding.mjs:310-311",
    "src/runner/dispatch/resolve.mjs:256-306",
    "src/runner/dispatch/resolve.mjs:391-393",
    "src/runner/dispatch/resolve.mjs:507-516",
    ".fgos/config.json runner.capabilities.review|advise|code:review|code:debug .confinement",
    ".fgos/config.json runner.executors.xai.for + invocations order",
    ".fgos/assignments/asgn_i27_driver_op_007/runs/01/agent-report.md"
  ]
}
```

## Real agent-report.md (verbatim)

# System Proposal — closing H4 durably (system-shaper, asgn_i27_driver_op_007)

## Evidence base (what I actually read)
No scout report was granted to this assignment (Granted Context: none). My evidence is limited to three files I read directly in this worktree:
- `src/verbs/coordination/binding.mjs` (334 lines), E1–E4 below
- `src/runner/dispatch/resolve.mjs` (`resolveExecutorAndOverrides`, `resolveExecutorConfig`, `selectConfinedInvocationId`), E5–E6
- `.fgos/config.json` (`runner.capabilities`, `runner.executors`, `placementPolicy`), E7–E9

Bash/grep was denied in this session, so I could not do any caller sweep. Every claim about other call sites below is marked **ASSUMPTION**.

### Counted findings
- **E1**: `deriveOperationCapability` (binding.mjs:89-109) only produces a *name*. It never resolves an executor. The generic fallback always returns `'review'` (line 108).
- **E2**: the fall-through H4 describes happens in `resolveExecutorAndOverrides` branch 3 (resolve.mjs:301-303, `bindingSource: 'capability.for'`), not in `deriveOperationCapability`.
- **E3**: `bindOperations` already refuses branch 1 (`executor-id`) and branch 3 (`capability.for`) for **every** capability, with no flag involved (binding.mjs:268). Only `bindingSource === 'capability.prefer'` binds. The generic part of the requested design, "no `.prefer` → never reverse-map, whatever capability gets added later", is therefore already in place, and it is stricter than a per-capability flag.
- **E4**: when the chosen candidate is a bare-string `prefer`, `cliPolicy` gets `preferExecutor` with **no** `preferInvocation` (binding.mjs:310-311).
- **E5**: with no invocation id, `resolveExecutorConfig` takes the **first** `via:"cli"` invocation (resolve.mjs:391-393). For `xai` that is `pi-cli-vantt`, which is unconfined. For `claude` it is `claude-cli`, which has acceptEdits and write access.
- **E6**: `selectConfinedInvocationId` (resolve.mjs:507-516) already exists as a structural "is this invocation confined" check.
- **E7**: the config already carries a confinement-sensitivity marker, `capabilities.<name>.confinement: {mode:"required", policy:"host-write-denied"}`. It is set on 4 capabilities: `review`, `advise`, `code:review`, `code:debug`.
- **E8**: `review` has `confinement.mode: required` and **no** `prefer`. `xai.for` includes `"review"`. That is exactly the H4 configuration, and E3 closes it today.
- **E9**: the 3 required-confinement capabilities that do have a `prefer` all name a confined invocation explicitly: `claude-cli-bwrap` and `codex-cli-bwrap` ×2. Nothing in the code enforces that pairing. It holds only because the config happens to be written that way.

## The proposal (one architecture)
**Don't add a new `confinementSensitive` flag, and don't move the guard into `deriveOperationCapability`. Make the binding step's single acceptance predicate confinement-aware, keyed off the existing `capabilities.<name>.confinement.mode` field.**

1. Keep the unconditional source allow-list at binding.mjs:268 exactly as it is. Only `capability.prefer` binds, for every capability (E3).
2. Add one pure predicate in binding.mjs, applied when `runnerConfig.capabilities[name]?.confinement?.mode === 'required'`:
   - Filter the `prefer` candidate pool down to candidates with an **explicit** `invocation` whose effective confinement is non-empty. Use the same rule as `selectConfinedInvocationId`: `inv.confinement ?? executor.confinement`.
   - Filter before `pickDiverseCandidate`, so the diversity logic only ever chooses among confined candidates.
   - If nothing survives, return `bindingSource: 'unbound'` with a named explanation ("capability requires confinement; no prefer candidate names a confined invocation"). Don't throw. That matches the existing "unbound → minTier/readOnlyRedirects safety net" contract.
   - Always emit `preferInvocation` for a confinement-required binding, so E5's "first cli invocation" default is never reached.
3. Register a `fgos doctor` check (config-level, not runtime): flag any capability with `confinement.mode: required` whose `prefer` candidates contain no confined invocation. A misconfiguration then shows up before any dispatch, not only as an unbound actor.
4. Tests (pure, fixture configs):
   - `review` with no `prefer` plus an `xai.for:["review"]` executor must stay unbound. This is a regression test for the existing guard.
   - `review` with `confinement.mode: required` and `prefer: "xai"` (bare string) must be unbound. This is the new residual.
   - `review` with `prefer: [{executor:"xai", invocation:"pi-cli-bwrap-vantt"}]` must bind, with `preferInvocation` set.
   - A capability with no `confinement` block and a bare `prefer` must bind unchanged. `execute` and `code:implement` behaviour must not move.

### Why this instead of the requested `confinementSensitive: true/false` flag
- For the reverse-mapping fallback, the flag adds no coverage. That fallback is already refused for all capabilities (E3).
- It would be a second marker duplicating `confinement.mode` (E7). Two fields meaning "this must be confined" can drift apart. That is the kind of scattered state the RUL11 rule warns against.
- "Refuse whenever the flag is absent" would require migrating every capability entry, 13 in this repo and an unknown number in other projects running fgOS, to gain nothing on branch 3.
- The residual exposure that actually remains is E4+E5: an explicitly declared `prefer` that silently lands on an unconfined invocation. The flag design does not touch that path, because it keys on whether `.prefer` exists, not on which invocation `.prefer` selects.

## Load-bearing constraint
**ASSUMPTION (not verified; grep was denied):** `bindOperations` is the only place a portable operation's capability name becomes a concrete executor or invocation. Actors left unbound reach dispatch with an empty `cliPolicy` and are routed by the default executor plus `readOnlyRedirects` (claude → codex-cli-bwrap). Nothing downstream calls `resolveExecutorAndOverrides(cfg, <capabilityName>)` again.

binding.mjs:18 says "a real dispatch re-resolves at execution time". If that re-resolution passes the capability name rather than the bound executor id, branch 3 is reachable again outside binding. In that case the guard has to live in `resolveExecutorAndOverrides` itself, as a caller opt-in (`{acceptSources:['capability.prefer'], requireConfinedWhenCapabilityRequires:true}`), and the whole proposal moves one layer down.

## What this makes harder
- An operator who wants a confinement-required capability on a bare-string `prefer` now gets an unbound actor plus a doctor warning. They must name a confined invocation. That costs one extra config field per such capability.
- The diversity pool gets smaller for required-confinement capabilities. `distinctProviderFrom: required` will throw `binding.diversity-unsatisfiable` more often. Today only 2 providers (claude, openai) back those capabilities in `prefer`.
- The binding output gains one more reason to be "unbound", so replay and explanations need to tell it apart. The new explanation string does that.
- "Effective confinement is non-empty" remains a structural proxy. It does not replace Confinement Authority's semantic check.

## First reversible step
Add the predicate, plus the always-emit-`preferInvocation` rule, to `bindOperations` only, together with the 4 fixture tests. That is one pure file and one test file, with no config schema change and no change to resolve.mjs. Rollback is a single commit revert. The doctor check follows as step 2, and only after F1 below is checked.

## Evidence vs assumption, claim by claim
| Claim | Basis |
|---|---|
| H4 reverse-map is already refused for all capabilities at the binding site | EVIDENCE: binding.mjs:268 |
| The fall-through lives in resolve branch 3, not in derive | EVIDENCE: resolve.mjs:301-303, binding.mjs:89-109 |
| A confinement marker already exists in the config | EVIDENCE: config.json `capabilities.{review,advise,code:review,code:debug}.confinement` |
| A bare `prefer` lands on the first cli invocation, possibly unconfined | EVIDENCE: binding.mjs:311 + resolve.mjs:391-393 + xai/claude invocation order |
| No current config actually triggers the E4+E5 residual | EVIDENCE for this repo's config only; ASSUMPTION for other projects |
| Binding is the only portable-name → executor resolution point | ASSUMPTION (grep denied) |
| Nothing downstream already rejects an unconfined invocation for a required-confinement capability | ASSUMPTION (confinement/authority.mjs not read) |
| Migration cost of the requested flag reaches other projects | ASSUMPTION (fgOS is installed globally per AGENTS.md; I have not seen their configs) |

## Falsification criteria (stated before critique)
- **F1:** A grep of `session-engine.mjs`, `assignment-runner.mjs` and `run.mjs` finds a dispatch-time call that passes an operation's capability name (not the bound `preferExecutor`) to `resolveExecutorAndOverrides` or `resolveExecutorConfig`. Then binding-level hardening is insufficient, and I would move the guard into resolve.mjs as a caller opt-in.
- **F2:** `confinement/authority.mjs`, or the assignment-runner pre-spawn gate, already refuses to spawn an invocation with empty effective confinement whenever `capabilities.<name>.confinement.mode === 'required'`. Then step 2 of the proposal is redundant defence and should shrink to explanation plus doctor check only.
- **F3:** A unit test with `review.confinement.mode=required` and `review.prefer="xai"` shows `bindOperations` already returning unbound, or dispatch already choosing `pi-cli-bwrap-vantt`. Then the E4+E5 residual is not real and the proposal shrinks to regression tests only.
- **F4:** A real fgOS-consuming project's config has a `confinement.mode: required` capability whose `prefer` deliberately names an unconfined invocation. Then the predicate would regress that project, and it needs a per-capability explicit override rather than a silent unbind.

## Unresolved questions
- What exactly does binding.mjs:18's "a real dispatch re-resolves at execution time" do? F1 depends on it.
- Does Confinement Authority read `capabilities.<name>.confinement` at all today? F2 depends on it.
