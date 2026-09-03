# Review: ADR-007 Decision vs. `enrich-and-validate-contract.mjs`

Scope: ADR-007 Decision section (4 points) vs. `domains/coding/harness/enrich-and-validate-contract.mjs`, full file read.

## Verdict: all four hold. No mismatch found.

### (a) Pure — no fs/network/store writes
Confirmed by literal read. Imports are `node:path`, `RunnerConfigError`
(`src/runner/dispatch/config.mjs`), `operationsForStage`
(`src/state/workflow-stage-graphs.mjs`). No `fs`, no `http`/network call, no
store-write call (no `src/state/store.mjs` import, no `editWork`/mutation
call) anywhere in the file. The function only reads `contract.*`/`work.*`
fields, builds new arrays via spread/push, and returns a frozen object —
never mutates its inputs.

One nuance worth naming: `operationsForStage` lives in
`workflow-stage-graphs.mjs`, which itself does `readFileSync`/`readdirSync`
via `loadDomainsFromDisk()` — but that call fires once at module-load time
(`const loadedDomains = loadDomainsFromDisk();`, line 367 of that file), not
on every invocation. By the time `enrichAndValidateContract` calls
`operationsForStage`, it's reading an already-built, frozen in-memory
`DOMAINS` table — confirmed by reading `operationsForStage`/`bundleForStage`/
`resolveWorkflow` (lines 662–686, 635–647, 576–580): pure object lookups, no
`fs`/`require` calls of their own. This is a one-time process-startup
side effect of a dependency, not something `enrichAndValidateContract`
triggers per call — does not contradict the ADR's purity guarantee for the
function itself. The file's own header comment (lines 1–8) already
documents and justifies this distinction.

### (b) Never selects executor/provider/tier, never touches Work lifecycle
Confirmed. The function never calls `compileDispatchPlan` or any dispatch/
executor-selection code, and never calls any Work-mutation function (no
`store.mjs`/`work.mjs` write import). The only "policy" output is
`mergeHarnessPolicy(matchedOp.policy, undefined)` — a straight merge/freeze
of the *matched operation's own declared* `policy` object (from the
domain's static YAML/registry config) with no caller override today (the
inline wire contract carries no `policy` field per ADR-006 §4). This is
exactly the ADR's "policy hints written into the ... `policy` field", kept a
separate top-level output field, not folded into `contract` — matching the
ADR's carve-out that policy hints are allowed while executor/tier
*selection* (`compileDispatchPlan`'s job) is not. The code comment (line 8)
states explicitly: "this module never sets an executor id."

### (c) Fail-closed reject when `contract.supports` is not legal for the Work's current stage
Confirmed. Lines 113–121: resolves `stageOps = operationsForStage(domain,
work.stage, { kind: resolvedWorkflow })`, finds `matchedOp =
stageOps.find(o => o.id === contract.supports)`, and calls `fail(...)`
(which throws `RunnerConfigError`) when no match is found — hard reject, not
a silent fallback or best-effort continue. Matches ADR §3's "the harness
rejects otherwise."

### (d) Only appends to (never replaces) contextRefs/constraints/expectedOutputs
Confirmed for all three fields:
- `contextRefs` (lines 127–132): copies caller's existing array, pushes
  `work.docsRef`/`plan.md`/`CONTEXT.md` entries only if not already present.
- `constraints` (lines 137–140): copies caller's existing array, pushes the
  read-only scope constraint only if not already present.
- `expectedOutputs` (lines 146–149): copies caller's existing array, pushes
  the `agent-report.md` instruction only if `evidence.required === 'reported'`
  and not already present.

No assignment ever overwrites these fields wholesale; every write path is
copy-then-conditionally-push, de-duplicated by exact string match.

## Unresolved questions
None.
